#pragma once

#include <Arduino.h>
#include <functional>

using MqttMessageCallback = std::function<void(const char *topic, const char *payload)>;

void mqttBegin(const char *broker, uint16_t port, const char *user, const char *pass,
               const char *clientId, MqttMessageCallback callback);
bool mqttIsConnected();
void mqttLoop();
bool mqttPublish(const char *topic, const char *payload, bool retained = false);
bool mqttSubscribe(const char *topic);
void mqttDisconnect();
