import { CallHandler, ExecutionContext, HttpException, Injectable, InternalServerErrorException, Logger, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { ClientRequestException } from '../error';
import { getClientIp } from 'request-ip';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly prefix = 'LoggingInterceptor';
  private readonly logger: Logger = new Logger(this.prefix);

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();

    const logObj = {
      success: true,
      ip: getClientIp(req),
      method: req.method,
      url: req.url,
      startTime: new Date().toISOString(),
      endTime: null,
      elapsedTime: null,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      error: null,
      errorStack: null,
      errorCode: null,
      errorMessage: null,
    };

    return next.handle().pipe(
      tap(() => {
        logObj.success = true;

        this.calculateTimes(logObj);

        this.logger.log(JSON.stringify(logObj));
      }),
      catchError((e) => {
        logObj.success = false;

        this.calculateTimes(logObj);
        this.getErrorInfo(logObj, e);

        this.logger.error(JSON.stringify(logObj));

        return throwError(() => (e instanceof HttpException ? e : new InternalServerErrorException(e)));
      }),
    );
  }

  calculateTimes(target) {
    target.endTime = new Date().toISOString();
    target.elapsedTime = new Date(target.endTime).getTime() - new Date(target.startTime).getTime();
  }

  getErrorInfo(target, e) {
    target.error = JSON.stringify(e);
    target.errorStack = e.stack;

    if (e instanceof ClientRequestException) {
      target.errorMessage = e.message;
      target.errorCode = ClientRequestException.getErrorCodeByMessage(e.message);
    }
  }
}
