import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WhatsAppService } from './whatsapp.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhatsAppService (P1-02: timeout + retry/backoff)', () => {
  let service: WhatsAppService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'WHATSAPP_PHONE_NUMBER_ID') return 'phone-id-123';
      if (key === 'WHATSAPP_ACCESS_TOKEN') return 'access-token-abc';
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsAppService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
  });

  it('sends the template with a 15s timeout configured', async () => {
    mockedAxios.post.mockResolvedValue({ data: {} });

    await service.notifyBabalawoNewBooking({
      phone: '08012345678',
      clientName: 'Client',
      date: '2026-08-01',
      time: '10:00',
      url: 'https://iluase.com',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ timeout: 15000 }),
    );
  });

  it('retries on a network-level failure and succeeds on the 2nd attempt', async () => {
    mockedAxios.post
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockResolvedValueOnce({ data: {} });

    await service.notifyBabalawoNewBooking({
      phone: '08012345678',
      clientName: 'Client',
      date: '2026-08-01',
      time: '10:00',
      url: 'https://iluase.com',
    });

    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 4xx (bad request) — never throws either, matching "never break main flow"', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { status: 400, data: { error: { message: 'Invalid template' } } },
    });

    await expect(
      service.notifyBabalawoNewBooking({
        phone: '08012345678',
        clientName: 'Client',
        date: '2026-08-01',
        time: '10:00',
        url: 'https://iluase.com',
      }),
    ).resolves.toBeUndefined();

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries on a persistent 5xx and still never throws', async () => {
    mockedAxios.post.mockRejectedValue({ response: { status: 503 } });

    await expect(
      service.notifyPaymentReceived({
        phone: '08012345678',
        amount: '₦5,000',
        fromName: 'Client',
        url: 'https://iluase.com',
      }),
    ).resolves.toBeUndefined();

    expect(mockedAxios.post).toHaveBeenCalledTimes(3);
  });

  it('skips sending entirely (no axios call) when WhatsApp is not configured', async () => {
    const unconfiguredModule: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();
    const unconfiguredService = unconfiguredModule.get<WhatsAppService>(WhatsAppService);

    await unconfiguredService.notifyNewMessage({
      phone: '08012345678',
      senderName: 'Someone',
      url: 'https://iluase.com',
    });

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});
