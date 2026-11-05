import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadFeatures(env: Record<string, string>) {
  vi.resetModules();
  vi.stubEnv('VITE_USE_MOCK', 'false');
  vi.stubEnv('VITE_CHATBOT_ENABLED', 'false');
  vi.stubEnv('VITE_GOOGLE_AUTH_ENABLED', 'false');
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import('../../src/config/features');
}

describe('funciones que se prenden por variable', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('chat y Google quedan apagados por defecto', async () => {
    const features = await loadFeatures({});

    expect(features.CHATBOT_ENABLED).toBe(false);
    expect(features.GOOGLE_AUTH_ENABLED).toBe(false);
  });

  it('cada variable prende solo su función', async () => {
    const chat = await loadFeatures({ VITE_CHATBOT_ENABLED: 'true' });
    expect(chat.CHATBOT_ENABLED).toBe(true);
    expect(chat.GOOGLE_AUTH_ENABLED).toBe(false);

    const google = await loadFeatures({ VITE_GOOGLE_AUTH_ENABLED: 'true' });
    expect(google.CHATBOT_ENABLED).toBe(false);
    expect(google.GOOGLE_AUTH_ENABLED).toBe(true);
  });

  it('en modo mock el chat está disponible', async () => {
    const features = await loadFeatures({ VITE_USE_MOCK: 'true' });

    expect(features.CHATBOT_ENABLED).toBe(true);
  });
});
