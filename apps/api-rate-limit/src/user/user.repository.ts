import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@playground/entity';
import { FindOptionsWhere, Repository } from 'typeorm';

@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private readonly repository: Repository<User>) {}

  async getUser(where: FindOptionsWhere<User>, relations?: string[]): Promise<User | undefined> {
    const options: any = { where };
    if (Array.isArray(relations) && relations.length > 0) {
      options.relations = relations;
    }
    const result = await this.repository.findOne(options);
    if (result) {
      return result;
    }
    return undefined;
  }
}
