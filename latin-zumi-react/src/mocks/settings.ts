import type { Currency } from '../types';
import type { AdminSettings } from '../types/admin';

// Parámetros del mock: los edita el panel de admin y los usan la billetera y los cambios
export const SETTINGS_KEY = 'latin-zumi:mock-admin-settings';

const CURRENCIES: Currency[] = ['ARS', 'COP', 'USD', 'EUR'];

const DEFAULT_SETTINGS: AdminSettings = {
  exchange_spread_percent: '0.00',
  interest_rates: CURRENCIES.map((currency) => ({ currency, annual_percent: '0.00' })),
  updated_at: null,
  updated_by: null,
};

export function readMockSettings(): AdminSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as AdminSettings) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
