import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppTheme } from "../styles/theme";

interface ToggleButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ToggleButton({
  label,
  active,
  onPress,
  disabled,
  style,
  icon,
}: ToggleButtonProps) {
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
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={active ? AppTheme.colors.textPrimary : AppTheme.colors.textMuted}
          style={styles.icon}
        />
      )}
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: AppTheme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flex: 1,
    borderWidth: 1,
  },
  active: {
    backgroundColor: AppTheme.colors.secondary,
    borderColor: AppTheme.colors.secondaryDark,
    ...AppTheme.shadows.sm,
  },
  inactive: {
    backgroundColor: AppTheme.colors.cardSecondary,
    borderColor: "transparent",
  },
  pressed: {
    opacity: 0.6,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  labelActive: {
    color: AppTheme.colors.textPrimary,
  },
  labelInactive: {
    color: AppTheme.colors.textMuted,
  },
});
