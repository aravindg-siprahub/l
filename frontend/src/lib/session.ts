/**
 * Token storage utilities using localStorage.
 * The access token is stored as 'access_token'.
 * The refresh token is stored as 'refresh_token'.
 */

export const TOKEN_KEY = 'access_token';
export const REFRESH_KEY = 'refresh_token';

export function saveTokens(): void {
  // Tokens are managed via HttpOnly cookies by the backend.
  // This function is kept for backward compatibility if needed.
}

export function getAccessToken(): string | null {
  return null;
}

export function getRefreshToken(): string | null {
  return null;
}

export function clearTokens(): void {
  // Cookies are cleared via apiLogout endpoint.
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return Date.now() / 1000 > payload.exp;
}
