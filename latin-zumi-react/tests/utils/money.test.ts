import { describe, expect, it } from 'vitest';
import {
  formatExchangeRate,
  formatMoney,
  fromCents,
  getAvailableAmount,
  getInsufficientFundsError,
  parseAmountInput,
  toCents,
} from '../../src/utils/money';
import type { Balance } from '../../src/types';
import { normalizeSpaces } from '../helpers/factories';

describe('formatMoney', () => {
  it('usa el formato argentino con el símbolo de cada moneda', () => {
    expect(normalizeSpaces(formatMoney('118200', 'ARS'))).toBe('$ 118.200,00');
    expect(normalizeSpaces(formatMoney(1070.5, 'USD'))).toBe('US$ 1.070,50');
  });
});

describe('formatExchangeRate', () => {
  it('muestra la cotización en el sentido en que la cifra es mayor a 1', () => {
    expect(formatExchangeRate('USD', 'ARS', 980)).toBe('1 USD = 980,00 ARS');
    expect(formatExchangeRate('ARS', 'USD', 1 / 980)).toBe('1 USD = 980,00 ARS');
  });

  it('usa cuatro decimales cuando la cifra es chica', () => {
    expect(formatExchangeRate('USD', 'EUR', 1.0638)).toBe('1 USD = 1,0638 EUR');
  });
});

describe('parseAmountInput', () => {
  it('acepta enteros y decimales con punto o coma', () => {
    expect(parseAmountInput('1500')).toBe(150000);
    expect(parseAmountInput('1500.5')).toBe(150050);
    expect(parseAmountInput('1500,50')).toBe(150050);
  });

  it('acepta el punto de miles, como se escribe en Argentina y Colombia', () => {
    expect(parseAmountInput('1.250')).toBe(125000);
    expect(parseAmountInput('1.250,5')).toBe(125050);
    expect(parseAmountInput('1.250.000')).toBe(125000000);
    expect(parseAmountInput(' 1.250.000,50 ')).toBe(125000050);
  });

  it('con un solo punto y hasta dos cifras después, el punto es decimal', () => {
    expect(parseAmountInput('10.5')).toBe(1050);
    expect(parseAmountInput('1.25')).toBe(125);
  });

  it('rechaza puntos de miles mal puestos y el formato de Estados Unidos', () => {
    expect(parseAmountInput('12.50,5')).toBeNull();
    expect(parseAmountInput('1.25.000')).toBeNull();
    expect(parseAmountInput('1250.000')).toBeNull();
    expect(parseAmountInput('1,250.50')).toBeNull();
    expect(parseAmountInput('1,250,000')).toBeNull();
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
