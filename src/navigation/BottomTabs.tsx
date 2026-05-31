import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { DashboardScreen } from "../screens/DashboardScreen";
import { EspsScreen } from "../screens/EspsScreen";
import { ControlsScreen } from "../screens/ControlsScreen";
import { MqttScreen } from "../screens/MqttScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AppTheme } from "../styles/theme";

export type BottomTabParamList = {
  Dashboard: undefined;
  ESPs: undefined;
  Controls: undefined;
  MQTT: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const ICON_MAP: Record<string, { active: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }> = {
  Dashboard: { active: "pulse", outline: "pulse-outline" },
  ESPs: { active: "hardware-chip", outline: "hardware-chip-outline" },
  Controls: { active: "game-controller", outline: "game-controller-outline" },
  MQTT: { active: "cloud", outline: "cloud-outline" },
  Settings: { active: "settings", outline: "settings-outline" },
};

export function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.35)",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
        tabBarStyle: {
          backgroundColor: "#0a1d38",
          borderTopColor: "rgba(34, 211, 238, 0.12)",
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 24,
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = ICON_MAP[route.name];
          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons
                name={focused ? icons.active : icons.outline}
                size={size}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="ESPs" component={EspsScreen} />
      <Tab.Screen name="Controls" component={ControlsScreen} />
      <Tab.Screen name="MQTT" component={MqttScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    transform: [{ scale: 1.1 }],
  },
});