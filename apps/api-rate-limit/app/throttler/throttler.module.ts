import { Module } from '@nestjs/common';
import { ThrottlerModule as NestJSThrottlerModule } from '@nestjs/throttler';
import { RedisModule, RedisService } from '@mynest/redis';
import { UserRateLimitSettingType } from '@mynest/entity';
import { ThrottlerStorageRedisService } from './throttler-storage-redis.service';

@Module({
  imports: [
    NestJSThrottlerModule.forRootAsync({
      imports: [
        RedisModule.register({
          host: 'localhost',
          port: 16379,
        }),
      ],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          {
            name: UserRateLimitSettingType.Seconds,
            ttl: 1 * 1000,
            limit: 0,
          },
          {
            name: UserRateLimitSettingType.Minutes,
            ttl: 60 * 1000,
            limit: 0,
          },
        ],
        storage: new ThrottlerStorageRedisService(redisService),
      }),
    }),
  ],
})
export class ThrottlerModule {}
