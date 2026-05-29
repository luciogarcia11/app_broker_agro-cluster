import React from "react";
import { StyleSheet, Text, TextStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppTheme } from "../styles/theme";

interface SectionTitleProps {
  title: string;
  style?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function SectionTitle({ title, style, icon, iconColor }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={iconColor ?? AppTheme.colors.textPrimary}
          style={styles.icon}
        />
      )}
      <Text style={[styles.title, style]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: AppTheme.colors.textPrimary,
    letterSpacing: 0.3,
  },
});
