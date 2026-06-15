import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../contexts/ThemeContext";

interface StatusBadgeProps {
  label: string;
  tone: "success" | "muted" | "warning" | "danger";
  pulsing?: boolean;
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const { theme } = useTheme();

  const toneColor = {
    success: theme.colors.success,
    muted: theme.colors.textMuted,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
  }[tone];

  const bgColor = {
    success: theme.colors.successBg,
    muted: "transparent",
    warning: theme.colors.warningBg,
    danger: theme.colors.dangerBg,
  }[tone];

  return (
    <View style={[styles.badge, { borderColor: toneColor, backgroundColor: bgColor }]}>
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
