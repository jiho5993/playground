import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ClientRequestException, ERROR_CODE } from '../error';
import { Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = 500;
    const result = {
      code: 'ERR_0000001',
      message: ERROR_CODE.ERR_0000001,
    };

    if (exception instanceof ClientRequestException) {
      statusCode = exception.getStatus();

      result.code = ClientRequestException.getErrorCodeByMessage(exception.message);
      result.message = exception.message as ERROR_CODE;
    }

    response.status(statusCode).json(result);
  }
}
