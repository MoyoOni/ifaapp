import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

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

/**
 * Paystack API client using axios (replaces deprecated paystack SDK that depended on vulnerable `request`).
 * See: https://paystack.com/docs/api/
 */
@Injectable()
export class PaystackApiService {
  private client: AxiosInstance | null = null;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (secretKey) {
      this.client = axios.create({
        baseURL: PAYSTACK_BASE_URL,
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

  async initializeTransaction(params: {
    amount: number;
    email: string;
    currency: string;
    callback_url: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaystackInitializeResponse> {
    if (!this.client) throw new Error('Paystack is not configured');
    const { data } = await this.client.post<PaystackInitializeResponse>(
      '/transaction/initialize',
      params
    );
    return data;
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    if (!this.client) throw new Error('Paystack is not configured');
    const { data } = await this.client.get<PaystackVerifyResponse>(
      `/transaction/verify/${encodeURIComponent(reference)}`
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
    const { data } = await this.client.post<PaystackRefundResponse>('/refund', body);
    return data;
  }
}
