#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <PubSubClient.h>

// ======================================
// CONFIGURAÇÕES DA REDE (ESCOLA)
// ======================================
const char* wifi_ssid = "IF-CampusMuz";
const char* wifi_password = "";

const char* portal_user = "SEU_CPF";
const char* portal_password = "SUA_SENHA";

// ======================================
// MQTT HIVEMQ CLOUD (SEGURO)
// ======================================
const char* mqtt_server = "6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;

// SUAS CREDENCIAIS DO HIVEMQ CLOUD
const char* mqtt_user = "SEU_USUARIO_DO_HIVEMQ";
const char* mqtt_password = "SUA_SENHA_DO_HIVEMQ";

// ======================================
// TOPICOS MQTT (PADRONIZADOS)
// ======================================
// PUBLICAR (ESP ENVIA PARA O APP)
const char* topic_bme280    = "agrocluster/sensors/bme280";
const char* topic_lux       = "agrocluster/sensors/lux";
const char* topic_actuators = "agrocluster/actuators";

// INSCREVER-SE (ESP RECEBE DO APP)
const char* cmd_light       = "agrocluster/cmd/light";
const char* cmd_fan         = "agrocluster/cmd/fan";
const char* cmd_irrigation  = "agrocluster/cmd/irrigation";

// ======================================
// INSTANCIAS E VARIAVEIS
// ======================================
WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

unsigned long lastMsg = 0;

// Estados virtuais dos atuadores
bool state_light = false;
bool state_fan = false;
bool state_irrigation = false;

// ======================================
// PUBLICA O ESTADO ATUAL DOS ATUADORES
// ======================================
void publishActuatorsState() {
  // Montando payload JSON na mao para facilitar (sem biblioteca extra)
  String payload = "{";
  payload += "\"fan\":" + String(state_fan ? "true" : "false") + ",";
  payload += "\"light\":" + String(state_light ? "true" : "false") + ",";
  payload += "\"irrigation\":" + String(state_irrigation ? "true" : "false") + ",";
  payload += "\"espId\":\"ESP-MOCK\"";
  payload += "}";

  mqttClient.publish(topic_actuators, payload.c_str());
  Serial.println("Estado dos atuadores atualizado: " + payload);
}

// ======================================
// PROCESSA COMANDOS RECEBIDOS DO APP
// ======================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("================================");
  Serial.print("Comando Recebido no Topico: ");
  Serial.println(topic);
  Serial.print("Comando: ");
  Serial.println(message);
  Serial.println("================================");

  // Tratando os comandos baseados no topico
  if (String(topic) == cmd_light) {
    state_light = (message == "ON");
  } 
  else if (String(topic) == cmd_fan) {
    state_fan = (message == "ON");
  } 
  else if (String(topic) == cmd_irrigation) {
    state_irrigation = (message == "ON");
  }

  // Apos alterar os estados, envia para o App se atualizar
  publishActuatorsState();
}

// ======================================
// CONECTORES: WIFI, PORTAL E MQTT
// ======================================
void connectWiFi() {
  Serial.println("Conectando no WiFi...");
  WiFi.begin(wifi_ssid, wifi_password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loginPortal() {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClient client;
  HTTPClient http;
  
  String url = "http://10.12.192.1:8002/index.php?zone=ifcampusmuz";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");

  String postData = "auth_user=" + String(portal_user) + "&auth_pass=" + String(portal_password) + "&redirurl=https://www.muz.ifsuldeminas.edu.br&accept=Entrar";
  
  Serial.println("Enviando login para Captive Portal...");
  int httpCode = http.POST(postData);
  Serial.print("Portal HTTP CODE: ");
  Serial.println(httpCode);
  http.end();
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.println("Conectando ao broker MQTT...");
    String clientId = "ESP8266Mock-" + String(random(0xffff), HEX);
    
    // Conecta usando usuário e senha
    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println("MQTT conectado!");
      
      // Assinar topicos de comando
      mqttClient.subscribe(cmd_light);
      mqttClient.subscribe(cmd_fan);
      mqttClient.subscribe(cmd_irrigation);
      Serial.println("Inscrito nos t&oacute;picos de comando dos atuadores.");
      
      // Publica o estado inicial para espelhar no app
      publishActuatorsState();
    } else {
      Serial.print("Erro MQTT: ");
      Serial.println(mqttClient.state());
      delay(5000);
    }
  }
}

// ======================================
// SETUP E LOOP PADRÃO
// ======================================
void setup() {
  Serial.begin(115200);
  
  // Confia nos certificados do HiveMQ
  espClient.setInsecure();

  connectWiFi();
  loginPortal();

  // Configura o MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // Envia os dados mocs a cada 5 segundos
  unsigned long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;

    // GERANDO DADOS ALEATÓRIOS DO BME280 (Temp: 20-30 , Hum: 40-70, Pres: 1000-1015)
    float mock_temp = 20.0 + random(0, 100) / 10.0;
    int mock_hum = random(40, 70);
    int mock_pres = random(1000, 1015);
    
    String payload_bme = "{";
    payload_bme += "\"temperature\":" + String(mock_temp, 2) + ",";
    payload_bme += "\"humidity\":" + String(mock_hum) + ",";
    payload_bme += "\"pressure\":" + String(mock_pres) + ",";
    payload_bme += "\"espId\":\"ESP-MOCK-BME\"";
    payload_bme += "}";

    mqttClient.publish(topic_bme280, payload_bme.c_str());

    // GERANDO DADOS ALEATÓRIOS DO BH1750 (Lux: 0-1000)
    int mock_lux = random(0, 1000);
    String state_h1750 = (mock_lux > 150) ? "DAY" : "NIGHT";
    
    String payload_lux = "{";
    payload_lux += "\"lux\":" + String(mock_lux) + ",";
    payload_lux += "\"state\":\"" + state_h1750 + "\",";
    payload_lux += "\"espId\":\"ESP-MOCK-LUX\"";
    payload_lux += "}";

    mqttClient.publish(topic_lux, payload_lux.c_str());

    Serial.println(">> MOCK SENSORS ENVIADOS");
  }
}
