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

export interface JsonRpc2Request<TParams = any> {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params: TParams;
}

export type JsonRpc2BatchRequest = JsonRpc2Request[];
