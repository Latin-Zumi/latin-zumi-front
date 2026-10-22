import { useEffect, useState } from 'react';
import {
  getBalances,
  getRates,
  getTransactions,
  getUser,
} from './services/walletService';
import { formatMoney, getUnifiedBalance } from './utils/money';
import type { Balance, Rates, Transaction, User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [rates, setRates] = useState<Rates | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    Promise.all([getUser(), getBalances(), getRates(), getTransactions()]).then(
      ([u, b, r, t]) => {
        setUser(u);
        setBalances(b);
        setRates(r);
        setTransactions(t);
      },
    );
  }, []);

  if (!user || !rates) return <p>Cargando...</p>;

  const total = getUnifiedBalance(balances, user.moneda_preferida, rates);

  return (
    <main style={{ padding: 24 }}>
      <h1>Hola, {user.nombre}</h1>
      <h2>Saldo unificado: {formatMoney(total, user.moneda_preferida)}</h2>
      <ul>
        {balances.map((b) => (
          <li key={b.currency}>
            {b.currency}: {formatMoney(b.amount, b.currency)}
          </li>
        ))}
      </ul>
      <h3>Movimientos</h3>
      <ul>
        {transactions.map((tx) => (
          <li key={tx.id}>
            {tx.type} · {tx.status} · {tx.created_at}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;