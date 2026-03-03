import { Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_MODULE_OPTIONS } from './redis.constant';

@Injectable()
export class RedisService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisInstance: Redis;

  constructor(@Inject(REDIS_MODULE_OPTIONS) private readonly options: RedisOptions) {
    this.redisInstance = new Redis(options);
  }

  onApplicationBootstrap() {
    this.redisInstance.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.redisInstance.on('error', (error) => {
      this.logger.error('Redis error', error);
    });
  }

  onModuleDestroy() {
    this.redisInstance.quit();
    this.logger.log('Redis connection closed');
  }

  get client(): Redis {
    return this.redisInstance;
  }
}
