import { DefaultTheme } from "@react-navigation/native";

const colors = {
  // Background
  backgroundStart: "#0a1628",
  backgroundMid: "#0d1f3c",
  backgroundEnd: "#112b4a",

  // Cards
  cardPrimary: "rgba(255, 255, 255, 0.92)",
  cardSecondary: "rgba(243, 249, 255, 0.7)",
  cardGlass: "rgba(255, 255, 255, 0.08)",
  cardGlassBorder: "rgba(125, 211, 252, 0.18)",

  // Accents
  primary: "#22d3ee",
  primaryDark: "#0891b2",
  secondary: "#4ade80",
  secondaryDark: "#16a34a",

  // Status
  success: "#4ade80",
  successBg: "rgba(74, 222, 128, 0.12)",
  warning: "#fbbf24",
  warningBg: "rgba(251, 191, 36, 0.12)",
  danger: "#f87171",
  dangerBg: "rgba(248, 113, 113, 0.12)",

  // Text
  textPrimary: "#0f1a2b",
  textSecondary: "#334155",
  textMuted: "#6b8aa8",
  textOnDark: "#ffffff",

  // Misc
  white: "#ffffff",
  black: "#000000",
  divider: "rgba(0, 0, 0, 0.06)",
  blueGlow: "rgba(34, 211, 238, 0.15)",
  greenGlow: "rgba(74, 222, 128, 0.15)",
};

const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
};

const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 10,
  },
};

const typography = {
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  label: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
};

export const AppTheme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  navigation: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.backgroundStart,
      card: "#0a1d38",
      text: colors.textOnDark,
      border: "rgba(125, 211, 252, 0.15)",
      primary: colors.primary,
      notification: colors.secondary,
    },
  },
};
