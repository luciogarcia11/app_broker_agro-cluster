#include "cluster.h"

#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

#include "config.h"
#include "log.h"

static uint8_t peerMacs[4][6];
static int selfId = 1;
static const uint8_t serverMac[6] = {0xE4, 0x65, 0xB8, 0x11, 0x0A, 0x4C};
static unsigned long lastHeartbeat[5] = {0};
static unsigned long lastSend = 0;
static unsigned long lastAck[5] = {0};
static uint16_t heartbeatSeq = 0;
static uint16_t relaySeq = 0;
static bool lastActiveState[5] = {false};

static bool pendingFan = false;
static bool pendingLight = false;
static uint16_t pendingFanSeq = 0;
static uint16_t pendingLightSeq = 0;
static bool pendingFanState = false;
static bool pendingLightState = false;
static unsigned long pendingFanSendMs = 0;
static unsigned long pendingLightSendMs = 0;

static SharedReadings sharedReadings = {};

enum MessageType : uint8_t {
  MSG_HEARTBEAT = 1,
  MSG_ACK = 2,
  MSG_SENSOR = 3,
  MSG_RELAY = 4
};

struct MessageHeader {
  uint8_t type;
  uint8_t fromId;
  uint16_t seq;
};

struct HeartbeatMessage {
  MessageHeader header;
};

struct AckMessage {
  MessageHeader header;
  uint8_t ackType;
};

struct SensorMessage {
  MessageHeader header;
  uint8_t flags;
  float temperatureC;
  float humidityPct;
  float pressureHpa;
  float lux;
};

struct RelayMessage {
  MessageHeader header;
  uint8_t flags;
  uint8_t fanState;
  uint8_t lightState;
  uint8_t fanControllerId;
  uint8_t lightControllerId;
};

static void sendToAllPeers(const uint8_t *data, size_t len) {
  for (int i = 0; i < 4; i++) {
    if (i != (selfId - 1)) {
      esp_now_send(peerMacs[i], data, len);
    }
  }

  esp_now_send(serverMac, data, len);
}

static void sendRelayMessage(uint8_t flags, bool fanState, bool lightState, uint8_t fanControllerId, uint8_t lightControllerId, uint16_t seq) {
  RelayMessage msg = {};
  msg.header.type = MSG_RELAY;
  msg.header.fromId = selfId;
  msg.header.seq = seq;
  msg.flags = flags;
  msg.fanState = fanState ? 1 : 0;
  msg.lightState = lightState ? 1 : 0;
  msg.fanControllerId = fanControllerId;
  msg.lightControllerId = lightControllerId;

  sendToAllPeers((uint8_t *)&msg, sizeof(msg));
}

static void OnDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  if (len < (int)sizeof(MessageHeader)) {
    return;
  }

  MessageHeader header;
  memcpy(&header, incomingData, sizeof(header));

  if (header.fromId < 1 || header.fromId > 4) {
    return;
  }

  if (header.type == MSG_HEARTBEAT && len >= (int)sizeof(HeartbeatMessage)) {
    lastHeartbeat[header.fromId] = millis();

    AckMessage ack = {};
    ack.header.type = MSG_ACK;
    ack.header.fromId = selfId;
    ack.header.seq = header.seq;
    ack.ackType = MSG_HEARTBEAT;

    esp_now_send(info->src_addr, (uint8_t *)&ack, sizeof(ack));
    return;
  }

  if (header.type == MSG_ACK && len >= (int)sizeof(AckMessage)) {
    AckMessage ackMsg;
    memcpy(&ackMsg, incomingData, sizeof(ackMsg));

    if (ackMsg.ackType == MSG_HEARTBEAT) {
      lastAck[header.fromId] = millis();
    } else if (ackMsg.ackType == MSG_RELAY) {
      if (pendingFan && ackMsg.header.seq == pendingFanSeq) {
        pendingFan = false;
      }
      if (pendingLight && ackMsg.header.seq == pendingLightSeq) {
        pendingLight = false;
      }
    }
    return;
  }

  if (header.type == MSG_SENSOR && len >= (int)sizeof(SensorMessage)) {
    SensorMessage sensorMsg;
    memcpy(&sensorMsg, incomingData, sizeof(sensorMsg));

    if (sensorMsg.flags & 0x01) {
      sharedReadings.temperatureC = sensorMsg.temperatureC;
      sharedReadings.humidityPct = sensorMsg.humidityPct;
      sharedReadings.pressureHpa = sensorMsg.pressureHpa;
      sharedReadings.hasBme = true;
      sharedReadings.lastBmeMs = millis();
      sharedReadings.bmeSourceId = header.fromId;
    }

    if (sensorMsg.flags & 0x02) {
      sharedReadings.lux = sensorMsg.lux;
      sharedReadings.hasLux = true;
      sharedReadings.lastLuxMs = millis();
      sharedReadings.luxSourceId = header.fromId;
    }

    return;
  }

  if (header.type == MSG_RELAY && len >= (int)sizeof(RelayMessage)) {
    RelayMessage relayMsg;
    memcpy(&relayMsg, incomingData, sizeof(relayMsg));

    if (relayMsg.flags & 0x01) {
      sharedReadings.fanState = (relayMsg.fanState != 0);
      sharedReadings.lastFanMs = millis();
      sharedReadings.fanSourceId = header.fromId;
    }

    if (relayMsg.flags & 0x02) {
      sharedReadings.lightState = (relayMsg.lightState != 0);
      sharedReadings.lastLightMs = millis();
      sharedReadings.lightSourceId = header.fromId;
    }

    if (relayMsg.flags & 0x04) {
      sharedReadings.fanControllerId = relayMsg.fanControllerId;
    }

    if (relayMsg.flags & 0x08) {
      sharedReadings.lightControllerId = relayMsg.lightControllerId;
    }

    AckMessage ack = {};
    ack.header.type = MSG_ACK;
    ack.header.fromId = selfId;
    ack.header.seq = header.seq;
    ack.ackType = MSG_RELAY;
    esp_now_send(info->src_addr, (uint8_t *)&ack, sizeof(ack));

    return;
  }
}

int clusterResolveId(const uint8_t macs[4][6]) {
  uint8_t selfMac[6] = {0};
  esp_wifi_get_mac(WIFI_IF_STA, selfMac);

  for (int i = 0; i < 4; i++) {
    bool match = true;
    for (int b = 0; b < 6; b++) {
      if (selfMac[b] != macs[i][b]) {
        match = false;
        break;
      }
    }

    if (match) {
      return i + 1;
    }
  }

  return 1;
}

void clusterBegin(int myId, const uint8_t macs[4][6]) {
  selfId = myId;
  memcpy(peerMacs, macs, sizeof(peerMacs));

  sharedReadings.hasBme = false;
  sharedReadings.hasLux = false;
  sharedReadings.lastBmeMs = 0;
  sharedReadings.lastLuxMs = 0;
  sharedReadings.bmeSourceId = 0;
  sharedReadings.luxSourceId = 0;
  sharedReadings.fanState = false;
  sharedReadings.lightState = false;
  sharedReadings.lastFanMs = 0;
  sharedReadings.lastLightMs = 0;
  sharedReadings.fanSourceId = 0;
  sharedReadings.lightSourceId = 0;
  sharedReadings.fanControllerId = 0;
  sharedReadings.lightControllerId = 0;

  if (esp_now_init() != ESP_OK) {
    return;
  }

  esp_now_register_recv_cb(OnDataRecv);

  for (int i = 0; i < 4; i++) {
    if (i != (selfId - 1)) {
      esp_now_peer_info_t peerInfo = {};
      memcpy(peerInfo.peer_addr, peerMacs[i], 6);
      peerInfo.channel = 0;
      peerInfo.encrypt = false;

      esp_now_add_peer(&peerInfo);
    }
  }

  esp_now_peer_info_t serverInfo = {};
  memcpy(serverInfo.peer_addr, serverMac, 6);
  serverInfo.channel = 0;
  serverInfo.encrypt = false;
  esp_now_add_peer(&serverInfo);
}

ClusterStatus clusterUpdate() {
  ClusterStatus status;
  status.myId = selfId;

  if (millis() - lastSend > HEARTBEAT_INTERVAL_MS) {
    heartbeatSeq++;

    HeartbeatMessage msg = {};
    msg.header.type = MSG_HEARTBEAT;
    msg.header.fromId = selfId;
    msg.header.seq = heartbeatSeq;

    sendToAllPeers((uint8_t *)&msg, sizeof(msg));

    lastSend = millis();
  }

  if (pendingFan && (millis() - pendingFanSendMs >= ACK_TIMEOUT_MS)) {
    sendRelayMessage(0x01, pendingFanState, false, 0, 0, pendingFanSeq);
    pendingFanSendMs = millis();
  }

  if (pendingLight && (millis() - pendingLightSendMs >= ACK_TIMEOUT_MS)) {
    sendRelayMessage(0x02, false, pendingLightState, 0, 0, pendingLightSeq);
    pendingLightSendMs = millis();
  }

  for (int i = 0; i < 5; i++) {
    status.active[i] = false;
  }

  for (int i = 1; i <= 4; i++) {
    status.lastHeartbeatMs[i] = lastHeartbeat[i];
    status.lastAckMs[i] = lastAck[i];

    bool heartbeatOk = (millis() - lastHeartbeat[i] < HEARTBEAT_TIMEOUT_MS);
    bool ackOk = (millis() - lastAck[i] < ACK_TIMEOUT_MS);

    if (heartbeatOk || ackOk) {
      status.active[i] = true;
    }
  }

  status.active[selfId] = true;

  int activeCount = 0;
  for (int i = 1; i <= 4; i++) {
    if (status.active[i]) {
      activeCount++;
    }
  }
  status.hasQuorum = (activeCount >= CLUSTER_QUORUM_SIZE);

  int leader = 999;
  if (activeCount >= 1) {
    for (int i = 1; i <= 4; i++) {
      if (status.active[i] && i < leader) {
        leader = i;
      }
    }

    status.leader = leader;
    status.isLeader = (selfId == leader);

    if (!status.hasQuorum) {
      LOGE("Sem quorum (%d/%d), failover ativo\n", activeCount, CLUSTER_QUORUM_SIZE);
    }
  } else {
    status.leader = 0;
    status.isLeader = false;
  }

  for (int i = 1; i <= 4; i++) {
    if (status.active[i] != lastActiveState[i]) {
      lastActiveState[i] = status.active[i];
      LOGI("Link %d %s\n", i, status.active[i] ? "UP" : "DOWN");
    }
  }

  return status;
}

void clusterPrintStatus(const ClusterStatus &status) {
  Serial.print("Ativos: ");
  for (int i = 1; i <= 4; i++) {
    if (status.active[i]) {
      Serial.print(i);
      Serial.print(" ");
    }
  }

  Serial.print("| Lider: ");
  Serial.print(status.leader);
  Serial.print(" | Eu: ");
  Serial.println(status.myId);

    LOGD("HB age: 1=%lu 2=%lu 3=%lu 4=%lu\n",
      millis() - status.lastHeartbeatMs[1],
      millis() - status.lastHeartbeatMs[2],
      millis() - status.lastHeartbeatMs[3],
      millis() - status.lastHeartbeatMs[4]);
    LOGD("ACK age: 1=%lu 2=%lu 3=%lu 4=%lu\n",
      millis() - status.lastAckMs[1],
      millis() - status.lastAckMs[2],
      millis() - status.lastAckMs[3],
      millis() - status.lastAckMs[4]);
}

SharedReadings clusterGetSharedReadings() {
  return sharedReadings;
}

void clusterPublishBme(float temperatureC, float humidityPct, float pressureHpa) {
  sharedReadings.temperatureC = temperatureC;
  sharedReadings.humidityPct = humidityPct;
  sharedReadings.pressureHpa = pressureHpa;
  sharedReadings.hasBme = true;
  sharedReadings.lastBmeMs = millis();
  sharedReadings.bmeSourceId = selfId;

  SensorMessage msg = {};
  msg.header.type = MSG_SENSOR;
  msg.header.fromId = selfId;
  msg.header.seq = 0;
  msg.flags = 0x01;
  msg.temperatureC = temperatureC;
  msg.humidityPct = humidityPct;
  msg.pressureHpa = pressureHpa;
  msg.lux = 0.0f;

  sendToAllPeers((uint8_t *)&msg, sizeof(msg));
}

void clusterPublishLux(float lux) {
  sharedReadings.lux = lux;
  sharedReadings.hasLux = true;
  sharedReadings.lastLuxMs = millis();
  sharedReadings.luxSourceId = selfId;

  SensorMessage msg = {};
  msg.header.type = MSG_SENSOR;
  msg.header.fromId = selfId;
  msg.header.seq = 0;
  msg.flags = 0x02;
  msg.temperatureC = 0.0f;
  msg.humidityPct = 0.0f;
  msg.pressureHpa = 0.0f;
  msg.lux = lux;

  sendToAllPeers((uint8_t *)&msg, sizeof(msg));
}

void clusterPublishFanState(bool on) {
  sharedReadings.fanState = on;
  sharedReadings.lastFanMs = millis();
  sharedReadings.fanSourceId = selfId;

  relaySeq++;
  pendingFan = true;
  pendingFanSeq = relaySeq;
  pendingFanState = on;
  pendingFanSendMs = millis();

  sendRelayMessage(0x01, on, false, 0, 0, pendingFanSeq);
}

void clusterPublishLightState(bool on) {
  sharedReadings.lightState = on;
  sharedReadings.lastLightMs = millis();
  sharedReadings.lightSourceId = selfId;

  relaySeq++;
  pendingLight = true;
  pendingLightSeq = relaySeq;
  pendingLightState = on;
  pendingLightSendMs = millis();

  sendRelayMessage(0x02, false, on, 0, 0, pendingLightSeq);
}

const uint8_t (*clusterGetPeerMacs())[6] {
  return peerMacs;
}

int clusterGetSelfId() {
  return selfId;
}

void clusterPublishRelayControllers(uint8_t fanControllerId, uint8_t lightControllerId) {
  sharedReadings.fanControllerId = fanControllerId;
  sharedReadings.lightControllerId = lightControllerId;

  relaySeq++;
  sendRelayMessage(0x04 | 0x08, false, false, fanControllerId, lightControllerId, relaySeq);
}
