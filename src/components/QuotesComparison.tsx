import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building, ArrowLeft, Download, Eye, FileText, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { CEWSelection } from "./CEWSelection";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { type BrokerInsurersResponse } from "@/lib/api/brokers";
import { type ProposalBundleResponse, type InsurerPricingConfigResponse } from "@/lib/api/quotes";

interface QuotesComparisonProps {
  assignedInsurers?: BrokerInsurersResponse | null;
  currentProposal?: ProposalBundleResponse | null;
  isLoadingProposal?: boolean;
  insurerPricingConfigs?: Record<number, InsurerPricingConfigResponse>;
  isLoadingPricingConfigs?: boolean;
  onLoadPricingConfigs?: (eligibleInsurers: any[]) => Promise<boolean>;
}

const allQuotes = [
  // Al Buhaira Insurance - Best plan only
  {
    id: 1,
    planName: "Premium Construction Plan",
    insurerName: "Al Buhaira Insurance",
    annualPremium: 24850,
    coverageAmount: 2000000,
    rating: 4.8,
    deductible: formatCurrency(25000),
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
    ]
  },
  // Union Insurance
  {
    id: 3,
    planName: "Comprehensive Builder Plan",
    insurerName: "Union Insurance",
    annualPremium: 26200,
    coverageAmount: 2500000,
    rating: 4.7,
    deductible: formatCurrency(25000),
    isRecommended: false,
    keyCoverage: [
      "Contract Works Insurance",
      "Third Party Liability",
      "Professional Indemnity",
      "Advanced Loss of Profits"
    ],
    benefits: [
      "Premium financing available",
      "Construction risk consulting",
      "24/7 emergency hotline",
      "Mobile claims app"
    ]
  },
  // AWNIC
  {
    id: 4,
    planName: "National Builder Protection",
    insurerName: "Al Wathba National Insurance Co. (AWNIC)",
    annualPremium: 22750,
    coverageAmount: 2000000,
    rating: 4.6,
    deductible: formatCurrency(30000),
    isRecommended: false,
    keyCoverage: [
      "Contract Works Insurance",
      "Third Party Liability",
      "Professional Indemnity",
      "Public Liability"
    ],
    benefits: [
      "Local claims network",
      "Arabic language support",
      "Government project expertise",
      "Quick approval process"
    ]
  },
  // Sukoon Insurance
  {
    id: 5,
    planName: "Sukoon Complete Coverage",
    insurerName: "Sukoon Insurance",
    annualPremium: 25100,
    coverageAmount: 2200000,
    rating: 4.7,
    deductible: formatCurrency(25000),
    isRecommended: false,
    keyCoverage: [
      "Contract Works Insurance",
      "Third Party Liability",
      "Professional Indemnity",
      "Terrorism Coverage"
    ],
    benefits: [
      "Flexible payment terms",
      "Risk management workshops",
      "Dedicated account manager",
      "Priority claims processing"
    ]
  }
];

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
  const calculateBasePremium = (validationResults: any[], proposal: any) => {
    console.log('💰 Starting base premium calculation with validation results:', validationResults);
    
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
      field.pricing_type.toLowerCase().includes('percentage') || 
      field.pricing_type.toLowerCase().includes('percent')
    );
    
    const fixedAmountFields = pricingFields.filter(field => 
      field.pricing_type.toLowerCase().includes('fixed') || 
      field.pricing_type.toLowerCase().includes('amount')
    );
    
    console.log('💰 Percentage fields:', percentageFields);
    console.log('💰 Fixed amount fields:', fixedAmountFields);
    
    // Calculate factors rate (additive: (1 + rate1) × (1 + rate2) × ... × (1 + raten))
    let factorsRate = 1;
    if (percentageFields.length > 0) {
      factorsRate = percentageFields.reduce((acc, field) => {
        const rate = field.pricing_value / 100; // Convert percentage to decimal
        return acc * (1 + rate);
      }, 1);
    }
    
    // Calculate factors sum (add fixed amounts)
    const factorsSum = fixedAmountFields.reduce((acc, field) => acc + field.pricing_value, 0);
    
    // Get sum insured value
    const sumInsured = proposal.cover_requirements?.sum_insured || 0;
    
    // Calculate base premium: (sum_insured * factors_rate) + factors_sum
    const basePremium = (sumInsured * factorsRate) + factorsSum;
    
    return {
      basePremium: Math.round(basePremium * 100) / 100, // Round to 2 decimal places
      factorsRate,
      factorsSum,
      sumInsured,
      details: {
        percentageFields,
        fixedAmountFields,
        calculation: `(${sumInsured} × ${factorsRate}) + ${factorsSum} = ${basePremium}`,
        factorsRateFormula: `(1 + rate1) × (1 + rate2) × ... × (1 + raten) = ${factorsRate}`
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

    // 2. Construction/Area/Soil/Contract/Role Validation
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
        { field: 'role_of_insured', config: 'role_types_config', proposal: proposal.insured?.details?.role_of_insured }
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
          const configValue = normalizeString(item.name || item.type);
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
              item.name || item.type,
              item.name || item.type,
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
              const soilTypes = riskValue.toLowerCase().split(', ');
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
    
    if (overallDecision === 'Auto Quote') {
      const pricingResult = calculateBasePremium(validationResults, proposal);
      basePremium = pricingResult.basePremium;
      pricingDetails = pricingResult.details;
      
      console.log(`💰 Pricing calculated for insurer ${insurerId}:`, {
        basePremium,
        factorsRate: pricingResult.factorsRate,
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
    const selectedData = allQuotes.filter(q => selectedQuotes.includes(q.id));
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

  const handleExtensionsClick = (quote: any) => {
    console.log('Extensions button clicked for quote:', quote);
    setSelectedQuoteForCEW(quote);
    
    // Load existing CEW selections and premium if available
    const existingData = updatedQuotes[quote.id];
    if (existingData) {
      setPremiumAdjustment(((existingData.premium - quote.annualPremium) / quote.annualPremium) * 100);
      setSelectedCEWItems(existingData.cewItems);
    } else {
      setPremiumAdjustment(0);
      setSelectedCEWItems([]);
    }
    
    setShowCEWDialog(true);
  };


  const handleCEWSelectionChange = (selectedItems: any[]) => {
    setSelectedCEWItems(selectedItems);
  };

  const handlePremiumChange = (adjustment: number) => {
    setPremiumAdjustment(adjustment);
  };

  const handleTPLAdjustmentChange = (adjustment: number) => {
    setTPLAdjustment(adjustment);
  };

  const handleCEWAdjustmentChange = (adjustment: number) => {
    setCEWAdjustment(adjustment);
  };

  const calculateFinalPremium = () => {
    if (!selectedQuoteForCEW) return 0;
    const netPremium = 22365; // Fixed net premium
    const defaultCommissionRate = 10; // Default commission rate
    const basePremium = netPremium + (netPremium * defaultCommissionRate) / 100; // Base = Net + Default Commission
    
    const currentBrokerCommissionAmount = (netPremium * brokerCommissionPercent) / 100;
    const adjustmentAmount = (basePremium * premiumAdjustment) / 100;
    
    return netPremium + currentBrokerCommissionAmount + adjustmentAmount;
  };

  const handleUpdatePremium = () => {
    if (!selectedQuoteForCEW) return;
    
    const finalPremium = calculateFinalPremium();
    
    // Update the quotes data with new premium and CEW selections
    setUpdatedQuotes(prev => ({
      ...prev,
      [selectedQuoteForCEW.id]: {
        premium: finalPremium,
        cewItems: selectedCEWItems.filter(item => item.isSelected),
        isUpdated: true
      }
    }));
    
    toast({
      title: "Premium Updated",
      description: `New annual premium: ${formatCurrency(finalPremium)}`,
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
        finalPremium: calculateFinalPremium()
      } 
    });
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

    const selectedQuoteData = allQuotes.filter(q => selectedQuotes.includes(q.id));
    
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

    const selectedQuoteData = allQuotes.filter(q => selectedQuotes.includes(q.id));
    
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

  const comparedQuotes = allQuotes.filter(q => selectedQuotes.includes(q.id));
  
  // Helper function to get current premium for a quote (updated or original)
  const getCurrentPremium = (quote: any) => {
    const updatedData = updatedQuotes[quote.id];
    return updatedData ? updatedData.premium : quote.annualPremium;
  };
  
  // Helper function to get CEW items for a quote
  const getCEWItems = (quoteId: number) => {
    const updatedData = updatedQuotes[quoteId];
    return updatedData ? updatedData.cewItems : [];
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
          {selectedQuotes.length > 0 && (
            <div className="flex gap-4">
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
            </div>
          )}
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

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Debug Information</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>Current Proposal: {currentProposal ? '✅ Available' : '❌ Missing'}</div>
            <div>Insurer Pricing Configs: {insurerPricingConfigs ? `✅ ${Object.keys(insurerPricingConfigs).length} configs` : '❌ Missing'}</div>
            <div>Eligible Insurers: {eligibleInsurers.length} insurers</div>
            <div>Validation Results: {Object.keys(insurerValidationResults).length} results</div>
            <div>Validation Completed: {Array.from(validationCompleted.current).join(', ') || 'None'}</div>
          </div>
        </div>

        {/* Validation Results Display */}
        {Object.keys(insurerValidationResults).length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Proposal Validation Results</h3>
            {Object.entries(insurerValidationResults).map(([insurerId, result]) => {
              const insurer = eligibleInsurers.find(i => i.insurer_id === parseInt(insurerId));
              if (!insurer) return null;

              // Only show Auto Quote insurers
              if (result.overallDecision !== 'Auto Quote') return null;

              return (
                <Card key={insurerId} className="border border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{insurer.insurer_name}</CardTitle>
                      <Badge variant="default">
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
                            <div className="text-xs text-blue-700 mt-1">
                              {result.pricingDetails.calculation}
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

          <div className="space-y-4">
          {allQuotes.map((quote) => {
            const isUpdated = updatedQuotes[quote.id]?.isUpdated;
            const currentPremium = getCurrentPremium(quote);
            
            return (
            <Card 
              key={quote.id} 
              className={`border transition-all duration-200 ${
                isUpdated 
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
                      <h3 className="font-semibold text-lg">{quote.insurerName}</h3>
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
                                        This extension provides additional coverage for {item.name.toLowerCase()} as per the policy terms and conditions. The coverage includes all standard exclusions and limitations as outlined in the main policy document.
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
                              onClick={() => handleSelectPlan(quote.id)}
                              className="w-full"
                              size="sm"
                            >
                              Select This Plan
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
                {selectedQuoteForCEW?.insurerName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid lg:grid-cols-3 gap-6 mt-6">
              {/* CEW Selection */}
              <div className="lg:col-span-2">
                <CEWSelection 
                  onSelectionChange={handleCEWSelectionChange}
                  onPremiumChange={handlePremiumChange}
                  onTPLAdjustmentChange={handleTPLAdjustmentChange}
                  onCEWAdjustmentChange={handleCEWAdjustmentChange}
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
                               <span className="text-sm text-muted-foreground/60">{formatCurrency(selectedQuoteForCEW.coverageAmount)}</span>
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
                  {selectedCEWItems.filter(item => item.isSelected).length > 0 && (
                    <Card className="border-border flex-shrink-0 mb-6">
                      <CardHeader className="pb-1 px-2 pt-2">
                        <CardTitle className="text-sm">Selected Extensions</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 px-2 pb-4 max-h-32 overflow-y-auto">
                        <div className="space-y-1">
                          {selectedCEWItems.filter(item => item.isSelected).map(item => (
                            <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-xs">
                              <div className="flex items-center gap-1">
                                <span className="font-medium truncate">{item.name}</span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0 flex-shrink-0">{item.code}</Badge>
                              </div>
                              <span className="text-[9px] text-muted-foreground flex-shrink-0">
                                {item.impact.premiumAmount > 0 ? "+" : ""}{item.impact.premiumAmount}%
                              </span>
                            </div>
                          ))}
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
                         <div className="flex justify-between items-center">
                           <span className="text-xs">Nett Premium</span>
                           <span className="font-medium text-sm">
                             {formatCurrency(22365)}
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
                                  const newValue = prompt(`Enter broker commission (${5}% - ${15}%):`, brokerCommissionPercent.toString());
                                  if (newValue && !isNaN(Number(newValue))) {
                                    const value = Math.min(15, Math.max(5, Number(newValue)));
                                    setBrokerCommissionPercent(value);
                                  }
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                          <span className="font-medium text-muted-foreground">
                            {formatCurrency((22365 * brokerCommissionPercent) / 100)}
                          </span>
                        </div>
                        
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
                                     {tplAdjustment > 0 ? "+" : ""}{formatCurrency((24601.5 * tplAdjustment) / 100)}
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
                                     {cewAdjustment > 0 ? "+" : ""}{formatCurrency((24601.5 * cewAdjustment) / 100)}
                                   </span>
                                 </div>
                               </>
                             )}
                           </>
                         )}
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm">Total Annual Premium</span>
                          <span className="font-bold text-base text-primary">
                            {formatCurrency(calculateFinalPremium())}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button 
                          onClick={() => {
                            handleUpdatePremium();
                            setShowCEWDialog(false);
                          }}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Update Premium & Compare
                        </Button>
                        <Button 
                          onClick={() => {
                            setShowCEWDialog(false);
                            // Check if we're in the proposal form context
                            if (window.onQuoteSelected) {
                              // We're in the proposal form, navigate to declaration step
                              window.onQuoteSelected(selectedQuoteForCEW?.id);
                            } else {
                              // We're in standalone quotes page, navigate to declaration page
                              navigate('/customer/declaration', { state: { selectedQuote: selectedQuoteForCEW?.id } });
                            }
                          }}
                          className="w-full"
                        >
                          Select Plan
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
                      const quote = allQuotes.find(q => q.id === pendingQuoteId);
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
        </div>
      </section>
    </>
  );
};

export { QuotesComparison };