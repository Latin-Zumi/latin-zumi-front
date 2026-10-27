export function sanitizeLoginEmail(value: string): string {
  return value.replace(/\s+/gu, '');
}
