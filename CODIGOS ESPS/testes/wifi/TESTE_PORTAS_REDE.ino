// ======================================
// TESTE: Portas de rede (firewall)
// ======================================
// Conecta no WiFi da escola, testa
// varias portas TCP no broker MQTT,
// e mostra quais estao acessiveis.
// ======================================

#include <WiFi.h>

const char* ssid       = "IF-CampusMuz";
const char* password   = "";

const char* portal_user = "08873442676";
const char* portal_pass = "ifsuldeminas";

struct TestePorta {
  const char* host;
  uint16_t porta;
  const char* descricao;
};

static const TestePorta portas[] = {
  // Broker MQTT HiveMQ Cloud
  {"6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud", 8883, "MQTT TLS"},
  {"6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud", 8884, "MQTT WebSocket TLS"},

  // Portas comuns (controle)
  {"google.com", 80,   "HTTP (controle)"},
  {"google.com", 443,  "HTTPS (controle)"},
};

static const int numPortas = sizeof(portas) / sizeof(portas[0]);
static bool resultados[numPortas];

void connectWiFi() {
  Serial.print("\nConectando WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int tentativas = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    tentativas++;
    if (tentativas > 120) {
      Serial.println("\n[ERRO] WiFi nao conectou");
      return;
    }
  }

  Serial.println(" CONECTADO!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void loginPortal() {
  if (WiFi.status() != WL_CONNECTED) return;

  Serial.println("Login portal...");
  WiFiClient client;
  if (!client.connect("10.12.192.1", 8002, 5000)) {
    Serial.println("  Portal nao respondeu (pode ja estar logado)");
    return;
  }

  String body = "auth_user=" + String(portal_user) +
                "&auth_pass=" + String(portal_pass) +
                "&redirurl=https://www.muz.ifsuldeminas.edu.br" +
                "&accept=Entrar";

  client.print("POST /index.php?zone=ifcampusmuz HTTP/1.0\r\n");
  client.print("Host: 10.12.192.1:8002\r\n");
  client.print("Content-Type: application/x-www-form-urlencoded\r\n");
  client.print("Content-Length: ");
  client.print(body.length());
  client.print("\r\n");
  client.print("Connection: close\r\n\r\n");
  client.print(body);
  delay(2000);
  client.stop();
  Serial.println("  Login enviado");
}

bool testaPorta(const char* host, uint16_t porta, int timeoutMs) {
  WiFiClient client;
  bool ok = client.connect(host, porta, timeoutMs);
  client.stop();
  return ok;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================");
  Serial.println("TESTE DE PORTAS DE REDE");
  Serial.println("========================================\n");

  connectWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  loginPortal();
  delay(3000);

  Serial.println("\n----------------------------------------");
  Serial.println("Testando portas...");
  Serial.println("----------------------------------------\n");

  for (int i = 0; i < numPortas; i++) {
    Serial.print("  ");
    Serial.print(portas[i].descricao);
    Serial.print(" (");
    Serial.print(portas[i].host);
    Serial.print(":");
    Serial.print(portas[i].porta);
    Serial.print(") ... ");

    bool ok = testaPorta(portas[i].host, portas[i].porta, 5000);
    resultados[i] = ok;

    if (ok) {
      Serial.println("ABERTA");
    } else {
      Serial.println("BLOQUEADA / TIMEOUT");
    }

    delay(500);
  }

  Serial.println("\n----------------------------------------");
  Serial.println("RESULTADO FINAL");
  Serial.println("----------------------------------------\n");

  int abertas = 0;
  for (int i = 0; i < numPortas; i++) {
    if (resultados[i]) {
      Serial.print("  [OK] ");
      abertas++;
    } else {
      Serial.print("  [--] ");
    }
    Serial.print(portas[i].descricao);
    Serial.print(" -> ");
    Serial.print(portas[i].host);
    Serial.print(":");
    Serial.println(portas[i].porta);
  }

  Serial.println("\n----------------------------------------");
  if (abertas > 0) {
    Serial.print("  ");
    Serial.print(abertas);
    Serial.print(" de ");
    Serial.print(numPortas);
    Serial.println(" portas acessiveis");
  } else {
    Serial.println("  NENHUMA porta acessivel :(");
  }
  Serial.println("----------------------------------------\n");
  Serial.println("FIM DO TESTE");
}

void loop() {
  delay(30000);
  Serial.print("WiFi: ");
  Serial.println(WiFi.status() == WL_CONNECTED ? "OK" : "OFF");
}
