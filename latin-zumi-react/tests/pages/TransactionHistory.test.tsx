import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TransactionHistory from '../../src/pages/TransactionHistory';
import { TransactionError, getTransactions } from '../../src/services/transactionService';
import type { TransactionPage } from '../../src/types';
import { makeTransaction } from '../helpers/factories';

const logout = vi.fn().mockResolvedValue(undefined);

vi.mock('../../src/context/auth', () => ({
  useAuth: () => ({ logout }),
}));

// Solo se reemplaza el pedido; TransactionError es la real
vi.mock('../../src/services/transactionService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/transactionService')>()),
  getTransactions: vi.fn(),
}));

const getTransactionsMock = vi.mocked(getTransactions);

const INTEREST = makeTransaction({
  id: 'interest-1',
  type: 'interest',
  amount: '12.50',
  description: 'Interés ganado',
});

function makePage(overrides: Partial<TransactionPage> = {}): TransactionPage {
  return { items: [INTEREST], page: 1, total: 1, ...overrides };
}

function renderHistory(useMock = false) {
  vi.stubEnv('VITE_USE_MOCK', useMock ? 'true' : 'false');
  render(
    <MemoryRouter>
      <TransactionHistory />
    </MemoryRouter>,
  );
  return userEvent.setup();
}

describe('TransactionHistory', () => {
  beforeEach(() => {
    logout.mockClear();
    getTransactionsMock.mockReset();
    getTransactionsMock.mockResolvedValue(makePage());
  });

  it('muestra el aviso de prueba en modo mock y lista los movimientos', async () => {
    renderHistory(true);

    expect(screen.getByRole('note')).toHaveTextContent('Modo de pruebas');

    const movement = await screen.findByRole('listitem');
    expect(movement).toHaveTextContent('Interés ganado');
    expect(movement).toHaveTextContent('Interés');
    expect(movement).toHaveTextContent('+');
    expect(within(movement).getByText('↓')).toBeInTheDocument();
  });

  it('no muestra el aviso de prueba con la API real', async () => {
    renderHistory();

    expect(await screen.findByText('Interés ganado')).toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('no ofrece filtrar por interés, porque el back rechaza ese tipo', async () => {
    renderHistory();
    await screen.findByText('Interés ganado');

    const typeFilter = screen.getByRole('combobox', { name: 'Tipo de movimiento' });
    expect(within(typeFilter).queryByRole('option', { name: 'Interés' })).not.toBeInTheDocument();
  });

  it('muestra la carga mientras espera al back', () => {
    getTransactionsMock.mockReturnValue(new Promise(() => {}));
    renderHistory();

    expect(screen.getByText('Cargando el historial de movimientos...')).toBeInTheDocument();
  });

  it('pide la primera página sin filtros al entrar', async () => {
    renderHistory();
    await screen.findByText('Interés ganado');

    expect(getTransactionsMock).toHaveBeenCalledTimes(1);
    expect(getTransactionsMock).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('pasa de página y pide la siguiente al back', async () => {
    getTransactionsMock.mockResolvedValue(makePage({ total: 45 }));
    const user = renderHistory();

    expect(await screen.findByText('Página 1 de 3 · 45 movimientos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByText('Página 2 de 3 · 45 movimientos')).toBeInTheDocument();
    expect(getTransactionsMock).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
  });

  it('no muestra la paginación si todo entra en una página', async () => {
    renderHistory();
    await screen.findByText('Interés ganado');

    expect(screen.queryByRole('navigation', { name: 'Páginas' })).not.toBeInTheDocument();
  });

  it('al filtrar vuelve a la primera página y le pide el filtro al back', async () => {
    getTransactionsMock.mockResolvedValue(makePage({ total: 45 }));
    const user = renderHistory();

    await user.click(await screen.findByRole('button', { name: 'Siguiente' }));
    await screen.findByText('Página 2 de 3 · 45 movimientos');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Moneda' }), 'USD');

    expect(await screen.findByText('Página 1 de 3 · 45 movimientos')).toBeInTheDocument();
    expect(getTransactionsMock).toHaveBeenLastCalledWith({ currency: 'USD', page: 1, limit: 20 });
  });

  it('manda las fechas como instantes del día local del usuario', async () => {
    renderHistory();
    await screen.findByText('Interés ganado');

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-04' } });
    await screen.findByText('Interés ganado');

    expect(getTransactionsMock).toHaveBeenLastCalledWith({
      from: new Date(2026, 10, 1, 0, 0, 0).toISOString(),
      to: new Date(2026, 10, 4, 23, 59, 59, 999).toISOString(),
      page: 1,
      limit: 20,
    });
  });

  it('con las fechas invertidas avisa y no llama al back', async () => {
    renderHistory();
    await screen.findByText('Interés ganado');

    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-01' } });
    await screen.findByText('Interés ganado');
    getTransactionsMock.mockClear();
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-04' } });

    expect(screen.getByRole('alert')).toHaveTextContent('no puede ser posterior');
    expect(getTransactionsMock).not.toHaveBeenCalled();
  });

  it('distingue el historial vacío de un filtro sin resultados', async () => {
    getTransactionsMock.mockResolvedValue(makePage({ items: [], total: 0 }));
    const user = renderHistory();

    expect(await screen.findByText('Todavía no hay movimientos')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Moneda' }), 'USD');

    expect(await screen.findByText('No hay movimientos que coincidan')).toBeInTheDocument();
  });

  it('muestra el error y permite reintentar', async () => {
    getTransactionsMock.mockRejectedValueOnce(new TransactionError('CONNECTION'));
    const user = renderHistory();

    expect(await screen.findByText(/No pudimos conectar con el servidor/)).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Interés ganado')).toBeInTheDocument();
  });

  it('cierra la sesión si el back responde que venció', async () => {
    getTransactionsMock.mockRejectedValue(new TransactionError('UNAUTHORIZED'));
    renderHistory();

    await screen.findByText(/Tu sesión expiró/);

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
