import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AdminRoute from '../../src/components/AdminRoute';
import { AuthProvider } from '../../src/context/auth';
import { storeSession, TEST_SESSION } from '../helpers/api';

function renderAdmin() {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<p>Pantalla de login</p>} />
          <Route path="/dashboard" element={<p>Pantalla del dashboard</p>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<p>Panel de admin</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('AdminRoute', () => {
  it('sin sesión manda al login', () => {
    renderAdmin();

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('un usuario sin rol admin vuelve a su billetera', () => {
    storeSession();
    renderAdmin();

    expect(screen.getByText('Pantalla del dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Panel de admin')).not.toBeInTheDocument();
  });

  it('un admin ve el panel', () => {
    storeSession({ ...TEST_SESSION, user: { ...TEST_SESSION.user, roles: ['user', 'admin'] } });
    renderAdmin();

    expect(screen.getByText('Panel de admin')).toBeInTheDocument();
  });
});
