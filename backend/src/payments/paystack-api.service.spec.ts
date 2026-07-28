import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PaystackApiService } from './paystack-api.service';
import { SecretsService } from '../secrets/secrets.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaystackApiService (P1-02: timeout + retry/backoff)', () => {
  let service: PaystackApiService;
  const mockClient = { post: jest.fn(), get: jest.fn() };

  const mockSecretsService = {
    getSecret: jest.fn().mockResolvedValue('sk_test_123'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockClient as any);
    mockSecretsService.getSecret.mockResolvedValue('sk_test_123');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaystackApiService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: SecretsService, useValue: mockSecretsService },
      ],
    }).compile();

    service = module.get<PaystackApiService>(PaystackApiService);
    // P1-02: onModuleInit() is what actually calls initializeClient() now —
    // it previously wasn't invoked from anywhere, so this line matters: it's
    // exercising the exact fix, not incidental test setup.
    await service.onModuleInit();
  });

  it('initializes the client (and reports configured) via onModuleInit — the actual P1-02 bug fix', () => {
    expect(service.isConfigured()).toBe(true);
    expect(mockedAxios.create).toHaveBeenCalledWith(expect.objectContaining({ timeout: 20000 }));
  });

  it('leaves the client unconfigured (and warns) if the secret store returns nothing', async () => {
    const unconfiguredModule: TestingModule = await Test.createTestingModule({
      providers: [
        PaystackApiService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: SecretsService, useValue: { getSecret: jest.fn().mockResolvedValue('') } },
      ],
    }).compile();
    const unconfiguredService = unconfiguredModule.get<PaystackApiService>(PaystackApiService);

    await unconfiguredService.onModuleInit();

    expect(unconfiguredService.isConfigured()).toBe(false);
  });

  describe('verifyTransaction (read-only — full retry policy)', () => {
    it('retries on a timeout and succeeds on the 2nd attempt', async () => {
      mockClient.get
        .mockRejectedValueOnce({ code: 'ECONNABORTED' })
        .mockResolvedValueOnce({ data: { status: true, data: {} } });

      const result = await service.verifyTransaction('ref-1');

      expect(result.status).toBe(true);
      expect(mockClient.get).toHaveBeenCalledTimes(2);
    });

    it('retries on a 5xx', async () => {
      mockClient.get
        .mockRejectedValueOnce({ response: { status: 502 } })
        .mockResolvedValueOnce({ data: { status: true, data: {} } });

      await service.verifyTransaction('ref-1');

      expect(mockClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('initializeTransaction (mutating — network-failure-only retry)', () => {
    const params = {
      amount: 5000,
      email: 'a@example.com',
      currency: 'NGN',
      callback_url: 'https://iluase.com/callback',
    };

    it('retries on a confirmed network-level failure (request never reached Paystack)', async () => {
      mockClient.post
        .mockRejectedValueOnce({ code: 'ECONNREFUSED' })
        .mockResolvedValueOnce({ data: { status: true, data: {} } });

      const result = await service.initializeTransaction(params);

      expect(result.status).toBe(true);
      expect(mockClient.post).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on a timeout — the request may have already reached Paystack', async () => {
      mockClient.post.mockRejectedValue({ code: 'ECONNABORTED' });

      await expect(service.initializeTransaction(params)).rejects.toEqual({
        code: 'ECONNABORTED',
      });
      expect(mockClient.post).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on a 5xx — same double-processing risk as a timeout', async () => {
      mockClient.post.mockRejectedValue({ response: { status: 500 } });

      await expect(service.initializeTransaction(params)).rejects.toEqual({
        response: { status: 500 },
      });
      expect(mockClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('createRefund (mutating — network-failure-only retry)', () => {
    it('does NOT retry on a timeout — a duplicate refund is a real-money risk', async () => {
      mockClient.post.mockRejectedValue({ code: 'ETIMEDOUT' });

      await expect(service.createRefund({ transaction: 'ref-1', amount: 1000 })).rejects.toEqual({
        code: 'ETIMEDOUT',
      });
      expect(mockClient.post).toHaveBeenCalledTimes(1);
    });

    it('retries a confirmed network-level failure', async () => {
      mockClient.post.mockRejectedValueOnce({ code: 'ECONNRESET' }).mockResolvedValueOnce({
        data: { status: true, data: { transaction: { reference: 'ref-1', amount: 100000 } } },
      });

      const result = await service.createRefund({ transaction: 'ref-1' });

      expect(result.status).toBe(true);
      expect(mockClient.post).toHaveBeenCalledTimes(2);
    });
  });

  it('throws immediately (no retry loop) when Paystack is not configured', async () => {
    const unconfiguredModule: TestingModule = await Test.createTestingModule({
      providers: [
        PaystackApiService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: SecretsService, useValue: { getSecret: jest.fn().mockResolvedValue('') } },
      ],
    }).compile();
    const unconfiguredService = unconfiguredModule.get<PaystackApiService>(PaystackApiService);

    await expect(unconfiguredService.verifyTransaction('ref-1')).rejects.toThrow(
      'Paystack is not configured'
    );
  });

  describe('disableSubscription (HUMAN_BACKLOG.md — mutating, network-failure-only retry)', () => {
    it('sends the subscription code and email token, not the code twice', async () => {
      mockClient.post.mockResolvedValueOnce({ data: { status: true } });

      const result = await service.disableSubscription('SUB_123', 'email_token_abc');

      expect(result.status).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith('/subscription/disable', {
        code: 'SUB_123',
        token: 'email_token_abc',
      });
    });

    it('does NOT retry on a timeout', async () => {
      mockClient.post.mockRejectedValue({ code: 'ECONNABORTED' });

      await expect(service.disableSubscription('SUB_123', 'token')).rejects.toEqual({
        code: 'ECONNABORTED',
      });
      expect(mockClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('enableSubscription (V8-401 — mirror of disableSubscription)', () => {
    it('sends the subscription code and email token to /subscription/enable', async () => {
      mockClient.post.mockResolvedValueOnce({ data: { status: true } });

      const result = await service.enableSubscription('SUB_123', 'email_token_abc');

      expect(result.status).toBe(true);
      expect(mockClient.post).toHaveBeenCalledWith('/subscription/enable', {
        code: 'SUB_123',
        token: 'email_token_abc',
      });
    });

    it('does NOT retry on a timeout', async () => {
      mockClient.post.mockRejectedValue({ code: 'ECONNABORTED' });

      await expect(service.enableSubscription('SUB_123', 'token')).rejects.toEqual({
        code: 'ECONNABORTED',
      });
      expect(mockClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('listBanks (HUMAN_BACKLOG.md — read-only, full retry policy)', () => {
    it('retries on a timeout and succeeds on the 2nd attempt', async () => {
      mockClient.get
        .mockRejectedValueOnce({ code: 'ECONNABORTED' })
        .mockResolvedValueOnce({ data: { status: true, data: [{ name: 'GTBank', code: '058', currency: 'NGN', active: true }] } });

      const result = await service.listBanks();

      expect(result.data).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledTimes(2);
      expect(mockClient.get).toHaveBeenCalledWith('/bank?currency=NGN');
    });
  });

  describe('createTransferRecipient (HUMAN_BACKLOG.md — mutating, network-failure-only retry)', () => {
    it('registers a nuban recipient with the given bank details', async () => {
      mockClient.post.mockResolvedValueOnce({ data: { status: true, data: { recipient_code: 'RCP_1' } } });

      const result = await service.createTransferRecipient({
        name: 'Test Seeker',
        account_number: '0123456789',
        bank_code: '058',
      });

      expect(result.data.recipient_code).toBe('RCP_1');
      expect(mockClient.post).toHaveBeenCalledWith('/transferrecipient', {
        type: 'nuban',
        currency: 'NGN',
        name: 'Test Seeker',
        account_number: '0123456789',
        bank_code: '058',
      });
    });

    it('does NOT retry on a timeout', async () => {
      mockClient.post.mockRejectedValue({ code: 'ECONNABORTED' });

      await expect(
        service.createTransferRecipient({ name: 'a', account_number: 'b', bank_code: 'c' })
      ).rejects.toEqual({ code: 'ECONNABORTED' });
      expect(mockClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('initiateTransfer (HUMAN_BACKLOG.md — the actual money-out call, network-failure-only retry)', () => {
    it('sends amount/recipient/reason/reference to Paystack', async () => {
      mockClient.post.mockResolvedValueOnce({
        data: { status: true, data: { reference: 'withdrawal-1', transfer_code: 'TRF_1', status: 'success' } },
      });

      const result = await service.initiateTransfer({
        amount: 500000,
        recipientCode: 'RCP_1',
        reason: 'Withdrawal',
        reference: 'withdrawal-1',
      });

      expect(result.data.status).toBe('success');
      expect(mockClient.post).toHaveBeenCalledWith('/transfer', {
        source: 'balance',
        amount: 500000,
        recipient: 'RCP_1',
        reason: 'Withdrawal',
        reference: 'withdrawal-1',
      });
    });

    it('does NOT retry on a timeout or 5xx — a duplicate transfer is a real-money risk', async () => {
      mockClient.post.mockRejectedValue({ response: { status: 500 } });

      await expect(
        service.initiateTransfer({
          amount: 500000,
          recipientCode: 'RCP_1',
          reason: 'Withdrawal',
          reference: 'withdrawal-1',
        })
      ).rejects.toEqual({ response: { status: 500 } });
      expect(mockClient.post).toHaveBeenCalledTimes(1);
    });

    it('retries a confirmed network-level failure', async () => {
      mockClient.post.mockRejectedValueOnce({ code: 'ECONNRESET' }).mockResolvedValueOnce({
        data: { status: true, data: { reference: 'withdrawal-1', transfer_code: 'TRF_1', status: 'success' } },
      });

      const result = await service.initiateTransfer({
        amount: 500000,
        recipientCode: 'RCP_1',
        reason: 'Withdrawal',
        reference: 'withdrawal-1',
      });

      expect(result.status).toBe(true);
      expect(mockClient.post).toHaveBeenCalledTimes(2);
    });
  });
});
