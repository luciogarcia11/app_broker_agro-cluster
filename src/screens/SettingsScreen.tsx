import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { SectionTitle } from "../components/SectionTitle";
import { ToggleButton } from "../components/ToggleButton";
import { AppTheme } from "../styles/theme";

const SETTINGS_KEY = "agrocluster.settings";
const MQTT_CONFIG_KEY = "agrocluster.mqtt.config";

interface SettingsState {
  darkMode: boolean;
  notifications: boolean;
  autoReconnect: boolean;
}

const defaultSettings: SettingsState = {
  darkMode: true,
  notifications: true,
  autoReconnect: true,
};

export function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((stored) => {
      if (!stored) return;
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {
        setSettings(defaultSettings);
      }
    });
  }, []);

  const updateSetting = (key: keyof SettingsState, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  const reset = () => {
    setSettings(defaultSettings);
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  };

  const resetMqttConfig = () => {
    AsyncStorage.removeItem(MQTT_CONFIG_KEY);
  };

  const clearCache = () => {
    AsyncStorage.clear();
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Configurações do app</Text>
          <View style={styles.headerAccent} />
        </View>

        <GlassCard>
          <SectionTitle title="Preferences" icon="options-outline" />
          <View style={styles.switchRow}>
            <View style={styles.switchLabelRow}>
              <Ionicons name="moon-outline" size={16} color={AppTheme.colors.textMuted} />
              <Text style={styles.switchLabel}>Dark mode</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => updateSetting("darkMode", value)}
              trackColor={{ false: AppTheme.colors.cardSecondary, true: AppTheme.colors.primary }}
              thumbColor={settings.darkMode ? AppTheme.colors.textOnDark : AppTheme.colors.textMuted}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelRow}>
              <Ionicons name="notifications-outline" size={16} color={AppTheme.colors.textMuted} />
              <Text style={styles.switchLabel}>Notifications</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSetting("notifications", value)}
              trackColor={{ false: AppTheme.colors.cardSecondary, true: AppTheme.colors.primary }}
              thumbColor={settings.notifications ? AppTheme.colors.textOnDark : AppTheme.colors.textMuted}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelRow}>
              <Ionicons name="repeat-outline" size={16} color={AppTheme.colors.textMuted} />
              <Text style={styles.switchLabel}>Auto reconnect</Text>
            </View>
            <Switch
              value={settings.autoReconnect}
              onValueChange={(value) => updateSetting("autoReconnect", value)}
              trackColor={{ false: AppTheme.colors.cardSecondary, true: AppTheme.colors.primary }}
              thumbColor={settings.autoReconnect ? AppTheme.colors.textOnDark : AppTheme.colors.textMuted}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="About" icon="information-circle-outline" />
          <View style={styles.aboutRow}>
            <Ionicons name="leaf-outline" size={32} color={AppTheme.colors.secondary} />
            <View style={styles.aboutInfo}>
              <Text style={styles.aboutTitle}>Agro-Cluster</Text>
              <Text style={styles.aboutVersion}>v1.0.0</Text>
            </View>
          </View>
          <Text style={styles.aboutDesc}>
            Painel IoT premium para monitoramento e controle de mini estufa com cluster ESP32.
          </Text>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Maintenance" icon="construct-outline" />
          <ToggleButton label="Reset MQTT configuration" active onPress={resetMqttConfig} />
          <View style={styles.spacer} />
          <ToggleButton label="Clear cached data" active onPress={clearCache} />
          <View style={styles.spacer} />
          <ToggleButton label="Reset app settings" active onPress={reset} />
        </GlassCard>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppTheme.colors.divider,
  },
  switchLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    color: AppTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: AppTheme.spacing.sm,
  },
  aboutInfo: {
    flex: 1,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppTheme.colors.textPrimary,
  },
  aboutVersion: {
    fontSize: 13,
    color: AppTheme.colors.textMuted,
    marginTop: 2,
  },
  aboutDesc: {
    color: AppTheme.colors.textMuted,
    fontSize: 13,
    marginTop: AppTheme.spacing.sm,
    lineHeight: 18,
  },
  spacer: {
    height: AppTheme.spacing.sm,
  },
});
