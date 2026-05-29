# Agro Cluster - Documentação MQTT

Este documento reune os padrões de tópicos e configurações para estabelecer a ponte entre os microcontroladores (ESP8266/ESP32) e o aplicativo mobile React Native.

## 📡 Servidor MQTT (Broker)

Estamos utilizando a plataforma **HiveMQ Cloud**, que requer protocolo seguro e sistema de Senhas.

* **Broker URL (Host)**: `6187843070b544d6898bf05b65b41a6e.s1.eu.hivemq.cloud`
* **Porta Dispositivos IoT (ESP8266/ESP32)**: `8883` (Requer `WiFiClientSecure` e `setInsecure()` no ESP)
* **Porta Aplicativo Mobile / Web**: `8884` (Usa WebSockets Seguro `wss://`)
* **Usuário**: `<SEU_USUARIO_DO_HIVEMQ>` *(Adicione na MqttScreen do APP)*
* **Senha**: `<SUA_SENHA_DO_HIVEMQ>` *(Adicione na MqttScreen do APP)*

---

## 📂 Arquitetura de Tópicos (Padrão)

A raiz unificada de comunicação do ecossistema todo começa por **`agrocluster/`**.

### 1) Sensores & Telemetria
Os ESPs leem os transdutores físicos e publicam (Publish) o estado. O app se inscreve (Subscribe) para ler.

* **BME280**
    * **Tópico**: `agrocluster/sensors/bme280`
    * **JSON Esperado**: `{"temperature": 24.5, "humidity": 60, "pressure": 1012, "espId": "ESP-01"}`
* **Luminosidade (BH1750)**
    * **Tópico**: `agrocluster/sensors/lux`
    * **JSON Esperado**: `{"lux": 350, "state": "DAY", "espId": "ESP-02"}`

### 2) Monitoramento dos Atuadores
O App precisa saber se a reles já atracaram. O ESP publica (Publish) informando a situação dos reles físicos.

* **Feedback de Rele**
    * **Tópico**: `agrocluster/actuators`
    * **JSON Esperado**: `{"fan": true, "light": false, "irrigation": true, "espId": "ESP-03"}`

### 3) Comandos do Aplicativo (Controle Remoto)
É aqui onde o APP Envia os comandos. O App publica (`publish`) e os ESPs devem se inscrever (`subscribe`). Todas as Payloads são texto limpo.

* **Controlar Luz**: `agrocluster/cmd/light` (Payload: `"ON"` ou `"OFF"`)
* **Controlar Irrigação**: `agrocluster/cmd/irrigation` (Payload: `"ON"` ou `"OFF"`)
* **Controlar Ventilação**: `agrocluster/cmd/fan` (Payload: `"ON"` ou `"OFF"`)

---

## 🛠️ Como Funciona o Fluxo de Atuação na Vida Real

1. O Usuário aperta o botão "ON" do Fan no aplicativo.
2. O Aplicativo publica no tópico `agrocluster/cmd/fan` contendo a string simples `"ON"`.
3. O código do ESP8266 (na função `mqttCallback`) captura, escuta a string `"ON"`, e manda sinal elétrico (`LOW` ou `HIGH`) para o pino do respectivo relé.
4. Ao acabar de ligar o relé fisicamente, imediatamente no ESP você empacota um JSON informando ao App que aquela luz foi ligada.
5. O ESP publica sobre as portas do JSON em `agrocluster/actuators`, que fará o botão do app de fato ficar Verde e atualizar "LIGADO".

## 🚀 Como testar este ecossistema

Na pasta `CODIGOS ESPS`, faça upload do codigo **`MOCK_SENSORS_TEST.ino`** para qualquer ESP8266 usando a IDE do Arduino.
Insira suas credenciais da rede, o usuário e senha do HiveMQ antes de dar upload. O ESP irá gerar números de pressão, lux e temperatura aleatórios a cada 5 segundos e enviar direto para os Tópicos certos e responder instantâneamento aos comandos do App simulando os relés via log.
