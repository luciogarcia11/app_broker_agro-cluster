import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";

interface ToggleButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ToggleButton({ label, active, onPress, disabled, style, icon }: ToggleButtonProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: active ? theme.colors.secondary : theme.colors.cardSecondary,
          borderColor: active ? theme.colors.secondaryDark : "transparent",
        },
        (pressed || disabled) && styles.pressed,
        active && theme.shadows.sm,
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={active ? theme.colors.textPrimary : theme.colors.textMuted}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          { color: active ? theme.colors.textPrimary : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flex: 1,
    borderWidth: 1,
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
});
