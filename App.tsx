import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { enableScreens } from "react-native-screens";

import { MqttProvider } from "./src/contexts/MqttContext";
import { AppTheme } from "./src/styles/theme";
import { BottomTabs } from "./src/navigation/BottomTabs";

enableScreens();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <MqttProvider>
        <NavigationContainer theme={AppTheme.navigation}>
          <BottomTabs />
        </NavigationContainer>
      </MqttProvider>
    </SafeAreaProvider>
  );
}
