import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsService } from '../secrets/secrets.service';
import axios, { AxiosInstance } from 'axios';
import { retryWithBackoff, isNetworkLevelFailure } from '../utils/retry-with-backoff.util';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface PaystackInitializeResponse {
  status: boolean;
  message?: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message?: string;
  data: {
    status: string;
    amount: number;
    currency: string;
    reference: string;
    metadata?: Record<string, unknown>;
    customer?: { email?: string; first_name?: string; last_name?: string };
    paid_at?: string;
  };
}

export interface PaystackRefundResponse {
  status: boolean;
  message?: string;
  data: {
    transaction: {
      reference: string;
      amount: number;
    };
  };
}

export interface PaystackDisableSubscriptionResponse {
  status: boolean;
  message?: string;
}

export interface PaystackBank {
  name: string;
  code: string;
  currency: string;
  active: boolean;
}

export interface PaystackListBanksResponse {
  status: boolean;
  message?: string;
  data: PaystackBank[];
}

export interface PaystackTransferRecipientResponse {
  status: boolean;
  message?: string;
  data: {
    recipient_code: string;
  };
}

export interface PaystackTransferResponse {
  status: boolean;
  message?: string;
  data: {
    reference: string;
    transfer_code: string;
    status: string; // 'success' | 'pending' | 'otp' | 'failed'
  };
}

/**
 * Paystack API client using axios (replaces deprecated paystack SDK that depended on vulnerable `request`).
 * See: https://paystack.com/docs/api/
 */
@Injectable()
export class PaystackApiService implements OnModuleInit {
  private readonly logger = new Logger(PaystackApiService.name);
  private client: AxiosInstance | null = null;

  constructor(
    private configService: ConfigService,
    private secretsService: SecretsService
  ) {}

  // P1-02 discovery: initializeClient() was defined but never actually
  // invoked anywhere — not from the constructor (it's async, which
  // NestJS constructors can't be), not from a lifecycle hook, nothing. That
  // meant `this.client` stayed null forever and every public method here
  // (initializeTransaction, verifyTransaction, createRefund) always threw
  // "Paystack is not configured", and isConfigured() always returned false —
  // Paystack, the primary payment gateway for this platform, could not have
  // actually processed a single real transaction as this file was written.
  async onModuleInit(): Promise<void> {
    await this.initializeClient();
    if (!this.client) {
      this.logger.warn(
        'Paystack client not initialized — iluase/prod/paystack-secret-key returned no value'
      );
    }
  }

  private async initializeClient(): Promise<void> {
    if (this.client) return;

    const secretKey = await this.secretsService.getSecret('iluase/prod/paystack-secret-key');
    if (secretKey) {
      this.client = axios.create({
        baseURL: PAYSTACK_BASE_URL,
        // P1-02: 20s timeout — payment confirmation can be slower than other
        // calls, but was previously unset entirely, letting a slow Paystack
        // response hang the request thread indefinitely.
        timeout: 20000,
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * initializeTransaction and createRefund are mutating calls to a real
   * payment gateway — retrying them on a timeout or 5xx is genuinely risky,
   * since the request may have already reached and been processed by
   * Paystack even though the response was lost (retrying could then create a
   * second transaction/refund). This client doesn't have independent
   * confirmation of a documented Paystack idempotency-key header, so rather
   * than assume one exists, mutating calls only retry on a *confirmed*
   * network-level failure (connection refused/reset, DNS failure) — cases
   * where the request is known not to have reached Paystack at all. A
   * timeout or 5xx on these calls is surfaced as-is; the existing manual
   * verification/reconciliation admin flow is the correct place to resolve
   * an ambiguous outcome, not a blind automatic retry.
   */
  private async retryIfNeverReachedServer<T>(fn: () => Promise<T>): Promise<T> {
    return retryWithBackoff(fn, { isRetryable: isNetworkLevelFailure });
  }

  async initializeTransaction(params: {
    amount: number;
    email: string;
    currency: string;
    callback_url: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaystackInitializeResponse> {
    if (!this.client) throw new Error('Paystack is not configured');
    const { data } = await this.retryIfNeverReachedServer(() =>
      this.client!.post<PaystackInitializeResponse>('/transaction/initialize', params)
    );
    return data;
  }

  /** Read-only and side-effect-free — safe to retry on network errors, timeouts, and 5xx alike. */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    if (!this.client) throw new Error('Paystack is not configured');
    const { data } = await retryWithBackoff(() =>
      this.client!.get<PaystackVerifyResponse>(
        `/transaction/verify/${encodeURIComponent(reference)}`
      )
    );
    return data;
  }

  async createRefund(payload: {
    transaction: string;
    amount?: number;
  }): Promise<PaystackRefundResponse> {
    if (!this.client) throw new Error('Paystack is not configured');
    const body: Record<string, unknown> = { transaction: payload.transaction };
    if (payload.amount != null) body.amount = payload.amount;
    const { data } = await this.retryIfNeverReachedServer(() =>
      this.client!.post<PaystackRefundResponse>('/refund', body)
    );
    return data;
  }

  /**
   * HUMAN_BACKLOG.md: admin-cancelled subscriptions previously only updated
   * the local Subscription row -- Paystack kept billing the customer on
   * schedule regardless. Paystack's `/subscription/disable` requires both
   * the subscription_code AND the email_token from the original
   * `subscription.create` webhook payload (NOT the subscription code used
   * twice, which is what the self-service cancel path was doing before this
   * fix and would have silently failed against the real API).
   */
  async disableSubscription(
    subscriptionCode: string,
    emailToken: string
  ): Promise<PaystackDisableSubscriptionResponse> {
    if (!this.client) throw new Error('Paystack is not configured');
    const { data } = await this.retryIfNeverReachedServer(() =>
      this.client!.post<PaystackDisableSubscriptionResponse>('/subscription/disable', {
        code: subscriptionCode,
        token: emailToken,
      })
    );
    return data;
  }

  /**
   * V8-401: the mirror-image counterpart to disableSubscription, for
   * turning auto-renew back on before it actually lapses. Same
   * code+token pair as disable per Paystack's API.
   */
  async enableSubscription(
    subscriptionCode: string,
    emailToken: string
  ): Promise<PaystackDisableSubscriptionResponse> {
    if (!this.client) throw new Error('Paystack is not configured');
    const { data } = await this.retryIfNeverReachedServer(() =>
      this.client!.post<PaystackDisableSubscriptionResponse>('/subscription/enable', {
        code: subscriptionCode,
        token: emailToken,
      })
    );
    return data;
  }

  /**
   * HUMAN_BACKLOG.md: the withdrawal/payout flow. Read-only reference data
   * (the list of Nigerian banks Paystack can transfer to, each with its
   * numeric bank code) -- safe to retry freely.
   */
  async listBanks(currency = 'NGN'): Promise<PaystackListBanksResponse> {
    if (!this.client) throw new Error('Paystack is not configured');
    const { data } = await retryWithBackoff(() =>
      this.client!.get<PaystackListBanksResponse>(`/bank?currency=${encodeURIComponent(currency)}`)
    );
    return data;
  }

  /**
   * Registers a payout destination with Paystack, returning a
   * `recipient_code` required by `initiateTransfer` below. A mutating call
   * to a real gateway -- same conservative retry-only-on-confirmed-network-
   * failure policy as initializeTransaction/createRefund.
   */
  async createTransferRecipient(params: {
    name: string;
    account_number: string;
    bank_code: string;
    currency?: string;
  }): Promise<PaystackTransferRecipientResponse> {
    if (!this.client) throw new Error('Paystack is not configured');
    const { data } = await this.retryIfNeverReachedServer(() =>
      this.client!.post<PaystackTransferRecipientResponse>('/transferrecipient', {
        type: 'nuban',
        currency: params.currency ?? 'NGN',
        name: params.name,
        account_number: params.account_number,
        bank_code: params.bank_code,
      })
    );
    return data;
  }

  /**
   * Sends real money out of the platform's Paystack balance to a recipient.
   * The single riskiest mutating call in this file -- retried only on a
   * confirmed network-level failure, same as createRefund/
   * initializeTransaction, for the same reason (a timeout doesn't mean the
   * transfer didn't happen). `reference` should be the WithdrawalRequest id
   * so the transfer.success/transfer.failed webhook can look the request
   * back up.
   *
   * Note: if this Paystack account has "OTP for API-initiated transfers"
   * enabled in its dashboard settings, this call returns `data.status ===
   * 'otp'` and the transfer cannot complete without a human entering that
   * OTP via Paystack's dashboard/finalize endpoint -- this platform has no
   * OTP-entry UI, so that setting must be disabled for this flow to work
   * unattended. That's a Paystack account configuration decision, not
   * something this code can resolve.
   */
  async initiateTransfer(params: {
    /** In kobo, same convention as every other amount this service sends to Paystack. */
    amount: number;
    recipientCode: string;
    reason: string;
    reference: string;
  }): Promise<PaystackTransferResponse> {
    if (!this.client) throw new Error('Paystack is not configured');
    const { data } = await this.retryIfNeverReachedServer(() =>
      this.client!.post<PaystackTransferResponse>('/transfer', {
        source: 'balance',
        amount: params.amount,
        recipient: params.recipientCode,
        reason: params.reason,
        reference: params.reference,
      })
    );
    return data;
  }
}
