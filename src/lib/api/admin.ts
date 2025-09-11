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

// Broker Dashboard Policies
export interface BrokerDashboardPolicyItem {
  policy_id: string | null;
  quote_id: number;
  broker_id: number;
  insurer_id: number;
  start_date: string;
  end_date: string;
  base_premium: string;
  total_premium: string;
  status: string;
  project_name: string;
  client_name: string;
}

export interface BrokerDashboardPoliciesResponse {
  totalQuotes: number;
  totalActiveQuotes: number;
  totalPolicies: number;
  totalActivePolicies: number;
  totalPremiumValue: string;
  totalCommission: string;
  issuedPolicies: BrokerDashboardPolicyItem[];
}

export async function getBrokerDashboardPolicies(): Promise<BrokerDashboardPoliciesResponse> {
  return apiGet<BrokerDashboardPoliciesResponse>('/broker/dashboard/policies');
}

// Admin Dashboard APIs
export async function getAdminDashboardQuotes(): Promise<AdminDashboardQuotesResponse> {
  return apiGet<AdminDashboardQuotesResponse>('/admin/dashboard/quotes');
}

export async function getAdminDashboardPolicies(): Promise<BrokerDashboardPoliciesResponse> {
  return apiGet<BrokerDashboardPoliciesResponse>('/admin/dashboard/policies');
}

// Insurer Dashboard APIs
export async function getInsurerDashboardQuotes(): Promise<BrokerDashboardQuotesResponse> {
  return apiGet<BrokerDashboardQuotesResponse>('/insurer/dashboard/quotes');
}

export async function getInsurerDashboardPolicies(): Promise<BrokerDashboardPoliciesResponse> {
  return apiGet<BrokerDashboardPoliciesResponse>('/insurer/dashboard/policies');
}


