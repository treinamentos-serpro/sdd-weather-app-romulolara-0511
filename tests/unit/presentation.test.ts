import { describe, expect, it } from 'vitest';
import { formatForecastDate } from '../../src/lib/date';
import { celsiusToFahrenheit, formatTemperature } from '../../src/lib/temperature';
import { getWeatherCondition } from '../../src/lib/weatherCodes';
import { mockWeather } from '../fixtures/weather';

describe('Apresentação dos dados', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
    [-10, 14],
  ])('converte %s °C para %s °F', (celsius, fahrenheit) => {
    expect(celsiusToFahrenheit(celsius)).toBe(fahrenheit);
  });

  it('formata valores arredondados com unidade, inclusive negativos', () => {
    expect(formatTemperature(-10, 'celsius')).toMatch(/-10\s*°C/);
    expect(formatTemperature(-10, 'fahrenheit')).toMatch(/14\s*°F/);
    expect(formatTemperature(24.4, 'celsius')).toMatch(/24\s*°C/);
  });

  it.each([
    [0, 'Céu limpo'],
    [2, 'Parcialmente nublado'],
    [3, 'Nublado'],
    [45, 'Nevoeiro'],
    [55, 'Garoa'],
    [61, 'Chuva'],
    [73, 'Neve'],
    [95, 'Trovoadas'],
    [999, 'Condição não disponível'],
  ])('apresenta rótulo em português para o código %s', (code, label) => {
    expect(getWeatherCondition(code).label).toBe(label);
  });

  it('preserva a data do calendário local sem deslocar o dia', () => {
    expect(formatForecastDate('2026-11-05')).toContain('05/11');
    expect(formatForecastDate('2026-01-01')).toContain('01/01');
  });

  it('mantém exatamente hoje e quatro dias consecutivos em cada mock', () => {
    for (const data of mockWeather) {
      const firstDate = data.current.time.split('T')[0];
      expect(data.forecast).toHaveLength(5);
      expect(data.forecast[0].date).toBe(firstDate);
      for (let index = 1; index < data.forecast.length; index += 1) {
        const previous = Date.parse(`${data.forecast[index - 1].date}T00:00:00Z`);
        const current = Date.parse(`${data.forecast[index].date}T00:00:00Z`);
        expect(current - previous).toBe(86_400_000);
      }
    }
  });
});
