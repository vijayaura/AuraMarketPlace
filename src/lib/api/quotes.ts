import { apiPost, apiPatch, apiUploadFile, apiGet } from './client';

// File Upload Types
export interface UploadedFile {
  original_name: string;
  stored_name: string;
  size_bytes: number;
  s3_uri: string;
  url: string;
  url_expires_in_seconds: number;
}

export interface FileUploadResponse {
  message: string;
  files: UploadedFile[];
  body: {
    policy_id: null;
    document_type: null;
  };
  persisted: boolean;
}

// Types for Quote Project API
export interface QuoteProjectRequest {
  client_name: string;
  project_name: string;
  project_type: string;
  sub_project_type: string;
  construction_type: string;
  address: string;
  country: string;
  region: string;
  zone: string;
  latitude: number;
  longitude: number;
  sum_insured: number;
  start_date: string;
  completion_date: string;
  construction_period_months: number;
  maintenance_period_months: number;
}

export interface QuoteProjectResponse {
  message: string;
  project_id: number;
  project: {
    id: number;
    project_id: string;
    broker_id: number;
    broker_company_id: number;
    broker_company_name: string;
    broker_user_id: number;
    broker_user_name: string;
    broker_user_role: string;
    broker_user_type: string;
    client_name: string;
    project_name: string;
    project_type: string;
    sub_project_type: string;
    construction_type: string;
    address: string;
    country: string;
    region: string;
    zone: string;
    latitude: string;
    longitude: string;
    sum_insured: string;
    start_date: string;
    completion_date: string;
    construction_period_months: number;
    maintenance_period_months: number;
    created_at: string;
    updated_at: string;
  };
  quote: {
    id: number;
    quote_id: string;
    insurer_id: number | null;
    status: string;
    validity_date: string;
    created_at: string;
    updated_at: string;
  };
}

// Create a new quote project
export const createQuoteProject = async (data: QuoteProjectRequest): Promise<QuoteProjectResponse> => {
  return apiPost<QuoteProjectResponse>('/quotes/project', data);
};

// Update an existing quote project
export const updateQuoteProject = async (data: QuoteProjectRequest, quoteId: number): Promise<QuoteProjectResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for update operations');
  }
  const endpoint = `/quotes/project/${quoteId}`;
  console.log('🔄 updateQuoteProject called with:', { quoteId, endpoint });
  return apiPatch<QuoteProjectResponse>(endpoint, data);
};

// Types for Insured Details API
export interface InsuredDetailsRequest {
  insured_name: string;
  role_of_insured: string;
  had_losses_last_5yrs: boolean;
  claims_matrix: Array<{
    year: number;
    count: number;
    amount: number;
    description: string;
  }>;
}

export interface InsuredDetailsResponse {
  message: string;
}

// Types for Contract Structure API
export interface ContractStructureRequest {
  main_contractor: string;
  principal_owner: string;
  contract_type: string;
  contract_number: string;
  experience_years: number;
  sub_contractors: Array<{
    name: string;
    contract_type: string;
    contract_number: string;
  }>;
  consultants: Array<{
    name: string;
    role: string;
    license_number: string;
  }>;
}

export interface ContractStructureResponse {
  message: string;
}

// Types for Site Risks API
export interface SiteRisksRequest {
  near_water_body: boolean;
  flood_prone_zone: boolean;
  within_city_center: string;
  soil_type: string;
  existing_structure: boolean;
  blasting_or_deep_excavation: boolean;
  site_security_arrangements: string;
  area_type: string;
  describe_existing_structure: string;
}

export interface SiteRisksResponse {
  message: string;
}

// Types for Cover Requirements API
export interface CoverRequirementsRequest {
  project_value: number;
  contract_works: number;
  plant_and_equipment: number;
  temporary_works: number;
  other_materials: number;
  principals_property: number;
  cross_liability_cover: string;
}

export interface CoverRequirementsResponse {
  message: string;
  sum_insured: number;
}

// Save insured details (POST for new)
export const saveInsuredDetails = async (data: InsuredDetailsRequest, quoteId: number): Promise<InsuredDetailsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for insured details operations');
  }
  const endpoint = `/quotes/insured/${quoteId}`;
  console.log('💾 saveInsuredDetails (POST) called with:', { quoteId, endpoint, data });
  return apiPost<InsuredDetailsResponse>(endpoint, data);
};

// Update insured details (PATCH for existing)
export const updateInsuredDetails = async (data: InsuredDetailsRequest, quoteId: number): Promise<InsuredDetailsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for insured details operations');
  }
  const endpoint = `/quotes/insured/${quoteId}`;
  console.log('🔄 updateInsuredDetails (PATCH) called with:', { quoteId, endpoint, data });
  return apiPatch<InsuredDetailsResponse>(endpoint, data);
};

// Save contract structure (POST for new)
export const saveContractStructure = async (data: ContractStructureRequest, quoteId: number): Promise<ContractStructureResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for contract structure operations');
  }
  const endpoint = `/quotes/contract/${quoteId}`;
  console.log('💾 saveContractStructure (POST) called with:', { quoteId, endpoint, data });
  return apiPost<ContractStructureResponse>(endpoint, data);
};

// Update contract structure (PATCH for existing)
export const updateContractStructure = async (data: ContractStructureRequest, quoteId: number): Promise<ContractStructureResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for contract structure operations');
  }
  const endpoint = `/quotes/contract/${quoteId}`;
  console.log('🔄 updateContractStructure (PATCH) called with:', { quoteId, endpoint, data });
  return apiPatch<ContractStructureResponse>(endpoint, data);
};

// Save site risks (POST for new)
export const saveSiteRisks = async (data: SiteRisksRequest, quoteId: number): Promise<SiteRisksResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for site risks operations');
  }
  const endpoint = `/quotes/site-risks/${quoteId}`;
  console.log('💾 saveSiteRisks (POST) called with:', { quoteId, endpoint, data });
  return apiPost<SiteRisksResponse>(endpoint, data);
};

// Update site risks (PATCH for existing)
export const updateSiteRisks = async (data: SiteRisksRequest, quoteId: number): Promise<SiteRisksResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for site risks operations');
  }
  const endpoint = `/quotes/site-risks/${quoteId}`;
  console.log('🔄 updateSiteRisks (PATCH) called with:', { quoteId, endpoint, data });
  return apiPatch<SiteRisksResponse>(endpoint, data);
};

// Save cover requirements (POST for new)
export const saveCoverRequirements = async (data: CoverRequirementsRequest, quoteId: number): Promise<CoverRequirementsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for cover requirements operations');
  }
  const endpoint = `/quotes/cover/${quoteId}`;
  const timestamp = new Date().toISOString();
  console.log(`🚨 [${timestamp}] saveCoverRequirements (POST) called with:`, { quoteId, endpoint, data });
  console.trace('📍 Call stack for saveCoverRequirements POST');
  return apiPost<CoverRequirementsResponse>(endpoint, data);
};

// Update cover requirements (PATCH for existing)
export const updateCoverRequirements = async (data: CoverRequirementsRequest, quoteId: number): Promise<CoverRequirementsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for cover requirements operations');
  }
  const endpoint = `/quotes/cover/${quoteId}`;
  const timestamp = new Date().toISOString();
  console.log(`🚨 [${timestamp}] updateCoverRequirements (PATCH) called with:`, { quoteId, endpoint, data });
  console.trace('📍 Call stack for updateCoverRequirements PATCH');
  return apiPatch<CoverRequirementsResponse>(endpoint, data);
};

// Types for Required Documents API
export interface DocumentInfo {
  label: string;
  url: string;
}

export interface RequiredDocumentsRequest {
  required_document: DocumentInfo[];
}

export interface RequiredDocumentsResponse {
  message: string;
  quote_id: number;
  required_documents: DocumentInfo[];
}

// Save required documents (POST for new)
export const saveRequiredDocuments = async (data: RequiredDocumentsRequest, quoteId: number): Promise<RequiredDocumentsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for required documents operations');
  }
  const endpoint = `/quotes/${quoteId}/required-documents`;
  console.log('💾 saveRequiredDocuments (POST) called with:', { quoteId, endpoint, data });
  return apiPost<RequiredDocumentsResponse>(endpoint, data);
};

// Update required documents (PATCH for existing)
export const updateRequiredDocuments = async (data: RequiredDocumentsRequest, quoteId: number): Promise<RequiredDocumentsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for required documents operations');
  }
  const endpoint = `/quotes/${quoteId}/required-documents`;
  console.log('🔄 updateRequiredDocuments (PATCH) called with:', { quoteId, endpoint, data });
  return apiPatch<RequiredDocumentsResponse>(endpoint, data);
};

// File Upload Function
export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  console.log('📤 uploadFile called with:', { fileName: file.name, fileSize: file.size, fileType: file.type });
  
  try {
    const data = await apiUploadFile<FileUploadResponse>('/documents/upload', file);
    console.log('✅ uploadFile success:', data);
    return data;
  } catch (error) {
    console.error('❌ uploadFile error:', error);
    throw error;
  }
};

// Types for Proposal Bundle API
export interface QuoteMeta {
  quote_id: number;
  insurer_id: number | null;
  status: string;
  validity_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDetails {
  id: number;
  project_id: string;
  broker_id: number;
  broker_company_id: number;
  broker_company_name: string;
  broker_user_id: number;
  broker_user_name: string;
  broker_user_role: string;
  broker_user_type: string;
  client_name: string;
  project_name: string;
  project_type: string;
  sub_project_type: string;
  construction_type: string;
  address: string;
  country: string;
  region: string;
  zone: string;
  latitude: string;
  longitude: string;
  sum_insured: string;
  start_date: string;
  completion_date: string;
  construction_period_months: number;
  maintenance_period_months: number;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  claim_year: number;
  count_of_claims: number;
  amount_of_claims: string;
  description: string;
}

export interface InsuredDetails {
  id: number;
  project_id: number;
  insured_name: string;
  role_of_insured: string;
  had_losses_last_5yrs: number;
  created_at: string;
  updated_at: string;
}

export interface Insured {
  details: InsuredDetails;
  claims: Claim[];
}

export interface SubContractor {
  name: string;
  contract_type: string;
  contract_number: string;
}

export interface Consultant {
  name: string;
  role: string;
  license_number: string;
}

export interface ContractStructureDetails {
  id: number;
  project_id: number;
  main_contractor: string;
  principal_owner: string;
  contract_type: string;
  contract_number: string;
  experience_years: number;
  created_at: string;
  updated_at: string;
}

export interface ContractStructure {
  details: ContractStructureDetails;
  sub_contractors: SubContractor[];
  consultants: Consultant[];
}

export interface SiteRisks {
  id: number;
  project_id: number;
  near_water_body: number;
  flood_prone_zone: number;
  within_city_center: string;
  soil_type: string;
  existing_structure: number;
  blasting_or_deep_excavation: number;
  site_security_arrangements: string;
  area_type: string;
  describe_existing_structure: string;
  created_at: string;
  updated_at: string;
}

export interface CoverRequirements {
  id: number;
  project_id: number;
  project_value: string;
  contract_works: string;
  plant_and_equipment: string;
  temporary_works: string;
  other_materials: string;
  principals_property: string;
  cross_liability_cover: string;
  // Add more fields as needed based on the complete response
}

export interface ProposalBundleResponse {
  project_id: number;
  quote_meta: QuoteMeta;
  project: ProjectDetails;
  insured: Insured;
  contract_structure: ContractStructure;
  site_risks: SiteRisks;
  cover_requirements: CoverRequirements;
  // Add more sections as needed
}


// Types for Insurer Pricing Configuration API
export interface BaseRate {
  project_type: string;
  sub_projects: {
    name: string;
    currency: string;
    base_rate: number;
    pricing_type: string;
    quote_option: string;
  }[];
}

export interface LocationHazardFactor {
  factor: string;
  low_risk: string;
  high_risk: string;
  moderate_risk: string;
  very_high_risk: string;
}

export interface LocationHazardRates {
  risk_level: string;
  pricing_type: string;
  quote_option: string;
  loading_discount: number;
}

export interface ProjectDurationLoading {
  to_months: number;
  from_months: number;
  pricing_type: string;
  quote_option: string;
  loading_discount: number;
}

export interface MaintenancePeriodLoading {
  to_months: number | null;
  from_months: number;
  pricing_type: string;
  quote_option: string;
  loading_discount: number;
}

export interface ProjectRiskFactors {
  location_hazard_loadings: {
    risk_definition: {
      factors: LocationHazardFactor[];
    };
    location_hazard_rates: LocationHazardRates[];
  };
  project_duration_loadings: ProjectDurationLoading[];
  maintenance_period_loadings: MaintenancePeriodLoading[];
}

export interface ContractorRiskFactors {
  experience_loadings: {
    to_years: number;
    from_years: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
  claims_based_loadings: {
    to_claims: number;
    from_claims: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
}

export interface CoverageOptions {
  sum_insured_loadings: {
    to_amount: number;
    from_amount: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
  cross_liability_cover: {
    cover_option: string;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
  project_value_loadings: {
    to_amount: number;
    from_amount: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
  contract_works_loadings: {
    to_amount: number;
    from_amount: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
  plant_equipment_loadings: {
    to_amount: number;
    from_amount: number;
    pricing_type: string;
    quote_option: string;
    loading_discount: number;
  }[];
}

export interface PolicyLimitsAndDeductible {
  sub_limits: {
    title: string;
    value: number;
    description: string;
    pricing_type: string;
  }[];
  deductibles: {
    type: string;
    value: number;
    quote_option: string;
    loading_discount: number;
  }[];
  policy_limits: {
    maximum_cover: {
      value: number;
      pricing_type: string;
    };
    minimum_premium: {
      value: number;
      pricing_type: string;
    };
    base_broker_commission: {
      value: number;
      pricing_type: string;
    };
    maximum_broker_commission: {
      value: number;
      pricing_type: string;
    };
    minimum_broker_commission: {
      value: number;
      pricing_type: string;
    };
  };
}

export interface ClausePricingConfig {
  insurer_id: number;
  product_id: number;
  clause_code: string;
  is_enabled: number;
  is_mandatory: number;
  base_type: string;
  base_value: string;
  base_currency: string;
  options: {
    type: string;
    label: string;
    limit: string;
    value: number;
    currency: string;
    display_order: number;
  }[];
  updated_at: string;
  created_at: string;
  meta: {
    clause_code: string;
    title: string;
    clause_type: string;
    display_order: number;
    is_active: number;
  } | null;
}

export interface TplExtension {
  id: number;
  product_id: number;
  title: string;
  description: string;
  limit_value: string;
  pricing_type: string;
  pricing_value: string;
  currency: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  insurer_id: number | null;
}

export interface QuoteFormat {
  id: number;
  product_id: number;
  company_name: string;
  company_address: string;
  quotation_prefix: string;
  contact_info: {
    raw: string;
  };
  header_bg_color: string;
  header_text_color: string;
  logo_position: string;
  logo_path: string;
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

export interface RequiredDocument {
  id: number;
  product_id: number;
  display_order: number;
  display_label: string;
  description: string;
  is_required: number;
  template_file: string;
  status: string;
  created_at: string;
  updated_at: string;
  insurer_id: number | null;
}

export interface ConfigItem {
  name?: string;
  value: number;
  is_active?: boolean;
  pricing_type: string;
  quote_option: string;
  display_order?: number;
  country?: string;
}

export interface InsurerPricingConfigResponse {
  insurer_id: number;
  product_id: number;
  product: {
    id: number;
    insurer_id: number;
    product_name: string;
    product_type: string;
    description: string;
    is_active: number;
    created_at: string;
    updated_at: string;
  };
  base_rates: BaseRate[];
  project_risk_factors: ProjectRiskFactors;
  contractor_risk_factors: ContractorRiskFactors;
  coverage_options: CoverageOptions;
  policy_limits_and_deductible: PolicyLimitsAndDeductible;
  clause_pricing_config: ClausePricingConfig[];
  quote_config: {
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
  pricing_config: any;
  tpl_limits: {
    id: number;
    product_id: number;
    default_limit: string;
    currency: string;
    created_at: string;
    updated_at: string;
    insurer_id: number;
  };
  tpl_extensions: TplExtension[];
  quote_format: QuoteFormat;
  required_documents: RequiredDocument[];
  construction_types_config: {
    items: ConfigItem[];
  };
  countries_config: {
    items: ConfigItem[];
  };
  regions_config: {
    items: ConfigItem[];
  };
  zones_config: {
    items: ConfigItem[];
  };
  role_types_config: {
    items: ConfigItem[];
  };
  contract_types_config: {
    items: ConfigItem[];
  };
  soil_types_config: {
    items: ConfigItem[];
  };
  subcontractor_types_config: {
    items: ConfigItem[];
  };
  consultant_roles_config: {
    items: ConfigItem[];
  };
  security_types_config: {
    items: ConfigItem[];
  };
  area_types_config: {
    items: ConfigItem[];
  };
  fee_types_config: {
    items: ConfigItem[];
  };
}

// Get insurer pricing configuration
export async function getInsurerPricingConfig(insurerId: number): Promise<InsurerPricingConfigResponse> {
  if (!insurerId) {
    throw new Error('Insurer ID is required for getting pricing configuration');
  }
  const endpoint = `/insurers/${insurerId}/products/1/product-config-bundle`;
  console.log('💰 getInsurerPricingConfig called with:', { insurerId, endpoint });
  return apiGet<InsurerPricingConfigResponse>(endpoint);
}

// Plan Selection Types
export interface PlanSelectionRequest {
  insurer_name: string;
  insurer_id: number;
  premium_amount: number;
  is_minimum_premium_applied: boolean;
  minimum_premium_value: number;
  extensions: {
    tpl_limit: {
      label: string;
      impact_pct: number;
      description: string;
    };
    selected_extensions: Record<string, {
      code: string;
      label: string;
      impact_pct?: number;
      impact_amount?: number;
      description: string;
    }>;
    selected_plan: {
      insurer_name: string;
      base_premium: number;
      coverage_amount: number;
      deductible: number;
    };
  };
  premium_summary: {
    net_premium: number;
    broker_commission_pct: number;
    broker_commission_amount: number;
    broker_min_commission_pct: number;
    broker_max_commission_pct: number;
    broker_base_commission_pct: number;
    cew_adjustments_pct: number;
    cew_adjustments_amount: number;
    total_annual_premium: number;
  };
}

export interface PlanSelectionResponse {
  message: string;
  offer: {
    id: number;
    insurer_name: string;
    premium_amount: number;
    extensions: PlanSelectionRequest['extensions'];
    created_by: {
      user_id: number;
      role: string;
      insurer_id: number;
      broker_id: number;
    };
    created_at: string;
    updated_at: string;
  };
}

// Required Documents Types
export interface RequiredDocument {
  id: number;
  product_id: number;
  display_order: number;
  label: string;
  description: string;
  is_required: number;
  url: string;
  status: string;
  insurer_id: number;
  created_at: string;
  updated_at: string;
}

export interface RequiredDocumentsResponse {
  documents: RequiredDocument[];
}

// Document Submission Types
export interface DeclarationDocument {
  label: string;
  url: string;
}

export interface DocumentSubmissionRequest {
  product_id: number;
  declaration_documents: DeclarationDocument[];
}

export interface DocumentSubmissionResponseItem {
  label: string;
  url: string;
  uploaded_at: string;
}

export interface PolicyDetails {
  id: number;
  policy_id: string;
  quote_id: number;
  insurer_id: number;
  broker_id: number;
  start_date: string;
  end_date: string;
  base_premium: string;
  total_premium: string;
  commission_rate: string;
  commission_amount: string;
  document_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  proposal_bundle: any; // This is a complex object, keeping as any for now
}

export interface DocumentSubmissionResponse {
  message: string;
  documents: DocumentSubmissionResponseItem[];
  policy: PolicyDetails;
}

// Plan Selection API Functions
export const createPlanSelection = async (quoteId: number, data: PlanSelectionRequest): Promise<PlanSelectionResponse> => {
  const response = await apiPost<PlanSelectionResponse>(`/quotes/${quoteId}/plans`, data);
  return response;
};

export const updatePlanSelection = async (quoteId: number, planId: string, data: PlanSelectionRequest): Promise<PlanSelectionResponse> => {
  const response = await apiPatch<PlanSelectionResponse>(`/quotes/${quoteId}/plans/${planId}`, data);
  return response;
};

// Required Documents API Functions
export const getRequiredDocuments = async (insurerId: number, productId: number): Promise<RequiredDocumentsResponse> => {
  const response = await apiGet<RequiredDocumentsResponse>(`/insurers/${insurerId}/products/${productId}/required-documents`);
  return response;
};

// Document Submission API Functions
export const createDocumentSubmission = async (quoteId: number, data: DocumentSubmissionRequest): Promise<DocumentSubmissionResponse> => {
  const response = await apiPost<DocumentSubmissionResponse>(`/quotes/${quoteId}/docs-required`, data);
  return response;
};

// Policy API Functions
export interface PolicyInfo {
  id: number;
  policy_id: string;
  quote_id: string;
  insurer_id: number;
  broker_id: number;
  start_date: string;
  end_date: string;
  base_premium: string;
  total_premium: string;
  commission_rate: string;
  commission_amount: string;
  document_path: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  proposal_bundle: any; // Complex nested object
  project_id: string;
  broker_company_id: number;
  broker_company_name: string;
  broker_user_id: number;
  broker_user_name: string;
  broker_user_role: string;
  broker_user_type: string;
  client_name: string;
  project_name: string;
  project_type: string;
  sub_project_type: string;
  construction_type: string;
  address: string;
  country: string;
  region: string;
  zone: string;
  latitude: string;
  longitude: string;
  sum_insured: string;
  completion_date: string;
  construction_period_months: number;
  maintenance_period_months: number;
  broker_name: string;
  insurer_name: string;
  insurer_email: string;
}

export interface PolicyTimelineEvent {
  event: string;
  date: string;
}

export interface PolicyDetailsResponse {
  policyInfo: PolicyInfo;
  policyTimeline: PolicyTimelineEvent[];
}

export const getPolicyDetails = async (policyId: number): Promise<PolicyDetailsResponse> => {
  const response = await apiGet<PolicyDetailsResponse>(`/policies/${policyId}`);
  return response;
};

export const updateDocumentSubmission = async (quoteId: number, data: DocumentSubmissionRequest): Promise<DocumentSubmissionResponse> => {
  const response = await apiPatch<DocumentSubmissionResponse>(`/quotes/${quoteId}/docs-required`, data);
  return response;
};

// Proposal Bundle Types
export interface ProposalBundleResponse {
  project_id: number;
  quote_meta: {
    quote_id: number;
    insurer_id: number;
    status: string;
    validity_date: string;
    created_at: string;
    updated_at: string;
  };
  project: {
    id: number;
    project_id: string;
    broker_id: number;
    broker_company_id: number;
    broker_company_name: string;
    broker_user_id: number;
    broker_user_name: string;
    broker_user_role: string;
    broker_user_type: string;
    client_name: string;
    project_name: string;
    project_type: string;
    sub_project_type: string;
    construction_type: string;
    address: string;
    country: string;
    region: string;
    zone: string;
    latitude: string;
    longitude: string;
    sum_insured: string;
    start_date: string;
    completion_date: string;
    construction_period_months: number;
    maintenance_period_months: number;
    created_at: string;
    updated_at: string;
  };
  insured: {
    details: {
      id: number;
      project_id: number;
      insured_name: string;
      role_of_insured: string;
      had_losses_last_5yrs: number;
      created_at: string;
      updated_at: string;
    };
    claims: Array<{
      claim_year: number;
      count_of_claims: number;
      amount_of_claims: string;
      description: string;
    }>;
  };
  contract_structure: {
    details: {
      id: number;
      project_id: number;
      main_contractor: string;
      principal_owner: string;
      contract_type: string;
      contract_number: string;
      experience_years: number;
      created_at: string;
      updated_at: string;
    };
    sub_contractors: Array<{
      name: string;
      contract_type: string;
      contract_number: string;
    }>;
    consultants: Array<{
      name: string;
      role: string;
      license_number: string;
    }>;
  };
  site_risks: {
    id: number;
    project_id: number;
    near_water_body: number;
    flood_prone_zone: number;
    within_city_center: string;
    soil_type: string;
    existing_structure: number;
    blasting_or_deep_excavation: number;
    site_security_arrangements: string;
    area_type: string;
    describe_existing_structure: string;
    created_at: string;
    updated_at: string;
  };
  cover_requirements: {
    id: number;
    project_id: number;
    project_value: string;
    contract_works: string;
    plant_and_equipment: string;
    temporary_works: string;
    other_materials: string;
    principals_property: string;
    cross_liability_cover: string;
    sum_insured: string;
    created_at: string;
    updated_at: string;
    computed_sum_insured: number;
  };
  required_documents: Record<string, {
    url: string;
    label: string;
  }>;
  plans: Array<{
    id: number;
    created_at: string;
    created_by: {
      role: string;
      user_id: number;
      broker_id: number;
      insurer_id: number;
    };
    extensions: {
      tpl_limit: {
        label: string;
        impact_pct: number;
        description: string;
      };
      selected_plan: {
        deductible: number;
        base_premium: number;
        insurer_name: string;
        coverage_amount: number;
      };
      selected_extensions: Record<string, {
        code: string;
        label: string;
        impact_pct: number;
        description: string;
      }>;
    };
    insurer_id: number;
    updated_at: string;
    insurer_name: string;
    premium_amount: number;
    minimum_premium_value: number;
    is_minimum_premium_applied: boolean;
  }>;
  required_documents_for_policy_issue: any;
}

export const getProposalBundle = async (quoteId: number): Promise<ProposalBundleResponse> => {
  const response = await apiGet<ProposalBundleResponse>(`/quotes/getProposalBundle/${quoteId}`);
  return response;
};
