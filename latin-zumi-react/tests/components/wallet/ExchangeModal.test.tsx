import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExchangeModal from '../../../src/components/wallet/ExchangeModal';
import { WalletContext, type WalletContextValue } from '../../../src/context/wallet/WalletContext';
import { getExchangeQuote } from '../../../src/services/transactionService';
import type { ExchangeQuote } from '../../../src/types';
import { makeTransaction } from '../../helpers/factories';

vi.mock('../../../src/services/transactionService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/transactionService')>()),
  getExchangeQuote: vi.fn(),
}));

const getExchangeQuoteMock = vi.mocked(getExchangeQuote);

function makeQuote(spreadPercent?: string): ExchangeQuote {
  return {
    quote_id: 'quote-1',
    rate: '980',
    to_amount: '98.00',
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    ...(spreadPercent !== undefined && { spread_percent: spreadPercent }),
  };
}

function renderExchangeModal() {
  const wallet: WalletContextValue = {
    balances: [
      { account_id: 'account-usd', wallet_id: 'wallet-1', currency: 'USD', amount: '1000.00' },
    ],
    transactions: [],
    isLoading: false,
    error: '',
    reload: vi.fn(async () => undefined),
    transfer: vi.fn(async () => makeTransaction({ type: 'transfer_sent' })),
    deposit: vi.fn(async () => makeTransaction()),
    exchange: vi.fn(async () => makeTransaction({ type: 'exchange' })),
  };

  render(
    <WalletContext.Provider value={wallet}>
      <ExchangeModal isOpen onClose={vi.fn()} defaultCurrency="USD" />
    </WalletContext.Provider>,
  );
  return userEvent.setup();
}

async function requestQuote(user: ReturnType<typeof userEvent.setup>) {
  const amount = screen.getByLabelText('Monto a cambiar');
  await user.clear(amount);
  await user.paste('100');
  await user.click(screen.getByRole('button', { name: 'Cotizar' }));
}

describe('ExchangeModal', () => {
  beforeEach(() => {
    getExchangeQuoteMock.mockReset();
  });

  it('muestra la comisión antes de habilitar confirmar el cambio', async () => {
    getExchangeQuoteMock.mockResolvedValue(makeQuote('1.50'));
    const user = renderExchangeModal();

    await requestQuote(user);

    expect(await screen.findByText('Comisión: 1,5 %')).toBeInTheDocument();
    expect(screen.getByText(/Entregás/)).toBeInTheDocument();
    expect(getExchangeQuoteMock).toHaveBeenCalledWith('USD', 'ARS', '100.00');
    expect(screen.getByRole('button', { name: 'Confirmar cambio' })).toBeInTheDocument();
  });

  it('muestra "Sin comisión" cuando el porcentaje es cero', async () => {
    getExchangeQuoteMock.mockResolvedValue(makeQuote('0.00'));
    const user = renderExchangeModal();

    await requestQuote(user);

    expect(await screen.findByText('Comisión: Sin comisión')).toBeInTheDocument();
  });

  it('no muestra la fila de comisión cuando la cotización no trae el campo', async () => {
    getExchangeQuoteMock.mockResolvedValue(makeQuote());
    const user = renderExchangeModal();

    await requestQuote(user);

    expect(await screen.findByText(/Tipo de cambio:/)).toBeInTheDocument();
    expect(screen.queryByText(/Comisión:/)).not.toBeInTheDocument();
  });

  it('"Volver" conserva el monto ingresado', async () => {
    getExchangeQuoteMock.mockResolvedValue(makeQuote('1.50'));
    const user = renderExchangeModal();

    await requestQuote(user);
    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByLabelText('Monto a cambiar')).toHaveValue('100');
  });
});
