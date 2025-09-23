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

// Minimum Premiums - Same structure as Base Rates but with minimum_premiums endpoint
export interface SaveMinimumPremiumsRequestItem {
  project_type: string;
  sub_projects: BaseRateSubProjectRequest[];
}

export interface SaveMinimumPremiumsRequest {
  minimum_premium_rates: SaveMinimumPremiumsRequestItem[];
}

export interface SaveMinimumPremiumsResponse { message?: string }

export async function saveMinimumPremiums(
  insurerId: number | string,
  productId: number | string,
  body: SaveMinimumPremiumsRequest
): Promise<SaveMinimumPremiumsResponse> {
  return apiPost<SaveMinimumPremiumsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/minimum-premium-rates`,
    body
  );
}

export async function updateMinimumPremiums(
  insurerId: number | string,
  productId: number | string,
  body: SaveMinimumPremiumsRequest
): Promise<SaveMinimumPremiumsResponse> {
  return apiPatch<SaveMinimumPremiumsResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/minimum-premium-rates`,
    body
  );
}

// Get Minimum Premiums
export interface GetMinimumPremiumsItemSubProject {
  name: string;
  currency: 'AED' | '%';
  base_rate: number;
  pricing_type: PricingTypeEnum;
  quote_option: QuoteOptionEnum;
}

export interface GetMinimumPremiumsItem {
  project_type: string;
  sub_projects: GetMinimumPremiumsItemSubProject[];
}

export type GetMinimumPremiumsResponse = GetMinimumPremiumsItem[];

export async function getMinimumPremiums(
  insurerId: number | string,
  productId: number | string
): Promise<GetMinimumPremiumsResponse> {
  try {
    console.log(`[getMinimumPremiums] Making API call for insurer ${insurerId}, product ${productId}`);
    const result = await apiGet<any>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/minimum-premium-rates`
    );
    console.log('[getMinimumPremiums] API call successful:', result);
    
    // The API returns an object with minimum_premium_rates property
    if (result && result.minimum_premium_rates && Array.isArray(result.minimum_premium_rates)) {
      console.log('[getMinimumPremiums] Returning minimum_premium_rates array:', result.minimum_premium_rates);
      return result.minimum_premium_rates;
    }
    
    console.log('[getMinimumPremiums] No minimum_premium_rates found, returning empty array');
    return [];
  } catch (error: any) {
    console.log('[getMinimumPremiums] API call failed:', error);
    // Handle 204 (No Content) as success - return empty array
    if (error?.status === 204) {
      console.log('[getMinimumPremiums] API returned 204 (No Content) - returning empty array');
      return [];
    }
    // Re-throw other errors
    throw error;
  }
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

export async function getSecurityTypesConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetSecurityTypesResponse> {
  const ts = Date.now();
  return apiGet<GetSecurityTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/security-types?t=${ts}`
  );
}

export async function createSecurityTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveSecurityTypesRequest
): Promise<SaveSecurityTypesResponse> {
  return apiPost<SaveSecurityTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/security-types`,
    body
  );
}

export async function updateSecurityTypesConfiguration(
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

export async function getAreaTypesConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetAreaTypesResponse> {
  const ts = Date.now();
  return apiGet<GetAreaTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/area-types?t=${ts}`
  );
}

export async function createAreaTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveAreaTypesRequest
): Promise<SaveAreaTypesResponse> {
  return apiPost<SaveAreaTypesResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/area-types`,
    body
  );
}

export async function updateAreaTypesConfiguration(
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
  label: string;
  url: string; // Direct URL for downloading the document
  is_active: boolean;
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
  label: string; // e.g. "Professional Liability Policy Wording v2.1"
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
  form.append('label', params.label);
  form.append('is_active', params.is_active);
  form.append('document', params.document);

  return apiPost<UploadPolicyWordingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/policy-wordings`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

// New JSON-based Policy Wordings API
export interface PolicyWordingRequest {
  wordings: Array<{
    label: string;
    url: string;
    is_active: boolean;
  }>;
}

export interface PolicyWordingResponse {
  wordings: PolicyWording[];
}

export async function savePolicyWordings(
  insurerId: number | string,
  productId: number | string,
  params: PolicyWordingRequest
): Promise<PolicyWordingResponse> {
  return apiPost<PolicyWordingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/policy-wordings`,
    params
  );
}

// Update Policy Wording (multipart/form-data, all fields optional)
export interface UpdatePolicyWordingParams {
  label?: string;
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
  if (typeof params.label === 'string') form.append('label', params.label);
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
  contact_info: {
    phone: string;
    email: string;
    website: string;
  };
  header_bg_color: string;
  header_text_color: string;
  logo_position: string; // LEFT | CENTER | RIGHT
  url: string; // logo URL
  show_project_details: boolean;
  show_coverage_types: boolean;
  show_coverage_limits: boolean;
  show_deductibles: boolean;
  show_contractor_info: boolean;
  risk_section_title: string;
  show_base_premium: boolean;
  show_risk_adjustments: boolean;
  show_fees_charges: boolean;
  show_taxes_vat: boolean;
  show_total_premium: boolean;
  premium_section_title: string;
  premium_currency: string;
  show_warranties: boolean;
  show_exclusions: boolean;
  show_deductible_details: boolean;
  show_policy_conditions: boolean;
  terms_section_title: string;
  additional_terms_text: string;
  show_signature_block: boolean;
  authorized_signatory_name: string;
  signatory_title: string;
  signature_block_text: string;
  show_footer: boolean;
  show_general_disclaimer: boolean;
  general_disclaimer_text: string;
  show_regulatory_info: boolean;
  regulatory_info_text: string;
  footer_bg_color: string;
  footer_text_color: string;
}

export async function createQuoteFormat(
  insurerId: number | string,
  productId: number | string,
  params: SaveQuoteFormatParams
): Promise<SaveQuoteFormatResponse> {
  return apiPost<SaveQuoteFormatResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-format`,
    params
  );
}

export async function updateQuoteFormat(
  insurerId: number | string,
  productId: number | string,
  params: Partial<SaveQuoteFormatParams>
): Promise<SaveQuoteFormatResponse> {
  return apiPatch<SaveQuoteFormatResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-format`,
    params
  );
}

// Required Documents
export interface RequiredDocumentDTO {
  id: number;
  product_id: number;
  display_order: number;
  label: string; // Updated from display_label to match new API
  display_label?: string; // Keep for backward compatibility
  description: string | null;
  is_required: boolean;
  status: string; // 'active' | 'inactive'
  url: string | null; // Updated from template_file_url to match new API
  template_file_url?: string | null; // Keep for backward compatibility
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

export interface UpdateRequiredDocumentParams {
  display_label?: string;
  description?: string;
  is_required?: boolean;
  status?: string; // 'active' | 'inactive'
}

export interface UpdateRequiredDocumentResponse {
  message: string;
  document: {
    id: number;
    product_id: number;
    display_order: number;
    display_label: string;
    description: string;
    is_required: number; // 0 or 1
    template_file: string | null;
    status: string; // 'ACTIVE' | 'INACTIVE'
    created_at: string;
    updated_at: string;
    insurer_id: number;
  };
}

export async function updateRequiredDocument(
  insurerId: number | string,
  productId: number | string,
  documentId: number | string,
  params: UpdateRequiredDocumentParams
): Promise<UpdateRequiredDocumentResponse> {
  return apiPatch<UpdateRequiredDocumentResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/required-documents/${encodeURIComponent(String(documentId))}`,
    params
  );
}

// Broker Product Assignments
export interface UpdateBrokerProductAssignmentsParams {
  assigned_product_ids: number[];
}

export interface UpdateBrokerProductAssignmentsResponse {
  message: string;
  insurer_id: number;
  broker_id: number;
  assigned_product_ids: number[];
  skipped_product_ids: number[];
}

export async function updateBrokerProductAssignments(
  insurerId: number | string,
  brokerId: number | string,
  params: UpdateBrokerProductAssignmentsParams
): Promise<UpdateBrokerProductAssignmentsResponse> {
  return apiPut<UpdateBrokerProductAssignmentsResponse>(
    `/insurer/${encodeURIComponent(String(brokerId))}/products?insurer_id=${encodeURIComponent(String(insurerId))}`,
    params
  );
}

// Insurer Dashboard
export interface DashboardQuoteRequest {
  id: number;
  quote_id: string;
  broker_id: number;
  insurer_id: number | null;
  project_id: number;
  base_premium: string;
  total_premium: string;
  status: string;
  validity_date: string;
  created_at: string;
  updated_at: string;
  project_name: string;
  client_name: string;
  broker_name: string;
}

export interface GetInsurerDashboardResponse {
  totalQuotes: number;
  totalPolicies: number;
  totalValue: number;
  quoteRequests: DashboardQuoteRequest[];
}

export async function getInsurerDashboard(): Promise<GetInsurerDashboardResponse> {
  return apiGet<GetInsurerDashboardResponse>(`/insurer/dashboard/quotes`);
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

// Clause Pricing Configuration - Updated to match API response
export interface ClausePricingOptionResponse {
  type: 'PERCENTAGE' | 'CURRENCY';
  label: string;
  limit: string;
  value: number;
  currency: string;
  display_order: number;
}

export interface ClausePricingItemResponse {
  id: number;
  product_id: number;
  clause_code: string;
  is_enabled: number; // 0 or 1
  is_mandatory: number; // 0 or 1
  base_type: 'PERCENTAGE' | 'CURRENCY';
  base_value: string;
  base_currency: string;
  options: ClausePricingOptionResponse[];
  created_at: string;
  updated_at: string;
  insurer_id: number;
}

// Request interfaces for saving
export interface ClausePricingOption {
  label: string;
  limit: string;
  type: '%' | 'AED';
  value: number;
  currency?: string;
}

export interface ClausePricingBase {
  type: '%' | 'AED';
  value: number;
  currency?: string;
}

export interface ClausePricingItem {
  clause_code: string;
  is_enabled: boolean;
  is_mandatory?: boolean;
  base: ClausePricingBase;
  options: ClausePricingOption[];
}

export interface SaveClausePricingRequest {
  clauses: ClausePricingClauseRequest[];
}

export interface ClausePricingClauseRequest {
  clause_code: string;
  title: string;
  clause_type: 'CLAUSE' | 'WARRANTY' | 'EXCLUSION';
  show_type: 'MANDATORY' | 'OPTIONAL';
  display_order: number;
  is_active: boolean;
  pricing: {
    is_enabled: boolean;
    pricing_type: 'PERCENTAGE' | 'CURRENCY';
    pricing_value: number;
    base_currency: string;
    options: {
      label: string;
      limit: string;
      type: 'PERCENTAGE' | 'CURRENCY';
      value: number;
      display_order: number;
    }[];
  };
}

export interface GetClausePricingResponse {
  clause_pricing: ClausePricingItem[];
}

// Get clause pricing (separate from metadata)
export interface GetClausePricingDataResponse {
  clauses: ClausePricingClauseResponse[];
}

export interface ClausePricingClauseResponse {
  clause_code: string;
  pricing: {
    is_enabled: boolean;
    pricing_type: 'PERCENTAGE' | 'CURRENCY';
    pricing_value: number;
    base_currency: string;
    options: {
      type: 'PERCENTAGE' | 'CURRENCY';
      label: string;
      limit: string;
      value: number;
      currency: string;
      display_order: number;
    }[];
  };
  created_at: string;
  updated_at: string;
}

export async function getClausePricing(
  insurerId: number | string,
  productId: number | string
): Promise<GetClausePricingDataResponse> {
  const ts = Date.now();
  return apiGet<GetClausePricingDataResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/pricing_clauses?t=${ts}`
  );
}

// Keep the old interface for backward compatibility
export interface GetClausePricingResponse {
  clause_pricing: ClausePricingItem[];
}

export interface SaveClausePricingResponse {
  message: string;
  clauses: ClausePricingClauseResponse[];
}

export async function saveClausePricing(
  insurerId: number | string,
  productId: number | string,
  body: SaveClausePricingRequest
): Promise<SaveClausePricingResponse> {
  return apiPost<SaveClausePricingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/pricing_clauses`,
    body
  );
}

export interface UpdateClausePricingRequest {
  clause_code?: number;
  items: ClausePricingItem[];
}

export interface UpdateClausePricingResponse {
  message: string;
  data: {
    clause_pricing: ClausePricingItem[];
  };
}

export async function updateClausePricing(
  insurerId: number | string,
  productId: number | string,
  body: UpdateClausePricingRequest
): Promise<UpdateClausePricingResponse> {
  return apiPatch<UpdateClausePricingResponse>(
    `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/pricing_clauses`,
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

export interface ProjectRiskFactorsUpdateRequest {
  insurer_id: number;
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
  body: ProjectRiskFactorsUpdateRequest
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

// Coverage Options & Extensions API
export interface CoverageOptionLoading {
  currency: string;
  to_amount: number;
  from_amount: number;
  pricing_type: 'PERCENTAGE' | 'AMOUNT';
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE';
  loading_discount: number;
}

export interface CrossLiabilityCover {
  cover_option: string;
  pricing_type: 'PERCENTAGE' | 'AMOUNT';
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE';
  loading_discount: number;
}

export interface CoverageOptionsResponse {
  sum_insured_loadings: CoverageOptionLoading[];
  cross_liability_cover: CrossLiabilityCover[];
  project_value_loadings: CoverageOptionLoading[];
  contract_works_loadings: CoverageOptionLoading[];
  plant_equipment_loadings: CoverageOptionLoading[];
  temporay_work?: CoverageOptionLoading[];
  other_materials?: CoverageOptionLoading[];
  Principal_Existing_Surrounding_Property?: CoverageOptionLoading[];
}

export async function getCoverageOptions(insurerId: number | string, productId: number | string): Promise<CoverageOptionsResponse> {
  return apiGet<CoverageOptionsResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/coverage-options`);
}

// POST Coverage Options interfaces
export interface SaveCoverageOptionsRequest {
  coverage_options: {
    sum_insured_loadings: CoverageOptionLoading[];
    project_value_loadings: CoverageOptionLoading[];
    contract_works_loadings: CoverageOptionLoading[];
    plant_equipment_loadings: CoverageOptionLoading[];
    temporay_work?: CoverageOptionLoading[];
    other_materials?: CoverageOptionLoading[];
    Principal_Existing_Surrounding_Property?: CoverageOptionLoading[];
    cross_liability_cover: CrossLiabilityCover[];
  };
}

export interface SaveCoverageOptionsResponse {
  message: string;
  coverage_options: {
    sum_insured_loadings: CoverageOptionLoading[];
    project_value_loadings: CoverageOptionLoading[];
    contract_works_loadings: CoverageOptionLoading[];
    plant_equipment_loadings: CoverageOptionLoading[];
    cross_liability_cover: CrossLiabilityCover[];
  };
}

export async function saveCoverageOptions(
  insurerId: number | string, 
  productId: number | string, 
  data: SaveCoverageOptionsRequest
): Promise<SaveCoverageOptionsResponse> {
  return apiPost<SaveCoverageOptionsResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/coverage-options`, data);
}

// PATCH Coverage Options interfaces
export interface UpdateCoverageOptionsRequest {
  insurer_id: number;
  coverage_options: {
    sum_insured_loadings: Omit<CoverageOptionLoading, 'currency'>[];
    project_value_loadings: Omit<CoverageOptionLoading, 'currency'>[];
    contract_works_loadings?: Omit<CoverageOptionLoading, 'currency'>[];
    plant_equipment_loadings?: Omit<CoverageOptionLoading, 'currency'>[];
    temporay_work?: Omit<CoverageOptionLoading, 'currency'>[];
    other_materials?: Omit<CoverageOptionLoading, 'currency'>[];
    Principal_Existing_Surrounding_Property?: Omit<CoverageOptionLoading, 'currency'>[];
    cross_liability_cover?: CrossLiabilityCover[];
  };
}

export interface UpdateCoverageOptionsResponse {
  message: string;
  data: {
    sum_insured_loadings: CoverageOptionLoading[];
    project_value_loadings: CoverageOptionLoading[];
    contract_works_loadings?: CoverageOptionLoading[];
    plant_equipment_loadings?: CoverageOptionLoading[];
    temporay_work?: CoverageOptionLoading[];
    other_materials?: CoverageOptionLoading[];
    Principal_Existing_Surrounding_Property?: CoverageOptionLoading[];
    cross_liability_cover?: CrossLiabilityCover[];
  };
}

export async function updateCoverageOptions(
  insurerId: number | string, 
  productId: number | string, 
  data: UpdateCoverageOptionsRequest
): Promise<UpdateCoverageOptionsResponse> {
  return apiPatch<UpdateCoverageOptionsResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/coverage-options`, data);
}

// Policy Limits & Deductibles interfaces
export interface SubLimit {
  title: string;
  value: number;
  description: string;
  pricing_type: 'PERCENTAGE_OF_SUM_INSURED' | 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS';
}

export interface Deductible {
  type: 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS' | 'PERCENTAGE_OF_SUM_INSURED';
  value: number;
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE';
  loading_discount: number;
}

export interface PolicyLimit {
  value: number;
  pricing_type: 'FIXED_AMOUNT' | 'PERCENTAGE';
}

export interface PolicyLimitsResponse {
  sub_limits: SubLimit[];
  deductibles: Deductible[];
  policy_limits: {
    maximum_cover: PolicyLimit;
    minimum_premium: PolicyLimit;
    base_broker_commission: PolicyLimit;
    maximum_broker_commission: PolicyLimit;
    minimum_broker_commission: PolicyLimit;
  };
}

export async function getPolicyLimits(
  insurerId: number | string, 
  productId: number | string
): Promise<PolicyLimitsResponse> {
  return apiGet<PolicyLimitsResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/policy-limits`);
}

// POST Policy Limits interfaces
export interface SavePolicyLimitItem {
  pricing_type: 'FIXED_AMOUNT' | 'PERCENTAGE';
  value: number;
}

export interface SaveSubLimit {
  title: string;
  description: string;
  pricing_type: 'PERCENTAGE_OF_SUM_INSURED' | 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS';
  value: number;
}

export interface SaveDeductible {
  type: 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS' | 'PERCENTAGE_OF_SUM_INSURED';
  value: number;
  loading_discount: number;
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE';
}

export interface SavePolicyLimitsRequest {
  policy_limits_and_deductible: {
    policy_limits: {
      minimum_premium: SavePolicyLimitItem;
      maximum_cover: SavePolicyLimitItem;
      base_broker_commission: SavePolicyLimitItem;
      minimum_broker_commission: SavePolicyLimitItem;
      maximum_broker_commission: SavePolicyLimitItem;
    };
    sub_limits: SaveSubLimit[];
    deductibles: SaveDeductible[];
  };
}

export interface SavePolicyLimitsResponse {
  message: string;
  policy_limits_and_deductible: {
    policy_limits: {
      minimum_premium: SavePolicyLimitItem;
      maximum_cover: SavePolicyLimitItem;
      base_broker_commission: SavePolicyLimitItem;
      minimum_broker_commission: SavePolicyLimitItem;
      maximum_broker_commission: SavePolicyLimitItem;
    };
    sub_limits: SaveSubLimit[];
    deductibles: SaveDeductible[];
  };
}

export async function savePolicyLimits(
  insurerId: number | string, 
  productId: number | string, 
  data: SavePolicyLimitsRequest
): Promise<SavePolicyLimitsResponse> {
  return apiPost<SavePolicyLimitsResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/policy-limits`, data);
}

// PATCH Policy Limits interfaces
export interface UpdatePolicyLimitItem {
  pricing_type: 'FIXED_AMOUNT' | 'PERCENTAGE';
  value: number;
}

export interface UpdateSubLimit {
  title: string;
  description: string;
  pricing_type: 'PERCENTAGE_OF_SUM_INSURED' | 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS';
  value: number;
}

export interface UpdateDeductible {
  type: 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS' | 'PERCENTAGE_OF_SUM_INSURED';
  value: number;
  loading_discount: number;
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE';
}

export interface UpdatePolicyLimitsRequest {
  policy_limits_and_deductible: {
    policy_limits: {
      minimum_premium: UpdatePolicyLimitItem;
      maximum_cover: UpdatePolicyLimitItem;
      base_broker_commission: UpdatePolicyLimitItem;
      minimum_broker_commission: UpdatePolicyLimitItem;
      maximum_broker_commission: UpdatePolicyLimitItem;
    };
    sub_limits: UpdateSubLimit[];
    deductibles: UpdateDeductible[];
  };
}

export interface UpdatePolicyLimitsResponse {
  message: string;
  data: {
    policy_limits: {
      minimum_premium: UpdatePolicyLimitItem;
      maximum_cover: UpdatePolicyLimitItem;
      base_broker_commission: UpdatePolicyLimitItem;
      minimum_broker_commission: UpdatePolicyLimitItem;
      maximum_broker_commission: UpdatePolicyLimitItem;
    };
    sub_limits: UpdateSubLimit[];
    deductibles: UpdateDeductible[];
  };
}

export async function updatePolicyLimits(
  insurerId: number | string, 
  productId: number | string, 
  data: UpdatePolicyLimitsRequest
): Promise<UpdatePolicyLimitsResponse> {
  return apiPatch<UpdatePolicyLimitsResponse>(`/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/policy-limits`, data);
}

// ===== QUOTE COVERAGE API FUNCTIONS =====

export interface SaveQuoteCoverageRequest {
  product_id: number;
  validity_days: number;
  backdate_days: number;
  operating_countries: string[];
  operating_regions: string[];
  operating_zones: string[];
}

export interface SaveQuoteCoverageResponse {
  message: string;
}

export interface UpdateQuoteCoverageResponse {
  message: string;
  data: {
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
  };
}

// POST - Create new quote coverage configuration
export async function saveQuoteCoverage(
  insurerId: number | string,
  productId: number | string,
  data: SaveQuoteCoverageRequest
): Promise<SaveQuoteCoverageResponse> {
  console.log('🚀 POST Quote Coverage API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-config`,
    payload: data
  });
  
  try {
    const response = await apiPost<SaveQuoteCoverageResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-config`, 
      data
    );
    console.log('✅ POST Quote Coverage Success:', response);
    return response;
  } catch (error: any) {
    console.error('❌ POST Quote Coverage Failed:', error);
    
    // Handle specific error codes
    const status = error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid quote coverage data provided');
    } else if (status === 401) {
      throw new Error('Authentication required to save quote coverage');
    } else if (status === 403) {
      throw new Error('You do not have permission to save quote coverage');
    } else if (status === 500) {
      throw new Error('Server error occurred while saving quote coverage');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to save quote coverage');
  }
}

// PATCH - Update existing quote coverage configuration
export async function updateQuoteCoverage(
  insurerId: number | string,
  productId: number | string,
  data: SaveQuoteCoverageRequest
): Promise<UpdateQuoteCoverageResponse> {
  console.log('🔄 PATCH Quote Coverage API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-config`,
    payload: data
  });
  
  try {
    const response = await apiPatch<UpdateQuoteCoverageResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/quote-config`, 
      data
    );
    console.log('✅ PATCH Quote Coverage Success:', response);
    return response;
  } catch (error: any) {
    console.error('❌ PATCH Quote Coverage Failed:', error);
    
    // Handle specific error codes
    const status = error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid quote coverage data provided');
    } else if (status === 401) {
      throw new Error('Authentication required to update quote coverage');
    } else if (status === 403) {
      throw new Error('You do not have permission to update quote coverage');
    } else if (status === 500) {
      throw new Error('Server error occurred while updating quote coverage');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to update quote coverage');
  }
}

// ===== CONSTRUCTION TYPES CONFIGURATION API =====

export interface ConstructionTypeConfigItem {
  name: string;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  value: number;
  quote_option: 'AUTO_QUOTE' | 'MANUAL_QUOTE' | 'NO_QUOTE';
  display_order: number;
  is_active: boolean;
}

export interface GetConstructionTypesConfigResponse {
  items: ConstructionTypeConfigItem[];
}

export interface SaveConstructionTypesConfigRequest {
  construction_types_config: {
    items: ConstructionTypeConfigItem[];
  };
}

export interface SaveConstructionTypesConfigResponse {
  message: string;
  data: {
    items: ConstructionTypeConfigItem[];
  };
}

// Countries Configuration
export interface CountryConfigItem {
  value: number;
  country?: string;
  name?: string; // Some items use 'name' instead of 'country'
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
}

export interface GetCountriesConfigResponse {
  items: CountryConfigItem[];
}

export interface SaveCountriesConfigRequest {
  countries_config: {
    items: {
      country?: string;
      name?: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
    }[];
  };
}

export interface SaveCountriesConfigResponse {
  message: string;
  data: {
    items: CountryConfigItem[];
  };
}

// Regions Configuration
export interface RegionConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetRegionsConfigResponse {
  items: RegionConfigItem[];
}

export interface SaveRegionsConfigRequest {
  regions_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveRegionsConfigResponse {
  message: string;
  data: {
    items: RegionConfigItem[];
  };
}

// Zones Configuration
export interface ZoneConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetZonesConfigResponse {
  items: ZoneConfigItem[];
}

export interface SaveZonesConfigRequest {
  zones_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveZonesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// Contract Types Configuration
export interface ContractTypeConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetContractTypesConfigResponse {
  items: ContractTypeConfigItem[];
}

export interface SaveContractTypesConfigRequest {
  contract_types_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveContractTypesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// Role Types Configuration
export interface RoleTypeConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetRoleTypesConfigResponse {
  items: RoleTypeConfigItem[];
}

export interface SaveRoleTypesConfigRequest {
  role_types_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveRoleTypesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// Soil Types Configuration
export interface SoilTypeConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetSoilTypesConfigResponse {
  items: SoilTypeConfigItem[];
}

export interface SaveSoilTypesConfigRequest {
  soil_types_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveSoilTypesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// Subcontractor Types Configuration
export interface SubcontractorTypeConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetSubcontractorTypesConfigResponse {
  items: SubcontractorTypeConfigItem[];
}

export interface SaveSubcontractorTypesConfigRequest {
  subcontractor_types_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveSubcontractorTypesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// GET - Fetch subcontractor types configuration for insurer
export async function getSubcontractorTypesConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetSubcontractorTypesConfigResponse> {
  console.log('🔍 GET Subcontractor Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/subcontractor-types`,
    insurerId,
    productId
  });
  
  try {
    const response = await apiGet<GetSubcontractorTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/subcontractor-types`
    );
    
    console.log('✅ Subcontractor Types Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Subcontractor Types Configuration Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching subcontractor types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to subcontractor types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching subcontractor types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch subcontractor types configuration.');
    }
  }
}

// POST - Create subcontractor types configuration for insurer
export async function createSubcontractorTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveSubcontractorTypesConfigRequest
): Promise<SaveSubcontractorTypesConfigResponse> {
  console.log('🔍 POST Subcontractor Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/subcontractor-types`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPost<SaveSubcontractorTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/subcontractor-types`,
      data
    );
    
    console.log('✅ Subcontractor Types Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Subcontractor Types Configuration POST Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating subcontractor types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create subcontractor types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating subcontractor types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create subcontractor types configuration.');
    }
  }
}

// PATCH - Update subcontractor types configuration for insurer
export async function updateSubcontractorTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveSubcontractorTypesConfigRequest
): Promise<SaveSubcontractorTypesConfigResponse> {
  console.log('🔍 PATCH Subcontractor Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/subcontractor-types`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPatch<SaveSubcontractorTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/subcontractor-types`,
      data
    );
    
    console.log('✅ Subcontractor Types Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Subcontractor Types Configuration PATCH Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating subcontractor types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update subcontractor types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating subcontractor types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update subcontractor types configuration.');
    }
  }
}

// Consultant Roles Configuration interfaces
export interface ConsultantRoleConfigItem {
  name: string;
  value: number;
  is_active: boolean;
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
  display_order: number;
}

export interface GetConsultantRolesConfigResponse {
  items: ConsultantRoleConfigItem[];
}

export interface SaveConsultantRolesConfigRequest {
  consultant_roles_config: {
    items: {
      name: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
      is_active: boolean;
    }[];
  };
}

export interface SaveConsultantRolesConfigResponse {
  message: string;
  data: {
    items: {
      name: string;
      value: number;
      is_active: boolean;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      quote_option: 'AUTO_QUOTE' | 'NO_QUOTE';
      display_order: number;
    }[];
  };
}

// GET - Fetch consultant roles configuration for insurer
export async function getConsultantRolesConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetConsultantRolesConfigResponse> {
  console.log('🔍 GET Consultant Roles Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/consultant-roles`,
    insurerId,
    productId
  });
  
  try {
    const response = await apiGet<GetConsultantRolesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/consultant-roles`
    );
    
    console.log('✅ Consultant Roles Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Consultant Roles Configuration Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching consultant roles configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to consultant roles configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching consultant roles configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch consultant roles configuration.');
    }
  }
}

// POST - Create consultant roles configuration for insurer
export async function createConsultantRolesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveConsultantRolesConfigRequest
): Promise<SaveConsultantRolesConfigResponse> {
  console.log('🔍 POST Consultant Roles Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/consultant-roles`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPost<SaveConsultantRolesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/consultant-roles`,
      data
    );
    
    console.log('✅ Consultant Roles Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Consultant Roles Configuration POST Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating consultant roles configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create consultant roles configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating consultant roles configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create consultant roles configuration.');
    }
  }
}

// PATCH - Update consultant roles configuration for insurer
export async function updateConsultantRolesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveConsultantRolesConfigRequest
): Promise<SaveConsultantRolesConfigResponse> {
  console.log('🔍 PATCH Consultant Roles Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/consultant-roles`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPatch<SaveConsultantRolesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/consultant-roles`,
      data
    );
    
    console.log('✅ Consultant Roles Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Consultant Roles Configuration PATCH Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating consultant roles configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update consultant roles configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating consultant roles configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update consultant roles configuration.');
    }
  }
}

// GET - Fetch soil types configuration for insurer
export async function getSoilTypesConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetSoilTypesConfigResponse> {
  console.log('🔍 GET Soil Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/soil-types`,
    insurerId,
    productId
  });
  
  try {
    const response = await apiGet<GetSoilTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/soil-types`
    );
    
    console.log('✅ Soil Types Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Soil Types Configuration Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching soil types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to soil types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching soil types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch soil types configuration.');
    }
  }
}

// POST - Create soil types configuration for insurer
export async function createSoilTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveSoilTypesConfigRequest
): Promise<SaveSoilTypesConfigResponse> {
  console.log('🔍 POST Soil Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/soil-types`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPost<SaveSoilTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/soil-types`,
      data
    );
    
    console.log('✅ Soil Types Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Soil Types Configuration POST Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating soil types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create soil types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating soil types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create soil types configuration.');
    }
  }
}

// PATCH - Update soil types configuration for insurer
export async function updateSoilTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveSoilTypesConfigRequest
): Promise<SaveSoilTypesConfigResponse> {
  console.log('🔍 PATCH Soil Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/soil-types`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPatch<SaveSoilTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/soil-types`,
      data
    );
    
    console.log('✅ Soil Types Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Soil Types Configuration PATCH Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating soil types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update soil types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating soil types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update soil types configuration.');
    }
  }
}

// GET - Fetch role types configuration for insurer
export async function getRoleTypesConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetRoleTypesConfigResponse> {
  console.log('🔍 GET Role Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/role-types`,
    insurerId,
    productId
  });
  
  try {
    const response = await apiGet<GetRoleTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/role-types`
    );
    
    console.log('✅ Role Types Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Role Types Configuration Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching role types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to role types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching role types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch role types configuration.');
    }
  }
}

// POST - Create role types configuration for insurer
export async function createRoleTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveRoleTypesConfigRequest
): Promise<SaveRoleTypesConfigResponse> {
  console.log('🔍 POST Role Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/role-types`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPost<SaveRoleTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/role-types`,
      data
    );
    
    console.log('✅ Role Types Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Role Types Configuration POST Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating role types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create role types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating role types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create role types configuration.');
    }
  }
}

// PATCH - Update role types configuration for insurer
export async function updateRoleTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveRoleTypesConfigRequest
): Promise<SaveRoleTypesConfigResponse> {
  console.log('🔍 PATCH Role Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/role-types`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPatch<SaveRoleTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/role-types`,
      data
    );
    
    console.log('✅ Role Types Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Role Types Configuration PATCH Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating role types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update role types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating role types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update role types configuration.');
    }
  }
}

// GET - Fetch contract types configuration for insurer
export async function getContractTypesConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetContractTypesConfigResponse> {
  console.log('🔍 GET Contract Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contract-types`,
    insurerId,
    productId
  });
  
  try {
    const response = await apiGet<GetContractTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contract-types`
    );
    
    console.log('✅ Contract Types Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Contract Types Configuration Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching contract types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to contract types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching contract types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch contract types configuration.');
    }
  }
}

// POST - Create contract types configuration for insurer
export async function createContractTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveContractTypesConfigRequest
): Promise<SaveContractTypesConfigResponse> {
  console.log('🔍 POST Contract Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contract-types`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPost<SaveContractTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contract-types`,
      data
    );
    
    console.log('✅ Contract Types Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Contract Types Configuration POST Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating contract types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create contract types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating contract types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create contract types configuration.');
    }
  }
}

// PATCH - Update contract types configuration for insurer
export async function updateContractTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveContractTypesConfigRequest
): Promise<SaveContractTypesConfigResponse> {
  console.log('🔍 PATCH Contract Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contract-types`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPatch<SaveContractTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/contract-types`,
      data
    );
    
    console.log('✅ Contract Types Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Contract Types Configuration PATCH Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating contract types configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update contract types configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating contract types configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update contract types configuration.');
    }
  }
}

// GET - Fetch zones configuration for insurer
export async function getZonesConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetZonesConfigResponse> {
  console.log('🔍 GET Zones Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/zones`,
    insurerId,
    productId
  });
  
  try {
    const response = await apiGet<GetZonesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/zones`
    );
    
    console.log('✅ Zones Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Zones Configuration Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching zones configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to zones configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching zones configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch zones configuration.');
    }
  }
}

// POST - Create zones configuration for insurer
export async function createZonesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveZonesConfigRequest
): Promise<SaveZonesConfigResponse> {
  console.log('🔍 POST Zones Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/zones`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPost<SaveZonesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/zones`,
      data
    );
    
    console.log('✅ Zones Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Zones Configuration POST Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while creating zones configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create zones configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating zones configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create zones configuration.');
    }
  }
}

// PATCH - Update zones configuration for insurer
export async function updateZonesConfiguration(
  insurerId: number | string,
  productId: number | string,
  data: SaveZonesConfigRequest
): Promise<SaveZonesConfigResponse> {
  console.log('🔍 PATCH Zones Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/zones`,
    insurerId,
    productId,
    requestData: data
  });
  
  try {
    const response = await apiPatch<SaveZonesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/zones`,
      data
    );
    
    console.log('✅ Zones Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Zones Configuration PATCH Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while updating zones configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update zones configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating zones configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update zones configuration.');
    }
  }
}

// GET - Fetch regions configuration for insurer
export async function getRegionsConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetRegionsConfigResponse> {
  console.log('🔍 GET Regions Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/regions`,
    insurerId,
    productId
  });
  
  try {
    const response = await apiGet<GetRegionsConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/regions`
    );
    
    console.log('✅ Regions Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Regions Configuration Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching regions configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to regions configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching regions configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch regions configuration.');
    }
  }
}

// POST - Create regions configuration for insurer
export async function createRegionsConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveRegionsConfigRequest
): Promise<SaveRegionsConfigResponse> {
  console.log('🔍 POST Regions Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/regions`,
    insurerId,
    productId,
    body
  });
  
  try {
    const response = await apiPost<SaveRegionsConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/regions`,
      body
    );
    
    console.log('✅ Regions Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Regions Configuration POST Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid data while creating regions configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create regions configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating regions configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create regions configuration.');
    }
  }
}

// PATCH - Update regions configuration for insurer
export async function updateRegionsConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveRegionsConfigRequest
): Promise<SaveRegionsConfigResponse> {
  console.log('🔍 PATCH Regions Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/regions`,
    insurerId,
    productId,
    body
  });
  
  try {
    const response = await apiPatch<SaveRegionsConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/regions`,
      body
    );
    
    console.log('✅ Regions Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Regions Configuration PATCH Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid data while updating regions configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update regions configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating regions configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update regions configuration.');
    }
  }
}

// GET - Fetch countries configuration for insurer
export async function getCountriesConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetCountriesConfigResponse> {
  console.log('🔍 GET Countries Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/countries`,
    insurerId,
    productId
  });
  
  try {
    const response = await apiGet<GetCountriesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/countries`
    );
    
    console.log('✅ Countries Configuration Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Countries Configuration Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Bad request while fetching countries configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to countries configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while fetching countries configuration.');
    } else {
      throw new Error(error?.message || 'Failed to fetch countries configuration.');
    }
  }
}

// POST - Create countries configuration for insurer
export async function createCountriesConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveCountriesConfigRequest
): Promise<SaveCountriesConfigResponse> {
  console.log('🔍 POST Countries Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/countries`,
    insurerId,
    productId,
    body
  });
  
  try {
    const response = await apiPost<SaveCountriesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/countries`,
      body
    );
    
    console.log('✅ Countries Configuration POST Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Countries Configuration POST Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid data while creating countries configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to create countries configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while creating countries configuration.');
    } else {
      throw new Error(error?.message || 'Failed to create countries configuration.');
    }
  }
}

// PATCH - Update countries configuration for insurer
export async function updateCountriesConfiguration(
  insurerId: number | string,
  productId: number | string,
  body: SaveCountriesConfigRequest
): Promise<SaveCountriesConfigResponse> {
  console.log('🔍 PATCH Countries Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/countries`,
    insurerId,
    productId,
    body
  });
  
  try {
    const response = await apiPatch<SaveCountriesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/countries`,
      body
    );
    
    console.log('✅ Countries Configuration PATCH Response:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Countries Configuration PATCH Error:', error);
    
    const status = error?.status || error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid data while updating countries configuration.');
    } else if (status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    } else if (status === 403) {
      throw new Error('Forbidden. You do not have access to update countries configuration.');
    } else if (status >= 500) {
      throw new Error('Server error while updating countries configuration.');
    } else {
      throw new Error(error?.message || 'Failed to update countries configuration.');
    }
  }
}

// GET - Fetch construction types configuration for insurer
export async function getConstructionTypesConfiguration(
  insurerId: number | string,
  productId: number | string
): Promise<GetConstructionTypesConfigResponse> {
  console.log('🔍 GET Construction Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/construction-types`,
    insurerId,
    productId
  });
  
  try {
    const response = await apiGet<GetConstructionTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/construction-types`
    );
    console.log('✅ GET Construction Types Configuration Success:', response);
    return response;
  } catch (error: any) {
    console.error('❌ GET Construction Types Configuration Failed:', error);
    
    // Handle specific error codes
    const status = error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid request for construction types configuration');
    } else if (status === 401) {
      throw new Error('Authentication required to fetch construction types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to view construction types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while fetching construction types configuration');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch construction types configuration');
  }
}

// POST - Create construction types configuration for insurer
export async function createConstructionTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  configData: SaveConstructionTypesConfigRequest
): Promise<SaveConstructionTypesConfigResponse> {
  console.log('🔍 POST Construction Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/construction-types`,
    insurerId,
    productId,
    configData
  });
  
  try {
    const response = await apiPost<SaveConstructionTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/construction-types`,
      configData
    );
    console.log('✅ POST Construction Types Configuration Success:', response);
    return response;
  } catch (error: any) {
    console.error('❌ POST Construction Types Configuration Failed:', error);
    
    const status = error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid construction types configuration data');
    } else if (status === 401) {
      throw new Error('Authentication required to create construction types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to create construction types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while creating construction types configuration');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to create construction types configuration');
  }
}

// PATCH - Update construction types configuration for insurer
export async function updateConstructionTypesConfiguration(
  insurerId: number | string,
  productId: number | string,
  configData: SaveConstructionTypesConfigRequest
): Promise<SaveConstructionTypesConfigResponse> {
  console.log('🔍 PATCH Construction Types Configuration API Call:', {
    endpoint: `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/construction-types`,
    insurerId,
    productId,
    configData
  });
  
  try {
    const response = await apiPatch<SaveConstructionTypesConfigResponse>(
      `/insurers/${encodeURIComponent(String(insurerId))}/products/${encodeURIComponent(String(productId))}/construction-types`,
      configData
    );
    console.log('✅ PATCH Construction Types Configuration Success:', response);
    return response;
  } catch (error: any) {
    console.error('❌ PATCH Construction Types Configuration Failed:', error);
    
    const status = error?.response?.status;
    if (status === 400) {
      throw new Error('Invalid construction types configuration data');
    } else if (status === 401) {
      throw new Error('Authentication required to update construction types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to update construction types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while updating construction types configuration');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to update construction types configuration');
  }
}

// ===== FEE TYPES CONFIGURATION =====

// Fee Types Configuration Interfaces
export interface FeeTypeConfigItem {
  label: string;
  value: number;
  status: 'ACTIVE' | 'INACTIVE';
  pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
  display_order: number;
}

export interface GetFeeTypesConfigResponse {
  items: FeeTypeConfigItem[];
}

// Get Fee Types Configuration
export const getFeeTypesConfiguration = async (insurerId: string, productId: string): Promise<GetFeeTypesConfigResponse> => {
  console.log('🎯 === GET FEE TYPES CONFIGURATION STARTED ===');
  console.log('📋 Request params:', { insurerId, productId });
  
  try {
    console.log('🔍 Calling GET /fee-types API...');
    const response = await apiGet<GetFeeTypesConfigResponse>(`/insurers/${insurerId}/products/${productId}/fee-types`);
    
    console.log('✅ Fee Types Configuration API Response:', response);
    console.log('📊 Items count:', response?.items?.length || 0);
    
    if (response?.items) {
      console.log('📝 Fee types items:', response.items);
    }
    
    console.log('🎯 === GET FEE TYPES CONFIGURATION SUCCESS ===');
    return response;
    
  } catch (error: any) {
    console.error('❌ Error fetching fee types configuration:', error);
    
    const status = error?.status || error?.response?.status;
    console.error('📊 Error status:', status);
    console.error('📋 Error details:', error?.response?.data || error?.message);
    
    if (status === 400) {
      throw new Error('Bad request while loading fee types configuration');
    } else if (status === 401) {
      throw new Error('Authentication required to access fee types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to access fee types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while loading fee types configuration');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to load fee types configuration');
  }
};

// Save Fee Types Configuration Request/Response Interfaces
export interface SaveFeeTypesConfigRequest {
  fee_types_config: {
    items: {
      label: string;
      pricing_type: 'PERCENTAGE' | 'FIXED_RATE';
      value: number;
      status: 'ACTIVE' | 'INACTIVE';
      display_order: number;
    }[];
  };
}

export interface SaveFeeTypesConfigResponse {
  message: string;
  data: {
    items: FeeTypeConfigItem[];
  };
}

// Create Fee Types Configuration (POST)
export const createFeeTypesConfiguration = async (
  insurerId: string, 
  productId: string, 
  configData: SaveFeeTypesConfigRequest
): Promise<SaveFeeTypesConfigResponse> => {
  console.log('🎯 === CREATE FEE TYPES CONFIGURATION STARTED ===');
  console.log('📋 Request params:', { insurerId, productId });
  console.log('📝 Request data:', configData);
  
  try {
    console.log('🔍 Calling POST /fee-types API...');
    const response = await apiPost<SaveFeeTypesConfigResponse>(`/insurers/${insurerId}/products/${productId}/fee-types`, configData);
    
    console.log('✅ Create Fee Types Configuration API Response:', response);
    console.log('📊 Items count:', response?.data?.items?.length || 0);
    
    if (response?.data?.items) {
      console.log('📝 Created fee types items:', response.data.items);
    }
    
    console.log('🎯 === CREATE FEE TYPES CONFIGURATION SUCCESS ===');
    return response;
    
  } catch (error: any) {
    console.error('❌ Error creating fee types configuration:', error);
    
    const status = error?.status || error?.response?.status;
    console.error('📊 Error status:', status);
    console.error('📋 Error details:', error?.response?.data || error?.message);
    
    if (status === 400) {
      throw new Error('Bad request while creating fee types configuration');
    } else if (status === 401) {
      throw new Error('Authentication required to create fee types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to create fee types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while creating fee types configuration');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to create fee types configuration');
  }
};

// Update Fee Types Configuration (PATCH)
export const updateFeeTypesConfiguration = async (
  insurerId: string, 
  productId: string, 
  configData: SaveFeeTypesConfigRequest
): Promise<SaveFeeTypesConfigResponse> => {
  console.log('🎯 === UPDATE FEE TYPES CONFIGURATION STARTED ===');
  console.log('📋 Request params:', { insurerId, productId });
  console.log('📝 Request data:', configData);
  
  try {
    console.log('🔍 Calling PATCH /fee-types API...');
    const response = await apiPatch<SaveFeeTypesConfigResponse>(`/insurers/${insurerId}/products/${productId}/fee-types`, configData);
    
    console.log('✅ Update Fee Types Configuration API Response:', response);
    console.log('📊 Items count:', response?.data?.items?.length || 0);
    
    if (response?.data?.items) {
      console.log('📝 Updated fee types items:', response.data.items);
    }
    
    console.log('🎯 === UPDATE FEE TYPES CONFIGURATION SUCCESS ===');
    return response;
    
  } catch (error: any) {
    console.error('❌ Error updating fee types configuration:', error);
    
    const status = error?.status || error?.response?.status;
    console.error('📊 Error status:', status);
    console.error('📋 Error details:', error?.response?.data || error?.message);
    
    if (status === 400) {
      throw new Error('Bad request while updating fee types configuration');
    } else if (status === 401) {
      throw new Error('Authentication required to update fee types configuration');
    } else if (status === 403) {
      throw new Error('You do not have permission to update fee types configuration');
    } else if (status === 500) {
      throw new Error('Server error occurred while updating fee types configuration');
    }
    
    throw new Error(error?.response?.data?.message || error?.message || 'Failed to update fee types configuration');
  }
};


