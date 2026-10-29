// Se ejecuta antes de cada archivo de test
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  // Desmonta lo que renderizó cada test y borra la sesión y los datos mock guardados
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});
