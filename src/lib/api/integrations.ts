import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export type IntegrationTriggerPage = 
  | "home" 
  | "quotesList" 
  | "beforePayment" 
  | "afterPayment" 
  | "policyDetails"
  | "custom";

export type AuthType = "none" | "apiKey" | "bearer" | "basic" | "oauth2";

export interface IntegrationCredentials {
  type: AuthType;
  apiKey?: string;
  apiKeyHeader?: string; // e.g., "X-API-Key", "Authorization"
  bearerToken?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
}

export interface FieldMapping {
  sourceField: string; // Field name from form/context
  targetField: string; // Field name in API request
  defaultValue?: string | number;
  required?: boolean;
}

export interface SuccessAction {
  forwardToPage?: string; // Forward response data to selected page (e.g., quotes page)
  showInPage?: string; // Show response data in selected page (e.g., quotes list page)
  navigateToPage?: string; // Navigate to specific page ID on success
  customAction?: {
    apiUrl?: string; // Custom API to call on success
    method?: "GET" | "POST" | "PUT" | "PATCH";
  };
}

export interface FailureAction {
  blockNavigation?: boolean; // Block navigation on failure
  navigateToPage?: string; // Navigate to specific page ID on failure (e.g., failure page)
  showError?: boolean; // Show error message to user
  customAction?: {
    apiUrl?: string; // Custom API to call on failure
    method?: "GET" | "POST" | "PUT" | "PATCH";
  };
}

export interface ResponseMapping {
  successField?: string; // Field path in response that indicates success (e.g., "status" or "data.success")
  successValue?: string | boolean; // Expected value for success (e.g., "success" or true)
  dataField?: string; // Field path in response that contains data to use (e.g., "data" or "result")
  errorField?: string; // Field path in response that contains error message
  onSuccess?: SuccessAction; // Actions to take on success
  onFailure?: FailureAction; // Actions to take on failure
}

export interface Integration {
  id?: string;
  productId: string;
  name: string;
  description?: string;
  apiUrl: string;
  method: "GET" | "POST" | "PUT" | "PATCH";
  credentials: IntegrationCredentials;
  triggerPage: IntegrationTriggerPage;
  triggerCondition?: {
    field?: string; // Field to check (e.g., "chassisNumber")
    condition?: "exists" | "equals" | "notEmpty";
    value?: string;
  };
  requestMapping: FieldMapping[];
  responseMapping: ResponseMapping;
  headers?: Record<string, string>; // Additional headers
  queryParams?: Record<string, string>; // Query parameters for GET requests
  requestBody?: Record<string, any>; // Static request body fields
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IntegrationListResponse {
  integrations: Integration[];
  total: number;
}

// Get all integrations for a product
export async function getIntegrations(productId: string): Promise<IntegrationListResponse> {
  return apiGet<IntegrationListResponse>(`/admin/products/${productId}/integrations`);
}

// Get integration by ID
export async function getIntegration(productId: string, integrationId: string): Promise<Integration> {
  return apiGet<Integration>(`/admin/products/${productId}/integrations/${integrationId}`);
}

// Create new integration
export async function createIntegration(productId: string, integration: Omit<Integration, 'id' | 'productId' | 'createdAt' | 'updatedAt'>): Promise<Integration> {
  return apiPost<Integration>(`/admin/products/${productId}/integrations`, integration);
}

// Update integration
export async function updateIntegration(productId: string, integrationId: string, integration: Partial<Integration>): Promise<Integration> {
  return apiPatch<Integration>(`/admin/products/${productId}/integrations/${integrationId}`, integration);
}

// Delete integration
export async function deleteIntegration(productId: string, integrationId: string): Promise<void> {
  return apiDelete<void>(`/admin/products/${productId}/integrations/${integrationId}`);
}

// Test integration (dry run)
export interface TestIntegrationRequest {
  testData: Record<string, any>;
}

export interface TestIntegrationResponse {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
}

export async function testIntegration(productId: string, integrationId: string, testData: TestIntegrationRequest): Promise<TestIntegrationResponse> {
  return apiPost<TestIntegrationResponse>(`/admin/products/${productId}/integrations/${integrationId}/test`, testData);
}

