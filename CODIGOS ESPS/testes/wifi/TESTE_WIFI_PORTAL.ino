// ======================================
// TESTE: WiFi IF-CampusMuz + Portal
// ======================================
// Soh conecta no WiFi da escola
// e faz login no portal captive.
// Nada de MQTT, nada de sensores.
// ======================================

#include <WiFi.h>
#include <HTTPClient.h>

// ===== Credenciais =====
const char* ssid        = "IF-CampusMuz";
const char* password    = "";

const char* portal_user = "08873442676";
const char* portal_pass = "ifsuldeminas";

// ======================================

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.persistent(false);

  Serial.println();
  Serial.print("Conectando em ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    tentativas++;

    if (tentativas >= 120) {
      Serial.println();
      Serial.println("60s sem resposta. Reiniciando WiFi...");
      WiFi.disconnect();
      delay(500);
      WiFi.mode(WIFI_STA);
      WiFi.begin(ssid, password);
      tentativas = 0;
    }
  }

  Serial.println();
  Serial.println("CONECTADO!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("Sinal: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

void loginPortal() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi nao conectado — pulando portal");
    return;
  }

  // Primeiro — faz um GET em qualquer site para ser redirecionado ao portal
  Serial.println("Detectando portal captive...");
  {
    HTTPClient http;
    http.begin("http://clients3.google.com/generate_204");
    int code = http.GET();
    Serial.print("generate_204: ");
    Serial.println(code);
    http.end();
  }

  delay(1500);

  // Segundo — POST com as credenciais
  Serial.println("Enviando login...");

  WiFiClient client;
  HTTPClient http;
  String url = "http://10.12.192.1:8002/index.php?zone=ifcampusmuz";
  http.begin(client, url);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");

  String postData =
    "auth_user=" + String(portal_user) +
    "&auth_pass=" + String(portal_pass) +
    "&redirurl=https://www.muz.ifsuldeminas.edu.br" +
    "&accept=Entrar";

  int codigo = http.POST(postData);

  Serial.print("HTTP: ");
  Serial.println(codigo);

  if (codigo > 0) {
    String resposta = http.getString();
    Serial.print("Resposta: ");
    Serial.println(resposta.substring(0, 300));
  } else {
    Serial.print("Erro: ");
    Serial.println(http.errorToString(codigo));
  }

  http.end();
}

void testaInternet() {
  Serial.println("Testando internet...");

  WiFiClient client;
  HTTPClient http;
  http.begin(client, "http://clients3.google.com/generate_204");
  int codigo = http.GET();
  http.end();

  Serial.print("Google 204: ");
  Serial.println(codigo);

  if (codigo == 204) {
    Serial.println("INTERNET OK!");
  } else {
    Serial.println("Portal ainda bloqueando");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("TESTE WIFI + PORTAL");
  Serial.println("================================");

  connectWiFi();
  delay(2000);
  loginPortal();
  delay(3000);
  testaInternet();

  Serial.println();
  Serial.println("================================");
  Serial.println("FIM DO TESTE");
  Serial.println("================================");
}

void loop() {
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 30000) {
    lastCheck = millis();
    Serial.print("WiFi: ");
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("OK | IP: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("DESCONECTADO");
    }
  }
  delay(100);
}
