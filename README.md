# Agro-Cluster

> Painel IoT premium para monitoramento e controle de mini estufa com cluster ESP32 tolerante a falhas.

## Sobre o Projeto

**Agro-Cluster** é um ecossistema completo de automação agrícola composto por um aplicativo mobile React Native e um cluster de microcontroladores ESP32 que se comunicam via MQTT. O sistema foi projetado para monitorar e controlar uma mini estufa de forma confiável, com failover automático entre os nós do cluster.

### Problema que resolve

Soluções comerciais de automação para estufas são caras, fechadas e difíceis de customizar. O Agro-Cluster oferece uma alternativa open source, de baixo custo e tolerante a falhas, permitindo que qualquer pessoa monitore temperatura, umidade, pressão e luminosidade, além de controlar remotamente ventilação e iluminação.

### Público-alvo

- Agricultores e produtores rurais
- Hobistas e makers de IoT
- Estudantes de agronomia, engenharia e computação
- Pesquisadores com estufas experimentais

### Benefícios

- Cluster ESP32 tolerante a falhas com failover automático
- Código aberto e totalmente customizável
- Baixo custo (ESP32 + sensores BME280 + BH1750 + relés)
- App mobile com dashboard em tempo real
- Comunicação criptografada via TLS/SSL
- Sem dependência de serviços proprietários (use qualquer broker MQTT)

## Funcionalidades

| Funcionalidade | Tela | Descrição |
|---|---|---|
| Dashboard de sensores | Dashboard | Visualiza temperatura, umidade, pressão e luminosidade em tempo real |
| Status de conexão MQTT | Dashboard | Indicador visual ONLINE/OFFLINE com dot animado |
| Comandos remotos | Controls | Liga/desliga ventilador e luz via botões ON/OFF |
| Status do cluster | ESPs | Lista todos os nós ESP com role, sinal, bateria e última activity |
| Configuração do broker | MQTT | Conecta/desconecta, configura URL, porta, TLS, credenciais e tópicos |
| Configurações do app | Settings | Dark mode, notificações, auto-reconnect, reset de dados |
| Falha automática | - | Se um ESP falha, o líder do cluster assume suas funções |
| Controle automático | - | Ventilador liga >= 30°C ou >= 70% UR; luz liga <= 50 lux |

## Arquitetura

### Visão geral do sistema

```
+---------------------------------------------------+
|              React Native App (Expo)               |
|  +-----------+  +----------+  +-----------------+  |
|  | Dashboard  |  | Controls |  | MQTT Config     |  |
|  | Sensores   |  | Atuadores |  | Broker/Topics   |  |
|  +-----+------+  +----+-----+  +--------+--------+  |
|        |              |                  |           |
|        +--------------+------------------+           |
|                       |                              |
|               +-------+-------+                      |
|               |  MqttContext  |                      |
|               |  Estado       |                      |
|               |  global       |                      |
|               +-------+-------+                      |
|                       |                              |
|               +-------+-------+                      |
|               |  mqttService  |                      |
|               |  WS Client    |                      |
|               +-------+-------+                      |
+-----------------------|------------------------------+
                        | wss://
                +-------+--------+
                |  HiveMQ Cloud   |
                |  (MQTT Broker)  |
                +-------+--------+
                        | tcp:8883
                +-------+--------+
                | ESP8266 Gateway |
                | MQTT <-> ESP-NOW|
                +-------+--------+
                        | ESP-NOW ch 1
           +------------+------------+
           |            |            |
     +-----+---+  +-----+---+  +-----+---+
     |ESP32 #1 |  |ESP32 #2 |  |ESP32 #3 |
     | BME280  |  | BH1750  |  | Light   |
     | (Líder) |  | (Sensor)|  | (Relé)  |
     +---------+  +---------+  +---------+
                          +----+----+
                          |ESP32 #4 |
                          |Fan (Relé)|
                          +---------+
```

### Estrutura de diretórios

```
agro-cluster/
│
├── App.tsx                            # Entry point do app
├── app.json                           # Configuração Expo SDK
├── eas.json                           # Configuração EAS Build
├── babel.config.js                    # Babel + Reanimated plugin
├── tsconfig.json                      # Path aliases @/
│
├── src/                               # Código fonte do app
│   ├── components/                    # Componentes reutilizáveis
│   │   ├── AnimatedStatusDot.tsx      # Indicador pulsante online/offline
│   │   ├── GlassCard.tsx              # Card com efeito glassmorphism
│   │   ├── GradientBackground.tsx     # Fundo gradiente escuro
│   │   ├── InputField.tsx             # Campo de input com label
│   │   ├── SectionTitle.tsx           # Título de seção com ícone
│   │   ├── StatusBadge.tsx            # Badge de status colorido
│   │   └── ToggleButton.tsx           # Botão toggle ON/OFF
│   │
│   ├── screens/                       # Telas da aplicação
│   │   ├── DashboardScreen.tsx        # Dashboard de sensores
│   │   ├── ControlsScreen.tsx         # Controle dos atuadores
│   │   ├── EspsScreen.tsx             # Lista de nós do cluster
│   │   ├── MqttScreen.tsx             # Configuração MQTT
│   │   └── SettingsScreen.tsx         # Configurações do app
│   │
│   ├── contexts/MqttContext.tsx       # Estado global MQTT (Provider)
│   ├── hooks/useMqtt.ts              # Hook de acesso ao contexto
│   ├── navigation/BottomTabs.tsx      # Navegação por abas
│   ├── services/mqttService.ts        # Singleton de conexão MQTT
│   ├── styles/theme.ts               # Tema centralizado
│   ├── types/
│   │   ├── esp.ts                    # Tipos para nós ESP
│   │   ├── mqtt.ts                   # Tipos para configuração MQTT
│   │   └── sensors.ts               # Tipos para dados de sensores
│   └── utils/time.ts                 # Formatação de tempo relativo
│
├── agrocluster/                       # Firmware ESP32 (Arduino C++)
│   ├── agrocluster.ino               # Entry point
│   ├── config.h                      # Constantes e thresholds
│   ├── cluster.h / cluster.cpp       # Comunicação ESP-NOW
│   ├── sensors.h / sensors.cpp       # Drivers BME280 + BH1750
│   ├── relays.h / relays.cpp         # Controle de relés
│   ├── roles.h / roles.cpp           # Lógica de decisão (5s)
│   └── log.h / log.cpp               # Logging por nível
│
└── CODIGOS ESPS/                      # Sketches de teste ESP8266
    ├── ESP8266_TESTE.ino             # Publica dados falsos BME280
    ├── MOCK_SENSORS_TEST.ino         # Simula sensores + atuadores
    └── TESTE_PORTAS_INTERNET.ino     # Teste de conectividade
```

### Separação de camadas

| Camada | Responsabilidade |
|---|---|
| `components/` | Componentes puramente visuais, reutilizáveis e sem estado global |
| `screens/` | Telas que compõem a interface, consomem hooks |
| `contexts/` | Estado global compartilhado (MqttContext) |
| `hooks/` | Hooks customizados que abstraem acesso ao contexto |
| `services/` | Lógica de infraestrutura (conexão MQTT) |
| `types/` | Definições TypeScript para dados do sistema |
| `utils/` | Funções utilitárias puras |
| `styles/` | Tema centralizado (cores, espaçamento, tipografia) |

### Fluxo de dados

1. Sensores ESP32 leem dados físicos (BME280, BH1750)
2. Cluster se comunica via ESP-NOW, líder coordena as ações
3. Gateway ESP8266 bridgeia ESP-NOW para MQTT (HiveMQ Cloud)
4. App mobile conecta via WebSocket seguro (wss://) ao mesmo broker
5. App recebe dados em tempo real e atualiza a UI
6. Usuário envia comandos que vão pelo caminho inverso

## Tecnologias

### Mobile app

| Tecnologia | Versão | Finalidade |
|---|---|---|
| React Native | 0.81 | Framework mobile cross-platform |
| Expo SDK | 54 | Ambiente de desenvolvimento e build |
| TypeScript | 5.9 | Tipagem estática e segurança |
| MQTT.js | 5.15 | Cliente MQTT via WebSocket |
| React Navigation | 7 | Navegação por abas inferiores |
| AsyncStorage | 2.2 | Persistência local de configurações |
| expo-linear-gradient | ~15.0 | Gradientes no fundo das telas |
| expo-blur | ~15.0 | Efeito glassmorphism nos cards |
| expo-font | ~14.0 | Carregamento de fontes |
| react-native-reanimated | 4.1 | Animações nativas (status dot) |
| @expo/vector-icons | 15.0 | Ícones Ionicons |
| react-native-safe-area-context | 5.6 | Safe area consistente |
| react-native-screens | 4.16 | Otimização de navegação |
| react-native-gesture-handler | 2.28 | Gestos nativos |
| react-native-svg | 15.12 | Renderização SVG |

### Firmware ESP32

| Componente | Finalidade |
|---|---|
| ESP-NOW | Comunicação peer-to-peer entre ESPs (sem Wi-Fi) |
| BME280 | Sensor de temperatura, umidade e pressão (I2C) |
| BH1750 | Sensor de luminosidade ambiente (I2C) |
| WiFiClientSecure | Conexão segura do gateway ao HiveMQ |

### Infraestrutura

| Serviço | Finalidade |
|---|---|
| HiveMQ Cloud | Broker MQTT gratuito (até 100 conexões) |
| EAS Build | Build e deploy na nuvem (opcional) |

## Instalação

### Pré-requisitos

- Node.js >= 18
- npm ou yarn
- Expo Go (iOS/Android) para desenvolvimento
- Android Studio (opcional, para emulador Android)

### Passos

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/agro-cluster.git
cd agro-cluster

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npx expo start
```

Escaneie o QR code com o Expo Go (Android/iOS) ou pressione `a` para emulador Android.

### Build APK (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

## Configuração

### MQTT (HiveMQ Cloud)

O projeto utiliza **HiveMQ Cloud** como broker MQTT padrão, mas você pode usar qualquer broker compatível (Mosquitto local, EMQX, CloudMQTT, etc).

1. Crie uma conta gratuita em [hivemq.cloud](https://www.hivemq.cloud/)
2. Crie um cluster (plano free: até 100 conexões simultâneas)
3. Anote as credenciais geradas:
   - **Host**: `seu-cluster.s1.eu.hivemq.cloud`
   - **Porta TCP**: `8883` (para dispositivos IoT)
   - **Porta WebSocket**: `8884` (para o app mobile)
   - **Usuário** e **Senha** do cluster

4. No app, acesse a tela **MQTT** e preencha:
   - **Broker URL**: o host do seu cluster
   - **WebSocket URL**: `wss://seu-cluster.s1.eu.hivemq.cloud:8884/mqtt`
   - **Port**: `8883`
   - **Client ID**: gerado automaticamente (pode customizar)
   - **Username** e **Password**: credenciais do cluster
   - Ative **Enable TLS**
5. Clique em **Save Configuration**
6. Clique em **Connect**

> As configurações são salvas localmente no dispositivo via AsyncStorage e persistem entre sessões.

### Tópicos MQTT

Os tópicos seguem o padrão `agrocluster/<categoria>/<subtipo>`:

| Tópico | Direção | Payload | Descrição |
|---|---|---|---|
| `agrocluster/sensors/bme280` | ESP → App | JSON | Temperatura, umidade, pressão |
| `agrocluster/sensors/lux` | ESP → App | JSON | Luminosidade e estado DAY/NIGHT |
| `agrocluster/actuators` | ESP → App | JSON | Estado dos relés (fan, light) |
| `agrocluster/status` | ESP → App | JSON | Status geral do cluster |
| `agrocluster/esp/list` | ESP → App | JSON[] | Lista detalhada dos nós |
| `agrocluster/cmd/light` | App → ESP | `"ON"` ou `"OFF"` | Comando de luz |
| `agrocluster/cmd/fan` | App → ESP | `"ON"` ou `"OFF"` | Comando de ventilador |

### Payloads

**BME280** (`agrocluster/sensors/bme280`):
```json
{
  "temperature": 25.5,
  "humidity": 60.2,
  "pressure": 1013.4,
  "espId": "ESP-01"
}
```

**Luminosidade** (`agrocluster/sensors/lux`):
```json
{
  "lux": 350,
  "state": "DAY",
  "espId": "ESP-02"
}
```

**Atuadores** (`agrocluster/actuators`):
```json
{
  "fan": true,
  "light": false,
  "espId": "ESP-03"
}
```

## Firmware ESP32

O diretório `agrocluster/` contém o firmware completo para o cluster de 4 ESP32s.

### Identidade dos ESPs

O firmware resolve a identidade de cada ESP pelo endereço MAC:

| ID | MAC | Role | Sensor/Atuador |
|---|---|---|---|
| 1 | `84:1F:E8:1B:47:18` | Líder (padrão) | BME280 (temp/umidade/pressão) |
| 2 | `44:1D:64:F1:FB:E8` | Sensor | BH1750 (luminosidade) |
| 3 | `D0:EF:76:34:58:F4` | Atuador | Relé da luz (GPIO 18) |
| 4 | `80:F3:DA:5E:1C:AC` | Atuador | Relé do ventilador (GPIO 23) |

### Configuração de hardware

```cpp
// config.h - Principais constantes
#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22
#define RELAY_FAN_PIN 23
#define RELAY_LIGHT_PIN 18
#define RELAY_ON LOW       // Relé active LOW
#define RELAY_OFF HIGH
```

### Lógica de controle automático (executada a cada 5s)

**Ventilador:**
```
SE dados BME280 obsoletos (>6s) → Desliga ventilador
SENÃO SE temp >= 30°C OU umidade >= 70% → Liga ventilador
SENÃO SE temp <= 28°C E umidade <= 65% → Desliga ventilador
```

**Luz:**
```
SE dados BH1750 obsoletos (>6s) → Desliga luz
SENÃO SE luminosidade <= 50 lux → Liga luz
SENÃO SE luminosidade >= 80 lux → Desliga luz
```

### Failover

Se um ESP designado para uma função falha (sem heartbeat por 3s), o líder assume automaticamente a função. A cluster exige quórum mínimo de 3 nós ativos para operar.

### Compilação

Compile o firmware usando **PlatformIO** (recomendado) ou **Arduino IDE** com suporte a ESP32.

1. Abra a pasta `agrocluster/` no PlatformIO
2. Ajuste os MACs em `agrocluster.ino` para os seus ESPs
3. Compile e faça upload para cada ESP32

### Gateway MQTT-ESP-NOW

O cluster se comunica via ESP-NOW (canal 1). Um dispositivo gateway (pode ser um ESP8266 ou outro ESP32 com o MAC `E4:65:B8:11:0A:4C`) faz a ponte entre o ESP-NOW e o broker MQTT via Wi-Fi.

## Exemplos de uso

### Controle manual do ventilador

1. Abra o app e vá em **Controls**
2. O card do Fan mostra o estado atual (ON/OFF)
3. Toque em **ON** para ligar ou **OFF** para desligar
4. O app publica em `agrocluster/cmd/fan`
5. O gateway ESP repassa ao cluster via ESP-NOW
6. O ESP responsável aciona o relé e publica o novo estado

### Monitoramento remoto

1. Abra o app e vá em **Dashboard**
2. Visualize em tempo real: temperatura, umidade, pressão, luminosidade
3. O badge de cada sensor indica se está ACTIVE ou OFFLINE
4. Na seção **System**, veja status MQTT, cluster e quantidade de ESPs ativos

### Verificação do cluster

1. Abra o app e vá em **ESPs**
2. Veja a lista de todos os nós com role, sinal (RSSI) e bateria
3. Cada nó tem um dot verde (online) ou cinza (offline)
4. O indicador de sinal usa barras visuais (0-4 barras)

## Segurança

- **TLS/SSL**: A comunicação com o broker MQTT é criptografada via WebSocket Secure (wss://) no app e TCP/TLS (porta 8883) nos dispositivos IoT
- **Autenticação**: O HiveMQ Cloud exige usuário e senha para todas as conexões
- **Credenciais**: As senhas são armazenadas localmente no AsyncStorage (não em servidores)
- **Recomendações**: Em produção, evite usar `setInsecure()` no ESP; configure certificados CA válidos

## Roadmap

- [ ] Notificações push para alertas (temp crítica, sensor offline)
- [ ] Gráficos históricos com dados ao longo do tempo
- [ ] Suporte a múltiplos brokers simultâneos
- [ ] Integração com Home Assistant via MQTT discovery
- [ ] Backup das configurações na nuvem
- [ ] Geolocalização dos dispositivos
- [ ] Multiusuário com níveis de permissão
- [ ] Atualização OTA para firmware ESP32
- [ ] Dashboard web (versão React para desktop)
- [ ] Comandos por voz
- [ ] Modo programável (regras customizadas pelo usuário)

## Contribuição

Contribuições são bem-vindas!

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

### Reportando problemas

Abra uma [issue](https://github.com/seu-usuario/agro-cluster/issues) descrevendo:
- O comportamento esperado
- O comportamento observado
- Passos para reproduzir
- Ambiente (SO, versão do app, modelo do ESP)

## Licença

Distribuído sob licença MIT. Veja `LICENSE` para mais informações.

## Créditos

- **Lúcio Garcia** — Desenvolvimento do app mobile e firmware ESP32
- **HiveMQ Cloud** — Broker MQTT gratuito para IoT
- **Expo** — Framework open source para React Native
- **React Native** — Framework mobile cross-platform
- **Bibliotecas**: MQTT.js, React Navigation, AsyncStorage, Reanimated, expo-linear-gradient, expo-blur

---

> **Nota**: O arquivo `logoagrocluster.png` referenciado em `package.json` ainda não existe no projeto. Crie um arquivo PNG com o logo do app na raiz do projeto se desejar usá-lo como ícone.
