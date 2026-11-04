import type { Currency } from '../types';
import type {
  AdminActor,
  AdminErrorCode,
  AdminMetrics,
  AdminSettings,
  AdminSettingsChanges,
  AdminUser,
  AdminUserDetail,
  AdminUserFilters,
  MetricsPeriod,
  Page,
  SettingsChange,
} from '../types/admin';
import { fromCents, toCents } from '../utils/money';
import { findMockUser, listMockUsers, setMockUserStatus, type MockUser } from './users';
import { readMockSettings, SETTINGS_KEY } from './settings';
import { getMockBalances, getMockTransactions } from './wallets';

// Simula los endpoints de /admin. Los parámetros y su historial se guardan en localStorage.
export type AdminMockResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: AdminErrorCode };

const HISTORY_KEY = 'latin-zumi:mock-admin-history';
const CURRENCIES: Currency[] = ['ARS', 'COP', 'USD', 'EUR'];

const ok = <T>(data: T): AdminMockResult<T> => ({ ok: true, data });
const fail = (code: AdminErrorCode): AdminMockResult<never> => ({ ok: false, code });

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage no disponible: los cambios quedan solo en esta sesión
  }
}

function paginate<T>(items: T[], page = 1, limit = 20): Page<T> {
  return { items: items.slice((page - 1) * limit, page * limit), page, total: items.length };
}

function toAdminUser(user: MockUser): AdminUser {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    pais: user.pais,
    roles: user.roles,
    estado: user.estado,
    created_at: user.created_at ?? new Date(0).toISOString(),
  };
}

function isAdmin(email: string): boolean {
  return findMockUser(email)?.roles.includes('admin') ?? false;
}

function isInPeriod(value: string, period: MetricsPeriod, now: Date): boolean {
  const date = new Date(value);
  const sameMonth = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  return period === 'month' ? sameMonth : sameMonth && date.getDate() === now.getDate();
}

// Simula GET /admin/metrics con las billeteras mock
export function getMockAdminMetrics(email: string, period: MetricsPeriod): AdminMockResult<AdminMetrics> {
  if (!isAdmin(email)) return fail('FORBIDDEN');

  const now = new Date();
  const users = listMockUsers();
  const totals = Object.fromEntries(
    CURRENCIES.map((currency) => [currency, { deposits: 0, exchanges: 0, transfers: 0 }]),
  ) as Record<Currency, { deposits: number; exchanges: number; transfers: number }>;

  for (const user of users) {
    const result = getMockTransactions(user.email, { limit: 1000 });
    if (!result.ok) continue;
    for (const transaction of result.data.items) {
      if (!isInPeriod(transaction.created_at, period, now)) continue;
      const cents = toCents(transaction.amount);
      const row = totals[transaction.currency];
      if (transaction.type === 'deposit') row.deposits += cents;
      if (transaction.type === 'exchange') row.exchanges += cents;
      // Cada transferencia se cuenta una vez, del lado de quien envía
      if (transaction.type === 'transfer_sent') row.transfers += cents;
    }
  }

  const blocked = users.filter((user) => user.estado === 'bloqueado').length;
  return ok({
    period,
    users: {
      total: users.length,
      active: users.length - blocked,
      blocked,
      new_in_period: users.filter((user) => user.created_at && isInPeriod(user.created_at, period, now)).length,
    },
    volume: CURRENCIES.map((currency) => ({
      currency,
      deposits: fromCents(totals[currency].deposits),
      exchanges: fromCents(totals[currency].exchanges),
      transfers: fromCents(totals[currency].transfers),
    })),
  });
}

// Simula GET /admin/settings
export function getMockAdminSettings(email: string): AdminMockResult<AdminSettings> {
  if (!isAdmin(email)) return fail('FORBIDDEN');
  return ok(readMockSettings());
}

// Simula PATCH /admin/settings: guarda en el historial cada campo que cambió
export function updateMockAdminSettings(
  email: string,
  changes: AdminSettingsChanges,
): AdminMockResult<AdminSettings> {
  const admin = findMockUser(email);
  if (!admin?.roles.includes('admin')) return fail('FORBIDDEN');

  const current = readMockSettings();
  const actor: AdminActor = { nombre: admin.nombre, email: admin.email };
  const changedAt = new Date().toISOString();
  const history: SettingsChange[] = [];
  const record = (field: string, oldValue: string, newValue: string) => {
    if (oldValue === newValue) return;
    history.push({
      id: crypto.randomUUID(),
      field,
      old_value: oldValue,
      new_value: newValue,
      changed_at: changedAt,
      changed_by: actor,
    });
  };

  const spread = changes.exchange_spread_percent ?? current.exchange_spread_percent;
  record('exchange_spread_percent', current.exchange_spread_percent, spread);

  const rates = current.interest_rates.map((rate) => {
    const next = changes.interest_rates?.find((item) => item.currency === rate.currency);
    if (!next) return rate;
    record(`interest_rates.${rate.currency}`, rate.annual_percent, next.annual_percent);
    return { ...rate, annual_percent: next.annual_percent };
  });

  if (history.length === 0) return ok(current);

  const updated: AdminSettings = {
    exchange_spread_percent: spread,
    interest_rates: rates,
    updated_at: changedAt,
    updated_by: actor,
  };
  writeJson(SETTINGS_KEY, updated);
  writeJson(HISTORY_KEY, [...history, ...readJson<SettingsChange[]>(HISTORY_KEY, [])]);
  return ok(updated);
}

// Simula GET /admin/settings/history
export function getMockSettingsHistory(email: string, page?: number): AdminMockResult<Page<SettingsChange>> {
  if (!isAdmin(email)) return fail('FORBIDDEN');
  return ok(paginate(readJson<SettingsChange[]>(HISTORY_KEY, []), page));
}

// Simula GET /admin/users
export function getMockAdminUsers(email: string, filters: AdminUserFilters): AdminMockResult<Page<AdminUser>> {
  if (!isAdmin(email)) return fail('FORBIDDEN');

  const search = filters.search?.trim().toLowerCase() ?? '';
  const users = listMockUsers()
    .filter(
      (user) =>
        (!search || user.nombre.toLowerCase().includes(search) || user.email.includes(search)) &&
        (!filters.estado || user.estado === filters.estado),
    )
    .map(toAdminUser)
    .sort((first, second) => second.created_at.localeCompare(first.created_at));
  return ok(paginate(users, filters.page, filters.limit));
}

// Simula GET /admin/users/:id
export function getMockAdminUser(email: string, id: string): AdminMockResult<AdminUserDetail> {
  if (!isAdmin(email)) return fail('FORBIDDEN');

  const user = listMockUsers().find((item) => item.id === id);
  if (!user) return fail('USER_NOT_FOUND');

  const balances = getMockBalances(user.email);
  const transactions = getMockTransactions(user.email, { limit: 10 });
  return ok({
    user: toAdminUser(user),
    balances: balances.ok ? balances.data : [],
    recent_transactions: transactions.ok ? transactions.data.items : [],
  });
}

// Simula PATCH /admin/users/:id
export function setMockAdminUserStatus(
  email: string,
  id: string,
  estado: string,
): AdminMockResult<{ user: AdminUser }> {
  const admin = findMockUser(email);
  if (!admin?.roles.includes('admin')) return fail('FORBIDDEN');
  if (admin.id === id && estado === 'bloqueado') return fail('CANNOT_BLOCK_SELF');

  const user = setMockUserStatus(id, estado);
  return user ? ok({ user: toAdminUser(user) }) : fail('USER_NOT_FOUND');
}
