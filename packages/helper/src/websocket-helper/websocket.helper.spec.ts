import WebSocket from 'ws';
import { WebsocketClient } from './websocket.helper';
import { ClientConfig, RpcInputData } from './websocket.interface';
import { DEFAULT_RECONNECT_ATTEMPTS, DEFAULT_MAX_PAYLOAD, DEFAULT_RECONNECT_DELAY, DEFAULT_TIMEOUT } from './websocket.constant';
import { validate as uuidValidate } from 'uuid';

describe('WebSocketHelper', () => {
  const WEBSOCKET_SERVER_URL = 'ws://localhost:8080/';
  const wss = new WebSocket.Server({ port: 8080 });

  beforeAll(() => {
    /** 메시지를 그대로 반환하는 테스트용 웹소켓 서버 생성 */
    wss.on('connection', (websocket) => {
      websocket.on('message', (message: any) => {
        const data = JSON.parse(message);
        websocket.send(JSON.stringify(data));
      });
    });
  });

  afterAll(() => {
    wss.close();
  });

  describe('Websocket created constructor', () => {
    describe('clientConfig 설정', () => {
      it('config가 없어도 인스턴스 생성이 된다', () => {
        const result = new WebsocketClient(WEBSOCKET_SERVER_URL);

        expect(result).toBeInstanceOf(WebsocketClient);
        expect(result.isConnected()).not.toBeTruthy();

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.url).toEqual(WEBSOCKET_SERVER_URL);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.clientConfig.maxPayload).toEqual(DEFAULT_MAX_PAYLOAD);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.clientConfig.timeout).toEqual(DEFAULT_TIMEOUT);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.reconnectConfig.reconnect).not.toBeTruthy();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.reconnectConfig.delay).toEqual(DEFAULT_RECONNECT_DELAY);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.reconnectConfig.attempts).toEqual(DEFAULT_RECONNECT_ATTEMPTS);
      });

      it('config 정보를 기입하면 해당 정보가 반영된다', async () => {
        const config: ClientConfig = {
          maxPayload: 100 * 1024,
          timeout: 10 * 1000, // 10s
          autoPong: false,
          perMessageDeflate: false,
          protocolVersion: 8,
          handshakeTimeout: 30000,
        };
        const result = new WebsocketClient(WEBSOCKET_SERVER_URL, config);
        await result.createConnection();

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.client._receiver._maxPayload).toEqual(config.maxPayload);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.clientConfig.timeout).toEqual(config.timeout);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.client._autoPong).toEqual(config.autoPong);
      });
    });

    describe('client 생성', () => {
      it('connection이 이뤄지지 않았기 때문에 client 정보가 없다.', () => {
        const result = new WebsocketClient(WEBSOCKET_SERVER_URL);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.client).toBeNull();
        expect(result.isConnected()).not.toBeTruthy();
      });

      it('connection이 발생하면 receiver 정보가 반영되고, 기본으로 설정된 config가 반영된다.', async () => {
        const result = new WebsocketClient(WEBSOCKET_SERVER_URL);
        await result.createConnection();

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.client.readyState).toEqual(WebSocket.OPEN);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.client.readyState).toEqual(WebSocket.OPEN);
        expect(result.isConnected()).toBeTruthy();

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.client._receiver).not.toBeNull();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.client._eventsCount).not.toEqual(0);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.client._receiver._maxPayload).toEqual(DEFAULT_MAX_PAYLOAD);
      });

      it('createWithConnection 함수를 통해서 서버와 연결된 웹소켓 인스턴스를 생성할 수 있다.', async () => {
        const result = await WebsocketClient.createWithConnection(WEBSOCKET_SERVER_URL);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.client.readyState).toEqual(WebSocket.OPEN);
        expect(result.isConnected()).toBeTruthy();
      });
    });

    describe('메시지 요청 및 응답', () => {
      describe('기본 기능 검증 (메시지 송수신)', () => {
        it('메시지 요청에 성공하면 requestId가 uuid v4로 할당되고, json-rpc 2.0 spec을 만족하는 요청과 같은 응답 메시지를 받는다', async () => {
          const client = new WebsocketClient(WEBSOCKET_SERVER_URL);
          await client.createConnection();

          const payload: RpcInputData = { method: 'Hello, World!', params: [] };

          const result = await client.sendReceiveRpcCall({ ...payload });

          expect(result.id).toBeDefined();
          expect(result).toHaveProperty('jsonrpc', '2.0');
          expect(result).toHaveProperty('method', 'Hello, World!');
          expect(result).toHaveProperty('params', []);
        });

        it('1000번의 요청 모두 올바른 uuid를 생성한다.', async () => {
          const client = new WebsocketClient(WEBSOCKET_SERVER_URL);
          await client.createConnection();

          for (let i = 1; i <= 1000; i++) {
            const payload: RpcInputData = { method: 'Hello, World!', params: [] };

            const result = await client.sendReceiveRpcCall({ ...payload });

            expect(result.id).toBeDefined();
            expect(uuidValidate(result.id)).toBeTruthy();
          }
        });

        it('여러 메시지를 일괄 요청하고 응답을 받을 수 있다.', async () => {
          const client = new WebsocketClient(WEBSOCKET_SERVER_URL);
          await client.createConnection();

          const payloads: RpcInputData = [
            { method: '1st message', params: [] },
            { method: '2nd message', params: [] },
            { method: '3rd message', params: [] },
          ];
          const result = await client.sendReceiveRpcCall(payloads);

          expect(result).toBeInstanceOf(Array);
          expect(result).toHaveLength(3);

          for (const response of result) {
            expect(response.id).toBeDefined();
            expect(response).toHaveProperty('jsonrpc', '2.0');
          }
        });
      });

      describe('메시지 송수신 Timeout 검증', () => {
        const TIMEOUT_TEST_PORT = 8081;
        const TIMEOUT_SERVER_URL = `ws://localhost:${TIMEOUT_TEST_PORT}`;
        let timeoutWss: WebSocket.Server | null = null;

        /**
         * Timeout 전용 서버 생성
         */
        beforeEach(async () => {
          await new Promise<void>((resolve) => {
            timeoutWss = new WebSocket.Server({ port: TIMEOUT_TEST_PORT }, resolve);
          });

          timeoutWss.on('connection', (ws) => {
            ws.on('message', () => {
              // 의도적으로 응답하지 않는다.
            });
          });
        });

        /**
         * Timeout 전용 서버 종료
         */
        afterEach(async () => {
          if (timeoutWss) {
            for (const ws of timeoutWss.clients) {
              ws.terminate();
            }

            await new Promise<void>((resolve, reject) => {
              timeoutWss.close((err) => {
                if (err) reject(err);
                resolve();
              });
            });
          }
        });

        it('설정된 시간이 지나도 응답이 없을 경우, Timeout 에러를 발생시민다.', async () => {
          const config: ClientConfig = {
            timeout: 100, // 100ms
          };
          const client = await WebsocketClient.createWithConnection(TIMEOUT_SERVER_URL, config);

          const payload: RpcInputData = { method: 'this should timeout', params: [] };

          await expect(client.sendReceiveRpcCall(payload)).rejects.toThrow(`Request timed out after 100 ms`);
        });

        it('Timeout 발생 시 promiseAwaitingResponse Map에서 해당 요청이 제거된다.', async () => {
          const config: ClientConfig = {
            timeout: 100, // 100ms
          };
          const client = await WebsocketClient.createWithConnection(TIMEOUT_SERVER_URL, config);

          const payload: RpcInputData = { method: 'this should timeout', params: [] };

          await expect(client.sendReceiveRpcCall(payload)).rejects.toThrow();
          expect(client.isEmptyAwaitingResponse()).toBeTruthy();
        });
      });
    });
  });

  describe('Websocket created static createWithConnection function', () => {
    it('connection이 올바르게 형성된다', async () => {
      const result = await WebsocketClient.createWithConnection(WEBSOCKET_SERVER_URL);

      expect(result).toBeInstanceOf(WebsocketClient);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(result.client.readyState).toEqual(WebSocket.OPEN);
      expect(result.isConnected()).toBeTruthy();

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(result.client).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(result.client.url).toEqual(WEBSOCKET_SERVER_URL);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(result.client._receiver).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(result.client._eventsCount).not.toEqual(0);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(result.client._receiver._maxPayload).toEqual(DEFAULT_MAX_PAYLOAD);
    });

    it('config 정보를 기입하면 해당 정보가 반영된다', async () => {
      const config: ClientConfig = {
        maxPayload: 100 * 1024,
        autoPong: false,
      };
      const result = await WebsocketClient.createWithConnection(WEBSOCKET_SERVER_URL, config);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(result.client.readyState).toEqual(WebSocket.OPEN);
      expect(result.isConnected()).toBeTruthy();

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(result.client._receiver._maxPayload).toEqual(config.maxPayload);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(result.client._autoPong).toEqual(config.autoPong);
    });
  });

  describe('Websocket reconnect', () => {
    describe('reconnectConfig 설정', () => {
      it('reconnectConfig를 설정하지 않으면, 기본값으로 설정된다', () => {
        const result = new WebsocketClient(WEBSOCKET_SERVER_URL);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.reconnectConfig.reconnect).not.toBeTruthy();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.reconnectConfig.delay).toEqual(DEFAULT_RECONNECT_DELAY);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.reconnectConfig.attempts).toEqual(DEFAULT_RECONNECT_ATTEMPTS);
      });

      it('reconnectConfig를 설정하면, 해당 값으로 설정된다', () => {
        const reconnectConfig = {
          reconnect: true,
          delay: 10000,
          attempts: 50,
        };
        const clientConfig = { reconnectConfig };
        const result = new WebsocketClient(WEBSOCKET_SERVER_URL, clientConfig);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.reconnectConfig.reconnect).toBeTruthy();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.reconnectConfig.delay).toEqual(reconnectConfig.delay);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(result.reconnectConfig.attempts).toEqual(reconnectConfig.attempts);
      });
    });
  });
});
