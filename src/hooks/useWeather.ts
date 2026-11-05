import { useEffect, useRef, useState } from 'react';
import * as weatherService from '../services/weatherService';
import type { City, TemperatureUnit, WeatherViewState } from '../types/weather';

type WeatherRequest = { type: 'search'; query: string } | { type: 'forecast'; city: City };

export default function useWeather() {
  const [unit, setUnit] = useState<TemperatureUnit>('celsius');
  const [state, setState] = useState<WeatherViewState>({ status: 'idle' });
  const controller = useRef<AbortController | null>(null);
  const lastRequest = useRef<WeatherRequest | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  async function run(request: WeatherRequest) {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    lastRequest.current = request;
    setState(
      request.type === 'search'
        ? { status: 'searching' }
        : { status: 'loading', city: request.city },
    );
    try {
      const nextState: WeatherViewState =
        request.type === 'search'
          ? {
              status: 'results',
              cities: await weatherService.searchCities(request.query, active.signal),
            }
          : {
              status: 'success',
              data: await weatherService.getWeather(request.city, active.signal),
            };
      if (!active.signal.aborted) setState(nextState);
    } catch {
      if (active.signal.aborted) return;
      setState({
        status: 'error',
        ...(request.type === 'forecast' ? { city: request.city } : {}),
        message:
          request.type === 'search'
            ? 'Não foi possível buscar cidades. Verifique sua conexão e tente novamente.'
            : `Não foi possível consultar o clima de ${request.city.name}. Verifique sua conexão e tente novamente.`,
      });
    }
  }

  function searchCities(query: string) {
    const name = query.trim();
    if (!name) {
      controller.current?.abort();
      lastRequest.current = null;
      setState({ status: 'idle' });
      return;
    }
    return run({ type: 'search', query: name });
  }

  function selectCity(city: City) {
    return run({ type: 'forecast', city });
  }

  function retry() {
    if (state.status === 'error' && lastRequest.current) return run(lastRequest.current);
  }

  return { state, unit, setUnit, searchCities, selectCity, retry };
}
