#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>
#include <PubSubClient.h>

// ======================================
// LED
// ======================================

#define LED_PIN LED_BUILTIN

bool ledState = false;

// ======================================
// WIFI ESCOLA
// ======================================

const char* wifi_ssid = "IF-CampusMuz";

const char* wifi_password = "";

// ======================================
// LOGIN PORTAL CAPTIVE
// ======================================

// COLOQUE SEU CPF AQUI
const char* portal_user = "08873442676";

// COLOQUE SUA SENHA AQUI
const char* portal_password = "ifsuldeminas";

// ======================================
// MQTT HIVEMQ CLOUD (SEGURO)
// ======================================

const char* mqtt_server = "6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud";

// PORTAS PARA TESTAR (Troque e veja qual o firewall da escola libera)
// Tente: 8883, 8884, 8083, 8084 ou 443
const int mqtt_port = 8883;

// SUAS CREDENCIAIS DO HIVEMQ CLOUD (Para nao ficar publico)
const char* mqtt_user = "Agro_Cluster";
const char* mqtt_password = "Agrocluster123";

// ======================================
// TOPICOS MQTT
// ======================================

// ESP PUBLICA STATUS AQUI
const char* topic_status = "agrocluster/actuators/status";

// APP ENVIA COMANDO AQUI
const char* topic_command = "agrocluster/cmd/light";

// ======================================

ESP8266WebServer server(80);

// TROCADO PARA CLIENTE SEGURO PARA PORTAS 8883+
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

  for (int i = 0; i < length; i++) {

    message += (char) payload[i];
  }

  message.trim();

  Serial.println("================================");
  Serial.println("MQTT RECEBIDO");

  Serial.print("TOPICO: ");
  Serial.println(topic);

  Serial.print("MENSAGEM: ");
  Serial.println(message);

  Serial.println("================================");

  // ======================================
  // LIGAR LED
  // ======================================

  if (message == "ON") {

    ledState = true;

    digitalWrite(LED_PIN, LOW);

    Serial.println("LED LIGADO VIA MQTT");

    publishLedStatus();
  }

  // ======================================
  // DESLIGAR LED
  // ======================================

  else if (message == "OFF") {

    ledState = false;

    digitalWrite(LED_PIN, HIGH);

    Serial.println("LED DESLIGADO VIA MQTT");

    publishLedStatus();
  }

  // ======================================
  // COMANDO INVALIDO
  // ======================================

  else {

    Serial.println("COMANDO MQTT INVALIDO");
  }
}

// ======================================
// CONECTAR WIFI
// ======================================

void connectWiFi() {

  // Ignora o certificado do HiveMQ (como é apenas para teste na escola)
  espClient.setInsecure();

  Serial.println("================================");
  Serial.println("Conectando no WiFi...");

  WiFi.begin(
    wifi_ssid,
    wifi_password
  );

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);

    Serial.print(".");
  }

  Serial.println("");

  Serial.println("================================");
  Serial.println("WiFi conectado!");

  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  Serial.print("MAC: ");
  Serial.println(WiFi.macAddress());

  Serial.print("Sinal RSSI: ");
  Serial.println(WiFi.RSSI());

  Serial.print("Gateway: ");
  Serial.println(WiFi.gatewayIP());

  Serial.print("DNS: ");
  Serial.println(WiFi.dnsIP());

  Serial.print("Canal: ");
  Serial.println(WiFi.channel());

  Serial.print("BSSID: ");
  Serial.println(WiFi.BSSIDstr());

  Serial.println("================================");
}

// ======================================
// LOGIN PORTAL CAPTIVE
// ======================================

void loginPortal() {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("WiFi nao conectado");

    return;
  }

  WiFiClient client;

  HTTPClient http;

  String url =
  "http://10.12.192.1:8002/index.php?zone=ifcampusmuz";

  Serial.println("Abrindo portal captive...");

  http.begin(client, url);

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

  String response = http.getString();

  Serial.println("RESPOSTA:");

  Serial.println(response);

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

  WiFiClient testClient;

  Serial.println("Testando internet...");

  if (testClient.connect("google.com", 80)) {

    Serial.println("Internet OK");

  } else {

    Serial.println("Sem internet");
  }
}

// ======================================
// CONECTAR MQTT
// ======================================

void reconnectMQTT() {

  while (!mqttClient.connected()) {

    Serial.println("Conectando MQTT...");

    Serial.print("Broker: ");
    Serial.println(mqtt_server);

    Serial.print("Porta: ");
    Serial.println(mqtt_port);

    String clientId =
      "ESP8266Client-" +
      String(random(0xffff), HEX);

    if (mqttClient.connect(
          clientId.c_str(),
          mqtt_user,
          mqtt_password
        )) {

      Serial.println("================================");
      Serial.println("MQTT conectado!");
      Serial.println("================================");

      mqttClient.subscribe(topic_command);

      Serial.print("Inscrito no topico: ");
      Serial.println(topic_command);

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
        <title>ESP8266 MQTT LED</title>
      </head>

      <body>

        <h1>ESP8266 MQTT LED</h1>

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

  server.send(200, "text/html", html);
}

// ======================================
// LIGAR LED HTTP
// ======================================

void handleLigar() {

  ledState = true;

  digitalWrite(LED_PIN, LOW);

  Serial.println("LED LIGADO VIA HTTP");

  publishLedStatus();

  server.send(
    200,
    "text/plain",
    "LED LIGADO"
  );
}

// ======================================
// DESLIGAR LED HTTP
// ======================================

void handleDesligar() {

  ledState = false;

  digitalWrite(LED_PIN, HIGH);

  Serial.println("LED DESLIGADO VIA HTTP");

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

  pinMode(LED_PIN, OUTPUT);

  digitalWrite(LED_PIN, HIGH);

  // ======================================
  // WIFI
  // ======================================

  connectWiFi();

  delay(3000);

  // ======================================
  // LOGIN PORTAL
  // ======================================

  loginPortal();

  delay(5000);

  // ======================================
  // TESTAR INTERNET
  // ======================================

  testInternet();

  // ======================================
  // MQTT
  // ======================================

  mqttClient.setServer(
    mqtt_server,
    mqtt_port
  );

  mqttClient.setCallback(mqttCallback);

  // ======================================
  // WEB SERVER
  // ======================================

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

  // ======================================
  // RECONEXAO WIFI
  // ======================================

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("WiFi desconectado");

    connectWiFi();

    delay(3000);

    loginPortal();

    delay(5000);
  }

  // ======================================
  // RECONEXAO MQTT
  // ======================================

  if (!mqttClient.connected()) {

    reconnectMQTT();
  }

  mqttClient.loop();

  // ======================================
  // WEB SERVER
  // ======================================

  server.handleClient();
}