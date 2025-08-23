import { apiGet } from './client';
import { apiPost } from './client';
import { apiPatch } from './client';
import { apiPut } from './client';

export interface BrokerDTO {
  id: number;
  user_id: number | null;
  admin_user_id: number | null;
  name: string;
  company: string | null;
  license_number: string | null;
  license_start_date: string | null;
  license_end_date: string | null;
  license_doc: string | null;
  company_logo?: string | null;
  operating_countries: string[] | null;
  operating_regions?: { name: string; country: string }[] | null;
  operating_zones?: { name: string; region: string; country: string }[] | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  join_date: string | null;
  status: 'active' | 'inactive' | string;
}

export interface Broker {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  licenseNumber?: string;
  licenseStartDate?: string | null;
  licenseEndDate?: string | null;
  joinDate?: string; // ISO string for display
  operatingCountries?: string[];
  operatingRegions?: { name: string; country: string }[];
  operatingZones?: { name: string; region: string; country: string }[];
  companyLogo?: string | null;
  status: 'active' | 'inactive' | string;
}

function toDateInputString(value: string | null | undefined): string | null {
  if (!value) return null;
  // Expecting ISO-like string; take first 10 chars to match <input type="date">
  return value.slice(0, 10);
}

function mapBroker(dto: BrokerDTO): Broker {
  return {
    id: dto.id,
    name: dto.name || '',
    email: dto.contact_email ?? undefined,
    phone: dto.phone ?? undefined,
    company: dto.company ?? undefined,
    licenseNumber: dto.license_number ?? undefined,
    licenseStartDate: toDateInputString(dto.license_start_date),
    licenseEndDate: toDateInputString(dto.license_end_date),
    joinDate: dto.join_date ?? undefined,
    operatingCountries: dto.operating_countries ?? undefined,
    operatingRegions: dto.operating_regions ?? undefined,
    operatingZones: dto.operating_zones ?? undefined,
    companyLogo: dto.company_logo ?? null,
    status: dto.status,
  };
}

export async function listBrokers(): Promise<Broker[]> {
  const data = await apiGet<BrokerDTO[]>('/brokers');
  return Array.isArray(data) ? data.map(mapBroker) : [];
}

export async function getBroker(brokerId: string | number): Promise<Broker> {
  const data = await apiGet<BrokerDTO>(`/brokers/${encodeURIComponent(String(brokerId))}`);
  return mapBroker(data);
}

export interface CreateBrokerRequest {
  name: string;
  company?: string | null;
  contact_email: string;
  phone: string;
  address?: string | null;
  license_number: string;
  license_start_date: string | null; // YYYY-MM-DD
  license_end_date: string | null;   // YYYY-MM-DD
  license_doc: string | null;
  company_logo?: string | null;
  operating_countries: string[] | null;
  operating_regions?: { name: string; country: string }[] | null;
  operating_zones?: { name: string; region: string; country: string }[] | null;
  admin_email: string;
  admin_password: string;
  join_date: string | null; // YYYY-MM-DD
}

export interface CreateBrokerResponse {
  message: string;
  brokerId: number;
  adminUserId: number;
}

export async function createBroker(body: CreateBrokerRequest): Promise<CreateBrokerResponse> {
  return apiPost<CreateBrokerResponse>('/brokers', body);
}

export type UpdateBrokerRequest = CreateBrokerRequest;

export async function updateBroker(brokerId: string | number, body: UpdateBrokerRequest): Promise<Broker> {
  const data = await apiPut<BrokerDTO>(`/brokers/${encodeURIComponent(String(brokerId))}`, body);
  return mapBroker(data);
}

export interface StatusChangeResponse { message?: string; status?: 'active' | 'inactive' | string }

export async function activateBroker(brokerId: string | number): Promise<StatusChangeResponse> {
  return apiPatch<StatusChangeResponse>(`/brokers/${encodeURIComponent(String(brokerId))}/activate`);
}

export async function deactivateBroker(brokerId: string | number): Promise<StatusChangeResponse> {
  return apiPatch<StatusChangeResponse>(`/brokers/${encodeURIComponent(String(brokerId))}/deactivate`);
}


