import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2 } from "lucide-react";

type MasterDataTabsProps = {
  activePricingTab: string;
  activeConstructionTypes: any[];
  activeCountries: any[];
  ratingConfig: any;
  onSave: () => void;
  markAsChanged: () => void;
  setRatingConfig: (updater: (prev: any) => any) => void;
};

const MasterDataTabs: React.FC<MasterDataTabsProps> = ({
  activePricingTab,
  activeConstructionTypes,
  activeCountries,
  ratingConfig,
  onSave,
  markAsChanged,
  setRatingConfig,
}) => {
  if (activePricingTab === "clause-pricing") {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clause Pricing Configuration</CardTitle>
              <CardDescription>Configure pricing for specific policy clauses</CardDescription>
            </div>
            <Button onClick={onSave} size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="grid gap-6">
            {ratingConfig.clausesPricing.map((clause: any) => (
              <div key={clause.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">{clause.name}</h4>
                    <p className="text-sm text-muted-foreground">Code: {clause.code}</p>
                  </div>
                  <Badge variant={clause.enabled ? "default" : "secondary"}>
                    {clause.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {clause.variableOptions.length} option{clause.variableOptions.length !== 1 ? 's' : ''} configured
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activePricingTab === "construction-types") {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Construction Types</CardTitle>
              <CardDescription>Configure pricing for different construction types</CardDescription>
            </div>
            <Button onClick={onSave} size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save Construction Types
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Construction Type</TableHead>
                <TableHead>Pricing Type</TableHead>
                <TableHead>Loading/Discount</TableHead>
                <TableHead>Quote Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeConstructionTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.label}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (activePricingTab === "countries") {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Countries</CardTitle>
              <CardDescription>Configure pricing for different countries</CardDescription>
            </div>
            <Button onClick={onSave} size="sm">
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Pricing Type</TableHead>
                <TableHead>Loading/Discount</TableHead>
                <TableHead>Quote Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeCountries.map((country) => (
                <TableRow key={country.id}>
                  <TableCell className="font-medium">{country.label}</TableCell>
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
              ))}
            </TableBody>
          </Table>
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
      case "regions":
        return { title: "Regions", description: "Configure pricing for different regions", data: [] };
      case "zones":
        return { title: "Zones", description: "Configure pricing for different zones", data: [] };
      case "role-types":
        return { title: "Role Types", description: "Configure pricing for different role types", data: ['Project Manager', 'Site Engineer', 'Safety Officer', 'Quality Controller', 'Surveyor'] };
      case "contract-types":
        return { title: "Contract Types", description: "Configure pricing for different contract types", data: ['Fixed Price', 'Cost Plus', 'Time & Materials', 'Design Build'] };
      case "soil-types":
        return { title: "Soil Types", description: "Configure pricing for different soil types", data: ['Clay', 'Sand', 'Rock', 'Mixed', 'Soft Soil', 'Hard Soil'] };
      case "subcontractor-types":
        return { title: "Subcontractor Types", description: "Configure pricing for different subcontractor types", data: ['Electrical', 'Plumbing', 'HVAC', 'Painting', 'Flooring', 'Roofing', 'Landscaping', 'Security'] };
      case "consultant-roles":
        return { title: "Consultant Roles", description: "Configure pricing for different consultant roles", data: ['Architect', 'Structural Engineer', 'MEP Engineer', 'Geotechnical', 'Environmental', 'Planning', 'Quantity Surveyor'] };
      case "security-types":
        return { title: "Security Types", description: "Configure pricing for different security types", data: ['Basic Security', 'Enhanced Security', 'CCTV Monitoring', 'Access Control', 'Alarm Systems'] };
      case "area-types":
        return { title: "Area Types", description: "Configure pricing for different area types", data: ['Urban', 'Suburban', 'Rural', 'Industrial', 'Coastal', 'Desert'] };
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
          <Button onClick={onSave} size="sm">
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
            {config.data.map((item: string, index: number) => (
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default MasterDataTabs;

