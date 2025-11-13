import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export type ProductStatus = 'Draft' | 'Active' | 'Archived';
export type ProductOwner = 'insurer' | 'reinsurer' | 'broker';
export type ProductCategory = 
  | 'CASUALTY' 
  | 'ENGINEERING' 
  | 'GENERAL_ACCIDENT' 
  | 'GROUP_LIFE' 
  | 'LIABILITY' 
  | 'MARINE_CARGO' 
  | 'MARINE_HULL' 
  | 'MEDICAL' 
  | 'MOTOR' 
  | 'PROPERTY' 
  | 'WORKMENS_COMPENSATION';

export interface Product {
  id: string;
  name: string;
  version: string;
  category: ProductCategory;
  currency: string;
  owner: ProductOwner;
  status: ProductStatus;
  linkedInsurers?: number;
  linkedBrokers?: number;
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  code?: string;
}

export interface CreateProductRequest {
  name: string;
  version?: string;
  category: ProductCategory;
  currency: string;
  owner: ProductOwner;
  status?: ProductStatus;
}

export interface UpdateProductRequest {
  name?: string;
  version?: string;
  category?: ProductCategory;
  currency?: string;
  owner?: ProductOwner;
  status?: ProductStatus;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page?: number;
  limit?: number;
}

export interface ProductListFilters {
  status?: ProductStatus;
  category?: ProductCategory;
  owner?: ProductOwner;
  search?: string;
  page?: number;
  limit?: number;
}

// List all products with optional filters
export async function getProducts(filters?: ProductListFilters): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.owner) params.append('owner', filters.owner);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));
  
  const queryString = params.toString();
  const url = `/admin/products${queryString ? `?${queryString}` : ''}`;
  return apiGet<ProductListResponse>(url);
}

// Get product by ID
export async function getProduct(productId: string): Promise<Product> {
  return apiGet<Product>(`/admin/products/${productId}`);
}

// Create new product
export async function createProduct(data: CreateProductRequest): Promise<Product> {
  return apiPost<Product>('/admin/products', data);
}

// Update product
export async function updateProduct(productId: string, data: UpdateProductRequest): Promise<Product> {
  return apiPatch<Product>(`/admin/products/${productId}`, data);
}

// Delete/archive product
export async function deleteProduct(productId: string): Promise<void> {
  return apiDelete<void>(`/admin/products/${productId}`);
}

// Clone product
export async function cloneProduct(productId: string, newName?: string, newVersion?: string): Promise<Product> {
  return apiPost<Product>(`/admin/products/${productId}/clone`, { newName, newVersion });
}

// Create new version
export async function createProductVersion(productId: string, version: string): Promise<Product> {
  return apiPost<Product>(`/admin/products/${productId}/versions`, { version });
}

