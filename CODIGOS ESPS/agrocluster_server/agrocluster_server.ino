#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <esp_now.h>
#include <esp_wifi.h>

static const char *AP_SSID = "Agro-Cluster-Server";
static const char *AP_PASS = "";
static const uint8_t ESPNOW_CHANNEL = 1;

static const uint8_t CLUSTER_MACS[4][6] = {
  {0x84, 0x1F, 0xE8, 0x1B, 0x47, 0x18},
  {0x44, 0x1D, 0x64, 0xF1, 0xFB, 0xE8},
  {0xD0, 0xEF, 0x76, 0x34, 0x58, 0xF4},
  {0x80, 0xF3, 0xDA, 0x5E, 0x1C, 0xAC}
};

static const uint32_t HEARTBEAT_TIMEOUT_MS = 3000;

struct NodeInfo {
  bool active;
  unsigned long lastHeartbeatMs;
  uint8_t mac[6];
};

struct SharedData {
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

static NodeInfo nodes[5];
static SharedData shared = {};

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

static DNSServer dnsServer;
static WebServer server(80);

static const char INDEX_HTML[] PROGMEM = R"HTML(
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AgroCluster</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
:root {
  --bg1: #0b1f3b;
  --bg2: #0f2b4d;
  --accent: #7dd3fc;
  --accent2: #9ae6b4;
  --card: #ffffff;
  --muted: #5f7a93;
  --ink: #0f1a2b;
  --danger: #e45d5d;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Sora', sans-serif;
  color: var(--ink);
  background: radial-gradient(1200px 600px at 10% -10%, #1c3b66 0%, transparent 60%),
              radial-gradient(900px 500px at 100% 0%, #163a5a 0%, transparent 60%),
              linear-gradient(160deg, var(--bg1), var(--bg2));
  min-height: 100vh;
}
.app {
  max-width: 520px;
  margin: 0 auto;
  padding: 24px 18px 40px;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.brand {
  font-weight: 700;
  letter-spacing: 0.4px;
  font-size: 20px;
  color: #e6f4ff;
}
.menu {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid #2e5b8b;
  background: #0f2542;
  color: #e6f4ff;
  font-size: 22px;
}
.card {
  background: linear-gradient(180deg, #ffffff, #f3f9ff);
  border: 1px solid #cfe3f8;
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 14px;
  box-shadow: 0 10px 24px rgba(10, 26, 55, 0.18);
}
.value-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.big {
  font-size: 30px;
  font-weight: 700;
}
.sub {
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #cfe3f8;
  font-size: 12px;
  color: var(--muted);
  background: #f5fbff;
}
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.pill {
  background: #f5fbff;
  border: 1px solid #cfe3f8;
  border-radius: 14px;
  padding: 14px;
  text-align: center;
}
.pill .state {
  font-size: 18px;
  font-weight: 700;
}
.pill.on { border-color: #7fd59e; color: #1b5f3b; }
.pill.off { border-color: #b7c6d8; color: #4b5f75; }

.drawer {
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 12, 0.75);
  display: none;
  align-items: flex-end;
}
.drawer.open { display: flex; }
.drawer-panel {
  background: #eef6ff;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 520px;
  padding: 18px;
  border: 1px solid #cfe3f8;
}
.list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}
.row {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 12px;
  align-items: center;
  background: #ffffff;
  border: 1px solid #cfe3f8;
  border-radius: 14px;
  padding: 10px 12px;
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff6b6b;
}
.dot.on { background: #7ed957; }
.small {
  font-size: 12px;
  color: var(--muted);
}
.
chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #cfe3f8;
  background: #f5fbff;
  color: #2c4c6c;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
@media (max-width: 380px) {
  .big { font-size: 26px; }
}
</style>
</head>
<body>
  <div class="app">
    <div class="topbar">
      <div class="brand">AgroCluster</div>
      <button class="menu" id="menuBtn">☰</button>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="sub">Sensor BME280</div>
        <div class="chip" id="bmeOwner">ESP--</div>
      </div>
      <div class="value-row">
        <div>
          <div class="big" id="temp">--</div>
          <div class="small">🌡️ Temperatura</div>
        </div>
        <div>
          <div class="big" id="hum">--</div>
          <div class="small">💧 Umidade</div>
        </div>
      </div>
      <div class="value-row" style="margin-top:12px;">
        <div>
          <div class="big" id="press">--</div>
          <div class="small">🧭 Pressao</div>
        </div>
        <div>
          <div class="badge" id="bmeOk">BME: --</div>
          <div class="small" id="bmeFresh">--</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div class="sub">Sensor BH1750</div>
        <div class="chip" id="luxOwner">ESP--</div>
      </div>
      <div class="value-row">
        <div>
          <div class="big" id="lux">--</div>
          <div class="small">💡 Luminosidade</div>
        </div>
        <div>
          <div class="badge" id="luxBadge">Lux: --</div>
          <div class="small" id="dayState">--</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="sub">Atuadores</div>
      <div class="actions">
        <div class="pill" id="fanPill">
          <div class="sub">🌀 Ventoinha</div>
          <div class="state" id="fanState">--</div>
          <div class="small" id="fanOwner">--</div>
        </div>
        <div class="pill" id="lightPill">
          <div class="sub">💡 Luz</div>
          <div class="state" id="lightState">--</div>
          <div class="small" id="lightOwner">--</div>
        </div>
      </div>
    </div>
  </div>

  <div class="drawer" id="drawer">
    <div class="drawer-panel">
      <div class="sub">Cluster</div>
      <div class="list" id="nodeList"></div>
    </div>
  </div>

<script>
const menuBtn = document.getElementById('menuBtn');
const drawer = document.getElementById('drawer');
menuBtn.addEventListener('click', () => drawer.classList.toggle('open'));
drawer.addEventListener('click', (e) => { if (e.target === drawer) drawer.classList.remove('open'); });

function setText(id, value) { document.getElementById(id).textContent = value; }

function fmtMac(mac) {
  if (!mac || mac.length !== 6) return '--';
  return mac.map(b => b.toString(16).padStart(2, '0')).join(':');
}

async function refresh() {
  const res = await fetch('/data');
  const data = await res.json();

  setText('temp', data.tempC !== null ? data.tempC.toFixed(2) + ' C' : '--');
  setText('hum', data.humPct !== null ? data.humPct.toFixed(2) + ' %' : '--');
  setText('press', data.pressHpa !== null ? data.pressHpa.toFixed(2) + ' hPa' : '--');
  setText('lux', data.lux !== null ? data.lux.toFixed(2) + ' lx' : '--');
  setText('luxBadge', 'Lux: ' + (data.lux !== null ? data.lux.toFixed(2) : '--'));
  setText('dayState', data.lux !== null && data.lux <= 50 ? 'NOITE' : 'DIA');
  setText('bmeOwner', data.bmeSource ? 'ESP' + data.bmeSource : 'ESP--');
  setText('luxOwner', data.luxSource ? 'ESP' + data.luxSource : 'ESP--');
  setText('bmeOk', data.tempC !== null ? 'BME: OK' : 'BME: --');
  setText('bmeFresh', data.tempC !== null ? 'Ativo' : '--');

  const fanOn = data.fanState === true;
  const lightOn = data.lightState === true;
  const fanPill = document.getElementById('fanPill');
  const lightPill = document.getElementById('lightPill');
  fanPill.className = 'pill ' + (fanOn ? 'on' : 'off');
  lightPill.className = 'pill ' + (lightOn ? 'on' : 'off');
  setText('fanState', fanOn ? 'ON' : 'OFF');
  setText('lightState', lightOn ? 'ON' : 'OFF');
  setText('fanOwner', data.fanController ? 'ESP' + data.fanController : '--');
  setText('lightOwner', data.lightController ? 'ESP' + data.lightController : '--');

  const list = document.getElementById('nodeList');
  list.innerHTML = '';
  data.nodes.forEach(node => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div class="dot ${node.active ? 'on' : ''}"></div>
      <div>
        <div>ESP${node.id}</div>
        <div class="small">${fmtMac(node.mac)} • ${node.role}</div>
      </div>
      <div class="small">${node.active ? 'ATIVO' : 'OFF'}</div>
    `;
    list.appendChild(row);
  });
}

setInterval(refresh, 2000);
refresh();
</script>
</body>
</html>
)HTML";

static void sendCaptivePortal() {
  server.sendHeader("Location", "http://" + WiFi.softAPIP().toString(), true);
  server.send(302, "text/plain", "");
}

static String jsonData() {
  String out = "{";
  out += "\"tempC\":" + String(shared.hasBme ? shared.temperatureC : NAN) + ",";
  out += "\"humPct\":" + String(shared.hasBme ? shared.humidityPct : NAN) + ",";
  out += "\"pressHpa\":" + String(shared.hasBme ? shared.pressureHpa : NAN) + ",";
  out += "\"lux\":" + String(shared.hasLux ? shared.lux : NAN) + ",";
  out += "\"fanState\":" + String(shared.fanState ? "true" : "false") + ",";
  out += "\"lightState\":" + String(shared.lightState ? "true" : "false") + ",";
  out += "\"fanController\":" + String(shared.fanControllerId) + ",";
  out += "\"lightController\":" + String(shared.lightControllerId) + ",";
  out += "\"bmeSource\":" + String(shared.bmeSourceId) + ",";
  out += "\"luxSource\":" + String(shared.luxSourceId) + ",";

  out += "\"nodes\":[";
  for (int i = 1; i <= 4; i++) {
    if (i > 1) out += ",";
    out += "{";
    out += "\"id\":" + String(i) + ",";
    out += "\"active\":" + String(nodes[i].active ? "true" : "false") + ",";
    out += "\"mac\":[";
    for (int b = 0; b < 6; b++) {
      if (b > 0) out += ",";
      out += String(nodes[i].mac[b]);
    }
    out += "],";
    out += "\"role\":";
    if (i == 1) out += "\"Temp/Umid\"";
    else if (i == 2) out += "\"Lux\"";
    else if (i == 3) out += "\"Luz\"";
    else out += "\"Ventoinha\"";
    out += "}";
  }
  out += "]}";
  out.replace("nan", "null");
  return out;
}

static void OnDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
  if (len < (int)sizeof(MessageHeader)) return;

  MessageHeader header;
  memcpy(&header, incomingData, sizeof(header));

  if (header.fromId < 1 || header.fromId > 4) return;

  if (header.type == MSG_HEARTBEAT && len >= (int)sizeof(HeartbeatMessage)) {
    nodes[header.fromId].lastHeartbeatMs = millis();
    nodes[header.fromId].active = true;
    memcpy(nodes[header.fromId].mac, info->src_addr, 6);
    return;
  }

  if (header.type == MSG_SENSOR && len >= (int)sizeof(SensorMessage)) {
    SensorMessage sensorMsg;
    memcpy(&sensorMsg, incomingData, sizeof(sensorMsg));

    if (sensorMsg.flags & 0x01) {
      shared.temperatureC = sensorMsg.temperatureC;
      shared.humidityPct = sensorMsg.humidityPct;
      shared.pressureHpa = sensorMsg.pressureHpa;
      shared.hasBme = true;
      shared.lastBmeMs = millis();
      shared.bmeSourceId = header.fromId;
    }

    if (sensorMsg.flags & 0x02) {
      shared.lux = sensorMsg.lux;
      shared.hasLux = true;
      shared.lastLuxMs = millis();
      shared.luxSourceId = header.fromId;
    }
    return;
  }

  if (header.type == MSG_RELAY && len >= (int)sizeof(RelayMessage)) {
    RelayMessage relayMsg;
    memcpy(&relayMsg, incomingData, sizeof(relayMsg));

    if (relayMsg.flags & 0x01) {
      shared.fanState = (relayMsg.fanState != 0);
      shared.lastFanMs = millis();
      shared.fanSourceId = header.fromId;
    }

    if (relayMsg.flags & 0x02) {
      shared.lightState = (relayMsg.lightState != 0);
      shared.lastLightMs = millis();
      shared.lightSourceId = header.fromId;
    }

    if (relayMsg.flags & 0x04) {
      shared.fanControllerId = relayMsg.fanControllerId;
    }

    if (relayMsg.flags & 0x08) {
      shared.lightControllerId = relayMsg.lightControllerId;
    }
    return;
  }
}

void setup() {
  Serial.begin(115200);

  for (int i = 1; i <= 4; i++) {
    nodes[i].active = false;
    nodes[i].lastHeartbeatMs = 0;
    memcpy(nodes[i].mac, CLUSTER_MACS[i - 1], 6);
  }

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASS, ESPNOW_CHANNEL);
  esp_wifi_set_channel(ESPNOW_CHANNEL, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }

  esp_now_register_recv_cb(OnDataRecv);

  dnsServer.start(53, "*", WiFi.softAPIP());

  server.on("/", []() {
    server.send_P(200, "text/html", INDEX_HTML);
  });

  server.on("/data", []() {
    server.send(200, "application/json", jsonData());
  });

  server.on("/generate_204", sendCaptivePortal);
  server.on("/hotspot-detect.html", sendCaptivePortal);
  server.onNotFound(sendCaptivePortal);

  server.begin();
  Serial.println("Server started");
}

void loop() {
  dnsServer.processNextRequest();
  server.handleClient();

  unsigned long now = millis();
  for (int i = 1; i <= 4; i++) {
    if (nodes[i].active && (now - nodes[i].lastHeartbeatMs > HEARTBEAT_TIMEOUT_MS)) {
      nodes[i].active = false;
    }
  }
}
