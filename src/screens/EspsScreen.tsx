import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { GradientBackground } from "../components/GradientBackground";
import { GlassCard } from "../components/GlassCard";
import { AnimatedStatusDot } from "../components/AnimatedStatusDot";
import { SectionTitle } from "../components/SectionTitle";
import { useMqtt } from "../hooks/useMqtt";
import { AppTheme } from "../styles/theme";
import { formatRelativeTime } from "../utils/time";

export function EspsScreen() {
  const { espNodes } = useMqtt();

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>ESP Cluster</Text>
        <Text style={styles.subtitle}>Live node telemetry</Text>

        {espNodes.length === 0 ? (
          <GlassCard>
            <Text style={styles.emptyText}>No ESP nodes received yet.</Text>
          </GlassCard>
        ) : (
          espNodes.map((node) => (
            <GlassCard key={node.id}>
              <View style={styles.cardHeader}>
                <SectionTitle title={node.id} />
                <View style={styles.statusRow}>
                  <AnimatedStatusDot active={node.online} />
                  <Text style={styles.statusText}>{node.online ? "ONLINE" : "OFFLINE"}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Role</Text>
                  <Text style={styles.metaValue}>{node.role}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>RSSI</Text>
                  <Text style={styles.metaValue}>{node.rssi} dBm</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>MAC</Text>
                  <Text style={styles.metaValue}>{node.mac}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Battery</Text>
                  <Text style={styles.metaValue}>{node.battery ? `${node.battery}%` : "N/A"}</Text>
                </View>
              </View>
              <Text style={styles.timeText}>Last seen: {formatRelativeTime(node.lastSeen)}</Text>
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    color: AppTheme.colors.textPrimary,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.sm,
  },
  metaBlock: {
    flex: 1,
    backgroundColor: "rgba(243, 249, 255, 0.7)",
    borderRadius: AppTheme.radius.md,
    padding: AppTheme.spacing.sm,
  },
  metaLabel: {
    color: AppTheme.colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
  },
  metaValue: {
    color: AppTheme.colors.textPrimary,
    fontWeight: "600",
    marginTop: 4,
  },
  timeText: {
    color: AppTheme.colors.textMuted,
    fontSize: 12,
  },
  emptyText: {
    color: AppTheme.colors.textMuted,
    textAlign: "center",
  },
});
