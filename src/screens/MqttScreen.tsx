import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { SectionTitle } from "../components/SectionTitle";
import { InputField } from "../components/InputField";
import { ToggleButton } from "../components/ToggleButton";
import { useMqtt } from "../hooks/useMqtt";
import { useTheme } from "../contexts/ThemeContext";
import { MqttConfig } from "../types/mqtt";

export function MqttScreen() {
  const { theme } = useTheme();
  const { config, mqttState, connect, disconnect, saveConfig } = useMqtt();
  const [draft, setDraft] = useState<MqttConfig>(config);
  const [topicsText, setTopicsText] = useState(config.topics.join(", "));

  useEffect(() => {
    setDraft(config);
    setTopicsText(config.topics.join(", "));
  }, [config]);

  const statusLabel = useMemo(() => {
    if (mqttState.status === "connected") return "Conectado";
    if (mqttState.status === "connecting") return "Conectando";
    if (mqttState.status === "error") return "Erro";
    return "Desconectado";
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
          <Text style={[styles.title, { color: theme.colors.textOnDark }]}>MQTT</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Configuração do broker
          </Text>
          <View style={[styles.headerAccent, { backgroundColor: theme.colors.primary }]} />
        </View>

        <GlassCard
          accent={
            mqttState.status === "connected"
              ? "green"
              : mqttState.status === "error"
                ? "none"
                : "cyan"
          }
        >
          <SectionTitle title="Status da Conexão" icon="cloud-outline" />
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.colors.textMuted }]}>Status</Text>
            <View style={styles.statusBadgeRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: theme.colors.textMuted },
                  mqttState.status === "connected" && { backgroundColor: theme.colors.success },
                  mqttState.status === "connecting" && { backgroundColor: theme.colors.warning },
                  mqttState.status === "error" && { backgroundColor: theme.colors.danger },
                ]}
              />
              <Text
                style={[
                  styles.statusValue,
                  { color: theme.colors.textPrimary },
                  mqttState.status === "error" && { color: theme.colors.danger },
                  mqttState.status === "connected" && { color: theme.colors.success },
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          </View>

          {mqttState.lastPacketAt && mqttState.status === "connected" && (
            <Text style={[styles.statusMeta, { color: theme.colors.textMuted }]}>
              Last packet: {new Date(mqttState.lastPacketAt).toLocaleTimeString()}
            </Text>
          )}

          {mqttState.status === "error" && mqttState.lastError && (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.danger },
              ]}
            >
              <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                {mqttState.lastError}
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <ToggleButton
              label="Connect"
              active={mqttState.status === "connected"}
              onPress={connect}
            />
            <ToggleButton
              label="Disconnect"
              active={mqttState.status === "disconnected"}
              onPress={disconnect}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Servidor" icon="server-outline" />
          <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
            Configure o endereço do broker MQTT e a porta de conexão.
          </Text>
          <View style={styles.formGrid}>
            <InputField
              label="Broker URL"
              value={draft.brokerUrl}
              placeholder="ex: broker.hivemq.cloud"
              icon="globe-outline"
              helperText="Endereço do servidor MQTT (sem protocolo)."
              onChangeText={(value) => updateDraft({ brokerUrl: value })}
            />
            <InputField
              label="WebSocket URL"
              value={draft.websocketUrl}
              placeholder="ex: wss://broker.hivemq.cloud:8884/mqtt"
              icon="wifi-outline"
              helperText="URL completa para conexão via WebSocket."
              onChangeText={(value) => updateDraft({ websocketUrl: value })}
            />
            <View style={styles.row}>
              <View style={styles.rowHalf}>
                <InputField
                  label="Porta"
                  value={draft.port}
                  placeholder="ex: 8883"
                  icon="shuffle-outline"
                  helperText="Porta TCP do broker."
                  onChangeText={(value) => updateDraft({ port: value })}
                />
              </View>
              <View style={styles.rowHalf}>
                <InputField
                  label="Keep Alive"
                  value={draft.keepAlive}
                  placeholder="30"
                  icon="timer-outline"
                  helperText="Intervalo em segundos."
                  onChangeText={(value) => updateDraft({ keepAlive: value })}
                />
              </View>
            </View>
          </View>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Autenticação" icon="lock-closed-outline" />
          <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
            Credenciais de acesso ao broker. Deixe em branco se não for necessário.
          </Text>
          <View style={styles.formGrid}>
            <InputField
              label="Client ID"
              value={draft.clientId}
              placeholder="ex: agrocluster_dispositivo_01"
              icon="phone-portrait-outline"
              helperText="Identificador único deste dispositivo."
              onChangeText={(value) => updateDraft({ clientId: value })}
            />
            <InputField
              label="Usuário"
              value={draft.username}
              placeholder="Nome de usuário do broker"
              icon="person-outline"
              helperText="Nome de usuário para autenticação."
              onChangeText={(value) => updateDraft({ username: value })}
            />
            <InputField
              label="Senha"
              value={draft.password}
              placeholder="Senha do broker"
              icon="key-outline"
              secureTextEntry
              helperText="Senha para autenticação no broker."
              onChangeText={(value) => updateDraft({ password: value })}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Configurações" icon="settings-outline" />
          <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
            Ajustes de segurança e reconexão automática.
          </Text>
          <View style={styles.toggleList}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <Text style={[styles.switchLabel, { color: theme.colors.textSecondary }]}>TLS</Text>
                <Text style={[styles.switchHint, { color: theme.colors.textMuted }]}>
                  Criptografar conexão
                </Text>
              </View>
              <Switch
                value={draft.useTls}
                onValueChange={(value) => updateDraft({ useTls: value })}
                trackColor={{ false: theme.colors.cardSecondary, true: theme.colors.primary }}
                thumbColor={draft.useTls ? theme.colors.textOnDark : theme.colors.textMuted}
              />
            </View>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelGroup}>
                <Text style={[styles.switchLabel, { color: theme.colors.textSecondary }]}>
                  Auto Reconnect
                </Text>
                <Text style={[styles.switchHint, { color: theme.colors.textMuted }]}>
                  Reconectar automaticamente ao cair
                </Text>
              </View>
              <Switch
                value={draft.autoReconnect}
                onValueChange={(value) => updateDraft({ autoReconnect: value })}
                trackColor={{ false: theme.colors.cardSecondary, true: theme.colors.primary }}
                thumbColor={draft.autoReconnect ? theme.colors.textOnDark : theme.colors.textMuted}
              />
            </View>
          </View>
          <ToggleButton
            label="Salvar Configuração"
            active
            onPress={() => saveConfig(draft)}
            style={styles.saveButton}
          />
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Tópicos" icon="git-branch-outline" />
          <Text style={[styles.sectionDescription, { color: theme.colors.textMuted }]}>
            Lista de tópicos MQTT que este dispositivo deve escutar. Separe cada tópico com vírgula.
          </Text>
          <TextInput
            value={topicsText}
            onChangeText={handleTopicsChange}
            placeholder="ex: agrocluster/sensors/bme280, agrocluster/status"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.topicInput,
              { backgroundColor: theme.colors.cardSecondary, color: theme.colors.textPrimary },
            ]}
            multiline
          />
        </GlassCard>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
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
  sectionDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusValue: {
    fontWeight: "700",
    fontSize: 14,
  },
  statusMeta: {
    fontSize: 11,
    marginTop: 4,
  },
  errorBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  formGrid: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowHalf: {
    flex: 1,
  },
  toggleList: {
    marginTop: 10,
    gap: 10,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  switchLabelGroup: {
    flex: 1,
    marginRight: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  switchHint: {
    fontSize: 11,
    marginTop: 1,
  },
  saveButton: {
    marginTop: 16,
  },
  topicInput: {
    borderRadius: 16,
    padding: 10,
    minHeight: 80,
    fontSize: 13,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "transparent",
  },
});
