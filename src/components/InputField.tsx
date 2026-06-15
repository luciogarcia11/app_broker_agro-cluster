import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";

interface InputFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  helperText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function InputField({
  label,
  value,
  placeholder,
  onChangeText,
  secureTextEntry,
  helperText,
  icon,
}: InputFieldProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {icon && (
          <Ionicons name={icon} size={14} color={theme.colors.textMuted} style={styles.labelIcon} />
        )}
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      </View>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          { backgroundColor: theme.colors.cardSecondary, color: theme.colors.textPrimary },
        ]}
      />
      {helperText && (
        <Text style={[styles.helper, { color: theme.colors.textMuted }]}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "transparent",
  },
  helper: {
    fontSize: 11,
    lineHeight: 15,
  },
});
