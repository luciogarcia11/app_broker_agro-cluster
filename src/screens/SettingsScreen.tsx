import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>

        <GlassCard>
          <SectionTitle title="Preferences" />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Dark mode</Text>
            <Switch value={settings.darkMode} onValueChange={(value) => updateSetting("darkMode", value)} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Notifications</Text>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSetting("notifications", value)}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Auto reconnect</Text>
            <Switch
              value={settings.autoReconnect}
              onValueChange={(value) => updateSetting("autoReconnect", value)}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="About" />
          <Text style={styles.metaText}>Agro-Cluster v1.0.0</Text>
          <Text style={styles.metaText}>Premium IoT dashboard for smart farming.</Text>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Maintenance" />
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: AppTheme.spacing.sm,
  },
  switchLabel: {
    color: AppTheme.colors.textMuted,
  },
  metaText: {
    color: AppTheme.colors.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  spacer: {
    height: AppTheme.spacing.sm,
  },
});
