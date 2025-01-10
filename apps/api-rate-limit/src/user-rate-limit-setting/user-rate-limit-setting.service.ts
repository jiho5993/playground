import { Injectable } from '@nestjs/common';
import { UserRateLimitSettingRepository } from './user-rate-limit-setting.repository';
import { UserRateLimitSetting } from '@playground/entity';
import { RedisService } from '@playground/redis';
import { config } from '../../app/config/config.service';

@Injectable()
export class UserRateLimitSettingService {
  constructor(
    private readonly userRateLimitSettingRepository: UserRateLimitSettingRepository,
    private readonly redisService: RedisService,
  ) {}

  async getRateLimitSettings(userId: string): Promise<UserRateLimitSetting[]> {
    return this.userRateLimitSettingRepository.getRateLimitSettings({ userId });
  }

  async getRateLimitSettingsByRedis(userId: string): Promise<UserRateLimitSetting[]> {
    const key = UserRateLimitSetting.createSettingKey(userId);

    const redisSettings = await this.redisService.client.get(key);
    if (redisSettings) {
      return JSON.parse(redisSettings) as UserRateLimitSetting[];
    }

    const dbSettings = await this.getRateLimitSettings(userId);
    await this.redisService.client.set(key, JSON.stringify(dbSettings), 'PX', config.rateLimitRedisExpireSeconds);

    return dbSettings;
  }
}
