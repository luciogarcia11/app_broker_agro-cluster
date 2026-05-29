#pragma once

#include <Arduino.h>

#include "cluster.h"

void rolesBegin();
void rolesTick(const ClusterStatus &status);
