import React from "react";
import { StyleSheet, Text, TextStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../contexts/ThemeContext";

interface SectionTitleProps {
  title: string;
  style?: TextStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function SectionTitle({ title, style, icon, iconColor }: SectionTitleProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={iconColor ?? theme.colors.textPrimary}
          style={styles.icon}
        />
      )}
      <Text style={[styles.title, { color: theme.colors.textPrimary }, style]}>{title}</Text>
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
    letterSpacing: 0.3,
  },
});
