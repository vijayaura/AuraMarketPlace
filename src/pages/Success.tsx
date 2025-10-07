import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, CheckCircle, Calendar, Building, DollarSign, Shield, AlertCircle, ChevronDown, ChevronUp, User, MapPin, CreditCard, Star, Users, FileCheck, ArrowLeft, FolderOpen } from "lucide-react";
import { getProposalBundle, ProposalBundleResponse, getPolicyDetailsById, PolicyDetailsAPIResponse } from "@/lib/api/quotes";
import { getPolicyWordings, PolicyWording } from "@/lib/api/insurers";
import { getInsurerPricingConfig, InsurerPricingConfigResponse } from "@/lib/api/quotes";
import { toast } from "@/components/ui/sonner";
import { generateQuotePDF } from "@/utils/pdfGenerator";
import jsPDF from 'jspdf';

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
  
  if (key.includes('amount') || key.includes('premium') || key.includes('sum_insured') || key.includes('value')) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return `AED ${num.toLocaleString()}`;
    }
  }
  
  if (typeof value === 'string') {
    let formatted = value
      .replace(/[_-]/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, ' ');
    
    return formatted
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        const upper = word.toUpperCase();
        if (['ID', 'CEO', 'CTO', 'CFO', 'VP', 'HR', 'IT', 'API', 'URL', 'PDF', 'CSV', 'XLS', 'XLSX', 'JSON', 'XML', 'HTML', 'CSS', 'JS', 'TS', 'SQL', 'DB', 'UI', 'UX', 'AI', 'ML', 'AR', 'VR', 'IoT', 'SaaS', 'PaaS', 'IaaS', 'CRM', 'ERP', 'POS', 'GPS', 'RFID', 'NFC', 'QR', 'USB', 'HDMI', 'WiFi', 'Bluetooth', '4G', '5G', 'LTE', 'WiMAX', 'VPN', 'LAN', 'WAN', 'DNS', 'HTTP', 'HTTPS', 'FTP', 'SMTP', 'POP', 'IMAP', 'SSH', 'SSL', 'TLS', 'AES', 'RSA', 'MD5', 'SHA', 'JWT', 'OAuth', 'REST', 'SOAP', 'GraphQL', 'gRPC', 'WebSocket', 'TCP', 'UDP', 'IP', 'IPv4', 'IPv6', 'MAC', 'OS', 'iOS', 'Android', 'Windows', 'Linux', 'macOS', 'Unix', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'S3', 'EC2', 'RDS', 'Lambda', 'SQS', 'SNS', 'CloudFront', 'Route53', 'VPC', 'IAM', 'SES', 'SNS', 'SQS', 'DynamoDB', 'ElastiCache', 'Redshift', 'EMR', 'Kinesis', 'CloudWatch', 'CloudTrail', 'Config', 'TrustedAdvisor', 'Support', 'Billing', 'CostExplorer', 'Budgets', 'Organizations', 'ControlTower', 'SecurityHub', 'GuardDuty', 'Inspector', 'Macie', 'WAF', 'Shield', 'CertificateManager', 'SecretsManager', 'KMS', 'CloudHSM', 'DirectoryService', 'Cognito', 'WorkSpaces', 'WorkDocs', 'Chime', 'Connect', 'Pinpoint', 'MobileHub', 'Amplify', 'AppSync', 'API Gateway', 'Step Functions', 'SWF', 'ECS', 'EKS', 'Fargate', 'Batch', 'Glue', 'Athena', 'QuickSight', 'SageMaker', 'Rekognition', 'Polly', 'Transcribe', 'Translate', 'Comprehend', 'Lex', 'Textract', 'Forecast', 'Personalize', 'FraudDetector', 'Bedrock', 'CodeGuru', 'CodeCommit', 'CodeBuild', 'CodeDeploy', 'CodePipeline', 'CodeStar', 'Cloud9', 'X-Ray', 'CloudFormation', 'CDK', 'SAM', 'Serverless'].includes(upper)) {
          return upper;
        }
        if (['LLC', 'Inc', 'Corp', 'Ltd', 'Co', 'LLP', 'LP', 'PC', 'PA', 'PLLC'].includes(upper)) {
          return upper;
        }
        if (/^\d+$/.test(word)) {
          return word;
        }
        if (word.length > 1 && word[0] === word[0].toLowerCase() && word[1] === word[1].toUpperCase()) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  
  return value.toString();
};

// PDF Generation Function for Policy/Proposal
const generateProposalPDF = (proposalBundle: ProposalBundleResponse) => {
  const doc = new jsPDF();
  let yPosition = 20;
  const lineHeight = 6;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const labelWidth = 80;
  const valueWidth = pageWidth - labelWidth - 30;
  
  // Helper function to add table row
  const addTableRow = (label: string, value: string, isHeader: boolean = false) => {
    if (yPosition > pageHeight - 15) {
      doc.addPage();
      yPosition = 20;
    }
    
    const fontSize = isHeader ? 10 : 8;
    const isBold = isHeader;
    const rowHeight = isHeader ? 7 : 6;
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    // Draw border with reduced padding - no borders for section headers
    if (!isHeader) {
      doc.setDrawColor(200, 200, 200);
      doc.rect(10, yPosition - 2, labelWidth, rowHeight + 1);
      doc.rect(10 + labelWidth, yPosition - 2, valueWidth, rowHeight + 1);
    }
    
    // Add text with proper vertical centering and reduced padding
    const textY = yPosition + (rowHeight / 2) - 1;
    doc.text(label, 11, textY);
    doc.text(value, 11 + labelWidth, textY);
    
    // Reduce spacing for continuous table appearance
    yPosition += isHeader ? rowHeight : rowHeight + 1;
  };

  // Helper function to add section header
  const addSectionHeader = (title: string) => {
    addTableRow(title, '', true);
  };

  // Header background with dark blue color
  doc.setFillColor(0, 64, 128);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Header with Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CONTRACTOR ALL RISK INSURANCE', 10, 15);
  doc.text('POLICY DOCUMENT', 10, 22);
  
  // Policy Details on the right side
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const brokerCompanyName = (proposalBundle.quote_meta as any)?.broker_company_name || 'Broker Name';
  const createdDate = proposalBundle.quote_meta?.created_at ? 
    new Date(proposalBundle.quote_meta.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A';
  
  doc.text(`Broker: ${brokerCompanyName}`, pageWidth - 80, 15);
  doc.text(`Date: ${createdDate}`, pageWidth - 80, 22);
  
  // Quote Reference
  doc.setFontSize(8);
  doc.text(`Quote Reference: ${proposalBundle.quote_meta?.quote_reference_number || proposalBundle.quote_meta?.quote_id || 'N/A'}`, 10, 30);
  
  // Reset text color to black for table content
  doc.setTextColor(0, 0, 0);
  yPosition = 40;

  // Project Details
  if (proposalBundle.project) {
    addSectionHeader('PROJECT DETAILS');
    addTableRow('Project Name', proposalBundle.project.project_name || 'N/A');
    addTableRow('Project Type', formatFieldValue('project_type', proposalBundle.project.project_type));
    addTableRow('Construction Type', formatFieldValue('construction_type', proposalBundle.project.construction_type));
    addTableRow('Start Date', formatFieldValue('start_date', proposalBundle.project.start_date));
    addTableRow('Completion Date', formatFieldValue('completion_date', proposalBundle.project.completion_date));
    addTableRow('Construction Period', `${proposalBundle.project.construction_period_months || 0} months`);
    addTableRow('Address', proposalBundle.project.address || 'N/A');
    addTableRow('Country', formatFieldValue('country', proposalBundle.project.country));
    addTableRow('Region', formatFieldValue('region', proposalBundle.project.region));
    addTableRow('Zone', formatFieldValue('zone', proposalBundle.project.zone));
  }

  // Insured Details
  if (proposalBundle.insured?.details) {
    addSectionHeader('INSURED DETAILS');
    addTableRow('Insured Name', formatFieldValue('insured_name', proposalBundle.insured.details.insured_name));
    addTableRow('Role of Insured', formatFieldValue('role_of_insured', proposalBundle.insured.details.role_of_insured));
    addTableRow('Had Losses (Last 5 Years)', proposalBundle.insured.details.had_losses_last_5yrs ? 'Yes' : 'No');
  }

  // Contract Structure
  if (proposalBundle.contract_structure?.details) {
    addSectionHeader('CONTRACT STRUCTURE');
    addTableRow('Main Contractor', formatFieldValue('main_contractor', proposalBundle.contract_structure.details.main_contractor));
    addTableRow('Principal Owner', formatFieldValue('principal_owner', proposalBundle.contract_structure.details.principal_owner));
    addTableRow('Contract Type', formatFieldValue('contract_type', proposalBundle.contract_structure.details.contract_type));
    addTableRow('Contract Number', formatFieldValue('contract_number', proposalBundle.contract_structure.details.contract_number));
    addTableRow('Experience Years', `${proposalBundle.contract_structure.details.experience_years || 0} years`);
  }

  // Cover Requirements
  if (proposalBundle.cover_requirements) {
    addSectionHeader('COVER REQUIREMENTS');
    Object.entries(proposalBundle.cover_requirements)
      .filter(([key]) => !['id', 'created_at', 'updated_at', 'project_id'].includes(key))
      .forEach(([key, value]) => {
        const formattedKey = formatFieldName(key);
        const formattedValue = formatFieldValue(key, value);
        addTableRow(formattedKey, formattedValue);
      });
  }

  // Site Risk Assessment
  if (proposalBundle.site_risks) {
    addSectionHeader('SITE RISK ASSESSMENT');
    Object.entries(proposalBundle.site_risks)
      .filter(([key]) => !['id', 'project_id', 'created_at', 'updated_at'].includes(key))
      .forEach(([key, value]) => {
        let displayValue = value;
        if (value === 0 || value === '0') displayValue = 'No';
        else if (value === 1 || value === '1') displayValue = 'Yes';
        
        const formattedKey = formatFieldName(key);
        const formattedValue = formatFieldValue(key, displayValue);
        addTableRow(formattedKey, formattedValue);
      });
  }

  // Selected Plans
  if (proposalBundle.plans && proposalBundle.plans.length > 0) {
    addSectionHeader('SELECTED PLAN DETAILS');
    proposalBundle.plans.forEach((plan, index) => {
      addTableRow(`Plan ${index + 1} - Insurer`, formatFieldValue('insurer_name', plan.insurer_name));
      addTableRow(`Plan ${index + 1} - Premium Amount`, formatFieldValue('premium_amount', plan.premium_amount));
      if (plan.is_minimum_premium_applied) {
        addTableRow(`Plan ${index + 1} - Minimum Premium`, formatFieldValue('minimum_premium_value', plan.minimum_premium_value));
        addTableRow(`Plan ${index + 1} - Minimum Applied`, 'Yes');
      }
    });
  }

  // Claims History
  if (proposalBundle.insured?.claims && proposalBundle.insured.claims.length > 0) {
    addSectionHeader('CLAIMS HISTORY');
    proposalBundle.insured.claims.forEach((claim, index) => {
      Object.entries(claim).forEach(([key, value]) => {
        const formattedKey = `Claim ${index + 1} - ${formatFieldName(key)}`;
        const formattedValue = formatFieldValue(key, value);
        addTableRow(formattedKey, formattedValue);
      });
    });
  }

  // Sub Contractors
  if (proposalBundle.contract_structure?.sub_contractors && proposalBundle.contract_structure.sub_contractors.length > 0) {
    addSectionHeader('SUB CONTRACTORS');
    proposalBundle.contract_structure.sub_contractors.forEach((subContract, index) => {
      addTableRow(`Sub Contractor ${index + 1} - Name`, formatFieldValue('name', subContract.name));
      addTableRow(`Sub Contractor ${index + 1} - Contract Type`, formatFieldValue('contract_type', subContract.contract_type));
      addTableRow(`Sub Contractor ${index + 1} - Contract Number`, formatFieldValue('contract_number', subContract.contract_number));
    });
  }

  // Consultants
  if (proposalBundle.contract_structure?.consultants && proposalBundle.contract_structure.consultants.length > 0) {
    addSectionHeader('CONSULTANTS');
    proposalBundle.contract_structure.consultants.forEach((consultant, index) => {
      addTableRow(`Consultant ${index + 1} - Name`, formatFieldValue('name', consultant.name));
      addTableRow(`Consultant ${index + 1} - Role`, formatFieldValue('role', consultant.role));
      addTableRow(`Consultant ${index + 1} - License Number`, formatFieldValue('license_number', consultant.license_number));
    });
  }

  // Required Documents
  if (proposalBundle.required_documents && Array.isArray(proposalBundle.required_documents)) {
    addSectionHeader('UNDERWRITING DOCUMENTS');
    proposalBundle.required_documents.forEach((doc, index) => {
      addTableRow(`Document ${index + 1}`, formatFieldValue('label', doc.label));
    });
  }

  // Save the PDF
  const fileName = `Policy_${proposalBundle.quote_meta?.quote_reference_number || proposalBundle.quote_meta?.quote_id || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [proposalBundle, setProposalBundle] = useState<ProposalBundleResponse | null>(null);
  const [policyWordings, setPolicyWordings] = useState<PolicyWording[]>([]);
  const [policyDetails, setPolicyDetails] = useState<PolicyDetailsAPIResponse | null>(null);
  const [productBundle, setProductBundle] = useState<InsurerPricingConfigResponse | null>(null);
  const [selectedExtensions, setSelectedExtensions] = useState<any[]>([]);
  const [expandedWordings, setExpandedWordings] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
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
      toast.success('Download Started', {
        description: `Downloading ${filename}...`
      });
      
      // Fetch the document from the JWT token URL
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf,application/octet-stream,*/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
      }
      
      // Create blob from response
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Create temporary link element for download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download Failed', {
        description: error instanceof Error ? error.message : 'Failed to download document. Please try again.'
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
      generateProposalPDF(proposalBundle);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Success Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div>
              <h1 className="text-3xl font-bold text-gray-900">Policy Created Successfully!</h1>
              <p className="text-lg text-gray-600 mt-1">
                    Your insurance policy has been created.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
            <Button onClick={handlePrintPolicy} variant="outline" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Policy
                </Button>
            <Button onClick={() => navigate('/broker/dashboard')} className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Policy
                </Button>
            </div>
          </div>

        {/* Policy Summary */}
        {policyDetails && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                        </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Policy Summary
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      Policy overview and key details
                        </div>
                        </div>
                        </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Total Premium</div>
                  <div className="text-sm text-gray-600 font-medium">
                    {formatFieldValue('base_premium', policyDetails.policyInfo.base_premium)}
                      </div>
                    </div>
                  </div>
            </CardHeader>
            <CardContent className="pt-0">
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid lg:grid-cols-4">
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy ID</div>
                    <div className="text-sm font-medium">{policyDetails.policyInfo.policy_reference}</div>
                        </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy Start Date</div>
                    <div className="text-sm font-medium">{formatFieldValue('start_date', policyDetails.policyInfo.start_date)}</div>
                        </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Policy End Date</div>
                    <div className="text-sm font-medium">{formatFieldValue('end_date', policyDetails.policyInfo.end_date)}</div>
                        </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div className="text-sm font-medium">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {formatFieldValue('status', policyDetails.policyInfo.status)}
                      </Badge>
                        </div>
                        </div>
                        </div>
                        </div>
            </CardContent>
          </Card>
        )}

        {/* Project Details */}
        {policyDetails && (
          <Card className="bg-white shadow-lg border-0">
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
                      Construction project information
                        </div>
                      </div>
                    </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Project Name</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue('project_name', policyDetails.policyInfo.proposal_bundle.project.project_name)}
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
                  <div className="grid lg:grid-cols-3">
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Project Name</div>
                      <div className="text-sm font-medium">{formatFieldValue('project_name', policyDetails.policyInfo.proposal_bundle.project.project_name)}</div>
                              </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Project Type</div>
                      <div className="text-sm font-medium">{formatFieldValue('project_type', policyDetails.policyInfo.proposal_bundle.project.project_type)}</div>
                            </div>
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Completion Date</div>
                      <div className="text-sm font-medium">{formatFieldValue('completion_date', policyDetails.policyInfo.proposal_bundle.project.completion_date)}</div>
                        </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Sub Project Type</div>
                      <div className="text-sm font-medium">{formatFieldValue('sub_project_type', policyDetails.policyInfo.proposal_bundle.project.sub_project_type)}</div>
                      </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Construction Type</div>
                      <div className="text-sm font-medium">{formatFieldValue('construction_type', policyDetails.policyInfo.proposal_bundle.project.construction_type)}</div>
                    </div>
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Maintenance Period Months</div>
                      <div className="text-sm font-medium">{formatFieldValue('maintenance_period_months', policyDetails.policyInfo.proposal_bundle.project.maintenance_period_months)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
            </Card>
          )}

        {/* Insured Details */}
        {policyDetails && (
          <Card className="bg-white shadow-lg border-0">
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
                      {formatFieldValue('insured_name', policyDetails.policyInfo.proposal_bundle.insured.details.insured_name)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Role</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue('role_of_insured', policyDetails.policyInfo.proposal_bundle.insured.details.role_of_insured)}
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
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid lg:grid-cols-3">
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Insured Name</div>
                        <div className="text-sm font-medium">{formatFieldValue('insured_name', policyDetails.policyInfo.proposal_bundle.insured.details.insured_name)}</div>
                        </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Role of Insured</div>
                        <div className="text-sm font-medium">{formatFieldValue('role_of_insured', policyDetails.policyInfo.proposal_bundle.insured.details.role_of_insured)}</div>
                      </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Had Losses Last 5 Years</div>
                        <div className="text-sm font-medium">{formatFieldValue('had_losses_last_5yrs', policyDetails.policyInfo.proposal_bundle.insured.details.had_losses_last_5yrs)}</div>
                    </div>
                    </div>
                  </div>
                  
                  {/* Claims History */}
                  {policyDetails.policyInfo.proposal_bundle.insured.claims && policyDetails.policyInfo.proposal_bundle.insured.claims.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Claims History</h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-4 gap-0">
                          <div className="p-3 bg-gray-50 border-r border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Claim Year</div>
                          </div>
                          <div className="p-3 bg-gray-50 border-r border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Description</div>
                          </div>
                          <div className="p-3 bg-gray-50 border-r border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Count of Claims</div>
                          </div>
                          <div className="p-3 bg-gray-50 border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Amount of Claims</div>
                          </div>
                          {policyDetails.policyInfo.proposal_bundle.insured.claims.map((claim, index) => (
                            <>
                              <div key={`year-${index}`} className="p-3 border-r border-b border-gray-200">
                                <div className="text-sm font-medium">{claim.claim_year}</div>
                              </div>
                              <div key={`desc-${index}`} className="p-3 border-r border-b border-gray-200">
                                <div className="text-sm font-medium">{claim.description}</div>
                              </div>
                              <div key={`count-${index}`} className="p-3 border-r border-b border-gray-200">
                                <div className="text-sm font-medium">{claim.count_of_claims}</div>
                              </div>
                              <div key={`amount-${index}`} className="p-3 border-b border-gray-200">
                                <div className="text-sm font-medium">AED {parseFloat(claim.amount_of_claims).toLocaleString()}</div>
                              </div>
                            </>
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

        {/* Site Risk Assessment */}
        {policyDetails && (
          <Card className="bg-white shadow-lg border-0">
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
                      {formatFieldValue('soil_type', policyDetails.policyInfo.proposal_bundle.site_risks.soil_type)}
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
                  <div className="grid lg:grid-cols-3">
                    {Object.entries(policyDetails.policyInfo.proposal_bundle.site_risks)
                      .filter(([key]) => !['id', 'project_id', 'created_at', 'updated_at'].includes(key))
                      .map(([key, value], idx) => (
                        <div key={key} className="p-3 border-r border-b border-gray-200 last:border-r-0">
                          <div className="text-xs text-gray-500 mb-1">{formatFieldName(key)}</div>
                          <div className="text-sm font-medium">{formatFieldValue(key, value)}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Cover Requirements */}
        {policyDetails && (
          <Card className="bg-white shadow-lg border-0">
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
                    <div className="text-sm font-medium">
                      {formatFieldValue('sum_insured', policyDetails.policyInfo.proposal_bundle.cover_requirements.sum_insured)}
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
                  <div className="grid lg:grid-cols-3">
                    {Object.entries(policyDetails.policyInfo.proposal_bundle.cover_requirements)
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
        {policyDetails && (
              <Card className="bg-white shadow-lg border-0">
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
                      AED {parseFloat(policyDetails.policyInfo.proposal_bundle.plans[0]?.premium_amount || '0').toLocaleString()}
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
                {policyDetails.policyInfo.proposal_bundle.plans.map((plan, index) => (
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

        {/* Required Documents (Underwriting Documents) */}
        {proposalBundle && proposalBundle.required_documents && Object.keys(proposalBundle.required_documents).length > 0 && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Underwriting Documents
                  </CardTitle>
                  <div className="text-xs text-gray-400 mt-1">
                    {Object.keys(proposalBundle.required_documents).length} document(s)
                  </div>
                </div>
              </div>
                </CardHeader>
                <CardContent className="pt-0">
              <div className="space-y-3">
                    {Object.entries(proposalBundle.required_documents).map(([key, doc]) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">{doc.label}</div>
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
              </Card>
            )}

            {/* Declaration Documents */}
            {proposalBundle && proposalBundle.required_documents_for_policy_issue && (
              <Card className="bg-white shadow-lg border-0">
                <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FileCheck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Declaration Documents
                  </CardTitle>
                  <div className="text-xs text-gray-400 mt-1">
                    {Array.isArray(proposalBundle.required_documents_for_policy_issue) 
                      ? `${proposalBundle.required_documents_for_policy_issue.length} document(s)`
                      : typeof proposalBundle.required_documents_for_policy_issue === 'object'
                        ? `${Object.keys(proposalBundle.required_documents_for_policy_issue).length} document(s)`
                        : 'Document(s) available'
                    }
                  </div>
                </div>
              </div>
                </CardHeader>
                <CardContent className="pt-0">
              <div className="space-y-3">
                    {Array.isArray(proposalBundle.required_documents_for_policy_issue) ? (
                      proposalBundle.required_documents_for_policy_issue.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">{doc.label || doc.name || `Document ${index + 1}`}</div>
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
                          {doc.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.url, doc.label || doc.name)}
                          className="flex items-center gap-2"
                            >
                          <Download className="h-4 w-4" />
                              Download
                            </Button>
                          )}
                        </div>
                      ))
                    ) : typeof proposalBundle.required_documents_for_policy_issue === 'object' ? (
                      Object.entries(proposalBundle.required_documents_for_policy_issue).map(([key, doc]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-medium">{doc.label || key}</div>
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
                          {doc.url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.url, doc.label || key)}
                          className="flex items-center gap-2"
                            >
                          <Download className="h-4 w-4" />
                              Download
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400 px-2 py-1">Not uploaded</span>
                          )}
                        </div>
                      ))
                    ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
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

        {/* Policy Documents */}
        {policyWordings && policyWordings.length > 0 && (
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
          </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Policy Documents
                  </CardTitle>
                  <div className="text-xs text-gray-400 mt-1">
                    Download policy documents and wordings
        </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {policyWordings.map((wording, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">{wording.label}</div>
                        <div className="text-xs text-gray-500">
                          {wording.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDocument(wording.url, wording.label)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Success;
