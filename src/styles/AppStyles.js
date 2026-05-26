import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#141B22",
    width: "90%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#1D2732", 
    padding: 14,
    borderRadius: 12,
  },
  statusLabel: {
    color: "#BCC2CA",
    fontSize: 14,
  },
  statusValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusValue: {
    color: "#ffffff",
    fontWeight: "600",
  },
  ledContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  ledLabel: {
    color: "#BCC2CA",
    fontSize: 13,
    marginBottom: 10,
  },
  ledIndicator: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  ledOn: {
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    borderColor: "#4caf50",
  },
  ledOff: {
    backgroundColor: "rgba(244, 67, 54, 0.15)",
    borderColor: "#f44336",
  },
  ledUnknown: {
    backgroundColor: "rgba(158, 158, 158, 0.1)",
    borderColor: "#9e9e9e",
  },
  ledText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  messageBox: {
    backgroundColor: "#000000",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  messageLabel: {
    color: "#888888",
    fontSize: 12,
    marginBottom: 8,
  },
  messageText: {
    color: "#4caf50",
    fontFamily: "monospace",
    fontSize: 13,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  buttonOn: {
    backgroundColor: "#4caf50",
  },
  buttonOff: {
    backgroundColor: "#f44336",
  },
  controlButtonPressed: {
    opacity: 0.5,
  },
  button: {
    backgroundColor: "#2E5BFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#1B3280",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
