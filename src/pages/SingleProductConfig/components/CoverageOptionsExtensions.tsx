import React, { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, AlertCircle } from "lucide-react";
import { CoverageOptionsResponse } from "@/lib/api/insurers";
import TableSkeleton from "@/components/loaders/TableSkeleton";

export type CoverageOptionsExtensionsProps = {
  ratingConfig: any;
  onSave: () => void;
  addCoverRequirementEntry: (category: string) => void;
  updateCoverRequirementEntry: (category: string, id: number, field: string, value: any) => void;
  removeCoverRequirementEntry: (category: string, id: number) => void;
  updateCoverRequirement: (category: string, key: string, value: number) => void;
  isLoading: boolean;
  error: string | null;
  coverageOptionsData: CoverageOptionsResponse | null;
};

const CoverageOptionsExtensions: React.FC<CoverageOptionsExtensionsProps> = ({
  ratingConfig,
  onSave,
  addCoverRequirementEntry,
  updateCoverRequirementEntry,
  removeCoverRequirementEntry,
  updateCoverRequirement,
  isLoading,
  error,
  coverageOptionsData,
}) => {
  // Auto-populate fields when API data is available
  useEffect(() => {
    if (coverageOptionsData && ratingConfig) {
      // Map sum_insured_loadings to sumInsured entries
      if (coverageOptionsData.sum_insured_loadings && ratingConfig.coverRequirements?.sumInsured) {
        coverageOptionsData.sum_insured_loadings.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.sumInsured[index]) {
            const entry = ratingConfig.coverRequirements.sumInsured[index];
            updateCoverRequirementEntry('sumInsured', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('sumInsured', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('sumInsured', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('sumInsured', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('sumInsured', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map project_value_loadings to projectValue entries
      if (coverageOptionsData.project_value_loadings && ratingConfig.coverRequirements?.projectValue) {
        coverageOptionsData.project_value_loadings.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.projectValue[index]) {
            const entry = ratingConfig.coverRequirements.projectValue[index];
            updateCoverRequirementEntry('projectValue', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('projectValue', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('projectValue', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('projectValue', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('projectValue', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map contract_works_loadings to contractWorks entries
      if (coverageOptionsData.contract_works_loadings && ratingConfig.coverRequirements?.contractWorks) {
        coverageOptionsData.contract_works_loadings.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.contractWorks[index]) {
            const entry = ratingConfig.coverRequirements.contractWorks[index];
            updateCoverRequirementEntry('contractWorks', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('contractWorks', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('contractWorks', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('contractWorks', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('contractWorks', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map plant_equipment_loadings to plantEquipment entries
      if (coverageOptionsData.plant_equipment_loadings && ratingConfig.coverRequirements?.plantEquipment) {
        coverageOptionsData.plant_equipment_loadings.forEach((apiEntry, index) => {
          if (ratingConfig.coverRequirements.plantEquipment[index]) {
            const entry = ratingConfig.coverRequirements.plantEquipment[index];
            updateCoverRequirementEntry('plantEquipment', entry.id, 'from', apiEntry.from_amount);
            updateCoverRequirementEntry('plantEquipment', entry.id, 'to', apiEntry.to_amount);
            updateCoverRequirementEntry('plantEquipment', entry.id, 'pricingType', apiEntry.pricing_type.toLowerCase());
            updateCoverRequirementEntry('plantEquipment', entry.id, 'loadingDiscount', apiEntry.loading_discount);
            updateCoverRequirementEntry('plantEquipment', entry.id, 'quoteOption', apiEntry.quote_option === 'AUTO_QUOTE' ? 'quote' : 'no-quote');
          }
        });
      }

      // Map cross_liability_cover to crossLiabilityCover
      if (coverageOptionsData.cross_liability_cover && ratingConfig.coverRequirements?.crossLiabilityCover) {
        coverageOptionsData.cross_liability_cover.forEach((apiEntry) => {
          const key = apiEntry.cover_option.includes('Yes') ? 'yes' : 'no';
          updateCoverRequirement('crossLiabilityCover', key, apiEntry.loading_discount);
        });
      }
    }
  }, [coverageOptionsData, ratingConfig, updateCoverRequirementEntry, updateCoverRequirement]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cover Requirements Configuration</CardTitle>
            <CardDescription>Configure loading/discount rates based on cover requirement values from proposal form</CardDescription>
          </div>
          <Button onClick={onSave} size="sm" disabled={isLoading}>
            <Save className="w-4 h-4 mr-1" />
            {isLoading ? 'Loading...' : 'Save Cover Requirements'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <TableSkeleton />
            <TableSkeleton />
            <TableSkeleton />
            <TableSkeleton />
            <TableSkeleton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sum Insured */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Sum Insured</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on sum insured value ranges (AED)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('sumInsured')}
                  >
                    Add Row
                  </Button>
                </div>
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
                    {ratingConfig.coverRequirements?.sumInsured?.map((entry: any) => (
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
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Project Value */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Project Value</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on project value ranges (AED)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('projectValue')}
                  >
                    Add Row
                  </Button>
                </div>
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
                    {ratingConfig.coverRequirements?.projectValue?.map((entry: any) => (
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
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Contract Works */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Contract Works (Material Damage)</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on contract works value ranges (AED)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('contractWorks')}
                  >
                    Add Row
                  </Button>
                </div>
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
                    {ratingConfig.coverRequirements?.contractWorks?.map((entry: any) => (
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
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Plant & Equipment */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Plant & Equipment (CPM)</CardTitle>
                  <p className="text-xs text-muted-foreground">Rate based on plant & machinery value ranges (AED)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addCoverRequirementEntry('plantEquipment')}
                  >
                    Add Row
                  </Button>
                </div>
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
                    {ratingConfig.coverRequirements?.plantEquipment?.map((entry: any) => (
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
                    )) || []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Cross Liability Cover */}
            <Card className="border border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Cross Liability Cover</CardTitle>
                    <p className="text-xs text-muted-foreground">Rate based on cross liability cover selection</p>
                  </div>
                </div>
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
                            value={ratingConfig.coverRequirements?.crossLiabilityCover?.[option.key as keyof typeof ratingConfig.coverRequirements.crossLiabilityCover] || 0}
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
        )}
      </CardContent>
    </Card>
  );
};

export default CoverageOptionsExtensions;