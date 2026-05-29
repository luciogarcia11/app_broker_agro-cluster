import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, ViewStyle } from "react-native";

import { AppTheme } from "../styles/theme";

interface AnimatedStatusDotProps {
  active: boolean;
  style?: ViewStyle;
  size?: number;
}

export function AnimatedStatusDot({ active, style, size = 10 }: AnimatedStatusDotProps) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1.5, duration: 1200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      anim.stopAnimation();
      Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }

    return () => anim.stopAnimation();
  }, [active, anim]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? AppTheme.colors.success : AppTheme.colors.textMuted,
          transform: [{ scale: anim }],
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {},
});
