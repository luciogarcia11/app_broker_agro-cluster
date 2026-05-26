import React, { useState } from "react";
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";

export default function App() {
  const [tapCount, setTapCount] = useState(0);

  const handleTap = () => {
    setTapCount((prev) => prev + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.card}>
        <Text style={styles.title}>Teste de Tela</Text>
        <Text style={styles.ledStatus}>Hello Expo</Text>
        <View style={styles.divider} />
        <Text style={styles.connectionStatus}>Se esta tela abrir, o app esta OK.</Text>
        <Text style={styles.messageLabel}>Toques no botao:</Text>
        <Text style={styles.messageValue}>{tapCount}</Text>
        <Pressable
          style={({ pressed }) => [styles.reconnectButton, pressed && styles.reconnectPressed]}
          onPress={handleTap}
        >
          <Text style={styles.reconnectText}>Tocar no botao</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#141B22",
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8
  },
  title: {
    color: "#9BA7B2",
    fontSize: 16,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10
  },
  ledStatus: {
    color: "#E6EDF3",
    fontSize: 32,
    fontWeight: "600",
    marginBottom: 16
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#1F2A33",
    marginVertical: 12
  },
  connectionStatus: {
    color: "#7C8B97",
    fontSize: 14
  },
  messageLabel: {
    color: "#7C8B97",
    fontSize: 12,
    marginTop: 12
  },
  messageValue: {
    color: "#D8E1E8",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center"
  },
  reconnectButton: {
    marginTop: 18,
    backgroundColor: "#1F2A33",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18
  },
  reconnectPressed: {
    opacity: 0.75
  },
  reconnectText: {
    color: "#64B5F6",
    fontSize: 14,
    fontWeight: "600"
  }
});
