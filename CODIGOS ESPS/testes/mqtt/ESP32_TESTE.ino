#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

const char* wifi_ssid     = "IF-CampusMuz";
const char* wifi_password = "";

const char* mqtt_server   = "6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud";
const int   mqtt_port     = 8883;
const char* mqtt_user     = "Agro_Cluster";
const char* mqtt_password = "Agrocluster123";

const char* topic_bme =
"agrocluster/sensors/bme280";

const char* topic_status =
"agrocluster/status";

String espId = "ESP01";

WiFiClientSecure secureClient;
PubSubClient mqttClient(secureClient);

void connectWiFi() {

  Serial.println("Conectando WiFi...");

  WiFi.begin(
    wifi_ssid,
    wifi_password
  );

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);

    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi conectado!");

  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void reconnectMQTT() {

  while (!mqttClient.connected()) {

    Serial.println("Conectando MQTT...");

    String clientId =
      "ESP32-" +
      String(random(0xffff), HEX);

    if (
      mqttClient.connect(
        clientId.c_str(),
        mqtt_user,
        mqtt_password
      )
    ) {

      Serial.println("MQTT conectado!");

      mqttClient.publish(
        topic_status,
        "ESP ONLINE"
      );

    } else {

      Serial.print("Erro MQTT: ");

      Serial.println(
        mqttClient.state()
      );

      delay(3000);
    }
  }
}

void publishFakeSensorData() {

  float temp =
    random(180, 350) / 10.0;

  float hum =
    random(400, 900) / 10.0;

  float press =
    random(9800, 10300) / 10.0;

  String payload = "{";

  payload += "\"source\":\"";
  payload += espId;
  payload += "\",";

  payload += "\"temperature\":";
  payload += String(temp, 1);
  payload += ",";

  payload += "\"humidity\":";
  payload += String(hum, 1);
  payload += ",";

  payload += "\"pressure\":";
  payload += String(press, 1);
  payload += ",";

  payload += "\"timestamp\":";
  payload += millis();

  payload += "}";

  mqttClient.publish(
    topic_bme,
    payload.c_str()
  );

  Serial.println("");
  Serial.println("DADOS ENVIADOS:");

  Serial.println(payload);
}

unsigned long lastSend = 0;

void setup() {

  Serial.begin(115200);

  delay(1000);

  randomSeed(analogRead(A0));

  connectWiFi();

  secureClient.setInsecure();

  mqttClient.setServer(
    mqtt_server,
    mqtt_port
  );
}

void loop() {

  if (
    WiFi.status() != WL_CONNECTED
  ) {

    connectWiFi();
  }

  if (
    !mqttClient.connected()
  ) {

    reconnectMQTT();
  }

  mqttClient.loop();

  if (
    millis() - lastSend > 3000
  ) {

    lastSend = millis();

    publishFakeSensorData();
  }
}