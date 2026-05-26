import { useState, useEffect } from "react";
import mqtt from "mqtt";

// ==========================================
// CONFIGURAÇÕES DO BROKER
// ==========================================
const MQTT_URL = "ws://broker.hivemq.com:8000/mqtt";
const MQTT_TOPIC = "lucio/esp8266/led/status";
const MQTT_CMD_TOPIC = "lucio/esp8266/led/cmd";

// ==========================================
// CREDENCIAIS DE ACESSO
// ==========================================
const MQTT_USERNAME = "";
const MQTT_PASSWORD = "";

export function useMQTT() {
  const [client, setClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Desconectado");
  const [ledStatus, setLedStatus] = useState(null);
  const [lastMessage, setLastMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const connectMQTT = () => {
    setIsLoading(true);
    setConnectionStatus("Conectando...");
    console.log("Tentando conectar ao broker MQTT...");

    if (client) {
      client.end();
    }

    const options = {
      reconnectPeriod: 5000,
      connectTimeout: 4000,
      clientId: `expo_app_${Math.random().toString(16).slice(3)}`,
    };

    if (MQTT_USERNAME && MQTT_PASSWORD) {
      options.username = MQTT_USERNAME;
      options.password = MQTT_PASSWORD;
    }

    const newClient = mqtt.connect(MQTT_URL, options);
    setClient(newClient);

    newClient.on("connect", () => {
      console.log("Conectado com sucesso ao broker MQTT!");
      setConnectionStatus("Conectado");
      setIsLoading(false);

      newClient.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
          console.log(`Inscrito no tópico: ${MQTT_TOPIC}`);
        } else {
          console.error("Erro ao se inscrever no tópico", err);
        }
      });
    });

    newClient.on("message", (topic, message) => {
      const msgString = message.toString();
      console.log(`Mensagem MQTT recebida [${topic}]: ${msgString}`);
      setLastMessage(msgString);

      try {
        const data = JSON.parse(msgString);
        if (data && typeof data.led === "boolean") {
          setLedStatus(data.led);
        } else {
          console.warn("Mensagem lida, mas payload não condiz com objeto { led: boolean }");
        }
      } catch (error) {
        console.warn("Aviso: Mensagem recebida não é um JSON válido.", msgString);
      }
    });

    newClient.on("error", (err) => {
      console.error("Erro no cliente MQTT: ", err);
      setConnectionStatus("Erro na conexão");
      setIsLoading(false);
      newClient.end();
    });

    newClient.on("offline", () => {
      console.log("Cliente MQTT offline.");
      setConnectionStatus("Offline");
      setIsLoading(false);
    });

    newClient.on("reconnect", () => {
      console.log("Tentando reconectar...");
      setConnectionStatus("Reconectando...");
      setIsLoading(true);
    });
  };

  const toggleLed = (state) => {
    if (!client || connectionStatus !== "Conectado") return;
    
    setIsSending(true);
    const payload = state ? "ON" : "OFF";
    
    client.publish(MQTT_CMD_TOPIC, payload, {}, (err) => {
      setIsSending(false);
      if (err) {
        console.error("Erro ao enviar comando:", err);
      } else {
        console.log(`Comando MQTT publicado: ${payload}`);
      }
    });
  };

  useEffect(() => {
    connectMQTT();

    return () => {
      if (client) {
        console.log("Desmontando App: fechando conexão MQTT");
        client.end();
      }
    };
  }, []); // Executa apenas uma vez ao montar o componente

  return {
    connectionStatus,
    ledStatus,
    lastMessage,
    isLoading,
    isSending,
    connectMQTT,
    toggleLed,
  };
}
