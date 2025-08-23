import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Save, Calculator, Download, Upload, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
const InsurerBrokerAssignments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Mock data for brokers
  const [brokersData, setBrokersData] = useState([{
    id: 1,
    name: "Gulf Insurance Brokers",
    email: "info@gulfbrokers.ae",
    license: "BRK-001-2024",
    isActive: true,
    status: "Active",
    productsAssigned: 2
  }, {
    id: 2,
    name: "Emirates Risk Management",
    email: "contact@emiratesrisk.com",
    license: "BRK-002-2024",
    isActive: true,
    status: "Active",
    productsAssigned: 1
  }, {
    id: 3,
    name: "Dubai Insurance Services",
    email: "hello@dubaiinsurance.ae",
    license: "BRK-003-2024",
    isActive: false,
    status: "Active",
    productsAssigned: 0
  }, {
    id: 4,
    name: "Al Khaleej Insurance Brokers",
    email: "info@alkhaleejbrokers.com",
    license: "BRK-004-2024",
    isActive: false,
    status: "Inactive",
    productsAssigned: 0
  }, {
    id: 5,
    name: "Middle East Insurance Partners",
    email: "partners@meipartners.ae",
    license: "BRK-005-2024",
    isActive: true,
    status: "Active",
    productsAssigned: 2
  }]);

  // Mock data for products
  const [productsData] = useState([{
    id: 1,
    name: "CAR Insurance",
    minCommission: 2.0,
    maxCommission: 5.0
  }, {
    id: 2,
    name: "Personal Indemnity Insurance",
    minCommission: 1.5,
    maxCommission: 4.0
  }]);

  // State for product assignment dialog
  const [selectedBroker, setSelectedBroker] = useState<number | null>(null);
  const [brokerProducts, setBrokerProducts] = useState<{
    [brokerId: number]: {
      [productId: number]: {
        assigned: boolean;
        minCommission: number;
        maxCommission: number;
      };
    };
  }>({
    1: {
      1: {
        assigned: true,
        minCommission: 2.0,
        maxCommission: 5.0
      },
      2: {
        assigned: true,
        minCommission: 1.5,
        maxCommission: 4.0
      }
    },
    2: {
      1: {
        assigned: true,
        minCommission: 2.0,
        maxCommission: 5.0
      }
    },
    5: {
      1: {
        assigned: true,
        minCommission: 2.0,
        maxCommission: 5.0
      },
      2: {
        assigned: true,
        minCommission: 1.5,
        maxCommission: 4.0
      }
    }
  });

  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    brokerId: number | null;
    brokerName: string;
    currentStatus: boolean;
  }>({
    open: false,
    brokerId: null,
    brokerName: "",
    currentStatus: false
  });
  const handleToggleRequest = (brokerId: number) => {
    const broker = brokersData.find(b => b.id === brokerId);
    if (broker) {
      setConfirmDialog({
        open: true,
        brokerId: brokerId,
        brokerName: broker.name,
        currentStatus: broker.isActive
      });
    }
  };
  const confirmToggleBrokerStatus = () => {
    const {
      brokerId
    } = confirmDialog;
    if (brokerId) {
      setBrokersData(prev => prev.map(broker => broker.id === brokerId ? {
        ...broker,
        isActive: !broker.isActive,
        status: !broker.isActive ? "Active" : "Inactive"
      } : broker));
      const broker = brokersData.find(b => b.id === brokerId);
      toast({
        title: broker?.isActive ? "Broker Deactivated" : "Broker Activated",
        description: `${broker?.name} has been ${broker?.isActive ? 'deactivated' : 'activated'}.`
      });
    }
    setConfirmDialog({
      open: false,
      brokerId: null,
      brokerName: "",
      currentStatus: false
    });
  };
  const toggleProductAssignment = (brokerId: number, productId: number) => {
    setBrokerProducts(prev => {
      const current = prev[brokerId]?.[productId]?.assigned || false;
      const product = productsData.find(p => p.id === productId);
      return {
        ...prev,
        [brokerId]: {
          ...prev[brokerId],
          [productId]: {
            assigned: !current,
            minCommission: product?.minCommission || 0,
            maxCommission: product?.maxCommission || 0
          }
        }
      };
    });

    // Update products assigned count
    setBrokersData(prev => prev.map(broker => {
      if (broker.id === brokerId) {
        const assignedCount = Object.values(brokerProducts[brokerId] || {}).filter(p => p.assigned).length;
        const newCount = brokerProducts[brokerId]?.[productId]?.assigned ? assignedCount - 1 : assignedCount + 1;
        return {
          ...broker,
          productsAssigned: newCount
        };
      }
      return broker;
    }));
  };
  const updateProductCommission = (brokerId: number, productId: number, field: 'minCommission' | 'maxCommission', value: number) => {
    setBrokerProducts(prev => ({
      ...prev,
      [brokerId]: {
        ...prev[brokerId],
        [productId]: {
          ...prev[brokerId]?.[productId],
          [field]: value
        }
      }
    }));
  };
  const downloadTemplate = () => {
    toast({
      title: "Template Downloaded",
      description: "Excel template has been downloaded successfully."
    });
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File Uploaded",
        description: `${file.name} has been uploaded successfully.`
      });
    }
  };
  const saveConfiguration = () => {
    showConfirmDialog(
      {
        title: "Save Configuration",
        description: "Are you sure you want to save the broker assignments and commission rates?",
        confirmText: "Save Configuration"
      },
      () => {
        toast({
          title: "Configuration Saved",
          description: "Broker assignments and commission rates have been successfully saved."
        });
      }
    );
  };
  return <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Broker Assignments
              </h1>
              <p className="text-sm text-muted-foreground">Configure broker settings and commission structure</p>
            </div>
            <Button onClick={saveConfiguration} className="bg-primary hover:bg-primary/90">
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Broker Management Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <Calculator className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Broker Assignments</CardTitle>
                    <CardDescription>
                      Manage broker status and product assignments
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Excel
                  </Button>
                  <input id="file-upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broker Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Products Assigned</TableHead>
                      <TableHead className="text-center">Status / Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brokersData.map(broker => <TableRow key={broker.id} className={!broker.isActive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{broker.name}</TableCell>
                        <TableCell>{broker.email}</TableCell>
                        <TableCell>{broker.license}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedBroker(broker.id)}>
                                <Package className="w-4 h-4 mr-2" />
                                {broker.productsAssigned} Products
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader className="pr-10">
                                <div className="flex items-center justify-between gap-4">
                                  <DialogTitle className="flex-1">Product Assignments - {broker.name}</DialogTitle>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button variant="outline" size="sm" onClick={downloadTemplate}>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download Template
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => document.getElementById('product-file-upload')?.click()}>
                                      <Upload className="w-4 h-4 mr-2" />
                                      Upload Excel
                                    </Button>
                                    <input id="product-file-upload" type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                                  </div>
                                </div>
                              </DialogHeader>
                              <div className="mt-4">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-center">Assigned</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                  <TableBody>
                                    {productsData.map(product => {
                                  const assignment = brokerProducts[broker.id]?.[product.id];
                                  const isAssigned = assignment?.assigned || false;
                                  return <TableRow key={product.id}>
                                          <TableCell className="font-medium">{product.name}</TableCell>
                                          <TableCell className="text-center">
                                            <Checkbox checked={isAssigned} onCheckedChange={() => toggleProductAssignment(broker.id, product.id)} />
                                          </TableCell>
                                        </TableRow>;
                                })}
                                  </TableBody>
                                </Table>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant={broker.isActive ? "default" : "secondary"} className={broker.isActive ? "bg-green-100 text-green-800" : ""}>
                              {broker.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Switch checked={broker.isActive} onCheckedChange={() => handleToggleRequest(broker.id)} />
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={open => setConfirmDialog(prev => ({
      ...prev,
      open
    }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmDialog.currentStatus ? 'deactivate' : 'activate'} <strong>{confirmDialog.brokerName}</strong>?
              {confirmDialog.currentStatus ? ' This will prevent them from accessing the system.' : ' This will allow them to access the system.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog({
            open: false,
            brokerId: null,
            brokerName: "",
            currentStatus: false
          })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleBrokerStatus}>
              {confirmDialog.currentStatus ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog />

      <Footer />
    </div>;
};
export default InsurerBrokerAssignments;