import { useState, useEffect, useRef, useMemo } from "react"; 
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building, MapPin, Calendar, DollarSign, Shield, FileText, Plus, Trash2, Car, Umbrella } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OpenStreetMapDialog } from "./OpenStreetMapDialog";
import { getActiveProjectTypes, getActiveConstructionTypes, getSubProjectTypesByProjectType } from "@/lib/masters-data";
import { getActiveCountries, getRegionsByCountry, getZonesByRegion } from "@/lib/location-data";
import { 
  listMasterProjectTypes, 
  listMasterSubProjectTypes, 
  listMasterConstructionTypes, 
  listMasterRoleTypes, 
  listMasterContractTypes, 
  listMasterSoilTypes, 
  listMasterSecurityTypes, 
  listMasterSubcontractorTypes, 
  listMasterConsultantRoles,
  type SimpleMasterItem,
  type SubProjectTypeItem
} from "@/lib/api/masters";
import { getBroker, getBrokerInsurers, type Broker, type BrokerInsurersResponse } from "@/lib/api/brokers";
import { getBrokerCompanyId } from "@/lib/auth";
import { createQuoteProject, updateQuoteProject, type QuoteProjectRequest, type QuoteProjectResponse, saveInsuredDetails, updateInsuredDetails, type InsuredDetailsRequest, type InsuredDetailsResponse, saveContractStructure, updateContractStructure, type ContractStructureRequest, type ContractStructureResponse, saveSiteRisks, updateSiteRisks, type SiteRisksRequest, type SiteRisksResponse, saveCoverRequirements, updateCoverRequirements, type CoverRequirementsRequest, type CoverRequirementsResponse, saveRequiredDocuments, updateRequiredDocuments, type RequiredDocumentsRequest, type RequiredDocumentsResponse, getProposalBundle, type ProposalBundleResponse, getInsurerPricingConfig, type InsurerPricingConfigResponse } from "@/lib/api/quotes";
import { checkWaterBodyProximity } from "@/lib/api/water-body";
import { useToast } from "@/hooks/use-toast";
import { DocumentUpload } from "./DocumentUpload";
import { QuotesComparison } from "./QuotesComparison";
import DeclarationTab from "./DeclarationTab";
import { mapProposalBundleToFormData, mapProposalBundleToFormDataWithMetadata, determineCurrentStep, getStepCompletionStatus } from "@/utils/quote-resume";

// Extend Window interface for global functions
declare global {
  interface Window {
    onQuoteSelected?: (quoteId: number) => void;
  }
}

interface ProposalFormProps {
  onStepChange?: (step: number) => void;
  onQuoteReferenceChange?: (reference: string) => void;
  onStepCompletionChange?: (completionStatus: Record<string, boolean>) => void;
}

export const ProposalForm = ({ onStepChange, onQuoteReferenceChange, onStepCompletionChange }: ProposalFormProps = {}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const {
    navigateBack
  } = useNavigationHistory();
  
  // Legacy data (keeping for fallback)
  const activeProjectTypes = getActiveProjectTypes();
  const activeConstructionTypes = getActiveConstructionTypes();
  const activeCountries = getActiveCountries();

  // Master Data State Management
  const [masterData, setMasterData] = useState({
    projectTypes: [] as SimpleMasterItem[],
    subProjectTypes: [] as SubProjectTypeItem[],
    constructionTypes: [] as SimpleMasterItem[],
    roleTypes: [] as SimpleMasterItem[],
    contractTypes: [] as SimpleMasterItem[],
    soilTypes: [] as SimpleMasterItem[],
    securityTypes: [] as SimpleMasterItem[],
    subcontractorTypes: [] as SimpleMasterItem[],
    consultantRoles: [] as SimpleMasterItem[]
  });

  const [loadingStates, setLoadingStates] = useState({
    isLoading: true,
    hasError: false,
    errorMessage: ''
  });

  // Broker Data State Management
  const [brokerData, setBrokerData] = useState<Broker | null>(null);
  const [brokerLoading, setBrokerLoading] = useState({
    isLoading: false,
    hasError: false,
    errorMessage: ''
  });

  // Location Search Modal State
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Quote Project API State
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [savedProjectData, setSavedProjectData] = useState<QuoteProjectResponse | null>(null);
  
  // Insured Details API State
  const [isSavingInsuredDetails, setIsSavingInsuredDetails] = useState(false);
  
  // Contract Structure API State
  const [isSavingContractStructure, setIsSavingContractStructure] = useState(false);
  
  // Site Risks API State
  const [isSavingSiteRisks, setIsSavingSiteRisks] = useState(false);
  
  // Cover Requirements API State
  const [isSavingCoverRequirements, setIsSavingCoverRequirements] = useState(false);
  
  // Required Documents API State
  const [isSavingDocuments, setIsSavingDocuments] = useState(false);
  const [requiredDocumentTypes, setRequiredDocumentTypes] = useState<Array<{id: number, name: string, required: boolean}>>([]);
  const [allDocumentTypes, setAllDocumentTypes] = useState<Array<{id: number, name: string, required: boolean, status: string, fileUrl?: string, fileName?: string}>>([]);
  
  // Declaration submission state - will be handled by DeclarationTab component
  
  // Assigned Insurers State
  const [assignedInsurers, setAssignedInsurers] = useState<BrokerInsurersResponse | null>(null);
  const [isLoadingInsurers, setIsLoadingInsurers] = useState(false);
  
  // Current Proposal State
  const [currentProposal, setCurrentProposal] = useState<ProposalBundleResponse | null>(null);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  
  // Resume Quote State
  const [isResumeMode, setIsResumeMode] = useState(false);
  const [resumeQuoteId, setResumeQuoteId] = useState<string | null>(null);
  const [isLoadingResumeData, setIsLoadingResumeData] = useState(false);
  const [pendingResumeData, setPendingResumeData] = useState<ProposalBundleResponse | null>(null);
  
  // Insurer Pricing Configurations State
  const [insurerPricingConfigs, setInsurerPricingConfigs] = useState<Record<number, InsurerPricingConfigResponse>>({});
  const [isLoadingPricingConfigs, setIsLoadingPricingConfigs] = useState(false);
  
  
  // Water Body Detection State
  const [isWaterBodyAutoFilled, setIsWaterBodyAutoFilled] = useState(false);
  
  // Fresh Temporary Storage for Current Quote Session
  const [currentQuoteId, setCurrentQuoteId] = useState<number | null>(null);
  const [quoteReferenceNumber, setQuoteReferenceNumber] = useState<string | null>(null);
  const [stepCompletionStatus, setStepCompletionStatus] = useState({
    project_details: false,
    contract_structure: false,
    cover_requirements: false,
    insured_details: false,
    site_risks: false,
    underwriting_documents: false,
    coverages_selected: false,
    plans_selected: false,
    policy_required_documents: false,
    policy_issued: false
  });
  
  // Water Body Detection State
  const [isCheckingWaterBody, setIsCheckingWaterBody] = useState(false);
  
  // Claims Disclaimer State
  const [showClaimsDisclaimer, setShowClaimsDisclaimer] = useState(false);
  const [claimsDisclaimerAccepted, setClaimsDisclaimerAccepted] = useState(false);
  

  // Check for resume parameter and load existing quote data
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const resumeParam = searchParams.get('resume');
    
    if (resumeParam) {
      setIsResumeMode(true);
      setResumeQuoteId(resumeParam);
      loadResumeData(resumeParam);
    } else {
      // Initialize fresh quote session for new quotes
      initializeFreshQuoteStorage();
    }
  }, [location.search]);

  // Load existing quote data for resume functionality
  const loadResumeData = async (quoteId: string) => {
    try {
      setIsLoadingResumeData(true);
      console.log('🔄 Loading resume data for quote:', quoteId);
      
      const proposalBundle = await getProposalBundle(parseInt(quoteId));
      console.log('📋 Loaded proposal bundle for resume:', proposalBundle);
      
      // Store proposal bundle for later processing after metadata loads
      setPendingResumeData(proposalBundle);
      
      // Set current quote ID and reference
      setCurrentQuoteId(parseInt(quoteId));
      setQuoteReferenceNumber(proposalBundle.quote_meta?.quote_id?.toString() || null);
      
      // Set step completion status
      const completionStatus = getStepCompletionStatus(proposalBundle);
      setStepCompletionStatus(completionStatus);
      
      // Determine appropriate current step
      const appropriateStep = determineCurrentStep(proposalBundle);
      setCurrentStep(appropriateStep);
      
      console.log('✅ Resume data loaded successfully:', {
        currentStep: appropriateStep,
        completionStatus,
        quoteId: parseInt(quoteId)
      });
      
      toast({
        title: "Quote Resumed",
        description: `Continuing quote ${proposalBundle.quote_meta?.quote_id || quoteId}`,
      });
      
    } catch (error) {
      console.error('❌ Error loading resume data:', error);
      toast({
        title: "Error",
        description: "Failed to load quote data. Starting fresh quote.",
        variant: "destructive"
      });
      // Fallback to fresh quote
      initializeFreshQuoteStorage();
    } finally {
      setIsLoadingResumeData(false);
    }
  };

  // Process pending resume data after metadata loads
  useEffect(() => {
    if (pendingResumeData && masterData.projectTypes.length > 0 && brokerData && !brokerLoading.isLoading) {
      console.log('📊 Metadata loaded, now processing resume data...');
      console.log('📋 Available project types:', masterData.projectTypes);
      console.log('🏢 Broker data loaded:', brokerData);
      
      // Map proposal bundle data to form data with metadata for proper dropdown matching
      const mappedFormData = mapProposalBundleToFormDataWithMetadata(pendingResumeData, {
        projectTypes: masterData.projectTypes,
        constructionTypes: masterData.constructionTypes,
        roleTypes: masterData.roleTypes,
        contractTypes: masterData.contractTypes,
        soilTypes: masterData.soilTypes,
        countries: brokerData.operatingCountries || [],
        regions: brokerData.operatingRegions || [],
        zones: brokerData.operatingZones || []
      });
      console.log('🗂️ Mapped form data with metadata:', mappedFormData);
      
      // Set form data
      setFormData(mappedFormData);
      
      // Clear pending data
      setPendingResumeData(null);
      
      console.log('✅ Resume data applied successfully with metadata');
    }
  }, [pendingResumeData, masterData.projectTypes, brokerData, brokerLoading.isLoading]);

  // Initialize fresh temporary storage for new quote session
  const initializeFreshQuoteStorage = () => {
    console.log('🆕 Initializing fresh quote storage for new session');
    
    // Reset all quote-related state
    setCurrentQuoteId(null);
    setQuoteReferenceNumber(null);
    setSavedProjectData(null);
    setStepCompletionStatus({
      project_details: false,
      contract_structure: false,
      cover_requirements: false,
      insured_details: false,
      site_risks: false,
      underwriting_documents: false,
      coverages_selected: false,
      plans_selected: false,
      policy_required_documents: false,
      policy_issued: false
    });
    
    // Clear any existing localStorage for this session
    localStorage.removeItem('currentQuoteId');
    localStorage.removeItem('quoteReferenceNumber');
    localStorage.removeItem('stepCompletionStatus');
    localStorage.removeItem('projectDataExists');
    localStorage.removeItem('claimsDisclaimerAccepted');
    localStorage.removeItem('coverages_selected');
    localStorage.removeItem('plans_selected');
    localStorage.removeItem('broker_id');
  };

  // Clear temporary storage when exiting proposal form
  const clearTemporaryStorage = () => {
    console.log('🧹 Clearing temporary quote storage on exit');
    
    // Reset all state
    setCurrentQuoteId(null);
    setQuoteReferenceNumber(null);
    setSavedProjectData(null);
    setStepCompletionStatus({
      project_details: false,
      contract_structure: false,
      cover_requirements: false,
      insured_details: false,
      site_risks: false,
      underwriting_documents: false,
      coverages_selected: false,
      plans_selected: false,
      policy_required_documents: false,
      policy_issued: false
    });
    
    // Clear localStorage
    localStorage.removeItem('currentQuoteId');
    localStorage.removeItem('quoteReferenceNumber');
    localStorage.removeItem('stepCompletionStatus');
    localStorage.removeItem('projectDataExists');
    localStorage.removeItem('claimsDisclaimerAccepted');
    localStorage.removeItem('coverages_selected');
    localStorage.removeItem('plans_selected');
    localStorage.removeItem('broker_id');
  };

  // Mark a step as completed
  const markStepCompleted = (stepName: keyof typeof stepCompletionStatus) => {
    console.log(`✅ Marking step completed: ${stepName}`);
    setStepCompletionStatus(prev => {
      const updated = { ...prev, [stepName]: true };
      console.log('📊 Updated step completion status:', updated);
      localStorage.setItem('stepCompletionStatus', JSON.stringify(updated));
      return updated;
    });
  };

  // Check if a step is completed
  const isStepCompleted = (stepName: keyof typeof stepCompletionStatus): boolean => {
    return stepCompletionStatus[stepName];
  };

  // Get completion percentage
  const getCompletionPercentage = (): number => {
    const totalSteps = Object.keys(stepCompletionStatus).length;
    const completedSteps = Object.values(stepCompletionStatus).filter(Boolean).length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  // Expose storage management functions for external use
  const storageAPI = {
    getCurrentQuoteId: () => currentQuoteId,
    getQuoteReferenceNumber: () => quoteReferenceNumber,
    getStepCompletionStatus: () => stepCompletionStatus,
    getCompletionPercentage,
    isStepCompleted,
    markStepCompleted,
    clearTemporaryStorage,
    initializeFreshQuoteStorage
  };

  // Make storage API available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).proposalStorageAPI = storageAPI;
  }

  // Default form data - all fields empty for new proposals
  const getDefaultFormData = () => ({
    projectName: "",
    projectType: "",
    subProjectType: "",
    constructionType: "",
    country: "uae",
    region: "",
    zone: "",
    projectAddress: "",
    coordinates: "",
    projectValue: "0", // Always 0 as requested
    startDate: new Date().toISOString().split('T')[0],
    completionDate: "",
    constructionPeriod: "",
    maintenancePeriod: "12",
    thirdPartyLimit: "",
    insuredName: "",
    roleOfInsured: "contractor",
    mainContractor: "",
    principalOwner: "",
    contractType: "",
    contractNumber: "",
    experienceYears: "",
    consultants: [],
    subContractors: [],
    nearWaterBody: "no",
    waterBodyDistance: "",
    floodProneZone: "no",
    withinCityCenter: "",
    cityAreaType: "",
    soilType: "",
    existingStructure: "no",
    existingStructureDetails: "",
    blastingExcavation: "no",
    siteSecurityArrangements: "",
    sumInsuredMaterial: "",
    sumInsuredPlant: "",
    sumInsuredTemporary: "0",
    tplLimit: "",
    crossLiabilityCover: "yes",
    principalExistingProperty: "0",
    removalDebrisLimit: "",
    surroundingPropertyLimit: "",
    lossesInLastFiveYears: "no",
    lossesDetails: "",
    claimsHistory: [{
      year: 2025,
      claimCount: 0,
      amount: "",
      description: ""
    }, {
      year: 2024,
      claimCount: 0,
      amount: "",
      description: ""
    }, {
      year: 2023,
      claimCount: 0,
      amount: "",
      description: ""
    }, {
      year: 2022,
      claimCount: 0,
      amount: "",
      description: ""
    }, {
      year: 2021,
      claimCount: 0,
      amount: "",
      description: ""
    }],
    otherMaterials: "",
    // Document upload status
    documents: {
      boq: { uploaded: false, url: "", fileName: "", label: "BOQ or Cost Breakdown" },
      gantt_chart: { uploaded: false, url: "", fileName: "", label: "Project Gantt Chart" },
      contract_agreement: { uploaded: false, url: "", fileName: "", label: "Contract Agreement" },
      site_layout_plan: { uploaded: false, url: "", fileName: "", label: "Site Layout Plan" },
      other_supporting_docs: { uploaded: false, url: "", fileName: "", label: "Other supporting docs" }
    }
  });

  // Optimized Master Data Fetching Function
  const fetchMasterData = async () => {
    try {
      console.log('🚀 Loading master data for proposal form...');
      setLoadingStates({ isLoading: true, hasError: false, errorMessage: '' });

      // Load all master data in parallel using Promise.allSettled for resilience
      const allPromises = [
        listMasterProjectTypes(),
        listMasterSubProjectTypes(),
        listMasterConstructionTypes(),
        listMasterRoleTypes(),
        listMasterContractTypes(),
        listMasterSoilTypes(),
        listMasterSecurityTypes(),
        listMasterSubcontractorTypes(),
        listMasterConsultantRoles()
      ];

      const results = await Promise.allSettled(allPromises);
      
      // Process results and handle partial failures gracefully
      const [
        projectTypesResult,
        subProjectTypesResult,
        constructionTypesResult,
        roleTypesResult,
        contractTypesResult,
        soilTypesResult,
        securityTypesResult,
        subcontractorTypesResult,
        consultantRolesResult
      ] = results;

      // Extract data from successful results, use empty array for failed ones
      const projectTypes = projectTypesResult.status === 'fulfilled' ? projectTypesResult.value : [];
      const subProjectTypes = subProjectTypesResult.status === 'fulfilled' ? subProjectTypesResult.value : [];
      const constructionTypes = constructionTypesResult.status === 'fulfilled' ? constructionTypesResult.value : [];
      const roleTypes = roleTypesResult.status === 'fulfilled' ? roleTypesResult.value : [];
      const contractTypes = contractTypesResult.status === 'fulfilled' ? contractTypesResult.value : [];
      const soilTypes = soilTypesResult.status === 'fulfilled' ? soilTypesResult.value : [];
      const securityTypes = securityTypesResult.status === 'fulfilled' ? securityTypesResult.value : [];
      const subcontractorTypes = subcontractorTypesResult.status === 'fulfilled' ? subcontractorTypesResult.value : [];
      const consultantRoles = consultantRolesResult.status === 'fulfilled' ? consultantRolesResult.value : [];

      // Update state with active items only
      setMasterData({
        projectTypes: projectTypes.filter(item => item.active).sort((a, b) => a.order - b.order),
        subProjectTypes: (subProjectTypes as SubProjectTypeItem[]).filter(item => item.active).sort((a, b) => a.order - b.order),
        constructionTypes: constructionTypes.filter(item => item.active).sort((a, b) => a.order - b.order),
        roleTypes: roleTypes.filter(item => item.active).sort((a, b) => a.order - b.order),
        contractTypes: contractTypes.filter(item => item.active).sort((a, b) => a.order - b.order),
        soilTypes: soilTypes.filter(item => item.active).sort((a, b) => a.order - b.order),
        securityTypes: securityTypes.filter(item => item.active).sort((a, b) => a.order - b.order),
        subcontractorTypes: subcontractorTypes.filter(item => item.active).sort((a, b) => a.order - b.order),
        consultantRoles: consultantRoles.filter(item => item.active).sort((a, b) => a.order - b.order)
      });

      // Check for any failures and log them
      const failedRequests = results.filter(result => result.status === 'rejected');
      if (failedRequests.length > 0) {
        console.warn(`⚠️ ${failedRequests.length} master data requests failed:`, failedRequests);
        toast({
          title: "Partial Data Load",
          description: `Some form options may be limited. ${failedRequests.length} data sources failed to load.`,
          variant: "default"
        });
      }

      console.log('✅ Master data loaded successfully');
      
      // Clear form data fields that are populated from master data to show placeholders
      setFormData(prev => ({
        ...prev,
        projectType: "",
        subProjectType: "",
        constructionType: "",
        roleOfInsured: "",
        contractType: "",
        soilType: "",
        siteSecurityArrangements: "",
        // Clear dynamic fields
        consultants: [],
        subContractors: []
      }));
      
      setLoadingStates({ isLoading: false, hasError: false, errorMessage: '' });

    } catch (error: any) {
      console.error('❌ Failed to load master data:', error);
      const errorMessage = error?.message || 'Failed to load form options';
      
      setLoadingStates({ 
        isLoading: false, 
        hasError: true, 
        errorMessage 
      });

      toast({
        title: "Loading Error",
        description: "Failed to load form options. Using default values.",
        variant: "destructive"
      });
    }
  };

  // Broker Data Fetching Function
  const fetchBrokerData = async () => {
    try {
      console.log('🚀 Loading broker data for geographical coverage...');
      setBrokerLoading({ isLoading: true, hasError: false, errorMessage: '' });
      
      // Get current broker ID from store
      const brokerId = getBrokerCompanyId();
      if (!brokerId) {
        throw new Error('Broker ID not found. Please log in again.');
      }
      
      // Fetch broker details using current broker's ID
      const broker = await getBroker(brokerId);
      setBrokerData(broker);
      
      console.log('✅ Broker data loaded successfully:', broker);
      console.log('🌍 Operating countries:', broker.operatingCountries);
      console.log('🌍 Operating regions:', broker.operatingRegions);
      console.log('🌍 Operating zones:', broker.operatingZones);
      
      // Clear geographical fields to show placeholders
      setFormData(prev => ({
        ...prev,
        country: "",
        region: "",
        zone: ""
      }));
      
    } catch (error: any) {
      console.error('❌ Error loading broker data:', error);
      const errorMessage = error?.message || 'Failed to load broker geographical coverage';
      setBrokerLoading({ isLoading: false, hasError: true, errorMessage });
      
      toast({
        title: "Warning",
        description: "Could not load broker geographical coverage. Using default options.",
        variant: "destructive"
      });
    } finally {
      setBrokerLoading({ isLoading: false, hasError: false, errorMessage: '' });
    }
  };

  // Load master data when component mounts
  useEffect(() => {
    fetchMasterData();
    fetchBrokerData();
  }, []);

  // Initialize fresh storage when component mounts (user enters /customer/proposal)
  useEffect(() => {
    console.log('🚀 ProposalForm mounted - initializing fresh storage');
    initializeFreshQuoteStorage();
    
    // Load disclaimer acceptance state from localStorage
    const savedDisclaimerAccepted = localStorage.getItem('claimsDisclaimerAccepted');
    if (savedDisclaimerAccepted === 'true') {
      setClaimsDisclaimerAccepted(true);
    }
    
    // Expose quote selection function globally for QuotesComparison
    window.onQuoteSelected = (quoteId: number) => {
      console.log('📋 Quote selected:', quoteId);
      console.log('📋 Current step before:', currentStep);
      // Mark plans as selected and navigate to declaration step
      markStepCompleted('plans_selected');
      // Use setTimeout to ensure state update happens after current render cycle
      setTimeout(() => {
        setCurrentStep(7); // Go to declaration step (index 7 = Declaration)
        console.log('📋 Setting step to 7 (Declaration)');
      }, 0);
    };
    
    // Cleanup when component unmounts (user exits /customer/proposal)
    return () => {
      console.log('🚪 ProposalForm unmounting - clearing temporary storage');
      clearTemporaryStorage();
      // Clean up global function
      delete window.onQuoteSelected;
    };
  }, []);

  // Debug current step changes
  useEffect(() => {
    console.log('🔄 Current step changed to:', currentStep);
  }, [currentStep]);

  // Handle browser navigation (back/forward/refresh) to clear storage
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🔄 Browser navigation detected - clearing temporary storage');
      clearTemporaryStorage();
    };

    const handlePopState = () => {
      console.log('⬅️ Browser back/forward detected - clearing temporary storage');
      clearTemporaryStorage();
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Notify parent component about step changes
  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  // Notify parent component about quote reference changes
  useEffect(() => {
    if (quoteReferenceNumber) {
      onQuoteReferenceChange?.(quoteReferenceNumber);
    }
  }, [quoteReferenceNumber, onQuoteReferenceChange]);

  // Notify parent component about step completion changes
  useEffect(() => {
    console.log('📤 Notifying parent about step completion changes:', stepCompletionStatus);
    onStepCompletionChange?.(stepCompletionStatus);
  }, [stepCompletionStatus, onStepCompletionChange]);

  // Helper functions to get options with fallbacks
  const getProjectTypeOptions = () => {
    if (masterData.projectTypes.length > 0) {
      return masterData.projectTypes;
    }
    // Fallback to legacy data
    return activeProjectTypes.map(pt => ({
      id: pt.id || 0,
      label: pt.label,
      active: true,
      order: 0
    }));
  };

  const getSubProjectTypeOptions = (projectTypeId?: number) => {
    if (masterData.subProjectTypes.length > 0) {
      return masterData.subProjectTypes.filter(spt => 
        !projectTypeId || spt.projectTypeId === projectTypeId
      );
    }
    // Fallback to legacy data
    return getSubProjectTypesByProjectType(projectTypeId || 0).map(spt => ({
      id: spt.id || 0,
      projectTypeId: projectTypeId || 0,
      label: spt.label,
      active: true,
      order: 0
    }));
  };

  const getConstructionTypeOptions = () => {
    if (masterData.constructionTypes.length > 0) {
      return masterData.constructionTypes;
    }
    // Fallback to legacy data
    return activeConstructionTypes.map(ct => ({
      id: ct.id || 0,
      label: ct.label,
      active: true,
      order: 0
    }));
  };

  const getRoleTypeOptions = () => {
    if (masterData.roleTypes.length > 0) {
      return masterData.roleTypes;
    }
    // Fallback to hardcoded options
    return [
      { id: 1, label: 'Main Contractor', active: true, order: 1 },
      { id: 2, label: 'Sub Contractor', active: true, order: 2 },
      { id: 3, label: 'Developer', active: true, order: 3 },
      { id: 4, label: 'Owner', active: true, order: 4 }
    ];
  };

  const getContractTypeOptions = () => {
    if (masterData.contractTypes.length > 0) {
      return masterData.contractTypes;
    }
    // Fallback to hardcoded options
    return [
      { id: 1, label: 'Turnkey', active: true, order: 1 },
      { id: 2, label: 'Design & Build', active: true, order: 2 },
      { id: 3, label: 'Construction Only', active: true, order: 3 },
      { id: 4, label: 'Supply Only', active: true, order: 4 }
    ];
  };

  const getSoilTypeOptions = () => {
    if (masterData.soilTypes.length > 0) {
      return masterData.soilTypes;
    }
    // Fallback to hardcoded options
    return [
      { id: 1, label: 'Rock', active: true, order: 1 },
      { id: 2, label: 'Clay', active: true, order: 2 },
      { id: 3, label: 'Sandy', active: true, order: 3 },
      { id: 4, label: 'Mixed', active: true, order: 4 },
      { id: 5, label: 'Unknown', active: true, order: 5 }
    ];
  };

  const getSecurityTypeOptions = () => {
    if (masterData.securityTypes.length > 0) {
      return masterData.securityTypes;
    }
    // Fallback to hardcoded options
    return [
      { id: 1, label: '24/7 Guarded', active: true, order: 1 },
      { id: 2, label: 'CCTV', active: true, order: 2 },
      { id: 3, label: 'Fenced', active: true, order: 3 },
      { id: 4, label: 'None', active: true, order: 4 }
    ];
  };

  const getSubcontractorTypeOptions = () => {
    if (masterData.subcontractorTypes.length > 0) {
      return masterData.subcontractorTypes;
    }
    // Fallback to hardcoded options
    return [
      { id: 1, label: 'Supply', active: true, order: 1 },
      { id: 2, label: 'Install', active: true, order: 2 },
      { id: 3, label: 'Supply & Install', active: true, order: 3 },
      { id: 4, label: 'Labor Only', active: true, order: 4 }
    ];
  };

  const getConsultantRoleOptions = () => {
    if (masterData.consultantRoles.length > 0) {
      return masterData.consultantRoles;
    }
    // Fallback to hardcoded options
    return [
      { id: 1, label: 'Structural Engineer', active: true, order: 1 },
      { id: 2, label: 'Architect', active: true, order: 2 },
      { id: 3, label: 'MEP Engineer', active: true, order: 3 },
      { id: 4, label: 'Project Manager', active: true, order: 4 }
    ];
  };

  // Geographical Helper Functions from Broker Data
  const getBrokerCountryOptions = () => {
    if (brokerData?.operatingCountries && brokerData.operatingCountries.length > 0) {
      return brokerData.operatingCountries.map((country, index) => ({
        id: index + 1,
        value: country.toLowerCase().replace(/\s+/g, '-'),
        label: country
      }));
    }
    // Fallback to legacy data
    return activeCountries;
  };

  const getBrokerRegionOptions = (selectedCountry: string) => {
    if (brokerData?.operatingRegions && brokerData.operatingRegions.length > 0) {
      console.log('🌍 Filtering regions for country:', selectedCountry);
      console.log('🌍 Available regions:', brokerData.operatingRegions);
      
      // Filter regions based on selected country
      const countryRegions = brokerData.operatingRegions.filter(region => {
        if (typeof region === 'string') {
          // If region is a string, we can't filter by country, so return all
          console.log('🌍 Region is string, including:', region);
          return true;
        }
        // If region is an object with country property, filter by country
        const regionCountry = region.country?.toLowerCase().replace(/\s+/g, '-');
        const selectedCountryNormalized = selectedCountry.toLowerCase().replace(/\s+/g, '-');
        const matches = regionCountry === selectedCountryNormalized;
        console.log('🌍 Region filtering:', {
          regionName: region.name,
          regionCountry,
          selectedCountryNormalized,
          matches
        });
        return matches;
      });
      
      console.log('🌍 Filtered regions:', countryRegions);
      
      return countryRegions.map((region, index) => {
        const regionName = typeof region === 'string' ? region : region.name || String(region);
        return {
          id: index + 1,
          value: regionName.toLowerCase().replace(/\s+/g, '-'),
          label: regionName
        };
      });
    }
    // Fallback to legacy data
    const country = activeCountries.find(c => c.value === selectedCountry);
    return country ? getRegionsByCountry(country.id) : [];
  };

  const getBrokerZoneOptions = (selectedRegion: string) => {
    if (brokerData?.operatingZones && brokerData.operatingZones.length > 0) {
      console.log('🌍 Filtering zones for region:', selectedRegion);
      console.log('🌍 Available zones:', brokerData.operatingZones);
      
      // Filter zones based on selected region
      const regionZones = brokerData.operatingZones.filter(zone => {
        if (typeof zone === 'string') {
          // If zone is a string, we can't filter by region, so return all
          console.log('🌍 Zone is string, including:', zone);
          return true;
        }
        // If zone is an object with region property, filter by region
        const zoneRegion = zone.region?.toLowerCase().replace(/\s+/g, '-');
        const selectedRegionNormalized = selectedRegion.toLowerCase().replace(/\s+/g, '-');
        const matches = zoneRegion === selectedRegionNormalized;
        console.log('🌍 Zone filtering:', {
          zoneName: zone.name,
          zoneRegion,
          selectedRegionNormalized,
          matches
        });
        return matches;
      });
      
      console.log('🌍 Filtered zones:', regionZones);
      
      return regionZones.map((zone, index) => {
        const zoneName = typeof zone === 'string' ? zone : zone.name || String(zone);
        return {
          id: index + 1,
          value: zoneName.toLowerCase().replace(/\s+/g, '-'),
          label: zoneName
        };
      });
    }
    // Fallback to legacy data
    const country = activeCountries.find(c => c.value === formData.country);
    if (!country) return [];
    const regions = getRegionsByCountry(country.id);
    const region = regions.find(r => r.value === selectedRegion);
    return region ? getZonesByRegion(region.id) : [];
  };

  // Convert broker coverage data to coverage areas format for map validation
  const getCoverageAreas = () => {
    const coverageAreas = [];
    
    if (brokerData?.operatingCountries && brokerData.operatingCountries.length > 0) {
      // Use broker's operating countries, regions, and zones
      brokerData.operatingCountries.forEach((country, countryIndex) => {
        const countryName = typeof country === 'string' ? country : (country as any)?.name || String(country);
        
        // Find regions for this country
        const countryRegions = brokerData?.operatingRegions?.filter(region => {
          if (typeof region === 'string') {
            // If region is a string, we can't filter by country, so include all
            return true;
          }
          // If region is an object with country property, filter by country
          const regionCountry = region.country?.toLowerCase().replace(/\s+/g, '-');
          const countryNameNormalized = countryName.toLowerCase().replace(/\s+/g, '-');
          return regionCountry === countryNameNormalized;
        }) || [];
        
        if (countryRegions.length > 0) {
          countryRegions.forEach((region, regionIndex) => {
            const regionName = typeof region === 'string' ? region : (region as any)?.name || String(region);
            
            // Find zones for this region
            const regionZones = brokerData?.operatingZones?.filter(zone => {
              if (typeof zone === 'string') {
                // If zone is a string, we can't filter by region, so include all
                return true;
              }
              // If zone is an object with region property, filter by region
              const zoneRegion = zone.region?.toLowerCase().replace(/\s+/g, '-');
              const regionNameNormalized = regionName.toLowerCase().replace(/\s+/g, '-');
              return zoneRegion === regionNameNormalized;
            }) || [];
            
            if (regionZones.length > 0) {
              regionZones.forEach((zone, zoneIndex) => {
                const zoneName = typeof zone === 'string' ? zone : (zone as any)?.name || String(zone);
                coverageAreas.push({
                  id: `${countryIndex}-${regionIndex}-${zoneIndex}`,
                  name: `${zoneName}, ${regionName}, ${countryName}`,
                  country: countryName,
                  region: regionName,
                  zone: zoneName,
                  bounds: undefined // Will be enhanced with actual geographic bounds
                });
              });
            } else {
              // No zones, just region level
              coverageAreas.push({
                id: `${countryIndex}-${regionIndex}`,
                name: `${regionName}, ${countryName}`,
                country: countryName,
                region: regionName,
                zone: undefined,
                bounds: undefined
              });
            }
          });
        } else {
          // No regions, just country level
          coverageAreas.push({
            id: countryIndex.toString(),
            name: countryName,
            country: countryName,
            region: undefined,
            zone: undefined,
            bounds: undefined
          });
        }
      });
    } else {
      // Fallback to masters data with full hierarchy
      activeCountries.forEach(country => {
        const regions = getRegionsByCountry(country.id);
        
        if (regions.length > 0) {
          regions.forEach(region => {
            const zones = getZonesByRegion(region.id);
            
            if (zones.length > 0) {
              zones.forEach(zone => {
                coverageAreas.push({
                  id: `${country.id}-${region.id}-${zone.id}`,
                  name: `${zone.label}, ${region.label}, ${country.label}`,
                  country: country.label,
                  region: region.label,
                  zone: zone.label,
                  bounds: undefined
                });
              });
            } else {
              // No zones, just region level
              coverageAreas.push({
                id: `${country.id}-${region.id}`,
                name: `${region.label}, ${country.label}`,
                country: country.label,
                region: region.label,
                zone: undefined,
                bounds: undefined
              });
            }
          });
        } else {
          // No regions, just country level
          coverageAreas.push({
            id: country.id.toString(),
            name: country.label,
            country: country.label,
            region: undefined,
            zone: undefined,
            bounds: undefined
          });
        }
      });
    }
    
    // Debug logging
    console.log('Coverage areas for map validation:', coverageAreas);
    
    return coverageAreas;
  };

  const [formData, setFormData] = useState(() => {
    // Check if we're editing an existing quote
    const editingQuote = location.state?.editingQuote;
    if (editingQuote) {
      // Map quote data to form structure
      return {
        projectName: editingQuote.projectName || "",
        projectType: editingQuote.projectType?.toLowerCase() || "",
        subProjectType: editingQuote.subProjectType || "",
        constructionType: editingQuote.constructionType?.toLowerCase() || "",
        country: "uae", // Default to UAE
        region: "", // Will be selected by user
        zone: "", // Will be selected by user
        projectAddress: editingQuote.projectAddress || "",
        coordinates: editingQuote.coordinates || "",
        projectValue: "0", // Always 0 as requested
        startDate: editingQuote.startDate || new Date().toISOString().split('T')[0],
        completionDate: editingQuote.completionDate || "",
        constructionPeriod: editingQuote.constructionPeriod || "18",
        maintenancePeriod: editingQuote.maintenancePeriod || "24",
        thirdPartyLimit: editingQuote.thirdPartyLimit?.replace(/[^0-9]/g, '') || "",
        insuredName: editingQuote.insuredName || "",
        roleOfInsured: "contractor",
        mainContractor: editingQuote.mainContractor || editingQuote.insuredName || "",
        principalOwner: editingQuote.principalOwner || "",
        contractType: editingQuote.contractType || "turnkey",
        contractNumber: editingQuote.contractNumber || "",
        experienceYears: editingQuote.experienceYears || "",
        consultants: editingQuote.consultants || [],
        subContractors: editingQuote.subContractors || [],
        nearWaterBody: editingQuote.nearWaterBody || "no",
        waterBodyDistance: editingQuote.waterBodyDistance || "",
        floodProneZone: editingQuote.floodProneZone || "no",
        withinCityCenter: editingQuote.withinCityCenter || "",
        cityAreaType: editingQuote.cityAreaType || "",
        soilType: editingQuote.soilType || "sandy",
        existingStructure: editingQuote.existingStructure || "no",
        existingStructureDetails: editingQuote.existingStructureDetails || "",
        blastingExcavation: editingQuote.blastingExcavation || "no",
        siteSecurityArrangements: editingQuote.siteSecurityArrangements || "24-7-guarded",
        sumInsuredMaterial: editingQuote.sumInsuredMaterial?.replace(/[^0-9]/g, '') || "",
        sumInsuredPlant: editingQuote.sumInsuredPlant?.replace(/[^0-9]/g, '') || "",
        sumInsuredTemporary: editingQuote.sumInsuredTemporary?.replace(/[^0-9]/g, '') || "0",
        tplLimit: editingQuote.tplLimit?.replace(/[^0-9]/g, '') || "",
        crossLiabilityCover: editingQuote.crossLiabilityCover || "yes",
        principalExistingProperty: editingQuote.principalExistingProperty?.replace(/[^0-9]/g, '') || "0",
        removalDebrisLimit: editingQuote.removalDebrisLimit?.replace(/[^0-9]/g, '') || "",
        surroundingPropertyLimit: editingQuote.surroundingPropertyLimit?.replace(/[^0-9]/g, '') || "",
        lossesInLastFiveYears: editingQuote.lossesInLastFiveYears || "no",
        lossesDetails: editingQuote.lossesDetails || "",
        claimsHistory: editingQuote.claimsHistory || [{
          year: 2025,
          claimCount: 0,
          amount: "",
          description: ""
        }, {
          year: 2024,
          claimCount: 0,
          amount: "",
          description: ""
        }, {
          year: 2023,
          claimCount: 0,
          amount: "",
          description: ""
        }, {
          year: 2022,
          claimCount: 0,
          amount: "",
          description: ""
        }, {
          year: 2021,
          claimCount: 0,
          amount: "",
          description: ""
        }],
        otherMaterials: editingQuote.otherMaterials || "",
        // Document upload status
        documents: {
          boq: { uploaded: false, url: "", fileName: "", label: "BOQ or Cost Breakdown" },
          gantt_chart: { uploaded: false, url: "", fileName: "", label: "Project Gantt Chart" },
          contract_agreement: { uploaded: false, url: "", fileName: "", label: "Contract Agreement" },
          site_layout_plan: { uploaded: false, url: "", fileName: "", label: "Site Layout Plan" },
          other_supporting_docs: { uploaded: false, url: "", fileName: "", label: "Other supporting docs" }
        }
      };
    }
    return getDefaultFormData();
  });

  // Rule engine for default calculations
  const calculateDefaultValues = () => {
    return {
      debrisRemovalLimit: "0", // No longer based on project value
      professionalFeesLimit: "0" // No longer based on project value
      // Add more default calculations as needed
    };
  };


  // Validation logic
  const validateCoverageRequirements = () => {
    const errors: Record<string, string> = {};
    const sumInsuredTotal = parseInt(formData.sumInsuredMaterial || "0") + parseInt(formData.sumInsuredPlant || "0") + parseInt(formData.sumInsuredTemporary || "0") + parseInt(formData.otherMaterials || "0") + parseInt(formData.principalExistingProperty || "0");
    // Allow 0 values - removed the validation that prevented 0 sum insured
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };


  // Calculate construction period in months
  const calculateConstructionPeriod = (startDate: string, completionDate: string) => {
    if (!startDate || !completionDate) return "";
    
    const start = new Date(startDate);
    const completion = new Date(completionDate);
    
    if (completion <= start) return "";
    
    // Calculate the difference in months
    const yearDiff = completion.getFullYear() - start.getFullYear();
    const monthDiff = completion.getMonth() - start.getMonth();
    const totalMonths = yearDiff * 12 + monthDiff;
    
    // Add partial month if completion day is after start day
    if (completion.getDate() > start.getDate()) {
      return (totalMonths + 1).toString();
    }
    
    return totalMonths.toString();
  };

  // Update construction period when dates change
  const updateConstructionPeriod = (startDate: string, completionDate: string) => {
    const period = calculateConstructionPeriod(startDate, completionDate);
    setFormData(prev => ({
      ...prev,
      constructionPeriod: period
    }));
  };

  // Transform insured details form data to API format
  const transformInsuredDetailsToAPI = (): InsuredDetailsRequest => {
    const claimsMatrix = formData.claimsHistory
      .filter(claim => claim.claimCount > 0)
      .map(claim => ({
        year: claim.year,
        count: claim.claimCount,
        amount: claim.amount,
        description: claim.description || ""
      }));

    return {
      insured_name: formData.insuredName || "",
      role_of_insured: formData.roleOfInsured || "",
      had_losses_last_5yrs: formData.lossesInLastFiveYears === "yes",
      claims_matrix: claimsMatrix
    };
  };

  // Transform form data to API format
  const transformFormDataToAPI = (): QuoteProjectRequest => {
    // Parse coordinates
    const [latitude, longitude] = formData.coordinates 
      ? formData.coordinates.split(',').map(coord => parseFloat(coord.trim()))
      : [0, 0];

    // Get project type name from master data
    const projectTypeName = masterData.projectTypes.find(pt => pt.id.toString() === formData.projectType)?.label || 
                           getActiveProjectTypes().find(pt => pt.id.toString() === formData.projectType)?.label || 
                           formData.projectType;

    // Get sub project type name from master data
    const subProjectTypeName = masterData.subProjectTypes.find(spt => spt.id.toString() === formData.subProjectType)?.label ||
                              getSubProjectTypesByProjectType(parseInt(formData.projectType)).find(spt => spt.id.toString() === formData.subProjectType)?.label ||
                              formData.subProjectType;

    // Get construction type name from master data
    const constructionTypeName = masterData.constructionTypes.find(ct => ct.id.toString() === formData.constructionType)?.label ||
                                getActiveConstructionTypes().find(ct => ct.id.toString() === formData.constructionType)?.label ||
                                formData.constructionType;

    return {
      client_name: formData.insuredName || "Unknown Client",
      project_name: formData.projectName,
      project_type: projectTypeName,
      sub_project_type: subProjectTypeName,
      construction_type: constructionTypeName,
      address: formData.projectAddress,
      country: formData.country.toUpperCase(),
      region: formData.region,
      zone: formData.zone,
      latitude: latitude,
      longitude: longitude,
      sum_insured: 0, // Always set to 0 as requested
      start_date: formData.startDate,
      completion_date: formData.completionDate,
      construction_period_months: parseInt(formData.constructionPeriod) || 0,
      maintenance_period_months: parseInt(formData.maintenancePeriod) || 0
    };
  };

  // Validate current step fields only
  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Only validate fields that are visible on the current step
    switch (currentStep) {
      case 0: // Project Details step
        // Required text fields
        if (!formData.projectName?.trim()) {
          errors.projectName = "Project name is required";
        }
        
        // Required dropdown selections
        if (!formData.projectType) {
          errors.projectType = "Project type must be selected";
        }
        if (!formData.subProjectType) {
          errors.subProjectType = "Sub project type must be selected";
        }
        if (!formData.constructionType) {
          errors.constructionType = "Construction type must be selected";
        }
        
        // Required address fields
        if (!formData.projectAddress?.trim()) {
          errors.projectAddress = "Project address is required";
        }
        if (!formData.country) {
          errors.country = "Country must be selected";
        }
        if (!formData.region) {
          errors.region = "Region must be selected";
        }
        if (!formData.zone) {
          errors.zone = "Zone must be selected";
        }
        
        // Required date fields
        if (!formData.startDate) {
          errors.startDate = "Start date is required";
        }
        if (!formData.completionDate) {
          errors.completionDate = "Completion date is required";
        }
        
        // Validate date logic
        if (formData.startDate && formData.completionDate) {
          const startDate = new Date(formData.startDate);
          const completionDate = new Date(formData.completionDate);
          
          if (completionDate <= startDate) {
            errors.completionDate = "Completion date must be after start date";
          }
        }
        
        // Project value validation removed - always set to 0
        break;
        
      case 1: // Insured Details step
        if (!formData.insuredName?.trim()) {
          errors.insuredName = "Insured name is required";
        }
        if (!formData.roleOfInsured) {
          errors.roleOfInsured = "Role of insured must be selected";
        }
        if (!claimsDisclaimerAccepted) {
          errors.claimsDisclaimer = "You must accept the claims disclaimer to proceed";
        }
        break;
        
      case 2: // Contract Structure step
        if (!formData.mainContractor?.trim()) {
          errors.mainContractor = "Main contractor is required";
        }
        if (!formData.principalOwner?.trim()) {
          errors.principalOwner = "Principal owner is required";
        }
        if (!formData.contractType) {
          errors.contractType = "Contract type must be selected";
        }
        if (!formData.contractNumber?.trim()) {
          errors.contractNumber = "Contract number is required";
        }
        if (!formData.experienceYears || parseInt(formData.experienceYears) < 0) {
          errors.experienceYears = "Experience years must be 0 or greater";
        }
        break;
        
      case 3: // Site Risks step
        if (!formData.nearWaterBody) {
          errors.nearWaterBody = "Water body proximity must be selected";
        }
        if (!formData.floodProneZone) {
          errors.floodProneZone = "Flood prone zone must be selected";
        }
        if (!formData.withinCityCenter) {
          errors.withinCityCenter = "City center location must be selected";
        }
        if (!formData.soilType) {
          errors.soilType = "Soil type must be selected";
        }
        if (!formData.existingStructure) {
          errors.existingStructure = "Existing structure must be selected";
        }
        if (!formData.blastingExcavation) {
          errors.blastingExcavation = "Blasting or deep excavation must be selected";
        }
        if (!formData.siteSecurityArrangements?.trim()) {
          errors.siteSecurityArrangements = "Site security arrangements are required";
        }
        break;
        
      case 4: // Cover Requirements step
        const materialValue = parseFloat(formData.sumInsuredMaterial?.replace(/[^0-9.]/g, '') || '0');
        if (formData.sumInsuredMaterial && formData.sumInsuredMaterial.trim() !== '' && (isNaN(materialValue) || materialValue < 0)) {
          errors.sumInsuredMaterial = "Valid contract works amount is required";
        }
        const plantValue = parseFloat(formData.sumInsuredPlant?.replace(/[^0-9.]/g, '') || '0');
        if (formData.sumInsuredPlant && formData.sumInsuredPlant.trim() !== '' && (isNaN(plantValue) || plantValue < 0)) {
          errors.sumInsuredPlant = "Valid plant and equipment amount is required";
        }
        const temporaryValue = parseFloat(formData.sumInsuredTemporary?.replace(/[^0-9.]/g, '') || '0');
        if (formData.sumInsuredTemporary && formData.sumInsuredTemporary.trim() !== '' && (isNaN(temporaryValue) || temporaryValue < 0)) {
          errors.sumInsuredTemporary = "Valid temporary works amount is required";
        }
        const otherMaterialsValue = parseFloat(formData.otherMaterials?.replace(/[^0-9.]/g, '') || '0');
        if (formData.otherMaterials && formData.otherMaterials.trim() !== '' && (isNaN(otherMaterialsValue) || otherMaterialsValue < 0)) {
          errors.otherMaterials = "Valid other materials amount is required";
        }
        const principalValue = parseFloat(formData.principalExistingProperty?.replace(/[^0-9.]/g, '') || '0');
        if (formData.principalExistingProperty && formData.principalExistingProperty.trim() !== '' && (isNaN(principalValue) || principalValue < 0)) {
          errors.principalExistingProperty = "Valid principals property amount is required";
        }
        if (!formData.crossLiabilityCover) {
          errors.crossLiabilityCover = "Cross liability cover must be selected";
        }
        break;
        
      case 5: // Documents step
        // Check if all required documents are uploaded based on master data
        // This validation only applies to the Required Documents tab
        const missingDocuments: string[] = [];
        
        // Only validate required documents from master data
        requiredDocumentTypes.forEach(docType => {
          if (docType.required) {
            // Find the corresponding document in formData.documents
            const docKey = Object.keys(formData.documents).find(key => {
              const docData = formData.documents[key as keyof typeof formData.documents];
              return docData?.label === docType.name;
            });
            
            if (docKey) {
              const docData = formData.documents[docKey as keyof typeof formData.documents];
              if (!docData?.uploaded) {
                missingDocuments.push(docType.name);
              }
            }
          }
        });
        
        if (missingDocuments.length > 0) {
          errors.documents = `Please upload the following required documents: ${missingDocuments.join(', ')}`;
        }
        break;
        
      case 6: // Quotes step
        // For quotes step, no validation needed as it's a comparison/selection step
        // Users can proceed without selecting quotes
        break;
        
      case 7: // Declaration step
        // For declaration step, no validation needed as it's a document upload step
        // Users can proceed after uploading required documents
        break;
        
      // Add more cases for other steps as needed
      default:
        // For other steps, no validation for now
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save project data via API
  const saveProjectData = async (): Promise<boolean> => {
    // Validate required fields first
    if (!validateCurrentStep()) {
      const errorFields = Object.keys(validationErrors);
      const fieldNames = errorFields.map(field => {
        const fieldMap: Record<string, string> = {
          projectName: 'Project Name',
          projectType: 'Project Type',
          subProjectType: 'Sub Project Type',
          constructionType: 'Construction Type',
          projectAddress: 'Project Address',
          country: 'Country',
          region: 'Region',
          zone: 'Zone',
          startDate: 'Start Date',
          completionDate: 'Completion Date',
          insuredName: 'Insured Name',
          roleOfInsured: 'Role of Insured',
          claimsDisclaimer: 'Claims Disclaimer',
          mainContractor: 'Main Contractor',
          principalOwner: 'Principal Owner',
          contractType: 'Contract Type',
          contractNumber: 'Contract Number'
        };
        return fieldMap[field] || field;
      });
      
      toast({
        title: "Validation Error",
        description: `Please fill in the following required fields: ${fieldNames.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    try {
      setIsSavingProject(true);
      
      // Check for water body proximity if coordinates are available
      if (formData.coordinates) {
        const [latitude, longitude] = formData.coordinates
          .split(',')
          .map(coord => parseFloat(coord.trim()));
        
        if (!isNaN(latitude) && !isNaN(longitude)) {
          setIsCheckingWaterBody(true);
          try {
            const waterBodyResult = await checkWaterBodyProximity(latitude, longitude);
            
            // Update form data with water body detection result
            setFormData(prev => ({
              ...prev,
              nearWaterBody: waterBodyResult.isNearWaterBody ? "yes" : "no",
              waterBodyDistance: waterBodyResult.isNearWaterBody ? "100" : ""
            }));
            
            // Mark as auto-filled
            setIsWaterBodyAutoFilled(true);
            
            if (waterBodyResult.isNearWaterBody) {
              toast({
                title: "Water Body Detected",
                description: `Found ${waterBodyResult.waterBodies.length} water body(ies) within 100 meters.`,
              });
            }
          } catch (waterError) {
            console.error('Error checking water body proximity:', waterError);
            toast({
              title: "Water Body Check Failed",
              description: "Could not check for nearby water bodies. Please verify manually.",
              variant: "destructive",
            });
          } finally {
            setIsCheckingWaterBody(false);
          }
        }
      }
      
      const apiData = transformFormDataToAPI();
      
      let response: QuoteProjectResponse;
      if (isStepCompleted('project_details') && currentQuoteId) {
        // Update existing project data using stored quote ID
        console.log('🔄 Updating project with quote ID:', currentQuoteId);
        response = await updateQuoteProject(apiData, currentQuoteId);
        toast({
          title: "Project Updated",
          description: "Project details have been updated successfully.",
        });
      } else {
        // Create new project data
        console.log('🆕 Creating new project');
        console.log('📤 API Data being sent:', apiData);
        response = await createQuoteProject(apiData);
        console.log('✅ Project created successfully');
        console.log('📥 Full response:', response);
        console.log('🆔 Quote ID:', response.quote?.id);
        
        // Validate response structure
        if (!response || !response.quote || !response.quote.id) {
          console.error('❌ Invalid response structure:', response);
          throw new Error('Invalid response from server: missing quote data');
        }
        
        // Store quote ID and reference number from response
        const quoteId = response.quote.id;
        const quoteReference = response.quote.quote_id;
        const brokerId = response.project.broker_id;
        
        setCurrentQuoteId(quoteId);
        localStorage.setItem('currentQuoteId', quoteId.toString());
        
        setQuoteReferenceNumber(quoteReference);
        localStorage.setItem('quoteReferenceNumber', quoteReference);
        
        // Store broker ID for future use
        localStorage.setItem('broker_id', brokerId.toString());
        
        console.log('💾 Stored quote data:', { quoteId, quoteReference });
        
        toast({
          title: "Project Saved",
          description: "Project details have been saved successfully.",
        });
      }
      
      // Mark project_details step as completed
      markStepCompleted('project_details');
      
      setSavedProjectData(response);
      return true;
    } catch (error: any) {
      console.error('❌ Error saving project data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack
      });
      
      let errorMessage = "Failed to save project details. Please try again.";
      if (error.response?.status === 400) {
        errorMessage = "Invalid project data. Please check your inputs.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to save project data.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message?.includes('Invalid response from server')) {
        errorMessage = "Server returned invalid response. Please try again.";
      }
      
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSavingProject(false);
    }
  };

  // Save insured details via API
  const saveInsuredDetailsData = async (): Promise<boolean> => {
    if (!currentQuoteId) {
      toast({
        title: "Error",
        description: "Quote ID not found. Please refresh and try again.",
        variant: "destructive",
      });
      return false;
    }

    setIsSavingInsuredDetails(true);
    try {
      const apiData = transformInsuredDetailsToAPI();
      console.log('💾 Saving insured details:', apiData);
      
      // Check if insured_details step is already completed to decide between POST and PATCH
      const isInsuredDetailsCompleted = isStepCompleted('insured_details');
      console.log('📊 Insured details completion status:', isInsuredDetailsCompleted);
      
      let response;
      if (isInsuredDetailsCompleted) {
        // Use PATCH for updates
        console.log('🔄 Using PATCH to update existing insured details');
        response = await updateInsuredDetails(apiData, currentQuoteId);
      } else {
        // Use POST for new insured details
        console.log('💾 Using POST to create new insured details');
        response = await saveInsuredDetails(apiData, currentQuoteId);
      }
      
      console.log('✅ Insured details saved successfully:', response);
      
      // Mark insured_details step as completed
      markStepCompleted('insured_details');
      
      toast({
        title: "Insured Details Saved",
        description: "Insured details have been saved successfully.",
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Error saving insured details:', error);
      
      let errorMessage = "Failed to save insured details. Please try again.";
      if (error.response?.status === 400) {
        errorMessage = "Invalid data provided. Please check your inputs.";
      } else if (error.response?.status === 401) {
        errorMessage = "You are not authorized. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to save insured details.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSavingInsuredDetails(false);
    }
  };

  // Transform contract structure form data to API format
  const transformContractStructureToAPI = (): ContractStructureRequest => {
    return {
      main_contractor: formData.mainContractor || '',
      principal_owner: formData.principalOwner || '',
      contract_type: formData.contractType || '',
      contract_number: formData.contractNumber || '',
      experience_years: parseInt(formData.experienceYears) || 0,
      sub_contractors: (formData.subContractors || []).map(sub => ({
        name: sub.name || '',
        contract_type: sub.contractType || sub.contract_type || '',
        contract_number: sub.contractNumber || sub.contract_number || ''
      })),
      consultants: (formData.consultants || []).map(consultant => ({
        name: consultant.name || '',
        role: consultant.role || '',
        license_number: consultant.licenseNumber || consultant.license_number || ''
      }))
    };
  };

  // Save contract structure via API
  const saveContractStructureData = async (): Promise<boolean> => {
    if (!currentQuoteId) {
      toast({
        title: "Error",
        description: "Quote ID not found. Please refresh and try again.",
        variant: "destructive",
      });
      return false;
    }

    setIsSavingContractStructure(true);
    try {
      const apiData = transformContractStructureToAPI();
      console.log('💾 Saving contract structure:', apiData);
      
      // Check if contract_structure step is already completed to decide between POST and PATCH
      const isContractStructureCompleted = isStepCompleted('contract_structure');
      console.log('📊 Contract structure completion status:', isContractStructureCompleted);
      
      let response;
      if (isContractStructureCompleted) {
        // Use PATCH for updates
        console.log('🔄 Using PATCH to update existing contract structure');
        response = await updateContractStructure(apiData, currentQuoteId);
      } else {
        // Use POST for new contract structure
        console.log('💾 Using POST to create new contract structure');
        response = await saveContractStructure(apiData, currentQuoteId);
      }
      
      console.log('✅ Contract structure saved successfully:', response);
      
      // Mark contract_structure step as completed
      markStepCompleted('contract_structure');
      
      toast({
        title: "Contract Structure Saved",
        description: "Contract structure has been saved successfully.",
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Error saving contract structure:', error);
      
      let errorMessage = "Failed to save contract structure. Please try again.";
      if (error.response?.status === 400) {
        errorMessage = "Invalid data provided. Please check your inputs.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to save contract structure.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSavingContractStructure(false);
    }
  };

  // Transform site risks form data to API format
  const transformSiteRisksToAPI = (): SiteRisksRequest => {
    return {
      near_water_body: formData.nearWaterBody === "yes",
      flood_prone_zone: formData.floodProneZone === "yes",
      within_city_center: formData.withinCityCenter || '',
      soil_type: formData.soilType || '',
      existing_structure: formData.existingStructure === "yes",
      blasting_or_deep_excavation: formData.blastingExcavation === "yes",
      site_security_arrangements: formData.siteSecurityArrangements || '',
      area_type: formData.cityAreaType || 'Urban',
      describe_existing_structure: formData.existingStructureDetails || ''
    };
  };

  // Save site risks via API
  const saveSiteRisksData = async (): Promise<boolean> => {
    if (!currentQuoteId) {
      toast({
        title: "Error",
        description: "Quote ID not found. Please refresh and try again.",
        variant: "destructive",
      });
      return false;
    }

    setIsSavingSiteRisks(true);
    try {
      const apiData = transformSiteRisksToAPI();
      console.log('💾 Saving site risks:', apiData);
      
      // Check if site_risks step is already completed to decide between POST and PATCH
      const isSiteRisksCompleted = isStepCompleted('site_risks');
      console.log('📊 Site risks completion status:', isSiteRisksCompleted);
      
      let response;
      if (isSiteRisksCompleted) {
        // Use PATCH for updates
        console.log('🔄 Using PATCH to update existing site risks');
        response = await updateSiteRisks(apiData, currentQuoteId);
      } else {
        // Use POST for new site risks
        console.log('💾 Using POST to create new site risks');
        response = await saveSiteRisks(apiData, currentQuoteId);
      }
      
      console.log('✅ Site risks saved successfully:', response);
      
      // Mark site_risks step as completed
      markStepCompleted('site_risks');
      
      toast({
        title: "Site Risks Saved",
        description: "Site risks have been saved successfully.",
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Error saving site risks:', error);
      
      let errorMessage = "Failed to save site risks. Please try again.";
      if (error.response?.status === 400) {
        errorMessage = "Invalid data provided. Please check your inputs.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to save site risks.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSavingSiteRisks(false);
    }
  };

  // Transform cover requirements form data to API format
  const transformCoverRequirementsToAPI = (): CoverRequirementsRequest => {
    return {
      project_value: 0, // Always set to 0 as requested
      contract_works: parseFloat(formData.sumInsuredMaterial?.replace(/[^0-9.]/g, '') || '0'),
      plant_and_equipment: parseFloat(formData.sumInsuredPlant?.replace(/[^0-9.]/g, '') || '0'),
      temporary_works: parseFloat(formData.sumInsuredTemporary?.replace(/[^0-9.]/g, '') || '0'),
      other_materials: parseFloat(formData.otherMaterials?.replace(/[^0-9.]/g, '') || '0'),
      principals_property: parseFloat(formData.principalExistingProperty?.replace(/[^0-9.]/g, '') || '0'),
      cross_liability_cover: formData.crossLiabilityCover || ''
    };
  };

  // Transform documents data to API format
  const transformDocumentsToAPI = (): { required_document: Array<{label: string, url: string}> } => {
    const documentsArray: Array<{label: string, url: string}> = [];
    
    // Include ALL documents that have been uploaded (both required and optional)
    allDocumentTypes.forEach(doc => {
      if (doc.status === "uploaded" && doc.fileUrl) {
        documentsArray.push({
          label: doc.name,
          url: doc.fileUrl
        });
      }
    });
    
    return { required_document: documentsArray };
  };

  // Load pricing configurations for eligible insurers
  const loadInsurerPricingConfigs = async (eligibleInsurers: any[]): Promise<boolean> => {
    if (!eligibleInsurers || eligibleInsurers.length === 0) {
      console.log('⚠️ No eligible insurers to load pricing configs for');
      return true;
    }

    setIsLoadingPricingConfigs(true);
    
    try {
      // Clear existing pricing configs before loading new ones
      setInsurerPricingConfigs({});
      
      console.log('💰 Loading pricing configs for eligible insurers:', eligibleInsurers.map(i => i.insurer_name));
      
      // Load pricing configs for each eligible insurer
      const pricingConfigPromises = eligibleInsurers.map(async (insurer) => {
        try {
          const config = await getInsurerPricingConfig(insurer.insurer_id);
          console.log(`✅ Pricing config loaded for ${insurer.insurer_name}:`, config);
          return { insurerId: insurer.insurer_id, config };
        } catch (error: any) {
          console.error(`❌ Error loading pricing config for ${insurer.insurer_name}:`, error);
          
          let errorMessage = `Failed to load pricing config for ${insurer.insurer_name}. Please try again.`;
          if (error.response?.status === 400) {
            errorMessage = `Invalid insurer ID for ${insurer.insurer_name}. Please refresh and try again.`;
          } else if (error.response?.status === 401) {
            errorMessage = `Authentication required for ${insurer.insurer_name}. Please log in again.`;
          } else if (error.response?.status === 403) {
            errorMessage = `Access denied for ${insurer.insurer_name}. You do not have permission to view pricing config.`;
          } else if (error.response?.status === 500) {
            errorMessage = `Server error for ${insurer.insurer_name}. Please try again later.`;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          
          return null;
        }
      });
      
      const results = await Promise.all(pricingConfigPromises);
      
      // Store successful results
      const successfulConfigs: Record<number, InsurerPricingConfigResponse> = {};
      results.forEach((result) => {
        if (result) {
          successfulConfigs[result.insurerId] = result.config;
        }
      });
      
      setInsurerPricingConfigs(successfulConfigs);
      
      const successCount = Object.keys(successfulConfigs).length;
      const totalCount = eligibleInsurers.length;
      
      if (successCount > 0) {
        toast({
          title: "Pricing Configs Loaded",
          description: `Successfully loaded pricing configurations for ${successCount} out of ${totalCount} eligible insurers.`,
          variant: "default",
        });
      }
      
      return successCount > 0;
    } catch (error: any) {
      console.error('❌ Error loading pricing configurations:', error);
      
      toast({
        title: "Error",
        description: "Failed to load pricing configurations. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoadingPricingConfigs(false);
    }
  };

  // Load current proposal form details
  const loadCurrentProposal = async (): Promise<boolean> => {
    const quoteId = currentQuoteId;
    if (!quoteId) {
      toast({
        title: "Error",
        description: "Quote ID not found. Please refresh and try again.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoadingProposal(true);
    
    try {
      // Clear existing data before loading new data
      setCurrentProposal(null);
      
      const response = await getProposalBundle(quoteId);
      console.log('✅ Current proposal loaded successfully:', response);
      
      setCurrentProposal(response);
      
      toast({
        title: "Proposal Loaded",
        description: "Current proposal details have been loaded successfully.",
        variant: "default",
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Error loading current proposal:', error);
      
      let errorMessage = 'Failed to load current proposal details. Please try again.';
      if (error.response?.status === 400) {
        errorMessage = 'Invalid quote ID. Please refresh and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view proposal details.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoadingProposal(false);
    }
  };

  // Load assigned insurers for broker
  const loadAssignedInsurers = async (): Promise<boolean> => {
    // Get current broker ID from store
    const brokerId = getBrokerCompanyId();
    if (!brokerId) {
      toast({
        title: "Error",
        description: "Broker ID not found. Please log in again.",
        variant: "destructive",
      });
      return false;
    }

    setIsLoadingInsurers(true);
    
    try {
      // Clear existing data before loading new data
      setAssignedInsurers(null);
      
      const response = await getBrokerInsurers(brokerId);
      console.log('✅ Assigned insurers loaded successfully:', response);
      
      setAssignedInsurers(response);
      
      toast({
        title: "Insurers Loaded",
        description: `Found ${response.insurers.length} insurers assigned to this broker.`,
        variant: "default",
      });
      
      // Load current proposal details after successful insurers load
      await loadCurrentProposal();
      
      return true;
    } catch (error: any) {
      console.error('❌ Error loading assigned insurers:', error);
      
      let errorMessage = 'Failed to load assigned insurers. Please try again.';
      if (error.response?.status === 400) {
        errorMessage = 'Invalid broker ID. Please refresh and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view assigned insurers.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoadingInsurers(false);
    }
  };

  // Save required documents via API
  const saveRequiredDocumentsData = async (): Promise<boolean> => {
    if (!currentQuoteId) {
      toast({
        title: "Error",
        description: "Quote ID not found. Please refresh and try again.",
        variant: "destructive",
      });
      return false;
    }

    setIsSavingDocuments(true);
    
    try {
      const apiData = transformDocumentsToAPI();
      let response: RequiredDocumentsResponse;
      
      if (isStepCompleted('underwriting_documents')) {
        // Use PATCH for existing documents
        console.log('🔄 Using PATCH to update existing required documents');
        response = await updateRequiredDocuments(apiData, currentQuoteId);
      } else {
        // Use POST for new documents
        console.log('💾 Using POST to create new required documents');
        response = await saveRequiredDocuments(apiData, currentQuoteId);
      }
      
      console.log('✅ Required documents saved successfully:', response);
      
      // Mark underwriting_documents step as completed
      markStepCompleted('underwriting_documents');
      
      toast({
        title: "Documents Saved",
        description: "Required documents have been saved successfully.",
        variant: "default",
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Error saving required documents:', error);
      
      let errorMessage = 'Failed to save required documents. Please try again.';
      if (error?.response?.status === 400) {
        errorMessage = 'Invalid document data. Please check your uploads and try again.';
      } else if (error?.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'You do not have permission to save documents.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsSavingDocuments(false);
    }
  };

  // Save cover requirements via API
  const saveCoverRequirementsData = async (): Promise<boolean> => {
    if (!currentQuoteId) {
      toast({
        title: "Error",
        description: "Quote ID not found. Please refresh and try again.",
        variant: "destructive",
      });
      return false;
    }

    // Check if already saving to prevent duplicate calls
    if (isSavingCoverRequirements) {
      console.log('⚠️ Cover requirements save already in progress, skipping duplicate call');
      return false;
    }

    console.log('🚀 Starting cover requirements save process...');
    console.log('📍 Current step when saving cover requirements:', currentStep);
    console.log('📍 Step completion status:', stepCompletionStatus);
    setIsSavingCoverRequirements(true);
    try {
      const apiData = transformCoverRequirementsToAPI();
      console.log('💾 Saving cover requirements:', apiData);
      console.log('📊 Form data being transformed:', {
        projectValue: formData.projectValue,
        sumInsuredMaterial: formData.sumInsuredMaterial,
        sumInsuredPlant: formData.sumInsuredPlant,
        sumInsuredTemporary: formData.sumInsuredTemporary,
        otherMaterials: formData.otherMaterials,
        principalExistingProperty: formData.principalExistingProperty,
        crossLiabilityCover: formData.crossLiabilityCover
      });
      
      // Check if cover_requirements step is already completed to decide between POST and PATCH
      const isCoverRequirementsCompleted = isStepCompleted('cover_requirements');
      console.log('📊 Cover requirements completion status:', isCoverRequirementsCompleted);
      
      let response;
      if (isCoverRequirementsCompleted) {
        // Use PATCH for updates
        console.log('🔄 Using PATCH to update existing cover requirements');
        response = await updateCoverRequirements(apiData, currentQuoteId);
      } else {
        // Use POST for new cover requirements
        console.log('💾 Using POST to create new cover requirements');
        response = await saveCoverRequirements(apiData, currentQuoteId);
      }
      
      console.log('✅ Cover requirements saved successfully:', response);
      
      // Mark cover_requirements step as completed
      markStepCompleted('cover_requirements');
      
      toast({
        title: "Cover Requirements Saved",
        description: `Cover requirements have been saved successfully. Sum Insured: ${response.sum_insured?.toLocaleString() || 'N/A'}`,
      });
      
      return true;
    } catch (error: any) {
      console.error('❌ Error saving cover requirements:', error);
      
      let errorMessage = "Failed to save cover requirements. Please try again.";
      if (error.response?.status === 400) {
        errorMessage = "Invalid data provided. Please check your inputs.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to save cover requirements.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSavingCoverRequirements(false);
    }
  };

  // Effect to validate and clear completion date if it becomes invalid
  useEffect(() => {
    if (formData.startDate && formData.completionDate) {
      const start = new Date(formData.startDate);
      const completion = new Date(formData.completionDate);
      
      if (completion <= start) {
        setFormData(prev => ({
          ...prev,
          completionDate: "",
          constructionPeriod: ""
        }));
        toast({
          title: "Completion Date Cleared",
          description: "Completion date was cleared as it was before or equal to the start date.",
          variant: "destructive",
        });
      }
    }
  }, [formData.startDate, formData.completionDate]);

  // Project value change handler - no longer needed since field is hidden
  const handleProjectValueChange = (value: string) => {
    // Project value is always 0, no action needed
  };
  const addSubcontractor = () => {
    const newId = Math.max(...formData.subContractors.map(sc => sc.id), 0) + 1;
    setFormData({
      ...formData,
      subContractors: [...formData.subContractors, {
        id: newId,
        name: "",
        contractType: "supply",
        contractNumber: ""
      }]
    });
  };
  const removeSubcontractor = (id: number) => {
    setFormData({
      ...formData,
      subContractors: formData.subContractors.filter(sc => sc.id !== id)
    });
  };
  const addConsultant = () => {
    const newId = Math.max(...formData.consultants.map(c => c.id), 0) + 1;
    setFormData({
      ...formData,
      consultants: [...formData.consultants, {
        id: newId,
        name: "",
        role: "",
        licenseNumber: ""
      }]
    });
  };
  const removeConsultant = (id: number) => {
    setFormData({
      ...formData,
      consultants: formData.consultants.filter(c => c.id !== id)
    });
  };
  const updateClaimsHistory = (year: number, field: string, value: string | number) => {
    setFormData({
      ...formData,
      claimsHistory: formData.claimsHistory.map(claim => claim.year === year ? {
        ...claim,
        [field]: value
      } : claim)
    });
  };
  const updateSubcontractor = (id: number, field: string, value: string) => {
    setFormData({
      ...formData,
      subContractors: formData.subContractors.map(sc => sc.id === id ? {
        ...sc,
        [field]: value
      } : sc)
    });
  };
  const updateConsultant = (id: number, field: string, value: string) => {
    setFormData({
      ...formData,
      consultants: formData.consultants.map(c => c.id === id ? {
        ...c,
        [field]: value
      } : c)
    });
  };
  const steps = [{
    id: "project",
    label: "Project Details",
    icon: Building
  }, {
    id: "insured",
    label: "Insured Details",
    icon: MapPin
  }, {
    id: "contract",
    label: "Contract Structure",
    icon: Shield
  }, {
    id: "site",
    label: "Site Risks",
    icon: FileText
  }, {
    id: "coverage",
    label: "Cover Requirements",
    icon: Umbrella
  }, {
    id: "documents",
    label: "Required Documents",
    icon: FileText
  }, {
    id: "quotes",
    label: "Quotes Comparison",
    icon: Building
  }, {
    id: "declaration",
    label: "Declaration",
    icon: FileText
  }];
  // Show loading state while resume data is being loaded
  if (isLoadingResumeData) {
    return (
      <section className="pt-6 pb-20 bg-background min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quote data...</p>
            <p className="text-sm text-gray-500 mt-2">Resuming quote {resumeQuoteId}</p>
          </div>
        </div>
      </section>
    );
  }

  return <section className="pt-6 pb-20 bg-background min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Card className="shadow-large border-border w-full overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {isResumeMode ? 'Resume Quote' : location.state?.editingQuote ? 'Edit Quote' : 'Create New Quote'}
                </CardTitle>
                {quoteReferenceNumber && currentStep >= 1 && (
                  <div className="text-sm text-gray-900">
                    Quote No. : {quoteReferenceNumber}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>
            
            {/* Progress Bar with Navigation Buttons */}
            <div className="flex items-center gap-4 mt-6">
              {/* Progress Bar */}
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-gradient-primary h-2 rounded-full transition-smooth" style={{
                  width: `${(currentStep + 1) / steps.length * 100}%`
                }} />
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Previous Button */}
                {currentStep > 0 && (
                  <Button variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>
                    Previous
                  </Button>
                )}
                
                {/* Next/Proceed Button - hide for declaration step since it has its own Complete button */}
                {currentStep === steps.length - 1 && currentStep !== 7 ? (
                  <Button 
                    variant="hero" 
                    size="lg" 
                    onClick={async () => {
                      // Validate current step first
                      if (!validateCurrentStep()) {
                        const errorFields = Object.keys(validationErrors);
                        const fieldNames = errorFields.map(field => {
                          const fieldMap: Record<string, string> = {
                            projectName: 'Project Name',
                            projectType: 'Project Type',
                            subProjectType: 'Sub Project Type',
                            constructionType: 'Construction Type',
                            country: 'Country',
                            region: 'Region',
                            zone: 'Zone',
                            projectAddress: 'Project Address',
                            coordinates: 'Coordinates',
                            projectValue: 'Project Value',
                            startDate: 'Start Date',
                            completionDate: 'Completion Date',
                            constructionPeriod: 'Construction Period',
                            maintenancePeriod: 'Maintenance Period',
                            thirdPartyLimit: 'Third Party Limit',
                            insuredName: 'Insured Name',
                            roleOfInsured: 'Role of Insured',
                            mainContractor: 'Main Contractor',
                            principalOwner: 'Principal Owner',
                            contractType: 'Contract Type',
                            contractNumber: 'Contract Number',
                            experienceYears: 'Experience Years',
                            nearWaterBody: 'Water Body Proximity',
                            floodProneZone: 'Flood Prone Zone',
                            withinCityCenter: 'City Center Location',
                            soilType: 'Soil Type',
                            existingStructure: 'Existing Structure',
                            blastingExcavation: 'Blasting or Deep Excavation',
                            siteSecurityArrangements: 'Site Security Arrangements',
                            sumInsuredMaterial: 'Contract Works',
                            sumInsuredPlant: 'Plant and Equipment',
                            sumInsuredTemporary: 'Temporary Works',
                            otherMaterials: 'Other Materials',
                            principalExistingProperty: 'Principals Property',
                            crossLiabilityCover: 'Cross Liability Cover'
                          };
                          return fieldMap[field] || field;
                        });
                        
                        toast({
                          title: "Validation Error",
                          description: `Please fill in the following required fields: ${fieldNames.join(', ')}`,
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Handle declaration step (step 7) - will be handled by DeclarationTab component
                      if (currentStep === 7) {
                        // DeclarationTab will handle its own submission
                        return;
                      } else if (currentStep !== 4) {
                        // Other steps - just navigate
                        setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                      } else {
                        console.log('🔵 BUTTON 1: Cover Requirements step - delegating to main handler');
                        // Do nothing here, let the main handler (BUTTON 2) handle step 4
                      }
                    }}
                    disabled={isSavingProject || isSavingInsuredDetails || isSavingContractStructure || isSavingSiteRisks || isSavingCoverRequirements || isSavingDocuments || isCheckingWaterBody || false}
                  >
                    {isSavingCoverRequirements ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : false ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting Documents...
                      </>
                    ) : (
                      'Next'
                    )}
                  </Button>
                ) : currentStep !== 7 ? (
                  <Button 
                    onClick={async () => {
                      // Validate current step first
                      if (!validateCurrentStep()) {
                        const errorFields = Object.keys(validationErrors);
                        const fieldNames = errorFields.map(field => {
                          const fieldMap: Record<string, string> = {
                            projectName: 'Project Name',
                            projectType: 'Project Type',
                            subProjectType: 'Sub Project Type',
                            constructionType: 'Construction Type',
                            projectAddress: 'Project Address',
                            country: 'Country',
                            region: 'Region',
                            zone: 'Zone',
                            startDate: 'Start Date',
                            completionDate: 'Completion Date',
                            insuredName: 'Insured Name',
                            roleOfInsured: 'Role of Insured',
                            claimsDisclaimer: 'Claims Disclaimer',
                            mainContractor: 'Main Contractor',
                            principalOwner: 'Principal Owner',
                            contractType: 'Contract Type',
                            contractNumber: 'Contract Number',
                            experienceYears: 'Experience Years',
                            nearWaterBody: 'Water Body Proximity',
                            floodProneZone: 'Flood Prone Zone',
                            withinCityCenter: 'City Center Location',
                            soilType: 'Soil Type',
                            existingStructure: 'Existing Structure',
                            blastingExcavation: 'Blasting or Deep Excavation',
                            siteSecurityArrangements: 'Site Security Arrangements',
                            sumInsuredMaterial: 'Contract Works',
                            sumInsuredPlant: 'Plant and Equipment',
                            sumInsuredTemporary: 'Temporary Works',
                            otherMaterials: 'Other Materials',
                            principalExistingProperty: 'Principals Property',
                            crossLiabilityCover: 'Cross Liability Cover'
                          };
                          return fieldMap[field] || field;
                        });
                        
                        toast({
                          title: "Validation Error",
                          description: `Please fill in the following required fields: ${fieldNames.join(', ')}`,
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      // Save data based on current step
                      if (currentStep === 0) {
                        // Project Details step
                        const success = await saveProjectData();
                        if (success) {
                          setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                        }
                      } else if (currentStep === 1) {
                        // Insured Details step
                        const success = await saveInsuredDetailsData();
                        if (success) {
                          setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                        }
                      } else if (currentStep === 2) {
                        // Contract Structure step
                        const success = await saveContractStructureData();
                        if (success) {
                          setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                        }
                      } else if (currentStep === 3) {
                        // Site Risks step
                        const success = await saveSiteRisksData();
                        if (success) {
                          setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                        }
                      } else if (currentStep === 4) {
                        // Cover Requirements step
                        console.log('🟠 BUTTON 2: Cover Requirements save triggered (main handler)');
                        const success = await saveCoverRequirementsData();
                        if (success) {
                          setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                        }
                      } else if (currentStep === 5) {
                        // Documents step - save documents and go to step 6 (Quotes)
                        const success = await saveRequiredDocumentsData();
                        if (success) {
                          // Mark policy_required_documents step as completed
                          markStepCompleted('policy_required_documents');
                          // Load assigned insurers when navigating to quotes comparison
                          await loadAssignedInsurers();
                          setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                        }
                      } else if (currentStep === 6) {
                        // Quotes step - mark as completed and go to step 7 (Declaration)
                        markStepCompleted('coverages_selected');
                        setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                      } else if (currentStep === 7) {
                        // Declaration step - will be handled by DeclarationTab component
                        console.log('🔍 Declaration step - Next button clicked');
                        // DeclarationTab will handle its own submission and flag update
                      } else {
                        // Other steps - just navigate
                        setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                      }
                    }}
                    disabled={isSavingProject || isSavingInsuredDetails || isSavingContractStructure || isSavingSiteRisks || isSavingCoverRequirements || isSavingDocuments || isCheckingWaterBody || false}
                  >
                    {isSavingProject ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : isSavingInsuredDetails ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : isSavingContractStructure ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : isSavingSiteRisks ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : isSavingCoverRequirements ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : isSavingDocuments ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving Documents...
                      </>
                    ) : isCheckingWaterBody ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Checking water bodies...
                      </>
                    ) : false ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting Documents...
                      </>
                    ) : currentStep === 7 ? (
                      'Complete'
                    ) : (
                      'Next'
                    )}
                  </Button>
                ) : null}
                </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            <Tabs value={steps[currentStep].id} className="w-full">
              {/* Step Navigation */}
              <div className="mb-8">
                <div className="w-full">
                  {/* Mobile: Horizontal scroll */}
                  <div className="md:hidden">
                    <div className="overflow-x-auto scrollbar-hide pb-2">
                      <div className="flex items-center gap-2 bg-muted p-2 rounded-lg w-max">
                        {steps.map((step, index) => <button key={step.id} onClick={() => setCurrentStep(index)} disabled={index > currentStep} className={`flex items-center gap-2 p-3 rounded-md text-xs font-medium transition-smooth flex-shrink-0 whitespace-nowrap ${index === currentStep ? 'bg-primary text-primary-foreground shadow-glow' : index < currentStep ? 'bg-accent text-accent-foreground hover:bg-accent/80' : 'bg-card text-muted-foreground cursor-not-allowed opacity-60'} ${index <= currentStep ? 'hover:scale-105' : ''}`}>
                            <span className="text-xs font-bold">{index + 1}</span>
                            <step.icon className="w-3 h-3 flex-shrink-0" />
                            <span className="text-[10px] leading-tight">
                              {step.label}
                            </span>
                          </button>)}
                      </div>
                    </div>
                  </div>

                  {/* Desktop: Horizontal scroll */}
                  <div className="hidden md:block">
                    <div className="bg-muted p-4 rounded-lg">
                       <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex items-center gap-3 w-max mx-auto">
                          {steps.map((step, index) => <button key={step.id} onClick={() => setCurrentStep(index)} disabled={index > currentStep} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth whitespace-nowrap ${index === currentStep ? 'bg-primary text-primary-foreground shadow-glow' : index < currentStep ? 'bg-success text-success-foreground' : 'bg-card text-muted-foreground cursor-not-allowed opacity-60'} ${index <= currentStep ? 'hover:scale-105' : ''}`}>
                              <span className="text-lg font-bold">{index + 1}</span>
                              <step.icon className="w-5 h-5 flex-shrink-0" />
                              <span className="text-sm">
                                {step.label}
                              </span>
                            </button>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <TabsContent value="project" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name *</Label>
                    <Input 
                      id="projectName" 
                      value={formData.projectName} 
                      onChange={e => {
                        setFormData({
                          ...formData,
                          projectName: e.target.value
                        });
                        // Clear validation error when user starts typing
                        if (validationErrors.projectName) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.projectName;
                            return newErrors;
                          });
                        }
                      }} 
                      placeholder="Full name of the construction project"
                      className={validationErrors.projectName ? "border-red-500" : ""}
                    />
                    {validationErrors.projectName && (
                      <p className="text-sm text-red-500">{validationErrors.projectName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectType">Project Type *</Label>
                     <Select 
                       value={formData.projectType || undefined} 
                       onValueChange={value => setFormData({
                         ...formData,
                         projectType: value,
                         subProjectType: ""
                       })}
                       disabled={loadingStates.isLoading}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder={
                           loadingStates.isLoading ? "Loading project types..." : "Select project type"
                         } />
                       </SelectTrigger>
                       <SelectContent>
                         {loadingStates.isLoading ? (
                           <div className="p-2 text-sm text-muted-foreground">Loading options...</div>
                         ) : (
                           getProjectTypeOptions().map(type => (
                             <SelectItem key={type.id} value={type.id.toString()}>
                               {type.label}
                             </SelectItem>
                           ))
                         )}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="subProjectType">Sub Project Type *</Label>
                     <Select 
                       value={formData.subProjectType || undefined} 
                       onValueChange={value => setFormData({
                         ...formData,
                         subProjectType: value
                       })}
                       disabled={!formData.projectType || loadingStates.isLoading}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder={
                           loadingStates.isLoading ? "Loading sub project types..." : 
                           !formData.projectType ? "Select project type first" : 
                           "Select sub project type"
                         } />
                       </SelectTrigger>
                       <SelectContent>
                         {loadingStates.isLoading ? (
                           <div className="p-2 text-sm text-muted-foreground">Loading options...</div>
                         ) : formData.projectType ? (
                           getSubProjectTypeOptions(parseInt(formData.projectType)).map(subType => (
                             <SelectItem key={subType.id} value={subType.id.toString()}>
                               {subType.label}
                             </SelectItem>
                           ))
                         ) : (
                           <div className="p-2 text-sm text-muted-foreground">Select project type first</div>
                         )}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="constructionType">Construction Type *</Label>
                     <Select 
                       value={formData.constructionType || undefined} 
                       onValueChange={value => setFormData({
                         ...formData,
                         constructionType: value
                       })}
                       disabled={loadingStates.isLoading}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder={
                           loadingStates.isLoading ? "Loading construction types..." : "Select construction type"
                         } />
                       </SelectTrigger>
                       <SelectContent>
                         {loadingStates.isLoading ? (
                           <div className="p-2 text-sm text-muted-foreground">Loading options...</div>
                         ) : (
                           getConstructionTypeOptions().map(type => (
                             <SelectItem key={type.id} value={type.id.toString()}>
                               {type.label}
                             </SelectItem>
                           ))
                         )}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                <div className="space-y-2">
                  <Label htmlFor="projectAddress">Project Address *</Label>
                  <Input 
                    id="projectAddress" 
                    value={formData.projectAddress} 
                    onChange={e => {
                      setFormData({
                        ...formData,
                        projectAddress: e.target.value
                      });
                      // Clear validation error when user starts typing
                      if (validationErrors.projectAddress) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.projectAddress;
                          return newErrors;
                        });
                      }
                    }} 
                    placeholder="Location of the project site"
                    className={validationErrors.projectAddress ? "border-red-500" : ""}
                  />
                  {validationErrors.projectAddress && (
                    <p className="text-sm text-red-500">{validationErrors.projectAddress}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select 
                      value={formData.country || undefined} 
                      onValueChange={value => setFormData({
                        ...formData,
                        country: value,
                        region: "",
                        zone: ""
                      })}
                      disabled={brokerLoading.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          brokerLoading.isLoading ? "Loading countries..." : "Select country"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {brokerLoading.isLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Loading options...</div>
                        ) : (
                          getBrokerCountryOptions().map(country => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="region">Region *</Label>
                    <Select 
                      value={formData.region || undefined} 
                      onValueChange={value => setFormData({
                        ...formData,
                        region: value,
                        zone: ""
                      })} 
                      disabled={!formData.country || brokerLoading.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !formData.country ? "Select country first" : 
                          brokerLoading.isLoading ? "Loading regions..." : "Select region"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.country && getBrokerRegionOptions(formData.country).map(region => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone *</Label>
                    <Select 
                      value={formData.zone || undefined} 
                      onValueChange={value => setFormData({
                        ...formData,
                        zone: value
                      })} 
                      disabled={!formData.region || brokerLoading.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !formData.region ? "Select region first" : 
                          brokerLoading.isLoading ? "Loading zones..." : "Select zone"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.region && getBrokerZoneOptions(formData.region).map(zone => (
                          <SelectItem key={zone.value} value={zone.value}>
                            {zone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coordinates">Latitude & Longitude</Label>
                    <div className="relative">
                      <Input 
                        id="coordinates"
                        placeholder="Latitude, Longitude"
                        value={formData.coordinates || ''}
                        onChange={e => setFormData({
                          ...formData,
                          coordinates: e.target.value
                        })}
                        className="pr-10"
                      />
                      <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                        onClick={() => setIsLocationModalOpen(true)}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      value={formData.startDate} 
                      onChange={e => {
                        const newStartDate = e.target.value;
                        const completionDate = formData.completionDate;
                        
                        // If completion date exists and is before or equal to new start date, clear it
                        if (completionDate && newStartDate) {
                          const start = new Date(newStartDate);
                          const completion = new Date(completionDate);
                          
                          if (completion <= start) {
                            setFormData({
                              ...formData,
                              startDate: newStartDate,
                              completionDate: "" // Clear completion date if it's invalid
                            });
                            // Update construction period (will be empty since completion date is cleared)
                            updateConstructionPeriod(newStartDate, "");
                            toast({
                              title: "Completion Date Cleared",
                              description: "Completion date was cleared as it was before or equal to the new start date.",
                              variant: "destructive",
                            });
                            return;
                          }
                        }
                        
                        setFormData({
                          ...formData,
                          startDate: newStartDate
                        });
                        // Update construction period
                        updateConstructionPeriod(newStartDate, formData.completionDate);
                        // Clear any existing validation errors
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.completionDate;
                          return newErrors;
                        });
                      }}
                    />
                    <p className="text-xs text-hint">Planned project commencement date</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completionDate">Completion Date *</Label>
                    <Input 
                      id="completionDate" 
                      type="date" 
                      value={formData.completionDate} 
                      min={formData.startDate ? (() => {
                        const startDate = new Date(formData.startDate);
                        const nextDay = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
                        return nextDay.toISOString().split('T')[0];
                      })() : undefined}
                      onChange={e => {
                        const newCompletionDate = e.target.value;
                        const startDate = formData.startDate;
                        
                        // Check if completion date is before or equal to start date
                        if (startDate && newCompletionDate) {
                          const start = new Date(startDate);
                          const completion = new Date(newCompletionDate);
                          
                          if (completion <= start) {
                            toast({
                              title: "Invalid Date",
                              description: "Completion date cannot be less than or equal to start date.",
                              variant: "destructive",
                            });
                            // Clear the completion date if it's invalid
                            setFormData(prev => ({
                              ...prev,
                              completionDate: ""
                            }));
                            updateConstructionPeriod(startDate, "");
                            return;
                          }
                        }
                        
                        setFormData({
                          ...formData,
                          completionDate: newCompletionDate
                        });
                        // Update construction period
                        updateConstructionPeriod(formData.startDate, newCompletionDate);
                        // Clear any existing validation errors
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.completionDate;
                          return newErrors;
                        });
                      }}
                    />
                    <p className="text-xs text-hint">Expected project end date</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="constructionPeriod">Construction Period (Months)</Label>
                    <Input id="constructionPeriod" value={formData.constructionPeriod} placeholder="Auto-calculated" disabled />
                    <p className="text-xs text-hint">Derived from start and end date</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenancePeriod">Maintenance Period (Months) *</Label>
                    <Input id="maintenancePeriod" value={formData.maintenancePeriod} onChange={e => setFormData({
                    ...formData,
                    maintenancePeriod: e.target.value
                  })} placeholder="12" />
                    <p className="text-xs text-hint">Typically 12-24 months</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="insured" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="insuredName">Insured Name *</Label>
                    <Input id="insuredName" value={formData.insuredName} onChange={e => setFormData({
                    ...formData,
                    insuredName: e.target.value
                  })} placeholder="Main contractor or developer" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleOfInsured">Role of Insured *</Label>
                    <Select 
                      value={formData.roleOfInsured || undefined} 
                      onValueChange={value => setFormData({
                        ...formData,
                        roleOfInsured: value
                      })}
                      disabled={loadingStates.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingStates.isLoading ? "Loading role types..." : "Select role of insured"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingStates.isLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Loading options...</div>
                        ) : (
                          getRoleTypeOptions().map(role => (
                            <SelectItem key={role.id} value={role.label.toLowerCase().replace(/\s+/g, '_')}>
                              {role.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>



                {/* Claims History Section */}
                <div className="space-y-4 border-t border-border pt-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Claims History</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lossesInLastFiveYears">Any insurance losses in last 5 years? *</Label>
                      <Select value={formData.lossesInLastFiveYears || undefined} onValueChange={value => setFormData({
                      ...formData,
                      lossesInLastFiveYears: value
                    })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select yes or no" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Select if you have had any insurance claims in the past 5 years</p>
                    </div>
                    
                    {formData.lossesInLastFiveYears === "yes" && <div className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h4 className="font-medium text-foreground mb-4">Claims History Matrix (2021-2025)</h4>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-20">Year</TableHead>
                                  <TableHead className="w-32">Count of Claims</TableHead>
                                  <TableHead className="w-40">Amount of Claims (AED)</TableHead>
                                  <TableHead>Description</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {formData.claimsHistory.map(claim => <TableRow key={claim.year}>
                                    <TableCell className="font-medium">{claim.year}</TableCell>
                                    <TableCell>
                                      <Input type="number" min="0" max="99" value={claim.claimCount} onChange={e => updateClaimsHistory(claim.year, 'claimCount', parseInt(e.target.value) || 0)} className="w-20" placeholder="0" />
                                    </TableCell>
                                    <TableCell>
                                      <Input type="number" min="0" value={claim.amount} onChange={e => updateClaimsHistory(claim.year, 'amount', e.target.value)} className="w-36" placeholder="0" disabled={claim.claimCount === 0} required={claim.claimCount > 0} />
                                    </TableCell>
                                    <TableCell>
                                      <Input value={claim.description} onChange={e => updateClaimsHistory(claim.year, 'description', e.target.value)} placeholder="Description of claim" disabled={claim.claimCount === 0} required={claim.claimCount > 0} />
                                    </TableCell>
                                  </TableRow>)}
                              </TableBody>
                            </Table>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            * Amount and description are mandatory when claim count is greater than 0
                          </p>
                        </div>
                      </div>}
                  </div>
                  
                  {/* Claims Disclaimer Checkbox */}
                  <div className="space-y-4 border-t border-border pt-6">
                    <div 
                      className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      onClick={() => setShowClaimsDisclaimer(true)}
                    >
                      <Checkbox
                        id="claimsDisclaimer"
                        checked={claimsDisclaimerAccepted}
                        onCheckedChange={(checked) => {
                          if (checked && !claimsDisclaimerAccepted) {
                            // Only allow checking if disclaimer was accepted
                            return;
                          }
                          setClaimsDisclaimerAccepted(checked as boolean);
                        }}
                        className="mt-1 cursor-pointer"
                        onClick={() => setShowClaimsDisclaimer(true)}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="claimsDisclaimer" className="text-sm font-medium cursor-pointer">
                          I accept{" "}
                          <span className="text-primary hover:text-primary/80 underline font-medium">
                            Disclaimer & Importance of Declaring Claims
                          </span>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          You must accept the disclaimer to proceed with your application
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contract" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="mainContractor">Main Contractor *</Label>
                    <Input id="mainContractor" value={formData.mainContractor} onChange={e => setFormData({
                    ...formData,
                    mainContractor: e.target.value
                  })} placeholder="Name of the executing contractor" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="principalOwner">Principal/Owner *</Label>
                    <Input id="principalOwner" value={formData.principalOwner} onChange={e => setFormData({
                    ...formData,
                    principalOwner: e.target.value
                  })} placeholder="Name of project owner" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contractType">Contract Type *</Label>
                    <Select 
                      value={formData.contractType || undefined} 
                      onValueChange={value => setFormData({
                        ...formData,
                        contractType: value
                      })}
                      disabled={loadingStates.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingStates.isLoading ? "Loading contract types..." : "Select contract type"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingStates.isLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Loading options...</div>
                        ) : (
                          getContractTypeOptions().map(contract => (
                            <SelectItem key={contract.id} value={contract.label.toLowerCase().replace(/\s+/g, '-')}>
                              {contract.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">Contract Number</Label>
                    <Input id="contractNumber" value={formData.contractNumber} onChange={e => setFormData({
                    ...formData,
                    contractNumber: e.target.value
                  })} placeholder="Reference if any" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears">Experience in years *</Label>
                    <Input 
                      id="experienceYears" 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={formData.experienceYears || "0"} 
                      onChange={e => setFormData({
                        ...formData,
                        experienceYears: e.target.value
                      })} 
                      placeholder="0" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Sub-Contractors</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addSubcontractor}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Sub-Contractor
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.subContractors.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No subcontractors added yet. Click "Add Sub-Contractor" to add one.</p>
                      </div>
                    ) : (
                      formData.subContractors.map((subcontractor, index) => <div key={subcontractor.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border border-border rounded-lg bg-muted/30">
                        <div className="space-y-2">
                          <Label htmlFor={`subcontractor-name-${subcontractor.id}`}>Name *</Label>
                          <Input id={`subcontractor-name-${subcontractor.id}`} value={subcontractor.name} onChange={e => updateSubcontractor(subcontractor.id, 'name', e.target.value)} placeholder="Subcontractor name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`subcontractor-type-${subcontractor.id}`}>Contract Type *</Label>
                          <Select 
                            value={subcontractor.contractType || undefined} 
                            onValueChange={value => updateSubcontractor(subcontractor.id, 'contractType', value)}
                            disabled={loadingStates.isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                loadingStates.isLoading ? "Loading contract types..." : "Select contract type"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingStates.isLoading ? (
                                <div className="p-2 text-sm text-muted-foreground">Loading options...</div>
                              ) : (
                                getSubcontractorTypeOptions().map(type => (
                                  <SelectItem key={type.id} value={type.label.toLowerCase().replace(/\s+/g, '-')}>
                                    {type.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`subcontractor-contract-${subcontractor.id}`}>Contract Number</Label>
                          <Input id={`subcontractor-contract-${subcontractor.id}`} value={subcontractor.contractNumber} onChange={e => updateSubcontractor(subcontractor.id, 'contractNumber', e.target.value)} placeholder="Reference number" />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeSubcontractor(subcontractor.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>)
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Engineer / Consultant Details</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addConsultant}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Consultant
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.consultants.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No consultants added yet. Click "Add Consultant" to add one.</p>
                      </div>
                    ) : (
                      formData.consultants.map((consultant, index) => <div key={consultant.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border border-border rounded-lg bg-muted/30">
                        <div className="space-y-2">
                          <Label htmlFor={`consultant-name-${consultant.id}`}>Name *</Label>
                          <Input id={`consultant-name-${consultant.id}`} value={consultant.name} onChange={e => updateConsultant(consultant.id, 'name', e.target.value)} placeholder="Consultant name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`consultant-role-${consultant.id}`}>Role / Specialization</Label>
                          <Select 
                            value={consultant.role || undefined} 
                            onValueChange={value => updateConsultant(consultant.id, 'role', value)}
                            disabled={loadingStates.isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                loadingStates.isLoading ? "Loading roles..." : "Select role / specialization"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingStates.isLoading ? (
                                <div className="p-2 text-sm text-muted-foreground">Loading options...</div>
                              ) : (
                                getConsultantRoleOptions().map(role => (
                                  <SelectItem key={role.id} value={role.label}>
                                    {role.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`consultant-license-${consultant.id}`}>License Number</Label>
                          <Input id={`consultant-license-${consultant.id}`} value={consultant.licenseNumber} onChange={e => updateConsultant(consultant.id, 'licenseNumber', e.target.value)} placeholder="Professional license" />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeConsultant(consultant.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>)
                    )}
                  </div>
                </div>

              </TabsContent>

              <TabsContent value="site" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="nearWaterBody">Is site near water body? (Within 100 meters)*</Label>
                      {isWaterBodyAutoFilled && (
                        <div className="relative group">
                          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center cursor-help">
                            <svg className="w-2.5 h-2.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Auto-filled based on coordinates and found water body less than 100 meters
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <Select 
                      value={formData.nearWaterBody || undefined} 
                      onValueChange={value => setFormData({
                        ...formData,
                        nearWaterBody: value
                      })}
                      disabled={isWaterBodyAutoFilled}
                    >
                      <SelectTrigger className={isWaterBodyAutoFilled ? "bg-gray-100 cursor-not-allowed" : ""}>
                        <SelectValue placeholder="Select yes or no" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.nearWaterBody === "yes" && <div className="space-y-2 mt-3">
                        <Label htmlFor="waterBodyDistance">Distance from water body (meters)</Label>
                        <Input 
                          id="waterBodyDistance" 
                          value={formData.waterBodyDistance} 
                          onChange={e => setFormData({
                            ...formData,
                            waterBodyDistance: e.target.value
                          })} 
                          placeholder="Enter distance in meters" 
                          disabled={isWaterBodyAutoFilled}
                          className={isWaterBodyAutoFilled ? "bg-gray-100 cursor-not-allowed" : ""}
                        />
                        {formData.waterBodyDistance && parseInt(formData.waterBodyDistance) < 100 && <p className="text-xs text-destructive font-medium">⚠️ High Risk: Site is less than 100 meters from water body</p>}
                      </div>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floodProneZone">Is site in flood-prone zone? *</Label>
                    <Select value={formData.floodProneZone || undefined} onValueChange={value => setFormData({
                    ...formData,
                    floodProneZone: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select yes or no" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="withinCityCenter">Is site within city center? *</Label>
                    <Select value={formData.withinCityCenter || undefined} onValueChange={value => setFormData({
                    ...formData,
                    withinCityCenter: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select yes or no" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.withinCityCenter === "yes" && <div className="space-y-2 mt-3">
                        <Label htmlFor="cityAreaType">Area Type</Label>
                        <Select value={formData.cityAreaType || undefined} onValueChange={value => setFormData({
                      ...formData,
                      cityAreaType: value
                    })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urban or congested" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urban">Urban</SelectItem>
                            <SelectItem value="congested">Congested Area</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="soilType">Soil Type *</Label>
                    <Select 
                      value={formData.soilType || undefined} 
                      onValueChange={value => setFormData({
                        ...formData,
                        soilType: value
                      })}
                      disabled={loadingStates.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingStates.isLoading ? "Loading soil types..." : "Select soil type"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingStates.isLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Loading options...</div>
                        ) : (
                          getSoilTypeOptions().map(soil => (
                            <SelectItem key={soil.id} value={soil.label.toLowerCase()}>
                              {soil.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="existingStructure">Existing Structure on Site? *</Label>
                    <Select value={formData.existingStructure || undefined} onValueChange={value => setFormData({
                    ...formData,
                    existingStructure: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select yes or no" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.existingStructure === "yes" && <div className="space-y-2 mt-3">
                        <Label htmlFor="existingStructureDetails">Describe existing structure</Label>
                        <Textarea id="existingStructureDetails" value={formData.existingStructureDetails} onChange={e => setFormData({
                      ...formData,
                      existingStructureDetails: e.target.value
                    })} placeholder="Provide details about the existing structure" rows={3} />
                      </div>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blastingExcavation">Blasting/Deep Excavation? *</Label>
                    <Select value={formData.blastingExcavation || undefined} onValueChange={value => setFormData({
                    ...formData,
                    blastingExcavation: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select yes or no" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="siteSecurityArrangements">Site Security Arrangements *</Label>
                    <Select 
                      value={formData.siteSecurityArrangements || undefined} 
                      onValueChange={value => setFormData({
                        ...formData,
                        siteSecurityArrangements: value
                      })}
                      disabled={loadingStates.isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingStates.isLoading ? "Loading security types..." : "Select site security arrangements"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingStates.isLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Loading options...</div>
                        ) : (
                          getSecurityTypeOptions().map(security => (
                            <SelectItem key={security.id} value={security.label.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-')}>
                              {security.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="coverage" className="space-y-6">
                <div className="space-y-8">
                  {/* Section 1: Contract Value (Material Damage) */}
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Section 1: Contract Value (Material Damage)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Project Value field hidden - always set to 0 */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contractWorks">Contract Works *</Label>
                          <Input id="contractWorks" type="number" value={formData.sumInsuredMaterial || "0"} onChange={e => setFormData({
                          ...formData,
                          sumInsuredMaterial: e.target.value
                        })} placeholder="0" />
                          <p className="text-xs text-hint">Main construction value</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plantEquipment">Plant & Equipment (CPM)</Label>
                          <Input id="plantEquipment" type="number" value={formData.sumInsuredPlant || "0"} onChange={e => setFormData({
                          ...formData,
                          sumInsuredPlant: e.target.value
                        })} placeholder="0" />
                          <p className="text-xs text-hint">Construction Plant & Machinery</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="temporaryWorks">Temporary Works</Label>
                          <Input id="temporaryWorks" type="number" value={formData.sumInsuredTemporary || "0"} onChange={e => setFormData({
                          ...formData,
                          sumInsuredTemporary: e.target.value
                        })} placeholder="0" />
                          <p className="text-xs text-hint">Temporary structures and formwork</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="otherMaterials">Other Materials</Label>
                          <Input id="otherMaterials" type="number" value={formData.otherMaterials || "0"} onChange={e => setFormData({
                          ...formData,
                          otherMaterials: e.target.value
                        })} placeholder="0" />
                          <p className="text-xs text-hint">Additional materials coverage</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="principalExistingProperty">Principal's Existing/Surrounding Property</Label>
                          <Input id="principalExistingProperty" type="number" value={formData.principalExistingProperty || "0"} onChange={e => setFormData({
                          ...formData,
                          principalExistingProperty: e.target.value
                        })} placeholder="0" />
                          <p className="text-xs text-hint">Value of adjacent structures owned by principal</p>
                        </div>
                      </div>
                      
                      <div className={`bg-muted p-4 rounded-lg ${validationErrors.sumInsured ? 'border-2 border-destructive' : ''}`}>
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Sum Insured - Contract Value</Label>
                          <span className={`text-lg font-bold ${validationErrors.sumInsured ? 'text-destructive' : 'text-primary'}`}>
                            AED {(parseInt(formData.sumInsuredMaterial || "0") + parseInt(formData.sumInsuredPlant || "0") + parseInt(formData.sumInsuredTemporary || "0") + parseInt(formData.otherMaterials || "0") + parseInt(formData.principalExistingProperty || "0")).toLocaleString()}
                          </span>
                        </div>
                        {validationErrors.sumInsured && <p className="text-xs text-destructive mt-2">{validationErrors.sumInsured}</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Section 2: Third Party Liability */}
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Section 2: Liability Covers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="crossLiabilityCover">Cross Liability Cover</Label>
                        <Select value={formData.crossLiabilityCover || undefined} onValueChange={value => setFormData({
                        ...formData,
                        crossLiabilityCover: value
                      })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select yes or no" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Coverage between co-insureds</p>
                      </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <div className="space-y-6">
                  <div className="text-left mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Upload Required Documents
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Please upload documents needed for underwriting
                    </p>
                  </div>
                  <DocumentUpload 
                    onDocumentStatusChange={(updatedDocuments) => {
                      // Update all document types with current status
                      setAllDocumentTypes(prev => 
                        prev.map(doc => {
                          const updatedDoc = updatedDocuments.find(ud => ud.name === doc.name);
                          if (updatedDoc) {
                            return {
                              ...doc,
                              status: updatedDoc.status,
                              fileUrl: updatedDoc.fileUrl,
                              fileName: updatedDoc.fileName
                            };
                          }
                          return doc;
                        })
                      );
                      
                      // Also update formData for backward compatibility
                      const updatedFormData = { ...formData };
                      const docNameToKey: Record<string, keyof typeof formData.documents> = {
                        'BOQ or Cost Breakdown': 'boq',
                        'Project Gantt Chart': 'gantt_chart',
                        'Contract Agreement': 'contract_agreement',
                        'Site Layout Plan': 'site_layout_plan',
                        'Other supporting docs': 'other_supporting_docs'
                      };
                      
                      updatedDocuments.forEach((doc) => {
                        const docKey = docNameToKey[doc.name];
                        if (docKey) {
                          updatedFormData.documents[docKey] = {
                            ...updatedFormData.documents[docKey],
                            uploaded: doc.status === "uploaded",
                            url: doc.fileUrl || "",
                            fileName: doc.fileName || ""
                          };
                        }
                      });
                      
                      setFormData(updatedFormData);
                    }}
                    onDocumentTypesLoaded={(documentTypes) => {
                      // Store all document types for API requests
                      setAllDocumentTypes(documentTypes.map(doc => ({
                        id: doc.id,
                        name: doc.name,
                        required: doc.required,
                        status: doc.status,
                        fileUrl: doc.fileUrl,
                        fileName: doc.fileName
                      })));
                      
                      // Store the required document types for validation
                      setRequiredDocumentTypes(documentTypes.map(doc => ({
                        id: doc.id,
                        name: doc.name,
                        required: doc.required
                      })));
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="quotes" className="space-y-6">
                {isLoadingInsurers ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                      <div className="space-y-3">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <QuotesComparison 
                    assignedInsurers={assignedInsurers} 
                    currentProposal={currentProposal}
                    isLoadingProposal={isLoadingProposal}
                    insurerPricingConfigs={insurerPricingConfigs}
                    isLoadingPricingConfigs={isLoadingPricingConfigs}
                    onLoadPricingConfigs={loadInsurerPricingConfigs}
                  />
                )}
              </TabsContent>

              <TabsContent value="declaration">
                <div className="p-8 text-center text-muted-foreground">
                  Declaration step content
                </div>
              </TabsContent>

            </Tabs>

            {/* Declaration Tab */}
            <div style={{ display: currentStep === 7 ? 'block' : 'none' }}>
              <DeclarationTab onPolicyIssued={() => markStepCompleted('policy_issued')} />
            </div>

          </CardContent>
        </Card>
      </div>

      {/* OpenStreetMap Location Dialog */}
      <OpenStreetMapDialog
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={(coordinates, address) => {
          setFormData({
            ...formData,
            coordinates,
            projectAddress: address
          });
          setIsLocationModalOpen(false);
        }}
        currentAddress={formData.projectAddress}
        currentCoordinates={formData.coordinates}
        coverageAreas={getCoverageAreas()}
      />

      {/* Claims Disclaimer Dialog */}
      {showClaimsDisclaimer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                Disclaimer & Importance of Declaring Claims
              </h2>
              
              <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
                <div>
                  <p className="mb-4">
                    Before submitting a claim under your Contractors All Risk (CAR) policy, please read the following carefully:
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Accuracy of Information</h3>
                  <p className="mb-2">
                    All details provided in this claim declaration must be true, complete, and accurate to the best of your knowledge.
                  </p>
                  <p>
                    Any misrepresentation, omission, or falsification of facts may result in the rejection of your claim and could affect your future insurance coverage.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Timely Notification</h3>
                  <p className="mb-2">
                    Claims must be reported as soon as you become aware of the loss, damage, or incident.
                  </p>
                  <p>
                    Delay in reporting may impact the insurer's ability to assess the claim and could lead to partial or full denial of benefits.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Supporting Documentation</h3>
                  <p className="mb-2">
                    You may be required to submit relevant evidence such as photographs, reports, invoices, or other documents to support your claim when required
                  </p>
                  <p>
                    The insurer reserves the right to request additional information or conduct investigations as needed.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Non-Admission of Liability</h3>
                  <p className="mb-2">
                    Submission of a claim does not imply automatic acceptance or admission of liability by the insurer.
                  </p>
                  <p>
                    All claims will be reviewed and processed in accordance with the terms, conditions, and exclusions of your CAR policy.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Importance of Declaring Claims</h3>
                  <p className="mb-2">
                    Prompt and transparent claim declaration ensures quicker processing, fair assessment, and compliance with regulatory obligations.
                  </p>
                  <p>
                    Non-declaration or delayed declaration of claims may prejudice your rights under the policy and affect your relationship with insurers in the future.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-900">
                    By proceeding, you acknowledge that you have read and understood this disclaimer and agree to provide honest and accurate information in your claim submission.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowClaimsDisclaimer(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setClaimsDisclaimerAccepted(true);
                    setShowClaimsDisclaimer(false);
                    localStorage.setItem('claimsDisclaimerAccepted', 'true');
                    toast({
                      title: "Disclaimer Accepted",
                      description: "You have accepted the claims disclaimer and can now proceed.",
                    });
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>;
};