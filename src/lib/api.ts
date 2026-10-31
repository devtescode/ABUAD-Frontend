/**
 * Central API client.
 *
 * Every network request in the app goes through this module so that:
 *  - authentication headers are attached consistently,
 *  - errors are normalised into `ApiError`,
 *  - expired sessions notify the app shell exactly once,
 *  - React Query can cancel in-flight requests with an AbortSignal.
 */

export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

export const USER_TOKEN_KEY = 'servicely_token';
export const ADMIN_TOKEN_KEY = 'servicely_admin_token';
export const USER_KEY = 'servicely_user';
export const ADMIN_KEY = 'servicely_admin';

export type AuthMode = 'user' | 'admin' | 'none' | 'optional';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function hasUserToken(): boolean {
  return Boolean(sessionStorage.getItem(USER_TOKEN_KEY));
}

export function hasAdminToken(): boolean {
  return Boolean(sessionStorage.getItem(ADMIN_TOKEN_KEY));
}

export function getStoredToken(mode: AuthMode): string | null {
  if (mode === 'admin') return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (mode === 'user') return sessionStorage.getItem(USER_TOKEN_KEY);
  if (mode === 'optional') return sessionStorage.getItem(USER_TOKEN_KEY);
  return null;
}

/** Notify the app shell that a session is no longer valid. */
function notifyUnauthorized(mode: AuthMode) {
  if (typeof window === 'undefined') return;

  if (mode === 'admin') {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
  }

  if (mode === 'user' || mode === 'optional') {
    sessionStorage.removeItem(USER_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  window.dispatchEvent(
    new CustomEvent('servicely:unauthorized', {
      detail: { mode },
    })
  );
}

export function buildQuery(
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return '';

  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: AuthMode;
  headers?: HeadersInit;
  signal?: AbortSignal;
  /** Skip the automatic JSON content-type header (for FormData bodies). */
  rawBody?: boolean;
}

/**
 * Low-level request helper. Returns the parsed JSON body (or `undefined`
 * for empty responses) and throws `ApiError` for non-2xx responses.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    auth = 'user',
    headers,
    signal,
    rawBody = false,
  } = options;

  const token = getStoredToken(auth);
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    if (!rawBody) {
      requestHeaders.set('Content-Type', 'application/json');
    }
    payload = JSON.stringify(body);
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: payload,
      signal,
      cache: 'no-store',
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;

    throw new ApiError(
      'Unable to reach the server. Please check your connection and try again.',
      0,
      error
    );
  }

  const text = await response.text();
  let data: unknown = undefined;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (data as { message?: string; error?: string } | null)?.message ||
      (data as { message?: string; error?: string } | null)?.error ||
      `Request failed with status ${response.status}.`;

    if (response.status === 401) {
      notifyUnauthorized(auth);
    }

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export function apiGet<T = unknown>(
  path: string,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET' });
}

export function apiSend<T = unknown>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
  options: Omit<ApiRequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  return apiRequest<T>(path, { ...options, method, body });
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
