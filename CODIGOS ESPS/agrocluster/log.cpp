#include "log.h"

bool gLogEnabled = false;

void logSetEnabled(bool enabled) {
  gLogEnabled = enabled;
}
