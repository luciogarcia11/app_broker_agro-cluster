# Agro-Cluster — Agent guide

## Project overview

Expo (SDK 54) React Native app + ESP32 firmware cluster for greenhouse IoT monitoring/control. MQTT via WebSocket to HiveMQ Cloud. ESP-NOW for peer-to-peer between ESPs.

## Commands

```bash
npm start       # expo start
npm run android # expo start --android
npm run ios     # expo start --ios
npm run web     # expo start --web
npm run lint    # eslint src/ App.tsx (with Prettier integration via eslint-plugin-prettier)
npm run typecheck # tsc --noEmit
npm run check    # lint + typecheck
```

Or via `make`:

```bash
make start
make android
make ios
make web
make lint
make fix      # lint --fix
make typecheck
make check    # lint + typecheck
```

No test scripts exist.

## VS Code setup

`.vscode/extensions.json` recommends `dbaeumer.vscode-eslint` and `esbenp.prettier-vscode`. Settings configure Prettier as default formatter with format-on-save and ESLint auto-fix on save.

## Repo structure

| Path                            | Content                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `App.tsx`                       | Entrypoint — `MqttProvider` > `NavigationContainer` > `BottomTabs`               |
| `src/screens/`                  | 5 screens: Dashboard, Controls, ESPs, MQTT, Settings                             |
| `src/contexts/MqttContext.tsx`  | Global MQTT state (React Context + Provider)                                     |
| `src/services/mqttService.ts`   | Singleton MQTT client wrapping `mqtt` (import from `mqtt/dist/mqtt`, not `mqtt`) |
| `src/hooks/useMqtt.ts`          | Hook to access `MqttContext`                                                     |
| `src/components/`               | 7 reusable UI components (GlassCard, ToggleButton, etc.)                         |
| `src/styles/theme.ts`           | Centralized theme (colors, spacing, typography, shadows)                         |
| `src/types/`                    | `mqtt.ts`, `sensors.ts`, `esp.ts`                                                |
| `src/navigation/BottomTabs.tsx` | Bottom tab navigator with 5 routes                                               |
| `src/utils/time.ts`             | `formatRelativeTime()` helper                                                    |
| `agrocluster/`                  | ESP32 firmware (Arduino C++, PlatformIO or Arduino IDE)                          |
| `CODIGOS ESPS/`                 | ESP8266 test sketches                                                            |

## Key gotchas

- **Path aliases**: `tsconfig.json` defines `@/components/*` → `src/components/*` etc., but existing code uses **relative imports** (`../components/`). Match the pattern used in the file you edit.
- **MQTT import**: Must import from `"mqtt/dist/mqtt"` (not `"mqtt"`). See `src/services/mqttService.ts:1`.
- **Global polyfills**: `Buffer` and `process` are polyfilled globally in `mqttService.ts:7-12`. If you touch that file, keep them.
- **Babel**: `react-native-reanimated/plugin` must be **last** in `babel.config.js`.
- **Config persistence**: MQTT config saved to AsyncStorage under key `"agrocluster.mqtt.config"` (see `MqttContext.tsx:33`).
- **Default MQTT broker**: Hardcoded HiveMQ Cloud instance in `MqttContext.tsx:36-52`. Users replace via the MQTT config screen.
- **Dark mode only**: `"userInterfaceStyle": "dark"` in `app.json` — no light mode toggle.
- **Relays are active LOW**: `RELAY_ON = LOW`, `RELAY_OFF = HIGH` in `agrocluster/config.h:11-12`.
- **ESP identity**: Resolved by MAC address hardcoded in `agrocluster/agrocluster.ino:10-15`.
- **logoagrocluster.png**: Referenced in `package.json` but does not exist yet.
- **No CI/CD**: No `.github/workflows/` directory.
- **TypeScript path for MQTT**: `tsconfig.json` maps `"mqtt/dist/mqtt"` to the mqtt build types because the package's exports don't include `.d.ts` for the dist path (see `tsconfig.json:17`).

## MQTT protocol

Topics follow `agrocluster/<category>/<sub>` pattern. Key topics:

| Topic                        | Direction | Payload                                    |
| ---------------------------- | --------- | ------------------------------------------ |
| `agrocluster/sensors/bme280` | ESP → App | `{temperature, humidity, pressure, espId}` |
| `agrocluster/sensors/lux`    | ESP → App | `{lux, state:"DAY"\|"NIGHT", espId}`       |
| `agrocluster/actuators`      | ESP → App | `{fan:bool, light:bool, espId}`            |
| `agrocluster/status`         | ESP → App | `{clusterStatus, activeEsps}`              |
| `agrocluster/esp/list`       | ESP → App | `EspNode[]`                                |
| `agrocluster/cmd/light`      | App → ESP | `"ON"` or `"OFF"`                          |
| `agrocluster/cmd/fan`        | App → ESP | `"ON"` or `"OFF"`                          |

## OpenCode skills available

Defined in `opencode.json` and locked in `skills-lock.json`. Relevant skills: `clean-code`, `frontend-design`, `improve-codebase-architecture`, `iot`, `iot-firmware`, `mqtt-development`, `react-native-architecture`, `react-native-best-practices`, `ui-ux-designer`, `upgrading-react-native`.
