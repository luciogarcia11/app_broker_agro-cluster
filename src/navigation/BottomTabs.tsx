import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, View } from "react-native";

import { ControlsScreen } from "../screens/ControlsScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { EspsScreen } from "../screens/EspsScreen";
import { MqttScreen } from "../screens/MqttScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useTheme } from "../contexts/ThemeContext";

export type BottomTabParamList = {
  Dashboard: undefined;
  ESPs: undefined;
  Controls: undefined;
  MQTT: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const ICON_MAP: Record<
  string,
  { active: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }
> = {
  Dashboard: { active: "pulse", outline: "pulse-outline" },
  ESPs: { active: "hardware-chip", outline: "hardware-chip-outline" },
  Controls: { active: "game-controller", outline: "game-controller-outline" },
  MQTT: { active: "cloud", outline: "cloud-outline" },
  Settings: { active: "settings", outline: "settings-outline" },
};

export function BottomTabs() {
  const { theme } = useTheme();
  const isDark = theme.navigation.colors.card !== "#ffffff";
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(15, 26, 43, 0.4)",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
        tabBarStyle: {
          backgroundColor: isDark ? "#0a1d38" : "#ffffff",
          borderTopColor: isDark ? "rgba(34, 211, 238, 0.12)" : "rgba(8, 145, 178, 0.12)",
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
          shadowColor: isDark ? "#000" : theme.colors.black,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 6,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = ICON_MAP[route.name];
          return (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={focused ? icons.active : icons.outline} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: "Painel" }}
      />
      <Tab.Screen name="ESPs" component={EspsScreen} />
      <Tab.Screen
        name="Controls"
        component={ControlsScreen}
        options={{ tabBarLabel: "Controles" }}
      />
      <Tab.Screen name="MQTT" component={MqttScreen} />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: "Configurações" }}
      />
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
