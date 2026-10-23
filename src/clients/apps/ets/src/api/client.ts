import { accessToken, signIn } from '@/auth/oidc';

/** Typed error so views can distinguish 401/403/409 from generic failures. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  const token = await accessToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit = { method, headers };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const response = await fetch(path, init);
  if (response.status === 204) return null;

  const text = await response.text();
  let parsed: unknown = undefined;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    // The session expired and silent renewal could not recover it.
    if (response.status === 401) void signIn();
    throw new ApiError(response.status, `${response.status} ${response.statusText}`, parsed);
  }
  return parsed as T;
}

export const apiGet = <T>(path: string) => request<T>('GET', path) as Promise<T>;
export const apiPost = <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}) as Promise<T>;
export const apiPut = <T>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {}) as Promise<T | null>;
export const apiPatch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}) as Promise<T>;
export const apiDelete = (path: string) => request<void>('DELETE', path) as Promise<null>;
