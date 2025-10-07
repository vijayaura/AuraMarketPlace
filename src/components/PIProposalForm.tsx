import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Briefcase, Shield, FileText, CheckCircle, Building, MapPin, Calendar, DollarSign, Plus, Trash2, Folder, Users, Circle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumberWithCommas, removeCommasFromNumber, handleNumberInputChange } from "@/utils/numberFormat";
import { DocumentUpload } from "@/components/DocumentUpload";

interface PIProposalFormProps {
  onStepChange?: (step: number) => void;
  onQuoteReferenceChange?: (reference: string) => void;
  onStepCompletionChange?: (completionStatus: Record<string, boolean>) => void;
}

export const PIProposalForm = ({ 
  onStepChange, 
  onQuoteReferenceChange,
  onStepCompletionChange 
}: PIProposalFormProps = {}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedQuotes, setSelectedQuotes] = useState<number[]>([]);
  const { toast } = useToast();

  // PI-specific document types (mock data)
  const [piDocuments, setPiDocuments] = useState([
    {
      id: 1,
      name: "Professional License & Registration",
      description: "Valid professional license and registration documents",
      required: true,
      status: "pending" as const,
      fileSize: null,
      fileName: undefined,
      fileUrl: undefined
    },
    {
      id: 2,
      name: "Claims History Report",
      description: "Detailed report of past claims and incidents (if any)",
      required: false,
      status: "pending" as const,
      fileSize: null,
      fileName: undefined,
      fileUrl: undefined
    }
  ]);

  // Mock quotes from different insurers
  const mockQuotes = [
    { 
      id: 1, 
      insurerName: "AXA Gulf", 
      insurerLogo: "/lovable-uploads/a1521c76-be1d-45e9-8d86-5df99d190608.png",
      basePremium: 4200, 
      riskLoading: 800, 
      additionalCoverage: 300, 
      totalPremium: 5300,
      validityDays: 30
    },
    { 
      id: 2, 
      insurerName: "Oman Insurance Company", 
      insurerLogo: "/lovable-uploads/b8cba7d5-7174-48dc-b189-00f94bb589c2.png",
      basePremium: 3900, 
      riskLoading: 750, 
      additionalCoverage: 250, 
      totalPremium: 4900,
      validityDays: 30
    },
    { 
      id: 3, 
      insurerName: "Dubai Insurance Company", 
      insurerLogo: "/lovable-uploads/bdde1c6a-a5e3-472f-8114-0bc05f7a216d.png",
      basePremium: 4500, 
      riskLoading: 850, 
      additionalCoverage: 350, 
      totalPremium: 5700,
      validityDays: 30
    },
    { 
      id: 4, 
      insurerName: "Abu Dhabi National Insurance", 
      insurerLogo: "/lovable-uploads/d633d0c0-4f36-4381-a851-f0dbdc843253.png",
      basePremium: 4100, 
      riskLoading: 780, 
      additionalCoverage: 280, 
      totalPremium: 5160,
      validityDays: 30
    }
  ];

  const handleQuoteSelection = (quoteId: number) => {
    setSelectedQuotes(prev => {
      if (prev.includes(quoteId)) {
        return prev.filter(id => id !== quoteId);
      } else if (prev.length < 2) {
        return [...prev, quoteId];
      } else {
        toast({
          title: "Selection Limit",
          description: "You can only select up to 2 quotes for comparison.",
          variant: "destructive"
        });
        return prev;
      }
    });
  };

  const handleCompareQuotes = () => {
    if (selectedQuotes.length !== 2) {
      toast({
        title: "Selection Required",
        description: "Please select exactly 2 quotes to compare.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Compare Quotes",
      description: `Comparing quotes from ${selectedQuotes.length} insurers.`,
    });
    console.log("Comparing quotes:", selectedQuotes);
  };

  const handleDownloadQuote = (insurerName: string) => {
    toast({
      title: "Download Started",
      description: `Downloading quote from ${insurerName}...`,
    });
    console.log("Downloading quote for:", insurerName);
  };

  const handleSelectPlan = (insurerName: string, premium: number) => {
    const selectedQuote = mockQuotes.find(q => q.insurerName === insurerName && q.totalPremium === premium);
    
    // Prepare data to pass to success page
    const piSuccessData = {
      quoteReference: 'PI-2024-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      insurerName: selectedQuote?.insurerName || insurerName,
      insurerLogo: selectedQuote?.insurerLogo || '',
      totalPremium: premium,
      professionalInfo: {
        companyName: formData.companyName,
        professionType: formData.professionType,
        businessDescription: formData.professionalServicesDescription,
        businessAddress: formData.practiceAddress,
        yearsInBusiness: formData.yearsInPractice,
        annualRevenue: formData.annualFeeIncome,
        numberOfEmployees: formData.numberOfEmployees
      },
      coverageDetails: {
        limitOfIndemnity: formData.limitOfIndemnity,
        deductible: formData.deductible,
        policyPeriod: formData.policyPeriod,
        retroactiveCoverage: formData.retroactiveCoverage,
        additionalCoverages: formData.additionalCoverages
      },
      riskProfile: {
        previousInsurer: formData.previousInsurer,
        yearsWithPreviousInsurer: formData.yearsWithPreviousInsurer,
        lossesInLastFiveYears: formData.lossesInLastFiveYears
      }
    };
    
    // Navigate to PI Success page with data
    navigate('/customer/pi-success', { state: piSuccessData });
  };

  // Define the 6 steps matching the design
  const steps = [
    {
      id: "business",
      label: "Professional Information",
      icon: Folder
    },
    {
      id: "risk",
      label: "Risk Profile", 
      icon: Shield
    },
    {
      id: "coverage",
      label: "Coverage Details",
      icon: FileText
    },
    {
      id: "claims",
      label: "Claims History",
      icon: Users
    },
    {
      id: "documents",
      label: "Required Documents",
      icon: FileText
    },
    {
      id: "quotes",
      label: "Quotes",
      icon: CheckCircle
    }
  ];

  // Form data state
  const [formData, setFormData] = useState({
    // Professional Information
    companyName: "TechFlow Solutions Ltd",
    businessType: "IT Services",
    annualTurnover: "3200000",
    businessDescription: "We specialize in custom software development, cloud migration services, and digital transformation consulting for mid to large-scale enterprises. Our team delivers enterprise applications, mobile solutions, and AI-powered systems across various industries including healthcare, finance, and e-commerce.",
    businessAddress: "Dubai Internet City, Building 12, Floor 8\nDubai, UAE\nP.O. Box 98765",
    numberOfEmployees: "11-25",
    
    // Risk Profile
    yearsInBusiness: "6-10 years",
    primaryJurisdiction: "UAE",
    professionalLicense: true,
    industryAssociation: false,
    advancedDegree: true,
    continuingEducation: true,
    highRiskActivities: "We handle sensitive data processing for healthcare clients and financial institutions. Our projects include developing payment gateways, patient management systems, and trading platforms that require high security standards and compliance with data protection regulations.",
    
    // Coverage Details
    limitOfIndemnity: "1000000",
    deductible: "10000",
    policyPeriod: "12 months",
    retroactiveCoverage: "Yes - 6 months",
    additionalCoverages: ["Cyber Liability", "Media Liability", "Intellectual Property Liability"],
    defenseCosts: false,
    lossOfDocuments: false,
    dishonestyOfEmployees: false,
    copyrightInfringement: false,
    
    // Claims History
    lossesInLastFiveYears: "no",
    claimsHistory: {
      2021: { count: "0", amount: "0", description: "" },
      2022: { count: "0", amount: "0", description: "" },
      2023: { count: "0", amount: "0", description: "" },
      2024: { count: "0", amount: "0", description: "" },
      2025: { count: "0", amount: "0", description: "" }
    } as Record<number, { count: string; amount: string; description: string }>,
    writtenProcedures: true,
    staffTraining: true,
    contractReview: true,
    professionalSupervision: false
  });

  // Step completion status
  const [stepCompletionStatus, setStepCompletionStatus] = useState({
    business_information: false,
    risk_profile: false,
    coverage_details: false,
    claims_history: false,
    generate_quote: false
  });

  // Update step completion status
  useEffect(() => {
    onStepCompletionChange?.(stepCompletionStatus);
  }, [stepCompletionStatus, onStepCompletionChange]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
      updateStepCompletion(currentStep, true);
    }
  };

  const handleBack = () => {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    onStepChange?.(prevStep);
  };

  const updateStepCompletion = (stepIndex: number, completed: boolean) => {
    const stepKeys = ['business_information', 'risk_profile', 'coverage_details', 'claims_history', 'generate_quote'];
    if (stepKeys[stepIndex]) {
      setStepCompletionStatus(prev => ({
        ...prev,
        [stepKeys[stepIndex]]: completed
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Professional Information
        if (!formData.companyName || !formData.businessType || !formData.annualTurnover || 
            !formData.businessDescription || !formData.businessAddress || !formData.numberOfEmployees) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required professional information fields.",
            variant: "destructive"
          });
          return false;
        }
        return true;
      
      case 1: // Risk Profile
        if (!formData.yearsInBusiness || !formData.primaryJurisdiction) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required risk profile fields.",
            variant: "destructive"
          });
          return false;
        }
        return true;
      
      case 2: // Coverage Details
        if (!formData.limitOfIndemnity || !formData.deductible || !formData.policyPeriod || !formData.retroactiveCoverage) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required coverage details.",
            variant: "destructive"
          });
          return false;
        }
        return true;
      
      case 3: // Claims History
        if (!formData.lossesInLastFiveYears) {
          toast({
            title: "Validation Error",
            description: "Please select whether you have losses in the last 5 years.",
            variant: "destructive"
          });
          return false;
        }
        
        // If "yes" is selected, validate that at least one year has claims data
        if (formData.lossesInLastFiveYears === "yes") {
          const hasAnyClaimData = Object.values(formData.claimsHistory).some(
            claim => claim.count && parseInt(claim.count) > 0
          );
          
          if (!hasAnyClaimData) {
            toast({
              title: "Validation Error",
              description: "Please provide claims details for at least one year.",
              variant: "destructive"
            });
            return false;
          }
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    updateStepCompletion(4, true);
    toast({
      title: "Quote Generated",
      description: "Your Professional Indemnity quote has been generated successfully.",
    });
    console.log("PI Quote Data:", formData);
  };

  const professionTypeOptions = [
    "Consulting Services",
    "Legal Services", 
    "Accounting & Finance",
    "Architecture & Engineering",
    "IT Services",
    "Medical Services",
    "Other Professional Services"
  ];

  const additionalCoverageOptions = [
    {
      title: "Cyber Liability",
      description: "Protection against data breaches and cyber attacks"
    },
    {
      title: "Employment Practices Liability",
      description: "Coverage for workplace discrimination and harassment claims"
    },
    {
      title: "Directors & Officers Liability",
      description: "Protection for company executives and board members"
    },
    {
      title: "Crime & Fidelity",
      description: "Coverage for employee theft and fraudulent activities"
    },
    {
      title: "Media Liability",
      description: "Protection for defamation and advertising injury claims"
    },
    {
      title: "Technology Errors & Omissions",
      description: "Coverage for software and technology service failures"
    },
    {
      title: "Environmental Liability",
      description: "Protection against environmental damage claims"
    },
    {
      title: "Product Liability",
      description: "Coverage for product-related injury or damage claims"
    },
    {
      title: "Public Relations Liability",
      description: "Protection for reputation management and PR crises"
    },
    {
      title: "Intellectual Property Liability",
      description: "Coverage for IP infringement and patent disputes"
    }
  ];

  const employeeRangeOptions = [
    "1-5",
    "6-10", 
    "11-25",
    "26-50",
    "51-100",
    "100+"
  ];

  const yearsInBusinessOptions = [
    "Less than 1 year",
    "1-2 years",
    "3-5 years", 
    "6-10 years",
    "11-20 years",
    "More than 20 years"
  ];

  const jurisdictionOptions = [
    "UAE",
    "GCC",
    "Middle East",
    "Asia",
    "Europe",
    "North America",
    "Worldwide"
  ];

  const coverageLimitOptions = [
    "250000",
    "500000",
    "1000000",
    "2000000",
    "5000000",
    "10000000"
  ];

  const deductibleOptions = [
    "5000",
    "10000",
    "25000",
    "50000",
    "100000"
  ];

  const policyPeriodOptions = [
    "12 months",
    "24 months",
    "36 months"
  ];

  const retroactiveOptions = [
    "Yes - 6 months",
    "Yes - 12 months", 
    "Yes - 24 months",
    "Yes - Unlimited",
    "No"
  ];

  const claimsNumberOptions = [
    "1",
    "2",
    "3",
    "4",
    "5+"
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Professional Information
        return (
          <TabsContent value="business" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Enter your company name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessType">Profession Type *</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select profession type" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualTurnover">Annual Turnover (AED) *</Label>
                <Input
                  id="annualTurnover"
                  value={formatNumberWithCommas(formData.annualTurnover)}
                  onChange={(e) => {
                    const value = removeCommasFromNumber(e.target.value);
                    setFormData({ ...formData, annualTurnover: value });
                  }}
                  placeholder="1,000,000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfEmployees">Number of Employees *</Label>
                <Select
                  value={formData.numberOfEmployees}
                  onValueChange={(value) => setFormData({ ...formData, numberOfEmployees: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee range" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeRangeOptions.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessDescription">Professional Services Description *</Label>
                <Textarea
                  id="businessDescription"
                  value={formData.businessDescription}
                  onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                  placeholder="Describe your professional activities and services"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Professional Practice Address *</Label>
                <Textarea
                  id="businessAddress"
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  placeholder="Enter your complete practice address"
                  rows={4}
                />
              </div>
            </div>

          </TabsContent>
        );

      case 1: // Risk Profile
        return (
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="yearsInBusiness">Years in Practice *</Label>
                <Select
                  value={formData.yearsInBusiness}
                  onValueChange={(value) => setFormData({ ...formData, yearsInBusiness: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsInBusinessOptions.map((years) => (
                      <SelectItem key={years} value={years}>
                        {years}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryJurisdiction">Primary Jurisdiction *</Label>
                <Select
                  value={formData.primaryJurisdiction}
                  onValueChange={(value) => setFormData({ ...formData, primaryJurisdiction: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictionOptions.map((jurisdiction) => (
                      <SelectItem key={jurisdiction} value={jurisdiction}>
                        {jurisdiction}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Professional Qualifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="professionalLicense"
                    checked={formData.professionalLicense}
                    onCheckedChange={(checked) => setFormData({ ...formData, professionalLicense: checked as boolean })}
                  />
                  <Label htmlFor="professionalLicense">Professional License/Certification</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="industryAssociation"
                    checked={formData.industryAssociation}
                    onCheckedChange={(checked) => setFormData({ ...formData, industryAssociation: checked as boolean })}
                  />
                  <Label htmlFor="industryAssociation">Industry Association Membership</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="advancedDegree"
                    checked={formData.advancedDegree}
                    onCheckedChange={(checked) => setFormData({ ...formData, advancedDegree: checked as boolean })}
                  />
                  <Label htmlFor="advancedDegree">Advanced Degree/Qualification</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="continuingEducation"
                    checked={formData.continuingEducation}
                    onCheckedChange={(checked) => setFormData({ ...formData, continuingEducation: checked as boolean })}
                  />
                  <Label htmlFor="continuingEducation">Continuing Education Programs</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">High-Risk Activities</h3>
              <Textarea
                id="highRiskActivities"
                value={formData.highRiskActivities}
                onChange={(e) => setFormData({ ...formData, highRiskActivities: e.target.value })}
                placeholder="Describe any high-risk activities or services your practice provides"
                rows={4}
              />
            </div>
          </TabsContent>
        );

      case 2: // Coverage Details
        return (
          <TabsContent value="coverage" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="limitOfIndemnity">Limit of Indemnity (AED) *</Label>
                <Input
                  id="limitOfIndemnity"
                  value={formatNumberWithCommas(formData.limitOfIndemnity)}
                  onChange={(e) => {
                    const value = removeCommasFromNumber(e.target.value);
                    setFormData({ ...formData, limitOfIndemnity: value });
                  }}
                  placeholder="1,000,000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deductible">Deductible (AED) *</Label>
                <Select
                  value={formData.deductible}
                  onValueChange={(value) => setFormData({ ...formData, deductible: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deductible" />
                  </SelectTrigger>
                  <SelectContent>
                    {deductibleOptions.map((deductible) => (
                      <SelectItem key={deductible} value={deductible}>
                        AED {formatNumberWithCommas(deductible)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyPeriod">Policy Period *</Label>
                <Select
                  value={formData.policyPeriod}
                  onValueChange={(value) => setFormData({ ...formData, policyPeriod: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy period" />
                  </SelectTrigger>
                  <SelectContent>
                    {policyPeriodOptions.map((period) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retroactiveCoverage">Would you need retroactive coverage? *</Label>
                <Select
                  value={formData.retroactiveCoverage}
                  onValueChange={(value) => setFormData({ ...formData, retroactiveCoverage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    {retroactiveOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Coverages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {additionalCoverageOptions.map((coverage) => (
                  <div key={coverage.title} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => {
                    if (formData.additionalCoverages.includes(coverage.title)) {
                      setFormData({
                        ...formData,
                        additionalCoverages: formData.additionalCoverages.filter(c => c !== coverage.title)
                      });
                    } else {
                      setFormData({
                        ...formData,
                        additionalCoverages: [...formData.additionalCoverages, coverage.title]
                      });
                    }
                  }}>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`coverage-${coverage.title}`}
                        checked={formData.additionalCoverages.includes(coverage.title)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              additionalCoverages: [...formData.additionalCoverages, coverage.title]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              additionalCoverages: formData.additionalCoverages.filter(c => c !== coverage.title)
                            });
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`coverage-${coverage.title}`} className="text-sm font-medium cursor-pointer block mb-1">
                          {coverage.title}
                        </Label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {coverage.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        );

      case 3: // Claims History
        return (
          <TabsContent value="claims" className="space-y-6">
            {/* Claims History Section */}
            <div className="space-y-4 border-t border-border pt-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Claims History</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lossesInLastFiveYears">Any insurance losses in last 5 years? *</Label>
                  <Select value={formData.lossesInLastFiveYears || undefined} onValueChange={value => setFormData({
                    ...formData,
                    lossesInLastFiveYears: value
                  })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select yes or no" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select if you have had any insurance claims in the past 5 years</p>
                </div>
                
                {formData.lossesInLastFiveYears === "yes" && <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-medium text-foreground mb-4">Claims History Matrix (2021-2025)</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-20">Year</TableHead>
                              <TableHead className="w-32">Count of Claims</TableHead>
                              <TableHead className="w-40">Amount of Claims (AED)</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[2021, 2022, 2023, 2024, 2025].map(year => (
                              <TableRow key={year}>
                                <TableCell className="font-medium">{year}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={formData.claimsHistory?.[year]?.count || ""}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      claimsHistory: {
                                        ...formData.claimsHistory,
                                        [year]: {
                                          ...formData.claimsHistory?.[year],
                                          count: e.target.value
                                        }
                                      }
                                    })}
                                    placeholder="0"
                                    className="w-full"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={formData.claimsHistory?.[year]?.amount || ""}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      claimsHistory: {
                                        ...formData.claimsHistory,
                                        [year]: {
                                          ...formData.claimsHistory?.[year],
                                          amount: e.target.value
                                        }
                                      }
                                    })}
                                    placeholder="0"
                                    className="w-full"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={formData.claimsHistory?.[year]?.description || ""}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      claimsHistory: {
                                        ...formData.claimsHistory,
                                        [year]: {
                                          ...formData.claimsHistory?.[year],
                                          description: e.target.value
                                        }
                                      }
                                    })}
                                    placeholder="Brief description"
                                    className="w-full"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            {/* Risk Management Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Risk Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, writtenProcedures: !formData.writtenProcedures })}>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="writtenProcedures"
                      checked={formData.writtenProcedures}
                      onCheckedChange={(checked) => setFormData({ ...formData, writtenProcedures: checked as boolean })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="writtenProcedures" className="text-sm font-medium cursor-pointer block mb-1">
                        Written Procedures
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Documented quality control and operational procedures
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, staffTraining: !formData.staffTraining })}>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="staffTraining"
                      checked={formData.staffTraining}
                      onCheckedChange={(checked) => setFormData({ ...formData, staffTraining: checked as boolean })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="staffTraining" className="text-sm font-medium cursor-pointer block mb-1">
                        Staff Training
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Regular training programs for professional development
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, contractReview: !formData.contractReview })}>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="contractReview"
                      checked={formData.contractReview}
                      onCheckedChange={(checked) => setFormData({ ...formData, contractReview: checked as boolean })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="contractReview" className="text-sm font-medium cursor-pointer block mb-1">
                        Contract Review
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Systematic review of client contracts and agreements
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setFormData({ ...formData, professionalSupervision: !formData.professionalSupervision })}>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="professionalSupervision"
                      checked={formData.professionalSupervision}
                      onCheckedChange={(checked) => setFormData({ ...formData, professionalSupervision: checked as boolean })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="professionalSupervision" className="text-sm font-medium cursor-pointer block mb-1">
                        Professional Supervision
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Oversight systems for professional work quality
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        );

      case 4: // Required Documents
        return (
          <TabsContent value="documents" className="space-y-6">
            <div className="bg-card rounded-lg border p-6">
              <div className="text-left mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Upload Required Documents
                </h2>
                <p className="text-sm text-muted-foreground">
                  Please upload documents needed for underwriting
                </p>
              </div>
              <DocumentUpload 
                documents={piDocuments}
                onDocumentStatusChange={(updatedDocuments) => {
                  // Update PI documents state with new statuses
                  setPiDocuments(updatedDocuments);
                  console.log("PI Documents updated:", updatedDocuments);
                }}
                onDocumentTypesLoaded={(documentTypes) => {
                  console.log("Document types loaded:", documentTypes);
                }}
              />
            </div>
          </TabsContent>
        );

      case 5: // Quotes
        return (
          <TabsContent value="quotes" className="space-y-6">
            {/* Compare Button */}
            {selectedQuotes.length > 0 && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleCompareQuotes}
                  disabled={selectedQuotes.length !== 2}
                  className="bg-primary hover:bg-primary/90"
                >
                  Compare Selected Quotes ({selectedQuotes.length}/2)
                </Button>
              </div>
            )}

            {/* Quotes List */}
            <div className="space-y-4">
              {mockQuotes.map((quote) => (
                <Card key={quote.id} className={`border-2 transition-all ${selectedQuotes.includes(quote.id) ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-6">
                      {/* Left: Checkbox and Insurer Name */}
                      <div className="flex items-center gap-4 flex-1">
                        <Checkbox
                          checked={selectedQuotes.includes(quote.id)}
                          onCheckedChange={() => handleQuoteSelection(quote.id)}
                        />
                        <h4 className="text-lg font-semibold">{quote.insurerName}</h4>
                      </div>

                      {/* Right: Premium, Validity and Buttons */}
                      <div className="flex items-center gap-6">
                        {/* Premium and Validity */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            AED {formatNumberWithCommas(quote.totalPremium.toString())}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Valid for {quote.validityDays} days
                          </p>
                        </div>

                        {/* Download Quote Button */}
                        <Button
                          variant="outline"
                          onClick={() => handleDownloadQuote(quote.insurerName)}
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download Quote
                        </Button>

                        {/* Select Plan Button */}
                        <Button
                          onClick={() => handleSelectPlan(quote.insurerName, quote.totalPremium)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Select Plan
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Select up to 2 quotes to compare side by side. All quotes are subject to final underwriting approval.
            </p>
          </TabsContent>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Main Content */}
      <Card className="shadow-large border-border w-full overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                Create New Quote
              </CardTitle>
            </div>
            <div className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          {/* Progress Bar with Navigation Buttons */}
          <div className="flex items-center gap-4 mt-6">
            {/* Progress Bar */}
            <div className="flex-1 bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-smooth" style={{
                width: `${(currentStep + 1) / steps.length * 100}%`
              }} />
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Previous Button */}
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack}>
                  Previous
                </Button>
              )}
              
              {/* Next Button */}
              {currentStep < steps.length - 1 && (
                <Button onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          <Tabs value={steps[currentStep].id} className="w-full">
            {/* Step Navigation */}
            <div className="mb-8">
              <div className="w-full">
                {/* Mobile: Horizontal scroll */}
                <div className="md:hidden">
                  <div className="overflow-x-auto scrollbar-hide pb-2">
                    <div className="flex items-center gap-2 bg-muted p-2 rounded-lg w-max">
                      {steps.map((step, index) => (
                        <button 
                          key={step.id} 
                          onClick={() => setCurrentStep(index)} 
                          disabled={index > currentStep} 
                          className={`flex items-center gap-2 p-3 rounded-md text-xs font-medium transition-smooth flex-shrink-0 whitespace-nowrap ${
                            index === currentStep 
                              ? 'bg-primary text-primary-foreground shadow-glow' 
                              : index < currentStep 
                                ? 'bg-accent text-accent-foreground hover:bg-accent/80' 
                                : 'bg-card text-muted-foreground cursor-not-allowed opacity-60'
                          } ${index <= currentStep ? 'hover:scale-105' : ''}`}
                        >
                          <span className="text-xs font-bold">{index + 1}</span>
                          {React.createElement(step.icon, { className: "w-3 h-3 flex-shrink-0" })}
                          <span className="text-[10px] leading-tight">
                            {step.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Desktop: Horizontal scroll */}
                <div className="hidden md:block">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="overflow-x-auto scrollbar-hide">
                      <div className="flex items-center gap-3 w-max mx-auto">
                        {steps.map((step, index) => (
                          <button 
                            key={step.id} 
                            onClick={() => setCurrentStep(index)} 
                            disabled={index > currentStep} 
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth whitespace-nowrap ${
                              index === currentStep 
                                ? 'bg-primary text-primary-foreground shadow-glow' 
                                : index < currentStep 
                                  ? 'bg-success text-success-foreground' 
                                  : 'bg-card text-muted-foreground cursor-not-allowed opacity-60'
                            } ${index <= currentStep ? 'hover:scale-105' : ''}`}
                          >
                            <span className="text-lg font-bold">{index + 1}</span>
                            {React.createElement(step.icon, { className: "w-5 h-5 flex-shrink-0" })}
                            <span className="text-sm">
                              {step.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {renderStepContent()}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
