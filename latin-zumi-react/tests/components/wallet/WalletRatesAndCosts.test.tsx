import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import WalletRatesAndCosts from '../../../src/components/wallet/WalletRatesAndCosts';
import type { WalletRates } from '../../../src/types';

function makeRates(overrides: Partial<WalletRates> = {}): WalletRates {
  return {
    rates: { USD: 1, ARS: 1000, COP: 4000, EUR: 0.9 },
    observed_at: '2026-11-04T18:00:00.000Z',
    exchange_spread_percent: '0.00',
    interest_rates: [
      { currency: 'ARS', annual_percent: '0.00' },
      { currency: 'COP', annual_percent: '0.00' },
      { currency: 'EUR', annual_percent: '0.00' },
      { currency: 'USD', annual_percent: '0.00' },
    ],
    ...overrides,
  };
}

function renderRates(data: WalletRates) {
  return render(<WalletRatesAndCosts data={data} isLoading={false} hasError={false} onRetry={vi.fn()} />);
}

describe('WalletRatesAndCosts', () => {
  it('muestra los seis pares de monedas, sin depender de los saldos del usuario', () => {
    renderRates(makeRates());

    expect(screen.getByText('1 USD = 1.000,00 ARS')).toBeInTheDocument();
    expect(screen.getByText('1 EUR = 1,1111 USD')).toBeInTheDocument();
    expect(screen.getAllByRole('definition')).toHaveLength(8);
  });

  it('muestra comisión e interés en cero con los valores recibidos', () => {
    renderRates(makeRates());

    expect(screen.getByText('Comisión').nextSibling).toHaveTextContent('0 %');
    expect(screen.getByText('Interés anual').nextSibling).toHaveTextContent('0 %');
  });

  it('muestra la comisión real si no es cero', () => {
    renderRates(makeRates({ exchange_spread_percent: '3.00' }));

    expect(screen.getByText('Comisión').nextSibling).toHaveTextContent('3 %');
  });

  it('separa el interés por moneda cuando no es igual en todas', () => {
    renderRates(
      makeRates({
        interest_rates: [
          { currency: 'ARS', annual_percent: '5.00' },
          { currency: 'USD', annual_percent: '0.00' },
        ],
      }),
    );

    expect(screen.queryByText('Interés anual')).not.toBeInTheDocument();
    expect(screen.getByText(/Interés anual en .*peso/i).nextSibling).toHaveTextContent('5 %');
  });

  it('mientras carga no muestra valores', () => {
    render(<WalletRatesAndCosts data={null} isLoading hasError={false} onRetry={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando las tasas');
    expect(screen.queryByText('Comisión')).not.toBeInTheDocument();
  });

  it('si falla no inventa valores y permite reintentar', async () => {
    const onRetry = vi.fn();
    render(<WalletRatesAndCosts data={null} isLoading={false} hasError onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar');
    expect(screen.queryByText('0 %')).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
