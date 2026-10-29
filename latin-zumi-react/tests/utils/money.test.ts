import { describe, expect, it } from 'vitest';
import {
  fromCents,
  getAvailableAmount,
  getInsufficientFundsError,
  parseAmountInput,
  toCents,
} from '../../src/utils/money';
import type { Balance } from '../../src/types';

describe('parseAmountInput', () => {
  it('acepta enteros y decimales con punto o coma', () => {
    expect(parseAmountInput('1500')).toBe(150000);
    expect(parseAmountInput('1500.5')).toBe(150050);
    expect(parseAmountInput('1500,50')).toBe(150050);
  });

  it('rechaza montos vacíos, en cero, negativos o con más de dos decimales', () => {
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('0')).toBeNull();
    expect(parseAmountInput('-10')).toBeNull();
    expect(parseAmountInput('10,555')).toBeNull();
    expect(parseAmountInput('abc')).toBeNull();
  });
});

describe('toCents y fromCents', () => {
  it('evitan el error de redondeo de los decimales', () => {
    expect(toCents('0.1') + toCents('0.2')).toBe(30);
    expect(fromCents(30)).toBe('0.30');
  });
});

describe('saldo disponible', () => {
  const balances: Balance[] = [
    { account_id: 'a-ARS', wallet_id: 'a', currency: 'ARS', amount: '1000.00' },
  ];

  it('devuelve el saldo de la moneda, o 0 si no hay cuenta', () => {
    expect(getAvailableAmount(balances, 'ARS')).toBe('1000.00');
    expect(getAvailableAmount(balances, 'USD')).toBe('0');
  });

  it('avisa solo cuando el monto supera lo disponible', () => {
    expect(getInsufficientFundsError('1000', '1000.00')).toBeUndefined();
    expect(getInsufficientFundsError('1000,01', '1000.00')).toBe(
      'No tenés saldo suficiente en esa moneda.',
    );
    // Un monto mal escrito no es falta de saldo: lo valida el formulario al enviar
    expect(getInsufficientFundsError('abc', '1000.00')).toBeUndefined();
  });
});
