import { apiGet, apiPost, apiPatch, apiPut } from './client';

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


// Broker assignments for an insurer
export interface BrokerAssignmentDTO {
  id: number;
  broker_name: string;
  email: string | null;
  license_no: string | null;
  status: 'active' | 'inactive' | string;
  is_active: boolean | number;
  products_assigned: string | number | null;
}

export interface BrokerAssignmentsResponse {
  insurer_id: number;
  brokers: BrokerAssignmentDTO[];
}

export interface BrokerAssignment {
  id: number;
  name: string;
  email?: string;
  licenseNumber?: string;
  status: 'active' | 'inactive' | string;
  isActive: boolean;
  productsAssigned: number;
}

function mapBrokerAssignment(dto: BrokerAssignmentDTO): BrokerAssignment {
  return {
    id: dto.id,
    name: dto.broker_name || '',
    email: dto.email ?? undefined,
    licenseNumber: dto.license_no ?? undefined,
    status: dto.status,
    isActive: typeof dto.is_active === 'boolean' ? dto.is_active : Number(dto.is_active) === 1,
    productsAssigned: dto.products_assigned == null ? 0 : Number(dto.products_assigned),
  };
}

export async function getInsurerBrokerAssignments(insurerId: number | string): Promise<BrokerAssignment[]> {
  const data = await apiGet<BrokerAssignmentsResponse>(`/insurer/broker-assignment`, {
    params: { insurer_id: insurerId },
  });
  const list = Array.isArray(data?.brokers) ? data.brokers : [];
  return list.map(mapBrokerAssignment);
}

// Toggle broker active status for an insurer
export interface ToggleBrokerStatusRequest { is_active: boolean }
export interface ToggleBrokerStatusResponse {
  message?: string;
  insurer_id: number;
  broker_id: number;
  status: 'active' | 'inactive' | string;
}

export async function toggleBrokerStatus(insurerId: number | string, brokerId: number | string, isActive: boolean): Promise<ToggleBrokerStatusResponse> {
  return apiPatch<ToggleBrokerStatusResponse>(`/insurer/${encodeURIComponent(String(brokerId))}/toggle-status`, { is_active: isActive }, { params: { insurer_id: insurerId } });
}

// Get assigned product list for a broker under an insurer
export interface BrokerProductsResponse {
  insurer_id: number;
  broker: { id: number; name?: string; status?: string; is_active?: boolean };
  products: Array<{
    product_id: number;
    product_name: string;
    product_type: string;
    assigned: boolean;
    is_active: boolean;
  }>;
}

export interface BrokerProductAssignment {
  productId: number;
  productName: string;
  productType: string;
  assigned: boolean;
  isActive: boolean;
}

export async function getBrokerAssignedProducts(insurerId: number | string, brokerId: number | string): Promise<BrokerProductAssignment[]> {
  const data = await apiGet<BrokerProductsResponse>(`/insurer/${encodeURIComponent(String(brokerId))}/products`, {
    params: { insurer_id: insurerId },
  });
  const list = Array.isArray(data?.products) ? data.products : [];
  return list.map(p => ({
    productId: p.product_id,
    productName: p.product_name,
    productType: p.product_type,
    assigned: !!p.assigned,
    isActive: !!p.is_active,
  }));
}

// Insurer Metadata API
export interface InsurerMetadata {
  id: number;
  name: string;
  license_number: string;
  contact_email: string;
  phone: string;
  address: string;
  website: string | null;
  company_logo: string | null;
  operating_countries: string[];
  operating_regions: Array<{
    name: string;
    country: string;
  }>;
  operating_zones: Array<{
    name: string;
    region: string;
    country: string;
  }>;
  status: string;
  admin_user_id: number;
  created_at: string;
  updated_at: string;
  admin_email: string;
  admin_password: string | null;
}

export async function getInsurerMetadata(insurerId: number | string): Promise<InsurerMetadata> {
  return await apiGet<InsurerMetadata>(`/insurers/${encodeURIComponent(String(insurerId))}`);
}

// Save Quote Config
export interface SaveQuoteConfigRequest {
  id?: number;
  product_id: number;
  validity_days: number;
  backdate_days: number;
  operating_countries: string[];
  operating_regions: string[];
  operating_zones: string[];
  created_at?: string;
  updated_at?: string;
  insurer_id?: number;
}

export interface SaveQuoteConfigResponse { message?: string }

export async function saveQuoteConfig(insurerId: number | string, body: SaveQuoteConfigRequest): Promise<SaveQuoteConfigResponse> {
  return apiPost<SaveQuoteConfigResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(body.product_id))}/quote-config`, body);
}

export type UpdateQuoteConfigRequest = SaveQuoteConfigRequest;

export async function updateQuoteConfig(
  insurerId: number | string,
  productId: number | string,
  body: UpdateQuoteConfigRequest
): Promise<SaveQuoteConfigResponse> {
  return apiPatch<SaveQuoteConfigResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-config`,
    body
  );
}

// Get saved Quote Config
export interface GetQuoteConfigResponse {
  id: number;
  product_id: number;
  validity_days: number;
  backdate_days: number;
  operating_countries: string[];
  operating_regions: string[];
  operating_zones: string[];
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

export async function getQuoteConfig(insurerId: number | string, productId: number | string): Promise<GetQuoteConfigResponse> {
  return await apiGet<GetQuoteConfigResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-config`);
}

// Get Quote Config for UI Population
export interface QuoteConfigUIResponse {
  id: number;
  product_id: number;
  validity_days: number;
  backdate_days: number;
  operating_countries: string[];
  operating_regions: string[];
  operating_zones: string[];
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

export async function getQuoteConfigForUI(insurerId: number | string, productId: number | string): Promise<QuoteConfigUIResponse> {
  return await apiGet<QuoteConfigUIResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-config`);
}


// Save Base Rates (Pricing → Base Rates by Sub Project Type)
export type PricingTypeEnum = 'FIXED_AMOUNT' | 'PERCENTAGE';
export type QuoteOptionEnum = 'AUTO_QUOTE' | 'NO_QUOTE' | 'QUOTE_AND_REFER';

export interface BaseRateSubProjectRequest {
  name: string;
  pricing_type: PricingTypeEnum;
  base_rate: number;
  currency: 'AED' | '%';
  quote_option: QuoteOptionEnum;
}

export interface SaveBaseRatesRequestItem {
  project_type: string;
  sub_projects: BaseRateSubProjectRequest[];
}

export interface SaveBaseRatesRequest {
  base_rates: SaveBaseRatesRequestItem[];
}

export interface SaveBaseRatesResponse { message?: string }

export async function saveBaseRates(
  insurerId: number | string,
  productId: number | string,
  body: SaveBaseRatesRequest
): Promise<SaveBaseRatesResponse> {
  return apiPost<SaveBaseRatesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/base-rates`,
    body
  );
}

export async function updateBaseRates(
  insurerId: number | string,
  productId: number | string,
  body: SaveBaseRatesRequest
): Promise<SaveBaseRatesResponse> {
  return apiPatch<SaveBaseRatesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/base-rates`,
    body
  );
}

// Get Base Rates
export interface GetBaseRatesItemSubProject {
  name: string;
  currency: 'AED' | '%';
  base_rate: number;
  pricing_type: PricingTypeEnum;
  quote_option: QuoteOptionEnum;
}

export interface GetBaseRatesItem {
  project_type: string;
  sub_projects: GetBaseRatesItemSubProject[];
}

export type GetBaseRatesResponse = GetBaseRatesItem[];

export async function getBaseRates(
  insurerId: number | string,
  productId: number | string
): Promise<GetBaseRatesResponse> {
  return apiGet<GetBaseRatesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/base-rates`
  );
}

// Construction Types Config
export type ConstructionPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface ConstructionTypeItemRequest {
  name: string;
  pricing_type: ConstructionPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveConstructionTypesRequest {
  construction_types_config: {
    items: ConstructionTypeItemRequest[];
  }
}

export interface SaveConstructionTypesResponse { message?: string }

export interface GetConstructionTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: ConstructionPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getConstructionTypes(
  insurerId: number | string,
  productId: number | string
): Promise<GetConstructionTypesResponse> {
  const ts = Date.now();
  return apiGet<GetConstructionTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/construction-types?t=${ts}`
  );
}

export async function saveConstructionTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveConstructionTypesRequest
): Promise<SaveConstructionTypesResponse> {
  return apiPost<SaveConstructionTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/construction-types`,
    body
  );
}

export async function updateConstructionTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveConstructionTypesRequest
): Promise<SaveConstructionTypesResponse> {
  return apiPatch<SaveConstructionTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/construction-types`,
    body
  );
}

// Countries Pricing Config
export type CountryPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveCountriesItemRequest {
  country?: string;
  name?: string; // backend may accept name as well
  pricing_type: CountryPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
}

export interface SaveCountriesRequest {
  countries_config: {
    items: SaveCountriesItemRequest[];
  };
}

export interface SaveCountriesResponse { message?: string }

export interface GetCountriesResponse {
  items: Array<{
    country?: string;
    name?: string;
    pricing_type: CountryPricingEnum;
    value: number;
    quote_option: QuoteOptionEnum;
  }>;
}

export async function getCountriesPricing(
  insurerId: number | string,
  productId: number | string
): Promise<GetCountriesResponse> {
  const ts = Date.now();
  return apiGet<GetCountriesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/countries?t=${ts}`
  );
}

export async function saveCountriesPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveCountriesRequest
): Promise<SaveCountriesResponse> {
  return apiPost<SaveCountriesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/countries`,
    body
  );
}

export async function updateCountriesPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveCountriesRequest
): Promise<SaveCountriesResponse> {
  return apiPatch<SaveCountriesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/countries`,
    body
  );
}

// Regions Pricing Config
export type RegionPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveRegionsItemRequest {
  name: string;
  pricing_type: RegionPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveRegionsRequest {
  regions_config: {
    items: SaveRegionsItemRequest[];
  };
}

export interface SaveRegionsResponse { message?: string }

export interface GetRegionsResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: RegionPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getRegionsPricing(
  insurerId: number | string,
  productId: number | string
): Promise<GetRegionsResponse> {
  const ts = Date.now();
  return apiGet<GetRegionsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/regions?t=${ts}`
  );
}

export async function saveRegionsPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveRegionsRequest
): Promise<SaveRegionsResponse> {
  return apiPost<SaveRegionsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/regions`,
    body
  );
}

export async function updateRegionsPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveRegionsRequest
): Promise<SaveRegionsResponse> {
  return apiPatch<SaveRegionsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/regions`,
    body
  );
}

// Zones Pricing Config
export type ZonePricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveZonesItemRequest {
  name: string;
  pricing_type: ZonePricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveZonesRequest {
  zones_config: {
    items: SaveZonesItemRequest[];
  };
}

export interface SaveZonesResponse { message?: string }

export interface GetZonesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: ZonePricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getZonesPricing(
  insurerId: number | string,
  productId: number | string
): Promise<GetZonesResponse> {
  const ts = Date.now();
  return apiGet<GetZonesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/zones?t=${ts}`
  );
}

export async function saveZonesPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveZonesRequest
): Promise<SaveZonesResponse> {
  return apiPost<SaveZonesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/zones`,
    body
  );
}

export async function updateZonesPricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveZonesRequest
): Promise<SaveZonesResponse> {
  return apiPatch<SaveZonesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/zones`,
    body
  );
}

// Contract Types Config
export type ContractPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveContractTypesItemRequest {
  name: string;
  pricing_type: ContractPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveContractTypesRequest {
  contract_types_config: {
    items: SaveContractTypesItemRequest[];
  };
}

export interface SaveContractTypesResponse { message?: string }

export interface GetContractTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: ContractPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getContractTypes(
  insurerId: number | string,
  productId: number | string
): Promise<GetContractTypesResponse> {
  const ts = Date.now();
  return apiGet<GetContractTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contract-types?t=${ts}`
  );
}

export async function saveContractTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveContractTypesRequest
): Promise<SaveContractTypesResponse> {
  return apiPost<SaveContractTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contract-types`,
    body
  );
}

export async function updateContractTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveContractTypesRequest
): Promise<SaveContractTypesResponse> {
  return apiPatch<SaveContractTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contract-types`,
    body
  );
}

// Role Types Config
export type RolePricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveRoleTypesItemRequest {
  name: string;
  pricing_type: RolePricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveRoleTypesRequest {
  role_types_config: {
    items: SaveRoleTypesItemRequest[];
  };
}

export interface SaveRoleTypesResponse { message?: string }

export interface GetRoleTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: RolePricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getRoleTypes(
  insurerId: number | string,
  productId: number | string
): Promise<GetRoleTypesResponse> {
  return apiGet<GetRoleTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/role-types`
  );
}

export async function saveRoleTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveRoleTypesRequest
): Promise<SaveRoleTypesResponse> {
  return apiPost<SaveRoleTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/role-types`,
    body
  );
}

export async function updateRoleTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveRoleTypesRequest
): Promise<SaveRoleTypesResponse> {
  return apiPatch<SaveRoleTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/role-types`,
    body
  );
}

// Soil Types Config
export type SoilPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveSoilTypesItemRequest {
  name: string;
  pricing_type: SoilPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveSoilTypesRequest {
  soil_types_config: {
    items: SaveSoilTypesItemRequest[];
  };
}

export interface SaveSoilTypesResponse { message?: string }

export interface GetSoilTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: SoilPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getSoilTypes(
  insurerId: number | string,
  productId: number | string
): Promise<GetSoilTypesResponse> {
  const ts = Date.now();
  return apiGet<GetSoilTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/soil-types?t=${ts}`
  );
}

export async function saveSoilTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveSoilTypesRequest
): Promise<SaveSoilTypesResponse> {
  return apiPost<SaveSoilTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/soil-types`,
    body
  );
}

export async function updateSoilTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveSoilTypesRequest
): Promise<SaveSoilTypesResponse> {
  return apiPatch<SaveSoilTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/soil-types`,
    body
  );
}

// Subcontractor Types Config
export type SubcontractorPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveSubcontractorTypesItemRequest {
  name: string;
  pricing_type: SubcontractorPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveSubcontractorTypesRequest {
  subcontractor_types_config: {
    items: SaveSubcontractorTypesItemRequest[];
  };
}

export interface SaveSubcontractorTypesResponse { message?: string }

export interface GetSubcontractorTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: SubcontractorPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getSubcontractorTypes(
  insurerId: number | string,
  productId: number | string
): Promise<GetSubcontractorTypesResponse> {
  const ts = Date.now();
  return apiGet<GetSubcontractorTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/subcontractor-types?t=${ts}`
  );
}

export async function saveSubcontractorTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveSubcontractorTypesRequest
): Promise<SaveSubcontractorTypesResponse> {
  return apiPost<SaveSubcontractorTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/subcontractor-types`,
    body
  );
}

export async function updateSubcontractorTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveSubcontractorTypesRequest
): Promise<SaveSubcontractorTypesResponse> {
  return apiPatch<SaveSubcontractorTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/subcontractor-types`,
    body
  );
}

// Consultant Roles Config
export type ConsultantPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveConsultantRolesItemRequest {
  name: string;
  pricing_type: ConsultantPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveConsultantRolesRequest {
  consultant_roles_config: {
    items: SaveConsultantRolesItemRequest[];
  };
}

export interface SaveConsultantRolesResponse { message?: string }

export interface GetConsultantRolesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: ConsultantPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getConsultantRoles(
  insurerId: number | string,
  productId: number | string
): Promise<GetConsultantRolesResponse> {
  const ts = Date.now();
  return apiGet<GetConsultantRolesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/consultant-roles?t=${ts}`
  );
}

export async function saveConsultantRoles(
  insurerId: number | string,
  productId: number | string,
  body: SaveConsultantRolesRequest
): Promise<SaveConsultantRolesResponse> {
  return apiPost<SaveConsultantRolesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/consultant-roles`,
    body
  );
}

export async function updateConsultantRoles(
  insurerId: number | string,
  productId: number | string,
  body: SaveConsultantRolesRequest
): Promise<SaveConsultantRolesResponse> {
  return apiPatch<SaveConsultantRolesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/consultant-roles`,
    body
  );
}

// Security Types Config
export type SecurityPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveSecurityTypesItemRequest {
  name: string;
  pricing_type: SecurityPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveSecurityTypesRequest {
  security_types_config: {
    items: SaveSecurityTypesItemRequest[];
  };
}

export interface SaveSecurityTypesResponse { message?: string }

export interface GetSecurityTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: SecurityPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getSecurityTypes(
  insurerId: number | string,
  productId: number | string
): Promise<GetSecurityTypesResponse> {
  const ts = Date.now();
  return apiGet<GetSecurityTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/security-types?t=${ts}`
  );
}

export async function saveSecurityTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveSecurityTypesRequest
): Promise<SaveSecurityTypesResponse> {
  return apiPost<SaveSecurityTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/security-types`,
    body
  );
}

export async function updateSecurityTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveSecurityTypesRequest
): Promise<SaveSecurityTypesResponse> {
  return apiPatch<SaveSecurityTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/security-types`,
    body
  );
}

// Area Types Config
export type AreaPricingEnum = 'PERCENTAGE' | 'FIXED_RATE';

export interface SaveAreaTypesItemRequest {
  name: string;
  pricing_type: AreaPricingEnum;
  value: number;
  quote_option: QuoteOptionEnum;
  display_order: number;
  is_active: boolean;
}

export interface SaveAreaTypesRequest {
  area_types_config: {
    items: SaveAreaTypesItemRequest[];
  };
}

export interface SaveAreaTypesResponse { message?: string }

export interface GetAreaTypesResponse {
  items: Array<{
    name: string;
    value: number;
    is_active: boolean;
    pricing_type: AreaPricingEnum;
    quote_option: QuoteOptionEnum;
    display_order: number;
  }>;
}

export async function getAreaTypes(
  insurerId: number | string,
  productId: number | string
): Promise<GetAreaTypesResponse> {
  const ts = Date.now();
  return apiGet<GetAreaTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/area-types?t=${ts}`
  );
}

export async function saveAreaTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveAreaTypesRequest
): Promise<SaveAreaTypesResponse> {
  return apiPost<SaveAreaTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/area-types`,
    body
  );
}

export async function updateAreaTypes(
  insurerId: number | string,
  productId: number | string,
  body: SaveAreaTypesRequest
): Promise<SaveAreaTypesResponse> {
  return apiPatch<SaveAreaTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/area-types`,
    body
  );
}

// Policy Wordings
export interface PolicyWording {
  id: number;
  document_title: string;
  file_size_kb: number;
  upload_date: string;
  is_active: number;
  created_at: string;
}

export interface GetPolicyWordingsResponse {
  wordings: PolicyWording[];
}

export async function getPolicyWordings(
  insurerId: number | string,
  productId: number | string
): Promise<GetPolicyWordingsResponse> {
  const ts = Date.now();
  return apiGet<GetPolicyWordingsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/policy-wordings?t=${ts}`
  );
}


// Upload Policy Wording (multipart/form-data)
export interface UploadPolicyWordingResponse {
  message?: string;
  wording?: PolicyWording;
}

export interface UploadPolicyWordingParams {
  product_id: string; // e.g. "1"
  document_title: string; // e.g. "Professional Liability Policy Wording v2.1"
  is_active: string; // boolean string: "true" | "false"
  document: File; // PDF file
}

export async function uploadPolicyWording(
  insurerId: number | string,
  productId: number | string,
  params: UploadPolicyWordingParams
): Promise<UploadPolicyWordingResponse> {
  const form = new FormData();
  form.append('product_id', params.product_id);
  form.append('document_title', params.document_title);
  form.append('is_active', params.is_active);
  form.append('document', params.document);

  return apiPost<UploadPolicyWordingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/policy-wordings`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

// Update Policy Wording (multipart/form-data, all fields optional)
export interface UpdatePolicyWordingParams {
  document_title?: string;
  is_active?: string; // "true" | "false"
  document?: File; // optional
}

export interface UpdatePolicyWordingResponse {
  message?: string;
  wording?: PolicyWording;
}

export async function updatePolicyWording(
  insurerId: number | string,
  productId: number | string,
  wordingId: number | string,
  params: UpdatePolicyWordingParams
): Promise<UpdatePolicyWordingResponse> {
  const form = new FormData();
  if (typeof params.document_title === 'string') form.append('document_title', params.document_title);
  if (typeof params.is_active === 'string') form.append('is_active', params.is_active);
  if (params.document instanceof File) form.append('document', params.document);

  return apiPatch<UpdatePolicyWordingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/policy-wordings/${encodeURIComponent(String(wordingId))}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

// Quote Format
export interface QuoteFormatResponse {
  id: number;
  product_id: number;
  company_name: string;
  company_address: string;
  quotation_prefix: string;
  contact_info: {
    raw?: string;
    email?: string;
    phone?: string;
    website?: string;
  } | null;
  header_bg_color: string;
  header_text_color: string;
  logo_position: 'LEFT' | 'CENTER' | 'RIGHT' | string;
  logo_path: string | null;
  show_project_details: number;
  show_coverage_types: number;
  show_coverage_limits: number;
  show_deductibles: number;
  show_contractor_info: number;
  risk_section_title: string;
  show_base_premium: number;
  show_risk_adjustments: number;
  show_fees_charges: number;
  show_taxes_vat: number;
  show_total_premium: number;
  premium_section_title: string;
  premium_currency: string;
  show_warranties: number;
  show_exclusions: number;
  show_deductible_details: number;
  show_policy_conditions: number;
  terms_section_title: string;
  additional_terms_text: string;
  show_signature_block: number;
  authorized_signatory_name: string;
  signatory_title: string;
  signature_block_text: string;
  show_footer: number;
  show_general_disclaimer: number;
  show_regulatory_info: number;
  general_disclaimer_text: string;
  regulatory_info_text: string;
  footer_bg_color: string;
  footer_text_color: string;
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

// Masters: Project Types and Sub Project Types
export interface MasterProjectTypeDTO {
  id: number;
  name: string;
  status: string;
  display_order: number;
}

export interface MasterProjectType {
  id: number;
  name: string;
  status: string;
  displayOrder: number;
}

function mapMasterProjectType(dto: MasterProjectTypeDTO): MasterProjectType {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    displayOrder: dto.display_order,
  };
}

export async function getMasterProjectTypes(): Promise<MasterProjectType[]> {
  const data = await apiGet<MasterProjectTypeDTO[]>(`/admin/master-management/master_project_types`);
  const list = Array.isArray(data) ? data : [];
  return list.map(mapMasterProjectType).sort((a, b) => a.displayOrder - b.displayOrder);
}

export interface MasterSubProjectTypeDTO {
  id: number;
  name: string;
  status: string;
  display_order: number;
  project_type_id?: number;
}

export interface MasterSubProjectType {
  id: number;
  name: string;
  status: string;
  displayOrder: number;
  projectTypeId?: number;
}

function mapMasterSubProjectType(dto: MasterSubProjectTypeDTO): MasterSubProjectType {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    displayOrder: dto.display_order,
    projectTypeId: dto.project_type_id,
  };
}

export async function getMasterSubProjectTypes(): Promise<MasterSubProjectType[]> {
  const data = await apiGet<MasterSubProjectTypeDTO[]>(`/admin/master-management/master_sub_project_types`);
  const list = Array.isArray(data) ? data : [];
  return list.map(mapMasterSubProjectType).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getQuoteFormat(
  insurerId: number | string,
  productId: number | string
): Promise<QuoteFormatResponse> {
  return apiGet<QuoteFormatResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-format`
  );
}

export interface SaveQuoteFormatResponse {
  message?: string;
  id?: number;
}

export interface SaveQuoteFormatParams {
  product_id: string;
  company_name: string;
  company_address: string;
  quotation_prefix: string;
  contact_info: string;
  header_bg_color: string;
  header_text_color: string;
  logo_position: string; // LEFT | CENTER | RIGHT
  show_project_details: string; // boolean string
  show_coverage_types: string;
  show_coverage_limits: string;
  show_deductibles: string;
  show_contractor_info: string;
  risk_section_title: string;
  show_base_premium: string;
  show_risk_adjustments: string;
  show_fees_charges: string;
  show_taxes_vat: string;
  show_total_premium: string;
  premium_section_title: string;
  premium_currency: string;
  show_warranties: string;
  show_exclusions: string;
  show_deductible_details: string;
  show_policy_conditions: string;
  terms_section_title: string;
  additional_terms_text: string;
  show_signature_block: string;
  authorized_signatory_name: string;
  signatory_title: string;
  signature_block_text: string;
  show_footer: string;
  show_general_disclaimer: string;
  general_disclaimer_text: string;
  show_regulatory_info: string;
  regulatory_info_text: string;
  footer_bg_color: string;
  footer_text_color: string;
  logo?: File | null;
}

export async function createQuoteFormat(
  insurerId: number | string,
  productId: number | string,
  params: SaveQuoteFormatParams
): Promise<SaveQuoteFormatResponse> {
  const form = new FormData();
  Object.entries(params).forEach(([k, v]) => {
    if (k === 'logo') {
      if (v instanceof File) form.append('logo', v);
    } else {
      form.append(k, String(v ?? ''));
    }
  });
  return apiPost<SaveQuoteFormatResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-format`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

export async function updateQuoteFormat(
  insurerId: number | string,
  productId: number | string,
  params: Partial<SaveQuoteFormatParams>
): Promise<SaveQuoteFormatResponse> {
  const form = new FormData();
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    if (k === 'logo') {
      if (v instanceof File) form.append('logo', v);
    } else {
      form.append(k, String(v));
    }
  });
  return apiPatch<SaveQuoteFormatResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-format`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

// Required Documents
export interface RequiredDocumentDTO {
  id: number;
  product_id: number;
  display_order: number;
  display_label: string;
  description: string | null;
  is_required: boolean;
  status: string; // 'active' | 'inactive'
  template_file_url: string | null;
}

export interface GetRequiredDocumentsResponse {
  documents: RequiredDocumentDTO[];
}

export async function getRequiredDocuments(
  insurerId: number | string,
  productId: number | string
): Promise<GetRequiredDocumentsResponse> {
  const ts = Date.now();
  return apiGet<GetRequiredDocumentsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/required-documents?t=${ts}`
  );
}

export interface CreateRequiredDocumentParams {
  product_id: string; // e.g. "1"
  display_order: number;
  display_label: string;
  description?: string;
  is_required: string; // boolean string
  status: string; // 'active' | 'inactive'
  template_file?: File | null;
}

export interface CreateRequiredDocumentResponse {
  message?: string;
  document?: RequiredDocumentDTO;
}

export async function createRequiredDocument(
  insurerId: number | string,
  productId: number | string,
  params: CreateRequiredDocumentParams
): Promise<CreateRequiredDocumentResponse> {
  const form = new FormData();
  form.append('product_id', params.product_id);
  form.append('display_order', String(params.display_order));
  form.append('display_label', params.display_label);
  form.append('description', params.description ?? '');
  form.append('is_required', params.is_required);
  form.append('status', params.status);
  if (params.template_file instanceof File) {
    form.append('template_file', params.template_file);
  }
  return apiPost<CreateRequiredDocumentResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/required-documents`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

// CEWs (TPL limits and Extensions)
export interface TplLimitsDTO {
  id: number;
  product_id: number;
  default_limit: string;
  currency: string;
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

export interface TplExtensionDTO {
  id: number;
  product_id: number;
  title: string;
  description: string | null;
  limit_value: string;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE' | '' | string;
  pricing_value: string;
  currency: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

export interface GetTplResponse {
  limits: TplLimitsDTO;
  extensions: TplExtensionDTO[];
}

export async function getTplLimitsAndExtensions(
  insurerId: number | string,
  productId: number | string
): Promise<GetTplResponse> {
  const ts = Date.now();
  return apiGet<GetTplResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/tpl?t=${ts}`
  );
}

export interface UpdateTplExtensionItemRequest {
  id?: number; // include when updating existing extension rows
  title: string;
  description?: string | null;
  limit_value: number;
  pricing_type: 'percentage' | 'fixed';
  pricing_value: number;
  currency?: string;
}

export interface UpdateTplRequest {
  product_id: number | string;
  default_limit: number;
  currency: string;
  extensions: UpdateTplExtensionItemRequest[];
}

export type UpdateTplResponse = GetTplResponse;

export async function updateTplLimitsAndExtensions(
  insurerId: number | string,
  productId: number | string,
  body: UpdateTplRequest
): Promise<UpdateTplResponse> {
  return apiPatch<UpdateTplResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/tpl`,
    body
  );
}

// Create TPL limits & extensions (first-time save)
export interface CreateTplExtensionItemRequest {
  title: string;
  description?: string | null;
  limit_value: number;
  pricing_type: 'percentage' | 'fixed';
  pricing_value: number;
  currency: string;
}

export interface CreateTplRequest {
  extensions: CreateTplExtensionItemRequest[];
}

export interface CreateTplResponse { message?: string }

export async function createTplLimitsAndExtensions(
  insurerId: number | string,
  productId: number | string,
  body: CreateTplRequest
): Promise<CreateTplResponse> {
  return apiPost<CreateTplResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/tpl`,
    body
  );
}

// CEWs Clauses
export interface ClauseDTO {
  id: number;
  product_id: number;
  clause_code: string;
  title: string;
  purpose_description: string;
  clause_wording: string;
  clause_type: string; // EXCLUSION | WARRANTY | CLAUSE | etc.
  show_type: string; // OPTIONAL | MANDATORY, etc.
  pricing_type: string;
  pricing_value: string;
  display_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  insurer_id: number | null;
}

export interface GetClausesResponse {
  clauses: ClauseDTO[];
}

export async function getCewsClauses(
  insurerId: number | string,
  productId: number | string
): Promise<GetClausesResponse> {
  const ts = Date.now();
  return apiGet<GetClausesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/clauses?t=${ts}`
  );
}

export interface CreateClauseParams {
  product_id: number | string;
  clause_code: string;
  title: string;
  purpose_description?: string;
  clause_wording?: string;
  clause_type: string; // "clause" | "exclusion" | "warranty"
  show_type: string; // "optional" | "mandatory"
  pricing_type: string; // e.g. "discount" | "loading"
  pricing_value: number;
}

export type CreateClauseResponse = ClauseDTO;

export async function createCewsClause(
  insurerId: number | string,
  productId: number | string,
  body: CreateClauseParams
): Promise<CreateClauseResponse> {
  return apiPost<CreateClauseResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/clauses`,
    body
  );
}

export interface UpdateClauseParams {
  title?: string;
  purpose_description?: string;
  clause_wording?: string;
  clause_type?: string; // EXCLUSION | WARRANTY | CLAUSE (case as expected by backend)
  show_type?: string; // OPTIONAL | MANDATORY
  pricing_type?: string; // Fixed | Percentage | discount/loading depending on backend
  pricing_value?: number | string;
  display_order?: number;
  is_active?: boolean | number;
}

export type UpdateClauseResponse = ClauseDTO;

export async function updateCewsClause(
  insurerId: number | string,
  productId: number | string,
  clauseProductId: number | string,
  body: UpdateClauseParams
): Promise<UpdateClauseResponse> {
  return apiPatch<UpdateClauseResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/clauses/${encodeURIComponent(String(clauseProductId))}`,
    body
  );
}


// Project Risk Factors
export type RiskPricingEnum = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type RiskQuoteOptionEnum = 'AUTO_QUOTE' | 'NO_QUOTE' | 'QUOTE_AND_REFER';

export interface ProjectRiskDurationItem {
  from_months: number;
  to_months: number | null;
  pricing_type: RiskPricingEnum;
  loading_discount: number;
  quote_option: RiskQuoteOptionEnum;
}

export interface ProjectRiskLocationFactorRow {
  factor: string;
  low_risk: string;
  moderate_risk: string;
  high_risk: string;
  very_high_risk: string;
}

export interface ProjectRiskHazardRateItem {
  risk_level: string; // e.g., "Low Risk"
  pricing_type: RiskPricingEnum;
  loading_discount: number;
  quote_option: RiskQuoteOptionEnum;
}

export interface ProjectRiskFactorsRequest {
  project_risk_factors: {
    project_duration_loadings: ProjectRiskDurationItem[];
    maintenance_period_loadings: ProjectRiskDurationItem[];
    location_hazard_loadings: {
      risk_definition: { factors: ProjectRiskLocationFactorRow[] };
      location_hazard_rates: ProjectRiskHazardRateItem[];
    };
  };
}

export interface ProjectRiskFactorsResponse {
  message?: string;
  data?: any;
}

export async function getProjectRiskFactors(
  insurerId: number | string,
  productId: number | string
): Promise<ProjectRiskFactorsResponse> {
  return apiGet<ProjectRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/project-risk-factors`,
    {
      // Avoid 304/empty body from intermediate caches
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      params: { _ts: Date.now() },
    }
  );
}

export async function createProjectRiskFactors(
  insurerId: number | string,
  productId: number | string,
  body: ProjectRiskFactorsRequest
): Promise<ProjectRiskFactorsResponse> {
  return apiPost<ProjectRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/project-risk-factors`,
    body
  );
}

export async function updateProjectRiskFactors(
  insurerId: number | string,
  productId: number | string,
  body: ProjectRiskFactorsRequest
): Promise<ProjectRiskFactorsResponse> {
  return apiPatch<ProjectRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/project-risk-factors`,
    body
  );
}

// Contractor Risk Factors
export interface ContractorRiskFactorsResponse {
  message?: string;
  data?: any;
}

export async function getContractorRiskFactors(
  insurerId: number | string,
  productId: number | string
): Promise<ContractorRiskFactorsResponse> {
  return apiGet<ContractorRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contractor-risk-factors`,
    {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      params: { _ts: Date.now() },
    }
  );
}

// Contractor Risk Factors save interfaces
export interface ContractorRiskFactorsRequest {
  insurer_id?: number;
  contractor_risk_factors: {
    experience_loadings: Array<{
      from_years: number;
      to_years: number;
      pricing_type: string;
      loading_discount: number;
      quote_option: string;
    }>;
    claims_based_loadings: Array<{
      from_claims: number;
      to_claims: number;
      pricing_type: string;
      loading_discount: number;
      quote_option: string;
    }>;
    claim_amount_categories?: Array<{
      from_amount: number;
      to_amount: number;
      pricing_type: string;
      loading_discount: number;
      currency: string;
      quote_option: string;
    }>;
    contractor_number_based?: Array<{
      from_contractors: number;
      to_contractors: number;
      pricing_type: string;
      loading_discount: number;
      quote_option: string;
    }>;
    subcontractor_number_based?: Array<{
      from_subcontractors: number;
      to_subcontractors: number;
      pricing_type: string;
      loading_discount: number;
      quote_option: string;
    }>;
  };
}

export async function createContractorRiskFactors(
  insurerId: number | string,
  productId: number | string,
  body: ContractorRiskFactorsRequest
): Promise<ContractorRiskFactorsResponse> {
  return apiPost<ContractorRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contractor-risk-factors`,
    body
  );
}

export async function updateContractorRiskFactors(
  insurerId: number | string,
  productId: number | string,
  body: ContractorRiskFactorsRequest
): Promise<ContractorRiskFactorsResponse> {
  return apiPatch<ContractorRiskFactorsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contractor-risk-factors`,
    body
  );
}

