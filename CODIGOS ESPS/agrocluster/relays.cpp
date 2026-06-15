#include "relays.h"

#include "config.h"

void relaysBegin() {
  pinMode(RELAY_FAN_PIN, OUTPUT_OPEN_DRAIN);
  pinMode(RELAY_LIGHT_PIN, OUTPUT_OPEN_DRAIN);

  digitalWrite(RELAY_FAN_PIN, RELAY_OFF);
  digitalWrite(RELAY_LIGHT_PIN, RELAY_OFF);
}

void relaySetFan(bool on) {
  digitalWrite(RELAY_FAN_PIN, on ? RELAY_ON : RELAY_OFF);
}

void relaySetLight(bool on) {
  digitalWrite(RELAY_LIGHT_PIN, on ? RELAY_ON : RELAY_OFF);
}
