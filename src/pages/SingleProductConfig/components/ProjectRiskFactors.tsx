import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

type SoilTypeMultiSelectProps = { defaultValues: any[]; onValueChange?: (vals: any[]) => void };

type ProjectRiskFactorsProps = {
  ratingConfig: any;
  onSave: () => void;
  addDurationLoading: () => void;
  updateDurationLoading: (id: any, field: string, value: any) => void;
  removeDurationLoading: (id: any) => void;
  addMaintenancePeriodLoading: () => void;
  updateMaintenancePeriodLoading: (id: any, field: string, value: any) => void;
  removeMaintenancePeriodLoading: (id: any) => void;
  updateProjectRiskFactor: (section: string, key: string, value: any) => void;
  SoilTypeMultiSelect: React.ComponentType<SoilTypeMultiSelectProps>;
  isLoading?: boolean;
  error?: string | null;
  isSaving?: boolean;
};

const ProjectRiskFactors: React.FC<ProjectRiskFactorsProps> = ({
  ratingConfig,
  onSave,
  addDurationLoading,
  updateDurationLoading,
  removeDurationLoading,
  addMaintenancePeriodLoading,
  updateMaintenancePeriodLoading,
  removeMaintenancePeriodLoading,
  updateProjectRiskFactor,
  SoilTypeMultiSelect,
  isLoading = false,
  error = null,
  isSaving = false,
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Risk Factors</CardTitle>
            <CardDescription>Configure risk adjustments based on project characteristics</CardDescription>
          </div>
          <Button onClick={onSave} size="sm" disabled={isSaving}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            {isSaving ? 'Saving...' : 'Save Project Risk Factors'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading && (
          <div className="space-y-6">
            {/* Project Duration Loadings Skeleton */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="w-64 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="w-80 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-4">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="h-10 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Maintenance Period Loadings Skeleton */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="w-72 h-5 bg-gray-200 rounded animate-pulse" />
                    <div className="w-84 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-6 gap-4">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="h-10 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Location Hazard Loadings Skeleton */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <div className="w-64 h-5 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="grid grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className="h-8 bg-gray-200 rounded animate-pulse" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="w-40 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="grid grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} className="h-10 bg-gray-200 rounded animate-pulse" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {!isLoading && error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 mb-4">
            {error}
          </div>
        )}
        {!isLoading && !error && (
        <div className="space-y-6">
          {/* Project Duration Loadings/Discounts */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Project Duration Loadings/Discounts</CardTitle>
                <p className="text-xs text-muted-foreground">Configure pricing based on project duration ranges</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={addDurationLoading}>
                  Add Row
                </Button>
              </div>
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
                  {ratingConfig.projectRisk.durationLoadings.map((duration: any) => (
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
                        <Select value={duration.pricingType} onValueChange={(value) => updateDurationLoading(duration.id, 'pricingType', value)}>
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
                        <Select value={duration.quoteOption} onValueChange={(value) => updateDurationLoading(duration.id, 'quoteOption', value)}>
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
                        <Button variant="ghost" size="sm" onClick={() => removeDurationLoading(duration.id)} className="text-destructive hover:text-destructive">
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

          {/* Maintenance Period Loadings/Discounts */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Maintenance Period Loadings/Discounts</CardTitle>
                <p className="text-xs text-muted-foreground">Configure pricing based on maintenance period ranges</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={addMaintenancePeriodLoading}>
                  Add Row
                </Button>
              </div>
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
                  {ratingConfig.projectRisk.maintenancePeriodLoadings.map((maintenance: any) => (
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
                        <Select value={maintenance.pricingType} onValueChange={(value) => updateMaintenancePeriodLoading(maintenance.id, 'pricingType', value)}>
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
                        <Select value={maintenance.quoteOption} onValueChange={(value) => updateMaintenancePeriodLoading(maintenance.id, 'quoteOption', value)}>
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
                        <Button variant="ghost" size="sm" onClick={() => removeMaintenancePeriodLoading(maintenance.id)} className="text-destructive hover:text-destructive">
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

          {/* Location Hazard Loadings/Discounts */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Location Hazard Loadings/Discounts</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Risk Definition */}
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
                        <SoilTypeMultiSelect defaultValues={[]} />
                      </TableCell>
                      <TableCell>
                        <SoilTypeMultiSelect defaultValues={[]} />
                      </TableCell>
                      <TableCell>
                        <SoilTypeMultiSelect defaultValues={[]} />
                      </TableCell>
                      <TableCell>
                        <SoilTypeMultiSelect defaultValues={[]} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Location Hazard Rates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Location Hazard Rates</Label>
                </div>
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
                      { key: 'veryHigh', label: 'Very High Risk' },
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
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectRiskFactors;


