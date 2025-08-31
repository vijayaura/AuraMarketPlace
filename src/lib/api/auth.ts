import { apiPost } from './client';

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  user_type: string;
  status?: string;
  name?: string;
  company_id?: number;
  company_name?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

export async function login(body: LoginRequestBody): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/auth/login', body);
}

export interface RefreshRequestBody {
  refreshToken: string;
}

export type RefreshResponse = LoginResponse;

// Note: This is exported for typed use, but the axios client uses a low-level
// call with a skip flag to avoid interceptor recursion during refresh.
export async function refresh(body: RefreshRequestBody): Promise<RefreshResponse> {
  return apiPost<RefreshResponse>('/auth/refresh-token', body);
}

export interface LogoutResponse {
  refreshToken: string;
}

export interface LogoutRequestBody {
  refreshToken: string;
}

export async function logout(body: LogoutRequestBody): Promise<LogoutResponse> {
  return apiPost<LogoutResponse>('/auth/logout', body);
}


