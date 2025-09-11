import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, CheckCircle, Calendar, Building, DollarSign, Shield, AlertCircle } from "lucide-react";
import { getProposalBundle, ProposalBundleResponse } from "@/lib/api/quotes";
import { getPolicyWordings, PolicyWording } from "@/lib/api/insurers";
import { toast } from "@/components/ui/sonner";

const Success = () => {
  const location = useLocation();
  const [proposalBundle, setProposalBundle] = useState<ProposalBundleResponse | null>(null);
  const [policyWordings, setPolicyWordings] = useState<PolicyWording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPolicyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get quote ID from navigation state first, then localStorage
        const quoteIdFromState = location.state?.quoteId;
        const quoteIdFromStorage = localStorage.getItem('currentQuoteId');
        const quoteId = quoteIdFromState || quoteIdFromStorage;
        
        console.log('Success page - quoteId from state:', quoteIdFromState);
        console.log('Success page - quoteId from localStorage:', quoteIdFromStorage);
        console.log('Success page - final quoteId:', quoteId);
        console.log('Success page - all localStorage keys:', Object.keys(localStorage));
        
        if (!quoteId) {
          throw new Error('Quote ID not found. Please start the process again.');
        }

        // Get proposal bundle with all data
        const bundleData = await getProposalBundle(parseInt(quoteId));
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Policy Created Successfully!</h1>
            <p className="text-muted-foreground">
              Your insurance policy has been created and is now active.
            </p>
          </div>

          {/* Policy Details */}
          {proposalBundle && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Policy Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quote ID</label>
                    <p className="text-lg font-semibold">{proposalBundle.quote_meta.quote_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {proposalBundle.quote_meta.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Insurer</label>
                    <p className="text-lg font-semibold">{proposalBundle.plans[0]?.insurer_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Project Name</label>
                    <p className="text-lg font-semibold">{proposalBundle.project.project_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Premium Amount</label>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      AED {proposalBundle.plans[0]?.premium_amount?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sum Insured</label>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      AED {parseFloat(proposalBundle.project.sum_insured).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(proposalBundle.project.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Completion Date</label>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(proposalBundle.project.completion_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Project Details */}
          {proposalBundle && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Client Name</label>
                    <p className="text-lg font-semibold">{proposalBundle.project.client_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Project Type</label>
                    <p className="text-lg font-semibold capitalize">{proposalBundle.project.project_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Construction Type</label>
                    <p className="text-lg font-semibold capitalize">{proposalBundle.project.construction_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-lg font-semibold">{proposalBundle.project.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Construction Period</label>
                    <p className="text-lg font-semibold">{proposalBundle.project.construction_period_months} months</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Maintenance Period</label>
                    <p className="text-lg font-semibold">{proposalBundle.project.maintenance_period_months} months</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submitted Documents */}
          {proposalBundle && Object.keys(proposalBundle.required_documents).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submitted Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(proposalBundle.required_documents).map(([key, doc]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.label}</p>
                          <p className="text-sm text-muted-foreground">
                            Document uploaded successfully
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.url, doc.label)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Policy Documents */}
          {policyWordings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Policy Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {policyWordings.map((wording) => (
                    <div key={wording.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{wording.document_title}</p>
                          <p className="text-sm text-muted-foreground">
                            Created on {new Date(wording.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={wording.is_active ? "default" : "secondary"}>
                          {wording.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {wording.document_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(wording.document_url!, wording.document_title)}
                          >
                            <Download className="h-4 w-4 mr-2" />
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

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => window.print()}
              variant="outline"
              size="lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              Print Policy
            </Button>
            <Button
              onClick={() => window.location.href = '/customer/proposal?new=true'}
              size="lg"
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