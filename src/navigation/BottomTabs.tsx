import React from "react";
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

export function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: AppTheme.colors.accentBlue,
        tabBarInactiveTintColor: "#93a9c4",
        tabBarStyle: {
          backgroundColor: "#0d2342",
          borderTopColor: "#173459",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: "pulse",
            ESPs: "hardware-chip",
            Controls: "game-controller",
            MQTT: "cloud",
            Settings: "settings",
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
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
