import React, { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { AppTheme } from "../styles/theme";

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 24 }: GlassCardProps) {
  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderRadius: AppTheme.radius.lg,
    padding: AppTheme.spacing.lg,
    marginBottom: AppTheme.spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.28)",
    ...AppTheme.shadow.soft,
  },
  content: {
    gap: AppTheme.spacing.sm,
  },
});
