import React, { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { AppTheme } from "../styles/theme";

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
  accent?: "none" | "cyan" | "green";
}

export function GlassCard({ children, style, intensity = 20, accent = "none" }: GlassCardProps) {
  const accentColor =
    accent === "cyan"
      ? AppTheme.colors.primary
      : accent === "green"
        ? AppTheme.colors.secondary
        : "transparent";

  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppTheme.colors.cardPrimary,
    borderRadius: AppTheme.radius.lg,
    marginBottom: AppTheme.spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: AppTheme.colors.cardGlassBorder,
    ...AppTheme.shadows.md,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  content: {
    padding: AppTheme.spacing.lg,
    gap: AppTheme.spacing.sm,
  },
});
