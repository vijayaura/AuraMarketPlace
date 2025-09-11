import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, FileText, Calendar, DollarSign, Building2, Shield, Download, Search, Filter, Eye, AlertTriangle } from "lucide-react";
import * as XLSX from 'xlsx';
import { QUOTE_STATUSES, getQuoteStatusLabel, getQuoteStatusColor, filterActiveQuotes } from "@/lib/quote-status";
import { QuoteStatusDot } from "@/components/QuoteStatusDot";
import { TableSearchFilter, FilterConfig } from "@/components/TableSearchFilter";
import { useTableSearch } from "@/hooks/useTableSearch";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import { getBrokerDashboardQuotes, getBrokerDashboardPolicies, type BrokerDashboardQuotesResponse, type BrokerDashboardPoliciesResponse } from "@/lib/api";

// Mock data for demonstration - expanded to 15+ entries
const mockQuotes = [
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
    insurer: "Axa Insurance"
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
    insurer: "Allianz Insurance"
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
    insurer: "Dubai Insurance"
  },
  {
    id: "Q004",
    clientName: "Nakheel Properties",
    projectName: "Palm Jumeirah Villa Complex",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_EDITED,
    premium: "AED 73,500",
    createdDate: "2024-01-08",
    validUntil: "2024-02-08",
    sumInsured: "AED 11,200,000",
    insurer: "Emirates Insurance"
  },
  {
    id: "Q005",
    clientName: "Dubai Municipality",
    projectName: "Public Infrastructure Project",
    projectType: "Infrastructure",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 124,600",
    createdDate: "2024-01-05",
    validUntil: "2024-02-05",
    sumInsured: "AED 18,700,000",
    insurer: "Axa Insurance"
  },
  {
    id: "Q006",
    clientName: "Meraas Holding",
    projectName: "Bluewaters Island Resort",
    projectType: "Hospitality",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 186,400",
    createdDate: "2024-01-20",
    validUntil: "2024-02-20",
    sumInsured: "AED 28,500,000",
    insurer: "Allianz Insurance"
  },
  {
    id: "Q007",
    clientName: "Dubai Holding",
    projectName: "Business Bay Office Complex",
    projectType: "Commercial",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 95,700",
    createdDate: "2024-01-18",
    validUntil: "2024-02-18",
    sumInsured: "AED 15,200,000",
    insurer: "Dubai Insurance"
  },
  {
    id: "Q008",
    clientName: "Sobha Realty",
    projectName: "Sobha Hartland Towers",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 67,300",
    createdDate: "2024-01-25",
    validUntil: "2024-02-25",
    sumInsured: "AED 9,800,000",
    insurer: "Emirates Insurance"
  },
  {
    id: "Q009",
    clientName: "Majid Al Futtaim",
    projectName: "City Centre Expansion",
    projectType: "Retail",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 143,900",
    createdDate: "2024-01-22",
    validUntil: "2024-02-22",
    sumInsured: "AED 21,800,000",
    insurer: "Oman Insurance"
  },
  {
    id: "Q010",
    clientName: "Aldar Properties",
    projectName: "Yas Island Development",
    projectType: "Mixed Use",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 205,600",
    createdDate: "2024-01-28",
    validUntil: "2024-02-28",
    sumInsured: "AED 32,400,000",
    insurer: "Axa Insurance"
  },
  {
    id: "Q011",
    clientName: "RAK Properties",
    projectName: "Al Hamra Village Phase 3",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 78,900",
    createdDate: "2024-02-01",
    validUntil: "2024-03-01",
    sumInsured: "AED 12,100,000",
    insurer: "Allianz Insurance"
  },
  {
    id: "Q012",
    clientName: "Eagle Hills",
    projectName: "Sharjah Waterfront City",
    projectType: "Waterfront",
    status: QUOTE_STATUSES.QUOTE_EDITED,
    premium: "AED 167,200",
    createdDate: "2024-02-03",
    validUntil: "2024-03-03",
    sumInsured: "AED 25,600,000",
    insurer: "Dubai Insurance"
  }
];

const mockPolicies = [
  {
    id: "P001",
    policyNumber: "POL-2024-001",
    clientName: "Al Habtoor Construction LLC",
    projectName: "Marina Bay Complex",
    projectType: "Commercial",
    premium: "AED 45,200",
    startDate: "2024-01-01",
    endDate: "2025-01-01",
    status: "active",
    sumInsured: "AED 6,800,000",
    insurer: "Axa Insurance"
  },
  {
    id: "P002",
    policyNumber: "POL-2024-002",
    clientName: "Emaar Properties",
    projectName: "Creek Harbour Towers",
    projectType: "Residential",
    premium: "AED 89,500",
    startDate: "2024-01-15",
    endDate: "2025-01-15",
    status: "active",
    sumInsured: "AED 13,200,000",
    insurer: "Allianz Insurance"
  },
  {
    id: "P003",
    policyNumber: "POL-2024-003",
    clientName: "DAMAC Properties",
    projectName: "DAMAC Hills Shopping Center",
    projectType: "Retail",
    premium: "AED 76,800",
    startDate: "2024-02-01",
    endDate: "2025-02-01",
    status: "active",
    sumInsured: "AED 11,400,000",
    insurer: "Dubai Insurance"
  },
  {
    id: "P004",
    policyNumber: "POL-2024-004",
    clientName: "Nakheel Properties",
    projectName: "The Pointe Apartments",
    projectType: "Residential",
    premium: "AED 112,300",
    startDate: "2024-01-20",
    endDate: "2025-01-20",
    status: "active",
    sumInsured: "AED 16,800,000",
    insurer: "Emirates Insurance"
  },
  {
    id: "P005",
    policyNumber: "POL-2024-005",
    clientName: "Meraas Holding",
    projectName: "La Mer Beachfront",
    projectType: "Hospitality",
    premium: "AED 134,700",
    startDate: "2024-02-10",
    endDate: "2025-02-10",
    status: "active",
    sumInsured: "AED 20,200,000",
    insurer: "Oman Insurance"
  }
];

const exportQuotesToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(mockQuotes);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Quotes");
  XLSX.writeFile(workbook, "broker_quotes.xlsx");
};

const exportPoliciesToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(recentPolicies);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Policies");
  XLSX.writeFile(workbook, "broker_policies.xlsx");
};

export default function BrokerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("quotes");
  const [currentQuotePage, setCurrentQuotePage] = useState(1);
  const [currentPolicyPage, setCurrentPolicyPage] = useState(1);
  const itemsPerPage = 10; // Increased from 5 to 10 to show more quotes per page
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quotesData, setQuotesData] = useState<BrokerDashboardQuotesResponse | null>(null);
  const [policiesData, setPoliciesData] = useState<BrokerDashboardPoliciesResponse | null>(null);
  const [policiesLoading, setPoliciesLoading] = useState<boolean>(false);
  const [policiesError, setPoliciesError] = useState<string | null>(null);

  // Fetch dashboard data function
  const fetchDashboardData = async () => {
    try {
      console.log('🚀 Fetching broker dashboard data...');
      setIsLoading(true);
      setLoadError(null);
      const data = await getBrokerDashboardQuotes();
      console.log('✅ Broker dashboard data fetched successfully:', data);
      console.log('📊 API Response details:', {
        totalQuotes: data.totalQuotes,
        recentQuotesCount: data.recentQuotes?.length || 0,
        sampleQuote: data.recentQuotes?.[0] || null
      });
      setQuotesData(data);
    } catch (err: any) {
      console.error('❌ Error fetching broker dashboard data:', err);
      const status = err?.status;
      const friendly =
        status === 400 ? 'Invalid request while loading quotes.' :
        status === 401 ? 'Session expired. Please log in again.' :
        status === 403 ? 'You are not authorized to view this dashboard.' :
        status === 500 ? 'Server error while fetching quotes.' :
        (err?.message || 'Failed to load quotes.');
      setLoadError(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch policies data function
  const fetchPoliciesData = async () => {
    try {
      console.log('🚀 Fetching broker policies data...');
      setPoliciesLoading(true);
      setPoliciesError(null);
      const data = await getBrokerDashboardPolicies();
      console.log('✅ Broker policies data fetched successfully:', data);
      setPoliciesData(data);
    } catch (err: any) {
      console.error('❌ Error fetching broker policies data:', err);
      const status = err?.status;
      const friendly =
        status === 400 ? 'Invalid request while loading policies.' :
        status === 401 ? 'Session expired. Please log in again.' :
        status === 403 ? 'You are not authorized to view policies.' :
        status === 500 ? 'Server error while fetching policies.' :
        (err?.message || 'Failed to load policies.');
      setPoliciesError(friendly);
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Fetch dashboard data when component mounts (since default tab is "quotes")
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch dashboard data when tabs are selected
  useEffect(() => {
    if (activeTab === "quotes") {
      console.log('📊 Quote Requests tab clicked - fetching broker dashboard data...');
      fetchDashboardData();
    } else if (activeTab === "policies") {
      console.log('📋 Policies tab clicked - fetching broker policies data...');
      fetchPoliciesData();
    }
  }, [activeTab]);

  // Filter active quotes
  const recentQuotes = (quotesData?.recentQuotes || []).map(q => ({
    id: q.id,
    clientName: q.client_name,
    projectName: q.project_name,
    projectType: q.project_type,
    status: q.status as any,
    premium: q.base_premium ? `AED ${Number(q.base_premium).toLocaleString()}` : '-',
    createdDate: q.created_at?.slice(0,10),
    validUntil: q.validity_date?.slice(0,10),
    sumInsured: q.total_premium ? `AED ${Number(q.total_premium).toLocaleString()}` : '-',
    insurer: '-', // API doesn't include insurer_name field
    quoteId: q.quote_id,
  }));
  // Temporarily disable filtering to see all quotes for debugging
  const activeQuotes = recentQuotes; // filterActiveQuotes(recentQuotes);
  
  // Debug logging
  console.log('🔍 Debug pagination:', {
    totalQuotes: recentQuotes.length,
    activeQuotes: activeQuotes.length,
    filteredQuotes: filteredQuotes.length,
    totalPages: Math.ceil(filteredQuotes.length / itemsPerPage),
    currentPage: currentQuotePage,
    itemsPerPage,
    currentQuotes: currentQuotes.length,
    quotesData: quotesData?.recentQuotes?.length || 0
  });
  
  // Log sample quotes for debugging
  if (recentQuotes.length > 0) {
    console.log('📋 Sample quotes:', recentQuotes.slice(0, 3));
  }

  // Map policies data
  const recentPolicies = (policiesData?.issuedPolicies || []).map(p => ({
    id: p.id,
    policyNumber: p.policyNumber,
    projectName: p.projectName,
    projectType: p.projectType,
    insurer: p.insurer,
    sumInsured: p.sumInsured,
    premium: p.premium,
    startDate: p.startDate,
    endDate: p.endDate,
    status: p.status,
    clientName: p.clientName || '-',
  }));

  // Configure filters for quotes
  const quoteFilters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: QUOTE_STATUSES.QUOTE_GENERATED, label: 'Quote Generated' },
        { value: QUOTE_STATUSES.QUOTE_CONFIRMED, label: 'Quote Confirmed' },
        { value: QUOTE_STATUSES.SELECTED_PRODUCT, label: 'Product Selected' },
        { value: QUOTE_STATUSES.QUOTE_EDITED, label: 'Quote Edited' }
      ]
    },
    {
      key: 'createdDate',
      label: 'Created Date',
      type: 'date'
    }
  ];

  // Configure filters for policies
  const policyFilters: FilterConfig[] = [
    {
      key: 'insurer',
      label: 'Insurer',
      type: 'select',
      options: [
        { value: 'Axa Insurance', label: 'Axa Insurance' },
        { value: 'Allianz Insurance', label: 'Allianz Insurance' },
        { value: 'Dubai Insurance', label: 'Dubai Insurance' },
        { value: 'Emirates Insurance', label: 'Emirates Insurance' },
        { value: 'Oman Insurance', label: 'Oman Insurance' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'expired', label: 'Expired' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'date'
    }
  ];

  // Use table search hooks
  const {
    searchTerm: quoteSearchTerm,
    setSearchTerm: setQuoteSearchTerm,
    filters: quoteFiltersState,
    filteredData: filteredQuotes,
    updateFilter: updateQuoteFilter,
    clearFilters: clearQuoteFilters
  } = useTableSearch({
    data: activeQuotes,
    searchableFields: ['quoteId', 'projectName'],
    initialFilters: {}
  });

  const {
    searchTerm: policySearchTerm,
    setSearchTerm: setPolicySearchTerm,
    filters: policyFiltersState,
    filteredData: filteredPolicies,
    updateFilter: updatePolicyFilter,
    clearFilters: clearPolicyFilters
  } = useTableSearch({
    data: recentPolicies,
    searchableFields: ['policyNumber', 'projectName', 'insurer'],
    initialFilters: {}
  });

  // Pagination for quotes
  const totalQuotePages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const startQuoteIndex = (currentQuotePage - 1) * itemsPerPage;
  const endQuoteIndex = startQuoteIndex + itemsPerPage;
  const currentQuotes = filteredQuotes.slice(startQuoteIndex, endQuoteIndex);

  // Pagination for policies
  const totalPolicyPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const startPolicyIndex = (currentPolicyPage - 1) * itemsPerPage;
  const endPolicyIndex = startPolicyIndex + itemsPerPage;
  const currentPolicies = filteredPolicies.slice(startPolicyIndex, endPolicyIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">CAR Dashboard</h1>
            <p className="text-muted-foreground">Insurance broker management overview</p>
          </div>
          <Button 
            className="gap-2"
            onClick={() => navigate("/customer/proposal?new=true")}
          >
            <Plus className="w-4 h-4" />
            Create New Quote
          </Button>
        </div>

        {/* Error Banner */}
        {loadError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Failed to load dashboard data</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Quotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {quotesData?.totalQuotes !== undefined ? quotesData.totalQuotes : mockQuotes.length}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Quotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {quotesData?.totalActiveQuotes !== undefined ? quotesData.totalActiveQuotes : activeQuotes.length}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {policiesData?.totalPolicies !== undefined ? policiesData.totalPolicies : 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Premium Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  AED {Number(quotesData?.totalPremiumValue || 0).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Quotes and Policies */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Quotes
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Policies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Recent Quotes
                    </CardTitle>
                    <CardDescription>
                      Manage and track all contractor insurance quotes
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportQuotesToExcel}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Controls */}
                <TableSearchFilter
                  searchTerm={quoteSearchTerm}
                  onSearchChange={setQuoteSearchTerm}
                  searchPlaceholder="Search quotes by client name, project, or quote ID..."
                  filters={quoteFilters}
                  activeFilters={quoteFiltersState}
                  onFilterChange={updateQuoteFilter}
                  onClearFilters={clearQuoteFilters}
                />
                
                {isLoading ? (
                  <Table>
                    <TableSkeleton rows={6} cols={9} />
                  </Table>
                ) : loadError ? (
                  <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">{loadError}</div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Quote ID</TableHead>
                      <TableHead className="w-[120px]">Project Name</TableHead>
                      <TableHead className="w-[140px]">Sum Insured</TableHead>
                      <TableHead className="w-[120px]">Premium</TableHead>
                      <TableHead className="w-[130px]">Quote Status</TableHead>
                      <TableHead className="w-[100px]">Created</TableHead>
                      <TableHead className="w-[120px]">Quote Validity</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentQuotes.map((quote) => (
                      <TableRow 
                        key={quote.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/broker/quote/${quote.id}`)}
                      >
                        <TableCell className="font-medium w-[120px]">{quote.quoteId}</TableCell>
                        <TableCell className="w-[120px] truncate" title={quote.projectName}>
                          {quote.projectName.length > 15 ? `${quote.projectName.substring(0, 15)}...` : quote.projectName}
                        </TableCell>
                        <TableCell className="font-medium w-[140px]">{quote.sumInsured}</TableCell>
                        <TableCell className="font-medium text-primary w-[120px]">{quote.premium}</TableCell>
                        <TableCell className="w-[130px]">
                          <QuoteStatusDot status={quote.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground w-[100px]">{quote.createdDate}</TableCell>
                        <TableCell className="text-sm text-muted-foreground w-[120px]">{quote.validUntil}</TableCell>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
                
                {/* Debug Info - Remove after fixing */}
                <div className="px-6 py-2 bg-yellow-100 text-sm">
                  Debug: Total quotes: {recentQuotes.length}, Filtered: {filteredQuotes.length}, Pages: {totalQuotePages}, Current: {currentQuotePage}
                </div>
                
                {/* Pagination for Quotes */}
                <div className="px-6 py-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentQuotePage > 1) setCurrentQuotePage(currentQuotePage - 1);
                          }}
                          className={currentQuotePage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {[...Array(totalQuotePages)].map((_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink
                            href="#"
                            isActive={currentQuotePage === i + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentQuotePage(i + 1);
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
                            if (currentQuotePage < totalQuotePages) setCurrentQuotePage(currentQuotePage + 1);
                          }}
                          className={currentQuotePage === totalQuotePages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Active Policies
                    </CardTitle>
                    <CardDescription>
                      Manage your issued insurance policies
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPoliciesToExcel}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Controls for Policies */}
                <TableSearchFilter
                  searchTerm={policySearchTerm}
                  onSearchChange={setPolicySearchTerm}
                  searchPlaceholder="Search policies by client name, project, or policy number..."
                  filters={policyFilters}
                  activeFilters={policyFiltersState}
                  onFilterChange={updatePolicyFilter}
                  onClearFilters={clearPolicyFilters}
                />
                {policiesLoading ? (
                  <TableSkeleton />
                ) : policiesError ? (
                  <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">{policiesError}</div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Policy Number</TableHead>
                      <TableHead className="w-[120px]">Project Name</TableHead>
                      <TableHead className="w-[150px]">Insurer</TableHead>
                      <TableHead className="w-[140px]">Sum Insured</TableHead>
                      <TableHead className="w-[120px]">Premium</TableHead>
                      <TableHead className="w-[100px]">Start Date</TableHead>
                      <TableHead className="w-[100px]">End Date</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPolicies.map((policy) => (
                      <TableRow 
                        key={policy.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/broker/policy/${policy.id}`)}
                      >
                        <TableCell className="font-medium w-[140px]">{policy.policyNumber}</TableCell>
                        <TableCell className="w-[120px] truncate" title={policy.projectName}>
                          {policy.projectName.length > 15 ? `${policy.projectName.substring(0, 15)}...` : policy.projectName}
                        </TableCell>
                        <TableCell className="font-medium w-[150px]">{policy.insurer}</TableCell>
                        <TableCell className="font-medium w-[140px]">{policy.sumInsured}</TableCell>
                        <TableCell className="font-medium text-primary w-[120px]">{policy.premium}</TableCell>
                        <TableCell className="text-sm text-muted-foreground w-[100px]">{policy.startDate}</TableCell>
                        <TableCell className="text-sm text-muted-foreground w-[100px]">{policy.endDate}</TableCell>
                        <TableCell className="w-[100px]">
                          <Badge variant="outline" className="text-success border-success/20">
                            {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/broker/policy/${policy.id}`);
                            }}
                          >
                            View Policy
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
                
                {/* Pagination for Policies */}
                <div className="px-6 py-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPolicyPage > 1) setCurrentPolicyPage(currentPolicyPage - 1);
                          }}
                          className={currentPolicyPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {[...Array(totalPolicyPages)].map((_, i) => (
                        <PaginationItem key={i + 1}>
                          <PaginationLink
                            href="#"
                            isActive={currentPolicyPage === i + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPolicyPage(i + 1);
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
                            if (currentPolicyPage < totalPolicyPages) setCurrentPolicyPage(currentPolicyPage + 1);
                          }}
                          className={currentPolicyPage === totalPolicyPages ? "pointer-events-none opacity-50" : ""}
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
  );
}