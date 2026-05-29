import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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

  const connected = mqttState.status === "connected";
  const connecting = mqttState.status === "connecting";
  const mqttBadgeTone = connected ? "success" : connecting ? "warning" : "danger";
  const mqttBadgeLabel = connected ? "CONNECTED" : connecting ? "CONNECTING" : "OFFLINE";

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Agro-Cluster</Text>
              <Text style={styles.subtitle}>Mini estufa · Monitoramento em tempo real</Text>
            </View>
            <View style={styles.brokerRow}>
              <AnimatedStatusDot active={connected} size={12} />
              <Text style={styles.brokerText}>{mqttBadgeLabel}</Text>
            </View>
          </View>
          <View style={styles.headerAccent} />
        </View>

        {/* BME280 */}
        <GlassCard accent="cyan">
          <View style={styles.cardHeader}>
            <SectionTitle title="BME280" icon="thermometer-outline" iconColor={AppTheme.colors.primary} />
            <StatusBadge
              label={bme280?.online ? "ACTIVE" : "OFFLINE"}
              tone={bme280?.online ? "success" : "muted"}
              pulsing={bme280?.online}
            />
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricBlock}>
              <Ionicons name="flame-outline" size={18} color={AppTheme.colors.danger} />
              <Text style={styles.metricValue}>
                {bme280?.temperature !== undefined ? bme280.temperature.toFixed(1) : "--"}
                <Text style={styles.metricUnit}> °C</Text>
              </Text>
              <Text style={styles.metricLabel}>Temperature</Text>
            </View>
            <View style={styles.metricBlock}>
              <Ionicons name="water-outline" size={18} color={AppTheme.colors.primary} />
              <Text style={styles.metricValue}>
                {bme280?.humidity ?? "--"}
                <Text style={styles.metricUnit}> %</Text>
              </Text>
              <Text style={styles.metricLabel}>Humidity</Text>
            </View>
            <View style={styles.metricBlock}>
              <Ionicons name="speedometer-outline" size={18} color={AppTheme.colors.secondary} />
              <Text style={styles.metricValue}>
                {bme280?.pressure ?? "--"}
                <Text style={styles.metricUnit}> hPa</Text>
              </Text>
              <Text style={styles.metricLabel}>Pressure</Text>
            </View>
          </View>
          {bme280?.espId && <Text style={styles.footerText}>Source: {bme280.espId}</Text>}
        </GlassCard>

        {/* BH1750 */}
        <GlassCard accent="cyan">
          <View style={styles.cardHeader}>
            <SectionTitle title="BH1750" icon="sunny-outline" iconColor={AppTheme.colors.warning} />
            <StatusBadge
              label={lux?.online ? "ACTIVE" : "OFFLINE"}
              tone={lux?.online ? "success" : "muted"}
              pulsing={lux?.online}
            />
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricBlock}>
              <Ionicons name="bulb-outline" size={18} color={AppTheme.colors.warning} />
              <Text style={styles.metricValue}>
                {lux?.lux ?? "--"}
                <Text style={styles.metricUnit}> lx</Text>
              </Text>
              <Text style={styles.metricLabel}>Luminosity</Text>
            </View>
            <View style={[styles.metricBlock, styles.metricBlockWide]}>
              <Ionicons
                name={lux?.state === "DAY" ? "sunny" : "moon"}
                size={18}
                color={lux?.state === "DAY" ? AppTheme.colors.warning : AppTheme.colors.primary}
              />
              <Text
                style={[
                  styles.stateValue,
                  { color: lux?.state === "DAY" ? AppTheme.colors.warning : AppTheme.colors.primary },
                ]}
              >
                {lux?.state ?? "--"}
              </Text>
              <Text style={styles.metricLabel}>State</Text>
            </View>
          </View>
          {lux?.espId && <Text style={styles.footerText}>Source: {lux.espId}</Text>}
        </GlassCard>

        {/* Actuators */}
        <GlassCard accent="green">
          <View style={styles.cardHeader}>
            <SectionTitle title="Actuators" icon="flash-outline" iconColor={AppTheme.colors.secondary} />
            <StatusBadge
              label={actuators ? "ACTIVE" : "IDLE"}
              tone={actuators ? "success" : "muted"}
            />
          </View>
          <View style={styles.actuatorRow}>
            <View style={[styles.actuatorBlock, actuators?.fan && styles.actuatorBlockOn]}>
              <Ionicons
                name="sync-outline"
                size={24}
                color={actuators?.fan ? AppTheme.colors.secondary : AppTheme.colors.textMuted}
              />
              <Text style={[styles.actuatorLabel, actuators?.fan && styles.actuatorLabelOn]}>
                Fan
              </Text>
              <Text style={[styles.actuatorState, actuators?.fan ? styles.stateOn : styles.stateOff]}>
                {actuators?.fan === undefined ? "--" : actuators.fan ? "ON" : "OFF"}
              </Text>
            </View>
            <View style={[styles.actuatorBlock, actuators?.light && styles.actuatorBlockOn]}>
              <Ionicons
                name="bulb-outline"
                size={24}
                color={actuators?.light ? AppTheme.colors.warning : AppTheme.colors.textMuted}
              />
              <Text style={[styles.actuatorLabel, actuators?.light && styles.actuatorLabelOn]}>
                Light
              </Text>
              <Text style={[styles.actuatorState, actuators?.light ? styles.stateOn : styles.stateOff]}>
                {actuators?.light === undefined ? "--" : actuators.light ? "ON" : "OFF"}
              </Text>
            </View>
          </View>
          {actuators?.espId && <Text style={styles.footerText}>Controller: {actuators.espId}</Text>}
        </GlassCard>

        {/* System Status */}
        <GlassCard>
          <View style={styles.cardHeader}>
            <SectionTitle title="System" icon="server-outline" iconColor={AppTheme.colors.textMuted} />
          </View>
          <View style={styles.sysGrid}>
            <View style={styles.sysRow}>
              <View style={styles.sysBlock}>
                <Text style={styles.sysLabel}>MQTT</Text>
                <View style={styles.sysValueRow}>
                  <AnimatedStatusDot active={connected} size={8} />
                  <Text style={styles.sysValue}>{mqttBadgeLabel}</Text>
                </View>
              </View>
              <View style={styles.sysBlock}>
                <Text style={styles.sysLabel}>Cluster</Text>
                <Text style={styles.sysValue}>{systemStatus.clusterStatus}</Text>
              </View>
            </View>
            <View style={styles.sysRow}>
              <View style={styles.sysBlock}>
                <Text style={styles.sysLabel}>Active ESPs</Text>
                <Text style={styles.sysValue}>
                  {systemStatus.activeEsps}
                  <Text style={styles.sysUnit}> / 4</Text>
                </Text>
              </View>
              <View style={styles.sysBlock}>
                <Text style={styles.sysLabel}>Last Packet</Text>
                <Text style={styles.sysValue}>
                  {formatRelativeTime(systemStatus.lastPacketAt)}
                </Text>
              </View>
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
    paddingBottom: 32,
  },
  headerSection: {
    marginBottom: AppTheme.spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  brokerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: AppTheme.radius.full,
  },
  brokerText: {
    color: AppTheme.colors.textOnDark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppTheme.spacing.sm,
  },

  // Metrics grid (BME + BH1750)
  metricsGrid: {
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: AppTheme.colors.cardSecondary,
    borderRadius: AppTheme.radius.md,
    padding: AppTheme.spacing.sm,
    gap: 4,
  },
  metricBlockWide: {
    flex: 1.5,
  },
  metricValue: {
    color: AppTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: AppTheme.colors.textMuted,
  },
  metricLabel: {
    color: AppTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stateValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },

  // Actuators
  actuatorRow: {
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
  },
  actuatorBlock: {
    flex: 1,
    backgroundColor: AppTheme.colors.cardSecondary,
    borderRadius: AppTheme.radius.md,
    padding: AppTheme.spacing.md,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  actuatorBlockOn: {
    backgroundColor: AppTheme.colors.secondary === "#4ade80"
      ? "rgba(74, 222, 128, 0.12)" : "rgba(74, 222, 128, 0.12)",
    borderColor: AppTheme.colors.secondary,
  },
  actuatorLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: AppTheme.colors.textSecondary,
  },
  actuatorLabelOn: {
    color: AppTheme.colors.secondary,
  },
  actuatorState: {
    fontSize: 14,
    fontWeight: "800",
  },

  // System
  sysGrid: {
    gap: AppTheme.spacing.sm,
  },
  sysRow: {
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
  },
  sysBlock: {
    flex: 1,
    backgroundColor: AppTheme.colors.cardSecondary,
    borderRadius: AppTheme.radius.md,
    padding: AppTheme.spacing.sm,
    gap: 4,
  },
  sysLabel: {
    color: AppTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sysValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sysValue: {
    color: AppTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  sysUnit: {
    fontSize: 12,
    fontWeight: "500",
    color: AppTheme.colors.textMuted,
  },

  // Shared
  footerText: {
    color: AppTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  stateOn: {
    color: AppTheme.colors.secondary,
  },
  stateOff: {
    color: AppTheme.colors.textMuted,
  },
});
