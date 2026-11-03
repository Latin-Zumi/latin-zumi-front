import type { Balance, Currency, Transaction } from './index';

// Contrato acordado en docs/specs/2026-11-03-Panel-admin-backend.md

export type MetricsPeriod = 'day' | 'month';

export type UserStatus = 'activo' | 'bloqueado';

export interface AdminMetrics {
  period: MetricsPeriod;
  users: { total: number; active: number; blocked: number; new_in_period: number };
  volume: { currency: Currency; deposits: string; exchanges: string; transfers: string }[];
}

export interface AdminActor {
  nombre: string;
  email: string;
}

export interface InterestRate {
  currency: Currency;
  annual_percent: string; // "4.00" es 4 %
}

export interface AdminSettings {
  exchange_spread_percent: string;
  interest_rates: InterestRate[];
  updated_at: string | null;
  updated_by: AdminActor | null;
}

export interface AdminSettingsChanges {
  exchange_spread_percent?: string;
  interest_rates?: InterestRate[];
}

export interface SettingsChange {
  id: string;
  field: string; // "exchange_spread_percent" o "interest_rates.USD"
  old_value: string;
  new_value: string;
  changed_at: string;
  changed_by: AdminActor | null; // null si el usuario ya no existe
}

export interface AdminUser {
  id: string;
  nombre: string;
  email: string;
  pais: string | null;
  roles: string[];
  estado: string;
  created_at: string;
}

export interface AdminUserDetail {
  user: AdminUser;
  balances: Balance[];
  recent_transactions: Transaction[];
}

export interface Page<T> {
  items: T[];
  page: number;
  total: number;
}

export interface AdminUserFilters {
  search?: string;
  estado?: UserStatus;
  page?: number;
  limit?: number;
}

export type AdminErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'USER_NOT_FOUND'
  | 'TOO_MANY_REQUESTS'
  | 'INVALID_SETTINGS'
  | 'CANNOT_BLOCK_SELF'
  | 'CONNECTION'
  | 'UNKNOWN';
