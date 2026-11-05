import type { TemperatureUnit } from '../types/weather';

export function celsiusToFahrenheit(value: number): number {
  return (value * 9) / 5 + 32;
}

export function formatTemperature(value: number, unit: TemperatureUnit): string {
  const temperature = unit === 'fahrenheit' ? celsiusToFahrenheit(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'unit',
    unit,
    maximumFractionDigits: 0,
  }).format(temperature);
}
