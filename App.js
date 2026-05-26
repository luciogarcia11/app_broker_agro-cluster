import React from "react";
import { 
  Text, 
  View, 
  Pressable, 
  SafeAreaView, 
  StatusBar, 
  ActivityIndicator 
} from "react-native";

import { styles } from "./src/styles/AppStyles";
import { useMQTT } from "./src/hooks/useMQTT";

// Polyfills required by mqtt in React Native/Expo.
if (!global.Buffer) {
  global.Buffer = require("buffer").Buffer;
}
if (!global.process) {
  global.process = require("process");
}

export default function App() {
  const {
    connectionStatus,
    ledStatus,
    lastMessage,
    isLoading,
    isSending,
    connectMQTT,
    toggleLed,
  } = useMQTT();

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