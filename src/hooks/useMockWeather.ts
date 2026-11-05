import { useState } from 'react';
import { initialMockWeather, mockWeather } from '../mocks/weather';
import type { City, TemperatureUnit, WeatherViewState } from '../types/weather';

function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export default function useMockWeather() {
  const [unit, setUnit] = useState<TemperatureUnit>('celsius');
  const [state, setState] = useState<WeatherViewState>({
    status: 'success',
    data: initialMockWeather,
  });

  function searchCities(query: string) {
    const normalized = normalizeQuery(query);
    if (!normalized) {
      setState({ status: 'idle' });
      return;
    }
    const cities = mockWeather
      .filter(({ city }) => normalizeQuery(city.name).includes(normalized))
      .slice(0, 5)
      .map(({ city }) => city);
    setState({ status: 'results', cities });
  }

  function selectCity(city: City) {
    const data = mockWeather.find((weather) => weather.city.id === city.id);
    if (!data) {
      setState({
        status: 'error',
        city,
        message: 'Não há dados de demonstração para esta cidade.',
      });
      return;
    }
    setState({ status: 'success', data });
  }

  function retry() {
    if (state.status === 'error' && state.city) selectCity(state.city);
  }

  return { state, unit, setUnit, searchCities, selectCity, retry };
}
