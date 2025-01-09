import { RequestContext } from './request-context';
import { Request } from 'express';

export interface IRequestContext extends Request {
  context: RequestContext;
}
