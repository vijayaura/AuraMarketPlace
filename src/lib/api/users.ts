import { apiGet } from './client';
import { apiPost } from './client';
import { apiPut } from './client';
import { apiPatch } from './client';

export interface AdminUserListItem {
  id: number;
  name?: string;
  email: string;
  role: string;
  user_type: 'admin' | 'user' | string;
  status: 'active' | 'inactive' | 'pending' | string;
  created_at: string;
}

export async function getUsersByAdmin(): Promise<AdminUserListItem[]> {
  return apiGet<AdminUserListItem[]>('/users/by-admin');
}

export interface GetUserByIdResponseBody {
  id: number;
  name?: string;
  email: string;
  role: string;
  user_type: 'admin' | 'user' | string;
  status: 'active' | 'inactive' | 'pending' | string;
  created_at: string;
}

export async function getUserById(userId: number | string): Promise<GetUserByIdResponseBody> {
  return apiGet<GetUserByIdResponseBody>(`/users/${userId}`);
}

export interface CreateUserRequestBody {
  name: string;
  email: string;
  password: string;
  user_type: 'admin' | 'user' | string;
}

export interface CreateUserResponseBody {
  message: string;
  userId: number;
  role: string;
  user_type: 'admin' | 'user' | string;
}

export async function createUser(body: CreateUserRequestBody): Promise<CreateUserResponseBody> {
  return apiPost<CreateUserResponseBody>('/users', body);
}

export interface UpdateUserRequestBody {
  name?: string;
  email?: string;
  password?: string;
  user_type?: 'admin' | 'user' | string;
}
export interface UpdateUserResponseBody { message: string; }

export async function updateUser(userId: number | string, body: UpdateUserRequestBody): Promise<UpdateUserResponseBody> {
  return apiPut<UpdateUserResponseBody>(`/users/${userId}`, body);
}

export interface UserStatusResponseBody { message: string; }

export async function activateUser(userId: number | string): Promise<UserStatusResponseBody> {
  return apiPatch<UserStatusResponseBody>(`/users/${userId}/activate-user`);
}

export async function deactivateUser(userId: number | string): Promise<UserStatusResponseBody> {
  return apiPatch<UserStatusResponseBody>(`/users/${userId}/deactivate-user`);
}

// Portal-scoped user listings
export interface PortalUserListItem extends AdminUserListItem {
  is_admin?: number | boolean;
}

export interface BrokerUsersResponse {
  broker_id: number;
  users: PortalUserListItem[];
}

export interface InsurerUsersResponse {
  insurer_id: number;
  users: PortalUserListItem[];
}

export async function getBrokerUsers(companyId: number | string): Promise<PortalUserListItem[]> {
  const data = await apiGet<BrokerUsersResponse>(`/users/broker/${encodeURIComponent(String(companyId))}`);
  return Array.isArray(data?.users) ? data.users : [];
}

export async function getInsurerUsers(companyId: number | string): Promise<PortalUserListItem[]> {
  const data = await apiGet<InsurerUsersResponse>(`/users/insurer/${encodeURIComponent(String(companyId))}`);
  return Array.isArray(data?.users) ? data.users : [];
}


