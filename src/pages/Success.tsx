import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, CheckCircle, Calendar, Building, DollarSign, Shield, AlertCircle } from "lucide-react";
import { getPolicyDetails, PolicyDetailsResponse } from "@/lib/api/quotes";
import { getPolicyWordings, PolicyWording } from "@/lib/api/insurers";
import { toast } from "@/components/ui/sonner";

const Success = () => {
  const [policyDetails, setPolicyDetails] = useState<PolicyDetailsResponse | null>(null);
  const [policyWordings, setPolicyWordings] = useState<PolicyWording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPolicyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get quote ID from localStorage
        const quoteId = localStorage.getItem('currentQuoteId');
        if (!quoteId) {
          throw new Error('Quote ID not found. Please start the process again.');
        }

        // Get policy details
        const policyData = await getPolicyDetails(parseInt(quoteId));
        setPolicyDetails(policyData);

        // Get policy wordings
        const wordingsData = await getPolicyWordings(policyData.insurer_id, policyData.product_id);
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
          {policyDetails && (
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
                    <label className="text-sm font-medium text-muted-foreground">Policy Number</label>
                    <p className="text-lg font-semibold">{policyDetails.policy_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {policyDetails.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Insurer</label>
                    <p className="text-lg font-semibold">{policyDetails.insurer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product</label>
                    <p className="text-lg font-semibold">{policyDetails.product_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Premium Amount</label>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {policyDetails.premium_amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sum Insured</label>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {policyDetails.sum_insured.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(policyDetails.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Date</label>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(policyDetails.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submitted Documents */}
          {policyDetails && Object.keys(policyDetails.documents).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submitted Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(policyDetails.documents).map(([key, doc]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.label}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}
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