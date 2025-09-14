import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Download } from "lucide-react";
import { getPolicyDetailsById, PolicyDetailsAPIResponse } from "@/lib/api/quotes";

const PolicyDetails = () => {
  const { id: policyId } = useParams<{ id: string }>();
  const [policyData, setPolicyData] = useState<PolicyDetailsAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPolicyData = async () => {
      if (!policyId) {
        setError("Policy ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPolicyDetailsById(parseInt(policyId));
        setPolicyData(data);
      } catch (err) {
        console.error('Error loading policy data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load policy data');
      } finally {
        setLoading(false);
      }
    };

    loadPolicyData();
  }, [policyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading policy details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!policyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Policy not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Policy Details - {policyData.policyInfo?.policy_id || 'Unknown'}
              </h1>
              <p className="text-sm text-gray-600">
                {policyData.policyInfo?.client_name || 'Insurance Policy'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm">
              {policyData.policyInfo?.status?.toUpperCase() || 'UNKNOWN'}
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Policy
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Policy
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Policy Summary */}
        <Card className="bg-white border border-blue-200 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Policy Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid lg:grid-cols-4">
                <div className="p-3 border-r border-b border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Policy ID</div>
                  <div className="text-sm font-medium">{policyData.policyInfo.policy_id}</div>
                </div>
                <div className="p-3 border-r border-b border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="text-sm font-medium">
                    <Badge variant="outline">{policyData.policyInfo.status.toUpperCase()}</Badge>
                  </div>
                </div>
                <div className="p-3 border-r border-b border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Total Premium</div>
                  <div className="text-sm font-medium">AED {parseFloat(policyData.policyInfo.total_premium).toLocaleString()}</div>
                </div>
                <div className="p-3 border-b border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Sum Insured</div>
                  <div className="text-sm font-medium">AED {parseFloat(policyData.policyInfo.sum_insured).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Timeline */}
        {policyData.policyTimeline && policyData.policyTimeline.length > 0 && (
          <Card className="bg-white border border-blue-200 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Policy Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {policyData.policyTimeline.map((event, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{event.event}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PolicyDetails;
