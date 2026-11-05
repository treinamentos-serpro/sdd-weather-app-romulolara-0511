import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { formatTemperature } from '../../src/lib/temperature';
import * as weatherService from '../../src/services/weatherService';
import { initialMockWeather, mockWeather } from '../fixtures/weather';

vi.mock('../../src/services/weatherService');

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(weatherService.searchCities).mockResolvedValue([initialMockWeather.city]);
  vi.mocked(weatherService.getWeather).mockResolvedValue(initialMockWeather);
});

async function selectInitialCity() {
  const user = userEvent.setup();
  await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
  const option = await screen.findByRole('button', { name: /São Paulo.*Brasil/ });
  option.focus();
  await user.keyboard('{Enter}');
  await screen.findByRole('heading', { name: 'São Paulo' });
  return user;
}

describe('Interface integrada à Open-Meteo', () => {
  it('inicia vazia sem consultar rede e permite buscar e selecionar pelo teclado', async () => {
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('Qual cidade vamos explorar?');
    expect(weatherService.searchCities).not.toHaveBeenCalled();
    expect(weatherService.getWeather).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: /Open-Meteo/ })).toHaveAttribute(
      'href',
      'https://open-meteo.com/',
    );
    await selectInitialCity();

    const current = screen.getByRole('region', { name: 'São Paulo' });
    expect(within(current).getByText('Parcialmente nublado')).toBeVisible();
    expect(within(current).getByText(formatTemperature(24, 'celsius'))).toBeVisible();
    expect(within(current).getByText(/horário local/)).toBeVisible();
    const forecast = screen.getByRole('region', { name: 'Previsão de 5 dias' });
    expect(within(forecast).getAllByRole('article')).toHaveLength(5);
    expect([...forecast.querySelectorAll('time')].map((time) => time.dateTime)).toEqual(
      initialMockWeather.forecast.map((day) => day.date),
    );
    expect(screen.queryByText(/fictícios|demonstração/)).not.toBeInTheDocument();
  });

  it('converte todas as temperaturas sem mudar a cidade ou as datas nem refazer consultas', async () => {
    render(<App />);
    const user = await selectInitialCity();
    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
    expect(screen.queryAllByText(/°C/)).toHaveLength(1);
    expect(screen.getAllByText(/°F/)).toHaveLength(12);
    expect(screen.getByText(formatTemperature(24, 'fahrenheit'))).toBeVisible();
    const cards = screen.getAllByRole('article');
    initialMockWeather.forecast.forEach((day, index) => {
      expect(
        within(cards[index]).getByText(formatTemperature(day.minTemperatureC, 'fahrenheit')),
      ).toBeVisible();
      expect(
        within(cards[index]).getByText(formatTemperature(day.maxTemperatureC, 'fahrenheit')),
      ).toBeVisible();
      expect(cards[index].querySelector('time')).toHaveAttribute('dateTime', day.date);
    });
    await user.click(screen.getByRole('button', { name: 'Celsius' }));
    expect(screen.getByText(formatTemperature(24, 'celsius'))).toBeVisible();
    expect(weatherService.searchCities).toHaveBeenCalledTimes(1);
    expect(weatherService.getWeather).toHaveBeenCalledTimes(1);
  });

  it('seleciona a localização correta entre cidades homônimas', async () => {
    const lisboa = mockWeather[2];
    vi.mocked(weatherService.searchCities).mockResolvedValue([
      { ...initialMockWeather.city, name: 'Lisboa' },
      lisboa.city,
    ]);
    vi.mocked(weatherService.getWeather).mockResolvedValue(lisboa);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    await user.type(screen.getByRole('searchbox'), 'Lisboa{Enter}');
    await user.click(await screen.findByRole('button', { name: 'Lisboa Lisboa, Portugal' }));
    expect(await screen.findByRole('heading', { name: 'Lisboa' })).toBeVisible();
    expect(weatherService.getWeather).toHaveBeenCalledWith(lisboa.city, expect.any(AbortSignal));
    expect(
      within(screen.getByRole('region', { name: 'Lisboa' })).getByText(
        formatTemperature(17, 'fahrenheit'),
      ),
    ).toBeVisible();
  });

  it('distingue busca sem resultados de entrada vazia', async () => {
    vi.mocked(weatherService.searchCities).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'Atlantida{Enter}');
    expect(await screen.findByText('Nenhuma cidade encontrada')).toBeVisible();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
    await user.clear(input);
    await user.type(input, '   {Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Qual cidade vamos explorar?');
    expect(weatherService.searchCities).toHaveBeenCalledTimes(1);
  });

  it('apresenta loading, erro e retry da previsão sem repetir a busca', async () => {
    let rejectWeather: (reason: Error) => void = () => {};
    vi.mocked(weatherService.getWeather).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectWeather = reject;
        }),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    await user.click(await screen.findByRole('button', { name: /São Paulo.*Brasil/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o clima de São Paulo...');
    rejectWeather(new Error('offline'));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível consultar o clima de São Paulo',
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: 'São Paulo' })).toBeVisible();
    expect(weatherService.searchCities).toHaveBeenCalledTimes(1);
    expect(weatherService.getWeather).toHaveBeenCalledTimes(2);
  });

  it('repete a busca após falha, sem confundir erro com ausência de resultados', async () => {
    vi.mocked(weatherService.searchCities).mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'São Paulo{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível buscar cidades');
    expect(screen.queryByText('Nenhuma cidade encontrada')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('button', { name: /São Paulo.*Brasil/ })).toBeVisible();
    expect(weatherService.searchCities).toHaveBeenCalledTimes(2);
  });
});
