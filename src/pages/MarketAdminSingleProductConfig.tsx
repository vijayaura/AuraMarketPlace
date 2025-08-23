import { useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Save, Calculator, FileText, Upload, Eye, Plus, Minus, Image, ChevronDown, ChevronRight, Trash2, X, MapPin, Edit, DollarSign, TrendingUp, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { getActiveProjectTypes, getActiveConstructionTypes, getSubProjectTypesByProjectType } from "@/lib/masters-data";
import { getActiveCountries, getRegionsByCountry, getZonesByRegion } from "@/lib/location-data";
import { ClausePricingCard } from "@/components/product-config/ClausePricingCard";
import { SubProjectBaseRates } from "@/components/pricing/SubProjectBaseRates";
import { ProjectTypeBaseRates } from "@/components/pricing/ProjectTypeBaseRates";

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

const MarketAdminSingleProductConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { insurerId, productId } = useParams();
  
  // Market admin context - always use market admin path
  const basePath = `/market-admin/insurer/${insurerId}`;
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  const activeProjectTypes = getActiveProjectTypes();
  const activeConstructionTypes = getActiveConstructionTypes();
  const activeCountries = getActiveCountries();

  // Mock product data
  const product = {
    id: productId,
    name: productId === "1" ? "CAR Insurance Standard" : "CAR Insurance Premium",
    code: productId === "1" ? "CAR-STD-001" : "CAR-PRM-002"
  };

  // Initialize base rates from masters data
  const initializeBaseRates = () => {
    const rates: Record<string, number> = {};
    activeProjectTypes.forEach(type => {
      rates[type.value] = type.baseRate;
    });
    return rates;
  };

  // Initialize sub project types as individual entries
  const initializeSubProjectEntries = () => {
    const entries: Array<{
      projectType: string;
      subProjectType: string;
      size: string;
      pricingType: string;
      baseRate: number;
      quoteOption: string;
    }> = [];
    
    activeProjectTypes.forEach(type => {
      const subTypes = getSubProjectTypesByProjectType(type.id);
      subTypes.forEach(subType => {
        entries.push({
          projectType: type.value,
          subProjectType: subType.label,
          size: '0-10',
          pricingType: 'percentage',
          baseRate: type.baseRate,
          quoteOption: 'quote'
        });
      });
    });
    
    return entries;
  };

  // State for geographic selection
  const [selectedCountries, setSelectedCountries] = useState<number[]>([1]); // UAE by default
  const [selectedRegions, setSelectedRegions] = useState<number[]>([1]); // Dubai by default
  const [availableRegions, setAvailableRegions] = useState(() => getRegionsByCountry(1));
  const [availableZones, setAvailableZones] = useState(() => getZonesByRegion(1));

  // Handle geographic selection changes
  const handleCountryChange = (countryIds: number[]) => {
    setSelectedCountries(countryIds);
    const regions = countryIds.flatMap(countryId => getRegionsByCountry(countryId));
    setAvailableRegions(regions);
    updateQuoteConfig('details', 'countries', countryIds);
    updateQuoteConfig('details', 'regions', []);
    updateQuoteConfig('details', 'zones', []);
    setSelectedRegions([]);
    setAvailableZones([]);
  };

  const handleRegionChange = (regionIds: number[]) => {
    setSelectedRegions(regionIds);
    const zones = regionIds.flatMap(regionId => getZonesByRegion(regionId));
    setAvailableZones(zones);
    updateQuoteConfig('details', 'regions', regionIds);
    updateQuoteConfig('details', 'zones', []);
  };

  const [uploadedWordings, setUploadedWordings] = useState([
    { id: 1, name: "Standard CAR Policy Wording v2.1", uploadDate: "2024-01-15", size: "245 KB", active: true },
    { id: 2, name: "Enhanced Coverage Wording", uploadDate: "2024-01-10", size: "189 KB", active: false }
  ]);
  const [activePricingTab, setActivePricingTab] = useState("base-rates");
  const [isNewWordingDialogOpen, setIsNewWordingDialogOpen] = useState(false);
  const [newWordingName, setNewWordingName] = useState("");
  const [isEditClauseDialogOpen, setIsEditClauseDialogOpen] = useState(false);
  const [selectedClause, setSelectedClause] = useState<any>(null);
  const [isAddClauseDialogOpen, setIsAddClauseDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
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

  // Mock data for clauses, exclusions, and warranties
  const [clausesData, setClausesData] = useState([
    { 
      code: "MRe 001", 
      title: "SRCC Coverage", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is hereby agreed and understood that this Policy is extended to cover loss of or damage to the insured property directly caused by:\n\nStrikers, locked-out workers, or persons taking part in labour disturbances, riots, or civil commotions;\n\nThe action of any lawfully constituted authority in suppressing or attempting to suppress any such disturbances or minimizing the consequences of such disturbances;\n\nMalicious acts committed by any person, whether or not such act is committed in connection with a disturbance of the public peace;\n\nprovided that such loss or damage is not otherwise excluded under this Policy.\n\nHowever, the insurers shall not be liable for:\n\nLoss or damage arising out of or in connection with war, invasion, act of foreign enemy, hostilities or warlike operations (whether war be declared or not), civil war, mutiny, insurrection, rebellion, revolution, military or usurped power, or any act of terrorism.\n\nConsequential loss of any kind or description.\n\nSubject otherwise to the terms, conditions, and exclusions of the Policy.",
      purposeDescription: "Coverage for strikes, riots, civil commotions and malicious damage"
    },
    { 
      code: "MRe 002", 
      title: "Cross Liability", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is hereby agreed and understood that, subject to the limits of indemnity stated in the Policy and subject otherwise to the terms, exclusions, provisions and conditions of the Policy, where the insured comprises more than one party, the insurance afforded by this Policy shall apply in the same manner and to the same extent as if individual insurance contracts had been issued to each such party.\n\nHowever, the total liability of the Insurer shall not exceed the limits of indemnity stated in the Schedule, regardless of the number of insured parties.",
      purposeDescription: "Cross liability coverage for multi-party construction projects"
    },
    { 
      code: "MRe 003", 
      title: "Maintenance Visits", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is hereby agreed and understood that this Policy covers maintenance visits and inspections conducted during the policy period. All maintenance activities must be carried out in accordance with manufacturer specifications and industry best practices.\n\nThe Insurer reserves the right to inspect the insured property at reasonable intervals to ensure compliance with maintenance requirements.",
      purposeDescription: "Coverage for maintenance activities and inspections"
    },
    { code: "MRe 004", title: "Extended Maintenance", type: "Clause", show: "Mandatory", purposeDescription: "Extended maintenance coverage for defects liability period" },
    { code: "MRe 005", title: "Time Schedule Condition", type: "Clause", show: "Optional", purposeDescription: "Links insurance coverage to construction schedule adherence" },
    { code: "MRe 006", title: "Overtime/Night Work/Express Freight", type: "Clause", show: "Optional", purposeDescription: "Coverage for expedited repair costs" },
    { code: "MRe 007", title: "Airfreight Expenses", type: "Clause", show: "Optional", purposeDescription: "Premium coverage for urgent airfreight delivery" },
    { code: "MRe 008", title: "Structures in Earthquake Zones Warranty", type: "Clause", show: "Optional", purposeDescription: "Earthquake coverage warranty for compliant structures" },
    { code: "MRe 009", title: "Earthquake Clause", type: "Exclusion", show: "Optional", purposeDescription: "Exclusion of earthquake-related damage" },
    { code: "MRe 010", title: "Flood And Inundation Clause", type: "Exclusion", show: "Optional", purposeDescription: "Exclusion of flood and water damage" },
    { code: "MRe 011", title: "Serial Losses Clause", type: "Clause", show: "Optional", purposeDescription: "Coverage for multiple related losses" },
    { code: "MRe 012", title: "Windstorm Or Wind Related Water Damage", type: "Exclusion", show: "Optional", purposeDescription: "Exclusion of wind and storm damage" },
    { code: "MRe 013", title: "Property In Off-Site Storage Clause", type: "Warranty", show: "Optional", purposeDescription: "Coverage for materials stored off-site" }
  ]);

  const [quoteConfig, setQuoteConfig] = useState({
    header: {
      companyName: "Emirates Insurance Company",
      companyAddress: "P.O. Box 3766, Dubai, UAE",
      contactInfo: "Phone: +971 4 373 8726\nEmail: info@emirates.com\nWebsite: www.emirates.com",
      headerColor: "#1f2937",
      headerTextColor: "#ffffff",
      logoPosition: "left"
    },
    details: {
      quotePrefix: "EIC-CAR-",
      dateFormat: "DD/MM/YYYY",
      validityDays: "30",
      geographicalScope: "United Arab Emirates",
      countries: [1], // Array of country IDs
      regions: [1], // Array of region IDs 
      zones: [1], // Array of zone IDs
      backdateWindow: "30",
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
      additionalTerms: "This insurance is subject to the terms, conditions, and exclusions of the policy wording. All claims must be reported within 7 days of occurrence."
    },
    signature: {
      showSignatureBlock: true,
      authorizedSignatory: "Ahmed Al Mansouri",
      signatoryTitle: "Senior Underwriting Manager",
      signatureText: "This quotation is issued on behalf of Emirates Insurance Company by the undersigned authorized representative."
    },
    footer: {
      showFooter: true,
      showDisclaimer: true,
      showRegulatoryInfo: true,
      generalDisclaimer: "This quotation is valid for 30 days from the date of issue. Terms and conditions apply. Premium rates are subject to underwriting approval.",
      regulatoryText: "Emirates Insurance Company is regulated by the Insurance Authority of UAE. Registration No: 123456789. Licensed to conduct general insurance business in the UAE.",
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
        residential: 1.0,
        commercial: 1.2,
        infrastructure: 1.5,
      },
      durationLoadings: {
        lessThan12: 0,
        between12And18: 0.02,
        between18And24: 0.05,
        moreThan24: 0.10,
      },
      locationHazardLoadings: {
        low: 0,
        moderate: 0.10,
        high: 0.25,
      },
    },
    // Contractor Risk Factors
    contractorRisk: {
      experienceDiscounts: {
        lessThan2: 0.20,
        between2And5: 0.10,
        between5And10: 0,
        moreThan10: -0.10,
      },
      safetyRecordAdjustments: {
        poor: 0.15,
        average: 0,
        good: -0.05,
        excellent: -0.10,
      },
      subcontractorLoadings: {
        none: 0,
        limited: 0.05,
        moderate: 0.10,
        heavy: 0.15,
      },
    },
    // Coverage Options
    coverageOptions: {
      tplLimits: {
        basic: 1.0,
        standard: 1.1,
        enhanced: 1.2,
        premium: 1.3,
      },
      maintenanceExtension: {
        none: 0,
        sixMonths: 0.05,
        twelveMonths: 0.10,
        eighteenMonths: 0.15,
      },
    },
    // Deductible Adjustments
    deductibleAdjustments: {
      low: 0,
      standard: -0.05,
      high: -0.10,
      veryHigh: -0.15,
    },
    // Policy Limits
    limits: {
      minimumPremium: 25000,
      maximumCover: 50000000,
    },
    // Clauses Pricing - now derived from configured CEWs
    clausesPricing: clausesData.map((clause, index) => ({
      id: index + 1,
      code: clause.code,
      name: clause.title,
      enabled: clause.show === "Mandatory" ? true : false, // Mandatory always enabled
      isMandatory: clause.show === "Mandatory",
      pricingType: (clause.type === "Clause" ? "percentage" : "amount") as "percentage" | "amount",
      pricingValue: clause.type === "Clause" ? 2.5 : 500, // Default 2.5% for clauses, AED 500 for others
      variableOptions: [
        {
          id: 1,
          label: clause.show === "Mandatory" ? "Standard Rate" : "Base Option",
          limits: clause.show === "Mandatory" ? "All Coverage" : "Standard Coverage",
          type: (clause.type === "Clause" ? "percentage" : "amount") as "percentage" | "amount",
          value: clause.show === "Mandatory" 
            ? (clause.type === "Clause" ? [2, 3.5, 1.5][index] || 2 : [1500, 2500, 800][Math.floor(index/2)] || 1500)
            : (clause.type === "Clause" ? 5 : 1000)
        }
      ]
    })),
  });

  const getInsurerName = (id: string | undefined) => {
    const insurerNames: { [key: string]: string } = {
      'emirates-insurance': 'Emirates Insurance',
      'axa-gulf': 'AXA Gulf',
      'oman-insurance': 'Oman Insurance',
      'dubai-insurance': 'Dubai Insurance'
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

  const saveConfiguration = () => {
    showConfirmDialog(
      {
        title: "Save Configuration",
        description: `Are you sure you want to save the configuration for ${product.name}?`,
        confirmText: "Save Configuration"
      },
      () => {
        toast({
          title: "Configuration Saved",
          description: `Product configuration for ${product.name} has been successfully saved.`,
        });
      }
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newWording = {
        id: uploadedWordings.length + 1,
        name: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${Math.round(file.size / 1024)} KB`,
        active: true
      };
      setUploadedWordings([...uploadedWordings, newWording]);
      toast({
        title: "Document Uploaded",
        description: `${file.name} has been successfully uploaded.`,
      });
    }
  };

  const updateQuoteConfig = (section: string, field: string, value: any) => {
    setQuoteConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const updateBaseRate = (projectType: string, value: number) => {
    setRatingConfig(prev => ({
      ...prev,
      baseRates: {
        ...prev.baseRates,
        [projectType]: value,
      },
    }));
  };

  const updateProjectTypeQuoteOption = (projectType: string, option: string) => {
    setRatingConfig(prev => ({
      ...prev,
      projectTypeQuoteOptions: {
        ...prev.projectTypeQuoteOptions,
        [projectType]: option,
      },
    }));
  };

  const updateSubProjectEntry = (index: number, field: string, value: string | number) => {
    setRatingConfig(prev => ({
      ...prev,
      subProjectEntries: prev.subProjectEntries.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const updateProjectRiskFactor = (category: string, key: string, value: number) => {
    setRatingConfig(prev => ({
      ...prev,
      projectRisk: {
        ...prev.projectRisk,
        [category]: {
          ...prev.projectRisk[category as keyof typeof prev.projectRisk],
          [key]: value,
        },
      },
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

  const updateCoverageOption = (category: string, key: string, value: number) => {
    setRatingConfig(prev => ({
      ...prev,
      coverageOptions: {
        ...prev.coverageOptions,
        [category]: {
          ...prev.coverageOptions[category as keyof typeof prev.coverageOptions],
          [key]: value,
        },
      },
    }));
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

  const updateDeductibleAdjustment = (key: string, value: number) => {
    setRatingConfig(prev => ({
      ...prev,
      deductibleAdjustments: {
        ...prev.deductibleAdjustments,
        [key]: value,
      },
    }));
  };

  const updateClausePricing = (id: number, updates: any) => {
    setRatingConfig(prev => ({
      ...prev,
      clausesPricing: prev.clausesPricing.map(clause =>
        clause.id === id ? { ...clause, ...updates } : clause
      ),
    }));
  };

  const addNewClause = () => {
    if (!newClause.code || !newClause.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const clause = {
      code: newClause.code,
      title: newClause.title,
      type: newClause.type,
      show: newClause.show,
      wording: newClause.wording,
      purposeDescription: newClause.purposeDescription,
      purpose: newClause.purpose
    };
    
    setClausesData(prev => [...prev, clause]);
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
  };

  const showPreview = () => {
    setIsPreviewDialogOpen(true);
  };


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`${basePath}/product-config/products`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{product.name} Configuration</h1>
                <p className="text-sm text-muted-foreground">{product.code}</p>
              </div>
            </div>
            <Button onClick={saveConfiguration}>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="quote-config" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quote-config" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quote Configurator
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
            </TabsList>

            {/* Quote Configurator Tab */}
            <TabsContent value="quote-config" className="space-y-6">
              
              {/* Quote Details Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Quote Details Configuration</CardTitle>
                  <CardDescription>Configure quotation numbering, dates, and validity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quote-prefix">Quotation Number Prefix</Label>
                      <Input 
                        id="quote-prefix" 
                        value={quoteConfig.details.quotePrefix}
                        onChange={(e) => updateQuoteConfig('details', 'quotePrefix', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date-format">Date Format</Label>
                      <Select 
                        value={quoteConfig.details.dateFormat}
                        onValueChange={(value) => updateQuoteConfig('details', 'dateFormat', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="validity-days">Validity Period (Days)</Label>
                      <Input 
                        id="validity-days" 
                        type="number" 
                        value={quoteConfig.details.validityDays}
                        onChange={(e) => updateQuoteConfig('details', 'validityDays', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backdate-window">Backdate Window (Days)</Label>
                      <Select 
                        value={quoteConfig.details.backdateWindow}
                        onValueChange={(value) => updateQuoteConfig('details', 'backdateWindow', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select backdate window" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 days</SelectItem>
                          <SelectItem value="10">10 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Geographic Coverage Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Geographic Coverage
                    </h3>
                    
                    <div className="space-y-6">
                      {/* Countries */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Operating Countries</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                          {activeCountries.map((country) => (
                            <div key={country.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`country-${country.id}`}
                                checked={quoteConfig.details.countries?.includes(country.id)}
                                onCheckedChange={(checked) => {
                                  const currentValue = quoteConfig.details.countries || [];
                                  if (checked) {
                                    const newValue = [...currentValue, country.id];
                                    handleCountryChange(newValue);
                                  } else {
                                    const newValue = currentValue.filter((id) => id !== country.id);
                                    handleCountryChange(newValue);
                                  }
                                }}
                              />
                              <label
                                htmlFor={`country-${country.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {country.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Regions */}
                      {availableRegions.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Operating Regions</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto">
                            {availableRegions.map((region) => {
                              const country = activeCountries.find(c => c.id === region.countryId);
                              return (
                                <div key={region.id} className="flex items-start space-x-2">
                                  <Checkbox
                                    id={`region-${region.id}`}
                                    checked={quoteConfig.details.regions?.includes(region.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = quoteConfig.details.regions || [];
                                      let newValue: number[];
                                      if (checked) {
                                        newValue = [...currentValue, region.id];
                                      } else {
                                        newValue = currentValue.filter((id) => id !== region.id);
                                      }
                                      handleRegionChange(newValue);
                                    }}
                                    className="mt-1"
                                  />
                                  <div className="flex flex-col">
                                    <label
                                      htmlFor={`region-${region.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {region.label}
                                    </label>
                                    <span className="text-xs text-muted-foreground mt-1">
                                      {country?.label}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Zones */}
                      {availableZones.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Operating Zones</Label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg max-h-48 overflow-y-auto">
                            {availableZones.map((zone) => {
                              const region = availableRegions.find(r => r.id === zone.regionId);
                              return (
                                <div key={zone.id} className="flex items-start space-x-2">
                                  <Checkbox
                                    id={`zone-${zone.id}`}
                                    checked={quoteConfig.details.zones?.includes(zone.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValue = quoteConfig.details.zones || [];
                                      if (checked) {
                                        updateQuoteConfig('details', 'zones', [...currentValue, zone.id]);
                                      } else {
                                        updateQuoteConfig('details', 'zones', currentValue.filter((id) => id !== zone.id));
                                      }
                                    }}
                                    className="mt-1"
                                  />
                                  <div className="flex flex-col">
                                    <label
                                      htmlFor={`zone-${zone.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {zone.label}
                                    </label>
                                    <span className="text-xs text-muted-foreground mt-1">
                                      {region?.label}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* Pricing Configurator Tab */}
            <TabsContent value="pricing" className="space-y-6">
              {/* Algorithm Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Pricing Configurator
                  </CardTitle>
                  <CardDescription>
                    Configure rating algorithms and pricing factors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 h-[calc(100vh-16rem)]">
                    {/* Sidebar Navigation */}
                    <div className="w-80 bg-muted/30 rounded-lg p-4 overflow-y-auto">
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
                          { id: "regions", label: "Regions", icon: MapPin, count: availableRegions.length },
                          { id: "zones", label: "Zones", icon: MapPin, count: availableZones.length },
                          { id: "role-types", label: "Role Types", icon: Shield, count: 5 },
                          { id: "contract-types", label: "Contract Types", icon: FileText, count: 4 },
                          { id: "soil-types", label: "Soil Types", icon: TrendingUp, count: 6 },
                          { id: "subcontractor-types", label: "Subcontractor Types", icon: Shield, count: 8 },
                          { id: "consultant-roles", label: "Consultant Roles", icon: Shield, count: 7 },
                          { id: "security-types", label: "Security Types", icon: Shield, count: 5 },
                          { id: "area-types", label: "Area Types", icon: MapPin, count: 6 },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <Button
                              key={item.id}
                              variant={activePricingTab === item.id ? "default" : "ghost"}
                              className="w-full justify-start text-left h-auto p-3"
                              onClick={() => setActivePricingTab(item.id)}
                            >
                              <div className="flex items-center gap-3 w-full">
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-sm">{item.label}</div>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {item.count}
                                </Badge>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden">
                      {activePricingTab === "base-rates" && (
                        <div className="space-y-6 h-full overflow-y-auto">
                          <SubProjectBaseRates
                            projectTypes={activeProjectTypes}
                            subProjectEntries={ratingConfig.subProjectEntries}
                            onSubProjectEntryChange={updateSubProjectEntry}
                            onProjectTypeToggle={toggleProjectType}
                            selectedProjectTypes={selectedProjectTypes}
                          />
                        </div>
                      )}

                      {activePricingTab === "project-risk" && (
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle>Project Risk Factors</CardTitle>
                            <CardDescription>Configure risk adjustments based on project characteristics</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Project Type Multipliers</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Residential</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={ratingConfig.projectRisk.projectTypeMultipliers.residential}
                                      onChange={(e) => updateProjectRiskFactor('projectTypeMultipliers', 'residential', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Commercial</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={ratingConfig.projectRisk.projectTypeMultipliers.commercial}
                                      onChange={(e) => updateProjectRiskFactor('projectTypeMultipliers', 'commercial', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Infrastructure</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={ratingConfig.projectRisk.projectTypeMultipliers.infrastructure}
                                      onChange={(e) => updateProjectRiskFactor('projectTypeMultipliers', 'infrastructure', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Duration Loadings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Less than 12 months</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.projectRisk.durationLoadings.lessThan12}
                                      onChange={(e) => updateProjectRiskFactor('durationLoadings', 'lessThan12', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">12-18 months</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.projectRisk.durationLoadings.between12And18}
                                      onChange={(e) => updateProjectRiskFactor('durationLoadings', 'between12And18', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">18-24 months</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.projectRisk.durationLoadings.between18And24}
                                      onChange={(e) => updateProjectRiskFactor('durationLoadings', 'between18And24', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">More than 24 months</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.projectRisk.durationLoadings.moreThan24}
                                      onChange={(e) => updateProjectRiskFactor('durationLoadings', 'moreThan24', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Location Hazard Loadings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Low Risk</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.projectRisk.locationHazardLoadings.low}
                                      onChange={(e) => updateProjectRiskFactor('locationHazardLoadings', 'low', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Moderate Risk</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.projectRisk.locationHazardLoadings.moderate}
                                      onChange={(e) => updateProjectRiskFactor('locationHazardLoadings', 'moderate', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">High Risk</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.projectRisk.locationHazardLoadings.high}
                                      onChange={(e) => updateProjectRiskFactor('locationHazardLoadings', 'high', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </CardContent>
                               </Card>
                             </div>
                           </CardContent>
                         </Card>
                       )}

                      {activePricingTab === "contractor-risk" && (
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle>Contractor Risk Factors</CardTitle>
                            <CardDescription>Configure risk adjustments based on contractor profile</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Experience Discounts</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Less than 2 years</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.experienceDiscounts.lessThan2}
                                      onChange={(e) => updateContractorRiskFactor('experienceDiscounts', 'lessThan2', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">2-5 years</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.experienceDiscounts.between2And5}
                                      onChange={(e) => updateContractorRiskFactor('experienceDiscounts', 'between2And5', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">5-10 years</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.experienceDiscounts.between5And10}
                                      onChange={(e) => updateContractorRiskFactor('experienceDiscounts', 'between5And10', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">More than 10 years</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.experienceDiscounts.moreThan10}
                                      onChange={(e) => updateContractorRiskFactor('experienceDiscounts', 'moreThan10', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Safety Record Adjustments</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Poor</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.safetyRecordAdjustments.poor}
                                      onChange={(e) => updateContractorRiskFactor('safetyRecordAdjustments', 'poor', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Average</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.safetyRecordAdjustments.average}
                                      onChange={(e) => updateContractorRiskFactor('safetyRecordAdjustments', 'average', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Good</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.safetyRecordAdjustments.good}
                                      onChange={(e) => updateContractorRiskFactor('safetyRecordAdjustments', 'good', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Excellent</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.safetyRecordAdjustments.excellent}
                                      onChange={(e) => updateContractorRiskFactor('safetyRecordAdjustments', 'excellent', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Subcontractor Loadings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">None</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.subcontractorLoadings.none}
                                      onChange={(e) => updateContractorRiskFactor('subcontractorLoadings', 'none', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Limited</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.subcontractorLoadings.limited}
                                      onChange={(e) => updateContractorRiskFactor('subcontractorLoadings', 'limited', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Moderate</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.subcontractorLoadings.moderate}
                                      onChange={(e) => updateContractorRiskFactor('subcontractorLoadings', 'moderate', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Heavy</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.contractorRisk.subcontractorLoadings.heavy}
                                      onChange={(e) => updateContractorRiskFactor('subcontractorLoadings', 'heavy', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                             </div>
                           </CardContent>
                         </Card>
                       )}

                      {activePricingTab === "coverage-options" && (
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle>Coverage Options & Extensions</CardTitle>
                            <CardDescription>Configure additional coverage options and their premium rates</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">TPL Limits</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Basic</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={ratingConfig.coverageOptions.tplLimits.basic}
                                      onChange={(e) => updateCoverageOption('tplLimits', 'basic', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Standard</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={ratingConfig.coverageOptions.tplLimits.standard}
                                      onChange={(e) => updateCoverageOption('tplLimits', 'standard', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Enhanced</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={ratingConfig.coverageOptions.tplLimits.enhanced}
                                      onChange={(e) => updateCoverageOption('tplLimits', 'enhanced', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Premium</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      value={ratingConfig.coverageOptions.tplLimits.premium}
                                      onChange={(e) => updateCoverageOption('tplLimits', 'premium', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Maintenance Extension</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">None</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.coverageOptions.maintenanceExtension.none}
                                      onChange={(e) => updateCoverageOption('maintenanceExtension', 'none', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">6 Months</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.coverageOptions.maintenanceExtension.sixMonths}
                                      onChange={(e) => updateCoverageOption('maintenanceExtension', 'sixMonths', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">12 Months</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.coverageOptions.maintenanceExtension.twelveMonths}
                                      onChange={(e) => updateCoverageOption('maintenanceExtension', 'twelveMonths', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">18 Months</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.coverageOptions.maintenanceExtension.eighteenMonths}
                                      onChange={(e) => updateCoverageOption('maintenanceExtension', 'eighteenMonths', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {activePricingTab === "limits-deductibles" && (
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle>Policy Limits & Deductibles</CardTitle>
                            <CardDescription>Configure policy limits and deductible adjustments</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Policy Limits</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Minimum Premium (AED)</Label>
                                    <Input
                                      type="number"
                                      value={ratingConfig.limits.minimumPremium}
                                      onChange={(e) => updateLimits('minimumPremium', parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Maximum Cover (AED)</Label>
                                    <Input
                                      type="number"
                                      value={ratingConfig.limits.maximumCover}
                                      onChange={(e) => updateLimits('maximumCover', parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Deductible Adjustments</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Low Deductible</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.deductibleAdjustments.low}
                                      onChange={(e) => updateDeductibleAdjustment('low', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Standard Deductible</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.deductibleAdjustments.standard}
                                      onChange={(e) => updateDeductibleAdjustment('standard', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">High Deductible</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.deductibleAdjustments.high}
                                      onChange={(e) => updateDeductibleAdjustment('high', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Very High Deductible</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={ratingConfig.deductibleAdjustments.veryHigh}
                                      onChange={(e) => updateDeductibleAdjustment('veryHigh', parseFloat(e.target.value) || 0)}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {activePricingTab === "clause-pricing" && (
                        <div className="space-y-6 h-full overflow-y-auto">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {ratingConfig.clausesPricing.map((clause) => (
                              <ClausePricingCard
                                key={clause.id}
                                clause={clause}
                                onToggle={() => updateClausePricing(clause.id, { enabled: !clause.enabled })}
                                onUpdateVariable={(clauseId, optionId, field, value) => {
                                  const updatedClause = { ...clause };
                                  updatedClause.variableOptions = updatedClause.variableOptions.map(option =>
                                    option.id === optionId ? { ...option, [field]: value } : option
                                  );
                                  updateClausePricing(clauseId, updatedClause);
                                }}
                                onAddVariable={() => {
                                  const newOption = {
                                    id: clause.variableOptions.length + 1,
                                    label: `Option ${clause.variableOptions.length + 1}`,
                                    limits: "Standard Coverage",
                                    type: clause.pricingType,
                                    value: 0
                                  };
                                  updateClausePricing(clause.id, {
                                    variableOptions: [...clause.variableOptions, newOption]
                                  });
                                }}
                                onRemoveVariable={(clauseId, optionId) => {
                                  updateClausePricing(clauseId, {
                                    variableOptions: clause.variableOptions.filter(option => option.id !== optionId)
                                  });
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {activePricingTab === "construction-types" && (
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle>Construction Types</CardTitle>
                            <CardDescription>Configure pricing for different construction types</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Construction Type</TableHead>
                                  <TableHead>Pricing Type</TableHead>
                                  <TableHead>Base Rate</TableHead>
                                  <TableHead>Quote Options</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {activeConstructionTypes.map((construction) => (
                                  <TableRow key={construction.id}>
                                    <TableCell className="font-medium">{construction.label}</TableCell>
                                    <TableCell>
                                      <Select defaultValue="percentage">
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="percentage">Percentage</SelectItem>
                                          <SelectItem value="fixed">Fixed Rate</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Input type="number" defaultValue="1.5" className="w-24" />
                                    </TableCell>
                                    <TableCell>
                                      <Select defaultValue="quote">
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="quote">Quote</SelectItem>
                                          <SelectItem value="refer">Refer</SelectItem>
                                          <SelectItem value="decline">Decline</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}

                        {activePricingTab === "countries" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Countries</CardTitle>
                              <CardDescription>Configure pricing for different countries</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {activeCountries.map((country) => (
                                    <TableRow key={country.id}>
                                      <TableCell className="font-medium">{country.label}</TableCell>
                                      <TableCell>
                                        <Select defaultValue="percentage">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" defaultValue="1.0" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="refer">Refer</SelectItem>
                                            <SelectItem value="decline">Decline</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}

                        {activePricingTab === "regions" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Regions</CardTitle>
                              <CardDescription>Configure pricing for different regions</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {availableRegions.map((region) => (
                                    <TableRow key={region.id}>
                                      <TableCell className="font-medium">{region.label}</TableCell>
                                      <TableCell>
                                        <Select defaultValue="percentage">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" defaultValue="1.2" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="refer">Refer</SelectItem>
                                            <SelectItem value="decline">Decline</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}

                        {activePricingTab === "zones" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Zones</CardTitle>
                              <CardDescription>Configure pricing for different zones</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Zone</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {availableZones.map((zone) => (
                                    <TableRow key={zone.id}>
                                      <TableCell className="font-medium">{zone.label}</TableCell>
                                      <TableCell>
                                        <Select defaultValue="percentage">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" defaultValue="0.8" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="refer">Refer</SelectItem>
                                            <SelectItem value="decline">Decline</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}

                        {activePricingTab === "role-types" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Role Types</CardTitle>
                              <CardDescription>Configure pricing for different role types</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Role Type</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {['Project Manager', 'Site Engineer', 'Safety Officer', 'Quality Controller', 'Surveyor'].map((role, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{role}</TableCell>
                                      <TableCell>
                                        <Select defaultValue="percentage">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" defaultValue="1.5" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="refer">Refer</SelectItem>
                                            <SelectItem value="decline">Decline</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}

                        {activePricingTab === "contract-types" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Contract Types</CardTitle>
                              <CardDescription>Configure pricing for different contract types</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Contract Type</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {['Fixed Price', 'Cost Plus', 'Time & Materials', 'Design Build'].map((contract, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{contract}</TableCell>
                                      <TableCell>
                                        <Select defaultValue="percentage">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" defaultValue="2.0" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="refer">Refer</SelectItem>
                                            <SelectItem value="decline">Decline</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}

                        {activePricingTab === "soil-types" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Soil Types</CardTitle>
                              <CardDescription>Configure pricing for different soil types</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Soil Type</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {['Clay', 'Sand', 'Rock', 'Mixed', 'Soft Soil', 'Hard Soil'].map((soil, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{soil}</TableCell>
                                      <TableCell>
                                        <Select defaultValue="percentage">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" defaultValue="1.8" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="refer">Refer</SelectItem>
                                            <SelectItem value="decline">Decline</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}

                        {activePricingTab === "subcontractor-types" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Subcontractor Types</CardTitle>
                              <CardDescription>Configure pricing for different subcontractor types</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Subcontractor Type</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {['Electrical', 'Plumbing', 'HVAC', 'Mechanical', 'Structural', 'Finishing', 'Landscaping', 'Security'].map((subcontractor, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{subcontractor}</TableCell>
                                      <TableCell>
                                        <Select defaultValue="percentage">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" defaultValue="1.3" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="refer">Refer</SelectItem>
                                            <SelectItem value="decline">Decline</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}

                        {activePricingTab === "consultant-roles" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Consultant Roles</CardTitle>
                              <CardDescription>Configure pricing for different consultant roles</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Consultant Role</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {['Architect', 'Structural Engineer', 'MEP Engineer', 'Quantity Surveyor', 'Project Manager', 'Environmental Consultant', 'Safety Consultant'].map((consultant, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{consultant}</TableCell>
                                      <TableCell>
                                        <Select defaultValue="percentage">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" defaultValue="1.1" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="refer">Refer</SelectItem>
                                            <SelectItem value="decline">Decline</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}

                        {activePricingTab === "security-types" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Security Types</CardTitle>
                              <CardDescription>Configure pricing for different security types</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Security Type</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {['Basic Security', 'Enhanced Security', 'High Security', 'Premium Security', 'Government Security'].map((security, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{security}</TableCell>
                                      <TableCell>
                                        <Select defaultValue="percentage">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" defaultValue="1.6" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="refer">Refer</SelectItem>
                                            <SelectItem value="decline">Decline</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}

                        {activePricingTab === "area-types" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Area Types</CardTitle>
                              <CardDescription>Configure pricing for different area types</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Area Type</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Base Rate</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {['Urban', 'Suburban', 'Rural', 'Industrial', 'Coastal', 'Desert'].map((area, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{area}</TableCell>
                                      <TableCell>
                                        <Select defaultValue="percentage">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Rate</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" defaultValue="1.4" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Quote</SelectItem>
                                            <SelectItem value="refer">Refer</SelectItem>
                                            <SelectItem value="decline">Decline</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )}
                     </div>
                   </div>
                 </CardContent>
               </Card>

            </TabsContent>

            {/* CEWs Configuration Tab */}
            <TabsContent value="cews" className="space-y-6">
              
              {/* Clauses, Exclusions, and Warranties Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Clauses, Exclusions, and Warranties Section</CardTitle>
                      <CardDescription>
                        Configure specific clauses, exclusions, and warranty requirements
                      </CardDescription>
                    </div>
                    <Button onClick={() => setIsAddClauseDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Clause
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
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
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => {
                                   const firstOption = pricingItem?.variableOptions[0];
                                   setSelectedClause({...item, pricingType: firstOption?.type || "percentage", pricingValue: firstOption?.value || 0});
                                   setIsEditClauseDialogOpen(true);
                                 }}
                               >
                                 View/Edit
                               </Button>
                             </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

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
                        <Button onClick={() => {
                          setClausesData(prev => prev.map(c => 
                            c.code === selectedClause.code ? selectedClause : c
                          ));
                          setIsEditClauseDialogOpen(false);
                          toast({
                            title: "Clause Updated",
                            description: "The clause has been successfully updated.",
                          });
                        }}>
                          Save Changes
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
              
              {/* Policy Wording Documents */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Policy Wording Documents</CardTitle>
                      <CardDescription>Upload and manage policy wording documents</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="wording-upload"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('wording-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Uploaded Wordings List */}
                  <div>
                    <h4 className="font-medium mb-4">Uploaded Policy Wordings</h4>
                    <div className="space-y-3">
                      {uploadedWordings.map((wording) => (
                        <div key={wording.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{wording.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Uploaded: {wording.uploadDate} • Size: {wording.size}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`wording-${wording.id}`} className="text-sm">
                                {wording.active ? 'Active' : 'Inactive'}
                              </Label>
                              <Switch
                                id={`wording-${wording.id}`}
                                checked={wording.active}
                                onCheckedChange={(checked) => {
                                  setUploadedWordings(prev => 
                                    prev.map(w => 
                                      w.id === wording.id ? { ...w, active: checked } : w
                                    )
                                  );
                                }}
                              />
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ConfirmDialog />
      <Footer />
    </div>
  );
};

export default MarketAdminSingleProductConfig;
