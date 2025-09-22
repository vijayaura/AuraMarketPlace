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
  title?: string;
  description?: string;
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
      return 'bg-green-500';
    case 'no-quote':
      return 'bg-red-500';
    case 'manual-review':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-400';
  }
};

export const SubProjectBaseRates = ({
  projectTypes,
  subProjectEntries,
  selectedProjectTypes,
  onSubProjectEntryChange,
  onProjectTypeToggle,
  title = "Base Rates by Sub Project Type",
  description = "Configure base premium rates and quote decisions for specific sub project categories",
}: SubProjectBaseRatesProps) => {
  // Only allow entries whose project type exists in masters list
  const allowedProjectValues = new Set(projectTypes.map(pt => pt.value));
  const filteredEntries = subProjectEntries.filter(e => allowedProjectValues.has(e.projectType));

  // Create a flat list with original indices preserved
  const flatEntries = filteredEntries.map((entry, index) => {
    const projectTypeInfo = projectTypes.find(pt => pt.value === entry.projectType);
    return {
      ...entry,
      originalIndex: index,
      projectTypeLabel: projectTypeInfo?.label || entry.projectType,
      isSelected: selectedProjectTypes?.has(entry.projectType) || false,
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
            </CardTitle>
            <CardDescription className="mt-2">
              {description}
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
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="font-medium text-muted-foreground w-[15%] px-3">Project Type</TableHead>
                <TableHead className="font-medium text-muted-foreground w-[30%] px-3">Sub Project Type</TableHead>
                <TableHead className="font-medium text-muted-foreground w-[20%] px-3">Pricing Type</TableHead>
                <TableHead className="font-medium text-muted-foreground w-[15%] px-3">Base Rate</TableHead>
                <TableHead className="font-medium text-muted-foreground w-[20%] px-3">Quote Option</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatEntries.map((entry) => (
                <TableRow key={entry.originalIndex} className="hover:bg-muted/5">
                  <TableCell className="font-medium py-4 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 text-primary flex-shrink-0">
                        {getProjectTypeIcon(entry.projectType)}
                      </div>
                      <span className="text-sm font-medium truncate">{entry.projectTypeLabel}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium py-4 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <TrendingUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{entry.subProjectType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-3">
                    <Select
                      value={entry.pricingType}
                      onValueChange={(value) => onSubProjectEntryChange(entry.originalIndex, 'pricingType', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover border border-border shadow-md">
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-4 px-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={entry.baseRate}
                      onChange={(e) => onSubProjectEntryChange(entry.originalIndex, 'baseRate', parseFloat(e.target.value) || 0)}
                      className="w-full font-mono"
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell className="py-4 px-3">
                    <Select
                      value={entry.quoteOption}
                      onValueChange={(value) => onSubProjectEntryChange(entry.originalIndex, 'quoteOption', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover border border-border shadow-md">
                        <SelectItem value="quote">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getQuoteOptionColor('quote')}`}></div>
                            Auto Quote
                          </div>
                        </SelectItem>
                        <SelectItem value="no-quote">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getQuoteOptionColor('no-quote')}`}></div>
                            No Quote
                          </div>
                        </SelectItem>
                        <SelectItem value="manual-review">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getQuoteOptionColor('manual-review')}`}></div>
                            Manual Review
                          </div>
                        </SelectItem>
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
  );
};