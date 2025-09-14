import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Shield, Eye, Search, Filter, BarChart3, TrendingUp, Calendar, Clock, Download } from "lucide-react";
import { getAdminDashboardQuotes, getAdminDashboardPolicies, type AdminDashboardQuotesResponse, type BrokerDashboardPoliciesResponse } from "@/lib/api";
import TableSkeleton from "@/components/loaders/TableSkeleton";
import { QUOTE_STATUSES, getQuoteStatusLabel, getQuoteStatusColor, filterActiveQuotes } from "@/lib/quote-status";
import { formatDateShort } from "@/utils/date-format";
import { QuoteStatusDot } from "@/components/QuoteStatusDot";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from 'xlsx';

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
    status: QUOTE_STATUSES.QUOTE_EDITED,
    premium: "AED 73,500",
    createdDate: "2024-01-08",
    validUntil: "2024-02-08",
    sumInsured: "AED 11,200,000",
    insurer: "Takaful Emarat",
    broker: "Ahmed Al-Mansoori"
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
    insurer: "National General Insurance",
    broker: "Sarah Johnson"
  },
  {
    id: "Q006",
    clientName: "Majid Al Futtaim",
    projectName: "City Centre Mall Extension",
    projectType: "Commercial",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 189,300",
    createdDate: "2024-01-20",
    validUntil: "2024-02-20",
    sumInsured: "AED 28,500,000",
    insurer: "Dubai Insurance",
    broker: "Fatima Al-Zahra"
  },
  {
    id: "Q007",
    clientName: "RAK Properties",
    projectName: "Coastal Resort Development",
    projectType: "Hospitality",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 156,750",
    createdDate: "2024-01-18",
    validUntil: "2024-02-18",
    sumInsured: "AED 23,400,000",
    insurer: "Abu Dhabi National Insurance",
    broker: "Omar Khalil"
  },
  {
    id: "Q008",
    clientName: "Sobha Realty",
    projectName: "Luxury Residential Towers",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 98,200",
    createdDate: "2024-01-22",
    validUntil: "2024-02-22",
    sumInsured: "AED 15,600,000",
    insurer: "AXA Gulf",
    broker: "Layla Hassan"
  },
  {
    id: "Q009",
    clientName: "Abu Dhabi Investment Authority",
    projectName: "Financial District Complex",
    projectType: "Commercial",
    status: QUOTE_STATUSES.QUOTE_EDITED,
    premium: "AED 245,800",
    createdDate: "2024-01-25",
    validUntil: "2024-02-25",
    sumInsured: "AED 35,200,000",
    insurer: "Emirates Insurance",
    broker: "Khalid Rashid"
  },
  {
    id: "Q010",
    clientName: "Dubai Airports",
    projectName: "Terminal Expansion Project",
    projectType: "Infrastructure",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 312,400",
    createdDate: "2024-01-28",
    validUntil: "2024-02-28",
    sumInsured: "AED 45,800,000",
    insurer: "National General Insurance",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q011",
    clientName: "Careem Networks",
    projectName: "Corporate Headquarters",
    projectType: "Commercial",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 67,900",
    createdDate: "2024-01-30",
    validUntil: "2024-03-01",
    sumInsured: "AED 9,800,000",
    insurer: "Oman Insurance",
    broker: "Sarah Johnson"
  },
  {
    id: "Q012",
    clientName: "Al Ghurair Group",
    projectName: "Industrial Warehouse Complex",
    projectType: "Industrial",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 134,600",
    createdDate: "2024-02-01",
    validUntil: "2024-03-01",
    sumInsured: "AED 19,200,000",
    insurer: "Takaful Emarat",
    broker: "Mohammed Hassan"
  },
  {
    id: "Q013",
    clientName: "Dubai Health Authority",
    projectName: "Medical Center Construction",
    projectType: "Healthcare",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 178,500",
    createdDate: "2024-02-03",
    validUntil: "2024-03-03",
    sumInsured: "AED 26,700,000",
    insurer: "Dubai Insurance",
    broker: "Fatima Al-Zahra"
  },
  {
    id: "Q014",
    clientName: "ADNOC Group",
    projectName: "Refinery Modernization",
    projectType: "Industrial",
    status: QUOTE_STATUSES.QUOTE_EDITED,
    premium: "AED 456,200",
    createdDate: "2024-02-05",
    validUntil: "2024-03-05",
    sumInsured: "AED 67,500,000",
    insurer: "Abu Dhabi National Insurance",
    broker: "Omar Khalil"
  },
  {
    id: "Q015",
    clientName: "Dubai Properties",
    projectName: "Mixed-Use Development",
    projectType: "Mixed-Use",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 223,800",
    createdDate: "2024-02-06",
    validUntil: "2024-03-06",
    sumInsured: "AED 33,400,000",
    insurer: "Emirates Insurance",
    broker: "Layla Hassan"
  },
  {
    id: "Q016",
    clientName: "Meraas Holdings",
    projectName: "Bluewaters Island Project",
    projectType: "Mixed-Use",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 287,650",
    createdDate: "2024-02-08",
    validUntil: "2024-03-08",
    sumInsured: "AED 42,300,000",
    insurer: "Salama Insurance",
    broker: "Khalid Rashid"
  },
  {
    id: "Q017",
    clientName: "Etisalat Group",
    projectName: "Data Center Construction",
    projectType: "Technology",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 145,800",
    createdDate: "2024-02-10",
    validUntil: "2024-03-10",
    sumInsured: "AED 21,800,000",
    insurer: "Orient Insurance",
    broker: "Amina Al-Rashid"
  },
  {
    id: "Q018",
    clientName: "Dubai World Trade Centre",
    projectName: "Convention Hall Expansion",
    projectType: "Commercial",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 198,400",
    createdDate: "2024-02-12",
    validUntil: "2024-03-12",
    sumInsured: "AED 29,600,000",
    insurer: "AXA Gulf",
    broker: "Hassan Al-Blooshi"
  },
  {
    id: "Q019",
    clientName: "Dubai Electricity & Water Authority",
    projectName: "Solar Power Plant",
    projectType: "Infrastructure",
    status: QUOTE_STATUSES.QUOTE_EDITED,
    premium: "AED 534,200",
    createdDate: "2024-02-14",
    validUntil: "2024-03-14",
    sumInsured: "AED 78,900,000",
    insurer: "National General Insurance",
    broker: "Noura Al-Mansoori"
  },
  {
    id: "Q020",
    clientName: "Jumeirah Group",
    projectName: "Luxury Hotel Resort",
    projectType: "Hospitality",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 267,300",
    createdDate: "2024-02-16",
    validUntil: "2024-03-16",
    sumInsured: "AED 39,500,000",
    insurer: "Takaful Emarat",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q021",
    clientName: "First Abu Dhabi Bank",
    projectName: "Regional Headquarters",
    projectType: "Commercial",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 156,900",
    createdDate: "2024-02-18",
    validUntil: "2024-03-18",
    sumInsured: "AED 23,200,000",
    insurer: "Emirates Insurance",
    broker: "Sarah Johnson"
  },
  {
    id: "Q022",
    clientName: "Dubai Metro Corporation",
    projectName: "Blue Line Extension",
    projectType: "Infrastructure",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 789,600",
    createdDate: "2024-02-20",
    validUntil: "2024-03-20",
    sumInsured: "AED 115,000,000",
    insurer: "Abu Dhabi National Insurance",
    broker: "Mohammed Hassan"
  },
  {
    id: "Q023",
    clientName: "Aldar Properties",
    projectName: "Sustainable Community",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 112,400",
    createdDate: "2024-02-22",
    validUntil: "2024-03-22",
    sumInsured: "AED 16,800,000",
    insurer: "Dubai Insurance",
    broker: "Fatima Al-Zahra"
  },
  {
    id: "Q024",
    clientName: "Mubadala Investment Company",
    projectName: "Green Technology Hub",
    projectType: "Technology",
    status: QUOTE_STATUSES.QUOTE_EDITED,
    premium: "AED 345,700",
    createdDate: "2024-02-24",
    validUntil: "2024-03-24",
    sumInsured: "AED 51,200,000",
    insurer: "Oman Insurance",
    broker: "Omar Khalil"
  },
  {
    id: "Q025",
    clientName: "Dubai Opera",
    projectName: "Cultural Center Extension",
    projectType: "Cultural",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 89,300",
    createdDate: "2024-02-26",
    validUntil: "2024-03-26",
    sumInsured: "AED 13,200,000",
    insurer: "Salama Insurance",
    broker: "Layla Hassan"
  },
  {
    id: "Q026",
    clientName: "Abu Dhabi Ports",
    projectName: "Container Terminal Expansion",
    projectType: "Infrastructure",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 456,800",
    createdDate: "2024-02-28",
    validUntil: "2024-03-28",
    sumInsured: "AED 67,300,000",
    insurer: "Orient Insurance",
    broker: "Khalid Rashid"
  },
  {
    id: "Q027",
    clientName: "Sharjah Investment Authority",
    projectName: "Business District Development",
    projectType: "Commercial",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 234,500",
    createdDate: "2024-03-01",
    validUntil: "2024-04-01",
    sumInsured: "AED 34,600,000",
    insurer: "AXA Gulf",
    broker: "Amina Al-Rashid"
  },
  {
    id: "Q028",
    clientName: "Dubai International Academic City",
    projectName: "University Campus Expansion",
    projectType: "Educational",
    status: QUOTE_STATUSES.QUOTE_EDITED,
    premium: "AED 167,200",
    createdDate: "2024-03-03",
    validUntil: "2024-04-03",
    sumInsured: "AED 24,800,000",
    insurer: "National General Insurance",
    broker: "Hassan Al-Blooshi"
  },
  {
    id: "Q029",
    clientName: "Ras Al Khaimah Tourism",
    projectName: "Adventure Park Development",
    projectType: "Entertainment",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 123,700",
    createdDate: "2024-03-05",
    validUntil: "2024-04-05",
    sumInsured: "AED 18,300,000",
    insurer: "Takaful Emarat",
    broker: "Noura Al-Mansoori"
  },
  {
    id: "Q030",
    clientName: "Ajman Municipality",
    projectName: "Smart City Initiative",
    projectType: "Infrastructure",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 298,400",
    createdDate: "2024-03-07",
    validUntil: "2024-04-07",
    sumInsured: "AED 44,200,000",
    insurer: "Emirates Insurance",
    broker: "Ahmed Al-Mansoori"
  }
];

// Mock data for all policies across brokers
const mockAllPolicies = [
  {
    id: "P001",
    policyNumber: "POL-2024-001",
    clientName: "Al Habtoor Construction LLC",
    projectName: "Al Habtoor Tower Development",
    projectType: "Commercial",
    premium: "AED 57,800",
    
    startDate: "2024-02-01",
    endDate: "2025-02-01",
    status: "active",
    sumInsured: "AED 8,450,000",
    insurer: "Emirates Insurance",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "P002",
    policyNumber: "POL-2024-002",
    clientName: "Emaar Properties",
    projectName: "Downtown Residential Complex",
    projectType: "Residential",
    premium: "AED 42,250",
    
    startDate: "2024-01-28",
    endDate: "2025-01-28",
    status: "active",
    sumInsured: "AED 6,200,000",
    insurer: "AXA Gulf",
    broker: "Sarah Johnson"
  },
  {
    id: "P003",
    policyNumber: "POL-2024-003",
    clientName: "Majid Al Futtaim",
    projectName: "City Centre Mall Extension",
    projectType: "Commercial",
    premium: "AED 189,300",
    
    startDate: "2024-02-15",
    endDate: "2025-02-15",
    status: "active",
    sumInsured: "AED 28,500,000",
    insurer: "Dubai Insurance",
    broker: "Fatima Al-Zahra"
  },
  {
    id: "P004",
    policyNumber: "POL-2024-004",
    clientName: "Sobha Realty",
    projectName: "Luxury Residential Towers",
    projectType: "Residential",
    premium: "AED 98,200",
    
    startDate: "2024-02-10",
    endDate: "2025-02-10",
    status: "active",
    sumInsured: "AED 15,600,000",
    insurer: "AXA Gulf",
    broker: "Layla Hassan"
  },
  {
    id: "P005",
    policyNumber: "POL-2024-005",
    clientName: "Al Ghurair Group",
    projectName: "Industrial Warehouse Complex",
    projectType: "Industrial",
    premium: "AED 134,600",
    
    startDate: "2024-02-20",
    endDate: "2025-02-20",
    status: "active",
    sumInsured: "AED 19,200,000",
    insurer: "Takaful Emarat",
    broker: "Mohammed Hassan"
  },
  {
    id: "P006",
    policyNumber: "POL-2024-006",
    clientName: "Dubai Properties",
    projectName: "Mixed-Use Development",
    projectType: "Mixed-Use",
    premium: "AED 223,800",
    
    startDate: "2024-02-25",
    endDate: "2025-02-25",
    status: "active",
    sumInsured: "AED 33,400,000",
    insurer: "Emirates Insurance",
    broker: "Layla Hassan"
  },
  {
    id: "P007",
    policyNumber: "POL-2024-007",
    clientName: "RAK Properties",
    projectName: "Coastal Resort Development",
    projectType: "Hospitality",
    premium: "AED 156,750",
    
    startDate: "2024-01-15",
    endDate: "2025-01-15",
    status: "active",
    sumInsured: "AED 23,400,000",
    insurer: "Abu Dhabi National Insurance",
    broker: "Omar Khalil"
  },
  {
    id: "P008",
    policyNumber: "POL-2024-008",
    clientName: "Dubai Health Authority",
    projectName: "Medical Center Construction",
    projectType: "Healthcare",
    premium: "AED 178,500",
    
    startDate: "2024-03-01",
    endDate: "2025-03-01",
    status: "pending",
    sumInsured: "AED 26,700,000",
    insurer: "Dubai Insurance",
    broker: "Fatima Al-Zahra"
  },
  {
    id: "P009",
    policyNumber: "POL-2023-045",
    clientName: "DAMAC Properties",
    projectName: "Marina Shopping Mall Renovation",
    projectType: "Commercial",
    premium: "AED 91,200",
    
    startDate: "2023-12-01",
    endDate: "2024-12-01",
    status: "expired",
    sumInsured: "AED 14,800,000",
    insurer: "Oman Insurance",
    broker: "Mohammed Hassan"
  },
  {
    id: "P010",
    policyNumber: "POL-2024-010",
    clientName: "Careem Networks",
    projectName: "Corporate Headquarters",
    projectType: "Commercial",
    premium: "AED 67,900",
    
    startDate: "2024-03-15",
    endDate: "2025-03-15",
    status: "pending",
    sumInsured: "AED 9,800,000",
    insurer: "Oman Insurance",
    broker: "Sarah Johnson"
  },
  {
    id: "P011",
    policyNumber: "POL-2024-011",
    clientName: "ADNOC Group",
    projectName: "Refinery Modernization",
    projectType: "Industrial",
    premium: "AED 456,200",
    
    startDate: "2024-03-01",
    endDate: "2025-03-01",
    status: "active",
    sumInsured: "AED 67,500,000",
    insurer: "Abu Dhabi National Insurance",
    broker: "Omar Khalil"
  },
  {
    id: "P012",
    policyNumber: "POL-2024-012",
    clientName: "Etisalat Group",
    projectName: "Data Center Construction",
    projectType: "Technology",
    premium: "AED 145,800",
    
    startDate: "2024-03-10",
    endDate: "2025-03-10",
    status: "active",
    sumInsured: "AED 21,800,000",
    insurer: "Orient Insurance",
    broker: "Amina Al-Rashid"
  },
  {
    id: "P013",
    policyNumber: "POL-2024-013",
    clientName: "Dubai World Trade Centre",
    projectName: "Convention Hall Expansion",
    projectType: "Commercial",
    premium: "AED 198,400",
    
    startDate: "2024-03-12",
    endDate: "2025-03-12",
    status: "active",
    sumInsured: "AED 29,600,000",
    insurer: "AXA Gulf",
    broker: "Hassan Al-Blooshi"
  },
  {
    id: "P014",
    policyNumber: "POL-2024-014",
    clientName: "Jumeirah Group",
    projectName: "Luxury Hotel Resort",
    projectType: "Hospitality",
    premium: "AED 267,300",
    
    startDate: "2024-03-16",
    endDate: "2025-03-16",
    status: "active",
    sumInsured: "AED 39,500,000",
    insurer: "Takaful Emarat",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "P015",
    policyNumber: "POL-2024-015",
    clientName: "First Abu Dhabi Bank",
    projectName: "Regional Headquarters",
    projectType: "Commercial",
    premium: "AED 156,900",
    
    startDate: "2024-03-18",
    endDate: "2025-03-18",
    status: "active",
    sumInsured: "AED 23,200,000",
    insurer: "Emirates Insurance",
    broker: "Sarah Johnson"
  },
  {
    id: "P016",
    policyNumber: "POL-2024-016",
    clientName: "Dubai Metro Corporation",
    projectName: "Blue Line Extension",
    projectType: "Infrastructure",
    premium: "AED 789,600",
    
    startDate: "2024-03-20",
    endDate: "2025-03-20",
    status: "active",
    sumInsured: "AED 115,000,000",
    insurer: "Abu Dhabi National Insurance",
    broker: "Mohammed Hassan"
  },
  {
    id: "P017",
    policyNumber: "POL-2024-017",
    clientName: "Aldar Properties",
    projectName: "Sustainable Community",
    projectType: "Residential",
    premium: "AED 112,400",
    
    startDate: "2024-03-22",
    endDate: "2025-03-22",
    status: "active",
    sumInsured: "AED 16,800,000",
    insurer: "Dubai Insurance",
    broker: "Fatima Al-Zahra"
  },
  {
    id: "P018",
    policyNumber: "POL-2024-018",
    clientName: "Dubai Opera",
    projectName: "Cultural Center Extension",
    projectType: "Cultural",
    premium: "AED 89,300",
    
    startDate: "2024-03-26",
    endDate: "2025-03-26",
    status: "active",
    sumInsured: "AED 13,200,000",
    insurer: "Salama Insurance",
    broker: "Layla Hassan"
  },
  {
    id: "P019",
    policyNumber: "POL-2023-032",
    clientName: "Meraas Holdings",
    projectName: "Bluewaters Island Project",
    projectType: "Mixed-Use",
    premium: "AED 287,650",
    
    startDate: "2023-11-15",
    endDate: "2024-11-15",
    status: "expired",
    sumInsured: "AED 42,300,000",
    insurer: "Salama Insurance",
    broker: "Khalid Rashid"
  },
  {
    id: "P020",
    policyNumber: "POL-2024-020",
    clientName: "Sharjah Investment Authority",
    projectName: "Business District Development",
    projectType: "Commercial",
    premium: "AED 234,500",
    
    startDate: "2024-04-01",
    endDate: "2025-04-01",
    status: "pending",
    sumInsured: "AED 34,600,000",
    insurer: "AXA Gulf",
    broker: "Amina Al-Rashid"
  },
  {
    id: "P021",
    policyNumber: "POL-2023-018",
    clientName: "Dubai Electricity & Water Authority",
    projectName: "Solar Power Plant",
    projectType: "Infrastructure",
    premium: "AED 534,200",
    
    startDate: "2023-10-01",
    endDate: "2024-10-01",
    status: "expired",
    sumInsured: "AED 78,900,000",
    insurer: "National General Insurance",
    broker: "Noura Al-Mansoori"
  },
  {
    id: "P022",
    policyNumber: "POL-2024-022",
    clientName: "Dubai International Academic City",
    projectName: "University Campus Expansion",
    projectType: "Educational",
    premium: "AED 167,200",
    
    startDate: "2024-04-03",
    endDate: "2025-04-03",
    status: "pending",
    sumInsured: "AED 24,800,000",
    insurer: "National General Insurance",
    broker: "Hassan Al-Blooshi"
  },
  {
    id: "P023",
    policyNumber: "POL-2024-023",
    clientName: "Ras Al Khaimah Tourism",
    projectName: "Adventure Park Development",
    projectType: "Entertainment",
    premium: "AED 123,700",
    
    startDate: "2024-04-05",
    endDate: "2025-04-05",
    status: "pending",
    sumInsured: "AED 18,300,000",
    insurer: "Takaful Emarat",
    broker: "Noura Al-Mansoori"
  },
  {
    id: "P024",
    policyNumber: "POL-2024-024",
    clientName: "Mubadala Investment Company",
    projectName: "Green Technology Hub",
    projectType: "Technology",
    premium: "AED 345,700",
    
    startDate: "2024-03-24",
    endDate: "2025-03-24",
    status: "active",
    sumInsured: "AED 51,200,000",
    insurer: "Oman Insurance",
    broker: "Omar Khalil"
  },
  {
    id: "P025",
    policyNumber: "POL-2024-025",
    clientName: "Abu Dhabi Ports",
    projectName: "Container Terminal Expansion",
    projectType: "Infrastructure",
    premium: "AED 456,800",
    
    startDate: "2024-03-28",
    endDate: "2025-03-28",
    status: "active",
    sumInsured: "AED 67,300,000",
    insurer: "Orient Insurance",
    broker: "Khalid Rashid"
  }
];

// Mock day-wise data for the charts
const dayWiseActivityData = [
  { period: "Mon", quotes: 4, policies: 2 },
  { period: "Tue", quotes: 3, policies: 1 },
  { period: "Wed", quotes: 6, policies: 3 },
  { period: "Thu", quotes: 2, policies: 2 },
  { period: "Fri", quotes: 5, policies: 1 },
  { period: "Sat", quotes: 1, policies: 0 },
  { period: "Sun", quotes: 3, policies: 2 },
];

const monthWiseActivityData = [
  { period: "Jan", quotes: 45, policies: 25 },
  { period: "Feb", quotes: 38, policies: 18 },
  { period: "Mar", quotes: 52, policies: 31 },
  { period: "Apr", quotes: 41, policies: 23 },
  { period: "May", quotes: 49, policies: 28 },
  { period: "Jun", quotes: 35, policies: 19 },
];

const dayWiseGWPData = [
  { period: "Mon", gwp: 125000, commission: 3750 },
  { period: "Tue", gwp: 89000, commission: 2670 },
  { period: "Wed", gwp: 156000, commission: 4680 },
  { period: "Thu", gwp: 72000, commission: 2160 },
  { period: "Fri", gwp: 134000, commission: 4020 },
  { period: "Sat", gwp: 45000, commission: 1350 },
  { period: "Sun", gwp: 98000, commission: 2940 },
];

const monthWiseGWPData = [
  { period: "Jan", gwp: 2450000, commission: 73500 },
  { period: "Feb", gwp: 1890000, commission: 56700 },
  { period: "Mar", gwp: 3120000, commission: 93600 },
  { period: "Apr", gwp: 2750000, commission: 82500 },
  { period: "May", gwp: 2980000, commission: 89400 },
  { period: "Jun", gwp: 2100000, commission: 63000 },
];

// Export functions
const exportQuotesToExcel = (quotesData: any) => {
  const exportData = quotesData?.recentQuotes?.map((q: any) => ({
    'Quote ID': q.quote_id,
    'Broker': q.broker_name,
    'Project Name': q.project_name,
    'Client Name': q.client_name,
    'Project Type': q.project_type,
    'Sum Insured': q.total_premium ? `AED ${Number(q.total_premium).toLocaleString()}` : '-',
    'Premium': q.base_premium ? `AED ${Number(q.base_premium).toLocaleString()}` : '-',
    'Status': q.status,
    'Created Date': formatDateShort(q.created_at),
    'Validity Date': formatDateShort(q.validity_date),
  })) || [];
  
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Quotes");
  XLSX.writeFile(workbook, "admin_quotes.xlsx");
};

const exportPoliciesToExcel = (policiesData: any) => {
  const exportData = policiesData?.issuedPolicies?.map((p: any) => ({
    'Policy Number': p.policy_id || `Q${p.quote_id}`,
    'Project Name': p.project_name,
    'Client Name': p.client_name,
    'Sum Insured': p.total_premium ? `AED ${Number(p.total_premium).toLocaleString()}` : '-',
    'Premium': p.base_premium ? `AED ${Number(p.base_premium).toLocaleString()}` : '-',
    'Start Date': formatDateShort(p.start_date),
    'End Date': formatDateShort(p.end_date),
    'Status': p.status,
  })) || [];
  
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Policies");
  XLSX.writeFile(workbook, "admin_policies.xlsx");
};

const MarketAdminDashboard = () => {
  const navigate = useNavigate();
  const [currentQuotePage, setCurrentQuotePage] = useState(1);
  const [currentPolicyPage, setCurrentPolicyPage] = useState(1);
  const [activeTab, setActiveTab] = useState("quotes");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("all-brokers");
  const [selectedInsurer, setSelectedInsurer] = useState("all-insurers");
  const [selectedStatus, setSelectedStatus] = useState("all-statuses");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activityViewType, setActivityViewType] = useState<"day" | "month">("day");
  const [gwpViewType, setGwpViewType] = useState<"day" | "month">("day");
  const itemsPerPage = 5;
  const [quotesData, setQuotesData] = useState<AdminDashboardQuotesResponse | null>(null);
  const [policiesData, setPoliciesData] = useState<BrokerDashboardPoliciesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [policiesLoading, setPoliciesLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [policiesError, setPoliciesError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await getAdminDashboardQuotes();
        if (!mounted) return;
        setQuotesData(data);
      } catch (err: any) {
        if (!mounted) return;
        setLoadError(err?.message || 'Failed to load dashboard quotes');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load policies data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPoliciesLoading(true);
        setPoliciesError(null);
        const data = await getAdminDashboardPolicies();
        if (!mounted) return;
        setPoliciesData(data);
      } catch (err: any) {
        if (!mounted) return;
        setPoliciesError(err?.message || 'Failed to load dashboard policies');
      } finally {
        if (mounted) setPoliciesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  
  // Get unique values for filters
  const recentQuotes = quotesData?.recentQuotes || [];
  const uniqueBrokers = [...new Set(recentQuotes.map(q => q.broker_name))].filter(Boolean) as string[];
  const uniqueInsurers = [...new Set(recentQuotes.map(q => q.inusrer_name))].filter(Boolean) as string[];
  const quoteStatusOptions = Object.values(QUOTE_STATUSES);

  // Filter quotes based on search and filters
  const filteredQuotes = recentQuotes.filter(quote => {
    const matchesSearch = !searchTerm || 
      quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quote_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.broker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.inusrer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBroker = selectedBroker === "all-brokers" || quote.broker_name === selectedBroker;
    const matchesStatus = selectedStatus === "all-statuses" || quote.status === selectedStatus;
    
    const createdDate = formatDateShort(quote.created_at);
    const matchesDateRange = (!dateFrom || createdDate >= dateFrom) && 
                            (!dateTo || createdDate <= dateTo);
    
    return matchesSearch && matchesBroker && matchesStatus && matchesDateRange;
  });

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
        projectName: p.project_name || '',
        projectType: 'Construction', // Default since not provided in API
        insurer: 'Insurer', // Default since not provided in API
        sumInsured: p.total_premium ? `AED ${Number(p.total_premium).toLocaleString()}` : '-',
        premium: p.base_premium ? `AED ${Number(p.base_premium).toLocaleString()}` : '-',
        startDate: formatDateShort(p.start_date),
        endDate: formatDateShort(p.end_date),
        status: p.status || '',
        clientName: p.client_name || '-',
        broker: 'Admin', // Default for admin view
      }));
    } catch (error) {
      console.error('Error mapping policies data:', error);
      return [];
    }
  }, [policiesData]);

  // Filter policies based on search and filters
  const filteredPolicies = recentPolicies.filter(policy => {
    const matchesSearch = !searchTerm || 
      policy.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.broker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.insurer?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBroker = selectedBroker === "all-brokers" || policy.broker === selectedBroker;
    const matchesInsurer = selectedInsurer === "all-insurers" || policy.insurer === selectedInsurer;
    
    const matchesDateRange = (!dateFrom || policy.startDate >= dateFrom) && 
                            (!dateTo || policy.startDate <= dateTo);
    
    return matchesSearch && matchesBroker && matchesInsurer && matchesDateRange;
  });

  // Pagination calculations for quotes
  const mappedQuotes = filteredQuotes.map(q => ({
    id: q.id,
    broker: q.broker_name,
    projectName: q.project_name,
    sumInsured: q.total_premium ? `AED ${Number(q.total_premium).toLocaleString()}` : '-',
    premium: q.base_premium ? `AED ${Number(q.base_premium).toLocaleString()}` : '-',
    status: q.status,
    createdDate: formatDateShort(q.created_at),
    validUntil: formatDateShort(q.validity_date),
    quoteId: q.quote_id,
  }));
  const activeQuotes = filterActiveQuotes(mappedQuotes);
  // Pagination for quotes - limit to max 3 pages
  const totalQuotePages = Math.min(3, Math.ceil(activeQuotes.length / itemsPerPage));
  const startQuoteIndex = (currentQuotePage - 1) * itemsPerPage;
  const currentQuotes = activeQuotes.slice(startQuoteIndex, startQuoteIndex + itemsPerPage);

  // Pagination for policies - limit to max 3 pages
  const totalPolicyPages = Math.min(3, Math.ceil(filteredPolicies.length / itemsPerPage));
  const startPolicyIndex = (currentPolicyPage - 1) * itemsPerPage;
  const currentPolicies = filteredPolicies.slice(startPolicyIndex, startPolicyIndex + itemsPerPage);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBroker("all-brokers");
    setSelectedInsurer("all-insurers");
    setSelectedStatus("all-statuses");
    setDateFrom("");
    setDateTo("");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentQuotePage(1);
    setCurrentPolicyPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards - Full Width */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Quotes</p>
                    <p className="text-3xl font-bold text-foreground">{quotesData?.totalQuotes ?? 0}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Policies</p>
                    <p className="text-3xl font-bold text-foreground">{quotesData?.totalPolicies ?? 0}</p>
                  </div>
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <Shield className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Premium Value</p>
                    <p className="text-2xl font-bold text-foreground">AED {Number(quotesData?.totalPremiumValue || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Activity Chart */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle className="text-lg font-semibold">Activity Overview</CardTitle>
                      <CardDescription>Quotes and policies trends</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={activityViewType === "day" ? "default" : "ghost"}
                      onClick={() => setActivityViewType("day")}
                      className="h-8 px-3 text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Day
                    </Button>
                    <Button
                      size="sm"
                      variant={activityViewType === "month" ? "default" : "ghost"}
                      onClick={() => setActivityViewType("month")}
                      className="h-8 px-3 text-xs"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Month
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                    data={activityViewType === "day" ? dayWiseActivityData : monthWiseActivityData} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="period" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="quotes" 
                      fill="hsl(var(--primary))" 
                      name="Quotes"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="policies" 
                      fill="hsl(var(--primary) / 0.6)" 
                      name="Policies"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* GWP Chart */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle className="text-lg font-semibold">GWP Performance</CardTitle>
                      <CardDescription>Gross Written Premium trends</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={gwpViewType === "day" ? "default" : "ghost"}
                      onClick={() => setGwpViewType("day")}
                      className="h-8 px-3 text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      Day
                    </Button>
                    <Button
                      size="sm"
                      variant={gwpViewType === "month" ? "default" : "ghost"}
                      onClick={() => setGwpViewType("month")}
                      className="h-8 px-3 text-xs"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Month
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 pt-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                    data={gwpViewType === "day" ? dayWiseGWPData : monthWiseGWPData} 
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="period" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                       formatter={(value, name) => [
                         `AED ${Number(value).toLocaleString()}`,
                         name === 'gwp' ? 'GWP' : name === 'commission' ? 'Commission' : name
                       ]}
                    />
                    <Legend />
                    <Bar 
                      dataKey="gwp" 
                      fill="hsl(var(--primary))" 
                      name="GWP"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="commission" 
                      fill="hsl(var(--primary) / 0.6)" 
                      name="Commission"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quotes and Policies Tabs - Outside Container */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="quotes">
                <FileText className="w-4 h-4 mr-2" />
                All Quotes ({activeQuotes.length})
              </TabsTrigger>
              <TabsTrigger value="policies">
                <Shield className="w-4 h-4 mr-2" />
                All Policies ({filteredPolicies.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quotes" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>All Quote Requests</CardTitle>
                      <CardDescription>View and manage quote requests from all brokers across the market</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportQuotesToExcel(quotesData)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Table>
                      <TableSkeleton rowCount={6} colCount={9} />
                    </Table>
                  ) : loadError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
                      {loadError}
                    </div>
                  ) : (
                  <div className="search-filter-container mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search quotes, clients, projects..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Brokers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-brokers">All Brokers</SelectItem>
                          {uniqueBrokers.map(broker => (
                            <SelectItem key={broker} value={broker}>{broker}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-statuses">All Statuses</SelectItem>
                          {quoteStatusOptions.map(status => (
                            <SelectItem key={status} value={status}>
                              {getQuoteStatusLabel(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Input
                        type="date"
                        placeholder="From Date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                      
                      <Input
                        type="date"
                        placeholder="To Date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                      
                      <Button 
                        variant="outline" 
                        onClick={clearFilters}
                        className="flex items-center gap-2"
                      >
                        <Filter className="w-4 h-4" />
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                  )}

                  <div className="mt-8">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quote ID</TableHead>
                          <TableHead>Broker</TableHead>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Sum Insured</TableHead>
                          <TableHead>Premium</TableHead>
                          <TableHead>Quote Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Quote Validity</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentQuotes.map((quote) => (
                          <TableRow 
                            key={quote.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              navigate(`/market-admin/quote/${quote.id}`);
                            }}
                          >
                            <TableCell className="font-medium">{quote.quoteId}</TableCell>
                            <TableCell className="font-medium text-primary">{quote.broker}</TableCell>
                            <TableCell>{quote.projectName}</TableCell>
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
                                      navigate(`/market-admin/quote/${quote.id}`);
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
                                       navigate(`/market-admin/policy/${quote.id}`);
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
                    
                    {/* Quotes Pagination */}
                    <div className="px-6 py-4 border-t">
                      <div className="text-sm text-muted-foreground mb-4">
                        Showing {currentQuotes.length} of {Math.min(activeQuotes.length, totalQuotePages * itemsPerPage)} quotes (Page {currentQuotePage} of {totalQuotePages})
                        {activeQuotes.length > totalQuotePages * itemsPerPage && (
                          <span className="ml-2 text-amber-600">• Showing first {totalQuotePages * itemsPerPage} results</span>
                        )}
                      </div>
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="mt-0">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>All Policies</CardTitle>
                      <CardDescription>View and manage active policies from all brokers and insurers</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportPoliciesToExcel(policiesData)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Excel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="search-filter-container mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search policies, clients, projects..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Brokers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-brokers">All Brokers</SelectItem>
                          {uniqueBrokers.map(broker => (
                            <SelectItem key={broker} value={broker}>{broker}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Select value={selectedInsurer} onValueChange={setSelectedInsurer}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Insurers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-insurers">All Insurers</SelectItem>
                          {uniqueInsurers.map(insurer => (
                            <SelectItem key={insurer} value={insurer}>{insurer}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Input
                        type="date"
                        placeholder="From Date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                      
                      <Input
                        type="date"
                        placeholder="To Date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                      
                      <Button 
                        variant="outline" 
                        onClick={clearFilters}
                        className="flex items-center gap-2"
                      >
                        <Filter className="w-4 h-4" />
                        Clear Filters
                      </Button>
                    </div>
                  </div>

                  <div className="mt-8">
                    {policiesLoading ? (
                      <TableSkeleton />
                    ) : policiesError ? (
                      <div className="rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">{policiesError}</div>
                    ) : (
                    <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Policy Number</TableHead>
                           <TableHead>Broker</TableHead>
                           <TableHead>Project Name</TableHead>
                           <TableHead>Insurer</TableHead>
                           <TableHead>Sum Insured</TableHead>
                           <TableHead>Premium</TableHead>
                           <TableHead>Start Date</TableHead>
                           <TableHead>End Date</TableHead>
                           <TableHead>Status</TableHead>
                           <TableHead className="text-right">Actions</TableHead>
                         </TableRow>
                       </TableHeader>
                      <TableBody>
                        {currentPolicies.map((policy) => (
                          <TableRow 
                            key={policy.id}
                            className="cursor-pointer hover:bg-muted/50"
                          >
                             <TableCell className="font-medium">{policy.policyNumber}</TableCell>
                             <TableCell className="font-medium text-primary">{policy.broker}</TableCell>
                             <TableCell>{policy.projectName}</TableCell>
                             <TableCell className="font-medium text-primary">{policy.insurer}</TableCell>
                             <TableCell className="font-medium">{policy.sumInsured}</TableCell>
                             <TableCell className="font-medium text-primary">{policy.premium}</TableCell>
                             <TableCell className="text-sm text-muted-foreground">{policy.startDate}</TableCell>
                             <TableCell className="text-sm text-muted-foreground">{policy.endDate}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-green-600 border-green-200">
                                {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/market-admin/policy/${policy.id}`);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    )}
                    
                    {/* Policies Pagination */}
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MarketAdminDashboard;
