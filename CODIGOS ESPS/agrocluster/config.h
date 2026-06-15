#pragma once

#include <Arduino.h>

constexpr uint8_t I2C_SDA_PIN = 21;
constexpr uint8_t I2C_SCL_PIN = 22;

constexpr uint8_t RELAY_FAN_PIN = 23;
constexpr uint8_t RELAY_LIGHT_PIN = 18;

constexpr uint8_t RELAY_ON = LOW;
constexpr uint8_t RELAY_OFF = HIGH;

constexpr uint8_t ESPNOW_CHANNEL = 1;

constexpr uint32_t HEARTBEAT_INTERVAL_MS = 1000;
constexpr uint32_t HEARTBEAT_TIMEOUT_MS = 3000;
constexpr uint32_t ACK_TIMEOUT_MS = 1500;

constexpr uint32_t ROLE_TICK_INTERVAL_MS = 5000;
constexpr uint32_t SENSOR_STALE_MS = 6000;
constexpr uint32_t SENSOR_RETRY_MS = 3000;

constexpr uint8_t BME280_ADDR_PRIMARY = 0x76;
constexpr uint8_t BME280_ADDR_SECONDARY = 0x77;

constexpr uint8_t CLUSTER_QUORUM_SIZE = 3;

constexpr float TEMP_ON_C = 30.0f;
constexpr float TEMP_OFF_C = 28.0f;
constexpr float HUM_ON_PCT = 70.0f;
constexpr float HUM_OFF_PCT = 65.0f;

constexpr float LUX_ON = 50.0f;
constexpr float LUX_OFF = 80.0f;

constexpr uint8_t LOG_LEVEL = 3;

// ===== WiFi =====
static const char* wifi_ssid       = "Suporte";
static const char* wifi_password   = "37361411";
constexpr unsigned long WIFI_TIMEOUT_MS = 15000;

// ===== MQTT =====
static const char* mqtt_server     = "6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud";
constexpr int mqtt_port            = 8883;
static const char* mqtt_user       = "Agro_Cluster";
static const char* mqtt_password   = "Agrocluster123";
constexpr unsigned long MQTT_RECONNECT_MS = 5000;
constexpr unsigned long MQTT_PUBLISH_INTERVAL_MS = 5000;
constexpr unsigned long ESP_LIST_INTERVAL_MS = 10000;
