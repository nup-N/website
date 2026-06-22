import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: any = null;
  private disabled = false;

  constructor(configService: ConfigService) {
    if (process.env.DISABLE_REDIS === 'true') {
      this.disabled = true;
      this.logger.warn('Redis disabled by DISABLE_REDIS env var');
      return;
    }
    try {
      const Redis = require('ioredis');
      this.client = new Redis({
        host: configService.get('REDIS_HOST', 'localhost'),
        port: Number(configService.get('REDIS_PORT', 6379)),
        password: configService.get('REDIS_PASSWORD') || undefined,
        retryStrategy: (times: number) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 3,
      });
      this.client.on('connect', () => this.logger.log('Connected to Redis'));
      this.client.on('error', (err: any) => {
        this.logger.error('Redis error: ' + err.message);
        this.disabled = true;
      });
    } catch (err: any) {
      this.logger.warn('Redis unavailable, blacklist disabled: ' + err.message);
      this.disabled = true;
    }
  }

  async addToBlacklist(tokenSignature: string, ttlSeconds: number): Promise<void> {
    if (this.disabled || !this.client) return;
    try { await this.client.set(`bl:${tokenSignature}`, '1', 'EX', ttlSeconds); } catch { }
  }

  async isBlacklisted(tokenSignature: string): Promise<boolean> {
    if (this.disabled || !this.client) return false;
    try {
      const exists = await this.client.exists(`bl:${tokenSignature}`);
      return exists === 1;
    } catch { return false; }
  }

  onModuleDestroy() {
    if (this.client) try { this.client.disconnect(); } catch { }
  }
}