import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState, ErrorState, LoadingState } from '../../../src/components/states';

describe('estados de carga, vacío y error', () => {
  it('LoadingState nombra el spinner con su mensaje y lo muestra', () => {
    render(<LoadingState message="Cargando saldos..." />);

    expect(screen.getByRole('status', { name: 'Cargando saldos...' })).toBeInTheDocument();
    expect(screen.getByText('Cargando saldos...')).toBeVisible();
  });

  it('EmptyState muestra el texto de su variante y la acción', async () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Sin movimientos"
        variant="no-transactions"
        actionLabel="Depositar"
        onAction={onAction}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Sin movimientos' })).toBeInTheDocument();
    expect(
      screen.getByText('Todavía no realizaste ninguna transacción en tu billetera.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Depositar' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('EmptyState sin onAction no muestra el botón', () => {
    render(<EmptyState title="Sin saldo" actionLabel="Depositar" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('ErrorState avisa el error y permite reintentar', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="sin conexión" onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Error en la billetera: sin conexión');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
