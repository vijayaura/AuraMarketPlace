import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import TableSkeleton from "@/components/loaders/TableSkeleton";

type MasterDataTabsProps = {
  activePricingTab: string;
  activeConstructionTypes: any[];
  activeCountries: any[];
  ratingConfig: any;
  onSave: () => void;
  markAsChanged: () => void;
  setRatingConfig: (updater: (prev: any) => any) => void;
  isLoadingClauseMetadata: boolean;
  clauseMetadataError: string | null;
  clauseMetadata: any[];
  isLoadingClausePricing: boolean;
  clausePricingError: string | null;
  clausePricingData: any;
  isSavingClausePricing: boolean;
  handleSaveClausePricing: () => void;
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
  // Quote Config Location Data props
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

const MasterDataTabs: React.FC<MasterDataTabsProps> = ({
  activePricingTab,
  activeConstructionTypes,
  activeCountries,
  ratingConfig,
  onSave,
  markAsChanged,
  setRatingConfig,
  isLoadingClauseMetadata,
  clauseMetadataError,
  clauseMetadata,
  isLoadingClausePricing,
  clausePricingError,
  clausePricingData,
  isSavingClausePricing,
  handleSaveClausePricing,
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
  // Quote Config Location Data props
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
  if (activePricingTab === "clause-pricing") {
    const [expandedClauses, setExpandedClauses] = useState<Set<number>>(new Set());
    const [clauseRows, setClauseRows] = useState<{[key: number]: any[]}>({});
    const [activeToggles, setActiveToggles] = useState<{[key: number]: boolean}>({});

    const toggleClause = (clauseId: number) => {
      const newExpanded = new Set(expandedClauses);
      if (newExpanded.has(clauseId)) {
        newExpanded.delete(clauseId);
      } else {
        newExpanded.add(clauseId);
        // Initialize with one default row if not exists
        if (!clauseRows[clauseId]) {
          setClauseRows(prev => ({
            ...prev,
            [clauseId]: [{ id: 1, label: "Standard Rate", limits: "All Coverage", type: "percentage", value: 2 }]
          }));
        }
      }
      setExpandedClauses(newExpanded);
    };

    const addRow = (clauseId: number) => {
      const currentRows = clauseRows[clauseId] || [];
      const newRow = {
        id: Date.now(),
        label: "",
        limits: "",
        type: "percentage",
        value: 0
      };
      setClauseRows(prev => ({
        ...prev,
        [clauseId]: [...currentRows, newRow]
      }));
    };

    const removeRow = (clauseId: number, rowId: number) => {
      setClauseRows(prev => ({
        ...prev,
        [clauseId]: prev[clauseId]?.filter(row => row.id !== rowId) || []
      }));
    };

    const getRowCount = (clauseId: number) => {
      return clauseRows[clauseId]?.length || 1;
    };

    const handleToggleChange = (clauseId: number, checked: boolean) => {
      setActiveToggles(prev => ({
        ...prev,
        [clauseId]: checked
      }));
    };

    const isClauseActive = (clause: any) => {
      // Use state if available, otherwise fall back to API data
      return activeToggles[clause.id] !== undefined 
        ? activeToggles[clause.id] 
        : clause.is_active === 1;
    };

    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clause Pricing Configuration</CardTitle>
              <CardDescription>Configure pricing for specific policy clauses</CardDescription>
            </div>
            <Button onClick={handleSaveClausePricing} size="sm" disabled={isLoadingClauseMetadata || isLoadingClausePricing || isSavingClausePricing}>
              {isLoadingClauseMetadata || isLoadingClausePricing || isSavingClausePricing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              {isLoadingClauseMetadata || isLoadingClausePricing ? 'Loading...' : isSavingClausePricing ? 'Saving...' : 'Save Clause Pricing'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(clauseMetadataError || clausePricingError) && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{clauseMetadataError || clausePricingError}</span>
            </div>
          )}

          {isLoadingClauseMetadata || isLoadingClausePricing ? (
            <div className="space-y-4">
              <TableSkeleton />
              <TableSkeleton />
              <TableSkeleton />
            </div>
          ) : (
            <div className="space-y-4">
              {clauseMetadata && clauseMetadata.length > 0 ? (
                clauseMetadata.map((clause: any) => {
                  const rowCount = getRowCount(clause.id);
                  const currentRows = clauseRows[clause.id] || [{ id: 1, label: "Standard Rate", limits: "All Coverage", type: "percentage", value: 2 }];
                  const isActive = isClauseActive(clause);
                  
                  return (
                    <Card key={clause.id} className={`border border-border transition-all duration-200 ${
                      isActive ? 'bg-card' : 'bg-muted/50 opacity-60'
                    }`}>
                      {/* Parent Clause Card */}
                      <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={
                                  clause.clause_type === 'CLAUSE' ? "default" : 
                                  clause.clause_type === 'EXCLUSION' ? "destructive" : 
                                  "secondary"
                                } 
                                className="text-xs"
                              >
                                {clause.clause_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{clause.clause_code}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base font-semibold">{clause.title}</CardTitle>
                              <Badge variant={clause.show_type === 'MANDATORY' ? "default" : "outline"} className="text-xs">
                                {clause.show_type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Select defaultValue="percentage" disabled={!isActive}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="fixed">AED</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Input 
                            type="number" 
                            defaultValue={clause.pricing_value || "2.5"} 
                            className="w-24 text-center"
                            placeholder="0.00"
                            disabled={!isActive}
                          />
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => addRow(clause.id)}
                            disabled={!isActive}
                          >
                            Add Row
                          </Button>
                          
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id={`clause-${clause.id}`} 
                              checked={isActive}
                              onCheckedChange={(checked) => handleToggleChange(clause.id, checked)}
                            />
                            <Label htmlFor={`clause-${clause.id}`} className="text-xs text-muted-foreground">
                              {isActive ? 'Active' : 'Inactive'}
                            </Label>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleClause(clause.id)}
                            className="p-1 h-8 w-8"
                            disabled={!isActive}
                          >
                            {expandedClauses.has(clause.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>

                      {/* Expanded Child Rows */}
                      {expandedClauses.has(clause.id) && isActive && (
                        <CardContent className="p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-1/4">Label</TableHead>
                                <TableHead className="w-1/3">Limits</TableHead>
                                <TableHead className="w-1/6">Type</TableHead>
                                <TableHead className="w-1/6">Value</TableHead>
                                <TableHead className="w-20">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentRows.map((row: any) => (
                                <TableRow key={row.id}>
                                  <TableCell>
                                    <Input 
                                      defaultValue={row.label} 
                                      className="w-full"
                                      placeholder="Label"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      defaultValue={row.limits} 
                                      className="w-full"
                                      placeholder="Limits"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select defaultValue={row.type}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="percentage">%</SelectItem>
                                        <SelectItem value="fixed">AED</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input 
                                      type="number" 
                                      defaultValue={row.value} 
                                      className="w-full text-center"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => removeRow(clause.id, row.id)}
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
                      )}
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No clause metadata available</p>
                  <p className="text-sm mt-2">Click on the tab to load clause data</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }





  if (activePricingTab === "fee-types") {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Fee Types</CardTitle>
              <CardDescription>Configure fees and taxes applicable to quotes (VAT, GST, etc.)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => {
                const newId = Math.max(...ratingConfig.feeTypes.map((f: any) => f.id), 0) + 1;
                setRatingConfig((prev: any) => ({
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
              <Button onClick={onSave} size="sm">
                <Save className="w-4 h-4 mr-1" />
                Save Fee Types
              </Button>
            </div>
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
              {ratingConfig.feeTypes.map((fee: any) => (
                <TableRow key={fee.id}>
                  <TableCell>
                    <Input
                      value={fee.label}
                      onChange={(e) => {
                        setRatingConfig((prev: any) => ({
                          ...prev,
                          feeTypes: prev.feeTypes.map((f: any) =>
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
                        setRatingConfig((prev: any) => ({
                          ...prev,
                          feeTypes: prev.feeTypes.map((f: any) =>
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
                          setRatingConfig((prev: any) => ({
                            ...prev,
                            feeTypes: prev.feeTypes.map((f: any) =>
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
                        setRatingConfig((prev: any) => ({
                          ...prev,
                          feeTypes: prev.feeTypes.map((f: any) =>
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
                        setRatingConfig((prev: any) => ({
                          ...prev,
                          feeTypes: prev.feeTypes.filter((f: any) => f.id !== fee.id)
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
    );
  }

  // Generic master data table for other tabs
  const getMasterDataConfig = () => {
    switch (activePricingTab) {
      case "construction-types":
        return { 
          title: "Construction Types", 
          description: "Configure pricing for different construction types", 
          data: constructionTypesData.map(item => item.label),
          isLoading: isLoadingConstructionTypes,
          error: constructionTypesError
        };
      case "role-types":
        return { 
          title: "Role Types", 
          description: "Configure pricing for different role types", 
          data: roleTypesData.map(item => item.label),
          isLoading: isLoadingRoleTypes,
          error: roleTypesError
        };
      case "contract-types":
        return { 
          title: "Contract Types", 
          description: "Configure pricing for different contract types", 
          data: contractTypesData.map(item => item.label),
          isLoading: isLoadingContractTypes,
          error: contractTypesError
        };
      case "soil-types":
        return { 
          title: "Soil Types", 
          description: "Configure pricing for different soil types", 
          data: soilTypesData.map(item => item.label),
          isLoading: isLoadingSoilTypes,
          error: soilTypesError
        };
      case "subcontractor-types":
        return { 
          title: "Subcontractor Types", 
          description: "Configure pricing for different subcontractor types", 
          data: subcontractorTypesData.map(item => item.label),
          isLoading: isLoadingSubcontractorTypes,
          error: subcontractorTypesError
        };
      case "consultant-roles":
        return { 
          title: "Consultant Roles", 
          description: "Configure pricing for different consultant roles", 
          data: consultantRolesData.map(item => item.label),
          isLoading: isLoadingConsultantRoles,
          error: consultantRolesError
        };
      case "security-types":
        return { 
          title: "Security Types", 
          description: "Configure pricing for different security types", 
          data: securityTypesData.map(item => item.label),
          isLoading: isLoadingSecurityTypes,
          error: securityTypesError
        };
      case "area-types":
        return { 
          title: "Area Types", 
          description: "Configure pricing for different area types", 
          data: areaTypesData.map(item => item.label),
          isLoading: isLoadingAreaTypes,
          error: areaTypesError
        };
      case "countries":
        return { 
          title: "Countries", 
          description: "Configure pricing for different countries", 
          data: countriesData,
          isLoading: isLoadingCountries,
          error: countriesError
        };
      case "regions":
        return { 
          title: "Regions", 
          description: "Configure pricing for different regions", 
          data: regionsData,
          isLoading: isLoadingRegions,
          error: regionsError
        };
      case "zones":
        return { 
          title: "Zones", 
          description: "Configure pricing for different zones", 
          data: zonesData,
          isLoading: isLoadingZones,
          error: zonesError
        };
      default:
        return null;
    }
  };

  const config = getMasterDataConfig();
  if (!config) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <Button onClick={onSave} size="sm" disabled={config.isLoading}>
            <Save className="w-4 h-4 mr-1" />
            {config.isLoading ? 'Loading...' : 'Save'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {config.error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{config.error}</span>
          </div>
        )}

        {config.isLoading ? (
          <div className="space-y-4">
            <TableSkeleton />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{config.title.slice(0, -1)}</TableHead>
                <TableHead>Pricing Type</TableHead>
                <TableHead>Loading/Discount</TableHead>
                <TableHead>Quote Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No {config.title.toLowerCase()} available
                  </TableCell>
                </TableRow>
              ) : (
                config.data.map((item: string, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item}</TableCell>
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
                      <Input type="number" defaultValue="0" className="w-24" />
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
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default MasterDataTabs;

