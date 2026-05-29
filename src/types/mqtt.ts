export type MqttStatus = "connected" | "connecting" | "disconnected" | "error";

export interface MqttConfig {
  brokerUrl: string;
  websocketUrl: string;
  port: string;
  clientId: string;
  username: string;
  password: string;
  useTls: boolean;
  autoReconnect: boolean;
  keepAlive: string;
  topics: string[];
}

export interface MqttState {
  status: MqttStatus;
  lastPacketAt?: number;
  lastError?: string;
}
