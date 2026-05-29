import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { SectionTitle } from "../components/SectionTitle";
import { InputField } from "../components/InputField";
import { ToggleButton } from "../components/ToggleButton";
import { useMqtt } from "../hooks/useMqtt";
import { AppTheme } from "../styles/theme";
import { MqttConfig } from "../types/mqtt";

export function MqttScreen() {
  const { config, mqttState, connect, disconnect, saveConfig } = useMqtt();
  const [draft, setDraft] = useState<MqttConfig>(config);
  const [topicsText, setTopicsText] = useState(config.topics.join(", "));

  useEffect(() => {
    setDraft(config);
    setTopicsText(config.topics.join(", "));
  }, [config]);

  const statusLabel = useMemo(() => {
    if (mqttState.status === "connected") return "Connected";
    if (mqttState.status === "connecting") return "Connecting";
    if (mqttState.status === "error") return "Error";
    return "Disconnected";
  }, [mqttState.status]);

  const updateDraft = (patch: Partial<MqttConfig>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleTopicsChange = (value: string) => {
    setTopicsText(value);
    const nextTopics = value
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean);
    updateDraft({ topics: nextTopics });
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>MQTT Configuration</Text>
        <Text style={styles.subtitle}>Edit and save broker settings</Text>

        <GlassCard>
          <SectionTitle title="Connection" />
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={styles.statusValue}>{statusLabel}</Text>
          </View>
          <View style={styles.buttonRow}>
            <ToggleButton label="Connect" active={mqttState.status === "connected"} onPress={connect} />
            <ToggleButton label="Disconnect" active={mqttState.status === "disconnected"} onPress={disconnect} />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Broker Settings" />
          <View style={styles.formGrid}>
            <InputField
              label="Broker URL"
              value={draft.brokerUrl}
              placeholder="6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud"
              onChangeText={(value) => updateDraft({ brokerUrl: value })}
            />
            <InputField
              label="WebSocket URL"
              value={draft.websocketUrl}
              placeholder="wss://6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud:8884/mqtt"
              onChangeText={(value) => updateDraft({ websocketUrl: value })}
            />
            <InputField
              label="Port"
              value={draft.port}
              placeholder="8883"
              onChangeText={(value) => updateDraft({ port: value })}
            />
            <InputField
              label="Client ID"
              value={draft.clientId}
              placeholder="agrocluster_client"
              onChangeText={(value) => updateDraft({ clientId: value })}
            />
            <InputField
              label="Username"
              value={draft.username}
              placeholder="broker user"
              onChangeText={(value) => updateDraft({ username: value })}
            />
            <InputField
              label="Password"
              value={draft.password}
              placeholder="broker password"
              secureTextEntry
              onChangeText={(value) => updateDraft({ password: value })}
            />
            <InputField
              label="Keep Alive (s)"
              value={draft.keepAlive}
              placeholder="30"
              onChangeText={(value) => updateDraft({ keepAlive: value })}
            />
          </View>
          <View style={styles.toggleList}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Enable TLS</Text>
              <Switch
                value={draft.useTls}
                onValueChange={(value) => updateDraft({ useTls: value })}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Auto Reconnect</Text>
              <Switch
                value={draft.autoReconnect}
                onValueChange={(value) => updateDraft({ autoReconnect: value })}
              />
            </View>
          </View>
          <ToggleButton
            label="Save Configuration"
            active
            onPress={() => saveConfig(draft)}
            style={styles.saveButton}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Topics" />
          <Text style={styles.topicHint}>Separate topics with commas.</Text>
          <TextInput
            value={topicsText}
            onChangeText={handleTopicsChange}
            placeholder="agrocluster/sensors/bme280, agrocluster/status"
            placeholderTextColor={AppTheme.colors.textMuted}
            style={styles.topicInput}
            multiline
          />
        </GlassCard>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
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
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    color: AppTheme.colors.textMuted,
  },
  statusValue: {
    color: AppTheme.colors.textPrimary,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.sm,
  },
  formGrid: {
    gap: AppTheme.spacing.sm,
  },
  toggleList: {
    marginTop: AppTheme.spacing.sm,
    gap: AppTheme.spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: {
    color: AppTheme.colors.textMuted,
  },
  saveButton: {
    marginTop: AppTheme.spacing.md,
  },
  topicHint: {
    color: AppTheme.colors.textMuted,
    fontSize: 12,
  },
  topicInput: {
    backgroundColor: "rgba(243, 249, 255, 0.8)",
    borderRadius: AppTheme.radius.md,
    padding: AppTheme.spacing.sm,
    minHeight: 80,
    color: AppTheme.colors.textPrimary,
  },
});
