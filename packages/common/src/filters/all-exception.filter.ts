import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
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

      result.code = this.getErrorCode(exception.message);
      result.message = exception.message as ERROR_CODE;
    }

    return response.status(statusCode).json(result);
  }

  getErrorCode(message: string): string {
    const errorCodes = Object.keys(ERROR_CODE);
    const result = errorCodes.find((code) => ERROR_CODE[code] === message);
    if (result) {
      return result;
    }
    throw new ClientRequestException(ERROR_CODE.ERR_0000001, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
