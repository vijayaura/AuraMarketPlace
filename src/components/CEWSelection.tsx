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
  // State for expanded clause wordings
  const [expandedWording, setExpandedWording] = useState<Set<number>>(new Set());

  // Helper function to calculate premium impact for an item
  const calculateItemPremiumImpact = (item: CEWItem): number => {
    if (!item.isSelected) return 0;
    
    const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
    if (selectedOption) {
      // Use selected option's value
      return selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000;
    } else {
      // Use base rate when no option is selected
      return item.defaultValue;
    }
  };

  // Update cewItems when productConfigBundle changes
  useEffect(() => {
    if (productConfigBundle) {
      console.log('🔧 Product config bundle received:', productConfigBundle);
      const transformedItems = transformProductConfigToCEWItems(productConfigBundle);
      console.log('🔧 Transformed items:', transformedItems);
      
      // Auto-select mandatory items from product config
      const itemsWithMandatorySelected = transformedItems.map(item => ({
        ...item,
        isSelected: item.isMandatory || item.isSelected
      }));
      
      console.log('🔧 Items with mandatory selected:', itemsWithMandatorySelected);
      setCEWItems(itemsWithMandatorySelected);
      onSelectionChange?.(itemsWithMandatorySelected);
    }
  }, [productConfigBundle]);

  // Calculate initial adjustments when CEW items change
  useEffect(() => {
    if (cewItems.length > 0) {
      console.log('🔧 CEW Items for adjustment calculation:', cewItems);
      const selectedItems = cewItems.filter(item => item.isSelected);
      console.log('🔧 Selected CEW Items:', selectedItems);
      
      const cewAdjustment = selectedItems.reduce((sum, item) => {
        const impact = calculateItemPremiumImpact(item);
        console.log(`🔧 Item ${item.name} (${item.code}): impact = ${impact}, isSelected = ${item.isSelected}, isMandatory = ${item.isMandatory}`);
        return sum + impact;
      }, 0);
      
      console.log('🔧 Total CEW Adjustment calculated:', cewAdjustment);
      onCEWAdjustmentChange?.(cewAdjustment);
    }
  }, [cewItems]);

  // Transform product config bundle data to CEW items
  const transformProductConfigToCEWItems = (configBundle: any): CEWItem[] => {
    if (!configBundle?.clause_pricing_config) return [];
    
    return configBundle.clause_pricing_config.map((clause: any, index: number) => ({
      id: clause.id,
      code: clause.clause_code,
      name: clause.meta?.title || clause.clause_code,
      type: (clause.meta?.clause_type && typeof clause.meta.clause_type === 'string' && clause.meta.clause_type.toLowerCase() === 'warranty') ? 'warranty' : 
            (clause.meta?.clause_type && typeof clause.meta.clause_type === 'string' && clause.meta.clause_type.toLowerCase() === 'exclusion') ? 'condition' : 'extension',
      category: clause.meta?.clause_type || 'Extension',
      description: clause.meta?.purpose_description || clause.meta?.clause_wording || 'No description available',
      isMandatory: clause.meta?.show_type === 'MANDATORY',
      isSelected: clause.meta?.show_type === 'MANDATORY', // Auto-select mandatory items from config
      isPremium: false,
      options: clause.options?.map((option: any, optIndex: number) => ({
        id: optIndex + 1,
        label: option.label,
        description: option.limit,
        limits: option.limit,
        type: (option.type && typeof option.type === 'string' && option.type.toLowerCase() === 'percentage') ? 'percentage' : 'amount',
        value: option.value,
        recommended: optIndex === 0 // First option is recommended
      })) || [],
      selectedOptionId: undefined, // Don't auto-select options for mandatory items
      impact: {
        coverage: clause.meta?.clause_wording || 'Standard coverage',
        premium: clause.pricing_value > 0 ? 'increase' : clause.pricing_value < 0 ? 'decrease' : 'neutral',
        premiumAmount: Math.abs(parseFloat(clause.pricing_value) || 0)
      },
      // Use the base rate from pricing configuration
      defaultValue: (() => {
        const value = clause.pricing_type === 'PERCENTAGE' ? parseFloat(clause.pricing_value) || 0 : parseFloat(clause.pricing_value) || 0;
        console.log('🔧 transformProductConfigToCEWItems - clause:', clause.clause_code, 'pricing_value:', clause.pricing_value, 'pricing_type:', clause.pricing_type, 'defaultValue:', value);
        return value;
      })()
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

  const [cewItems, setCEWItems] = useState<CEWItem[]>([]);

  const [commissionPercentage, setCommissionPercentage] = useState(brokerCommissionLimits.current);
  const [commissionError, setCommissionError] = useState("");

  // Initialize empty state on component mount
  useEffect(() => {
    // Trigger selection change to notify parent about initial empty state
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

  // Toggle expanded state for clause wording
  const toggleWordingExpansion = (itemId: number) => {
    setExpandedWording(prev => {
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
      .reduce((sum, item) => sum + calculateItemPremiumImpact(item), 0);
    
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
        // For mandatory items, allow option deselection but keep item selected
        if (item.isMandatory) {
          // If clicking the same option, deselect it (use base value)
          if (item.selectedOptionId === optionId) {
            return {
              ...item,
              isSelected: true, // Keep mandatory item selected
              selectedOptionId: undefined, // Deselect option (use base value)
              impact: {
                ...item.impact,
                premiumAmount: item.defaultValue // Use base value when no option selected
              }
            };
          } else {
            // Select new option
            const selectedOption = item.options.find(opt => opt.id === optionId);
            return {
              ...item,
              isSelected: true, // Always keep mandatory items selected
              selectedOptionId: optionId,
              impact: {
                ...item.impact,
                premiumAmount: selectedOption ? (selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000) : item.defaultValue
              }
            };
          }
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
                premiumAmount: selectedOption ? (selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000) : item.defaultValue
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
      .reduce((sum, item) => sum + calculateItemPremiumImpact(item), 0);
    
    // Call separate callbacks
    onTPLAdjustmentChange?.(tplAdjustment);
    onCEWAdjustmentChange?.(cewAdjustment);
    onPremiumChange?.(tplAdjustment + cewAdjustment);
  };

  // Helper function to get potential impact regardless of selection status
  const getPotentialImpact = (item: CEWItem): number => {
    const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
    if (selectedOption) {
      return selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000;
    } else {
      return item.defaultValue;
    }
  };

  const formatPremiumImpact = (item: CEWItem) => {
    const premiumImpact = calculateItemPremiumImpact(item);
    if (premiumImpact === 0) return "No impact";
    
    // Determine if it's percentage or amount based on the first option's type or item's default type
    const firstOption = item.options[0];
    const isPercentage = firstOption?.type === "percentage" || 
                        (item.options.length === 0 && item.defaultValue !== 0 && Math.abs(item.defaultValue) <= 100);
    
    if (isPercentage) {
      const sign = premiumImpact > 0 ? "+" : "";
      return `${sign}${premiumImpact}%`;
    } else {
      return `+AED ${premiumImpact.toLocaleString()}`;
    }
  };

  const formatPotentialImpact = (item: CEWItem) => {
    // Show base rate from pricing configuration when no option is selected
    if (!item.selectedOptionId) {
      const baseRate = item.defaultValue;
      console.log('🔧 formatPotentialImpact - item:', item.name, 'baseRate:', baseRate, 'selectedOptionId:', item.selectedOptionId);
      
      // Determine if it's percentage or amount based on the first option's type or item's default type
      const firstOption = item.options[0];
      const isPercentage = firstOption?.type === "percentage" || 
                          (item.options.length === 0 && Math.abs(baseRate) <= 100);
      
      console.log('🔧 formatPotentialImpact - firstOption:', firstOption, 'isPercentage:', isPercentage);
      
      if (isPercentage) {
        const sign = baseRate > 0 ? "+" : "";
        return `${sign}${baseRate}%`;
      } else {
        return `+AED ${baseRate.toLocaleString()}`;
      }
    }
    
    // Show selected option impact when an option is selected
    const potentialImpact = getPotentialImpact(item);
    
    // Determine if it's percentage or amount based on the first option's type or item's default type
    const firstOption = item.options[0];
    const isPercentage = firstOption?.type === "percentage" || 
                        (item.options.length === 0 && Math.abs(item.defaultValue) <= 100);
    
    if (isPercentage) {
      const sign = potentialImpact > 0 ? "+" : "";
      return `${sign}${potentialImpact}%`;
    } else {
      return `+AED ${potentialImpact.toLocaleString()}`;
    }
  };

  const formatDefaultValue = (item: CEWItem) => {
    const premiumImpact = calculateItemPremiumImpact(item);
    if (premiumImpact === 0) return "No impact";
    
    // Determine if it's percentage or amount based on the first option's type or item's default type
    const firstOption = item.options[0];
    const isPercentage = firstOption?.type === "percentage" || 
                        (item.options.length === 0 && item.defaultValue !== 0 && Math.abs(item.defaultValue) <= 100);
    
    if (isPercentage) {
      const sign = premiumImpact > 0 ? "+" : "";
      return `${sign}${premiumImpact}%`;
    } else {
      return `+AED ${premiumImpact.toLocaleString()}`;
    }
  };

  const getTotalPremiumAdjustment = () => {
    const tplAdjustment = tplLimitOptions.find(opt => opt.id === selectedTPLLimit)?.premiumAdjustment || 0;
    const cewAdjustment = cewItems
      .reduce((sum, item) => sum + calculateItemPremiumImpact(item), 0);
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
      .reduce((sum, item) => sum + calculateItemPremiumImpact(item), 0);
    
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
                        getPotentialImpact(item) > 0 ? "text-warning" : 
                        getPotentialImpact(item) < 0 ? "text-success" : "text-muted-foreground"
                      }`}>
                        {formatPotentialImpact(item)}
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
                    <div 
                      className={`text-sm text-muted-foreground ${
                        !expandedDescriptions.has(item.id) ? 'overflow-hidden' : ''
                      }`}
                      style={{
                        display: !expandedDescriptions.has(item.id) ? '-webkit-box' : 'block',
                        WebkitLineClamp: !expandedDescriptions.has(item.id) ? 2 : 'unset',
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {!expandedDescriptions.has(item.id) && item.description.length > 100 ? (
                        <>
                          {item.description.substring(0, 150)}...
                          <button
                            onClick={() => toggleDescriptionExpansion(item.id)}
                            className="text-xs text-primary hover:text-primary/80 ml-1 font-medium"
                          >
                            View more
                          </button>
                        </>
                      ) : (
                        <>
                          {item.description}
                          {expandedDescriptions.has(item.id) && (
                            <button
                              onClick={() => toggleDescriptionExpansion(item.id)}
                              className="text-xs text-primary hover:text-primary/80 ml-1 font-medium"
                            >
                              View less
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Clause wording with two-line truncation and view more */}
                  <div className="mt-2">
                    <div 
                      className={`text-sm text-muted-foreground ${
                        !expandedWording.has(item.id) ? 'overflow-hidden' : ''
                      }`}
                      style={{
                        display: !expandedWording.has(item.id) ? '-webkit-box' : 'block',
                        WebkitLineClamp: !expandedWording.has(item.id) ? 2 : 'unset',
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {!expandedWording.has(item.id) && item.impact.coverage.length > 100 ? (
                        <>
                          {item.impact.coverage.substring(0, 150)}...
                          <button
                            onClick={() => toggleWordingExpansion(item.id)}
                            className="text-xs text-primary hover:text-primary/80 ml-1 font-medium"
                          >
                            View more
                          </button>
                        </>
                      ) : (
                        <>
                          {item.impact.coverage}
                          {expandedWording.has(item.id) && (
                            <button
                              onClick={() => toggleWordingExpansion(item.id)}
                              className="text-xs text-primary hover:text-primary/80 ml-1 font-medium"
                            >
                              View less
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
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