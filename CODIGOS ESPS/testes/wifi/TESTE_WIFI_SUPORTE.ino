// ======================================
// TESTE: WiFi - Suporte
// ======================================
// Conecta na rede "Suporte".
// Sem portal, sem MQTT, sem sensores.
// ======================================

#include <WiFi.h>

const char* ssid     = "Suporte";
const char* password = "37361411";

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("TESTE WIFI - SUPORTE");
  Serial.println("================================");

  WiFi.persistent(false);
  WiFi.disconnect(true);
  delay(300);
  WiFi.mode(WIFI_STA);
  delay(300);

  Serial.print("Conectando em ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    tentativas++;
    if (tentativas > 60) {
      Serial.println();
      Serial.println("ERRO: Nao conectou");
      return;
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

void loop() {
  delay(30000);

  Serial.print("WiFi: ");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("OK - IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("DESCONECTADO");
  }
}
