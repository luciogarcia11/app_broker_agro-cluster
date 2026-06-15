#include "roles.h"

#include "relays.h"
#include "sensors.h"

#include "cluster.h"
#include "config.h"
#include "log.h"
#include "mqtt_client.h"

static const int ROLE_TEMP_HUM = 1;
static const int ROLE_LUX = 2;
static const int ROLE_LIGHT_RELAY = 3;
static const int ROLE_FAN_RELAY = 4;

static unsigned long lastRoleTick = 0;
static unsigned long lastMqttPublish = 0;
static unsigned long lastEspListPublish = 0;
static bool fanState = false;
static bool lightState = false;
static bool prevDayState = true;

static char espIdStr[8] = "";

void rolesBegin() {
  relaysBegin();
  sensorsBegin();

  if (sensorsIsBmeOk()) {
    LOGI("BME280 OK\n");
  } else {
    LOGE("ERRO BME280\n");
  }

  if (sensorsIsBh1750Ok()) {
    LOGI("BH1750 OK\n");
  } else {
    LOGE("ERRO BH1750\n");
  }
}

static bool shouldRole(int myId, int roleId, const ClusterStatus &status) {
  return (myId == roleId) || (status.isLeader && !status.active[roleId]);
}

void rolesTick(const ClusterStatus &status) {
  snprintf(espIdStr, sizeof(espIdStr), "esp-%d", status.myId);

  bool shouldReadBme = shouldRole(status.myId, ROLE_TEMP_HUM, status);
  bool shouldReadLux = shouldRole(status.myId, ROLE_LUX, status);
  bool shouldControlLight = shouldRole(status.myId, ROLE_LIGHT_RELAY, status);
  bool shouldControlFan = shouldRole(status.myId, ROLE_FAN_RELAY, status);

  if (millis() - lastRoleTick > ROLE_TICK_INTERVAL_MS) {
    lastRoleTick = millis();

    if (shouldReadBme) {
      BmeReadings bme;
      if (sensorsReadBme(bme)) {
        clusterPublishBme(bme.temperatureC, bme.humidityPct, bme.pressureHpa);
        LOGD("BME ok: T=%.2f H=%.2f P=%.2f\n", bme.temperatureC, bme.humidityPct, bme.pressureHpa);
      } else {
        LOGE("BME leitura falhou (%u)\n", sensorsBmeFailCount());
      }
    }

    if (shouldReadLux) {
      LuxReadings lux;
      if (sensorsReadLux(lux)) {
        clusterPublishLux(lux.lux);
        LOGD("LUX ok: %.2f\n", lux.lux);
      } else {
        LOGE("BH1750 leitura falhou (%u)\n", sensorsBh1750FailCount());
      }
    }

    SharedReadings shared = clusterGetSharedReadings();
    unsigned long now = millis();

    if (shouldControlFan) {
      bool bmeFresh = shared.hasBme && (now - shared.lastBmeMs <= SENSOR_STALE_MS);

      if (!bmeFresh) {
        LOGE("Sem BME fresco para FAN\n");
        relaySetFan(false);
        fanState = false;
      } else {
        bool turnOn = (shared.temperatureC >= TEMP_ON_C) || (shared.humidityPct >= HUM_ON_PCT);
        bool turnOff = (shared.temperatureC <= TEMP_OFF_C) && (shared.humidityPct <= HUM_OFF_PCT);

        if (!fanState && turnOn) {
          fanState = true;
          relaySetFan(true);
          clusterPublishFanState(true);
          LOGI("FAN ON\n");
        } else if (fanState && turnOff) {
          fanState = false;
          relaySetFan(false);
          clusterPublishFanState(false);
          LOGI("FAN OFF\n");
        }
      }
    }

    if (shouldControlLight) {
      bool luxFresh = shared.hasLux && (now - shared.lastLuxMs <= SENSOR_STALE_MS);

      if (!luxFresh) {
        LOGE("Sem LUX fresco para LIGHT\n");
        relaySetLight(false);
        lightState = false;
      } else {
        bool turnOn = (shared.lux <= LUX_ON);
        bool turnOff = (shared.lux >= LUX_OFF);

        if (!lightState && turnOn) {
          lightState = true;
          relaySetLight(true);
          clusterPublishLightState(true);
          LOGI("LIGHT ON\n");
        } else if (lightState && turnOff) {
          lightState = false;
          relaySetLight(false);
          clusterPublishLightState(false);
          LOGI("LIGHT OFF\n");
        }
      }
    }

    if (shared.hasLux) {
      prevDayState = (shared.lux >= LUX_OFF);
    }

    if (status.isLeader) {
      clusterPrintStatus(status);
    }
  }
}

void rolesHandleCommand(const char *topic, const char *payload) {
  bool isLight = (strcmp(topic, "agrocluster/cmd/light") == 0);
  bool isFan = (strcmp(topic, "agrocluster/cmd/fan") == 0);

  if (!isLight && !isFan) {
    return;
  }

  bool turnOn = (strcmp(payload, "ON") == 0);
  bool turnOff = (strcmp(payload, "OFF") == 0);

  if (!turnOn && !turnOff) {
    LOGW("Comando invalido: %s\n", payload);
    return;
  }

  if (isFan) {
    fanState = turnOn;
    relaySetFan(fanState);
    clusterPublishFanState(fanState);
    LOGI("CMD fan: %s\n", payload);
  }

  if (isLight) {
    lightState = turnOn;
    relaySetLight(lightState);
    clusterPublishLightState(lightState);
    LOGI("CMD light: %s\n", payload);
  }
}

static void publishActuators() {
  SharedReadings shared = clusterGetSharedReadings();

  char json[128];
  snprintf(json, sizeof(json),
           "{\"fan\":%s,\"light\":%s,\"espId\":\"%s\"}",
           shared.fanState ? "true" : "false",
           shared.lightState ? "true" : "false",
           espIdStr[0] ? espIdStr : "esp-?");
  mqttPublish("agrocluster/actuators", json);
}

static void publishSensorBme() {
  SharedReadings shared = clusterGetSharedReadings();
  if (!shared.hasBme) {
    return;
  }

  char json[128];
  snprintf(json, sizeof(json),
           "{\"temperature\":%.2f,\"humidity\":%.2f,\"pressure\":%.2f,\"espId\":\"esp-%d\"}",
           shared.temperatureC, shared.humidityPct, shared.pressureHpa, shared.bmeSourceId);
  mqttPublish("agrocluster/sensors/bme280", json);
}

static void publishSensorLux() {
  SharedReadings shared = clusterGetSharedReadings();
  if (!shared.hasLux) {
    return;
  }

  bool isDay = (shared.lux >= LUX_OFF);

  char json[96];
  snprintf(json, sizeof(json),
           "{\"lux\":%.2f,\"state\":\"%s\",\"espId\":\"esp-%d\"}",
           shared.lux, isDay ? "DAY" : "NIGHT", shared.luxSourceId);
  mqttPublish("agrocluster/sensors/lux", json);
}

static void publishStatus() {
  SharedReadings shared = clusterGetSharedReadings();
  unsigned long now = millis();
  bool bmeFresh = shared.hasBme && (now - shared.lastBmeMs <= SENSOR_STALE_MS);
  bool luxFresh = shared.hasLux && (now - shared.lastLuxMs <= SENSOR_STALE_MS);

  const char *clusterStatus = "OFFLINE";
  int activeCount = 1;

  if (bmeFresh || luxFresh) {
    clusterStatus = "OK";
    activeCount = 2;
  }

  char json[64];
  snprintf(json, sizeof(json),
           "{\"clusterStatus\":\"%s\",\"activeEsps\":%d}",
           clusterStatus, activeCount);
  mqttPublish("agrocluster/status", json, true);
}

void rolesPublishEspList(const ClusterStatus &status) {
  const uint8_t (*macs)[6] = clusterGetPeerMacs();

  char buf[512];
  int pos = 0;
  pos += snprintf(buf + pos, sizeof(buf) - pos, "[");

  for (int i = 0; i < 4; i++) {
    if (i > 0 && pos < (int)sizeof(buf) - 2) {
      buf[pos++] = ',';
    }

    const char *role = (i == 0) ? "Sensor" :
                        (i == 1) ? "Sensor" :
                        (i == 2) ? "Relay" :
                        "Relay";
    int rssi = -60;
    if (status.active[i + 1]) {
      rssi = -50;
    }

    pos += snprintf(buf + pos, sizeof(buf) - pos,
                    "{\"id\":\"esp-%d\",\"mac\":\"%02X:%02X:%02X:%02X:%02X:%02X\","
                    "\"role\":\"%s\",\"online\":%s,\"rssi\":%d,\"lastSeen\":%lu}",
                    i + 1,
                    macs[i][0], macs[i][1], macs[i][2], macs[i][3], macs[i][4], macs[i][5],
                    role,
                    status.active[i + 1] ? "true" : "false",
                    rssi,
                    status.lastHeartbeatMs[i + 1]);
  }

  if (pos < (int)sizeof(buf) - 1) {
    buf[pos++] = ']';
    buf[pos] = '\0';
  }

  mqttPublish("agrocluster/esp/list", buf);
}

void rolesPublishMqtt() {
  if (!mqttIsConnected()) {
    return;
  }

  unsigned long now = millis();

  if (now - lastMqttPublish >= MQTT_PUBLISH_INTERVAL_MS) {
    lastMqttPublish = now;

    publishSensorBme();
    publishSensorLux();
    publishActuators();
    publishStatus();
  }
}
