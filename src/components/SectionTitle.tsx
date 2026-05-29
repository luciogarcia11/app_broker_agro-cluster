import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";

import { AppTheme } from "../styles/theme";

interface SectionTitleProps {
  title: string;
  style?: TextStyle;
}

export function SectionTitle({ title, style }: SectionTitleProps) {
  return <Text style={[styles.title, style]}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: AppTheme.colors.textPrimary,
    letterSpacing: 0.4,
  },
});
