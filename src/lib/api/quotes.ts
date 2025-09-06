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
  id: number;
  quote_id: string;
  broker_id: number;
  project_id: number;
  base_premium: number;
  total_premium: number;
  status: string;
  validity_date: string;
}

// Create a new quote project
export const createQuoteProject = async (data: QuoteProjectRequest): Promise<QuoteProjectResponse> => {
  return apiPost<QuoteProjectResponse>('/quotes/project', data);
};

// Update an existing quote project
export const updateQuoteProject = async (data: QuoteProjectRequest, quoteId?: number): Promise<QuoteProjectResponse> => {
  const endpoint = quoteId ? `/quotes/project/${quoteId}` : '/quotes/project/1';
  console.log('🔄 updateQuoteProject called with:', { quoteId, endpoint });
  return apiPatch<QuoteProjectResponse>(endpoint, data);
};
