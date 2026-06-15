import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { SectionTitle } from "../components/SectionTitle";
import { StatusBadge } from "../components/StatusBadge";
import { AnimatedStatusDot } from "../components/AnimatedStatusDot";
import { useMqtt } from "../hooks/useMqtt";
import { useTheme } from "../contexts/ThemeContext";
import { formatRelativeTime } from "../utils/time";
import {
  getTempStatus,
  getHumidityStatus,
  getPressureStatus,
  statusToLabel,
  statusToTone,
} from "../utils/sensorStatus";

export function DashboardScreen() {
  const { theme } = useTheme();
  const { bme280, lux, actuators, mqttState, systemStatus } = useMqtt();

  const connected = mqttState.status === "connected";
  const mqttBadgeLabel = connected ? "ONLINE" : "OFFLINE";

  const tempStatus = bme280?.temperature !== undefined ? getTempStatus(bme280.temperature) : null;
  const humStatus = bme280?.humidity !== undefined ? getHumidityStatus(bme280.humidity) : null;
  const pressStatus = bme280?.pressure !== undefined ? getPressureStatus(bme280.pressure) : null;

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: theme.colors.textOnDark }]}>Agro-Cluster</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                Mini estufa · Monitoramento em tempo real
              </Text>
            </View>
            <View style={[styles.brokerRow, { backgroundColor: theme.colors.cardGlass }]}>
              <AnimatedStatusDot active={connected} size={10} style={{ marginRight: 4 }} />
              <Text style={[styles.brokerText, { color: theme.colors.textOnDark }]}>
                {connected ? "ONLINE" : mqttBadgeLabel}
              </Text>
            </View>
          </View>
          <View style={[styles.headerAccent, { backgroundColor: theme.colors.primary }]} />
        </View>

        {/* BME280 */}
        <GlassCard accent="cyan">
          <View style={styles.cardHeader}>
            <SectionTitle
              title="BME280"
              icon="thermometer-outline"
              iconColor={theme.colors.primary}
            />
            <StatusBadge
              label={bme280?.online ? "ATIVO" : "OFFLINE"}
              tone={bme280?.online ? "success" : "muted"}
              pulsing={bme280?.online}
            />
          </View>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricBlock, { backgroundColor: theme.colors.cardSecondary }]}>
              <Ionicons name="flame-outline" size={18} color={theme.colors.danger} />
              <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                {bme280?.temperature !== undefined ? bme280.temperature.toFixed(1) : "--"}
                <Text style={[styles.metricUnit, { color: theme.colors.textMuted }]}> °C</Text>
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                Temperatura
              </Text>
              {tempStatus && (
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: theme.colors[statusToTone(tempStatus)] },
                    ]}
                  />
                  <Text
                    style={[styles.statusText, { color: theme.colors[statusToTone(tempStatus)] }]}
                  >
                    {statusToLabel(tempStatus)}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.metricBlock, { backgroundColor: theme.colors.cardSecondary }]}>
              <Ionicons name="water-outline" size={18} color={theme.colors.primary} />
              <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                {bme280?.humidity ?? "--"}
                <Text style={[styles.metricUnit, { color: theme.colors.textMuted }]}> %</Text>
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Umidade</Text>
              {humStatus && (
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: theme.colors[statusToTone(humStatus)] },
                    ]}
                  />
                  <Text
                    style={[styles.statusText, { color: theme.colors[statusToTone(humStatus)] }]}
                  >
                    {statusToLabel(humStatus)}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.metricBlock, { backgroundColor: theme.colors.cardSecondary }]}>
              <Ionicons name="speedometer-outline" size={18} color={theme.colors.secondary} />
              <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                {bme280?.pressure ?? "--"}
                <Text style={[styles.metricUnit, { color: theme.colors.textMuted }]}> hPa</Text>
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Pressão</Text>
              {pressStatus && (
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: theme.colors[statusToTone(pressStatus)] },
                    ]}
                  />
                  <Text
                    style={[styles.statusText, { color: theme.colors[statusToTone(pressStatus)] }]}
                  >
                    {statusToLabel(pressStatus)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {bme280?.espId && (
            <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
              Fonte: {bme280.espId}
            </Text>
          )}
        </GlassCard>

        {/* BH1750 */}
        <GlassCard accent="cyan">
          <View style={styles.cardHeader}>
            <SectionTitle title="BH1750" icon="sunny-outline" iconColor={theme.colors.warning} />
            <StatusBadge
              label={lux?.online ? "ATIVO" : "OFFLINE"}
              tone={lux?.online ? "success" : "muted"}
              pulsing={lux?.online}
            />
          </View>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricBlock, { backgroundColor: theme.colors.cardSecondary }]}>
              <Ionicons name="bulb-outline" size={18} color={theme.colors.warning} />
              <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                {lux?.lux ?? "--"}
                <Text style={[styles.metricUnit, { color: theme.colors.textMuted }]}> lx</Text>
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                Luminosidade
              </Text>
            </View>
            <View
              style={[
                styles.metricBlock,
                styles.metricBlockWide,
                { backgroundColor: theme.colors.cardSecondary },
              ]}
            >
              <Ionicons
                name={lux?.state === "DAY" ? "sunny" : "moon"}
                size={18}
                color={lux?.state === "DAY" ? theme.colors.warning : theme.colors.primary}
              />
              <Text
                style={[
                  styles.stateValue,
                  {
                    color: lux?.state === "DAY" ? theme.colors.warning : theme.colors.primary,
                  },
                ]}
              >
                {lux?.state ?? "--"}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>Estado</Text>
            </View>
          </View>
          {lux?.espId && (
            <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
              Source: {lux.espId}
            </Text>
          )}
        </GlassCard>

        {/* Actuators */}
        <GlassCard accent="green">
          <View style={styles.cardHeader}>
            <SectionTitle
              title="Atuadores"
              icon="flash-outline"
              iconColor={theme.colors.secondary}
            />
            <StatusBadge
              label={actuators ? "ATIVO" : "INATIVO"}
              tone={actuators ? "success" : "muted"}
            />
          </View>
          <View style={styles.actuatorRow}>
            <View
              style={[
                styles.actuatorBlock,
                { backgroundColor: theme.colors.cardSecondary },
                actuators?.fan && styles.actuatorBlockOn,
                actuators?.fan && { borderColor: theme.colors.secondary },
              ]}
            >
              <Ionicons
                name="sync-outline"
                size={24}
                color={actuators?.fan ? theme.colors.secondary : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.actuatorLabel,
                  { color: theme.colors.textSecondary },
                  actuators?.fan && { color: theme.colors.secondary },
                ]}
              >
                Ventoinha
              </Text>
              <Text
                style={[
                  styles.actuatorState,
                  { color: actuators?.fan ? theme.colors.secondary : theme.colors.textMuted },
                ]}
              >
                {actuators?.fan === undefined ? "--" : actuators.fan ? "LIGADA" : "DESLIGADA"}
              </Text>
            </View>
            <View
              style={[
                styles.actuatorBlock,
                { backgroundColor: theme.colors.cardSecondary },
                actuators?.light && styles.actuatorBlockOn,
                actuators?.light && { borderColor: theme.colors.secondary },
              ]}
            >
              <Ionicons
                name="bulb-outline"
                size={24}
                color={actuators?.light ? theme.colors.warning : theme.colors.textMuted}
              />
              <Text
                style={[
                  styles.actuatorLabel,
                  { color: theme.colors.textSecondary },
                  actuators?.light && { color: theme.colors.secondary },
                ]}
              >
                Luz
              </Text>
              <Text
                style={[
                  styles.actuatorState,
                  { color: actuators?.light ? theme.colors.secondary : theme.colors.textMuted },
                ]}
              >
                {actuators?.light === undefined ? "--" : actuators.light ? "LIGADA" : "DESLIGADA"}
              </Text>
            </View>
          </View>
          {actuators?.espId && (
            <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
              Controlador: {actuators.espId}
            </Text>
          )}
        </GlassCard>

        {/* System Status */}
        <GlassCard>
          <View style={styles.cardHeader}>
            <SectionTitle
              title="Sistema"
              icon="server-outline"
              iconColor={theme.colors.textMuted}
            />
          </View>
          <View style={styles.sysGrid}>
            <View style={styles.sysRow}>
              <View style={[styles.sysBlock, { backgroundColor: theme.colors.cardSecondary }]}>
                <Text style={[styles.sysLabel, { color: theme.colors.textMuted }]}>MQTT</Text>
                <View style={styles.sysValueRow}>
                  <AnimatedStatusDot active={connected} size={8} />
                  <Text style={[styles.sysValue, { color: theme.colors.textPrimary }]}>
                    {mqttBadgeLabel}
                  </Text>
                </View>
              </View>
              <View style={[styles.sysBlock, { backgroundColor: theme.colors.cardSecondary }]}>
                <Text style={[styles.sysLabel, { color: theme.colors.textMuted }]}>Cluster</Text>
                <Text style={[styles.sysValue, { color: theme.colors.textPrimary }]}>
                  {systemStatus.clusterStatus}
                </Text>
              </View>
            </View>
            <View style={styles.sysRow}>
              <View style={[styles.sysBlock, { backgroundColor: theme.colors.cardSecondary }]}>
                <Text style={[styles.sysLabel, { color: theme.colors.textMuted }]}>
                  ESPs Ativos
                </Text>
                <Text style={[styles.sysValue, { color: theme.colors.textPrimary }]}>
                  {systemStatus.activeEsps}
                  <Text style={[styles.sysUnit, { color: theme.colors.textMuted }]}> / 4</Text>
                </Text>
              </View>
              <View style={[styles.sysBlock, { backgroundColor: theme.colors.cardSecondary }]}>
                <Text style={[styles.sysLabel, { color: theme.colors.textMuted }]}>
                  Último Pacote
                </Text>
                <Text style={[styles.sysValue, { color: theme.colors.textPrimary }]}>
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
    padding: 24,
    paddingTop: 56,
    paddingBottom: 80,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  brokerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  brokerText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    maxWidth: 80,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  // Metrics grid (BME + BH1750)
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metricBlock: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    gap: 4,
  },
  metricBlockWide: {
    flex: 1.5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: "600",
  },
  metricLabel: {
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Actuators
  actuatorRow: {
    flexDirection: "row",
    gap: 10,
  },
  actuatorBlock: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  actuatorBlockOn: {
    backgroundColor: "rgba(74, 222, 128, 0.12)",
  },
  actuatorLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  actuatorState: {
    fontSize: 14,
    fontWeight: "800",
  },

  // System
  sysGrid: {
    gap: 10,
  },
  sysRow: {
    flexDirection: "row",
    gap: 10,
  },
  sysBlock: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    gap: 4,
  },
  sysLabel: {
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
    fontSize: 16,
    fontWeight: "700",
  },
  sysUnit: {
    fontSize: 12,
    fontWeight: "500",
  },

  // Shared
  footerText: {
    fontSize: 12,
    marginTop: 2,
  },
});
