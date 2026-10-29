import { describe, expect, it } from 'vitest';
import {
  getTransactionDescription,
  groupTransactionsByDay,
} from '../../src/utils/transactions';
import { makeTransaction } from '../helpers/factories';

// Fechas en hora local, igual que las agrupa la app
const at = (day: number, hour: number) => new Date(2026, 9, day, hour, 0).toISOString();
const NOW = new Date(2026, 9, 29, 18, 0); // jueves 29 de octubre

describe('getTransactionDescription', () => {
  it('muestra el nombre de la otra persona en las transferencias', () => {
    const transfer = makeTransaction({
      type: 'transfer_sent',
      description: 'Transferencia a Lucía',
      counterparty: { nombre: 'Lucía', email: 'lucia@ejemplo.test' },
    });
    expect(getTransactionDescription(transfer)).toBe('Lucía');
  });

  it('usa la descripción cuando no hay otra persona', () => {
    expect(getTransactionDescription(makeTransaction({ description: 'Depósito' }))).toBe('Depósito');
  });
});

describe('groupTransactionsByDay', () => {
  it('agrupa por día con "Hoy", "Ayer" o el día de la semana', () => {
    const groups = groupTransactionsByDay(
      [
        makeTransaction({ id: 'hoy-tarde', created_at: at(29, 16) }),
        makeTransaction({ id: 'hoy-mañana', created_at: at(29, 9) }),
        makeTransaction({ id: 'ayer', created_at: at(28, 12) }),
        makeTransaction({ id: 'martes', created_at: at(27, 15) }),
      ],
      NOW,
    );

    expect(groups.map((group) => group.label)).toEqual(['Hoy', 'Ayer', 'Martes, 27 oct']);
    expect(groups[0].transactions.map((transaction) => transaction.id)).toEqual([
      'hoy-tarde',
      'hoy-mañana',
    ]);
  });

  it('reconoce "Ayer" aunque haya cambio de mes', () => {
    const groups = groupTransactionsByDay(
      [makeTransaction({ created_at: new Date(2026, 9, 31, 20, 0).toISOString() })],
      new Date(2026, 10, 1, 8, 0),
    );
    expect(groups[0].label).toBe('Ayer');
  });

  it('devuelve una lista vacía si no hay movimientos', () => {
    expect(groupTransactionsByDay([], NOW)).toEqual([]);
  });
});
