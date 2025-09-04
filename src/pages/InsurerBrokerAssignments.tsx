import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Calculator, Download, Upload, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { getInsurerCompanyId } from "@/lib/auth";
import { getInsurerBrokerAssignments, toggleBrokerStatus, getBrokerAssignedProducts, updateBrokerProductAssignments, type BrokerAssignment, type BrokerProductAssignment } from "@/lib/api/insurers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TableSkeleton } from "@/components/loaders/TableSkeleton";
const InsurerBrokerAssignments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // API state
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [brokersData, setBrokersData] = useState<BrokerAssignment[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const insurerId = getInsurerCompanyId();
        if (!insurerId) throw new Error('Missing insurer company id');
        const list = await getInsurerBrokerAssignments(insurerId);
        if (isMounted) setBrokersData(list);
      } catch (err: any) {
        const status = err?.status as number | undefined;
        const message = err?.message as string | undefined;
        if (status === 400) setErrorMessage(message || 'Bad request.');
        else if (status === 401) setErrorMessage('You are not authenticated. Please log in.');
        else if (status === 403) setErrorMessage("You don't have permission to view this page.");
        else if (status && status >= 500) setErrorMessage('Server error. Please try again later.');
        else setErrorMessage(message || 'Failed to load broker assignments.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

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
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [brokerProducts, setBrokerProducts] = useState<Record<number, BrokerProductAssignment[]>>({});
  const [savingAssignments, setSavingAssignments] = useState<boolean>(false);

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
    if (!broker) return;
    setConfirmDialog({
      open: true,
      brokerId: brokerId,
      brokerName: broker.name,
      currentStatus: broker.isActive
    });
  };
  const [toggling, setToggling] = useState<boolean>(false);
  const confirmToggleBrokerStatus = async () => {
    const { brokerId, currentStatus } = confirmDialog;
    if (!brokerId) return;
    const insurerId = getInsurerCompanyId();
    if (!insurerId) return;
    try {
      setToggling(true);
      const resp = await toggleBrokerStatus(insurerId, brokerId, !currentStatus);
      setBrokersData(prev => prev.map(b => b.id === brokerId ? { ...b, isActive: !currentStatus, status: resp.status } : b));
      toast({
        title: resp.status === 'active' ? 'Broker Activated' : 'Broker Deactivated',
        description: `${confirmDialog.brokerName} has been ${resp.status === 'active' ? 'activated' : 'deactivated'}.`
      });
    } catch (err: any) {
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      if (status === 400) toast({ title: 'Bad request', description: message || 'Please try again.' });
      else if (status === 401) toast({ title: 'Unauthorized', description: 'Please log in again.' });
      else if (status === 403) toast({ title: 'Forbidden', description: "You don't have permission." });
      else if (status && status >= 500) toast({ title: 'Server error', description: 'Please try again later.' });
      else toast({ title: 'Error', description: message || 'Failed to update status.' });
    } finally {
      setToggling(false);
      setConfirmDialog({ open: false, brokerId: null, brokerName: "", currentStatus: false });
    }
  };
  const toggleProductAssignment = (brokerId: number, productId: number) => {
    setBrokerProducts(prev => {
      const list = prev[brokerId] || [];
      const next = list.map(p => p.productId === productId ? { ...p, assigned: !p.assigned } : p);
      return { ...prev, [brokerId]: next };
    });
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

  // Save product assignments for a broker
  const saveProductAssignments = async (brokerId: number) => {
    if (!selectedBroker || selectedBroker !== brokerId) return;
    
    const insurerId = getInsurerCompanyId();
    if (!insurerId) {
      toast({
        title: "Error",
        description: "Missing insurer ID. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Saving product assignments for broker:', brokerId);
      setSavingAssignments(true);
      setProductsError(null);

      // Get assigned product IDs from the current state
      const assignedProductIds = (brokerProducts[brokerId] || [])
        .filter(product => product.assigned)
        .map(product => product.productId);

      console.log('📦 Assigned product IDs:', assignedProductIds);

      // Call the PUT API
      const response = await updateBrokerProductAssignments(insurerId, brokerId, {
        assigned_product_ids: assignedProductIds
      });

      console.log('✅ Product assignments saved successfully:', response);

      // Update the broker's product count in the main table
      setBrokersData(prev => prev.map(broker => 
        broker.id === brokerId 
          ? { ...broker, productsAssigned: response.assigned_product_ids.length }
          : broker
      ));

      toast({
        title: "Assignments Saved",
        description: response.message || "Product assignments have been saved successfully!",
        variant: "default",
      });

    } catch (err: any) {
      console.error('❌ Error saving product assignments:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      let errorMessage = 'Failed to save product assignments.';
      if (status === 400) errorMessage = message || 'Bad request. Please check the data.';
      else if (status === 401) errorMessage = 'Unauthorized. Please log in again.';
      else if (status === 403) errorMessage = 'Forbidden. You do not have permission.';
      else if (status && status >= 500) errorMessage = 'Server error. Please try again later.';
      else if (message) errorMessage = message;
      
      setProductsError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSavingAssignments(false);
    }
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
            {/* Removed page-level Save button; saving is done inside the product assignments dialog */}
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
                    {loading && <TableSkeleton rowCount={5} colCount={5} />}
                    {errorMessage && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Alert variant="destructive">
                            <AlertTitle>Failed to load</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                          </Alert>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loading && !errorMessage && brokersData.map(broker => <TableRow key={broker.id} className={!broker.isActive ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{broker.name}</TableCell>
                        <TableCell>{broker.email || '-'}</TableCell>
                        <TableCell>{broker.licenseNumber || '-'}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={async () => {
                                setSelectedBroker(broker.id);
                                const insurerId = getInsurerCompanyId();
                                if (!insurerId) return;
                                setProductsLoading(true);
                                setProductsError(null);
                                try {
                                  const assigned = await getBrokerAssignedProducts(insurerId, broker.id);
                                  setBrokerProducts(prev => ({ ...prev, [broker.id]: assigned }));
                                } catch (err: any) {
                                  const status = err?.status as number | undefined;
                                  const message = err?.message as string | undefined;
                                  if (status === 400) setProductsError(message || 'Bad request while loading products.');
                                  else if (status === 401) setProductsError('Unauthorized. Please log in again.');
                                  else if (status === 403) setProductsError("You don't have access to these products.");
                                  else if (status && status >= 500) setProductsError('Server error. Please try again later.');
                                  else setProductsError(message || 'Failed to load assigned products.');
                                } finally {
                                  setProductsLoading(false);
                                }
                              }}>
                                <Package className="w-4 h-4 mr-2" />
                                {broker.productsAssigned} Products
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader className="pr-10">
                                <div className="flex items-center justify-between gap-4">
                                  <DialogTitle className="flex-1">Product Assignments - {broker.name}</DialogTitle>
                                </div>
                              </DialogHeader>
                              <div className="mt-4">
                                {productsError && (
                                  <Alert variant="destructive" className="mb-3">
                                    <AlertTitle>Failed to load products</AlertTitle>
                                    <AlertDescription>{productsError}</AlertDescription>
                                  </Alert>
                                )}
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead className="text-center">Assigned</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {productsLoading && <TableSkeleton rowCount={3} colCount={2} />}
                                    {!productsLoading && (brokerProducts[broker.id] || []).map(item => (
                                      <TableRow key={item.productId}>
                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                        <TableCell className="text-center">
                                          <Checkbox checked={!!item.assigned} disabled={!item.isActive} onCheckedChange={() => toggleProductAssignment(broker.id, item.productId)} />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline" disabled={savingAssignments}>Cancel</Button>
                                </DialogClose>
                                <Button 
                                  className="bg-primary hover:bg-primary/90" 
                                  onClick={() => saveProductAssignments(broker.id)}
                                  disabled={savingAssignments}
                                >
                                  {savingAssignments ? "Saving..." : "Save"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant={broker.isActive ? "default" : "secondary"} className={broker.isActive ? "bg-green-100 text-green-800" : ""}>
                              {broker.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Switch checked={broker.isActive} onCheckedChange={() => handleToggleRequest(broker.id)} disabled={toggling} />
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