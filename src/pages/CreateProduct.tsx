import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, FileText, Settings, Users, Shield, BarChart3, CheckCircle2, Key, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CreateProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    productName: "",
    productVersion: "",
    category: "",
    currency: "AED",
    owner: "",
  });

  const categories = [
    { value: "CONSTRUCTION", label: "Construction" },
    { value: "PROFESSIONAL", label: "Professional" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "PROPERTY", label: "Property" },
    { value: "SPECIALTY", label: "Specialty" },
    { value: "MARINE", label: "Marine" },
  ];

  // Gulf currencies first, then others
  const currencies = [
    { value: "AED", label: "AED - UAE Dirham" },
    { value: "SAR", label: "SAR - Saudi Riyal" },
    { value: "KWD", label: "KWD - Kuwaiti Dinar" },
    { value: "BHD", label: "BHD - Bahraini Dinar" },
    { value: "OMR", label: "OMR - Omani Rial" },
    { value: "QAR", label: "QAR - Qatari Riyal" },
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "INR", label: "INR - Indian Rupee" },
  ];

  const owners = [
    { value: "insurer", label: "Insurer" },
    { value: "reinsurer", label: "Reinsurer" },
    { value: "broker", label: "Broker" },
  ];

  const [isBasicInfoSaved, setIsBasicInfoSaved] = useState(false);

  const [provisions, setProvisions] = useState({
    authorityMatrix: {
      authorityMatrixDesign: false,
    },
    formsAndTemplates: {
      proposalFormDesign: false,
      quoteDetailsPageDesign: false,
      policyDetailsPageDesign: false,
    },
    administration: {
      reInsurerOnboardingDesign: false,
      insurerOnboardingDesign: false,
      brokerOnboardingDesign: false,
      userOnboardingDesign: false,
    },
    ratingAndUnderwriting: {
      ratingConfiguratorDesign: false,
      documentDesign: false,
      cewsDesign: false,
    },
    analytics: {
      kpisDesign: false,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName) {
      toast({
        title: "Validation Error",
        description: "Please fill in the Product Name field.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement API call to create product
    toast({
      title: "Product Created",
      description: `Product ${formData.productName}${formData.productVersion ? ` - Version ${formData.productVersion}` : ''} has been created successfully.`,
    });

    // Navigate back to product management
    navigate("/market-admin/product-management");
  };

  const handleSaveBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName) {
      toast({
        title: "Validation Error",
        description: "Please fill in the Product Name field.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement API call to save basic product information
    setIsBasicInfoSaved(true);
    toast({
      title: "Basic Information Saved",
      description: "Product basic information has been saved. You can now configure product provisions.",
    });
  };

  const handleCreateDesign = (path: string[]) => {
    if (!isBasicInfoSaved) {
      toast({
        title: "Save Required",
        description: "Please save the Basic Product Information before configuring provisions.",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Navigate to create design page or open dialog
    const designName = path[path.length - 1];
    toast({
      title: "Create Design",
      description: `Creating ${designName}... Design creation functionality will be implemented in the next step.`,
    });
  };

  const handleConfigureAuthorityMatrix = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isBasicInfoSaved) {
      toast({
        title: "Save Required",
        description: "Please save the Basic Product Information before configuring provisions.",
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/market-admin/product-management/authority-matrix?productName=${encodeURIComponent(formData.productName)}&productVersion=${encodeURIComponent(formData.productVersion)}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
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
              <h1 className="text-3xl font-bold text-foreground">Create New Product</h1>
              <p className="text-muted-foreground mt-1">
                Create a new insurance product with all necessary provisions
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Product Information</CardTitle>
                <CardDescription>
                  Define the core details of your insurance product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      value={formData.productName}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, productName: e.target.value }));
                        setIsBasicInfoSaved(false);
                      }}
                      placeholder="e.g., Contractors All Risk Insurance"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productVersion">Product Version</Label>
                    <Input
                      id="productVersion"
                      value={formData.productVersion}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, productVersion: e.target.value }));
                        setIsBasicInfoSaved(false);
                      }}
                      placeholder="e.g., 1.0, 1.2, 2.0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Product Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, category: value }));
                        setIsBasicInfoSaved(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Product Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, currency: value }));
                        setIsBasicInfoSaved(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner">Owner</Label>
                    <Select
                      value={formData.owner}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, owner: value }));
                        setIsBasicInfoSaved(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {owners.map((owner) => (
                          <SelectItem key={owner.value} value={owner.value}>
                            {owner.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveBasicInfo}
                    className="gap-2"
                    disabled={isBasicInfoSaved}
                  >
                    <Save className="w-4 h-4" />
                    {isBasicInfoSaved ? "Saved" : "Save Basic Information"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Provisions Section */}
            <Card className={!isBasicInfoSaved ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <CardTitle>Product Provisions</CardTitle>
                <CardDescription>
                  {!isBasicInfoSaved 
                    ? "Please save Basic Product Information first to configure provisions"
                    : "Configure the provisions and features available for this product"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Authority Matrix - First */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Key className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Authority Matrix</h3>
                  </div>
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Authority Matrix</span>
                      </div>
                      <Button
                        type="button"
                        variant={provisions.authorityMatrix.authorityMatrixDesign ? "default" : "outline"}
                        size="sm"
                        onClick={handleConfigureAuthorityMatrix}
                        disabled={!isBasicInfoSaved}
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Forms and Templates */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Forms and Templates</h3>
                  </div>
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Proposal Form Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["formsAndTemplates", "proposalFormDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Quote Details Page Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["formsAndTemplates", "quoteDetailsPageDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Policy Details Page Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["formsAndTemplates", "policyDetailsPageDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Administration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Settings className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Administration</h3>
                  </div>
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Re-Insurer Onboarding Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["administration", "reInsurerOnboardingDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Insurer Onboarding Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["administration", "insurerOnboardingDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Broker Onboarding Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["administration", "brokerOnboardingDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">User Onboarding Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["administration", "userOnboardingDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Rating and Underwriting */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Rating and Underwriting</h3>
                  </div>
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Rating Configurator Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["ratingAndUnderwriting", "ratingConfiguratorDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Document Configurator Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["ratingAndUnderwriting", "documentDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">CEWs Design (Coverages, Exclusions, Warranties)</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["ratingAndUnderwriting", "cewsDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Analytics</h3>
                  </div>
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">KPIs Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["analytics", "kpisDesign"])}
                        disabled={!isBasicInfoSaved}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/market-admin/product-management")}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2">
                <Save className="w-4 h-4" />
                Create Product
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;

