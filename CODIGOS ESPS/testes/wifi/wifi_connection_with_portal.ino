#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// ======================================
// WIFI ESCOLA
// ======================================

const char* wifi_ssid = "IF-CampusMuz";
const char* wifi_password = "";

// ======================================
// LOGIN PORTAL CAPTIVE
// ======================================

const char* portal_user = "08873442676";
const char* portal_password = "ifsuldeminas";

// ======================================
// MQTT HIVEMQ CLOUD
// ======================================

const char* mqtt_server =
  "6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud";

const int mqtt_port = 8883;

const char* mqtt_user = "Agro_Cluster";
const char* mqtt_password = "Agrocluster123";

// ======================================
// TOPICOS MQTT
// ======================================

const char* topic_status = "agrocluster/actuators/status";
const char* topic_command = "agrocluster/cmd/light";

// ======================================
// LED
// ======================================

// ESP32 DevKit normalmente usa GPIO 2
#define LED_PIN 2

bool ledState = false;

// ======================================

WebServer server(80);

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// ======================================
// PUBLICAR STATUS
// ======================================

void publishLedStatus() {

  String payload;

  if (ledState) {
    payload = "{\"led\":true}";
  } else {
    payload = "{\"led\":false}";
  }

  mqttClient.publish(
    topic_status,
    payload.c_str(),
    true
  );

  Serial.println("================================");
  Serial.println("MQTT PUBLICADO");
  Serial.println(payload);
  Serial.println("================================");
}

// ======================================
// MQTT CALLBACK
// ======================================

void mqttCallback(
  char* topic,
  byte* payload,
  unsigned int length
) {

  String message;

  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  message.trim();

  Serial.println("================================");
  Serial.println("MQTT RECEBIDO");

  Serial.print("TOPICO: ");
  Serial.println(topic);

  Serial.print("MENSAGEM: ");
  Serial.println(message);

  Serial.println("================================");

  if (message == "ON") {

    ledState = true;

    digitalWrite(LED_PIN, HIGH);

    Serial.println("LED LIGADO VIA MQTT");

    publishLedStatus();
  }

  else if (message == "OFF") {

    ledState = false;

    digitalWrite(LED_PIN, LOW);

    Serial.println("LED DESLIGADO VIA MQTT");

    publishLedStatus();
  }

  else {

    Serial.println("COMANDO MQTT INVALIDO");
  }
}

// ======================================
// CONECTAR WIFI
// ======================================

void connectWiFi() {

  espClient.setInsecure();

  Serial.println("================================");
  Serial.println("Conectando WiFi...");

  WiFi.mode(WIFI_STA);

  WiFi.begin(
    wifi_ssid,
    wifi_password
  );

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);
    Serial.print(".");
  }

  Serial.println();

  Serial.println("================================");
  Serial.println("WiFi conectado!");

  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  Serial.print("MAC: ");
  Serial.println(WiFi.macAddress());

  Serial.print("RSSI: ");
  Serial.println(WiFi.RSSI());

  Serial.print("Gateway: ");
  Serial.println(WiFi.gatewayIP());

  Serial.print("DNS: ");
  Serial.println(WiFi.dnsIP());

  Serial.println("================================");
}

// ======================================
// LOGIN PORTAL
// ======================================

void loginPortal() {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("WiFi nao conectado");
    return;
  }

  HTTPClient http;

  String url =
    "http://10.12.192.1:8002/index.php?zone=ifcampusmuz";

  Serial.println("Abrindo portal captive...");

  http.begin(url);

  http.addHeader(
    "Content-Type",
    "application/x-www-form-urlencoded"
  );

  String postData =
      "auth_user=" + String(portal_user) +
      "&auth_pass=" + String(portal_password) +
      "&redirurl=https://www.muz.ifsuldeminas.edu.br" +
      "&accept=Entrar";

  Serial.println("Enviando login...");

  int httpCode = http.POST(postData);

  Serial.print("HTTP CODE: ");
  Serial.println(httpCode);

  if (httpCode > 0) {

    String response = http.getString();

    Serial.println("RESPOSTA:");
    Serial.println(response);
  }

  http.end();

  if (httpCode == 200) {

    Serial.println("Login portal enviado!");

  } else {

    Serial.println("Erro ao logar no portal");
  }
}

// ======================================
// TESTAR INTERNET
// ======================================

void testInternet() {

  HTTPClient http;

  http.begin(
    "http://clients3.google.com/generate_204"
  );

  int code = http.GET();

  Serial.print("Teste Internet HTTP: ");
  Serial.println(code);

  if (code == 204) {

    Serial.println("Internet OK");

  } else {

    Serial.println("Portal ainda nao liberou acesso");
  }

  http.end();
}

// ======================================
// MQTT
// ======================================

void reconnectMQTT() {

  while (!mqttClient.connected()) {

    Serial.println("Conectando MQTT...");

    String clientId =
      "ESP32Client-" +
      String(random(0xffff), HEX);

    if (
      mqttClient.connect(
        clientId.c_str(),
        mqtt_user,
        mqtt_password
      )
    ) {

      Serial.println("================================");
      Serial.println("MQTT conectado!");
      Serial.println("================================");

      mqttClient.subscribe(
        topic_command
      );

      publishLedStatus();

    } else {

      Serial.print("Erro MQTT: ");
      Serial.println(mqttClient.state());

      delay(3000);
    }
  }
}

// ======================================
// WEB SERVER
// ======================================

void handleRoot() {

  String html = R"rawliteral(
<html>
<head>
<title>ESP32 MQTT LED</title>
</head>
<body>

<h1>ESP32 MQTT LED</h1>

<a href="/ligar">
<button style="width:200px;height:60px;">
LIGAR LED
</button>
</a>

<br><br>

<a href="/desligar">
<button style="width:200px;height:60px;">
DESLIGAR LED
</button>
</a>

</body>
</html>
)rawliteral";

  server.send(
    200,
    "text/html",
    html
  );
}

// ======================================
// LIGAR LED
// ======================================

void handleLigar() {

  ledState = true;

  digitalWrite(
    LED_PIN,
    HIGH
  );

  publishLedStatus();

  server.send(
    200,
    "text/plain",
    "LED LIGADO"
  );
}

// ======================================
// DESLIGAR LED
// ======================================

void handleDesligar() {

  ledState = false;

  digitalWrite(
    LED_PIN,
    LOW
  );

  publishLedStatus();

  server.send(
    200,
    "text/plain",
    "LED DESLIGADO"
  );
}

// ======================================
// SETUP
// ======================================

void setup() {

  Serial.begin(115200);

  pinMode(
    LED_PIN,
    OUTPUT
  );

  digitalWrite(
    LED_PIN,
    LOW
  );

  connectWiFi();

  delay(3000);

  loginPortal();

  delay(5000);

  testInternet();

  mqttClient.setServer(
    mqtt_server,
    mqtt_port
  );

  mqttClient.setCallback(
    mqttCallback
  );

  server.on("/", handleRoot);
  server.on("/ligar", handleLigar);
  server.on("/desligar", handleDesligar);

  server.begin();

  Serial.println("================================");
  Serial.println("Servidor HTTP iniciado");
  Serial.println("================================");

  Serial.print("Pagina Web: http://");
  Serial.println(WiFi.localIP());
}

// ======================================
// LOOP
// ======================================

void loop() {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("WiFi desconectado");

    connectWiFi();

    delay(3000);

    loginPortal();

    delay(5000);
  }

  if (!mqttClient.connected()) {

    reconnectMQTT();
  }

  mqttClient.loop();

  server.handleClient();
}