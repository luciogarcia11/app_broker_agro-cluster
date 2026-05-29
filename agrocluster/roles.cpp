#include "roles.h"

#include "relays.h"
#include "sensors.h"

#include "cluster.h"
#include "config.h"
#include "log.h"

static const int ROLE_TEMP_HUM = 1;
static const int ROLE_LUX = 2;
static const int ROLE_LIGHT_RELAY = 3;
static const int ROLE_FAN_RELAY = 4;

static unsigned long lastRoleTick = 0;
static bool fanState = false;
static bool lightState = false;

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

void rolesTick(const ClusterStatus &status) {
  bool shouldReadBme = (status.myId == ROLE_TEMP_HUM) || (status.isLeader && !status.active[ROLE_TEMP_HUM]);
  bool shouldReadLux = (status.myId == ROLE_LUX) || (status.isLeader && !status.active[ROLE_LUX]);
  bool shouldControlLight = (status.myId == ROLE_LIGHT_RELAY) || (status.isLeader && !status.active[ROLE_LIGHT_RELAY]);
  bool shouldControlFan = (status.myId == ROLE_FAN_RELAY) || (status.isLeader && !status.active[ROLE_FAN_RELAY]);

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

    if (status.isLeader) {
      bool bmeFresh = shared.hasBme && (now - shared.lastBmeMs <= SENSOR_STALE_MS);
      bool luxFresh = shared.hasLux && (now - shared.lastLuxMs <= SENSOR_STALE_MS);
      bool fanFresh = (now - shared.lastFanMs <= SENSOR_STALE_MS);
      bool lightFresh = (now - shared.lastLightMs <= SENSOR_STALE_MS);

      int bmeSource = shared.bmeSourceId;
      int luxSource = shared.luxSourceId;
      int fanController = status.active[ROLE_FAN_RELAY] ? ROLE_FAN_RELAY : status.leader;
      int lightController = status.active[ROLE_LIGHT_RELAY] ? ROLE_LIGHT_RELAY : status.leader;

      clusterPublishRelayControllers(fanController, lightController);

      Serial.println("==== STATUS ====");
      if (bmeFresh) {
        Serial.print("Temp (esp");
        Serial.print(bmeSource);
        Serial.print("): ");
        Serial.print(shared.temperatureC);
        Serial.println(" C");
      } else {
        Serial.print("Temp: ");
        Serial.println("N/A");
      }

      if (bmeFresh) {
        Serial.print("Umid (esp");
        Serial.print(bmeSource);
        Serial.print("): ");
        Serial.print(shared.humidityPct);
        Serial.println(" %");
      } else {
        Serial.print("Umid: ");
        Serial.println("N/A");
      }

      if (bmeFresh) {
        Serial.print("Press (esp");
        Serial.print(bmeSource);
        Serial.print("): ");
        Serial.print(shared.pressureHpa);
        Serial.println(" hPa");
      } else {
        Serial.print("Press: ");
        Serial.println("N/A");
      }

      if (luxFresh) {
        Serial.print("Lux (esp");
        Serial.print(luxSource);
        Serial.print("): ");
        Serial.print(shared.lux);
        Serial.println(" lx");
      } else {
        Serial.print("Lux: ");
        Serial.println("N/A");
      }

      Serial.print("FAN (esp");
      Serial.print(fanController);
      Serial.print("): ");
      Serial.println(shared.fanState ? "ON" : "OFF");
      Serial.print("LIGHT (esp");
      Serial.print(lightController);
      Serial.print("): ");
      Serial.println(shared.lightState ? "ON" : "OFF");

      clusterPrintStatus(status);
    }
  }
}
