import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, FileText, Settings, Shield, BarChart3, CheckCircle2, Key, Plug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct, updateProduct, getProduct, type Product, type ProductCategory, type ProductOwner } from "@/lib/api/products";

const CreateProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Check if we're in edit mode from URL params
  const isEditMode = searchParams.get("edit") === "true";
  const productIdFromUrl = searchParams.get("productId");
  const productNameFromUrl = searchParams.get("productName");
  const productVersionFromUrl = searchParams.get("productVersion");
  const [isLoading, setIsLoading] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(productIdFromUrl || null);

  const [formData, setFormData] = useState({
    productName: productNameFromUrl || "",
    productVersion: productVersionFromUrl || "",
    category: "" as ProductCategory | "",
    currency: "AED",
    owner: "" as ProductOwner | "",
  });

  // Load product data if in edit mode
  useEffect(() => {
    const loadProduct = async () => {
      if (isEditMode && productIdFromUrl) {
        try {
          setIsLoading(true);
          const product = await getProduct(productIdFromUrl);
          setCurrentProductId(product.id);
          setFormData({
            productName: product.name,
            productVersion: product.version,
            category: product.category,
            currency: product.currency,
            owner: product.owner,
          });
          setIsBasicInfoSaved(true);
        } catch (error: any) {
          // If 404 or network error, use URL params as fallback (for development)
          if (error.status === 404 || error.status === 0 || error.message?.includes('Network')) {
            // Use productName and productVersion from URL params
            if (productNameFromUrl) {
              // Try to infer category and owner from product name (for test data)
              let inferredCategory: ProductCategory | "" = "";
              let inferredOwner: ProductOwner | "" = "";
              
              if (productNameFromUrl.includes("Contractors All Risk") || productNameFromUrl.includes("CAR")) {
                inferredCategory = "ENGINEERING";
                inferredOwner = "insurer";
              } else if (productNameFromUrl.includes("Professional Indemnity") || productNameFromUrl.includes("PI")) {
                inferredCategory = "LIABILITY";
                inferredOwner = "broker";
              } else if (productNameFromUrl.includes("Directors & Officers") || productNameFromUrl.includes("D&O")) {
                inferredCategory = "LIABILITY";
                inferredOwner = "insurer";
              }
              
              setFormData(prev => ({
                ...prev,
                productName: productNameFromUrl,
                productVersion: productVersionFromUrl || prev.productVersion,
                category: inferredCategory || prev.category,
                owner: inferredOwner || prev.owner,
              }));
              setIsBasicInfoSaved(true);
            }
            // Don't show error toast for 404/network errors in development
            if (!import.meta.env.DEV) {
              console.warn('Product not found in API, using URL params as fallback');
            }
          } else {
            // Show error for other types of errors
            toast({
              title: "Error",
              description: error.message || "Failed to load product",
              variant: "destructive",
            });
          }
        } finally {
          setIsLoading(false);
        }
      } else if (isEditMode && productNameFromUrl && productVersionFromUrl) {
        // Fallback: if no productId but have name/version, use them and assume saved
        setFormData(prev => ({
          ...prev,
          productName: productNameFromUrl,
          productVersion: productVersionFromUrl,
        }));
        setIsBasicInfoSaved(true);
      }
    };
    loadProduct();
  }, [isEditMode, productIdFromUrl, productNameFromUrl, productVersionFromUrl, toast]);

  const categories = [
    { value: "CASUALTY", label: "Casualty" },
    { value: "ENGINEERING", label: "Engineering" },
    { value: "GENERAL_ACCIDENT", label: "General Accident" },
    { value: "GROUP_LIFE", label: "Group Life" },
    { value: "LIABILITY", label: "Liability" },
    { value: "MARINE_CARGO", label: "Marine Cargo" },
    { value: "MARINE_HULL", label: "Marine Hull" },
    { value: "MEDICAL", label: "Medical" },
    { value: "MOTOR", label: "Motor" },
    { value: "PROPERTY", label: "Property" },
    { value: "WORKMENS_COMPENSATION", label: "Workmen's Compensation (WC)" },
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
    },
    ratingAndUnderwriting: {
      ratingConfiguratorDesign: false,
      uwRulesDesign: false,
      documentDesign: false,
    },
    analytics: {
      kpisDesign: false,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName) {
      toast({
        title: "Validation Error",
        description: "Please fill in the Product Name field.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      if (isEditMode && currentProductId) {
        await updateProduct(currentProductId, {
          name: formData.productName,
          version: formData.productVersion || undefined,
          category: formData.category || undefined,
          currency: formData.currency,
          owner: formData.owner || undefined,
        });
        toast({
          title: "Product Updated",
          description: `Product ${formData.productName}${formData.productVersion ? ` - Version ${formData.productVersion}` : ''} has been updated successfully.`,
        });
      } else {
        const newProduct = await createProduct({
          name: formData.productName,
          version: formData.productVersion || undefined,
          category: formData.category as ProductCategory,
          currency: formData.currency,
          owner: formData.owner as ProductOwner,
          status: "Draft",
        });
        toast({
          title: "Product Created",
          description: `Product ${formData.productName}${formData.productVersion ? ` - Version ${formData.productVersion}` : ''} has been created successfully.`,
        });
      }
      navigate("/market-admin/product-management");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || (isEditMode ? "Failed to update product" : "Failed to create product"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.productName) {
      toast({
        title: "Validation Error",
        description: "Please fill in the Product Name field.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Please select a Product Category.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.owner) {
      toast({
        title: "Validation Error",
        description: "Please select a Product Owner.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      if (isEditMode && currentProductId) {
        await updateProduct(currentProductId, {
          name: formData.productName,
          version: formData.productVersion || undefined,
          category: formData.category,
          currency: formData.currency,
          owner: formData.owner,
        });
      } else {
        const newProduct = await createProduct({
          name: formData.productName,
          version: formData.productVersion || undefined,
          category: formData.category as ProductCategory,
          currency: formData.currency,
          owner: formData.owner as ProductOwner,
          status: "Draft",
        });
        setCurrentProductId(newProduct.id);
      }
      setIsBasicInfoSaved(true);
      toast({
        title: "Basic Information Saved",
        description: "Product basic information has been saved. You can now configure product provisions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save basic information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
    
    const designName = path[path.length - 1];
    
    const params = new URLSearchParams({
      productName: formData.productName,
      productVersion: formData.productVersion || "",
    });
    if (currentProductId) {
      params.set("productId", currentProductId);
    }
    const queryString = params.toString();
    
    // Navigate to Proposal Form Design if it's proposalFormDesign
    if (designName === "proposalFormDesign") {
      navigate(`/market-admin/product-management/proposal-form-design?${queryString}`);
      return;
    }
    
    // Navigate to Rating Configurator
    if (designName === "ratingConfiguratorDesign") {
      navigate(`/market-admin/product-management/rating-configurator?${queryString}`);
      return;
    }
    
    // Navigate to Document Configurator Design
    if (designName === "documentDesign") {
      navigate(`/market-admin/product-management/document-configurator?${queryString}`);
      return;
    }
    
    // Navigate to KPI Design
    if (designName === "kpisDesign") {
      navigate(`/market-admin/product-management/kpi-design?${queryString}`);
      return;
    }
    
    // Navigate to UW Rules Design
    if (designName === "uwRulesDesign") {
      navigate(`/market-admin/product-management/uw-rules-design?${queryString}`);
      return;
    }
    
    // TODO: Navigate to other design pages
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
    
    const params = new URLSearchParams({
      productName: formData.productName,
      productVersion: formData.productVersion || "",
    });
    if (currentProductId) {
      params.set("productId", currentProductId);
    }
    navigate(`/market-admin/product-management/authority-matrix?${params.toString()}`);
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
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isEditMode ? "Edit Product" : "Create New Product"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isEditMode 
                  ? "Edit product provisions and configurations"
                  : "Create a new insurance product with all necessary provisions"}
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
                    disabled={isBasicInfoSaved || isLoading}
                  >
                    <Save className="w-4 h-4" />
                    {isLoading ? "Saving..." : isBasicInfoSaved ? "Saved" : "Save Basic Information"}
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
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">UW Rules Design</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateDesign(["ratingAndUnderwriting", "uwRulesDesign"])}
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

                {/* Integrations */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Plug className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Integrations</h3>
                  </div>
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 flex-1">
                        <Plug className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">API Integrations</span>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={(e) => {
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
                          const params = new URLSearchParams({
                            productName: formData.productName,
                            productVersion: formData.productVersion || "",
                          });
                          if (currentProductId) {
                            params.set("productId", currentProductId);
                          }
                          navigate(`/market-admin/product-management/integrations?${params.toString()}`);
                        }}
                        disabled={!isBasicInfoSaved}
                      >
                        Configure
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
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={isLoading}>
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : isEditMode ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;

