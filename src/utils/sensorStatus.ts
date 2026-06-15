export type SensorStatus = "good" | "warning" | "danger";

export function getTempStatus(temperature: number): SensorStatus {
  if (temperature >= 15 && temperature <= 28) return "good";
  if (temperature >= 10 && temperature <= 35) return "warning";
  return "danger";
}

export function getHumidityStatus(humidity: number): SensorStatus {
  if (humidity >= 40 && humidity <= 65) return "good";
  if (humidity >= 30 && humidity <= 80) return "warning";
  return "danger";
}

export function getPressureStatus(pressure: number): SensorStatus {
  if (pressure >= 1000 && pressure <= 1025) return "good";
  if (pressure >= 990 && pressure <= 1040) return "warning";
  return "danger";
}

export function statusToLabel(status: SensorStatus): string {
  switch (status) {
    case "good":
      return "OK";
    case "warning":
      return "ATENÇÃO";
    case "danger":
      return "CRÍTICO";
  }
}

export function statusToTone(status: SensorStatus): "success" | "warning" | "danger" {
  switch (status) {
    case "good":
      return "success";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
  }
}
