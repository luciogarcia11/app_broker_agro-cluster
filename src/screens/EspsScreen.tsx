import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { AnimatedStatusDot } from "../components/AnimatedStatusDot";
import { useMqtt } from "../hooks/useMqtt";
import { useTheme } from "../contexts/ThemeContext";
import { formatRelativeTime } from "../utils/time";
import type { EspRole } from "../types/esp";

const ROLE_ICONS: Record<EspRole, keyof typeof Ionicons.glyphMap> = {
  Leader: "shield-checkmark",
  Sensor: "pulse",
  Actuator: "flash",
  Relay: "git-merge",
};

function SignalBars({ rssi }: { rssi: number }) {
  const { themeMode } = useTheme();
  const isDark = themeMode === "dark";
  const bars = rssi === 0 ? 0 : rssi > -50 ? 4 : rssi > -70 ? 3 : rssi > -85 ? 2 : 1;
  const colors = ["#f87171", "#fbbf24", "#4ade80", "#22d3ee"];

  return (
    <View style={signalStyles.row}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            signalStyles.bar,
            {
              height: 6 + i * 4,
              backgroundColor:
                i < bars ? colors[i] : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
            },
          ]}
        />
      ))}
    </View>
  );
}

const signalStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  bar: {
    width: 5,
    borderRadius: 3,
  },
});

export function EspsScreen() {
  const { theme } = useTheme();
  const { espNodes } = useMqtt();

  const ROLE_COLORS: Record<EspRole, string> = {
    Leader: theme.colors.warning,
    Sensor: theme.colors.primary,
    Actuator: theme.colors.secondary,
    Relay: theme.colors.danger,
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: theme.colors.textOnDark }]}>Cluster ESP</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {espNodes.length} dispositivo{espNodes.length !== 1 ? "s" : ""} ·{" "}
            {espNodes.filter((n) => n.online).length} online
          </Text>
          <View style={[styles.headerAccent, { backgroundColor: theme.colors.primary }]} />
        </View>

        {espNodes.length === 0 ? (
          <GlassCard>
            <View style={styles.emptyContainer}>
              <Ionicons name="hardware-chip-outline" size={48} color={theme.colors.textMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
                Nenhum ESP recebido ainda.
              </Text>
              <Text style={[styles.emptyHint, { color: theme.colors.textMuted }]}>
                Aguardando dados dos sensores...
              </Text>
            </View>
          </GlassCard>
        ) : (
          espNodes.map((node) => (
            <GlassCard key={node.id} accent={node.online ? "green" : "none"}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name={ROLE_ICONS[node.role]} size={20} color={ROLE_COLORS[node.role]} />
                  <Text style={[styles.nodeId, { color: theme.colors.textPrimary }]}>
                    {node.id}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <AnimatedStatusDot active={node.online} size={10} />
                  <Text
                    style={[
                      styles.statusText,
                      { color: node.online ? theme.colors.success : theme.colors.textMuted },
                    ]}
                  >
                    {node.online ? "ONLINE" : "OFFLINE"}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={[styles.metaBlock, { backgroundColor: theme.colors.cardSecondary }]}>
                  <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>Função</Text>
                  <View style={styles.metaValueRow}>
                    <View style={[styles.roleDot, { backgroundColor: ROLE_COLORS[node.role] }]} />
                    <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
                      {node.role}
                    </Text>
                  </View>
                </View>
                <View style={[styles.metaBlock, { backgroundColor: theme.colors.cardSecondary }]}>
                  <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>Sinal</Text>
                  <View style={styles.metaValueRow}>
                    <SignalBars rssi={node.rssi} />
                    <Text style={[styles.metaValue, { color: theme.colors.textPrimary }]}>
                      {node.rssi} dBm
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={[styles.metaBlock, { backgroundColor: theme.colors.cardSecondary }]}>
                  <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>MAC</Text>
                  <Text style={[styles.metaValueMono, { color: theme.colors.textPrimary }]}>
                    {node.mac}
                  </Text>
                </View>
                <View style={[styles.metaBlock, { backgroundColor: theme.colors.cardSecondary }]}>
                  <Text style={[styles.metaLabel, { color: theme.colors.textMuted }]}>Bateria</Text>
                  <Text
                    style={[
                      styles.metaValue,
                      { color: theme.colors.textPrimary },
                      !node.battery && { color: theme.colors.textMuted },
                    ]}
                  >
                    {node.battery ? `${node.battery}%` : "N/D"}
                  </Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
                <Text style={[styles.timeText, { color: theme.colors.textMuted }]}>
                  Visto por último: {formatRelativeTime(node.lastSeen)}
                </Text>
              </View>
            </GlassCard>
          ))
        )}
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nodeId: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  metaBlock: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  metaValueMono: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 13,
    textAlign: "center",
    opacity: 0.7,
  },
});
