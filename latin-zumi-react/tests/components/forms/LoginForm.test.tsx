import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginForm from '../../../src/components/forms/LoginForm';
import { AuthError, login } from '../../../src/services/authService';
import { TEST_SESSION } from '../../helpers/api';

// Solo se reemplaza login; AuthError sigue siendo la clase real
vi.mock('../../../src/services/authService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/authService')>()),
  login: vi.fn(),
}));

const loginMock = vi.mocked(login);

function renderForm() {
  const onSuccess = vi.fn();
  render(
    <MemoryRouter>
      <LoginForm onSuccess={onSuccess} />
    </MemoryRouter>,
  );
  return { onSuccess, user: userEvent.setup() };
}

describe('LoginForm', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('vacío no llama al backend: marca los errores y lleva el foco al primero', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(loginMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Ingresá tu email');
    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription('Ingresá tu contraseña');
  });

  it('el error del email aparece recién al salir del campo', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText('Email'), 'valentina@');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false');

    await user.tab();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Ingresá un email válido');
  });

  it('saca los espacios del email, inicia sesión y avisa', async () => {
    loginMock.mockResolvedValue(TEST_SESSION);
    const { user, onSuccess } = renderForm();

    await user.type(screen.getByLabelText('Email'), ' valentina@latinzumi.test ');
    await user.type(screen.getByLabelText('Contraseña'), 'LatinZumi1!');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(loginMock).toHaveBeenCalledWith({
      email: 'valentina@latinzumi.test',
      password: 'LatinZumi1!',
    });
    expect(onSuccess).toHaveBeenCalledWith(TEST_SESSION);
  });

  it('muestra el error del backend y lo borra al volver a escribir', async () => {
    loginMock.mockRejectedValue(new AuthError('Email o contraseña incorrectos.'));
    const { user } = renderForm();

    await user.type(screen.getByLabelText('Email'), 'valentina@latinzumi.test');
    await user.type(screen.getByLabelText('Contraseña'), 'otra');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.');

    await user.type(screen.getByLabelText('Contraseña'), 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('un error inesperado muestra un mensaje genérico', async () => {
    loginMock.mockRejectedValue(new Error('boom'));
    const { user } = renderForm();

    await user.type(screen.getByLabelText('Email'), 'valentina@latinzumi.test');
    await user.type(screen.getByLabelText('Contraseña'), 'LatinZumi1!');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ocurrió un error inesperado. Probá de nuevo.',
    );
  });
});
