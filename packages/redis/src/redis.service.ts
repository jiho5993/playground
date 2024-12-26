import { Inject, Injectable } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_MODULE_OPTIONS } from './redis.constant';

@Injectable()
export class RedisService {
  private readonly redisInstance: Redis;

  constructor(@Inject(REDIS_MODULE_OPTIONS) private readonly options: RedisOptions) {
    this.redisInstance = new Redis(options);
  }

  get client(): Redis {
    return this.redisInstance;
  }
}
