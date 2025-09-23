import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Download, Check, Circle, ChevronDown, ChevronUp, FileText, User, Building, MapPin, Shield, FolderOpen, CreditCard, Star, Calendar, DollarSign, Users, FileCheck, AlertTriangle } from "lucide-react";
import { getPolicyDetailsById, PolicyDetailsAPIResponse } from "@/lib/api/quotes";
import { toast } from "@/hooks/use-toast";

// Helper functions for formatting
const formatFieldName = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/Id\b/g, 'ID')
    .replace(/Tpl\b/g, 'TPL')
    .replace(/Cew\b/g, 'CEW');
};

const formatFieldValue = (key: string, value: any): string => {
  // Handle missing or empty values
  if (value === null || value === undefined || value === '') {
    if (key.includes('date') || key.includes('_at') || key.includes('time')) {
      return 'Not set';
    }
    if (key.includes('amount') || key.includes('premium') || key.includes('sum_insured') || key.includes('value')) {
      return 'Not calculated';
    }
    if (key.includes('count') || key.includes('number') || key.includes('period')) {
      return '0';
    }
    return 'Not specified';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  // Format dates
  if (key.includes('date') || key.includes('_at') || key.includes('time')) {
    try {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return value.toString();
    }
  }
  
  // Format currency values
  if (key.includes('amount') || key.includes('premium') || key.includes('sum_insured') || key.includes('value')) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return `AED ${num.toLocaleString()}`;
    }
  }
  
  // Format string values to human-readable format
  if (typeof value === 'string') {
    // Remove special characters and convert to human-readable format
    let formatted = value
      .replace(/[_-]/g, ' ')  // Replace underscores and hyphens with spaces
      .replace(/([A-Z])/g, ' $1')  // Add space before capital letters
      .trim()  // Remove leading/trailing spaces
      .replace(/\s+/g, ' ');  // Replace multiple spaces with single space
    
    // Convert to proper sentence case
    return formatted
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        // Handle common abbreviations and special cases
        const upper = word.toUpperCase();
        if (['ID', 'CEO', 'CTO', 'CFO', 'VP', 'HR', 'IT', 'API', 'URL', 'PDF', 'CSV', 'XLS', 'XLSX', 'JSON', 'XML', 'HTML', 'CSS', 'JS', 'TS', 'SQL', 'DB', 'UI', 'UX', 'AI', 'ML', 'AR', 'VR', 'IoT', 'SaaS', 'PaaS', 'IaaS', 'CRM', 'ERP', 'POS', 'GPS', 'RFID', 'NFC', 'QR', 'USB', 'HDMI', 'WiFi', 'Bluetooth', '4G', '5G', 'LTE', 'WiMAX', 'VPN', 'LAN', 'WAN', 'DNS', 'HTTP', 'HTTPS', 'FTP', 'SMTP', 'POP', 'IMAP', 'SSH', 'SSL', 'TLS', 'AES', 'RSA', 'MD5', 'SHA', 'JWT', 'OAuth', 'REST', 'SOAP', 'GraphQL', 'gRPC', 'WebSocket', 'TCP', 'UDP', 'IP', 'IPv4', 'IPv6', 'MAC', 'OS', 'iOS', 'Android', 'Windows', 'Linux', 'macOS', 'Unix', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'S3', 'EC2', 'RDS', 'Lambda', 'SQS', 'SNS', 'CloudFront', 'Route53', 'VPC', 'IAM', 'SES', 'SNS', 'SQS', 'DynamoDB', 'ElastiCache', 'Redshift', 'EMR', 'Kinesis', 'CloudWatch', 'CloudTrail', 'Config', 'TrustedAdvisor', 'Support', 'Billing', 'CostExplorer', 'Budgets', 'Organizations', 'ControlTower', 'SecurityHub', 'GuardDuty', 'Inspector', 'Macie', 'WAF', 'Shield', 'CertificateManager', 'SecretsManager', 'KMS', 'CloudHSM', 'DirectoryService', 'Cognito', 'WorkSpaces', 'WorkDocs', 'Chime', 'Connect', 'Pinpoint', 'MobileHub', 'Amplify', 'AppSync', 'API Gateway', 'Step Functions', 'SWF', 'ECS', 'EKS', 'Fargate', 'Batch', 'Glue', 'Athena', 'QuickSight', 'SageMaker', 'Rekognition', 'Polly', 'Transcribe', 'Translate', 'Comprehend', 'Lex', 'Textract', 'Forecast', 'Personalize', 'FraudDetector', 'Bedrock', 'CodeGuru', 'CodeCommit', 'CodeBuild', 'CodeDeploy', 'CodePipeline', 'CodeStar', 'Cloud9', 'X-Ray', 'CloudFormation', 'CDK', 'SAM', 'Serverless', 'Lambda', 'API Gateway', 'DynamoDB', 'S3', 'CloudFront', 'Route53', 'VPC', 'EC2', 'RDS', 'ElastiCache', 'Redshift', 'EMR', 'Kinesis', 'CloudWatch', 'CloudTrail', 'Config', 'TrustedAdvisor', 'Support', 'Billing', 'CostExplorer', 'Budgets', 'Organizations', 'ControlTower', 'SecurityHub', 'GuardDuty', 'Inspector', 'Macie', 'WAF', 'Shield', 'CertificateManager', 'SecretsManager', 'KMS', 'CloudHSM', 'DirectoryService', 'Cognito', 'WorkSpaces', 'WorkDocs', 'Chime', 'Connect', 'Pinpoint', 'MobileHub', 'Amplify', 'AppSync', 'API Gateway', 'Step Functions', 'SWF', 'ECS', 'EKS', 'Fargate', 'Batch', 'Glue', 'Athena', 'QuickSight', 'SageMaker', 'Rekognition', 'Polly', 'Transcribe', 'Translate', 'Comprehend', 'Lex', 'Textract', 'Forecast', 'Personalize', 'FraudDetector', 'Bedrock', 'CodeGuru', 'CodeCommit', 'CodeBuild', 'CodeDeploy', 'CodePipeline', 'CodeStar', 'Cloud9', 'X-Ray', 'CloudFormation', 'CDK', 'SAM', 'Serverless'].includes(upper)) {
          return upper;
        }
        // Handle common business terms
        if (['LLC', 'Inc', 'Corp', 'Ltd', 'Co', 'LLP', 'LP', 'PC', 'PA', 'PLLC'].includes(upper)) {
          return upper;
        }
        // Handle numbers
        if (/^\d+$/.test(word)) {
          return word;
        }
        // Handle mixed case words (like "iPhone", "eBay")
        if (word.length > 1 && word[0] === word[0].toLowerCase() && word[1] === word[1].toUpperCase()) {
          return word;
        }
        // Default to title case
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  
  return value.toString();
};

const PolicyDetails = () => {
  const { id: policyId } = useParams<{ id: string }>();
  const [policyData, setPolicyData] = useState<PolicyDetailsAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['policy_summary']));

  const toggleSectionExpansion = (sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const handleDownloadDocument = async (url: string, filename: string) => {
    try {
      // Show download toast first
      toast({
        title: "Download Started",
        description: `Downloading ${filename}...`,
        variant: "default",
      });
      
      // Fetch the file directly and create blob for download
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : 'Failed to download document. Please try again.',
        variant: "destructive",
      });
    }
  };

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
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Policy
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Policy Summary */}
        <Card className="bg-white border border-blue-200 mb-4" data-section="policy_summary">
          <CardHeader 
            className="pb-3 cursor-pointer"
            onClick={() => toggleSectionExpansion('policy_summary')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Policy Summary
            </CardTitle>
                  <div className="text-xs text-gray-400 mt-1">
                    Policy Reference: {policyData.policyInfo?.policy_reference || 'N/A'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Total Premium</div>
                      <div className="text-sm text-gray-600 font-medium">
                        AED {parseFloat(policyData.policyInfo?.base_premium || '0').toLocaleString()}
                      </div>
                    </div>
                {expandedSections.has('policy_summary') ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
          </CardHeader>
          {expandedSections.has('policy_summary') && (
          <CardContent className="pt-0">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid lg:grid-cols-4">
                <div className="p-3 border-r border-b border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Policy ID</div>
                    <div className="text-sm font-medium">{policyData.policyInfo?.policy_reference}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Total Premium</div>
                    <div className="text-sm font-medium">AED {parseFloat(policyData.policyInfo?.base_premium || '0').toLocaleString()}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Sum Insured</div>
                    <div className="text-sm font-medium">AED {parseFloat(policyData.policyInfo?.sum_insured || '0').toLocaleString()}</div>
                  </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Quote Reference</div>
                    <div className="text-sm font-medium">{policyData.policyInfo?.quote_reference}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy Start Date</div>
                    <div className="text-sm font-medium">{formatFieldValue('start_date', policyData.policyInfo?.start_date)}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy End Date</div>
                    <div className="text-sm font-medium">{formatFieldValue('end_date', policyData.policyInfo?.end_date)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>


        {/* Project Details */}
        {policyData.policyInfo?.proposal_bundle?.project && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="project_details">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('project_details')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Project Details
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {policyData.policyInfo.proposal_bundle.project.project_name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Project Type</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {formatFieldValue('project_type', policyData.policyInfo.proposal_bundle.project.project_type)}
                    </div>
                  </div>
                  {expandedSections.has('project_details') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('project_details') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-4">
                    {/* Project Name */}
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Project Name</div>
                      <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.project.project_name}</div>
                    </div>
                    {/* Project Type */}
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Project Type</div>
                      <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.project.project_type?.charAt(0).toUpperCase() + policyData.policyInfo.proposal_bundle.project.project_type?.slice(1)}</div>
                    </div>
                    {/* Completion Date */}
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Completion Date</div>
                      <div className="text-sm font-medium">{formatFieldValue('completion_date', policyData.policyInfo.proposal_bundle.project.completion_date)}</div>
                    </div>
                    {/* Sub Project Type */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Sub Project Type</div>
                      <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.project.sub_project_type?.charAt(0).toUpperCase() + policyData.policyInfo.proposal_bundle.project.sub_project_type?.slice(1)}</div>
                    </div>
                    {/* Construction Type */}
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Construction Type</div>
                      <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.project.construction_type?.charAt(0).toUpperCase() + policyData.policyInfo.proposal_bundle.project.construction_type?.slice(1)}</div>
                    </div>
                    {/* Maintenance Period Months */}
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Maintenance Period Months</div>
                      <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.project.maintenance_period_months}</div>
                    </div>
                    {/* Zone */}
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Zone</div>
                      <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.project.zone?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    </div>
                    {/* Region */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Region</div>
                      <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.project.region?.charAt(0).toUpperCase() + policyData.policyInfo.proposal_bundle.project.region?.slice(1)}</div>
                    </div>
                    {/* Address */}
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Address</div>
                      <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.project.address}</div>
                    </div>
                    {/* Country */}
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Country</div>
                      <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.project.country?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    </div>
                    {/* Construction Period Months */}
                <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Construction Period Months</div>
                      <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.project.construction_period_months}</div>
                    </div>
                    {/* Start Date */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Start Date</div>
                      <div className="text-sm font-medium">{formatFieldValue('start_date', policyData.policyInfo.proposal_bundle.project.start_date)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Insured Details */}
        {policyData.policyInfo?.proposal_bundle?.insured?.details && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="insured_details">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('insured_details')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Insured Details
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {policyData.policyInfo.proposal_bundle.insured.details.insured_name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Insured Name</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {policyData.policyInfo.proposal_bundle.insured.details.insured_name}
                    </div>
                  </div>
                  {expandedSections.has('insured_details') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('insured_details') && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Insured Details */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid lg:grid-cols-4">
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Insured Name</div>
                        <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.insured.details.insured_name}</div>
                      </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Role Of Insured</div>
                        <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.insured.details.role_of_insured?.charAt(0).toUpperCase() + policyData.policyInfo.proposal_bundle.insured.details.role_of_insured?.slice(1)}</div>
                      </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Had Losses Last 5 Years</div>
                        <div className="text-sm font-medium">{policyData.policyInfo.proposal_bundle.insured.details.had_losses_last_5yrs ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Claims History */}
                  {policyData.policyInfo.proposal_bundle.insured.claims && policyData.policyInfo.proposal_bundle.insured.claims.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900">Claims History</h4>
                        <p className="text-xs text-gray-500 mt-1">{policyData.policyInfo.proposal_bundle.insured.claims.length} claim(s) recorded</p>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {policyData.policyInfo.proposal_bundle.insured.claims.map((claim, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="grid lg:grid-cols-4 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Claim Year</div>
                                  <div className="text-sm font-medium">{claim.claim_year}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Description</div>
                                  <div className="text-sm font-medium">{claim.description}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Count Of Claims</div>
                                  <div className="text-sm font-medium">{claim.count_of_claims}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Amount Of Claims</div>
                                  <div className="text-sm font-medium">AED {parseFloat(claim.amount_of_claims).toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          </CardContent>
            )}
        </Card>
        )}


        {/* Contract Structure */}
        {policyData.policyInfo?.proposal_bundle?.contract_structure && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="contract_structure">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('contract_structure')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                      Contract Structure
              </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {policyData.policyInfo.proposal_bundle.contract_structure.details?.main_contractor}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Contract Type</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {formatFieldValue('contract_type', policyData.policyInfo.proposal_bundle.contract_structure.details?.contract_type)}
                    </div>
                  </div>
                  {expandedSections.has('contract_structure') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('contract_structure') && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                  {/* Contract Details */}
                  {policyData.policyInfo.proposal_bundle.contract_structure.details && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Contract Details</h4>
                      <div className="grid lg:grid-cols-4 gap-4">
                        {Object.entries(policyData.policyInfo.proposal_bundle.contract_structure.details)
                          .filter(([key]) => !['id', 'created_at', 'updated_at', 'project_id'].includes(key))
                          .map(([key, value]) => (
                            <div key={key}>
                              <div className="text-xs text-gray-500 mb-1">{formatFieldName(key)}</div>
                              <div className="text-sm font-medium">{formatFieldValue(key, value)}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Sub Contractors */}
                  {policyData.policyInfo.proposal_bundle.contract_structure.sub_contractors && policyData.policyInfo.proposal_bundle.contract_structure.sub_contractors.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Sub Contractors</h4>
                      <div className="space-y-3">
                        {policyData.policyInfo.proposal_bundle.contract_structure.sub_contractors.map((subContract, index) => (
                          <div key={index} className="grid lg:grid-cols-4 gap-4">
                            {Object.entries(subContract).map(([key, value]) => (
                              <div key={key}>
                                <div className="text-xs text-gray-500 mb-1">{formatFieldName(key)}</div>
                                <div className="text-sm font-medium">{formatFieldValue(key, value)}</div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Consultants */}
                  {policyData.policyInfo.proposal_bundle.contract_structure.consultants && policyData.policyInfo.proposal_bundle.contract_structure.consultants.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Consultants</h4>
                      <div className="space-y-3">
                        {policyData.policyInfo.proposal_bundle.contract_structure.consultants.map((consultant, index) => (
                          <div key={index} className="grid lg:grid-cols-4 gap-4">
                            {Object.entries(consultant).map(([key, value]) => (
                              <div key={key}>
                                <div className="text-xs text-gray-500 mb-1">{formatFieldName(key)}</div>
                                <div className="text-sm font-medium">{formatFieldValue(key, value)}</div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Site Risk Assessment */}
        {policyData.policyInfo?.proposal_bundle?.site_risks && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="site_risks">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('site_risks')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Site Risk Assessment
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      Risk factors and site conditions
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Soil Type</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue('soil_type', policyData.policyInfo.proposal_bundle.site_risks.soil_type)}
                    </div>
                  </div>
                  {expandedSections.has('site_risks') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('site_risks') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-4">
                    {Object.entries(policyData.policyInfo.proposal_bundle.site_risks)
                      .filter(([key]) => !['id', 'project_id', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value], idx) => {
                        let displayValue = value;
                        if (value === 0 || value === '0') displayValue = 'No';
                        else if (value === 1 || value === '1') displayValue = 'Yes';
                        
                        return (
                          <div key={key} className="p-3 border-r border-b border-gray-200 last:border-r-0">
                            <div className="text-xs text-gray-500 mb-1">{formatFieldName(key)}</div>
                            <div className="text-sm font-medium">{formatFieldValue(key, displayValue)}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Cover Requirements */}
        {policyData.policyInfo?.proposal_bundle?.cover_requirements && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="cover_requirements">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('cover_requirements')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Cover Requirements
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      Insurance coverage details
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Sum Insured</div>
                    <div className="text-sm text-gray-600 font-medium">
                      AED {parseFloat(policyData.policyInfo.proposal_bundle.cover_requirements.sum_insured || '0').toLocaleString()}
                    </div>
                  </div>
                  {expandedSections.has('cover_requirements') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('cover_requirements') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-4">
                    {Object.entries(policyData.policyInfo.proposal_bundle.cover_requirements)
                      .filter(([key]) => !['id', 'project_id', 'created_at', 'updated_at', 'cross_liability_cover'].includes(key))
                      .map(([key, value], idx) => {
                        let displayValue = value;
                        if (key.includes('works') || key.includes('equipment') || key.includes('materials') || 
                            key.includes('property') || key.includes('sum_insured') || key.includes('computed_sum_insured')) {
                          const num = parseFloat(String(value));
                          if (!isNaN(num) && num >= 0) {
                            displayValue = `AED ${num.toLocaleString()}`;
                          }
                        }
                        
                        return (
                          <div key={key} className="p-3 border-r border-b border-gray-200 last:border-r-0">
                            <div className="text-xs text-gray-500 mb-1">{formatFieldName(key)}</div>
                            <div className="text-sm font-medium">
                              {typeof displayValue === 'string' && displayValue.startsWith('AED') ? 
                                displayValue : 
                                formatFieldValue(key, displayValue)
                              }
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Selected Plan Details */}
        {policyData.policyInfo?.proposal_bundle?.plans && policyData.policyInfo.proposal_bundle.plans.length > 0 && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="selected_plan_details">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('selected_plan_details')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Selected Plan Details
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      Insurance plan configuration
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Premium Amount</div>
                    <div className="text-sm text-gray-600 font-medium">
                      AED {parseFloat(policyData.policyInfo.proposal_bundle.plans[0]?.premium_amount || '0').toLocaleString()}
                    </div>
                  </div>
                  {expandedSections.has('selected_plan_details') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('selected_plan_details') && (
              <CardContent className="pt-0">
                {policyData.policyInfo.proposal_bundle.plans.map((plan, index) => (
                  <div key={plan.id || index} className="border border-gray-200 rounded-lg overflow-hidden mb-4 last:mb-0">
                    <div className="grid lg:grid-cols-3">
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Premium Amount</div>
                        <div className="text-sm font-medium">{formatFieldValue('premium_amount', plan.premium_amount)}</div>
                      </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Minimum Premium</div>
                        <div className="text-sm font-medium">{formatFieldValue('minimum_premium_value', plan.minimum_premium_value)}</div>
                      </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Minimum Applied</div>
                        <div className="text-sm font-medium">{plan.is_minimum_premium_applied ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                    
                    {/* Extensions */}
                    {plan.extensions && (
                      <div className="p-4 bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-3">Extensions</h4>
                        <div className="space-y-4">
                          {plan.extensions.tpl_limit && (
                            <div className="border border-gray-200 rounded-lg p-3">
                              <div className="text-sm font-medium text-gray-900 mb-2">TPL Limit Extension</div>
                              <div className="grid lg:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Label</div>
                                  <div className="text-sm font-medium">{plan.extensions.tpl_limit.label}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Impact %</div>
                                  <div className="text-sm font-medium">{plan.extensions.tpl_limit.impact_pct}%</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Description</div>
                                  <div className="text-sm font-medium">{plan.extensions.tpl_limit.description}</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {plan.extensions.selected_plan && (
                            <div className="border border-gray-200 rounded-lg p-3">
                              <div className="text-sm font-medium text-gray-900 mb-2">Selected Plan Details</div>
                              <div className="grid lg:grid-cols-3 gap-4">
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Deductible</div>
                                  <div className="text-sm font-medium">AED {plan.extensions.selected_plan.deductible?.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Base Premium</div>
                                  <div className="text-sm font-medium">AED {plan.extensions.selected_plan.base_premium?.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Coverage Amount</div>
                                  <div className="text-sm font-medium">AED {plan.extensions.selected_plan.coverage_amount?.toLocaleString()}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        {/* Required Documents */}
        {policyData.policyInfo?.proposal_bundle?.required_documents && policyData.policyInfo.proposal_bundle.required_documents.length > 0 && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="required_documents">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('required_documents')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <FolderOpen className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Underwriting Documents
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {policyData.policyInfo.proposal_bundle.required_documents.length} document(s)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.has('required_documents') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('required_documents') && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {policyData.policyInfo.proposal_bundle.required_documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doc.label}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.url, doc.label)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Declaration Documents */}
        {policyData.policyInfo?.proposal_bundle?.required_documents_for_policy_issue && policyData.policyInfo.proposal_bundle.required_documents_for_policy_issue.length > 0 && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="policy_issue_documents">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('policy_issue_documents')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <FileCheck className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Declaration Documents
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {policyData.policyInfo.proposal_bundle.required_documents_for_policy_issue.length} document(s)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {expandedSections.has('policy_issue_documents') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedSections.has('policy_issue_documents') && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {policyData.policyInfo.proposal_bundle.required_documents_for_policy_issue.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doc.label}</div>
                          {doc.uploaded_at && (
                            <div className="text-xs text-gray-500">
                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.url, doc.label)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default PolicyDetails;
