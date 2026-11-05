import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useWeather from '../../src/hooks/useWeather';
import * as weatherService from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';
import { mockWeather, initialMockWeather as weather } from '../fixtures/weather';

vi.mock('../../src/services/weatherService');

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  vi.mocked(weatherService.searchCities).mockResolvedValue([weather.city]);
  vi.mocked(weatherService.getWeather).mockResolvedValue(weather);
});

afterEach(() => vi.useRealTimers());

async function flushSearchDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

describe('useWeather', () => {
  it('inicia em idle e Celsius, sem consultar serviços', () => {
    const { result } = renderHook(useWeather);
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(result.current.unit).toBe('celsius');
    expect(weatherService.searchCities).not.toHaveBeenCalled();
    expect(weatherService.getWeather).not.toHaveBeenCalled();
  });

  it.each([
    { cities: [weather.city] },
    { cities: [] },
  ])('comunica loading e resultado de busca: %j', async ({ cities }) => {
    const pending = deferred<City[]>();
    vi.mocked(weatherService.searchCities).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(useWeather);
    act(() => {
      void result.current.searchCities('  São Paulo  ');
    });
    expect(result.current.state).toEqual({ status: 'searching' });
    act(() => result.current.setUnit('fahrenheit'));
    expect(result.current.state.status).toBe('searching');
    await flushSearchDebounce();
    expect(weatherService.searchCities).toHaveBeenCalledWith('São Paulo', expect.any(AbortSignal));
    await act(async () => pending.resolve(cities));
    expect(result.current.state).toEqual({ status: 'results', cities });
    expect(result.current.unit).toBe('fahrenheit');
  });

  it('comunica falha de busca e retry reutiliza o texto pesquisado', async () => {
    vi.mocked(weatherService.searchCities).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(useWeather);
    act(() => {
      result.current.searchCities('Lisboa');
    });
    await flushSearchDebounce();
    expect(result.current.state).toMatchObject({
      status: 'error',
      message: expect.stringContaining('buscar cidades'),
    });
    act(() => result.current.setUnit('fahrenheit'));
    expect(result.current.state.status).toBe('error');
    expect(weatherService.searchCities).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.state.status).toBe('results');
    expect(weatherService.searchCities).toHaveBeenLastCalledWith('Lisboa', expect.any(AbortSignal));
  });

  it('comunica timeout como falha recuperável com retry', async () => {
    const timeout = Object.assign(new Error('timeout'), {
      name: 'WeatherRequestTimeoutError',
    });
    vi.mocked(weatherService.searchCities).mockRejectedValueOnce(timeout);
    const { result } = renderHook(useWeather);
    act(() => result.current.searchCities('Lisboa'));
    await flushSearchDebounce();
    expect(result.current.state).toMatchObject({
      status: 'error',
      message: expect.stringContaining('tempo limite'),
    });
    await act(async () => result.current.retry());
    expect(result.current.state.status).toBe('results');
    expect(weatherService.searchCities).toHaveBeenCalledTimes(2);
  });

  it.each([
    'resolve',
    'reject',
  ] as const)('descarta busca obsoleta que termina em %s', async (outcome) => {
    const old = deferred<City[]>();
    vi.mocked(weatherService.searchCities).mockReturnValueOnce(old.promise);
    const { result } = renderHook(useWeather);
    act(() => {
      void result.current.searchCities('São Paulo');
    });
    await flushSearchDebounce();
    const signal = vi.mocked(weatherService.searchCities).mock.calls[0][1];
    act(() => {
      result.current.searchCities('Lisboa');
    });
    await flushSearchDebounce();
    expect(signal?.aborted).toBe(true);
    const latest = result.current.state;
    await act(async () => {
      if (outcome === 'resolve') old.resolve([mockWeather[2].city]);
      else old.reject(new DOMException('Obsoleta', 'AbortError'));
    });
    expect(result.current.state).toEqual(latest);
  });

  it.each([
    '',
    ' ',
    'S',
    'SP',
    ' SP ',
  ])('não consulta serviços para entrada abaixo do limite: %j', async (query) => {
    const { result } = renderHook(useWeather);
    await act(async () => {
      await result.current.searchCities(query);
    });
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(weatherService.searchCities).not.toHaveBeenCalled();
    expect(weatherService.getWeather).not.toHaveBeenCalled();
  });

  it('busca com exatamente três caracteres consulta o serviço sem espaços nas extremidades', async () => {
    const { result } = renderHook(useWeather);
    act(() => {
      result.current.searchCities('  São  ');
    });
    await flushSearchDebounce();
    expect(weatherService.searchCities).toHaveBeenCalledExactlyOnceWith(
      'São',
      expect.any(AbortSignal),
    );
    expect(result.current.state.status).toBe('results');
  });

  it.each([
    '   ',
    'S',
    'SP',
  ])('texto curto %j cancela consulta pendente e volta a idle', async (query) => {
    const old = deferred<City[]>();
    vi.mocked(weatherService.searchCities).mockReturnValueOnce(old.promise);
    const { result } = renderHook(useWeather);
    act(() => {
      void result.current.searchCities('São Paulo');
    });
    await flushSearchDebounce();
    const signal = vi.mocked(weatherService.searchCities).mock.calls[0][1];
    act(() => {
      result.current.searchCities(query);
    });

    expect(signal?.aborted).toBe(true);
    await act(async () => old.resolve([weather.city]));
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(weatherService.searchCities).toHaveBeenCalledTimes(1);
  });

  it('texto curto limpa erro e impede retry de uma busca anterior', async () => {
    vi.mocked(weatherService.searchCities).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(useWeather);
    act(() => {
      result.current.searchCities('Lisboa');
    });
    await flushSearchDebounce();
    expect(result.current.state.status).toBe('error');
    act(() => {
      result.current.searchCities('Li');
    });
    await act(async () => result.current.retry());
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(weatherService.searchCities).toHaveBeenCalledTimes(1);
  });

  it('seleciona cidade, mantém loading ao trocar unidade e não refaz consulta', async () => {
    const pending = deferred<WeatherData>();
    vi.mocked(weatherService.getWeather).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(useWeather);
    act(() => {
      void result.current.selectCity(weather.city);
    });
    expect(result.current.state).toEqual({ status: 'loading', city: weather.city });
    act(() => result.current.setUnit('fahrenheit'));
    expect(result.current.state).toEqual({ status: 'loading', city: weather.city });
    await act(async () => pending.resolve(weather));
    expect(result.current.state).toEqual({ status: 'success', data: weather });
    act(() => result.current.setUnit('celsius'));
    expect(result.current.state).toEqual({ status: 'success', data: weather });
    expect(weatherService.getWeather).toHaveBeenCalledTimes(1);
    expect(weatherService.getWeather).toHaveBeenCalledWith(weather.city, expect.any(AbortSignal));
  });

  it('preserva cidade e erro ao trocar unidade; retry não precisa de nova busca', async () => {
    vi.mocked(weatherService.getWeather).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(useWeather);
    await act(async () => {
      await result.current.selectCity(weather.city);
    });
    expect(result.current.state).toMatchObject({ status: 'error', city: weather.city });
    const errorState = result.current.state;
    act(() => result.current.setUnit('fahrenheit'));
    expect(result.current.state).toEqual(errorState);
    expect(weatherService.getWeather).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.retry();
    });
    expect(result.current.state).toEqual({ status: 'success', data: weather });
    expect(result.current.unit).toBe('fahrenheit');
    expect(weatherService.getWeather).toHaveBeenLastCalledWith(
      weather.city,
      expect.any(AbortSignal),
    );
    expect(weatherService.searchCities).not.toHaveBeenCalled();
  });

  it.each([
    'resolve',
    'reject',
  ] as const)('prevalece a cidade mais recente após %s da anterior', async (outcome) => {
    const old = deferred<WeatherData>();
    const lisboa = mockWeather[2];
    vi.mocked(weatherService.getWeather)
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(lisboa);
    const { result } = renderHook(useWeather);
    act(() => {
      void result.current.selectCity(weather.city);
    });
    const signal = vi.mocked(weatherService.getWeather).mock.calls[0][1];
    await act(async () => {
      await result.current.selectCity(lisboa.city);
    });
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      if (outcome === 'resolve') old.resolve(weather);
      else old.reject(new Error('falha tardia'));
    });
    expect(result.current.state).toEqual({ status: 'success', data: lisboa });
  });

  it('seleção cancela busca pendente; nova busca cancela previsão pendente', async () => {
    const search = deferred<City[]>();
    const forecast = deferred<WeatherData>();
    vi.mocked(weatherService.searchCities).mockReturnValueOnce(search.promise);
    vi.mocked(weatherService.getWeather).mockReturnValueOnce(forecast.promise);
    const { result } = renderHook(useWeather);
    act(() => {
      void result.current.searchCities('São Paulo');
    });
    await flushSearchDebounce();
    const searchSignal = vi.mocked(weatherService.searchCities).mock.calls[0][1];
    act(() => {
      void result.current.selectCity(weather.city);
    });
    expect(searchSignal?.aborted).toBe(true);
    await act(async () => search.resolve([weather.city]));
    expect(result.current.state.status).toBe('loading');
    const forecastSignal = vi.mocked(weatherService.getWeather).mock.calls[0][1];
    act(() => {
      result.current.searchCities('Lisboa');
    });
    await flushSearchDebounce();
    expect(forecastSignal?.aborted).toBe(true);
    await act(async () => forecast.resolve(weather));
    expect(result.current.state.status).toBe('results');
  });

  it.each(['search', 'forecast'] as const)('cancela %s ao desmontar', async (type) => {
    const { result, unmount } = renderHook(useWeather);
    act(() => {
      if (type === 'search') void result.current.searchCities('São Paulo');
      else void result.current.selectCity(weather.city);
    });
    if (type === 'search') await flushSearchDebounce();
    const service = type === 'search' ? weatherService.searchCities : weatherService.getWeather;
    const signal = vi.mocked(service).mock.calls[0][1];
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it('espera 300 ms, reinicia o prazo em nova edição e cancela a busca pendente em seleção', async () => {
    const { result } = renderHook(useWeather);
    act(() => result.current.searchCities('São'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    act(() => result.current.searchCities('São Paulo'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(weatherService.searchCities).not.toHaveBeenCalled();
    act(() => void result.current.selectCity(weather.city));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(weatherService.searchCities).not.toHaveBeenCalled();
    expect(weatherService.getWeather).toHaveBeenCalledOnce();
  });

  it('limpa o temporizador de debounce ao desmontar antes da consulta', async () => {
    const { result, unmount } = renderHook(useWeather);
    act(() => result.current.searchCities('Lisboa'));
    unmount();
    await vi.advanceTimersByTimeAsync(300);
    expect(weatherService.searchCities).not.toHaveBeenCalled();
  });
});
