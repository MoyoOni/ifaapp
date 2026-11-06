import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FlutterwaveApiService } from './flutterwave-api.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Code-health pass (November 6, 2026). Same retry rules as Paystack: reads
// retry freely; calls that move money retry only when the request certainly
// never reached Flutterwave (a timeout might have).
describe('FlutterwaveApiService', () => {
  const client = { post: jest.fn(), get: jest.fn() };
  const make = (key?: string) =>
    new FlutterwaveApiService({ get: () => key } as unknown as ConfigService);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(client as unknown as ReturnType<typeof axios.create>);
  });

  it('is unconfigured without a secret key, and refuses to call out', async () => {
    const svc = make(undefined);
    expect(svc.isConfigured()).toBe(false);
    expect(mockedAxios.create).not.toHaveBeenCalled();
    await expect(svc.verifyById(1)).rejects.toThrow('Flutterwave is not configured');
  });

  it('authenticates with the secret key and a timeout', () => {
    expect(make('FLWSECK_TEST-abc').isConfigured()).toBe(true);
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.flutterwave.com/v3',
        timeout: 20000,
        headers: expect.objectContaining({ Authorization: 'Bearer FLWSECK_TEST-abc' }),
      })
    );
  });

  it('creates a Standard checkout link with our branding', async () => {
    client.post.mockResolvedValue({
      data: { status: 'success', data: { link: 'https://checkout.flutterwave.com/x' } },
    });
    const res = await make('k').createPaymentLink({
      tx_ref: 'r1',
      amount: 50,
      currency: 'USD',
      redirect_url: 'https://iluase.com/back',
      customer: { email: 'a@b.co' },
    });
    expect(res.data.link).toContain('checkout.flutterwave.com');
    expect(client.post).toHaveBeenCalledWith(
      '/payments',
      expect.objectContaining({ tx_ref: 'r1', customizations: { title: 'Ìlú Àṣẹ' } })
    );
  });

  it('does not retry a payment link after a timeout (it may have been created)', async () => {
    client.post.mockRejectedValue({ code: 'ECONNABORTED' });
    await expect(
      make('k').createPaymentLink({
        tx_ref: 'r',
        amount: 1,
        currency: 'USD',
        redirect_url: 'u',
        customer: { email: 'e' },
      })
    ).rejects.toMatchObject({ code: 'ECONNABORTED' });
    expect(client.post).toHaveBeenCalledTimes(1);
  });

  it('retries a refund only when the request never left', async () => {
    client.post
      .mockRejectedValueOnce({ code: 'ECONNREFUSED' })
      .mockResolvedValueOnce({ data: { status: 'success', data: { id: 9 } } });
    await expect(make('k').refund(9, 25)).resolves.toMatchObject({ status: 'success' });
    expect(client.post).toHaveBeenCalledTimes(2);
    expect(client.post).toHaveBeenLastCalledWith('/transactions/9/refund', { amount: 25 });

    client.post.mockReset().mockRejectedValue({ code: 'ETIMEDOUT' });
    await expect(make('k').refund(9)).rejects.toMatchObject({ code: 'ETIMEDOUT' });
    expect(client.post).toHaveBeenCalledTimes(1);
  });

  it('a full refund sends no amount', async () => {
    client.post.mockResolvedValue({ data: { status: 'success', data: { id: 9 } } });
    await make('k').refund(9);
    expect(client.post).toHaveBeenCalledWith('/transactions/9/refund', {});
  });

  it('verifies by id (encoded) and by reference, retrying reads', async () => {
    client.get.mockRejectedValueOnce({ code: 'ETIMEDOUT' }).mockResolvedValueOnce({
      data: { status: 'success', data: { id: 1, status: 'successful' } },
    });
    await expect(make('k').verifyById('1/../x')).resolves.toMatchObject({
      data: { status: 'successful' },
    });
    expect(client.get).toHaveBeenLastCalledWith('/transactions/1%2F..%2Fx/verify');

    client.get.mockResolvedValue({ data: { status: 'success', data: { tx_ref: 'r1' } } });
    await make('k').verifyByReference('r1');
    expect(client.get).toHaveBeenLastCalledWith('/transactions/verify_by_reference', {
      params: { tx_ref: 'r1' },
    });
  });
});
