import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  SafeAreaView, 
  StatusBar, 
  ActivityIndicator 
} from "react-native";

import mqtt from "mqtt";

// ==========================================
// CONFIGURAÇÕES DO BROKER
// ==========================================
const MQTT_URL = "ws://broker.hivemq.com:8000/mqtt"; // Usando a porta pública de WebSocket
const MQTT_TOPIC = "lucio/esp8266/led/status";
const MQTT_CMD_TOPIC = "lucio/esp8266/led/cmd";

// ==========================================
// CREDENCIAIS DE ACESSO
// ==========================================
const MQTT_USERNAME = "";
const MQTT_PASSWORD = "";

export default function App() {
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
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F14" />
      
      <View style={styles.card}>
        <Text style={styles.headerTitle}>Dashboard Móvel</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status (Broker):</Text>
          <View style={styles.statusValueContainer}>
            <View style={[
              styles.indicatorDot, 
              { backgroundColor: connectionStatus === "Conectado" ? "#4caf50" : (connectionStatus === "Desconectado" || connectionStatus === "Offline" || connectionStatus === "Erro na conexão" ? "#f44336" : "#ff9800") }
            ]} />
            <Text style={styles.statusValue}>{connectionStatus}</Text>
          </View>
        </View>

        <View style={styles.ledContainer}>
          <Text style={styles.ledLabel}>Status LED remoto no ESP8266:</Text>
          <View style={[
            styles.ledIndicator, 
            ledStatus === true ? styles.ledOn : (ledStatus === false ? styles.ledOff : styles.ledUnknown)
          ]}>
            <Text style={styles.ledText}>
              {ledStatus === true ? "LED Ligado" : (ledStatus === false ? "LED Desligado" : "DESCONHECIDO")}
            </Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.controlButton, 
              styles.buttonOn,
              (pressed || connectionStatus !== "Conectado" || isSending) && styles.controlButtonPressed
            ]} 
            onPress={() => toggleLed(true)}
            disabled={connectionStatus !== "Conectado" || isSending}
          >
            {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Ligar LED</Text>}
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.controlButton, 
              styles.buttonOff,
              (pressed || connectionStatus !== "Conectado" || isSending) && styles.controlButtonPressed
            ]} 
            onPress={() => toggleLed(false)}
            disabled={connectionStatus !== "Conectado" || isSending}
          >
            {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Desligar LED</Text>}
          </Pressable>
        </View>

        <View style={styles.messageBox}>
          <Text style={styles.messageLabel}>Último Payload recebido:</Text>
          <Text style={styles.messageText}>{lastMessage || "Aguardando trafego..."}</Text>
        </View>

        <Pressable 
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isLoading && styles.buttonDisabled]} 
          onPress={connectMQTT}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.buttonText}>Reconectar Broker</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#141B22",
    width: "90%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#1D2732", 
    padding: 14,
    borderRadius: 12,
  },
  statusLabel: {
    color: "#BCC2CA",
    fontSize: 14,
  },
  statusValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusValue: {
    color: "#ffffff",
    fontWeight: "600",
  },
  ledContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  ledLabel: {
    color: "#BCC2CA",
    fontSize: 13,
    marginBottom: 10,
  },
  ledIndicator: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  ledOn: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderColor: "#4caf50",
  },
  ledOff: {
    backgroundColor: "rgba(244, 67, 54, 0.15)",
    borderColor: "#f44336",
  },
  ledUnknown: {
    backgroundColor: "rgba(158, 158, 158, 0.1)",
    borderColor: "#9e9e9e",
  },
  ledText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  messageBox: {
    backgroundColor: "#000000",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  messageLabel: {
    color: "#888888",
    fontSize: 12,
    marginBottom: 8,
  },
  messageText: {
    color: "#4caf50",
    fontFamily: "monospace",
    fontSize: 13,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  buttonOn: {
    backgroundColor: "#4caf50",
  },
  buttonOff: {
    backgroundColor: "#f44336",
  },
  controlButtonPressed: {
    opacity: 0.5,
  },
  button: {
    backgroundColor: "#2E5BFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#1B3280",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
