import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import ThemeToggle from '../../../src/components/common/ThemeToggle';

describe('ThemeToggle', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('arranca con el tema que ya aplicó index.html', () => {
    document.documentElement.dataset.theme = 'dark';
    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: 'Activar modo claro' })).toBeInTheDocument();
  });

  it('cambia el tema, lo guarda y actualiza la etiqueta', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Activar modo oscuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('latin-zumi:theme')).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Activar modo claro' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('latin-zumi:theme')).toBe('light');
  });
});
