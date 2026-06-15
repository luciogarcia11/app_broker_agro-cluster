#include "captive_portal.h"

#include <WiFi.h>
#include <WiFiClient.h>

#include "config.h"
#include "log.h"

// URL do captive portal do IFSul - Campus Muzambinho
static const char *PORTAL_URL = "http://10.12.192.1:8002/index.php?zone=ifcampusmuz";

static const unsigned long PORTAL_RETRY_MS = 60000;

static bool authenticated = false;
static unsigned long lastAttemptMs = 0;
static char portalUser[48] = "";
static char portalPass[48] = "";

// Modo AGUARDANDO: internet caiu, espera voltar
static bool internetLost = false;
static unsigned long internetLostMs = 0;

void captivePortalBegin(const char *portalUser_, const char *portalPassword_) {
  if (portalUser_) strncpy(portalUser, portalUser_, sizeof(portalUser) - 1);
  if (portalPassword_) strncpy(portalPass, portalPassword_, sizeof(portalPass) - 1);

  if (strlen(portalUser) == 0 || strlen(portalPass) == 0) {
    LOGI("Sem credenciais de portal — pulando autenticacao\n");
    authenticated = true;
    return;
  }
}

bool captivePortalIsAuthenticated() {
  return authenticated;
}

static bool tryLogin() {
  if (WiFi.status() != WL_CONNECTED) {
    LOGW("Portal: WiFi nao conectado\n");
    return false;
  }

  // Pré-requisição: dispara o redirecionamento do portal
  {
    WiFiClient trigger;
    trigger.connect("clients3.google.com", 80, 3000);
    trigger.print("GET /generate_204 HTTP/1.0\r\nHost: clients3.google.com\r\nConnection: close\r\n\r\n");
    delay(1000);
    trigger.stop();
  }

  WiFiClient client;
  if (!client.connect("10.12.192.1", 8002, 5000)) {
    LOGW("Portal: falha ao conectar em 10.12.192.1:8002\n");
    return false;
  }

  String body = "auth_user=" + String(portalUser) +
                "&auth_pass=" + String(portalPass) +
                "&redirurl=https://www.muz.ifsuldeminas.edu.br" +
                "&accept=Entrar";

  client.print("POST /index.php?zone=ifcampusmuz HTTP/1.0\r\n");
  client.print("Host: 10.12.192.1:8002\r\n");
  client.print("Content-Type: application/x-www-form-urlencoded\r\n");
  client.print("Content-Length: ");
  client.print(body.length());
  client.print("\r\n");
  client.print("Connection: close\r\n");
  client.print("\r\n");
  client.print(body);

  unsigned long timeout = millis() + 5000;
  while (client.connected() && millis() < timeout) {
    if (client.available()) break;
    delay(5);
  }

  char response[512];
  size_t idx = 0;
  while (client.available() && idx < sizeof(response) - 1) {
    response[idx++] = client.read();
  }
  response[idx] = '\0';
  client.stop();

  int httpCode = 0;
  sscanf(response, "HTTP/1.%*d %d", &httpCode);

  LOGI("Portal HTTP code: %d\n", httpCode);

  if (httpCode == 200 || httpCode == 302 || httpCode == 301) {
    LOGI("Login portal enviado com sucesso!\n");
    return true;
  }

  LOGW("Falha no login portal (HTTP %d)\n", httpCode);
  return false;
}

static bool checkInternet() {
  WiFiClient testClient;
  if (testClient.connect("clients3.google.com", 80, 2000)) {
    testClient.stop();
    return true;
  }
  return false;
}

void captivePortalLoop() {
  if (authenticated) {
    // WiFi caiu de vez? Marca como não autenticado
    if (WiFi.status() != WL_CONNECTED) {
      authenticated = false;
      internetLost = false;
      lastAttemptMs = 0;
      return;
    }

    // Internet OK, continua
    if (checkInternet()) {
      if (internetLost) {
        LOGI("Internet restaurada!\n");
        internetLost = false;
      }
      return;
    }

    // Internet caiu — aguarda (não reautentica)
    if (!internetLost) {
      LOGW("Internet caiu — aguardando voltar...\n");
      internetLost = true;
      internetLostMs = millis();
    }

    // Só força reautenticação depois de 5min sem internet
    if (millis() - internetLostMs > 300000) {
      LOGW("5min sem internet — forçando reautenticação\n");
      internetLost = false;
      authenticated = false;
      lastAttemptMs = 0;
    }
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (millis() - lastAttemptMs < PORTAL_RETRY_MS && lastAttemptMs != 0) {
    return;
  }

  lastAttemptMs = millis();

  LOGI("Autenticando no captive portal...\n");

  if (tryLogin()) {
    delay(2000);

    if (checkInternet()) {
      LOGI("Portal autenticado! Internet OK\n");
      authenticated = true;
      internetLost = false;
    } else {
      LOGW("Login enviado, mas internet ainda sem resposta\n");
      authenticated = true;
    }
  }
}
