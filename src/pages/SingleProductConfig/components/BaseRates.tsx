import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Table, TableBody } from "@/components/ui/table";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import { SubProjectBaseRates } from "@/components/pricing/SubProjectBaseRates";

type BaseRatesProps = {
  isLoading: boolean;
  error: string | null;
  projectTypesMasters: any[] | null;
  activeProjectTypes: any[] | Set<any>;
  ratingConfig: any;
  selectedProjectTypes: any[];
  onSubProjectEntryChange: (...args: any[]) => void;
  onProjectTypeToggle: (...args: any[]) => void;
  onSave: () => Promise<void> | void;
};

const BaseRates: React.FC<BaseRatesProps> = ({
  isLoading,
  error,
  projectTypesMasters,
  activeProjectTypes,
  ratingConfig,
  selectedProjectTypes,
  onSubProjectEntryChange,
  onProjectTypeToggle,
  onSave,
}) => {
  const projectTypesList = projectTypesMasters
    ? projectTypesMasters
    : Array.isArray(activeProjectTypes)
      ? activeProjectTypes
      : Array.from(activeProjectTypes as Set<any>);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Base Rates</CardTitle>
            <CardDescription>Configure base premium rates for different sub-project types</CardDescription>
          </div>
          <Button onClick={onSave} size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save Base Rates
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="overflow-x-auto">
            <Table>
              <TableBody>
                <TableSkeleton rowCount={6} colCount={4} />
              </TableBody>
            </Table>
          </div>
        )}
        {!isLoading && error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 mb-4">
            {error}
          </div>
        )}
        {!isLoading && !error && (
          <SubProjectBaseRates
            projectTypes={projectTypesList.map((pt: any) => ({
              id: pt.id,
              value: pt.value ?? pt.label?.toLowerCase?.().replace(/[^a-z0-9]+/g, '-') ?? String(pt.id),
              label: pt.label,
              baseRate: 0,
            }))}
            subProjectEntries={ratingConfig.subProjectEntries}
            selectedProjectTypes={selectedProjectTypes}
            onSubProjectEntryChange={onSubProjectEntryChange}
            onProjectTypeToggle={onProjectTypeToggle}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BaseRates;


