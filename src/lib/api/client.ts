// Axios-based JSON API client with typed helpers, interceptors, and error handling
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosHeaders } from 'axios';
import { getRefreshToken, setAuthTokens, clearAuth } from '@/lib/auth';

export class ApiError extends Error {
  status?: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status?: number, code?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const DEFAULT_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';

let authToken: string | null = null;
export function setAuthToken(token: string | null): void {
  authToken = token;
}

export const api: AxiosInstance = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
  withCredentials: false,
});

export function setBaseUrl(url: string): void {
  try {
    const parsed = new URL(url);
    // Ensure path contains /api/v1 if not provided
    if (!/\/api\/v\d+/.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/\/$/, '') + '/api/v1';
    }
    api.defaults.baseURL = parsed.toString().replace(/\/$/, '');
  } catch {
    // Fallback for relative values (e.g., '/api/v1')
    const normalized = url.endsWith('/api/v1') ? url : url.replace(/\/$/, '') + '/api/v1';
    api.defaults.baseURL = normalized;
  }
}

api.interceptors.request.use((config) => {
  const headers = config.headers instanceof AxiosHeaders
    ? config.headers
    : new AxiosHeaders(config.headers);
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  config.headers = headers;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (AxiosRequestConfig & { _retry?: boolean; _skipAuth?: boolean });
    const status = error.response?.status;
    const data: any = error.response?.data;

    // Attempt token refresh on 401 once
    if (status === 401 && !originalRequest?._retry && !originalRequest?._skipAuth) {
      originalRequest._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error('Missing refresh token');

        // Use a raw axios call to avoid recursion via interceptors
        const resp = await axios.post<{ token: string; refreshToken: string }>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { headers: { Accept: 'application/json' }, timeout: 15000 }
        );
        const newAccess = resp.data.token;
        const newRefresh = resp.data.refreshToken;
        setAuthToken(newAccess);
        setAuthTokens(newAccess, newRefresh);
        const retryHeaders = originalRequest.headers instanceof AxiosHeaders
          ? originalRequest.headers
          : new AxiosHeaders(originalRequest.headers);
        retryHeaders.set('Authorization', `Bearer ${newAccess}`);
        originalRequest.headers = retryHeaders;
        return api.request(originalRequest);
      } catch (refreshErr) {
        clearAuth();
        // bubble up original error after clearing auth
      }
    }

    const code = (data && data.code) || (error as any).code;
    const message = (data && data.message) || error.message || 'Request failed';

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[API ERROR]', { message, status, code, data });
    }

    throw new ApiError(message, status, code, data);
  }
);

export async function apiRequest<T>(path: string, config: AxiosRequestConfig = {}): Promise<T> {
  const response = await api.request<T>({ url: path, ...config });
  return response.data as T;
}

export async function apiGet<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>(path, { method: 'GET', ...(config || {}) });
}

export async function apiPost<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', data: body, ...(config || {}) });
}

export async function apiPut<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>(path, { method: 'PUT', data: body, ...(config || {}) });
}

export async function apiDelete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE', ...(config || {}) });
}

export async function apiPatch<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>(path, { method: 'PATCH', data: body, ...(config || {}) });
}


