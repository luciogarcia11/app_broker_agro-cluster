export type EspRole = "Leader" | "Sensor" | "Actuator" | "Relay";

export interface EspNode {
  id: string;
  mac: string;
  role: EspRole;
  online: boolean;
  rssi: number;
  lastSeen: number;
  battery?: number;
}
