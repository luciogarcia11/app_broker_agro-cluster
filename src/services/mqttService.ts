import type { MqttClient } from "mqtt/dist/mqtt";
import { Buffer } from "buffer";
import process from "process";

import { MqttConfig, MqttStatus } from "../types/mqtt";

if (!global.Buffer) {
  global.Buffer = Buffer;
}
if (!global.process) {
  global.process = process;
}

type StatusHandler = (status: MqttStatus, error?: string) => void;
type MessageHandler = (topic: string, payload: string) => void;

class MqttService {
  private client: MqttClient | null = null;
  private statusHandler?: StatusHandler;
  private messageHandler?: MessageHandler;

  connect(config: MqttConfig, onStatus: StatusHandler, onMessage: MessageHandler) {
    this.statusHandler = onStatus;
    this.messageHandler = onMessage;

    if (this.client) {
      this.client.end(true);
    }

    const baseUrl = config.websocketUrl || config.brokerUrl;
    const url = this.resolveWebsocketUrl(baseUrl, config);
    if (!url) {
      console.log("[MQTT] Missing WebSocket URL");
      this.statusHandler?.("error", "MQTT WebSocket URL is missing");
      return;
    }
    console.log("[MQTT] Connecting", { url, clientId: config.clientId, autoReconnect: config.autoReconnect });
    const mqttModule = require("mqtt");
    const mqttFallback = require("mqtt/dist/mqtt");
    const mqttConnect =
      mqttModule.connect ||
      mqttModule.default?.connect ||
      mqttFallback.connect ||
      mqttFallback.default?.connect;
    if (!mqttConnect) {
      console.log("[MQTT] connect() not available in mqtt module");
      this.statusHandler?.("error", "MQTT connect function not available");
      return;
    }
    this.client = mqttConnect(url, {
      clientId: config.clientId,
      username: config.username || undefined,
      password: config.password || undefined,
      keepalive: Number(config.keepAlive) || 30,
      reconnectPeriod: config.autoReconnect ? 2000 : 0,
      connectTimeout: 10000,
      clean: true,
    });

    this.statusHandler?.("connecting");

    this.client.on("connect", () => {
      console.log("[MQTT] Connected");
      this.statusHandler?.("connected");
      if (config.topics.length > 0) {
        console.log("[MQTT] Subscribing", config.topics);
        this.client?.subscribe(config.topics, { qos: 0 });
      }
    });

    this.client.on("message", (topic, payload) => {
      console.log("[MQTT] Message", topic);
      this.messageHandler?.(topic, payload.toString());
    });

    this.client.on("reconnect", () => {
      console.log("[MQTT] Reconnecting...");
      this.statusHandler?.("connecting");
    });

    this.client.on("close", () => {
      console.log("[MQTT] Connection closed");
      this.statusHandler?.("disconnected");
    });

    this.client.on("error", (error) => {
      console.log("[MQTT] Error", error?.message || error);
      this.statusHandler?.("error", error.message);
    });
  }

  private resolveWebsocketUrl(baseUrl: string, config: MqttConfig) {
    if (!baseUrl) return "";

    if (baseUrl.startsWith("ws://") || baseUrl.startsWith("wss://")) {
      return config.useTls ? baseUrl.replace("ws://", "wss://") : baseUrl;
    }

    const scheme = config.useTls ? "wss" : "ws";

    // If the user provided host:port or host/mqtt, do not append another port.
    if (baseUrl.includes("/mqtt")) {
      return `${scheme}://${baseUrl}`;
    }

    if (baseUrl.includes(":")) {
      return `${scheme}://${baseUrl}/mqtt`;
    }

    // If the user provided only the host, derive a WebSocket URL.
    const wsPort = config.useTls && config.port === "8883" ? "8884" : config.port || "8884";
    return `${scheme}://${baseUrl}:${wsPort}/mqtt`;
  }

  disconnect() {
    this.client?.end(true);
    this.client = null;
    this.statusHandler?.("disconnected");
  }

  publish(topic: string, payload: string) {
    this.client?.publish(topic, payload);
  }

  isConnected() {
    return Boolean(this.client?.connected);
  }
}

export const mqttService = new MqttService();
