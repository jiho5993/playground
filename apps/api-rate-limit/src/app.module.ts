import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MysqlConfigServiceFactory } from '@mynest/config';
import { UserModule } from './user/user.module';
import { UserRateLimitSettingModule } from './user-rate-limit-setting/user-rate-limit-setting.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '../app/throttler/throttler.module';
import { ThrottlerBehindProxyGuard } from '../app/throttler/throttler-behind-proxy.guard';
import { TokenGuard } from '../app/guards/token.guard';
import * as Entities from '@mynest/entity';
import { RequestMiddleware } from '../app/middlewares/request.middleware';
import { AllExceptionFilter, LoggingInterceptor } from '@mynest/common';
import { config } from '../app/config/config.service';

const TypeOrmRootModule = TypeOrmModule.forRootAsync({
  useClass: MysqlConfigServiceFactory(config, Object.values(Entities)),
});

@Module({
  imports: [TypeOrmRootModule, ThrottlerModule, UserModule, UserRateLimitSettingModule],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: TokenGuard },
    { provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(RequestMiddleware).forRoutes('*');
  }
}
