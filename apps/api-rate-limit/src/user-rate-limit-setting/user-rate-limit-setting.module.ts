import { Module } from '@nestjs/common';
import { UserRateLimitSettingService } from './user-rate-limit-setting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRateLimitSetting } from '@mynest/entity';
import { UserRateLimitSettingRepository } from './user-rate-limit-setting.repository';
import { RedisModule } from '@mynest/redis';
import { config } from '../../app/config/config.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserRateLimitSetting]), RedisModule.register({ host: config.redisHost, port: config.redisPort })],
  providers: [UserRateLimitSettingService, UserRateLimitSettingRepository],
  exports: [TypeOrmModule, UserRateLimitSettingService],
})
export class UserRateLimitSettingModule {}
