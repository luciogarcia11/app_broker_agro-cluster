import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { SectionTitle } from "../components/SectionTitle";
import { StatusBadge } from "../components/StatusBadge";
import { AnimatedStatusDot } from "../components/AnimatedStatusDot";
import { useMqtt } from "../hooks/useMqtt";
import { AppTheme } from "../styles/theme";
import { formatRelativeTime } from "../utils/time";

export function DashboardScreen() {
  const { bme280, lux, actuators, mqttState, systemStatus } = useMqtt();

  const statusTone = mqttState.status === "connected" ? "success" : mqttState.status === "connecting" ? "warning" : "danger";
  const actuatorLabel = (value?: boolean) => (value ? "ON" : "OFF");

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Agro-Cluster</Text>
        <Text style={styles.subtitle}>Cluster overview in real time</Text>

        <GlassCard>
          <View style={styles.cardHeader}>
            <SectionTitle title="BME280 Sensor" />
            <StatusBadge label={bme280?.online ? "ACTIVE" : "OFFLINE"} tone={bme280?.online ? "success" : "muted"} />
          </View>
          <View style={styles.gridRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Temperature</Text>
              <Text style={styles.metricValue}>{bme280?.temperature?.toFixed(1) ?? "24.5"} °C</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Humidity</Text>
              <Text style={styles.metricValue}>{bme280?.humidity ?? 58} %</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Pressure</Text>
              <Text style={styles.metricValue}>{bme280?.pressure ?? 1013} hPa</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Source ESP</Text>
              <Text style={styles.metricValue}>{bme280?.espId ?? "ESP-01"}</Text>
            </View>
          </View>
          <Text style={styles.metaText}>Last update: {formatRelativeTime(bme280?.updatedAt)}</Text>
        </GlassCard>

        <GlassCard>
          <View style={styles.cardHeader}>
            <SectionTitle title="BH1750 Sensor" />
            <StatusBadge label={lux?.online ? "ACTIVE" : "OFFLINE"} tone={lux?.online ? "success" : "muted"} />
          </View>
          <View style={styles.gridRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Lux</Text>
              <Text style={styles.metricValue}>{lux?.lux ?? 120} lx</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>State</Text>
              <Text style={styles.metricValue}>{lux?.state ?? "DAY"}</Text>
            </View>
          </View>
          <Text style={styles.metaText}>Source: {lux?.espId ?? "ESP-02"}</Text>
        </GlassCard>

        <GlassCard>
          <View style={styles.cardHeader}>
            <SectionTitle title="Actuators" />
            <StatusBadge label="LIVE" tone="success" />
          </View>
          <View style={styles.gridRow}>
            <View style={styles.metricBlockWide}>
              <Text style={styles.metricLabel}>Fan</Text>
              <Text style={[styles.metricValue, actuators?.fan ? styles.stateOn : styles.stateOff]}>{actuatorLabel(actuators?.fan)}</Text>
            </View>
            <View style={styles.metricBlockWide}>
              <Text style={styles.metricLabel}>Light</Text>
              <Text style={[styles.metricValue, actuators?.light ? styles.stateOn : styles.stateOff]}>{actuatorLabel(actuators?.light)}</Text>
            </View>
            <View style={styles.metricBlockWide}>
              <Text style={styles.metricLabel}>Irrigation</Text>
              <Text style={[styles.metricValue, actuators?.irrigation ? styles.stateOn : styles.stateOff]}>{actuatorLabel(actuators?.irrigation)}</Text>
            </View>
          </View>
          <Text style={styles.metaText}>Controller: {actuators?.espId ?? "ESP-03"}</Text>
        </GlassCard>

        <GlassCard>
          <View style={styles.cardHeader}>
            <SectionTitle title="System Status" />
            <View style={styles.statusRow}>
              <AnimatedStatusDot active={mqttState.status === "connected"} />
              <Text style={styles.statusText}>{mqttState.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Last Packet</Text>
              <Text style={styles.metricValue}>{formatRelativeTime(systemStatus.lastPacketAt)}</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Cluster</Text>
              <Text style={styles.metricValue}>{systemStatus.clusterStatus}</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>Active ESPs</Text>
              <Text style={styles.metricValue}>{systemStatus.activeEsps}</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>MQTT</Text>
              <Text style={styles.metricValue}>{statusTone}</Text>
            </View>
          </View>
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppTheme.spacing.sm,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.sm,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: "rgba(243, 249, 255, 0.7)",
    borderRadius: AppTheme.radius.md,
    padding: AppTheme.spacing.sm,
  },
  metricBlockWide: {
    flex: 1,
    backgroundColor: "rgba(243, 249, 255, 0.7)",
    borderRadius: AppTheme.radius.md,
    padding: AppTheme.spacing.sm,
    alignItems: "center",
  },
  metricLabel: {
    color: AppTheme.colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
  },
  metricValue: {
    color: AppTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  metaText: {
    color: AppTheme.colors.textMuted,
    fontSize: 12,
  },
  stateOn: {
    color: AppTheme.colors.success,
  },
  stateOff: {
    color: AppTheme.colors.textMuted,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    color: AppTheme.colors.textPrimary,
    fontWeight: "600",
  },
});
