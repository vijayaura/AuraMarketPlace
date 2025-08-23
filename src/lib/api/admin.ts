import { apiGet } from './client';

export interface AdminDashboardQuoteItem {
  id: number;
  quote_id: string;
  broker_id: number;
  insurer_id: number;
  project_id: number;
  base_premium: string;
  total_premium: string;
  status: string;
  validity_date: string;
  created_at: string;
  updated_at: string;
  project_name: string;
  client_name: string;
  project_type: string;
  broker_name: string;
  inusrer_name: string; // keeping as provided by backend
}

export interface AdminDashboardQuotesResponse {
  totalQuotes: number;
  totalPolicies: number;
  totalPremiumValue: string;
  recentQuotes: AdminDashboardQuoteItem[];
}

export async function getAdminDashboardQuotes(): Promise<AdminDashboardQuotesResponse> {
  return apiGet<AdminDashboardQuotesResponse>('/admin/dashboard/quotes');
}

export interface BrokerDashboardQuoteItem {
  id: number;
  quote_id: string;
  broker_id: number;
  insurer_id: number;
  project_id: number;
  base_premium: string;
  total_premium: string;
  status: string;
  validity_date: string;
  created_at: string;
  updated_at: string;
  project_name: string;
  client_name: string;
  project_type: string;
}

export interface BrokerDashboardQuotesResponse {
  totalQuotes: number;
  totalActiveQuotes: number;
  totalPolicies: number;
  totalActivePolicies: number;
  totalPremiumValue: number | string;
  totalCommission: number | string;
  recentQuotes: BrokerDashboardQuoteItem[];
}

export async function getBrokerDashboardQuotes(): Promise<BrokerDashboardQuotesResponse> {
  return apiGet<BrokerDashboardQuotesResponse>('/broker/dashboard/quotes');
}


