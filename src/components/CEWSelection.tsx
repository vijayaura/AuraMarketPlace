import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Info, Percent } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CEWOption {
  id: number;
  label: string;
  description: string;
  limits: string;
  type: "percentage" | "amount";
  value: number;
  recommended?: boolean;
}

interface CEWItem {
  id: number;
  code: string;
  name: string;
  type: "condition" | "extension" | "warranty";
  category: string;
  description: string;
  isMandatory: boolean;
  isSelected: boolean;
  isPremium?: boolean;
  options: CEWOption[];
  selectedOptionId?: number;
  impact: {
    coverage: string;
    premium: "increase" | "decrease" | "neutral";
    premiumAmount: number;
  };
  defaultValue: number;
}

interface CEWSelectionProps {
  onSelectionChange?: (selectedItems: CEWItem[]) => void;
  onPremiumChange?: (totalAdjustment: number) => void;
  onTPLAdjustmentChange?: (tplAdjustment: number) => void;
  onCEWAdjustmentChange?: (cewAdjustment: number) => void;
  onCommissionChange?: (commission: number) => void;
  onTPLSelectionChange?: (tplOption: any) => void;
  productConfigBundle?: any;
  isLoadingProductConfig?: boolean;
}

export const CEWSelection = ({ onSelectionChange, onPremiumChange, onTPLAdjustmentChange, onCEWAdjustmentChange, onCommissionChange, onTPLSelectionChange, productConfigBundle, isLoadingProductConfig }: CEWSelectionProps) => {
  // Broker commission constraints (mock data - in real app this would come from user context)
  const brokerCommissionLimits = {
    min: 2.5,
    max: 8.0,
    current: 5.0
  };

  // State for expanded/collapsed clauses
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
  // State for expanded descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());

  // Update cewItems when productConfigBundle changes
  useEffect(() => {
    if (productConfigBundle) {
      const transformedItems = transformProductConfigToCEWItems(productConfigBundle);
      // Auto-select mandatory items
      const itemsWithMandatorySelected = transformedItems.map(item => ({
        ...item,
        isSelected: item.isMandatory || item.isSelected
      }));
      setCEWItems(itemsWithMandatorySelected);
      onSelectionChange?.(itemsWithMandatorySelected);
    }
  }, [productConfigBundle]);

  // Transform product config bundle data to CEW items
  const transformProductConfigToCEWItems = (configBundle: any): CEWItem[] => {
    if (!configBundle?.clause_pricing_config) return [];
    
    return configBundle.clause_pricing_config.map((clause: any, index: number) => ({
      id: clause.id,
      code: clause.clause_code,
      name: clause.meta?.title || clause.clause_code,
      type: clause.meta?.clause_type?.toLowerCase() === 'warranty' ? 'warranty' : 
            clause.meta?.clause_type?.toLowerCase() === 'exclusion' ? 'condition' : 'extension',
      category: clause.meta?.clause_type || 'Extension',
      description: clause.meta?.purpose_description || clause.meta?.clause_wording || 'No description available',
      isMandatory: clause.meta?.show_type === 'MANDATORY',
      isSelected: clause.meta?.show_type === 'MANDATORY', // Auto-select mandatory items
      isPremium: false,
      options: clause.options?.map((option: any, optIndex: number) => ({
        id: optIndex + 1,
        label: option.label,
        description: option.limit,
        limits: option.limit,
        type: option.type?.toLowerCase() === 'percentage' ? 'percentage' : 'amount',
        value: option.value,
        recommended: optIndex === 0 // First option is recommended
      })) || [],
      selectedOptionId: clause.meta?.show_type === 'MANDATORY' && clause.options?.length > 0 ? 1 : undefined, // Auto-select first option for mandatory items
      impact: {
        coverage: clause.meta?.clause_wording || 'Standard coverage',
        premium: clause.base_value > 0 ? 'increase' : clause.base_value < 0 ? 'decrease' : 'neutral',
        premiumAmount: Math.abs(parseFloat(clause.base_value) || 0)
      },
      defaultValue: parseFloat(clause.base_value) || 0
    }));
  };

  // Transform TPL extensions from product config bundle
  const transformTPLExtensions = (configBundle: any) => {
    if (!configBundle?.tpl_extensions) return [];
    
    return configBundle.tpl_extensions.map((extension: any, index: number) => ({
      id: extension.id,
      label: `AED ${(parseFloat(extension.limit_value) / 1000000).toFixed(1)}M`,
      value: parseFloat(extension.limit_value),
      description: extension.description || extension.title,
      premiumAdjustment: parseFloat(extension.pricing_value) || 0,
      recommended: index === 0
    }));
  };

  const [cewItems, setCEWItems] = useState<CEWItem[]>([
    {
      id: 1,
      code: "CEW01",
      name: "Maintenance Extension",
      type: "extension",
      category: "Period Extensions",
      description: "Extends coverage into the maintenance period beyond standard 12 months",
      isMandatory: false,
      isSelected: false,
      options: [
        {
          id: 1,
          label: "18 Months",
          description: "Coverage extended to 18 months maintenance",
          limits: "Full project value",
          type: "percentage",
          value: 2.5
        },
        {
          id: 2,
          label: "24 Months",
          description: "Coverage extended to 24 months maintenance",
          limits: "Full project value",
          type: "percentage",
          value: 4.0
        },
        {
          id: 3,
          label: "36 Months",
          description: "Coverage extended to 36 months maintenance",
          limits: "Full project value",
          type: "percentage",
          value: 6.5
        }
      ],
      selectedOptionId: undefined,
      impact: {
        coverage: "Extends material damage coverage during maintenance period",
        premium: "increase",
        premiumAmount: 0 // Will be calculated based on selected option
      },
      defaultValue: 2.5 // Default value for this clause
    },
    {
      id: 2,
      code: "CEW02",
      name: "Professional Indemnity",
      type: "extension",
      category: "Liability Extensions",
      description: "Covers professional liability for design and supervision errors",
      isMandatory: false,
      isSelected: false,
      options: [
        {
          id: 1,
          label: "AED 1M Limit",
          description: "Professional indemnity up to AED 1 Million",
          limits: "AED 1,000,000",
          type: "amount",
          value: 2500
        },
        {
          id: 2,
          label: "AED 2M Limit",
          description: "Professional indemnity up to AED 2 Million",
          limits: "AED 2,000,000",
          type: "amount",
          value: 4500
        },
        {
          id: 3,
          label: "AED 5M Limit",
          description: "Professional indemnity up to AED 5 Million",
          limits: "AED 5,000,000",
          type: "amount",
          value: 8500
        }
      ],
      selectedOptionId: undefined,
      impact: {
        coverage: "Covers errors in professional services and design",
        premium: "increase",
        premiumAmount: 0 // Will be calculated based on selected option
      },
      defaultValue: 4500 // Default value for this clause
    },
    {
      id: 3,
      code: "CEW03",
      name: "Terrorism Coverage",
      type: "extension",
      category: "Special Perils",
      description: "Extends coverage to include acts of terrorism and sabotage",
      isMandatory: false,
      isSelected: false,
      options: [
        {
          id: 1,
          label: "Basic Coverage",
          description: "Covers certified acts of terrorism",
          limits: "Up to 50% of sum insured",
          type: "percentage",
          value: 1.2
        },
        {
          id: 2,
          label: "Enhanced Coverage",
          description: "Covers all acts of terrorism and sabotage",
          limits: "Full sum insured",
          type: "percentage",
          value: 2.8,
        }
      ],
      selectedOptionId: undefined,
      impact: {
        coverage: "Protection against terrorism and sabotage risks",
        premium: "increase",
        premiumAmount: 2.8
      }
    },
    {
      id: 4,
      code: "CEW04",
      name: "Earthquake Exclusion Waiver",
      type: "condition",
      category: "Natural Catastrophe",
      description: "Removes earthquake exclusion for enhanced natural disaster coverage",
      isMandatory: false,
      isSelected: false,
      isPremium: true,
      options: [
        {
          id: 1,
          label: "Zone 1-2 Coverage",
          description: "Coverage for low to moderate seismic zones",
          limits: "Full sum insured",
          type: "percentage",
          value: 3.5
        },
        {
          id: 2,
          label: "Zone 3-4 Coverage",
          description: "Coverage for high seismic risk zones",
          limits: "Full sum insured",
          type: "percentage",
          value: 7.5,
        }
      ],
      selectedOptionId: undefined,
      impact: {
        coverage: "Includes earthquake damage in material damage coverage",
        premium: "increase",
        premiumAmount: 0 // Will be calculated based on selected option
      },
      defaultValue: 7.5 // Default value for this clause
    },
    {
      id: 5,
      code: "CEW05",
      name: "Contractors Plant Deductible",
      type: "condition",
      category: "Deductibles",
      description: "Modify deductible levels for contractors plant and equipment",
      isMandatory: true,
      isSelected: true,
      options: [
        {
          id: 1,
          label: "AED 2,500",
          description: "Standard deductible for plant & equipment",
          limits: "Per claim",
          type: "amount",
          value: 0,
        },
        {
          id: 2,
          label: "AED 5,000",
          description: "Higher deductible for reduced premium",
          limits: "Per claim",
          type: "percentage",
          value: -1.5
        },
        {
          id: 3,
          label: "AED 10,000",
          description: "Highest deductible for maximum premium reduction",
          limits: "Per claim",
          type: "percentage",
          value: -3.0
        }
      ],
      selectedOptionId: 1,
      impact: {
        coverage: "Sets deductible amount for plant & equipment claims",
        premium: "neutral",
        premiumAmount: 0
      },
      defaultValue: 0 // Default value for this clause
    },
    {
      id: 6,
      code: "CEW06",
      name: "Defects Liability",
      type: "warranty",
      category: "Quality Warranties",
      description: "Warranty against defects in materials and workmanship",
      isMandatory: true,
      isSelected: true,
      options: [
        {
          id: 1,
          label: "12 Months",
          description: "Standard defects liability period",
          limits: "Repair/replacement costs",
          type: "percentage",
          value: 0,
        },
        {
          id: 2,
          label: "24 Months",
          description: "Extended defects liability period",
          limits: "Repair/replacement costs",
          type: "percentage",
          value: 1.8
        }
      ],
      selectedOptionId: 1,
      impact: {
        coverage: "Covers cost of repairing defective work",
        premium: "neutral",
        premiumAmount: 0
      },
      defaultValue: 0 // Default value for this clause
    }
  ]);

  const [commissionPercentage, setCommissionPercentage] = useState(brokerCommissionLimits.current);
  const [commissionError, setCommissionError] = useState("");

  // Initialize mandatory items on component mount
  useEffect(() => {
    // Trigger selection change to notify parent about mandatory items
    onSelectionChange?.(cewItems);
  }, []);

  // Toggle expanded state for a clause
  const toggleClauseExpansion = (itemId: number) => {
    setExpandedClauses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Toggle expanded state for a description
  const toggleDescriptionExpansion = (itemId: number) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleCommissionChange = (value: string) => {
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      setCommissionError("Please enter a valid number");
      return;
    }
    
    if (numValue < brokerCommissionLimits.min) {
      setCommissionError(`Commission cannot be less than ${brokerCommissionLimits.min}%`);
      setCommissionPercentage(numValue);
      return;
    }
    
    if (numValue > brokerCommissionLimits.max) {
      setCommissionError(`Commission cannot exceed ${brokerCommissionLimits.max}%`);
      setCommissionPercentage(numValue);
      return;
    }
    
    setCommissionError("");
    setCommissionPercentage(numValue);
    onCommissionChange?.(numValue);
  };

  const toggleSelection = (itemId: number) => {
    if (cewItems.find(item => item.id === itemId)?.isMandatory) return;
    
    const updatedItems = cewItems.map(item =>
      item.id === itemId ? { ...item, isSelected: !item.isSelected } : item
    );
    setCEWItems(updatedItems);
    onSelectionChange?.(updatedItems);
    
    // Calculate total premium adjustment including TPL
    const tplAdjustment = tplLimitOptions.find(opt => opt.id === selectedTPLLimit)?.premiumAdjustment || 0;
    const cewAdjustment = updatedItems
      .filter(item => item.isSelected)
      .reduce((sum, item) => {
        const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
        if (selectedOption) {
          return sum + (selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000);
        }
        return sum;
      }, 0);
    
    // Call separate callbacks
    onTPLAdjustmentChange?.(tplAdjustment);
    onCEWAdjustmentChange?.(cewAdjustment);
    onPremiumChange?.(tplAdjustment + cewAdjustment);
  };

  const updateSelection = (itemId: number, optionId: number) => {
    const item = cewItems.find(item => item.id === itemId);
    if (!item) return;
    
    const updatedItems = cewItems.map(item => {
      if (item.id === itemId) {
        // For mandatory items, don't allow unselection, only option changes
        if (item.isMandatory) {
          // Select new option (mandatory items stay selected)
          const selectedOption = item.options.find(opt => opt.id === optionId);
          return {
            ...item,
            isSelected: true, // Always keep mandatory items selected
            selectedOptionId: optionId,
            impact: {
              ...item.impact,
              premiumAmount: selectedOption ? (selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000) : 0
            }
          };
        } else {
          // For non-mandatory items, allow unselection
          if (item.selectedOptionId === optionId) {
            return {
              ...item,
              isSelected: false,
              selectedOptionId: undefined,
              impact: {
                ...item.impact,
                premiumAmount: 0
              }
            };
          } else {
            // Select new option
            const selectedOption = item.options.find(opt => opt.id === optionId);
            return {
              ...item,
              isSelected: true,
              selectedOptionId: optionId,
              impact: {
                ...item.impact,
                premiumAmount: selectedOption ? (selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000) : 0
              }
            };
          }
        }
      }
      return item;
    });
    setCEWItems(updatedItems);
    onSelectionChange?.(updatedItems);
    
    // Recalculate premium adjustment including TPL
    const tplAdjustment = tplLimitOptions.find(opt => opt.id === selectedTPLLimit)?.premiumAdjustment || 0;
    const cewAdjustment = updatedItems
      .filter(item => item.isSelected)
      .reduce((sum, item) => {
        const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
        if (selectedOption) {
          return sum + (selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000);
        }
        return sum;
      }, 0);
    
    // Call separate callbacks
    onTPLAdjustmentChange?.(tplAdjustment);
    onCEWAdjustmentChange?.(cewAdjustment);
    onPremiumChange?.(tplAdjustment + cewAdjustment);
  };

  const formatPremiumImpact = (item: CEWItem) => {
    const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
    if (!selectedOption) return "";
    
    if (selectedOption.type === "percentage") {
      const sign = selectedOption.value > 0 ? "+" : "";
      return `${sign}${selectedOption.value}%`;
    } else {
      return `+AED ${selectedOption.value.toLocaleString()}`;
    }
  };

  const formatDefaultValue = (item: CEWItem) => {
    if (item.defaultValue === 0) return "No impact";
    
    // Determine if it's percentage or amount based on the first option's type
    const firstOption = item.options[0];
    if (firstOption?.type === "percentage") {
      const sign = item.defaultValue > 0 ? "+" : "";
      return `${sign}${item.defaultValue}%`;
    } else {
      return `+AED ${item.defaultValue.toLocaleString()}`;
    }
  };

  const getTotalPremiumAdjustment = () => {
    const tplAdjustment = tplLimitOptions.find(opt => opt.id === selectedTPLLimit)?.premiumAdjustment || 0;
    const cewAdjustment = cewItems
      .filter(item => item.isSelected)
      .reduce((sum, item) => {
        const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
        if (selectedOption) {
          return sum + (selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000);
        }
        return sum;
      }, 0);
    return tplAdjustment + cewAdjustment;
  };

  // TPL Limit options from product config bundle or default
  const tplLimitOptions = productConfigBundle ? transformTPLExtensions(productConfigBundle) : [
    { id: 1, label: "AED 1M", value: 1000000, description: "Third Party Liability up to AED 1 Million", premiumAdjustment: -1.5 },
    { id: 2, label: "AED 2M", value: 2000000, description: "Third Party Liability up to AED 2 Million", premiumAdjustment: 0, recommended: true },
    { id: 3, label: "AED 5M", value: 5000000, description: "Third Party Liability up to AED 5 Million", premiumAdjustment: 2.5 },
    { id: 4, label: "AED 10M", value: 10000000, description: "Third Party Liability up to AED 10 Million", premiumAdjustment: 5.0 }
  ];

  const [selectedTPLLimit, setSelectedTPLLimit] = useState(2); // Default to AED 2M
  
  const handleTPLLimitChange = (value: string) => {
    const newTPLId = parseInt(value);
    
    // If clicking the same TPL limit that's already selected, deselect it
    if (selectedTPLLimit === newTPLId) {
      setSelectedTPLLimit(0); // 0 means no selection
      onTPLAdjustmentChange?.(0);
      onCEWAdjustmentChange?.(0);
      onPremiumChange?.(0);
      onTPLSelectionChange?.(null); // Clear TPL selection
      return;
    }
    
    setSelectedTPLLimit(newTPLId);
    
    // Get the selected TPL option
    const selectedTPLOption = tplLimitOptions.find(opt => opt.id === newTPLId);
    
    // Get separate adjustments
    const tplAdjustment = selectedTPLOption?.premiumAdjustment || 0;
    const cewAdjustment = cewItems
      .filter(item => item.isSelected)
      .reduce((sum, item) => {
        const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
        if (selectedOption) {
          return sum + (selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000);
        }
        return sum;
      }, 0);
    
    // Call separate callbacks
    onTPLAdjustmentChange?.(tplAdjustment);
    onCEWAdjustmentChange?.(cewAdjustment);
    onPremiumChange?.(tplAdjustment + cewAdjustment);
    onTPLSelectionChange?.(selectedTPLOption); // Pass selected TPL option
  };

  // Show loading state while product config is being fetched
  if (isLoadingProductConfig) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading product configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TPL Limit Extensions Section */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">TPL Limit Extensions</h2>
            {productConfigBundle?.tpl_limits?.default_limit && (
              <div className="text-sm text-muted-foreground">
                Default: AED {parseFloat(productConfigBundle.tpl_limits.default_limit).toLocaleString()}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Select your Third Party Liability coverage limit
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {tplLimitOptions.map((option) => {
            const isSelected = selectedTPLLimit === option.id;
            return (
              <Card 
                key={option.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected 
                    ? "border-primary bg-primary/10 ring-1 ring-primary" 
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleTPLLimitChange(option.id.toString())}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{option.label}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">{option.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">Premium Impact</span>
                      <span className={`text-xs font-medium ${
                        option.premiumAdjustment > 0 ? "text-warning" : 
                        option.premiumAdjustment < 0 ? "text-success" : "text-muted-foreground"
                      }`}>
                        {option.premiumAdjustment > 0 && "+"}
                        {option.premiumAdjustment}%
                      </span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary">Selected</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Policy Extensions & Conditions Section */}
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">Policy Extensions & Conditions</h2>
        <p className="text-xs text-muted-foreground">
          Customize your coverage with additional protections and specific terms
        </p>
      </div>

      {/* CEW Items List */}
      <div className="space-y-3">
        {cewItems
          .sort((a, b) => {
            // Mandatory items first, then by name
            if (a.isMandatory && !b.isMandatory) return -1;
            if (!a.isMandatory && b.isMandatory) return 1;
            return a.name.localeCompare(b.name);
          })
          .map(item => (
          <div
            key={item.id}
            className={`p-3 border rounded-lg transition-all ${
              item.isMandatory 
                ? "bg-primary/5 border-primary/30" 
                : item.isSelected 
                ? "bg-accent/10 border-accent/50" 
                : "bg-card border-border hover:border-accent/30"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox/Status */}
              <div>
                {item.isMandatory ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-xs text-primary font-medium">Required</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={item.isSelected}
                      onChange={() => toggleSelection(item.id)}
                      className="sr-only"
                      id={`checkbox-${item.id}`}
                    />
                    <label
                      htmlFor={`checkbox-${item.id}`}
                      className={`w-4 h-4 rounded border-2 cursor-pointer transition-all duration-200 flex items-center justify-center ${
                        item.isSelected
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-gray-300 hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      {item.isSelected && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                    </label>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 space-y-2">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                      <Badge variant="outline" className="text-xs px-1 py-0">{item.code}</Badge>
                      <Badge 
                        variant={item.type === "extension" ? "default" : item.type === "condition" ? "secondary" : "outline"}
                        className="text-xs px-1 py-0"
                      >
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Badge>
                      {item.isMandatory && (
                        <Badge variant="destructive" className="text-xs px-1 py-0">Mandatory</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${
                        item.selectedOptionId 
                          ? (item.impact.premium === "increase" ? "text-warning" : 
                             item.impact.premium === "decrease" ? "text-success" : "text-muted-foreground")
                          : (item.defaultValue > 0 ? "text-warning" : "text-muted-foreground")
                      }`}>
                        {item.selectedOptionId ? formatPremiumImpact(item) : formatDefaultValue(item)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleClauseExpansion(item.id)}
                        className="text-xs h-6 px-2"
                      >
                        {expandedClauses.has(item.id) ? 'Hide options' : 'View options'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Description with two-line truncation and view more */}
                  <div className="mt-2">
                    <p 
                      className={`text-sm text-muted-foreground ${
                        !expandedDescriptions.has(item.id) ? 'overflow-hidden' : ''
                      }`}
                      style={{
                        display: !expandedDescriptions.has(item.id) ? '-webkit-box' : 'block',
                        WebkitLineClamp: !expandedDescriptions.has(item.id) ? 2 : 'unset',
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {item.description}
                    </p>
                    {item.description.length > 100 && (
                      <button
                        onClick={() => toggleDescriptionExpansion(item.id)}
                        className="text-xs text-primary hover:text-primary/80 mt-1 font-medium"
                      >
                        {expandedDescriptions.has(item.id) ? 'View less' : 'View more'}
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm">{item.impact.coverage}</p>
                </div>


                {/* Available Options Grid - Only show when expanded */}
                {expandedClauses.has(item.id) && (
                  <div className="space-y-2 mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {item.options.map(option => {
                          const isSelected = option.id === item.selectedOptionId;
                          return (
                            <Card 
                              key={option.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                isSelected 
                                  ? "border-primary bg-primary/10 ring-1 ring-primary" 
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => updateSelection(item.id, option.id)}
                            >
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-foreground">{option.label}</h3>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-tight">{option.description}</p>
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-muted-foreground">Premium Impact</span>
                                    <span className={`text-xs font-medium ${
                                      option.value > 0 ? "text-warning" : 
                                      option.value < 0 ? "text-success" : "text-muted-foreground"
                                    }`}>
                                      {option.type === "percentage" 
                                        ? `${option.value > 0 ? "+" : ""}${option.value}%`
                                        : `${option.value > 0 ? "+" : ""}AED ${option.value.toLocaleString()}`
                                      }
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <div className="flex items-center gap-1 pt-1">
                                      <CheckCircle2 className="w-3 h-3 text-primary" />
                                      <span className="text-xs text-primary">Selected</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};