import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { AnimatedStatusDot } from "../components/AnimatedStatusDot";
import { SectionTitle } from "../components/SectionTitle";
import { useMqtt } from "../hooks/useMqtt";
import { AppTheme } from "../styles/theme";
import { formatRelativeTime } from "../utils/time";
import type { EspRole } from "../types/esp";

const ROLE_ICONS: Record<EspRole, keyof typeof Ionicons.glyphMap> = {
  Leader: "shield-checkmark",
  Sensor: "pulse",
  Actuator: "flash",
  Relay: "git-merge",
};

const ROLE_COLORS: Record<EspRole, string> = {
  Leader: AppTheme.colors.warning,
  Sensor: AppTheme.colors.primary,
  Actuator: AppTheme.colors.secondary,
  Relay: AppTheme.colors.danger,
};

function SignalBars({ rssi }: { rssi: number }) {
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
              backgroundColor: i < bars ? colors[i] : "rgba(255,255,255,0.15)",
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
  const { espNodes } = useMqtt();

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>ESP Cluster</Text>
          <Text style={styles.subtitle}>
            {espNodes.length} node{espNodes.length !== 1 ? "s" : ""} ·{" "}
            {espNodes.filter((n) => n.online).length} online
          </Text>
          <View style={styles.headerAccent} />
        </View>

        {espNodes.length === 0 ? (
          <GlassCard>
            <View style={styles.emptyContainer}>
              <Ionicons name="hardware-chip-outline" size={48} color={AppTheme.colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum ESP recebido ainda.</Text>
              <Text style={styles.emptyHint}>Aguardando dados dos sensores...</Text>
            </View>
          </GlassCard>
        ) : (
          espNodes.map((node) => (
            <GlassCard key={node.id} accent={node.online ? "green" : "none"}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons
                    name={ROLE_ICONS[node.role]}
                    size={20}
                    color={ROLE_COLORS[node.role]}
                  />
                  <Text style={styles.nodeId}>{node.id}</Text>
                </View>
                <View style={styles.statusRow}>
                  <AnimatedStatusDot active={node.online} size={10} />
                  <Text style={[styles.statusText, { color: node.online ? AppTheme.colors.success : AppTheme.colors.textMuted }]}>
                    {node.online ? "ONLINE" : "OFFLINE"}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Role</Text>
                  <View style={styles.metaValueRow}>
                    <View style={[styles.roleDot, { backgroundColor: ROLE_COLORS[node.role] }]} />
                    <Text style={styles.metaValue}>{node.role}</Text>
                  </View>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Signal</Text>
                  <View style={styles.metaValueRow}>
                    <SignalBars rssi={node.rssi} />
                    <Text style={styles.metaValue}>{node.rssi} dBm</Text>
                  </View>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>MAC</Text>
                  <Text style={styles.metaValueMono}>{node.mac}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Battery</Text>
                  <Text style={[styles.metaValue, !node.battery && styles.metaValueMuted]}>
                    {node.battery ? `${node.battery}%` : "N/A"}
                  </Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={14} color={AppTheme.colors.textMuted} />
                <Text style={styles.timeText}>Last seen: {formatRelativeTime(node.lastSeen)}</Text>
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: AppTheme.spacing.sm,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nodeId: {
    fontSize: 16,
    fontWeight: "700",
    color: AppTheme.colors.textPrimary,
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
    gap: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.sm,
  },
  metaBlock: {
    flex: 1,
    backgroundColor: AppTheme.colors.cardSecondary,
    borderRadius: AppTheme.radius.md,
    padding: AppTheme.spacing.sm,
  },
  metaLabel: {
    color: AppTheme.colors.textMuted,
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
    color: AppTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  metaValueMono: {
    color: AppTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  metaValueMuted: {
    color: AppTheme.colors.textMuted,
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
    color: AppTheme.colors.textMuted,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: AppTheme.spacing.lg,
    gap: 8,
  },
  emptyText: {
    color: AppTheme.colors.textMuted,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyHint: {
    color: AppTheme.colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    opacity: 0.7,
  },
});
