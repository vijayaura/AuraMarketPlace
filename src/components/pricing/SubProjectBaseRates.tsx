import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, Factory, Home, Zap, TrendingUp, Calculator, Info } from "lucide-react";

interface SubProjectEntry {
  projectType: string;
  subProjectType: string;
  pricingType: string;
  baseRate: number;
  quoteOption: string;
}

interface ProjectType {
  id: number;
  value: string;
  label: string;
  baseRate: number;
}

interface SubProjectBaseRatesProps {
  projectTypes: ProjectType[];
  subProjectEntries: SubProjectEntry[];
  selectedProjectTypes?: Set<string>;
  onSubProjectEntryChange: (index: number, field: string, value: string | number) => void;
  onProjectTypeToggle: (projectType: string) => void;
}

const getProjectTypeIcon = (value: string) => {
  switch (value.toLowerCase()) {
    case 'residential':
      return <Home className="w-4 h-4" />;
    case 'commercial':
      return <Building className="w-4 h-4" />;
    case 'industrial':
      return <Factory className="w-4 h-4" />;
    case 'infrastructure':
      return <Zap className="w-4 h-4" />;
    default:
      return <Calculator className="w-4 h-4" />;
  }
};

const getQuoteOptionColor = (option: string) => {
  switch (option) {
    case 'quote':
      return 'bg-success/10 text-success border-success/20';
    case 'no-quote':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'quote-and-refer':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const SubProjectBaseRates = ({
  projectTypes,
  subProjectEntries,
  selectedProjectTypes,
  onSubProjectEntryChange,
  onProjectTypeToggle,
}: SubProjectBaseRatesProps) => {
  // Group sub project entries by project type
  const groupedEntries = subProjectEntries.reduce((groups, entry, index) => {
    if (!groups[entry.projectType]) {
      groups[entry.projectType] = [];
    }
    groups[entry.projectType].push({ ...entry, originalIndex: index });
    return groups;
  }, {} as Record<string, Array<SubProjectEntry & { originalIndex: number }>>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Base Rates by Sub Project Type
            </CardTitle>
            <CardDescription className="mt-2">
              Configure base premium rates and quote decisions for specific sub project categories
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {subProjectEntries.length} Sub Project Types
            </Badge>
          </div>
        </div>
        
      </CardHeader>
      
      <CardContent>
        <div className="space-y-8">
          {Object.entries(groupedEntries).map(([projectType, entries]) => {
            const projectTypeInfo = projectTypes.find(pt => pt.value === projectType);
            const isSelected = selectedProjectTypes?.has(projectType) || false;
            
            return (
              <div key={projectType} className="border rounded-lg overflow-hidden bg-card">
                <div className="bg-muted/30 px-6 py-4 border-b">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onProjectTypeToggle(projectType)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                      {getProjectTypeIcon(projectType)}
                    </div>
                    <h4 className="font-semibold text-base">
                      {projectTypeInfo?.label || projectType}
                    </h4>
                    <Badge variant="secondary" className="ml-auto">
                      {entries.length} Sub Types
                    </Badge>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/10">
                          <TableHead className="font-medium text-muted-foreground px-6">Sub Project Type</TableHead>
                          <TableHead className="font-medium text-muted-foreground px-4">Pricing Type</TableHead>
                          <TableHead className="font-medium text-muted-foreground px-4">Base Rate</TableHead>
                          <TableHead className="font-medium text-muted-foreground px-6">Quote Option</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow key={entry.originalIndex} className="hover:bg-muted/5">
                            <TableCell className="font-medium py-4 px-6">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                {entry.subProjectType}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <Select
                                value={entry.pricingType}
                                onValueChange={(value) => onSubProjectEntryChange(entry.originalIndex, 'pricingType', value)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-popover border border-border shadow-md">
                                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={entry.baseRate}
                                  onChange={(e) => onSubProjectEntryChange(entry.originalIndex, 'baseRate', parseFloat(e.target.value) || 0)}
                                  className="w-24 font-mono"
                                  placeholder="0.00"
                                />
                                <span className="text-sm text-muted-foreground font-medium">
                                  {entry.pricingType === 'fixed' ? 'AED' : '%'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 px-6">
                              <Select
                                value={entry.quoteOption}
                                onValueChange={(value) => onSubProjectEntryChange(entry.originalIndex, 'quoteOption', value)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-popover border border-border shadow-md">
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
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};