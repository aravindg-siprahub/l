/**
 * Auth API client utilities.
 * Handles login, register, logout, refresh, and me.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
}

export interface UserOut {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

async function apiFetch<T>(path: string, options: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function apiRegister(
  full_name: string,
  email: string,
  password: string,
  role = 'candidate',
): Promise<UserOut> {
  return apiFetch<UserOut>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ full_name, email, password, role }),
  });
}

export async function apiRefresh(refresh_token: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
}

export async function apiLogout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ refresh_token: '' }),
  });
}

export async function apiMe(access_token: string): Promise<UserOut> {
  return apiFetch<UserOut>('/auth/me', {
    method: 'GET',
    credentials: 'include',
  });
}
