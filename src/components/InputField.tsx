import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppTheme } from "../styles/theme";

interface InputFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
}

export function InputField({
  label,
  value,
  placeholder,
  onChangeText,
  secureTextEntry,
}: InputFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={AppTheme.colors.textMuted}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: AppTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.cardSecondary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: AppTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "transparent",
  },
});
