import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Role = "insurer" | "reinsurer" | "broker";

interface Feature {
  id: string;
  category: string;
  name: string;
}

const AuthorityMatrix = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const productName = searchParams.get("productName") || "Product";
  const productVersion = searchParams.get("productVersion") || "";

  // All product features from provisions
  const features: Feature[] = [
    // Forms and Templates
    { id: "proposalFormDesign", category: "Forms and Templates", name: "Proposal Form" },
    { id: "quoteDetailsPageDesign", category: "Forms and Templates", name: "Quote Details Page" },
    { id: "policyDetailsPageDesign", category: "Forms and Templates", name: "Policy Details Page" },
    
    // Administration
    { id: "reInsurerOnboardingDesign", category: "Administration", name: "Re-Insurer Onboarding" },
    { id: "insurerOnboardingDesign", category: "Administration", name: "Insurer Onboarding" },
    { id: "brokerOnboardingDesign", category: "Administration", name: "Broker Onboarding" },
    { id: "userOnboardingDesign", category: "Administration", name: "User Onboarding" },
    
    // Rating and Underwriting
    { id: "ratingConfiguratorDesign", category: "Rating and Underwriting", name: "Rating Configurator" },
    { id: "documentDesign", category: "Rating and Underwriting", name: "Document Configurator" },
    { id: "cewsDesign", category: "Rating and Underwriting", name: "CEWs (Coverages, Exclusions, Warranties)" },

    // Analytics
    { id: "kpisDesign", category: "Analytics", name: "KPIs" },
  ];

  const roles: Role[] = ["insurer", "reinsurer", "broker"];

  const roleLabels: Record<Role, string> = {
    insurer: "Insurer",
    reinsurer: "Reinsurer",
    broker: "Broker",
  };

  // Initialize matrix state: feature -> role -> enabled
  const [matrix, setMatrix] = useState<Record<string, Record<Role, boolean>>>(() => {
    const initial: Record<string, Record<Role, boolean>> = {};
    features.forEach(feature => {
      initial[feature.id] = {
        insurer: false,
        reinsurer: false,
        broker: false,
      };
    });
    return initial;
  });

  const toggleFeature = (featureId: string, role: Role) => {
    setMatrix(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        [role]: !prev[featureId]?.[role],
      },
    }));
  };

  const handleSave = () => {
    // TODO: Implement API call to save authority matrix
    toast({
      title: "Authority Matrix Saved",
      description: `Authority matrix for ${productName}${productVersion ? ` - Version ${productVersion}` : ''} has been saved successfully.`,
    });
    navigate("/market-admin/product-management");
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/market-admin/product-management")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Authority Matrix</h1>
              <p className="text-muted-foreground mt-1">
                Configure which roles can configure features for {productName}{productVersion ? ` - Version ${productVersion}` : ''}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuration Permissions</CardTitle>
              <CardDescription>
                Configure which roles can configure each feature for this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Feature</TableHead>
                      <TableHead className="text-center align-middle w-[120px]">
                        <div className="flex justify-center items-center h-full py-2">Insurer</div>
                      </TableHead>
                      <TableHead className="text-center align-middle w-[120px]">
                        <div className="flex justify-center items-center h-full py-2">Reinsurer</div>
                      </TableHead>
                      <TableHead className="text-center align-middle w-[120px]">
                        <div className="flex justify-center items-center h-full py-2">Broker</div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
                      <React.Fragment key={category}>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={4} className="font-semibold">
                            {category}
                          </TableCell>
                        </TableRow>
                        {categoryFeatures.map((feature) => (
                          <TableRow key={feature.id}>
                            <TableCell className="font-medium">
                              {feature.name}
                            </TableCell>
                            {roles.map((role) => (
                              <TableCell key={role} className="text-center align-middle py-3">
                                <div className="flex justify-center items-center">
                                  <Switch
                                    checked={matrix[feature.id]?.[role] || false}
                                    onCheckedChange={() => toggleFeature(feature.id, role)}
                                  />
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/market-admin/product-management")}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Authority Matrix
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityMatrix;

