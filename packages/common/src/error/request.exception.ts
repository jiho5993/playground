import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODE } from './code/error-code';

export class ClientRequestException extends HttpException {
  readonly value: Record<string, any>;

  constructor(response: string | Record<string, any>, statusCode: HttpStatus, value?: any) {
    super(response, statusCode);
    this.value = value;
  }

  static getErrorCodeByMessage(message: string): string {
    const errorCodes = Object.keys(ERROR_CODE);
    const result = errorCodes.find((code) => ERROR_CODE[code] === message);
    if (result) {
      return result;
    }
    throw new ClientRequestException(ERROR_CODE.ERR_0000001, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
