import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, DollarSign, TrendingUp, Shield, FileText, MapPin, Percent } from "lucide-react";
import BaseRates from "./BaseRates";
import ProjectRiskFactors from "./ProjectRiskFactors";
import ContractorRiskFactors from "./ContractorRiskFactors";
import CoverageOptionsExtensions from "./CoverageOptionsExtensions";
import PolicyLimitsDeductibles from "./PolicyLimitsDeductibles";

import MasterDataTabs from "./MasterDataTabs";

type PricingConfiguratorProps = {
  activePricingTab: string;
  setActivePricingTab: (tab: string) => void;
  activeProjectTypes: any;
  ratingConfig: any;
  activeConstructionTypes: any[];
  activeCountries: any[];
  fetchBaseRatesMasters: () => Promise<void>;
  fetchProjectRiskFactors: () => Promise<void>;
  fetchCoverageOptions: () => Promise<void>;
  fetchPolicyLimits: () => Promise<void>;
  fetchClauseMetadata: () => Promise<void>;
  saveConfiguration: () => void;
  markAsChanged: () => void;
  setRatingConfig: (updater: (prev: any) => any) => void;
  // Base Rates props
  isLoadingBaseRatesMasters: boolean;
  baseRatesMastersError: string | null;
  projectTypesMasters: any[] | null;
  selectedProjectTypes: Set<string>;
  updateSubProjectEntry: (index: number, field: string, value: string | number) => void;
  toggleProjectType: (projectType: string) => void;
  // Project Risk Factors props
  addDurationLoading: () => void;
  updateDurationLoading: (id: any, field: string, value: any) => void;
  removeDurationLoading: (id: any) => void;
  addMaintenancePeriodLoading: () => void;
  updateMaintenancePeriodLoading: (id: any, field: string, value: any) => void;
  removeMaintenancePeriodLoading: (id: any) => void;
  updateProjectRiskFactor: (section: string, key: string, value: any) => void;
  SoilTypeMultiSelect: React.ComponentType<any>;
  isLoadingProjectRiskFactors: boolean;
  isSavingProjectRiskFactors: boolean;
  projectRiskFactorsError: string | null;
  // Contractor Risk Factors props
  addContractorRiskEntry: (category: string) => void;
  updateContractorRiskEntry: (category: string, id: number, field: string, value: any) => void;
  removeContractorRiskEntry: (category: string, id: number) => void;
  isLoadingContractorRiskFactors: boolean;
  isSavingContractorRiskFactors: boolean;
  contractorRiskFactorsError: string | null;
  // Clause Pricing props
  isLoadingClauseMetadata: boolean;
  clauseMetadataError: string | null;
  clauseMetadata: any[];
  isLoadingClausePricing: boolean;
  clausePricingError: string | null;
  clausePricingData: any;
  isSavingClausePricing: boolean;
  handleSaveClausePricing: () => void;
  // Coverage Options props
  addCoverRequirementEntry: (category: string) => void;
  updateCoverRequirementEntry: (category: string, id: number, field: string, value: any) => void;
  removeCoverRequirementEntry: (category: string, id: number) => void;
  updateCoverRequirement: (category: string, key: string, value: number) => void;
  isLoadingCoverageOptions: boolean;
  isSavingCoverageOptions: boolean;
  coverageOptionsError: string | null;
  coverageOptionsData: any;
  // Policy Limits props
  updateLimits: (key: string, value: number) => void;
  isLoadingPolicyLimits: boolean;
  isSavingPolicyLimits: boolean;
  policyLimitsError: string | null;
  policyLimitsData: any;
  handleSavePolicyLimits: () => Promise<void>;
  // Base Rates save handler
  handleSaveBaseRates: () => Promise<void>;
  isSavingBaseRates: boolean;
  handleSaveProjectRiskFactors: () => Promise<void>;
  // Master Data props
  constructionTypesData: any[];
  isLoadingConstructionTypes: boolean;
  constructionTypesError: string | null;
  roleTypesData: any[];
  isLoadingRoleTypes: boolean;
  roleTypesError: string | null;
  contractTypesData: any[];
  isLoadingContractTypes: boolean;
  contractTypesError: string | null;
  soilTypesData: any[];
  isLoadingSoilTypes: boolean;
  soilTypesError: string | null;
  subcontractorTypesData: any[];
  isLoadingSubcontractorTypes: boolean;
  subcontractorTypesError: string | null;
  consultantRolesData: any[];
  isLoadingConsultantRoles: boolean;
  consultantRolesError: string | null;
  securityTypesData: any[];
  isLoadingSecurityTypes: boolean;
  securityTypesError: string | null;
  areaTypesData: any[];
  isLoadingAreaTypes: boolean;
  areaTypesError: string | null;
  countriesData: string[];
  isLoadingCountries: boolean;
  countriesError: string | null;
  regionsData: string[];
  isLoadingRegions: boolean;
  regionsError: string | null;
  zonesData: string[];
  isLoadingZones: boolean;
  zonesError: string | null;
};

const PricingConfigurator: React.FC<PricingConfiguratorProps> = ({
  activePricingTab,
  setActivePricingTab,
  activeProjectTypes,
  ratingConfig,
  activeConstructionTypes,
  activeCountries,
  fetchBaseRatesMasters,
  fetchProjectRiskFactors,
  fetchCoverageOptions,
  fetchPolicyLimits,
  fetchClauseMetadata,
  saveConfiguration,
  markAsChanged,
  setRatingConfig,
  isLoadingBaseRatesMasters,
  baseRatesMastersError,
  projectTypesMasters,
  selectedProjectTypes,
  updateSubProjectEntry,
  toggleProjectType,
  addDurationLoading,
  updateDurationLoading,
  removeDurationLoading,
  addMaintenancePeriodLoading,
  updateMaintenancePeriodLoading,
  removeMaintenancePeriodLoading,
  updateProjectRiskFactor,
  SoilTypeMultiSelect,
  isLoadingProjectRiskFactors,
  isSavingProjectRiskFactors,
  projectRiskFactorsError,
  addContractorRiskEntry,
  updateContractorRiskEntry,
  removeContractorRiskEntry,
  isLoadingContractorRiskFactors,
  isSavingContractorRiskFactors,
  contractorRiskFactorsError,
  isLoadingClauseMetadata,
  clauseMetadataError,
  clauseMetadata,
  isLoadingClausePricing,
  clausePricingError,
  clausePricingData,
  isSavingClausePricing,
  handleSaveClausePricing,
  addCoverRequirementEntry,
  updateCoverRequirementEntry,
  removeCoverRequirementEntry,
  updateCoverRequirement,
  isLoadingCoverageOptions,
  isSavingCoverageOptions,
  coverageOptionsError,
  coverageOptionsData,
  updateLimits,
  isLoadingPolicyLimits,
  isSavingPolicyLimits,
  policyLimitsError,
  policyLimitsData,
  handleSavePolicyLimits,
  handleSaveBaseRates,
  isSavingBaseRates,
  handleSaveProjectRiskFactors,
  // Master Data props
  constructionTypesData,
  isLoadingConstructionTypes,
  constructionTypesError,
  roleTypesData,
  isLoadingRoleTypes,
  roleTypesError,
  contractTypesData,
  isLoadingContractTypes,
  contractTypesError,
  soilTypesData,
  isLoadingSoilTypes,
  soilTypesError,
  subcontractorTypesData,
  isLoadingSubcontractorTypes,
  subcontractorTypesError,
  consultantRolesData,
  isLoadingConsultantRoles,
  consultantRolesError,
  securityTypesData,
  isLoadingSecurityTypes,
  securityTypesError,
  areaTypesData,
  isLoadingAreaTypes,
  areaTypesError,
  countriesData,
  isLoadingCountries,
  countriesError,
  regionsData,
  isLoadingRegions,
  regionsError,
  zonesData,
  isLoadingZones,
  zonesError,
}) => {
  return (
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
                    } else if (section.id === 'coverage-options') {
                      await fetchCoverageOptions();
                    } else if (section.id === 'limits-deductibles') {
                      await fetchPolicyLimits();
                    } else if (section.id === 'clause-pricing') {
                      await fetchClauseMetadata();
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
                selectedProjectTypes={Array.isArray(selectedProjectTypes) ? new Set(selectedProjectTypes) : (selectedProjectTypes as Set<string>)}
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
                isSaving={isSavingProjectRiskFactors}
                error={projectRiskFactorsError}
              />
            )}

            {activePricingTab === "contractor-risk" && (
              <ContractorRiskFactors
                ratingConfig={ratingConfig}
                onSave={saveConfiguration}
                addContractorRiskEntry={addContractorRiskEntry}
                updateContractorRiskEntry={updateContractorRiskEntry}
                removeContractorRiskEntry={removeContractorRiskEntry}
                isLoading={isLoadingContractorRiskFactors}
                isSaving={isSavingContractorRiskFactors}
                error={contractorRiskFactorsError}
              />
            )}

            {activePricingTab === "coverage-options" && (
              <CoverageOptionsExtensions
                ratingConfig={ratingConfig}
                onSave={saveConfiguration}
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
                />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingConfigurator;
