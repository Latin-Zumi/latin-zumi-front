import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { AuthProvider } from '../../src/context/auth';
import { storeSession } from '../helpers/api';

function renderAt(path: string) {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>Pantalla de login</p>} />
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
});
