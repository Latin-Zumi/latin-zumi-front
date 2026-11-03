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
      [403, 'Tu cuenta está bloqueada. Escribinos para reactivarla.'],
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

    it('guarda si el back pide cambiar la contraseña', async () => {
      mockFetch(jsonResponse(200, { ...TEST_SESSION, password_change_required: true }));

      await auth.login(CREDENTIALS);

      expect(auth.getSession()?.password_change_required).toBe(true);
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

  describe('recuperar contraseña', () => {
    it('pide el email de recuperación', async () => {
      const fetchMock = mockFetch(jsonResponse(202, { message: 'ok' }));

      await auth.forgotPassword('valentina@latinzumi.test');

      const call = fetchCall(fetchMock);
      expect(call.url).toBe(`${API_URL}/auth/forgot-password`);
      expect(call.body).toEqual({ email: 'valentina@latinzumi.test' });
    });

    it('restablece con el token del enlace', async () => {
      const fetchMock = mockFetch(jsonResponse(204));

      await auth.resetPassword('token-del-email', 'Nueva-clave1');

      const call = fetchCall(fetchMock);
      expect(call.url).toBe(`${API_URL}/auth/reset-password`);
      expect(call.body).toEqual({ token: 'token-del-email', password: 'Nueva-clave1' });
    });

    it('distingue el enlace vencido de una contraseña inválida', async () => {
      mockFetch(jsonResponse(400, { code: 'INVALID_RESET_TOKEN' }));
      const expired = await auth.resetPassword('t', 'Nueva-clave1').catch((error: unknown) => error);
      expect(expired).toBeInstanceOf(auth.ResetTokenError);

      mockFetch(jsonResponse(400, { message: 'La contraseña debe tener al menos 8 caracteres' }));
      const invalid = await auth.resetPassword('t', 'corta').catch((error: unknown) => error);
      expect(invalid).not.toBeInstanceOf(auth.ResetTokenError);
      expect((invalid as Error).message).toBe('La contraseña no cumple los requisitos necesarios.');
    });
  });

  describe('cambiar contraseña', () => {
    beforeEach(() => storeSession());

    it('manda la contraseña actual y la nueva con el token', async () => {
      const fetchMock = mockFetch(jsonResponse(204));

      await auth.changePassword('Actual-1', 'Nueva-clave1');

      const call = fetchCall(fetchMock);
      expect(call.url).toBe(`${API_URL}/auth/change-password`);
      expect(call.headers.get('Authorization')).toBe(`Bearer ${TEST_SESSION.token}`);
      expect(call.body).toEqual({ current_password: 'Actual-1', new_password: 'Nueva-clave1' });
    });

    it('un 401 con código es la contraseña actual; sin código, la sesión vencida', async () => {
      mockFetch(jsonResponse(401, { code: 'INVALID_CURRENT_PASSWORD' }));
      const wrong = await auth.changePassword('mal', 'Nueva-clave1').catch((error: unknown) => error);
      expect(wrong).not.toBeInstanceOf(auth.SessionExpiredError);
      expect((wrong as Error).message).toBe('La contraseña actual es incorrecta.');

      mockFetch(jsonResponse(401, { message: 'Autenticación requerida' }));
      const expired = await auth.changePassword('Actual-1', 'Nueva-clave1').catch((error: unknown) => error);
      expect(expired).toBeInstanceOf(auth.SessionExpiredError);
    });

    it.each([
      ['PASSWORD_UNCHANGED', 400, 'La nueva contraseña tiene que ser distinta de la actual.'],
      ['PASSWORD_NOT_SET', 409, 'Tu cuenta entra con Google y no tiene contraseña.'],
    ])('con %s muestra su mensaje', async (code, status, message) => {
      mockFetch(jsonResponse(status, { code }));

      await expect(auth.changePassword('Actual-1', 'Nueva-clave1')).rejects.toThrow(message);
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

  it('cambia la contraseña del usuario de prueba', async () => {
    storeSession();
    const change = auth.changePassword(CREDENTIALS.password, 'Otra-clave1');
    await vi.advanceTimersByTimeAsync(400);
    await change;

    const login = expect(auth.login(CREDENTIALS)).rejects.toThrow('Email o contraseña incorrectos.');
    await vi.advanceTimersByTimeAsync(400);
    await login;
  });

  it('rechaza una contraseña incorrecta', async () => {
    const login = expect(auth.login({ ...CREDENTIALS, password: 'otra' })).rejects.toThrow(
      'Email o contraseña incorrectos.',
    );
    await vi.advanceTimersByTimeAsync(400);
    await login;
  });
});
