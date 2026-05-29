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
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    borderRadius: AppTheme.radius.md,
    backgroundColor: AppTheme.colors.cardSecondary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: AppTheme.colors.textPrimary,
  },
});
