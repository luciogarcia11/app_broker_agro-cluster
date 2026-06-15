import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { enableScreens } from "react-native-screens";
import { MqttProvider } from "./src/contexts/MqttContext";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { BottomTabs } from "./src/navigation/BottomTabs";

enableScreens();

function AppContent() {
  const { theme, themeMode } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={themeMode === "dark" ? "light-content" : "dark-content"} />
      <MqttProvider>
        <NavigationContainer theme={theme.navigation}>
          <BottomTabs />
        </NavigationContainer>
      </MqttProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
