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
        <View style={styles.headerSection}>
          <Text style={styles.title}>MQTT</Text>
          <Text style={styles.subtitle}>Configuração do broker</Text>
          <View style={styles.headerAccent} />
        </View>

        <GlassCard>
          <SectionTitle title="Connection" icon="cloud-outline" />
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text
              style={[
                styles.statusValue,
                mqttState.status === "error" && { color: AppTheme.colors.danger },
                mqttState.status === "connected" && { color: AppTheme.colors.success },
              ]}
            >
              {statusLabel}
            </Text>
          </View>

          {mqttState.status === "error" && mqttState.lastError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{mqttState.lastError}</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <ToggleButton label="Connect" active={mqttState.status === "connected"} onPress={connect} />
            <ToggleButton label="Disconnect" active={mqttState.status === "disconnected"} onPress={disconnect} />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Broker Settings" icon="server-outline" />
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
              placeholder="wss://...hivemq.cloud:8884/mqtt"
              onChangeText={(value) => updateDraft({ websocketUrl: value })}
            />
            <View style={styles.row}>
              <View style={styles.rowHalf}>
                <InputField
                  label="Port"
                  value={draft.port}
                  placeholder="8883"
                  onChangeText={(value) => updateDraft({ port: value })}
                />
              </View>
              <View style={styles.rowHalf}>
                <InputField
                  label="Keep Alive (s)"
                  value={draft.keepAlive}
                  placeholder="30"
                  onChangeText={(value) => updateDraft({ keepAlive: value })}
                />
              </View>
            </View>
            <InputField
              label="Client ID"
              value={draft.clientId}
              placeholder="agrocluster_client"
              onChangeText={(value) => updateDraft({ clientId: value })}
            />
            <InputField
              label="Username"
              value={draft.username}
              placeholder="HiveMQ username"
              onChangeText={(value) => updateDraft({ username: value })}
            />
            <InputField
              label="Password"
              value={draft.password}
              placeholder="HiveMQ password"
              secureTextEntry
              onChangeText={(value) => updateDraft({ password: value })}
            />
          </View>
          <View style={styles.toggleList}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Enable TLS</Text>
              <Switch
                value={draft.useTls}
                onValueChange={(value) => updateDraft({ useTls: value })}
                trackColor={{ false: AppTheme.colors.cardSecondary, true: AppTheme.colors.primary }}
                thumbColor={draft.useTls ? AppTheme.colors.textOnDark : AppTheme.colors.textMuted}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Auto Reconnect</Text>
              <Switch
                value={draft.autoReconnect}
                onValueChange={(value) => updateDraft({ autoReconnect: value })}
                trackColor={{ false: AppTheme.colors.cardSecondary, true: AppTheme.colors.primary }}
                thumbColor={draft.autoReconnect ? AppTheme.colors.textOnDark : AppTheme.colors.textMuted}
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
          <SectionTitle title="Topics" icon="git-branch-outline" />
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
    paddingBottom: 32,
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
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: AppTheme.spacing.sm,
  },
  statusLabel: {
    color: AppTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  statusValue: {
    color: AppTheme.colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  errorBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: AppTheme.colors.dangerBg,
    borderRadius: AppTheme.radius.md,
    borderWidth: 1,
    borderColor: AppTheme.colors.danger,
  },
  errorText: {
    color: AppTheme.colors.danger,
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
    marginTop: AppTheme.spacing.sm,
  },
  formGrid: {
    gap: AppTheme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
  },
  rowHalf: {
    flex: 1,
  },
  toggleList: {
    marginTop: AppTheme.spacing.sm,
    gap: AppTheme.spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  switchLabel: {
    color: AppTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    marginTop: AppTheme.spacing.md,
  },
  topicHint: {
    color: AppTheme.colors.textMuted,
    fontSize: 12,
  },
  topicInput: {
    backgroundColor: AppTheme.colors.cardSecondary,
    borderRadius: AppTheme.radius.md,
    padding: AppTheme.spacing.sm,
    minHeight: 80,
    color: AppTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "transparent",
  },
});
