import { DefaultTheme } from "@react-navigation/native";

const colors = {
  backgroundStart: "#0b1f3b",
  backgroundEnd: "#0f2b4d",
  cardPrimary: "#ffffff",
  cardSecondary: "#f3f9ff",
  accentBlue: "#7dd3fc",
  accentGreen: "#9ae6b4",
  textPrimary: "#0f1a2b",
  textMuted: "#5f7a93",
  danger: "#e45d5d",
  success: "#38c172",
  warning: "#f59e0b",
  white: "#ffffff",
};

const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};

const shadow = {
  soft: {
    shadowColor: "#0b1f3b",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
    elevation: 8,
  },
};

export const AppTheme = {
  colors,
  spacing,
  radius,
  shadow,
  navigation: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.backgroundStart,
      card: "#0c2342",
      text: colors.white,
      border: "#173459",
      primary: colors.accentBlue,
      notification: colors.accentGreen,
    },
  },
};
