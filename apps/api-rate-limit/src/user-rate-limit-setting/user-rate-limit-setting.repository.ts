import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRateLimitSetting } from '@playground/entity';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class UserRateLimitSettingRepository {
  constructor(@InjectRepository(UserRateLimitSetting) private readonly repository: Repository<UserRateLimitSetting>) {}

  async getRateLimitSettings(where: FindOptionsWhere<UserRateLimitSetting>, relations?: string[]): Promise<UserRateLimitSetting[]> {
    const options: any = { where };
    if (Array.isArray(relations)) {
      options.relations = relations;
    }
    const result = await this.repository.find(options);
    return result;
  }
}
