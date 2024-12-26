import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ClientRequestException, ERROR_CODE, IRequestContext } from '@mynest/common';
import { UserService } from '../../src/user/user.service';
import { UserRateLimitSettingService } from '../../src/user-rate-limit-setting/user-rate-limit-setting.service';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly userRateLimitSettingService: UserRateLimitSettingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<IRequestContext>();

    /** 1번 유저가 요청했다고 가정 */
    const user = await this.userService.getUserById('1');
    if (!user) {
      throw new ClientRequestException(ERROR_CODE.ERR_0010001, HttpStatus.BAD_REQUEST);
    }

    const rateLimitSettings = await this.userRateLimitSettingService.getRateLimitSettings(user.id);

    req.context.setUser(user);
    req.context.setRateLimitSettings(rateLimitSettings);

    return true;
  }
}
