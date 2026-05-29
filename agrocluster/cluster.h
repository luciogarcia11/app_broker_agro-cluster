#pragma once

#include <Arduino.h>

struct ClusterStatus {
  bool active[5];
  int leader;
  bool isLeader;
  int myId;
  unsigned long lastHeartbeatMs[5];
  unsigned long lastAckMs[5];
  bool hasQuorum;
};

struct SharedReadings {
  float temperatureC;
  float humidityPct;
  float pressureHpa;
  float lux;
  bool hasBme;
  bool hasLux;
  unsigned long lastBmeMs;
  unsigned long lastLuxMs;
  uint8_t bmeSourceId;
  uint8_t luxSourceId;
  bool fanState;
  bool lightState;
  unsigned long lastFanMs;
  unsigned long lastLightMs;
  uint8_t fanSourceId;
  uint8_t lightSourceId;
  uint8_t fanControllerId;
  uint8_t lightControllerId;
};

int clusterResolveId(const uint8_t macs[4][6]);
void clusterBegin(int myId, const uint8_t macs[4][6]);
ClusterStatus clusterUpdate();
void clusterPrintStatus(const ClusterStatus &status);
SharedReadings clusterGetSharedReadings();
void clusterPublishBme(float temperatureC, float humidityPct, float pressureHpa);
void clusterPublishLux(float lux);
void clusterPublishFanState(bool on);
void clusterPublishLightState(bool on);
void clusterPublishRelayControllers(uint8_t fanControllerId, uint8_t lightControllerId);
