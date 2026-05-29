export interface Bme280Data {
  temperature: number;
  humidity: number;
  pressure: number;
  espId: string;
  updatedAt: number;
  online: boolean;
}

export interface LuxData {
  lux: number;
  state: "DAY" | "NIGHT";
  espId: string;
  updatedAt: number;
  online: boolean;
}

export interface ActuatorState {
  fan: boolean;
  light: boolean;
  irrigation: boolean;
  espId: string;
  updatedAt: number;
}

export interface SystemStatus {
  connected: boolean;
  lastPacketAt?: number;
  activeEsps: number;
  clusterStatus: "OK" | "WARN" | "OFFLINE";
}
