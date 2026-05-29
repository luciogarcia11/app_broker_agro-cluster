#include "sensors.h"


#include <Wire.h>
#include <Adafruit_BME280.h>
#include <BH1750.h>

#include <math.h>

#include "config.h"

static Adafruit_BME280 bme;
static BH1750 lightMeter;
static bool bmeOk = false;
static bool bhOk = false;
static uint8_t bmeFailCount = 0;
static uint8_t bhFailCount = 0;
static unsigned long lastBmeReadMs = 0;
static unsigned long lastLuxReadMs = 0;
static unsigned long lastBmeProbeMs = 0;
static unsigned long lastLuxProbeMs = 0;

static bool tryBeginBme() {
  if (bme.begin(BME280_ADDR_PRIMARY)) {
    return true;
  }

  return bme.begin(BME280_ADDR_SECONDARY);
}

void sensorsBegin() {
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  bmeOk = tryBeginBme();
  bhOk = lightMeter.begin();
  lastBmeProbeMs = millis();
  lastLuxProbeMs = millis();
}

bool sensorsIsBmeOk() {
  return bmeOk;
}

bool sensorsIsBh1750Ok() {
  return bhOk;
}

uint8_t sensorsBmeFailCount() {
  return bmeFailCount;
}

uint8_t sensorsBh1750FailCount() {
  return bhFailCount;
}

unsigned long sensorsLastBmeReadMs() {
  return lastBmeReadMs;
}

unsigned long sensorsLastLuxReadMs() {
  return lastLuxReadMs;
}

bool sensorsReadBme(BmeReadings &out) {
  out.ok = false;
  out.temperatureC = NAN;
  out.humidityPct = NAN;
  out.pressureHpa = NAN;

  if (!bmeOk && (millis() - lastBmeProbeMs >= SENSOR_RETRY_MS)) {
    bmeOk = tryBeginBme();
    lastBmeProbeMs = millis();
  }

  if (!bmeOk) {
    bmeFailCount++;
    return false;
  }

  float temperature = bme.readTemperature();
  float humidity = bme.readHumidity();
  float pressure = bme.readPressure() / 100.0F;

  lastBmeReadMs = millis();

  if (isnan(temperature) || isnan(humidity) || isnan(pressure)) {
    bmeFailCount++;
    return false;
  }

  out.ok = true;
  out.temperatureC = temperature;
  out.humidityPct = humidity;
  out.pressureHpa = pressure;
  return true;
}

bool sensorsReadLux(LuxReadings &out) {
  out.ok = false;
  out.lux = NAN;

  if (!bhOk && (millis() - lastLuxProbeMs >= SENSOR_RETRY_MS)) {
    bhOk = lightMeter.begin();
    lastLuxProbeMs = millis();
  }

  if (!bhOk) {
    bhFailCount++;
    return false;
  }

  float lux = lightMeter.readLightLevel();
  lastLuxReadMs = millis();

  if (isnan(lux)) {
    bhFailCount++;
    return false;
  }

  out.ok = true;
  out.lux = lux;
  return true;
}
