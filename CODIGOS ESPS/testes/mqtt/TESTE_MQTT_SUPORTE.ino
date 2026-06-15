// ======================================
// TESTE: MQTT no WiFi Suporte
// ======================================

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

const char* wifi_ssid     = "Suporte";
const char* wifi_password = "37361411";

const char* mqtt_server   = "6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud";
const char* mqtt_user     = "Agro_Cluster";
const char* mqtt_password = "Agrocluster123";

const char* topic_bme280    = "agrocluster/sensors/bme280";
const char* topic_lux       = "agrocluster/sensors/lux";

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

enum ConexaoState { WIFI_CONECTANDO, MQTT_CONECTANDO, OPERACIONAL };
ConexaoState estado = WIFI_CONECTANDO;

unsigned long tUltimaAcao   = 0;
unsigned long tUltimoSensor = 0;

const unsigned long WIFI_TIMEOUT_MS    = 15000;
const unsigned long MQTT_RETRY_MS      = 5000;
const unsigned long SENSOR_INTERVAL_MS = 3000;
const unsigned long WIFI_CHECK_MS      = 10000;

void enviarSensores() {
  float mock_temp = 20.0 + random(0, 100) / 10.0;
  int   mock_hum  = random(40, 70);
  int   mock_pres = random(1000, 1015);

  String p = "{\"temperature\":" + String(mock_temp, 2)
           + ",\"humidity\":"    + String(mock_hum)
           + ",\"pressure\":"    + String(mock_pres)
           + ",\"espId\":\"ESP-SUPORTE\"}";
  mqttClient.publish(topic_bme280, p.c_str());

  int mock_lux = random(0, 1000);
  p = "{\"lux\":" + String(mock_lux)
    + ",\"state\":\"" + String(mock_lux > 150 ? "DAY" : "NIGHT") + "\""
    + ",\"espId\":\"ESP-SUPORTE\"}";
  mqttClient.publish(topic_lux, p.c_str());

  Serial.println(">> Sensores enviados");
}

void setup() {
  Serial.begin(115200);
  espClient.setInsecure();
  espClient.setHandshakeTimeout(10);

  Serial.println("\n=== MQTT TESTE - WIFI SUPORTE ===");

  WiFi.mode(WIFI_STA);
  WiFi.begin(wifi_ssid, wifi_password);
  tUltimaAcao = millis();
  Serial.print("[WiFi] Conectando em ");
  Serial.println(wifi_ssid);
}

void loop() {
  unsigned long agora = millis();

  switch (estado) {

    case WIFI_CONECTANDO:
      if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[WiFi] OK! IP: %s\n", WiFi.localIP().toString().c_str());
        mqttClient.setServer(mqtt_server, 8883);
        estado = MQTT_CONECTANDO;
        tUltimaAcao = agora;
      } else if (agora - tUltimaAcao > WIFI_TIMEOUT_MS) {
        Serial.println("[WiFi] Timeout, reiniciando...");
        WiFi.disconnect(true);
        delay(100);
        WiFi.begin(wifi_ssid, wifi_password);
        tUltimaAcao = agora;
      }
      break;

    case MQTT_CONECTANDO:
      if (agora - tUltimaAcao < MQTT_RETRY_MS) break;

      {
        String clientId = "sup-" + String(random(0xffff), HEX);
        Serial.print("[MQTT] Porta 8883... ");

        if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
          Serial.println("CONECTADO!");
          estado = OPERACIONAL;
        } else {
          Serial.printf("falhou (err %d)\n", mqttClient.state());
          tUltimaAcao = agora;
        }
      }
      break;

    case OPERACIONAL:
      if (agora - tUltimaAcao > WIFI_CHECK_MS) {
        tUltimaAcao = agora;
        if (WiFi.status() != WL_CONNECTED) {
          Serial.println("[WiFi] Caiu! Reconectando...");
          WiFi.disconnect(true);
          delay(100);
          WiFi.begin(wifi_ssid, wifi_password);
          estado = WIFI_CONECTANDO;
          tUltimaAcao = agora;
          break;
        }
      }

      if (!mqttClient.connected()) {
        Serial.println("[MQTT] Desconectado!");
        estado = MQTT_CONECTANDO;
        tUltimaAcao = 0;
        break;
      }

      mqttClient.loop();

      if (agora - tUltimoSensor > SENSOR_INTERVAL_MS) {
        tUltimoSensor = agora;
        enviarSensores();
      }
      break;
  }
}
