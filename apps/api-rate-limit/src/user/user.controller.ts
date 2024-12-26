import { Controller, Get } from '@nestjs/common';
import { ApiPath } from './user.constant';

@Controller(ApiPath.Root)
export class UserController {
  @Get()
  async getUser() {
    return { status: 'ok' };
  }
}
