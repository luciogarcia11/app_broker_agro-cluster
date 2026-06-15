import React, { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { useTheme } from "../contexts/ThemeContext";

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
  accent?: "none" | "cyan" | "green";
}

export function GlassCard({ children, style, intensity = 20, accent = "none" }: GlassCardProps) {
  const { theme } = useTheme();

  const accentColor =
    accent === "cyan"
      ? theme.colors.primary
      : accent === "green"
        ? theme.colors.secondary
        : "transparent";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.cardPrimary, borderColor: theme.colors.cardGlassBorder },
        theme.shadows.md,
        style,
      ]}
    >
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 1,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  content: {
    padding: 24,
    gap: 10,
  },
});
