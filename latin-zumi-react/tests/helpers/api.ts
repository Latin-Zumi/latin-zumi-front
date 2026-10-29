import { vi } from 'vitest';
import type { Session } from '../../src/services/authService';

export const API_URL = 'http://api.test';

// Los servicios leen VITE_USE_MOCK y VITE_API_URL al cargarse. Para que el .env local no
// cambie los resultados, se fijan las variables y se vuelve a importar el módulo de cero.
export async function loadWithEnv<T>(useMock: boolean, load: () => Promise<T>): Promise<T> {
  vi.resetModules();
  vi.stubEnv('VITE_USE_MOCK', useMock ? 'true' : 'false');
  vi.stubEnv('VITE_API_URL', API_URL);
  return load();
}

export function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Reemplaza fetch: cada llamada devuelve la respuesta indicada y queda registrada
export function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn<typeof fetch>();
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// Así falla fetch cuando no hay conexión
export function mockFetchNetworkError() {
  const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const TEST_SESSION: Session = {
  token: 'token-de-prueba',
  user: {
    id: 'mock-user-1',
    nombre: 'Valentina',
    email: 'valentina@latinzumi.test',
    pais: 'Argentina',
    moneda_preferida: 'ARS',
    roles: ['user'],
    estado: 'activo',
  },
};

export function storeSession(session: Session = TEST_SESSION) {
  localStorage.setItem('latin-zumi:session', JSON.stringify(session));
}

// Lee qué se mandó en la llamada número `index` a fetch
export function fetchCall(fetchMock: ReturnType<typeof mockFetch>, index = 0) {
  const [url, init = {}] = fetchMock.mock.calls[index];
  return {
    url: String(url),
    method: init.method ?? 'GET',
    headers: new Headers(init.headers),
    body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
  };
}
