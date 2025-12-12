import http from 'http';
import { PerMessageDeflateOptions } from 'ws';

export interface ReconnectConfig {
  reconnect?: boolean;
  delay?: number;
  attempts?: number;
}

export interface ClientConfig {
  agent?: http.Agent;
  autoPong?: boolean;
  maxPayload?: number;
  protocolVersion?: number;
  perMessageDeflate?: boolean | PerMessageDeflateOptions;
  handshakeTimeout?: number;
  reconnectConfig?: ReconnectConfig;
}

/**
 * 사용자가 RPC 요청을 할 때 전송할 데이터 인터페이스와 타입
 *
 * 기본적으로 Bulk 요청도 허용합니다.
 */
interface RpcCallData<TParams = any> {
  method: string;
  params: TParams;
}
export type RpcInputData<TParams = any> = RpcCallData<TParams> | RpcCallData<TParams>[];

/**
 * JSON-RPC 2.0 스펙을 따르는 인터페이스
 *
 * 기본적으로 Bulk 요청도 허용하므로, Bulk 요청이 가능한 타입을 사용합니다.
 */
interface JsonRpc2RequestBody<TParams = any> extends RpcCallData<TParams> {
  jsonrpc: '2.0';
  id: RpcRequestId;
}
export type JsonRpc2Packet<TParams = any> = JsonRpc2RequestBody<TParams> | JsonRpc2RequestBody<TParams>[];

export type RpcRequestId = string;
