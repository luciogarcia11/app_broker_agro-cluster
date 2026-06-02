import React, { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppTheme } from "../styles/theme";

interface GradientBackgroundProps {
  children: ReactNode;
}

export function GradientBackground({ children }: GradientBackgroundProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          AppTheme.colors.backgroundStart,
          AppTheme.colors.backgroundMid,
          AppTheme.colors.backgroundEnd,
          "rgba(34, 211, 238, 0.04)",
        ]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
