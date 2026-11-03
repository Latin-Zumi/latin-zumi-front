const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export class ApiConnectionError extends Error {}

export async function apiRequest(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiConnectionError();
    }
    throw error;
  }
}

// Los errores del backend traen { code, message }; algunos, como el 429, no traen code
export async function readErrorCode(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { code?: unknown };
    return typeof body.code === 'string' ? body.code : undefined;
  } catch {
    return undefined; // el body no es JSON
  }
}

export function postJson(path: string, body: unknown): Promise<Response> {
  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
