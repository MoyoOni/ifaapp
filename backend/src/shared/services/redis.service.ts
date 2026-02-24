import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private client!: RedisClientType; // Using definite assignment operator

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    await this.client.connect();
  }

  getConnection() {
    return this.client;
  }

  async disconnect() {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
    }
  }

  async set(key: string, value: string, expiry?: number) {
    if (expiry) {
      return await this.client.setEx(key, expiry, value);
    }
    return await this.client.set(key, value);
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async del(key: string) {
    return await this.client.del(key);
  }

  async exists(key: string) {
    return await this.client.exists(key);
  }

  async keys(pattern: string) {
    return await this.client.keys(pattern);
  }

  async publish(channel: string, message: string) {
    return await this.client.publish(channel, message);
  }
}