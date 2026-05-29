import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { mqttService } from "../services/mqttService";
import { MqttConfig, MqttState } from "../types/mqtt";
import { ActuatorState, Bme280Data, LuxData, SystemStatus } from "../types/sensors";
import { EspNode } from "../types/esp";

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
  publish: (topic: string, payload: string) => void;
}

const STORAGE_KEY = "agrocluster.mqtt.config";

const defaultConfig: MqttConfig = {
  brokerUrl: "6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud",
  websocketUrl: "wss://6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud:8884/mqtt",
  port: "8883",
  clientId: `agrocluster_${Math.random().toString(16).slice(2, 10)}`,
  username: "",
  password: "",
  useTls: true,
  autoReconnect: true,
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          const parsed = JSON.parse(stored) as MqttConfig;
          setConfig({ ...defaultConfig, ...parsed });
        } catch {
          setConfig(defaultConfig);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const handleStatus = useCallback((status: MqttState["status"], error?: string) => {
    setMqttState({ status, lastError: error, lastPacketAt: Date.now() });
    setSystemStatus((prev) => ({
      ...prev,
      connected: status === "connected",
      clusterStatus: status === "connected" ? "OK" : "OFFLINE",
      lastPacketAt: Date.now(),
    }));
  }, []);

  const handleMessage = useCallback((topic: string, payload: string) => {
    const now = Date.now();
    setMqttState((prev) => ({ ...prev, lastPacketAt: now }));

    try {
      if (topic.includes("bme280")) {
        const data = JSON.parse(payload) as Partial<Bme280Data>;
        setBme280({
          temperature: data.temperature ?? 24.2,
          humidity: data.humidity ?? 58,
          pressure: data.pressure ?? 1012,
          espId: data.espId ?? "ESP-01",
          updatedAt: now,
          online: true,
        });
      }

      if (topic.includes("lux")) {
        const data = JSON.parse(payload) as Partial<LuxData> & { lux?: number };
        const luxValue = data.lux ?? 120;
        setLux({
          lux: luxValue,
          state: luxValue <= 50 ? "NIGHT" : "DAY",
          espId: data.espId ?? "ESP-02",
          updatedAt: now,
          online: true,
        });
      }

      if (topic.includes("actuators")) {
        const data = JSON.parse(payload) as Partial<ActuatorState>;
        setActuators({
          fan: Boolean(data.fan),
          light: Boolean(data.light),
          irrigation: Boolean(data.irrigation),
          espId: data.espId ?? "ESP-03",
          updatedAt: now,
        });
      }

      if (topic.includes("esp/list")) {
        const data = JSON.parse(payload) as EspNode[];
        if (Array.isArray(data)) {
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
  }, [mqttState.status]);

  useEffect(() => {
    if (!isReady) return;
    if (mqttState.status !== "disconnected") return;
    if (!config.websocketUrl && !config.brokerUrl) return;
    if (!config.autoReconnect) return;
    mqttService.connect(config, handleStatus, handleMessage);
  }, [config, handleMessage, handleStatus, isReady, mqttState.status]);

  const connect = useCallback(() => {
    mqttService.connect(config, handleStatus, handleMessage);
  }, [config, handleMessage, handleStatus]);

  const disconnect = useCallback(() => {
    mqttService.disconnect();
    setMqttState({ status: "disconnected" });
  }, []);

  const saveConfig = useCallback(async (next: MqttConfig) => {
    setConfig(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const publish = useCallback((topic: string, payload: string) => {
    mqttService.publish(topic, payload);
  }, []);

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
      saveConfig,
      systemStatus,
    ]
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}
