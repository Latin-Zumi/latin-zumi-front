import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminSettings from '../../../src/pages/admin/AdminSettings';
import { getSettings, getSettingsHistory, updateSettings } from '../../../src/services/adminService';
import type { AdminSettings as AdminSettingsData } from '../../../src/types/admin';

vi.mock('../../../src/services/adminService', () => ({
  getSettings: vi.fn(),
  getSettingsHistory: vi.fn(),
  updateSettings: vi.fn(),
}));

const originalSettings: AdminSettingsData = {
  exchange_spread_percent: '1.50',
  interest_rates: [
    { currency: 'ARS', annual_percent: '0.00' },
    { currency: 'COP', annual_percent: '1.00' },
    { currency: 'USD', annual_percent: '2.00' },
    { currency: 'EUR', annual_percent: '3.00' },
  ],
  updated_at: null,
  updated_by: null,
};

const getSettingsMock = vi.mocked(getSettings);
const getSettingsHistoryMock = vi.mocked(getSettingsHistory);
const updateSettingsMock = vi.mocked(updateSettings);

function renderPage() {
  render(<AdminSettings />);
  return userEvent.setup();
}

describe('AdminSettings', () => {
  beforeEach(() => {
    getSettingsMock.mockReset().mockResolvedValue(structuredClone(originalSettings));
    getSettingsHistoryMock.mockReset().mockResolvedValue({ items: [], page: 1, total: 0 });
    updateSettingsMock.mockReset();
  });

  it('no envía una petición cuando no hay cambios', async () => {
    const user = renderPage();
    await screen.findByLabelText('Comisión (%)');

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('status')).toHaveTextContent('No hay cambios para guardar');
    expect(updateSettingsMock).not.toHaveBeenCalled();
  });

  it('envía solo el campo modificado y actualiza la referencia tras el éxito', async () => {
    updateSettingsMock.mockResolvedValue({
      ...structuredClone(originalSettings),
      exchange_spread_percent: '2.00',
    });
    const user = renderPage();
    const spread = await screen.findByLabelText('Comisión (%)');

    await user.clear(spread);
    await user.type(spread, '2');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(updateSettingsMock).toHaveBeenCalledWith({ exchange_spread_percent: '2.00' });
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Guardamos los parámetros.');
    expect(spread).toHaveValue('2,00');

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('status')).toHaveTextContent('No hay cambios para guardar');
    expect(updateSettingsMock).toHaveBeenCalledTimes(1);
  });

  it('trata formatos numéricos equivalentes como sin cambios', async () => {
    getSettingsMock.mockResolvedValue({
      ...structuredClone(originalSettings),
      exchange_spread_percent: '1.5',
    });
    const user = renderPage();
    const spread = await screen.findByLabelText('Comisión (%)');

    fireEvent.change(spread, { target: { value: '1,5' } });
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('No hay cambios para guardar')).toBeInTheDocument();
    expect(updateSettingsMock).not.toHaveBeenCalled();
  });

  it('envía solamente la tasa de interés modificada', async () => {
    updateSettingsMock.mockResolvedValue({
      ...structuredClone(originalSettings),
      interest_rates: originalSettings.interest_rates.map((rate) =>
        rate.currency === 'USD' ? { ...rate, annual_percent: '4.00' } : rate,
      ),
    });
    const user = renderPage();
    const usdRate = await screen.findByLabelText('Dólar estadounidense (%)');

    await user.clear(usdRate);
    await user.type(usdRate, '4');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(updateSettingsMock).toHaveBeenCalledWith({
        interest_rates: [{ currency: 'USD', annual_percent: '4.00' }],
      });
    });
  });

  it('conserva los cambios si falla el guardado', async () => {
    updateSettingsMock.mockRejectedValue(new Error('No pudimos conectar.'));
    const user = renderPage();
    const spread = await screen.findByLabelText('Comisión (%)');

    await user.clear(spread);
    await user.type(spread, '2');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar.');
    expect(spread).toHaveValue('2');
  });

  it('muestra el estado de guardado y evita envíos simultáneos', async () => {
    let resolveUpdate: (settings: AdminSettingsData) => void = () => undefined;
    updateSettingsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    const user = renderPage();
    const spread = await screen.findByLabelText('Comisión (%)');

    await user.clear(spread);
    await user.type(spread, '2');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Guardando parámetros…')).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: /Cargando/ });
    expect(saveButton).toBeDisabled();
    resolveUpdate({ ...structuredClone(originalSettings), exchange_spread_percent: '2.00' });
  });
});
