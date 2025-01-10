import { Module } from '@nestjs/common';
import { ThrottlerModule as NestJSThrottlerModule } from '@nestjs/throttler';
import { RedisModule, RedisService } from '@playground/redis';
import { UserRateLimitSettingType } from '@playground/entity';
import { ThrottlerStorageRedisService } from './throttler-storage-redis.service';
import { config } from '../config/config.service';

@Module({
  imports: [
    NestJSThrottlerModule.forRootAsync({
      imports: [
        RedisModule.register({
          host: config.redisHost,
          port: config.redisPort,
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
