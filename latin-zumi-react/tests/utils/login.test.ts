import { describe, expect, it } from 'vitest';
import { sanitizeLoginEmail } from '../../src/utils/login';

describe('sanitizeLoginEmail', () => {
  it('saca todos los espacios, también los del medio', () => {
    expect(sanitizeLoginEmail(' valentina @latinzumi.test ')).toBe('valentina@latinzumi.test');
  });
});
