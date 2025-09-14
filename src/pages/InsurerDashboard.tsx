import { useState, useEffect, useMemo } from "react";
import insurerLogo from "@/assets/insurer-logo.png";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Footer } from "@/components/Footer";
import { QUOTE_STATUSES, getQuoteStatusLabel, getQuoteStatusColor, filterActiveQuotes } from "@/lib/quote-status";
import { formatDateShort } from "@/utils/date-format";
import { QuoteStatusDot } from "@/components/QuoteStatusDot";
import { Eye, ArrowLeft, Building2, Calendar, DollarSign, Shield, FileText, Download, LogOut, Settings2 } from "lucide-react";
import { TableSearchFilter, FilterConfig } from "@/components/TableSearchFilter";
import { useTableSearch } from "@/hooks/useTableSearch";
import { useToast } from "@/hooks/use-toast";
import { getInsurerDashboard, type GetInsurerDashboardResponse, type DashboardQuoteRequest } from "@/lib/api/insurers";
import { getInsurerDashboardQuotes, getInsurerDashboardPolicies, type BrokerDashboardQuotesResponse, type BrokerDashboardPoliciesResponse } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import * as XLSX from 'xlsx';

// Mock data for quotes - expanded to 10+ entries
const mockQuotes = [{
  id: "Q001",
  customerName: "Ahmed Al-Mansoori",
  companyName: "Al-Mansoori Construction",
  brokerName: "Gulf Insurance Brokers",
  projectType: "Warehouse Construction",
  projectValue: "AED 12,500,000",
  premium: "AED 78,500",
  submittedDate: "2024-01-15",
  status: "pending"
}, {
  id: "Q002",
  customerName: "Sarah Johnson",
  companyName: "Johnson Engineering",
  brokerName: "Emirates Risk Advisors",
  projectType: "Office Building",
  projectValue: "AED 8,200,000",
  premium: "AED 62,300",
  submittedDate: "2024-01-12",
  status: "quoted"
}, {
  id: "Q003",
  customerName: "Mohammed Hassan",
  companyName: "Hassan Builders",
  brokerName: "Marsh Middle East",
  projectType: "Residential Complex",
  projectValue: "AED 15,800,000",
  premium: "AED 94,200",
  submittedDate: "2024-01-10",
  status: "approved"
}, {
  id: "Q004",
  customerName: "Fatima Al Zahra",
  companyName: "Al Zahra Contracting",
  brokerName: "AON Risk Solutions",
  projectType: "Shopping Mall",
  projectValue: "AED 22,400,000",
  premium: "AED 134,800",
  submittedDate: "2024-01-08",
  status: "pending"
}, {
  id: "Q005",
  customerName: "Ali Ahmad",
  companyName: "Ahmad Construction",
  brokerName: "Willis Towers Watson",
  projectType: "Hospital Building",
  projectValue: "AED 18,600,000",
  premium: "AED 112,300",
  submittedDate: "2024-01-05",
  status: "quoted"
}, {
  id: "Q006",
  customerName: "Noor Abdullah",
  companyName: "Abdullah Enterprises",
  brokerName: "JLT Risk Solutions",
  projectType: "Hotel Development",
  projectValue: "AED 28,900,000",
  premium: "AED 173,400",
  submittedDate: "2024-01-20",
  status: "approved"
}, {
  id: "Q007",
  customerName: "Omar Al Rashid",
  companyName: "Al Rashid Group",
  brokerName: "Gulf Insurance Brokers",
  projectType: "Industrial Facility",
  projectValue: "AED 16,700,000",
  premium: "AED 100,200",
  submittedDate: "2024-01-18",
  status: "pending"
}, {
  id: "Q008",
  customerName: "Layla Hassan",
  companyName: "Hassan Development",
  brokerName: "Oman Insurance Brokers",
  projectType: "Mixed Use Tower",
  projectValue: "AED 35,200,000",
  premium: "AED 211,200",
  submittedDate: "2024-01-25",
  status: "quoted"
}, {
  id: "Q009",
  customerName: "Khalid Al Marri",
  companyName: "Marri Construction",
  brokerName: "Emirates Risk Advisors",
  projectType: "School Building",
  projectValue: "AED 9,800,000",
  premium: "AED 58,800",
  submittedDate: "2024-01-22",
  status: "approved"
}, {
  id: "Q010",
  customerName: "Mariam Al Suwaidi",
  companyName: "Suwaidi Builders",
  brokerName: "Marsh Middle East",
  projectType: "Retail Complex",
  projectValue: "AED 19,500,000",
  premium: "AED 117,000",
  submittedDate: "2024-01-28",
  status: "pending"
}, {
  id: "Q011",
  customerName: "Hassan Al Zaabi",
  companyName: "Al Zaabi Engineering",
  brokerName: "AON Risk Solutions",
  projectType: "Bridge Construction",
  projectValue: "AED 24,600,000",
  premium: "AED 147,600",
  submittedDate: "2024-02-01",
  status: "quoted"
}, {
  id: "Q012",
  customerName: "Amna Al Hashimi",
  companyName: "Hashimi Group",
  brokerName: "Willis Towers Watson",
  projectType: "Luxury Villas",
  projectValue: "AED 14,300,000",
  premium: "AED 85,800",
  submittedDate: "2024-02-03",
  status: "approved"
}];
const mockPolicies = [{
  id: "P001",
  policyNumber: "POL-2024-001",
  customerName: "Ahmed Al-Mansoori",
  companyName: "Al-Mansoori Construction",
  projectType: "Office Complex",
  premium: "AED 65,400",
  startDate: "2024-01-01",
  endDate: "2025-01-01",
  status: "active",
  sumInsured: "AED 9,800,000"
}, {
  id: "P002",
  policyNumber: "POL-2024-002",
  customerName: "Sarah Johnson",
  companyName: "Johnson Engineering",
  projectType: "Residential Tower",
  premium: "AED 89,200",
  startDate: "2024-01-15",
  endDate: "2025-01-15",
  status: "active",
  sumInsured: "AED 13,400,000"
}, {
  id: "P003",
  policyNumber: "POL-2024-003",
  customerName: "Mohammed Hassan",
  companyName: "Hassan Builders",
  projectType: "Shopping Center",
  premium: "AED 76,800",
  startDate: "2024-02-01",
  endDate: "2025-02-01",
  status: "active",
  sumInsured: "AED 11,500,000"
}, {
  id: "P004",
  policyNumber: "POL-2024-004",
  customerName: "Fatima Al Zahra",
  companyName: "Al Zahra Contracting",
  projectType: "Hotel Development",
  premium: "AED 123,600",
  startDate: "2024-01-20",
  endDate: "2025-01-20",
  status: "active",
  sumInsured: "AED 18,500,000"
}, {
  id: "P005",
  policyNumber: "POL-2024-005",
  customerName: "Ali Ahmad",
  companyName: "Ahmad Construction",
  projectType: "Medical Center",
  premium: "AED 98,400",
  startDate: "2024-02-10",
  endDate: "2025-02-10",
  status: "active",
  sumInsured: "AED 14,800,000"
}, {
  id: "P006",
  policyNumber: "POL-2024-006",
  customerName: "Noor Abdullah",
  companyName: "Abdullah Enterprises",
  projectType: "Industrial Warehouse",
  premium: "AED 87,300",
  startDate: "2024-01-25",
  endDate: "2025-01-25",
  status: "active",
  sumInsured: "AED 13,100,000"
}, {
  id: "P007",
  policyNumber: "POL-2024-007",
  customerName: "Omar Al Rashid",
  companyName: "Al Rashid Group",
  projectType: "Educational Facility",
  premium: "AED 54,700",
  startDate: "2024-02-05",
  endDate: "2025-02-05",
  status: "active",
  sumInsured: "AED 8,200,000"
}, {
  id: "P008",
  policyNumber: "POL-2024-008",
  customerName: "Layla Hassan",
  companyName: "Hassan Development",
  projectType: "Luxury Resort",
  premium: "AED 167,900",
  startDate: "2024-01-30",
  endDate: "2025-01-30",
  status: "active",
  sumInsured: "AED 25,200,000"
}, {
  id: "P009",
  policyNumber: "POL-2024-009",
  customerName: "Khalid Al Marri",
  companyName: "Marri Construction",
  projectType: "Government Building",
  premium: "AED 112,500",
  startDate: "2024-02-12",
  endDate: "2025-02-12",
  status: "active",
  sumInsured: "AED 16,900,000"
}, {
  id: "P010",
  policyNumber: "POL-2024-010",
  customerName: "Mariam Al Suwaidi",
  companyName: "Suwaidi Builders",
  projectType: "Sports Complex",
  premium: "AED 94,800",
  startDate: "2024-02-08",
  endDate: "2025-02-08",
  status: "active",
  sumInsured: "AED 14,200,000"
}, {
  id: "P011",
  policyNumber: "POL-2024-011",
  customerName: "Hassan Al Zaabi",
  companyName: "Al Zaabi Engineering",
  projectType: "Infrastructure Project",
  premium: "AED 145,600",
  startDate: "2024-01-28",
  endDate: "2025-01-28",
  status: "active",
  sumInsured: "AED 21,800,000"
}, {
  id: "P012",
  policyNumber: "POL-2024-012",
  customerName: "Amna Al Hashimi",
  companyName: "Hashimi Group",
  projectType: "Residential Villas",
  premium: "AED 78,300",
  startDate: "2024-02-15",
  endDate: "2025-02-15",
  status: "active",
  sumInsured: "AED 11,700,000"
}];
const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="text-orange-600 border-orange-200">Pending Review</Badge>;
    case "quoted":
      return <Badge variant="secondary">Quote Sent</Badge>;
    case "approved":
      return <Badge variant="outline" className="text-green-600 border-green-200">Approved</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};
const InsurerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotes] = useState(mockQuotes);
  const [policies] = useState(mockPolicies);
  const [activeTab, setActiveTab] = useState("quotes");
  const [currentQuotePage, setCurrentQuotePage] = useState(1);
  const [currentPolicyPage, setCurrentPolicyPage] = useState(1);
  const itemsPerPage = 5;

  // Dashboard API state
  const [dashboardData, setDashboardData] = useState<GetInsurerDashboardResponse | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Quotes and Policies API state
  const [quotesData, setQuotesData] = useState<BrokerDashboardQuotesResponse | null>(null);
  const [policiesData, setPoliciesData] = useState<BrokerDashboardPoliciesResponse | null>(null);
  const [quotesLoading, setQuotesLoading] = useState<boolean>(false);
  const [policiesLoading, setPoliciesLoading] = useState<boolean>(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [policiesError, setPoliciesError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      console.log('🚀 Fetching dashboard data...');
      setIsLoadingDashboard(true);
      setDashboardError(null);
      
      const response = await getInsurerDashboard();
      console.log('✅ Dashboard data fetched successfully:', response);
      
      setDashboardData(response);
      
    } catch (err: any) {
      console.error('❌ Error fetching dashboard data:', err);
      const status = err?.status as number | undefined;
      const message = err?.message as string | undefined;
      
      let errorMessage = 'Failed to load dashboard data.';
      if (status === 400) errorMessage = message || 'Bad request while loading dashboard.';
      else if (status === 401) errorMessage = 'Unauthorized. Please log in again.';
      else if (status === 403) errorMessage = 'Forbidden. You do not have permission.';
      else if (status && status >= 500) errorMessage = 'Server error. Please try again later.';
      else if (message) errorMessage = message;
      
      setDashboardError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Fetch quotes data
  const fetchQuotesData = async () => {
    try {
      setQuotesLoading(true);
      setQuotesError(null);
      const data = await getInsurerDashboardQuotes();
      setQuotesData(data);
    } catch (err: any) {
      setQuotesError(err?.message || 'Failed to load quotes');
    } finally {
      setQuotesLoading(false);
    }
  };

  // Fetch policies data
  const fetchPoliciesData = async () => {
    try {
      setPoliciesLoading(true);
      setPoliciesError(null);
      const data = await getInsurerDashboardPolicies();
      setPoliciesData(data);
    } catch (err: any) {
      setPoliciesError(err?.message || 'Failed to load policies');
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Fetch dashboard data when component mounts (since default tab is "quotes")
  useEffect(() => {
    fetchDashboardData();
    fetchQuotesData();
    fetchPoliciesData();
  }, []);

  // Fetch dashboard data when quotes tab is selected
  useEffect(() => {
    if (activeTab === "quotes") {
      console.log('📊 Quote Requests tab clicked - fetching dashboard data...');
      fetchDashboardData();
    }
  }, [activeTab]);

  // Map quotes data from API
  const activeQuotes = useMemo(() => {
    try {
      if (!quotesData?.recentQuotes || !Array.isArray(quotesData.recentQuotes)) {
        console.log('No quotes data available or invalid structure:', quotesData);
        return [];
      }
      return quotesData.recentQuotes.map(q => ({
        id: q.id.toString(),
        customerName: q.client_name || '',
        companyName: q.project_name || '',
        brokerName: q.broker_name || '',
        projectType: q.project_type || '',
        projectValue: q.total_premium ? `AED ${Number(q.total_premium).toLocaleString()}` : '-',
        premium: q.base_premium ? `AED ${Number(q.base_premium).toLocaleString()}` : '-',
        submittedDate: formatDateShort(q.created_at),
        status: q.status || '',
        validityDate: formatDateShort(q.validity_date),
      }));
    } catch (error) {
      console.error('Error mapping quotes data:', error);
      return [];
    }
  }, [quotesData]);

  // Map policies data from API
  const recentPolicies = useMemo(() => {
    try {
      if (!policiesData?.issuedPolicies || !Array.isArray(policiesData.issuedPolicies)) {
        console.log('No policies data available or invalid structure:', policiesData);
        return [];
      }
      return policiesData.issuedPolicies.map(p => ({
        id: p.policy_id || `Q${p.quote_id}`,
        policyNumber: p.policy_id || `Q${p.quote_id}`,
        customerName: p.client_name || '',
        companyName: p.project_name || '',
        projectType: 'Construction', // Default since not provided in API
        sumInsured: p.total_premium ? `AED ${Number(p.total_premium).toLocaleString()}` : '-',
        premium: p.base_premium ? `AED ${Number(p.base_premium).toLocaleString()}` : '-',
        startDate: formatDateShort(p.start_date),
        endDate: formatDateShort(p.end_date),
        status: p.status || '',
      }));
    } catch (error) {
      console.error('Error mapping policies data:', error);
      return [];
    }
  }, [policiesData]);

  // Configure filters for quotes
  const quoteFilters: FilterConfig[] = [{
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [{
      value: 'pending',
      label: 'Pending Review'
    }, {
      value: 'quoted',
      label: 'Quote Sent'
    }, {
      value: 'approved',
      label: 'Approved'
    }]
  }, {
    key: 'projectType',
    label: 'Project Type',
    type: 'multiselect',
    options: [{
      value: 'Warehouse Construction',
      label: 'Warehouse Construction'
    }, {
      value: 'Office Building',
      label: 'Office Building'
    }, {
      value: 'Residential Complex',
      label: 'Residential Complex'
    }, {
      value: 'Shopping Mall',
      label: 'Shopping Mall'
    }, {
      value: 'Hospital Building',
      label: 'Hospital Building'
    }, {
      value: 'Hotel Development',
      label: 'Hotel Development'
    }, {
      value: 'Industrial Facility',
      label: 'Industrial Facility'
    }, {
      value: 'Mixed Use Tower',
      label: 'Mixed Use Tower'
    }, {
      value: 'School Building',
      label: 'School Building'
    }, {
      value: 'Retail Complex',
      label: 'Retail Complex'
    }, {
      value: 'Bridge Construction',
      label: 'Bridge Construction'
    }, {
      value: 'Luxury Villas',
      label: 'Luxury Villas'
    }]
  }, {
    key: 'brokerName',
    label: 'Broker',
    type: 'multiselect',
    options: [{
      value: 'Gulf Insurance Brokers',
      label: 'Gulf Insurance Brokers'
    }, {
      value: 'Emirates Risk Advisors',
      label: 'Emirates Risk Advisors'
    }, {
      value: 'Marsh Middle East',
      label: 'Marsh Middle East'
    }, {
      value: 'AON Risk Solutions',
      label: 'AON Risk Solutions'
    }, {
      value: 'Willis Towers Watson',
      label: 'Willis Towers Watson'
    }, {
      value: 'JLT Risk Solutions',
      label: 'JLT Risk Solutions'
    }, {
      value: 'Oman Insurance Brokers',
      label: 'Oman Insurance Brokers'
    }]
  }, {
    key: 'submittedDate',
    label: 'Submitted Date',
    type: 'date'
  }];

  // Configure filters for policies
  const policyFilters: FilterConfig[] = [{
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [{
      value: 'active',
      label: 'Active'
    }, {
      value: 'expired',
      label: 'Expired'
    }, {
      value: 'cancelled',
      label: 'Cancelled'
    }]
  }, {
    key: 'projectType',
    label: 'Project Type',
    type: 'multiselect',
    options: [{
      value: 'Office Complex',
      label: 'Office Complex'
    }, {
      value: 'Residential Tower',
      label: 'Residential Tower'
    }, {
      value: 'Shopping Center',
      label: 'Shopping Center'
    }, {
      value: 'Hotel Development',
      label: 'Hotel Development'
    }, {
      value: 'Medical Center',
      label: 'Medical Center'
    }, {
      value: 'Industrial Warehouse',
      label: 'Industrial Warehouse'
    }, {
      value: 'Educational Facility',
      label: 'Educational Facility'
    }, {
      value: 'Luxury Resort',
      label: 'Luxury Resort'
    }, {
      value: 'Government Building',
      label: 'Government Building'
    }, {
      value: 'Sports Complex',
      label: 'Sports Complex'
    }, {
      value: 'Infrastructure Project',
      label: 'Infrastructure Project'
    }, {
      value: 'Residential Villas',
      label: 'Residential Villas'
    }]
  }, {
    key: 'startDate',
    label: 'Start Date',
    type: 'date'
  }];

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
    searchableFields: ['id', 'customerName', 'companyName', 'brokerName', 'projectType'],
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
    data: policies,
    searchableFields: ['policyNumber', 'customerName', 'companyName', 'projectType'],
    initialFilters: {}
  });

  // Pagination logic for quotes - limit to max 3 pages
  const quotesDataSource = dashboardData?.quoteRequests || filteredQuotes;
  const totalQuotePages = Math.min(3, Math.ceil(quotesDataSource.length / itemsPerPage));
  const startQuoteIndex = (currentQuotePage - 1) * itemsPerPage;
  const endQuoteIndex = startQuoteIndex + itemsPerPage;
  const currentQuotes = filteredQuotes.slice(startQuoteIndex, endQuoteIndex);

  // Pagination logic for policies - limit to max 3 pages
  const totalPolicyPages = Math.min(3, Math.ceil(filteredPolicies.length / itemsPerPage));
  const startPolicyIndex = (currentPolicyPage - 1) * itemsPerPage;
  const endPolicyIndex = startPolicyIndex + itemsPerPage;
  const currentPolicies = filteredPolicies.slice(startPolicyIndex, endPolicyIndex);
  const exportQuotesToExcel = () => {
    const exportData = quotesData?.recentQuotes?.map((q: any) => ({
      'Quote ID': q.quote_id,
      'Customer Name': q.client_name,
      'Company Name': q.project_name,
      'Broker Name': q.broker_name,
      'Project Type': q.project_type,
      'Project Value': q.total_premium ? `AED ${Number(q.total_premium).toLocaleString()}` : '-',
      'Premium': q.base_premium ? `AED ${Number(q.base_premium).toLocaleString()}` : '-',
      'Status': q.status,
      'Submitted Date': q.created_at ? q.created_at.slice(0, 10) : '-'
    })) || [];
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quotes');
    XLSX.writeFile(wb, 'insurer-quotes.xlsx');
  };
  const exportPoliciesToExcel = () => {
    const exportData = policiesData?.issuedPolicies?.map((p: any) => ({
      'Policy Number': p.policy_id || `Q${p.quote_id}`,
      'Customer Name': p.client_name,
      'Company Name': p.project_name,
      'Project Type': 'Construction',
      'Sum Insured': p.total_premium ? `AED ${Number(p.total_premium).toLocaleString()}` : '-',
      'Premium': p.base_premium ? `AED ${Number(p.base_premium).toLocaleString()}` : '-',
      'Start Date': formatDateShort(p.start_date),
      'End Date': formatDateShort(p.end_date),
      'Status': p.status
    })) || [];
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Policies');
    XLSX.writeFile(wb, 'insurer-policies.xlsx');
  };
  return <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">CAR Dashboard</h1>
            <p className="text-muted-foreground">Insurance provider management overview</p>
          </div>
        </div>

        {/* Error Banner */}
        {dashboardError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Failed to load dashboard data</AlertTitle>
            <AlertDescription>{dashboardError}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quotes</p>
                  {isLoadingDashboard ? (
                    <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {dashboardData?.totalQuotes !== undefined ? dashboardData.totalQuotes : quotes.length}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Policies</p>
                  {isLoadingDashboard ? (
                    <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {dashboardData?.totalPolicies !== undefined ? dashboardData.totalPolicies : policies.length}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  {isLoadingDashboard ? (
                    <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {dashboardData?.totalValue !== undefined ? `AED ${(dashboardData.totalValue / 1000000).toFixed(1)}M` : "AED 46.3M"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Quotes and Policies */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Quote Requests
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Issued Policies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Quote Requests
                    </CardTitle>
                    <CardDescription>
                      Manage quotes for Emirates Insurance
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportQuotesToExcel} className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <TableSearchFilter searchTerm={quoteSearchTerm} onSearchChange={setQuoteSearchTerm} searchPlaceholder="Search quotes by customer name, company, or quote ID..." filters={quoteFilters} activeFilters={quoteFiltersState} onFilterChange={updateQuoteFilter} onClearFilters={clearQuoteFilters} />
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">Quote ID</th>
                    <th className="text-left p-4 font-medium text-foreground">Customer</th>
                    <th className="text-left p-4 font-medium text-foreground">Broker</th>
                    <th className="text-left p-4 font-medium text-foreground">Project</th>
                    <th className="text-left p-4 font-medium text-foreground">Value</th>
                    <th className="text-left p-4 font-medium text-foreground">Premium</th>
                    <th className="text-left p-4 font-medium text-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quotesLoading ? (
                    <TableSkeleton rowCount={5} colCount={8} />
                  ) : quotesError ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-destructive">
                        {quotesError}
                      </td>
                    </tr>
                  ) : filteredQuotes.length > 0 ? (
                    filteredQuotes.slice(startQuoteIndex, endQuoteIndex).map(quote => (
                      <tr key={quote.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.id}</p>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{quote.customerName}</p>
                            <p className="text-sm text-muted-foreground">{quote.companyName}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.brokerName}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.projectType}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.projectValue}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.premium}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground">{quote.submittedDate}</p>
                        </td>
                        <td className="p-4">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/insurer/quote/${quote.id}`)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    currentQuotes.map(quote => (
                      <tr key={quote.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.id}</p>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{quote.customerName}</p>
                            <p className="text-sm text-muted-foreground">{quote.companyName}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.brokerName}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.projectType}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.projectValue}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.premium}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground">{quote.submittedDate}</p>
                        </td>
                        <td className="p-4">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/insurer/quote/${quote.id}`)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                 </table>
                </div>
              
                   {/* Pagination for Quotes */}
                   <div className="px-6 py-4 border-t">
                     <div className="text-sm text-muted-foreground mb-4">
                       Showing {currentQuotes.length} of {Math.min(filteredQuotes.length, totalQuotePages * itemsPerPage)} quotes (Page {currentQuotePage} of {totalQuotePages})
                       {filteredQuotes.length > totalQuotePages * itemsPerPage && (
                         <span className="ml-2 text-amber-600">• Showing first {totalQuotePages * itemsPerPage} results</span>
                       )}
                     </div>
                     <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" onClick={e => {
                        e.preventDefault();
                        if (currentQuotePage > 1) setCurrentQuotePage(currentQuotePage - 1);
                      }} className={currentQuotePage === 1 ? "pointer-events-none opacity-50" : ""} />
                      </PaginationItem>
                      {[...Array(totalQuotePages)].map((_, i) => <PaginationItem key={i + 1}>
                          <PaginationLink href="#" isActive={currentQuotePage === i + 1} onClick={e => {
                        e.preventDefault();
                        setCurrentQuotePage(i + 1);
                      }}>
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>)}
                      <PaginationItem>
                        <PaginationNext href="#" onClick={e => {
                        e.preventDefault();
                        if (currentQuotePage < totalQuotePages) setCurrentQuotePage(currentQuotePage + 1);
                      }} className={currentQuotePage === totalQuotePages ? "pointer-events-none opacity-50" : ""} />
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
                        Issued Policies
                      </CardTitle>
                      <CardDescription>
                        Manage active insurance policies
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportPoliciesToExcel} className="gap-2">
                      <Download className="w-4 h-4" />
                      Export Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search and Filter Controls for Policies */}
                  <TableSearchFilter searchTerm={policySearchTerm} onSearchChange={setPolicySearchTerm} searchPlaceholder="Search policies by customer name, company, or policy number..." filters={policyFilters} activeFilters={policyFiltersState} onFilterChange={updatePolicyFilter} onClearFilters={clearPolicyFilters} />
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-4 font-medium text-foreground">Policy Number</th>
                          <th className="text-left p-4 font-medium text-foreground">Customer</th>
                          <th className="text-left p-4 font-medium text-foreground">Project</th>
                          <th className="text-left p-4 font-medium text-foreground">Sum Insured</th>
                          <th className="text-left p-4 font-medium text-foreground">Premium</th>
                          <th className="text-left p-4 font-medium text-foreground">Start Date</th>
                          <th className="text-left p-4 font-medium text-foreground">End Date</th>
                          <th className="text-left p-4 font-medium text-foreground">Status</th>
                          <th className="text-left p-4 font-medium text-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {policiesLoading ? (
                          <TableSkeleton rowCount={5} colCount={9} />
                        ) : policiesError ? (
                          <tr>
                            <td colSpan={9} className="p-4 text-center text-destructive">
                              {policiesError}
                            </td>
                          </tr>
                        ) : filteredPolicies.length > 0 ? (
                          filteredPolicies.slice(startPolicyIndex, endPolicyIndex).map(policy => <tr key={policy.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <p className="font-medium text-foreground">{policy.policyNumber}</p>
                            </td>
                            <td className="p-4">
                              <div>
                                <p className="font-medium text-foreground">{policy.customerName}</p>
                                <p className="text-sm text-muted-foreground">{policy.companyName}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-foreground">{policy.projectType}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-foreground">{policy.sumInsured}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-foreground">{policy.premium}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-sm text-foreground">{policy.startDate}</p>
                            </td>
                            <td className="p-4">
                              <p className="text-sm text-foreground">{policy.endDate}</p>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className="text-success border-success/20">
                                {policy.status && policy.status !== '' ? policy.status.charAt(0).toUpperCase() + policy.status.slice(1) : 'Policy_status'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Button size="sm" variant="outline" onClick={e => {
                          e.stopPropagation();
                          navigate(`/insurer/policy/${policy.id}`);
                        }}>
                                View Policy
                              </Button>
                            </td>
                          </tr>)
                        ) : (
                          <tr>
                            <td colSpan={9} className="p-4 text-center text-muted-foreground">
                              No policies found
                            </td>
                          </tr>
                        )}
                      </tbody>
                     </table>
                   </div>
                 
                   {/* Pagination for Policies */}
                   <div className="px-6 py-4 border-t">
                     <div className="text-sm text-muted-foreground mb-4">
                       Showing {currentPolicies.length} of {Math.min(filteredPolicies.length, totalPolicyPages * itemsPerPage)} policies (Page {currentPolicyPage} of {totalPolicyPages})
                       {filteredPolicies.length > totalPolicyPages * itemsPerPage && (
                         <span className="ml-2 text-amber-600">• Showing first {totalPolicyPages * itemsPerPage} results</span>
                       )}
                     </div>
                     <Pagination>
                       <PaginationContent>
                         <PaginationItem>
                           <PaginationPrevious href="#" onClick={e => {
                        e.preventDefault();
                        if (currentPolicyPage > 1) setCurrentPolicyPage(currentPolicyPage - 1);
                      }} className={currentPolicyPage === 1 ? "pointer-events-none opacity-50" : ""} />
                         </PaginationItem>
                         {[...Array(totalPolicyPages)].map((_, i) => <PaginationItem key={i + 1}>
                             <PaginationLink href="#" isActive={currentPolicyPage === i + 1} onClick={e => {
                        e.preventDefault();
                        setCurrentPolicyPage(i + 1);
                      }}>
                               {i + 1}
                             </PaginationLink>
                           </PaginationItem>)}
                         <PaginationItem>
                           <PaginationNext href="#" onClick={e => {
                        e.preventDefault();
                        if (currentPolicyPage < totalPolicyPages) setCurrentPolicyPage(currentPolicyPage + 1);
                      }} className={currentPolicyPage === totalPolicyPages ? "pointer-events-none opacity-50" : ""} />
                         </PaginationItem>
                       </PaginationContent>
                     </Pagination>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default InsurerDashboard;