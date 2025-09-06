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
          type: "exclusions",
          selectedOption: "Zone 3-4 Coverage",
          wording: "Special conditions apply for earthquake coverage in seismic zones 3 and 4, with enhanced construction requirements and specific exclusions for areas with high seismic activity."
        },
        {
          id: 8,
          name: "Flood And Inundation Clause",
          type: "exclusions",
          selectedOption: "Flood Zones 1-2",
          wording: "Coverage conditions for flood and inundation risks in designated flood-prone areas, with specific requirements for flood protection measures and drainage systems."
        },
        {
          id: 9,
          name: "Windstorm Or Wind Related Water Damage",
          type: "exclusions",
          selectedOption: "Category 3+ Events",
          wording: "Special conditions for windstorm coverage including Category 3 and above storm events, with specific requirements for wind-resistant construction and water damage protection."
        },
        {
          id: 10,
          name: "Structures in Earthquake Zones Warranty",
          type: "warranties",
          selectedOption: "Seismic Standards",
          wording: "Warranty requirements for structures in earthquake zones, ensuring compliance with local seismic building codes and enhanced structural design standards."
        },
        {
          id: 11,
          name: "Property In Off-Site Storage Clause",
          type: "warranties",
          selectedOption: "Secure Storage",
          wording: "Warranty coverage for property stored in off-site locations, with specific security and storage condition requirements to maintain coverage validity."
        },
        {
          id: 12,
          name: "Serial Losses Clause",
          type: "warranties",
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
          type: "exclusions",
          selectedOption: "Zone 3-4 Coverage",
          wording: "Special conditions apply for earthquake coverage in seismic zones 3 and 4, with enhanced construction requirements and specific exclusions for areas with high seismic activity."
        },
        {
          id: 8,
          name: "Flood And Inundation Clause",
          type: "exclusions",
          selectedOption: "Flood Zones 1-2",
          wording: "Coverage conditions for flood and inundation risks in designated flood-prone areas, with specific requirements for flood protection measures and drainage systems."
        },
        {
          id: 9,
          name: "Windstorm Or Wind Related Water Damage",
          type: "exclusions",
          selectedOption: "Category 3+ Events",
          wording: "Special conditions for windstorm coverage including Category 3 and above storm events, with specific requirements for wind-resistant construction and water damage protection."
        },
        {
          id: 10,
          name: "Structures in Earthquake Zones Warranty",
          type: "warranties",
          selectedOption: "Seismic Standards",
          wording: "Warranty requirements for structures in earthquake zones, ensuring compliance with local seismic building codes and enhanced structural design standards."
        },
        {
          id: 11,
          name: "Property In Off-Site Storage Clause",
          type: "warranties",
          selectedOption: "Secure Storage",
          wording: "Warranty coverage for property stored in off-site locations, with specific security and storage condition requirements to maintain coverage validity."
        },
        {
          id: 12,
          name: "Serial Losses Clause",
          type: "warranties",
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

const MarketAdminInsurerPolicyDetails = () => {
  const navigate = useNavigate();
  const { policyId, insurerId } = useParams();
  const policy = getPolicyDetails(policyId || "");

  const handleDownload = (documentName: string) => {
    // Placeholder for actual download functionality
    console.log(`Downloading ${documentName}`);
  };

  const handleShare = () => {
    // Placeholder for sharing functionality
    console.log("Sharing policy");
  };

  if (!policy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Policy Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested policy could not be found.</p>
            <Button onClick={() => navigate(`/market-admin/insurer/${insurerId}/dashboard`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Insurer Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group CEW items by type
  const extensions = policy.selectedCEWItems.filter(item => item.type === 'extension');
  const exclusions = policy.selectedCEWItems.filter(item => item.type === 'exclusions');
  const warranties = policy.selectedCEWItems.filter(item => item.type === 'warranties');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/market-admin/insurer/${insurerId}/dashboard`)}
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
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Policy Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
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
                    <div className="text-sm font-medium text-muted-foreground">Deductible</div>
                    <p className="font-medium">{policy.deductible}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Premium Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <p className="font-medium text-lg">{policy.totalPremium}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-muted-foreground">Payment Status:</div>
                    {getPaymentStatusBadge(policy.paymentStatus)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Payment Date</div>
                    <p className="font-medium">{policy.paymentDate}</p>
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
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Project Name</div>
                  <p className="font-medium">{policy.projectName}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Project Type</div>
                    <p className="font-medium">{policy.projectType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Construction Type</div>
                    <p className="font-medium">{policy.constructionType}</p>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Project Address</div>
                  <p className="font-medium">{policy.projectAddress}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Project Value</div>
                    <p className="font-medium">{policy.projectValue}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                    <p className="font-medium">{policy.startDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Completion Date</div>
                    <p className="font-medium">{policy.completionDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Extensions, Exclusions, and Warranties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Coverage Details
                </CardTitle>
                <CardDescription>
                  Policy extensions, exclusions, and warranties with their respective terms and conditions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="space-y-2">
                  {/* Extensions */}
                  {extensions.length > 0 && (
                    <AccordionItem value="extensions" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Extensions ({extensions.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        {extensions.map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 bg-muted/50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{item.name}</h4>
                              <Badge variant="secondary">{item.selectedOption}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.wording}
                            </p>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Exclusions */}
                  {exclusions.length > 0 && (
                    <AccordionItem value="exclusions" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">Exclusions ({exclusions.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        {exclusions.map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 bg-muted/50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{item.name}</h4>
                              <Badge variant="secondary">{item.selectedOption}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.wording}
                            </p>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Warranties */}
                  {warranties.length > 0 && (
                    <AccordionItem value="warranties" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Warranties ({warranties.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        {warranties.map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 bg-muted/50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{item.name}</h4>
                              <Badge variant="secondary">{item.selectedOption}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.wording}
                            </p>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Policy Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {policy.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.type} • {doc.size}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc.name)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Insurer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Insurer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Company</div>
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
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <p className="font-medium text-sm">{policy.underwriterEmail}</p>
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
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Company Name</div>
                  <p className="font-medium">{policy.insuredName}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Role</div>
                  <p className="font-medium">{policy.roleOfInsured}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">VAT Number</div>
                  <p className="font-medium">{policy.vatNumber}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Country</div>
                  <p className="font-medium">{policy.countryOfIncorporation}</p>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Coverage Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Contract Works</div>
                  <p className="font-medium">{policy.sumInsuredMaterial}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Plant & Equipment</div>
                  <p className="font-medium">{policy.sumInsuredPlant}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">TPL Limit</div>
                  <p className="font-medium">{policy.tplLimit}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Debris Removal</div>
                  <p className="font-medium">{policy.removalDebrisLimit}</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAdminInsurerPolicyDetails;