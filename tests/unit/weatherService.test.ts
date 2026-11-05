import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getWeather,
  searchCities,
  WeatherRequestTimeoutError,
} from '../../src/services/weatherService';
import { forecastResponse, geocodingResponse } from '../fixtures/openMeteo';
import { mockWeather, initialMockWeather as weather } from '../fixtures/weather';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function respond(body: unknown) {
  fetchMock.mockResolvedValue(Response.json(body));
}

describe('searchCities', () => {
  it('envia nome codificado, limite, idioma e sinal e normaliza contexto geográfico', async () => {
    respond(geocodingResponse([weather.city]));
    const signal = new AbortController().signal;
    expect(await searchCities(' São Paulo & região ', signal)).toEqual([weather.city]);
    const [input, options] = fetchMock.mock.calls[0];
    expect(input).toBeInstanceOf(URL);
    const url = new URL(String(input));
    expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      name: 'São Paulo & região',
      count: '5',
      language: 'pt',
      format: 'json',
    });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(options?.signal).not.toBe(signal);
  });

  it('cancela a chamada subjacente quando a consulta é invalidada', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementationOnce(
      (_input, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Cancelado', 'AbortError')),
            { once: true },
          );
        }),
    );
    const pending = searchCities('Lisboa', controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
  });

  it('aborta e identifica chamadas que excedem 10 segundos', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementationOnce(
      (_input, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Cancelado', 'AbortError')),
            { once: true },
          );
        }),
    );
    const pending = searchCities('Lisboa');
    const outcome = expect(pending).rejects.toBeInstanceOf(WeatherRequestTimeoutError);
    await vi.advanceTimersByTimeAsync(10_000);
    await outcome;
  });

  it.each([{}, { results: [] }])('distingue resposta vazia válida: %j', async (body) => {
    respond(body);
    expect(await searchCities('Atlantida')).toEqual([]);
  });

  it('aceita ausência de campos opcionais e limita a cinco cidades', async () => {
    const city = { ...weather.city, countryCode: undefined, region: undefined };
    respond(geocodingResponse(Array.from({ length: 6 }, (_, id) => ({ ...city, id }))));
    const cities = await searchCities('cidade');
    expect(cities).toHaveLength(5);
    expect(cities[0]).toEqual({ ...city, id: 0 });
  });

  it.each([
    null,
    [],
    { error: true, reason: 'inválido' },
    { results: null },
    { results: {} },
    { results: [{}] },
    ...[
      { id: '1' },
      { name: '' },
      { country: null },
      { latitude: 91 },
      { longitude: -181 },
      { latitude: '23' },
      { admin1: 1 },
      { country_code: false },
    ].map((invalid) => ({
      results: [{ ...geocodingResponse([weather.city]).results[0], ...invalid }],
    })),
  ])('rejeita geocodificação inválida: %j', async (body) => {
    respond(body);
    await expect(searchCities('cidade')).rejects.toThrow();
  });

  it('rejeita busca em branco sem consultar a rede', async () => {
    await expect(searchCities('  ')).rejects.toThrow('Informe');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('getWeather', () => {
  it('envia coordenadas selecionadas, campos mínimos, Celsius, cinco dias e timezone auto', async () => {
    const selected = mockWeather[2];
    respond(forecastResponse(selected));
    const signal = new AbortController().signal;
    expect(await getWeather(selected.city, signal)).toEqual(selected);
    const [input, options] = fetchMock.mock.calls[0];
    const url = new URL(String(input));
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      latitude: String(selected.city.latitude),
      longitude: String(selected.city.longitude),
      current: 'temperature_2m,weather_code',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      temperature_unit: 'celsius',
      forecast_days: '5',
      timezone: 'auto',
    });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(options?.signal).not.toBe(signal);
  });

  it('valida cinco dias locais consecutivos atravessando mês e ano, sem usar o relógio do dispositivo', async () => {
    const dates = ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03'];
    const body = forecastResponse(weather);
    body.timezone = 'Pacific/Kiritimati';
    body.current.time = '2026-12-30T00:15';
    body.daily.time = dates;
    respond(body);
    const data = await getWeather(weather.city);
    expect(data.forecast.map((day) => day.date)).toEqual(dates);
    expect(data.current.time).toBe('2026-12-30T00:15');
  });

  it('preserva códigos inteiros desconhecidos para apresentação genérica', async () => {
    const body = forecastResponse(weather);
    body.current.weather_code = 999;
    body.daily.weather_code[0] = 999;
    respond(body);
    expect((await getWeather(weather.city)).current.weatherCode).toBe(999);
  });

  it.each([
    null,
    { timezone: undefined },
    { timezone: 'zona/inexistente' },
    { timezone: '' },
    { current: null },
    { current: {} },
    { daily: null },
    ...[
      { temperature_2m: null },
      { temperature_2m: '24' },
      { weather_code: 1.5 },
      { weather_code: -1 },
      { time: '2026-02-30T12:00' },
      { time: '2026-11-05T25:00' },
      { time: 'ontem' },
    ].map((invalid) => ({ current: { ...forecastResponse(weather).current, ...invalid } })),
  ])('rejeita campos obrigatórios inválidos: %j', async (invalid) => {
    respond(invalid === null ? null : { ...forecastResponse(weather), ...invalid });
    await expect(getWeather(weather.city)).rejects.toThrow();
  });

  it.each([
    'time',
    'weather_code',
    'temperature_2m_min',
    'temperature_2m_max',
  ])('rejeita array %s ausente, curto, longo ou com valores inválidos', async (field) => {
    for (const invalid of [undefined, [], [1, 2, 3, 4], Array(6).fill(1), Array(5).fill(null)]) {
      const body = forecastResponse(weather);
      respond({ ...body, daily: { ...body.daily, [field]: invalid } });
      await expect(getWeather(weather.city)).rejects.toThrow();
    }
  });

  it.each([
    { time: ['2026-11-05', '2026-11-05', '2026-11-07', '2026-11-08', '2026-11-09'] },
    { time: ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'] },
    { time: ['2026-02-30', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'] },
    { weather_code: [0, 1, -1, 2, 3] },
    { temperature_2m_min: [40, 1, 2, 3, 4] },
  ])('rejeita datas fora de sequência e temperaturas inconsistentes: %j', async (invalid) => {
    const body = forecastResponse(weather);
    respond({ ...body, daily: { ...body.daily, ...invalid } });
    await expect(getWeather(weather.city)).rejects.toThrow();
  });
});

describe.each([
  ['busca', () => searchCities('São Paulo')],
  ['previsão', () => getWeather(weather.city)],
] as const)('falhas de %s', (_name, execute) => {
  it('propaga falha HTTP em vez de retornar dados vazios', async () => {
    fetchMock.mockResolvedValue(new Response('indisponível', { status: 503 }));
    await expect(execute()).rejects.toThrow('HTTP 503');
  });

  it('propaga falha de rede', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(execute()).rejects.toThrow('Failed to fetch');
  });

  it('rejeita JSON malformado', async () => {
    fetchMock.mockResolvedValue(new Response('{'));
    await expect(execute()).rejects.toThrow();
  });

  it('propaga cancelamento', async () => {
    fetchMock.mockRejectedValue(new DOMException('Cancelado', 'AbortError'));
    await expect(execute()).rejects.toMatchObject({ name: 'AbortError' });
  });
});
