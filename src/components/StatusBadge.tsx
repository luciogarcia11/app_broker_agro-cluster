import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppTheme } from "../styles/theme";

interface StatusBadgeProps {
  label: string;
  tone: "success" | "muted" | "warning" | "danger";
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const toneColor = {
    success: AppTheme.colors.success,
    muted: AppTheme.colors.textMuted,
    warning: AppTheme.colors.warning,
    danger: AppTheme.colors.danger,
  }[tone];

  return (
    <View style={[styles.badge, { borderColor: toneColor }]}>
      <View style={[styles.dot, { backgroundColor: toneColor }]} />
      <Text style={[styles.text, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
