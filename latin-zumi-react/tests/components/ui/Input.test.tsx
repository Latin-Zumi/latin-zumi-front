import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Input from '../../../src/components/ui/Input';

describe('Input', () => {
  it('asocia la etiqueta con el campo', () => {
    render(<Input label="Email" type="email" />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  it('marca el campo como inválido y lo describe con el error', () => {
    render(<Input label="Email" error="Ingresá un email válido" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Ingresá un email válido');
  });

  it('suma el error y el aviso a la descripción que ya traía', () => {
    render(
      <>
        <span id="ayuda">Disponible: $ 100</span>
        <Input
          label="Monto"
          aria-describedby="ayuda"
          error="Saldo insuficiente"
          notice="Se acredita al instante"
        />
      </>,
    );

    expect(screen.getByLabelText('Monto')).toHaveAccessibleDescription(
      'Disponible: $ 100 Saldo insuficiente Se acredita al instante',
    );
  });

  it('sin error no queda marcado como inválido', () => {
    render(<Input label="Nombre" />);

    const input = screen.getByLabelText('Nombre');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});
