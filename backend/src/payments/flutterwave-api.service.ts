import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { retryWithBackoff, isNetworkLevelFailure } from '../utils/retry-with-backoff.util';

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

interface FlutterwaveEnvelope<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

export interface FlutterwaveTransaction {
  id: number;
  tx_ref: string;
  status: string; // 'successful' | 'failed' | 'pending'
  amount: number;
  charged_amount?: number;
  currency: string;
  customer?: { email?: string; name?: string };
  meta?: Record<string, unknown> | null;
  created_at?: string;
}

/**
 * Flutterwave v3 over REST (November 3, 2026). The flutterwave-node-v3 SDK
 * has no Standard-checkout call at all, and its verify/refund calls need a
 * public key as well; every non-naira payment failed until this. Same
 * retry rules as PaystackApiService: reads retry freely, calls that move
 * money retry only when the request certainly never reached Flutterwave.
 */
@Injectable()
export class FlutterwaveApiService {
  private readonly client: AxiosInstance | null;

  constructor(config: ConfigService) {
    const secretKey = config.get<string>('FLUTTERWAVE_SECRET_KEY');
    this.client = secretKey
      ? axios.create({
          baseURL: FLUTTERWAVE_BASE_URL,
          timeout: 20000,
          headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        })
      : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  private api(): AxiosInstance {
    if (!this.client) throw new Error('Flutterwave is not configured');
    return this.client;
  }

  /** Standard checkout: returns the hosted payment page to send the payer to. */
  async createPaymentLink(params: {
    tx_ref: string;
    amount: number; // main currency unit, e.g. 1500.50 NGN
    currency: string;
    redirect_url: string;
    customer: { email: string; name?: string };
    meta?: Record<string, unknown>;
  }): Promise<FlutterwaveEnvelope<{ link: string }>> {
    const { data } = await retryWithBackoff(
      () =>
        this.api().post<FlutterwaveEnvelope<{ link: string }>>('/payments', {
          ...params,
          customizations: { title: 'Ìlú Àṣẹ' },
        }),
      { isRetryable: isNetworkLevelFailure }
    );
    return data;
  }

  /** The authoritative record of a payment, by Flutterwave's transaction id. */
  async verifyById(id: number | string): Promise<FlutterwaveEnvelope<FlutterwaveTransaction>> {
    const { data } = await retryWithBackoff(() =>
      this.api().get<FlutterwaveEnvelope<FlutterwaveTransaction>>(`/transactions/${encodeURIComponent(String(id))}/verify`)
    );
    return data;
  }

  /** The same record, looked up by our own reference. */
  async verifyByReference(txRef: string): Promise<FlutterwaveEnvelope<FlutterwaveTransaction>> {
    const { data } = await retryWithBackoff(() =>
      this.api().get<FlutterwaveEnvelope<FlutterwaveTransaction>>('/transactions/verify_by_reference', {
        params: { tx_ref: txRef },
      })
    );
    return data;
  }

  async refund(id: number | string, amount?: number): Promise<FlutterwaveEnvelope<{ id: number; amount_refunded?: number }>> {
    const { data } = await retryWithBackoff(
      () =>
        this.api().post<FlutterwaveEnvelope<{ id: number; amount_refunded?: number }>>(
          `/transactions/${encodeURIComponent(String(id))}/refund`,
          amount != null ? { amount } : {}
        ),
      { isRetryable: isNetworkLevelFailure }
    );
    return data;
  }
}
