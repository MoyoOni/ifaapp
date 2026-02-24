import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

const CHECK_TIMEOUT_MS = 3000;
const DEGRADED_LATENCY_MS = 500;

export type ServiceStatus = 'up' | 'down' | 'degraded' | 'disabled';

export interface ServiceHealth {
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
}

export interface DetailedHealthResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: Record<string, ServiceHealth>;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {}

  /**
   * Run all health checks and return detailed result.
   * Services not configured are reported as "disabled".
   */
  async getDetailed(): Promise<DetailedHealthResult> {
    const [database, paystack, flutterwave, s3, sendgrid] = await Promise.all([
      this.checkDatabase(),
      this.checkPaystack(),
      this.checkFlutterwave(),
      this.checkS3(),
      this.checkSendGrid(),
    ]);

    const services: Record<string, ServiceHealth> = {
      database,
      paystack,
      flutterwave,
      s3,
      sendgrid,
    };

    const configured = Object.entries(services).filter(([_, s]) => s.status !== 'disabled');
    const down = configured.filter(([_, s]) => s.status === 'down');
    const degraded = configured.filter(([_, s]) => s.status === 'degraded');

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (down.length > 0 || configured.find(([k]) => k === 'database')?.[1].status === 'down') {
      status = 'unhealthy';
    } else if (degraded.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      services,
    };
  }

  /**
   * Overall health: 200 when healthy or degraded, 503 when unhealthy.
   */
  async isHealthy(): Promise<boolean> {
    const detailed = await this.getDetailed();
    return detailed.status !== 'unhealthy';
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      return {
        status: latencyMs > DEGRADED_LATENCY_MS ? 'degraded' : 'up',
        latencyMs,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Database health check failed: ${err.message}`);
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        message: err.message,
      };
    }
  }

  private async checkPaystack(): Promise<ServiceHealth> {
    const key = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!key?.trim()) {
      return { status: 'disabled' };
    }
    const start = Date.now();
    try {
      const res = await this.fetchWithTimeout('https://api.paystack.co/bank?perPage=1', {
        headers: { Authorization: `Bearer ${key}` },
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        return {
          status: 'down',
          latencyMs,
          message: `HTTP ${res.status}`,
        };
      }
      return {
        status: latencyMs > DEGRADED_LATENCY_MS ? 'degraded' : 'up',
        latencyMs,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Paystack health check failed: ${err.message}`);
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        message: err.message,
      };
    }
  }

  private async checkFlutterwave(): Promise<ServiceHealth> {
    const secret = this.config.get<string>('FLUTTERWAVE_SECRET_KEY');
    if (!secret?.trim()) {
      return { status: 'disabled' };
    }
    const start = Date.now();
    try {
      const res = await this.fetchWithTimeout('https://api.flutterwave.com/v3/banks/NG', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        return {
          status: 'down',
          latencyMs,
          message: `HTTP ${res.status}`,
        };
      }
      return {
        status: latencyMs > DEGRADED_LATENCY_MS ? 'degraded' : 'up',
        latencyMs,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Flutterwave health check failed: ${err.message}`);
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        message: err.message,
      };
    }
  }

  private async checkS3(): Promise<ServiceHealth> {
    const accessKey = this.config.get<string>('AWS_ACCESS_KEY_ID');
    const secretKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');
    const bucket = this.config.get<string>('AWS_S3_BUCKET_NAME');
    if (!accessKey?.trim() || !secretKey?.trim() || !bucket?.trim()) {
      return { status: 'disabled' };
    }
    const start = Date.now();
    try {
      const region = this.config.get<string>('AWS_REGION') || 'us-east-1';
      const client = new S3Client({
        region,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('S3 check timed out')), CHECK_TIMEOUT_MS)
      );
      await Promise.race([client.send(new HeadBucketCommand({ Bucket: bucket })), timeoutPromise]);
      const latencyMs = Date.now() - start;
      return {
        status: latencyMs > DEGRADED_LATENCY_MS ? 'degraded' : 'up',
        latencyMs,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`S3 health check failed: ${err.message}`);
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        message: err.message,
      };
    }
  }

  private async checkSendGrid(): Promise<ServiceHealth> {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    if (!apiKey?.trim()) {
      return { status: 'disabled' };
    }
    const start = Date.now();
    try {
      const res = await this.fetchWithTimeout('https://api.sendgrid.com/v3/user/account', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const latencyMs = Date.now() - start;
      if (!res.ok) {
        return {
          status: 'down',
          latencyMs,
          message: `HTTP ${res.status}`,
        };
      }
      return {
        status: latencyMs > DEGRADED_LATENCY_MS ? 'degraded' : 'up',
        latencyMs,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`SendGrid health check failed: ${err.message}`);
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        message: err.message,
      };
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(id);
    }
  }
}
