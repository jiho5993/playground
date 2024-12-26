import { RequestContext } from './request-context';

export { Request } from 'express';

export interface IRequestContext extends Request {
  context: RequestContext;
}
