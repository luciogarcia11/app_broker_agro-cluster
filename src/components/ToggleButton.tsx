import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { AppTheme } from "../styles/theme";

interface ToggleButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function ToggleButton({ label, active, onPress, disabled, style }: ToggleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        active ? styles.active : styles.inactive,
        (pressed || disabled) && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: AppTheme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  active: {
    backgroundColor: AppTheme.colors.accentGreen,
  },
  inactive: {
    backgroundColor: AppTheme.colors.cardSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  labelActive: {
    color: AppTheme.colors.textPrimary,
  },
  labelInactive: {
    color: AppTheme.colors.textMuted,
  },
});
