import { apiGet, apiPatch, apiPost, apiDelete } from './client';

export interface MasterCountryDTO {
  id: number;
  name: string;
  code: string;
  status: string;
  display_order: number;
}

export interface MasterRegionDTO {
  id: number;
  country_id: number;
  name: string;
  status: string;
  display_order: number;
}

export interface MasterZoneDTO {
  id: number;
  region_id: number;
  name: string;
  status: string;
  display_order: number;
}

export interface Country {
  id: number;
  value: string;
  label: string;
  active: boolean;
}

export interface Region {
  id: number;
  value: string;
  label: string;
  countryId: number;
  active: boolean;
}

export interface Zone {
  id: number;
  value: string;
  label: string;
  regionId: number;
  active: boolean;
}

// Additional masters
export interface MasterProjectTypeDTO { id: number; name: string; status: string; display_order: number }
export interface MasterSubProjectTypeDTO { id: number; project_type_id: number; name: string; status: string; display_order: number }
export interface MasterConstructionTypeDTO { id: number; name: string; status: string; display_order: number }
export interface MasterRoleTypeDTO { id: number; display_label: string; status: string; display_order: number }
export interface MasterContractTypeDTO { id: number; name: string; status: string; display_order: number }
export interface MasterSoilTypeDTO { id: number; name: string; status: string; display_order: number }
export interface MasterSubcontractorTypeDTO { id: number; display_label: string; status: string; display_order: number }
export interface MasterConsultantRoleDTO { id: number; display_label: string; status: string; display_order: number }
export interface MasterSecurityTypeDTO { id: number; display_label: string; status: string; display_order: number }
export interface MasterAreaTypeDTO { id: number; display_label: string; status: string; display_order: number }
export interface MasterDocumentTypeDTO { id: number; display_label: string; description?: string; required: 'required' | 'optional'; status: string; display_order: number }

export interface SimpleMasterItem {
  id: number;
  label: string;
  active: boolean;
  order: number;
}

export interface SubProjectTypeItem extends SimpleMasterItem {
  projectTypeId: number;
}

export interface DocumentTypeItem extends SimpleMasterItem {
  description?: string;
  required: boolean;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function listMasterCountries(): Promise<Country[]> {
  const data = await apiGet<MasterCountryDTO[]>('/admin/master-management/master_countries');
  return (data || [])
    .filter((c) => c.status === 'active')
    .sort((a, b) => a.display_order - b.display_order)
    .map((c) => ({ id: c.id, value: toSlug(c.name), label: c.name, active: c.status === 'active' }));
}

export async function listMasterRegions(): Promise<Region[]> {
  const data = await apiGet<MasterRegionDTO[]>('/admin/master-management/master_regions');
  return (data || [])
    .filter((r) => r.status === 'active')
    .sort((a, b) => a.display_order - b.display_order)
    .map((r) => ({ id: r.id, value: toSlug(r.name), label: r.name, countryId: r.country_id, active: r.status === 'active' }));
}

export async function listMasterZones(): Promise<Zone[]> {
  const data = await apiGet<MasterZoneDTO[]>('/admin/master-management/master_zones');
  return (data || [])
    .filter((z) => z.status === 'active')
    .sort((a, b) => a.display_order - b.display_order)
    .map((z) => ({ id: z.id, value: toSlug(z.name), label: z.name, regionId: z.region_id, active: z.status === 'active' }));
}

export async function listMasterProjectTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterProjectTypeDTO[]>('/admin/master-management/master_project_types');
  return (data || []).map((it) => ({ id: it.id, label: it.name, active: it.status === 'active', order: it.display_order }));
}

export async function listMasterSubProjectTypes(): Promise<SubProjectTypeItem[]> {
  const data = await apiGet<MasterSubProjectTypeDTO[]>('/admin/master-management/master_sub_project_types');
  return (data || []).map((it) => ({ id: it.id, projectTypeId: it.project_type_id, label: it.name, active: it.status === 'active', order: it.display_order }));
}

export async function listMasterConstructionTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterConstructionTypeDTO[]>('/admin/master-management/master_construction_types');
  return (data || []).map((it) => ({ id: it.id, label: it.name, active: it.status === 'active', order: it.display_order }));
}

export async function listMasterRoleTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterRoleTypeDTO[]>('/admin/master-management/master_role_types');
  return (data || []).map((it) => ({ id: it.id, label: it.display_label, active: it.status === 'active', order: it.display_order }));
}

export async function listMasterContractTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterContractTypeDTO[]>('/admin/master-management/master_contract_types');
  return (data || []).map((it) => ({ id: it.id, label: it.name, active: it.status === 'active', order: it.display_order }));
}

export async function listMasterSoilTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterSoilTypeDTO[]>('/admin/master-management/master_soil_types');
  return (data || []).map((it) => ({ id: it.id, label: it.name, active: it.status === 'active', order: it.display_order }));
}

export async function listMasterSubcontractorTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterSubcontractorTypeDTO[]>('/admin/master-management/master_subcontractor_types');
  return (data || []).map((it) => ({ id: it.id, label: it.display_label, active: it.status === 'active', order: it.display_order }));
}

export async function listMasterConsultantRoles(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterConsultantRoleDTO[]>('/admin/master-management/master_consultant_roles');
  return (data || []).map((it) => ({ id: it.id, label: it.display_label, active: it.status === 'active', order: it.display_order }));
}

export async function listMasterSecurityTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterSecurityTypeDTO[]>('/admin/master-management/master_security_types');
  return (data || []).map((it) => ({ id: it.id, label: it.display_label, active: it.status === 'active', order: it.display_order }));
}

export async function listMasterAreaTypes(): Promise<SimpleMasterItem[]> {
  const data = await apiGet<MasterAreaTypeDTO[]>('/admin/master-management/master_area_types');
  return (data || []).map((it) => ({ id: it.id, label: it.display_label, active: it.status === 'active', order: it.display_order }));
}

export async function listMasterDocumentTypes(): Promise<DocumentTypeItem[]> {
  const data = await apiGet<MasterDocumentTypeDTO[]>('/admin/master-management/master_document_types');
  return (data || []).map((it) => ({ id: it.id, label: it.display_label, description: it.description, required: it.required === 'required', active: it.status === 'active', order: it.display_order }));
}

// Creates
export async function createMasterProjectType(body: { name: string; status: ActiveStatus; display_order: number }): Promise<MasterProjectTypeDTO> {
  return apiPost<MasterProjectTypeDTO>('/admin/master-management/master_project_types', body);
}

export async function createMasterSubProjectType(body: { project_type_id: number; name: string; status: ActiveStatus; display_order: number }): Promise<MasterSubProjectTypeDTO> {
  return apiPost<MasterSubProjectTypeDTO>('/admin/master-management/master_sub_project_types', body);
}

export async function createMasterConstructionType(body: { name: string; status: ActiveStatus; display_order: number }): Promise<MasterConstructionTypeDTO> {
  return apiPost<MasterConstructionTypeDTO>('/admin/master-management/master_construction_types', body);
}

export async function createMasterCountry(body: { name: string; status: ActiveStatus; display_order: number; code?: string }): Promise<MasterCountryDTO> {
  return apiPost<MasterCountryDTO>('/admin/master-management/master_countries', body);
}

export async function createMasterRegion(body: { country_id: number; name: string; status: ActiveStatus; display_order: number }): Promise<MasterRegionDTO> {
  return apiPost<MasterRegionDTO>('/admin/master-management/master_regions', body);
}

export async function createMasterZone(body: { region_id: number; name: string; status: ActiveStatus; display_order: number }): Promise<MasterZoneDTO> {
  return apiPost<MasterZoneDTO>('/admin/master-management/master_zones', body);
}

export async function createMasterRoleType(body: { display_label: string; status: ActiveStatus; display_order: number }): Promise<MasterRoleTypeDTO> {
  return apiPost<MasterRoleTypeDTO>('/admin/master-management/master_role_types', body);
}

export async function createMasterContractType(body: { name: string; status: ActiveStatus; display_order: number }): Promise<MasterContractTypeDTO> {
  return apiPost<MasterContractTypeDTO>('/admin/master-management/master_contract_types', body);
}

export async function createMasterSoilType(body: { name: string; status: ActiveStatus; display_order: number }): Promise<MasterSoilTypeDTO> {
  return apiPost<MasterSoilTypeDTO>('/admin/master-management/master_soil_types', body);
}

export async function createMasterSubcontractorType(body: { display_label: string; status: ActiveStatus; display_order: number }): Promise<MasterSubcontractorTypeDTO> {
  return apiPost<MasterSubcontractorTypeDTO>('/admin/master-management/master_subcontractor_types', body);
}

export async function createMasterConsultantRole(body: { display_label: string; status: ActiveStatus; display_order: number }): Promise<MasterConsultantRoleDTO> {
  return apiPost<MasterConsultantRoleDTO>('/admin/master-management/master_consultant_roles', body);
}

export async function createMasterSecurityType(body: { display_label: string; status: ActiveStatus; display_order: number }): Promise<MasterSecurityTypeDTO> {
  return apiPost<MasterSecurityTypeDTO>('/admin/master-management/master_security_types', body);
}

export async function createMasterAreaType(body: { display_label: string; status: ActiveStatus; display_order: number }): Promise<MasterAreaTypeDTO> {
  return apiPost<MasterAreaTypeDTO>('/admin/master-management/master_area_types', body);
}

export async function createMasterDocumentType(body: { display_label: string; description?: string; required: 'required' | 'optional'; status: ActiveStatus; display_order: number }): Promise<MasterDocumentTypeDTO> {
  return apiPost<MasterDocumentTypeDTO>('/admin/master-management/master_document_types', body);
}

// Deletes
export interface DeleteResult { success: boolean }

export async function deleteMasterProjectType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_project_types/${id}`);
  return { success: true };
}

export async function deleteMasterSubProjectType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_sub_project_types/${id}`);
  return { success: true };
}

export async function deleteMasterConstructionType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_construction_types/${id}`);
  return { success: true };
}

export async function deleteMasterCountry(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_countries/${id}`);
  return { success: true };
}

export async function deleteMasterRegion(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_regions/${id}`);
  return { success: true };
}

export async function deleteMasterZone(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_zones/${id}`);
  return { success: true };
}

export async function deleteMasterRoleType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_role_types/${id}`);
  return { success: true };
}

export async function deleteMasterContractType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_contract_types/${id}`);
  return { success: true };
}

export async function deleteMasterSoilType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_soil_types/${id}`);
  return { success: true };
}

export async function deleteMasterSubcontractorType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_subcontractor_types/${id}`);
  return { success: true };
}

export async function deleteMasterConsultantRole(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_consultant_roles/${id}`);
  return { success: true };
}

export async function deleteMasterSecurityType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_security_types/${id}`);
  return { success: true };
}

export async function deleteMasterAreaType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_area_types/${id}`);
  return { success: true };
}

export async function deleteMasterDocumentType(id: number): Promise<DeleteResult> {
  await apiDelete(`/admin/master-management/master_document_types/${id}`);
  return { success: true };
}


// Updates
export type ActiveStatus = 'active' | 'inactive';

export async function updateMasterProjectType(id: number, body: { name: string; status: ActiveStatus; display_order: number }): Promise<MasterProjectTypeDTO> {
  return apiPatch<MasterProjectTypeDTO>(`/admin/master-management/master_project_types/${id}`, body);
}

export async function updateMasterSubProjectType(id: number, body: { project_type_id: number; name: string; status: ActiveStatus; display_order: number }): Promise<MasterSubProjectTypeDTO> {
  return apiPatch<MasterSubProjectTypeDTO>(`/admin/master-management/master_sub_project_types/${id}`, body);
}

export async function updateMasterConstructionType(id: number, body: { name: string; status: ActiveStatus; display_order: number }): Promise<MasterConstructionTypeDTO> {
  return apiPatch<MasterConstructionTypeDTO>(`/admin/master-management/master_construction_types/${id}`, body);
}

export async function updateMasterCountry(id: number, body: { name: string; status: ActiveStatus; display_order: number; code?: string }): Promise<MasterCountryDTO> {
  return apiPatch<MasterCountryDTO>(`/admin/master-management/master_countries/${id}`, body);
}

export async function updateMasterRegion(id: number, body: { country_id: number; name: string; status: ActiveStatus; display_order: number }): Promise<MasterRegionDTO> {
  return apiPatch<MasterRegionDTO>(`/admin/master-management/master_regions/${id}`, body);
}

export async function updateMasterZone(id: number, body: { region_id: number; name: string; status: ActiveStatus; display_order: number }): Promise<MasterZoneDTO> {
  return apiPatch<MasterZoneDTO>(`/admin/master-management/master_zones/${id}`, body);
}

export async function updateMasterRoleType(id: number, body: { display_label: string; status: ActiveStatus; display_order: number }): Promise<MasterRoleTypeDTO> {
  return apiPatch<MasterRoleTypeDTO>(`/admin/master-management/master_role_types/${id}`, body);
}

export async function updateMasterContractType(id: number, body: { name: string; status: ActiveStatus; display_order: number }): Promise<MasterContractTypeDTO> {
  return apiPatch<MasterContractTypeDTO>(`/admin/master-management/master_contract_types/${id}`, body);
}

export async function updateMasterSoilType(id: number, body: { name: string; status: ActiveStatus; display_order: number }): Promise<MasterSoilTypeDTO> {
  return apiPatch<MasterSoilTypeDTO>(`/admin/master-management/master_soil_types/${id}`, body);
}

export async function updateMasterSubcontractorType(id: number, body: { display_label: string; status: ActiveStatus; display_order: number }): Promise<MasterSubcontractorTypeDTO> {
  return apiPatch<MasterSubcontractorTypeDTO>(`/admin/master-management/master_subcontractor_types/${id}`, body);
}

export async function updateMasterConsultantRole(id: number, body: { display_label: string; status: ActiveStatus; display_order: number }): Promise<MasterConsultantRoleDTO> {
  return apiPatch<MasterConsultantRoleDTO>(`/admin/master-management/master_consultant_roles/${id}`, body);
}

export async function updateMasterSecurityType(id: number, body: { display_label: string; status: ActiveStatus; display_order: number }): Promise<MasterSecurityTypeDTO> {
  return apiPatch<MasterSecurityTypeDTO>(`/admin/master-management/master_security_types/${id}`, body);
}

export async function updateMasterAreaType(id: number, body: { display_label: string; status: ActiveStatus; display_order: number }): Promise<MasterAreaTypeDTO> {
  return apiPatch<MasterAreaTypeDTO>(`/admin/master-management/master_area_types/${id}`, body);
}

export async function updateMasterDocumentType(id: number, body: { display_label: string; description?: string; required: 'required' | 'optional'; status: ActiveStatus; display_order: number }): Promise<MasterDocumentTypeDTO> {
  return apiPatch<MasterDocumentTypeDTO>(`/admin/master-management/master_document_types/${id}`, body);
}

