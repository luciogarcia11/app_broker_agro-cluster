#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// ======================================
// CREDENCIAIS
// ======================================
const char* wifi_ssid       = "IF-CampusMuz";
const char* wifi_password   = "";
const char* portal_user     = "08873442676";
const char* portal_password = "ifsuldeminas";
const char* mqtt_server     = "6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud";
const char* mqtt_user       = "Agro_Cluster";
const char* mqtt_password   = "Agrocluster123";

// ======================================
// TÓPICOS MQTT
// ======================================
const char* topic_bme280    = "agrocluster/sensors/bme280";
const char* topic_lux       = "agrocluster/sensors/lux";
const char* topic_actuators = "agrocluster/actuators";
const char* cmd_light       = "agrocluster/cmd/light";
const char* cmd_fan         = "agrocluster/cmd/fan";
const char* cmd_irrigation  = "agrocluster/cmd/irrigation";

// ======================================
// INSTÂNCIAS
// ======================================
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// ======================================
// ESTADO DA MÁQUINA DE RECONEXÃO
// ======================================
enum ConexaoState {
  WIFI_CONECTANDO,
  PORTAL_LOGIN,
  MQTT_CONECTANDO,
  OPERACIONAL,
  AGUARDANDO
};

ConexaoState estadoConexao = WIFI_CONECTANDO;

unsigned long tUltimaAcao     = 0;
unsigned long tUltimoSensor   = 0;
unsigned long tUltimoWifiCheck = 0;
unsigned long tUltimoPortal   = 0;

const unsigned long WIFI_TIMEOUT_MS    = 15000;
const unsigned long MQTT_RETRY_MS      = 5000;
const unsigned long WIFI_CHECK_MS      = 10000;
const unsigned long SENSOR_INTERVAL_MS = 3000;
const unsigned long PORTAL_REFRESH_MS  = 15000;
const unsigned long AGUARDO_RETRY_MS   = 30000;

bool state_light      = false;
bool state_fan        = false;
bool state_irrigation = false;

// ======================================
// FUNÇÕES AUXILIARES
// ======================================
void publishActuatorsState() {
  String payload = "{";
  payload += "\"fan\":"        + String(state_fan        ? "true" : "false") + ",";
  payload += "\"light\":"      + String(state_light      ? "true" : "false") + ",";
  payload += "\"irrigation\":" + String(state_irrigation ? "true" : "false") + ",";
  payload += "\"espId\":\"ESP-MOCK\"";
  payload += "}";
  mqttClient.publish(topic_actuators, payload.c_str());
  Serial.println("Atuadores: " + payload);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];

  Serial.printf("[MQTT] Tópico: %s | Msg: %s\n", topic, message.c_str());

  if (String(topic) == cmd_light)      state_light      = (message == "ON");
  else if (String(topic) == cmd_fan)   state_fan        = (message == "ON");
  else if (String(topic) == cmd_irrigation) state_irrigation = (message == "ON");

  publishActuatorsState();
}

void loginPortal() {
  if (WiFi.status() != WL_CONNECTED) return;
  WiFiClient client;
  HTTPClient http;
  http.begin(client, "http://10.12.192.1:8002/index.php?zone=ifcampusmuz");
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  String postData = "auth_user=" + String(portal_user)
                  + "&auth_pass=" + String(portal_password)
                  + "&redirurl=https://www.muz.ifsuldeminas.edu.br&accept=Entrar";
  int code = http.POST(postData);
  Serial.printf("[Portal] Login HTTP %d\n", code);
  http.end();

  // Ping externo: mantem a sessao do portal viva
  HTTPClient ping;
  ping.begin(client, "http://clients3.google.com/generate_204");
  int pingCode = ping.GET();
  ping.end();
  Serial.printf("[Portal] Ping externo %d\n", pingCode);
}

void enviarSensores() {
  float mock_temp = 20.0 + random(0, 100) / 10.0;
  int   mock_hum  = random(40, 70);
  int   mock_pres = random(1000, 1015);

  String payload_bme = "{\"temperature\":" + String(mock_temp, 2)
                     + ",\"humidity\":"    + String(mock_hum)
                     + ",\"pressure\":"    + String(mock_pres)
                     + ",\"espId\":\"ESP-MOCK-BME\"}";
  mqttClient.publish(topic_bme280, payload_bme.c_str());

  int mock_lux = random(0, 1000);
  String payload_lux = "{\"lux\":"   + String(mock_lux)
                     + ",\"state\":\"" + String(mock_lux > 150 ? "DAY" : "NIGHT") + "\""
                     + ",\"espId\":\"ESP-MOCK-LUX\"}";
  mqttClient.publish(topic_lux, payload_lux.c_str());

  Serial.println(">> Sensores enviados");
}

// ======================================
// SETUP
// ======================================
void setup() {
  Serial.begin(115200);
  espClient.setInsecure();
  espClient.setHandshakeTimeout(10);
  mqttClient.setCallback(mqttCallback);

  Serial.println("\n=== AGRO CLUSTER - INICIANDO ===");

  // Inicia WiFi sem bloquear
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifi_ssid, wifi_password);
  tUltimaAcao = millis();
  estadoConexao = WIFI_CONECTANDO;
  Serial.println("[WiFi] Conectando...");
}

// ======================================
// LOOP — MÁQUINA DE ESTADOS
// ======================================
void loop() {
  unsigned long agora = millis();

  switch (estadoConexao) {

    // ----------------------------------
    case WIFI_CONECTANDO:
      if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] Conectado! IP: %s\n", WiFi.localIP().toString().c_str());
        estadoConexao = PORTAL_LOGIN;
        tUltimaAcao = agora;
      }
      else if (agora - tUltimaAcao > WIFI_TIMEOUT_MS) {
        // Timeout: reinicia tentativa sem travar
        Serial.println("\n[WiFi] Timeout, reiniciando...");
        WiFi.disconnect(true);
        delay(100);
        WiFi.begin(wifi_ssid, wifi_password);
        tUltimaAcao = agora;
      }
      break;

    // ----------------------------------
    case PORTAL_LOGIN:
      loginPortal();
      mqttClient.setServer(mqtt_server, 8883);
      estadoConexao = MQTT_CONECTANDO;
      tUltimaAcao = agora;
      break;

    // ----------------------------------
    case MQTT_CONECTANDO:
      if (agora - tUltimaAcao < MQTT_RETRY_MS) break;

      {
        String clientId = "ESP32Mock-" + String(random(0xffff), HEX);
        Serial.print("[MQTT] Porta 8883... ");

        if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
          Serial.println("CONECTADO!");
          mqttClient.subscribe(cmd_light);
          mqttClient.subscribe(cmd_fan);
          mqttClient.subscribe(cmd_irrigation);
          publishActuatorsState();
          estadoConexao = OPERACIONAL;
        } else {
          Serial.printf("falhou (err %d)\n", mqttClient.state());
          tUltimaAcao = agora;
        }
      }
      break;

    // ----------------------------------
    case OPERACIONAL:
      // Checa WiFi periodicamente
      if (agora - tUltimoWifiCheck > WIFI_CHECK_MS) {
        tUltimoWifiCheck = agora;
        if (WiFi.status() != WL_CONNECTED) {
          Serial.println("[WiFi] Caiu! Reconectando...");
          mqttClient.disconnect();
          WiFi.disconnect(true);
          delay(100);
          WiFi.begin(wifi_ssid, wifi_password);
          tUltimaAcao = agora;
          estadoConexao = WIFI_CONECTANDO;
          break;
        }
      }

      // Renova sessaoo do portal a cada 20s
      if (agora - tUltimoPortal > PORTAL_REFRESH_MS) {
        tUltimoPortal = agora;
        loginPortal();
      }

      // Checa MQTT
      if (!mqttClient.connected()) {
        Serial.println("[MQTT] Desconectado! Aguardando internet voltar...");
        mqttClient.disconnect();
        estadoConexao = AGUARDANDO;
        tUltimaAcao = 0;
        break;
      }

      mqttClient.loop();

      // Envia sensores a cada 5s
      if (agora - tUltimoSensor > SENSOR_INTERVAL_MS) {
        tUltimoSensor = agora;
        enviarSensores();
      }
      break;

    case AGUARDANDO:
      // WiFi caiu? Reconecta
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WiFi] Caiu! Reconectando...");
        WiFi.disconnect(true);
        delay(100);
        WiFi.begin(wifi_ssid, wifi_password);
        estadoConexao = WIFI_CONECTANDO;
        tUltimaAcao = agora;
        break;
      }

      // A cada 30s verifica se internet voltou
      if (agora - tUltimaAcao > AGUARDO_RETRY_MS) {
        tUltimaAcao = agora;
        WiFiClient c;
        HTTPClient h;
        h.begin(c, "http://clients3.google.com/generate_204");
        int ping = h.GET();
        h.end();
        Serial.printf("[Aguardo] Ping internet: %d\n", ping);

        if (ping == 204) {
          Serial.println("[Aguardo] Internet voltou! Reautenticando...");
          estadoConexao = PORTAL_LOGIN;
        }
      }
      break;
  }
}
