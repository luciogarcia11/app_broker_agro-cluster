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
            export { default } from "./App";