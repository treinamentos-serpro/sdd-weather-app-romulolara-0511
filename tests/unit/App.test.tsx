import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { formatTemperature } from '../../src/lib/temperature';
import { initialMockWeather, mockWeather } from '../../src/mocks/weather';

describe('Interface de demonstração', () => {
  it('apresenta cidade, condição e exatamente cinco dias identificados como fictícios', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
    expect(screen.getByText(/Não use como previsão real/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'true');
    const current = screen.getByRole('region', { name: 'São Paulo' });
    expect(within(current).getByText('Parcialmente nublado')).toBeVisible();
    expect(within(current).getByText(formatTemperature(24, 'celsius'))).toBeVisible();
    const forecast = screen.getByRole('region', { name: 'Previsão de 5 dias' });
    expect(within(forecast).getAllByRole('article')).toHaveLength(5);
    expect(forecast.querySelectorAll('time')).toHaveLength(5);
    expect([...forecast.querySelectorAll('time')].map((time) => time.dateTime)).toEqual(
      initialMockWeather.forecast.map((day) => day.date),
    );
  });

  it('converte todas as temperaturas sem mudar a cidade ou as datas nem acessar a rede', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      render(<App />);
      await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

      expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute(
        'aria-pressed',
        'false',
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
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('busca e seleciona outra cidade usando apenas o teclado, mantendo a unidade', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    await user.click(screen.getByRole('searchbox', { name: 'Nome da cidade' }));
    await user.type(screen.getByRole('searchbox'), 'rio{Enter}');
    const option = screen.getByRole('button', { name: /Rio de Janeiro.*Brasil/ });
    expect(screen.queryByRole('heading', { name: 'São Paulo' })).not.toBeInTheDocument();
    option.focus();
    await user.keyboard('{Enter}');
    const current = screen.getByRole('region', { name: 'Rio de Janeiro' });
    expect(within(current).getByText('Céu limpo')).toBeVisible();
    expect(within(current).getByText(formatTemperature(29, 'fahrenheit'))).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    const rio = mockWeather[1];
    screen.getAllByRole('article').forEach((card, index) => {
      expect(
        within(card).getByText(
          formatTemperature(rio.forecast[index].maxTemperatureC, 'fahrenheit'),
        ),
      ).toBeVisible();
    });
  });

  it('aceita nomes sem acentos e distingue busca vazia de ausência de resultados', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'sao paulo{Enter}');
    expect(screen.getByRole('button', { name: /São Paulo.*Brasil/ })).toBeVisible();
    await user.clear(input);
    await user.type(input, 'Atlantida{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, '   {Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Qual cidade vamos explorar?');
  });

  it('inclui o contexto geográfico de Lisboa nos resultados', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox'), 'Lisboa');
    await user.click(screen.getByRole('button', { name: 'Buscar cidade' }));
    await user.click(screen.getByRole('button', { name: 'Lisboa Lisboa, Portugal' }));
    expect(screen.getByRole('heading', { name: 'Lisboa' })).toBeVisible();
    expect(
      within(screen.getByRole('region', { name: 'Lisboa' })).getByText(
        formatTemperature(17, 'celsius'),
      ),
    ).toBeVisible();
  });
});
