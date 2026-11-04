import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import TransactionHistory from '../../src/pages/TransactionHistory';
import { WalletContext, type WalletContextValue } from '../../src/context/wallet/WalletContext';
import { makeTransaction } from '../helpers/factories';

function makeWallet(overrides: Partial<WalletContextValue> = {}): WalletContextValue {
  return {
    balances: [],
    transactions: [
      makeTransaction({
        id: 'interest-1',
        type: 'interest',
        amount: '12.50',
        description: 'Interés ganado',
      }),
    ],
    isLoading: false,
    error: '',
    reload: vi.fn().mockResolvedValue(undefined),
    transfer: vi.fn(async () => makeTransaction()),
    deposit: vi.fn(async () => makeTransaction()),
    exchange: vi.fn(async () => makeTransaction()),
    ...overrides,
  };
}

function renderHistory(wallet: WalletContextValue, useMock: boolean) {
  vi.stubEnv('VITE_USE_MOCK', useMock ? 'true' : 'false');
  render(
    <WalletContext.Provider value={wallet}>
      <MemoryRouter>
        <TransactionHistory />
      </MemoryRouter>
    </WalletContext.Provider>,
  );
}

describe('TransactionHistory', () => {
  it('muestra el aviso de prueba en modo mock y lista los movimientos', () => {
    renderHistory(makeWallet(), true);

    expect(screen.getByRole('note')).toHaveTextContent('Modo de pruebas');

    const typeFilter = screen.getByRole('combobox', { name: 'Tipo de movimiento' });
    expect(within(typeFilter).queryByRole('option', { name: 'Interés' })).not.toBeInTheDocument();

    const movement = screen.getByRole('listitem');
    expect(movement).toHaveTextContent('Interés ganado');
    expect(movement).toHaveTextContent('Interés');
    expect(movement).toHaveTextContent('+');
    expect(within(movement).getByText('↓')).toBeInTheDocument();
  });

  it('no muestra el aviso de prueba en modo API real y mantiene los movimientos', () => {
    renderHistory(makeWallet(), false);

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    expect(screen.getByText('Interés ganado')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('Interés');
  });

  it('mantiene el estado de carga sin mostrar el aviso de mock', () => {
    renderHistory(makeWallet({ isLoading: true, transactions: [] }), true);

    expect(screen.getByText('Cargando el historial de movimientos...')).toBeInTheDocument();
    expect(screen.queryByText('Modo de pruebas')).not.toBeInTheDocument();
  });

  it('mantiene el mensaje de error de API sin mostrar el aviso de mock', () => {
    renderHistory(makeWallet({ error: 'Error del servidor', transactions: [] }), false);

    expect(screen.getByText(/Error del servidor/)).toBeInTheDocument();
    expect(screen.queryByText('Modo de pruebas')).not.toBeInTheDocument();
  });

  it('mantiene el estado vacío del historial en modo API real', () => {
    renderHistory(makeWallet({ transactions: [] }), false);

    expect(screen.getByText('Todavía no hay movimientos')).toBeInTheDocument();
    expect(screen.queryByText('Modo de pruebas')).not.toBeInTheDocument();
  });
});
