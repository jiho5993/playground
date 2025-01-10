import { User, UserRateLimitSetting } from '@playground/entity';

export class RequestContext {
  private user: User;
  private rateLimitSettings: UserRateLimitSetting[];

  setUser(user: User): void {
    this.user = user;
  }

  getUser(): User {
    return this.user;
  }

  setRateLimitSettings(rateLimitSettings: UserRateLimitSetting[]): void {
    this.rateLimitSettings = rateLimitSettings;
  }

  getRateLimitSettings(): UserRateLimitSetting[] {
    return this.rateLimitSettings;
  }
}
