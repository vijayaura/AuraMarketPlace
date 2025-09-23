import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, CheckCircle, Calendar, Building, DollarSign, Shield, AlertCircle } from "lucide-react";
import { getProposalBundle, ProposalBundleResponse, getPolicyDetailsById, PolicyDetailsAPIResponse } from "@/lib/api/quotes";
import { getPolicyWordings, PolicyWording } from "@/lib/api/insurers";
import { getInsurerPricingConfig, InsurerPricingConfigResponse } from "@/lib/api/quotes";
import { toast } from "@/components/ui/sonner";
import { generatePolicyPDF } from "@/utils/pdfGenerator";

const Success = () => {
  const location = useLocation();
  const [proposalBundle, setProposalBundle] = useState<ProposalBundleResponse | null>(null);
  const [policyWordings, setPolicyWordings] = useState<PolicyWording[]>([]);
  const [policyDetails, setPolicyDetails] = useState<PolicyDetailsAPIResponse | null>(null);
  const [productBundle, setProductBundle] = useState<InsurerPricingConfigResponse | null>(null);
  const [selectedExtensions, setSelectedExtensions] = useState<any[]>([]);
  const [expandedWordings, setExpandedWordings] = useState<Set<string>>(new Set());
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
          const policyDetailsData = await getPolicyDetailsById(parseInt(policyId));
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
        console.log('Success page - Fetching policy wordings for insurer:', bundleData.quote_meta.insurer_id);
        const wordingsData = await getPolicyWordings(bundleData.quote_meta.insurer_id, 1); // Using product_id = 1 as per the API
        console.log('Success page - Policy wordings response:', wordingsData);
        setPolicyWordings(wordingsData.wordings);
        console.log('Success page - Policy wordings set:', wordingsData.wordings);

        // Get product bundle configuration with clause_pricing_config and meta data
        // API: /api/v1/insurers/{insurer_id}/products/1/product-config-bundle
        const insurerId = bundleData.quote_meta.insurer_id;
        console.log('%cCalling Product Bundle API for insurer:', 'color: #ff1493; font-weight: bold;', insurerId);
        
        const productBundleData = await getInsurerPricingConfig(insurerId);
        setProductBundle(productBundleData);
        
        console.log('%cProduct Bundle API Response:', 'color: #ff1493; font-weight: bold;', productBundleData);
        console.log('%cClause Pricing Config with Meta:', 'color: #ff1493; font-weight: bold;', productBundleData.clause_pricing_config);


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

  // Process selected extensions when both proposalBundle and productBundle are loaded
  useEffect(() => {
    if (proposalBundle && productBundle) {
      // Use clause_pricing_config from product bundle API
      const clausePricingConfig = productBundle.clause_pricing_config || [];
      
      console.log('%cUsing clause_pricing_config from product bundle API:', 'color: #ff1493; font-weight: bold;', clausePricingConfig);
      // Get selected extensions from policy response
      const policyExtensions = proposalBundle.plans[0]?.extensions?.selected_extensions || {};

      // Normalize helper
      const toKey = (v?: string) => (v ?? '').toString().trim().toLowerCase();

      console.log('%cPolicy Extensions:', 'color: #ff1493; font-weight: bold;', policyExtensions);
      console.log('%cUsing Clause Pricing Config:', 'color: #ff1493; font-weight: bold;', clausePricingConfig);

      // Process each selected extension from policy response
      const processedExtensions = Object.entries(policyExtensions).map(([extensionKey, extensionData]) => {
        // Get the code from policy extension data (e.g., "MRe0004")
        const extensionCode = (extensionData as any)?.code;
        console.log(`%cProcessing policy extension ${extensionKey}, code: ${extensionCode}`, 'color: #ff1493; font-weight: bold;');

        // Find matching clause in product bundle's clausePricingConfig by clause_code
        const matchingClause = clausePricingConfig.find((clause: any) => {
          const clauseCode = clause.clause_code;
          const match = clauseCode && extensionCode && 
            toKey(clauseCode) === toKey(extensionCode);
          
          console.log(`%cComparing: "${clauseCode}" with "${extensionCode}" = ${match}`, 'color: #ff1493;');
          if (match) {
            console.log('%cFull matching clause:', 'color: #ff1493; font-weight: bold;', clause);
            console.log('%cMeta from matching clause:', 'color: #ff1493; font-weight: bold;', clause.meta);
          }
          return match;
        });

        if (matchingClause) {
          const meta = (matchingClause as any).meta || {};
          console.log(`%cFound matching clause for ${extensionCode}:`, 'color: #ff1493; font-weight: bold;', {
            clause_code: matchingClause.clause_code,
            meta: meta
          });
          
          const processedExtension = {
            policy_key: extensionKey,
            clause_code: matchingClause.clause_code, // Use clause_code from product bundle
            title: meta.title || meta.clause_title || (extensionData as any)?.label || extensionKey,
            clause_wording: meta.clause_wording || '',
            clause_type: meta.clause_type || 'Extension',
            show_type: (meta.show_type || 'default').toString().toLowerCase(),
            extension_data: extensionData,
            clause_config: matchingClause
          };
          
          console.log(`%cFinal processed extension for ${extensionCode}:`, 'color: #ff1493; font-weight: bold;', processedExtension);
          return processedExtension;
        }

        // If no matching clause found in product bundle, use basic info from policy
        console.log(`%cNo matching clause found in product bundle for ${extensionKey} (code: ${extensionCode})`, 'color: #ff1493; font-weight: bold;');
        return {
          policy_key: extensionKey,
          clause_code: extensionCode || extensionKey,
          title: (extensionData as any)?.label || extensionKey,
          clause_wording: '',
          clause_type: 'Extension',
          show_type: 'default',
          extension_data: extensionData,
          clause_config: null
        };
      });

      setSelectedExtensions(processedExtensions);
    }
  }, [proposalBundle, productBundle]);

  const toggleWordingExpansion = (extensionKey: string) => {
    setExpandedWordings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(extensionKey)) {
        newSet.delete(extensionKey);
      } else {
        newSet.add(extensionKey);
      }
      return newSet;
    });
  };

  const handleDownloadDocument = async (url: string, filename: string) => {
    try {
      console.log('Open document - URL:', url);
      console.log('Open document - Filename:', filename);
      
      // Try to open in new tab first
      const newWindow = window.open('', '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        // If we can open a new window, navigate to the URL
        newWindow.location.href = url;
        newWindow.focus();
        
        toast.success('Document Opened', {
          description: `Opening ${filename} in new tab...`
        });
      } else {
        // Fallback: create a link element
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Document Opened', {
          description: `Opening ${filename} in new tab...`
        });
      }
    } catch (error) {
      console.error('Open document error:', error);
      toast.error('Failed to Open Document', {
        description: error instanceof Error ? error.message : 'Failed to open document. Please try again.'
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
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <Header />
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto">
          {/* Success Header - Prominent */}
          <div className="text-left mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Policy Created Successfully!</h1>
                  <p className="text-base text-gray-600">
                    Your insurance policy has been created.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Policy
                </Button>
                <Button className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Policy
                </Button>
              </div>
            </div>
          </div>

          {/* Vertical Summary List */}
          {proposalBundle && (
            <Card className="bg-white shadow-lg border-0 mb-6">
              <CardContent className="p-4">
                <div className="space-y-4">


                  {/* Policy Details Section */}
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Policy Details</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        <div className="border-r border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Policy ID</span>
                          <p className="text-sm font-medium">{policyDetails?.policyInfo.policy_id || policyData.policyId || proposalBundle?.quote_meta.quote_id || 'N/A'}</p>
                        </div>
                        <div className="border-r border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Insurer</span>
                          <p className="text-sm font-medium">{policyDetails?.policyInfo.insurer_name || proposalBundle?.plans[0]?.insurer_name || 'N/A'}</p>
                        </div>
                        <div className="border-r border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Premium Amount</span>
                          <p className="text-sm font-semibold text-green-600">
                            AED {policyDetails?.policyInfo.base_premium ? parseFloat(policyDetails.policyInfo.base_premium).toLocaleString() : proposalBundle?.plans[0]?.base_premium?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div className="p-3">
                          <span className="text-xs text-gray-500">Sum Insured</span>
                          <p className="text-sm font-semibold">
                            AED {policyDetails?.policyInfo.sum_insured ? parseFloat(policyDetails.policyInfo.sum_insured).toLocaleString() : proposalBundle?.project.sum_insured ? parseFloat(proposalBundle.project.sum_insured).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Details Section */}
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Project Details</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        <div className="border-r border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Project Name</span>
                          <p className="text-sm font-medium">{policyDetails?.policyInfo.project_name || proposalBundle?.project.project_name || 'N/A'}</p>
                        </div>
                        <div className="border-r border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Client Name</span>
                          <p className="text-sm font-medium">{policyDetails?.policyInfo.client_name || proposalBundle?.project.client_name || 'N/A'}</p>
                        </div>
                        <div className="border-r border-b border-gray-200 p-3 col-span-2">
                          <span className="text-xs text-gray-500">Location</span>
                          <p className="text-sm font-medium">{policyDetails?.policyInfo.address || proposalBundle?.project.address || 'N/A'}</p>
                        </div>
                        <div className="border-r border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Project Type</span>
                          <p className="text-sm font-medium capitalize">{policyDetails?.policyInfo.project_type || proposalBundle?.project.project_type || 'N/A'}</p>
                        </div>
                        <div className="border-r border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Construction Type</span>
                          <p className="text-sm font-medium capitalize">{policyDetails?.policyInfo.construction_type || proposalBundle?.project.construction_type || 'N/A'}</p>
                        </div>
                        <div className="border-r border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Project Start Time</span>
                          <p className="text-sm font-medium">
                            {policyDetails?.policyInfo.start_date 
                              ? new Date(policyDetails.policyInfo.start_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : proposalBundle?.project.start_date 
                                ? new Date(proposalBundle.project.start_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                : 'N/A'
                            }
                          </p>
                        </div>
                        <div className="border-r border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Project End Time</span>
                          <p className="text-sm font-medium">
                            {policyDetails?.policyInfo.end_date 
                              ? new Date(policyDetails.policyInfo.end_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : proposalBundle?.project.end_date 
                                ? new Date(proposalBundle.project.end_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                : 'N/A'
                            }
                          </p>
                        </div>
                        <div className="border-r border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Construction Period</span>
                          <p className="text-sm font-medium">{policyDetails?.policyInfo.construction_period_months || proposalBundle?.project.construction_period_months || 'N/A'} months</p>
                        </div>
                        <div className="border-b border-gray-200 p-3">
                          <span className="text-xs text-gray-500">Maintenance Period</span>
                          <p className="text-sm font-medium">{policyDetails?.policyInfo.maintenance_period_months || proposalBundle?.project.maintenance_period_months || 'N/A'} months</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Policy Timeline Section */}
                  {policyDetails?.policyTimeline && policyDetails.policyTimeline.length > 0 && (
                    <div className="border-b border-gray-100 pb-3">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Policy Timeline</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex flex-wrap">
                          {policyDetails.policyTimeline.map((event, index) => (
                            <div key={index} className="flex items-center space-x-3 min-w-0 flex-1 border-r border-b border-gray-200 p-3 last:border-r-0">
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                              <div className="min-w-0">
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
                    </div>
                  )}

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

                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Extensions Section */}
          {selectedExtensions.length > 0 && (
            <Card className="bg-white shadow-lg border-0 mb-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Selected Extensions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {selectedExtensions.map((extension) => {
                    const isExpanded = expandedWordings.has(extension.policy_key);
                    return (
                      <div key={extension.policy_key} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-foreground">{extension.title}</h3>
                            <Badge variant="outline" className="text-xs px-1 py-0">{extension.clause_code}</Badge>
                            <Badge 
                              variant={extension.clause_type === "CLAUSE" ? "default" : extension.clause_type === "WARRANTY" ? "secondary" : "outline"}
                              className="text-xs px-1 py-0"
                            >
                              {extension.clause_type}
                            </Badge>
                            {extension.show_type === 'mandatory' && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">Mandatory</Badge>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-7"
                            onClick={() => toggleWordingExpansion(extension.policy_key)}
                          >
                            {isExpanded ? 'Hide Wordings' : 'View Wordings'}
                          </Button>
                        </div>
                        
                        {isExpanded && extension.clause_wording && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {extension.clause_wording}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Section - Three Separate Cards */}
          <div className="space-y-6 mb-8">
            {/* Policy Documents - Only Active Items */}
            {console.log('Success page - policyWordings:', policyWordings)}
            {console.log('Success page - active wordings:', policyWordings.filter(wording => wording.is_active))}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Policy Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {policyWordings.filter(wording => wording.is_active).length > 0 ? (
                  <div className="space-y-2">
                    {policyWordings
                      .filter(wording => wording.is_active)
                      .map((wording, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium block">{wording.label}</span>
                              <span className="text-xs text-gray-500">
                                {wording.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {wording.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadDocument(wording.url, wording.label)}
                                className="h-8 px-3 text-xs"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm">No policy documents available</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {policyWordings.length === 0 ? 'No wordings loaded' : 'No active wordings found'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                          <FileText className="h-3 w-3 mr-1" />
                          View
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
                              <FileText className="h-3 w-3 mr-1" />
                              View
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
                              <FileText className="h-3 w-3 mr-1" />
                              View
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

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Success;