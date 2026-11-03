import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { AuthProvider } from '../../src/context/auth';
import { storeSession, TEST_SESSION } from '../helpers/api';

function renderAt(path: string) {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>Pantalla de login</p>} />
          <Route path="/cambiar-contrasena" element={<p>Pantalla de cambio de contraseña</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<p>Pantalla del dashboard</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('ProtectedRoute', () => {
  it('sin sesión manda al login', () => {
    renderAt('/dashboard');

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('Pantalla del dashboard')).not.toBeInTheDocument();
  });

  it('con sesión muestra la página', () => {
    storeSession();
    renderAt('/dashboard');

    expect(screen.getByText('Pantalla del dashboard')).toBeInTheDocument();
  });

  it('si el back pide cambiar la contraseña, manda a cambiarla', () => {
    storeSession({ ...TEST_SESSION, password_change_required: true });
    renderAt('/dashboard');

    expect(screen.getByText('Pantalla de cambio de contraseña')).toBeInTheDocument();
    expect(screen.queryByText('Pantalla del dashboard')).not.toBeInTheDocument();
  });
});
