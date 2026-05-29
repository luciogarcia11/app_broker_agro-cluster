#pragma once

#include <Arduino.h>

struct BmeReadings {
  float temperatureC;
  float humidityPct;
  float pressureHpa;
  bool ok;
};

struct LuxReadings {
  float lux;
  bool ok;
};

void sensorsBegin();
bool sensorsIsBmeOk();
bool sensorsIsBh1750Ok();
uint8_t sensorsBmeFailCount();
uint8_t sensorsBh1750FailCount();
unsigned long sensorsLastBmeReadMs();
unsigned long sensorsLastLuxReadMs();
bool sensorsReadBme(BmeReadings &out);
bool sensorsReadLux(LuxReadings &out);
