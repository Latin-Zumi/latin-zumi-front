import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AvailableBalance from '../../../src/components/wallet/AvailableBalance';
import type { Balance } from '../../../src/types';
import { normalizeSpaces } from '../../helpers/factories';

const BALANCES: Balance[] = [
  { account_id: 'a1', wallet_id: 'w1', currency: 'ARS', amount: '1500.5' },
  { account_id: 'a2', wallet_id: 'w1', currency: 'USD', amount: '0' },
];

const availableText = () => normalizeSpaces(screen.getByText(/Disponible/).textContent ?? '');

describe('AvailableBalance', () => {
  it('muestra el saldo de la moneda elegida y "Usar todo" completa el monto', async () => {
    const onUseAll = vi.fn();
    render(<AvailableBalance id="disponible" currency="ARS" balances={BALANCES} onUseAll={onUseAll} />);

    expect(availableText()).toContain('1.500,50');

    await userEvent.click(screen.getByRole('button', { name: 'Usar todo' }));
    // Con coma decimal, como lo escribe el usuario
    expect(onUseAll).toHaveBeenCalledWith('1500,50');
  });

  it('sin saldo en esa moneda no ofrece "Usar todo"', () => {
    render(<AvailableBalance id="disponible" currency="USD" balances={BALANCES} onUseAll={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Usar todo' })).not.toBeInTheDocument();
  });

  it('una moneda sin cuenta cuenta como saldo cero', () => {
    render(<AvailableBalance id="disponible" currency="EUR" balances={BALANCES} onUseAll={vi.fn()} />);

    expect(availableText()).toContain('0,00');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
