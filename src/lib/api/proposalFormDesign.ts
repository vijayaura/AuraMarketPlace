import { apiGet, apiPost, apiPatch } from './client';

export interface FieldValidation {
  type: string;
  value?: string | number;
  message?: string;
}

export interface SubField {
  id: string;
  label: string;
  name: string;
  type: "text" | "number" | "date" | "dropdown";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  optionsUrl?: string;
}

export type FieldType = "text" | "number" | "dropdown" | "date" | "checkbox" | "file" | "multiselect" | "location" | "combination" | "chooseButton" | "nextButton" | "backButton" | "submitButton" | "button";

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string | number | boolean | string[];
  required?: boolean;
  isRatingParameter?: boolean;
  isMasterData?: boolean;
  validations?: FieldValidation[];
  conditionalLogic?: {
    field: string;
    condition: string;
    value: string;
  };
  options?: string[];
  optionsUrl?: string;
  dependentOn?: string;
  dependentOptions?: Record<string, string[]>;
  dependentOptionsUrl?: string;
  masterDataTable?: string;
  subFields?: SubField[];
  combinationRows?: number;
  combinationRowLabels?: string[];
  buttonText?: string;
  buttonAction?: "submit" | "next" | "back" | "custom" | "api";
  buttonApiUrl?: string;
  buttonVariant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
  buttonTargetPage?: string;
  mapApiUrl?: string;
  mapApiKey?: string;
  mapProvider?: string;
}

export interface Section {
  id: string;
  title?: string;
  subtitle?: string;
  fields: Field[];
}

export type PageType = "form" | "payment" | "quotesList" | "policyDetails";

export interface Page {
  id: string;
  title: string;
  subtitle?: string;
  pageType?: PageType;
  sections?: Section[];
  navigationFields?: Field[];
  paymentUrl?: string;
  quotesUrl?: string;
}

export interface ProposalFormDesign {
  id?: string;
  productId: string;
  pages: Page[];
  version?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ProposalFormTemplate {
  id: string;
  name: string;
  productCategory?: string;
  pages: Page[];
  createdAt: string;
  createdBy: string;
}

export interface ProposalFormVersion {
  id: string;
  designId: string;
  version: string;
  pages: Page[];
  createdAt: string;
}

export interface ValidateFormDesignRequest {
  pages: Page[];
}

export interface ValidateFormDesignResponse {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Get proposal form design for a product
export async function getProposalFormDesign(productId: string): Promise<ProposalFormDesign> {
  return apiGet<ProposalFormDesign>(`/admin/products/${productId}/proposal-form-design`);
}

// Save proposal form design
export async function saveProposalFormDesign(productId: string, design: { pages: Page[] }): Promise<ProposalFormDesign> {
  return apiPost<ProposalFormDesign>(`/admin/products/${productId}/proposal-form-design`, design);
}

// Update proposal form design
export async function updateProposalFormDesign(productId: string, design: { pages: Page[] }): Promise<ProposalFormDesign> {
  return apiPatch<ProposalFormDesign>(`/admin/products/${productId}/proposal-form-design`, design);
}

// Get proposal form design versions
export async function getProposalFormDesignVersions(productId: string): Promise<ProposalFormVersion[]> {
  return apiGet<ProposalFormVersion[]>(`/admin/products/${productId}/proposal-form-design/versions`);
}

// Save as template
export async function saveProposalFormTemplate(productId: string, template: { name: string; productCategory?: string; pages: Page[] }): Promise<ProposalFormTemplate> {
  return apiPost<ProposalFormTemplate>(`/admin/products/${productId}/proposal-form-design/templates`, template);
}

// List templates
export async function getProposalFormTemplates(productId: string): Promise<ProposalFormTemplate[]> {
  return apiGet<ProposalFormTemplate[]>(`/admin/products/${productId}/proposal-form-design/templates`);
}

// Validate form design
export async function validateProposalFormDesign(productId: string, design: ValidateFormDesignRequest): Promise<ValidateFormDesignResponse> {
  return apiPost<ValidateFormDesignResponse>(`/admin/products/${productId}/proposal-form-design/validate`, design);
}

