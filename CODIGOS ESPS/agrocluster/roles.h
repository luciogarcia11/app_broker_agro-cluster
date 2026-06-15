#pragma once

#include <Arduino.h>

#include "cluster.h"

void rolesBegin();
void rolesTick(const ClusterStatus &status);
void rolesHandleCommand(const char *topic, const char *payload);
void rolesPublishMqtt();
void rolesPublishEspList(const ClusterStatus &status);
