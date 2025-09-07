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

// Types for Broker Insurers API
export interface QuoteConfig {
  product_id: number;
  validity_days: number;
  backdate_days: number;
  operating_countries: string[];
  operating_regions: string[];
  operating_zones: string[];
}

export interface ProductAssignedDetail {
  product_id: number;
  product_name: string;
  product_type: string;
  description: string;
  is_assigned: boolean;
  quote_config: QuoteConfig;
}

export interface BrokerInsurer {
  insurer_id: number;
  insurer_name: string;
  status: string;
  products_assigned: number;
  product_assigned_details: ProductAssignedDetail[];
}

export interface BrokerInsurersResponse {
  broker: {
    id: number;
    name: string;
  };
  insurers: BrokerInsurer[];
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
  type BrokerListResponse = { brokers: Array<{
    id: number;
    broker_name: string;
    email: string | null;
    license_no: string | null;
    status: 'active' | 'inactive' | string;
    is_active?: boolean;
    products_assigned?: string | number;
  }>; };

  const data = await apiGet<BrokerDTO[] | BrokerListResponse>('/brokers');

  if (Array.isArray(data)) {
    return data.map(mapBroker);
  }

  if (data && Array.isArray((data as BrokerListResponse).brokers)) {
    return (data as BrokerListResponse).brokers.map((item) => ({
      id: item.id,
      name: item.broker_name || '',
      email: item.email || undefined,
      phone: undefined,
      company: undefined,
      licenseNumber: item.license_no || undefined,
      licenseStartDate: undefined,
      licenseEndDate: undefined,
      joinDate: undefined,
      operatingCountries: undefined,
      operatingRegions: undefined,
      operatingZones: undefined,
      companyLogo: null,
      status: item.status,
    }));
  }

  return [];
}

export async function getBroker(brokerId: string | number): Promise<Broker> {
  type WrappedBroker = {
    broker: {
      id: number;
      name: string;
      license_number: string | null;
      contact_email: string | null;
      phone: string | null;
      company_logo?: string | null;
      operating_countries?: string[] | null;
      operating_regions?: string[] | null; // strings in new response
      operating_zones?: string[] | null;   // strings in new response
      license_start_date?: string | null;
      license_end_date?: string | null;
      license_doc?: string | null;
      join_date?: string | null;
      status: 'active' | 'inactive' | string;
      admin_user_id?: number;
      created_at?: string;
      updated_at?: string;
      members_count?: number;
    };
    admin_user?: { id: number; name?: string; email?: string; status?: string };
  };

  const data = await apiGet<BrokerDTO | WrappedBroker>(`/brokers/${encodeURIComponent(String(brokerId))}`);

  // Old shape
  if ((data as any).id !== undefined) {
    return mapBroker(data as BrokerDTO);
  }

  // New wrapped shape
  const wrapped = data as WrappedBroker;
  const b = wrapped.broker;
  const broker: Broker = {
    id: b.id,
    name: b.name || '',
    email: b.contact_email ?? undefined,
    phone: b.phone ?? undefined,
    company: undefined,
    licenseNumber: b.license_number ?? undefined,
    licenseStartDate: (b.license_start_date || null) ? (b.license_start_date as string).slice(0, 10) : null,
    licenseEndDate: (b.license_end_date || null) ? (b.license_end_date as string).slice(0, 10) : null,
    joinDate: b.join_date ?? undefined,
    operatingCountries: b.operating_countries ?? undefined,
    // Normalize regions: handle array of strings OR array of objects
    operatingRegions: Array.isArray(b.operating_regions)
      ? (b.operating_regions as any[]).map((item: any) => {
          if (item && typeof item === 'object' && 'name' in item) {
            return { name: String(item.name), country: String((item as any).country || '') };
          }
          return { name: String(item), country: '' };
        })
      : undefined,
    // Normalize zones: handle array of strings OR array of objects
    operatingZones: Array.isArray(b.operating_zones)
      ? (b.operating_zones as any[]).map((item: any) => {
          if (item && typeof item === 'object' && 'name' in item) {
            return {
              name: String(item.name),
              region: String((item as any).region || ''),
              country: String((item as any).country || ''),
            };
          }
          return { name: String(item), region: '', country: '' };
        })
      : undefined,
    companyLogo: b.company_logo ?? null,
    status: b.status,
  };

  return broker;
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

// Get insurers assigned to a broker
export async function getBrokerInsurers(brokerId: number): Promise<BrokerInsurersResponse> {
  if (!brokerId) {
    throw new Error('Broker ID is required for getting assigned insurers');
  }
  const endpoint = `/brokers/${brokerId}/list-insurers`;
  console.log('🏢 getBrokerInsurers called with:', { brokerId, endpoint });
  return apiGet<BrokerInsurersResponse>(endpoint);
}

