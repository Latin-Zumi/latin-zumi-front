import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import WalletRatesAndCosts from '../../../src/components/wallet/WalletRatesAndCosts';
import type { CurrencyRates } from '../../../src/utils/dashboard';
import type { Balance } from '../../../src/types';

const rates: CurrencyRates = {
  USD: 1,
  ARS: 1000,
  COP: 4000,
  EUR: 0.9,
};

function balance(currency: Balance['currency'], accountId: string): Balance {
  return {
    account_id: accountId,
    wallet_id: 'wallet-1',
    currency,
    amount: '100',
  };
}

describe('WalletRatesAndCosts', () => {
  it('muestra las tasas entre monedas con saldo y explicita comisión e interés en cero', () => {
    render(
      <WalletRatesAndCosts
        balances={[balance('ARS', 'account-1'), balance('USD', 'account-2'), balance('EUR', 'account-3')]}
        rates={rates}
      />,
    );

    expect(screen.getByText('1 USD = 1.000,00 ARS')).toBeInTheDocument();
    expect(screen.getByText('1 EUR = 1,1111 USD')).toBeInTheDocument();
    expect(screen.getByText('Comisión')).toBeInTheDocument();
    expect(screen.getByText('Interés')).toBeInTheDocument();
    expect(screen.getAllByText('0 %')).toHaveLength(2);
  });

  it('mantiene visibles los costos en cero cuando no hay dos monedas con saldo', () => {
    render(<WalletRatesAndCosts balances={[balance('USD', 'account-1')]} rates={rates} />);

    expect(screen.getByText(/al menos dos monedas/)).toBeInTheDocument();
    expect(screen.getAllByText('0 %')).toHaveLength(2);
  });
});
