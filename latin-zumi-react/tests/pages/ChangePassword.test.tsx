import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChangePassword from '../../src/pages/ChangePassword';
import { AuthProvider } from '../../src/context/auth';
import { AuthError, changePassword, getSession } from '../../src/services/authService';
import { storeSession, TEST_SESSION } from '../helpers/api';

// Solo se reemplaza changePassword; las clases de error y la sesión son las reales
vi.mock('../../src/services/authService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/authService')>()),
  changePassword: vi.fn(),
}));

const changePasswordMock = vi.mocked(changePassword);

function renderPage() {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/cambiar-contrasena']}>
        <Routes>
          <Route path="/cambiar-contrasena" element={<ChangePassword />} />
          <Route path="/dashboard" element={<p>Pantalla del dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
  return userEvent.setup();
}

async function fill(user: ReturnType<typeof userEvent.setup>, confirmation = 'Nueva-clave1') {
  await user.type(screen.getByLabelText('Contraseña actual'), 'vieja');
  await user.type(screen.getByLabelText('Contraseña nueva'), 'Nueva-clave1');
  await user.type(screen.getByLabelText('Repetí la contraseña nueva'), confirmation);
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
}

describe('ChangePassword', () => {
  beforeEach(() => {
    changePasswordMock.mockReset();
    storeSession({ ...TEST_SESSION, password_change_required: true });
  });

  it('no llama al back si la confirmación no coincide', async () => {
    const user = renderPage();

    await fill(user, 'Otra-clave1');

    expect(changePasswordMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Repetí la contraseña nueva')).toHaveAccessibleDescription(
      'Las contraseñas no coinciden',
    );
  });

  it('cambia la contraseña, deja de pedirla y entra a la billetera', async () => {
    changePasswordMock.mockResolvedValue(undefined);
    const user = renderPage();

    expect(screen.getByText(/formato anterior/)).toBeInTheDocument();
    await fill(user);

    expect(changePasswordMock).toHaveBeenCalledWith('vieja', 'Nueva-clave1');
    expect(await screen.findByText('Pantalla del dashboard')).toBeInTheDocument();
    expect(getSession()?.password_change_required).toBeUndefined();
  });

  it('muestra el error del back sin cerrar la sesión', async () => {
    changePasswordMock.mockRejectedValue(new AuthError('La contraseña actual es incorrecta.'));
    const user = renderPage();

    await fill(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual es incorrecta.');
    expect(getSession()).not.toBeNull();
  });
});
