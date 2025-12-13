/**
 * `promiseAwaitingResponse` Value
 */
export interface AwaitingResponseKey {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeoutId: NodeJS.Timeout;
}
