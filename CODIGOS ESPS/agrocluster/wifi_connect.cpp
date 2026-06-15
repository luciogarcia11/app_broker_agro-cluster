#include "wifi_connect.h"

#include <WiFi.h>

#include "config.h"
#include "log.h"

static bool connected = false;
static char localIp[16] = "0.0.0.0";
static unsigned long lastStatusPrintMs = 0;
static unsigned long lastDisconnectMs = 0;

void wifiConnectBegin(const char *ssid, const char *password) {
  if (strlen(ssid) == 0) {
    LOGE("WiFi SSID vazio\n");
    return;
  }

  if (WiFi.status() == WL_CONNECTED) {
    connected = true;
    strncpy(localIp, WiFi.localIP().toString().c_str(), sizeof(localIp) - 1);
    return;
  }

  LOGI("Conectando a %s ...\n", ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  lastDisconnectMs = millis();
}

bool wifiIsConnected() {
  return WiFi.status() == WL_CONNECTED;
}

const char *wifiGetLocalIp() {
  return localIp;
}

void wifiConnectLoop() {
  wl_status_t status = WiFi.status();

  if (status == WL_CONNECTED) {
    if (!connected) {
      connected = true;
      strncpy(localIp, WiFi.localIP().toString().c_str(), sizeof(localIp) - 1);
      LOGI("WiFi conectado! IP: %s\n", localIp);
    }
    return;
  }

  if (connected) {
    LOGW("WiFi desconectado! (status=%d)\n", status);
    connected = false;
    lastDisconnectMs = millis();
  }

  unsigned long now = millis();

  // Forca reconexao se ficar mais de 15s sem WiFi (igual MOCK_SENSORS_TEST)
  if (now - lastDisconnectMs > 15000) {
    LOGW("WiFi: timeout, reiniciando...\n");
    WiFi.disconnect();
    delay(100);
    WiFi.begin(wifi_ssid, wifi_password);
    lastDisconnectMs = now;
  }

  // Status a cada 10s
  if (now - lastStatusPrintMs > 10000) {
    lastStatusPrintMs = now;
    const char *msg;
    switch (status) {
      case WL_IDLE_STATUS:     msg = "ocioso"; break;
      case WL_NO_SSID_AVAIL:   msg = "rede nao encontrada"; break;
      case WL_SCAN_COMPLETED:  msg = "scan completo"; break;
      case WL_CONNECT_FAILED:  msg = "falha na conexao"; break;
      case WL_CONNECTION_LOST: msg = "conexao perdida"; break;
      case WL_DISCONNECTED:    msg = "tentando conectar..."; break;
      default:                 msg = "desconhecido"; break;
    }
    Serial.print("[WiFi] ");
    Serial.println(msg);
  }
}

bool wifiWaitForConnect(unsigned long timeoutMs) {
  unsigned long start = millis();
  while (millis() - start < timeoutMs) {
    wl_status_t status = WiFi.status();

    if (status == WL_CONNECTED) {
      connected = true;
      strncpy(localIp, WiFi.localIP().toString().c_str(), sizeof(localIp) - 1);
      LOGI("WiFi conectado! IP: %s\n", localIp);
      return true;
    }

    Serial.print(".");
    delay(500);
  }
  return false;
}
