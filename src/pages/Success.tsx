import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, CheckCircle, Calendar, Building, DollarSign, Shield, AlertCircle } from "lucide-react";
import { getProposalBundle, ProposalBundleResponse, getPolicyDetails, PolicyDetailsResponse } from "@/lib/api/quotes";
import { getPolicyWordings, PolicyWording } from "@/lib/api/insurers";
import { toast } from "@/components/ui/sonner";
import { generatePolicyPDF } from "@/utils/pdfGenerator";

const Success = () => {
  const location = useLocation();
  const [proposalBundle, setProposalBundle] = useState<ProposalBundleResponse | null>(null);
  const [policyWordings, setPolicyWordings] = useState<PolicyWording[]>([]);
  const [policyDetails, setPolicyDetails] = useState<PolicyDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policyData, setPolicyData] = useState<{
    policyId: string | null;
    policyQuoteId: string | null;
    policyDetails: any | null;
  }>({
    policyId: null,
    policyQuoteId: null,
    policyDetails: null
  });

  useEffect(() => {
    const loadPolicyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get policy data from localStorage
        const policyId = localStorage.getItem('policyId');
        const policyQuoteId = localStorage.getItem('policyQuoteId');
        const policyDetailsStr = localStorage.getItem('policyDetails');
        const policyDetails = policyDetailsStr ? JSON.parse(policyDetailsStr) : null;
        
        console.log('Success page - policyId:', policyId);
        console.log('Success page - policyQuoteId:', policyQuoteId);
        console.log('Success page - policyDetails:', policyDetails);
        console.log('Success page - all localStorage keys:', Object.keys(localStorage));
        
        // Set policy data
        setPolicyData({
          policyId,
          policyQuoteId,
          policyDetails
        });
        
        // If we have a policy ID, fetch policy details
        if (policyId) {
          console.log('Success page - Fetching policy details for policy ID:', policyId);
          const policyDetailsData = await getPolicyDetails(parseInt(policyId));
          setPolicyDetails(policyDetailsData);
          console.log('Success page - Policy details loaded:', policyDetailsData);
        }
        
        if (!policyQuoteId) {
          throw new Error('Quote ID not found. Please start the process again.');
        }

        // Get proposal bundle with all data using policyQuoteId
        const bundleData = await getProposalBundle(parseInt(policyQuoteId));
        setProposalBundle(bundleData);

        // Get policy wordings
        const wordingsData = await getPolicyWordings(bundleData.quote_meta.insurer_id, 1); // Using product_id = 1 as per the API
        setPolicyWordings(wordingsData.wordings);

      } catch (err: any) {
        console.error('Error loading policy data:', err);
        setError(err.message || 'Failed to load policy details. Please try again.');
        toast.error('Error Loading Policy Details', {
          description: err.message || 'Failed to load policy details. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadPolicyData();
  }, []);

  const handleDownloadDocument = (url: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download Started', {
        description: `Downloading ${filename}...`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download Failed', {
        description: 'Failed to download document. Please try again.'
      });
    }
  };

  const handlePrintPolicy = () => {
    if (!proposalBundle) {
      toast.error('Error', {
        description: 'Policy data not available for printing.'
      });
      return;
    }

    try {
      generatePolicyPDF(proposalBundle);
      toast.success('PDF Generated', {
        description: 'Policy PDF has been generated and downloaded.'
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('PDF Generation Failed', {
        description: 'Failed to generate PDF. Please try again.'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
              <div className="grid gap-6">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* Success Header - Prominent */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Policy Created Successfully!</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your insurance policy has been created.
            </p>
          </div>

          {/* Vertical Summary List */}
          {proposalBundle && (
            <Card className="bg-white shadow-lg border-0 mb-8">
              <CardContent className="p-6">
                <div className="space-y-6">

                  {/* Project Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Project Name</span>
                        <p className="text-sm font-medium">{policyDetails?.policyInfo.project_name || proposalBundle?.project.project_name || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Client Name</span>
                        <p className="text-sm font-medium">{policyDetails?.policyInfo.client_name || proposalBundle?.project.client_name || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Location</span>
                        <p className="text-sm font-medium">{policyDetails?.policyInfo.address || proposalBundle?.project.address || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Project Type</span>
                        <p className="text-sm font-medium capitalize">{policyDetails?.policyInfo.project_type || proposalBundle?.project.project_type || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Construction Period</span>
                        <p className="text-sm font-medium">{policyDetails?.policyInfo.construction_period_months || proposalBundle?.project.construction_period_months || 'N/A'} months</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Construction Type</span>
                        <p className="text-sm font-medium capitalize">{policyDetails?.policyInfo.construction_type || proposalBundle?.project.construction_type || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Maintenance Period</span>
                        <p className="text-sm font-medium">{policyDetails?.policyInfo.maintenance_period_months || proposalBundle?.project.maintenance_period_months || 'N/A'} months</p>
                      </div>
                    </div>
                  </div>

                  {/* Policy Details and Timeline Tabs */}
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">Policy Details</TabsTrigger>
                      <TabsTrigger value="timeline">Policy Timeline</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="mt-6">
                      <div className="border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <span className="text-sm text-gray-500">Policy ID</span>
                            <p className="text-sm font-medium">{policyDetails?.policyInfo.policy_id || policyData.policyId || proposalBundle?.quote_meta.quote_id || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-gray-500">Quote ID</span>
                            <p className="text-sm font-medium">{policyDetails?.policyInfo.quote_id || policyData.policyQuoteId || proposalBundle?.quote_meta.quote_id || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-gray-500">Insurer</span>
                            <p className="text-sm font-medium">{policyDetails?.policyInfo.insurer_name || proposalBundle?.plans[0]?.insurer_name || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-gray-500">Premium Amount</span>
                            <p className="text-sm font-semibold text-green-600">
                              AED {policyDetails?.policyInfo.total_premium ? parseFloat(policyDetails.policyInfo.total_premium).toLocaleString() : proposalBundle?.plans[0]?.premium_amount?.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-gray-500">Sum Insured</span>
                            <p className="text-sm font-semibold">
                              AED {policyDetails?.policyInfo.sum_insured ? parseFloat(policyDetails.policyInfo.sum_insured).toLocaleString() : proposalBundle?.project.sum_insured ? parseFloat(proposalBundle.project.sum_insured).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="timeline" className="mt-6">
                      {policyDetails?.policyTimeline && policyDetails.policyTimeline.length > 0 ? (
                        <div className="border-b border-gray-100 pb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Policy Timeline</h3>
                          <div className="space-y-3">
                            {policyDetails.policyTimeline.map((event, index) => (
                              <div key={index} className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{event.event}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(event.date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No timeline events available</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                </div>
              </CardContent>
            </Card>
          )}

          {/* Extensions Section */}
          {proposalBundle && proposalBundle.plans[0]?.extensions && (
            <Card className="bg-white shadow-lg border-0 mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Extensions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* TPL Limit - Show all */}
                  {proposalBundle.plans[0].extensions.tpl_limit && (
                    <div className="border-b border-gray-100 pb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Third Party Liability Limit</h4>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {proposalBundle.plans[0].extensions.tpl_limit.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Extensions - Show all */}
                  {proposalBundle.plans[0].extensions.selected_extensions && 
                   Object.keys(proposalBundle.plans[0].extensions.selected_extensions).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Extensions</h4>
                      <div className="space-y-2">
                        {Object.entries(proposalBundle.plans[0].extensions.selected_extensions).map(([key, extension]) => (
                          <div key={key} className="p-3 bg-green-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {extension.label}
                              </span>
                              <span className="text-xs text-gray-500">
                                Code: {extension.code}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Section - Three Separate Cards */}
          <div className="space-y-6 mb-8">
            {/* Policy Documents - Only Active Items */}
            {policyWordings.filter(wording => wording.is_active).length > 0 && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Policy Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {policyWordings
                      .filter(wording => wording.is_active)
                      .map((wording) => (
                        <div key={wording.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium block">{wording.document_title}</span>
                              <span className="text-xs text-gray-500">
                                Created on {new Date(wording.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {wording.document_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadDocument(wording.document_url!, wording.document_title)}
                                className="h-8 px-3 text-xs"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Documents */}
            {proposalBundle && Object.keys(proposalBundle.required_documents).length > 0 && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Project Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {Object.entries(proposalBundle.required_documents).map(([key, doc]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium">{doc.label}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc.url, doc.label)}
                          className="h-8 px-3 text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Declaration Documents */}
            {proposalBundle && proposalBundle.required_documents_for_policy_issue && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Declaration Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {Array.isArray(proposalBundle.required_documents_for_policy_issue) ? (
                      proposalBundle.required_documents_for_policy_issue.map((doc: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="text-sm font-medium">{doc.label || doc.name || `Document ${index + 1}`}</span>
                          </div>
                          {doc.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.url, doc.label || doc.name)}
                              className="h-8 px-3 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      ))
                    ) : typeof proposalBundle.required_documents_for_policy_issue === 'object' ? (
                      Object.entries(proposalBundle.required_documents_for_policy_issue).map(([key, doc]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium">{doc.label || key}</span>
                              {doc.uploaded_at && (
                                <span className="text-xs text-gray-500 block">
                                  Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {doc.url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.url, doc.label || key)}
                              className="h-8 px-3 text-xs"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400 px-2 py-1">Not uploaded</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-gray-600">
                          {typeof proposalBundle.required_documents_for_policy_issue === 'string' 
                            ? proposalBundle.required_documents_for_policy_issue 
                            : JSON.stringify(proposalBundle.required_documents_for_policy_issue)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Action Buttons - Centered */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={handlePrintPolicy}
              variant="outline"
              size="lg"
              className="bg-white hover:bg-gray-50 border-gray-300"
            >
              <FileText className="h-4 w-4 mr-2" />
              Print Policy
            </Button>
            <Button
              onClick={() => window.location.href = '/customer/proposal?new=true'}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create New Policy
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Success;