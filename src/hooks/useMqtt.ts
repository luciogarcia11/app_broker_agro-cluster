import { useContext } from "react";
import { MqttContext } from "../contexts/MqttContext";

export function useMqtt() {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error("useMqtt must be used within MqttProvider");
  }
  return context;
}
