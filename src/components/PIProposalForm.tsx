import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Briefcase, Shield, FileText, CheckCircle, Building, MapPin, Calendar, DollarSign, Plus, Trash2, Folder, Users, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumberWithCommas, removeCommasFromNumber, handleNumberInputChange } from "@/utils/numberFormat";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Define the 5 steps matching the design
  const steps = [
    {
      id: "business",
      label: "Business Information",
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
      id: "quote",
      label: "Generate Quote",
      icon: CheckCircle
    }
  ];

  // Form data state
  const [formData, setFormData] = useState({
    // Business Information
    companyName: "",
    businessType: "",
    annualTurnover: "1000000",
    businessDescription: "",
    businessAddress: "",
    numberOfEmployees: "",
    
    // Risk Profile
    yearsInBusiness: "",
    primaryJurisdiction: "",
    professionalLicense: false,
    industryAssociation: false,
    advancedDegree: false,
    continuingEducation: false,
    highRiskActivities: "",
    
    // Coverage Details
    limitOfIndemnity: "",
    deductible: "",
    policyPeriod: "",
    retroactiveCoverage: "",
    defenseCosts: false,
    lossOfDocuments: false,
    dishonestyOfEmployees: false,
    copyrightInfringement: false,
    
    // Claims History
    noPreviousClaims: false,
    numberOfClaims: "",
    totalClaimsValue: "0",
    claimsDetails: "",
    writtenProcedures: false,
    staffTraining: false,
    contractReview: false,
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
      case 0: // Business Information
        if (!formData.companyName || !formData.businessType || !formData.annualTurnover || 
            !formData.businessDescription || !formData.businessAddress || !formData.numberOfEmployees) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required business information fields.",
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
        if (!formData.noPreviousClaims && (!formData.numberOfClaims || !formData.totalClaimsValue)) {
          toast({
            title: "Validation Error",
            description: "Please provide claims information or confirm no previous claims.",
            variant: "destructive"
          });
          return false;
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

  const businessTypeOptions = [
    "Sole Proprietorship",
    "Partnership", 
    "LLC",
    "Corporation",
    "Other"
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
      case 0: // Business Information
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
                <Label htmlFor="businessType">Business Type *</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypeOptions.map((type) => (
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

            <div className="space-y-2">
              <Label htmlFor="businessDescription">Business Description *</Label>
              <Textarea
                id="businessDescription"
                value={formData.businessDescription}
                onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                placeholder="Describe your business activities and services"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address *</Label>
              <Textarea
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                placeholder="Enter your complete business address"
                rows={3}
              />
            </div>
          </TabsContent>
        );

      case 1: // Risk Profile
        return (
          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="yearsInBusiness">Years in Business *</Label>
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
                placeholder="Describe any high-risk activities or services your business provides"
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
                <Select
                  value={formData.limitOfIndemnity}
                  onValueChange={(value) => setFormData({ ...formData, limitOfIndemnity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select coverage limit" />
                  </SelectTrigger>
                  <SelectContent>
                    {coverageLimitOptions.map((limit) => (
                      <SelectItem key={limit} value={limit}>
                        AED {formatNumberWithCommas(limit)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="defenseCosts"
                    checked={formData.defenseCosts}
                    onCheckedChange={(checked) => setFormData({ ...formData, defenseCosts: checked as boolean })}
                  />
                  <Label htmlFor="defenseCosts">Defense Costs</Label>
                  <span className="text-sm text-muted-foreground">Legal defense expenses coverage.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lossOfDocuments"
                    checked={formData.lossOfDocuments}
                    onCheckedChange={(checked) => setFormData({ ...formData, lossOfDocuments: checked as boolean })}
                  />
                  <Label htmlFor="lossOfDocuments">Loss of Documents</Label>
                  <span className="text-sm text-muted-foreground">Coverage for loss of important documents.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dishonestyOfEmployees"
                    checked={formData.dishonestyOfEmployees}
                    onCheckedChange={(checked) => setFormData({ ...formData, dishonestyOfEmployees: checked as boolean })}
                  />
                  <Label htmlFor="dishonestyOfEmployees">Dishonesty of Employees</Label>
                  <span className="text-sm text-muted-foreground">Coverage for employee dishonesty incidents.</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="copyrightInfringement"
                    checked={formData.copyrightInfringement}
                    onCheckedChange={(checked) => setFormData({ ...formData, copyrightInfringement: checked as boolean })}
                  />
                  <Label htmlFor="copyrightInfringement">Copyright Infringement</Label>
                  <span className="text-sm text-muted-foreground">Protection against copyright infringement claims.</span>
                </div>
              </div>
            </div>
          </TabsContent>
        );

      case 3: // Claims History
        return (
          <TabsContent value="claims" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noPreviousClaims"
                  checked={formData.noPreviousClaims}
                  onCheckedChange={(checked) => setFormData({ ...formData, noPreviousClaims: checked as boolean })}
                />
                <Label htmlFor="noPreviousClaims">No previous claims or incidents</Label>
              </div>

              {!formData.noPreviousClaims && (
                <div className="space-y-4 pl-6">
                  <h3 className="text-lg font-semibold">Claims History (if any)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numberOfClaims">Number of Claims (Last 5 Years)</Label>
                      <Select
                        value={formData.numberOfClaims}
                        onValueChange={(value) => setFormData({ ...formData, numberOfClaims: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                        <SelectContent>
                          {claimsNumberOptions.map((number) => (
                            <SelectItem key={number} value={number}>
                              {number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="totalClaimsValue">Total Claims Value (AED)</Label>
                      <Input
                        id="totalClaimsValue"
                        type="number"
                        value={formData.totalClaimsValue}
                        onChange={(e) => setFormData({ ...formData, totalClaimsValue: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="claimsDetails">Claims Details</Label>
                    <Textarea
                      id="claimsDetails"
                      value={formData.claimsDetails}
                      onChange={(e) => setFormData({ ...formData, claimsDetails: e.target.value })}
                      placeholder="Provide details of any previous claims, incidents, or circumstances that could lead to a claim"
                      rows={4}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Risk Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="writtenProcedures"
                      checked={formData.writtenProcedures}
                      onCheckedChange={(checked) => setFormData({ ...formData, writtenProcedures: checked as boolean })}
                    />
                    <Label htmlFor="writtenProcedures">Written procedures and quality controls</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="staffTraining"
                      checked={formData.staffTraining}
                      onCheckedChange={(checked) => setFormData({ ...formData, staffTraining: checked as boolean })}
                    />
                    <Label htmlFor="staffTraining">Regular staff training programs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contractReview"
                      checked={formData.contractReview}
                      onCheckedChange={(checked) => setFormData({ ...formData, contractReview: checked as boolean })}
                    />
                    <Label htmlFor="contractReview">Client contract review processes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="professionalSupervision"
                      checked={formData.professionalSupervision}
                      onCheckedChange={(checked) => setFormData({ ...formData, professionalSupervision: checked as boolean })}
                    />
                    <Label htmlFor="professionalSupervision">Professional supervision systems</Label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        );

      case 4: // Generate Quote
        return (
          <TabsContent value="quote" className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-bold mb-4">Your Professional Indemnity Quote</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Coverage Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business Name:</span>
                      <span>{formData.companyName || "Not Provided"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Business Type:</span>
                      <span>{formData.businessType || "Not Selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Limit of Indemnity:</span>
                      <span>{formData.limitOfIndemnity ? `AED ${formatNumberWithCommas(formData.limitOfIndemnity)}` : "Not Selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deductible:</span>
                      <span>{formData.deductible ? `AED ${formatNumberWithCommas(formData.deductible)}` : "Not Selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Policy Period:</span>
                      <span>{formData.policyPeriod || "Not Selected"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Premium Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Premium:</span>
                      <span>AED 4,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Loading:</span>
                      <span>AED 750</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Additional Coverage:</span>
                      <span>AED 250</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-primary">
                      <span>Total Annual Premium:</span>
                      <span>AED 5,000</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Accept Quote & Generate Policy
                </Button>
                <Button variant="outline" className="w-full">
                  Download Quote PDF
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Quote valid for 30 days. Final premium subject to underwriting approval.
              </p>
            </div>
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
              
              {/* Next/Submit Button */}
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit}>
                  Generate Quote
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
