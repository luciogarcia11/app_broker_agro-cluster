#include <WiFi.h>

#include "cluster.h"
#include "log.h"
#include "roles.h"

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

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);

  myId = clusterResolveId(macs);

  Serial.print("Meu ID: ");
  Serial.println(myId);
  Serial.print("Meu MAC: ");
  Serial.println(WiFi.macAddress());

  clusterBegin(myId, macs);
  rolesBegin();

  Serial.println("Sistema iniciado");
}

void loop() {

  ClusterStatus status = clusterUpdate();

  logSetEnabled(status.isLeader);

  // ===== LED =====
  digitalWrite(LED_PIN, status.isLeader ? HIGH : LOW);
  rolesTick(status);

  delay(200);
}