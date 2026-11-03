import { describe, expect, it } from 'vitest';
import {
  formatPercent,
  getSettingLabel,
  parsePercentInput,
  toPercentInput,
} from '../../src/utils/admin';
import { normalizeSpaces } from '../helpers/factories';

describe('parsePercentInput', () => {
  it('acepta coma o punto y devuelve el formato del backend', () => {
    expect(parsePercentInput('1,5', 10)).toBe('1.50');
    expect(parsePercentInput('1.5', 10)).toBe('1.50');
    expect(parsePercentInput(' 0 ', 10)).toBe('0.00');
    expect(parsePercentInput('10', 10)).toBe('10.00');
  });

  it('rechaza lo que supera el máximo, los negativos y más de dos decimales', () => {
    expect(parsePercentInput('10,01', 10)).toBeNull();
    expect(parsePercentInput('-1', 10)).toBeNull();
    expect(parsePercentInput('1,555', 10)).toBeNull();
    expect(parsePercentInput('', 10)).toBeNull();
    expect(parsePercentInput('abc', 10)).toBeNull();
  });
});

describe('formato de porcentajes', () => {
  it('muestra el valor del backend con coma decimal', () => {
    expect(normalizeSpaces(formatPercent('1.50'))).toBe('1,50 %');
    expect(toPercentInput('4.5')).toBe('4,50');
  });

  it('nombra cada campo del historial', () => {
    expect(getSettingLabel('exchange_spread_percent')).toBe('Comisión de los cambios');
    expect(getSettingLabel('interest_rates.USD')).toBe('Interés anual en Dólar estadounidense');
  });
});
