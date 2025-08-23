import { apiGet } from './client';
import { apiPost } from './client';
import { apiPatch } from './client';
import { apiPut } from './client';
import { apiPost as rawPost } from './client';

// Raw shape from backend
export interface InsurerDTO {
  id: number;
  user_id: number | null;
  admin_user_id: number | null;
  name: string;
  license_number: string | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  // website removed
  operating_countries: string[] | null;
  operating_regions?: { name: string; country: string }[] | null;
  operating_zones?: { name: string; region: string; country: string }[] | null;
  company_logo: string | null;
  status: 'active' | 'inactive' | string;
  admin_email?: string | null;
  admin_password?: string | null;
}

// UI/domain-friendly shape
export interface Insurer {
  id: number;
  name: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  // website removed
  operatingCountries?: string[];
  operatingRegions?: { name: string; country: string }[];
  operatingZones?: { name: string; region: string; country: string }[];
  companyLogo?: string | null;
  status: 'active' | 'inactive' | string;
  adminEmail?: string;
  adminPassword?: string;
}

function mapInsurer(dto: InsurerDTO): Insurer {
  return {
    id: dto.id,
    name: dto.name || '',
    licenseNumber: dto.license_number ?? undefined,
    email: dto.contact_email ?? undefined,
    phone: dto.phone ?? undefined,
    address: dto.address ?? undefined,
    operatingCountries: dto.operating_countries ?? undefined,
    operatingRegions: dto.operating_regions ?? undefined,
    operatingZones: dto.operating_zones ?? undefined,
    companyLogo: dto.company_logo ?? undefined,
    status: dto.status,
    adminEmail: dto.admin_email ?? undefined,
    adminPassword: dto.admin_password ?? undefined,
  };
}

export async function listInsurers(): Promise<Insurer[]> {
  const data = await apiGet<InsurerDTO[]>('/insurers');
  return Array.isArray(data) ? data.map(mapInsurer) : [];
}

export async function getInsurer(insurerId: string | number): Promise<Insurer> {
  const data = await apiGet<InsurerDTO>(`/insurers/${encodeURIComponent(String(insurerId))}`);
  return mapInsurer(data);
}

export interface CreateInsurerRequest {
  name: string;
  license_number: string;
  contact_email: string;
  phone: string;
  address: string;
  // website removed from request
  company_logo?: string | null;
  operating_countries: string[] | null;
  operating_regions: { name: string; country: string }[] | null;
  operating_zones: { name: string; region: string; country: string }[] | null;
  admin_email: string;
  admin_password: string;
}

export interface CreateInsurerResponse {
  message: string;
  insurer_id: number;
  admin_user_id: number;
}

export async function createInsurer(body: CreateInsurerRequest): Promise<CreateInsurerResponse> {
  return apiPost<CreateInsurerResponse>('/insurers', body);
}

export type UpdateInsurerRequest = CreateInsurerRequest;

export async function updateInsurer(insurerId: string | number, body: UpdateInsurerRequest): Promise<Insurer> {
  const data = await apiPut<InsurerDTO>(`/insurers/${encodeURIComponent(String(insurerId))}`, body);
  return mapInsurer(data);
}

export interface StatusChangeResponse { message?: string; status?: 'active' | 'inactive' | string }

export async function activateInsurer(insurerId: string | number): Promise<StatusChangeResponse> {
  return apiPut<StatusChangeResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/activate`);
}

export async function deactivateInsurer(insurerId: string | number): Promise<StatusChangeResponse> {
  return apiPut<StatusChangeResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/deactivate`);
}


