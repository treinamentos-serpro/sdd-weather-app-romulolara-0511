import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CityResults from '../../src/components/CityResults';
import CurrentWeather from '../../src/components/CurrentWeather';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';
import { initialMockWeather } from '../fixtures/weather';

describe('Componentes reutilizáveis', () => {
  it('encaminha o objeto completo da cidade selecionada', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CityResults cities={[initialMockWeather.city]} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /São Paulo.*Brasil/ }));
    expect(onSelect).toHaveBeenCalledWith(initialMockWeather.city);
  });

  it('anuncia carregamento sem apresentar dados ou erro', () => {
    render(<LoadingState message="Carregando o clima de São Paulo..." />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o clima de São Paulo...');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('anuncia estado vazio', () => {
    render(<EmptyState title="Nenhuma cidade encontrada" message="Tente outro nome." />);
    expect(screen.getByRole('status')).toHaveTextContent('Tente outro nome.');
  });

  it('apresenta falha e permite nova tentativa por teclado', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState message="Falha ao carregar o clima de São Paulo." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar o clima de São Paulo.');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('apresenta condição desconhecida explicitamente', () => {
    render(
      <CurrentWeather
        data={{
          ...initialMockWeather,
          current: { ...initialMockWeather.current, weatherCode: 999 },
        }}
        unit="celsius"
      />,
    );
    expect(screen.getByText('Condição não disponível')).toBeVisible();
  });
});
