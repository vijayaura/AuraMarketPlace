import { apiPost, apiPatch } from './client';

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
