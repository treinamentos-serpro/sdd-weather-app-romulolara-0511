import type { WeatherData } from '../types/weather';

export const mockWeather: WeatherData[] = [
  {
    city: {
      id: 3448439,
      name: 'São Paulo',
      country: 'Brasil',
      countryCode: 'BR',
      region: 'São Paulo',
      latitude: -23.55,
      longitude: -46.63,
    },
    timezone: 'America/Sao_Paulo',
    current: { temperatureC: 24, weatherCode: 2, time: '2026-11-05T14:00' },
    forecast: [
      { date: '2026-11-05', minTemperatureC: 18, maxTemperatureC: 26, weatherCode: 2 },
      { date: '2026-11-06', minTemperatureC: 19, maxTemperatureC: 28, weatherCode: 0 },
      { date: '2026-11-07', minTemperatureC: 17, maxTemperatureC: 23, weatherCode: 61 },
      { date: '2026-11-08', minTemperatureC: 16, maxTemperatureC: 22, weatherCode: 3 },
      { date: '2026-11-09', minTemperatureC: 18, maxTemperatureC: 27, weatherCode: 0 },
    ],
  },
  {
    city: {
      id: 3451190,
      name: 'Rio de Janeiro',
      country: 'Brasil',
      countryCode: 'BR',
      region: 'Rio de Janeiro',
      latitude: -22.91,
      longitude: -43.17,
    },
    timezone: 'America/Sao_Paulo',
    current: { temperatureC: 29, weatherCode: 0, time: '2026-11-05T14:00' },
    forecast: [
      { date: '2026-11-05', minTemperatureC: 23, maxTemperatureC: 31, weatherCode: 0 },
      { date: '2026-11-06', minTemperatureC: 24, maxTemperatureC: 32, weatherCode: 2 },
      { date: '2026-11-07', minTemperatureC: 22, maxTemperatureC: 28, weatherCode: 80 },
      { date: '2026-11-08', minTemperatureC: 21, maxTemperatureC: 27, weatherCode: 3 },
      { date: '2026-11-09', minTemperatureC: 23, maxTemperatureC: 30, weatherCode: 0 },
    ],
  },
  {
    city: {
      id: 2267057,
      name: 'Lisboa',
      country: 'Portugal',
      countryCode: 'PT',
      region: 'Lisboa',
      latitude: 38.72,
      longitude: -9.14,
    },
    timezone: 'Europe/Lisbon',
    current: { temperatureC: 17, weatherCode: 3, time: '2026-11-05T14:00' },
    forecast: [
      { date: '2026-11-05', minTemperatureC: 12, maxTemperatureC: 19, weatherCode: 3 },
      { date: '2026-11-06', minTemperatureC: 11, maxTemperatureC: 18, weatherCode: 61 },
      { date: '2026-11-07', minTemperatureC: 10, maxTemperatureC: 17, weatherCode: 2 },
      { date: '2026-11-08', minTemperatureC: 12, maxTemperatureC: 20, weatherCode: 0 },
      { date: '2026-11-09', minTemperatureC: 13, maxTemperatureC: 21, weatherCode: 0 },
    ],
  },
];

export const initialMockWeather = mockWeather[0];
