import type { City, WeatherData } from '../types/weather';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isCode(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value) && value >= 0;
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isLocalTime(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value) &&
    isDate(value.slice(0, 10))
  );
}

async function request(url: URL, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Open-Meteo: HTTP ${response.status} em ${url.pathname}.`);
  }
  const data: unknown = await response.json();
  if (!isRecord(data) || data.error) {
    throw new Error('Open-Meteo: resposta inválida ou erro do serviço.');
  }
  return data;
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const name = query.trim();
  if (!name) throw new Error('Informe um nome de cidade para buscar.');
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({ name, count: '5', language: 'pt', format: 'json' }).toString();
  const data = await request(url, signal);
  if (!isRecord(data)) throw new Error('Open-Meteo: geocodificação inválida.');
  if (data.results === undefined) return [];
  if (!Array.isArray(data.results)) throw new Error('Open-Meteo: lista de cidades inválida.');

  return data.results
    .map((city: unknown): City => {
      if (
        !isRecord(city) ||
        !isCode(city.id) ||
        !isText(city.name) ||
        !isText(city.country) ||
        !isNumber(city.latitude) ||
        Math.abs(city.latitude) > 90 ||
        !isNumber(city.longitude) ||
        Math.abs(city.longitude) > 180 ||
        (city.country_code !== undefined && !isText(city.country_code)) ||
        (city.admin1 !== undefined && !isText(city.admin1))
      ) {
        throw new Error('Open-Meteo: campos de cidade inválidos.');
      }
      return {
        id: city.id,
        name: city.name,
        country: city.country,
        countryCode: city.country_code,
        region: city.admin1,
        latitude: city.latitude,
        longitude: city.longitude,
      };
    })
    .slice(0, 5);
}

export async function getWeather(city: City, signal?: AbortSignal): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    temperature_unit: 'celsius',
    forecast_days: '5',
    timezone: 'auto',
  }).toString();
  const data = await request(url, signal);
  if (!isRecord(data) || !isText(data.timezone)) {
    throw new Error('Open-Meteo: timezone ausente ou inválido.');
  }
  // O runtime valida o identificador IANA sem converter horários locais da API.
  new Intl.DateTimeFormat('pt-BR', { timeZone: data.timezone });
  const { current, daily } = data;
  if (
    !isRecord(current) ||
    !isNumber(current.temperature_2m) ||
    !isCode(current.weather_code) ||
    !isLocalTime(current.time) ||
    !isRecord(daily)
  ) {
    throw new Error('Open-Meteo: condições atuais ou previsão inválidas.');
  }
  const dates = daily.time;
  const codes = daily.weather_code;
  const minima = daily.temperature_2m_min;
  const maxima = daily.temperature_2m_max;
  if (
    !Array.isArray(dates) ||
    dates.length !== 5 ||
    !dates.every(isDate) ||
    !Array.isArray(codes) ||
    codes.length !== 5 ||
    !codes.every(isCode) ||
    !Array.isArray(minima) ||
    minima.length !== 5 ||
    !minima.every(isNumber) ||
    !Array.isArray(maxima) ||
    maxima.length !== 5 ||
    !maxima.every(isNumber)
  ) {
    throw new Error('Open-Meteo: previsão incompleta ou desalinhada.');
  }
  const today = Date.parse(`${current.time.slice(0, 10)}T00:00:00Z`);
  const forecast = dates.map((date, index) => {
    if (
      Date.parse(`${date}T00:00:00Z`) !== today + index * 86_400_000 ||
      minima[index] > maxima[index]
    ) {
      throw new Error('Open-Meteo: datas ou temperaturas da previsão inconsistentes.');
    }
    return {
      date,
      minTemperatureC: minima[index],
      maxTemperatureC: maxima[index],
      weatherCode: codes[index],
    };
  });
  return {
    city,
    timezone: data.timezone,
    current: {
      temperatureC: current.temperature_2m,
      weatherCode: current.weather_code,
      time: current.time,
    },
    forecast,
  };
}
