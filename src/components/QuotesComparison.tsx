import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, ArrowLeft, Download, Eye, FileText, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { CEWSelection } from "./CEWSelection";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { type BrokerInsurersResponse } from "@/lib/api/brokers";
import { type ProposalBundleResponse, type InsurerPricingConfigResponse, getInsurerPricingConfig, createPlanSelection, updatePlanSelection, type PlanSelectionRequest } from "@/lib/api/quotes";

interface QuotesComparisonProps {
  assignedInsurers?: BrokerInsurersResponse | null;
  currentProposal?: ProposalBundleResponse | null;
  isLoadingProposal?: boolean;
  insurerPricingConfigs?: Record<number, InsurerPricingConfigResponse>;
  isLoadingPricingConfigs?: boolean;
  onLoadPricingConfigs?: (eligibleInsurers: any[]) => Promise<boolean>;
}

// Generate real quotes from validation results
const generateRealQuotes = (insurerValidationResults: Record<number, any>, eligibleInsurers: any[], insurerPricingConfigs: Record<number, any>) => {
  return eligibleInsurers
    .filter(insurer => {
      const result = insurerValidationResults[insurer.insurer_id];
      return result && result.overallDecision === 'Auto Quote' && result.basePremium > 0;
    })
    .map(insurer => {
      const result = insurerValidationResults[insurer.insurer_id];
      const sumInsured = result.sumInsured || 0;
      
      // Get maximum cover from insurer's product configuration
      const pricingConfig = insurerPricingConfigs[insurer.insurer_id];
      const maximumCover = pricingConfig?.policy_limits_and_deductible?.policy_limits?.maximum_cover?.value || sumInsured;
      
      return {
        id: insurer.insurer_id,
        planName: `${insurer.insurer_name} CAR Plan`,
        insurerName: insurer.insurer_name,
        annualPremium: result.basePremium,
        coverageAmount: maximumCover, // Use insurer's maximum cover instead of sum insured
        rating: 4.5, // Default rating, could be enhanced later
        deductible: formatCurrency(25000), // Default deductible, could be from config
        isRecommended: false,
        keyCoverage: [
          "Contract Works Insurance",
          "Third Party Liability",
          "Professional Indemnity",
          "Plant & Equipment"
        ],
        benefits: [
          "24/7 Claims Support",
          "Fast Settlement",
          "Risk Management Services",
          "Free risk assessment"
        ],
        validationResult: result, // Store validation result for reference
        pricingConfig: pricingConfig // Store pricing config for reference
      };
    });
};

const QuotesComparison = ({ 
  assignedInsurers, 
  currentProposal, 
  isLoadingProposal, 
  insurerPricingConfigs, 
  isLoadingPricingConfigs, 
  onLoadPricingConfigs 
}: QuotesComparisonProps) => {
  const [selectedQuotes, setSelectedQuotes] = useState<number[]>([]);
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [showCEWDialog, setShowCEWDialog] = useState(false);
  const [selectedQuoteForCEW, setSelectedQuoteForCEW] = useState<any>(null);
  const [premiumAdjustment, setPremiumAdjustment] = useState(0);

  // Log assigned insurers data for debugging
  console.log('🏢 QuotesComparison received assignedInsurers:', assignedInsurers);
  console.log('📋 QuotesComparison received currentProposal:', currentProposal);
  console.log('⏳ QuotesComparison isLoadingProposal:', isLoadingProposal);

  // Helper function to normalize geographic strings for comparison
  const normalizeGeographicString = (str: string): string => {
    return str
      .toLowerCase()                    // Convert to lowercase
      .replace(/\s+/g, '')             // Remove all spaces
      .replace(/[^a-z0-9]/g, '')       // Remove special characters, keep only letters and numbers
      .trim();                         // Remove any remaining whitespace
  };

  // Normalization helper functions
  const normalizeString = (str: string | null | undefined): string => {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  const normalizeNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  const normalizeBoolean = (value: any): boolean => {
    if (value === 0 || value === '0' || value === false || value === 'false') return false;
    if (value === 1 || value === '1' || value === true || value === 'true') return true;
    return Boolean(value);
  };

  const normalizePricingType = (pricingType: string | null | undefined): string => {
    if (!pricingType) return 'Percentage';
    const normalized = normalizeString(pricingType);
    if (['percentage', 'percentage%', 'loading', 'discount'].includes(normalized)) {
      return 'Percentage';
    }
    if (['fixedamount', 'fixed_amount'].includes(normalized)) {
      return 'Fixed_Amount';
    }
    return 'Percentage'; // Default fallback
  };

  const isWithinRange = (value: number, from: number | null, to: number | null): boolean => {
    const fromValue = from === null ? -Infinity : from;
    const toValue = to === null ? Infinity : to;
    return value >= fromValue && value <= toValue;
  };

  const calculateMonthsDifference = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 30); // Approximate months
  };

  // Calculate base premium from validation results
  const calculateBasePremium = (validationResults: any[], proposal: any, insurerPricingConfig: any) => {
    console.log('💰 Starting base premium calculation with validation results:', validationResults);
    console.log('💰 Insurer pricing config for minimum premium check:', insurerPricingConfig);
    
    const excludedFields = [
      'project_type', 'project_value', 'contract_works', 'plant_and_equipment', 
      'sum_insured', 'temporary_works', 'other_materials', 'principals_property'
    ];
    
    // Filter out excluded fields and get pricing data
    const pricingFields = validationResults.filter(result => 
      !excludedFields.includes(result.field_name) && 
      result.pricing_value > 0 &&
      result.decision === 'Auto Quote'
    );
    
    console.log('💰 Pricing fields for calculation:', pricingFields);
    console.log('💰 Excluded fields:', excludedFields);
    
    // Group by pricing type
    const percentageFields = pricingFields.filter(field => 
      field.pricing_type && (
      field.pricing_type.toLowerCase().includes('percentage') || 
      field.pricing_type.toLowerCase().includes('percent')
      )
    );
    
    const fixedAmountFields = pricingFields.filter(field => 
      field.pricing_type && (
      field.pricing_type.toLowerCase().includes('fixed') || 
      field.pricing_type.toLowerCase().includes('amount')
      )
    );
    
    console.log('💰 Percentage fields:', percentageFields);
    console.log('💰 Fixed amount fields:', fixedAmountFields);
    
    // Find the base rate from Sub Project Type
    const subProjectTypeField = percentageFields.find(field => field.field_name === 'sub_project_type');
    const baseRate = subProjectTypeField ? subProjectTypeField.pricing_value : 0;
    
    console.log('💰 Base rate from Sub Project Type:', baseRate);
    
    // Calculate factors for all other percentage fields (excluding sub_project_type)
    const otherPercentageFields = percentageFields.filter(field => field.field_name !== 'sub_project_type');
    const factors = otherPercentageFields.map(field => {
      const factor = 1 + (field.pricing_value / 100); // Convert percentage to decimal and add 1
      console.log(`💰 Factor for ${field.field_name}: 1 + ${field.pricing_value}% = ${factor}`);
      return factor;
    });
    
    // Add mandatory clause pricing to factors
    let mandatoryClauseFactors: number[] = [];
    let mandatoryClauseFixedAmounts: number = 0;
    
    if (insurerPricingConfig?.clause_pricing_config) {
      console.log('💰 Processing mandatory clause pricing config:', insurerPricingConfig.clause_pricing_config);
      console.log('💰 Clause pricing config length:', insurerPricingConfig.clause_pricing_config.length);
      console.log('💰 Selected CEW items for pricing:', selectedCEWItems);
      
      insurerPricingConfig.clause_pricing_config.forEach((clause: any, index: number) => {
        console.log(`💰 Clause ${index}:`, {
          clause_code: clause.clause_code,
          is_mandatory: clause.is_mandatory,
          meta_show_type: clause.meta?.show_type,
          pricing_type: clause.pricing_type,
          pricing_value: clause.pricing_value,
          is_mandatory_type: typeof clause.is_mandatory,
          is_mandatory_strict: clause.is_mandatory === 1,
          is_mandatory_loose: clause.is_mandatory == 1,
          meta_mandatory: clause.meta?.show_type === 'MANDATORY'
        });
        
        if (clause.meta?.show_type === 'MANDATORY') {
          console.log(`💰 Processing mandatory clause: ${clause.clause_code}`, clause);
          
          // Check if this clause has selected options in CEWSelection
          const selectedCEWItem = selectedCEWItems?.find(item => item.code === clause.clause_code);
          
          if (selectedCEWItem && selectedCEWItem.isSelected) {
            // Use selected option pricing if available
            if (selectedCEWItem.selectedOptionId) {
              const selectedOption = selectedCEWItem.options?.find(opt => opt.id === selectedCEWItem.selectedOptionId);
              if (selectedOption) {
                console.log(`💰 Using selected option pricing for ${clause.clause_code}:`, selectedOption);
                
                if (selectedOption.type === 'percentage') {
                  const clauseFactor = 1 + (selectedOption.value / 100);
                  mandatoryClauseFactors.push(clauseFactor);
                  console.log(`💰 Mandatory clause ${clause.clause_code} selected option percentage factor: 1 + ${selectedOption.value}% = ${clauseFactor}`);
                } else {
                  mandatoryClauseFixedAmounts += selectedOption.value;
                  console.log(`💰 Mandatory clause ${clause.clause_code} selected option fixed amount: ${selectedOption.value}`);
                }
              } else {
                console.log(`💰 Selected option not found for ${clause.clause_code}, using base pricing`);
                // Fallback to base pricing
                if (clause.pricing_type === 'PERCENTAGE') {
                  const clauseFactor = 1 + (parseFloat(clause.pricing_value) / 100);
                  mandatoryClauseFactors.push(clauseFactor);
                  console.log(`💰 Mandatory clause ${clause.clause_code} base percentage factor: 1 + ${clause.pricing_value}% = ${clauseFactor}`);
                } else if (clause.pricing_type === 'CURRENCY') {
                  mandatoryClauseFixedAmounts += parseFloat(clause.pricing_value);
                  console.log(`💰 Mandatory clause ${clause.clause_code} base fixed amount: ${clause.pricing_value}`);
                }
              }
            } else {
              // No option selected, use base pricing
              console.log(`💰 No option selected for ${clause.clause_code}, using base pricing`);
              if (clause.pricing_type === 'PERCENTAGE') {
                const clauseFactor = 1 + (parseFloat(clause.pricing_value) / 100);
                mandatoryClauseFactors.push(clauseFactor);
                console.log(`💰 Mandatory clause ${clause.clause_code} base percentage factor: 1 + ${clause.pricing_value}% = ${clauseFactor}`);
              } else if (clause.pricing_type === 'CURRENCY') {
                mandatoryClauseFixedAmounts += parseFloat(clause.pricing_value);
                console.log(`💰 Mandatory clause ${clause.clause_code} base fixed amount: ${clause.pricing_value}`);
              }
            }
          } else {
            // No CEW item found or not selected, use base pricing
            console.log(`💰 No CEW item found or not selected for ${clause.clause_code}, using base pricing`);
            if (clause.pricing_type === 'PERCENTAGE') {
              const clauseFactor = 1 + (parseFloat(clause.pricing_value) / 100);
              mandatoryClauseFactors.push(clauseFactor);
              console.log(`💰 Mandatory clause ${clause.clause_code} base percentage factor: 1 + ${clause.pricing_value}% = ${clauseFactor}`);
            } else if (clause.pricing_type === 'CURRENCY') {
              mandatoryClauseFixedAmounts += parseFloat(clause.pricing_value);
              console.log(`💰 Mandatory clause ${clause.clause_code} base fixed amount: ${clause.pricing_value}`);
            }
          }
        } else {
          console.log(`💰 Skipping non-mandatory clause: ${clause.clause_code} (meta.show_type: ${clause.meta?.show_type})`);
        }
      });
      
      console.log('💰 Mandatory clause factors:', mandatoryClauseFactors);
      console.log('💰 Mandatory clause fixed amounts:', mandatoryClauseFixedAmounts);
    } else {
      console.log('💰 No clause_pricing_config found in insurer pricing config');
    }
    
    // Combine regular factors with mandatory clause factors
    const allFactors = [...factors, ...mandatoryClauseFactors];
    
    // Calculate final percentage product: base_rate × factor1 × factor2 × ... × factorN
    let percentageProduct = baseRate / 100; // Convert base rate to decimal
    if (allFactors.length > 0) {
      percentageProduct = allFactors.reduce((acc, factor) => acc * factor, percentageProduct);
    }
    
    console.log('💰 Final percentage product:', percentageProduct);
    console.log('💰 Calculation: base_rate × factors =', baseRate, '×', allFactors.join(' × '), '=', percentageProduct);
    console.log('💰 Regular factors:', factors);
    console.log('💰 Mandatory clause factors:', mandatoryClauseFactors);
    console.log('💰 All factors combined:', allFactors);

    // Calculate SUM of fixed amount fields + mandatory clause fixed amounts
    const regularFixedAmounts = fixedAmountFields.reduce((acc, field) => acc + field.pricing_value, 0);
    const factorsSum = regularFixedAmounts + mandatoryClauseFixedAmounts;
    
    console.log('💰 Regular fixed amounts:', regularFixedAmounts);
    console.log('💰 Mandatory clause fixed amounts:', mandatoryClauseFixedAmounts);
    console.log('💰 Total fixed amounts (factorsSum):', factorsSum);
    
    // Get sum insured value
    const sumInsured = proposal.cover_requirements?.sum_insured || 0;
    
    // Calculate base premium: (percentage_product * Sum insured) + SUM(fixedAmountFields)
    const calculatedBasePremium = (percentageProduct * sumInsured) + factorsSum;
    
    console.log('💰 Base premium calculation breakdown:');
    console.log('💰 - Sum Insured:', sumInsured);
    console.log('💰 - Percentage Product:', percentageProduct);
    console.log('💰 - Percentage contribution:', percentageProduct * sumInsured);
    console.log('💰 - Fixed amounts contribution:', factorsSum);
    console.log('💰 - Calculated Base Premium:', calculatedBasePremium);
    
    // Check minimum premium rates from insurer's product bundle
    let minimumPremiumRate = 0;
    let minimumPremiumMatch = null;
    
    if (insurerPricingConfig?.policy_limits_and_deductible?.minimum_premium_rates) {
      const projectType = proposal.project?.project_type;
      const subProjectType = proposal.project?.sub_project_type;
      
      console.log('💰 Checking minimum premium rates for:', { projectType, subProjectType });
      console.log('💰 Available minimum premium rates:', insurerPricingConfig.policy_limits_and_deductible.minimum_premium_rates);
      
      // Find matching minimum premium rate
      const matchingRate = insurerPricingConfig.policy_limits_and_deductible.minimum_premium_rates.find((rate: any) => {
        const configProjectType = normalizeString(rate.project_type);
        const configSubProjectType = normalizeString(rate.sub_project_type);
        const proposalProjectType = normalizeString(projectType);
        const proposalSubProjectType = normalizeString(subProjectType);
        
        return configProjectType === proposalProjectType && configSubProjectType === proposalSubProjectType;
      });
      
      if (matchingRate) {
        minimumPremiumRate = matchingRate.base_rate || 0;
        minimumPremiumMatch = matchingRate;
        console.log('💰 Found matching minimum premium rate:', minimumPremiumRate, 'for', matchingRate.project_type, matchingRate.sub_project_type);
      } else {
        console.log('💰 No matching minimum premium rate found for project type:', projectType, 'sub-project type:', subProjectType);
      }
    } else {
      console.log('💰 No minimum premium rates available in insurer config');
    }
    
    // Apply minimum premium protection
    const finalBasePremium = Math.max(calculatedBasePremium, minimumPremiumRate);
    const isMinimumPremiumApplied = finalBasePremium > calculatedBasePremium;
    
    console.log('💰 Premium calculation summary:', {
      calculatedBasePremium,
      minimumPremiumRate,
      finalBasePremium,
      isMinimumPremiumApplied
    });
    
    return {
      basePremium: Math.round(finalBasePremium * 100) / 100, // Round to 2 decimal places
      calculatedBasePremium: Math.round(calculatedBasePremium * 100) / 100,
      minimumPremiumRate,
      isMinimumPremiumApplied,
      minimumPremiumMatch,
      percentageProduct,
      factorsSum,
      sumInsured,
      baseRate,
      factors,
      details: {
        percentageFields,
        fixedAmountFields,
        calculation: `(${percentageProduct} × ${sumInsured}) + ${factorsSum} = ${calculatedBasePremium}`,
        minimumPremiumCalculation: isMinimumPremiumApplied ? 
          `MIN(${calculatedBasePremium}, ${minimumPremiumRate}) = ${finalBasePremium}` : 
          `No minimum premium applied`,
        percentageProductFormula: `base_rate × factor1 × factor2 × ... × factorN = ${baseRate}% × ${factors.join(' × ')} = ${percentageProduct}`,
        baseRate: `${baseRate}%`,
        factors: factors.map((factor, index) => `${otherPercentageFields[index].field_name}: ${factor}`)
      }
    };
  };

  // Comprehensive proposal validation against insurer config
  const validateProposalAgainstConfig = (proposal: any, insurerConfig: any, insurerId: number) => {
    console.log('🔍 Starting proposal validation for insurer:', insurerId);
    console.log('📋 Proposal data:', proposal);
    console.log('⚙️ Insurer config:', insurerConfig);
    
    const validationResults: Array<{
      field_name: string;
      proposal_value: any;
      config_range: string;
      config_matched_label: string;
      pricing_type: string;
      pricing_value: number;
      quote_option: string;
      decision: 'Auto Quote' | 'No Quote' | 'Manual Review';
    }> = [];

    let overallDecision: 'Auto Quote' | 'No Quote' | 'Manual Review' = 'Auto Quote';

    // Helper function to add validation result
    const addValidationResult = (
      fieldName: string,
      proposalValue: any,
      configRange: string,
      matchedLabel: string,
      pricingType: string,
      pricingValue: number,
      quoteOption: string,
      decision: 'Auto Quote' | 'No Quote' | 'Manual Review'
    ) => {
      validationResults.push({
        field_name: fieldName,
        proposal_value: proposalValue,
        config_range: configRange,
        config_matched_label: matchedLabel,
        pricing_type: normalizePricingType(pricingType),
        pricing_value: normalizeNumber(pricingValue),
        quote_option: quoteOption,
        decision
      });

      // Update overall decision (No Quote > Manual Review > Auto Quote)
      if (decision === 'No Quote') {
        overallDecision = 'No Quote';
      } else if (decision === 'Manual Review' && overallDecision !== 'No Quote') {
        overallDecision = 'Manual Review';
      }
    };

    // 1. Project Type Validation (separate from sub-project)
    const validateProjectType = () => {
      const proposalProjectType = normalizeString(proposal.project?.project_type);
      
      console.log('🏗️ Validating project type:', proposalProjectType);

      const baseRates = insurerConfig.base_rates || [];
      let matched = false;

      for (const baseRate of baseRates) {
        const configProjectType = normalizeString(baseRate.project_type);
        if (configProjectType === proposalProjectType) {
          matched = true;
          // For project type validation, we just check if the project type exists
          addValidationResult(
            'project_type',
            proposal.project?.project_type,
            baseRate.project_type,
            baseRate.project_type,
            'percentage',
            0, // No specific pricing at project type level
            'auto_quote',
            'Auto Quote'
          );
          break;
        }
      }

      if (!matched) {
        addValidationResult(
          'project_type',
          proposal.project?.project_type,
          'No matching project type found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // 1b. Sub-Project Type Validation (separate validation)
    const validateSubProjectType = () => {
      const proposalProjectType = normalizeString(proposal.project?.project_type);
      const proposalSubProjectType = normalizeString(proposal.project?.sub_project_type);
      
      console.log('🏗️ Validating sub-project type:', proposalSubProjectType, 'for project type:', proposalProjectType);

      const baseRates = insurerConfig.base_rates || [];
      let matched = false;

      for (const baseRate of baseRates) {
        const configProjectType = normalizeString(baseRate.project_type);
        if (configProjectType === proposalProjectType) {
          const subProjects = baseRate.sub_projects || [];
          for (const subProject of subProjects) {
            const configSubProject = normalizeString(subProject.name);
            if (configSubProject === proposalSubProjectType) {
              matched = true;
              const decision = subProject.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                              subProject.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
              
              addValidationResult(
                'sub_project_type',
                proposal.project?.sub_project_type,
                subProject.name,
                subProject.name,
                subProject.pricing_type || 'PERCENTAGE',
                subProject.base_rate || 0,
                subProject.quote_option || 'AUTO_QUOTE',
                decision
              );
              break;
            }
          }
          if (matched) break;
        }
      }

      if (!matched) {
        addValidationResult(
          'sub_project_type',
          proposal.project?.sub_project_type,
          'No matching sub-project type found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // Helper function to extract pricing value from different field names
    const extractPricingValue = (item: any) => {
      // Check all possible field names for pricing values
      return item.value || 
             item.base_rate || 
             item.loading_discount || 
             item.base_value || 
             item.limit_value || 
             item.pricing_value || 
             0;
    };

    // 2. Construction/Area/Soil/Contract/Role/Geographical Validation
    const validateConfigItems = () => {
      console.log('🔍 Debugging proposal data for config items:');
      console.log('📋 proposal.project:', proposal.project);
      console.log('📋 proposal.site_risks:', proposal.site_risks);
      console.log('📋 proposal.contract_structure:', proposal.contract_structure);
      console.log('📋 proposal.insured:', proposal.insured);
      
      const configMappings = [
        { field: 'construction_type', config: 'construction_types_config', proposal: proposal.project?.construction_type },
        { field: 'area_type', config: 'area_types_config', proposal: proposal.site_risks?.area_type },
        { field: 'soil_type', config: 'soil_types_config', proposal: proposal.site_risks?.soil_type },
        { field: 'contract_type', config: 'contract_types_config', proposal: proposal.contract_structure?.details?.contract_type?.replace(/-/g, ' ') },
        { field: 'role_of_insured', config: 'role_types_config', proposal: proposal.insured?.details?.role_of_insured },
        { field: 'country', config: 'countries_config', proposal: proposal.project?.country },
        { field: 'region', config: 'regions_config', proposal: proposal.project?.region },
        { field: 'zone', config: 'zones_config', proposal: proposal.project?.zone }
      ];

      configMappings.forEach(mapping => {
        const proposalValue = normalizeString(mapping.proposal);
        const configItems = insurerConfig[mapping.config]?.items || [];
        let matched = false;
        
        console.log(`🔍 Validating ${mapping.field}:`, {
          rawValue: mapping.proposal,
          normalizedValue: proposalValue,
          configItems: configItems.length
        });

        for (const item of configItems) {
          // Handle different data structures for geographical fields
          let configValue;
          if (mapping.field === 'country') {
            configValue = normalizeString(item.country || item.name);
          } else if (mapping.field === 'region') {
            configValue = normalizeString(item.name || item.region);
          } else if (mapping.field === 'zone') {
            configValue = normalizeString(item.name || item.zone);
          } else {
            configValue = normalizeString(item.name || item.type);
          }
          
          if (configValue === proposalValue) {
            matched = true;
            const decision = item.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                            item.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
            
            const pricingValue = extractPricingValue(item);
            console.log(`💰 Extracted pricing value for ${mapping.field}:`, {
              item: item,
              extractedValue: pricingValue,
              fieldNames: ['value', 'base_rate', 'loading_discount', 'base_value', 'limit_value', 'pricing_value']
            });
            
            addValidationResult(
              mapping.field,
              mapping.proposal,
              item.name || item.country || item.region || item.zone || item.type,
              item.name || item.country || item.region || item.zone || item.type,
              item.pricing_type || 'percentage',
              pricingValue,
              item.quote_option || 'auto_quote',
              decision
            );
            break;
          }
        }

        if (!matched) {
          addValidationResult(
            mapping.field,
            mapping.proposal,
            'No matching configuration found',
            'N/A',
            'percentage',
            0,
            'no_quote',
            'No Quote'
          );
        }
      });
    };

    // 3. Project Duration Validation
    const validateProjectDuration = () => {
      // Use construction_period_months from proposal form instead of calculating from dates
      const constructionPeriodMonths = normalizeNumber(proposal.project?.construction_period_months);
      const durationLoadings = insurerConfig.project_risk_factors?.project_duration_loadings || [];
      
      console.log('📅 Validating construction period:', constructionPeriodMonths, 'months');
      
      let matched = false;
      for (const loading of durationLoadings) {
        if (isWithinRange(constructionPeriodMonths, loading.from_months, loading.to_months)) {
          matched = true;
          const decision = loading.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                          loading.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
          
          const pricingValue = extractPricingValue(loading);
          
          addValidationResult(
            'construction_period',
            `${constructionPeriodMonths} months`,
            `${loading.from_months || 0} - ${loading.to_months || '∞'} months`,
            `${loading.from_months || 0}-${loading.to_months || '∞'} months`,
            loading.pricing_type || 'PERCENTAGE',
            pricingValue,
            loading.quote_option || 'AUTO_QUOTE',
            decision
          );
          break;
        }
      }

      if (!matched) {
        addValidationResult(
          'construction_period',
          `${constructionPeriodMonths} months`,
          'No matching range found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // 4. Maintenance Period Validation
    const validateMaintenancePeriod = () => {
      const maintenanceMonths = normalizeNumber(proposal.project?.maintenance_period_months);
      const maintenanceLoadings = insurerConfig.project_risk_factors?.maintenance_period_loadings || [];
      
      let matched = false;
      for (const loading of maintenanceLoadings) {
        if (isWithinRange(maintenanceMonths, loading.from_months, loading.to_months)) {
          matched = true;
          const decision = loading.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                          loading.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
          
          const pricingValue = extractPricingValue(loading);
          
          addValidationResult(
            'maintenance_period',
            `${maintenanceMonths} months`,
            `${loading.from_months || 0} - ${loading.to_months || '∞'} months`,
            `${loading.from_months || 0}-${loading.to_months || '∞'} months`,
            loading.pricing_type || 'percentage',
            pricingValue,
            loading.quote_option || 'auto_quote',
            decision
          );
          break;
        }
      }

      if (!matched) {
        addValidationResult(
          'maintenance_period',
          `${maintenanceMonths} months`,
          'No matching range found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // 5. Coverage Amounts Extraction (No Validation)
    const validateCoverageAmounts = () => {
      const coverageTypes = [
        { field: 'project_value', value: proposal.cover_requirements?.project_value, label: 'Project Value' },
        { field: 'contract_works', value: proposal.cover_requirements?.contract_works, label: 'Contract Works' },
        { field: 'plant_and_equipment', value: proposal.cover_requirements?.plant_and_equipment, label: 'Plant And Equipment' },
        { field: 'sum_insured', value: proposal.cover_requirements?.sum_insured, label: 'Sum Insured' },
        { field: 'temporary_works', value: proposal.cover_requirements?.temporary_works, label: 'Temporary Works' },
        { field: 'other_materials', value: proposal.cover_requirements?.other_materials, label: 'Other Materials' },
        { field: 'principals_property', value: proposal.cover_requirements?.principals_property, label: 'Principals Property' }
      ];

      coverageTypes.forEach(coverage => {
        const proposalValue = normalizeNumber(coverage.value);
        
        // Just extract and display the value without validation
        addValidationResult(
          coverage.field,
          proposalValue || 0,
          'Value Only',
          'N/A',
          'percentage',
          0,
          'auto_quote',
          'Auto Quote'
        );
      });
    };

    // 5b. Cross Liability Cover Validation
    const validateCrossLiabilityCover = () => {
      const crossLiabilityCover = proposal.cover_requirements?.cross_liability_cover;
      const crossLiabilityOptions = insurerConfig.coverage_options?.cross_liability_cover || [];
      
      console.log('🔒 Validating cross liability cover:', crossLiabilityCover);
      
      let matched = false;
      for (const option of crossLiabilityOptions) {
        // Normalize the cover option for comparison
        const normalizedOptionName = normalizeString(option.cover_option);
        const normalizedProposalValue = normalizeString(crossLiabilityCover || 'no');
        
        // Map proposal values to config options
        let matches = false;
        if ((normalizedProposalValue === 'yes' || normalizedProposalValue === '1' || normalizedProposalValue === 'true') && 
            normalizedOptionName.includes('yes') || normalizedOptionName.includes('included')) {
          matches = true;
        } else if ((normalizedProposalValue === 'no' || normalizedProposalValue === '0' || normalizedProposalValue === 'false' || !crossLiabilityCover) && 
                   (normalizedOptionName.includes('no') || normalizedOptionName.includes('not'))) {
          matches = true;
        }
        
        if (matches) {
          matched = true;
          const decision = option.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                          option.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
          
          const pricingValue = extractPricingValue(option);
          
          addValidationResult(
            'cross_liability_cover',
            crossLiabilityCover || 'No',
            option.cover_option,
            option.cover_option,
            option.pricing_type || 'PERCENTAGE',
            pricingValue,
            option.quote_option || 'AUTO_QUOTE',
            decision
          );
          break;
        }
      }

      if (!matched) {
        addValidationResult(
          'cross_liability_cover',
          crossLiabilityCover || 'No',
          'No matching option found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // 6. Contractor Experience Validation
    const validateContractorExperience = () => {
      const experienceYears = normalizeNumber(proposal.contract_structure?.details?.experience_years);
      const experienceLoadings = insurerConfig.contractor_risk_factors?.experience_loadings || [];
      
      let matched = false;
      for (const loading of experienceLoadings) {
        if (isWithinRange(experienceYears, loading.from_years, loading.to_years)) {
          matched = true;
          const decision = loading.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                          loading.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
          
          const pricingValue = extractPricingValue(loading);
          
          addValidationResult(
            'contractor_experience',
            `${experienceYears} years`,
            `${loading.from_years || 0} - ${loading.to_years || '∞'} years`,
            `${loading.from_years || 0}-${loading.to_years || '∞'} years`,
            loading.pricing_type || 'percentage',
            pricingValue,
            loading.quote_option || 'auto_quote',
            decision
          );
          break;
        }
      }

      if (!matched) {
        addValidationResult(
          'contractor_experience',
          `${experienceYears} years`,
          'No matching range found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // 7. Claims History Validation (Count-based)
    const validateClaimsHistory = () => {
      const claims = proposal.insured?.claims || [];
      const totalClaimsCount = claims.reduce((sum: number, claim: any) => sum + normalizeNumber(claim.count_of_claims), 0);
      const claimsLoadings = insurerConfig.contractor_risk_factors?.claims_based_loadings || [];
      
      let matched = false;
      for (const loading of claimsLoadings) {
        if (isWithinRange(totalClaimsCount, loading.from_claims, loading.to_claims)) {
          matched = true;
          const decision = loading.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                          loading.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
          
          const pricingValue = extractPricingValue(loading);
          
          addValidationResult(
            'claims_count',
            totalClaimsCount,
            `${loading.from_claims || 0} - ${loading.to_claims || '∞'}`,
            `${loading.from_claims || 0}-${loading.to_claims || '∞'}`,
            loading.pricing_type || 'percentage',
            pricingValue,
            loading.quote_option || 'auto_quote',
            decision
          );
          break;
        }
      }

      if (!matched) {
        addValidationResult(
          'claims_count',
          totalClaimsCount,
          'No matching range found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // 7b. Claims Amount Validation (Amount-based)
    const validateClaimsAmount = () => {
      const claims = proposal.insured?.claims || [];
      const totalClaimsAmount = claims.reduce((sum: number, claim: any) => sum + normalizeNumber(claim.amount_of_claims), 0);
      const claimAmountCategories = insurerConfig.contractor_risk_factors?.claim_amount_categories || [];
      
      console.log('💰 Validating claims amount:', totalClaimsAmount, 'against categories:', claimAmountCategories);
      
      let matched = false;
      for (const category of claimAmountCategories) {
        if (isWithinRange(totalClaimsAmount, category.from_amount, category.to_amount)) {
          matched = true;
          const decision = category.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                          category.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
          
          const pricingValue = extractPricingValue(category);
          
          addValidationResult(
            'claims_amount',
            totalClaimsAmount,
            `${category.from_amount || 0} - ${category.to_amount || '∞'}`,
            `${category.from_amount || 0}-${category.to_amount || '∞'}`,
            category.pricing_type || 'percentage',
            pricingValue,
            category.quote_option || 'auto_quote',
            decision
          );
          break;
        }
      }

      if (!matched) {
        addValidationResult(
          'claims_amount',
          totalClaimsAmount,
          'No matching amount range found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // 8. Sub-Contractors Count Validation
    const validateSubContractorsCount = () => {
      const subContractorsCount = (proposal.contract_structure?.sub_contractors || []).length;
      const subContractorsLoadings = insurerConfig.contractor_risk_factors?.subcontractor_number_based || [];
      
      console.log('🔍 Sub-contractors validation - Count:', subContractorsCount, 'Loadings:', subContractorsLoadings);
      
      // If no loadings configured, just display the count
      if (subContractorsLoadings.length === 0) {
        addValidationResult(
          'sub_contractors_count',
          subContractorsCount,
          'No configuration available',
          'N/A',
          'percentage',
          0,
          'auto_quote',
          'Auto Quote'
        );
        return;
      }
      
      let matched = false;
      for (const loading of subContractorsLoadings) {
        // Try different possible field names for sub-contractors range
        const fromField = loading.from_subcontractors || loading.from_sub_contractors || loading.from_count || loading.from || loading.min_count || loading.min;
        const toField = loading.to_subcontractors || loading.to_sub_contractors || loading.to_count || loading.to || loading.max_count || loading.max;
        
        console.log('🔍 Checking range:', fromField, 'to', toField, 'for count:', subContractorsCount);
        
        if (isWithinRange(subContractorsCount, fromField, toField)) {
          matched = true;
          const decision = loading.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                          loading.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
          
          const pricingValue = extractPricingValue(loading);
          
          addValidationResult(
            'sub_contractors_count',
            subContractorsCount,
            `${fromField || 0} - ${toField || '∞'}`,
            `${fromField || 0}-${toField || '∞'}`,
            loading.pricing_type || 'percentage',
            pricingValue,
            loading.quote_option || 'auto_quote',
            decision
          );
          break;
        }
      }

      if (!matched) {
        addValidationResult(
          'sub_contractors_count',
          subContractorsCount,
          'No matching range found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // 9. Consultants Count Validation
    const validateConsultantsCount = () => {
      const consultantsCount = (proposal.contract_structure?.consultants || []).length;
      const consultantsLoadings = insurerConfig.contractor_risk_factors?.contractor_number_based || [];
      
      console.log('🔍 Consultants validation - Count:', consultantsCount);
      console.log('🔍 Consultants loadings array:', consultantsLoadings);
      console.log('🔍 Full contractor_risk_factors:', insurerConfig.contractor_risk_factors);
      
      // If no loadings configured, just display the count
      if (consultantsLoadings.length === 0) {
        console.log('❌ No consultants loadings found');
        addValidationResult(
          'consultants_count',
          consultantsCount,
          'No configuration available',
          'N/A',
          'percentage',
          0,
          'auto_quote',
          'Auto Quote'
        );
        return;
      }
      
      let matched = false;
      for (let i = 0; i < consultantsLoadings.length; i++) {
        const loading = consultantsLoadings[i];
        console.log(`🔍 Processing loading ${i}:`, loading);
        console.log('🔍 Available fields in loading:', Object.keys(loading));
        console.log('🔍 from_contractors value:', loading.from_contractors);
        console.log('🔍 to_contractors value:', loading.to_contractors);
        
        // Try different possible field names for consultants range
        const fromField = loading.from_contractors || loading.from_consultants || loading.from_count || loading.from || loading.min_count || loading.min || 0;
        const toField = loading.to_contractors || loading.to_consultants || loading.to_count || loading.to || loading.max_count || loading.max;
        
        console.log('🔍 Extracted fields - from:', fromField, 'to:', toField);
        console.log('🔍 Checking range:', fromField, 'to', toField, 'for count:', consultantsCount);
        console.log('🔍 isWithinRange result:', isWithinRange(consultantsCount, fromField, toField));
        
        if (isWithinRange(consultantsCount, fromField, toField)) {
          matched = true;
          const decision = loading.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                          loading.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
          
          console.log('✅ Match found! Decision:', decision);
          
          const pricingValue = extractPricingValue(loading);
          
          addValidationResult(
            'consultants_count',
            consultantsCount,
            `${fromField || 0} - ${toField || '∞'}`,
            `${fromField || 0}-${toField || '∞'}`,
            loading.pricing_type || 'percentage',
            pricingValue,
            loading.quote_option || 'auto_quote',
            decision
          );
          break;
        }
      }

      if (!matched) {
        console.log('❌ No matching range found for consultants count:', consultantsCount);
        addValidationResult(
          'consultants_count',
          consultantsCount,
          'No matching range found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // 10. Location Hazard Validation
    const validateLocationHazard = () => {
      console.log('🌍 Starting location hazard validation...');
      
      // Get proposal risk values
      const proposalRiskValues = {
        near_water_body: normalizeBoolean(proposal.site_risks?.near_water_body),
        flood_prone_zone: normalizeBoolean(proposal.site_risks?.flood_prone_zone),
        within_city_center: proposal.site_risks?.within_city_center === 'yes',
        soil_type: proposal.site_risks?.soil_type,
        existing_structure: normalizeBoolean(proposal.site_risks?.existing_structure),
        blasting_or_deep_excavation: normalizeBoolean(proposal.site_risks?.blasting_or_deep_excavation),
        site_security_arrangements: proposal.site_risks?.site_security_arrangements,
        area_type: proposal.site_risks?.area_type
      };

      console.log('🔍 Proposal risk values:', proposalRiskValues);

      const riskDefinition = insurerConfig.project_risk_factors?.location_hazard_loadings?.risk_definition;
      const locationHazardRates = insurerConfig.project_risk_factors?.location_hazard_loadings?.location_hazard_rates || [];
      
      let derivedRisk = 'Low Risk';

      if (riskDefinition?.factors) {
        // Check risk levels in order: very high → high → moderate → low
        const riskLevels = ['very_high_risk', 'high_risk', 'moderate_risk', 'low_risk'];
        
        for (const riskLevel of riskLevels) {
          let matchesRiskLevel = false;
          
          for (const factor of riskDefinition.factors) {
            const factorName = normalizeString(factor.factor);
            const riskValue = factor[riskLevel];
            
            if (factorName.includes('water') && proposalRiskValues.near_water_body) {
              if (riskValue === 'yes') matchesRiskLevel = true;
            } else if (factorName.includes('flood') && proposalRiskValues.flood_prone_zone) {
              if (riskValue === 'yes') matchesRiskLevel = true;
            } else if (factorName.includes('city') && proposalRiskValues.within_city_center) {
              if (riskValue === 'yes') matchesRiskLevel = true;
            } else if (factorName.includes('soil') && proposalRiskValues.soil_type) {
              // Handle soil types as array (new API format) or comma-separated string (legacy format)
              let soilTypes: string[];
              if (Array.isArray(riskValue)) {
                soilTypes = riskValue.map((type: string) => type.toLowerCase());
              } else {
                soilTypes = riskValue.toLowerCase().split(', ');
              }
              if (soilTypes.includes(proposalRiskValues.soil_type.toLowerCase())) matchesRiskLevel = true;
            } else if (factorName.includes('existing') && proposalRiskValues.existing_structure) {
              if (riskValue === 'yes') matchesRiskLevel = true;
            } else if (factorName.includes('blasting') && proposalRiskValues.blasting_or_deep_excavation) {
              if (riskValue === 'yes') matchesRiskLevel = true;
            } else if (factorName.includes('security')) {
              if (riskValue === 'yes') matchesRiskLevel = true;
            }
          }
          
          if (matchesRiskLevel) {
            derivedRisk = riskLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            break;
          }
        }
      }

      console.log('🎯 Derived risk level:', derivedRisk);

      // Find matching location hazard rate
      let matched = false;
      
      for (const rate of locationHazardRates) {
        if (normalizeString(rate.risk_level) === normalizeString(derivedRisk)) {
          matched = true;
          const decision = rate.quote_option === 'NO_QUOTE' ? 'No Quote' : 
                          rate.quote_option === 'MANUAL_QUOTE' ? 'Manual Review' : 'Auto Quote';
          
          const pricingValue = extractPricingValue(rate);
          
          addValidationResult(
            'location_hazard',
            derivedRisk,
            rate.risk_level,
            rate.risk_level,
            rate.pricing_type || 'PERCENTAGE',
            pricingValue,
            rate.quote_option || 'AUTO_QUOTE',
            decision
          );
          break;
        }
      }

      if (!matched) {
        addValidationResult(
          'location_hazard',
          derivedRisk,
          'No matching risk level found',
          'N/A',
          'percentage',
          0,
          'no_quote',
          'No Quote'
        );
      }
    };

    // Execute all validations
    validateProjectType();
    validateSubProjectType();
    validateConfigItems();
    validateProjectDuration();
    validateMaintenancePeriod();
    validateCoverageAmounts();
    validateCrossLiabilityCover();
    validateContractorExperience();
    validateClaimsHistory();
    validateClaimsAmount();
    validateSubContractorsCount();
    validateConsultantsCount();
    validateLocationHazard();

    // Calculate pricing if Auto Quote
    let basePremium = 0;
    let pricingDetails = null;
    let pricingResult = null;
    
    if (overallDecision === 'Auto Quote') {
      pricingResult = calculateBasePremium(validationResults, proposal, insurerConfig);
      basePremium = pricingResult.basePremium;
      pricingDetails = pricingResult.details;
      
      console.log(`💰 Pricing calculated for insurer ${insurerId}:`, {
        basePremium,
        calculatedBasePremium: pricingResult.calculatedBasePremium,
        minimumPremiumRate: pricingResult.minimumPremiumRate,
        isMinimumPremiumApplied: pricingResult.isMinimumPremiumApplied,
        percentageProduct: pricingResult.percentageProduct,
        factorsSum: pricingResult.factorsSum,
        sumInsured: proposal.cover_requirements?.sum_insured || 0
      });
    }

    console.log(`✅ Validation completed for insurer ${insurerId}:`, {
      totalValidations: validationResults.length,
      overallDecision,
      isEligible: overallDecision === 'Auto Quote',
      basePremium: basePremium > 0 ? basePremium : 'N/A'
    });

    return {
      values: validationResults,
      overallDecision,
      isEligible: overallDecision === 'Auto Quote',
      basePremium,
      calculatedBasePremium: pricingResult?.calculatedBasePremium || basePremium,
      minimumPremiumRate: pricingResult?.minimumPremiumRate || 0,
      isMinimumPremiumApplied: pricingResult?.isMinimumPremiumApplied || false,
      minimumPremiumMatch: pricingResult?.minimumPremiumMatch || null,
      pricingDetails
    };
  };

  // Insurer validation logic
  const validateInsurerEligibility = (insurer: any): boolean => {
    console.log('🔍 Validating insurer:', insurer.insurer_name);
    
    // Check 1: Active status
    const isActive = insurer.status === "active";
    console.log('✅ Active status check:', isActive, `(status: ${insurer.status})`);
    
    // Check 2: Has product_id = 1
    const hasProductId1 = insurer.product_assigned_details.some((product: any) => product.product_id === 1);
    console.log('✅ Product ID 1 check:', hasProductId1, `(products: ${insurer.product_assigned_details.map((p: any) => p.product_id).join(', ')})`);
    
    // Check 3: Backdate validation
    let isWithinBackdate = false;
    if (currentProposal?.project?.start_date) {
      const startDate = new Date(currentProposal.project.start_date);
      const currentDate = new Date();
      const daysDifference = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Find the product with product_id = 1 to get backdate_days
      const productWithId1 = insurer.product_assigned_details.find((product: any) => product.product_id === 1);
      if (productWithId1?.quote_config?.backdate_days) {
        isWithinBackdate = daysDifference <= productWithId1.quote_config.backdate_days;
        console.log('✅ Backdate check:', isWithinBackdate, `(days difference: ${daysDifference}, backdate_days: ${productWithId1.quote_config.backdate_days})`);
      } else {
        console.log('❌ Backdate check failed: No product with ID 1 found or no backdate_days configured');
      }
    } else {
      console.log('❌ Backdate check failed: No start_date in current proposal');
    }
    
    // Check 4: Geographic validation
    let isGeographicMatch = false;
    if (currentProposal?.project?.country && currentProposal?.project?.region && currentProposal?.project?.zone) {
      const proposalCountry = currentProposal.project.country;
      const proposalRegion = currentProposal.project.region;
      const proposalZone = currentProposal.project.zone;
      
      // Find the product with product_id = 1 to get operating areas
      const productWithId1 = insurer.product_assigned_details.find((product: any) => product.product_id === 1);
      if (productWithId1?.quote_config) {
        const operatingCountries = productWithId1.quote_config.operating_countries || [];
        const operatingRegions = productWithId1.quote_config.operating_regions || [];
        const operatingZones = productWithId1.quote_config.operating_zones || [];
        
        // Normalize all strings for comparison
        const normalizedProposalCountry = normalizeGeographicString(proposalCountry);
        const normalizedProposalRegion = normalizeGeographicString(proposalRegion);
        const normalizedProposalZone = normalizeGeographicString(proposalZone);
        
        // Check if any operating country matches the proposal country (normalized)
        const countryMatch = operatingCountries.some((country: string) => 
          normalizeGeographicString(country) === normalizedProposalCountry
        );
        
        // Check if any operating region matches the proposal region (normalized)
        const regionMatch = operatingRegions.some((region: string) => 
          normalizeGeographicString(region) === normalizedProposalRegion
        );
        
        // Check if any operating zone matches the proposal zone (normalized)
        const zoneMatch = operatingZones.some((zone: string) => 
          normalizeGeographicString(zone) === normalizedProposalZone
        );
        
        // All three must match for geographic validation to pass
        isGeographicMatch = countryMatch && regionMatch && zoneMatch;
        
        console.log('✅ Geographic check:', isGeographicMatch, {
          proposal: { 
            country: proposalCountry, 
            region: proposalRegion, 
            zone: proposalZone,
            normalized: { 
              country: normalizedProposalCountry, 
              region: normalizedProposalRegion, 
              zone: normalizedProposalZone 
            }
          },
          insurer: { 
            countries: operatingCountries, 
            regions: operatingRegions, 
            zones: operatingZones,
            normalized: {
              countries: operatingCountries.map(normalizeGeographicString),
              regions: operatingRegions.map(normalizeGeographicString),
              zones: operatingZones.map(normalizeGeographicString)
            }
          },
          matches: { country: countryMatch, region: regionMatch, zone: zoneMatch }
        });
      } else {
        console.log('❌ Geographic check failed: No product with ID 1 found or no operating areas configured');
      }
    } else {
      console.log('❌ Geographic check failed: Missing proposal location data');
    }
    
    // All checks must pass
    const isEligible = isActive && hasProductId1 && isWithinBackdate && isGeographicMatch;
    console.log(`🎯 Insurer ${insurer.insurer_name} eligibility:`, isEligible, {
      active: isActive,
      hasProductId1,
      withinBackdate: isWithinBackdate,
      geographicMatch: isGeographicMatch
    });
    
    return isEligible;
  };

  // Get eligible insurers for pricing
  const getEligibleInsurers = () => {
    if (!assignedInsurers?.insurers || !currentProposal) {
      return [];
    }
    
    console.log('🔍 Starting insurer eligibility validation...');
    const eligibleInsurers = assignedInsurers.insurers.filter(validateInsurerEligibility);
    console.log('✅ Eligible insurers for pricing:', eligibleInsurers.map(i => i.insurer_name));
    
    return eligibleInsurers;
  };

  // Get eligible insurers whenever data changes - memoized to prevent infinite loops
  const eligibleInsurers = React.useMemo(() => {
    return getEligibleInsurers();
  }, [assignedInsurers, currentProposal]);

  // Load pricing configs when eligible insurers are found and not already loaded
  React.useEffect(() => {
    if (eligibleInsurers.length > 0 && onLoadPricingConfigs && !isLoadingPricingConfigs) {
      // Check if we already have pricing configs for all eligible insurers
      const hasAllConfigs = eligibleInsurers.every(insurer => 
        insurerPricingConfigs && insurerPricingConfigs[insurer.insurer_id]
      );
      
      if (!hasAllConfigs) {
        console.log('💰 Triggering pricing config loading for eligible insurers...');
        onLoadPricingConfigs(eligibleInsurers);
      }
    }
  }, [eligibleInsurers, onLoadPricingConfigs, insurerPricingConfigs, isLoadingPricingConfigs]);

  // Validate proposals against pricing configs when both are available
  React.useEffect(() => {
    if (currentProposal && insurerPricingConfigs && eligibleInsurers.length > 0) {
      // Check if we need to validate any new insurers
      const insurersToValidate = eligibleInsurers.filter(insurer => 
        insurerPricingConfigs[insurer.insurer_id] && 
        !validationCompleted.current.has(insurer.insurer_id)
      );

      if (insurersToValidate.length === 0) {
        console.log('⏭️ All insurers already validated, skipping...');
        return;
      }

      console.log('🔍 Starting proposal validation for new insurers:', insurersToValidate.map(i => i.insurer_name));
      
      setInsurerValidationResults(prevResults => {
        const newValidationResults = { ...prevResults };
        
        insurersToValidate.forEach(insurer => {
          const pricingConfig = insurerPricingConfigs[insurer.insurer_id];
          if (pricingConfig) {
            console.log(`📋 Validating proposal for insurer: ${insurer.insurer_name}`);
            const validationResult = validateProposalAgainstConfig(
              currentProposal, 
              pricingConfig, 
              insurer.insurer_id
            );
            newValidationResults[insurer.insurer_id] = validationResult;
            validationCompleted.current.add(insurer.insurer_id);
          }
        });
        
        console.log('✅ Validation completed for new insurers:', insurersToValidate.map(i => i.insurer_name));
        return newValidationResults;
      });
    }
  }, [currentProposal, insurerPricingConfigs, eligibleInsurers]);

  const [tplAdjustment, setTPLAdjustment] = useState(0);
  const [cewAdjustment, setCEWAdjustment] = useState(0);
  const [brokerCommissionPercent, setBrokerCommissionPercent] = useState(10);
  const [selectedCEWItems, setSelectedCEWItems] = useState<any[]>([]);
  const [showExtensionConfirmDialog, setShowExtensionConfirmDialog] = useState(false);
  const [pendingQuoteId, setPendingQuoteId] = useState<number | null>(null);
  const [isApplyingStoredData, setIsApplyingStoredData] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [premiumRecalculationTrigger, setPremiumRecalculationTrigger] = useState(0);

  // Reset the stored data flag after a longer delay to allow stored data to be applied
  useEffect(() => {
    if (isApplyingStoredData) {
      const timer = setTimeout(() => {
        console.log('🔧 Resetting isApplyingStoredData flag');
        setIsApplyingStoredData(false);
      }, 2000); // 2 second delay to allow stored data to be applied
      
      return () => clearTimeout(timer);
    }
  }, [isApplyingStoredData]);

  // Trigger premium recalculation when broker commission changes
  useEffect(() => {
    if (brokerCommissionPercent !== undefined) {
      console.log('🔧 Broker commission changed, triggering premium recalculation:', brokerCommissionPercent);
      setPremiumRecalculationTrigger(prev => prev + 1);
    }
  }, [brokerCommissionPercent]);
  const [productConfigBundle, setProductConfigBundle] = useState<any>(null);
  const [isLoadingProductConfig, setIsLoadingProductConfig] = useState(false);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [showPlanConfirmationDialog, setShowPlanConfirmationDialog] = useState(false);
  const [pendingPlanSelection, setPendingPlanSelection] = useState<number | null>(null);

  // Initialize broker commission when product config bundle loads
  React.useEffect(() => {
    if (productConfigBundle?.policy_limits_and_deductible?.base_broker_commission?.value) {
      setBrokerCommissionPercent(productConfigBundle.policy_limits_and_deductible.base_broker_commission.value);
    }
  }, [productConfigBundle]);

  // State for storing insurer validation results
  const [insurerValidationResults, setInsurerValidationResults] = useState<Record<number, {
    values: Array<{
      field_name: string;
      proposal_value: any;
      config_range: string;
      config_matched_label: string;
      pricing_type: string;
      pricing_value: number;
      quote_option: string;
      decision: 'Auto Quote' | 'No Quote' | 'Manual Review';
    }>;
    overallDecision: 'Auto Quote' | 'No Quote' | 'Manual Review';
    isEligible: boolean;
    basePremium: number;
    calculatedBasePremium?: number;
    minimumPremiumRate?: number;
    isMinimumPremiumApplied?: boolean;
    minimumPremiumMatch?: any;
    pricingDetails: any;
  }>>({});

  // Ref to track validation completion and prevent duplicate runs
  const validationCompleted = React.useRef<Set<number>>(new Set());
  // Store updated premiums and CEW selections per quote
  const [updatedQuotes, setUpdatedQuotes] = useState<Record<number, { 
    premium: number; 
    cewItems: any[]; 
    isUpdated: boolean 
  }>>({});
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  const { toast } = useToast();

  const handleQuoteSelect = (quoteId: number, checked: boolean) => {
    if (checked) {
      setSelectedQuotes(prev => [...prev, quoteId]);
    } else {
      setSelectedQuotes(prev => prev.filter(id => id !== quoteId));
    }
  };

  const handleCompare = () => {
    if (selectedQuotes.length === 2) {
      setIsCompareDialogOpen(true);
    }
  };

  const handleDownload = () => {
    // Create and download PDF comparison
    const selectedData = realQuotes.filter(q => selectedQuotes.includes(q.id));
    const content = selectedData.map(quote => 
      `${quote.planName} - ${quote.insurerName}\nPremium: ${formatCurrency(quote.annualPremium)}\nCoverage: ${formatCurrency(quote.coverageAmount)}\n\n`
    ).join('');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insurance-comparison.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSelectPlan = (quoteId: number) => {
    // Check if extensions have been customized for this quote
    const hasCustomizedExtensions = updatedQuotes[quoteId]?.isUpdated || false;
    
    if (!hasCustomizedExtensions) {
      // Show confirmation dialog for default extensions
      setPendingQuoteId(quoteId);
      setShowExtensionConfirmDialog(true);
    } else {
      // Proceed with selection
      proceedWithSelection(quoteId);
    }
  };

  const proceedWithSelection = (quoteId: number) => {
    // Check if we're in the proposal form context by looking for a parent function
    if (window.onQuoteSelected) {
      // We're in the proposal form, navigate to declaration step
      window.onQuoteSelected(quoteId);
    } else {
      // We're in standalone quotes page, navigate to declaration page
      navigate('/customer/declaration', { state: { selectedQuote: quoteId } });
    }
  };

  const handleExtensionsClick = async (quote: any) => {
    console.log('Extensions button clicked for quote:', quote);
    setSelectedQuoteForCEW(quote);
    
    // Check for stored request data for this specific insurer
    const storedRequest = getStoredRequestForInsurer(quote.id);
    console.log('🔍 Checking for stored request data for insurer', quote.id, ':', storedRequest);
    
    // Fetch product config bundle for this insurer
    try {
      setIsLoadingProductConfig(true);
      const configBundle = await getInsurerPricingConfig(quote.id);
      console.log('📦 Product config bundle loaded:', configBundle);
      setProductConfigBundle(configBundle);
      
      // Check if we have stored data for this quote
      if (storedRequest) {
        console.log('🔄 Found stored data for quote', quote.id, ':', storedRequest);

        // Set flag to prevent parent state updates during stored data application
        setIsApplyingStoredData(true);

        // Restore adjustments to component state
        setTPLAdjustment(storedRequest.tplAdjustment || 0);
        setCEWAdjustment(storedRequest.cewAdjustment || 0);
        setBrokerCommissionPercent(storedRequest.brokerCommissionPercent || 10);

        toast({
          title: "Previous Selections Found",
          description: "Your previous selections will be restored when the dialog loads.",
        });
      } else {
        // Reset to default state when opening dialog for the first time for this quote
        console.log('🔧 No stored data for quote', quote.id, '- resetting to default state');
        setPremiumAdjustment(0);
        setSelectedCEWItems([]);
        setTPLAdjustment(0);
        setCEWAdjustment(0);
        setBrokerCommissionPercent(10); // Reset to default broker commission
        console.log('🔧 Dialog opening - selectedCEWItems reset to:', []);
      }
    } catch (error) {
      console.error('❌ Error loading product config bundle:', error);
      toast({
        title: "Error",
        description: "Failed to load product configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingProductConfig(false);
    }
    
    setShowCEWDialog(true);
  };


  const handleCEWSelectionChange = (selectedItems: any[]) => {
    console.log('🔧 handleCEWSelectionChange called with:', selectedItems);
    console.log('🔧 Previous selectedCEWItems:', selectedCEWItems);
    console.log('🔧 isApplyingStoredData:', isApplyingStoredData);
    console.log('🔧 selectedItems selected count:', selectedItems.filter(item => item.isSelected).length);
    
    // Always update selectedCEWItems to ensure stored data is properly applied
    setSelectedCEWItems(selectedItems);
    console.log('🔧 selectedCEWItems updated to:', selectedItems);
  };

  const handlePremiumChange = (adjustment: number) => {
    setPremiumAdjustment(adjustment);
  };

  const handleTPLAdjustmentChange = (adjustment: number) => {
    setTPLAdjustment(adjustment);
  };

  const handleCEWAdjustmentChange = (percentageAdjustment: number, fixedAdjustment: number = 0) => {
    // Store both adjustments separately for proper calculation
    // For now, we'll combine them, but in the future we might need to handle them separately
    setCEWAdjustment(percentageAdjustment + fixedAdjustment);
  };


  // Clear stored data when component mounts (new quote flow)
  useEffect(() => {
    const shouldClear = shouldClearStoredData();
    
    console.log('🔍 Should clear stored data:', shouldClear);
    console.log('🔍 Current URL:', window.location.href);
    
    if (shouldClear) {
      console.log('🆕 New quote flow detected - clearing all stored data for clean state');
      resetStateForNewQuote();
    } else {
      console.log('🔄 Existing quote flow - preserving stored data');
      // Just reset component state but keep stored data
      setSelectedQuotes([]);
      setUpdatedQuotes({});
      setSelectedCEWItems([]);
      setTPLAdjustment(0);
      setCEWAdjustment(0);
      setBrokerCommissionPercent(10);
      setPremiumAdjustment(0);
      setShowCEWDialog(false);
      setProductConfigBundle(null);
    }
    
    // Clear the flag
    localStorage.removeItem('is_new_quote');
  }, []);

  // Load stored request data for comparison table
  const loadStoredRequestData = () => {
    const storedRequests = JSON.parse(localStorage.getItem('stored_plan_requests') || '{}');
    console.log('📖 Loaded stored requests:', storedRequests);
    return storedRequests;
  };

  // Get stored request data for a specific insurer
  const getStoredRequestForInsurer = (insurerId: number) => {
    const storedRequests = loadStoredRequestData();
    return storedRequests[insurerId] || null;
  };

  // Clear stored data for a specific insurer
  const clearStoredDataForInsurer = (insurerId: number) => {
    const storedRequests = loadStoredRequestData();
    if (storedRequests[insurerId]) {
      delete storedRequests[insurerId];
      localStorage.setItem('stored_plan_requests', JSON.stringify(storedRequests));
      console.log('🗑️ Cleared stored data for insurer', insurerId);
    }
  };

  // Clear all stored data (for new quote flow)
  const clearAllStoredData = () => {
    localStorage.removeItem('stored_plan_requests');
    console.log('🗑️ Cleared all stored plan requests');
  };

  // Set flag for new quote flow
  const startNewQuote = () => {
    localStorage.setItem('is_new_quote', 'true');
    console.log('🆕 New quote flag set');
  };

  // Check if we should clear stored data (only for truly new quotes)
  const shouldClearStoredData = () => {
    const isNewQuote = localStorage.getItem('is_new_quote') === 'true';
    const isNewProposal = window.location.search.includes('new=true');
    const isProposalPage = window.location.pathname.includes('/customer/proposal');
    const hasStoredData = Object.keys(JSON.parse(localStorage.getItem('stored_plan_requests') || '{}')).length > 0;
    
    // Only clear if it's explicitly a new quote or new proposal
    return isNewQuote || (isProposalPage && isNewProposal);
  };

  // Reset all state for new quote
  const resetStateForNewQuote = () => {
    console.log('🔄 Resetting state for new quote');
    setSelectedQuotes([]);
    setUpdatedQuotes({});
    setSelectedCEWItems([]);
    setTPLAdjustment(0);
    setCEWAdjustment(0);
    setBrokerCommissionPercent(10);
    setPremiumAdjustment(0);
    setShowCEWDialog(false);
    setProductConfigBundle(null);
    clearAllStoredData();
    
    // Also clear any other related localStorage items
    localStorage.removeItem('coverages_selected');
    localStorage.removeItem('plans_selected');
    localStorage.removeItem('selected_plan_id');
    localStorage.removeItem('selected_plan_data');
    console.log('🗑️ Cleared all related localStorage items');
  };

  // Validate mandatory CEW items
  const validateMandatoryCEWItems = () => {
    const unselectedMandatoryItems = selectedCEWItems.filter(item => item.isMandatory && !item.isSelected);
    if (unselectedMandatoryItems.length > 0) {
      const itemNames = unselectedMandatoryItems.map(item => item.name).join(', ');
      toast({
        title: "Mandatory Items Required",
        description: `Please select the following mandatory Policy Extensions & Conditions: ${itemNames}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleTPLSelectionChange = (tplOption: any) => {
    if (tplOption) {
      // Add TPL extension to selected items
      const tplExtension = {
        id: 'tpl-extension',
        code: 'TPL',
        name: `TPL Limit Extension - ${tplOption.label}`,
        type: 'extension',
        category: 'TPL Extensions',
        description: tplOption.description || 'Third Party Liability coverage extension',
        isMandatory: false,
        isSelected: true,
        impact: {
          coverage: 'Enhanced TPL coverage',
          premium: tplOption.premiumAdjustment > 0 ? 'increase' : 'decrease',
          premiumAmount: Math.abs(tplOption.premiumAdjustment)
        }
      };
      
      setSelectedCEWItems(prev => {
        // Remove existing TPL extension if any
        const filtered = prev.filter(item => item.id !== 'tpl-extension');
        // Add new TPL extension
        return [...filtered, tplExtension];
      });
    } else {
      // Remove TPL extension from selected items
      setSelectedCEWItems(prev => prev.filter(item => item.id !== 'tpl-extension'));
    }
  };

  const calculateFinalPremium = () => {
    if (!selectedQuoteForCEW) return 0;
    
    // Get the base premium from validation results
    const validationResult = selectedQuoteForCEW.validationResult;
    const basePremium = validationResult?.basePremium || selectedQuoteForCEW.annualPremium;
    
    // Extract default broker commission from product config bundle
    const defaultBrokerCommission = productConfigBundle?.policy_limits_and_deductible?.base_broker_commission?.value || 10;
    
    // Calculate adjustments as percentage of base premium
    const tplAdjustmentAmount = (basePremium * tplAdjustment) / 100;
    const cewAdjustmentAmount = (basePremium * cewAdjustment) / 100;
    
    // Calculate final premium = base premium + adjustments
    const finalPremium = basePremium + tplAdjustmentAmount + cewAdjustmentAmount;
    
    // Calculate nett premium = final premium - (final premium × default broker commission)
    const nettPremium = finalPremium - (finalPremium * defaultBrokerCommission / 100);
    
    // Calculate revised broker commission (based on final premium including adjustments)
    const revisedBrokerCommission = (finalPremium * brokerCommissionPercent) / 100;
    
    // Final total annual premium = nett premium + revised broker commission
    return nettPremium + revisedBrokerCommission;
  };

  // Memoized premium calculation that updates when trigger changes
  const finalPremium = useMemo(() => {
    console.log('🔧 Recalculating final premium, trigger:', premiumRecalculationTrigger);
    return calculateFinalPremium();
  }, [selectedQuoteForCEW, tplAdjustment, cewAdjustment, brokerCommissionPercent, productConfigBundle, premiumRecalculationTrigger]);

  const handleUpdatePremium = () => {
    if (!selectedQuoteForCEW) return;
    
    const finalPremiumValue = calculateFinalPremium();
    
    // Build complete request payload for storage
    const completeRequestPayload = buildPlanSelectionPayload(selectedQuoteForCEW);
    
    // Store the complete request with insurer ID reference
    const storedRequests = JSON.parse(localStorage.getItem('stored_plan_requests') || '{}');
    storedRequests[selectedQuoteForCEW.id] = {
      ...completeRequestPayload,
      premium_amount: finalPremiumValue, // Use the calculated final premium value
      lastUpdated: new Date().toISOString(),
      tplAdjustment,
      cewAdjustment,
      brokerCommissionPercent,
      selectedCEWItems: selectedCEWItems.filter(item => item.isSelected),
      // Store complete CEW items with all their data for proper restoration
      completeCEWItems: selectedCEWItems
    };
    localStorage.setItem('stored_plan_requests', JSON.stringify(storedRequests));
    
    console.log('💾 Stored plan request for insurer', selectedQuoteForCEW.id, ':', storedRequests[selectedQuoteForCEW.id]);
    
    // Update the quotes data with new premium and CEW selections
    setUpdatedQuotes(prev => ({
      ...prev,
      [selectedQuoteForCEW.id]: {
        premium: finalPremiumValue,
        cewItems: selectedCEWItems.filter(item => item.isSelected),
        isUpdated: true
      }
    }));
    
    toast({
      title: "Premium Updated",
      description: `New annual premium: ${formatCurrency(finalPremiumValue)}`,
    });
    
    // Close the dialog
    setShowCEWDialog(false);
  };

  const handleProceedToPurchase = () => {
    setShowCEWDialog(false);
    navigate('/customer/declaration', { 
      state: { 
        selectedQuote: selectedQuoteForCEW?.id,
        cewSelections: selectedCEWItems,
        finalPremium: finalPremium
      } 
    });
  };

  // Build plan selection request payload
  const buildPlanSelectionPayload = (quote: any): PlanSelectionRequest => {
    const validationResult = quote.validationResult;
    const basePremium = validationResult?.basePremium || quote.annualPremium;
    const defaultBrokerCommission = productConfigBundle?.policy_limits_and_deductible?.base_broker_commission?.value || 10;
    const minBrokerCommission = productConfigBundle?.policy_limits_and_deductible?.minimum_broker_commission?.value || 5;
    const maxBrokerCommission = productConfigBundle?.policy_limits_and_deductible?.maximum_broker_commission?.value || 15;
    
    // Calculate adjustments
    const tplAdjustmentAmount = (basePremium * tplAdjustment) / 100;
    const cewAdjustmentAmount = (basePremium * cewAdjustment) / 100;
    
    // Calculate final premium = base premium + adjustments
    const finalPremium = basePremium + tplAdjustmentAmount + cewAdjustmentAmount;
    
    // Calculate nett premium = final premium - (final premium × default broker commission)
    const nettPremium = finalPremium - (finalPremium * defaultBrokerCommission / 100);
    
    // Calculate revised broker commission (based on final premium including adjustments)
    const revisedBrokerCommission = (finalPremium * brokerCommissionPercent) / 100;
    
    // Check if minimum premium was applied
    const isMinimumPremiumApplied = validationResult?.isMinimumPremiumApplied || false;
    const minimumPremiumValue = validationResult?.minimumPremiumValue || 0;
    
    // Build selected extensions with proper structure
    const selectedExtensions: Record<string, any> = {};
    selectedCEWItems
      .filter(item => item.isSelected)
      .forEach(item => {
        const key = (item.code && typeof item.code === 'string') 
          ? item.code.toLowerCase().replace(/[^a-z0-9]/g, '_') 
          : `extension_${item.id}`;
        
        const selectedOption = item.selectedOptionId ? 
          item.options?.find(opt => opt.id === item.selectedOptionId) : null;
        
        const extensionData: any = {
          code: item.code || `EXT${item.id}`,
          label: selectedOption?.label || item.name,
          description: item.description || item.impact?.coverage || ''
        };
        
        // Add impact based on pricing type
        if (selectedOption) {
          if (selectedOption.type === 'percentage') {
            extensionData.impact_pct = selectedOption.value;
          } else {
            extensionData.impact_amount = selectedOption.value;
          }
        } else {
          // Use base rate - determine if it's percentage or fixed
          const isPercentage = Math.abs(item.defaultValue) <= 100;
          if (isPercentage) {
            extensionData.impact_pct = item.defaultValue;
          } else {
            extensionData.impact_amount = item.defaultValue;
          }
        }
        
        selectedExtensions[key] = extensionData;
      });

    // Build TPL limit
    const tplLimit = {
      label: `AED ${(quote.coverageAmount / 1000000).toFixed(0)}M`,
      impact_pct: tplAdjustment,
      description: `Third Party Liability up to AED ${(quote.coverageAmount / 1000000).toFixed(0)} Million`
    };

    return {
      insurer_name: quote.insurerName,
      insurer_id: quote.id,
      premium_amount: finalPremium,
      is_minimum_premium_applied: isMinimumPremiumApplied,
      minimum_premium_value: minimumPremiumValue,
      extensions: {
        tpl_limit: tplLimit,
        selected_extensions: selectedExtensions,
        selected_plan: {
          insurer_name: quote.insurerName,
          base_premium: basePremium,
          coverage_amount: quote.coverageAmount,
          deductible: 25000 // Default deductible
        }
        },
        premium_summary: {
          net_premium: nettPremium,
          broker_commission_pct: brokerCommissionPercent,
          broker_commission_amount: revisedBrokerCommission,
          broker_min_commission_pct: minBrokerCommission,
          broker_max_commission_pct: maxBrokerCommission,
          broker_base_commission_pct: defaultBrokerCommission,
          cew_adjustments_pct: tplAdjustment + cewAdjustment,
          cew_adjustments_amount: tplAdjustmentAmount + cewAdjustmentAmount,
        total_annual_premium: finalPremium
      }
    };
  };

  // Handle plan selection confirmation
  const handleSelectPlanClick = (quoteId: number) => {
    setPendingPlanSelection(quoteId);
    setShowPlanConfirmationDialog(true);
  };

  // Confirm plan selection
  const confirmPlanSelection = () => {
    if (pendingPlanSelection) {
      setShowPlanConfirmationDialog(false);
      handleSelectPlanWithAPI(pendingPlanSelection);
      setPendingPlanSelection(null);
    }
  };

  // Cancel plan selection
  const cancelPlanSelection = () => {
    setShowPlanConfirmationDialog(false);
    setPendingPlanSelection(null);
  };

  // Handle plan selection with API call
  const handleSelectPlanWithAPI = async (quoteId: number) => {
    try {
      setIsSubmittingPlan(true);
      
      // Validate mandatory CEW items
      if (!validateMandatoryCEWItems()) {
        setIsSubmittingPlan(false);
        return;
      }
      
      // Get quote ID from storage
      const storedQuoteId = localStorage.getItem('currentQuoteId');
      if (!storedQuoteId) {
        throw new Error('Quote ID not found in storage. Please refresh the page and try again.');
      }

      // Check storage flags
      const coveragesSelected = localStorage.getItem('coverages_selected') === 'true';
      const plansSelected = localStorage.getItem('plans_selected') === 'true';
      
      // Find the selected quote
      const selectedQuote = realQuotes.find(q => q.id === quoteId);
      if (!selectedQuote) {
        throw new Error('Selected quote not found. Please refresh the page and try again.');
      }

      // Validate required data
      if (!selectedQuote.insurerName || !selectedQuote.coverageAmount) {
        throw new Error('Invalid quote data. Please refresh the page and try again.');
      }

      // Build request payload
      const payload = buildPlanSelectionPayload(selectedQuote);
      
      // Log payload for debugging
      console.log('🚀 Plan Selection Payload:', payload);

      // Call appropriate API based on storage flags
      let response;
      const isFirstTime = !coveragesSelected && !plansSelected;
      
      try {
        if (isFirstTime) {
        // First time - use POST
          console.log('📤 Creating new plan selection...');
        response = await createPlanSelection(parseInt(storedQuoteId), payload);
          
          // Store the plan ID for future updates
          if (response && response.offer && response.offer.id) {
            localStorage.setItem('selected_plan_id', response.offer.id.toString());
            console.log('💾 Stored plan ID:', response.offer.id);
          }
      } else {
        // Update existing - use PATCH
          console.log('📤 Updating existing plan selection...');
          const storedPlanId = localStorage.getItem('selected_plan_id');
          if (!storedPlanId) {
            throw new Error('Plan ID not found. Please refresh the page and try again.');
          }
          response = await updatePlanSelection(parseInt(storedQuoteId), storedPlanId, payload);
        }
        
        console.log('✅ Plan selection API response:', response);
      } catch (apiError: any) {
        console.error('❌ API Error:', apiError);
        
        // Enhanced error handling
        if (apiError.response?.status === 400) {
          throw new Error('Invalid data provided. Please check your selections and try again.');
        } else if (apiError.response?.status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else if (apiError.response?.status === 403) {
          throw new Error('You do not have permission to select this plan.');
        } else if (apiError.response?.status === 404) {
          throw new Error('Quote not found. Please refresh the page and try again.');
        } else if (apiError.response?.status >= 500) {
          throw new Error('Server error. Please try again in a few minutes.');
        } else if (apiError.code === 'NETWORK_ERROR' || !navigator.onLine) {
          throw new Error('Network error. Please check your internet connection and try again.');
        } else {
          throw new Error(apiError.message || 'Failed to select plan. Please try again.');
        }
      }

      // Update storage flags and save selection data
      localStorage.setItem('coverages_selected', 'true');
      localStorage.setItem('plans_selected', 'true');
      // Note: selected_plan_id is already set above when storing the API response
      localStorage.setItem('selected_plan_data', JSON.stringify({
        quoteId,
        insurerName: selectedQuote.insurerName,
        premium: finalPremium,
        selectedAt: new Date().toISOString(),
        payload
      }));

      // Show success message
      toast({
        title: "Plan Selected Successfully",
        description: `Selected ${selectedQuote.insurerName} plan with premium ${formatCurrency(finalPremium)}`,
      });

      // Close dialog and proceed
      setShowCEWDialog(false);
      
      // Check if we're in the proposal form context
      if (window.onQuoteSelected) {
        // We're in the proposal form, navigate to declaration step
        console.log('📋 Navigating to declaration step in proposal form...');
        window.onQuoteSelected(quoteId);
      } else {
        // We're in standalone quotes page, navigate to declaration page
        console.log('📋 Navigating to declaration page...');
        navigate('/customer/declaration', { 
          state: { 
            selectedQuote: quoteId,
            planData: {
              insurerName: selectedQuote.insurerName,
              premium: finalPremium,
              coverageAmount: selectedQuote.coverageAmount,
              selectedExtensions: selectedCEWItems.filter(item => item.isSelected),
              tplAdjustment,
              cewAdjustment,
              brokerCommissionPercent
            }
          } 
        });
      }

    } catch (error: any) {
      console.error('❌ Error selecting plan:', error);
      
      // Show user-friendly error message
      toast({
        title: "Error Selecting Plan",
        description: error.message || "Failed to select plan. Please try again.",
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSelectPlanWithAPI(quoteId)}
            className="ml-2"
          >
            Retry
          </Button>
        )
      });
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const handleDownloadQuotation = () => {
    if (selectedQuotes.length === 0) {
      toast({
        title: "No Plan Selected",
        description: "Please select a plan to download the quotation.",
        variant: "destructive"
      });
      return;
    }

    const selectedQuoteData = realQuotes.filter(q => selectedQuotes.includes(q.id));
    
    // Create quotation content
    const quotationContent = selectedQuoteData.map(quote => {
      return `
CONSTRUCTION INSURANCE QUOTATION
================================

Plan Details:
- Plan Name: ${quote.planName}
- Insurer: ${quote.insurerName}
- Annual Premium: ${formatCurrency(quote.annualPremium)}
- Coverage Amount: ${formatCurrency(quote.coverageAmount)}
- Deductible: ${quote.deductible}
- Rating: ${quote.rating}/5.0

Key Coverage:
${quote.keyCoverage.map(coverage => `• ${coverage}`).join('\n')}

Benefits:
${quote.benefits.map(benefit => `• ${benefit}`).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
Valid until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}

---
This quotation is subject to terms and conditions.
Contact us for more details or to proceed with the application.
      `.trim();
    }).join('\n\n' + '='.repeat(50) + '\n\n');

    // Create and download file
    const blob = new Blob([quotationContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Insurance_Quotation_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Quotation Downloaded",
      description: `Downloaded quotation for ${selectedQuoteData.length} plan(s)`,
    });
  };

  const handleDownloadProposal = () => {
    if (selectedQuotes.length === 0) {
      toast({
        title: "No Plan Selected",
        description: "Please select a plan to download the proposal.",
        variant: "destructive"
      });
      return;
    }

    const selectedQuoteData = realQuotes.filter(q => selectedQuotes.includes(q.id));
    
    const pdf = new jsPDF();
    let yPos = 20;
    const lineHeight = 8;
    const pageHeight = pdf.internal.pageSize.height;
    const marginBottom = 20;

    // Helper function to add text with page break if needed
    const addText = (text: string, fontSize = 12, isBold = false) => {
      if (yPos > pageHeight - marginBottom) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.text(text, 20, yPos);
      yPos += lineHeight;
    };

    // Title
    addText('CONSTRUCTION INSURANCE PROPOSAL', 16, true);
    yPos += 10;

    selectedQuoteData.forEach((quote, index) => {
      if (index > 0) {
        pdf.addPage();
        yPos = 20;
      }

      // Plan Header
      addText(`PLAN ${index + 1}: ${quote.planName.toUpperCase()}`, 14, true);
      addText(`Insurer: ${quote.insurerName}`, 12, true);
      yPos += 5;

      // Plan Details
      addText('PLAN DETAILS', 12, true);
      addText(`Plan Name: ${quote.planName}`);
      addText(`Insurer: ${quote.insurerName}`);
      addText(`Annual Premium: ${formatCurrency(getCurrentPremium(quote))}`);
      addText(`Coverage Amount: ${formatCurrency(quote.coverageAmount)}`);
      addText(`Deductible: ${quote.deductible}`);
      addText(`Rating: ${quote.rating}/5.0`);
      yPos += 5;

      // Key Coverage
      addText('KEY COVERAGE', 12, true);
      quote.keyCoverage.forEach(coverage => {
        addText(`• ${coverage}`);
      });
      yPos += 5;

      // Benefits
      addText('BENEFITS', 12, true);
      quote.benefits.forEach(benefit => {
        addText(`• ${benefit}`);
      });
      yPos += 5;

      // CEW Items if available
      const cewItems = getCEWItems(quote.id);
      if (cewItems.length > 0) {
        addText('SELECTED EXTENSIONS', 12, true);
        cewItems.forEach(item => {
          addText(`• ${item.name}: ${item.selectedOption || 'Selected'}`);
        });
        yPos += 5;
      }

      // Footer for each plan
      addText(`Generated on: ${new Date().toLocaleDateString()}`);
      addText(`Valid until: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
      yPos += 10;

      // Signature Section for each plan
      addText('SIGNATURES', 12, true);
      yPos += 10;

      // Broker Signature
      addText('BROKER SIGNATURE:', 11, true);
      yPos += 15;
      pdf.line(20, yPos, 120, yPos); // Signature line
      yPos += 5;
      addText('Broker Name: _______________________', 9);
      addText('Date: _______________', 9);
      yPos += 15;

      // Customer Signature
      addText('CUSTOMER SIGNATURE:', 11, true);
      yPos += 15;
      pdf.line(20, yPos, 120, yPos); // Signature line
      yPos += 5;
      addText('Customer Name: _______________________', 9);
      addText('Date: _______________', 9);
      yPos += 5;
    });

    // Save PDF
    pdf.save(`Insurance_Proposal_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Proposal Downloaded",
      description: `Downloaded proposal for ${selectedQuoteData.length} plan(s)`,
    });
  };

  // Generate real quotes from validation results
  const realQuotes = generateRealQuotes(insurerValidationResults, eligibleInsurers, insurerPricingConfigs || {});
  const comparedQuotes = realQuotes.filter(q => selectedQuotes.includes(q.id));
  
  // Helper function to get current premium for a quote (updated or original)
  const getCurrentPremium = (quote: any) => {
    // First check if there's stored request data for this specific quote
    const storedRequest = getStoredRequestForInsurer(quote.id);
    if (storedRequest) {
      console.log('💰 Using stored premium for quote', quote.id, ':', storedRequest.premium_amount);
      return storedRequest.premium_amount;
    }
    
    // Fallback to updated quotes
    const updatedData = updatedQuotes[quote.id];
    if (updatedData) {
      console.log('💰 Using updated premium for quote', quote.id, ':', updatedData.premium);
      return updatedData.premium;
    }
    
    // Default to original premium
    console.log('💰 Using original premium for quote', quote.id, ':', quote.annualPremium);
    return quote.annualPremium;
  };
  
  // Helper function to get CEW items for a quote
  const getCEWItems = (quoteId: number) => {
    const updatedData = updatedQuotes[quoteId];
    return updatedData ? updatedData.cewItems : [];
  };

  // Helper function to check if a quote has stored data
  const hasStoredData = (quoteId: number) => {
    const storedRequest = getStoredRequestForInsurer(quoteId);
    const hasData = storedRequest !== null;
    console.log('🔍 Checking stored data for quote', quoteId, ':', hasData);
    return hasData;
  };

  return (
    <>
      <section>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
          <div className="text-left">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              CAR Insurance Plans
            </h2>
            <p className="text-sm text-muted-foreground">
              Select up to 2 plans to compare
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {/* Validation Details Button */}
            <Button 
              onClick={() => setShowValidationDialog(true)}
              className="gap-2"
              variant="outline"
            >
              <FileText className="w-4 h-4" />
              Validation Details
            </Button>

            {selectedQuotes.length > 0 && (
              <>
                <Button 
                  onClick={handleCompare}
                  disabled={selectedQuotes.length !== 2}
                  className="gap-2"
                  variant="outline"
                >
                  <Eye className="w-4 h-4" />
                  Compare Selected Plans ({selectedQuotes.length}/2)
                </Button>
                
                <Button 
                  onClick={handleDownloadProposal}
                  className="gap-2"
                  variant="outline"
                >
                  <FileText className="w-4 h-4" />
                  Download Proposal
                </Button>
                
                <Button 
                  onClick={handleDownloadQuotation}
                  className="gap-2 bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Download Quotation
                </Button>
              </>
            )}
          </div>
        </div>


        {/* Eligible Insurers Information */}
        {eligibleInsurers.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-green-800">Eligible Insurers for Pricing</h3>
            </div>
            <p className="text-sm text-green-700 mb-3">
              {eligibleInsurers.length} insurer{eligibleInsurers.length !== 1 ? 's' : ''} passed all validation checks and can proceed with pricing.
            </p>
            <div className="flex flex-wrap gap-2">
              {eligibleInsurers.map((insurer, index) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {insurer.insurer_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Show message if no eligible insurers */}
        {assignedInsurers && currentProposal && eligibleInsurers.length === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <h3 className="font-semibold text-red-800">No Eligible Insurers</h3>
            </div>
            <p className="text-sm text-red-700">
              None of the assigned insurers passed the validation checks. Please check the console for detailed validation results.
            </p>
          </div>
        )}


          <div className="space-y-4">
          {realQuotes.map((quote) => {
            const isUpdated = updatedQuotes[quote.id]?.isUpdated;
            const hasStored = hasStoredData(quote.id);
            const currentPremium = getCurrentPremium(quote);
            
            return (
            <Card 
              key={quote.id} 
              className={`border transition-all duration-200 ${
                isUpdated || hasStored
                  ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20' 
                  : 'border-border hover:shadow-md'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedQuotes.includes(quote.id)}
                      onCheckedChange={(checked) => handleQuoteSelect(quote.id, !!checked)}
                      disabled={selectedQuotes.length >= 2 && !selectedQuotes.includes(quote.id)}
                    />
                    
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{quote.insurerName}</h3>
                        {hasStored && (
                          <Badge variant="secondary" className="text-xs">
                            Customized
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`text-lg font-semibold ${isUpdated ? 'text-primary' : 'text-foreground'}`}>
                            {formatCurrency(currentPremium)}
                          </div>
                          {isUpdated && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-800 border-green-200">
                              Updated
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Annual Premium
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => handleExtensionsClick(quote)}
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Extensions
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison Dialog */}
        <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Compare Insurance Plans</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleDownload}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Comparison
                  </Button>
                  <Button 
                    onClick={() => setIsCompareDialogOpen(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-6 mt-6">
              {comparedQuotes.map((quote) => (
                <div key={quote.id} className="space-y-4">
                  
                  
                  
                </div>
              ))}
            </div>
            
            {/* Selected Extensions Table */}
            {comparedQuotes.some(quote => getCEWItems(quote.id).length > 0) && (
              <div className="mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200 table-fixed">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left font-medium w-1/3"></th>
                        {comparedQuotes.map((quote) => (
                          <th key={quote.id} className="border border-gray-200 px-4 py-2 text-center font-medium w-1/3">
                            <div className="flex flex-col items-center space-y-1">
                              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                {quote.insurerName.charAt(0)}
                              </div>
                              <div className="text-xs">{quote.insurerName}</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 px-4 py-2 text-left font-medium text-sm text-muted-foreground w-1/3">Sum Insured</th>
                        {comparedQuotes.map((quote) => (
                          <th key={`sum-insured-${quote.id}`} className="border border-gray-200 px-4 py-2 text-center font-medium text-sm text-muted-foreground w-1/3">
                            <div className="font-semibold text-foreground">{formatCurrency(quote.coverageAmount)}</div>
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 px-4 py-2 text-left font-medium text-sm text-muted-foreground w-1/3">Default TPL Limit</th>
                        {comparedQuotes.map((quote) => (
                          <th key={`tpl-limit-${quote.id}`} className="border border-gray-200 px-4 py-2 text-center font-medium text-sm text-muted-foreground w-1/3">
                            <div className="font-semibold text-foreground">{formatCurrency(quote.annualPremium)}</div>
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 px-4 py-2 text-left font-medium text-sm text-muted-foreground w-1/3">Premium</th>
                        {comparedQuotes.map((quote) => (
                          <th key={`premium-${quote.id}`} className="border border-gray-200 px-4 py-2 text-center font-medium text-sm text-muted-foreground w-1/3">
                            <div className="font-semibold text-foreground">{formatCurrency(quote.annualPremium)}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Get all unique CEW items across all compared quotes
                        const allCEWItems = new Map();
                        comparedQuotes.forEach(quote => {
                          getCEWItems(quote.id).forEach(item => {
                            if (!allCEWItems.has(item.id)) {
                              allCEWItems.set(item.id, item);
                            }
                          });
                        });
                        
                        return Array.from(allCEWItems.values()).map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-200 px-4 py-2 font-medium text-sm w-1/3">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium">{item.name}</span>
                                <Badge variant="outline" className="text-xs">{item.code}</Badge>
                              </div>
                            </td>
                            {comparedQuotes.map((quote) => {
                              const quoteCEWItems = getCEWItems(quote.id);
                              const hasItem = quoteCEWItems.some(cewItem => cewItem.id === item.id);
                              return (
                                <td key={quote.id} className="border border-gray-200 px-4 py-2 text-center w-1/3">
                                  {hasItem ? (
                                    <div className="w-full">
                                      <div className="text-center mb-2">
                                        <div className="text-xs font-medium text-green-600">
                                          AED {Math.round(25000 * (item.impact.premiumAmount / 100)).toLocaleString()} ({item.impact.premiumAmount > 0 ? "+" : ""}{item.impact.premiumAmount}%)
                                        </div>
                                      </div>
                                      <div className="text-xs text-muted-foreground leading-relaxed text-left break-words">
                                        This extension provides additional coverage for {(item.name && typeof item.name === 'string') ? item.name.toLowerCase() : item.name} as per the policy terms and conditions. The coverage includes all standard exclusions and limitations as outlined in the main policy document.
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <div className="text-xs text-muted-foreground">Not Available</div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ));
                      })()}
                      
                      {/* TPL Extension Selection Row */}
                      <tr className="bg-blue-50">
                        <td className="border border-gray-200 px-4 py-2 font-medium text-sm w-1/3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium">TPL Extension Selection</span>
                            <Badge variant="outline" className="text-xs">TPL</Badge>
                          </div>
                        </td>
                        {comparedQuotes.map((quote) => (
                          <td key={`tpl-extension-${quote.id}`} className="border border-gray-200 px-4 py-2 text-center w-1/3">
                            <div className="flex flex-col items-center space-y-1">
                              <div className="text-xs font-medium text-blue-600">
                                {tplAdjustment > 0 ? `+${tplAdjustment}%` : 'Standard'}
                              </div>
                              <div className="text-xs text-muted-foreground">TPL Adjustment</div>
                            </div>
                          </td>
                        ))}
                      </tr>
                      
                      {/* Revised Premium Row */}
                      <tr className="bg-green-50 border-t-2 border-green-200">
                        <td className="border border-gray-200 px-4 py-3 font-semibold text-center text-sm w-1/3">
                          Revised Premium (After Extensions)
                        </td>
                        {comparedQuotes.map((quote) => (
                          <td key={`revised-premium-${quote.id}`} className="border border-gray-200 px-4 py-3 text-center w-1/3">
                            <div className="font-semibold text-green-600">{formatCurrency(getCurrentPremium(quote))}</div>
                          </td>
                        ))}
                      </tr>
                      
                      {/* Select Plan Buttons Row */}
                      <tr className="bg-blue-50 border-t-2 border-blue-200">
                        <td className="border border-gray-200 px-4 py-3 font-semibold text-center w-1/3">
                          
                        </td>
                        {comparedQuotes.map((quote) => (
                          <td key={`action-${quote.id}`} className="border border-gray-200 px-4 py-3 text-center w-1/3">
                            <Button 
                              onClick={() => handleSelectPlanClick(quote.id)}
                              disabled={isSubmittingPlan}
                              className="w-full"
                              size="sm"
                            >
                              {isSubmittingPlan ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                  Selecting...
                                </>
                              ) : (
                                'Select This Plan'
                              )}
                            </Button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* CEW Customization Dialog */}
        <Dialog open={showCEWDialog} onOpenChange={(open) => {
          console.log('Dialog onOpenChange called with:', open);
          setShowCEWDialog(open);
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto z-50">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {selectedQuoteForCEW?.insurerName} - Configure Coverages
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid lg:grid-cols-3 gap-6 mt-6">
              {/* CEW Selection */}
              <div className="lg:col-span-2">
                <CEWSelection 
                  key={`cew-${selectedQuoteForCEW?.id}-${showCEWDialog}`}
                  onSelectionChange={handleCEWSelectionChange}
                  onPremiumChange={handlePremiumChange}
                  onTPLAdjustmentChange={handleTPLAdjustmentChange}
                  onCEWAdjustmentChange={handleCEWAdjustmentChange}
                  onTPLSelectionChange={handleTPLSelectionChange}
                  productConfigBundle={productConfigBundle}
                  isLoadingProductConfig={isLoadingProductConfig}
                  storedSelections={(() => {
                    const stored = selectedQuoteForCEW ? getStoredRequestForInsurer(selectedQuoteForCEW.id)?.completeCEWItems || [] : [];
                    console.log('🔧 Passing storedSelections to CEWSelection:', stored);
                    console.log('🔧 storedSelections length:', stored.length);
                    console.log('🔧 storedSelections selected count:', stored.filter(item => item.isSelected).length);
                    return stored;
                  })()}
                  storedTPLAdjustment={selectedQuoteForCEW ? getStoredRequestForInsurer(selectedQuoteForCEW.id)?.tplAdjustment : undefined}
                  storedCEWAdjustment={selectedQuoteForCEW ? getStoredRequestForInsurer(selectedQuoteForCEW.id)?.cewAdjustment : undefined}
                  storedBrokerCommission={selectedQuoteForCEW ? getStoredRequestForInsurer(selectedQuoteForCEW.id)?.brokerCommissionPercent : undefined}
                />
              </div>

              {/* Premium Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-4 space-y-3 flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
                  {/* Selected Plan Card */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2 px-3 pt-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building className="w-4 h-4 text-primary" />
                        Selected Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0 px-3 pb-3">
                      {selectedQuoteForCEW && (
                        <>
                          <div>
                            <h3 className="font-semibold text-base">{selectedQuoteForCEW.insurerName}</h3>
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-3">
                             <div className="flex justify-between items-center">
                               <span className="text-xs">Base Premium</span>
                               <span className="font-medium text-sm">{formatCurrency(selectedQuoteForCEW.annualPremium)}</span>
                             </div>
                             
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-muted-foreground/60">Coverage Amount</span>
                               <span className="text-sm text-muted-foreground/60">
                                 {(() => {
                                   // Try to get coverage amount from multiple sources
                                   const productConfigCoverage = productConfigBundle?.policy_limits_and_deductible?.policy_limits?.maximum_cover?.value;
                                   const pricingConfigCoverage = insurerPricingConfigs?.[selectedQuoteForCEW?.id]?.policy_limits_and_deductible?.policy_limits?.maximum_cover?.value;
                                   const fallbackCoverage = selectedQuoteForCEW?.coverageAmount;
                                   
                                   console.log('🔍 Coverage Amount Debug:', {
                                     productConfigBundle: productConfigBundle?.policy_limits_and_deductible?.policy_limits?.maximum_cover,
                                     pricingConfig: insurerPricingConfigs?.[selectedQuoteForCEW?.id]?.policy_limits_and_deductible?.policy_limits?.maximum_cover,
                                     selectedQuoteCoverage: selectedQuoteForCEW?.coverageAmount,
                                     finalValue: productConfigCoverage || pricingConfigCoverage || fallbackCoverage
                                   });
                                   
                                   return formatCurrency(productConfigCoverage || pricingConfigCoverage || fallbackCoverage || 0);
                                 })()}
                               </span>
                             </div>
                             
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-muted-foreground/60">Deductibles</span>
                               <span className="text-sm text-muted-foreground/60">{selectedQuoteForCEW.deductible}</span>
                             </div>
                             
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* Selected CEW Items */}
                  {(() => {
                    const selectedItems = selectedCEWItems.filter(item => item.isSelected);
                    console.log('🔧 Selected Extensions check - selectedCEWItems:', selectedCEWItems);
                    console.log('🔧 Selected Extensions check - selectedItems:', selectedItems);
                    console.log('🔧 Selected Extensions check - length:', selectedItems.length);
                    return selectedItems.length > 0;
                  })() && (
                    <Card className="border-border flex-shrink-0 mb-6">
                      <CardHeader className="pb-1 px-2 pt-2">
                        <CardTitle className="text-sm">Selected Extensions</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 px-2 pb-4 max-h-32 overflow-y-auto">
                        <div className="space-y-1">
                          {selectedCEWItems.filter(item => item.isSelected).map(item => {
                            const selectedOption = item.options?.find(opt => opt.id === item.selectedOptionId);
                            const displayValue = selectedOption ? 
                              `${selectedOption.label}: ${selectedOption.type === "percentage" ? `${selectedOption.value > 0 ? "+" : ""}${selectedOption.value}%` : `+AED ${selectedOption.value.toLocaleString()}`}` :
                              `${item.impact.premiumAmount > 0 ? "+" : ""}${item.impact.premiumAmount}%`;
                            
                            return (
                            <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-xs">
                              <div className="flex items-center gap-1">
                                <span className="font-medium truncate">{item.name}</span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0 flex-shrink-0">{item.code}</Badge>
                              </div>
                              <span className="text-[9px] text-muted-foreground flex-shrink-0">
                                  {displayValue}
                              </span>
                            </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Premium Summary */}
                  <Card className="border-border mt-auto">
                    <CardHeader className="pb-2 px-3 pt-3">
                      <CardTitle className="text-base">Premium Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0 px-3 pb-3">
                      <div className="space-y-2">
                         {(tplAdjustment !== 0 || cewAdjustment !== 0) && (
                           <>
                             {tplAdjustment !== 0 && (
                               <>
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm">TPL Limit Adjustments</span>
                                   <span className={`font-medium ${
                                     tplAdjustment > 0 ? "text-warning" : "text-success"
                                   }`}>
                                     {tplAdjustment > 0 ? "+" : ""}{tplAdjustment.toFixed(1)}%
                                   </span>
                                 </div>
                                 
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm">TPL Adjustment Amount</span>
                                   <span className={`font-medium ${
                                     tplAdjustment > 0 ? "text-warning" : "text-success"
                                   }`}>
                                     {tplAdjustment > 0 ? "+" : ""}{(() => {
                                       if (!selectedQuoteForCEW) return formatCurrency(0);
                                       const validationResult = selectedQuoteForCEW.validationResult;
                                       const basePremium = validationResult?.basePremium || selectedQuoteForCEW.annualPremium;
                                       const tplAdjustmentAmount = (basePremium * tplAdjustment) / 100;
                                       return formatCurrency(tplAdjustmentAmount);
                                     })()}
                                   </span>
                                 </div>
                               </>
                             )}
                             
                             {cewAdjustment !== 0 && (
                               <>
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm">CEW Adjustments</span>
                                   <span className={`font-medium ${
                                     cewAdjustment > 0 ? "text-warning" : "text-success"
                                   }`}>
                                     {cewAdjustment > 0 ? "+" : ""}{cewAdjustment.toFixed(1)}%
                                   </span>
                                 </div>
                                 
                                 <div className="flex justify-between items-center">
                                   <span className="text-sm">CEW Adjustment Amount</span>
                                   <span className={`font-medium ${
                                     cewAdjustment > 0 ? "text-warning" : "text-success"
                                   }`}>
                                     {cewAdjustment > 0 ? "+" : ""}{(() => {
                                       if (!selectedQuoteForCEW) return formatCurrency(0);
                                       const validationResult = selectedQuoteForCEW.validationResult;
                                       const basePremium = validationResult?.basePremium || selectedQuoteForCEW.annualPremium;
                                       const cewAdjustmentAmount = (basePremium * cewAdjustment) / 100;
                                       return formatCurrency(cewAdjustmentAmount);
                                     })()}
                                   </span>
                                 </div>
                               </>
                             )}
                           </>
                         )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs">Nett Premium</span>
                          <span className="font-medium text-sm">
                            {(() => {
                              if (!selectedQuoteForCEW) return formatCurrency(0);
                              const validationResult = selectedQuoteForCEW.validationResult;
                              const basePremium = validationResult?.basePremium || selectedQuoteForCEW.annualPremium;
                              const defaultBrokerCommission = productConfigBundle?.policy_limits_and_deductible?.base_broker_commission?.value || 10;
                              // Calculate adjustments
                              const tplAdjustmentAmount = (basePremium * tplAdjustment) / 100;
                              const cewAdjustmentAmount = (basePremium * cewAdjustment) / 100;
                              // Calculate final premium = base premium + adjustments
                              const finalPremium = basePremium + tplAdjustmentAmount + cewAdjustmentAmount;
                              // Calculate nett premium = final premium - (final premium × default broker commission)
                              const nettPremium = finalPremium - (finalPremium * defaultBrokerCommission / 100);
                              return formatCurrency(nettPremium);
                            })()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs">Broker Commission</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{brokerCommissionPercent}%</span>
                              <button
                                className="text-xs font-bold text-primary hover:text-primary/80 cursor-pointer"
                                onClick={() => {
                                  const minCommission = productConfigBundle?.policy_limits_and_deductible?.minimum_broker_commission?.value || 5;
                                  const maxCommission = productConfigBundle?.policy_limits_and_deductible?.maximum_broker_commission?.value || 15;
                                  const newValue = prompt(`Enter broker commission (${minCommission}% - ${maxCommission}%):`, brokerCommissionPercent.toString());
                                  if (newValue && !isNaN(Number(newValue))) {
                                    const value = Math.min(maxCommission, Math.max(minCommission, Number(newValue)));
                                    setBrokerCommissionPercent(value);
                                  }
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                          <span className="font-medium text-muted-foreground">
                            {(() => {
                              if (!selectedQuoteForCEW) return formatCurrency(0);
                              const validationResult = selectedQuoteForCEW.validationResult;
                              const basePremium = validationResult?.basePremium || selectedQuoteForCEW.annualPremium;
                              // Calculate adjustments
                              const tplAdjustmentAmount = (basePremium * tplAdjustment) / 100;
                              const cewAdjustmentAmount = (basePremium * cewAdjustment) / 100;
                              // Calculate final premium = base premium + adjustments
                              const finalPremium = basePremium + tplAdjustmentAmount + cewAdjustmentAmount;
                              // Calculate revised broker commission (based on final premium including adjustments)
                              const revisedBrokerCommission = (finalPremium * brokerCommissionPercent) / 100;
                              return formatCurrency(revisedBrokerCommission);
                            })()}
                          </span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">Total Annual Premium</span>
                          <span className="font-bold text-base text-primary">
                            {formatCurrency(finalPremium)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button 
                          onClick={() => {
                            // Only proceed if validation passes
                            if (validateMandatoryCEWItems()) {
                            handleUpdatePremium();
                            setShowCEWDialog(false);
                            }
                            // If validation fails, just show the error toast (dialog stays open)
                          }}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Update Premium & Compare
                        </Button>
                        <Button 
                          onClick={() => handleSelectPlanClick(selectedQuoteForCEW?.id)}
                          disabled={isSubmittingPlan}
                          className="w-full"
                        >
                          {isSubmittingPlan ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Selecting Plan...
                            </>
                          ) : (
                            'Select Plan'
                          )}
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Extension Confirmation Dialog */}
        <Dialog open={showExtensionConfirmDialog} onOpenChange={setShowExtensionConfirmDialog}>
          <DialogContent className="w-[90vw] max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Default Extensions</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                You're about to select this plan with default extensions. Would you like to customize the extensions first, or proceed with the default selections?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowExtensionConfirmDialog(false);
                    if (pendingQuoteId) {
                      const quote = realQuotes.find(q => q.id === pendingQuoteId);
                      if (quote) {
                        handleExtensionsClick(quote);
                      }
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  Customize Extensions
                </Button>
                <Button 
                  onClick={() => {
                    setShowExtensionConfirmDialog(false);
                    if (pendingQuoteId) {
                      proceedWithSelection(pendingQuoteId);
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  Proceed with Defaults
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Validation Details Dialog */}
        <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Proposal Validation Results & Debug Information</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 mt-6">
              {/* Debug Information */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-blue-800">Debug Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>Current Proposal: {currentProposal ? '✅ Available' : '❌ Missing'}</div>
                    <div>Insurer Pricing Configs: {insurerPricingConfigs ? `✅ ${Object.keys(insurerPricingConfigs).length} configs` : '❌ Missing'}</div>
                    <div>Eligible Insurers: {eligibleInsurers.length} insurers</div>
                    <div>Validation Results: {Object.keys(insurerValidationResults).length} results</div>
                    <div>Validation Completed: {Array.from(validationCompleted.current).join(', ') || 'None'}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Results */}
              {Object.keys(insurerValidationResults).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Proposal Validation Results</h3>
                  {Object.entries(insurerValidationResults).map(([insurerId, result]) => {
                    const insurer = eligibleInsurers.find(i => i.insurer_id === parseInt(insurerId));
                    if (!insurer) return null;

                    return (
                      <Card key={insurerId} className={`border ${
                        result.overallDecision === 'Auto Quote' ? 'border-green-200 bg-green-50' :
                        result.overallDecision === 'Manual Review' ? 'border-yellow-200 bg-yellow-50' :
                        'border-red-200 bg-red-50'
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{insurer.insurer_name}</CardTitle>
                            <Badge variant={
                              result.overallDecision === 'Auto Quote' ? 'default' :
                              result.overallDecision === 'Manual Review' ? 'secondary' : 'destructive'
                            }>
                              {result.overallDecision}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground mb-3">
                              {result.values.length} field validations completed
                            </div>
                            
                            {/* Base Premium Display */}
                            {result.basePremium > 0 && (
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-blue-900">Base Premium</span>
                                  <span className="text-lg font-bold text-blue-900">
                                    AED {result.basePremium.toLocaleString()}
                                  </span>
                                </div>
                                {result.pricingDetails && (
                                  <div className="text-xs text-blue-700 mt-1 space-y-1">
                                    <div>{result.pricingDetails.calculation}</div>
                                    <div className="font-medium">Formula: {result.pricingDetails.percentageProductFormula}</div>
                                    <div className="text-xs text-blue-600">
                                      Base Rate: {result.pricingDetails.baseRate} | 
                                      Factors: {result.pricingDetails.factors.join(', ')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Validation Details Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2 font-medium">Field</th>
                                    <th className="text-left p-2 font-medium">Proposal Value</th>
                                    <th className="text-left p-2 font-medium">Config Range/Match</th>
                                    <th className="text-left p-2 font-medium">Pricing</th>
                                    <th className="text-left p-2 font-medium">Decision</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.values.map((validation, index) => (
                                    <tr key={index} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                      <td className="p-2 font-medium text-xs">
                                        {validation.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </td>
                                      <td className="p-2 text-xs">
                                        {typeof validation.proposal_value === 'object' 
                                          ? JSON.stringify(validation.proposal_value)
                                          : String(validation.proposal_value)
                                        }
                                      </td>
                                      <td className="p-2 text-xs">{validation.config_range}</td>
                                      <td className="p-2 text-xs">
                                        <div>
                                          <div className="font-medium">
                                            {validation.pricing_type}: {validation.pricing_value}
                                            {validation.pricing_type === 'Percentage' ? '%' : ''}
                                          </div>
                                          <div className="text-muted-foreground">
                                            {validation.quote_option.replace(/_/g, ' ')}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <Badge variant={
                                          validation.decision === 'Auto Quote' ? 'default' :
                                          validation.decision === 'Manual Review' ? 'secondary' : 'destructive'
                                        } className="text-xs">
                                          {validation.decision}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* No Validation Results */}
              {Object.keys(insurerValidationResults).length === 0 && (
                <Card className="border-gray-200 bg-gray-50">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No validation results available yet. Please wait for the validation process to complete.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </section>

      {/* Plan Selection Confirmation Dialog */}
      {showPlanConfirmationDialog && (
        <Dialog open={showPlanConfirmationDialog} onOpenChange={setShowPlanConfirmationDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Plan Selection</DialogTitle>
              <DialogDescription>
                Are you sure you want to select this insurance plan? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {pendingPlanSelection && (() => {
              const selectedQuote = realQuotes.find(q => q.id === pendingPlanSelection);
              if (!selectedQuote) return null;
              
              return (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2">Selected Plan Details:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Insurer:</span>
                        <span className="font-medium">{selectedQuote.insurerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coverage Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedQuote.coverageAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Premium:</span>
                        <span className="font-medium text-primary">{formatCurrency(finalPremium)}</span>
                      </div>
                      {selectedCEWItems.filter(item => item.isSelected).length > 0 && (
                        <div className="flex justify-between">
                          <span>Selected Extensions:</span>
                          <span className="font-medium">{selectedCEWItems.filter(item => item.isSelected).length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    By selecting this plan, you agree to proceed to the document submission phase.
                  </div>
                </div>
              );
            })()}
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={cancelPlanSelection}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmPlanSelection}
                className="w-full sm:w-auto"
                disabled={isSubmittingPlan}
              >
                {isSubmittingPlan ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Selecting Plan...
                  </>
                ) : (
                  'Confirm Selection'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export { QuotesComparison };