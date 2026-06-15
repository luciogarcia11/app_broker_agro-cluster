import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { SectionTitle } from "../components/SectionTitle";
import { ToggleButton } from "../components/ToggleButton";
import { useMqtt } from "../hooks/useMqtt";
import { useTheme } from "../contexts/ThemeContext";

const COMMANDS = {
  light: "agrocluster/cmd/light",
  fan: "agrocluster/cmd/fan",
};

export function ControlsScreen() {
  const { theme } = useTheme();
  const { actuators, publish, mqttState } = useMqtt();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const connected = mqttState.status === "connected";

  const sendCommand = (key: keyof typeof COMMANDS, nextState: boolean) => {
    setLoadingKey(key);
    publish(COMMANDS[key], nextState ? "ON" : "OFF");
    setTimeout(() => setLoadingKey(null), 600);
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: theme.colors.textOnDark }]}>Controles</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {connected ? "Envie comandos para os atuadores" : "Conecte-se ao broker para controlar"}
          </Text>
          <View style={[styles.headerAccent, { backgroundColor: theme.colors.primary }]} />
        </View>

        {!connected && (
          <GlassCard>
            <View style={styles.disconnectedContainer}>
              <Ionicons name="cloud-offline-outline" size={40} color={theme.colors.textMuted} />
              <Text style={[styles.disconnectedText, { color: theme.colors.textMuted }]}>
                Broker desconectado
              </Text>
              <Text style={[styles.disconnectedHint, { color: theme.colors.textMuted }]}>
                Vá em MQTT e conecte-se para enviar comandos.
              </Text>
            </View>
          </GlassCard>
        )}

        <GlassCard accent={actuators?.light ? "green" : "none"}>
          <View style={styles.cardRow}>
            <Ionicons
              name="bulb-outline"
              size={28}
              color={actuators?.light ? theme.colors.warning : theme.colors.textMuted}
            />
            <View style={styles.cardInfo}>
              <SectionTitle title="Luz" />
              <Text style={[styles.statusHint, { color: theme.colors.textMuted }]}>
                {actuators?.light === undefined
                  ? "Status desconhecido"
                  : actuators.light
                    ? "Ligada"
                    : "Desligada"}
              </Text>
            </View>
          </View>
          <View style={styles.toggleRow}>
            <ToggleButton
              label={loadingKey === "light" ? "..." : "LIGAR"}
              active={Boolean(actuators?.light)}
              onPress={() => sendCommand("light", true)}
              disabled={!connected}
              icon="power-outline"
            />
            <ToggleButton
              label={loadingKey === "light" ? "..." : "DESLIGAR"}
              active={!actuators?.light}
              onPress={() => sendCommand("light", false)}
              disabled={!connected}
            />
          </View>
        </GlassCard>

        <GlassCard accent={actuators?.fan ? "green" : "none"}>
          <View style={styles.cardRow}>
            <Ionicons
              name="sync-outline"
              size={28}
              color={actuators?.fan ? theme.colors.secondary : theme.colors.textMuted}
            />
            <View style={styles.cardInfo}>
              <SectionTitle title="Ventoinha" />
              <Text style={[styles.statusHint, { color: theme.colors.textMuted }]}>
                {actuators?.fan === undefined
                  ? "Status desconhecido"
                  : actuators.fan
                    ? "Ligada"
                    : "Desligada"}
              </Text>
            </View>
          </View>
          <View style={styles.toggleRow}>
            <ToggleButton
              label={loadingKey === "fan" ? "..." : "LIGAR"}
              active={Boolean(actuators?.fan)}
              onPress={() => sendCommand("fan", true)}
              disabled={!connected}
              icon="power-outline"
            />
            <ToggleButton
              label={loadingKey === "fan" ? "..." : "DESLIGAR"}
              active={!actuators?.fan}
              onPress={() => sendCommand("fan", false)}
              disabled={!connected}
            />
          </View>
        </GlassCard>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 56,
    paddingBottom: 80,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerAccent: {
    height: 3,
    width: 60,
    borderRadius: 2,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  cardInfo: {
    flex: 1,
  },
  statusHint: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  disconnectedContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  disconnectedText: {
    fontSize: 16,
    fontWeight: "600",
  },
  disconnectedHint: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.7,
  },
});
