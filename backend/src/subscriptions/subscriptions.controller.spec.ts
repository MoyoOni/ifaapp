import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

const WEBHOOK_SECRET = 'subscription-webhook-secret';

function signRawBody(rawBody: Buffer): string {
  return crypto.createHmac('sha512', WEBHOOK_SECRET).update(rawBody).digest('hex');
}

describe('SubscriptionsController — webhook signature verification (EMG-02)', () => {
  let controller: SubscriptionsController;
  const mockSubscriptionsService = {
    handleWebhookEvent: jest.fn().mockResolvedValue(undefined),
  };
  const originalSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    // Instantiated directly (no Nest TestingModule) — the webhook route has no
    // guards, and pulling in the full DI graph would require unrelated
    // providers (JwtAuthGuard's dependencies) that this unit test doesn't need.
    controller = new SubscriptionsController(
      mockSubscriptionsService as unknown as SubscriptionsService
    );
  });

  afterEach(() => {
    process.env.PAYSTACK_WEBHOOK_SECRET = originalSecret;
  });

  it('rejects the webhook outright when PAYSTACK_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.PAYSTACK_WEBHOOK_SECRET;
    const rawBody = Buffer.from(JSON.stringify({ event: 'subscription.create', data: {} }));

    await expect(controller.handleWebhook('any-signature', { rawBody } as any)).rejects.toThrow(
      UnauthorizedException
    );

    expect(mockSubscriptionsService.handleWebhookEvent).not.toHaveBeenCalled();
  });

  it('rejects a webhook with no signature header instead of skipping verification', async () => {
    process.env.PAYSTACK_WEBHOOK_SECRET = WEBHOOK_SECRET;
    const rawBody = Buffer.from(JSON.stringify({ event: 'subscription.create', data: {} }));

    await expect(controller.handleWebhook(undefined as any, { rawBody } as any)).rejects.toThrow(
      UnauthorizedException
    );

    expect(mockSubscriptionsService.handleWebhookEvent).not.toHaveBeenCalled();
  });

  it('rejects a webhook with a missing rawBody instead of skipping verification', async () => {
    process.env.PAYSTACK_WEBHOOK_SECRET = WEBHOOK_SECRET;

    await expect(
      controller.handleWebhook('some-signature', { rawBody: undefined } as any)
    ).rejects.toThrow(UnauthorizedException);

    expect(mockSubscriptionsService.handleWebhookEvent).not.toHaveBeenCalled();
  });

  it('rejects a webhook with an incorrect signature', async () => {
    process.env.PAYSTACK_WEBHOOK_SECRET = WEBHOOK_SECRET;
    const rawBody = Buffer.from(JSON.stringify({ event: 'subscription.create', data: {} }));

    await expect(controller.handleWebhook('forged-signature', { rawBody } as any)).rejects.toThrow(
      UnauthorizedException
    );

    expect(mockSubscriptionsService.handleWebhookEvent).not.toHaveBeenCalled();
  });

  it('processes the webhook when the signature matches the raw body', async () => {
    process.env.PAYSTACK_WEBHOOK_SECRET = WEBHOOK_SECRET;
    const payload = {
      event: 'subscription.create',
      data: { metadata: { userId: 'u1', plan: 'QUARTERLY' } },
    };
    const rawBody = Buffer.from(JSON.stringify(payload));

    const result = await controller.handleWebhook(signRawBody(rawBody), { rawBody } as any);

    expect(result).toEqual({ received: true });
    expect(mockSubscriptionsService.handleWebhookEvent).toHaveBeenCalledWith(payload);
  });
});
