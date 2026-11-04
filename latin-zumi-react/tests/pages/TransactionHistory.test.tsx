import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import TransactionHistory from '../../src/pages/TransactionHistory';
import { WalletContext, type WalletContextValue } from '../../src/context/wallet/WalletContext';
import { makeTransaction } from '../helpers/factories';

describe('TransactionHistory', () => {
  it('muestra movimientos de interés sin ofrecerlo como filtro', () => {
    const wallet: WalletContextValue = {
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
    };

    render(
      <WalletContext.Provider value={wallet}>
        <MemoryRouter>
          <TransactionHistory />
        </MemoryRouter>
      </WalletContext.Provider>,
    );

    const typeFilter = screen.getByRole('combobox', { name: 'Tipo de movimiento' });
    expect(within(typeFilter).queryByRole('option', { name: 'Interés' })).not.toBeInTheDocument();

    const movement = screen.getByRole('listitem');
    expect(movement).toHaveTextContent('Interés ganado');
    expect(movement).toHaveTextContent('Interés');
    expect(movement).toHaveTextContent('+');
    expect(within(movement).getByText('↓')).toBeInTheDocument();
  });
});
