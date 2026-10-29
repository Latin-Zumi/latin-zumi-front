import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Button from '../../../src/components/ui/Button';

describe('Button', () => {
  it('llama a onClick al hacer clic', async () => {
    const onClick = vi.fn();
    render(<Button variant="solid" onClick={onClick}>Depositar</Button>);

    await userEvent.click(screen.getByRole('button', { name: 'Depositar' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('se deshabilita y avisa mientras carga', () => {
    render(<Button variant="solid" loading>Confirmar</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Cargando…');
  });

  it('usa el estilo con borde para las acciones secundarias', () => {
    render(<Button variant="solid" outline>Cancelar</Button>);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveClass('btn-outline');
  });
});
