import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { SectionTitle } from "../components/SectionTitle";
import { ToggleButton } from "../components/ToggleButton";
import { useMqtt } from "../hooks/useMqtt";
import { AppTheme } from "../styles/theme";

const COMMANDS = {
  light: "agrocluster/cmd/light",
  fan: "agrocluster/cmd/fan",
};

export function ControlsScreen() {
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
          <Text style={styles.title}>Controls</Text>
          <Text style={styles.subtitle}>
            {connected ? "Envie comandos para os atuadores" : "Conecte-se ao broker para controlar"}
          </Text>
          <View style={styles.headerAccent} />
        </View>

        {!connected && (
          <GlassCard>
            <View style={styles.disconnectedContainer}>
              <Ionicons name="cloud-offline-outline" size={40} color={AppTheme.colors.textMuted} />
              <Text style={styles.disconnectedText}>Broker desconectado</Text>
              <Text style={styles.disconnectedHint}>
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
              color={actuators?.light ? AppTheme.colors.warning : AppTheme.colors.textMuted}
            />
            <View style={styles.cardInfo}>
              <SectionTitle title="Light" />
              <Text style={styles.statusHint}>
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
              label={loadingKey === "light" ? "..." : "ON"}
              active={Boolean(actuators?.light)}
              onPress={() => sendCommand("light", true)}
              disabled={!connected}
              icon="power-outline"
            />
            <ToggleButton
              label={loadingKey === "light" ? "..." : "OFF"}
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
              color={actuators?.fan ? AppTheme.colors.secondary : AppTheme.colors.textMuted}
            />
            <View style={styles.cardInfo}>
              <SectionTitle title="Fan" />
              <Text style={styles.statusHint}>
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
              label={loadingKey === "fan" ? "..." : "ON"}
              active={Boolean(actuators?.fan)}
              onPress={() => sendCommand("fan", true)}
              disabled={!connected}
              icon="power-outline"
            />
            <ToggleButton
              label={loadingKey === "fan" ? "..." : "OFF"}
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
    padding: AppTheme.spacing.lg,
    paddingTop: 56,
    paddingBottom: 80,
  },
  headerSection: {
    marginBottom: AppTheme.spacing.lg,
  },
  headerAccent: {
    height: 3,
    width: 60,
    backgroundColor: AppTheme.colors.primary,
    borderRadius: 2,
    marginTop: AppTheme.spacing.sm,
  },
  title: {
    color: AppTheme.colors.textOnDark,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    marginTop: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: AppTheme.spacing.sm,
  },
  cardInfo: {
    flex: 1,
  },
  statusHint: {
    color: AppTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
  },
  disconnectedContainer: {
    alignItems: "center",
    paddingVertical: AppTheme.spacing.lg,
    gap: 8,
  },
  disconnectedText: {
    color: AppTheme.colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
  },
  disconnectedHint: {
    color: AppTheme.colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    opacity: 0.7,
  },
});
