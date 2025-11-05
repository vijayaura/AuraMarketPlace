import { useNavigate } from "react-router-dom";
import { Building, User, Briefcase, Plus, Copy, Calendar, UserCircle, Edit, Users, Building2, Power, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type ProductStatus = "Draft" | "Active" | "Archived";
type ProductOwner = "broker" | "insurer";

interface InsuranceProduct {
  id: string;
  code: string;
  name: string;
  version: string;
  category: string;
  owner: ProductOwner;
  status: ProductStatus;
  linkedInsurers: number;
  linkedBrokers: number;
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  icon: React.ReactNode;
}

const MarketAdminProductManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const insuranceProducts: InsuranceProduct[] = [
    {
      id: '1',
      code: 'CAR',
      name: 'Contractors All Risk Insurance',
      version: '1.0',
      category: 'CONSTRUCTION',
      owner: 'insurer',
      status: 'Draft',
      linkedInsurers: 0,
      linkedBrokers: 0,
      createdDate: '2024-01-15T10:30:00Z',
      modifiedDate: '2024-03-20T14:45:00Z',
      createdBy: 'Admin User',
      icon: <Building className="w-5 h-5" />
    },
    {
      id: '2',
      code: 'CAR',
      name: 'Contractors All Risk Insurance',
      version: '1.2',
      category: 'CONSTRUCTION',
      owner: 'insurer',
      status: 'Active',
      linkedInsurers: 3,
      linkedBrokers: 2,
      createdDate: '2024-02-10T09:15:00Z',
      modifiedDate: '2024-03-15T11:20:00Z',
      createdBy: 'Admin User',
      icon: <Building className="w-5 h-5" />
    },
    {
      id: '3',
      code: 'PI',
      name: 'Professional Indemnity Insurance',
      version: '1.0',
      category: 'PROFESSIONAL',
      owner: 'broker',
      status: 'Active',
      linkedInsurers: 2,
      linkedBrokers: 1,
      createdDate: '2024-01-20T09:15:00Z',
      modifiedDate: '2024-02-10T11:20:00Z',
      createdBy: 'Admin User',
      icon: <User className="w-5 h-5" />
    },
    {
      id: '4',
      code: 'DO',
      name: 'Directors & Officers Liability Insurance',
      version: '1.0',
      category: 'COMMERCIAL',
      owner: 'insurer',
      status: 'Archived',
      linkedInsurers: 1,
      linkedBrokers: 0,
      createdDate: '2024-02-05T13:45:00Z',
      modifiedDate: '2024-02-05T13:45:00Z',
      createdBy: 'Admin User',
      icon: <Briefcase className="w-5 h-5" />
    }
  ];

  const handleProductClick = (productId: string) => {
    // TODO: Navigate to product details or configuration page
    toast({
      title: "Product Selected",
      description: `Product configuration will be implemented in the next step.`,
    });
  };

  const handleCreateProduct = () => {
    navigate("/market-admin/product-management/create");
  };

  const handleEditProduct = (product: InsuranceProduct) => {
    navigate(`/market-admin/product-management/create?productName=${encodeURIComponent(product.name)}&productVersion=${encodeURIComponent(product.version)}&edit=true`);
  };

  const handleCloneProduct = (product: InsuranceProduct) => {
    // TODO: Implement clone functionality
    toast({
      title: "Clone Product",
      description: `Cloning ${product.name} v${product.version}... Clone functionality will be implemented in the next step.`,
    });
  };

  const handleDeactivateProduct = (product: InsuranceProduct) => {
    // TODO: Implement deactivate functionality
    toast({
      title: "Deactivate Product",
      description: `Deactivating ${product.name} v${product.version}... Deactivate functionality will be implemented in the next step.`,
      variant: "destructive",
    });
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

  const getOwnerLabel = (owner: ProductOwner): string => {
    return owner === "broker" ? "Broker" : "Insurer";
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
          <div className="space-y-4">
            {insuranceProducts.map(product => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleProductClick(product.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        {product.icon}
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
                          {product.linkedInsurers > 0 && (
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>{product.linkedInsurers} insurer{product.linkedInsurers !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {product.linkedBrokers > 0 && (
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
                          <div className="flex items-center gap-1">
                            <UserCircle className="w-3 h-3" />
                            <span>{product.createdBy}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to CAR masters management for CAR products, otherwise to general masters
                              if (product.code === 'CAR') {
                                navigate('/market-admin/masters-management/car');
                              } else if (product.code === 'PI') {
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
                    <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
                      {product.status === "Active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeactivateProduct(product);
                          }}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Power className="w-4 h-4" />
                          Deactivate
                        </Button>
                      )}
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
                      >
                        <Copy className="w-4 h-4" />
                        Clone Product
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAdminProductManagement;

