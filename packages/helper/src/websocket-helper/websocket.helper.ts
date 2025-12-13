import WebSocket from 'ws';
import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ClientConfig, RpcRequestId, RpcInputData, JsonRpc2Packet, ReconnectConfig, AwaitingResponseKey } from './websocket.interface';
import { DEFAULT_MAX_PAYLOAD, DEFAULT_RECONNECT_ATTEMPTS, DEFAULT_RECONNECT_DELAY, DEFAULT_TIMEOUT, WebsocketState } from './websocket.constant';

export class WebsocketClient {
  private client: WebSocket | null = null;
  private readonly url: string;
  private readonly clientConfig: ClientConfig;
  private readonly reconnectConfig: ReconnectConfig;
  private reconnectAttempts = 0;

  private promiseAwaitingResponse = new Map<RpcRequestId, AwaitingResponseKey>();

  constructor(url: string, config: ClientConfig = {}) {
    if (!WebsocketClient.isValidUrl(url)) {
      throw new Error('Url must start with `wss://`, `ws://`, `wss+unix://`, or `ws+unix://`.');
    }

    this.url = url;
    this.reconnectConfig = WebsocketClient.createReconnectConfig(config);
    this.clientConfig = WebsocketClient.createClientConfig(config);
  }

  /**
   * Websocket 클라이언트를 생성하고 연결을 시도합니다.
   */
  static async createWithConnection(url: string, config: ClientConfig = {}): Promise<WebsocketClient> {
    const websocketClient = new WebsocketClient(url, config);
    await websocketClient.createConnection();
    return websocketClient;
  }

  /**
   * 유효한 Websocket URL인지 검사합니다.
   */
  static isValidUrl(url: string): boolean {
    return url.startsWith('wss://') || url.startsWith('ws://') || url.startsWith('wss+unix://') || url.startsWith('ws+unix://');
  }

  /**
   * Websocket 클라이언트가 서버와 연결되어 있는지 확인합니다.
   */
  isConnected(): boolean {
    return this.state === WebSocket.OPEN;
  }

  /**
   * 현재 응답 대기중인 요청이 있는지 확인합니다.
   */
  isEmptyAwaitingResponse(): boolean {
    return this.promiseAwaitingResponse.size === 0;
  }

  /**
   * uuid v4로 Request ID를 생성합니다.
   */
  private createRequestId(): RpcRequestId {
    return uuidv4();
  }

  /**
   * Websocket 요청을 위한 메시지를 만듭니다.
   * payload를 String 형태로 변환합니다.
   */
  createJsonRpc2Packet(requestId: RpcRequestId, payload: RpcInputData): JsonRpc2Packet {
    if (Array.isArray(payload)) {
      return payload.map(({ method, params }) => ({
        jsonrpc: '2.0',
        id: requestId,
        method,
        params,
      }));
    }

    return {
      jsonrpc: '2.0',
      id: requestId,
      method: payload.method,
      params: payload.params,
    };
  }

  /**
   * 해당 메서드는 연결이 완료되어 `open` 이벤트가 발생하면, Promise 내부에서 필요한 이벤트들을 등록하도록 하여 연결을 완료합니다.
   *
   * 동기적으로 실행합니다.
   *
   * connection 성공 여부
   * 1. 실패시 : 연결이 실페해서 `error` 이벤트가 발생한다면, `onConnectionFailed` 메소드가 호출됩니다.
   * 2. 성공시 : `open` event가 발생하고, 이후부터 `error`, `close`, `message` 등 새로운 이벤트 함수를 등록합니다.
   */
  async createConnection(): Promise<void> {
    if (this.isConnected()) {
      return Promise.resolve();
    }

    /**
     * new WebSocket()이 실행될 경우, WebSocket 객체가 만들어지고 Connection을 비동기적으로 시도합니다.
     */
    this.client = new WebSocket(this.url, this.clientConfig);
    this.client.on('error', this.onConnectionFailed.bind(this));

    return new Promise((resolve) => {
      this.client.once('open', () => {
        /** 이벤트가 중복으로 생성되는 것을 방지 */
        this.client.removeAllListeners();

        this.client.on('error', this.onError.bind(this));
        this.client.on('close', this.onClose.bind(this));
        this.client.on('message', this.onMessage.bind(this));

        resolve();
      });
    });
  }

  /**
   * JSON-RPC 2.0 형태의 Payload 메시지를 전송합니다.
   *
   * json-rpc 2.0 spec : https://www.jsonrpc.org/specification
   */
  async sendReceiveRpcCall<TResponse = any>(payload: RpcInputData): Promise<TResponse> {
    if (!this.isConnected() || _.isNull(this.client)) {
      throw new Error('Websocket is not connected');
    }

    const requestId = this.createRequestId();
    const packet = this.createJsonRpc2Packet(requestId, payload);

    if (this.promiseAwaitingResponse.has(requestId)) {
      throw new Error(`Request with id "${requestId}" is already pending`);
    }

    const promise = new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.promiseAwaitingResponse.delete(requestId);
        reject(new Error(`Request timed out after ${this.clientConfig.timeout} ms`));
      }, this.clientConfig.timeout);

      this.promiseAwaitingResponse.set(requestId, { resolve, reject, timeoutId });
    });

    this.client.send(JSON.stringify(packet), (err) => {
      if (err) {
        const awaitingResponse = this.promiseAwaitingResponse.get(requestId);
        if (awaitingResponse) {
          clearTimeout(awaitingResponse.timeoutId);
          this.promiseAwaitingResponse.delete(requestId);
          awaitingResponse.reject(new Error(`Failed to send message: ${err}`));
        }
        throw new Error(`Failed to send message: ${err}`);
      }
    });

    return promise;
  }

  /**
   * Websocket 객체가 생성되고 연결에 실패할 때 호출됩니다.
   *
   * 만약 `reconnect` 옵션이 허용되어 있다면, 재연결을 시도합니다.
   */
  private onConnectionFailed(error: Error): void {
    this.rejectAllAwaitingPromises(`Connection failed: ${error.message}`);

    if (this.client) {
      this.client.removeAllListeners();
      this.client = null;
    }

    if (this.reconnectConfig?.reconnect && this.reconnectAttempts < this.reconnectConfig.attempts) {
      this.reconnect();
      return;
    }

    throw new Error(`Websocket connection error: ${error.message}`);
  }

  /**
   * Websocket 메시지를 전송하는 이벤트 함수입니다.
   */
  private onMessage(data: any) {
    const result = JSON.parse(data);

    let id;
    if (Array.isArray(result)) {
      id = result[0].id;
    } else {
      id = result.id;
    }

    if (_.isNil(id) || !this.promiseAwaitingResponse.has(id)) {
      throw new Error(`No existing promise: ${JSON.stringify(result)}`);
    }

    const awaitingResponse = this.promiseAwaitingResponse.get(id);
    if (awaitingResponse) {
      clearTimeout(awaitingResponse.timeoutId);
      awaitingResponse.resolve(result);
      this.promiseAwaitingResponse.delete(id);
    }
  }

  /**
   * 에러를 처리하는 이벤트 함수입니다.
   */
  private onError(error: Error): void {
    this.rejectAllAwaitingPromises(`WebSocket error: ${error.message}`);
  }

  /**
   * Websocket이 종료되었을때 실행되는 이벤트 함수입니다.
   * TODO: 리팩토링 이후 내용 추가 작성 필요
   */
  private onClose(code: number, reason: Buffer): void {
    const reasonString = reason.toString();
    this.rejectAllAwaitingPromises(`Connection closed. Code: ${code}, Reason: ${reasonString}`);

    if (this.client) {
      this.client.removeAllListeners();
      this.client = null;
    } else {
      this.onConnectionFailed(new Error('Connection closed'));
    }
  }

  /**
   * 재시도 연결을 시도합니다.
   *
   * `attempts`만큼 재연결을 시도하며, `delay`를 사용하여 재연결 텀을 설정할 수 있습니다.
   */
  private reconnect(): void {
    if (_.isUndefined(this.reconnectConfig.attempts)) {
      throw new Error('Reconnect attempts is not defined');
    }

    if (this.reconnectAttempts >= this.reconnectConfig.attempts) {
      throw new Error('Reconnect attempts exceeded');
    }

    setTimeout(async () => {
      this.reconnectAttempts += 1;
      await this.createConnection();

      if (this.isConnected()) {
        this.reconnectAttempts = 0;
      }
    }, this.reconnectConfig.delay);
  }

  /**
   * 대기중인 모든 Promise를 reject하고
   * promiseAwaitingResponse Map을 모두 비웁니다.
   */
  private rejectAllAwaitingPromises(reason: string): void {
    const error = new Error(reason);
    for (const [_, awaitingResponse] of this.promiseAwaitingResponse.entries()) {
      clearTimeout(awaitingResponse.timeoutId);
      awaitingResponse.reject(error);
    }
    this.promiseAwaitingResponse.clear();
  }

  /**
   * Websocket 연결 상태를 확인합니다.
   *
   * ```
   * 0 : Connecting
   * 1 : Open
   * 2 : Closing
   * 3 : Closed
   * ```
   */
  private get state(): WebsocketState {
    return this.client ? this.client.readyState : WebSocket.CLOSED;
  }

  /**
   * Reconnect Config를 설정합니다.
   *
   * 기본적으로 reconnect를 사용하지 않으며,
   * `delay`는 1000ms, `attempts`는 5인 기본 값으로 생성합니다.
   * ```json
   * {
   *   reconnect: false,
   *   delay: 1000,
   *   attempts: 5
   * }
   * ```
   */
  private static createReconnectConfig(config: ClientConfig): ReconnectConfig {
    const reconnectConfig: ReconnectConfig = {
      reconnect: false,
      delay: DEFAULT_RECONNECT_DELAY,
      attempts: DEFAULT_RECONNECT_ATTEMPTS,
    };

    if (!_.isUndefined(config?.reconnectConfig)) {
      if (_.isBoolean(config.reconnectConfig?.reconnect)) {
        reconnectConfig.reconnect = config.reconnectConfig.reconnect;
      }
      if (_.isNumber(config.reconnectConfig?.delay) && config.reconnectConfig?.delay > 0) {
        reconnectConfig.delay = config.reconnectConfig.delay;
      }
      if (_.isNumber(config.reconnectConfig?.attempts) && config.reconnectConfig?.attempts > 0) {
        reconnectConfig.attempts = config.reconnectConfig.attempts;
      }
    }

    return reconnectConfig;
  }

  /**
   * WebSocket Client Config를 설정합니다.
   *
   * 기본적으로 maxPayload가 100MB로 설정됩니다.
   * ```json
   * {
   *   maxPayload: 100 * 1024 * 1024
   * }
   * ```
   */
  private static createClientConfig(config: ClientConfig): ClientConfig {
    const clientConfig: ClientConfig = {
      maxPayload: _.isNumber(config.maxPayload) && config.maxPayload > 0 ? config.maxPayload : DEFAULT_MAX_PAYLOAD,
      timeout: _.isNumber(config.timeout) && config.timeout > 0 ? config.timeout : DEFAULT_TIMEOUT,
      ...config,
    };

    return clientConfig;
  }
}
