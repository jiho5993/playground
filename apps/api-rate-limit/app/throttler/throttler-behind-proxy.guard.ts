import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Resolvable, ThrottlerGuard } from '@nestjs/throttler';
import { THROTTLER_SKIP, THROTTLER_TTL } from '@nestjs/throttler/dist/throttler.constants';
import { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface';
import { UserRateLimitSetting, UserRateLimitSettingStatus, UserRateLimitSettingType } from '@playground/entity';
import { ClientRequestException, ERROR_CODE, IRequestContext } from '@playground/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  /**
   * https://github.com/nestjs/throttler/blob/v5.1.2/src/throttler.guard.ts#L72
   * ThrottlerGuard의 canActivate 로직을 그대로 가져오고, limit 조건만 변경하도록 합니다.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const classRef = context.getClass();

    const req = context.switchToHttp().getRequest<IRequestContext>();
    const rateLimits = req.context.getRateLimitSettings();

    if (await this.shouldSkip(context)) {
      return true;
    }
    const continues: boolean[] = [];

    for (const namedThrottler of this.throttlers) {
      const rateLimit = rateLimits.find((rateLimit) => rateLimit.type.toLowerCase() === namedThrottler.name?.toLowerCase());
      if (!rateLimit) {
        throw new ClientRequestException(ERROR_CODE.ERR_0000001, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      /**
       * skip 조건을 2가지로 설정합니다.
       * 1. SkipThrottle 데코레이터가 설정되어 있는 경우
       * 2. rateLimit이 비활성화 된 경우
       */
      const skip = this.reflector.getAllAndOverride<boolean>(THROTTLER_SKIP + namedThrottler.name, [handler, classRef]);
      const skipIf = namedThrottler.skipIf || this.commonOptions.skipIf;
      if (skip || skipIf?.(context)) {
        continues.push(true);
        continue;
      }
      if (rateLimit.status === UserRateLimitSettingStatus.Deactivated) {
        continues.push(true);
        continue;
      }

      const routeOrClassTtl = this.reflector.getAllAndOverride<Resolvable<number>>(THROTTLER_TTL + namedThrottler.name, [handler, classRef]);

      const limit = rateLimit.limit;
      const ttl = await this.superResolveValue(context, routeOrClassTtl || namedThrottler.ttl);

      continues.push(await this.handleRequest(context, limit, ttl, namedThrottler, this.getTracker, this.generateKey));
    }
    return continues.every((cont) => cont);
  }

  protected generateKey(context: ExecutionContext, suffix: string, name: string): string {
    const req = context.switchToHttp().getRequest<IRequestContext>();
    const user = req.context.getUser();

    return UserRateLimitSetting.createHitCountKey(user.id, name as UserRateLimitSettingType);
  }

  protected async throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: ThrottlerLimitDetail): Promise<void> {
    throw new ClientRequestException(ERROR_CODE.ERR_0000006, HttpStatus.TOO_MANY_REQUESTS);
  }

  /** 상위 클래스의 resolveValue라는 함수는 private이기 때문에 같은 로직을 그대로 가져와 새로 정의 */
  async superResolveValue<T extends number | string | boolean>(context: ExecutionContext, resolvableValue: Resolvable<T>): Promise<T> {
    return typeof resolvableValue === 'function' ? resolvableValue(context) : resolvableValue;
  }
}
