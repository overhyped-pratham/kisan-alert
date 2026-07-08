/**
 * api.ts — thin HTTP client for the Flask backend.
 *
 * In development, Vite proxies /api and /voice to http://localhost:5000.
 * In production, the same-origin Flask app serves these paths directly.
 * We use relative paths so no CORS or cookie-origin issues.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',            // send Flask-Login session cookie
    headers: {
      ...(options.headers || {}),
      // Only set Content-Type for non-FormData requests
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { error?: string }).error ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json();
}

/** GET request */
export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

/** POST with JSON body */
export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

/** POST with multipart FormData (file uploads) */
export function upload<T>(path: string, formData: FormData): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: formData,
  });
}
