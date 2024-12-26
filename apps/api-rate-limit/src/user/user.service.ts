import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from '@mynest/entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserById(id: string): Promise<User | undefined> {
    return this.userRepository.getUser({ id });
  }
}
