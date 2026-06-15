#pragma once

#include <Arduino.h>

void wifiConnectBegin(const char *ssid, const char *password);
bool wifiIsConnected();
void wifiConnectLoop();
bool wifiWaitForConnect(unsigned long timeoutMs);
const char *wifiGetLocalIp();
