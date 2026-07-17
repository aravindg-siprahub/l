import { clearTokens } from './session';
import { apiRefresh } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  let response = await fetch(`${API_BASE}${path}`, { 
    ...options, 
    headers,
    credentials: 'include' 
  });

  if (response.status === 401) {
    try {
      await apiRefresh('');
      response = await fetch(`${API_BASE}${path}`, { 
        ...options, 
        headers,
        credentials: 'include' 
      });
    } catch {
      clearTokens();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'API error occurred.' }));
    throw new Error(errorBody.detail || 'API request failed');
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => fetchWithAuth(path, { method: 'GET' }) as Promise<T>,
  post: <T, D>(path: string, data: D) => fetchWithAuth(path, { method: 'POST', body: JSON.stringify(data) }) as Promise<T>,
  put: <T, D>(path: string, data: D) => fetchWithAuth(path, { method: 'PUT', body: JSON.stringify(data) }) as Promise<T>,
  delete: <T>(path: string) => fetchWithAuth(path, { method: 'DELETE' }) as Promise<T>,
};
