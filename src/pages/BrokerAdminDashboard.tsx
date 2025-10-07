import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Footer } from "@/components/Footer";
import { Plus, FileText, Calendar, DollarSign, Building2, Shield, ArrowLeft, Users, UserPlus, Edit, Trash2, Settings, Eye } from "lucide-react";
import { QUOTE_STATUSES, getQuoteStatusLabel, getQuoteStatusColor, filterActiveQuotes } from "@/lib/quote-status";
import { formatDateShort } from "@/utils/date-format";
import { QuoteStatusDot } from "@/components/QuoteStatusDot";

// Mock data for all quotes across brokers
const mockAllQuotes = [
  {
    id: "Q001",
    clientName: "Al Habtoor Construction LLC",
    projectName: "Al Habtoor Tower Development",
    projectType: "Commercial",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 57,800",
    createdDate: "2024-01-15",
    validUntil: "2024-02-15",
    sumInsured: "AED 8,450,000",
    insurer: "Emirates Insurance",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q002", 
    clientName: "Emaar Properties",
    projectName: "Downtown Residential Complex",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 42,250",
    createdDate: "2024-01-12",
    validUntil: "2024-02-12",
    sumInsured: "AED 6,200,000",
    insurer: "AXA Gulf",
    broker: "Sarah Johnson"
  },
  {
    id: "Q003",
    clientName: "DAMAC Properties",
    projectName: "Marina Shopping Mall Renovation",
    projectType: "Commercial",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 91,200",
    createdDate: "2024-01-10",
    validUntil: "2024-02-10",
    sumInsured: "AED 14,800,000",
    insurer: "Oman Insurance",
    broker: "Mohammed Hassan"
  },
  {
    id: "Q004",
    clientName: "Nakheel Properties",
    projectName: "Palm Jumeirah Villa Complex",
    projectType: "Residential",
    status: QUOTE_STATUSES.POLICY_GENERATED,
    premium: "AED 73,500",
    createdDate: "2024-01-08",
    validUntil: "2024-02-08",
    sumInsured: "AED 11,200,000",
    insurer: "Takaful Emarat",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q007",
    clientName: "Dubai Municipality",
    projectName: "Public Infrastructure Project",
    projectType: "Infrastructure",
    status: QUOTE_STATUSES.PAYMENT_PENDING,
    premium: "AED 124,600",
    createdDate: "2024-01-05",
    validUntil: "2024-02-05",
    sumInsured: "AED 18,700,000",
    insurer: "National General Insurance",
    broker: "Sarah Johnson"
  }
];

// Mock data for broker admin's personal quotes
const mockMyQuotes = [
  {
    id: "Q005",
    clientName: "Dubai Construction Co.",
    projectName: "Business Bay Tower",
    projectType: "Commercial",
    status: QUOTE_STATUSES.POLICY_GENERATED,
    premium: "AED 85,400",
    createdDate: "2024-01-20",
    validUntil: "2024-02-20",
    sumInsured: "AED 12,300,000",
    insurer: "Emirates Insurance"
  },
  {
    id: "Q006",
    clientName: "Al Futtaim Group",
    projectName: "Mall of the Emirates Extension",
    projectType: "Commercial",
    status: QUOTE_STATUSES.PAYMENT_PENDING,
    premium: "AED 156,800",
    createdDate: "2024-01-18",
    validUntil: "2024-02-18",
    sumInsured: "AED 23,400,000",
    insurer: "AXA Gulf"
  }
];

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
    status: "active",
    quotesCount: 8,
    activePolicies: 3,
    joinDate: "2023-09-10",
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

const BrokerAdminDashboard = () => {
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  const [activeTab, setActiveTab] = useState("myquotes");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isAddInsurerDialogOpen, setIsAddInsurerDialogOpen] = useState(false);
  const [currentMyQuotePage, setCurrentMyQuotePage] = useState(1);
  const [currentAllQuotePage, setCurrentAllQuotePage] = useState(1);
  const [currentBrokerPage, setCurrentBrokerPage] = useState(1);
  const itemsPerPage = 5;
  const [newUser, setNewUser] = useState({
    name: "",
    email: ""
  });
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Pagination logic for My Quotes
  const activeMyQuotes = filterActiveQuotes(mockMyQuotes);
  const totalMyQuotePages = Math.ceil(activeMyQuotes.length / itemsPerPage);
  const startMyQuoteIndex = (currentMyQuotePage - 1) * itemsPerPage;
  const endMyQuoteIndex = startMyQuoteIndex + itemsPerPage;
  const currentMyQuotes = activeMyQuotes.slice(startMyQuoteIndex, endMyQuoteIndex);

  // Pagination logic for All Quotes
  const activeAllQuotes = filterActiveQuotes(mockAllQuotes);
  const totalAllQuotePages = Math.ceil(activeAllQuotes.length / itemsPerPage);
  const startAllQuoteIndex = (currentAllQuotePage - 1) * itemsPerPage;
  const endAllQuoteIndex = startAllQuoteIndex + itemsPerPage;
  const currentAllQuotes = activeAllQuotes.slice(startAllQuoteIndex, endAllQuoteIndex);

  // Pagination logic for Brokers
  const totalBrokerPages = Math.ceil(mockBrokers.length / itemsPerPage);
  const startBrokerIndex = (currentBrokerPage - 1) * itemsPerPage;
  const endBrokerIndex = startBrokerIndex + itemsPerPage;
  const currentBrokers = mockBrokers.slice(startBrokerIndex, endBrokerIndex);
  const [newInsurerCommission, setNewInsurerCommission] = useState({
    insurer: "",
    minCommission: "",
    maxCommission: ""
  });

  const handleAddUser = () => {
    // Mock add user functionality
    console.log("Adding user:", newUser);
    setIsAddUserDialogOpen(false);
    setNewUser({ name: "", email: "" });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = () => {
    // Mock update user functionality
    console.log("Updating user:", editingUser);
    setIsEditUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleAddInsurerCommission = () => {
    if (newInsurerCommission.insurer && newInsurerCommission.minCommission && newInsurerCommission.maxCommission) {
      const updatedCommissions = [...(editingUser.insurerCommissions || []), newInsurerCommission];
      setEditingUser({...editingUser, insurerCommissions: updatedCommissions});
      setNewInsurerCommission({ insurer: "", minCommission: "", maxCommission: "" });
      setIsAddInsurerDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  Market Admin Portal
                </h1>
                <p className="text-lg text-muted-foreground">
                  Manage brokers and oversee all contractor insurance operations
                </p>
              </div>
            </div>
             <div className="flex gap-3">
               <Button 
                 variant="outline"
                 size="lg"
                 className="gap-2"
                 onClick={() => navigate("/market-admin/insurer-management")}
               >
                 <Building2 className="w-5 h-5" />
                 Manage Insurers
               </Button>
               <Button 
                 size="lg"
                 className="gap-2"
                 onClick={() => navigate("/broker/product-selection")}
               >
                 <Plus className="w-5 h-5" />
                 Create New Quote
               </Button>
             </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Quotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{mockAllQuotes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Brokers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{mockBrokers.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {mockAllQuotes.filter(q => q.status === QUOTE_STATUSES.QUOTE_CONFIRMED || q.status === QUOTE_STATUSES.POLICY_GENERATED).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Premium Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">AED 264,750</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for My Quotes, All Quotes and User Management */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="myquotes" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                My Quotes
              </TabsTrigger>
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                All Broker Quotes
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Broker Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="myquotes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    My Quotes
                  </CardTitle>
                  <CardDescription>
                    View and manage your personal quotes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quote ID</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Project Type</TableHead>
                        <TableHead>Insurer</TableHead>
                        <TableHead>Sum Insured</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Quote Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Quote Validity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentMyQuotes.map((quote) => (
                        <TableRow 
                          key={quote.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/broker/quote/${quote.id}`)}
                        >
                          <TableCell className="font-medium">{quote.id}</TableCell>
                          <TableCell>{quote.clientName}</TableCell>
                          <TableCell>{quote.projectName}</TableCell>
                          <TableCell>{quote.projectType}</TableCell>
                          <TableCell className="font-medium text-primary">{quote.insurer}</TableCell>
                          <TableCell className="font-medium">{quote.sumInsured}</TableCell>
                          <TableCell className="font-medium text-primary">{quote.premium}</TableCell>
                           <TableCell>
                              <QuoteStatusDot status={quote.status} />
                           </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{quote.createdDate}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{quote.validUntil}</TableCell>
                           <TableCell className="text-right">
                             <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/broker/quote/${quote.id}`);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Details
                                </Button>
                               {(quote.status === QUOTE_STATUSES.POLICY_GENERATED || quote.status === QUOTE_STATUSES.PAYMENT_PENDING) && (
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     navigate(`/broker/policy/${quote.id}`);
                                   }}
                                 >
                                   View Policy
                                 </Button>
                               )}
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination for My Quotes */}
                  <div className="px-6 py-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentMyQuotePage > 1) setCurrentMyQuotePage(currentMyQuotePage - 1);
                            }}
                            className={currentMyQuotePage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {[...Array(totalMyQuotePages)].map((_, i) => (
                          <PaginationItem key={i + 1}>
                            <PaginationLink
                              href="#"
                              isActive={currentMyQuotePage === i + 1}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentMyQuotePage(i + 1);
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
                              if (currentMyQuotePage < totalMyQuotePages) setCurrentMyQuotePage(currentMyQuotePage + 1);
                            }}
                            className={currentMyQuotePage === totalMyQuotePages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quotes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    All Broker Quotes
                  </CardTitle>
                  <CardDescription>
                    View and manage quotes from all brokers in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quote ID</TableHead>
                        <TableHead>Broker</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Project Type</TableHead>
                        <TableHead>Insurer</TableHead>
                        <TableHead>Sum Insured</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Quote Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Quote Validity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentAllQuotes.map((quote) => (
                        <TableRow 
                          key={quote.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/broker/quote/${quote.id}`)}
                        >
                          <TableCell className="font-medium">{quote.id}</TableCell>
                          <TableCell className="font-medium text-primary">{quote.broker}</TableCell>
                          <TableCell>{quote.clientName}</TableCell>
                          <TableCell>{quote.projectName}</TableCell>
                          <TableCell>{quote.projectType}</TableCell>
                          <TableCell className="font-medium text-primary">{quote.insurer}</TableCell>
                          <TableCell className="font-medium">{quote.sumInsured}</TableCell>
                          <TableCell className="font-medium text-primary">{quote.premium}</TableCell>
                           <TableCell>
                              <QuoteStatusDot status={quote.status} />
                           </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{quote.createdDate}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{quote.validUntil}</TableCell>
                           <TableCell className="text-right">
                             <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/broker/quote/${quote.id}`);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Details
                                </Button>
                               {(quote.status === QUOTE_STATUSES.POLICY_GENERATED || quote.status === QUOTE_STATUSES.PAYMENT_PENDING) && (
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     navigate(`/broker/policy/${quote.id}`);
                                   }}
                                 >
                                   View Policy
                                 </Button>
                               )}
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination for All Quotes */}
                  <div className="px-6 py-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentAllQuotePage > 1) setCurrentAllQuotePage(currentAllQuotePage - 1);
                            }}
                            className={currentAllQuotePage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {[...Array(totalAllQuotePages)].map((_, i) => (
                          <PaginationItem key={i + 1}>
                            <PaginationLink
                              href="#"
                              isActive={currentAllQuotePage === i + 1}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentAllQuotePage(i + 1);
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
                              if (currentAllQuotePage < totalAllQuotePages) setCurrentAllQuotePage(currentAllQuotePage + 1);
                            }}
                            className={currentAllQuotePage === totalAllQuotePages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Broker Management
                      </CardTitle>
                      <CardDescription>
                        Manage brokers, their details, insurer products and commission rates
                      </CardDescription>
                    </div>
                    <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <UserPlus className="w-4 h-4" />
                          Add New Broker
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Broker</DialogTitle>
                          <DialogDescription>
                            Create a new broker account with access to the platform
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              value={newUser.name}
                              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                              placeholder="Enter full name"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              autoComplete="off"
                              value={newUser.email}
                              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                              placeholder="Enter email address"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddUser}>
                            Add Broker
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Quotes Count</TableHead>
                        <TableHead>Active Policies</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentBrokers.map((broker) => (
                        <TableRow key={broker.id}>
                          <TableCell className="font-medium">{broker.name}</TableCell>
                          <TableCell>{broker.email}</TableCell>
                          <TableCell>
                            <Badge className={getUserStatusColor(broker.status)}>
                              {broker.status.charAt(0).toUpperCase() + broker.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{broker.quotesCount}</TableCell>
                          <TableCell className="text-center">{broker.activePolicies}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{broker.joinDate}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditUser(broker)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination for Brokers */}
                  <div className="px-6 py-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentBrokerPage > 1) setCurrentBrokerPage(currentBrokerPage - 1);
                            }}
                            className={currentBrokerPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {[...Array(totalBrokerPages)].map((_, i) => (
                          <PaginationItem key={i + 1}>
                            <PaginationLink
                              href="#"
                              isActive={currentBrokerPage === i + 1}
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentBrokerPage(i + 1);
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
                              if (currentBrokerPage < totalBrokerPages) setCurrentBrokerPage(currentBrokerPage + 1);
                            }}
                            className={currentBrokerPage === totalBrokerPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Broker Details & Commission Management</DialogTitle>
            <DialogDescription>
              View and update broker information, insurer products and commission rates
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-6 py-4">
              {/* Broker Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Broker Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="editName">Full Name</Label>
                    <Input
                      id="editName"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editEmail">Email Address</Label>
                    <Input
                      id="editEmail"
                      type="email"
                      autoComplete="off"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editPhone">Phone Number</Label>
                    <Input
                      id="editPhone"
                      value={editingUser.phone}
                      onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editCompany">Company Name</Label>
                    <Input
                      id="editCompany"
                      value={editingUser.company}
                      onChange={(e) => setEditingUser({...editingUser, company: e.target.value})}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editLicense">License Number</Label>
                    <Input
                      id="editLicense"
                      value={editingUser.licenseNumber}
                      onChange={(e) => setEditingUser({...editingUser, licenseNumber: e.target.value})}
                      placeholder="Enter license number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="editStatus">Status</Label>
                    <Select 
                      value={editingUser.status} 
                      onValueChange={(value) => setEditingUser({...editingUser, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Insurer Commission Rates Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Insurer Commission Rates</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Insurer</TableHead>
                        <TableHead>Min Commission (%)</TableHead>
                        <TableHead>Max Commission (%)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editingUser.insurerCommissions?.map((commission: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{commission.insurer}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                className="w-20"
                                type="number"
                                value={commission.minCommission}
                                onChange={(e) => {
                                  const newCommissions = [...editingUser.insurerCommissions];
                                  newCommissions[index].minCommission = e.target.value;
                                  setEditingUser({...editingUser, insurerCommissions: newCommissions});
                                }}
                              />
                              <span>%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                className="w-20"
                                type="number"
                                value={commission.maxCommission}
                                onChange={(e) => {
                                  const newCommissions = [...editingUser.insurerCommissions];
                                  newCommissions[index].maxCommission = e.target.value;
                                  setEditingUser({...editingUser, insurerCommissions: newCommissions});
                                }}
                              />
                              <span>%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                const newCommissions = editingUser.insurerCommissions.filter((_: any, i: number) => i !== index);
                                setEditingUser({...editingUser, insurerCommissions: newCommissions});
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Dialog open={isAddInsurerDialogOpen} onOpenChange={setIsAddInsurerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Insurer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Insurer Commission</DialogTitle>
                      <DialogDescription>
                        Select an insurer and set min/max commission rates
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="selectInsurer">Select Insurer</Label>
                        <Select
                          value={newInsurerCommission.insurer}
                          onValueChange={(value) => setNewInsurerCommission({...newInsurerCommission, insurer: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an insurer" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableInsurers
                              .filter(insurer => !editingUser.insurerCommissions?.some((comm: any) => comm.insurer === insurer))
                              .map((insurer) => (
                                <SelectItem key={insurer} value={insurer}>
                                  {insurer}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="minCommission">Min Commission (%)</Label>
                          <Input
                            id="minCommission"
                            type="number"
                            placeholder="0"
                            value={newInsurerCommission.minCommission}
                            onChange={(e) => setNewInsurerCommission({...newInsurerCommission, minCommission: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="maxCommission">Max Commission (%)</Label>
                          <Input
                            id="maxCommission"
                            type="number"
                            placeholder="0"
                            value={newInsurerCommission.maxCommission}
                            onChange={(e) => setNewInsurerCommission({...newInsurerCommission, maxCommission: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddInsurerDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddInsurerCommission}>
                        Add Commission
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Statistics Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
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
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>
              Update Broker
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default BrokerAdminDashboard;