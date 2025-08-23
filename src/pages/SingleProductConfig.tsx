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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Save, Calculator, FileText, Upload, Eye, Plus, Minus, Image, ChevronDown, ChevronRight, Trash2, X, MapPin, Edit, DollarSign, TrendingUp, Shield, Layout, Check, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getActiveProjectTypes, getActiveConstructionTypes, getSubProjectTypesByProjectType } from "@/lib/masters-data";
import { getActiveCountries, getRegionsByCountry, getZonesByRegion } from "@/lib/location-data";
import { ClausePricingCard } from "@/components/product-config/ClausePricingCard";
import { SubProjectBaseRates } from "@/components/pricing/SubProjectBaseRates";

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
  const { insurerId, productId } = useParams();
  
  // Detect if we're in insurer portal or market admin
  const isInsurerPortal = location.pathname.startsWith('/insurer');
  const basePath = isInsurerPortal ? '/insurer' : `/market-admin/insurer/${insurerId}`;
  const { toast } = useToast();

  const activeProjectTypes = getActiveProjectTypes();
  const activeConstructionTypes = getActiveConstructionTypes();
  const activeCountries = getActiveCountries();

  // Mock product data
  const product = {
    id: productId,
    name: productId === "1" ? "CAR Insurance" : "CAR Insurance Premium",
    code: productId === "1" ? "CAR-STD-001" : "CAR-PRM-002"
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
          pricingType: 'percentage',
          baseRate: type.baseRate,
          quoteOption: 'quote'
        });
      });
    });
    
    return entries;
  };

  const [uploadedWordings, setUploadedWordings] = useState([
    { id: 1, name: "Standard CAR Policy Wording v2.1", uploadDate: "2024-01-15", size: "245 KB", active: true },
    { id: 2, name: "Enhanced Coverage Wording", uploadDate: "2024-01-10", size: "189 KB", active: false }
  ]);
  const [activePricingTab, setActivePricingTab] = useState("base-rates");
  const [isNewWordingDialogOpen, setIsNewWordingDialogOpen] = useState(false);
  const [newWordingName, setNewWordingName] = useState("");
  const [isWordingUploadDialogOpen, setIsWordingUploadDialogOpen] = useState(false);
  const [wordingUploadTitle, setWordingUploadTitle] = useState("");
  const [editingWording, setEditingWording] = useState<any>(null);
  const [isEditClauseDialogOpen, setIsEditClauseDialogOpen] = useState(false);
  const [selectedClause, setSelectedClause] = useState<any>(null);
  const [isAddClauseDialogOpen, setIsAddClauseDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isConfirmSaveDialogOpen, setIsConfirmSaveDialogOpen] = useState(false);
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("quote-config");
  
  // Required Documents state
  const [requiredDocuments, setRequiredDocuments] = useState([
    { id: 1, label: "KYC Document", description: "Know Your Customer document", required: true, active: true, order: 1, template: { name: "KYC_Template_v1.2.pdf", uploadDate: "2024-01-20", size: "156 KB" } },
    { id: 2, label: "Signed Proposal Form", description: "Completed and signed proposal form", required: true, active: true, order: 2, template: { name: "Proposal_Form_Template.pdf", uploadDate: "2024-01-18", size: "89 KB" } }
  ]);
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
  const [tplLimit, setTplLimit] = useState("10,000,000");
  const [tplExtensions, setTplExtensions] = useState([
    {
      id: 1,
      title: "Enhanced TPL Coverage",
      description: "Additional coverage for third party liability beyond standard limits",
      tplLimitValue: "15,000,000",
      pricingType: "percentage" as "percentage" | "fixed",
      loadingDiscount: 5.5
    },
    {
      id: 2,
      title: "Cross Liability Extension",
      description: "Coverage between different parties named as insured under the same policy",
      tplLimitValue: "20,000,000",
      pricingType: "fixed" as "percentage" | "fixed",
      loadingDiscount: 2500
    }
  ]);

  // Mock data for clauses, exclusions, and warranties
  const [clausesData, setClausesData] = useState([
    { 
      code: "MRe 001", 
      title: "SRCC Coverage", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is hereby agreed and understood that this Policy is extended to cover loss of or damage to the insured property directly caused by:\n\nStrikers, locked-out workers, or persons taking part in labour disturbances, riots, or civil commotions;\n\nThe action of any lawfully constituted authority in suppressing or attempting to suppress any such disturbances or minimizing the consequences of such disturbances;\n\nMalicious acts committed by any person, whether or not such act is committed in connection with a disturbance of the public peace;\n\nprovided that such loss or damage is not otherwise excluded under this Policy.\n\nHowever, the insurers shall not be liable for:\n\nLoss or damage arising out of or in connection with war, invasion, act of foreign enemy, hostilities or warlike operations (whether war be declared or not), civil war, mutiny, insurrection, rebellion, revolution, military or usurped power, or any act of terrorism.\n\nConsequential loss of any kind or description.\n\nSubject otherwise to the terms, conditions, and exclusions of the Policy.",
      purposeDescription: "Coverage for strikes, riots, civil commotions and malicious damage",
      purpose: "This clause extends the basic fire and allied perils coverage to include losses from civil disturbances and malicious acts. It specifically covers:\n\n• Strikes, lockouts, and labor disturbances\n• Riots and civil commotions\n• Actions by lawful authorities to suppress disturbances\n• Malicious acts by any person\n\nThe clause is essential for construction projects as these risks are common in commercial and infrastructure developments. It provides protection against social and political risks while maintaining clear exclusions for war and terrorism. The coverage ensures that legitimate civil unrest damage is covered while excluding acts of war and terrorism which require separate specialized coverage.\n\nThis endorsement is typically mandatory for all construction projects as these perils represent significant exposure that could result in total project loss. The clause helps bridge the gap between basic property coverage and specialized political risk insurance."
    },
    { 
      code: "MRe 002", 
      title: "Cross Liability", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is hereby agreed and understood that, subject to the limits of indemnity stated in the Policy and subject otherwise to the terms, exclusions, provisions and conditions of the Policy, where the insured comprises more than one party, the insurance afforded by this Policy shall apply in the same manner and to the same extent as if individual insurance contracts had been issued to each such party.\n\nHowever, the total liability of the Insurer shall not exceed the limits of indemnity stated in the Schedule, regardless of the number of insured parties.",
      purposeDescription: "Cross liability coverage for multi-party construction projects",
      purpose: "This clause is critical for multi-party construction projects where several entities (contractor, subcontractors, principal, etc.) are named as co-insureds under a single policy. Without this clause, coverage disputes could arise when one insured party causes damage affecting another insured party.\n\nKey benefits:\n• Eliminates coverage gaps between insured parties\n• Prevents one insured from being left without coverage due to actions of another insured\n• Ensures each party receives full policy benefits as if they had separate individual policies\n• Maintains the principle of joint and several coverage while preserving overall policy limits\n\nThis is mandatory for all construction projects with multiple insured parties as it prevents coverage disputes and ensures comprehensive protection for all project stakeholders. It's particularly important in complex projects where the actions of one contractor could affect the interests of other insured parties.\n\nThe clause maintains the insurer's overall liability limit while ensuring fair and equal treatment of all co-insureds, making it essential for risk management in collaborative construction environments."
    },
    { 
      code: "MRe 003", 
      title: "Maintenance Visits", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is hereby agreed and understood that this Policy covers maintenance visits and inspections conducted during the policy period. All maintenance activities must be carried out in accordance with manufacturer specifications and industry best practices.\n\nThe Insurer reserves the right to inspect the insured property at reasonable intervals to ensure compliance with maintenance requirements.",
      purposeDescription: "Coverage for maintenance activities and inspections",
      purpose: "This clause extends the CAR policy beyond the construction completion to cover maintenance activities performed by the contractor during the defects liability period. It addresses the significant risk gap that would otherwise exist after practical completion.\n\nKey coverage features:\n• Covers damage caused by the contractor during routine maintenance visits\n• Applies only to damage arising from maintenance operations\n• Requires payment of additional premium for the extended period\n• Covers the period specified in the construction contract (typically 12 months)\n\nThis coverage is essential because:\n• Standard CAR policies terminate at practical completion\n• Contractors remain liable for defects during the maintenance period\n• Maintenance activities can cause accidental damage to completed works\n• Without this coverage, contractors face uninsured exposure during defects liability period\n\nThe clause is mandatory for most construction contracts as it ensures continuous protection throughout the entire project lifecycle, from commencement through the defects liability period. It protects both the contractor's interests and the principal's investment in the completed works."
    },
    {
      code: "MRe 003", 
      title: "Maintenance Visits", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is agreed and understood that otherwise subject to the terms, exclusions, provisions and conditions contained in the Policy or endorsed thereon and subject to the Insured having paid the agreed extra premium, this insurance shall be extended for the maintenance period specified hereunder to cover solely loss of or damage to the contract works caused by the insured contractor(s) in the course of the operations carried out for the purpose of complying with the obligations under the maintenance provisions of the contract.\n\nMaintenance cover: From: As shown in Schedule To: As shown in the Schedule\n\nExtra premium: As shown in the Schedule",
      purpose: "This clause extends the CAR policy beyond the construction completion to cover maintenance activities performed by the contractor during the defects liability period. It addresses the significant risk gap that would otherwise exist after practical completion.\n\nKey coverage features:\n• Covers damage caused by the contractor during routine maintenance visits\n• Applies only to damage arising from maintenance operations\n• Requires payment of additional premium for the extended period\n• Covers the period specified in the construction contract (typically 12 months)\n\nThis coverage is essential because:\n• Standard CAR policies terminate at practical completion\n• Contractors remain liable for defects during the maintenance period\n• Maintenance activities can cause accidental damage to completed works\n• Without this coverage, contractors face uninsured exposure during defects liability period\n\nThe clause is mandatory for most construction contracts as it ensures continuous protection throughout the entire project lifecycle, from commencement through the defects liability period. It protects both the contractor's interests and the principal's investment in the completed works."
    },
    { 
      code: "MRe 004", 
      title: "Extended Maintenance", 
      type: "Clause", 
      show: "Mandatory",
      wording: "It is agreed and understood that otherwise subject to the terms, exclusions, provisions and conditions contained in the insurance or endorsed thereon and subject to the Insured having paid the agreed extra insurance premium, this Insurance shall be extended for the maintenance period specified hereunder to cover loss of or damage to the contract works caused by the insured contractor(s) in the course of the operations carried out for the purpose of complying with the obligations under the maintenance provisions of the contract, occurring during the maintenance period provided such loss or damage was caused on the site during the construction period before the certificate of completion for the lost or damaged section was issued.\n\nMaintenance cover: From: As shown in Schedule To: As shown in Schedule\nExtra insurance premium: As Agreed",
      purpose: "This clause provides comprehensive coverage for latent defects and pre-existing issues that manifest during the maintenance period. It specifically covers damage that:\n\n• Occurs during the maintenance period\n• Was caused during the original construction phase\n• Manifests before the completion certificate was issued for that section\n• Results from maintenance operations addressing these pre-existing issues\n\nThis extended coverage is crucial because:\n• It bridges the gap between construction-phase coverage and maintenance-period exclusions\n• Addresses the complex issue of when damage actually 'occurred' versus when it was discovered\n• Provides protection for progressive deterioration that began during construction\n• Covers the contractor's liability for remedial work on pre-existing defects\n\nThe clause is particularly important for:\n• Complex infrastructure projects with extended completion timelines\n• Projects with multiple phases and sectional completions\n• Situations where defects may not be immediately apparent\n• Long-term maintenance contracts where liability periods overlap\n\nThis mandatory coverage ensures that contractors and principals are protected against the significant financial exposure from latent construction defects that require remediation during the maintenance period."
    },
    { 
      code: "MRe 005", 
      title: "Time Schedule Condition", 
      type: "Clause", 
      show: "Optional",
      wording: "It is agreed and understood that otherwise subject to the terms, exclusions, provisions and conditions contained in the insurance or endorsed thereon, the following shall apply to this Insurance:\n\nThe construction and/or erection time schedule together with any other statements made in writing by the Insured for the purpose of obtaining cover under the insurance as well as technical information forwarded to the Company shall be deemed to be incorporated herein.\n\nThe Company shall not indemnify the Insured in respect of loss or damage caused by or arising out of or aggravated by deviations from the construction and/or erection time schedule exceeding the number of weeks stated below unless the Company had agreed in writing to such a deviation before the loss occurred.\n\nDeviation from time schedule: As shown in Schedule weeks",
      purpose: "This condition links insurance coverage to adherence to the construction time schedule, recognizing that extended project duration increases risk exposure. It serves multiple important functions:\n\n**Risk Management Benefits:**\n• Incentivizes adherence to planned construction schedules\n• Prevents insurance coverage from extending indefinitely beyond intended project duration\n• Ensures that premium calculations remain aligned with actual risk exposure periods\n• Maintains the principle that insurance terms should match project parameters\n\n**Coverage Parameters:**\n• Incorporates construction schedules as binding contract terms\n• Allows for reasonable deviation periods (typically 4-12 weeks)\n• Requires pre-approval for schedule extensions beyond the tolerance\n• Maintains coverage continuity for approved extensions\n\n**When Applied:**\n• Projects with tight completion schedules\n• High-value projects where extended duration significantly increases exposure\n• Projects in areas with seasonal risk variations\n• Contracts where delayed completion creates additional hazards\n\nThis optional clause is valuable for risk-conscious insurers and can result in premium discounts for well-managed projects that maintain schedule discipline. It encourages proactive project management while ensuring insurance coverage remains appropriate for actual project timelines."
    },
    { 
      code: "MRe 006", 
      title: "Overtime/Night Work/Express Freight", 
      type: "Clause", 
      show: "Optional",
      wording: "It is agreed and understood that otherwise subject to the terms, exclusions, provisions and conditions contained in the insurance or endorsed thereon and subject to the Insured having paid the agreed extra insurance premium, this Insurance shall be extended to cover extra charges for overtime, night work, work on public holidays and express freight (excluding airfreight).\n\nProvided always that such extra charges shall be incurred in connection with any loss of or damage to the Insured items recoverable under the Insurance Certificate.\n\nIf the sum(s) Insured of the damaged item(s) is (are) less than the amount(s) required to be Insured, the amount payable under this Endorsement for such extra charges shall be reduced in the same proportion.\n\nLimit of indemnity: As shown in Schedule any one occurrence\nExtra insurance premium: As Agreed",
      purpose: "This clause recognizes that construction projects often face schedule pressures requiring expedited repair and replacement efforts. It covers the additional costs associated with accelerated restoration activities:\n\n**Covered Additional Costs:**\n• Overtime payments for extended working hours\n• Night shift premiums for around-the-clock operations\n• Holiday work surcharges when repairs cannot wait\n• Express freight charges for urgent material delivery\n• Premium rates for expedited services\n\n**Key Applications:**\n• Projects with critical completion deadlines\n• Infrastructure projects where delays affect public services\n• Manufacturing facilities where production downtime is costly\n• Projects with liquidated damages clauses for late completion\n• Time-sensitive developments (seasonal projects, event facilities)\n\n**Important Limitations:**\n• Coverage applies only to repair/replacement of covered losses\n• Subject to proportional reduction if property is underinsured\n• Excludes airfreight (covered under separate endorsement)\n• Requires additional premium payment\n• Limited to specified maximum amounts\n\nThis optional coverage is valuable for projects where schedule adherence is critical and the cost of expedited repairs is justified by avoiding consequential delays. It helps ensure that insured parties can make economically rational decisions about repair methods without being constrained by standard labor and freight costs."
    },
    { 
      code: "MRe 007", 
      title: "Airfreight Expenses", 
      type: "Clause", 
      show: "Optional",
      wording: "It is agreed and understood that otherwise subject to the terms, exclusions, provisions and conditions contained in the insurance or endorsed thereon and subject to the Insured having paid the agreed extra insurance premium, this Insurance shall be extended to cover extra charges for airfreight.\n\nProvided always that such extra charges shall be incurred in connection with any loss of or damage to the Insured items recoverable under the Insurance Certificate.\n\nProvided further that the maximum amount payable under this Endorsement in respect of airfreight shall not exceed the amount stated below during the period of Insurance.\n\nDeductible: 20% of the indemnifiable extra charges, minimum any one occurrence\nMaximum amount payable: As shown in Schedule\nExtra insurance premium: As shown in Schedule",
      purpose: "This specialized coverage addresses the highest level of urgency in material replacement, recognizing that some construction scenarios require immediate airfreight delivery despite the substantial costs involved.\n\n**Strategic Applications:**\n• Critical infrastructure projects (hospitals, airports, power plants)\n• Projects in remote locations with limited surface transport\n• High-value specialized equipment or materials\n• Time-critical projects with severe delay penalties\n• Projects where alternative suppliers are geographically distant\n• Emergency repairs to prevent progressive damage\n\n**Coverage Features:**\n• Covers premium airfreight costs above standard shipping\n• Applies only to materials/equipment for covered losses\n• Includes 20% deductible to discourage unnecessary use\n• Subject to annual aggregate limits\n• Requires additional premium reflecting high exposure\n\n**Risk Management Considerations:**\n• Airfreight costs can be 5-10 times surface transport costs\n• Coverage helps justify economically optimal repair decisions\n• Particularly valuable for specialized/custom-manufactured items\n• Essential for projects where delay costs exceed airfreight premiums\n\nThis optional coverage provides the ultimate flexibility in loss response, ensuring that when airfreight is the most economical solution considering all project costs and constraints, insureds are not deterred by the premium transportation costs. The deductible structure encourages judicious use while providing essential protection for genuinely urgent situations."
    },
    { 
      code: "MRe 008", 
      title: "Structures in Earthquake Zones Warranty", 
      type: "Clause", 
      show: "Optional",
      wording: "It is agreed and understood that otherwise subject to the terms, exclusions, provisions and conditions contained in the insurance or endorsed thereon, the Company shall only indemnify the Insured for loss, damage or liability arising out of earthquake if the Insured proves that the earthquake risk was taken into account in design according to the official building codes valid for the site and that the qualities of material and workmanship and the dimensions on which the calculations were based were adhered to.",
      purpose: "Limits earthquake coverage to structures built according to official seismic building codes with proper materials and workmanship standards."
    },
    { 
      code: "MRe 009", 
      title: "Earthquake Clause", 
      type: "Exclusion", 
      show: "Optional",
      wording: "It is agreed and understood that otherwise subject to the terms, exclusions, provisions and conditions contained in the Policy or endorsed thereon, the Insurers shall not indemnify the Insured for loss, damage or liability directly or indirectly caused by or resulting from earthquake.",
      purpose: "Excludes coverage for any loss, damage, or liability directly or indirectly caused by earthquakes."
    },
    { 
      code: "MRe 010", 
      title: "Flood And Inundation Clause", 
      type: "Exclusion", 
      show: "Optional",
      wording: "It is agreed and understood that otherwise subject to the terms, exclusions, provisions and conditions contained in the Policy or endorsed thereon, the Insurers shall not indemnify the Insured for loss, damage or liability directly or indirectly caused by or resulting from flood and inundation",
      purpose: "Excludes coverage for any loss, damage, or liability directly or indirectly caused by flood and inundation."
    },
    { 
      code: "MRe 011", 
      title: "Serial Losses Clause", 
      type: "Clause", 
      show: "Optional",
      wording: "It is agreed and understood that, otherwise subject to the terms, exclusions, provisions and conditions contained in the Insurance:\n\nLoss or damage due to faulty design, defective material or casting, or bad workmanship (other than faults in erection) arising out of the same cause to machines or equipment of the same type or design shall be indemnified after applying the insurance deductible for each loss according to the following scale:\n\n100% of the first loss\n% of the % loss (As shown in Schedule, if any)\n% of the % loss (As shown in Schedule, if any)\n% of the % loss (As shown in Schedule, if any)\n% of the % loss (As shown in Schedule, if any)\n\nFurther losses shall not be indemnified.\n\n(The percentages shall be fixed in accordance with the condition of each individual component, eg. depending on the number of items at risk.)",
      purpose: "Provides diminishing coverage for serial losses affecting similar equipment, with reducing percentages for subsequent losses of the same type."
    },
    { 
      code: "MRe 012", 
      title: "Windstorm Or Wind Related Water Damage Clause", 
      type: "Exclusion", 
      show: "Optional",
      wording: "It is agreed and understood that, notwithstanding the terms, exclusions, provisions and conditions of the insurance or any Endorsements agreed upon, the Company shall not indemnify the Insured for loss or damage or liability directly or indirectly caused by or resulting from windstorm equal to or exceeding grade 8 on the Beaufort Scale (mean wind speed exceeding 62 km/h) or any water damage occurring in connection with or as a consequence of such windstorm.",
      purpose: "Excludes coverage for damage caused by windstorms of grade 8 or higher on the Beaufort Scale and related water damage."
    },
    { 
      code: "MRe 013", 
      title: "Property In Off-Site Storage Clause", 
      type: "Warranty", 
      show: "Optional",
      wording: "It is agreed and understood that, notwithstanding the terms, exclusions, provisions and conditions contained in the insurance or any Endorsements agreed upon and subject to the Insured having paid the agreed extra insurance premium, Section 1 of the insurance shall be extended to cover loss of or damage to property Insured (except property being manufactured, processed or stored at the manufacturers, distributors or suppliers premises) in off-site storage within the territorial limits as stated below.\n\nThe Company shall not indemnify the Insured for loss or damage caused by the failure to take generally accepted loss prevention measures for warehouses or storage units. Such measures shall include, in particular:\n\nensuring that the storage area is enclosed (either a building or at least fenced in), guarded, protected against fire, as appropriate for the particular location or type of property stored;\nseparating the storage units by fire-proof walls or by a distance of at least 50 meters;\npositioning and designing the storage units in such a way as to prevent damage by accumulating water or flooding due to rainfall or by a flood with a statistical return period of less than 20 years;\nlimiting the value per storage unit to the amount stated below during the period of Insurance.\n\nTerritorial limits of: As shown in Schedule\nMaximum value per storage unit: As shown in Schedule, if any\nLimit of indemnity (any one occurrence): As shown in Schedule, if any\nDeductible: As shown in Schedule, if any 20% of loss amount, minimum As in Schedule, if any any one occurrence\nExtra insurance premium: As Agreed",
      purpose: "Extends coverage to property in off-site storage with specific requirements for storage security, fire protection, flood prevention, and value limitations per storage unit."
    }
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
    durationLoadings: [
      { id: 1, from: 0, to: 12, pricingType: 'percentage', value: 0, quoteOption: 'quote' },
      { id: 2, from: 12, to: 18, pricingType: 'percentage', value: 0.02, quoteOption: 'quote' },
      { id: 3, from: 18, to: 24, pricingType: 'percentage', value: 0.05, quoteOption: 'quote' },
      { id: 4, from: 24, to: 999, pricingType: 'percentage', value: 0.10, quoteOption: 'quote' },
    ],
    maintenancePeriodLoadings: [
      { id: 1, from: 0, to: 12, pricingType: 'percentage', value: 0, quoteOption: 'quote' },
      { id: 2, from: 12, to: 18, pricingType: 'percentage', value: 0.01, quoteOption: 'quote' },
      { id: 3, from: 18, to: 24, pricingType: 'percentage', value: 0.02, quoteOption: 'quote' },
      { id: 4, from: 24, to: 999, pricingType: 'percentage', value: 0.05, quoteOption: 'quote' },
    ],
      locationHazardLoadings: {
        low: 0,
        moderate: 0.10,
        high: 0.25,
        veryHigh: 0.50,
      },
    },
    // Contractor Risk Factors
    contractorRisk: {
      experienceDiscounts: [
        { id: 1, from: 0, to: 2, pricingType: 'percentage', loadingDiscount: 0.20, quoteOption: 'quote' },
        { id: 2, from: 2, to: 5, pricingType: 'percentage', loadingDiscount: 0.10, quoteOption: 'quote' },
        { id: 3, from: 5, to: 10, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
        { id: 4, from: 10, to: 999, pricingType: 'percentage', loadingDiscount: -0.10, quoteOption: 'quote' }
      ],
      subcontractorLoadings: {
        none: 0,
        limited: 0.05,
        moderate: 0.10,
        heavy: 0.15,
      },
      contractorNumbers: [
        { id: 1, from: 0, to: 2, pricingType: 'percentage', loadingDiscount: 0.10, quoteOption: 'quote' },
        { id: 2, from: 2, to: 5, pricingType: 'percentage', loadingDiscount: 0.05, quoteOption: 'quote' },
        { id: 3, from: 5, to: 999, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' }
      ],
      subcontractorNumbers: [
        { id: 1, from: 0, to: 2, pricingType: 'percentage', loadingDiscount: 0.05, quoteOption: 'quote' },
        { id: 2, from: 2, to: 5, pricingType: 'percentage', loadingDiscount: 0.10, quoteOption: 'quote' },
        { id: 3, from: 5, to: 999, pricingType: 'percentage', loadingDiscount: 0.15, quoteOption: 'quote' }
      ],
      claimFrequency: [
        { id: 1, from: 0, to: 0, pricingType: 'percentage', loadingDiscount: -0.05, quoteOption: 'quote' },
        { id: 2, from: 1, to: 2, pricingType: 'percentage', loadingDiscount: 0, quoteOption: 'quote' },
        { id: 3, from: 3, to: 5, pricingType: 'percentage', loadingDiscount: 0.10, quoteOption: 'quote' },
        { id: 4, from: 6, to: 999, pricingType: 'percentage', loadingDiscount: 0.25, quoteOption: 'quote' }
      ],
      claimAmountCategories: [
        { id: 1, from: 0, to: 100000, pricingType: 'percentage', loadingDiscount: -0.02, quoteOption: 'quote' },
        { id: 2, from: 100000, to: 500000, pricingType: 'percentage', loadingDiscount: 0.05, quoteOption: 'quote' },
        { id: 3, from: 500000, to: 999999999, pricingType: 'percentage', loadingDiscount: 0.15, quoteOption: 'quote' }
      ],
    },
    // Cover Requirements (based on proposal form fields)
    coverRequirements: {
      sumInsured: [
        { id: 1, from: 0, to: 5000000, pricingType: 'percentage', loadingDiscount: 0.05, quoteOption: 'quote' },
        { id: 2, from: 5000000, to: 20000000, pricingType: 'percentage', loadingDiscount: 0.03, quoteOption: 'quote' },
        { id: 3, from: 20000000, to: 50000000, pricingType: 'percentage', loadingDiscount: 0.02, quoteOption: 'quote' },
        { id: 4, from: 50000000, to: 999999999, pricingType: 'percentage', loadingDiscount: 0.01, quoteOption: 'quote' }
      ],
      projectValue: [
        { id: 1, from: 0, to: 10000000, pricingType: 'percentage', loadingDiscount: 0.04, quoteOption: 'quote' },
        { id: 2, from: 10000000, to: 50000000, pricingType: 'percentage', loadingDiscount: 0.03, quoteOption: 'quote' },
        { id: 3, from: 50000000, to: 100000000, pricingType: 'percentage', loadingDiscount: 0.02, quoteOption: 'quote' },
        { id: 4, from: 100000000, to: 999999999, pricingType: 'percentage', loadingDiscount: 0.01, quoteOption: 'quote' }
      ],
      contractWorks: [
        { id: 1, from: 0, to: 1000000, pricingType: 'percentage', loadingDiscount: 0.05, quoteOption: 'quote' },
        { id: 2, from: 1000000, to: 5000000, pricingType: 'percentage', loadingDiscount: 0.03, quoteOption: 'quote' },
        { id: 3, from: 5000000, to: 20000000, pricingType: 'percentage', loadingDiscount: 0.02, quoteOption: 'quote' },
        { id: 4, from: 20000000, to: 999999999, pricingType: 'percentage', loadingDiscount: 0.01, quoteOption: 'quote' }
      ],
      plantEquipment: [
        { id: 1, from: 0, to: 500000, pricingType: 'percentage', loadingDiscount: 0.08, quoteOption: 'quote' },
        { id: 2, from: 500000, to: 2000000, pricingType: 'percentage', loadingDiscount: 0.06, quoteOption: 'quote' },
        { id: 3, from: 2000000, to: 5000000, pricingType: 'percentage', loadingDiscount: 0.04, quoteOption: 'quote' },
        { id: 4, from: 5000000, to: 999999999, pricingType: 'percentage', loadingDiscount: 0.03, quoteOption: 'quote' }
      ],
      temporaryWorks: [
        { id: 1, from: 0, to: 1000000, pricingType: 'percentage', loadingDiscount: 0.10, quoteOption: 'quote' },
        { id: 2, from: 1000000, to: 3000000, pricingType: 'percentage', loadingDiscount: 0.08, quoteOption: 'quote' },
        { id: 3, from: 3000000, to: 10000000, pricingType: 'percentage', loadingDiscount: 0.06, quoteOption: 'quote' },
        { id: 4, from: 10000000, to: 999999999, pricingType: 'percentage', loadingDiscount: 0.04, quoteOption: 'quote' }
      ],
      otherMaterials: [
        { id: 1, from: 0, to: 500000, pricingType: 'percentage', loadingDiscount: 0.12, quoteOption: 'quote' },
        { id: 2, from: 500000, to: 2000000, pricingType: 'percentage', loadingDiscount: 0.10, quoteOption: 'quote' },
        { id: 3, from: 2000000, to: 5000000, pricingType: 'percentage', loadingDiscount: 0.08, quoteOption: 'quote' },
        { id: 4, from: 5000000, to: 999999999, pricingType: 'percentage', loadingDiscount: 0.06, quoteOption: 'quote' }
      ],
      principalExistingProperty: [
        { id: 1, from: 0, to: 1000000, pricingType: 'percentage', loadingDiscount: 0.06, quoteOption: 'quote' },
        { id: 2, from: 1000000, to: 5000000, pricingType: 'percentage', loadingDiscount: 0.04, quoteOption: 'quote' },
        { id: 3, from: 5000000, to: 20000000, pricingType: 'percentage', loadingDiscount: 0.03, quoteOption: 'quote' },
        { id: 4, from: 20000000, to: 999999999, pricingType: 'percentage', loadingDiscount: 0.02, quoteOption: 'quote' }
      ],
      tplLimit: [
        { id: 1, from: 0, to: 1000000, pricingType: 'percentage', loadingDiscount: 0.15, quoteOption: 'quote' },
        { id: 2, from: 1000000, to: 5000000, pricingType: 'percentage', loadingDiscount: 0.12, quoteOption: 'quote' },
        { id: 3, from: 5000000, to: 10000000, pricingType: 'percentage', loadingDiscount: 0.10, quoteOption: 'quote' },
        { id: 4, from: 10000000, to: 999999999, pricingType: 'percentage', loadingDiscount: 0.08, quoteOption: 'quote' }
      ],
      subLimits: [
        { id: 1, title: 'Natural Catastrophes', description: 'Coverage limit for earthquake, flood, and hurricane damage', pricingType: 'percentage-sum-insured', value: 50 },
        { id: 2, title: 'Equipment Breakdown', description: 'Maximum limit for machinery and equipment failures', pricingType: 'fixed', value: 2000000 },
        { id: 3, title: 'Professional Fees', description: 'Limit for architect and engineer fees', pricingType: 'percentage-sum-insured', value: 15 }
      ],
      deductibles: [
        { id: 1, deductibleType: 'fixed', value: 50000, loadingDiscount: 0, quoteOption: 'quote' },
        { id: 2, deductibleType: 'percentage-loss', value: 1, loadingDiscount: -0.05, quoteOption: 'quote' },
        { id: 3, deductibleType: 'percentage-sum-insured', value: 2, loadingDiscount: -0.10, quoteOption: 'quote' }
      ],
      crossLiabilityCover: {
        yes: 0.02,
        no: 0,
      },
    },
    // Policy Limits
    limits: {
      minimumPremium: 25000,
      maximumCover: 50000000,
      baseBrokerCommission: 10,
      minimumBrokerCommission: 5,
      maximumBrokerCommission: 15,
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
    // Fee Types
    feeTypes: [
      { id: 1, label: "VAT", pricingType: "percentage", value: 5, active: true }
    ]
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && wordingUploadTitle.trim()) {
      markAsChanged();
      if (editingWording) {
        // Update existing wording
        setUploadedWordings(prev => 
          prev.map(w => 
            w.id === editingWording.id 
              ? { ...w, name: wordingUploadTitle, size: `${Math.round(file.size / 1024)} KB` }
              : w
          )
        );
        toast({
          title: "Document updated",
          description: `${wordingUploadTitle} has been updated successfully.`,
        });
      } else {
        // Add new wording
        const newWording = {
          id: uploadedWordings.length + 1,
          name: wordingUploadTitle,
          uploadDate: new Date().toISOString().split('T')[0],
          size: `${Math.round(file.size / 1024)} KB`,
          active: true
        };
        setUploadedWordings(prev => [...prev, newWording]);
        toast({
          title: "Document uploaded",
          description: `${wordingUploadTitle} has been uploaded successfully.`,
        });
      }
      // Reset dialog state
      setIsWordingUploadDialogOpen(false);
      setWordingUploadTitle("");
      setEditingWording(null);
      // Reset file input
      event.target.value = '';
    }
  };

  const openUploadDialog = () => {
    setEditingWording(null);
    setWordingUploadTitle("");
    setIsWordingUploadDialogOpen(true);
  };

  const openEditDialog = (wording: any) => {
    setEditingWording(wording);
    setWordingUploadTitle(wording.name);
    setIsWordingUploadDialogOpen(true);
  };

  const saveConfiguration = () => {
    setIsConfirmSaveDialogOpen(true);
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

  const handleTabChange = (newTab: string) => {
    if (hasUnsavedChanges && newTab !== activeTab) {
      setPendingNavigation(newTab);
      setIsUnsavedChangesDialogOpen(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const handleBackNavigation = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation('back');
      setIsUnsavedChangesDialogOpen(true);
    } else {
      navigate(`${basePath}/product-config`);
    }
  };

  const handleSaveAndContinue = () => {
    handleConfirmSave();
    setIsUnsavedChangesDialogOpen(false);
    if (pendingNavigation === 'back') {
      navigate(`${basePath}/product-config`);
    } else if (pendingNavigation) {
      setActiveTab(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    setIsUnsavedChangesDialogOpen(false);
    if (pendingNavigation === 'back') {
      navigate(`${basePath}/product-config`);
    } else if (pendingNavigation) {
      setActiveTab(pendingNavigation);
    }
    setPendingNavigation(null);
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

  const updateProjectRiskFactor = (category: string, key: string, value: number) => {
    markAsChanged();
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
    
    markAsChanged();
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
              <TabsTrigger value="quote-format" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Quote Format
              </TabsTrigger>
              <TabsTrigger value="required-documents" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Required Documents
              </TabsTrigger>
            </TabsList>

            {/* Quote Configurator Tab */}
            <TabsContent value="quote-config" className="space-y-6">
              
              {/* Quote Details Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Quote Details Configuration</CardTitle>
                      <CardDescription>Configure quotation numbering, dates, and validity</CardDescription>
                    </div>
                    <Button onClick={saveConfiguration} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Button onClick={saveConfiguration} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
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
                          { id: "fee-types", label: "Fee Types", icon: Percent, count: ratingConfig.feeTypes?.length || 0 },
                        ].map((section) => (
                          <button
                            key={section.id}
                            onClick={() => setActivePricingTab(section.id)}
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
                    <div className="flex-1 overflow-y-auto">
                      {activePricingTab === "base-rates" && (
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle>Base Rates</CardTitle>
                            <CardDescription>Configure base premium rates for different sub-project types</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <SubProjectBaseRates
                              projectTypes={activeProjectTypes}
                              subProjectEntries={ratingConfig.subProjectEntries}
                              selectedProjectTypes={selectedProjectTypes}
                              onSubProjectEntryChange={updateSubProjectEntry}
                              onProjectTypeToggle={toggleProjectType}
                            />
                          </CardContent>
                        </Card>
                      )}

                      {activePricingTab === "project-risk" && (
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle>Project Risk Factors</CardTitle>
                            <CardDescription>Configure risk adjustments based on project characteristics</CardDescription>
                          </CardHeader>
                           <CardContent className="p-6">
                             <div className="space-y-6">
                                <Card className="border border-border bg-card">
                                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <div>
                                      <CardTitle className="text-sm">Project Duration Loadings/Discounts</CardTitle>
                                      <p className="text-xs text-muted-foreground">Configure pricing based on project duration ranges</p>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={addDurationLoading}
                                    >
                                      Add Row
                                    </Button>
                                  </CardHeader>
                                  <CardContent>
                                     <Table>
                                       <TableHeader>
                                         <TableRow>
                                           <TableHead>From (months)</TableHead>
                                           <TableHead>To (months)</TableHead>
                                           <TableHead>Pricing Type</TableHead>
                                           <TableHead>Loading/Discount</TableHead>
                                           <TableHead>Quote Option</TableHead>
                                           <TableHead>Actions</TableHead>
                                         </TableRow>
                                       </TableHeader>
                                      <TableBody>
                                        {ratingConfig.projectRisk.durationLoadings.map((duration) => (
                                          <TableRow key={duration.id}>
                                            <TableCell>
                                              <Input
                                                type="number"
                                                value={duration.from}
                                                onChange={(e) => updateDurationLoading(duration.id, 'from', parseInt(e.target.value) || 0)}
                                                className="w-24"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Input
                                                type="number"
                                                value={duration.to === 999 ? '' : duration.to}
                                                placeholder="∞"
                                                onChange={(e) => updateDurationLoading(duration.id, 'to', parseInt(e.target.value) || 999)}
                                                className="w-24"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Select 
                                                value={duration.pricingType}
                                                onValueChange={(value) => updateDurationLoading(duration.id, 'pricingType', value)}
                                              >
                                                <SelectTrigger className="w-32">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="percentage">Percentage</SelectItem>
                                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 step="0.01"
                                                 value={duration.value}
                                                 onChange={(e) => updateDurationLoading(duration.id, 'value', parseFloat(e.target.value) || 0)}
                                                 className="w-24"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Select 
                                                 value={duration.quoteOption}
                                                 onValueChange={(value) => updateDurationLoading(duration.id, 'quoteOption', value)}
                                               >
                                                 <SelectTrigger className="w-32">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="quote">Auto Quote</SelectItem>
                                                   <SelectItem value="no-quote">No Quote</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => removeDurationLoading(duration.id)}
                                                 className="text-destructive hover:text-destructive"
                                               >
                                                 Remove
                                               </Button>
                                             </TableCell>
                                          </TableRow>
                                        ))}
                                        {ratingConfig.projectRisk.durationLoadings.length === 0 && (
                                          <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                                              No duration loadings configured. Click "Add Row" to get started.
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </CardContent>
                                 </Card>

                                 <Card className="border border-border bg-card">
                                   <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                     <div>
                                       <CardTitle className="text-sm">Maintenance Period Loadings/Discounts</CardTitle>
                                       <p className="text-xs text-muted-foreground">Configure pricing based on maintenance period ranges</p>
                                     </div>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       onClick={addMaintenancePeriodLoading}
                                     >
                                       Add Row
                                     </Button>
                                   </CardHeader>
                                   <CardContent>
                                     <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>From (months)</TableHead>
                                            <TableHead>To (months)</TableHead>
                                            <TableHead>Pricing Type</TableHead>
                                            <TableHead>Loading/Discount</TableHead>
                                            <TableHead>Quote Option</TableHead>
                                            <TableHead>Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                       <TableBody>
                                         {ratingConfig.projectRisk.maintenancePeriodLoadings.map((maintenance) => (
                                           <TableRow key={maintenance.id}>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 value={maintenance.from}
                                                 onChange={(e) => updateMaintenancePeriodLoading(maintenance.id, 'from', parseInt(e.target.value) || 0)}
                                                 className="w-24"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 value={maintenance.to === 999 ? '' : maintenance.to}
                                                 placeholder="∞"
                                                 onChange={(e) => updateMaintenancePeriodLoading(maintenance.id, 'to', parseInt(e.target.value) || 999)}
                                                 className="w-24"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Select 
                                                 value={maintenance.pricingType}
                                                 onValueChange={(value) => updateMaintenancePeriodLoading(maintenance.id, 'pricingType', value)}
                                               >
                                                 <SelectTrigger className="w-32">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="percentage">Percentage</SelectItem>
                                                   <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={maintenance.value}
                                                  onChange={(e) => updateMaintenancePeriodLoading(maintenance.id, 'value', parseFloat(e.target.value) || 0)}
                                                  className="w-24"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select 
                                                  value={maintenance.quoteOption}
                                                  onValueChange={(value) => updateMaintenancePeriodLoading(maintenance.id, 'quoteOption', value)}
                                                >
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="quote">Auto Quote</SelectItem>
                                                    <SelectItem value="no-quote">No Quote</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeMaintenancePeriodLoading(maintenance.id)}
                                                  className="text-destructive hover:text-destructive"
                                                >
                                                  Remove
                                                </Button>
                                              </TableCell>
                                           </TableRow>
                                         ))}
                                         {ratingConfig.projectRisk.maintenancePeriodLoadings.length === 0 && (
                                           <TableRow>
                                             <TableCell colSpan={6} className="text-center text-muted-foreground">
                                               No maintenance period loadings configured. Click "Add Row" to get started.
                                             </TableCell>
                                           </TableRow>
                                         )}
                                       </TableBody>
                                     </Table>
                                   </CardContent>
                                 </Card>

                                <Card className="border border-border bg-card">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Location Hazard Loadings/Discounts</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-6">
                                    {/* Risk Definition Table */}
                                    <div className="space-y-3">
                                      <Label className="text-sm font-medium">Risk Definition</Label>
                                      <Table>
                                         <TableHeader>
                                           <TableRow>
                                             <TableHead className="text-xs">Factor</TableHead>
                                             <TableHead className="text-xs">Low Risk</TableHead>
                                             <TableHead className="text-xs">Moderate Risk</TableHead>
                                             <TableHead className="text-xs">High Risk</TableHead>
                                             <TableHead className="text-xs">Very High Risk</TableHead>
                                           </TableRow>
                                         </TableHeader>
                                        <TableBody>
                                          <TableRow>
                                            <TableCell className="font-medium text-xs">Near water body</TableCell>
                                            <TableCell>
                                              <Select defaultValue="no">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="yes">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="yes">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Select defaultValue="yes">
                                                 <SelectTrigger className="h-8 text-xs">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="no">No</SelectItem>
                                                   <SelectItem value="yes">Yes</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                           </TableRow>
                                          <TableRow>
                                            <TableCell className="font-medium text-xs">Flood-prone zone</TableCell>
                                            <TableCell>
                                              <Select defaultValue="no">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="no">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="yes">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Select defaultValue="yes">
                                                 <SelectTrigger className="h-8 text-xs">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="no">No</SelectItem>
                                                   <SelectItem value="yes">Yes</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                           </TableRow>
                                          <TableRow>
                                            <TableCell className="font-medium text-xs">City center</TableCell>
                                            <TableCell>
                                              <Select defaultValue="yes">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="no">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="yes">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Select defaultValue="yes">
                                                 <SelectTrigger className="h-8 text-xs">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="no">No</SelectItem>
                                                   <SelectItem value="yes">Yes</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                           </TableRow>
                                          <TableRow>
                                            <TableCell className="font-medium text-xs">Soil type</TableCell>
                                            <TableCell>
                                              <SoilTypeMultiSelect defaultValues={["Rock"]} />
                                            </TableCell>
                                            <TableCell>
                                              <SoilTypeMultiSelect defaultValues={["Sandy"]} />
                                            </TableCell>
                                            <TableCell>
                                              <SoilTypeMultiSelect defaultValues={["Clay", "Unknown"]} />
                                             </TableCell>
                                             <TableCell>
                                               <SoilTypeMultiSelect defaultValues={["Clay", "Peat"]} />
                                             </TableCell>
                                           </TableRow>
                                          <TableRow>
                                            <TableCell className="font-medium text-xs">Existing structure on site</TableCell>
                                            <TableCell>
                                              <Select defaultValue="no">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="yes">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="yes">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Select defaultValue="yes">
                                                 <SelectTrigger className="h-8 text-xs">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="no">No</SelectItem>
                                                   <SelectItem value="yes">Yes</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                           </TableRow>
                                          <TableRow>
                                            <TableCell className="font-medium text-xs">Blasting/Deep excavation</TableCell>
                                            <TableCell>
                                              <Select defaultValue="no">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="no">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="yes">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="no">No</SelectItem>
                                                  <SelectItem value="yes">Yes</SelectItem>
                                                </SelectContent>
                                              </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Select defaultValue="yes">
                                                 <SelectTrigger className="h-8 text-xs">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="no">No</SelectItem>
                                                   <SelectItem value="yes">Yes</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                           </TableRow>
                                          <TableRow>
                                            <TableCell className="font-medium text-xs">Security arrangements</TableCell>
                                            <TableCell>
                                              <Select defaultValue="guarded">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="guarded">24/7 Guarded</SelectItem>
                                                  <SelectItem value="cctv">CCTV</SelectItem>
                                                  <SelectItem value="fenced">Fenced</SelectItem>
                                                  <SelectItem value="none">None</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="cctv">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="guarded">24/7 Guarded</SelectItem>
                                                  <SelectItem value="cctv">CCTV</SelectItem>
                                                  <SelectItem value="fenced">Fenced</SelectItem>
                                                  <SelectItem value="none">None</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>
                                              <Select defaultValue="none">
                                                <SelectTrigger className="h-8 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="guarded">24/7 Guarded</SelectItem>
                                                  <SelectItem value="cctv">CCTV</SelectItem>
                                                  <SelectItem value="fenced">Fenced</SelectItem>
                                                  <SelectItem value="none">None</SelectItem>
                                                </SelectContent>
                                              </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Select defaultValue="none">
                                                 <SelectTrigger className="h-8 text-xs">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="guarded">24/7 Guarded</SelectItem>
                                                   <SelectItem value="cctv">CCTV</SelectItem>
                                                   <SelectItem value="fenced">Fenced</SelectItem>
                                                   <SelectItem value="none">None</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                           </TableRow>
                                        </TableBody>
                                      </Table>
                                    </div>

                                    {/* Rate Configuration */}
                                    <div className="space-y-3">
                                      <Label className="text-sm font-medium">Location Hazard Rates</Label>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Risk Level</TableHead>
                                            <TableHead>Pricing Type</TableHead>
                                            <TableHead>Loading/Discount</TableHead>
                                            <TableHead>Quote Option</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                           {[
                                             { key: 'low', label: 'Low Risk' },
                                             { key: 'moderate', label: 'Moderate Risk' },
                                             { key: 'high', label: 'High Risk' },
                                             { key: 'veryHigh', label: 'Very High Risk' }
                                           ].map((risk) => (
                                            <TableRow key={risk.key}>
                                              <TableCell className="font-medium">{risk.label}</TableCell>
                                              <TableCell>
                                                <Select defaultValue="percentage">
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={ratingConfig.projectRisk.locationHazardLoadings[risk.key as keyof typeof ratingConfig.projectRisk.locationHazardLoadings]}
                                                  onChange={(e) => updateProjectRiskFactor('locationHazardLoadings', risk.key, parseFloat(e.target.value) || 0)}
                                                  className="w-24"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select defaultValue="quote">
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="quote">Auto Quote</SelectItem>
                                                    <SelectItem value="no-quote">No Quote</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
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
                           <CardContent className="p-6">
                             <div className="space-y-6">
                                 <Card className="border border-border bg-card">
                                   <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                     <div>
                                       <CardTitle className="text-sm">Experience Loadings/Discounts</CardTitle>
                                       <p className="text-xs text-muted-foreground">Experience in years</p>
                                     </div>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       onClick={() => addContractorRiskEntry('experienceDiscounts')}
                                     >
                                       Add Row
                                     </Button>
                                   </CardHeader>
                                   <CardContent>
                                     <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>From</TableHead>
                                            <TableHead>To</TableHead>
                                            <TableHead>Pricing Type</TableHead>
                                            <TableHead>Loading/Discount</TableHead>
                                            <TableHead>Quote Option</TableHead>
                                            <TableHead>Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                       <TableBody>
                                         {ratingConfig.contractorRisk.experienceDiscounts.map((entry) => (
                                           <TableRow key={entry.id}>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 value={entry.from}
                                                 onChange={(e) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                 className="w-20"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 value={entry.to}
                                                 onChange={(e) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                 className="w-20"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Select 
                                                 value={entry.pricingType} 
                                                 onValueChange={(value) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'pricingType', value)}
                                               >
                                                 <SelectTrigger className="w-32">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="percentage">Percentage</SelectItem>
                                                   <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={entry.loadingDiscount}
                                                  onChange={(e) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                  className="w-24"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select 
                                                  value={entry.quoteOption} 
                                                  onValueChange={(value) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'quoteOption', value)}
                                                >
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="quote">Auto Quote</SelectItem>
                                                    <SelectItem value="no-quote">No Quote</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeContractorRiskEntry('experienceDiscounts', entry.id)}
                                                  className="text-destructive hover:text-destructive"
                                                >
                                                  Remove
                                                </Button>
                                              </TableCell>
                                           </TableRow>
                                         ))}
                                       </TableBody>
                                     </Table>
                                   </CardContent>
                                  </Card>

                                <Card className="border border-border bg-card">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Claims Based Loading/Discount</CardTitle>
                                  </CardHeader>
                                   <CardContent>
                                     <div className="space-y-4">
                                        <div>
                                          <div className="flex items-center justify-between mb-3">
                                            <Label className="text-sm font-medium">Claim Frequency (Last 5 Years)</Label>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => addContractorRiskEntry('claimFrequency')}
                                            >
                                              Add Row
                                            </Button>
                                          </div>
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>From</TableHead>
                                                <TableHead>To</TableHead>
                                                <TableHead>Pricing Type</TableHead>
                                                <TableHead>Loading/Discount</TableHead>
                                                <TableHead>Quote Option</TableHead>
                                                <TableHead>Actions</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {ratingConfig.contractorRisk.claimFrequency.map((entry) => (
                                                <TableRow key={entry.id}>
                                                  <TableCell>
                                                    <Input
                                                      type="number"
                                                      value={entry.from}
                                                      onChange={(e) => updateContractorRiskEntry('claimFrequency', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                      className="w-20"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Input
                                                      type="number"
                                                      value={entry.to}
                                                      onChange={(e) => updateContractorRiskEntry('claimFrequency', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                      className="w-20"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Select 
                                                      value={entry.pricingType} 
                                                      onValueChange={(value) => updateContractorRiskEntry('claimFrequency', entry.id, 'pricingType', value)}
                                                    >
                                                      <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="percentage">Percentage</SelectItem>
                                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Input
                                                      type="number"
                                                      step="0.01"
                                                      value={entry.loadingDiscount}
                                                      onChange={(e) => updateContractorRiskEntry('claimFrequency', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                      className="w-24"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Select 
                                                      value={entry.quoteOption} 
                                                      onValueChange={(value) => updateContractorRiskEntry('claimFrequency', entry.id, 'quoteOption', value)}
                                                    >
                                                      <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="quote">Auto Quote</SelectItem>
                                                        <SelectItem value="no-quote">No Quote</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => removeContractorRiskEntry('claimFrequency', entry.id)}
                                                      className="text-destructive hover:text-destructive"
                                                    >
                                                      Remove
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                        <div>
                                          <div className="flex items-center justify-between mb-3">
                                            <Label className="text-sm font-medium">Claim Amount Categories</Label>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => addContractorRiskEntry('claimAmountCategories')}
                                            >
                                              Add Row
                                            </Button>
                                          </div>
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>From (AED)</TableHead>
                                                <TableHead>To (AED)</TableHead>
                                                <TableHead>Pricing Type</TableHead>
                                                <TableHead>Loading/Discount</TableHead>
                                                <TableHead>Quote Option</TableHead>
                                                <TableHead>Actions</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {ratingConfig.contractorRisk.claimAmountCategories.map((entry) => (
                                                <TableRow key={entry.id}>
                                                  <TableCell>
                                                    <Input
                                                      type="number"
                                                      value={entry.from}
                                                      onChange={(e) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                      className="w-24"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Input
                                                      type="number"
                                                      value={entry.to}
                                                      onChange={(e) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                      className="w-24"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Select 
                                                      value={entry.pricingType} 
                                                      onValueChange={(value) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'pricingType', value)}
                                                    >
                                                      <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="percentage">Percentage</SelectItem>
                                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Input
                                                      type="number"
                                                      step="0.01"
                                                      value={entry.loadingDiscount}
                                                      onChange={(e) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                      className="w-24"
                                                    />
                                                  </TableCell>
                                                  <TableCell>
                                                    <Select 
                                                      value={entry.quoteOption} 
                                                      onValueChange={(value) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'quoteOption', value)}
                                                    >
                                                      <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="quote">Auto Quote</SelectItem>
                                                        <SelectItem value="no-quote">No Quote</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => removeContractorRiskEntry('claimAmountCategories', entry.id)}
                                                      className="text-destructive hover:text-destructive"
                                                    >
                                                      Remove
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                     </div>
                                    </CardContent>
                                 </Card>

                                <Card className="border border-border bg-card">
                                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <div>
                                      <CardTitle className="text-sm">Contractor Number Based Configuration</CardTitle>
                                      <p className="text-xs text-muted-foreground">Number of contractors</p>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => addContractorRiskEntry('contractorNumbers')}
                                    >
                                      Add Row
                                    </Button>
                                  </CardHeader>
                                  <CardContent>
                                    <Table>
                                       <TableHeader>
                                         <TableRow>
                                           <TableHead>From</TableHead>
                                           <TableHead>To</TableHead>
                                           <TableHead>Pricing Type</TableHead>
                                           <TableHead>Loading/Discount</TableHead>
                                           <TableHead>Quote Option</TableHead>
                                           <TableHead>Actions</TableHead>
                                         </TableRow>
                                       </TableHeader>
                                      <TableBody>
                                        {ratingConfig.contractorRisk.contractorNumbers.map((entry) => (
                                          <TableRow key={entry.id}>
                                            <TableCell>
                                              <Input
                                                type="number"
                                                value={entry.from}
                                                onChange={(e) => updateContractorRiskEntry('contractorNumbers', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                className="w-20"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Input
                                                type="number"
                                                value={entry.to}
                                                onChange={(e) => updateContractorRiskEntry('contractorNumbers', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                className="w-20"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Select 
                                                value={entry.pricingType} 
                                                onValueChange={(value) => updateContractorRiskEntry('contractorNumbers', entry.id, 'pricingType', value)}
                                              >
                                                <SelectTrigger className="w-32">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="percentage">Percentage</SelectItem>
                                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 step="0.01"
                                                 value={entry.loadingDiscount}
                                                 onChange={(e) => updateContractorRiskEntry('contractorNumbers', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                 className="w-24"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Select 
                                                 value={entry.quoteOption} 
                                                 onValueChange={(value) => updateContractorRiskEntry('contractorNumbers', entry.id, 'quoteOption', value)}
                                               >
                                                 <SelectTrigger className="w-32">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="quote">Auto Quote</SelectItem>
                                                   <SelectItem value="no-quote">No Quote</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => removeContractorRiskEntry('contractorNumbers', entry.id)}
                                                 className="text-destructive hover:text-destructive"
                                               >
                                                 Remove
                                               </Button>
                                             </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </CardContent>
                                </Card>

                                <Card className="border border-border bg-card">
                                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                    <div>
                                      <CardTitle className="text-sm">Subcontractor Number Based Configuration</CardTitle>
                                      <p className="text-xs text-muted-foreground">Number of subcontractors</p>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => addContractorRiskEntry('subcontractorNumbers')}
                                    >
                                      Add Row
                                    </Button>
                                  </CardHeader>
                                  <CardContent>
                                    <Table>
                                       <TableHeader>
                                         <TableRow>
                                           <TableHead>From</TableHead>
                                           <TableHead>To</TableHead>
                                           <TableHead>Pricing Type</TableHead>
                                           <TableHead>Loading/Discount</TableHead>
                                           <TableHead>Quote Option</TableHead>
                                           <TableHead>Actions</TableHead>
                                         </TableRow>
                                       </TableHeader>
                                      <TableBody>
                                        {ratingConfig.contractorRisk.subcontractorNumbers.map((entry) => (
                                          <TableRow key={entry.id}>
                                            <TableCell>
                                              <Input
                                                type="number"
                                                value={entry.from}
                                                onChange={(e) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                className="w-20"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Input
                                                type="number"
                                                value={entry.to}
                                                onChange={(e) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                className="w-20"
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Select 
                                                value={entry.pricingType} 
                                                onValueChange={(value) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'pricingType', value)}
                                              >
                                                <SelectTrigger className="w-32">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="percentage">Percentage</SelectItem>
                                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 step="0.01"
                                                 value={entry.loadingDiscount}
                                                 onChange={(e) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                 className="w-24"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Select 
                                                 value={entry.quoteOption} 
                                                 onValueChange={(value) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'quoteOption', value)}
                                               >
                                                 <SelectTrigger className="w-32">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="quote">Auto Quote</SelectItem>
                                                   <SelectItem value="no-quote">No Quote</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => removeContractorRiskEntry('subcontractorNumbers', entry.id)}
                                                 className="text-destructive hover:text-destructive"
                                               >
                                                 Remove
                                               </Button>
                                             </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </CardContent>
                                </Card>
                             </div>
                          </CardContent>
                         </Card>
                        )}

                       {activePricingTab === "coverage-options" && (
                         <Card className="h-full">
                           <CardHeader>
                             <CardTitle>Cover Requirements Configuration</CardTitle>
                             <CardDescription>Configure loading/discount rates based on cover requirement values from proposal form</CardDescription>
                           </CardHeader>
                            <CardContent className="p-6">
                               <div className="space-y-6">
                                  <Card className="border border-border bg-card">
                                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                      <div>
                                        <CardTitle className="text-sm">Sum Insured</CardTitle>
                                        <p className="text-xs text-muted-foreground">Rate based on sum insured value ranges (AED)</p>
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => addCoverRequirementEntry('sumInsured')}
                                      >
                                        Add Row
                                      </Button>
                                    </CardHeader>
                                    <CardContent>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>From (AED)</TableHead>
                                            <TableHead>To (AED)</TableHead>
                                            <TableHead>Pricing Type</TableHead>
                                            <TableHead>Loading/Discount</TableHead>
                                            <TableHead>Quote Option</TableHead>
                                            <TableHead>Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {ratingConfig.coverRequirements.sumInsured.map((entry) => (
                                            <TableRow key={entry.id}>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.from}
                                                  onChange={(e) => updateCoverRequirementEntry('sumInsured', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                  className="w-32"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.to}
                                                  onChange={(e) => updateCoverRequirementEntry('sumInsured', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                  className="w-32"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select 
                                                  value={entry.pricingType} 
                                                  onValueChange={(value) => updateCoverRequirementEntry('sumInsured', entry.id, 'pricingType', value)}
                                                >
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={entry.loadingDiscount}
                                                  onChange={(e) => updateCoverRequirementEntry('sumInsured', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                  className="w-24"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select 
                                                  value={entry.quoteOption} 
                                                  onValueChange={(value) => updateCoverRequirementEntry('sumInsured', entry.id, 'quoteOption', value)}
                                                >
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="quote">Auto Quote</SelectItem>
                                                    <SelectItem value="no-quote">No Quote</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeCoverRequirementEntry('sumInsured', entry.id)}
                                                  className="text-destructive hover:text-destructive"
                                                >
                                                  Remove
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </CardContent>
                                  </Card>

                                  <Card className="border border-border bg-card">
                                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                      <div>
                                        <CardTitle className="text-sm">Project Value</CardTitle>
                                        <p className="text-xs text-muted-foreground">Rate based on project value ranges (AED)</p>
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => addCoverRequirementEntry('projectValue')}
                                      >
                                        Add Row
                                      </Button>
                                    </CardHeader>
                                    <CardContent>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>From (AED)</TableHead>
                                            <TableHead>To (AED)</TableHead>
                                            <TableHead>Pricing Type</TableHead>
                                            <TableHead>Loading/Discount</TableHead>
                                            <TableHead>Quote Option</TableHead>
                                            <TableHead>Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {ratingConfig.coverRequirements.projectValue.map((entry) => (
                                            <TableRow key={entry.id}>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.from}
                                                  onChange={(e) => updateCoverRequirementEntry('projectValue', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                  className="w-32"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.to}
                                                  onChange={(e) => updateCoverRequirementEntry('projectValue', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                  className="w-32"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select 
                                                  value={entry.pricingType} 
                                                  onValueChange={(value) => updateCoverRequirementEntry('projectValue', entry.id, 'pricingType', value)}
                                                >
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={entry.loadingDiscount}
                                                  onChange={(e) => updateCoverRequirementEntry('projectValue', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                  className="w-24"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select 
                                                  value={entry.quoteOption} 
                                                  onValueChange={(value) => updateCoverRequirementEntry('projectValue', entry.id, 'quoteOption', value)}
                                                >
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="quote">Auto Quote</SelectItem>
                                                    <SelectItem value="no-quote">No Quote</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeCoverRequirementEntry('projectValue', entry.id)}
                                                  className="text-destructive hover:text-destructive"
                                                >
                                                  Remove
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </CardContent>
                                  </Card>

                                  <Card className="border border-border bg-card">
                                   <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                     <div>
                                       <CardTitle className="text-sm">Contract Works (Material Damage)</CardTitle>
                                       <p className="text-xs text-muted-foreground">Rate based on contract works value ranges (AED)</p>
                                     </div>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       onClick={() => addCoverRequirementEntry('contractWorks')}
                                     >
                                       Add Row
                                     </Button>
                                   </CardHeader>
                                    <CardContent>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>From (AED)</TableHead>
                                            <TableHead>To (AED)</TableHead>
                                            <TableHead>Pricing Type</TableHead>
                                            <TableHead>Loading/Discount</TableHead>
                                            <TableHead>Quote Option</TableHead>
                                            <TableHead>Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {ratingConfig.coverRequirements.contractWorks.map((entry) => (
                                            <TableRow key={entry.id}>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.from}
                                                  onChange={(e) => updateCoverRequirementEntry('contractWorks', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                  className="w-32"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.to}
                                                  onChange={(e) => updateCoverRequirementEntry('contractWorks', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                  className="w-32"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select 
                                                  value={entry.pricingType} 
                                                  onValueChange={(value) => updateCoverRequirementEntry('contractWorks', entry.id, 'pricingType', value)}
                                                >
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={entry.loadingDiscount}
                                                  onChange={(e) => updateCoverRequirementEntry('contractWorks', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                  className="w-24"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select 
                                                  value={entry.quoteOption} 
                                                  onValueChange={(value) => updateCoverRequirementEntry('contractWorks', entry.id, 'quoteOption', value)}
                                                >
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="quote">Auto Quote</SelectItem>
                                                    <SelectItem value="no-quote">No Quote</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeCoverRequirementEntry('contractWorks', entry.id)}
                                                  className="text-destructive hover:text-destructive"
                                                >
                                                  Remove
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </CardContent>
                                 </Card>

                                 <Card className="border border-border bg-card">
                                   <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                     <div>
                                       <CardTitle className="text-sm">Plant & Equipment (CPM)</CardTitle>
                                       <p className="text-xs text-muted-foreground">Rate based on plant & machinery value ranges (AED)</p>
                                     </div>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       onClick={() => addCoverRequirementEntry('plantEquipment')}
                                     >
                                       Add Row
                                     </Button>
                                   </CardHeader>
                                    <CardContent>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>From (AED)</TableHead>
                                            <TableHead>To (AED)</TableHead>
                                            <TableHead>Pricing Type</TableHead>
                                            <TableHead>Loading/Discount</TableHead>
                                            <TableHead>Quote Option</TableHead>
                                            <TableHead>Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {ratingConfig.coverRequirements.plantEquipment.map((entry) => (
                                            <TableRow key={entry.id}>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.from}
                                                  onChange={(e) => updateCoverRequirementEntry('plantEquipment', entry.id, 'from', parseFloat(e.target.value) || 0)}
                                                  className="w-32"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={entry.to}
                                                  onChange={(e) => updateCoverRequirementEntry('plantEquipment', entry.id, 'to', parseFloat(e.target.value) || 0)}
                                                  className="w-32"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select 
                                                  value={entry.pricingType} 
                                                  onValueChange={(value) => updateCoverRequirementEntry('plantEquipment', entry.id, 'pricingType', value)}
                                                >
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  value={entry.loadingDiscount}
                                                  onChange={(e) => updateCoverRequirementEntry('plantEquipment', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                  className="w-24"
                                                />
                                              </TableCell>
                                              <TableCell>
                                                <Select 
                                                  value={entry.quoteOption} 
                                                  onValueChange={(value) => updateCoverRequirementEntry('plantEquipment', entry.id, 'quoteOption', value)}
                                                >
                                                  <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="quote">Auto Quote</SelectItem>
                                                    <SelectItem value="no-quote">No Quote</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                              <TableCell>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeCoverRequirementEntry('plantEquipment', entry.id)}
                                                  className="text-destructive hover:text-destructive"
                                                >
                                                  Remove
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </CardContent>
                                 </Card>


                                 <Card className="border border-border bg-card">
                                   <CardHeader className="pb-3">
                                     <CardTitle className="text-sm">Cross Liability Cover</CardTitle>
                                     <p className="text-xs text-muted-foreground">Rate based on cross liability cover selection</p>
                                   </CardHeader>
                                   <CardContent>
                                     <Table>
                                       <TableHeader>
                                         <TableRow>
                                           <TableHead>Cover Option</TableHead>
                                           <TableHead>Pricing Type</TableHead>
                                           <TableHead>Loading/Discount</TableHead>
                                           <TableHead>Quote Option</TableHead>
                                         </TableRow>
                                       </TableHeader>
                                       <TableBody>
                                         {[
                                           { key: 'yes', label: 'Yes (Included)' },
                                           { key: 'no', label: 'No (Not Included)' }
                                         ].map((option) => (
                                           <TableRow key={option.key}>
                                             <TableCell className="font-medium">{option.label}</TableCell>
                                             <TableCell>
                                               <Select defaultValue="percentage">
                                                 <SelectTrigger className="w-32">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="percentage">Percentage</SelectItem>
                                                   <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 step="0.01"
                                                 value={ratingConfig.coverRequirements.crossLiabilityCover[option.key as keyof typeof ratingConfig.coverRequirements.crossLiabilityCover]}
                                                 onChange={(e) => updateCoverRequirement('crossLiabilityCover', option.key, parseFloat(e.target.value) || 0)}
                                                 className="w-24"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Select defaultValue="quote">
                                                 <SelectTrigger className="w-32">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="quote">Auto Quote</SelectItem>
                                                   <SelectItem value="no-quote">No Quote</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                           </TableRow>
                                         ))}
                                       </TableBody>
                                     </Table>
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
                            <CardContent className="p-6 overflow-x-auto">
                              <div className="space-y-6">
                                <Card className="border border-border bg-card">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Policy Limits</CardTitle>
                                  </CardHeader>
                                    <CardContent className="overflow-x-auto">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Limit Type</TableHead>
                                            <TableHead>Pricing Type</TableHead>
                                            <TableHead>Value (AED)</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                       <TableBody>
                                         <TableRow>
                                           <TableCell className="font-medium">Minimum Premium</TableCell>
                                           <TableCell>
                                             <Select defaultValue="fixed">
                                               <SelectTrigger className="w-32">
                                                 <SelectValue />
                                               </SelectTrigger>
                                               <SelectContent>
                                                 <SelectItem value="percentage-sum-insured">Percentage of Sum Insured</SelectItem>
                                                 <SelectItem value="fixed">Fixed Amount</SelectItem>
                                               </SelectContent>
                                             </Select>
                                           </TableCell>
                                            <TableCell>
                                              <Input
                                                type="number"
                                                value={ratingConfig.limits.minimumPremium}
                                                onChange={(e) => updateLimits('minimumPremium', parseInt(e.target.value) || 0)}
                                                className="w-32"
                                              />
                                            </TableCell>
                                         </TableRow>
                                         <TableRow>
                                           <TableCell className="font-medium">Maximum Cover</TableCell>
                                           <TableCell>
                                             <Select defaultValue="fixed">
                                               <SelectTrigger className="w-32">
                                                 <SelectValue />
                                               </SelectTrigger>
                                               <SelectContent>
                                                 <SelectItem value="percentage-sum-insured">Percentage of Sum Insured</SelectItem>
                                                 <SelectItem value="fixed">Fixed Amount</SelectItem>
                                               </SelectContent>
                                             </Select>
                                           </TableCell>
                                            <TableCell>
                                              <Input
                                                type="number"
                                                value={ratingConfig.limits.maximumCover}
                                                onChange={(e) => updateLimits('maximumCover', parseInt(e.target.value) || 0)}
                                                className="w-32"
                                              />
                                             </TableCell>
                                           </TableRow>
                                           <TableRow>
                                             <TableCell className="font-medium">Base Broker Commission</TableCell>
                                             <TableCell>
                                               <Select defaultValue="percentage">
                                                 <SelectTrigger className="w-32">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="percentage">Percentage</SelectItem>
                                                   <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                              <TableCell>
                                                <Input
                                                  type="number"
                                                  value={ratingConfig.limits.baseBrokerCommission}
                                                  onChange={(e) => updateLimits('baseBrokerCommission', parseInt(e.target.value) || 0)}
                                                  className="w-32"
                                                />
                                              </TableCell>
                                           </TableRow>
                                           <TableRow>
                                             <TableCell className="font-medium">Minimum Broker Commission</TableCell>
                                            <TableCell>
                                              <Select defaultValue="percentage">
                                                <SelectTrigger className="w-32">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="percentage">Percentage</SelectItem>
                                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 value={ratingConfig.limits.minimumBrokerCommission}
                                                 onChange={(e) => updateLimits('minimumBrokerCommission', parseInt(e.target.value) || 0)}
                                                 className="w-32"
                                               />
                                             </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-medium">Maximum Broker Commission</TableCell>
                                            <TableCell>
                                              <Select defaultValue="percentage">
                                                <SelectTrigger className="w-32">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="percentage">Percentage</SelectItem>
                                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 value={ratingConfig.limits.maximumBrokerCommission}
                                                 onChange={(e) => updateLimits('maximumBrokerCommission', parseInt(e.target.value) || 0)}
                                                 className="w-32"
                                               />
                                             </TableCell>
                                          </TableRow>
                                       </TableBody>
                                     </Table>
                                   </CardContent>
                                 </Card>

                                 <Card className="border border-border bg-card">
                                   <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                     <div>
                                       <CardTitle className="text-sm">Sub-limits</CardTitle>
                                       <p className="text-xs text-muted-foreground">Define coverage sub-limits and restrictions</p>
                                     </div>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       onClick={() => addCoverRequirementEntry('subLimits')}
                                     >
                                       Add Sub-limit
                                     </Button>
                                   </CardHeader>
                                    <CardContent className="overflow-x-auto">
                                      <Table>
                                       <TableHeader>
                                         <TableRow>
                                           <TableHead>Title</TableHead>
                                           <TableHead>Description</TableHead>
                                           <TableHead>Pricing Type</TableHead>
                                           <TableHead>Value</TableHead>
                                           <TableHead>Actions</TableHead>
                                         </TableRow>
                                       </TableHeader>
                                       <TableBody>
                                         {ratingConfig.coverRequirements.subLimits?.map((entry) => (
                                           <TableRow key={entry.id}>
                                             <TableCell>
                                               <Input
                                                 type="text"
                                                 value={entry.title || ''}
                                                 onChange={(e) => updateCoverRequirementEntry('subLimits', entry.id, 'title', e.target.value)}
                                                 className="w-40"
                                                 placeholder="Enter title"
                                               />
                                             </TableCell>
                                             <TableCell>
                                                <Input
                                                  type="text"
                                                  value={entry.description || ''}
                                                  onChange={(e) => updateCoverRequirementEntry('subLimits', entry.id, 'description', e.target.value)}
                                                  className="w-40"
                                                  placeholder="Enter description"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Select 
                                                 value={entry.pricingType} 
                                                 onValueChange={(value) => updateCoverRequirementEntry('subLimits', entry.id, 'pricingType', value)}
                                               >
                                                 <SelectTrigger className="w-40">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="percentage-sum-insured">Percentage of Sum Insured</SelectItem>
                                                   <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 step="0.01"
                                                 value={entry.value || 0}
                                                 onChange={(e) => updateCoverRequirementEntry('subLimits', entry.id, 'value', parseFloat(e.target.value) || 0)}
                                                 className="w-32"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => removeCoverRequirementEntry('subLimits', entry.id)}
                                                 className="text-destructive hover:text-destructive"
                                               >
                                                 Remove
                                               </Button>
                                             </TableCell>
                                           </TableRow>
                                         )) || (
                                           <TableRow>
                                             <TableCell colSpan={5} className="text-center text-muted-foreground">
                                               No sub-limits configured. Click "Add Sub-limit" to get started.
                                             </TableCell>
                                           </TableRow>
                                         )}
                                       </TableBody>
                                     </Table>
                                   </CardContent>
                                 </Card>

                                 <Card className="border border-border bg-card">
                                   <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                     <div>
                                       <CardTitle className="text-sm">Deductibles</CardTitle>
                                       <p className="text-xs text-muted-foreground">Configure deductible options and pricing</p>
                                     </div>
                                     <Button 
                                       variant="outline" 
                                       size="sm"
                                       onClick={() => addCoverRequirementEntry('deductibles')}
                                     >
                                       Add Deductible
                                     </Button>
                                   </CardHeader>
                                    <CardContent className="overflow-x-auto">
                                      <Table>
                                       <TableHeader>
                                         <TableRow>
                                           <TableHead>Deductible Type</TableHead>
                                           <TableHead>Value</TableHead>
                                           <TableHead>Loading/Discount</TableHead>
                                           <TableHead>Quote Option</TableHead>
                                           <TableHead>Actions</TableHead>
                                         </TableRow>
                                       </TableHeader>
                                       <TableBody>
                                         {ratingConfig.coverRequirements.deductibles?.map((entry) => (
                                           <TableRow key={entry.id}>
                                             <TableCell>
                                               <Select 
                                                 value={entry.deductibleType || 'fixed'} 
                                                 onValueChange={(value) => updateCoverRequirementEntry('deductibles', entry.id, 'deductibleType', value)}
                                               >
                                                 <SelectTrigger className="w-48">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                   <SelectItem value="percentage-loss">Percentage of Loss</SelectItem>
                                                   <SelectItem value="percentage-sum-insured">Percentage of Sum Insured</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 step="0.01"
                                                 value={entry.value || 0}
                                                 onChange={(e) => updateCoverRequirementEntry('deductibles', entry.id, 'value', parseFloat(e.target.value) || 0)}
                                                 className="w-32"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Input
                                                 type="number"
                                                 step="0.01"
                                                 value={entry.loadingDiscount || 0}
                                                 onChange={(e) => updateCoverRequirementEntry('deductibles', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                                                 className="w-24"
                                               />
                                             </TableCell>
                                             <TableCell>
                                               <Select 
                                                 value={entry.quoteOption} 
                                                 onValueChange={(value) => updateCoverRequirementEntry('deductibles', entry.id, 'quoteOption', value)}
                                               >
                                                 <SelectTrigger className="w-32">
                                                   <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                   <SelectItem value="quote">Auto Quote</SelectItem>
                                                   <SelectItem value="no-quote">No Quote</SelectItem>
                                                 </SelectContent>
                                               </Select>
                                             </TableCell>
                                             <TableCell>
                                               <Button
                                                 variant="ghost"
                                                 size="sm"
                                                 onClick={() => removeCoverRequirementEntry('deductibles', entry.id)}
                                                 className="text-destructive hover:text-destructive"
                                               >
                                                 Remove
                                               </Button>
                                             </TableCell>
                                           </TableRow>
                                         )) || (
                                           <TableRow>
                                             <TableCell colSpan={5} className="text-center text-muted-foreground">
                                               No deductibles configured. Click "Add Deductible" to get started.
                                             </TableCell>
                                           </TableRow>
                                         )}
                                       </TableBody>
                                     </Table>
                                   </CardContent>
                                 </Card>
                              </div>
                           </CardContent>
                         </Card>
                       )}

                      {activePricingTab === "clause-pricing" && (
                        <Card className="h-full">
                          <CardHeader>
                            <CardTitle>Clause Pricing Configuration</CardTitle>
                            <CardDescription>Configure pricing for specific policy clauses</CardDescription>
                          </CardHeader>
                           <CardContent className="overflow-x-auto">
                             <div className="grid gap-6">
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
                           </CardContent>
                         </Card>
                        )}

                        {/* Master Management Tabs */}
                        {activePricingTab === "construction-types" && (
                          <Card className="h-full">
                            <CardHeader>
                              <CardTitle>Construction Types</CardTitle>
                              <CardDescription>Configure pricing for different construction types</CardDescription>
                            </CardHeader>
                           <CardContent className="overflow-x-auto">
                             <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Construction Type</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Loading/Discount</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {activeConstructionTypes.map((type) => (
                                    <TableRow key={type.id}>
                                      <TableCell className="font-medium">{type.label}</TableCell>
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
                                        <Input type="number" defaultValue="2.5" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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
                             <CardContent className="overflow-x-auto">
                               <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Loading/Discount</TableHead>
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
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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
                           <CardContent className="overflow-x-auto">
                             <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Loading/Discount</TableHead>
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
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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
                             <CardContent className="overflow-x-auto">
                               <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Zone</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Loading/Discount</TableHead>
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
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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
                             <CardContent className="overflow-x-auto">
                               <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Role Type</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Loading/Discount</TableHead>
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
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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
                                    <TableHead>Loading/Discount</TableHead>
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
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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
                                    <TableHead>Loading/Discount</TableHead>
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
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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
                                    <TableHead>Loading/Discount</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {['Electrical', 'Plumbing', 'HVAC', 'Painting', 'Flooring', 'Roofing', 'Landscaping', 'Security'].map((contractor, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-medium">{contractor}</TableCell>
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
                                        <Input type="number" defaultValue="3.0" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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
                                    <TableHead>Loading/Discount</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {['Architect', 'Structural Engineer', 'MEP Engineer', 'Geotechnical', 'Environmental', 'Planning', 'Quantity Surveyor'].map((consultant, index) => (
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
                                        <Input type="number" defaultValue="2.2" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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
                                    <TableHead>Loading/Discount</TableHead>
                                    <TableHead>Quote Options</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {['Basic Security', 'Enhanced Security', 'CCTV Monitoring', 'Access Control', 'Alarm Systems'].map((security, index) => (
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
                                        <Input type="number" defaultValue="1.3" className="w-24" />
                                      </TableCell>
                                      <TableCell>
                                        <Select defaultValue="quote">
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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
                                    <TableHead>Loading/Discount</TableHead>
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
                                            <SelectItem value="quote">Auto Quote</SelectItem>
                                            <SelectItem value="no-quote">No Quote</SelectItem>
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

                        {activePricingTab === "fee-types" && (
                          <Card className="h-full">
                            <CardHeader>
                              <div className="flex justify-between items-center">
                                <div>
                                  <CardTitle>Fee Types</CardTitle>
                                  <CardDescription>Configure fees and taxes applicable to quotes (VAT, GST, etc.)</CardDescription>
                                </div>
                                <Button onClick={() => {
                                  const newId = Math.max(...ratingConfig.feeTypes.map(f => f.id), 0) + 1;
                                  setRatingConfig(prev => ({
                                    ...prev,
                                    feeTypes: [...prev.feeTypes, {
                                      id: newId,
                                      label: "New Fee",
                                      pricingType: "percentage",
                                      value: 0,
                                      active: true
                                    }]
                                  }));
                                  markAsChanged();
                                }}>
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Fee Type
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {ratingConfig.feeTypes.map((fee) => (
                                    <TableRow key={fee.id}>
                                      <TableCell>
                                        <Input
                                          value={fee.label}
                                          onChange={(e) => {
                                            setRatingConfig(prev => ({
                                              ...prev,
                                              feeTypes: prev.feeTypes.map(f =>
                                                f.id === fee.id ? { ...f, label: e.target.value } : f
                                              )
                                            }));
                                            markAsChanged();
                                          }}
                                          className="w-full"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={fee.pricingType}
                                          onValueChange={(value: "percentage" | "fixed") => {
                                            setRatingConfig(prev => ({
                                              ...prev,
                                              feeTypes: prev.feeTypes.map(f =>
                                                f.id === fee.id ? { ...f, pricingType: value } : f
                                              )
                                            }));
                                            markAsChanged();
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="number"
                                            step={fee.pricingType === "percentage" ? "0.01" : "1"}
                                            value={fee.value}
                                            onChange={(e) => {
                                              setRatingConfig(prev => ({
                                                ...prev,
                                                feeTypes: prev.feeTypes.map(f =>
                                                  f.id === fee.id ? { ...f, value: parseFloat(e.target.value) || 0 } : f
                                                )
                                              }));
                                              markAsChanged();
                                            }}
                                            className="w-20"
                                          />
                                          <span className="text-sm text-muted-foreground">
                                            {fee.pricingType === "percentage" ? "%" : "AED"}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge 
                                          variant={fee.active ? "default" : "secondary"}
                                          className="cursor-pointer"
                                          onClick={() => {
                                            setRatingConfig(prev => ({
                                              ...prev,
                                              feeTypes: prev.feeTypes.map(f =>
                                                f.id === fee.id ? { ...f, active: !f.active } : f
                                              )
                                            }));
                                            markAsChanged();
                                          }}
                                        >
                                          {fee.active ? "Active" : "Inactive"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setRatingConfig(prev => ({
                                              ...prev,
                                              feeTypes: prev.feeTypes.filter(f => f.id !== fee.id)
                                            }));
                                            markAsChanged();
                                          }}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
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
              
              {/* TPL limit & Extensions Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>TPL limit & Extensions</CardTitle>
                      <CardDescription>
                        Configure Third Party Liability limit and related extensions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* TPL Limit Input */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tpl-limit">Default TPL Limit (AED)</Label>
                      <Input
                        id="tpl-limit"
                        value={tplLimit}
                        onChange={(e) => setTplLimit(e.target.value)}
                        placeholder="Enter TPL limit amount"
                      />
                    </div>
                  </div>

                  {/* TPL Limit Extensions Table */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">TPL Limit Extensions</h4>
                      <Button
                        onClick={() => {
                          const newExtension = {
                            id: Date.now(),
                            title: "",
                            description: "",
                            tplLimitValue: "",
                            pricingType: "percentage" as "percentage" | "fixed",
                            loadingDiscount: 0
                          };
                          setTplExtensions([...tplExtensions, newExtension]);
                        }}
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Extension
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>TPL Limit Value (AED)</TableHead>
                          <TableHead>Pricing Type</TableHead>
                          <TableHead>Loading/Discount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tplExtensions.map((extension) => (
                          <TableRow key={extension.id}>
                            <TableCell>
                              <Input
                                value={extension.title}
                                onChange={(e) => {
                                  setTplExtensions(tplExtensions.map(ext =>
                                    ext.id === extension.id ? { ...ext, title: e.target.value } : ext
                                  ));
                                }}
                                placeholder="Enter title"
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={extension.description}
                                onChange={(e) => {
                                  setTplExtensions(tplExtensions.map(ext =>
                                    ext.id === extension.id ? { ...ext, description: e.target.value } : ext
                                  ));
                                }}
                                placeholder="Enter description"
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={extension.tplLimitValue}
                                onChange={(e) => {
                                  setTplExtensions(tplExtensions.map(ext =>
                                    ext.id === extension.id ? { ...ext, tplLimitValue: e.target.value } : ext
                                  ));
                                }}
                                placeholder="Enter limit value"
                                className="w-full"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={extension.pricingType}
                                onValueChange={(value: "percentage" | "fixed") => {
                                  setTplExtensions(tplExtensions.map(ext =>
                                    ext.id === extension.id ? { ...ext, pricingType: value } : ext
                                  ));
                                }}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">Percentage</SelectItem>
                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={extension.loadingDiscount}
                                  onChange={(e) => {
                                    setTplExtensions(tplExtensions.map(ext =>
                                      ext.id === extension.id ? { ...ext, loadingDiscount: parseFloat(e.target.value) || 0 } : ext
                                    ));
                                  }}
                                  placeholder="0"
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {extension.pricingType === "percentage" ? "%" : "AED"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setTplExtensions(tplExtensions.filter(ext => ext.id !== extension.id));
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          toast({
                            title: "TPL Extensions Saved",
                            description: "TPL limit extensions have been saved successfully.",
                          });
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Extensions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                    <div className="flex items-center gap-2">
                      <Button onClick={() => setIsAddClauseDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Clause
                      </Button>
                    </div>
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
                          markAsChanged();
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
                      <Button onClick={saveConfiguration} size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save Configuration
                      </Button>
                      <Button
                        variant="outline"
                        onClick={openUploadDialog}
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
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(wording)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload/Edit Wording Dialog */}
              <Dialog open={isWordingUploadDialogOpen} onOpenChange={setIsWordingUploadDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingWording ? "Edit Policy Wording" : "Upload Policy Wording"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="wording-title">Title</Label>
                      <Input
                        id="wording-title"
                        value={wordingUploadTitle}
                        onChange={(e) => setWordingUploadTitle(e.target.value)}
                        placeholder="Enter document title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="wording-file">
                        {editingWording ? "Upload New Document (Optional)" : "Upload Document"}
                      </Label>
                      <Input
                        id="wording-file"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="mt-1"
                      />
                    </div>
                    {editingWording && (
                      <p className="text-sm text-muted-foreground">
                        Leave document field empty to keep the existing file and only update the title.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsWordingUploadDialogOpen(false);
                        setWordingUploadTitle("");
                        setEditingWording(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (editingWording) {
                          // Save changes for existing wording
                          if (wordingUploadTitle.trim()) {
                            setUploadedWordings(prev => 
                              prev.map(w => 
                                w.id === editingWording.id 
                                  ? { ...w, name: wordingUploadTitle }
                                  : w
                              )
                            );
                            toast({
                              title: "Document updated",
                              description: `${wordingUploadTitle} has been updated successfully.`,
                            });
                            setIsWordingUploadDialogOpen(false);
                            setWordingUploadTitle("");
                            setEditingWording(null);
                          }
                        } else {
                          // Trigger file upload for new document
                          document.getElementById('wording-file')?.click();
                        }
                      }}
                      disabled={!wordingUploadTitle.trim()}
                    >
                      {editingWording ? "Save" : "Upload"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

            </TabsContent>

            {/* Quote Format Tab */}
            <TabsContent value="quote-format" className="space-y-6">
              
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
                    <Button onClick={saveConfiguration} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input 
                        id="company-name" 
                        value={quoteConfig.header.companyName}
                        onChange={(e) => updateQuoteConfig('header', 'companyName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quote-prefix">Quotation Number Prefix</Label>
                      <Input 
                        id="quote-prefix" 
                        value={quoteConfig.details.quotePrefix}
                        onChange={(e) => updateQuoteConfig('details', 'quotePrefix', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo-upload">Company Logo</Label>
                      <div className="flex gap-2">
                        <Input id="logo-upload" type="file" accept="image/*" />
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
                        value={quoteConfig.header.companyAddress}
                        onChange={(e) => updateQuoteConfig('header', 'companyAddress', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-info">Contact Information</Label>
                      <Textarea 
                        id="contact-info" 
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
                        type="color" 
                        value={quoteConfig.header.headerColor}
                        onChange={(e) => updateQuoteConfig('header', 'headerColor', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="header-text-color">Header Text Color</Label>
                      <Input 
                        id="header-text-color" 
                        type="color" 
                        value={quoteConfig.header.headerTextColor}
                        onChange={(e) => updateQuoteConfig('header', 'headerTextColor', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo-position">Logo Position</Label>
                      <Select 
                        value={quoteConfig.header.logoPosition}
                        onValueChange={(value) => updateQuoteConfig('header', 'logoPosition', value)}
                      >
                        <SelectTrigger>
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
                        <SelectTrigger>
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

              {/* Preview & Save Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>Preview and save your quote template configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={showPreview}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Template
                    </Button>
                    <Button onClick={saveConfiguration}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* Required Documents Tab */}
            <TabsContent value="required-documents" className="space-y-6">
              
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
                          <Button onClick={handleAddDocument}>
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

            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />

      {/* Save Configuration Confirmation Dialog */}
      <AlertDialog open={isConfirmSaveDialogOpen} onOpenChange={setIsConfirmSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save the current configuration? This will overwrite any previously saved settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Save Configuration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={isUnsavedChangesDialogOpen} onOpenChange={setIsUnsavedChangesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardChanges}>
              Discard Changes
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndContinue}>
              Save and Continue
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
    </div>
  );
};

export default SingleProductConfig;