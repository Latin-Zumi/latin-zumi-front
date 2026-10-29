import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Modal from '../../../src/components/ui/Modal';

function renderModal(props: Partial<ComponentProps<typeof Modal>> = {}) {
  const onClose = vi.fn();
  render(
    <Modal isOpen onClose={onClose} title="Nuevo depósito" {...props}>
      <p>Contenido</p>
    </Modal>,
  );
  return { onClose, user: userEvent.setup() };
}

const backdrop = () => document.querySelector<HTMLElement>('.dialog-backdrop')!;

describe('Modal', () => {
  it('cerrado no muestra nada', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abierto se nombra con el título, toma el foco y bloquea el scroll', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Nuevo depósito' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('se cierra con Escape, con la X y con el botón por defecto', async () => {
    const { onClose, user } = renderModal();

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Cerrar diálogo' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('se cierra al tocar el fondo, pero no al tocar adentro', async () => {
    const { onClose, user } = renderModal();

    await user.click(screen.getByText('Contenido'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(backdrop());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('puede no cerrarse con Escape ni con el fondo', async () => {
    const { onClose, user } = renderModal({ closeOnEscape: false, closeOnBackdrop: false });

    await user.keyboard('{Escape}');
    await user.click(backdrop());

    expect(onClose).not.toHaveBeenCalled();
  });

  it('al cerrarse devuelve el foco al botón que lo abrió y libera el scroll', async () => {
    const user = userEvent.setup();
    const page = (isOpen: boolean) => (
      <>
        <button type="button">Depositar</button>
        <Modal isOpen={isOpen} onClose={() => {}} title="Nuevo depósito">
          Contenido
        </Modal>
      </>
    );
    const { rerender } = render(page(false));
    await user.click(screen.getByRole('button', { name: 'Depositar' }));

    rerender(page(true));
    rerender(page(false));

    expect(screen.getByRole('button', { name: 'Depositar' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
});
