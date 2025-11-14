import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2, Upload, FileSpreadsheet, Calculator, Settings, X, CheckCircle2, Type, Hash, Calendar, CheckSquare, List, ChevronDown, Edit, FileText, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// Types
interface RatingParameter {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "dropdown" | "date" | "checkbox" | "multiselect";
  options?: string[];
  isMasterData?: boolean; // Whether this parameter is linked to master data
  masterDataTable?: string; // Master data table name if applicable
  pricingOption?: "value-based" | "range-based" | "risk-level"; // Single select
  pricingTypes?: ("Percentage" | "Fixed Amount" | "Per Mille")[]; // Multiple pricing types can be selected
  decisions?: ("Quote" | "No Quote" | "Refer to UW")[]; // Multiple decisions can be selected
  riskLevels?: ("Low" | "Medium" | "High" | "Very High")[]; // Risk levels when pricingOption is "risk-level"
}

interface ValueBasedRate {
  id: string;
  parameterId: string;
  parameterValue: string;
  rate: number;
  rateType: "percentage" | "fixed";
}

interface RangeBasedRate {
  id: string;
  parameterId: string;
  minValue: number;
  maxValue: number;
  rate: number;
  rateType: "percentage" | "fixed";
}

interface MultiSelectRate {
  id: string;
  parameterIds: string[];
  parameterValues: Record<string, string>;
  rate: number;
  rateType: "percentage" | "fixed";
}

interface RateTable {
  id: string;
  name: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
}

interface FormulaStep {
  id: string;
  type: "field" | "operator" | "number" | "percentage";
  value: string;
}

const RatingConfigurator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const productName = searchParams.get("productName") || "Product";
  const productVersion = searchParams.get("productVersion") || "";

  // Get initial rating parameters based on product
  const getInitialRatingParameters = (): RatingParameter[] => {
    if (productName === "Directors & Officers Liability Insurance" && productVersion === "1.0") {
      return [
        { id: "do_param1", name: "annualTurnover", label: "Annual Turnover (AED)", type: "number" },
        { id: "do_param2", name: "positiveOperatingIncome", label: "Positive Operating Income", type: "checkbox" },
        { id: "do_param3", name: "breachOfDebtCovenants", label: "Breach of Debt Covenants", type: "checkbox" },
        { id: "do_param4", name: "qualifiedAuditOpinion", label: "Qualified Audit Opinion", type: "checkbox" },
        { id: "do_param5", name: "listedOnExchange", label: "Listed on Exchange", type: "checkbox" },
        { id: "do_param6", name: "adrSpacInvolvement", label: "ADR/SPAC Involvement", type: "checkbox" },
        { id: "do_param7", name: "assetsInUSA", label: "% Assets in USA", type: "number" },
        { id: "do_param8", name: "industryType", label: "Industry Type", type: "dropdown", options: ["Professional Services", "Healthcare", "Technology", "Financial Services", "Real Estate / Construction", "Manufacturing / Trade", "Public Sector"], isMasterData: true, masterDataTable: "industry_types" },
        { id: "do_param9", name: "regulatedByFinancialBody", label: "Regulated by Financial Body", type: "checkbox" },
        { id: "do_param10", name: "claimsIn5Years", label: "Claims in 5 Years", type: "dropdown", options: ["0", "1", "2+"] },
        { id: "do_param11", name: "awarenessOfPotentialClaims", label: "Awareness of Potential Claims", type: "checkbox" },
        { id: "do_param12", name: "numberOfDirectors", label: "No. of Directors", type: "dropdown", options: ["<5", "5-10", ">10"] },
        { id: "do_param13", name: "yearsOfOperation", label: "Years of Operation", type: "dropdown", options: ["<3", "3-10", ">10"] },
        { id: "do_param14", name: "riskManagementQuality", label: "Risk Management Quality", type: "dropdown", options: ["Strong", "Average", "Weak"] },
        { id: "do_param15", name: "underwriterDiscount", label: "Underwriter Discount (%)", type: "number" },
        { id: "do_param16", name: "sumInsured", label: "Sum Insured (AED)", type: "number" },
        { id: "do_param17", name: "baseRate", label: "Base Rate", type: "number" },
      ];
    }
    // Default CAR parameters
    return [
      { id: "param1", name: "projectType", label: "Project Type", type: "dropdown", options: ["Residential", "Commercial", "Industrial", "Infrastructure", "Mixed Use"], isMasterData: true, masterDataTable: "project_types" },
    { id: "param2", name: "constructionType", label: "Construction Type", type: "dropdown", options: ["New Construction", "Renovation", "Extension", "Demolition", "Mixed"], isMasterData: true, masterDataTable: "construction_types" },
    { id: "param3", name: "projectValue", label: "Project Value (AED)", type: "number" },
    { id: "param4", name: "sumInsured", label: "Sum Insured (AED)", type: "number" },
    { id: "param5", name: "contractWorks", label: "Contract Works (AED)", type: "number" },
    { id: "param6", name: "plantEquipment", label: "Plant & Equipment (AED)", type: "number" },
    { id: "param7", name: "temporaryWorks", label: "Temporary Works (AED)", type: "number" },
    { id: "param8", name: "principalsProperty", label: "Principal's Property (AED)", type: "number" },
    { id: "param9", name: "projectDuration", label: "Project Duration (months)", type: "number" },
    { id: "param10", name: "maintenancePeriod", label: "Maintenance Period (months)", type: "number" },
    { id: "param11", name: "locationHazard", label: "Location Hazard Level", type: "dropdown", options: ["Low", "Moderate", "High", "Very High"], isMasterData: true, masterDataTable: "location_hazards" },
    { id: "param12", name: "contractorExperience", label: "Contractor Experience (years)", type: "number" },
    { id: "param13", name: "subcontractorUsage", label: "Subcontractor Usage", type: "dropdown", options: ["None", "Limited", "Moderate", "Heavy"], isMasterData: true, masterDataTable: "subcontractor_usage" },
    { id: "param14", name: "safetyRecord", label: "Safety Record", type: "dropdown", options: ["Poor", "Average", "Good", "Excellent"], isMasterData: true, masterDataTable: "safety_records" },
    { id: "param15", name: "claimFrequency", label: "Claim Frequency (last 5 years)", type: "number" },
    { id: "param16", name: "claimAmount", label: "Claim Amount Categories (AED)", type: "number" },
    { id: "param17", name: "tplLimit", label: "Third Party Liability Limit (AED)", type: "number" },
    { id: "param18", name: "deductible", label: "Deductible Preference (AED)", type: "number" },
    { id: "param19", name: "nearWaterBody", label: "Near Water Body", type: "checkbox" },
    { id: "param20", name: "floodProneZone", label: "Flood Prone Zone", type: "checkbox" },
    { id: "param21", name: "cityAreaType", label: "City Area Type", type: "dropdown", options: ["City Center", "Suburban", "Industrial", "Remote"], isMasterData: true, masterDataTable: "city_area_types" },
    { id: "param22", name: "soilType", label: "Soil Type", type: "dropdown", options: ["Sandy", "Clay", "Rocky", "Mixed"], isMasterData: true, masterDataTable: "soil_types" },
    ];
  };

  const [ratingParameters, setRatingParameters] = useState<RatingParameter[]>(getInitialRatingParameters());

  const [valueBasedRates, setValueBasedRates] = useState<ValueBasedRate[]>([]);
  const [rangeBasedRates, setRangeBasedRates] = useState<RangeBasedRate[]>([]);
  const [multiSelectRates, setMultiSelectRates] = useState<MultiSelectRate[]>([]);
  const [rateTables, setRateTables] = useState<RateTable[]>([]);
  const [formulaSteps, setFormulaSteps] = useState<FormulaStep[]>([]);
  
  // Selected parameter state
  const [selectedParameter, setSelectedParameter] = useState<RatingParameter | null>(null);
  const [selectedRatingMode, setSelectedRatingMode] = useState<"value-based" | "range-based" | "multi-select" | "csv-upload" | "">("");
  const [requiresCsvUpload, setRequiresCsvUpload] = useState(false);
  
  // Default Rating Parameters
  const [defaultRatingParams, setDefaultRatingParams] = useState({
    baseRate: 0,
    factors: 0,
    minimumPremium: 0,
    maximumPremium: 0,
    brokerMinimumCommission: 0,
    brokerMaximumCommission: 0,
  });

  // Default Rating Parameters with pricing options
  interface DefaultRatingParam {
    id: string;
    name: string;
    label: string;
    value: number;
    selectedRatingParameters?: string[]; // IDs of rating parameters to use
    pricingOption?: "value-based" | "range-based"; // Single select
    pricingTypes?: ("Percentage" | "Fixed Amount" | "Per Mille")[]; // Multiple pricing types can be selected
    decisions?: ("Quote" | "No Quote" | "Refer to UW")[]; // Multiple decisions can be selected
  }

  const [defaultRatingParamsList, setDefaultRatingParamsList] = useState<DefaultRatingParam[]>([
    { id: "baseRate", name: "baseRate", label: "Choose Base Rate Parameters", value: 0 },
    { id: "factors", name: "factors", label: "Choose Factors", value: 0 },
    { id: "minimumPremium", name: "minimumPremium", label: "Minimum Premium (AED)", value: 0 },
    { id: "maximumPremium", name: "maximumPremium", label: "Maximum Premium (AED)", value: 0 },
    { id: "brokerMinimumCommission", name: "brokerMinimumCommission", label: "Broker Minimum Commission (%)", value: 0 },
    { id: "brokerMaximumCommission", name: "brokerMaximumCommission", label: "Broker Maximum Commission (%)", value: 0 },
  ]);

  const [selectedDefaultParam, setSelectedDefaultParam] = useState<DefaultRatingParam | null>(null);

  // CEWs Configuration
  interface CEWField {
    id: string;
    type: "text" | "number" | "dropdown" | "date" | "checkbox" | "file" | "multiselect" | "textarea";
    label: string;
    name: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  }

  interface CEWSection {
    id: string;
    title?: string;
    subtitle?: string;
    fields: CEWField[];
  }

  interface CEWPage {
    id: string;
    title: string;
    subtitle?: string;
    sections: CEWSection[];
  }

  interface CEW {
    id: string;
    title: string;
    description: string;
    code: string;
    formPages?: CEWPage[]; // Form design data
    pricingOption?: "value-based" | "range-based";
    pricingTypes?: ("Percentage" | "Fixed Amount" | "Per Mille")[];
    decisions?: ("Quote" | "No Quote" | "Refer to UW")[];
  }

  const [cewsList, setCewsList] = useState<CEW[]>([]);
  const [selectedCEW, setSelectedCEW] = useState<CEW | null>(null);
  const [currentCEWForm, setCurrentCEWForm] = useState<CEW | null>(null);
  const [cewFormPages, setCewFormPages] = useState<CEWPage[]>([]);
  const [selectedCEWPageId, setSelectedCEWPageId] = useState<string | null>(null);
  const [expandedCEWSections, setExpandedCEWSections] = useState<Set<string>>(new Set());
  
  // CEW Field Configuration Dialog
  const [isCEWFieldDialogOpen, setIsCEWFieldDialogOpen] = useState(false);
  const [cewFieldConfig, setCewFieldConfig] = useState<Partial<CEWField>>({
    type: "text",
    label: "",
    name: "",
    placeholder: "",
    required: false,
  });
  const [selectedCEWFieldId, setSelectedCEWFieldId] = useState<string | null>(null);
  const [selectedCEWSectionId, setSelectedCEWSectionId] = useState<string | null>(null);
  const [cewOptionsInput, setCewOptionsInput] = useState("");

  // Calculations
  const [sumInsuredFormula, setSumInsuredFormula] = useState<FormulaStep[]>([]);
  const [premiumFormula, setPremiumFormula] = useState<FormulaStep[]>([]);
  const [selectedCalculation, setSelectedCalculation] = useState<"sumInsured" | "premium" | null>(null);
  const [percentageChips, setPercentageChips] = useState<Array<{ id: string; value: number }>>([]);
  
  // Master data values (mock data - would be fetched from API)
  const getMasterDataValues = (): Record<string, string[]> => {
    if (productName === "Directors & Officers Liability Insurance" && productVersion === "1.0") {
      return {
        industry_types: ["Professional Services", "Healthcare", "Technology", "Financial Services", "Real Estate / Construction", "Manufacturing / Trade", "Public Sector"],
      };
    }
    // Default CAR master data
    return {
      projectType: ["Residential Building", "Commercial Building", "Industrial Facility", "Infrastructure", "Bridge Construction", "Road Construction", "Shopping Center", "Hospital/Healthcare", "Educational Facility"],
      constructionType: ["New Construction", "Renovation", "Extension", "Demolition", "Mixed"],
      locationHazard: ["Low", "Moderate", "High", "Very High"],
      subcontractorUsage: ["None", "Limited", "Moderate", "Heavy"],
      safetyRecord: ["Poor", "Average", "Good", "Excellent"],
      cityAreaType: ["City Center", "Suburban", "Industrial", "Remote"],
      soilType: ["Sandy", "Clay", "Rocky", "Mixed"],
    };
  };

  const masterDataValues = getMasterDataValues();

  // Dialog states
  const [isValueBasedDialogOpen, setIsValueBasedDialogOpen] = useState(false);
  const [isRangeBasedDialogOpen, setIsRangeBasedDialogOpen] = useState(false);
  const [isMultiSelectDialogOpen, setIsMultiSelectDialogOpen] = useState(false);
  const [isFormulaBuilderOpen, setIsFormulaBuilderOpen] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [playgroundType, setPlaygroundType] = useState<"default" | "proposal" | "cew" | "calculation" | null>(null);
  const [playgroundTestValues, setPlaygroundTestValues] = useState<Record<string, any>>({});
  const [playgroundResult, setPlaygroundResult] = useState<number | null>(null);

  // Form states for dialogs
  const [valueBasedForm, setValueBasedForm] = useState<Partial<ValueBasedRate>>({
    parameterId: "",
    parameterValue: "",
    rate: 0,
    rateType: "percentage",
  });

  const [rangeBasedForm, setRangeBasedForm] = useState<Partial<RangeBasedRate>>({
    parameterId: "",
    minValue: 0,
    maxValue: 0,
    rate: 0,
    rateType: "percentage",
  });

  const [multiSelectForm, setMultiSelectForm] = useState<Partial<MultiSelectRate>>({
    parameterIds: [],
    parameterValues: {},
    rate: 0,
    rateType: "percentage",
  });

  // Formula evaluation function
  const evaluateFormula = (formula: FormulaStep[], testValues: Record<string, any>): number | null => {
    try {
      if (formula.length === 0) return null;

      // Convert formula steps to a string expression
      let expression = "";
      for (const step of formula) {
        if (step.type === "field") {
          const value = testValues[step.value];
          if (value === undefined || value === null || value === "") {
            return null; // Missing required value
          }
          // If it's a string (like dropdown value), try to find numeric equivalent or use 0
          const numValue = typeof value === "number" ? value : (parseFloat(String(value)) || 0);
          expression += numValue;
        } else if (step.type === "operator") {
          expression += " " + step.value + " ";
        } else if (step.type === "number") {
          expression += step.value;
        } else if (step.type === "percentage") {
          // Convert percentage to decimal (e.g., 30% becomes 0.30)
          const percentValue = parseFloat(step.value.replace("%", "").replace(" ", ""));
          if (isNaN(percentValue)) return null;
          expression += (percentValue / 100).toString();
        }
      }

      // Clean up expression (remove extra spaces)
      expression = expression.trim().replace(/\s+/g, " ");

      // Use Function constructor for safe evaluation
      // This allows us to evaluate mathematical expressions like: BaseRate * (1 + 0.45) * (1 - 0.10)
      const result = Function(`"use strict"; return (${expression})`)();
      return typeof result === "number" && !isNaN(result) ? result : null;
    } catch (error) {
      console.error("Formula evaluation error:", error, formula);
      return null;
    }
  };

  const handleAddValueBasedRate = () => {
    if (!valueBasedForm.parameterId || !valueBasedForm.parameterValue || valueBasedForm.rate === undefined) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newRate: ValueBasedRate = {
      id: `vbr_${Date.now()}`,
      parameterId: valueBasedForm.parameterId!,
      parameterValue: valueBasedForm.parameterValue,
      rate: valueBasedForm.rate!,
      rateType: valueBasedForm.rateType || "percentage",
    };

    setValueBasedRates([...valueBasedRates, newRate]);
    setIsValueBasedDialogOpen(false);
    setValueBasedForm({
      parameterId: "",
      parameterValue: "",
      rate: 0,
      rateType: "percentage",
    });

    toast({
      title: "Rate Added",
      description: "Value-based rate has been added successfully.",
    });
  };

  const handleAddRangeBasedRate = () => {
    if (!rangeBasedForm.parameterId || rangeBasedForm.minValue === undefined || rangeBasedForm.maxValue === undefined || rangeBasedForm.rate === undefined) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (rangeBasedForm.minValue! >= rangeBasedForm.maxValue!) {
      toast({
        title: "Validation Error",
        description: "Minimum value must be less than maximum value.",
        variant: "destructive",
      });
      return;
    }

    const newRate: RangeBasedRate = {
      id: `rbr_${Date.now()}`,
      parameterId: rangeBasedForm.parameterId!,
      minValue: rangeBasedForm.minValue!,
      maxValue: rangeBasedForm.maxValue!,
      rate: rangeBasedForm.rate!,
      rateType: rangeBasedForm.rateType || "percentage",
    };

    setRangeBasedRates([...rangeBasedRates, newRate]);
    setIsRangeBasedDialogOpen(false);
    setRangeBasedForm({
      parameterId: "",
      minValue: 0,
      maxValue: 0,
      rate: 0,
      rateType: "percentage",
    });

    toast({
      title: "Rate Added",
      description: "Range-based rate has been added successfully.",
    });
  };

  const handleAddMultiSelectRate = () => {
    if (!multiSelectForm.parameterIds || multiSelectForm.parameterIds.length === 0 || multiSelectForm.rate === undefined) {
      toast({
        title: "Validation Error",
        description: "Please select at least one parameter and set a rate.",
        variant: "destructive",
      });
      return;
    }

    const newRate: MultiSelectRate = {
      id: `msr_${Date.now()}`,
      parameterIds: multiSelectForm.parameterIds!,
      parameterValues: multiSelectForm.parameterValues || {},
      rate: multiSelectForm.rate!,
      rateType: multiSelectForm.rateType || "percentage",
    };

    setMultiSelectRates([...multiSelectRates, newRate]);
    setIsMultiSelectDialogOpen(false);
    setMultiSelectForm({
      parameterIds: [],
      parameterValues: {},
      rate: 0,
      rateType: "percentage",
    });

    toast({
      title: "Rate Added",
      description: "Multi-select rate has been added successfully.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const newTable: RateTable = {
      id: `table_${Date.now()}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      uploadedAt: new Date().toLocaleString(),
    };

    setRateTables([...rateTables, newTable]);
    toast({
      title: "File Uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });
  };

  const getParameterLabel = (parameterId: string) => {
    return ratingParameters.find(p => p.id === parameterId)?.label || parameterId;
  };

  const getParameterOptions = (parameterId: string) => {
    return ratingParameters.find(p => p.id === parameterId)?.options || [];
  };

  // Check if a parameter is configured (has rates defined)
  const isParameterConfigured = (parameterId: string): boolean => {
    const hasValueBased = valueBasedRates.some(r => r.parameterId === parameterId);
    const hasRangeBased = rangeBasedRates.some(r => r.parameterId === parameterId);
    const hasMultiSelect = multiSelectRates.some(r => r.parameterIds.includes(parameterId));
    return hasValueBased || hasRangeBased || hasMultiSelect;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rating Configurator</h1>
            <p className="text-sm text-muted-foreground">
              {productName}{productVersion ? ` - Version ${productVersion}` : ''}
            </p>
          </div>
        </div>
        <Button onClick={() => {
          toast({
            title: "Configuration Saved",
            description: "Rating configuration has been saved successfully.",
          });
        }} className="gap-2">
          <Save className="w-4 h-4" />
          Save Configuration
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 border-r bg-muted/30 overflow-y-auto">
          <div className="p-3 space-y-4">
            {/* Calculations Section */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Calculations</h3>
              <div className="space-y-1.5">
                <Button
                  variant={selectedCalculation === "sumInsured" ? "default" : "outline"}
                  className="w-full justify-start text-xs h-8"
                  onClick={() => {
                    setSelectedCalculation("sumInsured");
                    setSelectedParameter(null);
                    setFormulaSteps([...sumInsuredFormula]);
                  }}
                >
                  <Calculator className="w-3 h-3 mr-2" />
                  Total Sum Insured Calculation
                </Button>
                <Button
                  variant={selectedCalculation === "premium" ? "default" : "outline"}
                  className="w-full justify-start text-xs h-8"
                  onClick={() => {
                    setSelectedCalculation("premium");
                    setSelectedParameter(null);
                    setFormulaSteps([...premiumFormula]);
                  }}
                >
                  <Calculator className="w-3 h-3 mr-2" />
                  Premium Calculation
                </Button>
              </div>
            </div>

            <Separator />

            {/* Default Rating Parameters */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Default Rating Parameters</h3>
              <p className="text-xs text-muted-foreground">
                Click on a parameter to design its rule structure (pricing options and decisions)
              </p>
              <div className="space-y-1.5">
                {defaultRatingParamsList.map((param) => {
                  const isSelected = selectedDefaultParam?.id === param.id;
                  const isConfigured = param.pricingOption !== undefined || (param.decisions && param.decisions.length > 0);
                  return (
                    <div
                      key={param.id}
                      onClick={() => {
                        setSelectedDefaultParam(param);
                        setSelectedCalculation(null);
                        setSelectedParameter(null);
                      }}
                      className={`p-2 border rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : isConfigured
                          ? "bg-green-50 border-green-200 hover:bg-green-100"
                          : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        {isConfigured && (
                          <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs">{param.label}</h4>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* CEWs Configuration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">CEWs Configuration</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCEW: CEW = {
                      id: `cew-${Date.now()}`,
                      title: "",
                      description: "",
                      code: "",
                      formPages: [{
                        id: "page1",
                        title: "Step 1",
                        sections: [{
                          id: "section1",
                          title: "Section 1",
                          fields: []
                        }]
                      }]
                    };
                    setCurrentCEWForm(newCEW);
                    setCewFormPages(newCEW.formPages);
                    setSelectedCEWPageId("page1");
                    setExpandedCEWSections(new Set(["section1"]));
                    setSelectedCEW(newCEW);
                    setSelectedCalculation(null);
                    setSelectedParameter(null);
                    setSelectedDefaultParam(null);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Create and configure CEWs (Clauses, Exclusions, Warranties)
              </p>
              <div className="space-y-1.5">
                {cewsList.map((cew) => {
                  const isSelected = selectedCEW?.id === cew.id;
                  const hasFormDesign = cew.formPages && cew.formPages.length > 0;
                  const isConfigured = cew.pricingOption !== undefined || (cew.pricingTypes && cew.pricingTypes.length > 0) || (cew.decisions && cew.decisions.length > 0);
                  return (
                    <div
                      key={cew.id}
                      onClick={() => {
                        setSelectedCEW(cew);
                        setSelectedCalculation(null);
                        setSelectedParameter(null);
                        setSelectedDefaultParam(null);
                      }}
                      className={`p-2 border rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : (hasFormDesign && isConfigured)
                          ? "bg-green-50 border-green-200 hover:bg-green-100"
                          : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        {(hasFormDesign && isConfigured) && (
                          <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs">{cew.title || "Untitled CEW"}</h4>
                          {cew.code && (
                            <p className="text-xs text-muted-foreground mt-0.5">Code: {cew.code}</p>
                          )}
                          {!hasFormDesign && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">Form design pending</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Proposal Rating Parameters */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Proposal Rating Parameters</h3>
              <p className="text-xs text-muted-foreground">
                Fields from proposal form marked as rating parameters
              </p>
              <div className="space-y-1.5">
                {ratingParameters.map((param) => {
                  const isConfigured = isParameterConfigured(param.id) || param.pricingOption !== undefined || (param.pricingTypes && param.pricingTypes.length > 0) || (param.decisions && param.decisions.length > 0);
                  const isSelected = selectedParameter?.id === param.id;
                  return (
                    <div
                      key={param.id}
                      onClick={() => {
                        setSelectedParameter(param);
                        setSelectedCalculation(null);
                        setSelectedDefaultParam(null);
                      }}
                      className={`p-2 border rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : isConfigured
                          ? "bg-green-50 border-green-200 hover:bg-green-100"
                          : "bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        {isConfigured && (
                          <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs">{param.label}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {param.type}
                            </Badge>
                            {param.isMasterData && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                Master Data
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-auto p-6" style={{
          backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}>
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Parameter Configuration Panel */}
            {selectedParameter && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Configure: {selectedParameter.label}</CardTitle>
                      <CardDescription>{selectedParameter.name}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedParameter(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Master Data Values */}
                  {selectedParameter.isMasterData && masterDataValues[selectedParameter.name] && (
                    <div className="space-y-2">
                      <Label>Master Data Values</Label>
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="text-sm font-medium mb-2">Table: {selectedParameter.masterDataTable}</div>
                        <div className="flex flex-wrap gap-2">
                          {masterDataValues[selectedParameter.name].map((value, index) => (
                            <Badge key={index} variant="outline">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing Option - Single Select */}
                  <div className="space-y-2">
                    <Label>Pricing Option</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select the pricing option for this parameter
                    </p>
                    <Select
                      value={selectedParameter.pricingOption || ""}
                      onValueChange={(value: "value-based" | "range-based" | "risk-level" | "") => {
                        const updated = ratingParameters.map(p =>
                          p.id === selectedParameter.id
                            ? { 
                                ...p, 
                                pricingOption: value === "" ? undefined : value,
                                // Clear risk levels if switching away from risk-level
                                riskLevels: value === "risk-level" ? p.riskLevels : undefined
                              }
                            : p
                        );
                        setRatingParameters(updated);
                        const updatedParam = updated.find(p => p.id === selectedParameter.id);
                        if (updatedParam) {
                          setSelectedParameter(updatedParam);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="value-based">Value-Based</SelectItem>
                        <SelectItem value="range-based">Range-Based</SelectItem>
                        <SelectItem value="risk-level">Risk Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pricing Types - Multi Select */}
                  <div className="space-y-2">
                    <Label>Pricing Types</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select one or more pricing types (multiple selections allowed)
                    </p>
                    <div className="space-y-2">
                      {["Percentage", "Fixed Amount", "Per Mille"].map((pricingType) => {
                        const pricingTypeKey = pricingType as "Percentage" | "Fixed Amount" | "Per Mille";
                        const isSelected = selectedParameter.pricingTypes?.includes(pricingTypeKey) || false;
                        return (
                          <div
                            key={pricingType}
                            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "bg-background hover:bg-muted/50"
                            }`}
                            onClick={() => {
                              const currentTypes = selectedParameter.pricingTypes || [];
                              const updatedTypes = isSelected
                                ? currentTypes.filter(type => type !== pricingTypeKey)
                                : [...currentTypes, pricingTypeKey];
                              const updated = ratingParameters.map(p =>
                                p.id === selectedParameter.id
                                  ? { ...p, pricingTypes: updatedTypes.length > 0 ? updatedTypes : undefined }
                                  : p
                              );
                              setRatingParameters(updated);
                              const updatedParam = updated.find(p => p.id === selectedParameter.id);
                              if (updatedParam) {
                                setSelectedParameter(updatedParam);
                              }
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const currentTypes = selectedParameter.pricingTypes || [];
                                const updatedTypes = checked
                                  ? [...currentTypes, pricingTypeKey]
                                  : currentTypes.filter(type => type !== pricingTypeKey);
                                const updated = ratingParameters.map(p =>
                                  p.id === selectedParameter.id
                                    ? { ...p, pricingTypes: updatedTypes.length > 0 ? updatedTypes : undefined }
                                    : p
                                );
                                setRatingParameters(updated);
                                const updatedParam = updated.find(p => p.id === selectedParameter.id);
                                if (updatedParam) {
                                  setSelectedParameter(updatedParam);
                                }
                              }}
                            />
                            <Label className="cursor-pointer flex-1">{pricingType}</Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Risk Levels - Show when Risk Level pricing option is selected */}
                  {selectedParameter.pricingOption === "risk-level" && (
                    <div className="space-y-2">
                      <Label>Risk Levels</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Select one or more risk levels (multiple selections allowed)
                      </p>
                      <div className="space-y-2">
                        {["Low", "Medium", "High", "Very High"].map((riskLevel) => {
                          const riskLevelKey = riskLevel as "Low" | "Medium" | "High" | "Very High";
                          const isSelected = selectedParameter.riskLevels?.includes(riskLevelKey) || false;
                          return (
                            <div
                              key={riskLevel}
                              className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary/10 border-primary"
                                  : "bg-background hover:bg-muted/50"
                              }`}
                              onClick={() => {
                                const currentLevels = selectedParameter.riskLevels || [];
                                const updatedLevels = isSelected
                                  ? currentLevels.filter(level => level !== riskLevelKey)
                                  : [...currentLevels, riskLevelKey];
                                const updated = ratingParameters.map(p =>
                                  p.id === selectedParameter.id
                                    ? { ...p, riskLevels: updatedLevels.length > 0 ? updatedLevels : undefined }
                                    : p
                                );
                                setRatingParameters(updated);
                                const updatedParam = updated.find(p => p.id === selectedParameter.id);
                                if (updatedParam) {
                                  setSelectedParameter(updatedParam);
                                }
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const currentLevels = selectedParameter.riskLevels || [];
                                  const updatedLevels = checked
                                    ? [...currentLevels, riskLevelKey]
                                    : currentLevels.filter(level => level !== riskLevelKey);
                                  const updated = ratingParameters.map(p =>
                                    p.id === selectedParameter.id
                                      ? { ...p, riskLevels: updatedLevels.length > 0 ? updatedLevels : undefined }
                                      : p
                                  );
                                  setRatingParameters(updated);
                                  const updatedParam = updated.find(p => p.id === selectedParameter.id);
                                  if (updatedParam) {
                                    setSelectedParameter(updatedParam);
                                  }
                                }}
                              />
                              <Label className="cursor-pointer flex-1">{riskLevel}</Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Available Decisions */}
                  <div className="space-y-2">
                    <Label>Available Decisions</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select which decisions will be available for this parameter (multiple selections allowed)
                    </p>
                    <div className="space-y-2">
                      {["Quote", "No Quote", "Refer to UW"].map((decision) => {
                        const decisionKey = decision as "Quote" | "No Quote" | "Refer to UW";
                        const isSelected = selectedParameter.decisions?.includes(decisionKey) || false;
                        return (
                          <div
                            key={decision}
                            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "bg-background hover:bg-muted/50"
                            }`}
                            onClick={() => {
                              const currentDecisions = selectedParameter.decisions || [];
                              const updatedDecisions = isSelected
                                ? currentDecisions.filter(dec => dec !== decisionKey)
                                : [...currentDecisions, decisionKey];
                              const updated = ratingParameters.map(p =>
                                p.id === selectedParameter.id
                                  ? { ...p, decisions: updatedDecisions.length > 0 ? updatedDecisions : undefined }
                                  : p
                              );
                              setRatingParameters(updated);
                              const updatedParam = updated.find(p => p.id === selectedParameter.id);
                              if (updatedParam) {
                                setSelectedParameter(updatedParam);
                              }
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const currentDecisions = selectedParameter.decisions || [];
                                const updatedDecisions = checked
                                  ? [...currentDecisions, decisionKey]
                                  : currentDecisions.filter(dec => dec !== decisionKey);
                                const updated = ratingParameters.map(p =>
                                  p.id === selectedParameter.id
                                    ? { ...p, decisions: updatedDecisions.length > 0 ? updatedDecisions : undefined }
                                    : p
                                );
                                setRatingParameters(updated);
                                const updatedParam = updated.find(p => p.id === selectedParameter.id);
                                if (updatedParam) {
                                  setSelectedParameter(updatedParam);
                                }
                              }}
                            />
                            <Label className="cursor-pointer flex-1">{decision}</Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rule Preview */}
                  {(selectedParameter.pricingOption || (selectedParameter.pricingTypes && selectedParameter.pricingTypes.length > 0) || (selectedParameter.decisions && selectedParameter.decisions.length > 0)) && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label>Rule Design Preview</Label>
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Parameter:</span> {selectedParameter.label}
                          </div>
                          {selectedParameter.pricingOption && (
                            <div>
                              <span className="font-medium">Pricing Option:</span> {
                                selectedParameter.pricingOption === "value-based" ? "Value-Based" :
                                selectedParameter.pricingOption === "range-based" ? "Range-Based" :
                                "Risk Level"
                              }
                            </div>
                          )}
                          {selectedParameter.pricingOption === "risk-level" && selectedParameter.riskLevels && selectedParameter.riskLevels.length > 0 && (
                            <div>
                              <span className="font-medium">Risk Levels:</span> {selectedParameter.riskLevels.join(", ")}
                            </div>
                          )}
                          {selectedParameter.pricingTypes && selectedParameter.pricingTypes.length > 0 && (
                            <div>
                              <span className="font-medium">Pricing Types:</span> {selectedParameter.pricingTypes.join(", ")}
                            </div>
                          )}
                          {selectedParameter.decisions && selectedParameter.decisions.length > 0 && (
                            <div>
                              <span className="font-medium">Available Decisions:</span> {selectedParameter.decisions.join(", ")}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            In the rating configurator, users will be able to configure this parameter using the selected pricing option, pricing types, and decisions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* CEW Configuration */}
            {selectedCEW && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Design CEW Form</CardTitle>
                      <CardDescription>
                        {selectedCEW.title || "New CEW"} - {selectedCEW.code || "No code"}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        // If CEW is new and not saved, remove it. Otherwise just deselect.
                        const existingCEW = cewsList.find(c => c.id === selectedCEW.id);
                        if (!existingCEW) {
                          // New CEW not saved yet, just deselect
                          setSelectedCEW(null);
                          setCurrentCEWForm(null);
                          setCewFormPages([]);
                          setSelectedCEWPageId(null);
                        } else {
                          setSelectedCEW(null);
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Form Builder */}
                  {(() => {
                    const cewPages = selectedCEW.formPages || cewFormPages;
                    const pagesToShow = cewPages.length > 0 ? cewPages : [{
                      id: "page1",
                      title: "Step 1",
                      sections: [{
                        id: "section1",
                        title: "Section 1",
                        fields: []
                      }]
                    }];
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">Form Builder</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedCEW = {
                                ...selectedCEW,
                                formPages: cewFormPages.length > 0 ? cewFormPages : pagesToShow,
                              };
                              const updated = cewsList.find(c => c.id === selectedCEW.id)
                                ? cewsList.map(c => c.id === selectedCEW.id ? updatedCEW : c)
                                : [...cewsList, updatedCEW];
                              setCewsList(updated);
                              setSelectedCEW(updatedCEW);
                              toast({
                                title: "Form Saved",
                                description: "CEW form has been saved successfully.",
                              });
                            }}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Form
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 h-[500px]">
                          {/* Left: Field Types */}
                          <div className="border rounded-lg p-4 overflow-y-auto">
                            <h4 className="font-semibold mb-3">Field Types</h4>
                            <div className="space-y-2">
                              {[
                                { type: "text" as const, label: "Text", icon: Type },
                                { type: "number" as const, label: "Number", icon: Hash },
                                { type: "dropdown" as const, label: "Dropdown", icon: ChevronDown },
                                { type: "date" as const, label: "Date", icon: Calendar },
                                { type: "checkbox" as const, label: "Checkbox", icon: CheckSquare },
                                { type: "file" as const, label: "File Upload", icon: Upload },
                                { type: "multiselect" as const, label: "Multi-Select", icon: List },
                                { type: "textarea" as const, label: "Textarea", icon: FileText },
                              ].map((fieldType) => (
                                <Button
                                  key={fieldType.type}
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => {
                                    const activePages = cewFormPages.length > 0 ? cewFormPages : pagesToShow;
                                    if (!selectedCEWPageId && activePages.length > 0) {
                                      setSelectedCEWPageId(activePages[0].id);
                                    }
                                    const pageId = selectedCEWPageId || activePages[0].id;
                                    const selectedPage = activePages.find(p => p.id === pageId);
                                    if (!selectedPage || selectedPage.sections.length === 0) {
                                      toast({
                                        title: "No Section",
                                        description: "Please ensure there is at least one section in the page.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    const sectionId = selectedPage.sections[0].id;
                                    setSelectedCEWSectionId(sectionId);
                                    setCewFieldConfig({
                                      type: fieldType.type,
                                      label: "",
                                      name: "",
                                      placeholder: "",
                                      required: false,
                                    });
                                    setCewOptionsInput("");
                                    setSelectedCEWFieldId(null);
                                    setIsCEWFieldDialogOpen(true);
                                  }}
                                >
                                  <fieldType.icon className="w-4 h-4 mr-2" />
                                  {fieldType.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Middle: Form Structure */}
                          <div className="border rounded-lg p-4 overflow-y-auto bg-muted/20">
                            <div className="space-y-4">
                              {pagesToShow.map((page) => (
                                <Card key={page.id} className={selectedCEWPageId === page.id ? "border-primary" : ""}>
                                  <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                      <Input
                                        value={page.title}
                                        onChange={(e) => {
                                          const updatedPages = pagesToShow.map(p => 
                                            p.id === page.id ? { ...p, title: e.target.value } : p
                                          );
                                          if (cewFormPages.length > 0) {
                                            setCewFormPages(updatedPages);
                                          } else {
                                            setCewFormPages(updatedPages);
                                            setSelectedCEW({ ...selectedCEW, formPages: updatedPages });
                                          }
                                        }}
                                        className="font-semibold"
                                        placeholder="Page Title"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedCEWPageId(page.id)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    {page.sections.map((section) => (
                                      <div key={section.id} className="mb-4 border rounded p-3">
                                        <Input
                                          value={section.title || ""}
                                          onChange={(e) => {
                                            const updatedPages = pagesToShow.map(p =>
                                              p.id === page.id
                                                ? {
                                                    ...p,
                                                    sections: p.sections.map(s =>
                                                      s.id === section.id ? { ...s, title: e.target.value } : s
                                                    )
                                                  }
                                                : p
                                            );
                                            if (cewFormPages.length > 0) {
                                              setCewFormPages(updatedPages);
                                            } else {
                                              setCewFormPages(updatedPages);
                                              setSelectedCEW({ ...selectedCEW, formPages: updatedPages });
                                            }
                                          }}
                                          placeholder="Section Title"
                                          className="mb-2"
                                        />
                                        <div className="space-y-2">
                                          {section.fields.map((field) => (
                                            <div key={field.id} className="flex items-center justify-between gap-2 p-2 bg-background rounded">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm">{field.label}</span>
                                                <Badge variant="outline">{field.type}</Badge>
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  setSelectedCEWFieldId(field.id);
                                                  setSelectedCEWSectionId(section.id);
                                                  setCewFieldConfig({
                                                    type: field.type,
                                                    label: field.label,
                                                    name: field.name,
                                                    placeholder: field.placeholder,
                                                    required: field.required,
                                                    options: field.options,
                                                  });
                                                  setCewOptionsInput(field.options?.join(", ") || "");
                                                  setIsCEWFieldDialogOpen(true);
                                                }}
                                              >
                                                <Edit className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>

                          {/* Right: Preview */}
                          <div className="border rounded-lg p-4 overflow-y-auto">
                            <h4 className="font-semibold mb-3">Preview</h4>
                            <p className="text-sm text-muted-foreground">
                              Form structure preview
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <Separator />

                  {/* Pricing Option - Single Select */}
                  <div className="space-y-2">
                    <Label>Pricing Option</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select the pricing option for this CEW
                    </p>
                    <Select
                      value={selectedCEW.pricingOption || ""}
                      disabled={!selectedCEW.formPages || selectedCEW.formPages.length === 0}
                      onValueChange={(value: "value-based" | "range-based" | "") => {
                        const updated = cewsList.map(c =>
                          c.id === selectedCEW.id
                            ? { ...c, pricingOption: value === "" ? undefined : value }
                            : c
                        );
                        setCewsList(updated);
                        const updatedCEW = updated.find(c => c.id === selectedCEW.id);
                        if (updatedCEW) {
                          setSelectedCEW(updatedCEW);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="value-based">Value-Based</SelectItem>
                        <SelectItem value="range-based">Range-Based</SelectItem>
                      </SelectContent>
                    </Select>
                    {(!selectedCEW.formPages || selectedCEW.formPages.length === 0) && (
                      <p className="text-xs text-muted-foreground italic">
                        Please design the form first to enable pricing configuration
                      </p>
                    )}
                  </div>

                  {/* Pricing Types - Multi Select */}
                  <div className="space-y-2">
                    <Label>Pricing Types</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select one or more pricing types (multiple selections allowed)
                    </p>
                    <div className="space-y-2">
                      {["Percentage", "Fixed Amount", "Per Mille"].map((pricingType) => {
                        const pricingTypeKey = pricingType as "Percentage" | "Fixed Amount" | "Per Mille";
                        const isSelected = selectedCEW.pricingTypes?.includes(pricingTypeKey) || false;
                        const isDisabled = !selectedCEW.formPages || selectedCEW.formPages.length === 0;
                        return (
                          <div
                            key={pricingType}
                            className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors ${
                              isDisabled
                                ? "bg-muted/30 opacity-50 cursor-not-allowed"
                                : isSelected
                                ? "bg-primary/10 border-primary cursor-pointer"
                                : "bg-background hover:bg-muted/50 cursor-pointer"
                            }`}
                            onClick={() => {
                              if (isDisabled) return;
                              const currentTypes = selectedCEW.pricingTypes || [];
                              const updatedTypes = isSelected
                                ? currentTypes.filter(type => type !== pricingTypeKey)
                                : [...currentTypes, pricingTypeKey];
                              const updated = cewsList.map(c =>
                                c.id === selectedCEW.id
                                  ? { ...c, pricingTypes: updatedTypes.length > 0 ? updatedTypes : undefined }
                                  : c
                              );
                              setCewsList(updated);
                              const updatedCEW = updated.find(c => c.id === selectedCEW.id);
                              if (updatedCEW) {
                                setSelectedCEW(updatedCEW);
                              }
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={(checked) => {
                                if (isDisabled) return;
                                const currentTypes = selectedCEW.pricingTypes || [];
                                const updatedTypes = checked
                                  ? [...currentTypes, pricingTypeKey]
                                  : currentTypes.filter(type => type !== pricingTypeKey);
                                const updated = cewsList.map(c =>
                                  c.id === selectedCEW.id
                                    ? { ...c, pricingTypes: updatedTypes.length > 0 ? updatedTypes : undefined }
                                    : c
                                );
                                setCewsList(updated);
                                const updatedCEW = updated.find(c => c.id === selectedCEW.id);
                                if (updatedCEW) {
                                  setSelectedCEW(updatedCEW);
                                }
                              }}
                            />
                            <Label className="cursor-pointer flex-1">{pricingType}</Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Decisions */}
                  <div className="space-y-2">
                    <Label>Available Decisions</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select which decisions will be available for this CEW (multiple selections allowed)
                    </p>
                    <div className="space-y-2">
                      {["Quote", "No Quote", "Refer to UW"].map((decision) => {
                        const decisionKey = decision as "Quote" | "No Quote" | "Refer to UW";
                        const isSelected = selectedCEW.decisions?.includes(decisionKey) || false;
                        const isDisabled = !selectedCEW.formPages || selectedCEW.formPages.length === 0;
                        return (
                          <div
                            key={decision}
                            className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors ${
                              isDisabled
                                ? "bg-muted/30 opacity-50 cursor-not-allowed"
                                : isSelected
                                ? "bg-primary/10 border-primary cursor-pointer"
                                : "bg-background hover:bg-muted/50 cursor-pointer"
                            }`}
                            onClick={() => {
                              if (isDisabled) return;
                              const currentDecisions = selectedCEW.decisions || [];
                              const updatedDecisions = isSelected
                                ? currentDecisions.filter(dec => dec !== decisionKey)
                                : [...currentDecisions, decisionKey];
                              const updated = cewsList.map(c =>
                                c.id === selectedCEW.id
                                  ? { ...c, decisions: updatedDecisions.length > 0 ? updatedDecisions : undefined }
                                  : c
                              );
                              setCewsList(updated);
                              const updatedCEW = updated.find(c => c.id === selectedCEW.id);
                              if (updatedCEW) {
                                setSelectedCEW(updatedCEW);
                              }
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={(checked) => {
                                if (isDisabled) return;
                                const currentDecisions = selectedCEW.decisions || [];
                                const updatedDecisions = checked
                                  ? [...currentDecisions, decisionKey]
                                  : currentDecisions.filter(dec => dec !== decisionKey);
                                const updated = cewsList.map(c =>
                                  c.id === selectedCEW.id
                                    ? { ...c, decisions: updatedDecisions.length > 0 ? updatedDecisions : undefined }
                                    : c
                                );
                                setCewsList(updated);
                                const updatedCEW = updated.find(c => c.id === selectedCEW.id);
                                if (updatedCEW) {
                                  setSelectedCEW(updatedCEW);
                                }
                              }}
                            />
                            <Label className="cursor-pointer flex-1">{decision}</Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rule Preview */}
                  {(selectedCEW.pricingOption || (selectedCEW.pricingTypes && selectedCEW.pricingTypes.length > 0) || (selectedCEW.decisions && selectedCEW.decisions.length > 0)) && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label>Rule Design Preview</Label>
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">CEW:</span> {selectedCEW.title}
                          </div>
                          {selectedCEW.code && (
                            <div>
                              <span className="font-medium">Code:</span> {selectedCEW.code}
                            </div>
                          )}
                          {selectedCEW.pricingOption && (
                            <div>
                              <span className="font-medium">Pricing Option:</span> {selectedCEW.pricingOption === "value-based" ? "Value-Based" : "Range-Based"}
                            </div>
                          )}
                          {selectedCEW.pricingTypes && selectedCEW.pricingTypes.length > 0 && (
                            <div>
                              <span className="font-medium">Pricing Types:</span> {selectedCEW.pricingTypes.join(", ")}
                            </div>
                          )}
                          {selectedCEW.decisions && selectedCEW.decisions.length > 0 && (
                            <div>
                              <span className="font-medium">Available Decisions:</span> {selectedCEW.decisions.join(", ")}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            In the rating configurator, users will be able to configure this CEW using the selected pricing option, pricing types, and decisions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show configuration for selected parameter or calculation */}
            {!selectedParameter && !selectedCalculation && !selectedDefaultParam && !selectedCEW && (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a parameter, default rating parameter, CEW, or calculation from the left sidebar to configure</p>
              </div>
            )}

            {/* Default Rating Parameter Configuration - Design Rule Builder */}
            {selectedDefaultParam && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Design Rule: {selectedDefaultParam.label}</CardTitle>
                      <CardDescription>Design how this parameter will be configured in the rating configurator</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedDefaultParam(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Rating Parameters Selection */}
                  <div className="space-y-2">
                    <Label>Rating Parameters</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select one or more rating parameters to use for this rule
                    </p>
                    <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-background min-h-[80px]">
                      {ratingParameters.map((param) => {
                        const isSelected = selectedDefaultParam.selectedRatingParameters?.includes(param.id) || false;
                        return (
                          <Badge
                            key={param.id}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary hover:bg-primary/80"
                                : "hover:bg-primary/10 hover:border-primary"
                            }`}
                            onClick={() => {
                              const currentParams = selectedDefaultParam.selectedRatingParameters || [];
                              const updatedParams = isSelected
                                ? currentParams.filter(id => id !== param.id)
                                : [...currentParams, param.id];
                              const updated = defaultRatingParamsList.map(p =>
                                p.id === selectedDefaultParam.id
                                  ? { ...p, selectedRatingParameters: updatedParams.length > 0 ? updatedParams : undefined }
                                  : p
                              );
                              setDefaultRatingParamsList(updated);
                              setSelectedDefaultParam(updated.find(p => p.id === selectedDefaultParam.id) || null);
                            }}
                          >
                            {param.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pricing Option - Single Select */}
                  <div className="space-y-2">
                    <Label>Pricing Option</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select the pricing option for this parameter
                    </p>
                    <Select
                      value={selectedDefaultParam.pricingOption || ""}
                      onValueChange={(value: "value-based" | "range-based" | "") => {
                        const updated = defaultRatingParamsList.map(p =>
                          p.id === selectedDefaultParam.id
                            ? { ...p, pricingOption: value === "" ? undefined : value }
                            : p
                        );
                        setDefaultRatingParamsList(updated);
                        setSelectedDefaultParam(updated.find(p => p.id === selectedDefaultParam.id) || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="value-based">Value-Based</SelectItem>
                        <SelectItem value="range-based">Range-Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pricing Types - Multi Select */}
                  <div className="space-y-2">
                    <Label>Pricing Types</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select one or more pricing types (multiple selections allowed)
                    </p>
                    <div className="space-y-2">
                      {["Percentage", "Fixed Amount", "Per Mille"].map((pricingType) => {
                        const pricingTypeKey = pricingType as "Percentage" | "Fixed Amount" | "Per Mille";
                        const isSelected = selectedDefaultParam.pricingTypes?.includes(pricingTypeKey) || false;
                        return (
                          <div
                            key={pricingType}
                            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "bg-background hover:bg-muted/50"
                            }`}
                            onClick={() => {
                              const currentTypes = selectedDefaultParam.pricingTypes || [];
                              const updatedTypes = isSelected
                                ? currentTypes.filter(type => type !== pricingTypeKey)
                                : [...currentTypes, pricingTypeKey];
                              const updated = defaultRatingParamsList.map(p =>
                                p.id === selectedDefaultParam.id
                                  ? { ...p, pricingTypes: updatedTypes.length > 0 ? updatedTypes : undefined }
                                  : p
                              );
                              setDefaultRatingParamsList(updated);
                              setSelectedDefaultParam(updated.find(p => p.id === selectedDefaultParam.id) || null);
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const currentTypes = selectedDefaultParam.pricingTypes || [];
                                const updatedTypes = checked
                                  ? [...currentTypes, pricingTypeKey]
                                  : currentTypes.filter(type => type !== pricingTypeKey);
                                const updated = defaultRatingParamsList.map(p =>
                                  p.id === selectedDefaultParam.id
                                    ? { ...p, pricingTypes: updatedTypes.length > 0 ? updatedTypes : undefined }
                                    : p
                                );
                                setDefaultRatingParamsList(updated);
                                setSelectedDefaultParam(updated.find(p => p.id === selectedDefaultParam.id) || null);
                              }}
                            />
                            <Label className="cursor-pointer flex-1">{pricingType}</Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Decisions */}
                  <div className="space-y-2">
                    <Label>Available Decisions</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Select which decisions will be available for this parameter (multiple selections allowed)
                    </p>
                    <div className="space-y-2">
                      {["Quote", "No Quote", "Refer to UW"].map((decision) => {
                        const decisionKey = decision as "Quote" | "No Quote" | "Refer to UW";
                        const isSelected = selectedDefaultParam.decisions?.includes(decisionKey) || false;
                        return (
                          <div
                            key={decision}
                            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "bg-background hover:bg-muted/50"
                            }`}
                            onClick={() => {
                              const currentDecisions = selectedDefaultParam.decisions || [];
                              const updatedDecisions = isSelected
                                ? currentDecisions.filter(dec => dec !== decisionKey)
                                : [...currentDecisions, decisionKey];
                              const updated = defaultRatingParamsList.map(p =>
                                p.id === selectedDefaultParam.id
                                  ? { ...p, decisions: updatedDecisions.length > 0 ? updatedDecisions : undefined }
                                  : p
                              );
                              setDefaultRatingParamsList(updated);
                              setSelectedDefaultParam(updated.find(p => p.id === selectedDefaultParam.id) || null);
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const currentDecisions = selectedDefaultParam.decisions || [];
                                const updatedDecisions = checked
                                  ? [...currentDecisions, decisionKey]
                                  : currentDecisions.filter(dec => dec !== decisionKey);
                                const updated = defaultRatingParamsList.map(p =>
                                  p.id === selectedDefaultParam.id
                                    ? { ...p, decisions: updatedDecisions.length > 0 ? updatedDecisions : undefined }
                                    : p
                                );
                                setDefaultRatingParamsList(updated);
                                setSelectedDefaultParam(updated.find(p => p.id === selectedDefaultParam.id) || null);
                              }}
                            />
                            <Label className="cursor-pointer flex-1">{decision}</Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rule Preview */}
                  {(selectedDefaultParam.pricingOption || (selectedDefaultParam.pricingTypes && selectedDefaultParam.pricingTypes.length > 0) || (selectedDefaultParam.decisions && selectedDefaultParam.decisions.length > 0) || (selectedDefaultParam.selectedRatingParameters && selectedDefaultParam.selectedRatingParameters.length > 0)) && (
                    <div className="space-y-2 pt-4 border-t">
                      <Label>Rule Design Preview</Label>
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Parameter:</span> {selectedDefaultParam.label}
                          </div>
                          {selectedDefaultParam.selectedRatingParameters && selectedDefaultParam.selectedRatingParameters.length > 0 && (
                            <div>
                              <span className="font-medium">Selected Rating Parameters:</span>{" "}
                              {selectedDefaultParam.selectedRatingParameters.map(paramId => {
                                const param = ratingParameters.find(p => p.id === paramId);
                                return param?.label;
                              }).filter(Boolean).join(", ")}
                            </div>
                          )}
                          {selectedDefaultParam.pricingOption && (
                            <div>
                              <span className="font-medium">Pricing Option:</span> {selectedDefaultParam.pricingOption === "value-based" ? "Value-Based" : "Range-Based"}
                            </div>
                          )}
                          {selectedDefaultParam.pricingTypes && selectedDefaultParam.pricingTypes.length > 0 && (
                            <div>
                              <span className="font-medium">Pricing Types:</span> {selectedDefaultParam.pricingTypes.join(", ")}
                            </div>
                          )}
                          {selectedDefaultParam.decisions && selectedDefaultParam.decisions.length > 0 && (
                            <div>
                              <span className="font-medium">Available Decisions:</span> {selectedDefaultParam.decisions.join(", ")}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            In the rating configurator, users will be able to configure this parameter using the selected rating parameters, pricing option, pricing types, and decisions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Calculation Configuration */}
            {selectedCalculation && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {selectedCalculation === "sumInsured" ? "Total Sum Insured Calculation" : "Premium Calculation"}
                      </CardTitle>
                      <CardDescription>
                        Build formula for {selectedCalculation === "sumInsured" ? "sum insured" : "premium"} calculation
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                          if (currentFormula.length === 0) {
                            toast({
                              title: "Validation Error",
                              description: "Please build a formula before saving.",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (selectedCalculation === "sumInsured") {
                            setSumInsuredFormula([...currentFormula]);
                          } else {
                            setPremiumFormula([...currentFormula]);
                          }
                          toast({
                            title: "Formula Saved",
                            description: `${selectedCalculation === "sumInsured" ? "Total Sum Insured" : "Premium"} calculation formula has been saved successfully.`,
                          });
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Formula
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                          if (currentFormula.length === 0) {
                            toast({
                              title: "Validation Error",
                              description: "Please build a formula before testing.",
                              variant: "destructive",
                            });
                            return;
                          }
                          setPlaygroundType("calculation");
                          setPlaygroundTestValues({});
                          setPlaygroundResult(null);
                          setIsPlaygroundOpen(true);
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Test Formula
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCalculation(null);
                          setSelectedParameter(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Available Parameters */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Available Parameters</Label>
                    <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-background">
                      {ratingParameters.filter((param) => param.name !== "baseRate" && param.name !== "factors").map((param) => (
                        <Badge
                          key={param.id}
                          variant="outline"
                          className="cursor-move hover:bg-primary/10 hover:border-primary hover:text-primary transition-all text-sm px-3 py-1.5"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("application/json", JSON.stringify({
                              type: "field",
                              value: param.name,
                              label: param.label,
                            }));
                          }}
                        >
                          {param.label}
                        </Badge>
                      ))}
                      {selectedCalculation === "premium" && (
                        <>
                          <Badge
                            variant="outline"
                            className="cursor-move hover:bg-primary/10 hover:border-primary hover:text-primary transition-all text-sm px-3 py-1.5"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/json", JSON.stringify({
                                type: "field",
                                value: "sumOfSelectedCEWs",
                                label: "Sum of Selected CEWs",
                              }));
                            }}
                            onClick={() => {
                              const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                              const newStep: FormulaStep = {
                                id: `step_${Date.now()}_${Math.random()}`,
                                type: "field",
                                value: "sumOfSelectedCEWs",
                              };
                              const newFormula = [...currentFormula, newStep];
                              setFormulaSteps(newFormula);
                              if (selectedCalculation === "sumInsured") {
                                setSumInsuredFormula(newFormula);
                              } else {
                                setPremiumFormula(newFormula);
                              }
                            }}
                          >
                            Sum of Selected CEWs
                          </Badge>
                          <Badge
                            variant="outline"
                            className="cursor-move hover:bg-primary/10 hover:border-primary hover:text-primary transition-all text-sm px-3 py-1.5"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/json", JSON.stringify({
                                type: "field",
                                value: "totalLoading",
                                label: "Total Loading",
                              }));
                            }}
                            onClick={() => {
                              const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                              const newStep: FormulaStep = {
                                id: `step_${Date.now()}_${Math.random()}`,
                                type: "field",
                                value: "totalLoading",
                              };
                              const newFormula = [...currentFormula, newStep];
                              setFormulaSteps(newFormula);
                              if (selectedCalculation === "sumInsured") {
                                setSumInsuredFormula(newFormula);
                              } else {
                                setPremiumFormula(newFormula);
                              }
                            }}
                          >
                            Total Loading
                          </Badge>
                          <Badge
                            variant="outline"
                            className="cursor-move hover:bg-primary/10 hover:border-primary hover:text-primary transition-all text-sm px-3 py-1.5"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/json", JSON.stringify({
                                type: "field",
                                value: "totalDiscount",
                                label: "Total Discount",
                              }));
                            }}
                            onClick={() => {
                              const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                              const newStep: FormulaStep = {
                                id: `step_${Date.now()}_${Math.random()}`,
                                type: "field",
                                value: "totalDiscount",
                              };
                              const newFormula = [...currentFormula, newStep];
                              setFormulaSteps(newFormula);
                              if (selectedCalculation === "sumInsured") {
                                setSumInsuredFormula(newFormula);
                              } else {
                                setPremiumFormula(newFormula);
                              }
                            }}
                          >
                            Total Discount
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Formula Builder and Operators Side by Side */}
                  <div className="grid grid-cols-5 gap-4">
                    {/* Formula Builder */}
                    <div className="col-span-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Formula Builder</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormulaSteps([]);
                            if (selectedCalculation === "sumInsured") {
                              setSumInsuredFormula([]);
                            } else {
                              setPremiumFormula([]);
                            }
                          }}
                        >
                          Clear All
                        </Button>
                      </div>
                      <div
                        className="min-h-[350px] p-6 border-2 border-dashed rounded-lg bg-background transition-colors"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add("border-primary", "bg-primary/5");
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove("border-primary", "bg-primary/5");
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("border-primary", "bg-primary/5");
                          try {
                            const data = JSON.parse(e.dataTransfer.getData("application/json"));
                            const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                            
                            if (data.type === "field") {
                              const newStep: FormulaStep = {
                                id: `step_${Date.now()}_${Math.random()}`,
                                type: "field",
                                value: data.value,
                              };
                              setFormulaSteps([...currentFormula, newStep]);
                              if (selectedCalculation === "sumInsured") {
                                setSumInsuredFormula([...currentFormula, newStep]);
                              } else {
                                setPremiumFormula([...currentFormula, newStep]);
                              }
                            } else if (data.type === "operator") {
                              const newStep: FormulaStep = {
                                id: `step_${Date.now()}_${Math.random()}`,
                                type: "operator",
                                value: data.value,
                              };
                              setFormulaSteps([...currentFormula, newStep]);
                              if (selectedCalculation === "sumInsured") {
                                setSumInsuredFormula([...currentFormula, newStep]);
                              } else {
                                setPremiumFormula([...currentFormula, newStep]);
                              }
                            } else if (data.type === "percentage") {
                              const newStep: FormulaStep = {
                                id: `step_${Date.now()}_${Math.random()}`,
                                type: "percentage",
                                value: data.value,
                              };
                              setFormulaSteps([...currentFormula, newStep]);
                              if (selectedCalculation === "sumInsured") {
                                setSumInsuredFormula([...currentFormula, newStep]);
                              } else {
                                setPremiumFormula([...currentFormula, newStep]);
                              }
                            }
                          } catch (error) {
                            console.error("Error parsing drag data:", error);
                          }
                        }}
                      >
                        {(() => {
                          const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                          if (currentFormula.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                                <Calculator className="w-12 h-12 mb-3 opacity-50" />
                                <p className="text-sm font-medium">Drag and drop to build your formula</p>
                                <p className="text-xs mt-1">Parameters, operators, and percentages from the side</p>
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              {currentFormula.map((step, index) => (
                                <React.Fragment key={step.id}>
                                  {step.type === "field" && (
                                    <Badge 
                                      variant="default"
                                      className="cursor-pointer hover:bg-primary/80 transition-colors text-sm px-3 py-1"
                                      onClick={() => {
                                        const newFormula = currentFormula.filter((_, i) => i !== index);
                                        setFormulaSteps(newFormula);
                                        if (selectedCalculation === "sumInsured") {
                                          setSumInsuredFormula(newFormula);
                                        } else {
                                          setPremiumFormula(newFormula);
                                        }
                                      }}
                                    >
                                      {ratingParameters.find(p => p.name === step.value)?.label || step.value}
                                    </Badge>
                                  )}
                                  {step.type === "operator" && (
                                    <span 
                                      className="font-mono text-2xl text-primary cursor-pointer hover:text-primary/80 transition-colors font-bold"
                                      onClick={() => {
                                        const newFormula = currentFormula.filter((_, i) => i !== index);
                                        setFormulaSteps(newFormula);
                                        if (selectedCalculation === "sumInsured") {
                                          setSumInsuredFormula(newFormula);
                                        } else {
                                          setPremiumFormula(newFormula);
                                        }
                                      }}
                                    >
                                      {step.value}
                                    </span>
                                  )}
                                  {step.type === "number" && (
                                    <Badge
                                      variant="secondary"
                                      className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors font-mono text-sm px-2 py-1"
                                      onClick={() => {
                                        const newValue = prompt("Enter new number value:", step.value);
                                        if (newValue === null) return; // User cancelled
                                        const numValue = parseFloat(newValue);
                                        if (isNaN(numValue)) {
                                          toast({
                                            title: "Invalid Input",
                                            description: "Please enter a valid number.",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        const updatedFormula = currentFormula.map((s, i) => 
                                          i === index ? { ...s, value: String(numValue) } : s
                                        );
                                        setFormulaSteps(updatedFormula);
                                        if (selectedCalculation === "sumInsured") {
                                          setSumInsuredFormula(updatedFormula);
                                        } else {
                                          setPremiumFormula(updatedFormula);
                                        }
                                      }}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        const newFormula = currentFormula.filter((_, i) => i !== index);
                                        setFormulaSteps(newFormula);
                                        if (selectedCalculation === "sumInsured") {
                                          setSumInsuredFormula(newFormula);
                                        } else {
                                          setPremiumFormula(newFormula);
                                        }
                                      }}
                                    >
                                      {step.value}
                                    </Badge>
                                  )}
                                  {step.type === "percentage" && (
                                    <Badge
                                      variant="default"
                                      className="cursor-pointer hover:bg-primary/80 transition-colors font-mono text-sm px-2 py-1"
                                      onClick={() => {
                                        const newValue = prompt("Enter new percentage value (e.g., 30 for 30%):", step.value);
                                        if (newValue === null) return; // User cancelled
                                        const numValue = parseFloat(newValue);
                                        if (isNaN(numValue)) {
                                          toast({
                                            title: "Invalid Input",
                                            description: "Please enter a valid number for percentage.",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        const updatedFormula = currentFormula.map((s, i) => 
                                          i === index ? { ...s, value: String(numValue) } : s
                                        );
                                        setFormulaSteps(updatedFormula);
                                        if (selectedCalculation === "sumInsured") {
                                          setSumInsuredFormula(updatedFormula);
                                        } else {
                                          setPremiumFormula(updatedFormula);
                                        }
                                      }}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        const newFormula = currentFormula.filter((_, i) => i !== index);
                                        setFormulaSteps(newFormula);
                                        if (selectedCalculation === "sumInsured") {
                                          setSumInsuredFormula(newFormula);
                                        } else {
                                          setPremiumFormula(newFormula);
                                        }
                                      }}
                                    >
                                      {step.value}%
                                    </Badge>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Right Sidebar - Operators and Numbers */}
                    <div className="col-span-2 space-y-4">
                      {/* Operators - Compact Grid */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Operators</Label>
                        <div className="grid grid-cols-3 gap-1.5 p-2 border rounded-lg bg-background">
                          {["+", "-", "*", "/", "(", ")"].map((op) => (
                            <Badge
                              key={op}
                              variant="outline"
                              className="cursor-move hover:bg-primary/10 hover:border-primary hover:text-primary transition-all font-mono text-sm px-1.5 py-1 font-bold text-center justify-center"
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("application/json", JSON.stringify({
                                  type: "operator",
                                  value: op,
                                }));
                              }}
                              onClick={() => {
                                const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                                const newStep: FormulaStep = {
                                  id: `step_${Date.now()}_${Math.random()}`,
                                  type: "operator",
                                  value: op,
                                };
                                const newFormula = [...currentFormula, newStep];
                                setFormulaSteps(newFormula);
                                if (selectedCalculation === "sumInsured") {
                                  setSumInsuredFormula(newFormula);
                                } else {
                                  setPremiumFormula(newFormula);
                                }
                              }}
                            >
                              {op}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Numbers Keypad */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Numbers</Label>
                        <div className="space-y-2">
                          {/* Quick Number Buttons */}
                          <div className="grid grid-cols-3 gap-1.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, ".", "%"].map((num) => (
                              <Badge
                                key={num}
                                variant="outline"
                                className="cursor-pointer hover:bg-primary/10 hover:border-primary hover:text-primary transition-all font-mono text-xs px-1.5 py-1 text-center justify-center"
                                onClick={() => {
                                  const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                                  let newStep: FormulaStep;
                                  if (num === "%") {
                                    // For percentage, prompt for value or use default
                                    const percentValue = prompt("Enter percentage value (e.g., 30 for 30%):", "0");
                                    if (percentValue === null) return; // User cancelled
                                    const numValue = parseFloat(percentValue);
                                    if (isNaN(numValue)) {
                                      toast({
                                        title: "Invalid Input",
                                        description: "Please enter a valid number for percentage.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    newStep = {
                                      id: `step_${Date.now()}_${Math.random()}`,
                                      type: "percentage",
                                      value: String(numValue),
                                    };
                                  } else {
                                    newStep = {
                                      id: `step_${Date.now()}_${Math.random()}`,
                                      type: "number",
                                      value: String(num),
                                    };
                                  }
                                  const newFormula = [...currentFormula, newStep];
                                  setFormulaSteps(newFormula);
                                  if (selectedCalculation === "sumInsured") {
                                    setSumInsuredFormula(newFormula);
                                  } else {
                                    setPremiumFormula(newFormula);
                                  }
                                }}
                                draggable
                                onDragStart={(e) => {
                                  if (num === "%") {
                                    e.dataTransfer.setData("application/json", JSON.stringify({
                                      type: "percentage",
                                      value: "0",
                                    }));
                                  } else {
                                    e.dataTransfer.setData("application/json", JSON.stringify({
                                      type: "number",
                                      value: String(num),
                                    }));
                                  }
                                }}
                              >
                                {num}
                              </Badge>
                            ))}
                          </div>
                          {/* Custom Number Input */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Enter Custom Number</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                step="any"
                                placeholder="0"
                                className="text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const value = e.currentTarget.value;
                                    if (value && !isNaN(Number(value))) {
                                      const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                                      const newStep: FormulaStep = {
                                        id: `step_${Date.now()}_${Math.random()}`,
                                        type: "number",
                                        value: value,
                                      };
                                      const newFormula = [...currentFormula, newStep];
                                      setFormulaSteps(newFormula);
                                      if (selectedCalculation === "sumInsured") {
                                        setSumInsuredFormula(newFormula);
                                      } else {
                                        setPremiumFormula(newFormula);
                                      }
                                      e.currentTarget.value = "";
                                    }
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                  const value = input?.value;
                                  if (value && !isNaN(Number(value))) {
                                    const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                                    const newStep: FormulaStep = {
                                      id: `step_${Date.now()}_${Math.random()}`,
                                      type: "number",
                                      value: value,
                                    };
                                    const newFormula = [...currentFormula, newStep];
                                    setFormulaSteps(newFormula);
                                    if (selectedCalculation === "sumInsured") {
                                      setSumInsuredFormula(newFormula);
                                    } else {
                                      setPremiumFormula(newFormula);
                                    }
                                    if (input) input.value = "";
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

      </div>

      {/* Value-Based Rate Dialog */}
      <Dialog open={isValueBasedDialogOpen} onOpenChange={setIsValueBasedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Value-Based Rate</DialogTitle>
            <DialogDescription>
              Define a rate based on a specific parameter value
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parameter *</Label>
              <Select
                value={valueBasedForm.parameterId}
                onValueChange={(value) => {
                  setValueBasedForm({ ...valueBasedForm, parameterId: value, parameterValue: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parameter" />
                </SelectTrigger>
                <SelectContent>
                  {ratingParameters.map((param) => (
                    <SelectItem key={param.id} value={param.id}>
                      {param.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {valueBasedForm.parameterId && (() => {
              const param = ratingParameters.find(p => p.id === valueBasedForm.parameterId);
              if (param?.type === "checkbox") {
                return (
                  <div className="space-y-2">
                    <Label>Value *</Label>
                    <Select
                      value={valueBasedForm.parameterValue}
                      onValueChange={(value) => setValueBasedForm({ ...valueBasedForm, parameterValue: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              if (param?.options && param.options.length > 0) {
                return (
                  <div className="space-y-2">
                    <Label>Value *</Label>
                    <Select
                      value={valueBasedForm.parameterValue}
                      onValueChange={(value) => setValueBasedForm({ ...valueBasedForm, parameterValue: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select value" />
                      </SelectTrigger>
                      <SelectContent>
                        {param.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              return (
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <Input
                    value={valueBasedForm.parameterValue}
                    onChange={(e) => setValueBasedForm({ ...valueBasedForm, parameterValue: e.target.value })}
                    placeholder="Enter value"
                  />
                </div>
              );
            })()}
            <div className="space-y-2">
              <Label>Rate *</Label>
              <Input
                type="number"
                step="0.01"
                value={valueBasedForm.rate}
                onChange={(e) => setValueBasedForm({ ...valueBasedForm, rate: parseFloat(e.target.value) || 0 })}
                placeholder="Enter rate"
              />
            </div>
            <div className="space-y-2">
              <Label>Rate Type *</Label>
              <Select
                value={valueBasedForm.rateType}
                onValueChange={(value: "percentage" | "fixed") => setValueBasedForm({ ...valueBasedForm, rateType: value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsValueBasedDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddValueBasedRate}>Add Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Range-Based Rate Dialog */}
      <Dialog open={isRangeBasedDialogOpen} onOpenChange={setIsRangeBasedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Range-Based Rate</DialogTitle>
            <DialogDescription>
              Define a rate based on a parameter range
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Parameter *</Label>
              <Select
                value={rangeBasedForm.parameterId}
                onValueChange={(value) => setRangeBasedForm({ ...rangeBasedForm, parameterId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parameter" />
                </SelectTrigger>
                <SelectContent>
                  {ratingParameters.filter(p => p.type === "number").map((param) => (
                    <SelectItem key={param.id} value={param.id}>
                      {param.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Value *</Label>
                <Input
                  type="number"
                  value={rangeBasedForm.minValue}
                  onChange={(e) => setRangeBasedForm({ ...rangeBasedForm, minValue: parseFloat(e.target.value) || 0 })}
                  placeholder="Min"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Value *</Label>
                <Input
                  type="number"
                  value={rangeBasedForm.maxValue}
                  onChange={(e) => setRangeBasedForm({ ...rangeBasedForm, maxValue: parseFloat(e.target.value) || 0 })}
                  placeholder="Max"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rate *</Label>
              <Input
                type="number"
                step="0.01"
                value={rangeBasedForm.rate}
                onChange={(e) => setRangeBasedForm({ ...rangeBasedForm, rate: parseFloat(e.target.value) || 0 })}
                placeholder="Enter rate"
              />
            </div>
            <div className="space-y-2">
              <Label>Rate Type *</Label>
              <Select
                value={rangeBasedForm.rateType}
                onValueChange={(value: "percentage" | "fixed") => setRangeBasedForm({ ...rangeBasedForm, rateType: value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRangeBasedDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRangeBasedRate}>Add Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-Select Rate Dialog */}
      <Dialog open={isMultiSelectDialogOpen} onOpenChange={setIsMultiSelectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Multi-Select Rate</DialogTitle>
            <DialogDescription>
              Combine multiple parameters for aggregated rates
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Parameters *</Label>
              <div className="space-y-2">
                {ratingParameters.map((param) => (
                  <div key={param.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`param-${param.id}`}
                      checked={multiSelectForm.parameterIds?.includes(param.id) || false}
                      onChange={(e) => {
                        const currentIds = multiSelectForm.parameterIds || [];
                        if (e.target.checked) {
                          setMultiSelectForm({
                            ...multiSelectForm,
                            parameterIds: [...currentIds, param.id],
                            parameterValues: { ...multiSelectForm.parameterValues, [param.id]: "" },
                          });
                        } else {
                          const newValues = { ...multiSelectForm.parameterValues };
                          delete newValues[param.id];
                          setMultiSelectForm({
                            ...multiSelectForm,
                            parameterIds: currentIds.filter(id => id !== param.id),
                            parameterValues: newValues,
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={`param-${param.id}`} className="text-sm font-medium cursor-pointer">
                      {param.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {multiSelectForm.parameterIds && multiSelectForm.parameterIds.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <Label>Set Values for Selected Parameters</Label>
                {multiSelectForm.parameterIds.map((paramId) => {
                  const param = ratingParameters.find(p => p.id === paramId);
                  if (!param) return null;

                  if (param.options && param.options.length > 0) {
                    return (
                      <div key={paramId} className="space-y-2">
                        <Label>{param.label}</Label>
                        <Select
                          value={multiSelectForm.parameterValues?.[paramId] || ""}
                          onValueChange={(value) => {
                            setMultiSelectForm({
                              ...multiSelectForm,
                              parameterValues: {
                                ...multiSelectForm.parameterValues,
                                [paramId]: value,
                              },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${param.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            {param.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }
                  return (
                    <div key={paramId} className="space-y-2">
                      <Label>{param.label}</Label>
                      <Input
                        value={multiSelectForm.parameterValues?.[paramId] || ""}
                        onChange={(e) => {
                          setMultiSelectForm({
                            ...multiSelectForm,
                            parameterValues: {
                              ...multiSelectForm.parameterValues,
                              [paramId]: e.target.value,
                            },
                          });
                        }}
                        placeholder={`Enter ${param.label}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <div className="space-y-2">
              <Label>Rate *</Label>
              <Input
                type="number"
                step="0.01"
                value={multiSelectForm.rate}
                onChange={(e) => setMultiSelectForm({ ...multiSelectForm, rate: parseFloat(e.target.value) || 0 })}
                placeholder="Enter rate"
              />
            </div>
            <div className="space-y-2">
              <Label>Rate Type *</Label>
              <Select
                value={multiSelectForm.rateType}
                onValueChange={(value: "percentage" | "fixed") => setMultiSelectForm({ ...multiSelectForm, rateType: value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMultiSelectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMultiSelectRate}>Add Rate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formula Builder Dialog */}
      <Dialog open={isFormulaBuilderOpen} onOpenChange={(open) => {
        setIsFormulaBuilderOpen(open);
        if (open) {
          // Load existing formula when opening
          if (selectedCalculation === "sumInsured") {
            setFormulaSteps([...sumInsuredFormula]);
          } else if (selectedCalculation === "premium") {
            setFormulaSteps([...premiumFormula]);
          }
        } else {
          // Clear when closing
          setFormulaSteps([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Formula Builder - {selectedCalculation === "sumInsured" ? "Total Sum Insured Calculation" : selectedCalculation === "premium" ? "Premium Calculation" : "Formula Builder"}
            </DialogTitle>
            <DialogDescription>
              Build custom formulas for {selectedCalculation === "sumInsured" ? "sum insured" : selectedCalculation === "premium" ? "premium" : ""} calculation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Available Fields</Label>
                  <div className="space-y-2 mt-2">
                    {ratingParameters.map((param) => (
                      <Button
                        key={param.id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setFormulaSteps([...formulaSteps, {
                            id: `step_${Date.now()}`,
                            type: "field",
                            value: param.name,
                          }]);
                        }}
                      >
                        {param.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Operators</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {["+", "-", "*", "/"].map((op) => (
                      <Button
                        key={op}
                        variant="outline"
                        onClick={() => {
                          setFormulaSteps([...formulaSteps, {
                            id: `step_${Date.now()}`,
                            type: "operator",
                            value: op,
                          }]);
                        }}
                      >
                        {op}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Formula Preview</Label>
                  <div className="p-4 border rounded-lg bg-muted/30 min-h-[200px] mt-2">
                    {formulaSteps.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Add fields and operators to build your formula</p>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {formulaSteps.map((step, index) => (
                          <React.Fragment key={step.id}>
                            {step.type === "field" && (
                              <Badge variant="default">{step.value}</Badge>
                            )}
                            {step.type === "operator" && (
                              <span className="font-mono text-lg">{step.value}</span>
                            )}
                            {step.type === "number" && (
                              <span className="font-mono">{step.value}</span>
                            )}
                            {step.type === "percentage" && (
                              <span className="font-mono">{step.value}%</span>
                            )}
                            {index < formulaSteps.length - 1 && (
                              <span className="text-muted-foreground">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter number"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        setFormulaSteps([...formulaSteps, {
                          id: `step_${Date.now()}`,
                          type: "number",
                          value: e.currentTarget.value,
                        }]);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setFormulaSteps([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Formula Examples</Label>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Sum Insured = (field1 + field2)</p>
                <p>• Sum Insured = (field1 * 0.5) + field2</p>
                <p>• BasePremium = (SumInsured * Rate) + (Loading - Discount)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsFormulaBuilderOpen(false);
              setFormulaSteps([]);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (formulaSteps.length === 0) {
                toast({
                  title: "Validation Error",
                  description: "Please add at least one step to the formula.",
                  variant: "destructive",
                });
                return;
              }
              
              // Save to appropriate formula based on selected calculation
              if (selectedCalculation === "sumInsured") {
                setSumInsuredFormula(formulaSteps);
                toast({
                  title: "Formula Saved",
                  description: "Total Sum Insured calculation formula has been saved successfully.",
                });
              } else if (selectedCalculation === "premium") {
                setPremiumFormula(formulaSteps);
                toast({
                  title: "Formula Saved",
                  description: "Premium calculation formula has been saved successfully.",
                });
              } else {
                // Default behavior (for backward compatibility)
                toast({
                  title: "Formula Saved",
                  description: "Formula has been saved successfully.",
                });
              }
              
              setIsFormulaBuilderOpen(false);
              setFormulaSteps([]);
            }}>
              Save Formula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CEW Field Configuration Dialog */}
      <Dialog open={isCEWFieldDialogOpen} onOpenChange={setIsCEWFieldDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Field</DialogTitle>
            <DialogDescription>
              Configure the field properties. Field name will be auto-generated from the label.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Field Type (Read-only) */}
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Input
                value={cewFieldConfig.type?.charAt(0).toUpperCase() + cewFieldConfig.type?.slice(1) || ""}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Field Label */}
            <div className="space-y-2">
              <Label>Field Label *</Label>
              <Input
                value={cewFieldConfig.label || ""}
                onChange={(e) => {
                  const label = e.target.value;
                  const name = label.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
                  setCewFieldConfig({
                    ...cewFieldConfig,
                    label,
                    name,
                  });
                }}
                placeholder="Enter field label"
              />
              <p className="text-xs text-muted-foreground">
                Field name: <span className="font-mono">{cewFieldConfig.name || "auto-generated"}</span>
              </p>
            </div>

            {/* Placeholder */}
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={cewFieldConfig.placeholder || ""}
                onChange={(e) => setCewFieldConfig({ ...cewFieldConfig, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>

            {/* Required Field */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cew-required"
                checked={cewFieldConfig.required || false}
                onCheckedChange={(checked) => setCewFieldConfig({ ...cewFieldConfig, required: checked === true })}
              />
              <Label htmlFor="cew-required" className="cursor-pointer">
                Required Field
              </Label>
            </div>

            {/* Options for Dropdown/Multiselect */}
            {(cewFieldConfig.type === "dropdown" || cewFieldConfig.type === "multiselect") && (
              <div className="space-y-2">
                <Label>Options *</Label>
                <Textarea
                  value={cewOptionsInput}
                  onChange={(e) => {
                    setCewOptionsInput(e.target.value);
                    const options = e.target.value
                      .split(",")
                      .map(opt => opt.trim())
                      .filter(opt => opt.length > 0);
                    setCewFieldConfig({ ...cewFieldConfig, options });
                  }}
                  placeholder="Enter options separated by commas (e.g., Option 1, Option 2, Option 3)"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple options with commas
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCEWFieldDialogOpen(false);
                setCewFieldConfig({
                  type: "text",
                  label: "",
                  name: "",
                  placeholder: "",
                  required: false,
                });
                setCewOptionsInput("");
                setSelectedCEWFieldId(null);
                setSelectedCEWSectionId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!cewFieldConfig.label?.trim()) {
                  toast({
                    title: "Validation Error",
                    description: "Please fill in Field Label.",
                    variant: "destructive",
                  });
                  return;
                }

                if ((cewFieldConfig.type === "dropdown" || cewFieldConfig.type === "multiselect") && (!cewFieldConfig.options || cewFieldConfig.options.length === 0)) {
                  toast({
                    title: "Validation Error",
                    description: "Please provide at least one option for dropdown/multiselect fields.",
                    variant: "destructive",
                  });
                  return;
                }

                const fieldName = cewFieldConfig.name || cewFieldConfig.label.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
                const fieldData: CEWField = {
                  id: selectedCEWFieldId || `field-${Date.now()}`,
                  type: cewFieldConfig.type!,
                  label: cewFieldConfig.label!,
                  name: fieldName,
                  placeholder: cewFieldConfig.placeholder,
                  required: cewFieldConfig.required || false,
                  options: cewFieldConfig.options,
                };

                const activePages = cewFormPages.length > 0 ? cewFormPages : (selectedCEW?.formPages || []);
                const pageId = selectedCEWPageId || activePages[0]?.id;
                const sectionId = selectedCEWSectionId || activePages[0]?.sections[0]?.id;

                if (!pageId || !sectionId) {
                  toast({
                    title: "Error",
                    description: "Could not find page or section to add field.",
                    variant: "destructive",
                  });
                  return;
                }

                const updatedPages = activePages.map(page => 
                  page.id === pageId
                    ? {
                        ...page,
                        sections: page.sections.map(section =>
                          section.id === sectionId
                            ? {
                                ...section,
                                fields: selectedCEWFieldId
                                  ? section.fields.map(f => f.id === selectedCEWFieldId ? fieldData : f)
                                  : [...section.fields, fieldData]
                              }
                            : section
                        )
                      }
                    : page
                );

                if (cewFormPages.length > 0) {
                  setCewFormPages(updatedPages);
                } else {
                  setCewFormPages(updatedPages);
                  setSelectedCEW({ ...selectedCEW, formPages: updatedPages });
                }

                setIsCEWFieldDialogOpen(false);
                setCewFieldConfig({
                  type: "text",
                  label: "",
                  name: "",
                  placeholder: "",
                  required: false,
                });
                setCewOptionsInput("");
                setSelectedCEWFieldId(null);
                setSelectedCEWSectionId(null);

                toast({
                  title: selectedCEWFieldId ? "Field Updated" : "Field Added",
                  description: `${fieldData.label} has been ${selectedCEWFieldId ? "updated" : "added"} to the form.`,
                });
              }}
            >
              {selectedCEWFieldId ? "Update Field" : "Add Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Playground Dialog */}
      <Dialog open={isPlaygroundOpen} onOpenChange={setIsPlaygroundOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {playgroundType === "calculation" 
                ? `${selectedCalculation === "sumInsured" ? "Total Sum Insured" : "Premium"} Calculation Playground`
                : "Rating Configuration Playground"}
            </DialogTitle>
            <DialogDescription>
              Test your formula with different input values to see the calculated result
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {playgroundType === "calculation" && selectedCalculation && (
              <>
                {/* Input Values Section */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Input Test Values</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {(() => {
                      const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                      const requiredFields = currentFormula
                        .filter(step => step.type === "field")
                        .map(step => step.value)
                        .filter((value, index, self) => self.indexOf(value) === index); // Unique values
                      
                      return requiredFields.map((fieldName) => {
                        const param = ratingParameters.find(p => p.name === fieldName);
                        return (
                          <div key={fieldName} className="space-y-2">
                            <Label>{param?.label || fieldName}</Label>
                            {param?.type === "dropdown" ? (
                              <Select
                                value={playgroundTestValues[fieldName] || ""}
                                onValueChange={(value) => {
                                  setPlaygroundTestValues({
                                    ...playgroundTestValues,
                                    [fieldName]: value
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${param?.label || fieldName}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {param?.options?.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                      {opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={param?.type === "number" ? "number" : "text"}
                                value={playgroundTestValues[fieldName] || ""}
                                onChange={(e) => {
                                  const value = param?.type === "number" 
                                    ? parseFloat(e.target.value) || 0
                                    : e.target.value;
                                  setPlaygroundTestValues({
                                    ...playgroundTestValues,
                                    [fieldName]: value
                                  });
                                }}
                                placeholder={`Enter ${param?.label || fieldName}`}
                              />
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Formula Display */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Formula</Label>
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                        return currentFormula.map((step, index) => (
                          <React.Fragment key={step.id}>
                            {step.type === "field" && (
                              <Badge variant="default">
                                {ratingParameters.find(p => p.name === step.value)?.label || step.value}
                              </Badge>
                            )}
                            {step.type === "operator" && (
                              <span className="font-mono text-xl text-primary font-bold">
                                {step.value}
                              </span>
                            )}
                            {step.type === "number" && (
                              <span className="font-mono text-lg">
                                {step.value}
                              </span>
                            )}
                            {step.type === "percentage" && (
                              <span className="font-mono text-lg text-primary">
                                {step.value}%
                              </span>
                            )}
                          </React.Fragment>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Calculate Button */}
                <Button
                  className="w-full"
                  onClick={() => {
                    const currentFormula = selectedCalculation === "sumInsured" ? sumInsuredFormula : premiumFormula;
                    const result = evaluateFormula(currentFormula, playgroundTestValues);
                    if (result === null) {
                      toast({
                        title: "Calculation Error",
                        description: "Please fill in all required values or check your formula.",
                        variant: "destructive",
                      });
                    } else {
                      setPlaygroundResult(result);
                    }
                  }}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Result
                </Button>

                {/* Result Display */}
                {playgroundResult !== null && (
                  <div className="p-6 border rounded-lg bg-primary/10 border-primary">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Calculated Result</Label>
                      <div className="text-3xl font-bold text-primary">
                        {playgroundResult.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} AED
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedCalculation === "sumInsured" ? "Total Sum Insured" : "Premium"} based on your formula and test values
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlaygroundOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RatingConfigurator;

