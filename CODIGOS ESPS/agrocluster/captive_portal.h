#pragma once

#include <Arduino.h>

void captivePortalBegin(const char *portalUser, const char *portalPassword);
bool captivePortalIsAuthenticated();
void captivePortalLoop();
