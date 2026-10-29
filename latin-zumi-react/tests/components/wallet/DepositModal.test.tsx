import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DepositModal from '../../../src/components/wallet/DepositModal';
import { useWallet } from '../../../src/context/wallet';
import { TransactionError } from '../../../src/services/transactionService';

vi.mock('../../../src/context/wallet', () => ({ useWallet: vi.fn() }));

const deposit = vi.fn();

function renderModal() {
  const onClose = vi.fn();
  render(<DepositModal isOpen onClose={onClose} defaultCurrency="ARS" />);
  return { onClose, user: userEvent.setup() };
}

async function review(user: ReturnType<typeof userEvent.setup>, amount: string) {
  await user.type(screen.getByLabelText('Monto'), amount);
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
}

describe('DepositModal', () => {
  beforeEach(() => {
    deposit.mockReset();
    // El modal solo usa deposit del contexto de la billetera
    vi.mocked(useWallet).mockReturnValue({ deposit } as unknown as ReturnType<typeof useWallet>);
  });

  it('no avanza con un monto inválido', async () => {
    const { user } = renderModal();

    await review(user, '0');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ingresá un monto mayor a cero, con hasta dos decimales.',
    );
    expect(screen.getByRole('dialog', { name: 'Nuevo depósito' })).toBeInTheDocument();
  });

  it('pide confirmar, deposita el monto en el formato del backend y cierra', async () => {
    deposit.mockResolvedValue(undefined);
    const { user, onClose } = renderModal();

    await user.selectOptions(screen.getByLabelText('Moneda'), 'USD');
    await review(user, '1250,5');
    expect(screen.getByRole('dialog', { name: 'Confirmá el depósito' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmar depósito' }));

    expect(deposit).toHaveBeenCalledWith({ currency: 'USD', amount: '1250.50' }, expect.any(String));
    expect(onClose).toHaveBeenCalled();
  });

  it('"Volver" conserva lo cargado', async () => {
    const { user } = renderModal();

    await review(user, '100');
    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByLabelText('Monto')).toHaveValue('100');
  });

  it('si falla, muestra el error y reintenta con la misma Idempotency-Key', async () => {
    const error = new TransactionError('CONNECTION');
    deposit.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined);
    const { user, onClose } = renderModal();

    await review(user, '100');
    await user.click(screen.getByRole('button', { name: 'Confirmar depósito' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(error.message);
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirmar depósito' }));
    const [first, second] = deposit.mock.calls;
    expect(second[1]).toBe(first[1]);
    expect(onClose).toHaveBeenCalled();
  });
});
