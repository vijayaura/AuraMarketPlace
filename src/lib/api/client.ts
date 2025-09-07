// Axios-based JSON API client with typed helpers, interceptors, and error handling
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosHeaders } from 'axios';
import { toast } from '@/components/ui/sonner';
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
  headers: { 
    Accept: 'application/json'
  },
  withCredentials: false,
});

// Log the initial base URL
console.log('🔧 Initial API base URL:', DEFAULT_BASE_URL);

export function setBaseUrl(url: string): void {
  try {
    const parsed = new URL(url);
    // Ensure path contains /api/v1 if not provided
    if (!/\/api\/v\d+/.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/\/$/, '') + '/api/v1';
    }
    const finalUrl = parsed.toString().replace(/\/$/, '');
    api.defaults.baseURL = finalUrl;
    console.log('✅ API base URL set to:', finalUrl);
  } catch {
    // Fallback for relative values (e.g., '/api/v1')
    const normalized = url.endsWith('/api/v1') ? url : url.replace(/\/$/, '') + '/api/v1';
    api.defaults.baseURL = normalized;
    console.log('✅ API base URL set to (fallback):', normalized);
  }
}

api.interceptors.request.use((config) => {
  const headers = config.headers instanceof AxiosHeaders
    ? config.headers
    : new AxiosHeaders(config.headers);
  
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  // For all GET requests, disable caches and add a cache-busting param to ensure fresh data
  if (String(config.method).toLowerCase() === 'get') {
    headers.set('Cache-Control', 'no-cache');
    headers.set('Pragma', 'no-cache');
    const params = new URLSearchParams((config.params as any) || {});
    if (!params.has('_ts')) params.set('_ts', String(Date.now()));
    config.params = params;
  }
  config.headers = headers;
  
  // Log all outgoing API requests for debugging
  const fullUrl = `${config.baseURL || api.defaults.baseURL}${config.url}`;
  console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    type InternalAxiosConfig = AxiosRequestConfig & {
      _retry?: boolean;
      _skipAuth?: boolean;
      _suppressGlobalErrorToast?: boolean;
    };

    const originalRequest = error.config as InternalAxiosConfig;
    const status = error.response?.status;
    const data: any = error.response?.data;

    // Attempt token refresh on 401 once
    if (status === 401 && !originalRequest?._retry && !originalRequest?._skipAuth) {
      originalRequest._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error('Missing refresh token');

        // Use a raw axios call to avoid recursion via interceptors
        const resp = await axios.post<{ accessToken: string }>(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken },
          { 
            headers: { 
              Accept: 'application/json'
            }, 
            timeout: 15000 
          }
        );
        
        // The API returns accessToken as the new access token
        const newAccessToken = resp.data.accessToken;
        console.log('🔄 Token refreshed successfully, new token received');
        setAuthToken(newAccessToken);
        setAuthTokens(newAccessToken, refreshToken); // Keep the original refresh token
        const retryHeaders = originalRequest.headers instanceof AxiosHeaders
          ? originalRequest.headers
          : new AxiosHeaders(originalRequest.headers);
        retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
        originalRequest.headers = retryHeaders;
        return api.request(originalRequest);
      } catch (refreshErr) {
        clearAuth();
        // Notify and redirect to appropriate login page after refresh failure
        try {
          if (!originalRequest?._suppressGlobalErrorToast) {
            toast.error('Session expired', { description: 'Please log in again.' });
          }
          // Avoid multiple rapid redirects
          if (typeof window !== 'undefined') {
            const currentPath = window.location?.pathname || '/';
            const goTo =
              currentPath.startsWith('/broker') ? '/broker/login' :
              currentPath.startsWith('/insurer') ? '/insurer/login' :
              '/admin/login';
            if (!currentPath.startsWith(goTo)) {
              window.location.assign(goTo);
            }
          }
        } catch {
          // ignore toast or location errors
        }
        // bubble up original error after handling
      }
    }

    const code = (data && data.code) || (error as any).code;
    const message = (data && data.message) || error.message || 'Request failed';

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[API ERROR]', { message, status, code, data });
    }

    // Global server error toast (5xx) or network error
    try {
      const isServerError = typeof status === 'number' && status >= 500;
      const isNetworkError = !error.response && (error as any).message?.toString()?.toLowerCase().includes('network');
      if ((isServerError || isNetworkError) && !originalRequest?._suppressGlobalErrorToast) {
        const title = isNetworkError ? 'Network error' : 'Server error';
        const description = isNetworkError ? 'Please check your connection and try again.' : (message || 'An unexpected error occurred.');
        toast.error(title, { description });
      }
    } catch {
      // ignore toast errors
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

export async function apiUploadFile<T>(path: string, file: File, config?: AxiosRequestConfig): Promise<T> {
  const formData = new FormData();
  formData.append('files', file);
  
  return apiRequest<T>(path, {
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    ...(config || {})
  });
}


