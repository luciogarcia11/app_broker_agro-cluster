#include <WiFi.h>

#include "cluster.h"
#include "log.h"
#include "mqtt_client.h"
#include "roles.h"
#include "wifi_connect.h"

#define LED_PIN 2

// ===== MACs CORRETOS =====
uint8_t macs[4][6] = {
  {0x84,0x1F,0xE8,0x1B,0x47,0x18}, // ESP 1
  {0x44,0x1D,0x64,0xF1,0xFB,0xE8}, // ESP 2
  {0xD0,0xEF,0x76,0x34,0x58,0xF4}, // ESP 3
  {0x80,0xF3,0xDA,0x5E,0x1C,0xAC}  // ESP 4
};

// ===============================

int myId = 1;

static void onMqttMessage(const char *topic, const char *payload) {
  rolesHandleCommand(topic, payload);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);

  gLogEnabled = true;

  Serial.println();
  Serial.println("========================================");
  Serial.println("AGRO-CLUSTER - INICIANDO");
  Serial.println("========================================");

  // ===== 1. WiFi =====
  Serial.println("[1/4] Conectando WiFi...");
  wifiConnectBegin(wifi_ssid, wifi_password);

  if (wifiWaitForConnect(30000)) {
    Serial.print("[OK] WiFi conectado! IP: ");
    Serial.println(wifiGetLocalIp());
  } else {
    Serial.println("[ERRO] WiFi nao conectou!");
  }

  // ===== 2. Cluster =====
  Serial.println("[2/4] Resolvendo identidade no cluster...");
  myId = clusterResolveId(macs);

  Serial.print("[OK] Meu ID: ");
  Serial.println(myId);
  Serial.print("[OK] Meu MAC: ");
  Serial.println(WiFi.macAddress());

  clusterBegin(myId, macs);
  Serial.println("[OK] ESP-NOW iniciado");

  // ===== 3. Sensores e reles =====
  Serial.println("[3/4] Iniciando sensores e reles...");
  rolesBegin();
  Serial.println("[OK] Sensores e reles prontos");

  // ===== 4. MQTT =====
  Serial.println("[4/4] Conectando ao broker MQTT...");
  char clientId[24];
  snprintf(clientId, sizeof(clientId), "agrocluster-esp-%d", myId);
  mqttBegin(mqtt_server, mqtt_port, mqtt_user, mqtt_password, clientId, onMqttMessage);

  Serial.println("========================================");
  Serial.println("SISTEMA INICIADO!");
  Serial.println("========================================");
}

void loop() {
  wifiConnectLoop();
  mqttLoop();

  ClusterStatus status = clusterUpdate();

  logSetEnabled(status.isLeader);

  digitalWrite(LED_PIN, status.isLeader ? HIGH : LOW);

  rolesTick(status);

  if (mqttIsConnected()) {
    rolesPublishMqtt();

    static unsigned long lastEspListMs = 0;
    if (status.isLeader && (millis() - lastEspListMs >= ESP_LIST_INTERVAL_MS)) {
      lastEspListMs = millis();
      rolesPublishEspList(status);
    }
  }

  delay(50);
}
