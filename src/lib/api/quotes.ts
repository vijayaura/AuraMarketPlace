import { apiPost, apiPatch, apiUploadFile } from './client';

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
  console.log('💾 saveCoverRequirements (POST) called with:', { quoteId, endpoint, data });
  return apiPost<CoverRequirementsResponse>(endpoint, data);
};

// Update cover requirements (PATCH for existing)
export const updateCoverRequirements = async (data: CoverRequirementsRequest, quoteId: number): Promise<CoverRequirementsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for cover requirements operations');
  }
  const endpoint = `/quotes/cover/${quoteId}`;
  console.log('🔄 updateCoverRequirements (PATCH) called with:', { quoteId, endpoint, data });
  return apiPatch<CoverRequirementsResponse>(endpoint, data);
};

// Types for Required Documents API
export interface DocumentInfo {
  label: string;
  url: string;
}

export interface RequiredDocumentsRequest {
  boq: DocumentInfo;
  gantt_chart: DocumentInfo;
  contract_agreement: DocumentInfo;
  site_layout_plan: DocumentInfo;
  other_supporting_docs: DocumentInfo;
}

export interface RequiredDocumentsResponse {
  message: string;
  quote_id: number;
  required_documents: RequiredDocumentsRequest;
}

// Save required documents (POST for new)
export const saveRequiredDocuments = async (data: RequiredDocumentsRequest, quoteId: number): Promise<RequiredDocumentsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for required documents operations');
  }
  const endpoint = `/quotes/cover/${quoteId}`;
  console.log('💾 saveRequiredDocuments (POST) called with:', { quoteId, endpoint, data });
  return apiPost<RequiredDocumentsResponse>(endpoint, data);
};

// Update required documents (PATCH for existing)
export const updateRequiredDocuments = async (data: RequiredDocumentsRequest, quoteId: number): Promise<RequiredDocumentsResponse> => {
  if (!quoteId) {
    throw new Error('Quote ID is required for required documents operations');
  }
  const endpoint = `/quotes/cover/${quoteId}`;
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
