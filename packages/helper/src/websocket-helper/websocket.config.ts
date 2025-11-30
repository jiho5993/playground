import http from 'http';
import { PerMessageDeflateOptions } from 'ws';

export interface IReconnectConfig {
  reconnect?: boolean;
  delay?: number;
  attempts?: number;
}

export interface IClientConfig {
  agent?: http.Agent;
  autoPong?: boolean;
  maxPayload?: number;
  protocolVersion?: number;
  perMessageDeflate?: boolean | PerMessageDeflateOptions;
  handshakeTimeout?: number;
  reconnectConfig?: IReconnectConfig;
}
