import React, { useCallback } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { SectionTitle } from "../components/SectionTitle";
import { ToggleButton } from "../components/ToggleButton";
import { useMqtt } from "../hooks/useMqtt";
import { useTheme } from "../contexts/ThemeContext";

const MQTT_CONFIG_KEY = "agrocluster.mqtt.config";

export function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { config, saveConfig, resetConfig } = useMqtt();

  const reset = useCallback(() => {
    Alert.alert(
      "Restaurar configurações",
      "Isso irá restaurar todas as preferências para o padrão.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: () => {
            setThemeMode("dark");
            saveConfig({ ...config, autoReconnect: true });
          },
        },
      ],
    );
  }, [setThemeMode, saveConfig, config]);

  const resetMqttConfig = useCallback(() => {
    Alert.alert(
      "Limpar configuração MQTT",
      "Isso irá limpar todos os dados de conexão do broker.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: () => {
            resetConfig();
          },
        },
      ],
    );
  }, [resetConfig]);

  const clearCache = useCallback(() => {
    Alert.alert(
      "Limpar todos os dados",
      "Isso irá apagar todas as configurações e dados MQTT. Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar tudo",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(MQTT_CONFIG_KEY);
            setThemeMode("dark");
            resetConfig();
          },
        },
      ],
    );
  }, [resetConfig, setThemeMode]);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: theme.colors.textOnDark }]}>Configurações</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Configurações do app
          </Text>
          <View style={[styles.headerAccent, { backgroundColor: theme.colors.primary }]} />
        </View>

        <GlassCard>
          <SectionTitle title="Preferências" icon="options-outline" />
          <View style={[styles.switchRow, { borderBottomColor: theme.colors.divider }]}>
            <View style={styles.switchLabelRow}>
              <Ionicons name="moon-outline" size={16} color={theme.colors.textMuted} />
              <Text style={[styles.switchLabel, { color: theme.colors.textSecondary }]}>
                Modo escuro
              </Text>
            </View>
            <Switch
              value={themeMode === "dark"}
              onValueChange={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              trackColor={{ false: theme.colors.cardSecondary, true: theme.colors.primary }}
              thumbColor={themeMode === "dark" ? theme.colors.textOnDark : theme.colors.textMuted}
            />
          </View>
          <View style={[styles.switchRow, { borderBottomColor: theme.colors.divider }]}>
            <View style={styles.switchLabelRow}>
              <Ionicons name="repeat-outline" size={16} color={theme.colors.textMuted} />
              <Text style={[styles.switchLabel, { color: theme.colors.textSecondary }]}>
                Reconexão automática
              </Text>
            </View>
            <Switch
              value={config.autoReconnect}
              onValueChange={(value) => saveConfig({ ...config, autoReconnect: value })}
              trackColor={{ false: theme.colors.cardSecondary, true: theme.colors.primary }}
              thumbColor={config.autoReconnect ? theme.colors.textOnDark : theme.colors.textMuted}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Sobre" icon="information-circle-outline" />
          <View style={styles.aboutRow}>
            <Ionicons name="leaf-outline" size={32} color={theme.colors.secondary} />
            <View style={styles.aboutInfo}>
              <Text style={[styles.aboutTitle, { color: theme.colors.textPrimary }]}>
                Agro-Cluster
              </Text>
              <Text style={[styles.aboutVersion, { color: theme.colors.textMuted }]}>v1.0.0</Text>
            </View>
          </View>
          <Text style={[styles.aboutDesc, { color: theme.colors.textMuted }]}>
            Painel IoT premium para monitoramento e controle de mini estufa com cluster ESP32.
          </Text>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Manutenção" icon="construct-outline" />
          <ToggleButton label="Limpar configuração MQTT" active onPress={resetMqttConfig} />
          <View style={styles.spacer} />
          <ToggleButton label="Limpar dados em cache" active onPress={clearCache} />
          <View style={styles.spacer} />
          <ToggleButton label="Restaurar configurações do app" active onPress={reset} />
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  switchLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  aboutInfo: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  aboutVersion: {
    fontSize: 13,
    marginTop: 2,
  },
  aboutDesc: {
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  spacer: {
    height: 10,
  },
});
