import mqtt from "mqtt";
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
  private client: mqtt.MqttClient | null = null;
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
      this.statusHandler?.("error", "URL do WebSocket MQTT não informada");
      return;
    }

    this.client = mqtt.connect(url, {
      clientId: config.clientId,
      username: config.username || undefined,
      password: config.password || undefined,
      keepalive: Number(config.keepAlive) || 30,
      reconnectPeriod: config.autoReconnect ? 5000 : 0,
      connectTimeout: 5000,
      clean: true,
    });

    this.statusHandler?.("connecting");

    this.client.on("connect", () => {
      this.statusHandler?.("connected");
      if (config.topics.length > 0) {
        this.client?.subscribe(config.topics, { qos: 0 });
      }
    });

    this.client.on("message", (topic: string, payload: Buffer) => {
      this.messageHandler?.(topic, payload.toString());
    });

    this.client.on("reconnect", () => {
      this.statusHandler?.("connecting");
    });

    let failedWithError = false;

    this.client.on("close", () => {
      if (!failedWithError) {
        this.statusHandler?.("disconnected");
      }
    });

    this.client.on("error", (error: Error) => {
      let cause = error?.message || "Erro desconhecido";
      if (!error?.message && (error as any)?.code) cause = `Código de erro: ${(error as any).code}`;

      failedWithError = true;
      this.statusHandler?.("error", cause);

      if (this.client) {
        this.client.end(true);
      }
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
