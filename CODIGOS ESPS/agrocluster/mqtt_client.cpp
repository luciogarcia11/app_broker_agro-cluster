#include "mqtt_client.h"

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

#include "config.h"
#include "log.h"

static WiFiClientSecure mqttWifiClient;
static PubSubClient mqttClient;
static char mqttBroker[64] = "";
static uint16_t mqttPort = 8883;
static char mqttUser[32] = "";
static char mqttPass[32] = "";
static char mqttClientId[32] = "";
static MqttMessageCallback userCallback = nullptr;
static unsigned long lastReconnectMs = 0;
static bool initialConnect = true;

static void onMqttMessage(char *topic, byte *payload, unsigned int length) {
  char buf[128];
  unsigned int len = length < sizeof(buf) - 1 ? length : sizeof(buf) - 1;
  memcpy(buf, payload, len);
  buf[len] = '\0';

  LOGD("MQTT recv: %s → %s\n", topic, buf);

  if (userCallback) {
    userCallback(topic, buf);
  }
}

void mqttBegin(const char *broker, uint16_t port, const char *user, const char *pass,
               const char *clientId, MqttMessageCallback callback) {
  strncpy(mqttBroker, broker, sizeof(mqttBroker) - 1);
  mqttPort = port;
  strncpy(mqttUser, user, sizeof(mqttUser) - 1);
  strncpy(mqttPass, pass, sizeof(mqttPass) - 1);
  strncpy(mqttClientId, clientId, sizeof(mqttClientId) - 1);
  userCallback = callback;

  mqttWifiClient.setInsecure();
  mqttWifiClient.setHandshakeTimeout(10);
  mqttClient.setClient(mqttWifiClient);
  mqttClient.setServer(mqttBroker, mqttPort);
  mqttClient.setCallback(onMqttMessage);
  mqttClient.setBufferSize(1024);

  LOGI("MQTT configurado: %s:%d\n", mqttBroker, mqttPort);
}

bool mqttIsConnected() {
  return mqttClient.connected();
}

static bool tryConnect() {
  LOGI("Conectando MQTT como %s ...\n", mqttClientId);

  bool ok = mqttClient.connect(mqttClientId, mqttUser, mqttPass,
                                "agrocluster/status", 1, true, "{\"clusterStatus\":\"OFFLINE\",\"activeEsps\":0}");

  if (ok) {
    LOGI("MQTT conectado!\n");

    mqttClient.subscribe("agrocluster/cmd/light");
    mqttClient.subscribe("agrocluster/cmd/fan");

    LOGI("MQTT inscrito em agrocluster/cmd/light, agrocluster/cmd/fan\n");

    mqttClient.publish("agrocluster/status", "{\"clusterStatus\":\"OK\",\"activeEsps\":1}", true);
  } else {
    LOGE("MQTT falhou (rc=%d)\n", mqttClient.state());
  }

  return ok;
}

void mqttLoop() {
  if (mqttClient.connected()) {
    mqttClient.loop();
    return;
  }

  if (mqttBroker[0] == '\0') {
    return;
  }

  if (!WiFi.isConnected()) {
    return;
  }

  if (initialConnect || (millis() - lastReconnectMs >= MQTT_RECONNECT_MS)) {
    initialConnect = false;
    lastReconnectMs = millis();
    tryConnect();
  }
}

bool mqttPublish(const char *topic, const char *payload, bool retained) {
  if (!mqttClient.connected()) {
    LOGW("MQTT desconectado, não publicou %s\n", topic);
    return false;
  }

  bool ok = mqttClient.publish(topic, payload, retained);
  if (ok) {
    LOGD("MQTT pub: %s → %s\n", topic, payload);
  } else {
    LOGW("MQTT pub falhou: %s\n", topic);
  }
  return ok;
}

bool mqttSubscribe(const char *topic) {
  if (!mqttClient.connected()) {
    return false;
  }
  return mqttClient.subscribe(topic);
}

void mqttDisconnect() {
  if (mqttClient.connected()) {
    mqttClient.publish("agrocluster/status", "{\"clusterStatus\":\"OFFLINE\",\"activeEsps\":0}", true);
    mqttClient.disconnect();
  }
}
