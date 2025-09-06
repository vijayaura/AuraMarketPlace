import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Building2, User, Calendar, DollarSign, Shield, FileText, AlertTriangle, Briefcase, CheckCircle, FileCheck, Download, Share2 } from "lucide-react";

// Policy details data
const getPolicyDetails = (id: string) => {
  const policies = {
    "P001": {
      id: "P001",
      policyNumber: "POL-2024-001",
      insuredName: "Al Habtoor Construction LLC",
      projectName: "Al Habtoor Tower Development",
      projectType: "Commercial",
      premium: "AED 57,800",
      commission: "AED 1,734",
      startDate: "2024-02-01",
      endDate: "2025-02-01",
      policyStatus: "active",
      sumInsured: "AED 8,450,000",
      insurer: "Emirates Insurance",
      broker: "Ahmed Al-Mansoori",
      constructionType: "Reinforced Concrete",
      buildingHeight: "45 floors",
      buildingAge: "New Construction",
      location: "Downtown Dubai",
      occupation: "Mixed Use Development",
      coverages: [
        { name: "All Risks Property Insurance", sumInsured: "AED 8,450,000", premium: "AED 42,250", rate: "0.50%" },
        { name: "Third Party Liability", sumInsured: "AED 1,000,000", premium: "AED 5,000", rate: "0.50%" },
        { name: "Employers Liability", sumInsured: "AED 500,000", premium: "AED 2,500", rate: "0.50%" },
        { name: "Professional Indemnity", sumInsured: "AED 2,000,000", premium: "AED 8,050", rate: "0.40%" }
      ],
      cewItems: [
        { type: "Material Damage", description: "Earthquake Extension", premium: "AED 1,200", selected: true },
        { type: "Material Damage", description: "Flood Extension", premium: "AED 800", selected: true },
        { type: "Liability", description: "Cross Liability", premium: "AED 500", selected: false },
        { type: "Liability", description: "Product Liability Extension", premium: "AED 750", selected: true },
        { type: "Additional", description: "Business Interruption", premium: "AED 2,000", selected: true }
      ],
      documents: [
        { name: "Policy Certificate", type: "PDF", size: "2.3 MB", uploadDate: "2024-02-01" },
        { name: "Policy Schedule", type: "PDF", size: "1.8 MB", uploadDate: "2024-02-01" },
        { name: "Policy Wording", type: "PDF", size: "4.2 MB", uploadDate: "2024-02-01" },
        { name: "Premium Receipt", type: "PDF", size: "0.8 MB", uploadDate: "2024-02-02" }
      ]
    },
    "P002": {
      id: "P002",
      policyNumber: "POL-2024-002",
      insuredName: "Emaar Properties",
      projectName: "Downtown Residential Complex",
      projectType: "Residential",
      premium: "AED 42,250",
      commission: "AED 1,268",
      startDate: "2024-01-28",
      endDate: "2025-01-28",
      policyStatus: "active",
      sumInsured: "AED 6,200,000",
      insurer: "AXA Gulf",
      broker: "Sarah Johnson",
      constructionType: "Reinforced Concrete",
      buildingHeight: "30 floors",
      buildingAge: "New Construction",
      location: "Dubai Marina",
      occupation: "Residential Towers",
      coverages: [
        { name: "All Risks Property Insurance", sumInsured: "AED 6,200,000", premium: "AED 31,000", rate: "0.50%" },
        { name: "Third Party Liability", sumInsured: "AED 1,000,000", premium: "AED 4,500", rate: "0.45%" },
        { name: "Employers Liability", sumInsured: "AED 500,000", premium: "AED 2,250", rate: "0.45%" },
        { name: "Professional Indemnity", sumInsured: "AED 1,000,000", premium: "AED 4,500", rate: "0.45%" }
      ],
      cewItems: [
        { type: "Material Damage", description: "Earthquake Extension", premium: "AED 1,000", selected: true },
        { type: "Material Damage", description: "Flood Extension", premium: "AED 650", selected: false },
        { type: "Liability", description: "Cross Liability", premium: "AED 400", selected: true },
        { type: "Additional", description: "Loss of Rent", premium: "AED 1,500", selected: true }
      ],
      documents: [
        { name: "Policy Certificate", type: "PDF", size: "2.1 MB", uploadDate: "2024-01-28" },
        { name: "Policy Schedule", type: "PDF", size: "1.6 MB", uploadDate: "2024-01-28" },
        { name: "Policy Wording", type: "PDF", size: "3.8 MB", uploadDate: "2024-01-28" },
        { name: "Premium Receipt", type: "PDF", size: "0.7 MB", uploadDate: "2024-01-29" }
      ]
    },
    "P003": {
      id: "P003",
      policyNumber: "POL-2024-003",
      insuredName: "DAMAC Properties",
      projectName: "Marina Shopping Mall Renovation",
      projectType: "Commercial",
      premium: "AED 91,200",
      commission: "AED 2,736",
      startDate: "2024-01-25",
      endDate: "2025-01-25",
      policyStatus: "active",
      sumInsured: "AED 14,800,000",
      insurer: "Oman Insurance",
      broker: "Mohammed Hassan",
      constructionType: "Steel Frame",
      buildingHeight: "8 floors",
      buildingAge: "Renovation",
      location: "Dubai Marina",
      occupation: "Shopping Mall",
      coverages: [
        { name: "All Risks Property Insurance", sumInsured: "AED 14,800,000", premium: "AED 74,000", rate: "0.50%" },
        { name: "Third Party Liability", sumInsured: "AED 2,000,000", premium: "AED 10,000", rate: "0.50%" },
        { name: "Employers Liability", sumInsured: "AED 1,000,000", premium: "AED 4,000", rate: "0.40%" },
        { name: "Professional Indemnity", sumInsured: "AED 1,500,000", premium: "AED 3,200", rate: "0.21%" }
      ],
      cewItems: [
        { type: "Material Damage", description: "Earthquake Extension", premium: "AED 2,000", selected: true },
        { type: "Material Damage", description: "Flood Extension", premium: "AED 1,500", selected: true },
        { type: "Liability", description: "Cross Liability", premium: "AED 800", selected: true },
        { type: "Liability", description: "Product Liability Extension", premium: "AED 1,200", selected: true },
        { type: "Additional", description: "Business Interruption", premium: "AED 3,500", selected: true }
      ],
      documents: [
        { name: "Policy Certificate", type: "PDF", size: "2.5 MB", uploadDate: "2024-01-25" },
        { name: "Policy Schedule", type: "PDF", size: "2.0 MB", uploadDate: "2024-01-25" },
        { name: "Policy Wording", type: "PDF", size: "4.8 MB", uploadDate: "2024-01-25" },
        { name: "Premium Receipt", type: "PDF", size: "0.9 MB", uploadDate: "2024-01-26" }
      ]
    }
  };
  
  return policies[id as keyof typeof policies] || null;
};

const getPolicyStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    case "expired":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
    case "cancelled":
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const MarketAdminPolicyDetails = () => {
  const navigate = useNavigate();
  const { policyId } = useParams();
  const policy = getPolicyDetails(policyId || "");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
            <Button onClick={() => navigate("/market-admin/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group CEW items by type
  const groupedCEWItems = policy.cewItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/market-admin/dashboard")}
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
              <Button onClick={handleShare} size="sm" variant="outline">
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
                  <FileCheck className="w-5 h-5" />
                  Policy Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Policy Number</div>
                    <p className="text-sm font-semibold">{policy.policyNumber}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Status</div>
                    <div className="mt-1">
                      {getPolicyStatusBadge(policy.policyStatus)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                    <p className="text-sm">{policy.startDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">End Date</div>
                    <p className="text-sm">{policy.endDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Broker</div>
                    <p className="text-sm text-primary font-medium">{policy.broker}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Insurer</div>
                    <p className="text-sm text-primary font-medium">{policy.insurer}</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Project Name</div>
                    <p className="text-sm font-semibold">{policy.projectName}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Project Type</div>
                    <p className="text-sm">{policy.projectType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Construction Type</div>
                    <p className="text-sm">{policy.constructionType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Building Height</div>
                    <p className="text-sm">{policy.buildingHeight}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Building Age</div>
                    <p className="text-sm">{policy.buildingAge}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Location</div>
                    <p className="text-sm">{policy.location}</p>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">Occupation</div>
                    <p className="text-sm">{policy.occupation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Coverage Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {policy.coverages.map((coverage, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{coverage.name}</h4>
                        <Badge variant="outline">{coverage.rate}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sum Insured:</span>
                          <span className="ml-2 font-medium">{coverage.sumInsured}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Premium:</span>
                          <span className="ml-2 font-medium text-primary">{coverage.premium}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CEW Items */}
            <Card>
              <CardHeader>
                <CardTitle>Construction & Engineering Works Items</CardTitle>
                <CardDescription>Additional coverage extensions and endorsements</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {Object.entries(groupedCEWItems).map(([type, items]) => (
                    <AccordionItem key={type} value={type}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{type}</Badge>
                          <span>{items.length} items</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          {items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                {item.selected ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <div className="w-4 h-4 border border-muted-foreground rounded-full" />
                                )}
                                <span className="text-sm font-medium">{item.description}</span>
                              </div>
                              <span className="text-sm font-medium text-primary">{item.premium}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
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
              <CardContent>
                <div className="space-y-3">
                  {policy.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.type} • {doc.size} • Uploaded {doc.uploadDate}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(doc.name)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Total Sum Insured</span>
                    <span className="font-semibold">{policy.sumInsured}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Total Premium</span>
                    <span className="font-semibold text-primary">{policy.premium}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Commission</span>
                    <span className="font-semibold text-green-600">{policy.commission}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policy Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Policy Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Policy Activated</p>
                      <p className="text-xs text-muted-foreground">{policy.startDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Policy Expires</p>
                      <p className="text-xs text-muted-foreground">{policy.endDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Certificate
                </Button>
                <Button className="w-full" variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Report Claim
                </Button>
                <Button className="w-full" variant="outline">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Renewal Quote
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAdminPolicyDetails;