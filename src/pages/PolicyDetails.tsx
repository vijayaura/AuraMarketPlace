import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Building2, User, Calendar, DollarSign, Shield, FileText, AlertTriangle, Briefcase, CheckCircle, FileCheck, Download, Share2 } from "lucide-react";
import { QUOTE_STATUSES, getQuoteStatusLabel, getQuoteStatusColor } from "@/lib/quote-status";
import { QuoteStatusDot } from "@/components/QuoteStatusDot";

// Extended quote data to include policy information
const getPolicyDetails = (id: string) => {
  const policies = {
    // Quote ID mappings
    "Q001": {
      id: "Q001",
      policyNumber: "POL-2024-001234",
      certificateNumber: "CERT-2024-001234",
      
      // Policy Status & Dates
      policyStatus: "Active",
      issueDate: "2024-01-20",
      effectiveDate: "2024-03-01", 
      expiryDate: "2025-03-01",
      
      // Premium Details
      basePremium: "AED 52,800",
      taxAmount: "AED 2,640",
      totalPremium: "AED 55,440",
      paymentStatus: "Paid",
      paymentDate: "2024-01-22",
      
      // Insurer Details
      insurer: "Emirates Insurance Company",
      insurerCode: "EIC-001",
      underwriterName: "Ahmed Al Rashid",
      underwriterEmail: "ahmed.rashid@emiratesinsurance.ae",
      
      // Project Details (from quote)
      projectName: "Al Habtoor Tower Development",
      projectType: "Commercial",
      constructionType: "Concrete",
      projectAddress: "Sheikh Zayed Road, Business Bay, Dubai, UAE",
      coordinates: "25.2048, 55.2708",
      projectValue: "AED 9,175,000",
      startDate: "2024-03-01",
      completionDate: "2024-09-15",
      constructionPeriod: "18 months",
      maintenancePeriod: "24 months",
      
      // Insured Details (from quote)
      insuredName: "Al Habtoor Construction LLC",
      roleOfInsured: "Contractor",
      contactEmail: "projects@alhabtoor.ae",
      phoneNumber: "+971-4-555-0123",
      vatNumber: "100123456700003",
      countryOfIncorporation: "UAE",
      
      // Contract Structure (from quote)
      mainContractor: "Al Habtoor Construction LLC",
      principalOwner: "Dubai Development Authority",
      contractType: "Turnkey",
      contractNumber: "DDA-2024-CT-001",
      engineerConsultant: "Atkins Middle East",
      
      // Cover Requirements (from quote)
      sumInsuredMaterial: "AED 6,615,000",
      sumInsuredPlant: "AED 1,468,000",
      sumInsuredTemporary: "AED 367,000",
      principalExistingProperty: "AED 0",
      tplLimit: "AED 3,670,000",
      crossLiabilityCover: "Yes",
      removalDebrisLimit: "AED 458,750",
      
      // Policy Specific Details
      deductible: "AED 25,000",
      geographicalLimits: "United Arab Emirates",
      jurisdiction: "UAE Courts",
      governingLaw: "UAE Federal Law",
      
      
      // Documents
      documents: [
        { name: "Policy Certificate", type: "PDF", size: "2.1 MB", status: "Available" },
        { name: "Policy Wording", type: "PDF", size: "1.8 MB", status: "Available" },
        { name: "Premium Receipt", type: "PDF", size: "0.5 MB", status: "Available" }
      ],
      
      // Extensions (from quote)
      extensions: {
        debrisRemoval: true,
        professionalFees: false,
        offsiteStorage: false,
        transitStorage: false,
        icow: false,
        fireBrigadeCharges: false
      },
      
      // Selected CEW Items (Policy Extensions & Conditions with Wordings)
      selectedCEWItems: [
        {
          id: 1,
          name: "SRCC Coverage",
          type: "extension",
          selectedOption: "Full Coverage",
          wording: "It is hereby agreed and understood that this Policy is extended to cover loss of or damage to the insured property directly caused by: Strikers, locked-out workers, or persons taking part in labour disturbances, riots, or civil commotions; The action of any lawfully constituted authority in suppressing or attempting to suppress any such disturbances or minimizing the consequences of such disturbances; Malicious acts committed by any person, whether or not such act is committed in connection with a disturbance of the public peace; provided that such loss or damage is not otherwise excluded under this Policy."
        },
        {
          id: 2,
          name: "Cross Liability",
          type: "extension", 
          selectedOption: "Policy Limits",
          wording: "It is hereby agreed and understood that, subject to the limits of indemnity stated in the Policy and subject otherwise to the terms, exclusions, provisions and conditions of the Policy, where the insured comprises more than one party, the insurance afforded by this Policy shall apply in the same manner and to the same extent as if individual insurance contracts had been issued to each such party."
        },
        {
          id: 3,
          name: "Maintenance Visits",
          type: "extension",
          selectedOption: "Policy Period",
          wording: "It is hereby agreed and understood that this Policy covers maintenance visits and inspections conducted during the policy period. All maintenance activities must be carried out in accordance with manufacturer specifications and industry best practices. The Insurer reserves the right to inspect the insured property at reasonable intervals to ensure compliance with maintenance requirements."
        },
        {
          id: 4,
          name: "Extended Maintenance",
          type: "extension",
          selectedOption: "18 Months",
          wording: "Extended maintenance coverage for 18 months beyond project completion, covering all maintenance-related defects and workmanship issues that may arise during the extended period."
        },
        {
          id: 5,
          name: "Time Schedule Condition",
          type: "extension",
          selectedOption: "Project Duration",
          wording: "Coverage includes protection against delays and time-related risks during the construction phase, subject to the agreed project schedule and milestones."
        },
        {
          id: 6,
          name: "Overtime/Night Work/Express Freight",
          type: "extension",
          selectedOption: "AED 500K",
          wording: "Coverage for additional costs incurred due to overtime work, night shifts, and express freight requirements to meet project deadlines and emergency situations."
        },
        {
          id: 7,
          name: "Earthquake Clause",
          type: "condition",
          selectedOption: "Zone 3-4 Coverage",
          wording: "Special conditions apply for earthquake coverage in seismic zones 3 and 4, with enhanced construction requirements and specific exclusions for areas with high seismic activity."
        },
        {
          id: 8,
          name: "Flood And Inundation Clause",
          type: "condition",
          selectedOption: "Flood Zones 1-2",
          wording: "Coverage conditions for flood and inundation risks in designated flood-prone areas, with specific requirements for flood protection measures and drainage systems."
        },
        {
          id: 9,
          name: "Windstorm Or Wind Related Water Damage",
          type: "condition",
          selectedOption: "Category 3+ Events",
          wording: "Special conditions for windstorm coverage including Category 3 and above storm events, with specific requirements for wind-resistant construction and water damage protection."
        },
        {
          id: 10,
          name: "Structures in Earthquake Zones Warranty",
          type: "warranty",
          selectedOption: "Seismic Standards",
          wording: "Warranty requirements for structures in earthquake zones, ensuring compliance with local seismic building codes and enhanced structural design standards."
        },
        {
          id: 11,
          name: "Property In Off-Site Storage Clause",
          type: "warranty",
          selectedOption: "Secure Storage",
          wording: "Warranty coverage for property stored in off-site locations, with specific security and storage condition requirements to maintain coverage validity."
        },
        {
          id: 12,
          name: "Serial Losses Clause",
          type: "warranty",
          selectedOption: "Multiple Events",
          wording: "Warranty conditions for serial losses and multiple event scenarios, with specific provisions for aggregate coverage limits and event separation criteria."
        }
      ],
      
      // Status
      quoteStatus: QUOTE_STATUSES.POLICY_GENERATED,
      submittedDate: "2024-01-15"
    },
    
    // Policy ID mappings (P001, P002, etc.)
    "P001": {
      id: "P001",
      policyNumber: "POL-2024-001234",
      certificateNumber: "CERT-2024-001234",
      
      // Policy Status & Dates
      policyStatus: "Active",
      issueDate: "2024-01-20",
      effectiveDate: "2024-03-01", 
      expiryDate: "2025-03-01",
      
      // Premium Details
      basePremium: "AED 52,800",
      taxAmount: "AED 2,640",
      totalPremium: "AED 55,440",
      paymentStatus: "Paid",
      paymentDate: "2024-01-22",
      
      // Insurer Details
      insurer: "Emirates Insurance Company",
      insurerCode: "EIC-001",
      underwriterName: "Ahmed Al Rashid",
      underwriterEmail: "ahmed.rashid@emiratesinsurance.ae",
      
      // Project Details
      projectName: "Al Habtoor Tower Development",
      projectType: "Commercial",
      constructionType: "Concrete",
      projectAddress: "Sheikh Zayed Road, Business Bay, Dubai, UAE",
      coordinates: "25.2048, 55.2708",
      projectValue: "AED 9,175,000",
      startDate: "2024-03-01",
      completionDate: "2024-09-15",
      constructionPeriod: "18 months",
      maintenancePeriod: "24 months",
      
      // Insured Details
      insuredName: "Al Habtoor Construction LLC",
      roleOfInsured: "Contractor",
      contactEmail: "projects@alhabtoor.ae",
      phoneNumber: "+971-4-555-0123",
      vatNumber: "100123456700003",
      countryOfIncorporation: "UAE",
      
      // Contract Structure
      mainContractor: "Al Habtoor Construction LLC",
      principalOwner: "Dubai Development Authority",
      contractType: "Turnkey",
      contractNumber: "DDA-2024-CT-001",
      engineerConsultant: "Atkins Middle East",
      
      // Cover Requirements
      sumInsuredMaterial: "AED 6,615,000",
      sumInsuredPlant: "AED 1,468,000",
      sumInsuredTemporary: "AED 367,000",
      principalExistingProperty: "AED 0",
      tplLimit: "AED 3,670,000",
      crossLiabilityCover: "Yes",
      removalDebrisLimit: "AED 458,750",
      
      // Policy Specific Details
      deductible: "AED 25,000",
      geographicalLimits: "United Arab Emirates",
      jurisdiction: "UAE Courts",
      governingLaw: "UAE Federal Law",
      
      
      // Documents
      documents: [
        { name: "Policy Certificate", type: "PDF", size: "2.1 MB", status: "Available" },
        { name: "Policy Wording", type: "PDF", size: "1.8 MB", status: "Available" },
        { name: "Premium Receipt", type: "PDF", size: "0.5 MB", status: "Available" }
      ],
      
      // Extensions
      extensions: {
        debrisRemoval: true,
        professionalFees: false,
        offsiteStorage: false,
        transitStorage: false,
        icow: false,
        fireBrigadeCharges: false
      },
      
      // Selected CEW Items (Policy Extensions & Conditions with Wordings)
      selectedCEWItems: [
        {
          id: 1,
          name: "SRCC Coverage",
          type: "extension",
          selectedOption: "Full Coverage",
          wording: "It is hereby agreed and understood that this Policy is extended to cover loss of or damage to the insured property directly caused by: Strikers, locked-out workers, or persons taking part in labour disturbances, riots, or civil commotions; The action of any lawfully constituted authority in suppressing or attempting to suppress any such disturbances or minimizing the consequences of such disturbances; Malicious acts committed by any person, whether or not such act is committed in connection with a disturbance of the public peace; provided that such loss or damage is not otherwise excluded under this Policy."
        },
        {
          id: 2,
          name: "Cross Liability",
          type: "extension", 
          selectedOption: "Policy Limits",
          wording: "It is hereby agreed and understood that, subject to the limits of indemnity stated in the Policy and subject otherwise to the terms, exclusions, provisions and conditions of the Policy, where the insured comprises more than one party, the insurance afforded by this Policy shall apply in the same manner and to the same extent as if individual insurance contracts had been issued to each such party."
        },
        {
          id: 3,
          name: "Maintenance Visits",
          type: "extension",
          selectedOption: "Policy Period",
          wording: "It is hereby agreed and understood that this Policy covers maintenance visits and inspections conducted during the policy period. All maintenance activities must be carried out in accordance with manufacturer specifications and industry best practices. The Insurer reserves the right to inspect the insured property at reasonable intervals to ensure compliance with maintenance requirements."
        },
        {
          id: 4,
          name: "Extended Maintenance",
          type: "extension",
          selectedOption: "18 Months",
          wording: "Extended maintenance coverage for 18 months beyond project completion, covering all maintenance-related defects and workmanship issues that may arise during the extended period."
        },
        {
          id: 5,
          name: "Time Schedule Condition",
          type: "extension",
          selectedOption: "Project Duration",
          wording: "Coverage includes protection against delays and time-related risks during the construction phase, subject to the agreed project schedule and milestones."
        },
        {
          id: 6,
          name: "Overtime/Night Work/Express Freight",
          type: "extension",
          selectedOption: "AED 500K",
          wording: "Coverage for additional costs incurred due to overtime work, night shifts, and express freight requirements to meet project deadlines and emergency situations."
        },
        {
          id: 7,
          name: "Earthquake Clause",
          type: "condition",
          selectedOption: "Zone 3-4 Coverage",
          wording: "Special conditions apply for earthquake coverage in seismic zones 3 and 4, with enhanced construction requirements and specific exclusions for areas with high seismic activity."
        },
        {
          id: 8,
          name: "Flood And Inundation Clause",
          type: "condition",
          selectedOption: "Flood Zones 1-2",
          wording: "Coverage conditions for flood and inundation risks in designated flood-prone areas, with specific requirements for flood protection measures and drainage systems."
        },
        {
          id: 9,
          name: "Windstorm Or Wind Related Water Damage",
          type: "condition",
          selectedOption: "Category 3+ Events",
          wording: "Special conditions for windstorm coverage including Category 3 and above storm events, with specific requirements for wind-resistant construction and water damage protection."
        },
        {
          id: 10,
          name: "Structures in Earthquake Zones Warranty",
          type: "warranty",
          selectedOption: "Seismic Standards",
          wording: "Warranty requirements for structures in earthquake zones, ensuring compliance with local seismic building codes and enhanced structural design standards."
        },
        {
          id: 11,
          name: "Property In Off-Site Storage Clause",
          type: "warranty",
          selectedOption: "Secure Storage",
          wording: "Warranty coverage for property stored in off-site locations, with specific security and storage condition requirements to maintain coverage validity."
        },
        {
          id: 12,
          name: "Serial Losses Clause",
          type: "warranty",
          selectedOption: "Multiple Events",
          wording: "Warranty conditions for serial losses and multiple event scenarios, with specific provisions for aggregate coverage limits and event separation criteria."
        }
      ],
      
      // Status
      quoteStatus: QUOTE_STATUSES.POLICY_GENERATED,
      submittedDate: "2024-01-15"
    }
  };
  
  return policies[id as keyof typeof policies] || null;
};

const getPolicyStatusBadge = (status: string) => {
  switch (status) {
    case "Active":
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>;
    case "Expired":
      return <Badge className="bg-red-500 hover:bg-red-600 text-white">Expired</Badge>;
    case "Cancelled":
      return <Badge className="bg-gray-500 hover:bg-gray-600 text-white">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case "Paid":
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Paid</Badge>;
    case "Pending":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending</Badge>;
    case "Overdue":
      return <Badge className="bg-red-500 hover:bg-red-600 text-white">Overdue</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const PolicyDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const policy = getPolicyDetails(id || "");

  if (!policy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Policy Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested policy could not be found.</p>
            <Button onClick={() => {
              if (window.location.pathname.includes('/broker/')) {
                navigate("/broker/dashboard");
              } else if (window.location.pathname.includes('/insurer/')) {
                navigate("/insurer/dashboard");
              } else {
                navigate("/");
              }
            }}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.location.pathname.includes('/broker/')) {
                    navigate("/broker/dashboard");
                  } else if (window.location.pathname.includes('/insurer/')) {
                    navigate("/insurer/dashboard");
                  } else {
                    navigate("/");
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Policy Details - {policy.policyNumber}</h1>
                <p className="text-sm text-muted-foreground">{policy.insuredName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getPolicyStatusBadge(policy.policyStatus)}
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Policy Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Policy Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Policy Number</div>
                    <p className="font-medium">{policy.policyNumber}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Certificate Number</div>
                    <p className="font-medium">{policy.certificateNumber}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Issue Date</div>
                    <p className="font-medium">{policy.issueDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Effective Date</div>
                    <p className="font-medium">{policy.effectiveDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Expiry Date</div>
                    <p className="font-medium">{policy.expiryDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Policy Status</div>
                    <div className="mt-1">{getPolicyStatusBadge(policy.policyStatus)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Premium Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Base Premium</div>
                    <p className="font-medium">{policy.basePremium}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Tax Amount</div>
                    <p className="font-medium">{policy.taxAmount}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Total Premium</div>
                    <p className="font-medium text-lg text-primary">{policy.totalPremium}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payment Status</div>
                    <div className="mt-1">{getPaymentStatusBadge(policy.paymentStatus)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payment Date</div>
                    <p className="font-medium">{policy.paymentDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Insurer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Insurance Company</div>
                    <p className="font-medium">{policy.insurer}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Insurer Code</div>
                    <p className="font-medium">{policy.insurerCode}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Underwriter</div>
                    <p className="font-medium">{policy.underwriterName}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Underwriter Email</div>
                    <p className="font-medium">{policy.underwriterEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Project Name</div>
                    <p className="font-medium">{policy.projectName}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Project Type</div>
                    <p className="font-medium">{policy.projectType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Construction Type</div>
                    <p className="font-medium">{policy.constructionType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Project Value</div>
                    <p className="font-medium">{policy.projectValue}</p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">Project Address</div>
                    <p className="font-medium">{policy.projectAddress}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Construction Start Date</div>
                    <p className="font-medium">{policy.startDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Completion Date</div>
                    <p className="font-medium">{policy.completionDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Construction Period</div>
                    <p className="font-medium">{policy.constructionPeriod}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Maintenance Period</div>
                    <p className="font-medium">{policy.maintenancePeriod}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insured Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Insured Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Insured Name</div>
                    <p className="font-medium">{policy.insuredName}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Role of Insured</div>
                    <p className="font-medium">{policy.roleOfInsured}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Contact Email</div>
                    <p className="font-medium">{policy.contactEmail}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone Number</div>
                    <p className="font-medium">{policy.phoneNumber}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">VAT Number</div>
                    <p className="font-medium">{policy.vatNumber}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Country of Incorporation</div>
                    <p className="font-medium">{policy.countryOfIncorporation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Structure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contract Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Main Contractor</div>
                    <p className="font-medium">{policy.mainContractor}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Principal/Owner</div>
                    <p className="font-medium">{policy.principalOwner}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Contract Type</div>
                    <p className="font-medium">{policy.contractType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Contract Number</div>
                    <p className="font-medium">{policy.contractNumber}</p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">Engineer/Consultant</div>
                    <p className="font-medium">{policy.engineerConsultant}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cover Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Cover Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Sum Insured - Material Damage</div>
                    <p className="font-medium">{policy.sumInsuredMaterial}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Sum Insured - Plant & Equipment</div>
                    <p className="font-medium">{policy.sumInsuredPlant}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Sum Insured - Temporary Buildings</div>
                    <p className="font-medium">{policy.sumInsuredTemporary}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Principal's Existing Property</div>
                    <p className="font-medium">{policy.principalExistingProperty}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Third Party Liability Limit</div>
                    <p className="font-medium">{policy.tplLimit}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Cross Liability Cover</div>
                    <p className="font-medium">{policy.crossLiabilityCover}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Removal of Debris Limit</div>
                    <p className="font-medium">{policy.removalDebrisLimit}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Deductible</div>
                    <p className="font-medium">{policy.deductible}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policy Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Policy Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Geographical Limits</div>
                    <p className="font-medium">{policy.geographicalLimits}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Jurisdiction</div>
                    <p className="font-medium">{policy.jurisdiction}</p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">Governing Law</div>
                    <p className="font-medium">{policy.governingLaw}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Extensions Included</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${policy.extensions.debrisRemoval ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${policy.extensions.debrisRemoval ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Debris Removal
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${policy.extensions.professionalFees ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${policy.extensions.professionalFees ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Professional Fees
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${policy.extensions.offsiteStorage ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${policy.extensions.offsiteStorage ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Offsite Storage
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${policy.extensions.transitStorage ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${policy.extensions.transitStorage ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Transit Storage
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${policy.extensions.icow ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${policy.extensions.icow ? 'text-foreground' : 'text-muted-foreground'}`}>
                        ICOW
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`w-4 h-4 ${policy.extensions.fireBrigadeCharges ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${policy.extensions.fireBrigadeCharges ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Fire Brigade Charges
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">CEW Policy Coverage & Wordings</h4>
                  
                  {/* Extensions with Wordings */}
                  {policy.selectedCEWItems.filter(item => item.type === "extension").length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-primary">Policy Extensions</h5>
                      <Accordion type="multiple" className="w-full">
                        {policy.selectedCEWItems.filter(item => item.type === "extension").map((item) => (
                          <AccordionItem key={item.id} value={item.id.toString()}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex justify-between items-center w-full pr-4">
                                <span className="font-medium text-sm">{item.name}</span>
                                <Badge variant="secondary" className="text-xs">{item.selectedOption}</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 pt-2">
                              <p className="text-sm text-muted-foreground leading-relaxed">{item.wording}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}

                  {/* Conditions with Wordings */}
                  {policy.selectedCEWItems.filter(item => item.type === "condition").length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-orange-600">Exclusions</h5>
                      <Accordion type="multiple" className="w-full">
                        {policy.selectedCEWItems.filter(item => item.type === "condition").map((item) => (
                          <AccordionItem key={item.id} value={item.id.toString()}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex justify-between items-center w-full pr-4">
                                <span className="font-medium text-sm">{item.name}</span>
                                <Badge variant="outline" className="text-xs border-orange-300">{item.selectedOption}</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 pt-2">
                              <p className="text-sm text-muted-foreground leading-relaxed">{item.wording}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}

                  {/* Warranties with Wordings */}
                  {policy.selectedCEWItems.filter(item => item.type === "warranty").length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-blue-600">Warranties</h5>
                      <Accordion type="multiple" className="w-full">
                        {policy.selectedCEWItems.filter(item => item.type === "warranty").map((item) => (
                          <AccordionItem key={item.id} value={item.id.toString()}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex justify-between items-center w-full pr-4">
                                <span className="font-medium text-sm">{item.name}</span>
                                <Badge variant="outline" className="text-xs border-blue-300">{item.selectedOption}</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-4 pt-2">
                              <p className="text-sm text-muted-foreground leading-relaxed">{item.wording}</p>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Policy Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Policy Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Policy Number</div>
                  <p className="font-medium">{policy.policyNumber}</p>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Insurer</div>
                  <p className="font-medium">{policy.insurer}</p>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Premium</div>
                  <p className="font-medium text-lg text-primary">{policy.totalPremium}</p>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Effective Period</div>
                  <p className="font-medium">{policy.effectiveDate} to {policy.expiryDate}</p>
                </div>
                <Separator />
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1">{getPolicyStatusBadge(policy.policyStatus)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Policy Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Policy Documents</CardTitle>
                <CardDescription>Download available policy documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {policy.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} • {doc.size}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={doc.status !== "Available"}
                      className="gap-1"
                    >
                      <Download className="w-3 h-3" />
                      {doc.status === "Available" ? "Download" : "Pending"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Download All Documents
                </Button>
                <Button variant="outline" className="w-full gap-2">
                  <Share2 className="w-4 h-4" />
                  Email Policy Documents
                </Button>
                {window.location.pathname.includes('/broker/') && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => navigate('/broker/dashboard')}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetails;