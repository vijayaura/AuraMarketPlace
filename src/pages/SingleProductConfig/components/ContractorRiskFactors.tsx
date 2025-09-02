import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

type ContractorRiskFactorsProps = {
  ratingConfig: any;
  onSave: () => void;
  addContractorRiskEntry: (category: string) => void;
  updateContractorRiskEntry: (category: string, id: number, field: string, value: any) => void;
  removeContractorRiskEntry: (category: string, id: number) => void;
};

const ContractorRiskFactors: React.FC<ContractorRiskFactorsProps> = ({
  ratingConfig,
  onSave,
  addContractorRiskEntry,
  updateContractorRiskEntry,
  removeContractorRiskEntry,
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contractor Risk Factors</CardTitle>
            <CardDescription>Configure risk adjustments based on contractor profile</CardDescription>
          </div>
          <Button onClick={onSave} size="sm">
            <Save className="w-4 h-4 mr-1" />
            Save Contractor Risk Factors
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Experience Loadings/Discounts */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Experience Loadings/Discounts</CardTitle>
                <p className="text-xs text-muted-foreground">Experience in years</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addContractorRiskEntry('experienceDiscounts')}
                >
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Pricing Type</TableHead>
                    <TableHead>Loading/Discount</TableHead>
                    <TableHead>Quote Option</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratingConfig.contractorRisk.experienceDiscounts.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.from}
                          onChange={(e) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'from', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.to}
                          onChange={(e) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'to', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.pricingType} 
                          onValueChange={(value) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'pricingType', value)}
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
                          onChange={(e) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.quoteOption} 
                          onValueChange={(value) => updateContractorRiskEntry('experienceDiscounts', entry.id, 'quoteOption', value)}
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
                          onClick={() => removeContractorRiskEntry('experienceDiscounts', entry.id)}
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
          </Card>

          {/* Claims Based Loading/Discount */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Claims Based Loading/Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Claim Frequency */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Claim Frequency (Last 5 Years)</Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addContractorRiskEntry('claimFrequency')}
                      >
                        Add Row
                      </Button>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Pricing Type</TableHead>
                        <TableHead>Loading/Discount</TableHead>
                        <TableHead>Quote Option</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ratingConfig.contractorRisk.claimFrequency.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.from}
                              onChange={(e) => updateContractorRiskEntry('claimFrequency', entry.id, 'from', parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.to}
                              onChange={(e) => updateContractorRiskEntry('claimFrequency', entry.id, 'to', parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={entry.pricingType} 
                              onValueChange={(value) => updateContractorRiskEntry('claimFrequency', entry.id, 'pricingType', value)}
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
                              onChange={(e) => updateContractorRiskEntry('claimFrequency', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={entry.quoteOption} 
                              onValueChange={(value) => updateContractorRiskEntry('claimFrequency', entry.id, 'quoteOption', value)}
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
                              onClick={() => removeContractorRiskEntry('claimFrequency', entry.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Claim Amount Categories */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Claim Amount Categories</Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addContractorRiskEntry('claimAmountCategories')}
                      >
                        Add Row
                      </Button>
                    </div>
                  </div>
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
                      {ratingConfig.contractorRisk.claimAmountCategories.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.from}
                              onChange={(e) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'from', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.to}
                              onChange={(e) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'to', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={entry.pricingType} 
                              onValueChange={(value) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'pricingType', value)}
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
                              onChange={(e) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={entry.quoteOption} 
                              onValueChange={(value) => updateContractorRiskEntry('claimAmountCategories', entry.id, 'quoteOption', value)}
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
                              onClick={() => removeContractorRiskEntry('claimAmountCategories', entry.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contractor Number Based Configuration */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Contractor Number Based Configuration</CardTitle>
                <p className="text-xs text-muted-foreground">Number of contractors</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addContractorRiskEntry('contractorNumbers')}
                >
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Pricing Type</TableHead>
                    <TableHead>Loading/Discount</TableHead>
                    <TableHead>Quote Option</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratingConfig.contractorRisk.contractorNumbers.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.from}
                          onChange={(e) => updateContractorRiskEntry('contractorNumbers', entry.id, 'from', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.to}
                          onChange={(e) => updateContractorRiskEntry('contractorNumbers', entry.id, 'to', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.pricingType} 
                          onValueChange={(value) => updateContractorRiskEntry('contractorNumbers', entry.id, 'pricingType', value)}
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
                          onChange={(e) => updateContractorRiskEntry('contractorNumbers', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.quoteOption} 
                          onValueChange={(value) => updateContractorRiskEntry('contractorNumbers', entry.id, 'quoteOption', value)}
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
                          onClick={() => removeContractorRiskEntry('contractorNumbers', entry.id)}
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
          </Card>

          {/* Subcontractor Number Based Configuration */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Subcontractor Number Based Configuration</CardTitle>
                <p className="text-xs text-muted-foreground">Number of subcontractors</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => addContractorRiskEntry('subcontractorNumbers')}
                >
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Pricing Type</TableHead>
                    <TableHead>Loading/Discount</TableHead>
                    <TableHead>Quote Option</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratingConfig.contractorRisk.subcontractorNumbers.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.from}
                          onChange={(e) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'from', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={entry.to}
                          onChange={(e) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'to', parseFloat(e.target.value) || 0)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.pricingType} 
                          onValueChange={(value) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'pricingType', value)}
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
                          onChange={(e) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'loadingDiscount', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={entry.quoteOption} 
                          onValueChange={(value) => updateContractorRiskEntry('subcontractorNumbers', entry.id, 'quoteOption', value)}
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
                          onClick={() => removeContractorRiskEntry('subcontractorNumbers', entry.id)}
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
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractorRiskFactors;
