import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

type PolicyLimitsDeductiblesProps = {
  ratingConfig: any;
  onSave: () => void;
  updateLimits: (key: string, value: number) => void;
  addCoverRequirementEntry: (category: string) => void;
  updateCoverRequirementEntry: (category: string, id: number, field: string, value: any) => void;
  removeCoverRequirementEntry: (category: string, id: number) => void;
};

const PolicyLimitsDeductibles: React.FC<PolicyLimitsDeductiblesProps> = ({
  ratingConfig,
  onSave,
  updateLimits,
  addCoverRequirementEntry,
  updateCoverRequirementEntry,
  removeCoverRequirementEntry,
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Policy Limits & Deductibles</CardTitle>
            <CardDescription>Configure policy limits and deductible adjustments</CardDescription>
          </div>
          <Button onClick={onSave} size="sm">
            <Save className="w-4 h-4 mr-1" />
            Save Limits & Deductibles
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 overflow-x-auto">
        <div className="space-y-6">
          {/* Policy Limits */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Policy Limits</CardTitle>
              </div>
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

          {/* Sub-limits */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Sub-limits</CardTitle>
                <p className="text-xs text-muted-foreground">Define coverage sub-limits and restrictions</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addCoverRequirementEntry('subLimits')}
                >
                  Add Sub-limit
                </Button>
              </div>
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
                  {ratingConfig.coverRequirements.subLimits?.map((entry: any) => (
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

          {/* Deductibles */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Deductibles</CardTitle>
                <p className="text-xs text-muted-foreground">Configure deductible options and pricing</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addCoverRequirementEntry('deductibles')}
                >
                  Add Deductible
                </Button>
              </div>
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
                  {ratingConfig.coverRequirements.deductibles?.map((entry: any) => (
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
  );
};

export default PolicyLimitsDeductibles;

