import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

type CoverageOptionsExtensionsProps = {
  ratingConfig: any;
  onSave: () => void;
  addCoverRequirementEntry: (category: string) => void;
  updateCoverRequirementEntry: (category: string, id: number, field: string, value: any) => void;
  removeCoverRequirementEntry: (category: string, id: number) => void;
  updateCoverRequirement: (category: string, key: string, value: number) => void;
};

const CoverageOptionsExtensions: React.FC<CoverageOptionsExtensionsProps> = ({
  ratingConfig,
  onSave,
  addCoverRequirementEntry,
  updateCoverRequirementEntry,
  removeCoverRequirementEntry,
  updateCoverRequirement,
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cover Requirements Configuration</CardTitle>
            <CardDescription>Configure loading/discount rates based on cover requirement values from proposal form</CardDescription>
          </div>
          <Button onClick={onSave} size="sm">
            <Save className="w-4 h-4 mr-1" />
            Save Cover Requirements
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
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
                  {ratingConfig.coverRequirements.sumInsured.map((entry: any) => (
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
                  ))}
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
                  {ratingConfig.coverRequirements.projectValue.map((entry: any) => (
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
                  ))}
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
                  {ratingConfig.coverRequirements.contractWorks.map((entry: any) => (
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
                  ))}
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
                  {ratingConfig.coverRequirements.plantEquipment.map((entry: any) => (
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
                  ))}
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
                          value={ratingConfig.coverRequirements.crossLiabilityCover[option.key as keyof typeof ratingConfig.coverRequirements.crossLiabilityCover]}
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
      </CardContent>
    </Card>
  );
};

export default CoverageOptionsExtensions;
