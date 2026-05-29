#pragma once

#include <Arduino.h>

#include "config.h"

#define LOG_LEVEL_NONE 0
#define LOG_LEVEL_ERROR 1
#define LOG_LEVEL_INFO 2
#define LOG_LEVEL_DEBUG 3

extern bool gLogEnabled;
void logSetEnabled(bool enabled);

#if LOG_LEVEL >= LOG_LEVEL_ERROR
#define LOGE(...) do { if (gLogEnabled) { Serial.printf(__VA_ARGS__); } } while (0)
#else
#define LOGE(...) do { } while (0)
#endif

#if LOG_LEVEL >= LOG_LEVEL_INFO
#define LOGI(...) do { if (gLogEnabled) { Serial.printf(__VA_ARGS__); } } while (0)
#else
#define LOGI(...) do { } while (0)
#endif

#if LOG_LEVEL >= LOG_LEVEL_DEBUG
#define LOGD(...) do { if (gLogEnabled) { Serial.printf(__VA_ARGS__); } } while (0)
#else
#define LOGD(...) do { } while (0)
#endif
