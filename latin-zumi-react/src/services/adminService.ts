import {
  getMockAdminMetrics,
  getMockAdminSettings,
  getMockAdminUser,
  getMockAdminUsers,
  getMockSettingsHistory,
  setMockAdminUserStatus,
  updateMockAdminSettings,
  type AdminMockResult,
} from '../mocks/admin';
import type {
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
  UserStatus,
} from '../types/admin';
import { ApiConnectionError, apiRequest } from './apiClient';
import { getSession } from './authService';
import { toTransaction, type TransactionResponse } from './transactionService';
import { toBalance, type AccountResponse } from './walletService';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const ERROR_MESSAGES: Record<AdminErrorCode, string> = {
  UNAUTHORIZED: 'Tu sesión expiró. Volvé a iniciar sesión.',
  FORBIDDEN: 'No tenés permiso para entrar al panel de administración.',
  USER_NOT_FOUND: 'No encontramos ese usuario.',
  INVALID_SETTINGS: 'Algún valor no es válido. Revisá los porcentajes.',
  CANNOT_BLOCK_SELF: 'No podés bloquear tu propia cuenta.',
  CONNECTION: 'No pudimos conectar con el servidor. Probá de nuevo.',
  UNKNOWN: 'No pudimos completar la operación. Probá de nuevo.',
};

export class AdminError extends Error {
  code: AdminErrorCode;

  constructor(code: AdminErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.code = code;
  }
}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function isErrorCode(value: unknown): value is AdminErrorCode {
  return typeof value === 'string' && value in ERROR_MESSAGES;
}

async function readErrorCode(response: Response): Promise<AdminErrorCode> {
  try {
    const body = (await response.json()) as { code?: unknown };
    if (isErrorCode(body.code)) return body.code;
  } catch {
    // el backend no mandó un body JSON
  }
  if (response.status === 401) return 'UNAUTHORIZED';
  if (response.status === 403) return 'FORBIDDEN';
  return 'UNKNOWN';
}

// Misma interfaz para el mock y el backend, como en transactionService
async function request<T>(
  path: string,
  init: RequestInit,
  mock: (email: string) => AdminMockResult<T>,
  fromApi: (body: unknown) => T = (body) => body as T,
): Promise<T> {
  const session = getSession();
  if (!session) throw new AdminError('UNAUTHORIZED');

  if (USE_MOCK) {
    await delay(300); // simula la latencia de la API
    const result = mock(session.user.email);
    if (!result.ok) throw new AdminError(result.code);
    return result.data;
  }

  let response: Response;
  try {
    response = await apiRequest(path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${session.token}` },
    });
  } catch (error) {
    if (error instanceof ApiConnectionError) throw new AdminError('CONNECTION');
    throw error;
  }

  if (!response.ok) throw new AdminError(await readErrorCode(response));
  return fromApi(await response.json());
}

function patch(body: unknown): RequestInit {
  return {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

// El detalle trae los saldos con el formato de GET /accounts y los movimientos con null
function toUserDetail(body: unknown): AdminUserDetail {
  const { user, balances, recent_transactions } = body as {
    user: AdminUser;
    balances: AccountResponse[];
    recent_transactions: TransactionResponse[];
  };
  return {
    user,
    balances: balances.map(toBalance),
    recent_transactions: recent_transactions.map(toTransaction),
  };
}

export function getMetrics(period: MetricsPeriod): Promise<AdminMetrics> {
  return request(
    `/admin/metrics${toQuery({ period })}`,
    {},
    (email) => getMockAdminMetrics(email, period),
  );
}

export function getSettings(): Promise<AdminSettings> {
  return request('/admin/settings', {}, (email) => getMockAdminSettings(email));
}

export function updateSettings(changes: AdminSettingsChanges): Promise<AdminSettings> {
  return request(
    '/admin/settings',
    patch(changes),
    (email) => updateMockAdminSettings(email, changes),
  );
}

export function getSettingsHistory(page = 1): Promise<Page<SettingsChange>> {
  return request(
    `/admin/settings/history${toQuery({ page })}`,
    {},
    (email) => getMockSettingsHistory(email, page),
  );
}

export function getUsers(filters: AdminUserFilters = {}): Promise<Page<AdminUser>> {
  return request(
    `/admin/users${toQuery({ ...filters })}`,
    {},
    (email) => getMockAdminUsers(email, filters),
  );
}

export function getUser(id: string): Promise<AdminUserDetail> {
  return request(
    `/admin/users/${encodeURIComponent(id)}`,
    {},
    (email) => getMockAdminUser(email, id),
    toUserDetail,
  );
}

export async function setUserStatus(id: string, estado: UserStatus): Promise<AdminUser> {
  const { user } = await request(
    `/admin/users/${encodeURIComponent(id)}`,
    patch({ estado }),
    (email) => setMockAdminUserStatus(email, id, estado),
  );
  return user;
}
