import { ProposalBundleResponse } from '@/lib/api/quotes';

// Map ProposalBundleResponse to ProposalForm data structure
export const mapProposalBundleToFormData = (proposalBundle: ProposalBundleResponse) => {
  const project = proposalBundle.project;
  const insured = proposalBundle.insured?.details;
  const contractStructure = proposalBundle.contract_structure?.details;
  const siteRisks = proposalBundle.site_risks;
  const coverRequirements = proposalBundle.cover_requirements;

  return {
    // Project Details Tab
    projectName: project?.project_name || "",
    projectType: project?.project_type || "",
    subProjectType: project?.sub_project_type || "",
    constructionType: project?.construction_type || "",
    country: project?.country || "uae",
    region: project?.region || "",
    zone: project?.zone || "",
    projectAddress: project?.address || "",
    coordinates: project?.coordinates || "",
    projectValue: project?.project_value?.toString() || "0",
    startDate: project?.start_date ? new Date(project.start_date).toISOString().split('T')[0] : "",
    completionDate: project?.completion_date ? new Date(project.completion_date).toISOString().split('T')[0] : "",
    constructionPeriod: project?.construction_period_months?.toString() || "",
    maintenancePeriod: project?.maintenance_period_months?.toString() || "12",
    
    // Insured Details Tab
    insuredName: insured?.insured_name || "",
    roleOfInsured: insured?.role_of_insured || "contractor",
    
    // Contract Structure Tab
    mainContractor: contractStructure?.main_contractor || "",
    principalOwner: contractStructure?.principal_owner || "",
    contractType: contractStructure?.contract_type || "",
    contractNumber: contractStructure?.contract_number || "",
    experienceYears: contractStructure?.experience_years?.toString() || "",
    
    // Sub Contractors & Consultants
    subContractors: proposalBundle.contract_structure?.sub_contractors?.map(sub => ({
      name: sub.name || "",
      contractType: sub.contract_type || "",
      contractNumber: sub.contract_number || ""
    })) || [],
    
    consultants: proposalBundle.contract_structure?.consultants?.map(consultant => ({
      name: consultant.name || "",
      role: consultant.role || "",
      licenseNumber: consultant.license_number || ""
    })) || [],
    
    // Site Risk Assessment Tab
    nearWaterBody: siteRisks?.near_water_body ? "yes" : "no",
    waterBodyDistance: siteRisks?.water_body_distance?.toString() || "",
    floodProneZone: siteRisks?.flood_prone_zone ? "yes" : "no", 
    withinCityCenter: siteRisks?.within_city_center ? "yes" : "no",
    cityAreaType: siteRisks?.city_area_type || "",
    soilType: siteRisks?.soil_type || "",
    existingStructure: siteRisks?.existing_structure ? "yes" : "no",
    existingStructureDetails: siteRisks?.existing_structure_details || "",
    blastingExcavation: siteRisks?.blasting_excavation ? "yes" : "no",
    siteSecurityArrangements: siteRisks?.site_security_arrangements || "",
    
    // Cover Requirements Tab
    sumInsuredMaterial: coverRequirements?.contract_works?.toString() || "",
    sumInsuredPlant: coverRequirements?.plant_and_equipment?.toString() || "",
    sumInsuredTemporary: coverRequirements?.temporary_works?.toString() || "0",
    principalExistingProperty: coverRequirements?.principals_property?.toString() || "",
    tplLimit: coverRequirements?.tpl_limit?.toString() || "",
    crossLiabilityCover: coverRequirements?.cross_liability_cover === 'yes' ? 'yes' : 'no',
    removalDebrisLimit: coverRequirements?.removal_debris_limit?.toString() || "",
    surroundingPropertyLimit: coverRequirements?.surrounding_property_limit?.toString() || "",
    
    // Additional required fields
    thirdPartyLimit: coverRequirements?.tpl_limit?.toString() || "",
    lossesInLastFiveYears: proposalBundle.insured?.details?.had_losses_last_5yrs ? "yes" : "no",
    lossesDetails: "",
    otherMaterials: coverRequirements?.other_materials?.toString() || "",
    documents: {
      boq: { uploaded: false, url: "", fileName: "", label: "Bill of Quantities (BOQ)" },
      gantt_chart: { uploaded: false, url: "", fileName: "", label: "Gantt Chart / Work Schedule" },
      contract_agreement: { uploaded: false, url: "", fileName: "", label: "Contract Agreement" },
      site_layout_plan: { uploaded: false, url: "", fileName: "", label: "Site Layout Plan" },
      other_supporting_docs: { uploaded: false, url: "", fileName: "", label: "Other Supporting Documents" }
    },
    
    // Claims History
    claimsHistory: proposalBundle.insured?.claims?.map(claim => ({
      year: claim.year || new Date().getFullYear(),
      claimCount: claim.claim_count || 0,
      amount: claim.amount?.toString() || "",
      description: claim.description || ""
    })) || []
  };
};

// Determine the appropriate step based on data completeness
export const determineCurrentStep = (proposalBundle: ProposalBundleResponse): number => {
  // Step 0: Project Details
  if (!proposalBundle.project?.project_name || !proposalBundle.project?.project_type) {
    return 0;
  }
  
  // Step 1: Contract Structure  
  if (!proposalBundle.contract_structure?.details?.main_contractor) {
    return 1;
  }
  
  // Step 2: Cover Requirements
  if (!proposalBundle.cover_requirements?.contract_works) {
    return 2;
  }
  
  // Step 3: Insured Details
  if (!proposalBundle.insured?.details?.insured_name) {
    return 3;
  }
  
  // Step 4: Site Risk Assessment
  if (!proposalBundle.site_risks) {
    return 4;
  }
  
  // Step 5: Underwriting Documents
  if (!proposalBundle.required_documents || proposalBundle.required_documents.length === 0) {
    return 5;
  }
  
  // Step 6: Quotes Comparison (if no plans selected)
  if (!proposalBundle.plans || proposalBundle.plans.length === 0) {
    return 6;
  }
  
  // Step 7: Declaration (final step)
  return 7;
};

// Map quote status to step completion
export const getStepCompletionStatus = (proposalBundle: ProposalBundleResponse) => {
  return {
    project_details: !!proposalBundle.project?.project_name,
    contract_structure: !!proposalBundle.contract_structure?.details?.main_contractor,
    cover_requirements: !!proposalBundle.cover_requirements?.contract_works,
    insured_details: !!proposalBundle.insured?.details?.insured_name,
    site_risks: !!proposalBundle.site_risks,
    underwriting_documents: !!(proposalBundle.required_documents && proposalBundle.required_documents.length > 0),
    coverages_selected: !!(proposalBundle.plans && proposalBundle.plans.length > 0),
    plans_selected: !!(proposalBundle.plans && proposalBundle.plans.length > 0),
    policy_required_documents: !!proposalBundle.required_documents_for_policy_issue,
    policy_issued: proposalBundle.quote_meta?.status === 'policy_created'
  };
};
