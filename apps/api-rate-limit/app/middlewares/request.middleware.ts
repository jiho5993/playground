import { Injectable, NestMiddleware } from '@nestjs/common';
import { IRequestContext, RequestContext } from '@playground/common';
import { Response } from 'express';

@Injectable()
export class RequestMiddleware implements NestMiddleware {
  use(req: IRequestContext, res: Response, next: (error?: any) => void): any {
    req.context = new RequestContext();
    next();
  }
}
