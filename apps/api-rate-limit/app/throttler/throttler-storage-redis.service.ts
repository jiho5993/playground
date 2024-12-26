import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from '@mynest/redis';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { ThrottlerStorage } from '@nestjs/throttler/dist/throttler-storage.interface';

/**
 * https://github.com/kkoomen/nestjs-throttler-storage-redis/blob/fbb10478996ebee8cebf2f6f4a6a154070374238/src/throttler-storage-redis.service.ts
 */
@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage, OnModuleDestroy {
  disconnectRequired?: boolean;

  constructor(private readonly redisService: RedisService) {}

  /**
   * ICNR 명령어를 사용하여 Key에 해당하는 값을 1 증가시키거나, Key값이 없으면 1로 초기화합니다. (totalHits)
   * PTTL 명령어를 사용하여 Key의 만료시간(ms)을 조회합니다. (timeToExpire)
   *
   * timeToExpire의 값이 0보다 작으면(만료되었거나, key가 없는 경우) key의 만료시간을 ttl만큼 설정합니다.
   */
  getScriptSrc(): string {
    return `
      local totalHits = redis.call("INCR", KEYS[1])
      local timeToExpire = redis.call("PTTL", KEYS[1])
      if timeToExpire <= 0
        then
          redis.call("PEXPIRE", KEYS[1], tonumber(ARGV[1]))
          timeToExpire = tonumber(ARGV[1])
        end
      return { totalHits, timeToExpire }
    `
      .replace(/^\s+/gm, '')
      .trim();
  }

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    const results: number[] = (await this.redisService.client.call('EVAL', this.getScriptSrc(), 1, key, ttl)) as number[];

    if (!Array.isArray(results)) {
      throw new TypeError(`Expected result to be array of values, got ${results}`);
    }

    if (results.length !== 2) {
      throw new Error(`Expected 2 values, got ${results.length}`);
    }

    const [totalHits, timeToExpire] = results;

    if (typeof totalHits !== 'number') {
      throw new TypeError('Expected totalHits to be a number');
    }

    if (typeof timeToExpire !== 'number') {
      throw new TypeError('Expected timeToExpire to be a number');
    }

    return { totalHits, timeToExpire };
  }

  onModuleDestroy() {
    if (this.disconnectRequired) {
      this.redisService.client?.disconnect(false);
    }
  }
}
