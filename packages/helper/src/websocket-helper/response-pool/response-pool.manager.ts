import { DEFAULT_TIMEOUT } from '../websocket.constant';
import { RpcRequestId } from '../websocket.interface';
import { AwaitingResponseKey } from './response-pool.interface';

export class ResponsePoolManager {
  private readonly promiseAwaitingResponsePool = new Map<RpcRequestId, AwaitingResponseKey>();

  /**
   * Response Pool에 응답을 대기할 요청을 생성합니다.
   *
   * 해당 요청에 timeout을 설정합니다. 기본 timeout은 30초입니다.
   *
   * 같은 id로 요청을 시도할 경우 에러가 발생합니다.
   */
  create<TResponse = any>(requestId: RpcRequestId, timeout: number = DEFAULT_TIMEOUT): Promise<TResponse> {
    if (this.hasAwaitingResponse(requestId)) {
      throw new Error(`Request with id "${requestId}" is already pending`);
    }

    const promise = new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.delete(requestId);
        reject(new Error(`Request timed out after ${timeout} ms`));
      }, timeout);

      this.promiseAwaitingResponsePool.set(requestId, { resolve, reject, timeoutId });
    });

    return promise;
  }

  /**
   * 요청을 resolve하고 결과를 넘깁니다.
   *
   * 만약, `requestId`가 없다면 에러를 발생시킵니다.
   */
  resolve(requestId: RpcRequestId, data: any): void {
    const awaitingResponse = this.get(requestId);
    if (awaitingResponse) {
      clearTimeout(awaitingResponse.timeoutId);
      awaitingResponse.resolve(data);
      this.delete(requestId);

      return;
    }

    throw new Error(`Cannot resolve promise with id: ${requestId}. Because the key was not found.`);
  }

  /**
   * 응답을 대기하는 요청(Pending Promise)을 reject합니다.
   *
   * 만약, `requestId`가 없다면 에러를 발생시킵니다.
   */
  reject(requestId: RpcRequestId, error: Error): void {
    const awaitingResponse = this.get(requestId);
    if (awaitingResponse) {
      clearTimeout(awaitingResponse.timeoutId);
      awaitingResponse.reject(error);
      this.delete(requestId);

      return;
    }

    throw new Error(`Cannot reject promise with id: ${requestId}. Because the key was not found.`);
  }

  /**
   * 응답을 대기하는 요청(Pending Promise)들을 reject하고
   * `promiseAwaitingResponsePool Map`을 모두 비웁니다.
   */
  rejectAll(reason: string): void {
    const error = new Error(reason);

    for (const awaitingResponse of this.promiseAwaitingResponsePool.values()) {
      clearTimeout(awaitingResponse.timeoutId);
      awaitingResponse.reject(error);
    }

    this.promiseAwaitingResponsePool.clear();
  }

  /**
   * 응답을 대기하는 요청이 있는지 확인합니다.
   */
  hasAwaitingResponse(requestId: RpcRequestId): boolean {
    return this.promiseAwaitingResponsePool.has(requestId);
  }

  /**
   * 현재 응답 대기중인 요청이 있는지 확인합니다.
   */
  isEmpty(): boolean {
    return this.promiseAwaitingResponsePool.size === 0;
  }

  private get(requestId: RpcRequestId): AwaitingResponseKey | undefined {
    return this.promiseAwaitingResponsePool.get(requestId);
  }

  private delete(requestId: RpcRequestId): void {
    this.promiseAwaitingResponsePool.delete(requestId);
  }
}
