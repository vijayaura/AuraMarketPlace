import { useState, useEffect } from "react";
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
import { getBroker, type Broker } from "@/lib/api/brokers";
import { createQuoteProject, updateQuoteProject, type QuoteProjectRequest, type QuoteProjectResponse, saveInsuredDetails, updateInsuredDetails, type InsuredDetailsRequest, type InsuredDetailsResponse } from "@/lib/api/quotes";
import { checkWaterBodyProximity } from "@/lib/api/water-body";
import { useToast } from "@/hooks/use-toast";

interface ProposalFormProps {
  onStepChange?: (step: number) => void;
  onQuoteReferenceChange?: (reference: string) => void;
}

export const ProposalForm = ({ onStepChange, onQuoteReferenceChange }: ProposalFormProps = {}) => {
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
  };

  // Mark a step as completed
  const markStepCompleted = (stepName: keyof typeof stepCompletionStatus) => {
    console.log(`✅ Marking step completed: ${stepName}`);
    setStepCompletionStatus(prev => {
      const updated = { ...prev, [stepName]: true };
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

  // Default form data
  const getDefaultFormData = () => ({
    projectName: "Al Habtoor Tower Development",
    projectType: "commercial",
    subProjectType: "office-buildings",
    constructionType: "concrete",
    country: "uae",
    region: "dubai",
    zone: "business-bay",
    projectAddress: "Sheikh Zayed Road, Business Bay, Dubai, UAE",
    coordinates: "25.2048, 55.2708",
    projectValue: "9175000",
    startDate: new Date().toISOString().split('T')[0],
    completionDate: "",
    constructionPeriod: "18",
    maintenancePeriod: "24",
    thirdPartyLimit: "7340000",
    insuredName: "Al Habtoor Construction LLC",
    roleOfInsured: "contractor",
    mainContractor: "Al Habtoor Construction LLC",
    principalOwner: "Dubai Development Authority",
    contractType: "turnkey",
    contractNumber: "DDA-2024-CT-001",
    experienceYears: "15",
    consultants: [{
      id: 1,
      name: "Atkins Middle East",
      role: "Structural Engineer",
      licenseNumber: "ENG-2024-001"
    }],
    subContractors: [{
      id: 1,
      name: "Emirates Steel",
      contractType: "supply",
      contractNumber: "ES-2024-001"
    }, {
      id: 2,
      name: "Dubai Glass",
      contractType: "install",
      contractNumber: "DG-2024-002"
    }],
    nearWaterBody: "no",
    waterBodyDistance: "",
    floodProneZone: "no",
    withinCityCenter: "",
    cityAreaType: "",
    soilType: "sandy",
    existingStructure: "no",
    existingStructureDetails: "",
    blastingExcavation: "no",
    siteSecurityArrangements: "24-7-guarded",
    sumInsuredMaterial: "7340000",
    sumInsuredPlant: "1835000",
    sumInsuredTemporary: "0",
    tplLimit: "3670000",
    crossLiabilityCover: "yes",
    principalExistingProperty: "0",
    removalDebrisLimit: "458750",
    // Auto-calculated as 5% of project value
    surroundingPropertyLimit: "550500",
    lossesInLastFiveYears: "yes",
    lossesDetails: "Minor equipment damage in 2022 - AED 50,000 claim settled",
    claimsHistory: [{
      year: 2025,
      claimCount: 0,
      amount: "",
      description: ""
    }, {
      year: 2024,
      claimCount: 1,
      amount: "50000",
      description: "Minor equipment damage"
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
    otherMaterials: ""
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
        consultants: prev.consultants.map(consultant => ({
          ...consultant,
          role: ""
        })),
        subContractors: prev.subContractors.map(subcontractor => ({
          ...subcontractor,
          contractType: ""
        }))
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
      
      // Fetch broker details (assuming broker ID 1 for now)
      const broker = await getBroker(1);
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
    
    // Cleanup when component unmounts (user exits /customer/proposal)
    return () => {
      console.log('🚪 ProposalForm unmounting - clearing temporary storage');
      clearTemporaryStorage();
    };
  }, []);

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
      // Filter regions based on selected country
      const countryRegions = brokerData.operatingRegions.filter(region => {
        // Simple matching - in real implementation, you'd have proper country-region mapping
        return true; // For now, return all regions
      });
      
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
      // Filter zones based on selected region
      const regionZones = brokerData.operatingZones.filter(zone => {
        // Simple matching - in real implementation, you'd have proper region-zone mapping
        return true; // For now, return all zones
      });
      
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
          // Simple matching - in real implementation, you'd have proper country-region mapping
          return true; // For now, include all regions
        }) || [];
        
        if (countryRegions.length > 0) {
          countryRegions.forEach((region, regionIndex) => {
            const regionName = typeof region === 'string' ? region : (region as any)?.name || String(region);
            
            // Find zones for this region
            const regionZones = brokerData?.operatingZones?.filter(zone => {
              // Simple matching - in real implementation, you'd have proper region-zone mapping
              return true; // For now, include all zones
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
        region: "dubai", // Default based on project location
        zone: "business-bay", // Default zone
        projectAddress: editingQuote.projectAddress || "",
        coordinates: editingQuote.coordinates || "",
        projectValue: editingQuote.projectValue?.replace(/[^0-9]/g, '') || "",
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
        consultants: editingQuote.consultants || [{
          id: 1,
          name: "",
          role: "",
          licenseNumber: ""
        }],
        subContractors: editingQuote.subContractors || [{
          id: 1,
          name: "",
          contractType: "supply",
          contractNumber: ""
        }],
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
        otherMaterials: editingQuote.otherMaterials || ""
      };
    }
    return getDefaultFormData();
  });

  // Rule engine for default calculations
  const calculateDefaultValues = (projectValue: string) => {
    const pv = parseFloat(projectValue) || 0;
    return {
      debrisRemovalLimit: Math.round(pv * 0.05).toString(),
      // 5% of project value
      professionalFeesLimit: Math.round(pv * 0.03).toString() // 3% of project value
      // Add more default calculations as needed
    };
  };

  // Validation logic
  const validateCoverageRequirements = () => {
    const errors: Record<string, string> = {};
    const projectValue = parseFloat(formData.projectValue) || 0;
    const sumInsuredTotal = parseInt(formData.sumInsuredMaterial || "0") + parseInt(formData.sumInsuredPlant || "0") + parseInt(formData.sumInsuredTemporary || "0") + parseInt(formData.otherMaterials || "0") + parseInt(formData.principalExistingProperty || "0");
    if (sumInsuredTotal === 0) {
      errors.sumInsured = "Sum Insured for Material Damage cannot be 0";
    } else if (sumInsuredTotal < projectValue) {
      errors.sumInsured = `Sum Insured (${sumInsuredTotal.toLocaleString()}) must not be less than Project Value (${projectValue.toLocaleString()})`;
    }
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
      sum_insured: parseInt(formData.projectValue) || 0,
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
        
        // Required project value
        if (!formData.projectValue || parseFloat(formData.projectValue.replace(/[^0-9.]/g, '')) <= 0) {
          errors.projectValue = "Valid project value is required";
        }
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
          projectValue: 'Project Value',
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
        
        setCurrentQuoteId(quoteId);
        localStorage.setItem('currentQuoteId', quoteId.toString());
        
        setQuoteReferenceNumber(quoteReference);
        localStorage.setItem('quoteReferenceNumber', quoteReference);
        
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

  // Update debris removal limit when project value changes
  const handleProjectValueChange = (value: string) => {
    const defaults = calculateDefaultValues(value);
    setFormData({
      ...formData,
      projectValue: value,
      removalDebrisLimit: defaults.debrisRemovalLimit
    });
  };
  const handleSubmit = () => {
    // Validate coverage requirements before submission
    if (currentStep === 4) {
      // Coverage tab
      if (!validateCoverageRequirements()) {
        return;
      }
    }
    // In a real app, you would submit the form data here
    navigate('/customer/documents');
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
  }];
  return <section className="pt-6 pb-20 bg-background min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Card className="shadow-large border-border w-full overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {location.state?.editingQuote ? 'Edit Quote' : 'Create New Quote'}
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
                
                {/* Next/Proceed Button */}
                {currentStep === steps.length - 1 ? (
                  <Button variant="hero" size="lg" onClick={handleSubmit}>
                    Proceed
                  </Button>
                ) : (
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
                            projectValue: 'Project Value',
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
                      } else {
                        // Other steps - just navigate
                        setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
                      }
                    }}
                    disabled={isSavingProject || isSavingInsuredDetails || isCheckingWaterBody}
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
                    ) : isCheckingWaterBody ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Checking water bodies...
                      </>
                    ) : (
                      'Next'
                    )}
                  </Button>
                )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                    <p className="text-xs text-muted-foreground">Planned project commencement date</p>
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
                    <p className="text-xs text-muted-foreground">Expected project end date</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="constructionPeriod">Construction Period (Months)</Label>
                    <Input id="constructionPeriod" value={formData.constructionPeriod} placeholder="Auto-calculated" disabled />
                    <p className="text-xs text-muted-foreground">Derived from start and end date</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenancePeriod">Maintenance Period (Months) *</Label>
                    <Input id="maintenancePeriod" value={formData.maintenancePeriod} onChange={e => setFormData({
                    ...formData,
                    maintenancePeriod: e.target.value
                  })} placeholder="12" />
                    <p className="text-xs text-muted-foreground">Typically 12-24 months</p>
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
                    <p className="text-sm text-muted-foreground">Information about past insurance claims</p>
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
                      value={formData.experienceYears} 
                      onChange={e => setFormData({
                        ...formData,
                        experienceYears: e.target.value
                      })} 
                      placeholder="Years of experience" 
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
                    {formData.subContractors.map((subcontractor, index) => <div key={subcontractor.id} className="grid md:grid-cols-4 gap-4 p-4 border border-border rounded-lg bg-muted/30">
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
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeSubcontractor(subcontractor.id)} disabled={formData.subContractors.length === 1}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>)}
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
                    {formData.consultants.map((consultant, index) => <div key={consultant.id} className="grid md:grid-cols-4 gap-4 p-4 border border-border rounded-lg bg-muted/30">
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
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeConsultant(consultant.id)} disabled={formData.consultants.length === 1}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>)}
                  </div>
                </div>

              </TabsContent>

              <TabsContent value="site" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nearWaterBody">Is site near water body? (Within 100 meters)*</Label>
                    <Select value={formData.nearWaterBody || undefined} onValueChange={value => setFormData({
                    ...formData,
                    nearWaterBody: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select yes or no" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.nearWaterBody === "yes" && <div className="space-y-2 mt-3">
                        <Label htmlFor="waterBodyDistance">Distance from water body (meters)</Label>
                        <Input id="waterBodyDistance" value={formData.waterBodyDistance} onChange={e => setFormData({
                      ...formData,
                      waterBodyDistance: e.target.value
                    })} placeholder="Enter distance in meters" />
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
                        <SelectItem value="external-api">Check via External API</SelectItem>
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
                      <div className="grid md:grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="projectValue">Project Value (AED/USD) *</Label>
                          <Input 
                            id="projectValue" 
                            type="number" 
                            value={formData.projectValue} 
                            onChange={e => {
                              handleProjectValueChange(e.target.value);
                              // Clear validation error when user starts typing
                              if (validationErrors.projectValue) {
                                setValidationErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.projectValue;
                                  return newErrors;
                                });
                              }
                            }} 
                            placeholder="Total contract value"
                            className={validationErrors.projectValue ? "border-red-500" : ""}
                          />
                          <p className="text-xs text-muted-foreground">Total estimated project cost</p>
                          {validationErrors.projectValue && (
                            <p className="text-sm text-red-500">{validationErrors.projectValue}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contractWorks">Contract Works *</Label>
                          <Input id="contractWorks" type="number" value={formData.sumInsuredMaterial} onChange={e => setFormData({
                          ...formData,
                          sumInsuredMaterial: e.target.value
                        })} placeholder="Enter amount (AED)" />
                          <p className="text-xs text-muted-foreground">Main construction value</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plantEquipment">Plant & Equipment (CPM)</Label>
                          <Input id="plantEquipment" type="number" value={formData.sumInsuredPlant} onChange={e => setFormData({
                          ...formData,
                          sumInsuredPlant: e.target.value
                        })} placeholder="Enter amount (AED)" />
                          <p className="text-xs text-muted-foreground">Construction Plant & Machinery</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="temporaryWorks">Temporary Works</Label>
                          <Input id="temporaryWorks" type="number" value={formData.sumInsuredTemporary} onChange={e => setFormData({
                          ...formData,
                          sumInsuredTemporary: e.target.value
                        })} placeholder="Enter amount (AED)" />
                          <p className="text-xs text-muted-foreground">Temporary structures and formwork</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="otherMaterials">Other Materials</Label>
                          <Input id="otherMaterials" type="number" value={formData.otherMaterials || ""} onChange={e => setFormData({
                          ...formData,
                          otherMaterials: e.target.value
                        })} placeholder="Enter amount (AED)" />
                          <p className="text-xs text-muted-foreground">Additional materials coverage</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="principalExistingProperty">Principal's Existing/Surrounding Property</Label>
                          <Input id="principalExistingProperty" type="number" value={formData.principalExistingProperty} onChange={e => setFormData({
                          ...formData,
                          principalExistingProperty: e.target.value
                        })} placeholder="Enter amount (AED)" />
                          <p className="text-xs text-muted-foreground">Value of adjacent structures owned by principal</p>
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

            </Tabs>

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