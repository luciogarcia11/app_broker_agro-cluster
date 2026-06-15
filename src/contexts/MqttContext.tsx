import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { mqttService } from "../services/mqttService";
import { MqttConfig, MqttState } from "../types/mqtt";
import { ActuatorState, Bme280Data, LuxData, SystemStatus } from "../types/sensors";
import { EspNode, EspRole } from "../types/esp";

const ESP_STALE_MS = 15000;

interface TrackedNode {
  id: string;
  role: EspRole;
  lastSeen: number;
}

interface MqttContextValue {
  config: MqttConfig;
  mqttState: MqttState;
  bme280: Bme280Data | null;
  lux: LuxData | null;
  actuators: ActuatorState | null;
  espNodes: EspNode[];
  systemStatus: SystemStatus;
  connect: () => void;
  disconnect: () => void;
  saveConfig: (next: MqttConfig) => Promise<void>;
  resetConfig: () => Promise<void>;
  publish: (topic: string, payload: string) => void;
}

const STORAGE_KEY = "agrocluster.mqtt.config";

const defaultConfig: MqttConfig = {
  brokerUrl: "",
  websocketUrl: "",
  port: "",
  clientId: `agrocluster_${Math.random().toString(16).slice(2, 10)}`,
  username: "",
  password: "",
  useTls: true,
  autoReconnect: false,
  keepAlive: "30",
  topics: [
    "agrocluster/sensors/bme280",
    "agrocluster/sensors/lux",
    "agrocluster/status",
    "agrocluster/esp/list",
    "agrocluster/actuators",
  ],
};

const defaultSystemStatus: SystemStatus = {
  connected: false,
  activeEsps: 0,
  clusterStatus: "OFFLINE",
};

export const MqttContext = createContext<MqttContextValue | undefined>(undefined);

export function MqttProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<MqttConfig>(defaultConfig);
  const [mqttState, setMqttState] = useState<MqttState>({ status: "disconnected" });
  const [bme280, setBme280] = useState<Bme280Data | null>(null);
  const [lux, setLux] = useState<LuxData | null>(null);
  const [actuators, setActuators] = useState<ActuatorState | null>(null);
  const [espNodes, setEspNodes] = useState<EspNode[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(defaultSystemStatus);

  const trackedNodes = useRef<Record<string, TrackedNode>>({});
  const hasExplicitList = useRef(false);

  const buildEspNodesFromTracked = useCallback((): EspNode[] => {
    const now = Date.now();
    return Object.values(trackedNodes.current).map((t) => ({
      id: t.id,
      mac: t.id,
      role: t.role,
      online: now - t.lastSeen < ESP_STALE_MS,
      rssi: 0,
      lastSeen: t.lastSeen,
    }));
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored) as MqttConfig;
        setConfig({ ...defaultConfig, ...parsed });
      } catch {
        setConfig(defaultConfig);
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasExplicitList.current) {
        const nodes = buildEspNodesFromTracked();
        setEspNodes(nodes);
        setSystemStatus((s) => ({ ...s, activeEsps: nodes.filter((n) => n.online).length }));
      }
    }, ESP_STALE_MS / 2);
    return () => clearInterval(interval);
  }, [buildEspNodesFromTracked]);

  const handleStatus = useCallback((status: MqttState["status"], error?: string) => {
    setMqttState({ status, lastError: error, lastPacketAt: Date.now() });
    setSystemStatus((prev) => ({
      ...prev,
      connected: status === "connected",
      clusterStatus: status === "connected" ? "OK" : "OFFLINE",
      lastPacketAt: Date.now(),
    }));
  }, []);

  const handleMessage = useCallback(
    (topic: string, payload: string) => {
      const now = Date.now();
      setMqttState((prev) => ({ ...prev, lastPacketAt: now }));

      try {
        if (topic.includes("bme280")) {
          const data = JSON.parse(payload) as Partial<Bme280Data>;
          setBme280({
            temperature: data.temperature as number,
            humidity: data.humidity as number,
            pressure: data.pressure as number,
            espId: data.espId as string,
            updatedAt: now,
            online: true,
          });
          if (data.espId) {
            trackedNodes.current[data.espId] = {
              id: data.espId,
              role: "Sensor",
              lastSeen: now,
            };
            if (!hasExplicitList.current) {
              setEspNodes(buildEspNodesFromTracked());
            }
          }
        }

        if (topic.includes("lux")) {
          const data = JSON.parse(payload) as Partial<LuxData> & { lux?: number };
          const luxValue = data.lux;
          setLux({
            lux: luxValue as number,
            state: data.state as "DAY" | "NIGHT",
            espId: data.espId as string,
            updatedAt: now,
            online: true,
          });
          if (data.espId) {
            trackedNodes.current[data.espId] = {
              id: data.espId,
              role: "Sensor",
              lastSeen: now,
            };
            if (!hasExplicitList.current) {
              setEspNodes(buildEspNodesFromTracked());
            }
          }
        }

        if (topic.includes("actuators")) {
          const data = JSON.parse(payload) as Partial<ActuatorState>;
          setActuators({
            fan: Boolean(data.fan),
            light: Boolean(data.light),

            espId: data.espId as string,
            updatedAt: now,
          });
          if (data.espId) {
            trackedNodes.current[data.espId] = {
              id: data.espId,
              role: "Actuator",
              lastSeen: now,
            };
            if (!hasExplicitList.current) {
              setEspNodes(buildEspNodesFromTracked());
            }
          }
        }

        if (topic.includes("esp/list")) {
          const data = JSON.parse(payload) as EspNode[];
          if (Array.isArray(data)) {
            hasExplicitList.current = true;
            setEspNodes(data);
            setSystemStatus((prev) => ({
              ...prev,
              activeEsps: data.filter((node) => node.online).length,
              lastPacketAt: now,
            }));
          }
        }

        if (topic.includes("status")) {
          const data = JSON.parse(payload) as Partial<SystemStatus>;
          setSystemStatus((prev) => ({
            ...prev,
            connected: mqttState.status === "connected",
            clusterStatus: data.clusterStatus ?? prev.clusterStatus,
            lastPacketAt: now,
            activeEsps: data.activeEsps ?? prev.activeEsps,
          }));
        }
      } catch {
        // Ignore malformed payloads.
      }
    },
    [mqttState.status, buildEspNodesFromTracked],
  );

  const connect = useCallback(() => {
    trackedNodes.current = {};
    hasExplicitList.current = false;
    setEspNodes([]);
    setSystemStatus(defaultSystemStatus);
    mqttService.connect(config, handleStatus, handleMessage);
  }, [config, handleMessage, handleStatus]);

  const disconnect = useCallback(() => {
    mqttService.disconnect();
    setMqttState({ status: "disconnected", lastError: undefined });
  }, []);

  const saveConfig = useCallback(
    async (next: MqttConfig) => {
      setConfig(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      if (mqttState.status !== "disconnected") {
        mqttService.disconnect();
        setMqttState({ status: "disconnected", lastError: undefined });
      }
    },
    [mqttState.status],
  );

  const publish = useCallback((topic: string, payload: string) => {
    mqttService.publish(topic, payload);
  }, []);

  const resetConfig = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setConfig(defaultConfig);
    if (mqttState.status !== "disconnected") {
      mqttService.disconnect();
    }
    setMqttState({ status: "disconnected", lastError: undefined });
  }, [mqttState.status]);

  const value = useMemo(
    () => ({
      config,
      mqttState,
      bme280,
      lux,
      actuators,
      espNodes,
      systemStatus,
      connect,
      disconnect,
      saveConfig,
      resetConfig,
      publish,
    }),
    [
      actuators,
      bme280,
      config,
      connect,
      disconnect,
      espNodes,
      lux,
      mqttState,
      publish,
      resetConfig,
      saveConfig,
      systemStatus,
    ],
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}
