import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";

import { AppTheme } from "../styles/theme";

interface AnimatedStatusDotProps {
  active: boolean;
  style?: ViewStyle;
}

export function AnimatedStatusDot({ active, style }: AnimatedStatusDotProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.6, duration: 1200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [active, scale]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: active ? AppTheme.colors.success : AppTheme.colors.textMuted },
        style,
        active && { transform: [{ scale }] },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
