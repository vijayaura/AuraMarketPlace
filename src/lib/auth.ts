const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'authUser';

export function setAuthTokens(token: string, refreshToken?: string | null): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    if (refreshToken !== undefined) {
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      else localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {}
}

export function setAuthUser(user: unknown): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}


