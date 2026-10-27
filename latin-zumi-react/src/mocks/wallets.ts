import type {
  Balance,
  Currency,
  ExchangeQuote,
  OperationResult,
  Transaction,
  TransactionErrorCode,
  TransactionPage,
  TransactionType,
} from '../types';
import { getCurrentRates } from '../utils/dashboard';
import { fromCents, parseAmountInput, toCents } from '../utils/money';
import { findMockUser } from './users';

// Simula los endpoints de /wallet guardando billeteras por email en localStorage.
// Devuelve lo mismo que respondería el backend: datos o un código de error.
export type MockResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: TransactionErrorCode };

const STORAGE_KEY = 'latin-zumi:mock-wallets';
const CURRENCIES: Currency[] = ['ARS', 'COP', 'USD', 'EUR'];
const QUOTE_TTL_MS = 60_000;

interface MockWallet {
  wallet_id: number;
  balances: Record<Currency, number>; // en centavos
  transactions: Transaction[]; // del más nuevo al más viejo
  processed: Record<string, OperationResult>; // por Idempotency-Key
}

const quotes = new Map<
  string,
  { email: string; from: Currency; to: Currency; cents: number; toCents: number; rate: string; expiresAt: number }
>();

const ok = <T>(data: T): MockResult<T> => ({ ok: true, data });
const fail = (code: TransactionErrorCode): MockResult<never> => ({ ok: false, code });

function readWallets(): Record<string, MockWallet> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MockWallet>) : {};
  } catch {
    return {};
  }
}

function writeWallets(wallets: Record<string, MockWallet>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch {
    // storage no disponible: los movimientos quedan solo en esta sesión
  }
}

function daysAgo(days: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function createTransaction(
  type: TransactionType,
  currency: Currency,
  cents: number,
  description: string,
  extra: Partial<Transaction> = {},
): Transaction {
  return {
    id: crypto.randomUUID(),
    type,
    status: 'completed',
    currency,
    amount: fromCents(cents),
    created_at: new Date().toISOString(),
    description,
    ...extra,
  };
}

// Toda billetera nueva arranca con saldo de prueba y algunos movimientos para ver los gráficos
function createSeedWallet(walletId: number): MockWallet {
  const transactions: Transaction[] = [
    createTransaction('deposit', 'ARS', 8_320_000, 'Depósito inicial', { created_at: daysAgo(4, 10) }),
    createTransaction('deposit', 'COP', 143_400_000, 'Depósito inicial', { created_at: daysAgo(4, 11) }),
    createTransaction('deposit', 'USD', 87_050, 'Depósito inicial', { created_at: daysAgo(3, 11) }),
    createTransaction('deposit', 'EUR', 88_675, 'Depósito inicial', { created_at: daysAgo(3, 12) }),
    createTransaction('deposit', 'ARS', 3_500_000, 'Depósito', { created_at: daysAgo(2, 15) }),
    createTransaction('deposit', 'USD', 20_000, 'Depósito', { created_at: daysAgo(1, 9) }),
    createTransaction('transfer_sent', 'COP', 4_200_000, 'Transferencia a Lucía', {
      created_at: daysAgo(1, 16),
      counterparty: { nombre: 'Lucía', email: 'lucia@ejemplo.test' },
    }),
  ];

  const balances = Object.fromEntries(CURRENCIES.map((currency) => [currency, 0])) as Record<Currency, number>;
  for (const transaction of transactions) {
    const cents = toCents(transaction.amount);
    balances[transaction.currency] += transaction.type === 'transfer_sent' ? -cents : cents;
  }

  return {
    wallet_id: walletId,
    balances,
    transactions: transactions.reverse(),
    processed: {},
  };
}

function getWallet(wallets: Record<string, MockWallet>, email: string): MockWallet {
  const key = email.toLowerCase();
  wallets[key] ??= createSeedWallet(findMockUser(key)?.id ?? Object.keys(wallets).length + 1);
  return wallets[key];
}

function toBalances(wallet: MockWallet): Balance[] {
  return CURRENCIES.map((currency) => ({
    wallet_id: wallet.wallet_id,
    currency,
    amount: fromCents(wallet.balances[currency]),
  }));
}

// Si la misma Idempotency-Key llega dos veces, se devuelve la respuesta anterior sin repetir la operación
function runOnce(
  email: string,
  idempotencyKey: string,
  operation: (wallets: Record<string, MockWallet>, wallet: MockWallet) => MockResult<OperationResult>,
): MockResult<OperationResult> {
  const wallets = readWallets();
  const wallet = getWallet(wallets, email);
  const previous = wallet.processed[idempotencyKey];
  if (previous) return ok(previous);

  const result = operation(wallets, wallet);
  if (result.ok) {
    wallet.processed[idempotencyKey] = result.data;
    writeWallets(wallets);
  }
  return result;
}

export function getMockBalances(email: string): MockResult<Balance[]> {
  const wallets = readWallets();
  const wallet = getWallet(wallets, email);
  writeWallets(wallets);
  return ok(toBalances(wallet));
}

export function getMockTransactions(
  email: string,
  filters: { type?: TransactionType; currency?: Currency; page?: number; limit?: number },
): MockResult<TransactionPage> {
  const wallets = readWallets();
  const wallet = getWallet(wallets, email);
  writeWallets(wallets);

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const matching = wallet.transactions.filter(
    (transaction) =>
      (!filters.type || transaction.type === filters.type) &&
      (!filters.currency || transaction.currency === filters.currency),
  );
  return ok({
    items: matching.slice((page - 1) * limit, page * limit),
    page,
    total: matching.length,
  });
}

export function lookupMockUser(email: string): MockResult<{ nombre: string }> {
  const user = findMockUser(email);
  return user ? ok({ nombre: user.nombre }) : fail('RECIPIENT_NOT_FOUND');
}

export function mockTransfer(
  email: string,
  data: { recipient_email: string; currency: Currency; amount: string },
  idempotencyKey: string,
): MockResult<OperationResult> {
  return runOnce(email, idempotencyKey, (wallets, wallet) => {
    const cents = parseAmountInput(data.amount);
    if (cents === null) return fail('INVALID_AMOUNT');

    const recipientEmail = data.recipient_email.trim().toLowerCase();
    if (recipientEmail === email.toLowerCase()) return fail('SELF_TRANSFER');

    const sender = findMockUser(email);
    const recipient = findMockUser(recipientEmail);
    if (!sender || !recipient) return fail('RECIPIENT_NOT_FOUND');
    if (wallet.balances[data.currency] < cents) return fail('INSUFFICIENT_FUNDS');

    const recipientWallet = getWallet(wallets, recipientEmail);
    wallet.balances[data.currency] -= cents;
    recipientWallet.balances[data.currency] += cents;

    const sent = createTransaction('transfer_sent', data.currency, cents, `Transferencia a ${recipient.nombre}`, {
      counterparty: { nombre: recipient.nombre, email: recipient.email },
    });
    wallet.transactions.unshift(sent);
    recipientWallet.transactions.unshift(
      createTransaction('transfer_received', data.currency, cents, `Transferencia de ${sender.nombre}`, {
        counterparty: { nombre: sender.nombre, email: sender.email },
      }),
    );

    return ok({ transaction: sent, balances: toBalances(wallet) });
  });
}

export function mockDeposit(
  email: string,
  data: { currency: Currency; amount: string },
  idempotencyKey: string,
): MockResult<OperationResult> {
  return runOnce(email, idempotencyKey, (_wallets, wallet) => {
    const cents = parseAmountInput(data.amount);
    if (cents === null) return fail('INVALID_AMOUNT');

    wallet.balances[data.currency] += cents;
    const transaction = createTransaction('deposit', data.currency, cents, 'Depósito');
    wallet.transactions.unshift(transaction);
    return ok({ transaction, balances: toBalances(wallet) });
  });
}

export function getMockExchangeQuote(
  email: string,
  data: { from: Currency; to: Currency; amount: string },
): MockResult<ExchangeQuote> {
  const cents = parseAmountInput(data.amount);
  if (cents === null || data.from === data.to) return fail('INVALID_AMOUNT');

  const rates = getCurrentRates();
  const rate = rates[data.to] / rates[data.from];
  const quote = {
    email: email.toLowerCase(),
    from: data.from,
    to: data.to,
    cents,
    toCents: Math.round(cents * rate),
    rate: rate.toPrecision(8),
    expiresAt: Date.now() + QUOTE_TTL_MS,
  };
  const quoteId = crypto.randomUUID();
  quotes.set(quoteId, quote);

  return ok({
    quote_id: quoteId,
    rate: quote.rate,
    to_amount: fromCents(quote.toCents),
    expires_at: new Date(quote.expiresAt).toISOString(),
  });
}

export function mockExchange(
  email: string,
  quoteId: string,
  idempotencyKey: string,
): MockResult<OperationResult> {
  return runOnce(email, idempotencyKey, (_wallets, wallet) => {
    const quote = quotes.get(quoteId);
    if (!quote || quote.email !== email.toLowerCase() || quote.expiresAt < Date.now()) {
      return fail('QUOTE_EXPIRED');
    }
    if (wallet.balances[quote.from] < quote.cents) return fail('INSUFFICIENT_FUNDS');

    wallet.balances[quote.from] -= quote.cents;
    wallet.balances[quote.to] += quote.toCents;
    quotes.delete(quoteId);

    const transaction = createTransaction('exchange', quote.from, quote.cents, `Cambio de ${quote.from} a ${quote.to}`, {
      exchange: { to_currency: quote.to, to_amount: fromCents(quote.toCents), rate: quote.rate },
    });
    wallet.transactions.unshift(transaction);
    return ok({ transaction, balances: toBalances(wallet) });
  });
}
