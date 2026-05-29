import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { SectionTitle } from "../components/SectionTitle";
import { ToggleButton } from "../components/ToggleButton";
import { useMqtt } from "../hooks/useMqtt";
import { AppTheme } from "../styles/theme";

const COMMANDS = {
  light: "agrocluster/cmd/light",
  fan: "agrocluster/cmd/fan",
  irrigation: "agrocluster/cmd/irrigation",
};

export function ControlsScreen() {
  const { actuators, publish, mqttState } = useMqtt();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const sendCommand = (key: keyof typeof COMMANDS, nextState: boolean) => {
    setLoadingKey(key);
    publish(COMMANDS[key], nextState ? "ON" : "OFF");
    setTimeout(() => setLoadingKey(null), 600);
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Controls</Text>
        <Text style={styles.subtitle}>Send instant commands</Text>

        <GlassCard>
          <SectionTitle title="Light" />
          <View style={styles.toggleRow}>
            <ToggleButton
              label={loadingKey === "light" ? "Sending..." : "ON"}
              active={Boolean(actuators?.light)}
              onPress={() => sendCommand("light", true)}
              disabled={mqttState.status !== "connected"}
            />
            <ToggleButton
              label={loadingKey === "light" ? "Sending..." : "OFF"}
              active={!actuators?.light}
              onPress={() => sendCommand("light", false)}
              disabled={mqttState.status !== "connected"}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Fan" />
          <View style={styles.toggleRow}>
            <ToggleButton
              label={loadingKey === "fan" ? "Sending..." : "ON"}
              active={Boolean(actuators?.fan)}
              onPress={() => sendCommand("fan", true)}
              disabled={mqttState.status !== "connected"}
            />
            <ToggleButton
              label={loadingKey === "fan" ? "Sending..." : "OFF"}
              active={!actuators?.fan}
              onPress={() => sendCommand("fan", false)}
              disabled={mqttState.status !== "connected"}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Irrigation" />
          <View style={styles.toggleRow}>
            <ToggleButton
              label={loadingKey === "irrigation" ? "Sending..." : "ON"}
              active={Boolean(actuators?.irrigation)}
              onPress={() => sendCommand("irrigation", true)}
              disabled={mqttState.status !== "connected"}
            />
            <ToggleButton
              label={loadingKey === "irrigation" ? "Sending..." : "OFF"}
              active={!actuators?.irrigation}
              onPress={() => sendCommand("irrigation", false)}
              disabled={mqttState.status !== "connected"}
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
  },
  title: {
    color: AppTheme.colors.white,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: AppTheme.spacing.lg,
  },
  toggleRow: {
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
  },
});
