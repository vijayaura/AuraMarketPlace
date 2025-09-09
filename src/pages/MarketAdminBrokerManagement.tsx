import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Edit, Trash2, Users, Eye, Settings, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TableSearchFilter, FilterConfig } from "@/components/TableSearchFilter";
import { useTableSearch } from "@/hooks/useTableSearch";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { listBrokers, type Broker } from "@/lib/api";
import TableSkeleton from "@/components/loaders/TableSkeleton";

// Mock data for available insurers
const availableInsurers = [
  "Emirates Insurance",
  "AXA Gulf", 
  "Oman Insurance",
  "Takaful Emarat",
  "National General Insurance",
  "Dubai Insurance",
  "RAK Insurance",
  "Orient Insurance"
];

// Mock data for broker users
const mockBrokers = [
  {
    id: "B001",
    name: "Ahmed Al-Mansoori",
    email: "ahmed.almansoori@brokers.ae",
    status: "active",
    quotesCount: 15,
    activePolicies: 8,
    joinDate: "2023-03-15",
    statusSince: "2024-01-15",
    phone: "+971 50 123 4567",
    company: "Al-Mansoori Insurance Brokers",
    licenseNumber: "UAE-BRK-2023-001",
    insurerCommissions: [
      { insurer: "Emirates Insurance", minCommission: "10", maxCommission: "15" },
      { insurer: "AXA Gulf", minCommission: "12", maxCommission: "18" },
      { insurer: "Oman Insurance", minCommission: "8", maxCommission: "12" }
    ]
  },
  {
    id: "B002",
    name: "Sarah Johnson",
    email: "sarah.johnson@brokers.ae",
    status: "active",
    quotesCount: 12,
    activePolicies: 6,
    joinDate: "2023-06-20",
    statusSince: "2024-02-10",
    phone: "+971 55 987 6543",
    company: "Johnson Risk Management",
    licenseNumber: "UAE-BRK-2023-002",
    insurerCommissions: [
      { insurer: "Takaful Emarat", minCommission: "9", maxCommission: "14" },
      { insurer: "National General Insurance", minCommission: "6", maxCommission: "10" },
      { insurer: "Emirates Insurance", minCommission: "11", maxCommission: "16" }
    ]
  },
  {
    id: "B003",
    name: "Mohammed Hassan",
    email: "mohammed.hassan@brokers.ae",
    status: "inactive",
    quotesCount: 8,
    activePolicies: 3,
    joinDate: "2023-09-10",
    statusSince: "2024-03-20",
    phone: "+971 52 456 7890",
    company: "Hassan Insurance Services",
    licenseNumber: "UAE-BRK-2023-003",
    insurerCommissions: [
      { insurer: "AXA Gulf", minCommission: "11", maxCommission: "16" },
      { insurer: "Oman Insurance", minCommission: "7", maxCommission: "11" }
    ]
  }
];

const getUserStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-success text-success-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const MarketAdminBrokerManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isAddInsurerDialogOpen, setIsAddInsurerDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: ""
  });

  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await listBrokers();
        console.log('🔍 Fetched brokers data:', data);
        if (isMounted) setBrokers(data);
      } catch (err: any) {
        const status = err?.status;
        const friendly =
          status === 400 ? 'Invalid request while loading brokers.' :
          status === 401 ? 'Session expired. Please log in again.' :
          status === 403 ? 'You are not authorized to view brokers.' :
          status === 500 ? 'Server error while fetching brokers.' :
          err?.message || 'Failed to load brokers.';
        if (isMounted) setErrorMessage(friendly);
        toast({ title: 'Error', description: friendly });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Configure filters for brokers
  const brokerFilters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' }
      ]
    }
  ];

  // Use table search hook
  const {
    searchTerm,
    setSearchTerm,
    filters,
    filteredData: filteredBrokers,
    updateFilter,
    clearFilters
  } = useTableSearch({
    data: brokers,
    searchableFields: ['name', 'email', 'company', 'licenseNumber'],
    initialFilters: {}
  });

  const [newInsurerCommission, setNewInsurerCommission] = useState({
    insurer: "",
    minCommission: "",
    maxCommission: ""
  });

  const handleAddUser = () => {
    console.log("Adding user:", newUser);
    toast({
      title: "Broker Added",
      description: `Successfully added broker: ${newUser.name}`,
    });
    setIsAddUserDialogOpen(false);
    setNewUser({ name: "", email: "" });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = () => {
    showConfirmDialog(
      {
        title: "Save Changes",
        description: `Are you sure you want to save the changes to ${editingUser?.name}'s broker account?`,
        confirmText: "Save Changes"
      },
      () => {
        console.log("Updating user:", editingUser);
        toast({
          title: "Broker Updated",
          description: `Successfully updated broker: ${editingUser?.name}`,
        });
        setIsEditUserDialogOpen(false);
        setEditingUser(null);
      }
    );
  };

  const handleAddInsurerCommission = () => {
    if (newInsurerCommission.insurer && newInsurerCommission.minCommission && newInsurerCommission.maxCommission) {
      const updatedCommissions = [...(editingUser.insurerCommissions || []), newInsurerCommission];
      setEditingUser({...editingUser, insurerCommissions: updatedCommissions});
      toast({
        title: "Commission Added",
        description: `Successfully added commission rates for ${newInsurerCommission.insurer}`,
      });
      setNewInsurerCommission({ insurer: "", minCommission: "", maxCommission: "" });
      setIsAddInsurerDialogOpen(false);
    }
  };

  const availableInsurersForUser = availableInsurers.filter(
    insurer => !editingUser?.insurerCommissions?.some((comm: any) => comm.insurer === insurer)
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredBrokers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBrokers = filteredBrokers.slice(startIndex, endIndex);

  return (
    <div className="h-full bg-gradient-to-br from-background to-secondary/20 flex flex-col overflow-hidden">
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-full space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Broker Management
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage broker accounts and their commission structures
              </p>
            </div>
            <Button size="lg" className="gap-2" onClick={() => navigate("/market-admin/create-broker")}>
              <Plus className="w-4 h-4" />
              Add New Broker
            </Button>
          </div>

          {/* Brokers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Broker Management
              </CardTitle>
              <CardDescription>
                Manage broker accounts, view their statistics, and configure commission rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TableSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={brokerFilters}
                activeFilters={filters}
                onFilterChange={updateFilter}
                onClearFilters={clearFilters}
              />
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Broker Name</TableHead>
                      <TableHead className="min-w-[250px]">Admin Email</TableHead>
                      <TableHead className="min-w-[180px]">Contact Number</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[150px]">Join Date</TableHead>
                      <TableHead className="text-right min-w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton rowCount={5} colCount={6} />
                    ) : currentBrokers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="py-8 text-center text-muted-foreground">No brokers found.</div>
                        </TableCell>
                      </TableRow>
                    ) : currentBrokers.map((broker) => (
                       <TableRow key={broker.id} className={broker.status === 'inactive' ? 'opacity-50 text-muted-foreground' : ''}>
                         <TableCell className="font-medium">{broker.name}</TableCell>
                         <TableCell>{broker.adminEmail || '—'}</TableCell>
                         <TableCell>{broker.phone || '—'}</TableCell>
                         <TableCell>
                           <Badge className={getUserStatusColor(broker.status)}>
                             {broker.status}
                           </Badge>
                         </TableCell>
                         <TableCell>
                           <div className="text-sm text-muted-foreground">
                             {broker.joinDate ? new Date(broker.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                           </div>
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 console.log('🔍 Clicking edit for broker:', broker);
                                 console.log('🔍 Broker ID:', broker.id, 'Type:', typeof broker.id);
                                 navigate(`/market-admin/broker/${broker.id}/edit`);
                               }}
                             >
                               <Settings className="w-4 h-4 mr-2" />
                               Edit Details
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="px-6 py-4 border-t">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(i + 1);
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>

          {/* Edit Broker Dialog */}
          <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Broker Details & Commission Management</DialogTitle>
                <DialogDescription>
                  View broker details and manage commission rates for different insurers
                </DialogDescription>
              </DialogHeader>
              
              {editingUser && (
                <div className="grid gap-6 py-4">
                  {/* Broker Details Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Broker Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input value={editingUser.name} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={editingUser.email} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={editingUser.phone || "N/A"} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input value={editingUser.company || "N/A"} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>License Number</Label>
                        <Input value={editingUser.licenseNumber || "N/A"} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Badge className={`${getUserStatusColor(editingUser.status)} inline-flex w-fit`}>
                          {editingUser.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{editingUser.quotesCount}</div>
                          <div className="text-sm text-muted-foreground">Total Quotes</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{editingUser.activePolicies}</div>
                          <div className="text-sm text-muted-foreground">Active Policies</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{editingUser.joinDate}</div>
                          <div className="text-sm text-muted-foreground">Join Date</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Commission Management Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Insurer Commission Rates</h3>
                      <Dialog open={isAddInsurerDialogOpen} onOpenChange={setIsAddInsurerDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">Add Insurer</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Insurer Commission</DialogTitle>
                            <DialogDescription>
                              Set commission rates for a new insurer
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label>Insurer</Label>
                              <Select
                                value={newInsurerCommission.insurer}
                                onValueChange={(value) => 
                                  setNewInsurerCommission({...newInsurerCommission, insurer: value})
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an insurer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableInsurersForUser.map((insurer) => (
                                    <SelectItem key={insurer} value={insurer}>
                                      {insurer}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label>Min Commission (%)</Label>
                                <Input
                                  type="number"
                                  value={newInsurerCommission.minCommission}
                                  onChange={(e) => 
                                    setNewInsurerCommission({...newInsurerCommission, minCommission: e.target.value})
                                  }
                                  placeholder="0"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Max Commission (%)</Label>
                                <Input
                                  type="number"
                                  value={newInsurerCommission.maxCommission}
                                  onChange={(e) => 
                                    setNewInsurerCommission({...newInsurerCommission, maxCommission: e.target.value})
                                  }
                                  placeholder="0"
                                 />
                               </div>
                             </div>
                           </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsAddInsurerDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddInsurerCommission}>Add Commission</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="overflow-x-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[200px]">Insurer</TableHead>
                            <TableHead className="min-w-[150px]">Min Commission (%)</TableHead>
                            <TableHead className="min-w-[150px]">Max Commission (%)</TableHead>
                            <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editingUser.insurerCommissions?.map((commission: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{commission.insurer}</TableCell>
                              <TableCell>{commission.minCommission}%</TableCell>
                              <TableCell>{commission.maxCommission}%</TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateUser}>Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ConfirmDialog />
    </div>
  );
};

export default MarketAdminBrokerManagement;