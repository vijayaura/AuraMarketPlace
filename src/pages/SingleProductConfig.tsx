import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Save, Calculator, FileText, Upload, Eye, Plus, Minus, Image, ChevronDown, ChevronRight, Trash2, X, MapPin, Edit, DollarSign, TrendingUp, Shield, Layout, Check, Percent, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getActiveProjectTypes, getActiveConstructionTypes, getSubProjectTypesByProjectType } from "@/lib/masters-data";
import { getActiveCountries, getRegionsByCountry, getZonesByRegion } from "@/lib/location-data";
import { ClausePricingCard } from "@/components/product-config/ClausePricingCard";
import { SubProjectBaseRates } from "@/components/pricing/SubProjectBaseRates";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import { listMasterProjectTypes, listMasterSubProjectTypes, listMasterConstructionTypes, listMasterRoleTypes, listMasterContractTypes, listMasterSoilTypes, listMasterSubcontractorTypes, listMasterConsultantRoles, listMasterSecurityTypes, listMasterAreaTypes, type SimpleMasterItem, type SubProjectTypeItem } from "@/lib/api/masters";
import { getQuoteConfig, getInsurerMetadata, getQuoteConfigForUI, getPolicyWordings, uploadPolicyWording, updatePolicyWording, getQuoteFormat, createQuoteFormat, updateQuoteFormat, getRequiredDocuments, createRequiredDocument, getTplLimitsAndExtensions, updateTplLimitsAndExtensions, getCewsClauses, createCewsClause, updateCewsClause, getBaseRates, saveBaseRates, updateBaseRates, getProjectRiskFactors, createProjectRiskFactors, updateProjectRiskFactors, getContractorRiskFactors, createContractorRiskFactors, updateContractorRiskFactors, getCoverageOptions, saveCoverageOptions, updateCoverageOptions, getPolicyLimits, savePolicyLimits, updatePolicyLimits, getClausePricing, saveClausePricing, updateClausePricing, saveQuoteCoverage, updateQuoteCoverage, getConstructionTypesConfiguration, createConstructionTypesConfiguration, updateConstructionTypesConfiguration, getCountriesConfiguration, createCountriesConfiguration, updateCountriesConfiguration, getRegionsConfiguration, createRegionsConfiguration, updateRegionsConfiguration, getZonesConfiguration, createZonesConfiguration, updateZonesConfiguration, type InsurerMetadata, type QuoteConfigUIResponse, type PolicyWording, type QuoteFormatResponse, type GetRequiredDocumentsResponse, type GetTplResponse, type GetClausesResponse, type CreateClauseParams, type UpdateClauseParams, type UpdateTplRequest, type ContractorRiskFactorsRequest, type ProjectRiskFactorsRequest, type CoverageOptionsResponse, type SaveCoverageOptionsRequest, type UpdateCoverageOptionsRequest, type PolicyLimitsResponse, type SavePolicyLimitsRequest, type UpdatePolicyLimitsRequest, type GetClausePricingResponse, type SaveClausePricingRequest, type UpdateClausePricingRequest, type SaveQuoteCoverageRequest, type SaveQuoteCoverageResponse, type UpdateQuoteCoverageResponse, type ConstructionTypeConfigItem, type GetConstructionTypesConfigResponse, type SaveConstructionTypesConfigRequest, type SaveConstructionTypesConfigResponse, type GetCountriesConfigResponse, type CountryConfigItem, type SaveCountriesConfigRequest, type SaveCountriesConfigResponse, type GetRegionsConfigResponse, type RegionConfigItem, type SaveRegionsConfigRequest, type SaveRegionsConfigResponse, type GetZonesConfigResponse, type ZoneConfigItem, type SaveZonesConfigRequest, type SaveZonesConfigResponse } from "@/lib/api/insurers";
import { getInsurerCompanyId, getInsurerCompany } from "@/lib/auth";
import { api } from "@/lib/api/client";
import QuoteConfigurator from "./SingleProductConfig/components/QuoteConfigurator";
import QuoteFormat from "./SingleProductConfig/components/QuoteFormat";
import CEWsConfiguration from "./SingleProductConfig/components/CEWsConfiguration";
import WordingConfigurations from "./SingleProductConfig/components/WordingConfigurations";
import BaseRates from "./SingleProductConfig/components/BaseRates";
import ProjectRiskFactors from "./SingleProductConfig/components/ProjectRiskFactors";
import RequiredDocuments from "./SingleProductConfig/components/RequiredDocuments";
import ContractorRiskFactors from "./SingleProductConfig/components/ContractorRiskFactors";
import CoverageOptionsExtensions, { CoverageOptionsExtensionsProps } from "./SingleProductConfig/components/CoverageOptionsExtensions";
import PolicyLimitsDeductibles, { type PolicyLimitsDeductiblesProps } from "./SingleProductConfig/components/PolicyLimitsDeductibles";

import MasterDataTabs from "./SingleProductConfig/components/MasterDataTabs";

interface VariableOption {
  id: number;
  label: string;
  limits: string;
  type: "percentage" | "amount";
  value: number;
}

interface ClausePricing {
  id: number;
  code: string;
  name: string;
  enabled: boolean;
  isMandatory: boolean;
  pricingType: "percentage" | "amount";
  pricingValue: number;
  variableOptions: VariableOption[];
}

// Multi-select soil type component
const SoilTypeMultiSelect = ({ defaultValues = [], onValueChange }: { 
  defaultValues?: string[], 
  onValueChange?: (values: string[]) => void 
}) => {
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValues);
  const [isOpen, setIsOpen] = useState(false);
  
  const soilTypes = ["Rock", "Clay", "Sandy", "Mixed", "Unknown"];
  
  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    setSelectedValues(newValues);
    onValueChange?.(newValues);
  };
  
  const displayText = selectedValues.length > 0 
    ? `${selectedValues.length} selected` 
    : "Select soil types";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="h-8 text-xs justify-between w-full"
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0">
        <div className="p-2 space-y-1">
          {soilTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`soil-${type.toLowerCase()}`}
                checked={selectedValues.includes(type)}
                onCheckedChange={() => handleToggle(type)}
              />
              <Label
                htmlFor={`soil-${type.toLowerCase()}`}
                className="text-xs flex-1 cursor-pointer"
              >
                {type}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const SingleProductConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { insurerId, productId, "*": rest } = useParams();
  
  // Detect if we're in insurer portal or market admin
  const isInsurerPortal = location.pathname.startsWith('/insurer');
  const basePath = isInsurerPortal ? '/insurer' : `/market-admin/insurer/${insurerId}`;
  const { toast } = useToast();

  const activeProjectTypes = getActiveProjectTypes();
  const activeConstructionTypes = getActiveConstructionTypes();
  const activeCountries = getActiveCountries();

  // Masters fetched from API for Base Rates
  const [projectTypesMasters, setProjectTypesMasters] = useState<SimpleMasterItem[] | null>(null);
  const [subProjectTypesMasters, setSubProjectTypesMasters] = useState<SubProjectTypeItem[] | null>(null);
  const [isLoadingBaseRatesMasters, setIsLoadingBaseRatesMasters] = useState(false);
  const [baseRatesMastersError, setBaseRatesMastersError] = useState<string | null>(null);
  const [isSavingBaseRates, setIsSavingBaseRates] = useState(false);
  
  // Project Risk Factors loading state
  const [isLoadingProjectRiskFactors, setIsLoadingProjectRiskFactors] = useState(false);
  const [projectRiskFactorsError, setProjectRiskFactorsError] = useState<string | null>(null);
  const [hasProjectRiskFactorsData, setHasProjectRiskFactorsData] = useState(false);
  const [isSavingProjectRiskFactors, setIsSavingProjectRiskFactors] = useState(false);
  
  // Contractor Risk Factors loading state
  const [isLoadingContractorRiskFactors, setIsLoadingContractorRiskFactors] = useState(false);
  const [contractorRiskFactorsError, setContractorRiskFactorsError] = useState<string | null>(null);
  const [hasContractorRiskFactorsData, setHasContractorRiskFactorsData] = useState(false);
  const [isSavingContractorRiskFactors, setIsSavingContractorRiskFactors] = useState(false);

  // Clause Metadata state
  const [isLoadingClauseMetadata, setIsLoadingClauseMetadata] = useState(false);
  const [clauseMetadataError, setClauseMetadataError] = useState<string | null>(null);
  const [clauseMetadata, setClauseMetadata] = useState<any[]>([]);

  // Clause Pricing state
  const [isLoadingClausePricing, setIsLoadingClausePricing] = useState(false);
  const [clausePricingError, setClausePricingError] = useState<string | null>(null);
  const [clausePricingData, setClausePricingData] = useState<GetClausePricingResponse | null>(null);
  const [isSavingClausePricing, setIsSavingClausePricing] = useState(false);

  // Master Data states
  const [constructionTypesData, setConstructionTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingConstructionTypes, setIsLoadingConstructionTypes] = useState(false);
  const [constructionTypesError, setConstructionTypesError] = useState<string | null>(null);

  const [roleTypesData, setRoleTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingRoleTypes, setIsLoadingRoleTypes] = useState(false);
  const [roleTypesError, setRoleTypesError] = useState<string | null>(null);

  const [contractTypesData, setContractTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingContractTypes, setIsLoadingContractTypes] = useState(false);
  const [contractTypesError, setContractTypesError] = useState<string | null>(null);

  const [soilTypesData, setSoilTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingSoilTypes, setIsLoadingSoilTypes] = useState(false);
  const [soilTypesError, setSoilTypesError] = useState<string | null>(null);

  const [subcontractorTypesData, setSubcontractorTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingSubcontractorTypes, setIsLoadingSubcontractorTypes] = useState(false);
  const [subcontractorTypesError, setSubcontractorTypesError] = useState<string | null>(null);

  const [consultantRolesData, setConsultantRolesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingConsultantRoles, setIsLoadingConsultantRoles] = useState(false);
  const [consultantRolesError, setConsultantRolesError] = useState<string | null>(null);

  const [securityTypesData, setSecurityTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingSecurityTypes, setIsLoadingSecurityTypes] = useState(false);
  const [securityTypesError, setSecurityTypesError] = useState<string | null>(null);

  const [areaTypesData, setAreaTypesData] = useState<SimpleMasterItem[]>([]);
  const [isLoadingAreaTypes, setIsLoadingAreaTypes] = useState(false);
  const [areaTypesError, setAreaTypesError] = useState<string | null>(null);

  // Quote Config Location Data states (Countries, Regions, Zones)
  const [countriesData, setCountriesData] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  const [regionsData, setRegionsData] = useState<string[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [regionsError, setRegionsError] = useState<string | null>(null);

  const [zonesData, setZonesData] = useState<string[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [zonesError, setZonesError] = useState<string | null>(null);

  // Construction Types Configuration state
  const [constructionTypesConfigData, setConstructionTypesConfigData] = useState<ConstructionTypeConfigItem[]>([]);
  const [isLoadingConstructionTypesConfig, setIsLoadingConstructionTypesConfig] = useState(false);
  const [constructionTypesConfigError, setConstructionTypesConfigError] = useState<string | null>(null);
  const [isSavingConstructionTypesConfig, setIsSavingConstructionTypesConfig] = useState(false);

  // Countries Configuration state
  const [countriesConfigData, setCountriesConfigData] = useState<CountryConfigItem[]>([]);
  const [isLoadingCountriesConfig, setIsLoadingCountriesConfig] = useState(false);
  const [countriesConfigError, setCountriesConfigError] = useState<string | null>(null);
  const [isSavingCountriesConfig, setIsSavingCountriesConfig] = useState(false);

  // Regions Configuration state
  const [regionsConfigData, setRegionsConfigData] = useState<RegionConfigItem[]>([]);
  const [isLoadingRegionsConfig, setIsLoadingRegionsConfig] = useState(false);
  const [regionsConfigError, setRegionsConfigError] = useState<string | null>(null);
  const [isSavingRegionsConfig, setIsSavingRegionsConfig] = useState(false);

  // Zones Configuration state
  const [zonesConfigData, setZonesConfigData] = useState<ZoneConfigItem[]>([]);
  const [isLoadingZonesConfig, setIsLoadingZonesConfig] = useState(false);
  const [zonesConfigError, setZonesConfigError] = useState<string | null>(null);
  const [isSavingZonesConfig, setIsSavingZonesConfig] = useState(false);

  // Coverage Options state
  const [coverageOptionsData, setCoverageOptionsData] = useState<CoverageOptionsResponse | null>(null);
  const [isSavingCoverageOptions, setIsSavingCoverageOptions] = useState(false);
  const [isLoadingCoverageOptions, setIsLoadingCoverageOptions] = useState(false);
  const [coverageOptionsError, setCoverageOptionsError] = useState<string | null>(null);

  // Policy Limits state
  const [policyLimitsData, setPolicyLimitsData] = useState<PolicyLimitsResponse | null>(null);
  const [isLoadingPolicyLimits, setIsLoadingPolicyLimits] = useState(false);
  const [policyLimitsError, setPolicyLimitsError] = useState<string | null>(null);
  const [isSavingPolicyLimits, setIsSavingPolicyLimits] = useState(false);
  // Always fetch on demand (Pricing tab or Base Rates click)
  const fetchBaseRatesMasters = async (): Promise<void> => {
    setIsLoadingBaseRatesMasters(true);
    setBaseRatesMastersError(null);
    try { console.debug('[BaseRates] Loading masters...'); } catch {}
    try { toast({ title: 'Loading...', description: 'Fetching Project Types and Sub Project Types' }); } catch {}
    try {
      const projects = await listMasterProjectTypes();
      setProjectTypesMasters(projects);
      const subs = await listMasterSubProjectTypes();
      setSubProjectTypesMasters(subs);
      // Map sub projects under their parent project type (slugged value)
      const projectSlugById = new Map<number, string>();
      const projectSlugs: string[] = [];
      projects.forEach((p) => {
        const slug = (p.label || String(p.id)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        projectSlugById.set(p.id, slug);
        projectSlugs.push(slug);
      });
      // Keep shimmer running; fetch insurer base rates and map values onto the metadata
      const insurerId = getInsurerCompanyId();
      const pid = product?.id || '1';
      let mappedEntries: SubProjectEntry[] = subs.map((s) => ({
        projectType: projectSlugById.get(s.projectTypeId) || String(s.projectTypeId),
        subProjectType: s.label,
        pricingType: 'percentage',
        baseRate: 0,
        quoteOption: 'quote',
      }));
      try {
        if (insurerId && pid) {
          const baseRates = await getBaseRates(insurerId, String(pid));
          const byProject = new Map<string, Array<{ name: string; currency: 'AED' | '%'; base_rate: number; pricing_type: string; quote_option: string }>>();
          (baseRates || []).forEach((item) => {
            const slug = (item.project_type || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            byProject.set(slug, Array.isArray(item.sub_projects) ? item.sub_projects : []);
          });
          mappedEntries = mappedEntries.map((e) => {
            const list = byProject.get(e.projectType) || [];
            const match = list.find(sp => (sp.name || '').toLowerCase() === e.subProjectType.toLowerCase());
            if (!match) return e;
            // Append values into UI without overwriting metadata structure
            const normalizedPricing = String(match.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT' ? 'fixed' : 'percentage';
            const normalizedQuote = String(match.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote';
            return {
              ...e,
              pricingType: normalizedPricing as 'fixed' | 'percentage',
              baseRate: Number(match.base_rate || 0),
              // currency informs display; UI already shows % vs AED based on pricingType
              quoteOption: normalizedQuote as 'quote' | 'no-quote',
            };
          });
        }
      } catch (err: any) {
        const status = err?.status;
        const msg = status === 400 ? 'Bad request while loading base rates.'
          : status === 401 ? 'Unauthorized. Please log in again.'
          : status === 403 ? 'Forbidden. You do not have access.'
          : status >= 500 ? 'Server error while loading base rates.'
          : 'Failed to load base rates.';
        setBaseRatesMastersError(msg);
      }
      setRatingConfig((prev) => ({ ...prev, subProjectEntries: mappedEntries }));
      setSelectedProjectTypes(new Set(projectSlugs));
      try { console.debug('[BaseRates] Loaded', { projects: projects?.length, subs: subs?.length }); } catch {}
      try { toast({ title: 'Loaded', description: `Project Types: ${(projects||[]).length}, Sub Types: ${(subs||[]).length}` }); } catch {}
    } catch (err: any) {
      const status = err?.status;
      const msg = status === 400 ? 'Bad request while loading project types.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while loading masters.'
        : 'Failed to load masters.';
      setBaseRatesMastersError(msg);
      try { toast({ title: 'Failed to load', description: msg, variant: 'destructive' }); } catch {}
    } finally {
      setIsLoadingBaseRatesMasters(false);
    }
  };

  // Fire GET on Project Risk Factors click and map to UI state
  const fetchProjectRiskFactors = async (): Promise<void> => {
    setIsLoadingProjectRiskFactors(true);
    setProjectRiskFactorsError(null);
    try {
      const insurerId = getInsurerCompanyId();
      const pid = product?.id || '1';
      if (!insurerId || !pid) return;
      const resp = await getProjectRiskFactors(insurerId, String(pid));
      const data: any = (resp && (resp as any).data != null) ? (resp as any).data : resp || {};
      
      console.log('📋 Project Risk Factors API response:', data);
      console.log('📋 Risk definition data:', data?.location_hazard_loadings?.risk_definition);
      
      // Map API -> UI (only fields currently bound in UI)
      const mapDur = Array.isArray(data.project_duration_loadings)
        ? data.project_duration_loadings.map((d: any, idx: number) => ({
            id: idx + 1,
            from: Number(d?.from_months ?? 0),
            to: d?.to_months == null ? 999 : Number(d.to_months),
            pricingType: String(d?.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT' ? 'fixed' : 'percentage',
            value: Number(d?.loading_discount ?? 0),
            quoteOption: String(d?.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote',
          }))
        : undefined;
      const mapMaint = Array.isArray(data.maintenance_period_loadings)
        ? data.maintenance_period_loadings.map((d: any, idx: number) => ({
            id: idx + 1,
            from: Number(d?.from_months ?? 0),
            to: d?.to_months == null ? 999 : Number(d.to_months),
            pricingType: String(d?.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT' ? 'fixed' : 'percentage',
            value: Number(d?.loading_discount ?? 0),
            quoteOption: String(d?.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote',
          }))
        : undefined;
      const hazardRates = Array.isArray(data?.location_hazard_loadings?.location_hazard_rates)
        ? data.location_hazard_loadings.location_hazard_rates.reduce((acc: any, r: any) => {
            const txt = String(r?.risk_level || '').toLowerCase();
            const key = txt.includes('very') ? 'veryHigh' : txt.includes('high') && !txt.includes('very') ? 'high' : txt.includes('moderate') ? 'moderate' : 'low';
            acc[key] = Number(r?.loading_discount ?? 0);
            return acc;
          }, {} as any)
        : {};
      
      // Map risk definition factors from API to hardcoded UI fields
      const riskDefinition = data?.location_hazard_loadings?.risk_definition;
      const mappedRiskDefinition = {
        nearWaterBody: {
          lowRisk: 'no',
          moderateRisk: 'no', 
          highRisk: 'no',
          veryHighRisk: 'no'
        },
        floodProneZone: {
          lowRisk: 'no',
          moderateRisk: 'no',
          highRisk: 'no', 
          veryHighRisk: 'no'
        },
        cityCenter: {
          lowRisk: 'no',
          moderateRisk: 'no',
          highRisk: 'no',
          veryHighRisk: 'no'
        },
        soilType: {
          lowRisk: [],
          moderateRisk: [],
          highRisk: [],
          veryHighRisk: []
        },
        existingStructure: {
          lowRisk: 'no',
          moderateRisk: 'no',
          highRisk: 'no',
          veryHighRisk: 'no'
        },
        blastingExcavation: {
          lowRisk: 'no',
          moderateRisk: 'no',
          highRisk: 'no',
          veryHighRisk: 'no'
        },
        securityArrangements: {
          lowRisk: 'no',
          moderateRisk: 'no',
          highRisk: 'no',
          veryHighRisk: 'no'
        }
      };
      
      // Map API factors to hardcoded fields
      if (riskDefinition?.factors && Array.isArray(riskDefinition.factors)) {
        riskDefinition.factors.forEach((factor: any) => {
          const factorName = String(factor.factor || '').toLowerCase();
          
          if (factorName.includes('near water body') || factorName.includes('water body')) {
            mappedRiskDefinition.nearWaterBody = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase()
            };
          } else if (factorName.includes('flood-prone') || factorName.includes('flood prone')) {
            mappedRiskDefinition.floodProneZone = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase()
            };
          } else if (factorName.includes('city center') || factorName.includes('city centre')) {
            mappedRiskDefinition.cityCenter = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase()
            };
          } else if (factorName.includes('soil type') || factorName.includes('soil')) {
            // For soil type, we might need to parse the values differently
            // For now, keep as empty arrays - this might need adjustment based on API format
            mappedRiskDefinition.soilType = {
              lowRisk: [],
              moderateRisk: [],
              highRisk: [],
              veryHighRisk: []
            };
          } else if (factorName.includes('existing structure') || factorName.includes('existing structure on site')) {
            mappedRiskDefinition.existingStructure = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase()
            };
          } else if (factorName.includes('blasting') || factorName.includes('deep excavation')) {
            mappedRiskDefinition.blastingExcavation = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase()
            };
          } else if (factorName.includes('security') || factorName.includes('security arrangements')) {
            mappedRiskDefinition.securityArrangements = {
              lowRisk: String(factor.low_risk || 'no').toLowerCase(),
              moderateRisk: String(factor.moderate_risk || 'no').toLowerCase(),
              highRisk: String(factor.high_risk || 'no').toLowerCase(),
              veryHighRisk: String(factor.very_high_risk || 'no').toLowerCase()
            };
          }
        });
      }
      
      console.log('📋 Mapped risk definition:', mappedRiskDefinition);
      
      setRatingConfig(prev => ({
        ...prev,
        projectRisk: {
          ...prev.projectRisk,
          ...(mapDur ? { durationLoadings: mapDur } : {}),
          ...(mapMaint ? { maintenancePeriodLoadings: mapMaint } : {}),
          locationHazardLoadings: {
            ...prev.projectRisk.locationHazardLoadings,
            ...hazardRates,
          },
          riskDefinition: mappedRiskDefinition,
        },
      }));

      // Set flag to indicate we have data from GET API
      const hasData = Array.isArray(data.project_duration_loadings) || 
                     Array.isArray(data.maintenance_period_loadings) || 
                     (data?.location_hazard_loadings?.location_hazard_rates && Array.isArray(data.location_hazard_loadings.location_hazard_rates));
      setHasProjectRiskFactorsData(hasData);
    } catch (err: any) {
      const status = err?.status;
      const msg = status === 400 ? 'Bad request while loading project risk factors.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while loading project risk factors.'
        : 'Failed to load project risk factors.';
      setProjectRiskFactorsError(msg);
    } finally {
      setIsLoadingProjectRiskFactors(false);
    }
  };

  // Project Risk Factors save handler
  const handleSaveProjectRiskFactors = async () => {
    const insurerId = getInsurerCompanyId();
    const pid = product?.id || '1';
    if (!insurerId || !pid) return;
    
    setIsSavingProjectRiskFactors(true);
    try {
      // Map UI state to API request format
      const body: ProjectRiskFactorsRequest = {
        project_risk_factors: {
          project_duration_loadings: ratingConfig.projectRisk.durationLoadings.map((item: any) => ({
            from_months: Number(item.from || 0),
            to_months: item.to === 999 ? null : Number(item.to || 0),
            pricing_type: (item.pricingType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE'),
            loading_discount: Number(item.value || 0),
            quote_option: (item.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE'),
          })),
          maintenance_period_loadings: ratingConfig.projectRisk.maintenancePeriodLoadings.map((item: any) => ({
            from_months: Number(item.from || 0),
            to_months: item.to === 999 ? null : Number(item.to || 0),
            pricing_type: (item.pricingType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE'),
            loading_discount: Number(item.value || 0),
            quote_option: (item.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE'),
          })),
          location_hazard_loadings: {
            risk_definition: {
              factors: (() => {
                const projectRisk = ratingConfig.projectRisk as any;
                const riskDef = projectRisk?.riskDefinition || {};
                
                return [
                  {
                    factor: "Near water body",
                    low_risk: riskDef?.nearWaterBody?.lowRisk || "no",
                    moderate_risk: riskDef?.nearWaterBody?.moderateRisk || "no", 
                    high_risk: riskDef?.nearWaterBody?.highRisk || "no",
                    very_high_risk: riskDef?.nearWaterBody?.veryHighRisk || "no"
                  },
                  {
                    factor: "Flood-prone zone",
                    low_risk: riskDef?.floodProneZone?.lowRisk || "no",
                    moderate_risk: riskDef?.floodProneZone?.moderateRisk || "no",
                    high_risk: riskDef?.floodProneZone?.highRisk || "no", 
                    very_high_risk: riskDef?.floodProneZone?.veryHighRisk || "no"
                  },
                  {
                    factor: "City center",
                    low_risk: riskDef?.cityCenter?.lowRisk || "no",
                    moderate_risk: riskDef?.cityCenter?.moderateRisk || "no",
                    high_risk: riskDef?.cityCenter?.highRisk || "no",
                    very_high_risk: riskDef?.cityCenter?.veryHighRisk || "no"
                  },
                  {
                    factor: "Soil type",
                    low_risk: Array.isArray(riskDef?.soilType?.lowRisk) 
                      ? riskDef.soilType.lowRisk.join(', ') 
                      : "none",
                    moderate_risk: Array.isArray(riskDef?.soilType?.moderateRisk) 
                      ? riskDef.soilType.moderateRisk.join(', ') 
                      : "none",
                    high_risk: Array.isArray(riskDef?.soilType?.highRisk) 
                      ? riskDef.soilType.highRisk.join(', ') 
                      : "none",
                    very_high_risk: Array.isArray(riskDef?.soilType?.veryHighRisk) 
                      ? riskDef.soilType.veryHighRisk.join(', ') 
                      : "none"
                  },
                  {
                    factor: "Existing structure on site",
                    low_risk: riskDef?.existingStructure?.lowRisk || "no",
                    moderate_risk: riskDef?.existingStructure?.moderateRisk || "no",
                    high_risk: riskDef?.existingStructure?.highRisk || "no",
                    very_high_risk: riskDef?.existingStructure?.veryHighRisk || "no"
                  },
                  {
                    factor: "Blasting/Deep excavation",
                    low_risk: riskDef?.blastingExcavation?.lowRisk || "no",
                    moderate_risk: riskDef?.blastingExcavation?.moderateRisk || "no",
                    high_risk: riskDef?.blastingExcavation?.highRisk || "no",
                    very_high_risk: riskDef?.blastingExcavation?.veryHighRisk || "no"
                  },
                  {
                    factor: "Security arrangements",
                    low_risk: riskDef?.securityArrangements?.lowRisk || "no",
                    moderate_risk: riskDef?.securityArrangements?.moderateRisk || "no",
                    high_risk: riskDef?.securityArrangements?.highRisk || "no",
                    very_high_risk: riskDef?.securityArrangements?.veryHighRisk || "no"
                  }
                ];
              })()
            },
            location_hazard_rates: [
              {
                risk_level: "Low Risk",
                pricing_type: "PERCENTAGE",
                loading_discount: Number(ratingConfig.projectRisk.locationHazardLoadings.low || 0),
                quote_option: "AUTO_QUOTE"
              },
              {
                risk_level: "Moderate Risk", 
                pricing_type: "PERCENTAGE",
                loading_discount: Number(ratingConfig.projectRisk.locationHazardLoadings.moderate || 0),
                quote_option: "AUTO_QUOTE"
              },
              {
                risk_level: "High Risk",
                pricing_type: "PERCENTAGE", 
                loading_discount: Number(ratingConfig.projectRisk.locationHazardLoadings.high || 0),
                quote_option: "AUTO_QUOTE"
              },
              {
                risk_level: "Very High Risk",
                pricing_type: "PERCENTAGE",
                loading_discount: Number(ratingConfig.projectRisk.locationHazardLoadings.veryHigh || 0),
                quote_option: "AUTO_QUOTE"
              }
            ]
          }
        }
      };

      // Debug: Log the request body to verify Risk Definition mapping
      console.log('🔍 Project Risk Factors Request Body:', JSON.stringify(body, null, 2));
      console.log('🔍 Risk Definition from state:', JSON.stringify((ratingConfig.projectRisk as any)?.riskDefinition, null, 2));

      // Use POST if no data from GET API, PATCH if data exists
      const resp = hasProjectRiskFactorsData
        ? await updateProjectRiskFactors(insurerId, String(pid), body)
        : await createProjectRiskFactors(insurerId, String(pid), body);
      
      toast({ title: 'Saved', description: resp?.message || 'Project risk factors saved successfully.' });
    } catch (err: any) {
      const status = err?.status;
      const msg = status === 400 ? 'Invalid data while saving project risk factors.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while saving project risk factors.'
        : (err?.message || 'Failed to save project risk factors.');
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSavingProjectRiskFactors(false);
    }
  };

  // Fire GET on Contractor Risk Factors click and map to UI state
  const fetchContractorRiskFactors = async (): Promise<void> => {
    setIsLoadingContractorRiskFactors(true);
    setContractorRiskFactorsError(null);
    try {
      const insurerId = getInsurerCompanyId();
      const pid = product?.id || '1';
      if (!insurerId || !pid) return;
      const resp = await getContractorRiskFactors(insurerId, String(pid));
      const data: any = resp || {};
      
      // Map API response to UI state
      const mapExperience = Array.isArray(data.experience_loadings)
        ? data.experience_loadings.map((item: any, idx: number) => ({
            id: idx + 1,
            from: Number(item?.from_years ?? 0),
            to: item?.to_years === 999 ? 999 : Number(item.to_years ?? 0),
            pricingType: String(item?.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT' ? 'fixed' : 'percentage',
            loadingDiscount: Number(item?.loading_discount ?? 0),
            quoteOption: String(item?.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote',
          }))
        : ratingConfig.contractorRisk.experienceDiscounts;

      const mapClaimFreq = Array.isArray(data.claims_based_loadings)
        ? data.claims_based_loadings.map((item: any, idx: number) => ({
            id: idx + 1,
            from: Number(item?.from_claims ?? 0),
            to: Number(item?.to_claims ?? 0),
            pricingType: String(item?.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT' ? 'fixed' : 'percentage',
            loadingDiscount: Number(item?.loading_discount ?? 0),
            quoteOption: String(item?.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote',
          }))
        : ratingConfig.contractorRisk.claimFrequency;

      const mapClaimAmount = Array.isArray(data.claim_amount_categories)
        ? data.claim_amount_categories.map((item: any, idx: number) => ({
            id: idx + 1,
            from: Number(item?.from_amount ?? 0),
            to: Number(item?.to_amount ?? 0),
            pricingType: String(item?.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT' ? 'fixed' : 'percentage',
            loadingDiscount: Number(item?.loading_discount ?? 0),
            quoteOption: String(item?.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote',
          }))
        : ratingConfig.contractorRisk.claimAmountCategories;

      const mapContractorNumbers = Array.isArray(data.contractor_number_based)
        ? data.contractor_number_based.map((item: any, idx: number) => ({
            id: idx + 1,
            from: Number(item?.from_contractors ?? 0),
            to: Number(item?.to_contractors ?? 0),
            pricingType: String(item?.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT' ? 'fixed' : 'percentage',
            loadingDiscount: Number(item?.loading_discount ?? 0),
            quoteOption: String(item?.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote',
          }))
        : ratingConfig.contractorRisk.contractorNumbers;

      const mapSubcontractorNumbers = Array.isArray(data.subcontractor_number_based)
        ? data.subcontractor_number_based.map((item: any, idx: number) => ({
            id: idx + 1,
            from: Number(item?.from_subcontractors ?? 0),
            to: Number(item?.to_subcontractors ?? 0),
            pricingType: String(item?.pricing_type || '').toUpperCase() === 'FIXED_AMOUNT' ? 'fixed' : 'percentage',
            loadingDiscount: Number(item?.loading_discount ?? 0),
            quoteOption: String(item?.quote_option || '').toUpperCase() === 'NO_QUOTE' ? 'no-quote' : 'quote',
          }))
        : ratingConfig.contractorRisk.subcontractorNumbers;

      // Update UI state with mapped data
      setRatingConfig(prev => ({
        ...prev,
        contractorRisk: {
          ...prev.contractorRisk,
          experienceDiscounts: mapExperience,
          claimFrequency: mapClaimFreq,
          claimAmountCategories: mapClaimAmount,
          contractorNumbers: mapContractorNumbers,
          subcontractorNumbers: mapSubcontractorNumbers,
        },
      }));

      // Set flag to indicate we have data from GET API
      const hasData = Array.isArray(data.experience_loadings) || Array.isArray(data.claims_based_loadings) || 
                     Array.isArray(data.claim_amount_categories) || Array.isArray(data.contractor_number_based) || 
                     Array.isArray(data.subcontractor_number_based);
      setHasContractorRiskFactorsData(hasData);
    } catch (err: any) {
      const status = err?.status;
      const msg = status === 400 ? 'Bad request while loading contractor risk factors.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while loading contractor risk factors.'
        : 'Failed to load contractor risk factors.';
      setContractorRiskFactorsError(msg);
    } finally {
      setIsLoadingContractorRiskFactors(false);
    }
  };

  // Contractor Risk Factors save handler
  const handleSaveContractorRiskFactors = async () => {
    const insurerId = getInsurerCompanyId();
    const pid = product?.id || '1';
    if (!insurerId || !pid) return;
    
    setIsSavingContractorRiskFactors(true);
    try {
      // Map UI state to API request format - Always include ALL sections for both POST and PATCH
      const body: ContractorRiskFactorsRequest = {
        insurer_id: Number(insurerId),
        contractor_risk_factors: {
          experience_loadings: ratingConfig.contractorRisk.experienceDiscounts.map((item: any) => ({
            from_years: Number(item.from || 0),
            to_years: item.to === 999 ? 999 : Number(item.to || 0),
            pricing_type: (item.pricingType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE'),
            loading_discount: Number(item.loadingDiscount || 0),
            quote_option: (item.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE'),
          })),
          claims_based_loadings: ratingConfig.contractorRisk.claimFrequency.map((item: any) => ({
            from_claims: Number(item.from || 0),
            to_claims: Number(item.to || 0),
            pricing_type: (item.pricingType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE'),
            loading_discount: Number(item.loadingDiscount || 0),
            quote_option: (item.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE'),
          })),
          // Always include all sections to prevent deletion during PATCH
          claim_amount_categories: ratingConfig.contractorRisk.claimAmountCategories.map((item: any) => ({
            from_amount: Number(item.from || 0),
            to_amount: Number(item.to || 0),
            pricing_type: (item.pricingType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE'),
            loading_discount: Number(item.loadingDiscount || 0),
            currency: 'AED',
            quote_option: (item.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE'),
          })),
          contractor_number_based: ratingConfig.contractorRisk.contractorNumbers.map((item: any) => ({
            from_contractors: Number(item.from || 0),
            to_contractors: Number(item.to || 0),
            pricing_type: (item.pricingType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE'),
            loading_discount: Number(item.loadingDiscount || 0),
            quote_option: (item.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE'),
          })),
          subcontractor_number_based: ratingConfig.contractorRisk.subcontractorNumbers.map((item: any) => ({
            from_subcontractors: Number(item.from || 0),
            to_subcontractors: Number(item.to || 0),
            pricing_type: (item.pricingType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE'),
            loading_discount: Number(item.loadingDiscount || 0),
            quote_option: (item.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE'),
          }))
        }
      };

      console.log('🔍 Contractor Risk Factors Request Body:', JSON.stringify(body, null, 2));

      // Use POST if no data from GET API, PATCH if data exists
      const resp = hasContractorRiskFactorsData
        ? await updateContractorRiskFactors(insurerId, String(pid), body)
        : await createContractorRiskFactors(insurerId, String(pid), body);
      
      toast({ title: 'Saved', description: resp?.message || 'Contractor risk factors saved successfully.' });
    } catch (err: any) {
      const status = err?.status;
      const msg = status === 400 ? 'Invalid data while saving contractor risk factors.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while saving contractor risk factors.'
        : (err?.message || 'Failed to save contractor risk factors.');
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSavingContractorRiskFactors(false);
    }
  };

  // Mock product data
  const product = {
    id: productId,
    name: productId === "1" ? "CAR Insurance" : "CAR Insurance Premium",
    code: productId === "1" ? "CAR-STD-001" : "CAR-PRM-002"
  };

  // State for geographic selection


  // Initialize base rates from masters data
  const initializeBaseRates = () => {
    const rates: Record<string, number> = {};
    activeProjectTypes.forEach(type => {
      rates[type.value] = 0; // Start with 0 instead of pre-filled base rates
    });
    return rates;
  };

  // Initialize sub project types as individual entries
  type SubProjectEntry = {
      projectType: string;
      subProjectType: string;
    pricingType: 'percentage' | 'fixed';
      baseRate: number;
    quoteOption: 'quote' | 'no-quote';
  };
  const initializeSubProjectEntries = () => {
    const entries: SubProjectEntry[] = [];
    
    activeProjectTypes.forEach(type => {
      const subTypes = getSubProjectTypesByProjectType(type.id);
      subTypes.forEach(subType => {
        entries.push({
          projectType: type.value,
          subProjectType: subType.label,
          pricingType: 'percentage',
          baseRate: 0, // Start with 0 instead of pre-filled base rates
          quoteOption: 'quote'
        });
      });
    });
    
    return entries;
  };

  const [uploadedWordings, setUploadedWordings] = useState([]);
  const [activePricingTab, setActivePricingTab] = useState("base-rates");
  const [isNewWordingDialogOpen, setIsNewWordingDialogOpen] = useState(false);
  const [newWordingName, setNewWordingName] = useState("");
  const [isWordingUploadDialogOpen, setIsWordingUploadDialogOpen] = useState(false);
  const [wordingUploadTitle, setWordingUploadTitle] = useState("");
  const [wordingUploadActive, setWordingUploadActive] = useState(true);
  const [wordingUploadFile, setWordingUploadFile] = useState<File | null>(null);
  const [isUploadingWording, setIsUploadingWording] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editingWording, setEditingWording] = useState<any>(null);
  const [isEditClauseDialogOpen, setIsEditClauseDialogOpen] = useState(false);
  const [selectedClause, setSelectedClause] = useState<any>(null);
  const [isAddClauseDialogOpen, setIsAddClauseDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewWording, setPreviewWording] = useState<PolicyWording | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isConfirmSaveDialogOpen, setIsConfirmSaveDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("quote-config");
  
  // Quote Format state
  const [isLoadingQuoteFormat, setIsLoadingQuoteFormat] = useState(false);
  const [quoteFormatError, setQuoteFormatError] = useState<string | null>(null);
  const quoteFormatApiRef = useRef(false);
  const hasLoadedQuoteFormatRef = useRef(false);
  const [quoteFormatId, setQuoteFormatId] = useState<number | null>(null);
  const [quoteLogoFile, setQuoteLogoFile] = useState<File | null>(null);
  const [isSavingQuoteFormat, setIsSavingQuoteFormat] = useState(false);
  
  // Required Documents state
  const [isLoadingRequiredDocs, setIsLoadingRequiredDocs] = useState(false);
  const [requiredDocsError, setRequiredDocsError] = useState<string | null>(null);
  const requiredDocsApiRef = useRef(false);
  
  // Insurer metadata state
  const [insurerMetadata, setInsurerMetadata] = useState<InsurerMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  
  // Quote config data state
  const [quoteConfigData, setQuoteConfigData] = useState<QuoteConfigUIResponse | null>(null);
  const [isLoadingQuoteConfig, setIsLoadingQuoteConfig] = useState(false);
  const [quoteConfigError, setQuoteConfigError] = useState<string | null>(null);
  const [isSavingQuoteConfig, setIsSavingQuoteConfig] = useState(false);
  const [hasQuoteConfigData, setHasQuoteConfigData] = useState(false);
  
  // Policy Wordings state
  const [policyWordings, setPolicyWordings] = useState<PolicyWording[]>([]);
  const [isLoadingPolicyWordings, setIsLoadingPolicyWordings] = useState(false);
  const [policyWordingsError, setPolicyWordingsError] = useState<string | null>(null);
  const policyWordingsApiRef = useRef(false);
  
  // Required Documents state
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [newDocument, setNewDocument] = useState<any>({ label: "", description: "", required: false, active: true, template: null });
  
  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: () => {}
  });
  const [newClause, setNewClause] = useState({
    code: "",
    title: "",
    type: "Clause",
    show: "Optional",
    wording: "",
    purposeDescription: "",
    purpose: "",
    pricingType: "percentage", // "percentage" or "fixed"
    pricingValue: 0
  });

  // State for selected project types
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<Set<string>>(new Set());

  // State for TPL limit & Extensions
  const [tplLimit, setTplLimit] = useState("");
  
  // Load insurer metadata when Quote Configurator tab is active
  useEffect(() => {
    const loadInsurerMetadata = async () => {
      if (activeTab === "quote-config" && !insurerMetadata && !isLoadingMetadata) {
        setIsLoadingMetadata(true);
        setMetadataError(null);
        try {
          const insurerId = getInsurerCompanyId();
          if (insurerId) {
            const metadata = await getInsurerMetadata(insurerId);
            setInsurerMetadata(metadata);
          }
        } catch (err: any) {
          const status = err?.status as number | undefined;
          const message = err?.message as string | undefined;
          if (status === 400) setMetadataError(message || 'Bad request while loading insurer metadata.');
          else if (status === 401) setMetadataError('Unauthorized. Please log in again.');
          else if (status === 403) setMetadataError("You don't have access to insurer metadata.");
          else if (status && status >= 500) setMetadataError('Server error. Please try again later.');
          else setMetadataError(message || 'Failed to load insurer metadata.');
        } finally {
          setIsLoadingMetadata(false);
        }
      }
    };
    
    loadInsurerMetadata();
  }, [activeTab, insurerMetadata]);
  
  // Load quote config data after metadata is loaded
  useEffect(() => {
    const loadQuoteConfigData = async () => {
      if (insurerMetadata && !quoteConfigData && !isLoadingQuoteConfig && activeTab === "quote-config") {
        setIsLoadingQuoteConfig(true);
        setQuoteConfigError(null);
        try {
          const insurerId = getInsurerCompanyId();
          if (insurerId && product.id) {
            const configData = await getQuoteConfigForUI(insurerId, product.id as string);
            setQuoteConfigData(configData);
            
            // Populate the UI with the fetched data (correct mapping)
            setQuoteConfig(prev => ({
              ...prev,
              details: {
                ...prev.details,
                validityDays: String(configData.validity_days || ''),
                backdateWindow: String(configData.backdate_days || ''),
                countries: configData.operating_countries || [],
                regions: configData.operating_regions || [],
                zones: configData.operating_zones || [],
              }
            }));

            // Set flag to indicate we have existing data from GET API
            setHasQuoteConfigData(Boolean(configData && (configData.validity_days || configData.backdate_days || configData.operating_countries?.length)));
          }
        } catch (err: any) {
          const status = err?.status as number | undefined;
          const message = err?.message as string | undefined;
          if (status === 400) setQuoteConfigError(message || 'Bad request while loading quote config.');
          else if (status === 401) setQuoteConfigError('Unauthorized. Please log in again.');
          else if (status === 403) setQuoteConfigError("You don't have access to quote config.");
          else if (status && status >= 500) setQuoteConfigError('Server error. Please try again later.');
          else setQuoteConfigError(message || 'Failed to load quote config.');
        } finally {
          setIsLoadingQuoteConfig(false);
        }
      }
    };
    
    loadQuoteConfigData();
  }, [insurerMetadata, quoteConfigData, activeTab, product.id]);
  
  // Load policy wordings when Wording Configuration tab is active
  useEffect(() => {
    const loadPolicyWordings = async () => {
      if (activeTab === "wording" && !isLoadingPolicyWordings && !policyWordingsApiRef.current && product.id) {
        policyWordingsApiRef.current = true;
        setIsLoadingPolicyWordings(true);
        setPolicyWordingsError(null);
        try {
          const insurerId = getInsurerCompanyId();
          if (insurerId && product.id) {
            const wordingsData = await getPolicyWordings(insurerId, product.id as string);
            setPolicyWordings(wordingsData.wordings);
          }
        } catch (err: any) {
          const status = err?.status as number | undefined;
          const message = err?.message as string | undefined;
          if (status === 400) setPolicyWordingsError(message || 'Bad request while loading policy wordings.');
          else if (status === 401) setPolicyWordingsError('Unauthorized. Please log in again.');
          else if (status === 403) setPolicyWordingsError("You don't have access to policy wordings.");
          else if (status && status >= 500) setPolicyWordingsError('Server error. Please try again later.');
          else setPolicyWordingsError(message || 'Failed to load policy wordings.');
        } finally {
          setIsLoadingPolicyWordings(false);
          policyWordingsApiRef.current = false;
        }
      }
    };
    
    loadPolicyWordings();
    
    // Cleanup function to reset the ref when tab changes
    return () => {
      if (activeTab !== "wording") {
        policyWordingsApiRef.current = false;
      }
    };
  }, [activeTab, product.id]);

  // Load TPL limits & extensions when CEWs tab is active
  useEffect(() => {
    const loadTpl = async () => {
      if (activeTab !== 'cews') return;
      if (tplApiRef.current || hasLoadedTplRef.current) return;
      tplApiRef.current = true;
      setIsLoadingTpl(true);
      setTplError(null);
      try {
        const insurerId = getInsurerCompanyId();
        if (!insurerId || !product.id) return;
        const data: GetTplResponse = await getTplLimitsAndExtensions(insurerId, product.id as string);
        // Map limits
        setTplLimit(String(data?.limits?.default_limit || ''));
        // Map extensions
        const mapped = (data?.extensions || []).map((e) => ({
          id: e.id,
          title: e.title || '',
          description: e.description || '',
          tplLimitValue: String(e.limit_value || ''),
          pricingType: (String(e.pricing_type || '').toLowerCase() === 'fixed_rate' ? 'fixed' : 'percentage') as 'percentage' | 'fixed',
          loadingDiscount: Number(e.pricing_value || 0),
        }));
        setTplExtensions(mapped);
        hasLoadedTplRef.current = true;
      } catch (err: any) {
        const status = err?.status as number | undefined;
        const message = err?.message as string | undefined;
        if (status === 400) setTplError(message || 'Bad request while loading TPL data.');
        else if (status === 401) setTplError('Unauthorized. Please log in again.');
        else if (status === 403) setTplError("You don't have access to TPL data.");
        else if (status && status >= 500) setTplError('Server error. Please try again later.');
        else setTplError(message || 'Failed to load TPL data.');
      } finally {
        setIsLoadingTpl(false);
        tplApiRef.current = false;
      }
    };
    loadTpl();
    return () => {
      if (activeTab !== 'cews') {
        hasLoadedTplRef.current = false;
        tplApiRef.current = false;
      }
    };
  }, [activeTab, product.id]);

  // Load Clauses/Exclusions/Warranties when CEWs tab is active
  useEffect(() => {
    const loadClauses = async () => {
      if (activeTab !== 'cews') return;
      if (clausesApiRef.current) return;
      clausesApiRef.current = true;
      setIsLoadingClauses(true);
      setClausesError(null);
      try {
        const insurerId = getInsurerCompanyId();
        if (!insurerId || !product.id) return;
        const resp: GetClausesResponse = await getCewsClauses(insurerId, product.id as string);
        const list = Array.isArray(resp?.clauses) ? resp.clauses : [];
        const mapped = list.map((c) => ({
          id: c.id,
          code: c.clause_code || '',
          title: c.title || '',
          purposeDescription: c.purpose_description || '',
          wording: c.clause_wording || '',
          type: ((c.clause_type || '').toUpperCase() === 'EXCLUSION'
                  ? 'Exclusion'
                  : (c.clause_type || '').toUpperCase() === 'WARRANTY'
                    ? 'Warranty'
                    : 'Clause'),
          show: (c.show_type || '').toUpperCase() === 'MANDATORY' ? 'Mandatory' : 'Optional',
          pricingType: (c.pricing_type || '').toLowerCase() === 'fixed_rate' ? 'fixed' : 'percentage',
          pricingValue: Number(c.pricing_value || 0),
          displayOrder: Number(c.display_order || 0),
          active: c.is_active === 1,
        }));
        setClausesData(mapped as any);
      } catch (err: any) {
        const status = err?.status as number | undefined;
        const message = err?.message as string | undefined;
        if (status === 400) setClausesError(message || 'Bad request while loading clauses.');
        else if (status === 401) setClausesError('Unauthorized. Please log in again.');
        else if (status === 403) setClausesError("You don't have access to clauses.");
        else if (status && status >= 500) setClausesError('Server error. Please try again later.');
        else setClausesError(message || 'Failed to load clauses.');
      } finally {
        setIsLoadingClauses(false);
        clausesApiRef.current = false;
      }
    };
    loadClauses();
  }, [activeTab, product.id]);

  // Load Quote Format when Quote Format tab is active
  useEffect(() => {
    const loadQuoteFormat = async () => {
      if (activeTab !== 'quote-format') return;
      if (quoteFormatApiRef.current) return;
      if (hasLoadedQuoteFormatRef.current) return;
      quoteFormatApiRef.current = true;
      setIsLoadingQuoteFormat(true);
      setQuoteFormatError(null);
      try {
        const insurerId = getInsurerCompanyId();
        if (!insurerId || !product.id) return;
        const data: QuoteFormatResponse = await getQuoteFormat(insurerId, product.id as string);
        // Map API -> UI state
        setQuoteFormatId(data?.id ?? null);
        setQuoteConfig(prev => ({
          ...prev,
          header: {
            ...prev.header,
            companyName: data.company_name || '',
            companyAddress: data.company_address || '',
            contactInfo: data.contact_info?.raw || '',
            headerColor: data.header_bg_color || '#1f2937',
            headerTextColor: data.header_text_color || '#ffffff',
            logoPosition: (data.logo_position || 'LEFT').toLowerCase(),
          },
          details: {
            ...prev.details,
            quotePrefix: data.quotation_prefix || '',
          },
          risk: {
            ...prev.risk,
            showProjectDetails: data.show_project_details === 1,
            showCoverageTypes: data.show_coverage_types === 1,
            showCoverageLimits: data.show_coverage_limits === 1,
            showDeductibles: data.show_deductibles === 1,
            showContractorInfo: data.show_contractor_info === 1,
            riskSectionTitle: data.risk_section_title || 'Risk Details',
          },
          premium: {
            ...prev.premium,
            currency: data.premium_currency || 'AED',
            premiumSectionTitle: data.premium_section_title || 'Premium Breakdown',
            showBasePremium: data.show_base_premium === 1,
            showRiskAdjustments: data.show_risk_adjustments === 1,
            showFees: data.show_fees_charges === 1,
            showTaxes: data.show_taxes_vat === 1,
            showTotalPremium: data.show_total_premium === 1,
          },
          terms: {
            ...prev.terms,
            showWarranties: data.show_warranties === 1,
            showExclusions: data.show_exclusions === 1,
            showDeductibleDetails: data.show_deductible_details === 1,
            showPolicyConditions: data.show_policy_conditions === 1,
            termsSectionTitle: data.terms_section_title || 'Terms & Conditions',
            additionalTerms: data.additional_terms_text || '',
          },
          signature: {
            ...prev.signature,
            showSignatureBlock: data.show_signature_block === 1,
            authorizedSignatory: data.authorized_signatory_name || '',
            signatoryTitle: data.signatory_title || '',
            signatureText: data.signature_block_text || '',
          },
          footer: {
            ...prev.footer,
            showFooter: data.show_footer === 1,
            showDisclaimer: data.show_general_disclaimer === 1,
            showRegulatoryInfo: data.show_regulatory_info === 1,
            generalDisclaimer: data.general_disclaimer_text || prev.footer.generalDisclaimer,
            regulatoryText: data.regulatory_info_text || prev.footer.regulatoryText,
            footerBgColor: data.footer_bg_color || prev.footer.footerBgColor,
            footerTextColor: data.footer_text_color || prev.footer.footerTextColor,
          },
        }));
        hasLoadedQuoteFormatRef.current = true;
      } catch (err: any) {
        const status = err?.status as number | undefined;
        const message = err?.message as string | undefined;
        if (status === 400) setQuoteFormatError(message || 'Bad request while loading quote format.');
        else if (status === 401) setQuoteFormatError('Unauthorized. Please log in again.');
        else if (status === 403) setQuoteFormatError("You don't have access to quote format.");
        else if (status && status >= 500) setQuoteFormatError('Server error. Please try again later.');
        else setQuoteFormatError(message || 'Failed to load quote format.');
      } finally {
        setIsLoadingQuoteFormat(false);
        quoteFormatApiRef.current = false;
      }
    };
    loadQuoteFormat();
  }, [activeTab, product.id]);

  // Load Required Documents when tab is active
  useEffect(() => {
    const loadRequiredDocs = async () => {
      if (activeTab !== 'required-documents') return;
      if (requiredDocsApiRef.current) return;
      requiredDocsApiRef.current = true;
      setIsLoadingRequiredDocs(true);
      setRequiredDocsError(null);
      try {
        const insurerId = getInsurerCompanyId();
        if (!insurerId || !product.id) return;
        const resp: GetRequiredDocumentsResponse = await getRequiredDocuments(insurerId, product.id as string);
        const list = Array.isArray(resp?.documents) ? resp.documents : [];
        // map to existing requiredDocuments UI structure
        const mapped = list.map(d => ({
          id: d.id,
          label: d.display_label,
          description: d.description || '',
          required: !!d.is_required,
          active: (d.status || '').toLowerCase() === 'active',
          order: d.display_order,
          template: d.template_file_url ? { name: d.template_file_url.split('/').pop() || 'template.pdf', size: '—', url: d.template_file_url } : null,
        }));
        setRequiredDocuments(mapped as any);
        // loaded successfully
      } catch (err: any) {
        const status = err?.status as number | undefined;
        const message = err?.message as string | undefined;
        if (status === 400) setRequiredDocsError(message || 'Bad request while loading required documents.');
        else if (status === 401) setRequiredDocsError('Unauthorized. Please log in again.');
        else if (status === 403) setRequiredDocsError("You don't have access to required documents.");
        else if (status && status >= 500) setRequiredDocsError('Server error. Please try again later.');
        else setRequiredDocsError(message || 'Failed to load required documents.');
      } finally {
        setIsLoadingRequiredDocs(false);
        requiredDocsApiRef.current = false;
      }
    };
    loadRequiredDocs();
  }, [activeTab, product.id]);
  
  // Helper functions for hierarchical filtering
  const getAvailableRegions = () => {
    if (!insurerMetadata || !quoteConfig.details.countries || quoteConfig.details.countries.length === 0) {
      return [];
    }
    return insurerMetadata.operating_regions.filter(region => 
      quoteConfig.details.countries?.includes(region.country)
    );
  };
  
  const getAvailableZones = () => {
    if (!insurerMetadata || !quoteConfig.details.regions || quoteConfig.details.regions.length === 0) {
      return [];
    }
    return insurerMetadata.operating_zones.filter(zone => 
      quoteConfig.details.regions?.includes(zone.region)
    );
  };
  
  const [tplExtensions, setTplExtensions] = useState([
    {
      id: 1,
      title: "",
      description: "",
      tplLimitValue: "",
      pricingType: "percentage" as "percentage" | "fixed",
      loadingDiscount: 0
    }
  ]);
  const [isLoadingTpl, setIsLoadingTpl] = useState(false);
  const [tplError, setTplError] = useState<string | null>(null);
  const tplApiRef = useRef(false);
  const hasLoadedTplRef = useRef(false);
  const [isSavingTpl, setIsSavingTpl] = useState(false);
  // Pricing tab local state only (API integrations removed on request)

  const saveTplExtensions = async () => {
    try {
      setIsSavingTpl(true);
      setTplError(null);
      const insurerId = getInsurerCompanyId();
      if (!insurerId || !product.id) return;
      const body: UpdateTplRequest = {
        product_id: Number(product.id),
        default_limit: Number(tplLimit || 0),
        currency: 'AED',
        extensions: tplExtensions
          .filter(ext => (ext.title && ext.title.trim().length > 0) || (ext.tplLimitValue && String(ext.tplLimitValue).trim().length > 0))
          .map(ext => ({
            id: typeof ext.id === 'number' ? ext.id : undefined,
            title: ext.title || '',
            description: ext.description || '',
            limit_value: Number(ext.tplLimitValue || 0),
            pricing_type: (ext.pricingType === 'fixed' ? 'fixed' : 'percentage'),
            pricing_value: Number(ext.loadingDiscount || 0),
            currency: 'AED',
          })),
      };
      await updateTplLimitsAndExtensions(insurerId, product.id as string, body);
      // refresh GET with shimmer
      hasLoadedTplRef.current = false;
      tplApiRef.current = false;
      setIsLoadingTpl(true);
      const data: GetTplResponse = await getTplLimitsAndExtensions(insurerId, product.id as string);
      setTplLimit(String(data?.limits?.default_limit || ''));
      const mapped = (data?.extensions || []).map((e) => ({
        id: e.id,
        title: e.title || '',
        description: e.description || '',
        tplLimitValue: String(e.limit_value || ''),
        pricingType: (String(e.pricing_type || '').toLowerCase() === 'fixed_rate' || String(e.pricing_type || '').toLowerCase() === 'fixed' ? 'fixed' : 'percentage') as 'percentage' | 'fixed',
        loadingDiscount: Number(e.pricing_value || 0),
      }));
      setTplExtensions(mapped);
      hasLoadedTplRef.current = true;
      setIsLoadingTpl(false);
      toast({ title: 'TPL Extensions Saved', description: 'TPL limit & extensions updated successfully.' });
    } catch (err: any) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400) setTplError(message || 'Bad request while saving TPL data.');
      else if (status === 401) setTplError('Unauthorized. Please log in again.');
      else if (status === 403) setTplError("You don't have access to save TPL data.");
      else if (status && status >= 500) setTplError('Server error. Please try again later.');
      else setTplError(message || 'Failed to save TPL data.');
      setIsLoadingTpl(false);
    } finally {
      setIsSavingTpl(false);
    }
  };
  // Load Base Rates when Pricing → Base Rates is active
  // (removed) Base Rates API integration
  // (removed) Base Rates save handler
  // (removed) Project Risk API integration
  // Clauses data - start empty
  const [clausesData, setClausesData] = useState([]);
  const [isLoadingClauses, setIsLoadingClauses] = useState(false);
  const [clausesError, setClausesError] = useState<string | null>(null);
  const clausesApiRef = useRef(false);
  const [isSavingClause, setIsSavingClause] = useState(false);

  const [quoteConfig, setQuoteConfig] = useState({
    header: {
      companyName: "",
      companyAddress: "",
      contactInfo: "",
      headerColor: "#1f2937",
      headerTextColor: "#ffffff",
      logoPosition: "left"
    },
    details: {
      quotePrefix: "",
      dateFormat: "DD/MM/YYYY",
      validityDays: "",
      geographicalScope: "",
      countries: [], // Array of country names
      regions: [], // Array of region names 
      zones: [], // Array of zone names
      backdateWindow: "",
      showQuoteNumber: true,
      showIssueDate: true,
      showValidity: true,
      showGeographicalScope: true
    },
    risk: {
      showProjectDetails: true,
      showCoverageTypes: true,
      showCoverageLimits: true,
      showDeductibles: true,
      showContractorInfo: true,
      riskSectionTitle: "Risk Details"
    },
    premium: {
      currency: "AED",
      premiumSectionTitle: "Premium Breakdown",
      showBasePremium: true,
      showRiskAdjustments: true,
      showFees: true,
      showTaxes: true,
      showTotalPremium: true
    },
    terms: {
      showWarranties: true,
      showExclusions: true,
      showDeductibleDetails: true,
      showPolicyConditions: true,
      termsSectionTitle: "Terms & Conditions",
      additionalTerms: ""
    },
    signature: {
      showSignatureBlock: true,
      authorizedSignatory: "",
      signatoryTitle: "",
      signatureText: ""
    },
    footer: {
      showFooter: true,
      showDisclaimer: true,
      showRegulatoryInfo: true,
      generalDisclaimer: "",
      regulatoryText: "",
      footerBgColor: "#f8f9fa",
      footerTextColor: "#6b7280"
    }
  });
  const [ratingConfig, setRatingConfig] = useState({
    // Base Rates by Project Type (from masters data)
    baseRates: initializeBaseRates(),
    // Quote decision for each project type
    projectTypeQuoteOptions: (() => {
      const options: Record<string, string> = {};
      activeProjectTypes.forEach(type => {
        options[type.value] = 'quote'; // default to 'quote'
      });
      return options;
    })(),
    // Sub project entries with individual pricing
    subProjectEntries: initializeSubProjectEntries(),
    // Project Risk Factors
    projectRisk: {
      projectTypeMultipliers: {
        residential: 0,
        commercial: 0,
        infrastructure: 0,
      },
    durationLoadings: [
      { id: 1, from: 0, to: 0, pricingType: 'percentage', value: 0, quoteOption: 'quote' },
    ],
    maintenancePeriodLoadings: [
      { id: 1, from: 0, to: 0, pricingType: 'percentage', value: 0, quoteOption: 'quote' },
    ],
      locationHazardLoadings: {
        low: 0,
        moderate: 0,
        high: 0,
        veryHigh: 0,
      },
    },
    // Contractor Risk Factors
    contractorRisk: {
      experienceDiscounts: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      subcontractorLoadings: {
        none: 0,
        limited: 0,
        moderate: 0,
        heavy: 0,
      },
      contractorNumbers: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      subcontractorNumbers: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      claimFrequency: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      claimAmountCategories: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
    },
    // Cover Requirements (based on proposal form fields)
    coverRequirements: {
      sumInsured: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      projectValue: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      contractWorks: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      plantEquipment: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      temporaryWorks: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      otherMaterials: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      principalExistingProperty: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      tplLimit: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
      ],
      subLimits: [
        { id: 1, title: '', description: '', pricingType: 'percentage-sum-insured', value: 0 },
      ],
      deductibles: [
        { id: 1, deductibleType: 'fixed', value: 0, loadingDiscount: 0, quoteOption: 'quote' },
      ],
      crossLiabilityCover: {
        yes: 0,
        no: 0,
      },
    },
    // Policy Limits
    limits: {
      minimumPremium: 0,
      maximumCover: 0,
      baseBrokerCommission: 0,
      minimumBrokerCommission: 0,
      maximumBrokerCommission: 0,
    },
    // Clauses Pricing - now derived from configured CEWs
    clausesPricing: clausesData.map((clause, index) => ({
      id: index + 1,
      code: clause.code,
      name: clause.title,
      enabled: clause.show === "Mandatory" ? true : false, // Mandatory always enabled
      isMandatory: clause.show === "Mandatory",
      pricingType: (clause.type === "Clause" ? "percentage" : "amount") as "percentage" | "amount",
      pricingValue: clause.type === "Clause" ? 0 : 0, // Start with 0 instead of hardcoded values
      variableOptions: [
        {
          id: 1,
          label: clause.show === "Mandatory" ? "Standard Rate" : "Base Option",
          limits: clause.show === "Mandatory" ? "All Coverage" : "Standard Coverage",
          type: (clause.type === "Clause" ? "percentage" : "amount") as "percentage" | "amount",
          value: clause.show === "Mandatory" 
            ? 0 // Start with 0 instead of hardcoded values
            : 0 // Start with 0 instead of hardcoded values
        }
      ]
    })),
    // Fee Types
    feeTypes: [
      { id: 1, label: "VAT", pricingType: "percentage", value: 0, active: true }
    ]
  });

  const getInsurerName = (id: string | undefined) => {
    const insurerNames: { [key: string]: string } = {
      'emirates-insurance': '',
      'axa-gulf': '',
      'oman-insurance': '',
      'dubai-insurance': ''
    };
    return insurerNames[id || ''] || 'Unknown Insurer';
  };

  const toggleProjectType = (projectType: string) => {
    setSelectedProjectTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectType)) {
        newSet.delete(projectType);
      } else {
        newSet.add(projectType);
      }
      return newSet;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setWordingUploadFile(file);
  };

  const openUploadDialog = () => {
    setEditingWording(null);
    setWordingUploadTitle("");
    setIsWordingUploadDialogOpen(true);
  };

  const openEditDialog = (wording: any) => {
    setEditingWording(wording);
    setWordingUploadTitle(wording.document_title || wording.name || "");
    setWordingUploadActive(Number(wording.is_active) === 1 || wording.is_active === true);
    setWordingUploadFile(null);
    setIsWordingUploadDialogOpen(true);
  };

  const handleSavePolicyWording = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    if (!insurerId || !product.id) return;
    try {
      setIsUploadingWording(true);
      if (editingWording) {
        const params: any = {
          document_title: wordingUploadTitle,
          is_active: String(!!wordingUploadActive),
        };
        if (wordingUploadFile instanceof File) params.document = wordingUploadFile;
        const wordingId = (editingWording.id || editingWording.wording_id || editingWording.wordingId) as string;
        await updatePolicyWording(insurerId, product.id as string, wordingId, params);
      } else {
        if (!(wordingUploadFile instanceof File)) return;
        await uploadPolicyWording(insurerId, product.id as string, {
          product_id: String(product.id),
          document_title: wordingUploadTitle,
          is_active: String(!!wordingUploadActive),
          document: wordingUploadFile as File,
        });
      }
      const wordingsData = await getPolicyWordings(insurerId, product.id as string);
      setPolicyWordings(wordingsData.wordings || []);
      setIsWordingUploadDialogOpen(false);
      setEditingWording(null);
      setWordingUploadTitle("");
      setWordingUploadFile(null);
      setWordingUploadActive(true);
    } finally {
      setIsUploadingWording(false);
    }
  };

  // Base Rates save handler
  const handleSaveBaseRates = async () => {
    const insurerId = getInsurerCompanyId();
    const pid = product?.id || '1';
    if (!insurerId || !pid) return;
    
    setIsSavingBaseRates(true);
    try {
      setBaseRatesMastersError(null);
      const byProject = new Map<string, { projectLabel: string; items: { name: string; pricing_type: 'PERCENTAGE' | 'FIXED_AMOUNT'; base_rate: number; currency: '%' | 'AED'; quote_option: 'AUTO_QUOTE' | 'NO_QUOTE' | 'QUOTE_AND_REFER' }[] }>();
      const labelBySlug = new Map<string, string>();
      (projectTypesMasters || []).forEach(p => labelBySlug.set(p.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), p.label));
      ratingConfig.subProjectEntries.forEach(e => {
        const slug = e.projectType;
        const projectLabel = labelBySlug.get(slug) || slug;
        if (!byProject.has(slug)) byProject.set(slug, { projectLabel, items: [] });
        const pricing_type = (String(e.pricingType).toLowerCase() === 'fixed') ? 'FIXED_AMOUNT' : 'PERCENTAGE';
        const currency = pricing_type === 'FIXED_AMOUNT' ? 'AED' : '%';
        const quote_option = (String(e.quoteOption).toLowerCase() === 'no-quote') ? 'NO_QUOTE' : 'AUTO_QUOTE';
        byProject.get(slug)!.items.push({
          name: e.subProjectType,
          pricing_type,
          base_rate: Number(e.baseRate || 0),
          currency,
          quote_option,
        });
      });
      const body = {
        base_rates: Array.from(byProject.values()).map(group => ({
          project_type: group.projectLabel,
          sub_projects: group.items,
        }))
      };
      const hasExisting = Boolean(projectTypesMasters && subProjectTypesMasters && ratingConfig.subProjectEntries.some(e => Number(e.baseRate) !== 0));
      const resp = hasExisting
        ? await updateBaseRates(insurerId, String(pid), body)
        : await saveBaseRates(insurerId, String(pid), body);
      toast({ title: 'Saved', description: resp?.message || 'Base rates saved.' });
    } catch (err: any) {
      const status = err?.status;
      const msg = status === 400 ? 'Invalid data while saving base rates.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while saving base rates.'
        : (err?.message || 'Failed to save base rates.');
      setBaseRatesMastersError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSavingBaseRates(false);
    }
  };

  // Coverage Options fetch handler
  const fetchCoverageOptions = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const pid = product?.id || '1';
    
    if (!insurerId || !pid) {
      setCoverageOptionsError('Unable to determine insurer ID or product ID.');
      return;
    }

    setIsLoadingCoverageOptions(true);
    setCoverageOptionsError(null);
    
    try {
      const data = await getCoverageOptions(insurerId, String(pid));
      setCoverageOptionsData(data);
    } catch (err: any) {
      console.error('Coverage Options fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setCoverageOptionsError(message || 'Bad request while loading coverage options.');
      } else if (status === 401) {
        setCoverageOptionsError('Unauthorized. Please log in again.');
      } else if (status === 403) {
        setCoverageOptionsError("You don't have access to coverage options.");
      } else if (status && status >= 500) {
        setCoverageOptionsError('Server error while loading coverage options.');
      } else {
        setCoverageOptionsError(message || 'Failed to load coverage options.');
      }
    } finally {
      setIsLoadingCoverageOptions(false);
    }
  };

  // Policy Limits fetch handler
  const fetchPolicyLimits = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      setPolicyLimitsError('Unable to determine insurer ID or product ID.');
      return;
    }

    setIsLoadingPolicyLimits(true);
    setPolicyLimitsError(null);
    
    try {
      const data = await getPolicyLimits(insurerId, String(productId));
      setPolicyLimitsData(data);
      console.log('✅ Policy Limits data loaded:', data);
    } catch (err: any) {
      console.error('Policy Limits fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setPolicyLimitsError(message || 'Bad request while loading policy limits.');
      } else if (status === 401) {
        setPolicyLimitsError('Unauthorized. Please log in again.');
      } else if (status === 403) {
        setPolicyLimitsError("You don't have access to policy limits.");
      } else if (status && status >= 500) {
        setPolicyLimitsError('Server error while loading policy limits.');
      } else {
        setPolicyLimitsError(message || 'Failed to load policy limits.');
      }
    } finally {
      setIsLoadingPolicyLimits(false);
    }
  };

  // Clause Metadata fetch handler
  const fetchClauseMetadata = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      setClauseMetadataError('Unable to determine insurer ID or product ID.');
      return;
    }

    setIsLoadingClauseMetadata(true);
    setClauseMetadataError(null);
    
    try {
      const data = await getCewsClauses(insurerId, String(productId));
      setClauseMetadata(data.clauses || []);
      console.log('✅ Clause metadata loaded:', data);
    } catch (err: any) {
      console.error('Clause metadata fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setClauseMetadataError(message || 'Bad request while loading clause metadata.');
      } else if (status === 401) {
        setClauseMetadataError('Unauthorized access to clause metadata.');
      } else if (status === 403) {
        setClauseMetadataError('Forbidden access to clause metadata.');
      } else if (status === 500) {
        setClauseMetadataError('Server error while loading clause metadata.');
      } else {
        setClauseMetadataError(message || 'Failed to load clause metadata.');
      }
    } finally {
      setIsLoadingClauseMetadata(false);
    }
  };

  // Clause Pricing fetch handler
  const fetchClausePricing = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      setClausePricingError('Unable to determine insurer ID or product ID.');
      return;
    }

    setIsLoadingClausePricing(true);
    setClausePricingError(null);
    
    try {
      const data = await getClausePricing(insurerId, String(productId));
      setClausePricingData(data);
      console.log('✅ Clause pricing data loaded:', data);
    } catch (err: any) {
      console.error('Clause pricing fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setClausePricingError(message || 'Bad request while loading clause pricing.');
      } else if (status === 401) {
        setClausePricingError('Unauthorized access to clause pricing.');
      } else if (status === 403) {
        setClausePricingError('Forbidden access to clause pricing.');
      } else if (status === 500) {
        setClausePricingError('Server error while loading clause pricing.');
      } else {
        setClausePricingError(message || 'Failed to load clause pricing.');
      }
    } finally {
      setIsLoadingClausePricing(false);
    }
  };

  // Master Data fetch handlers
  const fetchConstructionTypes = async (): Promise<void> => {
    setIsLoadingConstructionTypes(true);
    setConstructionTypesError(null);
    
    try {
      const data = await listMasterConstructionTypes();
      setConstructionTypesData(data);
      console.log('✅ Construction Types data loaded:', data);
    } catch (err: any) {
      console.error('Construction Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setConstructionTypesError(message || 'Bad request while loading construction types.');
      } else if (status === 401) {
        setConstructionTypesError('Unauthorized access to construction types.');
      } else if (status === 403) {
        setConstructionTypesError('Forbidden access to construction types.');
      } else if (status === 500) {
        setConstructionTypesError('Server error while loading construction types.');
      } else {
        setConstructionTypesError(message || 'Failed to load construction types.');
      }
    } finally {
      setIsLoadingConstructionTypes(false);
    }
  };

  const fetchRoleTypes = async (): Promise<void> => {
    setIsLoadingRoleTypes(true);
    setRoleTypesError(null);
    
    try {
      const data = await listMasterRoleTypes();
      setRoleTypesData(data);
      console.log('✅ Role Types data loaded:', data);
    } catch (err: any) {
      console.error('Role Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setRoleTypesError(message || 'Bad request while loading role types.');
      } else if (status === 401) {
        setRoleTypesError('Unauthorized access to role types.');
      } else if (status === 403) {
        setRoleTypesError('Forbidden access to role types.');
      } else if (status === 500) {
        setRoleTypesError('Server error while loading role types.');
      } else {
        setRoleTypesError(message || 'Failed to load role types.');
      }
    } finally {
      setIsLoadingRoleTypes(false);
    }
  };

  const fetchContractTypes = async (): Promise<void> => {
    setIsLoadingContractTypes(true);
    setContractTypesError(null);
    
    try {
      const data = await listMasterContractTypes();
      setContractTypesData(data);
      console.log('✅ Contract Types data loaded:', data);
    } catch (err: any) {
      console.error('Contract Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setContractTypesError(message || 'Bad request while loading contract types.');
      } else if (status === 401) {
        setContractTypesError('Unauthorized access to contract types.');
      } else if (status === 403) {
        setContractTypesError('Forbidden access to contract types.');
      } else if (status === 500) {
        setContractTypesError('Server error while loading contract types.');
      } else {
        setContractTypesError(message || 'Failed to load contract types.');
      }
    } finally {
      setIsLoadingContractTypes(false);
    }
  };

  const fetchSoilTypes = async (): Promise<void> => {
    setIsLoadingSoilTypes(true);
    setSoilTypesError(null);
    
    try {
      const data = await listMasterSoilTypes();
      setSoilTypesData(data);
      console.log('✅ Soil Types data loaded:', data);
    } catch (err: any) {
      console.error('Soil Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setSoilTypesError(message || 'Bad request while loading soil types.');
      } else if (status === 401) {
        setSoilTypesError('Unauthorized access to soil types.');
      } else if (status === 403) {
        setSoilTypesError('Forbidden access to soil types.');
      } else if (status === 500) {
        setSoilTypesError('Server error while loading soil types.');
      } else {
        setSoilTypesError(message || 'Failed to load soil types.');
      }
    } finally {
      setIsLoadingSoilTypes(false);
    }
  };

  const fetchSubcontractorTypes = async (): Promise<void> => {
    setIsLoadingSubcontractorTypes(true);
    setSubcontractorTypesError(null);
    
    try {
      const data = await listMasterSubcontractorTypes();
      setSubcontractorTypesData(data);
      console.log('✅ Subcontractor Types data loaded:', data);
    } catch (err: any) {
      console.error('Subcontractor Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setSubcontractorTypesError(message || 'Bad request while loading subcontractor types.');
      } else if (status === 401) {
        setSubcontractorTypesError('Unauthorized access to subcontractor types.');
      } else if (status === 403) {
        setSubcontractorTypesError('Forbidden access to subcontractor types.');
      } else if (status === 500) {
        setSubcontractorTypesError('Server error while loading subcontractor types.');
      } else {
        setSubcontractorTypesError(message || 'Failed to load subcontractor types.');
      }
    } finally {
      setIsLoadingSubcontractorTypes(false);
    }
  };

  const fetchConsultantRoles = async (): Promise<void> => {
    setIsLoadingConsultantRoles(true);
    setConsultantRolesError(null);
    
    try {
      const data = await listMasterConsultantRoles();
      setConsultantRolesData(data);
      console.log('✅ Consultant Roles data loaded:', data);
    } catch (err: any) {
      console.error('Consultant Roles fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setConsultantRolesError(message || 'Bad request while loading consultant roles.');
      } else if (status === 401) {
        setConsultantRolesError('Unauthorized access to consultant roles.');
      } else if (status === 403) {
        setConsultantRolesError('Forbidden access to consultant roles.');
      } else if (status === 500) {
        setConsultantRolesError('Server error while loading consultant roles.');
      } else {
        setConsultantRolesError(message || 'Failed to load consultant roles.');
      }
    } finally {
      setIsLoadingConsultantRoles(false);
    }
  };

  const fetchSecurityTypes = async (): Promise<void> => {
    setIsLoadingSecurityTypes(true);
    setSecurityTypesError(null);
    
    try {
      const data = await listMasterSecurityTypes();
      setSecurityTypesData(data);
      console.log('✅ Security Types data loaded:', data);
    } catch (err: any) {
      console.error('Security Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setSecurityTypesError(message || 'Bad request while loading security types.');
      } else if (status === 401) {
        setSecurityTypesError('Unauthorized access to security types.');
      } else if (status === 403) {
        setSecurityTypesError('Forbidden access to security types.');
      } else if (status === 500) {
        setSecurityTypesError('Server error while loading security types.');
      } else {
        setSecurityTypesError(message || 'Failed to load security types.');
      }
    } finally {
      setIsLoadingSecurityTypes(false);
    }
  };

  const fetchAreaTypes = async (): Promise<void> => {
    setIsLoadingAreaTypes(true);
    setAreaTypesError(null);
    
    try {
      const data = await listMasterAreaTypes();
      setAreaTypesData(data);
      console.log('✅ Area Types data loaded:', data);
    } catch (err: any) {
      console.error('Area Types fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setAreaTypesError(message || 'Bad request while loading area types.');
      } else if (status === 401) {
        setAreaTypesError('Unauthorized access to area types.');
      } else if (status === 403) {
        setAreaTypesError('Forbidden access to area types.');
      } else if (status === 500) {
        setAreaTypesError('Server error while loading area types.');
      } else {
        setAreaTypesError(message || 'Failed to load area types.');
      }
    } finally {
      setIsLoadingAreaTypes(false);
    }
  };

  // Quote Config Location Data fetch handlers
  const fetchCountries = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      setCountriesError('Unable to determine insurer ID or product ID.');
      return;
    }

    setIsLoadingCountries(true);
    setCountriesError(null);
    
    try {
      const data = await getQuoteConfigForUI(insurerId, String(productId));
      setCountriesData(data.operating_countries || []);
      console.log('✅ Countries data loaded:', data.operating_countries);
    } catch (err: any) {
      console.error('Countries fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setCountriesError(message || 'Bad request while loading countries.');
      } else if (status === 401) {
        setCountriesError('Unauthorized access to countries.');
      } else if (status === 403) {
        setCountriesError('Forbidden access to countries.');
      } else if (status === 500) {
        setCountriesError('Server error while loading countries.');
      } else {
        setCountriesError(message || 'Failed to load countries.');
      }
    } finally {
      setIsLoadingCountries(false);
    }
  };

  const fetchRegions = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      setRegionsError('Unable to determine insurer ID or product ID.');
      return;
    }

    setIsLoadingRegions(true);
    setRegionsError(null);
    
    try {
      const data = await getQuoteConfigForUI(insurerId, String(productId));
      setRegionsData(data.operating_regions || []);
      console.log('✅ Regions data loaded:', data.operating_regions);
    } catch (err: any) {
      console.error('Regions fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setRegionsError(message || 'Bad request while loading regions.');
      } else if (status === 401) {
        setRegionsError('Unauthorized access to regions.');
      } else if (status === 403) {
        setRegionsError('Forbidden access to regions.');
      } else if (status === 500) {
        setRegionsError('Server error while loading regions.');
      } else {
        setRegionsError(message || 'Failed to load regions.');
      }
    } finally {
      setIsLoadingRegions(false);
    }
  };

  const fetchZones = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      setZonesError('Unable to determine insurer ID or product ID.');
      return;
    }

    setIsLoadingZones(true);
    setZonesError(null);
    
    try {
      const data = await getQuoteConfigForUI(insurerId, String(productId));
      setZonesData(data.operating_zones || []);
      console.log('✅ Zones data loaded:', data.operating_zones);
    } catch (err: any) {
      console.error('Zones fetch error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        setZonesError(message || 'Bad request while loading zones.');
      } else if (status === 401) {
        setZonesError('Unauthorized access to zones.');
      } else if (status === 403) {
        setZonesError('Forbidden access to zones.');
      } else if (status === 500) {
        setZonesError('Server error while loading zones.');
      } else {
        setZonesError(message || 'Failed to load zones.');
      }
    } finally {
      setIsLoadingZones(false);
    }
  };

  // Save Clause Pricing handler with POST/PATCH logic
  const handleSaveClausePricing = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      toast({ 
        title: 'Error', 
        description: 'Missing insurer ID or product ID', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSavingClausePricing(true);
    
    try {
      // Collect clause pricing data from UI state (this will be implemented in MasterDataTabs)
      const clausePricingPayload: SaveClausePricingRequest = {
        clause_pricing: [] // This will be populated from the UI state
      };

      let response;
      
      // Check if we have existing data (GET was successful)
      if (clausePricingData && clausePricingData.clause_pricing && clausePricingData.clause_pricing.length > 0) {
        console.log('📝 Updating existing clause pricing data...');
        const updatePayload: UpdateClausePricingRequest = {
          clause_pricing: clausePricingPayload.clause_pricing
        };
        
        const patchResponse = await updateClausePricing(insurerId, String(productId), updatePayload);
        response = (patchResponse as any).data || patchResponse;
        
        toast({
          title: 'Success',
          description: 'Clause pricing configuration updated successfully',
        });
      } else {
        console.log('📝 Creating new clause pricing data...');
        const postResponse = await saveClausePricing(insurerId, String(productId), clausePricingPayload);
        response = postResponse.clause_pricing || postResponse;
        
        toast({
          title: 'Success', 
          description: 'Clause pricing configuration saved successfully',
        });
      }

      // Update local state with response
      if (response) {
        setClausePricingData({ clause_pricing: Array.isArray(response) ? response : response.clause_pricing || [] });
        console.log('✅ Clause pricing saved successfully:', response);
      }

    } catch (err: any) {
      console.error('Save Clause Pricing error:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      if (status === 400) {
        toast({ title: 'Error', description: message || 'Bad request while saving clause pricing.', variant: 'destructive' });
      } else if (status === 401) {
        toast({ title: 'Error', description: 'Unauthorized access.', variant: 'destructive' });
      } else if (status === 403) {
        toast({ title: 'Error', description: 'Forbidden access.', variant: 'destructive' });
      } else if (status === 500) {
        toast({ title: 'Error', description: 'Server error while saving clause pricing.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: message || 'Failed to save clause pricing.', variant: 'destructive' });
      }
    } finally {
      setIsSavingClausePricing(false);
    }
  };

  // Save Policy Limits handler with POST/PATCH logic
  const handleSavePolicyLimits = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      toast({ 
        title: 'Error', 
        description: 'Missing insurer ID or product ID', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSavingPolicyLimits(true);
    
    try {
      // Check if we already have data from the GET API call
      const hasExistingData = policyLimitsData !== null;
      
      if (hasExistingData) {
        console.log('📝 Existing policy limits data found, using PATCH API');
        
        // Collect data from UI for PATCH (matches exact specification format)
        const updateData: UpdatePolicyLimitsRequest = {
          policy_limits_and_deductible: {
            policy_limits: {
              minimum_premium: {
                pricing_type: 'FIXED_AMOUNT',
                value: ratingConfig.limits?.minimumPremium || 0
              },
              maximum_cover: {
                pricing_type: 'FIXED_AMOUNT',
                value: ratingConfig.limits?.maximumCover || 0
              },
              base_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.baseBrokerCommission || 0
              },
              minimum_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.minimumBrokerCommission || 0
              },
              maximum_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.maximumBrokerCommission || 0
              }
            },
            sub_limits: ratingConfig.coverRequirements?.subLimits?.map((entry: any) => ({
              title: entry.title || '',
              description: entry.description || '',
              pricing_type: (
                entry.pricingType === 'fixed' ? 'FIXED_AMOUNT' :
                entry.pricingType === 'percentage_sum_insured' ? 'PERCENTAGE_OF_SUM_INSURED' :
                entry.pricingType === 'percentage_loss' ? 'PERCENTAGE_OF_LOSS' : 'FIXED_AMOUNT'
              ) as 'PERCENTAGE_OF_SUM_INSURED' | 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS',
              value: entry.value || 0
            })) || [],
            deductibles: ratingConfig.coverRequirements?.deductibles?.map((entry: any) => ({
              type: (
                entry.deductibleType === 'fixed' ? 'FIXED_AMOUNT' :
                entry.deductibleType === 'percentage_loss' ? 'PERCENTAGE_OF_LOSS' :
                entry.deductibleType === 'percentage_sum_insured' ? 'PERCENTAGE_OF_SUM_INSURED' : 'FIXED_AMOUNT'
              ) as 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS' | 'PERCENTAGE_OF_SUM_INSURED',
              value: entry.value || 0,
              loading_discount: entry.loadingDiscount || 0,
              quote_option: (entry.quoteOption === 'quote' ? 'AUTO_QUOTE' : 'MANUAL_QUOTE') as 'AUTO_QUOTE' | 'MANUAL_QUOTE'
            })) || []
          }
        };

        console.log('📤 Calling PATCH API with data:', updateData);
        const patchResponse = await updatePolicyLimits(insurerId, String(productId), updateData);
        console.log('📥 PATCH API response:', patchResponse);
        
        // Update local state with PATCH response (response.data format)
        if (patchResponse?.data) {
          const responseData = patchResponse.data;
          setPolicyLimitsData({
            policy_limits: responseData.policy_limits,
            sub_limits: responseData.sub_limits || [],
            deductibles: responseData.deductibles || []
          });
        }
        
      } else {
        console.log('📝 No existing policy limits data, using POST API');
        
        // Collect data from UI for POST (with currency in nested objects)
        const postData: SavePolicyLimitsRequest = {
          policy_limits_and_deductible: {
            policy_limits: {
              minimum_premium: {
                pricing_type: 'FIXED_AMOUNT',
                value: ratingConfig.limits?.minimumPremium || 0
              },
              maximum_cover: {
                pricing_type: 'FIXED_AMOUNT',
                value: ratingConfig.limits?.maximumCover || 0
              },
              base_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.baseBrokerCommission || 0
              },
              minimum_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.minimumBrokerCommission || 0
              },
              maximum_broker_commission: {
                pricing_type: 'PERCENTAGE',
                value: ratingConfig.limits?.maximumBrokerCommission || 0
              }
            },
            sub_limits: ratingConfig.coverRequirements?.subLimits?.map((entry: any) => ({
              title: entry.title || '',
              description: entry.description || '',
              pricing_type: (
                entry.pricingType === 'fixed' ? 'FIXED_AMOUNT' :
                entry.pricingType === 'percentage_sum_insured' ? 'PERCENTAGE_OF_SUM_INSURED' :
                entry.pricingType === 'percentage_loss' ? 'PERCENTAGE_OF_LOSS' : 'FIXED_AMOUNT'
              ) as 'PERCENTAGE_OF_SUM_INSURED' | 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS',
              value: entry.value || 0
            })) || [],
            deductibles: ratingConfig.coverRequirements?.deductibles?.map((entry: any) => ({
              type: (
                entry.deductibleType === 'fixed' ? 'FIXED_AMOUNT' :
                entry.deductibleType === 'percentage_loss' ? 'PERCENTAGE_OF_LOSS' :
                entry.deductibleType === 'percentage_sum_insured' ? 'PERCENTAGE_OF_SUM_INSURED' : 'FIXED_AMOUNT'
              ) as 'FIXED_AMOUNT' | 'PERCENTAGE_OF_LOSS' | 'PERCENTAGE_OF_SUM_INSURED',
              value: entry.value || 0,
              loading_discount: entry.loadingDiscount || 0,
              quote_option: (entry.quoteOption === 'quote' ? 'AUTO_QUOTE' : 'MANUAL_QUOTE') as 'AUTO_QUOTE' | 'MANUAL_QUOTE'
            })) || []
          }
        };

        console.log('📤 Calling POST API with data:', postData);
        const postResponse = await savePolicyLimits(insurerId, String(productId), postData);
        console.log('📥 POST API response:', postResponse);
        
        // Update local state with POST response
        if (postResponse?.policy_limits_and_deductible) {
          const responseData = postResponse.policy_limits_and_deductible;
          setPolicyLimitsData({
            policy_limits: responseData.policy_limits,
            sub_limits: responseData.sub_limits || [],
            deductibles: responseData.deductibles || []
          });
        }
      }
      
      toast({ 
        title: 'Success', 
        description: 'Policy limits and deductibles saved successfully!', 
        variant: 'default' 
      });
      
    } catch (error: any) {
      console.error('Save Policy Limits error:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        stack: error?.stack
      });
      
      const status = error?.status;
      const message = status === 400 ? 'Invalid data while saving policy limits.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while saving policy limits.'
        : (error?.message || 'Failed to save policy limits.');
      
      toast({ 
        title: 'Error', 
        description: message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSavingPolicyLimits(false);
    }
  };

  // Save Coverage Options handler with GET-then-POST/PATCH logic
  const handleSaveCoverageOptions = async (): Promise<void> => {
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      toast({ 
        title: 'Error', 
        description: 'Missing insurer ID or product ID', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSavingCoverageOptions(true);
    
    try {
      // Check if data already exists by trying to fetch first
      let hasExistingData = false;
      let existingData = null;
      
      try {
        existingData = await getCoverageOptions(insurerId, String(productId));
        hasExistingData = true;
        console.log('✅ Existing coverage options found, will use PATCH');
      } catch (error: any) {
        // If 404 or no data, proceed with POST
        hasExistingData = false;
        console.log('📝 No existing coverage options found, will use POST');
      }

      // Helper function to map UI data to API format
      const mapUIDataToAPI = () => {
        const sumInsuredLoadings = ratingConfig.coverRequirements?.sumInsured?.map(entry => ({
          from_amount: entry.from || 0,
          to_amount: entry.to || 0,
          pricing_type: (entry.pricingType?.toUpperCase() || 'PERCENTAGE') as 'PERCENTAGE' | 'AMOUNT',
          loading_discount: entry.loadingDiscount || 0,
          quote_option: (entry.quoteOption === 'quote' ? 'AUTO_QUOTE' : 'MANUAL_QUOTE') as 'AUTO_QUOTE' | 'MANUAL_QUOTE'
        })) || [];

        const projectValueLoadings = ratingConfig.coverRequirements?.projectValue?.map(entry => ({
          from_amount: entry.from || 0,
          to_amount: entry.to || 0,
          pricing_type: (entry.pricingType?.toUpperCase() || 'PERCENTAGE') as 'PERCENTAGE' | 'AMOUNT',
          loading_discount: entry.loadingDiscount || 0,
          quote_option: (entry.quoteOption === 'quote' ? 'AUTO_QUOTE' : 'MANUAL_QUOTE') as 'AUTO_QUOTE' | 'MANUAL_QUOTE'
        })) || [];

        const contractWorksLoadings = ratingConfig.coverRequirements?.contractWorks?.map(entry => ({
          from_amount: entry.from || 0,
          to_amount: entry.to || 0,
          pricing_type: (entry.pricingType?.toUpperCase() || 'PERCENTAGE') as 'PERCENTAGE' | 'AMOUNT',
          loading_discount: entry.loadingDiscount || 0,
          quote_option: (entry.quoteOption === 'quote' ? 'AUTO_QUOTE' : 'MANUAL_QUOTE') as 'AUTO_QUOTE' | 'MANUAL_QUOTE'
        })) || [];

        const plantEquipmentLoadings = ratingConfig.coverRequirements?.plantEquipment?.map(entry => ({
          from_amount: entry.from || 0,
          to_amount: entry.to || 0,
          pricing_type: (entry.pricingType?.toUpperCase() || 'PERCENTAGE') as 'PERCENTAGE' | 'AMOUNT',
          loading_discount: entry.loadingDiscount || 0,
          quote_option: (entry.quoteOption === 'quote' ? 'AUTO_QUOTE' : 'MANUAL_QUOTE') as 'AUTO_QUOTE' | 'MANUAL_QUOTE'
        })) || [];

        const crossLiabilityCover = [
          {
            cover_option: 'Yes (Included)',
            pricing_type: 'PERCENTAGE' as 'PERCENTAGE' | 'AMOUNT',
            loading_discount: ratingConfig.coverRequirements?.crossLiabilityCover?.yes || 0,
            quote_option: 'AUTO_QUOTE' as 'AUTO_QUOTE' | 'MANUAL_QUOTE'
          },
          {
            cover_option: 'No (Not Included)',
            pricing_type: 'PERCENTAGE' as 'PERCENTAGE' | 'AMOUNT',
            loading_discount: ratingConfig.coverRequirements?.crossLiabilityCover?.no || 0,
            quote_option: 'AUTO_QUOTE' as 'AUTO_QUOTE' | 'MANUAL_QUOTE'
          }
        ];

        return {
          sumInsuredLoadings,
          projectValueLoadings,
          contractWorksLoadings,
          plantEquipmentLoadings,
          crossLiabilityCover
        };
      };

      const mappedData = mapUIDataToAPI();

      if (hasExistingData) {
        // Use PATCH to update existing data
        const updateData: UpdateCoverageOptionsRequest = {
        insurer_id: Number(insurerId),
          coverage_options: {
            sum_insured_loadings: mappedData.sumInsuredLoadings,
            project_value_loadings: mappedData.projectValueLoadings,
            contract_works_loadings: mappedData.contractWorksLoadings,
            plant_equipment_loadings: mappedData.plantEquipmentLoadings,
            cross_liability_cover: mappedData.crossLiabilityCover
          }
        };

        console.log('🔄 Calling PATCH API with data:', updateData);
        const response = await updateCoverageOptions(insurerId, String(productId), updateData);
        
        toast({ 
          title: 'Success', 
          description: 'Coverage options updated successfully!', 
          variant: 'default' 
        });
        
        // Update local state with response data
        setCoverageOptionsData({
          sum_insured_loadings: response.data.sum_insured_loadings,
          project_value_loadings: response.data.project_value_loadings,
          contract_works_loadings: response.data.contract_works_loadings || [],
          plant_equipment_loadings: response.data.plant_equipment_loadings || [],
          cross_liability_cover: response.data.cross_liability_cover || []
        });
        
      } else {
        // Use POST to create new data
        const createData: SaveCoverageOptionsRequest = {
          coverage_options: {
            sum_insured_loadings: mappedData.sumInsuredLoadings.map(item => ({ ...item, currency: 'AED' })),
            project_value_loadings: mappedData.projectValueLoadings.map(item => ({ ...item, currency: 'AED' })),
            contract_works_loadings: mappedData.contractWorksLoadings.map(item => ({ ...item, currency: 'AED' })),
            plant_equipment_loadings: mappedData.plantEquipmentLoadings.map(item => ({ ...item, currency: 'AED' })),
            cross_liability_cover: mappedData.crossLiabilityCover
          }
        };

        console.log('➕ Calling POST API with data:', createData);
        const response = await saveCoverageOptions(insurerId, String(productId), createData);
        
        toast({ 
          title: 'Success', 
          description: 'Coverage options created successfully!', 
          variant: 'default' 
        });
        
        // Update local state with response
        setCoverageOptionsData(response.coverage_options);
      }
      
    } catch (error: any) {
      console.error('Save Coverage Options error:', error);
      const status = error?.status;
      const message = status === 400 ? 'Invalid data while saving coverage options.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while saving coverage options.'
        : (error?.message || 'Failed to save coverage options.');
      
      toast({ 
        title: 'Error', 
        description: message, 
        variant: 'destructive' 
      });
    } finally {
      setIsSavingCoverageOptions(false);
    }
  };




  // Fetch Construction Types Configuration after metadata loads
  const fetchConstructionTypesConfig = async (): Promise<void> => {
    console.log('🚀 fetchConstructionTypesConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    console.log('🔍 IDs check:', { insurerId, productId });
    
    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setConstructionTypesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingConstructionTypesConfig(true);
    setConstructionTypesConfigError(null);
    
    try {
      console.log('🔍 Fetching Construction Types Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getConstructionTypesConfiguration(insurerId, String(productId));
      
      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));
      
      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setConstructionTypesConfigData(response.items);
        console.log('✅ Construction Types Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items
        });
        setConstructionTypesConfigData([]);
        console.log('ℹ️ No existing Construction Types Configuration found');
      }
    } catch (err: any) {
      console.error('❌ Error loading Construction Types Configuration:', err);
      setConstructionTypesConfigError(err.message || 'Failed to load construction types configuration');
      setConstructionTypesConfigData([]);
    } finally {
      setIsLoadingConstructionTypesConfig(false);
    }
  };

  // Fetch Countries Configuration after metadata loads
  const fetchCountriesConfig = async (): Promise<void> => {
    console.log('🚀 fetchCountriesConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    console.log('🔍 IDs check:', { insurerId, productId });
    
    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setCountriesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingCountriesConfig(true);
    setCountriesConfigError(null);
    
    try {
      console.log('🔍 Fetching Countries Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getCountriesConfiguration(insurerId, String(productId));
      
      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));
      
      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setCountriesConfigData(response.items);
        console.log('✅ Countries Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items
        });
        setCountriesConfigData([]);
        console.log('ℹ️ No existing Countries Configuration found');
      }
    } catch (err: any) {
      console.error('❌ Error loading Countries Configuration:', err);
      const status = err?.status;
      const msg = status === 400 ? 'Bad request while loading countries configuration.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while loading countries configuration.'
        : 'Failed to load countries configuration.';
      setCountriesConfigError(msg);
      setCountriesConfigData([]);
    } finally {
      setIsLoadingCountriesConfig(false);
    }
  };

  // Fetch Regions Configuration after metadata loads
  const fetchRegionsConfig = async (): Promise<void> => {
    console.log('🚀 fetchRegionsConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    console.log('🔍 IDs check:', { insurerId, productId });
    
    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setRegionsConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingRegionsConfig(true);
    setRegionsConfigError(null);
    
    try {
      console.log('🔍 Fetching Regions Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getRegionsConfiguration(insurerId, String(productId));
      
      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));
      
      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setRegionsConfigData(response.items);
        console.log('✅ Regions Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items
        });
        setRegionsConfigData([]);
        console.log('ℹ️ No existing Regions Configuration found');
      }
    } catch (err: any) {
      console.error('❌ Error loading Regions Configuration:', err);
      const status = err?.status;
      const msg = status === 400 ? 'Bad request while loading regions configuration.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while loading regions configuration.'
        : 'Failed to load regions configuration.';
      setRegionsConfigError(msg);
      setRegionsConfigData([]);
    } finally {
      setIsLoadingRegionsConfig(false);
    }
  };

  // Fetch Zones Configuration after metadata loads
  const fetchZonesConfig = async (): Promise<void> => {
    console.log('🚀 fetchZonesConfig called');
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    console.log('🔍 IDs check:', { insurerId, productId });
    
    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      setZonesConfigError('Unable to determine insurer ID or product ID.');
      return;
    }

    console.log('✅ IDs validated, starting API call...');
    setIsLoadingZonesConfig(true);
    setZonesConfigError(null);
    
    try {
      console.log('🔍 Fetching Zones Configuration...');
      console.log('📡 API Call Parameters:', { insurerId, productId });
      const response = await getZonesConfiguration(insurerId, String(productId));
      
      console.log('🔍 Full API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response items:', response.items);
      console.log('🔍 Items length:', response.items?.length);
      console.log('🔍 Raw response JSON:', JSON.stringify(response, null, 2));
      
      if (response.items?.length > 0) {
        console.log('✅ Found items, setting state...');
        setZonesConfigData(response.items);
        console.log('✅ Zones Configuration loaded:', response.items);
        console.log('✅ Setting state with data:', response.items);
      } else {
        console.log('❌ No items found or empty array');
        console.log('❌ Condition check:', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          itemsArray: response.items
        });
        setZonesConfigData([]);
        console.log('ℹ️ No existing Zones Configuration found');
      }
    } catch (err: any) {
      console.error('❌ Error loading Zones Configuration:', err);
      const status = err?.status;
      const msg = status === 400 ? 'Bad request while loading zones configuration.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while loading zones configuration.'
        : 'Failed to load zones configuration.';
      setZonesConfigError(msg);
      setZonesConfigData([]);
    } finally {
      setIsLoadingZonesConfig(false);
    }
  };

  // Save Zones Configuration handler with GET-then-POST/PATCH logic
  const handleSaveZonesConfiguration = async (formData: {[key: string]: any}): Promise<void> => {
    console.log('🎯 === SAVE ZONES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);

    const insurerId = getInsurerCompanyId();
    const productId = product?.id;

    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: "Error",
        description: "Unable to determine insurer ID or product ID.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ IDs validated:', { insurerId, productId });
    setIsSavingZonesConfig(true);

    try {
      // Build request payload from form data
      const items = Object.entries(formData).map(([zoneName, zoneFormData], index) => {
        console.log(`📝 Processing zone "${zoneName}":`, zoneFormData);
        
        const item = {
          name: zoneName,
          pricing_type: (zoneFormData.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED_RATE',
          value: Number(zoneFormData.value || 0),
          quote_option: (zoneFormData.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE') as 'AUTO_QUOTE' | 'NO_QUOTE',
          display_order: index + 1,
          is_active: true
        };
        
        console.log(`✅ Mapped item for "${zoneName}":`, item);
        return item;
      });

      const requestPayload: SaveZonesConfigRequest = {
        zones_config: {
          items
        }
      };

      console.log('🔍 Final request payload:', JSON.stringify(requestPayload, null, 2));

      // Determine if this is a POST or PATCH based on existing data
      const hasExistingData = zonesConfigData && zonesConfigData.length > 0;
      console.log('🔍 Has existing data?', hasExistingData);
      console.log('🔍 Existing data:', zonesConfigData);

      let response: SaveZonesConfigResponse;
      
      if (hasExistingData) {
        console.log('🔄 Calling PATCH API (update existing)...');
        response = await updateZonesConfiguration(insurerId, String(productId), requestPayload);
        console.log('✅ PATCH Response:', response);
        
        toast({
          title: "Success",
          description: "Zones configuration updated successfully!",
          variant: "default",
        });
      } else {
        console.log('🆕 Calling POST API (create new)...');
        response = await createZonesConfiguration(insurerId, String(productId), requestPayload);
        console.log('✅ POST Response:', response);
        
        toast({
          title: "Success", 
          description: "Zones configuration created successfully!",
          variant: "default",
        });
      }

      // Update state with response data
      if (response.data?.items) {
        console.log('🔄 Updating zones config data with response...');
        setZonesConfigData(response.data.items);
        console.log('✅ State updated with:', response.data.items);
      }

    } catch (err: any) {
      console.error('❌ Error saving Zones Configuration:', err);
      const status = err?.status;
      const msg = status === 400 ? 'Bad request while saving zones configuration.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while saving zones configuration.'
        : 'Failed to save zones configuration.';
      
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSavingZonesConfig(false);
      console.log('🎯 === SAVE ZONES CONFIGURATION COMPLETED ===');
    }
  };

  // Save Regions Configuration handler with GET-then-POST/PATCH logic
  const handleSaveRegionsConfiguration = async (formData: {[key: string]: any}): Promise<void> => {
    console.log('🎯 === SAVE REGIONS CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);
    
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingRegionsConfig(true);
    
    try {
      // Build request payload from form data
      const items: SaveRegionsConfigRequest['regions_config']['items'] = [];
      
      // Get the regions metadata to know which regions to include
      console.log('🔍 Building payload from form data and regions metadata...');
      console.log('🔍 Regions data:', regionsData);
      console.log('🔍 Form data:', formData);
      
      regionsData.forEach((regionName: string, index: number) => {
        const regionFormData = formData[regionName];
        console.log(`🔍 Processing region "${regionName}":`, regionFormData);
        
        if (regionFormData) {
          const item = {
            name: regionName,
            pricing_type: (regionFormData.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE') as 'PERCENTAGE' | 'FIXED_RATE',
            value: Number(regionFormData.value || 0),
            quote_option: (regionFormData.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE') as 'AUTO_QUOTE' | 'NO_QUOTE',
            display_order: index + 1,
            is_active: true
          };
          
          items.push(item);
          console.log(`✅ Added item for "${regionName}":`, item);
        } else {
          console.log(`⚠️ No form data found for "${regionName}", using defaults`);
          // Add default values for regions without form data
          const item = {
            name: regionName,
            pricing_type: 'PERCENTAGE' as const,
            value: 1,
            quote_option: 'AUTO_QUOTE' as const,
            display_order: index + 1,
            is_active: true
          };
          
          items.push(item);
        }
      });

      const requestPayload: SaveRegionsConfigRequest = {
        regions_config: {
          items: items
        }
      };

      console.log('🔍 Request payload:', requestPayload);
      
      // Determine if we should POST or PATCH based on existing data
      const hasExistingData = regionsConfigData && regionsConfigData.length > 0;
      console.log('🔍 Has existing data:', hasExistingData);
      
      let response: SaveRegionsConfigResponse;
      if (hasExistingData) {
        console.log('📡 Calling PATCH API...');
        response = await updateRegionsConfiguration(insurerId, String(productId), requestPayload);
      } else {
        console.log('📡 Calling POST API...');
        response = await createRegionsConfiguration(insurerId, String(productId), requestPayload);
      }

      console.log('✅ API Response:', response);
      
      // Update the config data with the response
      if (response.data?.items) {
        setRegionsConfigData(response.data.items);
      }

      toast({
        title: 'Success',
        description: response.message || 'Regions configuration saved successfully.'
      });

      console.log('🎯 === SAVE REGIONS CONFIGURATION COMPLETED ===');
    } catch (err: any) {
      console.error('❌ Error saving Regions Configuration:', err);
      const status = err?.status;
      const msg = status === 400 ? 'Invalid data while saving regions configuration.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while saving regions configuration.'
        : (err?.message || 'Failed to save regions configuration.');
      
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setIsSavingRegionsConfig(false);
    }
  };

  // Save Countries Configuration handler with GET-then-POST/PATCH logic
  const handleSaveCountriesConfiguration = async (formData: {[key: string]: any}): Promise<void> => {
    console.log('🎯 === SAVE COUNTRIES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);
    
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      console.error('❌ Missing IDs:', { insurerId, productId });
      toast({
        title: 'Error',
        description: 'Unable to determine insurer ID or product ID.',
        variant: 'destructive'
      });
      return;
    }

    setIsSavingCountriesConfig(true);
    
    try {
      // Build request payload from form data
      const items: SaveCountriesConfigRequest['countries_config']['items'] = [];
      
      // Get the countries metadata to know which countries to include
      console.log('🔍 Building payload from form data and countries metadata...');
      console.log('🔍 Countries data:', countriesData);
      console.log('🔍 Form data:', formData);
      
      countriesData.forEach((countryName: string) => {
        const countryFormData = formData[countryName];
        console.log(`🔍 Processing country "${countryName}":`, countryFormData);
        
        if (countryFormData) {
          // Check if this country uses 'name' field (like Kuwait) or 'country' field
          const isKuwait = countryName === 'Kuwait';
          
          const item: any = {
            pricing_type: countryFormData.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE',
            value: Number(countryFormData.value || 0),
            quote_option: countryFormData.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE'
          };
          
          // Add the appropriate field based on country
          if (isKuwait) {
            item.name = countryName;
          } else {
            item.country = countryName;
          }
          
          items.push(item);
          console.log(`✅ Added item for "${countryName}":`, item);
        } else {
          console.log(`⚠️ No form data found for "${countryName}", using defaults`);
          // Add default values for countries without form data
          const isKuwait = countryName === 'Kuwait';
          const item: any = {
            pricing_type: 'PERCENTAGE',
            value: 1,
            quote_option: 'AUTO_QUOTE'
          };
          
          if (isKuwait) {
            item.name = countryName;
          } else {
            item.country = countryName;
          }
          
          items.push(item);
        }
      });

      const requestPayload: SaveCountriesConfigRequest = {
        countries_config: {
          items: items
        }
      };

      console.log('🔍 Request payload:', requestPayload);
      
      // Determine if we should POST or PATCH based on existing data
      const hasExistingData = countriesConfigData && countriesConfigData.length > 0;
      console.log('🔍 Has existing data:', hasExistingData);
      
      let response: SaveCountriesConfigResponse;
      if (hasExistingData) {
        console.log('📡 Calling PATCH API...');
        response = await updateCountriesConfiguration(insurerId, String(productId), requestPayload);
      } else {
        console.log('📡 Calling POST API...');
        response = await createCountriesConfiguration(insurerId, String(productId), requestPayload);
      }

      console.log('✅ API Response:', response);
      
      // Update the config data with the response
      if (response.data?.items) {
        setCountriesConfigData(response.data.items);
      }

      toast({
        title: 'Success',
        description: response.message || 'Countries configuration saved successfully.'
      });

      console.log('🎯 === SAVE COUNTRIES CONFIGURATION COMPLETED ===');
    } catch (err: any) {
      console.error('❌ Error saving Countries Configuration:', err);
      const status = err?.status;
      const msg = status === 400 ? 'Invalid data while saving countries configuration.'
        : status === 401 ? 'Unauthorized. Please log in again.'
        : status === 403 ? 'Forbidden. You do not have access.'
        : status >= 500 ? 'Server error while saving countries configuration.'
        : (err?.message || 'Failed to save countries configuration.');
      
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setIsSavingCountriesConfig(false);
    }
  };

  // Save Construction Types Configuration handler with GET-then-POST/PATCH logic
  const handleSaveConstructionTypesConfiguration = async (formData: {[key: string]: any}): Promise<void> => {
    console.log('🎯 === SAVE CONSTRUCTION TYPES CONFIGURATION STARTED ===');
    console.log('🔍 Form data received:', formData);
    
    const insurerId = getInsurerCompanyId();
    const productId = product?.id;
    
    if (!insurerId || !productId) {
      toast({
        title: "Error",
        description: "Unable to determine insurer ID or product ID.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingConstructionTypesConfig(true);
    
    try {
      // Build the request payload from form data
      const items: ConstructionTypeConfigItem[] = [];
      let displayOrder = 1;
      
      // Convert form data to API format
      Object.entries(formData).forEach(([name, data]: [string, any]) => {
        if (data && typeof data === 'object') {
          items.push({
            name: name,
            pricing_type: data.pricingType === 'fixed' ? 'FIXED_RATE' : 'PERCENTAGE',
            value: parseFloat(data.value) || 0,
            quote_option: data.quoteOption === 'no-quote' ? 'NO_QUOTE' : 'AUTO_QUOTE',
            display_order: displayOrder++,
            is_active: true
          });
        }
      });
      
      const requestPayload: SaveConstructionTypesConfigRequest = {
        construction_types_config: {
          items: items
        }
      };
      
      console.log('🔍 Request payload:', requestPayload);
      
      // Determine if we should POST or PATCH based on existing data
      const hasExistingData = constructionTypesConfigData && constructionTypesConfigData.length > 0;
      console.log('🔍 Has existing data:', hasExistingData);
      
      let response: SaveConstructionTypesConfigResponse;
      
      if (hasExistingData) {
        console.log('🔄 Updating existing configuration (PATCH)...');
        response = await updateConstructionTypesConfiguration(insurerId, String(productId), requestPayload);
      } else {
        console.log('🆕 Creating new configuration (POST)...');
        response = await createConstructionTypesConfiguration(insurerId, String(productId), requestPayload);
      }
      
      console.log('✅ Save successful:', response);
      
      // Update local state with the response
      if (response.data?.items) {
        setConstructionTypesConfigData(response.data.items);
      }
      
      toast({
        title: "Success",
        description: response.message || "Construction types configuration saved successfully.",
      });
      
    } catch (err: any) {
      console.error('❌ Save failed:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to save construction types configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSavingConstructionTypesConfig(false);
    }
  };

  // Save Quote Coverage handler with POST/PATCH logic and strict validation
  const handleSaveQuoteCoverage = async (): Promise<void> => {
    console.log('🎯 === SAVE QUOTE COVERAGE STARTED ===');
    
    try {
      // Step 1: Validate required data
      const insurerId = getInsurerCompanyId();
      const productId = product?.id;

      console.log('🔍 Validation Check:', { insurerId, productId });

      if (!insurerId) {
        console.error('❌ Missing insurer ID');
        toast({
          title: 'Error',
          description: 'Unable to determine insurer ID. Please log in again.',
          variant: 'destructive'
        });
        return;
      }

      if (!productId) {
        console.error('❌ Missing product ID');
        toast({
          title: 'Error', 
          description: 'Unable to determine product ID. Please refresh the page.',
          variant: 'destructive'
        });
        return;
      }

      // Step 2: Set loading state
      console.log('⏳ Setting loading state to TRUE...');
      setIsSavingQuoteConfig(true);

      // Step 3: Extract form values and checkbox selections from UI state
      console.log('📋 Extracting form values and checkbox selections...');
      console.log('🔍 Current quoteConfig.details:', quoteConfig.details);
      
      const validityDays = Number(quoteConfig.details.validityDays || 30);
      const backdateDays = Number(quoteConfig.details.backdateWindow || 0);
      
      const selectedCountries = Array.isArray(quoteConfig.details.countries) ? quoteConfig.details.countries : [];
      const selectedRegions = Array.isArray(quoteConfig.details.regions) ? quoteConfig.details.regions : [];
      const selectedZones = Array.isArray(quoteConfig.details.zones) ? quoteConfig.details.zones : [];

      console.log('🔍 Raw Form Values:', {
        validityDays,
        backdateDays,
        selectedCountries,
        selectedRegions,
        selectedZones
      });

      // Step 4: Clean and validate checkbox data
      const cleanCountries = selectedCountries.filter(country => 
        typeof country === 'string' && country.trim().length > 0
      );
      const cleanRegions = selectedRegions.filter(region => 
        typeof region === 'string' && region.trim().length > 0
      );
      const cleanZones = selectedZones.filter(zone => 
        typeof zone === 'string' && zone.trim().length > 0
      );

      console.log('🧹 Cleaned Checkbox Data:', {
        cleanCountries,
        cleanRegions,
        cleanZones
      });

      // Step 5: STRICT CROSS-CONTAMINATION CHECKS
      console.log('🔒 Performing cross-contamination validation...');
      
      // Check if any regions are in countries array
      const regionsInCountries = cleanCountries.filter(country => cleanRegions.includes(country));
      
      // Check if any zones are in countries array
      const zonesInCountries = cleanCountries.filter(country => cleanZones.includes(country));
      
      // Check if any zones are in regions array
      const zonesInRegions = cleanRegions.filter(region => cleanZones.includes(region));

      if (regionsInCountries.length > 0) {
        console.error('❌ CROSS-CONTAMINATION DETECTED: Regions found in countries array:', regionsInCountries);
        toast({
          title: 'Validation Error',
          description: `Cross-contamination detected: ${regionsInCountries.join(', ')} should not be in countries. Please check your selections.`,
          variant: 'destructive'
        });
        return;
      }

      if (zonesInCountries.length > 0) {
        console.error('❌ CROSS-CONTAMINATION DETECTED: Zones found in countries array:', zonesInCountries);
        toast({
          title: 'Validation Error',
          description: `Cross-contamination detected: ${zonesInCountries.join(', ')} should not be in countries. Please check your selections.`,
          variant: 'destructive'
        });
        return;
      }

      if (zonesInRegions.length > 0) {
        console.error('❌ CROSS-CONTAMINATION DETECTED: Zones found in regions array:', zonesInRegions);
        toast({
          title: 'Validation Error',
          description: `Cross-contamination detected: ${zonesInRegions.join(', ')} should not be in regions. Please check your selections.`,
          variant: 'destructive'
        });
        return;
      }

      console.log('✅ Cross-contamination validation passed');

      // Step 6: Build API request payload exactly as specified
      const requestPayload: SaveQuoteCoverageRequest = {
        product_id: Number(productId),
        validity_days: validityDays,
        backdate_days: backdateDays,
        operating_countries: cleanCountries,
        operating_regions: cleanRegions,
        operating_zones: cleanZones
      };

      console.log('📦 Final API Request Payload:', requestPayload);

      // Step 7: Determine POST vs PATCH based on existing data
      let apiResponse;
      if (hasQuoteConfigData) {
        console.log('🔄 Existing data detected - Using PATCH API...');
        apiResponse = await updateQuoteCoverage(String(insurerId), String(productId), requestPayload);
        console.log('✅ PATCH API Response:', apiResponse);
      } else {
        console.log('🚀 No existing data - Using POST API...');
        apiResponse = await saveQuoteCoverage(String(insurerId), String(productId), requestPayload);
        console.log('✅ POST API Response:', apiResponse);
      }

      // Step 8: Success handling
      toast({
        title: 'Success',
        description: hasQuoteConfigData ? 'Quote coverage updated successfully!' : 'Quote coverage saved successfully!',
      });

      // Mark as having data for future PATCH calls
      setHasQuoteConfigData(true);

    } catch (error: any) {
      // Step 9: Error handling with specific error messages
      console.error('❌ Save Quote Coverage Error:', error);
      
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save quote coverage configuration.',
        variant: 'destructive'
      });
    } finally {
      // Step 10: Always reset loading state
      console.log('⏳ Setting loading state to FALSE...');
      setIsSavingQuoteConfig(false);
      console.log('🎯 === SAVE QUOTE COVERAGE COMPLETED ===');
    }
  };

  // Placeholder for other save operations
  const saveConfiguration = () => {
    toast({
      title: 'Configuration Saved',
      description: 'Configuration has been saved successfully.',
    });
  };

  const handleConfirmSave = () => {
    toast({
      title: "Configuration Saved",
      description: `Product configuration for ${product.name} has been successfully saved.`,
    });
    setIsConfirmSaveDialogOpen(false);
    setHasUnsavedChanges(false);
  };

  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  const handleTabChange = async (newTab: string) => {
    setActiveTab(newTab);
    if (newTab === 'pricing') {
      setActivePricingTab('base-rates');
      await fetchBaseRatesMasters();
    }
  };

  const handleBackNavigation = () => {
    navigate(`${basePath}/product-config`);
  };

  // Helper function to get the next order number
  const getNextOrder = (items: any[]) => {
    return Math.max(...items.map(item => item.order), 0) + 1;
  };

  // Handle adding new document
  const handleAddDocument = () => {
    const newDoc = {
      ...newDocument,
      id: Math.max(...requiredDocuments.map(doc => doc.id), 0) + 1,
      order: getNextOrder(requiredDocuments)
    };
    setRequiredDocuments([...requiredDocuments, newDoc]);
    setNewDocument({ label: "", description: "", required: false, active: true, template: null });
    toast({
      title: "Document Added",
      description: `"${newDoc.label}" has been added to required documents.`,
    });
  };

  // Handle editing document
  const handleEditDocument = () => {
    if (editingDocument) {
      const updatedDocs = requiredDocuments.map(d => 
        d.id === editingDocument.id ? editingDocument : d
      );
      setRequiredDocuments(updatedDocs);
      setEditingDocument(null);
      toast({
        title: "Document Updated",
        description: `"${editingDocument.label}" has been updated.`,
      });
    }
  };

  // Toggle document active status
  const toggleDocumentActive = (docId: number) => {
    const updatedDocs = requiredDocuments.map(doc =>
      doc.id === docId ? { ...doc, active: !doc.active } : doc
    );
    setRequiredDocuments(updatedDocs);
  };

  // Delete document
  const handleDeleteDocument = (docId: number) => {
    const doc = requiredDocuments.find(d => d.id === docId);
    setConfirmDialog({
      isOpen: true,
      title: "Delete Document",
      description: `Are you sure you want to delete "${doc?.label}"? This action cannot be undone.`,
      action: () => {
        const updatedDocs = requiredDocuments.filter(doc => doc.id !== docId);
        setRequiredDocuments(updatedDocs);
        toast({
          title: "Document Deleted",
          description: "The document has been removed from required documents.",
        });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Handle template upload
  const handleTemplateUpload = (event: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = event.target.files?.[0];
    if (file) {
      const template = {
        name: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${Math.round(file.size / 1024)} KB`
      };
      
      if (isEdit && editingDocument) {
        setEditingDocument({ ...editingDocument, template });
      } else {
        setNewDocument({ ...newDocument, template });
      }
      
      toast({
        title: "Template Uploaded",
        description: `Template "${file.name}" has been uploaded successfully.`,
      });
    }
  };

  // Remove template
  const removeTemplate = (isEdit: boolean = false) => {
    const templateName = isEdit ? editingDocument?.template?.name : newDocument?.template?.name;
    setConfirmDialog({
      isOpen: true,
      title: "Remove Template",
      description: `Are you sure you want to remove the template "${templateName}"?`,
      action: () => {
        if (isEdit && editingDocument) {
          setEditingDocument({ ...editingDocument, template: null });
        } else {
          setNewDocument({ ...newDocument, template: null });
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateQuoteConfig = (section: string, field: string, value: any) => {
    markAsChanged();
    setQuoteConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const updateBaseRate = (projectType: string, value: number) => {
    markAsChanged();
    setRatingConfig(prev => ({
      ...prev,
      baseRates: {
        ...prev.baseRates,
        [projectType]: value,
      },
    }));
  };

  const updateProjectTypeQuoteOption = (projectType: string, option: string) => {
    markAsChanged();
    setRatingConfig(prev => ({
      ...prev,
      projectTypeQuoteOptions: {
        ...prev.projectTypeQuoteOptions,
        [projectType]: option,
      },
    }));
  };

  const updateSubProjectEntry = (index: number, field: string, value: string | number) => {
    markAsChanged();
    setRatingConfig(prev => ({
      ...prev,
      subProjectEntries: prev.subProjectEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const updateProjectRiskFactor = (category: string, key: string, value: any) => {
    markAsChanged();
    
    // Helper function to set nested object property using dot notation
    const setNestedProperty = (obj: any, path: string, value: any) => {
      const keys = path.split('.');
      const lastKey = keys.pop()!;
      const target = keys.reduce((current, key) => {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        return current[key];
      }, obj);
      target[lastKey] = value;
      return obj;
    };
    
    setRatingConfig(prev => {
      const newConfig = { ...prev };
      
      if (category === 'riskDefinition') {
        // Handle nested risk definition updates
        const projectRisk = newConfig.projectRisk as any;
        if (!projectRisk.riskDefinition) {
          projectRisk.riskDefinition = {};
        }
        const updatedRiskDefinition = { ...projectRisk.riskDefinition };
        setNestedProperty(updatedRiskDefinition, key, value);
        
        return {
          ...newConfig,
          projectRisk: {
            ...newConfig.projectRisk,
            riskDefinition: updatedRiskDefinition,
          },
        };
      } else {
        // Handle regular category updates (existing functionality)
        return {
          ...newConfig,
          projectRisk: {
            ...newConfig.projectRisk,
            [category]: {
              ...newConfig.projectRisk[category as keyof typeof newConfig.projectRisk],
              [key]: value,
            },
          },
        };
      }
    });
  };

  // Helper functions for duration and maintenance period loadings
  const addDurationLoading = () => {
    markAsChanged();
    const newId = Math.max(...ratingConfig.projectRisk.durationLoadings.map(d => d.id), 0) + 1;
    setRatingConfig(prev => ({
      ...prev,
      projectRisk: {
        ...prev.projectRisk,
        durationLoadings: [...prev.projectRisk.durationLoadings, {
          id: newId,
          from: 0,
          to: 12,
          pricingType: 'percentage',
          value: 0,
          quoteOption: 'quote'
        }]
      }
    }));
  };

  const removeDurationLoading = (id: number) => {
    const item = ratingConfig.projectRisk.durationLoadings.find(d => d.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Remove Duration Loading",
      description: `Are you sure you want to remove the duration loading for "${item?.from}-${item?.to} months"?`,
      action: () => {
        markAsChanged();
        setRatingConfig(prev => ({
          ...prev,
          projectRisk: {
            ...prev.projectRisk,
            durationLoadings: prev.projectRisk.durationLoadings.filter(d => d.id !== id)
          }
        }));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateDurationLoading = (id: number, field: string, value: any) => {
    markAsChanged();
    setRatingConfig(prev => ({
      ...prev,
      projectRisk: {
        ...prev.projectRisk,
        durationLoadings: prev.projectRisk.durationLoadings.map(d =>
          d.id === id ? { ...d, [field]: value } : d
        )
      }
    }));
  };

  const addMaintenancePeriodLoading = () => {
    markAsChanged();
    const newId = Math.max(...ratingConfig.projectRisk.maintenancePeriodLoadings.map(m => m.id), 0) + 1;
    setRatingConfig(prev => ({
      ...prev,
      projectRisk: {
        ...prev.projectRisk,
        maintenancePeriodLoadings: [...prev.projectRisk.maintenancePeriodLoadings, {
          id: newId,
          from: 0,
          to: 12,
          pricingType: 'percentage',
          value: 0,
          quoteOption: 'quote'
        }]
      }
    }));
  };

  const removeMaintenancePeriodLoading = (id: number) => {
    const item = ratingConfig.projectRisk.maintenancePeriodLoadings.find(m => m.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Remove Maintenance Period Loading",
      description: `Are you sure you want to remove the maintenance period loading for "${item?.from}-${item?.to} months"?`,
      action: () => {
        markAsChanged();
        setRatingConfig(prev => ({
          ...prev,
          projectRisk: {
            ...prev.projectRisk,
            maintenancePeriodLoadings: prev.projectRisk.maintenancePeriodLoadings.filter(m => m.id !== id)
          }
        }));
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateMaintenancePeriodLoading = (id: number, field: string, value: any) => {
    markAsChanged();
    setRatingConfig(prev => ({
      ...prev,
      projectRisk: {
        ...prev.projectRisk,
        maintenancePeriodLoadings: prev.projectRisk.maintenancePeriodLoadings.map(m =>
          m.id === id ? { ...m, [field]: value } : m
        )
      }
    }));
  };

  const updateContractorRiskFactor = (category: string, key: string, value: number) => {
    setRatingConfig(prev => ({
      ...prev,
      contractorRisk: {
        ...prev.contractorRisk,
        [category]: {
          ...prev.contractorRisk[category as keyof typeof prev.contractorRisk],
          [key]: value,
        },
      },
    }));
  };

  const updateContractorRiskEntry = (category: string, id: number, field: string, value: any) => {
    setRatingConfig(prev => {
      const categoryData = prev.contractorRisk[category as keyof typeof prev.contractorRisk];
      // Only update if it's an array (new format)
      if (Array.isArray(categoryData)) {
        return {
          ...prev,
          contractorRisk: {
            ...prev.contractorRisk,
            [category]: categoryData.map((entry: any) =>
              entry.id === id ? { ...entry, [field]: value } : entry
            ),
          },
        };
      }
      return prev;
    });
  };

  const addContractorRiskEntry = (category: string) => {
    setRatingConfig(prev => {
      const categoryData = prev.contractorRisk[category as keyof typeof prev.contractorRisk];
      // Only add if it's an array (new format)
      if (Array.isArray(categoryData)) {
        const currentEntries = categoryData as any[];
        const newId = Math.max(...currentEntries.map((entry: any) => entry.id)) + 1;
        return {
          ...prev,
          contractorRisk: {
            ...prev.contractorRisk,
            [category]: [...currentEntries, {
              id: newId,
              from: 0,
              to: 0,
              pricingType: 'percentage',
              loadingDiscount: 0,
              quoteOption: 'quote'
            }],
          },
        };
      }
      return prev;
    });
  };

  const removeContractorRiskEntry = (category: string, id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Entry",
      description: `Are you sure you want to remove this ${category.replace(/([A-Z])/g, ' $1').toLowerCase()} entry?`,
      action: () => {
        setRatingConfig(prev => {
          const categoryData = prev.contractorRisk[category as keyof typeof prev.contractorRisk];
          // Only remove if it's an array (new format)  
          if (Array.isArray(categoryData)) {
            return {
              ...prev,
              contractorRisk: {
                ...prev.contractorRisk,
                [category]: categoryData.filter((entry: any) => entry.id !== id),
              },
            };
          }
          return prev;
        });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateCoverRequirement = (category: string, key: string, value: number) => {
    setRatingConfig(prev => ({
      ...prev,
      coverRequirements: {
        ...prev.coverRequirements,
        [category]: {
          ...prev.coverRequirements[category as keyof typeof prev.coverRequirements],
          [key]: value,
        },
      },
    }));
  };

  const updateCoverRequirementEntry = (category: string, id: number, field: string, value: any) => {
    setRatingConfig(prev => {
      const categoryData = prev.coverRequirements[category as keyof typeof prev.coverRequirements];
      // Only update if it's an array (new format)
      if (Array.isArray(categoryData)) {
        return {
          ...prev,
          coverRequirements: {
            ...prev.coverRequirements,
            [category]: categoryData.map((entry: any) =>
              entry.id === id ? { ...entry, [field]: value } : entry
            ),
          },
        };
      }
      return prev;
    });
  };
  const addCoverRequirementEntry = (category: string) => {
    setRatingConfig(prev => {
      const categoryData = prev.coverRequirements[category as keyof typeof prev.coverRequirements];
      // Only add if it's an array (new format)
      if (Array.isArray(categoryData)) {
        const currentEntries = categoryData as any[];
        const newId = Math.max(...currentEntries.map((entry: any) => entry.id)) + 1;
        
        let newEntry: any;
        
        if (category === 'subLimits') {
          newEntry = {
            id: newId,
            title: '',
            description: '',
            pricingType: 'fixed',
            value: 0
          };
        } else if (category === 'deductibles') {
          newEntry = {
            id: newId,
            deductibleType: 'fixed',
            value: 0,
            loadingDiscount: 0,
            quoteOption: 'quote'
          };
        } else {
          newEntry = {
            id: newId,
            from: 0,
            to: 0,
            pricingType: 'percentage',
            loadingDiscount: 0,
            quoteOption: 'quote'
          };
        }
        
        return {
          ...prev,
          coverRequirements: {
            ...prev.coverRequirements,
            [category]: [...currentEntries, newEntry],
          },
        };
      }
      return prev;
    });
  };

  const removeCoverRequirementEntry = (category: string, id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Entry",
      description: `Are you sure you want to remove this ${category.replace(/([A-Z])/g, ' $1').toLowerCase()} entry?`,
      action: () => {
        setRatingConfig(prev => {
          const categoryData = prev.coverRequirements[category as keyof typeof prev.coverRequirements];
          // Only remove if it's an array (new format)  
          if (Array.isArray(categoryData)) {
            return {
              ...prev,
              coverRequirements: {
                ...prev.coverRequirements,
                [category]: categoryData.filter((entry: any) => entry.id !== id),
              },
            };
          }
          return prev;
        });
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const updateLimits = (key: string, value: number) => {
    setRatingConfig(prev => ({
      ...prev,
      limits: {
        ...prev.limits,
        [key]: value,
      },
    }));
  };

  const addNewClause = async () => {
    if (!newClause.code || !newClause.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const insurerId = getInsurerCompanyId();
      if (!insurerId || !product.id) return;

      // Map UI -> API
      const payload: CreateClauseParams = {
        product_id: Number(product.id),
        clause_code: newClause.code,
      title: newClause.title,
        purpose_description: newClause.purposeDescription || "",
        clause_wording: newClause.purpose || newClause.wording || "",
        clause_type: newClause.type.toLowerCase(),
        show_type: newClause.show.toLowerCase(),
        pricing_type: newClause.pricingType === "percentage" ? "loading" : "fixed",
        pricing_value: Number(newClause.pricingValue || 0),
      };

      const created = await createCewsClause(insurerId, product.id as string, payload);

      // Update UI list immediately
      setClausesData(prev => [
        ...prev,
        {
          id: created.id,
          code: created.clause_code,
          title: created.title,
          purposeDescription: created.purpose_description,
          wording: created.clause_wording,
          type: (created.clause_type || '').toLowerCase() === 'exclusion' ? 'Exclusion' : (created.clause_type || '').toLowerCase() === 'warranty' ? 'Warranty' : 'Clause',
          show: (created.show_type || '').toLowerCase() === 'mandatory' ? 'Mandatory' : 'Optional',
          pricingType: created.pricing_type === 'discount' || created.pricing_type === 'loading' ? 'percentage' : 'fixed',
          pricingValue: Number(created.pricing_value || 0),
          displayOrder: created.display_order ?? 0,
          active: created.is_active === 1,
        } as any
      ]);

      // Reset dialog form
    setNewClause({
      code: "",
      title: "",
      type: "Clause",
      show: "Optional",
      wording: "",
      purposeDescription: "",
      purpose: "",
      pricingType: "percentage",
      pricingValue: 0
    });
    setIsAddClauseDialogOpen(false);
    
    toast({
      title: "Clause Added",
      description: "The new clause has been successfully added.",
    });
    } catch (err: any) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400) toast({ title: "Invalid data", description: message || "Bad request.", variant: "destructive" });
      else if (status === 401) toast({ title: "Unauthorized", description: "Please log in again.", variant: "destructive" });
      else if (status === 403) toast({ title: "Forbidden", description: "You don't have access.", variant: "destructive" });
      else if (status && status >= 500) toast({ title: "Server error", description: "Please try again later.", variant: "destructive" });
      else toast({ title: "Failed", description: message || "Failed to add clause.", variant: "destructive" });
    }
  };
  const showPreview = async () => {
    const insurerId = getInsurerCompanyId();
    if (!insurerId || !product.id) return;
    try {
      setPreviewError(null);
      setIsPreviewLoading(true);
      const data = await getQuoteFormat(insurerId, product.id as string);
      // Map API -> UI in case user hasn't manually opened Quote Format tab yet
      setQuoteConfig(prev => ({
        ...prev,
        header: {
          ...prev.header,
          companyName: data.company_name || prev.header.companyName,
          companyAddress: data.company_address || prev.header.companyAddress,
          contactInfo: data.contact_info?.raw || prev.header.contactInfo,
          headerColor: data.header_bg_color || prev.header.headerColor,
          headerTextColor: data.header_text_color || prev.header.headerTextColor,
          logoPosition: (data.logo_position || prev.header.logoPosition || 'LEFT').toLowerCase(),
        },
        details: { ...prev.details, quotePrefix: data.quotation_prefix || prev.details.quotePrefix },
        risk: {
          ...prev.risk,
          showProjectDetails: data.show_project_details === 1,
          showCoverageTypes: data.show_coverage_types === 1,
          showCoverageLimits: data.show_coverage_limits === 1,
          showDeductibles: data.show_deductibles === 1,
          showContractorInfo: data.show_contractor_info === 1,
          riskSectionTitle: data.risk_section_title || prev.risk.riskSectionTitle,
        },
        premium: {
          ...prev.premium,
          currency: data.premium_currency || prev.premium.currency,
          premiumSectionTitle: data.premium_section_title || prev.premium.premiumSectionTitle,
          showBasePremium: data.show_base_premium === 1,
          showRiskAdjustments: data.show_risk_adjustments === 1,
          showFees: data.show_fees_charges === 1,
          showTaxes: data.show_taxes_vat === 1,
          showTotalPremium: data.show_total_premium === 1,
        },
        terms: {
          ...prev.terms,
          showWarranties: data.show_warranties === 1,
          showExclusions: data.show_exclusions === 1,
          showDeductibleDetails: data.show_deductible_details === 1,
          showPolicyConditions: data.show_policy_conditions === 1,
          termsSectionTitle: data.terms_section_title || prev.terms.termsSectionTitle,
          additionalTerms: data.additional_terms_text || prev.terms.additionalTerms,
        },
        signature: {
          ...prev.signature,
          showSignatureBlock: data.show_signature_block === 1,
          authorizedSignatory: data.authorized_signatory_name || prev.signature.authorizedSignatory,
          signatoryTitle: data.signatory_title || prev.signature.signatoryTitle,
          signatureText: data.signature_block_text || prev.signature.signatureText,
        },
        footer: {
          ...prev.footer,
          showFooter: data.show_footer === 1,
          showDisclaimer: data.show_general_disclaimer === 1,
          showRegulatoryInfo: data.show_regulatory_info === 1,
          generalDisclaimer: data.general_disclaimer_text || prev.footer.generalDisclaimer,
          regulatoryText: data.regulatory_info_text || prev.footer.regulatoryText,
          footerBgColor: data.footer_bg_color || prev.footer.footerBgColor,
          footerTextColor: data.footer_text_color || prev.footer.footerTextColor,
        },
      }));
    setIsPreviewDialogOpen(true);
    } catch (err: any) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400) setPreviewError(message || 'Bad request while loading quote format.');
      else if (status === 401) setPreviewError('Unauthorized. Please log in again.');
      else if (status === 403) setPreviewError("You don't have access to quote format.");
      else if (status && status >= 500) setPreviewError('Server error. Please try again later.');
      else setPreviewError(message || 'Failed to load quote format.');
      setIsPreviewDialogOpen(true);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackNavigation}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Product Management
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{product.name} - Product Configuration</h1>
                <p className="text-sm text-muted-foreground">{product.code}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-[95%] mx-auto px-2 sm:px-3 lg:px-4 py-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="quote-config" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quote Coverage
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Pricing Configurator
              </TabsTrigger>
              <TabsTrigger value="cews" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                CEWs Configuration
              </TabsTrigger>
              <TabsTrigger value="wording" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Wording Configurations
              </TabsTrigger>
              <TabsTrigger value="quote-format" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Quote Format
              </TabsTrigger>
              <TabsTrigger value="required-documents" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Required Documents
              </TabsTrigger>
            </TabsList>

            {/* Quote Coverage Tab */}
            <TabsContent value="quote-config" className="space-y-6">
              <QuoteConfigurator
                isLoadingQuoteConfig={isLoadingQuoteConfig}
                isSavingQuoteConfig={isSavingQuoteConfig}
                onSave={handleSaveQuoteCoverage}
                quoteConfig={quoteConfig}
                updateQuoteConfig={updateQuoteConfig}
                isLoadingMetadata={isLoadingMetadata}
                insurerMetadata={insurerMetadata as any}
                metadataError={metadataError}
                quoteConfigError={quoteConfigError}
                getAvailableRegions={getAvailableRegions}
                getAvailableZones={getAvailableZones}
              />
            </TabsContent>
            {/* Pricing Configurator Tab */}
            <TabsContent value="pricing" className="space-y-6">
              {/* Algorithm Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Pricing Configurator
                      </CardTitle>
                      <CardDescription>
                        Configure rating algorithms and pricing factors
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 h-[calc(100vh-16rem)] overflow-scroll custom-scrollbars">
                    {/* Sidebar Navigation */}
                    <div className="w-80 bg-muted/30 rounded-lg p-4 overflow-y-scroll custom-scrollbars">
                      <h3 className="font-semibold text-foreground mb-4">Pricing Configuration</h3>
                      <div className="space-y-2">
                        {[
                          { id: "base-rates", label: "Base Rates", icon: DollarSign, count: activeProjectTypes.length },
                          { id: "project-risk", label: "Project Risk Factors", icon: TrendingUp, count: 4 },
                          { id: "contractor-risk", label: "Contractor Risk Factors", icon: Shield, count: 3 },
                          { id: "coverage-options", label: "Coverage Options & Extensions", icon: Shield, count: 2 },
                          { id: "limits-deductibles", label: "Policy Limits & Deductibles", icon: Calculator, count: 2 },
                          { id: "clause-pricing", label: "Clause Pricing Configuration", icon: FileText, count: ratingConfig.clausesPricing.length },
                          { id: "construction-types", label: "Construction Types", icon: DollarSign, count: activeConstructionTypes.length },
                          { id: "countries", label: "Countries", icon: MapPin, count: activeCountries.length },
                          { id: "regions", label: "Regions", icon: MapPin, count: 0 },
                          { id: "zones", label: "Zones", icon: MapPin, count: 0 },
                          { id: "role-types", label: "Role Types", icon: Shield, count: 5 },
                          { id: "contract-types", label: "Contract Types", icon: FileText, count: 4 },
                          { id: "soil-types", label: "Soil Types", icon: TrendingUp, count: 6 },
                          { id: "subcontractor-types", label: "Subcontractor Types", icon: Shield, count: 8 },
                          { id: "consultant-roles", label: "Consultant Roles", icon: Shield, count: 7 },
                          { id: "security-types", label: "Security Types", icon: Shield, count: 5 },
                          { id: "area-types", label: "Area Types", icon: MapPin, count: 6 },
                          { id: "fee-types", label: "Fee Types", icon: Percent, count: ratingConfig.feeTypes?.length || 0 },
                        ].map((section) => (
                          <button
                            key={section.id}
                            onClick={async () => {
                              setActivePricingTab(section.id);
                              if (section.id === 'base-rates') {
                                await fetchBaseRatesMasters();
                              } else if (section.id === 'project-risk') {
                                await fetchProjectRiskFactors();
                              } else if (section.id === 'contractor-risk') {
                                await fetchContractorRiskFactors();
                              } else if (section.id === 'coverage-options') {
                                await fetchCoverageOptions();
                              } else if (section.id === 'limits-deductibles') {
                                await fetchPolicyLimits();
                              } else if (section.id === 'clause-pricing') {
                                await fetchClauseMetadata();
                                await fetchClausePricing();
                              } else if (section.id === 'construction-types') {
                                console.log('🎯 Construction Types tab clicked - starting fetch sequence...');
                                await fetchConstructionTypes();
                                console.log('🎯 Metadata fetch completed, now fetching config...');
                                await fetchConstructionTypesConfig();
                                console.log('🎯 Config fetch completed');
                              } else if (section.id === 'role-types') {
                                await fetchRoleTypes();
                              } else if (section.id === 'contract-types') {
                                await fetchContractTypes();
                              } else if (section.id === 'soil-types') {
                                await fetchSoilTypes();
                              } else if (section.id === 'subcontractor-types') {
                                await fetchSubcontractorTypes();
                              } else if (section.id === 'consultant-roles') {
                                await fetchConsultantRoles();
                              } else if (section.id === 'security-types') {
                                await fetchSecurityTypes();
                              } else if (section.id === 'area-types') {
                                await fetchAreaTypes();
                              } else if (section.id === 'countries') {
                                console.log('🎯 Countries tab clicked - starting fetch sequence...');
                                await fetchCountries();
                                console.log('🎯 Metadata fetch completed, now fetching config...');
                                await fetchCountriesConfig();
                                console.log('🎯 Config fetch completed');
                              } else if (section.id === 'regions') {
                                console.log('🎯 Regions tab clicked - starting fetch sequence...');
                                await fetchRegions();
                                console.log('🎯 Metadata fetch completed, now fetching config...');
                                await fetchRegionsConfig();
                                console.log('🎯 Config fetch completed');
                              } else if (section.id === 'zones') {
                                console.log('🎯 Zones tab clicked - starting fetch sequence...');
                                await fetchZones();
                                console.log('🎯 Metadata fetch completed, now fetching config...');
                                await fetchZonesConfig();
                                console.log('🎯 Config fetch completed');
                              }
                            }}
                            className={`w-full text-left p-3 rounded-lg transition-all flex items-center justify-between ${
                              activePricingTab === section.id
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'hover:bg-muted/50 text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <section.icon className="w-4 h-4" />
                              <span className="font-medium text-sm">{section.label}</span>
                            </div>
                            <Badge variant={activePricingTab === section.id ? "secondary" : "outline"} className="text-xs">
                              {section.count}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-scroll custom-scrollbars">
                      {activePricingTab === "base-rates" && (
                        <BaseRates
                          isLoading={isLoadingBaseRatesMasters}
                          error={baseRatesMastersError}
                          projectTypesMasters={projectTypesMasters}
                          activeProjectTypes={activeProjectTypes}
                          ratingConfig={ratingConfig}
                              selectedProjectTypes={selectedProjectTypes}
                              onSubProjectEntryChange={updateSubProjectEntry}
                              onProjectTypeToggle={toggleProjectType}
                          onSave={handleSaveBaseRates}
                          isSaving={isSavingBaseRates}
                            />
                      )}

                      {activePricingTab === "project-risk" && (
                        <ProjectRiskFactors
                          ratingConfig={ratingConfig}
                          onSave={handleSaveProjectRiskFactors}
                          addDurationLoading={addDurationLoading}
                          updateDurationLoading={updateDurationLoading}
                          removeDurationLoading={removeDurationLoading}
                          addMaintenancePeriodLoading={addMaintenancePeriodLoading}
                          updateMaintenancePeriodLoading={updateMaintenancePeriodLoading}
                          removeMaintenancePeriodLoading={removeMaintenancePeriodLoading}
                          updateProjectRiskFactor={updateProjectRiskFactor}
                          SoilTypeMultiSelect={SoilTypeMultiSelect}
                          isLoading={isLoadingProjectRiskFactors}
                          error={projectRiskFactorsError}
                          isSaving={isSavingProjectRiskFactors}
                        />
                       )}
                      {activePricingTab === "contractor-risk" && (
                        <ContractorRiskFactors
                          ratingConfig={ratingConfig}
                          onSave={handleSaveContractorRiskFactors}
                          addContractorRiskEntry={addContractorRiskEntry}
                          updateContractorRiskEntry={updateContractorRiskEntry}
                          removeContractorRiskEntry={removeContractorRiskEntry}
                          isLoading={isLoadingContractorRiskFactors}
                          error={contractorRiskFactorsError}
                          isSaving={isSavingContractorRiskFactors}
                        />
                        )}
                       {activePricingTab === "coverage-options" && (
                         <CoverageOptionsExtensions
                           ratingConfig={ratingConfig}
                           onSave={handleSaveCoverageOptions}
                           addCoverRequirementEntry={addCoverRequirementEntry}
                           updateCoverRequirementEntry={updateCoverRequirementEntry}
                           removeCoverRequirementEntry={removeCoverRequirementEntry}
                           updateCoverRequirement={updateCoverRequirement}
                           isLoading={isLoadingCoverageOptions}
                           isSaving={isSavingCoverageOptions}
                           error={coverageOptionsError}
                           coverageOptionsData={coverageOptionsData}
                         />
                        )}
                      {activePricingTab === "limits-deductibles" && (
                        <PolicyLimitsDeductibles
                          ratingConfig={ratingConfig}
                          onSave={handleSavePolicyLimits}
                          updateLimits={updateLimits}
                          addCoverRequirementEntry={addCoverRequirementEntry}
                          updateCoverRequirementEntry={updateCoverRequirementEntry}
                          removeCoverRequirementEntry={removeCoverRequirementEntry}
                          isLoading={isLoadingPolicyLimits}
                          isSaving={isSavingPolicyLimits}
                          error={policyLimitsError}
                          policyLimitsData={policyLimitsData}
                        />
                      )}


                      







                                             {/* Master Data Tabs */}
                                             {(activePricingTab === "clause-pricing" || 
                         activePricingTab === "construction-types" || 
                         activePricingTab === "countries" || 
                         activePricingTab === "regions" || 
                         activePricingTab === "zones" || 
                         activePricingTab === "role-types" || 
                         activePricingTab === "contract-types" || 
                         activePricingTab === "soil-types" || 
                         activePricingTab === "subcontractor-types" || 
                         activePricingTab === "consultant-roles" || 
                         activePricingTab === "security-types" || 
                         activePricingTab === "area-types" || 
                         activePricingTab === "fee-types") && (
                         <MasterDataTabs
                           activePricingTab={activePricingTab}
                           activeConstructionTypes={activeConstructionTypes}
                           activeCountries={activeCountries}
                           ratingConfig={ratingConfig}
                           onSave={saveConfiguration}
                           markAsChanged={markAsChanged}
                           setRatingConfig={setRatingConfig}
                           isLoadingClauseMetadata={isLoadingClauseMetadata}
                           clauseMetadataError={clauseMetadataError}
                           clauseMetadata={clauseMetadata}
                           isLoadingClausePricing={isLoadingClausePricing}
                           clausePricingError={clausePricingError}
                           clausePricingData={clausePricingData}
                           isSavingClausePricing={isSavingClausePricing}
                           handleSaveClausePricing={handleSaveClausePricing}
                           constructionTypesData={constructionTypesData}
                           isLoadingConstructionTypes={isLoadingConstructionTypes}
                           constructionTypesError={constructionTypesError}
                           roleTypesData={roleTypesData}
                           isLoadingRoleTypes={isLoadingRoleTypes}
                           roleTypesError={roleTypesError}
                           contractTypesData={contractTypesData}
                           isLoadingContractTypes={isLoadingContractTypes}
                           contractTypesError={contractTypesError}
                           soilTypesData={soilTypesData}
                           isLoadingSoilTypes={isLoadingSoilTypes}
                           soilTypesError={soilTypesError}
                           subcontractorTypesData={subcontractorTypesData}
                           isLoadingSubcontractorTypes={isLoadingSubcontractorTypes}
                           subcontractorTypesError={subcontractorTypesError}
                           consultantRolesData={consultantRolesData}
                           isLoadingConsultantRoles={isLoadingConsultantRoles}
                           consultantRolesError={consultantRolesError}
                           securityTypesData={securityTypesData}
                           isLoadingSecurityTypes={isLoadingSecurityTypes}
                           securityTypesError={securityTypesError}
                           areaTypesData={areaTypesData}
                           isLoadingAreaTypes={isLoadingAreaTypes}
                           areaTypesError={areaTypesError}
                           countriesData={countriesData}
                           isLoadingCountries={isLoadingCountries}
                           countriesError={countriesError}
                           regionsData={regionsData}
                           isLoadingRegions={isLoadingRegions}
                           regionsError={regionsError}
                           zonesData={zonesData}
                           isLoadingZones={isLoadingZones}
                           zonesError={zonesError}
                           constructionTypesConfigData={constructionTypesConfigData}
                           isLoadingConstructionTypesConfig={isLoadingConstructionTypesConfig}
                           constructionTypesConfigError={constructionTypesConfigError}
                           isSavingConstructionTypesConfig={isSavingConstructionTypesConfig}
                           handleSaveConstructionTypesConfiguration={handleSaveConstructionTypesConfiguration}
                           countriesConfigData={countriesConfigData}
                           isLoadingCountriesConfig={isLoadingCountriesConfig}
                           countriesConfigError={countriesConfigError}
                           isSavingCountriesConfig={isSavingCountriesConfig}
                           handleSaveCountriesConfiguration={handleSaveCountriesConfiguration}
                           regionsConfigData={regionsConfigData}
                           isLoadingRegionsConfig={isLoadingRegionsConfig}
                           regionsConfigError={regionsConfigError}
                           isSavingRegionsConfig={isSavingRegionsConfig}
                           handleSaveRegionsConfiguration={handleSaveRegionsConfiguration}
                           zonesConfigData={zonesConfigData}
                           isLoadingZonesConfig={isLoadingZonesConfig}
                           zonesConfigError={zonesConfigError}
                           isSavingZonesConfig={isSavingZonesConfig}
                           handleSaveZonesConfiguration={handleSaveZonesConfiguration}
                         />
                        )}
                     </div>
                   </div>
                 </CardContent>
               </Card>

            </TabsContent>

            {/* CEWs Configuration Tab */}
            <TabsContent value="cews" className="space-y-6">
              <CEWsConfiguration
                tplError={tplError}
                isLoadingTpl={isLoadingTpl}
                tplLimit={tplLimit}
                setTplLimit={(v: string) => setTplLimit(v)}
                tplExtensions={tplExtensions}
                setTplExtensions={(v) => setTplExtensions(v as any)}
                isSavingTpl={isSavingTpl}
                saveTplExtensions={saveTplExtensions}
              />

              {/* Clauses, Exclusions, and Warranties Section */}
              {isLoadingClauses ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="w-72 h-6 bg-gray-200 rounded animate-pulse" />
                        <div className="w-[28rem] h-4 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="w-28 h-9 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="w-full h-9 bg-gray-200 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />
                      <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />
                      <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Clauses, Exclusions, and Warranties Section</CardTitle>
                      <CardDescription>
                        Configure specific clauses, exclusions, and warranty requirements
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => setIsAddClauseDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Clause
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    {clausesError && (
                      <div className="mb-4 text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                        {clausesError}
                      </div>
                    )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Clause Code</TableHead>
                        <TableHead>Title / Purpose</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Show</TableHead>
                        <TableHead>Pricing</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {clausesData.map((item, index) => {
                        const pricingItem = ratingConfig.clausesPricing.find(p => p.code === item.code);
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.code}</TableCell>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>
                              <Badge variant={item.type === "Clause" ? "default" : item.type === "Exclusion" ? "destructive" : "secondary"}>
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.show === "Mandatory" ? "default" : "outline"}>
                                {item.show}
                              </Badge>
                            </TableCell>
                             <TableCell>
                               {pricingItem ? (
                                 <span className="text-sm">
                                   {pricingItem.variableOptions.length} option{pricingItem.variableOptions.length !== 1 ? 's' : ''}
                                 </span>
                               ) : (
                                 <span className="text-sm text-muted-foreground">Not configured</span>
                               )}
                             </TableCell>
                             <TableCell className="text-right">
                               <div className="inline-flex gap-2">
                                 <Button variant="outline" size="sm" onClick={() => { setPreviewWording(item); setIsPreviewDialogOpen(true); }}>
                                   Preview
                                 </Button>
                                 <Button variant="outline" size="sm" onClick={() => {
                                   const firstOption = pricingItem?.variableOptions[0];
                                   setSelectedClause({...item, pricingType: firstOption?.type || "percentage", pricingValue: firstOption?.value || 0});
                                   setIsEditClauseDialogOpen(true);
                                 }}>
                                 View/Edit
                               </Button>
                               </div>
                             </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              )}

              {/* Edit and Add Clause Dialogs */}
              <Dialog open={isEditClauseDialogOpen} onOpenChange={setIsEditClauseDialogOpen}>
                <DialogContent className="max-w-4xl bg-card text-card-foreground border-0 shadow-2xl">
                  <DialogHeader className="space-y-2 pb-4">
                    <DialogTitle>View/Edit Clause Details</DialogTitle>
                  </DialogHeader>
                  {selectedClause && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-code">Clause Code</Label>
                          <Input
                            id="edit-code"
                            value={selectedClause.code}
                            onChange={(e) => setSelectedClause({...selectedClause, code: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-type">Type</Label>
                          <Select 
                            value={selectedClause.type} 
                            onValueChange={(value) => setSelectedClause({...selectedClause, type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Clause">Clause</SelectItem>
                              <SelectItem value="Exclusion">Exclusion</SelectItem>
                              <SelectItem value="Warranty">Warranty</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">Title / Purpose</Label>
                        <Input
                          id="edit-title"
                          value={selectedClause.title}
                          onChange={(e) => setSelectedClause({...selectedClause, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-purpose-desc">Purpose Description</Label>
                        <Input
                          id="edit-purpose-desc"
                          value={selectedClause.purposeDescription || ""}
                          onChange={(e) => setSelectedClause({...selectedClause, purposeDescription: e.target.value})}
                          placeholder="Brief description of the clause purpose"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-purpose">Clause Wordings</Label>
                        <Textarea
                          id="edit-purpose"
                          value={selectedClause.purpose || ""}
                          onChange={(e) => setSelectedClause({...selectedClause, purpose: e.target.value})}
                          placeholder="Enter the detailed clause wordings..."
                          rows={4}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">Pricing Configuration</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Pricing Type</Label>
                            <Select 
                              value={selectedClause.pricingType} 
                              onValueChange={(value) => setSelectedClause({...selectedClause, pricingType: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="fixed">Fixed Amount (AED)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Value</Label>
                            <Input
                              type="number"
                              value={selectedClause.pricingValue}
                              onChange={(e) => setSelectedClause({...selectedClause, pricingValue: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsEditClauseDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={async () => {
                          setIsSavingClause(true);
                          try {
                            const insurerId = getInsurerCompanyId();
                            if (!insurerId || !product.id) return;
                            // The endpoint expects {product_id} from the card; we keep it on the selectedClause or fall back to product.id
                            const clauseProductId = (selectedClause as any)?.id || (selectedClause as any)?.product_id || product.id;

                            const payload: UpdateClauseParams = {
                              title: selectedClause.title,
                              purpose_description: selectedClause.purposeDescription,
                              clause_wording: selectedClause.purpose || selectedClause.wording,
                              clause_type: selectedClause.type?.toUpperCase(),
                              show_type: selectedClause.show?.toUpperCase(),
                              pricing_type: selectedClause.pricingType === 'percentage' ? 'Percentage' : 'Fixed',
                              pricing_value: String(selectedClause.pricingValue ?? ''),
                            };

                            const updated = await updateCewsClause(insurerId, product.id as string, clauseProductId as string, payload);

                            // Update table row with response
                          setClausesData(prev => prev.map(c => 
                              c.code === selectedClause.code ? {
                                ...c,
                                title: updated.title || c.title,
                                purposeDescription: updated.purpose_description || c.purposeDescription,
                                wording: updated.clause_wording || c.wording,
                                type: (updated.clause_type || '').toUpperCase() === 'EXCLUSION' ? 'Exclusion' : (updated.clause_type || '').toUpperCase() === 'WARRANTY' ? 'Warranty' : 'Clause',
                                show: (updated.show_type || '').toUpperCase() === 'MANDATORY' ? 'Mandatory' : 'Optional',
                                pricingType: (String(updated.pricing_type || '').toLowerCase() === 'fixed' || String(updated.pricing_type || '').toLowerCase() === 'fixed_rate') ? 'fixed' : 'percentage',
                                pricingValue: Number(updated.pricing_value || c.pricingValue),
                              } : c
                          ));
                          setIsEditClauseDialogOpen(false);
                            // refresh list
                            try {
                              clausesApiRef.current = true;
                              const resp: GetClausesResponse = await getCewsClauses(insurerId, product.id as string);
                              const list = Array.isArray(resp?.clauses) ? resp.clauses : [];
                              const mapped = list.map((c) => ({
                                id: c.id,
                                code: c.clause_code || '',
                                title: c.title || '',
                                purposeDescription: c.purpose_description || '',
                                wording: c.clause_wording || '',
                                type: ((c.clause_type || '').toUpperCase() === 'EXCLUSION' ? 'Exclusion' : (c.clause_type || '').toUpperCase() === 'WARRANTY' ? 'Warranty' : 'Clause'),
                                show: (c.show_type || '').toUpperCase() === 'MANDATORY' ? 'Mandatory' : 'Optional',
                                pricingType: (c.pricing_type || '').toLowerCase() === 'fixed_rate' ? 'fixed' : 'percentage',
                                pricingValue: Number(c.pricing_value || 0),
                                displayOrder: Number(c.display_order || 0),
                                active: c.is_active === 1,
                              }));
                              setClausesData(mapped as any);
                            } finally {
                              clausesApiRef.current = false;
                            }
                          toast({
                              title: 'Clause Updated',
                              description: 'The clause has been successfully updated.',
                            });
                          } catch (err: any) {
                            const status = err?.status as number | undefined;
                            const message = err?.message as string | undefined;
                            if (status === 400) toast({ title: 'Invalid data', description: message || 'Bad request.', variant: 'destructive' });
                            else if (status === 401) toast({ title: 'Unauthorized', description: 'Please log in again.', variant: 'destructive' });
                            else if (status === 403) toast({ title: 'Forbidden', description: "You don't have access.", variant: 'destructive' });
                            else if (status && status >= 500) toast({ title: 'Server error', description: 'Please try again later.', variant: 'destructive' });
                            else toast({ title: 'Failed', description: message || 'Failed to update clause.', variant: 'destructive' });
                          } finally {
                            setIsSavingClause(false);
                          }
                        }}>
                          {isSavingClause ? 'Saving…' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Dialog open={isAddClauseDialogOpen} onOpenChange={setIsAddClauseDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader className="space-y-2 pb-4">
                    <DialogTitle>Add New Clause</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-code">Clause Code *</Label>
                        <Input
                          id="new-code"
                          placeholder="e.g., C001"
                          value={newClause.code}
                          onChange={(e) => setNewClause({...newClause, code: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-type">Type *</Label>
                        <Select 
                          value={newClause.type} 
                          onValueChange={(value) => setNewClause({...newClause, type: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Clause">Clause</SelectItem>
                            <SelectItem value="Exclusion">Exclusion</SelectItem>
                            <SelectItem value="Warranty">Warranty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-title">Title / Purpose *</Label>
                      <Input
                        id="new-title"
                        placeholder="Enter clause title or purpose"
                        value={newClause.title}
                        onChange={(e) => setNewClause({...newClause, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-purpose-desc">Purpose Description</Label>
                      <Input
                        id="new-purpose-desc"
                        value={newClause.purposeDescription || ""}
                        onChange={(e) => setNewClause({...newClause, purposeDescription: e.target.value})}
                        placeholder="Brief description of the clause purpose"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-purpose">Clause Wordings</Label>
                      <Textarea
                        id="new-purpose"
                        placeholder="Enter the detailed clause wordings..."
                        value={newClause.purpose}
                        onChange={(e) => setNewClause({...newClause, purpose: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Pricing Configuration</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-pricing-type">Pricing Type *</Label>
                          <Select 
                            value={newClause.pricingType} 
                            onValueChange={(value) => setNewClause({...newClause, pricingType: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="fixed">Fixed Amount (AED)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-pricing-value">
                            {newClause.pricingType === "percentage" ? "Percentage Value *" : "Fixed Amount (AED) *"}
                          </Label>
                          <Input
                            id="new-pricing-value"
                            type="number"
                            step={newClause.pricingType === "percentage" ? "0.1" : "100"}
                            placeholder={newClause.pricingType === "percentage" ? "e.g., 2.5" : "e.g., 1500"}
                            value={newClause.pricingValue}
                            onChange={(e) => setNewClause({...newClause, pricingValue: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddClauseDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={addNewClause}
                        disabled={!newClause.code || !newClause.title || newClause.pricingValue === 0}
                      >
                        Add Clause
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
            {/* Wording Configuration Tab */}
            <TabsContent value="wording" className="space-y-6">
                  {policyWordingsError && (
                    <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                      {policyWordingsError}
                    </div>
                  )}
                  
              {isLoadingPolicyWordings ? (
                <div className="space-y-4">
                  {[1,2].map(i => (
                    <div key={i} className="p-4 border rounded-md">
                      <div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                        </div>
                      ))}
                        </div>
                      ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                                <div>
                      <CardTitle>Policy Wordings</CardTitle>
                      <CardDescription>Manage uploaded policy wording documents</CardDescription>
                                </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={openUploadDialog} className="gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Wording
                      </Button>
                              </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policyWordings.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium">{w.document_title}</TableCell>
                          <TableCell>{w.upload_date}</TableCell>
                          <TableCell>{w.file_size_kb} KB</TableCell>
                          <TableCell>{Number(w.is_active) === 1 ? 'Active' : 'Inactive'}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setPreviewWording(w); setIsPreviewDialogOpen(true); }}>
                                Preview
                                </Button>
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(w)}>
                                  Edit
                                </Button>
                              </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              )}

              {/* Upload/Edit Wording Dialog */}
              <Dialog open={isWordingUploadDialogOpen} onOpenChange={setIsWordingUploadDialogOpen}>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>{editingWording ? 'Edit Policy Wording' : 'Upload Policy Wording'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wording-title">Document Title *</Label>
                      <Input
                        id="wording-title"
                        value={wordingUploadTitle}
                        onChange={(e) => setWordingUploadTitle(e.target.value)}
                        placeholder="e.g., Policy Wording v2.1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input id="wording-file" type="file" accept="application/pdf" onChange={handleFileUpload} />
                      {wordingUploadFile && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          <span>{wordingUploadFile.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => handleFileUpload({ target: { files: null } } as any)}>
                            <X className="w-4 h-4" />
                          </Button>
                    </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="wording-active"
                        checked={!!wordingUploadActive}
                        onCheckedChange={(checked) => setWordingUploadActive(!!checked)}
                      />
                      <Label htmlFor="wording-active">Active</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSavePolicyWording} disabled={!wordingUploadTitle || (!editingWording && !wordingUploadFile)}>
                      {isUploadingWording ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                          Saving…
                        </span>
                      ) : (
                        'Save Wording'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Policy Wording Preview Dialog */}
              <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Policy Wording Preview</DialogTitle>
                  </DialogHeader>
                  {previewWording && (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span>{previewWording.document_title}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Upload Date</span><span>{previewWording.upload_date}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span>{previewWording.file_size_kb} KB</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{Number(previewWording.is_active) === 1 ? 'Active' : 'Inactive'}</span></div>
                      <div className="text-xs text-muted-foreground">Note: Inline PDF preview not available. Download from the management console if needed.</div>
                  </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
            {/* Quote Format tab */}
            <TabsContent value="quote-format" className="space-y-6">
              {quoteFormatError && (
                <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                  {quoteFormatError}
                </div>
              )}
              {isLoadingQuoteFormat && (
                <div className="space-y-6">
                  <div className="p-4 border rounded-md space-y-4">
                    <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="p-4 border rounded-md space-y-4">
                    <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="p-4 border rounded-md space-y-4">
                    <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="p-4 border rounded-md space-y-4">
                    <div className="w-56 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              )}
              
              {!isLoadingQuoteFormat && (
                <>
              {/* Header Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        Header Configuration
                      </CardTitle>
                      <CardDescription>Configure quote header with logo and company information</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={showPreview} size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Template
                      </Button>
                      <Button onClick={async () => {
                        const insurerId = getInsurerCompanyId();
                        if (!insurerId || !product.id) return;
                        try {
                          setIsSavingQuoteFormat(true);
                          const common = {
                            product_id: String(product.id),
                            company_name: quoteConfig.header.companyName || '',
                            company_address: quoteConfig.header.companyAddress || '',
                            quotation_prefix: quoteConfig.details.quotePrefix || '',
                            contact_info: quoteConfig.header.contactInfo || '',
                            header_bg_color: quoteConfig.header.headerColor || '#000000',
                            header_text_color: quoteConfig.header.headerTextColor || '#FFFFFF',
                            logo_position: (quoteConfig.header.logoPosition || 'left').toUpperCase(),
                            show_project_details: String(!!quoteConfig.risk.showProjectDetails),
                            show_coverage_types: String(!!quoteConfig.risk.showCoverageTypes),
                            show_coverage_limits: String(!!quoteConfig.risk.showCoverageLimits),
                            show_deductibles: String(!!quoteConfig.risk.showDeductibles),
                            show_contractor_info: String(!!quoteConfig.risk.showContractorInfo),
                            risk_section_title: quoteConfig.risk.riskSectionTitle || 'Risk Details',
                            show_base_premium: String(!!quoteConfig.premium.showBasePremium),
                            show_risk_adjustments: String(!!quoteConfig.premium.showRiskAdjustments),
                            show_fees_charges: String(!!quoteConfig.premium.showFees),
                            show_taxes_vat: String(!!quoteConfig.premium.showTaxes),
                            show_total_premium: String(!!quoteConfig.premium.showTotalPremium),
                            premium_section_title: quoteConfig.premium.premiumSectionTitle || 'Premium Breakdown',
                            premium_currency: quoteConfig.premium.currency || 'AED',
                            show_warranties: String(!!quoteConfig.terms.showWarranties),
                            show_exclusions: String(!!quoteConfig.terms.showExclusions),
                            show_deductible_details: String(!!quoteConfig.terms.showDeductibleDetails),
                            show_policy_conditions: String(!!quoteConfig.terms.showPolicyConditions),
                            terms_section_title: quoteConfig.terms.termsSectionTitle || 'Terms & Conditions',
                            additional_terms_text: quoteConfig.terms.additionalTerms || '',
                            show_signature_block: String(!!quoteConfig.signature.showSignatureBlock),
                            authorized_signatory_name: quoteConfig.signature.authorizedSignatory || '',
                            signatory_title: quoteConfig.signature.signatoryTitle || '',
                            signature_block_text: quoteConfig.signature.signatureText || '',
                            show_footer: String(!!quoteConfig.footer.showFooter),
                            show_general_disclaimer: String(!!quoteConfig.footer.showDisclaimer),
                            general_disclaimer_text: quoteConfig.footer.generalDisclaimer || '',
                            show_regulatory_info: String(!!quoteConfig.footer.showRegulatoryInfo),
                            regulatory_info_text: quoteConfig.footer.regulatoryText || '',
                            footer_bg_color: quoteConfig.footer.footerBgColor || '#FFFFFF',
                            footer_text_color: quoteConfig.footer.footerTextColor || '#000000',
                            logo: quoteLogoFile || null,
                          };
                          if (!quoteFormatId) {
                            const res = await createQuoteFormat(insurerId, product.id as string, common);
                            toast({ title: 'Quote format saved', description: res?.message || 'Created successfully.' });
                          } else {
                            const { product_id, ...patchable } = common;
                            const res = await updateQuoteFormat(insurerId, product.id as string, patchable);
                            toast({ title: 'Quote format updated', description: res?.message || 'Updated successfully.' });
                          }
                          const refreshed = await getQuoteFormat(insurerId, product.id as string);
                          setQuoteFormatId(refreshed?.id ?? null);
                          // also re-map to UI to reflect any normalized values
                          setQuoteConfig(prev => ({
                            ...prev,
                            header: {
                              ...prev.header,
                              companyName: refreshed.company_name || '',
                              companyAddress: refreshed.company_address || '',
                              contactInfo: refreshed.contact_info?.raw || '',
                              headerColor: refreshed.header_bg_color || '#1f2937',
                              headerTextColor: refreshed.header_text_color || '#ffffff',
                              logoPosition: (refreshed.logo_position || 'LEFT').toLowerCase(),
                            },
                            details: { ...prev.details, quotePrefix: refreshed.quotation_prefix || '' },
                            risk: {
                              ...prev.risk,
                              showProjectDetails: refreshed.show_project_details === 1,
                              showCoverageTypes: refreshed.show_coverage_types === 1,
                              showCoverageLimits: refreshed.show_coverage_limits === 1,
                              showDeductibles: refreshed.show_deductibles === 1,
                              showContractorInfo: refreshed.show_contractor_info === 1,
                              riskSectionTitle: refreshed.risk_section_title || 'Risk Details',
                            },
                            premium: {
                              ...prev.premium,
                              currency: refreshed.premium_currency || 'AED',
                              premiumSectionTitle: refreshed.premium_section_title || 'Premium Breakdown',
                              showBasePremium: refreshed.show_base_premium === 1,
                              showRiskAdjustments: refreshed.show_risk_adjustments === 1,
                              showFees: refreshed.show_fees_charges === 1,
                              showTaxes: refreshed.show_taxes_vat === 1,
                              showTotalPremium: refreshed.show_total_premium === 1,
                            },
                            terms: {
                              ...prev.terms,
                              showWarranties: refreshed.show_warranties === 1,
                              showExclusions: refreshed.show_exclusions === 1,
                              showDeductibleDetails: refreshed.show_deductible_details === 1,
                              showPolicyConditions: refreshed.show_policy_conditions === 1,
                              termsSectionTitle: refreshed.terms_section_title || 'Terms & Conditions',
                              additionalTerms: refreshed.additional_terms_text || '',
                            },
                            signature: {
                              ...prev.signature,
                              showSignatureBlock: refreshed.show_signature_block === 1,
                              authorizedSignatory: refreshed.authorized_signatory_name || '',
                              signatoryTitle: refreshed.signatory_title || '',
                              signatureText: refreshed.signature_block_text || '',
                            },
                            footer: {
                              ...prev.footer,
                              showFooter: refreshed.show_footer === 1,
                              showDisclaimer: refreshed.show_general_disclaimer === 1,
                              showRegulatoryInfo: refreshed.show_regulatory_info === 1,
                              generalDisclaimer: refreshed.general_disclaimer_text || '',
                              regulatoryText: refreshed.regulatory_info_text || '',
                              footerBgColor: refreshed.footer_bg_color || '#ffffff',
                              footerTextColor: refreshed.footer_text_color || '#000000',
                            },
                          }));
                        } catch (err: any) {
                          const status = err?.status as number | undefined;
                          const message = err?.message as string | undefined;
                          if (status === 400) toast({ title: 'Bad request', description: message || 'Please review inputs.' });
                          else if (status === 401) toast({ title: 'Unauthorized', description: 'Please log in again.' });
                          else if (status === 403) toast({ title: 'Forbidden', description: "You don't have permission." });
                          else if (status && status >= 500) toast({ title: 'Server error', description: 'Please try again later.' });
                          else toast({ title: 'Error', description: message || 'Failed to save quote format.' });
                        } finally {
                          setIsSavingQuoteFormat(false);
                        }
                      }} size="sm" disabled={isSavingQuoteFormat}>
                      <Save className="w-4 h-4 mr-2" />
                        {isSavingQuoteFormat ? 'Saving...' : 'Save Quote Format'}
                    </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input 
                        id="company-name" 
                        name="company_name"
                        autoComplete="organization" 
                        value={quoteConfig.header.companyName}
                        onChange={(e) => updateQuoteConfig('header', 'companyName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quote-prefix">Quotation Number Prefix</Label>
                      <Input 
                        id="quote-prefix" 
                        name="quotation_prefix"
                        autoComplete="off" 
                        value={quoteConfig.details.quotePrefix}
                        onChange={(e) => updateQuoteConfig('details', 'quotePrefix', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo-upload">Company Logo</Label>
                      <div className="flex gap-2">
                        <Input id="logo-upload" name="logo" type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setQuoteLogoFile(file);
                        }} />
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-address">Company Address</Label>
                      <Textarea 
                        id="company-address" 
                        name="company_address"
                        autoComplete="street-address" 
                        value={quoteConfig.header.companyAddress}
                        onChange={(e) => updateQuoteConfig('header', 'companyAddress', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-info">Contact Information</Label>
                      <Textarea 
                        id="contact-info" 
                        name="contact_info"
                        autoComplete="on" 
                        value={quoteConfig.header.contactInfo}
                        onChange={(e) => updateQuoteConfig('header', 'contactInfo', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="header-color">Header Background Color</Label>
                      <Input 
                        id="header-color" 
                        name="header_bg_color"
                        type="color" 
                        value={quoteConfig.header.headerColor}
                        onChange={(e) => updateQuoteConfig('header', 'headerColor', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-text-color">Header Text Color</Label>
                      <Input 
                        id="header-text-color" 
                        name="header_text_color" 
                        type="color" 
                        value={quoteConfig.header.headerTextColor}
                        onChange={(e) => updateQuoteConfig('header', 'headerTextColor', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo-position">Logo Position</Label>
                      <Select 
                        name="logo_position"
                        value={quoteConfig.header.logoPosition}
                        onValueChange={(value) => updateQuoteConfig('header', 'logoPosition', value)}
                      >
                        <SelectTrigger id="logo-position" aria-label="Logo Position">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Details Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Details Configuration</CardTitle>
                  <CardDescription>Configure how risk information is displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-project-details" 
                        checked={quoteConfig.risk.showProjectDetails}
                        onCheckedChange={(checked) => updateQuoteConfig('risk', 'showProjectDetails', checked)}
                      />
                      <Label htmlFor="show-project-details">Show Project Details (Name, Location, Duration)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-coverage-types" 
                        checked={quoteConfig.risk.showCoverageTypes}
                        onCheckedChange={(checked) => updateQuoteConfig('risk', 'showCoverageTypes', checked)}
                      />
                      <Label htmlFor="show-coverage-types">Show Coverage Types</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-coverage-limits" 
                        checked={quoteConfig.risk.showCoverageLimits}
                        onCheckedChange={(checked) => updateQuoteConfig('risk', 'showCoverageLimits', checked)}
                      />
                      <Label htmlFor="show-coverage-limits">Show Coverage Limits</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-deductibles" 
                        checked={quoteConfig.risk.showDeductibles}
                        onCheckedChange={(checked) => updateQuoteConfig('risk', 'showDeductibles', checked)}
                      />
                      <Label htmlFor="show-deductibles">Show Deductibles</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-contractor-info" 
                        checked={quoteConfig.risk.showContractorInfo}
                        onCheckedChange={(checked) => updateQuoteConfig('risk', 'showContractorInfo', checked)}
                      />
                      <Label htmlFor="show-contractor-info">Show Contractor Information</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="risk-section-title">Risk Section Title</Label>
                    <Input 
                      id="risk-section-title" 
                      value={quoteConfig.risk.riskSectionTitle}
                      onChange={(e) => updateQuoteConfig('risk', 'riskSectionTitle', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Premium Breakdown Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Premium Breakdown Configuration</CardTitle>
                  <CardDescription>Configure how premium calculations are displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={quoteConfig.premium.currency}
                        onValueChange={(value) => updateQuoteConfig('premium', 'currency', value)}
                      >
                        <SelectTrigger id="currency" aria-label="Currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="premium-section-title">Premium Section Title</Label>
                      <Input 
                        id="premium-section-title" 
                        value={quoteConfig.premium.premiumSectionTitle}
                        onChange={(e) => updateQuoteConfig('premium', 'premiumSectionTitle', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-base-premium" 
                        checked={quoteConfig.premium.showBasePremium}
                        onCheckedChange={(checked) => updateQuoteConfig('premium', 'showBasePremium', checked)}
                      />
                      <Label htmlFor="show-base-premium">Show Base Premium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-risk-adjustments" 
                        checked={quoteConfig.premium.showRiskAdjustments}
                        onCheckedChange={(checked) => updateQuoteConfig('premium', 'showRiskAdjustments', checked)}
                      />
                      <Label htmlFor="show-risk-adjustments">Show Risk Adjustments</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-fees" 
                        checked={quoteConfig.premium.showFees}
                        onCheckedChange={(checked) => updateQuoteConfig('premium', 'showFees', checked)}
                      />
                      <Label htmlFor="show-fees">Show Fees & Charges</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-taxes" 
                        checked={quoteConfig.premium.showTaxes}
                        onCheckedChange={(checked) => updateQuoteConfig('premium', 'showTaxes', checked)}
                      />
                      <Label htmlFor="show-taxes">Show Taxes (VAT)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-total-premium" 
                        checked={quoteConfig.premium.showTotalPremium}
                        onCheckedChange={(checked) => updateQuoteConfig('premium', 'showTotalPremium', checked)}
                      />
                      <Label htmlFor="show-total-premium">Show Total Premium</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Terms & Conditions Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions Configuration</CardTitle>
                  <CardDescription>Configure warranties, exclusions, and deductibles display</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-warranties" 
                        checked={quoteConfig.terms.showWarranties}
                        onCheckedChange={(checked) => updateQuoteConfig('terms', 'showWarranties', checked)}
                      />
                      <Label htmlFor="show-warranties">Show Warranties</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-exclusions" 
                        checked={quoteConfig.terms.showExclusions}
                        onCheckedChange={(checked) => updateQuoteConfig('terms', 'showExclusions', checked)}
                      />
                      <Label htmlFor="show-exclusions">Show Exclusions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-deductible-details" 
                        checked={quoteConfig.terms.showDeductibleDetails}
                        onCheckedChange={(checked) => updateQuoteConfig('terms', 'showDeductibleDetails', checked)}
                      />
                      <Label htmlFor="show-deductible-details">Show Deductible Details</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-policy-conditions" 
                        checked={quoteConfig.terms.showPolicyConditions}
                        onCheckedChange={(checked) => updateQuoteConfig('terms', 'showPolicyConditions', checked)}
                      />
                      <Label htmlFor="show-policy-conditions">Show Policy Conditions</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="terms-section-title">Terms Section Title</Label>
                    <Input 
                      id="terms-section-title" 
                      value={quoteConfig.terms.termsSectionTitle}
                      onChange={(e) => updateQuoteConfig('terms', 'termsSectionTitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="additional-terms">Additional Terms Text</Label>
                    <Textarea 
                      id="additional-terms" 
                      value={quoteConfig.terms.additionalTerms}
                      onChange={(e) => updateQuoteConfig('terms', 'additionalTerms', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Signature Block Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Signature Block Configuration</CardTitle>
                  <CardDescription>Configure signature areas and authorization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="show-signature-block" 
                      checked={quoteConfig.signature.showSignatureBlock}
                      onCheckedChange={(checked) => updateQuoteConfig('signature', 'showSignatureBlock', checked)}
                    />
                    <Label htmlFor="show-signature-block">Show Signature Block</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="authorized-signatory">Authorized Signatory Name</Label>
                      <Input 
                        id="authorized-signatory" 
                        value={quoteConfig.signature.authorizedSignatory}
                        onChange={(e) => updateQuoteConfig('signature', 'authorizedSignatory', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signatory-title">Signatory Title</Label>
                      <Input 
                        id="signatory-title" 
                        value={quoteConfig.signature.signatoryTitle}
                        onChange={(e) => updateQuoteConfig('signature', 'signatoryTitle', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signature-text">Signature Block Text</Label>
                    <Textarea 
                      id="signature-text" 
                      value={quoteConfig.signature.signatureText}
                      onChange={(e) => updateQuoteConfig('signature', 'signatureText', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Footer & Disclaimers Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Footer & Disclaimers Configuration</CardTitle>
                  <CardDescription>Configure footer information and legal disclaimers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-footer" 
                        checked={quoteConfig.footer.showFooter}
                        onCheckedChange={(checked) => updateQuoteConfig('footer', 'showFooter', checked)}
                      />
                      <Label htmlFor="show-footer">Show Footer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-disclaimer" 
                        checked={quoteConfig.footer.showDisclaimer}
                        onCheckedChange={(checked) => updateQuoteConfig('footer', 'showDisclaimer', checked)}
                      />
                      <Label htmlFor="show-disclaimer">Show General Disclaimer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="show-regulatory-info" 
                        checked={quoteConfig.footer.showRegulatoryInfo}
                        onCheckedChange={(checked) => updateQuoteConfig('footer', 'showRegulatoryInfo', checked)}
                      />
                      <Label htmlFor="show-regulatory-info">Show Regulatory Information</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="general-disclaimer">General Disclaimer Text</Label>
                    <Textarea 
                      id="general-disclaimer" 
                      value={quoteConfig.footer.generalDisclaimer}
                      onChange={(e) => updateQuoteConfig('footer', 'generalDisclaimer', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regulatory-text">Regulatory Information</Label>
                    <Textarea 
                      id="regulatory-text" 
                      value={quoteConfig.footer.regulatoryText}
                      onChange={(e) => updateQuoteConfig('footer', 'regulatoryText', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="footer-bg-color">Footer Background Color</Label>
                      <Input 
                        id="footer-bg-color" 
                        type="color" 
                        value={quoteConfig.footer.footerBgColor}
                        onChange={(e) => updateQuoteConfig('footer', 'footerBgColor', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer-text-color">Footer Text Color</Label>
                      <Input 
                        id="footer-text-color" 
                        type="color" 
                        value={quoteConfig.footer.footerTextColor}
                        onChange={(e) => updateQuoteConfig('footer', 'footerTextColor', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions relocated to header of Header Configuration card */}

              </>
              )}

            </TabsContent>

            {/* Required Documents Tab */}
            <TabsContent value="required-documents" className="space-y-6">
              {/* show shimmer in place of layout */}
              {isLoadingRequiredDocs ? (
                <div className="space-y-4">
                  {[1,2].map(i => (
                    <div key={i} className="p-4 border rounded-md">
                      <div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
              <>
              {requiredDocsError && (
                <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                  {requiredDocsError}
                </div>
              )}
              
              {/* Documents required for policy to be issued */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Documents required for policy to be issued
                      </CardTitle>
                      <CardDescription>
                        Manage document types required for policy issuance
                      </CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add New
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                          <DialogTitle>Add New Document Type</DialogTitle>
                          <DialogDescription>
                            Create a new document type for policy issuance
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="doc-label">Display Label *</Label>
                            <Input
                              id="doc-label"
                              value={newDocument.label}
                              onChange={(e) => setNewDocument({ ...newDocument, label: e.target.value })}
                              placeholder="e.g., BOQ or Cost Breakdown"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="doc-description">Description</Label>
                            <Input
                              id="doc-description"
                              value={newDocument.description || ""}
                              onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                              placeholder="e.g., Bill of quantities or detailed cost breakdown"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="doc-template">Template (Optional)</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="doc-template"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleTemplateUpload(e)}
                                className="hidden"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('doc-template')?.click()}
                                className="w-full"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                {newDocument.template ? "Change Template" : "Upload Template"}
                              </Button>
                            </div>
                            {newDocument.template && (
                              <div className="flex items-center justify-between bg-muted p-2 rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  <span className="text-sm">{newDocument.template.name}</span>
                                  <span className="text-xs text-muted-foreground">({newDocument.template.size})</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTemplate()}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="doc-required"
                              checked={newDocument.required || false}
                              onCheckedChange={(checked) => setNewDocument({ ...newDocument, required: checked })}
                            />
                            <Label htmlFor="doc-required">Required Document</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="doc-active"
                              checked={newDocument.active}
                              onCheckedChange={(checked) => setNewDocument({ ...newDocument, active: checked })}
                            />
                            <Label htmlFor="doc-active">Active</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={async () => {
                            const insurerId = getInsurerCompanyId();
                            if (!insurerId || !product.id) return;
                            try {
                              setIsLoadingRequiredDocs(true);
                              setRequiredDocsError(null);
                              await createRequiredDocument(insurerId, product.id as string, {
                                product_id: String(product.id),
                                display_order: Number(getNextOrder(requiredDocuments)),
                                display_label: newDocument.label,
                                description: newDocument.description || '',
                                is_required: String(!!newDocument.required),
                                status: newDocument.active ? 'active' : 'inactive',
                                template_file: (newDocument.template && (newDocument.template.file as File)) || null,
                              });
                              const resp = await getRequiredDocuments(insurerId, product.id as string);
                              const list = Array.isArray(resp?.documents) ? resp.documents : [];
                              const mapped = list.map(d => ({
                                id: d.id,
                                label: d.display_label,
                                description: d.description || '',
                                required: !!d.is_required,
                                active: (d.status || '').toLowerCase() === 'active',
                                order: d.display_order,
                                template: d.template_file_url ? { name: d.template_file_url.split('/').pop() || 'template.pdf', size: '—', url: d.template_file_url } : null,
                              }));
                              setRequiredDocuments(mapped as any);
                              toast({ title: 'Document added', description: 'Required document created successfully.' });
                              setIsWordingUploadDialogOpen(false);
                            } catch (err: any) {
                              const status = err?.status as number | undefined;
                              const message = err?.message as string | undefined;
                              if (status === 400) setRequiredDocsError(message || 'Bad request while creating document.');
                              else if (status === 401) setRequiredDocsError('Unauthorized. Please log in again.');
                              else if (status === 403) setRequiredDocsError("You don't have access.");
                              else if (status && status >= 500) setRequiredDocsError('Server error. Please try again later.');
                              else setRequiredDocsError(message || 'Failed to create document.');
                            } finally {
                              setIsLoadingRequiredDocs(false);
                            }
                          }}>
                            Add Document Type
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Display Label</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>Template</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {requiredDocuments
                        .sort((a, b) => a.order - b.order)
                        .map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.order}</TableCell>
                          <TableCell>{doc.label}</TableCell>
                          <TableCell className="max-w-xs truncate">{doc.description}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={doc.required ? "default" : "secondary"}
                            >
                              {doc.required ? "Required" : "Optional"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {doc.template ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => {
                                    toast({
                                      title: "Template Preview",
                                      description: `Template: ${doc.template.name} (${doc.template.size})`,
                                    });
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  {doc.template.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">No template</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={doc.active ? "default" : "secondary"}
                              className="cursor-pointer"
                              onClick={() => toggleDocumentActive(doc.id)}
                            >
                              {doc.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingDocument({ ...doc })}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[525px]">
                                  <DialogHeader>
                                    <DialogTitle>Edit Document Type</DialogTitle>
                                    <DialogDescription>
                                      Update the document type information
                                    </DialogDescription>
                                  </DialogHeader>
                                  {editingDocument && (
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-doc-label">Display Label *</Label>
                                        <Input
                                          id="edit-doc-label"
                                          value={editingDocument.label}
                                          onChange={(e) => setEditingDocument({ ...editingDocument, label: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-doc-description">Description</Label>
                                        <Input
                                          id="edit-doc-description"
                                          value={editingDocument.description || ""}
                                          onChange={(e) => setEditingDocument({ ...editingDocument, description: e.target.value })}
                                        />
                                       </div>
                                       <div className="space-y-2">
                                         <Label htmlFor="edit-doc-template">Template (Optional)</Label>
                                         <div className="flex items-center gap-2">
                                           <Input
                                             id="edit-doc-template"
                                             type="file"
                                             accept=".pdf,.doc,.docx"
                                             onChange={(e) => handleTemplateUpload(e, true)}
                                             className="hidden"
                                           />
                                           <Button
                                             type="button"
                                             variant="outline"
                                             onClick={() => document.getElementById('edit-doc-template')?.click()}
                                             className="w-full"
                                           >
                                             <Upload className="w-4 h-4 mr-2" />
                                             {editingDocument.template ? "Change Template" : "Upload Template"}
                                           </Button>
                                         </div>
                                         {editingDocument.template && (
                                           <div className="flex items-center justify-between bg-muted p-2 rounded">
                                             <div className="flex items-center gap-2">
                                               <FileText className="w-4 h-4" />
                                               <span className="text-sm">{editingDocument.template.name}</span>
                                               <span className="text-xs text-muted-foreground">({editingDocument.template.size})</span>
                                             </div>
                                             <Button
                                               type="button"
                                               variant="ghost"
                                               size="sm"
                                               onClick={() => removeTemplate(true)}
                                             >
                                               <X className="w-4 h-4" />
                                             </Button>
                                           </div>
                                         )}
                                       </div>
                                       <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="edit-doc-required"
                                          checked={editingDocument.required || false}
                                          onCheckedChange={(checked) => setEditingDocument({ ...editingDocument, required: checked })}
                                        />
                                        <Label htmlFor="edit-doc-required">Required Document</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="edit-doc-active"
                                          checked={editingDocument.active}
                                          onCheckedChange={(checked) => setEditingDocument({ ...editingDocument, active: checked })}
                                        />
                                        <Label htmlFor="edit-doc-active">Active</Label>
                                      </div>
                                    </div>
                                  )}
                                  <DialogFooter>
                                    <Button onClick={handleEditDocument}>
                                      Save Changes
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              </>
              )}

            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />

      {/* Quote Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
            <div>
              <DialogTitle>Quote Preview</DialogTitle>
              <DialogDescription>
                Rendered using your current Quote Format selections
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <FileText className="w-4 h-4 mr-2" />
                Print / Save PDF
              </Button>
              <Button size="sm" onClick={() => setIsPreviewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>

          {/* A4 styled preview body */}
          <div className="bg-muted/20 p-4">
            <div className="mx-auto bg-white shadow-sm border w-full max-w-[794px]" style={{ minHeight: '1122px' }}>
              {/* Header */}
              <div
                className="px-8 py-6 flex items-center justify-between"
                style={{ background: quoteConfig.header.headerColor, color: quoteConfig.header.headerTextColor }}
              >
                <div className="flex-1">
                  <h1 className="text-2xl font-semibold leading-tight">
                    {quoteConfig.header.companyName || 'Company Name'}
                  </h1>
                  <p className="opacity-90 text-sm whitespace-pre-line">
                    {quoteConfig.header.companyAddress || 'Company Address'}
                  </p>
                </div>
                <div className="w-28 h-12 flex items-center justify-center border border-white/30 rounded ml-6">
                  <span className="text-xs opacity-90">Logo</span>
                </div>
              </div>

              {/* Quotation Meta */}
              <div className="px-8 py-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Quotation Prefix</p>
                    <p className="font-medium text-sm">{quoteConfig.details.quotePrefix || '—'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium text-sm whitespace-pre-line max-w-[300px]">
                      {quoteConfig.header.contactInfo || 'Phone: —\nEmail: —'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Details */}
              {quoteConfig.risk.showProjectDetails || quoteConfig.risk.showCoverageTypes || quoteConfig.risk.showCoverageLimits || quoteConfig.risk.showDeductibles || quoteConfig.risk.showContractorInfo ? (
                <div className="px-8 pb-2">
                  <h2 className="text-lg font-semibold mb-3">{quoteConfig.risk.riskSectionTitle || 'Risk Details'}</h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {quoteConfig.risk.showProjectDetails && (
                      <div className="p-3 rounded border bg-card">Project details will appear here</div>
                    )}
                    {quoteConfig.risk.showCoverageTypes && (
                      <div className="p-3 rounded border bg-card">Coverage types will appear here</div>
                    )}
                    {quoteConfig.risk.showCoverageLimits && (
                      <div className="p-3 rounded border bg-card">Coverage limits summary</div>
                    )}
                    {quoteConfig.risk.showDeductibles && (
                      <div className="p-3 rounded border bg-card">Deductibles information</div>
                    )}
                    {quoteConfig.risk.showContractorInfo && (
                      <div className="p-3 rounded border bg-card">Contractor information</div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Premium Breakdown */}
              <div className="px-8 py-4">
                <h2 className="text-lg font-semibold mb-3">{quoteConfig.premium.premiumSectionTitle || 'Premium Breakdown'}</h2>
                <div className="overflow-hidden rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2">Item</th>
                        <th className="text-right px-4 py-2">Amount ({quoteConfig.premium.currency || 'AED'})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteConfig.premium.showBasePremium && (
                        <tr className="border-t">
                          <td className="px-4 py-2">Base Premium</td>
                          <td className="px-4 py-2 text-right">—</td>
                        </tr>
                      )}
                      {quoteConfig.premium.showRiskAdjustments && (
                        <tr className="border-t">
                          <td className="px-4 py-2">Risk Adjustments</td>
                          <td className="px-4 py-2 text-right">—</td>
                        </tr>
                      )}
                      {quoteConfig.premium.showFees && (
                        <tr className="border-t">
                          <td className="px-4 py-2">Fees & Charges</td>
                          <td className="px-4 py-2 text-right">—</td>
                        </tr>
                      )}
                      {quoteConfig.premium.showTaxes && (
                        <tr className="border-t">
                          <td className="px-4 py-2">VAT</td>
                          <td className="px-4 py-2 text-right">—</td>
                        </tr>
                      )}
                      {quoteConfig.premium.showTotalPremium && (
                        <tr className="border-t font-medium">
                          <td className="px-4 py-2">Total Premium</td>
                          <td className="px-4 py-2 text-right">—</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms & Conditions */}
              {(quoteConfig.terms.showWarranties || quoteConfig.terms.showExclusions || quoteConfig.terms.showDeductibleDetails || quoteConfig.terms.showPolicyConditions) && (
                <div className="px-8 py-2 space-y-3">
                  <h2 className="text-lg font-semibold">{quoteConfig.terms.termsSectionTitle || 'Terms & Conditions'}</h2>
                  {quoteConfig.terms.showWarranties && (
                    <div>
                      <h3 className="font-medium">Warranties</h3>
                      <p className="text-sm text-muted-foreground">As per policy.</p>
                    </div>
                  )}
                  {quoteConfig.terms.showExclusions && (
                    <div>
                      <h3 className="font-medium">Exclusions</h3>
                      <p className="text-sm text-muted-foreground">As per policy.</p>
                    </div>
                  )}
                  {quoteConfig.terms.showDeductibleDetails && (
                    <div>
                      <h3 className="font-medium">Deductible Details</h3>
                      <p className="text-sm text-muted-foreground">As per policy.</p>
                    </div>
                  )}
                  {quoteConfig.terms.showPolicyConditions && (
                    <div>
                      <h3 className="font-medium">Policy Conditions</h3>
                      <p className="text-sm text-muted-foreground">As per policy.</p>
                    </div>
                  )}
                  {quoteConfig.terms.additionalTerms && (
                    <div>
                      <h3 className="font-medium">Additional Terms</h3>
                      <p className="text-sm whitespace-pre-line">{quoteConfig.terms.additionalTerms}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Signature */}
              {quoteConfig.signature.showSignatureBlock && (
                <div className="px-8 py-6">
                  <h2 className="text-lg font-semibold mb-2">Authorisation</h2>
                  <p className="text-sm whitespace-pre-line mb-4">{quoteConfig.signature.signatureText || '—'}</p>
                  <div className="flex items-center justify-between max-w-xl">
                    <div>
                      <p className="font-medium">{quoteConfig.signature.authorizedSignatory || 'Authorized Signatory'}</p>
                      <p className="text-sm text-muted-foreground">{quoteConfig.signature.signatoryTitle || 'Title'}</p>
                    </div>
                    <div className="w-40 h-12 border rounded flex items-center justify-center text-xs text-muted-foreground">Stamp/Signature</div>
                  </div>
                </div>
              )}

              {/* Footer */}
              {quoteConfig.footer.showFooter && (
                <div className="px-8 py-6 border-t" style={{ background: quoteConfig.footer.footerBgColor, color: quoteConfig.footer.footerTextColor }}>
                  {quoteConfig.footer.showDisclaimer && (
                    <p className="text-xs whitespace-pre-line mb-2">
                      {quoteConfig.footer.generalDisclaimer || 'General disclaimer text'}
                    </p>
                  )}
                  {quoteConfig.footer.showRegulatoryInfo && (
                    <p className="text-xs whitespace-pre-line">
                      {quoteConfig.footer.regulatoryText || 'Regulatory information'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Configuration Confirmation Dialog */}
      <AlertDialog open={isConfirmSaveDialogOpen} onOpenChange={setIsConfirmSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save All Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save the current configuration? This will overwrite any previously saved settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Save All Config
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* Delete/Remove Confirmation Dialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDialog.action} className="bg-red-600 hover:bg-red-700">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Network debug dialog removed per request */}
    </div>
  );
};

export default SingleProductConfig;
