import { Module } from '@nestjs/common';
import { UserRateLimitSettingService } from './user-rate-limit-setting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRateLimitSetting } from '@mynest/entity';
import { UserRateLimitSettingRepository } from './user-rate-limit-setting.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserRateLimitSetting])],
  providers: [UserRateLimitSettingService, UserRateLimitSettingRepository],
  exports: [TypeOrmModule, UserRateLimitSettingService],
})
export class UserRateLimitSettingModule {}
