import { Injectable } from '@nestjs/common';
import { UserRateLimitSettingRepository } from './user-rate-limit-setting.repository';
import { UserRateLimitSetting } from '@mynest/entity';

@Injectable()
export class UserRateLimitSettingService {
  constructor(private readonly userRateLimitSettingRepository: UserRateLimitSettingRepository) {}

  async getRateLimitSettings(userId: string): Promise<UserRateLimitSetting[]> {
    return this.userRateLimitSettingRepository.getRateLimitSettings({ userId });
  }
}
