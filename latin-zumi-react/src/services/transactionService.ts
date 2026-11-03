import {
  getMockExchangeQuote,
  getMockTransactions,
  lookupMockUser,
  mockDeposit,
  mockExchange,
  mockTransfer,
  type MockResult,
} from '../mocks/wallets';
import type {
  Currency,
  ExchangeQuote,
  OperationResult,
  Transaction,
  TransactionErrorCode,
  TransactionPage,
  TransactionType,
} from '../types';
import { ApiConnectionError, apiRequest } from './apiClient';
import { getSession } from './authService';
import { toBalance, type AccountResponse } from './walletService';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const ERROR_MESSAGES: Record<TransactionErrorCode, string> = {
  INVALID_AMOUNT: 'El monto no es válido. Usá hasta dos decimales.',
  UNAUTHORIZED: 'Tu sesión expiró. Volvé a iniciar sesión.',
  RECIPIENT_NOT_FOUND: 'No encontramos una cuenta con ese email.',
  QUOTE_EXPIRED: 'La cotización venció. Pedí una nueva.',
  QUOTE_ALREADY_USED: 'Esa cotización ya se usó. Pedí una nueva.',
  AMOUNT_TOO_SMALL: 'El monto es muy chico: convertido da menos de 0,01.',
  SAME_CURRENCY: 'Elegí dos monedas distintas.',
  CONVERSION_UNAVAILABLE: 'No hay una cotización disponible en este momento. Probá más tarde.',
  IDEMPOTENCY_CONFLICT: 'Esta operación ya se procesó con otros datos. Empezá de nuevo.',
  QUOTE_NOT_FOUND: 'No encontramos esa cotización. Pedí una nueva.',
  WALLET_NOT_FOUND: 'No encontramos tu billetera. Cerrá sesión y volvé a ingresar.',
  ACCOUNT_NOT_FOUND: 'No encontramos la cuenta de esa moneda en tu billetera.',
  INVALID_IDEMPOTENCY_KEY: 'No pudimos procesar la operación. Empezá de nuevo.',
  INSUFFICIENT_FUNDS: 'No tenés saldo suficiente en esa moneda.',
  SELF_TRANSFER: 'No podés transferirte a vos mismo.',
  CONNECTION: 'No pudimos conectar con el servidor. Probá de nuevo.',
  UNKNOWN: 'No pudimos completar la operación. Probá de nuevo.',
};

export class TransactionError extends Error {
  code: TransactionErrorCode;

  constructor(code: TransactionErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.code = code;
  }
}

export interface TransactionFilters {
  type?: TransactionType;
  currency?: Currency;
  page?: number;
  limit?: number;
}

export interface TransferData {
  recipient_email: string;
  currency: Currency;
  amount: string;
  note?: string;
}

export interface DepositData {
  currency: Currency;
  amount: string;
}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Movimiento tal como lo devuelve el backend: sin contraparte o sin cambio vienen en null
export type TransactionResponse = Omit<Transaction, 'counterparty' | 'exchange'> & {
  counterparty: Transaction['counterparty'] | null;
  exchange: Transaction['exchange'] | null;
};

interface OperationResponse {
  transaction: TransactionResponse;
  balances: AccountResponse[];
}

export function toTransaction({ counterparty, exchange, ...transaction }: TransactionResponse): Transaction {
  return {
    ...transaction,
    ...(counterparty && { counterparty }),
    ...(exchange && { exchange }),
  };
}

// Las operaciones devuelven los saldos con el formato de GET /accounts
function toOperationResult(body: unknown): OperationResult {
  const { transaction, balances } = body as OperationResponse;
  return { transaction: toTransaction(transaction), balances: balances.map(toBalance) };
}

function toTransactionPage(body: unknown): TransactionPage {
  const { items, page, total } = body as TransactionPage & { items: TransactionResponse[] };
  return { items: items.map(toTransaction), page, total };
}

function isErrorCode(value: unknown): value is TransactionErrorCode {
  return typeof value === 'string' && value in ERROR_MESSAGES;
}

async function readErrorCode(response: Response): Promise<TransactionErrorCode> {
  try {
    const body = (await response.json()) as { code?: unknown };
    if (isErrorCode(body.code)) return body.code;
  } catch {
    // el backend no mandó un body JSON
  }
  return response.status === 401 ? 'UNAUTHORIZED' : 'UNKNOWN';
}

// Misma interfaz para el mock y el backend: las pantallas no saben cuál corre.
// fromApi pasa la respuesta del backend al formato del front; el mock ya lo usa.
async function request<T>(
  path: string,
  init: RequestInit,
  mock: (email: string) => MockResult<T>,
  fromApi: (body: unknown) => T = (body) => body as T,
): Promise<T> {
  const session = getSession();
  if (!session) throw new TransactionError('UNAUTHORIZED');

  if (USE_MOCK) {
    await delay(400); // simula la latencia de la API
    const result = mock(session.user.email);
    if (!result.ok) throw new TransactionError(result.code);
    return result.data;
  }

  let response: Response;
  try {
    response = await apiRequest(path, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${session.token}` },
    });
  } catch (error) {
    if (error instanceof ApiConnectionError) throw new TransactionError('CONNECTION');
    throw error;
  }

  if (!response.ok) throw new TransactionError(await readErrorCode(response));
  return fromApi(await response.json());
}

function post(body: unknown, idempotencyKey: string): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(body),
  };
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

export function getTransactions(filters: TransactionFilters = {}): Promise<TransactionPage> {
  return request(
    `/wallet/transactions${toQuery({ ...filters })}`,
    {},
    (email) => getMockTransactions(email, filters),
    toTransactionPage,
  );
}

export function lookupUser(email: string): Promise<{ nombre: string }> {
  return request(
    `/users/lookup${toQuery({ email })}`,
    {},
    () => lookupMockUser(email),
  );
}

export function transfer(data: TransferData, idempotencyKey: string): Promise<OperationResult> {
  return request(
    '/wallet/transfers',
    post(data, idempotencyKey),
    (email) => mockTransfer(email, data, idempotencyKey),
    toOperationResult,
  );
}

export function deposit(data: DepositData, idempotencyKey: string): Promise<OperationResult> {
  return request(
    '/wallet/deposits',
    post(data, idempotencyKey),
    (email) => mockDeposit(email, data, idempotencyKey),
    toOperationResult,
  );
}

export function getExchangeQuote(
  from: Currency,
  to: Currency,
  amount: string,
): Promise<ExchangeQuote> {
  return request(
    `/wallet/exchange/quote${toQuery({ from, to, amount })}`,
    {},
    (email) => getMockExchangeQuote(email, { from, to, amount }),
  );
}

export function exchange(quoteId: string, idempotencyKey: string): Promise<OperationResult> {
  return request(
    '/wallet/exchanges',
    post({ quote_id: quoteId }, idempotencyKey),
    (email) => mockExchange(email, quoteId, idempotencyKey),
    toOperationResult,
  );
}
