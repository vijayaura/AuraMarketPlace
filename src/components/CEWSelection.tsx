import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Info, Percent, Plus } from "lucide-react";
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
  onMandatoryCEWAdjustmentChange?: (percentage: number, fixed: number) => void;
  onTPLSelectionChange?: (tplOption: any) => void;
  productConfigBundle?: any;
  isLoadingProductConfig?: boolean;
  storedSelections?: CEWItem[];
  storedTPLAdjustment?: number;
  storedCEWAdjustment?: number;
  storedBrokerCommission?: number;
}

export const CEWSelection = ({ 
  onSelectionChange, 
  onPremiumChange, 
  onTPLAdjustmentChange, 
  onCEWAdjustmentChange, 
  onMandatoryCEWAdjustmentChange,
  onTPLSelectionChange, 
  productConfigBundle, 
  isLoadingProductConfig,
  storedSelections,
  storedTPLAdjustment,
  storedCEWAdjustment,
  storedBrokerCommission
}: CEWSelectionProps) => {


  // State for expanded/collapsed clauses - auto-expand mandatory clauses
  const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
  // State for expanded descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  // State for expanded clause wordings
  const [expandedWording, setExpandedWording] = useState<Set<number>>(new Set());

  // CEW items state
  const [cewItems, setCEWItems] = useState<CEWItem[]>([]);
  const [hasAppliedStoredData, setHasAppliedStoredData] = useState(false);

  // Helper function to calculate premium impact for an item
  const calculateItemPremiumImpact = (item: CEWItem): { value: number; type: 'percentage' | 'fixed' } => {
    // Rule 4: If card is not selected, no impact
    if (!item.isSelected) return { value: 0, type: 'percentage' };
    
    const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
    if (selectedOption) {
      // Rule 2: Card selected + option selected
      if (item.isMandatory) {
        // For mandatory clauses: calculate difference between selected option and base price
        const baseValue = item.defaultValue;
        const selectedValue = selectedOption.value;
        const difference = selectedValue - baseValue;
        
        
        return {
          value: difference,
          type: selectedOption.type === "percentage" ? 'percentage' : 'fixed'
        };
      } else {
        // For optional clauses: use full selected option value
        return {
          value: selectedOption.value,
          type: selectedOption.type === "percentage" ? 'percentage' : 'fixed'
        };
      }
    } else {
      // Rule 1: Card selected + no option selected = use base rate
      // For mandatory clauses: base rate is already included in base premium, so no adjustment
      // For optional clauses: use base rate as adjustment
      if (item.isMandatory) {
        // Mandatory clauses with no option selected = 0 adjustment (base already included)
        return { value: 0, type: 'percentage' };
      } else {
        // Optional clauses with no option selected = use base rate
        const firstOption = item.options[0];
        const isPercentage = firstOption?.type === "percentage" || 
                            (item.options.length === 0 && Math.abs(item.defaultValue) <= 100);
        
        return {
          value: item.defaultValue,
          type: isPercentage ? 'percentage' : 'fixed'
        };
      }
    }
  };

  // Update cewItems when productConfigBundle changes
  useEffect(() => {
    if (productConfigBundle) {
      const transformedItems = transformProductConfigToCEWItems(productConfigBundle);
      
      // Check if any mandatory items are being auto-selected
      const mandatoryItems = transformedItems.filter(item => item.isMandatory);
      const selectedMandatoryItems = mandatoryItems.filter(item => item.isSelected);
      
      // Verify mandatory items are auto-selected
      const allSelectedItems = transformedItems.filter(item => item.isSelected);
      
      // Auto-select mandatory items
      setCEWItems(transformedItems);
      onSelectionChange?.(transformedItems);
      
      // Reset the stored data flag when new product config is loaded
      setHasAppliedStoredData(false);
      
      // If we have stored selections, apply them now that we have the transformed items
      if (storedSelections && storedSelections.length > 0) {
        applyStoredSelections(transformedItems, storedSelections);
        setHasAppliedStoredData(true);
      }
    }
  }, [productConfigBundle]);

  // Function to apply stored selections to transformed items
  const applyStoredSelections = (transformedItems: CEWItem[], storedSelections: CEWItem[]) => {
    
    if (!storedSelections || storedSelections.length === 0) {
      return;
    }
    
    // Update transformedItems with stored selections
    const updatedItems = transformedItems.map(item => {
      const storedItem = storedSelections.find(stored => stored.id === item.id);
      if (storedItem) {
        
        return {
          ...item,
          isSelected: storedItem.isSelected,
          selectedOptionId: storedItem.selectedOptionId,
          premiumAmount: storedItem.premiumAmount,
          // Also restore the selected option object if available
          selectedOption: storedItem.selectedOption || (storedItem.selectedOptionId ? 
            item.options?.find(opt => opt.id === storedItem.selectedOptionId) : null)
        };
      }
      return item;
    });
    
    
    setCEWItems(updatedItems);
    onSelectionChange?.(updatedItems);
    
    // Apply stored adjustments
    if (storedTPLAdjustment !== undefined) {
      onTPLAdjustmentChange?.(storedTPLAdjustment);
    }
    if (storedCEWAdjustment !== undefined) {
      onCEWAdjustmentChange?.(storedCEWAdjustment);
    }
    if (storedBrokerCommission !== undefined) {
      // Note: Broker commission restoration is handled by parent component
    }
  };


  // Apply stored selections when they change (separate from product config loading)
  useEffect(() => {
    if (storedSelections && storedSelections.length > 0 && cewItems.length > 0 && !hasAppliedStoredData) {
      
      // Apply stored selections
      applyStoredSelections(cewItems, storedSelections);
      setHasAppliedStoredData(true);
    }
  }, [storedSelections]);

  // Calculate initial adjustments when CEW items change
  useEffect(() => {
    if (cewItems.length > 0) {
      const selectedItems = cewItems.filter(item => item.isSelected);
      
      // Separate mandatory and optional items
      const mandatoryItems = selectedItems.filter(item => item.isMandatory);
      const optionalItems = selectedItems.filter(item => !item.isMandatory);
      
      // Calculate mandatory adjustments
      let mandatoryPercentageAdjustment = 0;
      let mandatoryFixedAdjustment = 0;
      
      mandatoryItems.forEach(item => {
        const impact = calculateItemPremiumImpact(item);
        
        if (impact.type === 'percentage') {
          mandatoryPercentageAdjustment += impact.value;
        } else {
          mandatoryFixedAdjustment += impact.value;
        }
      });
      
      // Calculate optional adjustments
      let optionalPercentageAdjustment = 0;
      let optionalFixedAdjustment = 0;
      
      optionalItems.forEach(item => {
        const impact = calculateItemPremiumImpact(item);
        
        if (impact.type === 'percentage') {
          optionalPercentageAdjustment += impact.value;
        } else {
          optionalFixedAdjustment += impact.value;
        }
      });
      
      // Pass adjustments to parent component
      onMandatoryCEWAdjustmentChange?.(mandatoryPercentageAdjustment, mandatoryFixedAdjustment);
      onCEWAdjustmentChange?.(optionalPercentageAdjustment, optionalFixedAdjustment);
    }
  }, [cewItems, onMandatoryCEWAdjustmentChange, onCEWAdjustmentChange]);

  // Transform product config bundle data to CEW items
  const transformProductConfigToCEWItems = (configBundle: any): CEWItem[] => {
    if (!configBundle?.clause_pricing_config) return [];
    
    // Filter only enabled clauses (is_enabled: 1)
    const enabledClauses = configBundle.clause_pricing_config.filter((clause: any) => clause.is_enabled === 1);
    
    
    return enabledClauses.map((clause: any, index: number) => {
      const isMandatory = clause.meta?.show_type === 'MANDATORY';
      const isSelected = isMandatory; // Auto-select mandatory items
      
      
      return {
        id: clause.id,
        code: clause.clause_code,
        name: clause.meta?.title || clause.clause_code,
        type: (clause.meta?.clause_type && typeof clause.meta.clause_type === 'string' && clause.meta.clause_type.toLowerCase() === 'warranty') ? 'warranty' : 
              (clause.meta?.clause_type && typeof clause.meta.clause_type === 'string' && clause.meta.clause_type.toLowerCase() === 'exclusion') ? 'condition' : 'extension',
        category: clause.meta?.clause_type || 'Extension',
        description: clause.meta?.purpose_description || clause.meta?.clause_wording || 'No description available',
        isMandatory: isMandatory,
        isSelected: isSelected, // Auto-select mandatory items
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
      selectedOptionId: undefined, // Don't auto-select any options, only the card
      impact: {
        coverage: clause.meta?.clause_wording || 'Standard coverage',
        premium: clause.pricing_value > 0 ? 'increase' : clause.pricing_value < 0 ? 'decrease' : 'neutral',
        premiumAmount: Math.abs(parseFloat(clause.pricing_value) || 0)
      },
      // Use the base rate from pricing configuration
      defaultValue: (() => {
        const value = clause.pricing_type === 'PERCENTAGE' ? parseFloat(clause.pricing_value) || 0 : parseFloat(clause.pricing_value) || 0;
        return value;
      })()
      };
    });
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


  const toggleSelection = (itemId: number) => {
    const item = cewItems.find(item => item.id === itemId);
    
    // Prevent unselecting mandatory items
    if (item?.isMandatory && item.isSelected) {
      return;
    }
    
    const updatedItems = cewItems.map(item =>
      item.id === itemId ? { ...item, isSelected: !item.isSelected } : item
    );
    
    // Update state first
    setCEWItems(updatedItems);
    onSelectionChange?.(updatedItems);
    
    // Calculate adjustments separately for mandatory and optional using the updated items
    const selectedItems = updatedItems.filter(item => item.isSelected);
    const mandatoryItems = selectedItems.filter(item => item.isMandatory);
    const optionalItems = selectedItems.filter(item => !item.isMandatory);
    
    // Calculate mandatory adjustments
    let mandatoryPercentageAdjustment = 0;
    let mandatoryFixedAdjustment = 0;
    mandatoryItems.forEach(item => {
      const impact = calculateItemPremiumImpact(item);
      if (impact.type === 'percentage') {
        mandatoryPercentageAdjustment += impact.value;
      } else {
        mandatoryFixedAdjustment += impact.value;
      }
    });
    
    // Calculate optional adjustments
    let optionalPercentageAdjustment = 0;
    let optionalFixedAdjustment = 0;
    optionalItems.forEach(item => {
      const impact = calculateItemPremiumImpact(item);
      if (impact.type === 'percentage') {
        optionalPercentageAdjustment += impact.value;
      } else {
        optionalFixedAdjustment += impact.value;
      }
    });
    
    // Calculate TPL adjustment
    const tplAdjustment = tplLimitOptions.find(opt => opt.id === selectedTPLLimit)?.premiumAdjustment || 0;
    
    // Call separate callbacks
    onTPLAdjustmentChange?.(tplAdjustment);
    onMandatoryCEWAdjustmentChange?.(mandatoryPercentageAdjustment, mandatoryFixedAdjustment);
    onCEWAdjustmentChange?.(optionalPercentageAdjustment, optionalFixedAdjustment);
    onPremiumChange?.(tplAdjustment + mandatoryPercentageAdjustment + mandatoryFixedAdjustment + optionalPercentageAdjustment + optionalFixedAdjustment);
  };

  const updateSelection = (itemId: number, optionId: number) => {
    const item = cewItems.find(item => item.id === itemId);
    if (!item) return;
    
    const updatedItems = cewItems.map(item => {
      if (item.id === itemId) {
        // For all items (mandatory and non-mandatory), use the same logic
        // If clicking the same option, deselect it (go back to base rate)
        if (item.selectedOptionId === optionId) {
          return {
            ...item,
            selectedOptionId: undefined, // Deselect option (Rule 3: back to base rate)
            impact: {
              ...item.impact,
              premiumAmount: item.isSelected ? item.defaultValue : 0 // Use base rate if card selected, 0 if not
            }
          };
        } else {
          // Select new option (Rule 2: use selected option's value)
          // If card is not selected, automatically select it when option is clicked
          const selectedOption = item.options.find(opt => opt.id === optionId);
          return {
            ...item,
            isSelected: true, // Auto-select card when option is clicked
            selectedOptionId: optionId,
            impact: {
              ...item.impact,
              premiumAmount: selectedOption ? (selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000) : item.defaultValue
            }
          };
        }
      }
      return item;
    });
    
    // Update state first
    setCEWItems(updatedItems);
    onSelectionChange?.(updatedItems);
    
    // Calculate adjustments separately for mandatory and optional using the updated items
    const selectedItems = updatedItems.filter(item => item.isSelected);
    const mandatoryItems = selectedItems.filter(item => item.isMandatory);
    const optionalItems = selectedItems.filter(item => !item.isMandatory);
    
    // Calculate mandatory adjustments
    let mandatoryPercentageAdjustment = 0;
    let mandatoryFixedAdjustment = 0;
    mandatoryItems.forEach(item => {
      const impact = calculateItemPremiumImpact(item);
      if (impact.type === 'percentage') {
        mandatoryPercentageAdjustment += impact.value;
      } else {
        mandatoryFixedAdjustment += impact.value;
      }
    });
    
    // Calculate optional adjustments
    let optionalPercentageAdjustment = 0;
    let optionalFixedAdjustment = 0;
    optionalItems.forEach(item => {
      const impact = calculateItemPremiumImpact(item);
      if (impact.type === 'percentage') {
        optionalPercentageAdjustment += impact.value;
      } else {
        optionalFixedAdjustment += impact.value;
      }
    });
    
    // Calculate TPL adjustment
    const tplAdjustment = tplLimitOptions.find(opt => opt.id === selectedTPLLimit)?.premiumAdjustment || 0;
    
    // Call separate callbacks
    onTPLAdjustmentChange?.(tplAdjustment);
    onMandatoryCEWAdjustmentChange?.(mandatoryPercentageAdjustment, mandatoryFixedAdjustment);
    onCEWAdjustmentChange?.(optionalPercentageAdjustment, optionalFixedAdjustment);
    onPremiumChange?.(tplAdjustment + mandatoryPercentageAdjustment + mandatoryFixedAdjustment + optionalPercentageAdjustment + optionalFixedAdjustment);
  };

  // Helper function to get potential impact only for selected items
  const getPotentialImpact = (item: CEWItem): number => {
    if (!item.isSelected) return 0;
    
    const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
    if (selectedOption) {
      return selectedOption.type === "percentage" ? selectedOption.value : selectedOption.value / 1000;
    } else {
      return item.defaultValue;
    }
  };

  const formatPremiumImpact = (item: CEWItem) => {
    const premiumImpact = calculateItemPremiumImpact(item);
    if (premiumImpact.value === 0) return "No impact";
    
    if (premiumImpact.type === 'percentage') {
      const sign = premiumImpact.value > 0 ? "+" : "";
      return `${sign}${premiumImpact.value}%`;
    } else {
      return `+AED ${premiumImpact.value.toLocaleString()}`;
    }
  };

  const formatPotentialImpact = (item: CEWItem) => {
    // If an option is selected, show "Selected X%" instead of base rate
    if (item.selectedOptionId) {
      const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
      if (selectedOption) {
        if (selectedOption.type === "percentage") {
          const sign = selectedOption.value > 0 ? "+" : "";
          return `Selected ${sign}${selectedOption.value}%`;
        } else {
          return `Selected +AED ${selectedOption.value.toLocaleString()}`;
        }
      }
    }
    
    // If no option selected, show the base rate
    const baseRate = item.defaultValue;
    
    if (baseRate === 0) {
      return "No impact";
    }
    
    // Determine if it's percentage or amount based on the first option's type or base rate
    const firstOption = item.options[0];
    const isPercentage = firstOption?.type === "percentage" || 
                        (item.options.length === 0 && Math.abs(baseRate) <= 100);
    
    if (isPercentage) {
      const sign = baseRate > 0 ? "+" : "";
      return `${sign}${baseRate}%`;
    } else {
      return `+AED ${baseRate.toLocaleString()}`;
    }
  };

  const formatDefaultValue = (item: CEWItem) => {
    const premiumImpact = calculateItemPremiumImpact(item);
    if (premiumImpact.value === 0) return "No impact";
    
    if (premiumImpact.type === 'percentage') {
      const sign = premiumImpact.value > 0 ? "+" : "";
      return `${sign}${premiumImpact.value}%`;
    } else {
      return `+AED ${premiumImpact.value.toLocaleString()}`;
    }
  };

  const getTotalPremiumAdjustment = () => {
    const tplAdjustment = tplLimitOptions.find(opt => opt.id === selectedTPLLimit)?.premiumAdjustment || 0;
    let cewPercentageAdjustment = 0;
    let cewFixedAdjustment = 0;
    
    cewItems.forEach(item => {
      const impact = calculateItemPremiumImpact(item);
      if (impact.type === 'percentage') {
        cewPercentageAdjustment += impact.value;
      } else {
        cewFixedAdjustment += impact.value;
      }
    });
    
    return tplAdjustment + cewPercentageAdjustment + cewFixedAdjustment;
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
      onMandatoryCEWAdjustmentChange?.(0, 0);
      onCEWAdjustmentChange?.(0, 0);
      onPremiumChange?.(0);
      onTPLSelectionChange?.(null); // Clear TPL selection
      return;
    }
    
    setSelectedTPLLimit(newTPLId);
    
    // Get the selected TPL option
    const selectedTPLOption = tplLimitOptions.find(opt => opt.id === newTPLId);
    
    // Calculate adjustments separately for mandatory and optional using current cewItems
    const selectedItems = cewItems.filter(item => item.isSelected);
    const mandatoryItems = selectedItems.filter(item => item.isMandatory);
    const optionalItems = selectedItems.filter(item => !item.isMandatory);
    
    // Calculate mandatory adjustments
    let mandatoryPercentageAdjustment = 0;
    let mandatoryFixedAdjustment = 0;
    mandatoryItems.forEach(item => {
      const impact = calculateItemPremiumImpact(item);
      if (impact.type === 'percentage') {
        mandatoryPercentageAdjustment += impact.value;
      } else {
        mandatoryFixedAdjustment += impact.value;
      }
    });
    
    // Calculate optional adjustments
    let optionalPercentageAdjustment = 0;
    let optionalFixedAdjustment = 0;
    optionalItems.forEach(item => {
      const impact = calculateItemPremiumImpact(item);
      if (impact.type === 'percentage') {
        optionalPercentageAdjustment += impact.value;
      } else {
        optionalFixedAdjustment += impact.value;
      }
    });
    
    // Get TPL adjustment
    const tplAdjustment = selectedTPLOption?.premiumAdjustment || 0;
    
    // Call separate callbacks
    onTPLAdjustmentChange?.(tplAdjustment);
    onMandatoryCEWAdjustmentChange?.(mandatoryPercentageAdjustment, mandatoryFixedAdjustment);
    onCEWAdjustmentChange?.(optionalPercentageAdjustment, optionalFixedAdjustment);
    onPremiumChange?.(tplAdjustment + mandatoryPercentageAdjustment + mandatoryFixedAdjustment + optionalPercentageAdjustment + optionalFixedAdjustment);
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
              item.isSelected 
                ? "bg-accent/10 border-accent/50" 
                : item.isMandatory
                ? "bg-destructive/5 border-destructive/30" 
                : "bg-card border-border hover:border-accent/30"
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox/Status */}
              <div className="relative">
                <input
                  type="checkbox"
                  checked={item.isSelected}
                  onChange={() => toggleSelection(item.id)}
                  disabled={item.isMandatory && item.isSelected}
                  className="sr-only"
                  id={`checkbox-${item.id}`}
                />
                <label
                  htmlFor={`checkbox-${item.id}`}
                  className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                    item.isMandatory && item.isSelected
                      ? "bg-primary border-primary text-white cursor-not-allowed opacity-75"
                      : item.isSelected
                      ? "bg-primary border-primary text-white cursor-pointer"
                      : "bg-background border-gray-300 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                  }`}
                >
                  {item.isSelected && (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                </label>
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
                      {item.options.length > 0 && !item.isMandatory && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => toggleClauseExpansion(item.id)}
                          className="text-xs h-6 px-2 bg-green-600 hover:bg-green-700 text-white border-0"
                        >
                          <Plus className="w-3 h-3" />
                          {expandedClauses.has(item.id) ? 'Hide' : 'Add'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>


                {/* Available Options Grid - Only show when expanded for non-mandatory clauses */}
                {expandedClauses.has(item.id) && !item.isMandatory && (
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