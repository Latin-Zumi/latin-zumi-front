import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_URL,
  fetchCall,
  jsonResponse,
  loadWithEnv,
  mockFetch,
  mockFetchNetworkError,
  storeSession,
  TEST_SESSION,
} from '../helpers/api';

type AuthService = typeof import('../../src/services/authService');
const load = (useMock: boolean) =>
  loadWithEnv(useMock, () => import('../../src/services/authService'));

const CREDENTIALS = { email: 'valentina@latinzumi.test', password: 'LatinZumi1!' };

describe('authService con la API real', () => {
  let auth: AuthService;

  beforeEach(async () => {
    auth = await load(false);
  });

  describe('login', () => {
    it('manda el email en "identifier" y guarda la sesión', async () => {
      const fetchMock = mockFetch(jsonResponse(200, TEST_SESSION));

      const session = await auth.login(CREDENTIALS);

      const call = fetchCall(fetchMock);
      expect(call.url).toBe(`${API_URL}/auth/login`);
      expect(call.method).toBe('POST');
      expect(call.body).toEqual({ identifier: CREDENTIALS.email, password: CREDENTIALS.password });
      expect(session).toEqual(TEST_SESSION);
      expect(auth.getSession()).toEqual(TEST_SESSION);
    });

    it.each([
      [400, 'Revisá los datos ingresados.'],
      [401, 'Email o contraseña incorrectos.'],
      [429, 'Demasiados intentos. Esperá unos minutos.'],
      [500, 'No pudimos conectar con el servidor. Probá de nuevo.'],
      [418, 'No pudimos iniciar sesión. Probá de nuevo.'],
    ])('con status %i muestra "%s"', async (status, message) => {
      // El 429 del backend manda { error }: el mensaje sale del status, no del body
      mockFetch(jsonResponse(status, { error: 'Too many requests' }));

      await expect(auth.login(CREDENTIALS)).rejects.toThrow(message);
      expect(auth.getSession()).toBeNull();
    });

    it('avisa si no hay conexión', async () => {
      mockFetchNetworkError();

      await expect(auth.login(CREDENTIALS)).rejects.toThrow(
        'No pudimos conectar con el servidor. Probá de nuevo.',
      );
    });

    it('no guarda una respuesta que no tiene la forma de una sesión', async () => {
      mockFetch(jsonResponse(200, { token: 'abc', user: { id: 7, roles: ['user'] } }));

      await expect(auth.login(CREDENTIALS)).rejects.toThrow('Respuesta inválida del servidor.');
      expect(auth.getSession()).toBeNull();
    });
  });

  describe('register', () => {
    const DATA = { ...CREDENTIALS, nombre: 'Valentina', pais: 'Argentina' };

    it('manda los datos del registro y guarda la sesión', async () => {
      const fetchMock = mockFetch(jsonResponse(201, TEST_SESSION));

      await auth.register(DATA);

      const call = fetchCall(fetchMock);
      expect(call.url).toBe(`${API_URL}/auth/register`);
      expect(call.body).toEqual(DATA);
      expect(auth.getSession()?.token).toBe(TEST_SESSION.token);
    });

    it('avisa si el email ya tiene cuenta', async () => {
      mockFetch(jsonResponse(409, { message: 'Conflict' }));

      await expect(auth.register(DATA)).rejects.toThrow('Ya existe una cuenta con ese email.');
    });
  });

  describe('getSession', () => {
    it('descarta sesiones guardadas que no vienen del backend', () => {
      localStorage.setItem('latin-zumi:session', JSON.stringify({ token: 'abc', user: {} }));
      expect(auth.getSession()).toBeNull();

      localStorage.setItem('latin-zumi:session', '{no es json');
      expect(auth.getSession()).toBeNull();
    });
  });

  describe('logout', () => {
    it('revoca el token en el backend y borra la sesión', async () => {
      storeSession();
      const fetchMock = mockFetch(jsonResponse(204));

      await auth.logout();

      const call = fetchCall(fetchMock);
      expect(call.url).toBe(`${API_URL}/auth/logout`);
      expect(call.method).toBe('POST');
      expect(call.headers.get('Authorization')).toBe(`Bearer ${TEST_SESSION.token}`);
      expect(auth.getSession()).toBeNull();
    });

    it('borra la sesión aunque falle la red', async () => {
      storeSession();
      mockFetchNetworkError();

      await expect(auth.logout()).resolves.toBeUndefined();
      expect(auth.getSession()).toBeNull();
    });
  });

  describe('isProfileComplete', () => {
    it('pide país y nombre', () => {
      expect(auth.isProfileComplete(TEST_SESSION.user)).toBe(true);
      expect(auth.isProfileComplete({ ...TEST_SESSION.user, pais: null })).toBe(false);
      expect(auth.isProfileComplete({ ...TEST_SESSION.user, nombre: '  ' })).toBe(false);
    });
  });
});

describe('authService en modo mock', () => {
  let auth: AuthService;

  beforeEach(async () => {
    auth = await load(true);
    // El mock espera 400 ms para simular la API; con timers falsos el test no espera de verdad
    vi.useFakeTimers();
  });

  it('inicia sesión con un usuario de prueba sin llamar al backend', async () => {
    const fetchMock = mockFetch();

    const login = auth.login(CREDENTIALS);
    await vi.advanceTimersByTimeAsync(400);
    const session = await login;

    expect(session.user.nombre).toBe('Valentina');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rechaza una contraseña incorrecta', async () => {
    const login = expect(auth.login({ ...CREDENTIALS, password: 'otra' })).rejects.toThrow(
      'Email o contraseña incorrectos.',
    );
    await vi.advanceTimersByTimeAsync(400);
    await login;
  });
});
