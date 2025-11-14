import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building, User, Briefcase, Plus, Copy, Calendar, UserCircle, Edit, Users, Building2, Trash2, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getProducts, cloneProduct, deleteProduct, updateProduct, type Product, type ProductStatus } from "@/lib/api/products";

const MarketAdminProductManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloning, setIsCloning] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);

  // Fallback test data for development when API is not available
  const getFallbackProducts = (): Product[] => [
    {
      id: '1',
      name: 'Contractors All Risk Insurance',
      version: '1.0',
      category: 'ENGINEERING',
      owner: 'insurer',
      status: 'Draft',
      currency: 'AED',
      linkedInsurers: 0,
      linkedBrokers: 0,
      createdDate: '2024-01-15T10:30:00Z',
      modifiedDate: '2024-03-20T14:45:00Z',
      createdBy: 'Admin User',
      code: 'CAR',
    },
    {
      id: '2',
      name: 'Contractors All Risk Insurance',
      version: '1.2',
      category: 'ENGINEERING',
      owner: 'insurer',
      status: 'Active',
      currency: 'AED',
      linkedInsurers: 3,
      linkedBrokers: 2,
      createdDate: '2024-02-10T09:15:00Z',
      modifiedDate: '2024-03-15T11:20:00Z',
      createdBy: 'Admin User',
      code: 'CAR',
    },
    {
      id: '3',
      name: 'Professional Indemnity Insurance',
      version: '1.0',
      category: 'LIABILITY',
      owner: 'broker',
      status: 'Active',
      currency: 'AED',
      linkedInsurers: 2,
      linkedBrokers: 1,
      createdDate: '2024-01-20T09:15:00Z',
      modifiedDate: '2024-02-10T11:20:00Z',
      createdBy: 'Admin User',
      code: 'PI',
    },
    {
      id: '4',
      name: 'Directors & Officers Liability Insurance',
      version: '1.0',
      category: 'LIABILITY',
      owner: 'insurer',
      status: 'Active',
      currency: 'AED',
      linkedInsurers: 2,
      linkedBrokers: 1,
      createdDate: '2024-02-05T13:45:00Z',
      modifiedDate: '2024-03-25T10:30:00Z',
      createdBy: 'Admin User',
      code: 'DO',
    }
  ];

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const response = await getProducts();
        if (response.products && response.products.length > 0) {
          setProducts(response.products);
        } else {
          // If API returns empty, use fallback data for development
          console.warn('API returned empty products list, using fallback data');
          setProducts(getFallbackProducts());
        }
      } catch (error: any) {
        console.warn('Failed to load products from API, using fallback data:', error);
        // Fallback to test data when API is not available (for development)
        setProducts(getFallbackProducts());
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [toast]);

  const handleProductClick = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      navigate(`/market-admin/product-management/create?productId=${productId}&productName=${encodeURIComponent(product.name)}&productVersion=${encodeURIComponent(product.version)}&edit=true`);
    }
  };

  const handleCreateProduct = () => {
    navigate("/market-admin/product-management/create");
  };

  const handleEditProduct = (product: Product) => {
    navigate(`/market-admin/product-management/create?productId=${product.id}&productName=${encodeURIComponent(product.name)}&productVersion=${encodeURIComponent(product.version)}&edit=true`);
  };

  const handleCloneProduct = async (product: Product) => {
    try {
      setIsCloning(product.id);
      const clonedProduct = await cloneProduct(product.id);
      toast({
        title: "Product Cloned",
        description: `${product.name} v${product.version} has been cloned successfully.`,
      });
      // Reload products
      const response = await getProducts();
      setProducts(response.products || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clone product",
        variant: "destructive",
      });
    } finally {
      setIsCloning(null);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete ${product.name} v${product.version}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(product.id);
      await deleteProduct(product.id);
      toast({
        title: "Product Deleted",
        description: `${product.name} v${product.version} has been deleted.`,
      });
      // Reload products
      try {
        const response = await getProducts();
        setProducts(response.products || []);
      } catch {
        // If API fails, remove from local state
        setProducts(products.filter(p => p.id !== product.id));
      }
    } catch (error: any) {
      // If API fails, remove from local state for development
      if (error.status === 0 || error.message?.includes('Network')) {
        setProducts(products.filter(p => p.id !== product.id));
        toast({
          title: "Product Deleted (Local)",
          description: `${product.name} v${product.version} has been removed from the list.`,
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to delete product",
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleProductStatus = async (product: Product) => {
    const newStatus: ProductStatus = product.status === "Active" ? "Archived" : "Active";
    
    try {
      setIsTogglingStatus(product.id);
      await updateProduct(product.id, { status: newStatus });
      toast({
        title: "Product Status Updated",
        description: `${product.name} v${product.version} has been ${newStatus === "Active" ? "activated" : "archived"}.`,
      });
      // Reload products
      try {
        const response = await getProducts();
        setProducts(response.products || []);
      } catch {
        // If API fails, update local state
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, status: newStatus } : p
        ));
      }
    } catch (error: any) {
      // If API fails, update local state for development
      if (error.status === 0 || error.message?.includes('Network')) {
        setProducts(products.map(p => 
          p.id === product.id ? { ...p, status: newStatus } : p
        ));
        toast({
          title: "Product Status Updated (Local)",
          description: `${product.name} v${product.version} has been ${newStatus === "Active" ? "activated" : "archived"}.`,
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to update product status",
          variant: "destructive",
        });
      }
    } finally {
      setIsTogglingStatus(null);
    }
  };


  const getStatusBadgeVariant = (status: ProductStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "Active":
        return "default";
      case "Draft":
        return "secondary";
      case "Archived":
        return "outline";
      default:
        return "outline";
    }
  };

  const getOwnerLabel = (owner: string): string => {
    const ownerMap: Record<string, string> = {
      broker: "Broker",
      insurer: "Insurer",
      reinsurer: "Reinsurer",
    };
    return ownerMap[owner] || owner;
  };

  const getProductIcon = (category: string) => {
    // Map category to icon
    if (category.includes("CONSTRUCTION") || category === "ENGINEERING") {
      return <Building className="w-5 h-5" />;
    }
    if (category.includes("PROFESSIONAL") || category === "LIABILITY") {
      return <User className="w-5 h-5" />;
    }
    if (category.includes("COMMERCIAL") || category === "CASUALTY") {
      return <Briefcase className="w-5 h-5" />;
    }
    return <Building className="w-5 h-5" />;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
              <p className="text-muted-foreground mt-1">
                View and manage all insurance products available in the system
              </p>
            </div>
            <Button onClick={handleCreateProduct} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Product
            </Button>
          </div>

          {/* Products List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No products found. Create your first product to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {products.map(product => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleProductClick(product.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        {getProductIcon(product.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{product.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            v{product.version}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(product.status)} className="text-xs">
                            {product.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Owner:</span>
                            <span className="capitalize">{getOwnerLabel(product.owner)}</span>
                          </div>
                          {product.linkedInsurers && product.linkedInsurers > 0 && (
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>{product.linkedInsurers} insurer{product.linkedInsurers !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {product.linkedBrokers && product.linkedBrokers > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{product.linkedBrokers} broker{product.linkedBrokers !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Created: {formatDate(product.createdDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Modified: {formatDate(product.modifiedDate)}</span>
                          </div>
                          {product.createdBy && (
                            <div className="flex items-center gap-1">
                              <UserCircle className="w-3 h-3" />
                              <span>{product.createdBy}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                                  // Navigate to masters management based on product
                              const productCode = product.code || product.name.substring(0, 3).toUpperCase();
                              if (productCode === 'CAR') {
                                navigate('/market-admin/masters-management/car');
                              } else if (productCode === 'PI') {
                                navigate('/market-admin/masters-management/pi');
                              } else {
                                navigate('/market-admin/masters-management');
                              }
                            }}
                            className="gap-1 text-xs h-7"
                          >
                            <Database className="w-3 h-3" />
                            View Masters
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/market-admin/insurer-management');
                            }}
                            className="gap-1 text-xs h-7"
                          >
                            <Building2 className="w-3 h-3" />
                            View Insurers
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/market-admin/broker-management');
                            }}
                            className="gap-1 text-xs h-7"
                          >
                            <Users className="w-3 h-3" />
                            View Brokers
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Active</span>
                        <Switch
                          checked={product.status === "Active"}
                          onCheckedChange={() => handleToggleProductStatus(product)}
                          disabled={isTogglingStatus === product.id}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product);
                        }}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneProduct(product);
                        }}
                        className="gap-2"
                        disabled={isCloning === product.id}
                      >
                        <Copy className="w-4 h-4" />
                        {isCloning === product.id ? "Cloning..." : "Clone"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product);
                        }}
                        className="gap-2 text-destructive hover:text-destructive"
                        disabled={isDeleting === product.id}
                      >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting === product.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketAdminProductManagement;

