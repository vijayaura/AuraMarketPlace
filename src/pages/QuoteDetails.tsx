import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Edit, Download, Check, Circle, ChevronDown, ChevronUp, FileText, User, Building, MapPin, Shield, FolderOpen, CreditCard, Star } from "lucide-react";
import { getProposalBundle, ProposalBundleResponse, getInsurerPricingConfig, InsurerPricingConfigResponse } from "@/lib/api/quotes";
import jsPDF from 'jspdf';
import { generateQuotePDF } from '@/utils/pdfGenerator';

// Quote lifecycle steps
const QUOTE_LIFECYCLE_STEPS = [
  { key: 'project_details', label: 'Project Details' },
  { key: 'insured_details', label: 'Insured Details' },
  { key: 'contract_structure', label: 'Contract Structure' },
  { key: 'site_risk', label: 'Site Risk Assessment' },
  { key: 'cover_requirements', label: 'Cover Requirements' },
  { key: 'required_documents', label: 'Underwriting Documents' },
  { key: 'plan_selected', label: 'Plan Selection' },
  { key: 'declaration_documents', label: 'Declaration Documents' },
  { key: 'policy_created', label: 'Policy Created' }
];

// Convert backend status to human readable
const getHumanReadableStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'project_details': 'Project Details',
    'insured_details': 'Insured Details',
    'contract_structure': 'Contract Structure',
    'site_risk': 'Site Risks',
    'cover_requirements': 'Cover Requirements',
    'required_documents': 'UW Documents',
    'plan_selected': 'Plan Selected',
    'declaration_documents': 'Declaration Documents',
    'policy_created': 'Policy Created',
    'draft': 'Draft',
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'expired': 'Expired'
  };
  
  return statusMap[status?.toLowerCase()] || status || 'Unknown';
};

// Determine completion status based on data availability
const getCompletionStatus = (proposalBundle: ProposalBundleResponse) => {
  const steps = [];
  
  // Check each step completion
  if (proposalBundle.project) steps.push('project_details');
  if (proposalBundle.insured?.details) steps.push('insured_details');
  if (proposalBundle.contract_structure?.details) steps.push('contract_structure');
  if (proposalBundle.site_risks) steps.push('site_risk');
  if (proposalBundle.cover_requirements) steps.push('cover_requirements');
          if (proposalBundle.required_documents && Array.isArray(proposalBundle.required_documents) && proposalBundle.required_documents.length > 0) steps.push('required_documents');
  if (proposalBundle.plans && proposalBundle.plans.length > 0) steps.push('plan_selected');
  if (proposalBundle.required_documents_for_policy_issue) steps.push('declaration_documents');
  if (proposalBundle.quote_meta?.status === 'policy_created') steps.push('policy_created');
  
  return steps;
};

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
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // For project start/end dates, show only date without time
        if (key === 'start_date' || key === 'completion_date') {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        // For other dates, include time
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (e) {
      return 'Invalid date';
    }
  }
  
  // Format monetary values
  if (key.includes('amount') || key.includes('premium') || key.includes('sum_insured') || key.includes('value')) {
    const num = parseFloat(String(value));
    if (!isNaN(num)) {
      if (num === 0) return 'AED 0';
      if (num > 0) return `AED ${num.toLocaleString()}`;
    }
    return 'Invalid amount';
  }
  
  // Format text to sentence case
  const str = String(value);
  if (str.length > 0) {
    // Special handling for contract numbers - show as-is
    if (key.includes('contract_number') || key === 'contract_number') {
      return str;
    }
    
    // Handle special cases for better formatting
    if (str.includes('-')) {
      // Handle hyphenated words like "design-and-build"
      return str.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' & ');
    }
    if (str.includes('_')) {
      // Handle underscore separated words
      return str.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
    // Convert to proper sentence case
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  
  return 'Not specified';
};

// PDF Generation Function
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
    
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    // Draw border
    doc.setDrawColor(200, 200, 200);
    doc.rect(10, yPosition - 4, labelWidth, lineHeight + 2);
    doc.rect(10 + labelWidth, yPosition - 4, valueWidth, lineHeight + 2);
    
    // Add text
    doc.text(label, 12, yPosition);
    doc.text(value, 12 + labelWidth, yPosition);
    
    yPosition += lineHeight + 2;
  };

  // Helper function to add section header
  const addSectionHeader = (title: string) => {
    yPosition += 3;
    addTableRow(title, '', true);
  };

  // Header with Title and Broker Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRACTOR ALL RISK INSURANCE', 10, 15);
  doc.text('PROPOSAL FORM', 10, 22);
  
  // Broker Details on the right side
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

  // Signature Section at the bottom
  yPosition += 10;
  
  // Check if we need a new page for signatures
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Signature section header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES', 10, yPosition);
  yPosition += 10;
  
  // Broker signature section (left side)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('BROKER:', 10, yPosition);
  doc.text(brokerCompanyName, 10, yPosition + 8);
  
  // Signature line for broker
  doc.line(10, yPosition + 20, 90, yPosition + 20);
  doc.text('Broker Signature', 10, yPosition + 25);
  doc.text('Name & Date', 10, yPosition + 30);
  
  // Insured signature section (right side)
  const rightSideX = pageWidth - 90;
  doc.text('INSURED:', rightSideX, yPosition);
  const insuredName = proposalBundle.insured?.details?.insured_name || 'N/A';
  doc.text(insuredName, rightSideX, yPosition + 8);
  
  // Signature line for insured
  doc.line(rightSideX, yPosition + 20, pageWidth - 10, yPosition + 20);
  doc.text('Insured Signature', rightSideX, yPosition + 25);
  doc.text('Name & Date', rightSideX, yPosition + 30);

  // Save the PDF
  const fileName = `Proposal_${proposalBundle.quote_meta?.quote_reference_number || proposalBundle.quote_meta?.quote_id || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};


const QuoteDetails = () => {
  const { quoteId, id } = useParams<{ quoteId?: string; id?: string }>();
  const actualQuoteId = quoteId || id;
  const location = useLocation();
  
  console.log('🔍 QuoteDetails component rendered');
  console.log('🔍 URL params:', { quoteId, id, actualQuoteId });
  console.log('🔍 Current location:', location.pathname);
  const [proposalBundle, setProposalBundle] = useState<ProposalBundleResponse | null>(null);
  const [productBundle, setProductBundle] = useState<InsurerPricingConfigResponse | null>(null);
  const [selectedExtensions, setSelectedExtensions] = useState<any[]>([]);
  const [expandedWordings, setExpandedWordings] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quote_summary', 'quote_journey']));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuoteData = async () => {
      if (!actualQuoteId) {
        setError("Quote ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        console.log('%cQuote Details Debug:', 'color: #ff1493; font-weight: bold;');
        console.log('- Quote ID:', actualQuoteId);
        console.log('- API Endpoint: /api/v1/quotes/getProposalBundle/' + actualQuoteId);
        console.log('- Current URL:', location.pathname);
        console.log('- About to call getProposalBundle with:', parseInt(actualQuoteId));
        
        const data = await getProposalBundle(parseInt(actualQuoteId));
        console.log('✅ API call successful, data received:', data);
        setProposalBundle(data);
        
        console.log('%cProposal Bundle loaded successfully:', 'color: #ff1493; font-weight: bold;', data);

        // Get product bundle configuration with clause_pricing_config and meta data
        if (data.quote_meta?.insurer_id) {
          const insurerId = data.quote_meta.insurer_id;
          console.log('%cCalling Product Bundle API for insurer:', 'color: #ff1493; font-weight: bold;', insurerId);
          
          const productBundleData = await getInsurerPricingConfig(insurerId);
          setProductBundle(productBundleData);
          
          console.log('%cProduct Bundle API Response:', 'color: #ff1493; font-weight: bold;', productBundleData);
          console.log('%cClause Pricing Config with Meta:', 'color: #ff1493; font-weight: bold;', productBundleData.clause_pricing_config);
        }
      } catch (err) {
        console.error('Error loading proposal bundle:', err);
        setError(err instanceof Error ? err.message : 'Failed to load quote data');
      } finally {
        setLoading(false);
      }
    };

    loadQuoteData();
  }, [actualQuoteId]);

  // Process selected extensions when both proposalBundle and productBundle are loaded
  useEffect(() => {
    if (proposalBundle && productBundle) {
      // Use clause_pricing_config from product bundle API
      const clausePricingConfig = productBundle.clause_pricing_config || [];
      
      console.log('%cUsing clause_pricing_config from product bundle API:', 'color: #ff1493; font-weight: bold;', clausePricingConfig);

      // Get only selected extensions from policy response
      const policyExtensions = proposalBundle.plans[0]?.extensions?.selected_extensions || {};
      
      console.log('%cPolicy Extensions:', 'color: #ff1493; font-weight: bold;', policyExtensions);

      // Process each selected extension
      const processedExtensions = Object.entries(policyExtensions).map(([extensionKey, extensionData]) => {
        // Get the code from policy extension data
        const extensionCode = (extensionData as any)?.code;
        console.log(`%cProcessing policy extension ${extensionKey}, code: ${extensionCode}`, 'color: #ff1493; font-weight: bold;');

        // Find matching clause in product bundle's clausePricingConfig by clause_code
        const matchingClause = clausePricingConfig.find((clause: any) => {
          const clauseCode = clause.clause_code;
          const match = clauseCode && extensionCode && 
            clauseCode.toLowerCase() === extensionCode.toLowerCase();
          
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
            show_type: meta.show_type || 'default', // Use show_type from product bundle meta
            is_mandatory: meta.show_type?.toLowerCase() === 'mandatory', // Only check product bundle meta
            extension_data: extensionData,
            clause_config: matchingClause
          };
          
          console.log(`%cFinal processed extension for ${extensionCode}:`, 'color: #ff1493; font-weight: bold;', processedExtension);
          return processedExtension;
        }

        console.log(`%cNo matching clause found in product bundle for ${extensionKey} (code: ${extensionCode})`, 'color: #ff1493; font-weight: bold;');
        
        // If no matching clause found, use basic info from policy
        return {
          policy_key: extensionKey,
          clause_code: extensionCode || extensionKey,
          title: (extensionData as any)?.label || extensionKey,
          clause_wording: '',
          clause_type: 'Extension',
          show_type: 'default',
          is_mandatory: false,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quote details...</p>
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

  if (!proposalBundle) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Quote not found</p>
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
              <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Quote Details - {proposalBundle.quote_meta?.quote_reference_number || proposalBundle.quote_meta?.quote_id || 'Unknown'}
                </h1>
                <p className="text-sm text-gray-600">
                  {proposalBundle.insured?.details?.insured_name || proposalBundle.project?.client_name || 'Insurance Quote'}
                </p>
              </div>
              <div className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm">
                {getHumanReadableStatus(proposalBundle.quote_meta?.status || '')}
              </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
            {/* Only show Continue Editing button for broker portal */}
            {location.pathname.includes('/broker/') && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => window.location.href = `/customer/proposal?new=true&resume=${actualQuoteId}`}
              >
                <Edit className="h-4 w-4" />
                Continue Editing
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={() => proposalBundle && generateProposalPDF(proposalBundle)}
            >
              <Download className="h-4 w-4" />
                Download Proposal
              </Button>
            {/* Only show Download Quote button when plan selection is done */}
            {proposalBundle?.plans && proposalBundle.plans.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => proposalBundle && generateQuotePDF(proposalBundle)}
              >
                <Download className="h-4 w-4" />
                Download Quote
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Quote Journey Progress */}
        <Card className="bg-white border border-blue-200 mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Quote Progress Journey
                </CardTitle>
              </CardHeader>
          <CardContent className="pt-0">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200"></div>
              
              {/* Steps */}
              <div className="flex justify-between items-start relative z-10">
                {QUOTE_LIFECYCLE_STEPS.map((step, index) => {
                  const completedSteps = getCompletionStatus(proposalBundle);
                  const isCompleted = completedSteps.includes(step.key);
                  const isCurrentStep = proposalBundle.quote_meta?.status === step.key;
                  
                  const handleStepClick = () => {
                    // Map journey steps to section keys
                    const sectionMapping: Record<string, string> = {
                      'project_details': 'project_details',
                      'insured_details': 'insured_details', 
                      'contract_structure': 'contract_structure',
                      'site_risk': 'site_risk_assessment',
                      'cover_requirements': 'cover_requirements',
                      'required_documents': 'required_documents',
                      'plan_selected': 'selected_plan_details',
                      'declaration_documents': 'required_documents',
                      'policy_created': 'quote_summary'
                    };
                    
                    const sectionKey = sectionMapping[step.key];
                    if (sectionKey) {
                      // Expand the corresponding section
                      setExpandedSections(prev => {
                        const newSet = new Set(prev);
                        newSet.add(sectionKey);
                        return newSet;
                      });
                      
                      // Scroll to the section
                      setTimeout(() => {
                        const element = document.querySelector(`[data-section="${sectionKey}"]`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }
                  };
                  
                  return (
                    <div 
                      key={step.key} 
                      className="flex flex-col items-center text-center max-w-24 cursor-pointer"
                      onClick={handleStepClick}
                    >
                      {/* Step Circle */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all hover:scale-105 ${
                        isCompleted 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : isCurrentStep 
                            ? 'bg-primary text-white hover:bg-blue-600'
                            : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                </div>
                      
                      {/* Step Label */}
                      <div className={`text-xs font-medium ${
                        isCompleted || isCurrentStep ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.label}
                  </div>
                  </div>
                  );
                })}
                </div>
                </div>
          </CardContent>
        </Card>

        {/* Quote Summary */}
        {proposalBundle.quote_meta && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="quote_summary">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('quote_summary')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                   </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Quote Summary
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {proposalBundle.quote_meta.created_at ? 
                        new Date(proposalBundle.quote_meta.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'No date available'
                      }
                  </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Quote Reference</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {proposalBundle.quote_meta.quote_reference_number || proposalBundle.quote_meta.quote_id}
                  </div>
                  </div>
                  {expandedSections.has('quote_summary') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                  </div>
            </CardHeader>
            {expandedSections.has('quote_summary') && (
              <CardContent className="pt-0">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-4">
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Quote Reference</div>
                      <div className="text-sm font-medium">{proposalBundle.quote_meta.quote_reference_number || proposalBundle.quote_meta.quote_id}</div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className="text-sm font-medium">
                        <Badge variant="outline">{getHumanReadableStatus(proposalBundle.quote_meta.status || '')}</Badge>
                      </div>
                    </div>
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Created Date</div>
                      <div className="text-sm font-medium">
                        {proposalBundle.quote_meta.created_at ? 
                          new Date(proposalBundle.quote_meta.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not available'
                        }
                      </div>
                    </div>
                    <div className="p-3 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Validity Date</div>
                      <div className="text-sm font-medium">
                        {proposalBundle.quote_meta.validity_date ? 
                          new Date(proposalBundle.quote_meta.validity_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Not set'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
            </Card>
        )}

        {/* Cover Requirements - Show above Project Details if values exist */}
        {proposalBundle.cover_requirements && (
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
                      {proposalBundle.quote_meta.created_at ? 
                        new Date(proposalBundle.quote_meta.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'No date available'
                      }
                  </div>
                  </div>
                  </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Sum Insured</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {Object.entries(proposalBundle.cover_requirements)
                        .find(([key]) => key.includes('sum_insured') || key.includes('computed_sum'))?.[1] ? 
                        `AED ${parseFloat(String(Object.entries(proposalBundle.cover_requirements)
                          .find(([key]) => key.includes('sum_insured') || key.includes('computed_sum'))?.[1] || '0')).toLocaleString()}` : 
                        'Not calculated'
                      }
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
                    {Object.entries(proposalBundle.cover_requirements)
                      .filter(([key]) => key !== 'project_value' && key !== 'id' && key !== 'updated_at' && key !== 'project_id' && key !== 'created_at')
                      .map(([key, value], idx) => {
                        let displayKey = key;
                        let displayValue = value;
                        
                        // Rename computed_sum_insured to sum_insured and skip it since we show it in header
                        if (key === 'computed_sum_insured') {
                          return null; // Skip this field since it's shown in the header
                        }
                        
                        // Format monetary values to show AED
                        if (key.includes('works') || key.includes('equipment') || key.includes('materials') || 
                            key.includes('property') || key.includes('sum_insured') || key.includes('computed_sum_insured')) {
                          const num = parseFloat(String(value));
                          if (!isNaN(num) && num >= 0) {
                            displayValue = `AED ${num.toLocaleString()}`;
                          }
                        }
                        
                        return (
                          <div key={key} className="p-3 border-r border-b border-gray-200 last:border-r-0">
                            <div className="text-xs text-gray-500 mb-1">{formatFieldName(displayKey)}</div>
                            <div className="text-sm font-medium">
                              {typeof displayValue === 'string' && displayValue.startsWith('AED') ? 
                                displayValue : 
                                formatFieldValue(displayKey, displayValue)
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
        {proposalBundle.plans && proposalBundle.plans.length > 0 && (
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
                      {proposalBundle.quote_meta.created_at ? 
                        new Date(proposalBundle.quote_meta.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'No date available'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Premium Amount</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {proposalBundle.plans[0]?.premium_amount ? 
                        formatFieldValue('premium_amount', proposalBundle.plans[0].premium_amount) : 
                        'Not calculated'
                      }
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
              {proposalBundle.plans.map((plan, index) => (
                <div key={plan.id || index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid lg:grid-cols-4">
                    <div className="p-3 border-r border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Insurer Name</div>
                      <div className="text-sm font-medium">{formatFieldValue('insurer_name', plan.insurer_name)}</div>
                  </div>
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
                </div>
              ))}
              </CardContent>
            )}
            </Card>
        )}

        {/* Selected Extensions - Enhanced with Product Bundle Data */}
        {selectedExtensions.length > 0 && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="selected_extensions">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('selected_extensions')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                          </div>
                          <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Selected Extensions
                    </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {proposalBundle.quote_meta.created_at ? 
                        new Date(proposalBundle.quote_meta.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'No date available'
                      }
                          </div>
                          </div>
                        </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Extensions</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {selectedExtensions.length} extension{selectedExtensions.length !== 1 ? 's' : ''}
                      </div>
                  </div>
                  {expandedSections.has('selected_extensions') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </div>
              </CardHeader>
            {expandedSections.has('selected_extensions') && (
              <CardContent className="pt-0">
              <div className="space-y-3">
                {selectedExtensions.map((extension) => (
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
                        {extension.is_mandatory && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">Mandatory</Badge>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7"
                        onClick={() => toggleWordingExpansion(extension.policy_key)}
                      >
                        {expandedWordings.has(extension.policy_key) ? 'Hide Wordings' : 'View Wordings'}
                </Button>
                    </div>
                    
                    {/* Expanded Wording */}
                    {expandedWordings.has(extension.policy_key) && extension.clause_wording && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {extension.clause_wording || 'No wording available'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </CardContent>
            )}
            </Card>
        )}

        {/* Project Details */}
        {proposalBundle.project && (
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
                      {proposalBundle.quote_meta.created_at ? 
                        new Date(proposalBundle.quote_meta.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'No date available'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Project Name</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {proposalBundle.project.project_name || 'Project Name'}
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
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Project Name</div>
                    <div className="text-sm font-medium">{formatFieldValue('project_name', proposalBundle.project.project_name)}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Project Type</div>
                    <div className="text-sm font-medium">{formatFieldValue('project_type', proposalBundle.project.project_type)}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Sub Project Type</div>
                    <div className="text-sm font-medium">{formatFieldValue('sub_project_type', proposalBundle.project.sub_project_type)}</div>
                  </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Construction Type</div>
                    <div className="text-sm font-medium">{formatFieldValue('construction_type', proposalBundle.project.construction_type)}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Project Start Date</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue('start_date', proposalBundle.project.start_date)}
                  </div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Completion Date</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue('completion_date', proposalBundle.project.completion_date)}
                  </div>
                          </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Construction Period</div>
                    <div className="text-sm font-medium">
                      {proposalBundle.project.construction_period_months ? 
                        `${proposalBundle.project.construction_period_months} months` : 
                        'Not calculated'
                      }
                          </div>
                        </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Maintenance Period</div>
                    <div className="text-sm font-medium">
                      {proposalBundle.project.maintenance_period_months ? 
                        `${proposalBundle.project.maintenance_period_months} months` : 
                        'Not specified'
                      }
                      </div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Country</div>
                    <div className="text-sm font-medium">{formatFieldValue('country', proposalBundle.project.country)}</div>
                  </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Region</div>
                    <div className="text-sm font-medium">{formatFieldValue('region', proposalBundle.project.region)}</div>
                  </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Zone</div>
                    <div className="text-sm font-medium">{formatFieldValue('zone', proposalBundle.project.zone)}</div>
                  </div>
                  <div className="col-span-4 p-3">
                    <div className="text-xs text-gray-500 mb-1">Address</div>
                    <div className="text-sm font-medium">{formatFieldValue('address', proposalBundle.project.address)}</div>
                  </div>
                  </div>
                </div>
              </CardContent>
            )}
            </Card>
        )}

        {/* Insured Details */}
        {proposalBundle.insured?.details && (
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
                      {proposalBundle.insured.details.updated_at ? 
                        new Date(proposalBundle.insured.details.updated_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'No date available'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Has Claims</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {proposalBundle.insured?.claims && proposalBundle.insured.claims.length > 0 ? 'Yes' : 'No'}
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
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid lg:grid-cols-4">
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Insured Name</div>
                    <div className="text-sm font-medium">{formatFieldValue('insured_name', proposalBundle.insured.details.insured_name)}</div>
                    </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Role of Insured</div>
                    <div className="text-sm font-medium">{formatFieldValue('role_of_insured', proposalBundle.insured.details.role_of_insured)}</div>
                    </div>
                  <div className="p-3 border-r border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Had Losses (Last 5 Years)</div>
                    <div className="text-sm font-medium">{proposalBundle.insured.details.had_losses_last_5yrs ? 'Yes' : 'No'}</div>
                    </div>
                  <div className="p-3 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Created Date</div>
                    <div className="text-sm font-medium">
                      {formatFieldValue('created_at', proposalBundle.insured.details.created_at)}
                    </div>
                  </div>
                  {/* Claims History Table */}
                  {proposalBundle.insured?.claims && proposalBundle.insured.claims.length > 0 && (
                    <div className="col-span-4 p-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-3 font-medium">Claims History ({proposalBundle.insured.claims.length} claims)</div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Claim Year</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Description</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Count of Claims</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount of Claims</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {proposalBundle.insured.claims.map((claim, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">
                                  {formatFieldValue('claim_year', claim.claim_year)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">
                                  {formatFieldValue('description', claim.description)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">
                                  {formatFieldValue('count_of_claims', claim.count_of_claims)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {formatFieldValue('amount_of_claims', claim.amount_of_claims)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </CardContent>
            )}
          </Card>
        )}


        {/* Contract Structure */}
        {proposalBundle.contract_structure && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="contract_structure">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('contract_structure')}
            >
              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                                </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Contract Structure
                </CardTitle>
                    <div className="text-xs text-gray-400 mt-1">
                      {proposalBundle.quote_meta.created_at ? 
                        new Date(proposalBundle.quote_meta.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'No date available'
                      }
                              </div>
                              </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Main Contractor</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {proposalBundle.contract_structure.details?.main_contractor || 'Not specified'}
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
              {/* Main Contract Details */}
              {proposalBundle.contract_structure.details && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Main Contract</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid lg:grid-cols-4">
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Main Contractor</div>
                        <div className="text-sm font-medium">{formatFieldValue('main_contractor', proposalBundle.contract_structure.details.main_contractor)}</div>
                    </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Principal Owner</div>
                        <div className="text-sm font-medium">{formatFieldValue('principal_owner', proposalBundle.contract_structure.details.principal_owner)}</div>
                    </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Contract Type</div>
                        <div className="text-sm font-medium">{formatFieldValue('contract_type', proposalBundle.contract_structure.details.contract_type)}</div>
                    </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Experience Years</div>
                        <div className="text-sm font-medium">{proposalBundle.contract_structure.details.experience_years || 0} years</div>
                    </div>
                      <div className="col-span-4 p-3">
                        <div className="text-xs text-gray-500 mb-1">Contract Number</div>
                        <div className="text-sm font-medium">{formatFieldValue('contract_number', proposalBundle.contract_structure.details.contract_number)}</div>
                  </div>
                </div>
                </div>
                    </div>
                  )}

              {/* Sub Contractors */}
              {proposalBundle.contract_structure.sub_contractors && proposalBundle.contract_structure.sub_contractors.length > 0 && (
                    <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Sub Contractors</h4>
                <div className="space-y-4">
                    {proposalBundle.contract_structure.sub_contractors.map((subContract, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="grid lg:grid-cols-3">
                          <div className="p-3 border-r border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Name</div>
                            <div className="text-sm font-medium">{formatFieldValue('name', subContract.name)}</div>
                                </div>
                          <div className="p-3 border-r border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Contract Type</div>
                            <div className="text-sm font-medium">{formatFieldValue('contract_type', subContract.contract_type)}</div>
                              </div>
                          <div className="p-3 border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Contract Number</div>
                            <div className="text-sm font-medium">{formatFieldValue('contract_number', subContract.contract_number)}</div>
                              </div>
                </div>
                      </div>
                        ))}
                  </div>
                    </div>
                  )}

              {/* Consultants */}
              {proposalBundle.contract_structure.consultants && proposalBundle.contract_structure.consultants.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Consultants</h4>
                <div className="space-y-4">
                    {proposalBundle.contract_structure.consultants.map((consultant, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="grid lg:grid-cols-3">
                          <div className="p-3 border-r border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Name</div>
                            <div className="text-sm font-medium">{formatFieldValue('name', consultant.name)}</div>
                </div>
                          <div className="p-3 border-r border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Role</div>
                            <div className="text-sm font-medium">{formatFieldValue('role', consultant.role)}</div>
                              </div>
                          <div className="p-3 border-b border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">License Number</div>
                            <div className="text-sm font-medium">{formatFieldValue('license_number', consultant.license_number)}</div>
                              </div>
                        </div>
                      </div>
                        ))}
                  </div>
                    </div>
              )}
              </CardContent>
            )}
            </Card>
        )}

        {/* Site Risk Assessment */}
        {proposalBundle.site_risks && (
          <Card className="bg-white border border-blue-200 mb-4" data-section="site_risk_assessment">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => toggleSectionExpansion('site_risk_assessment')}
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
                      {proposalBundle.quote_meta.created_at ? 
                        new Date(proposalBundle.quote_meta.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'No date available'
                      }
                </div>
                      </div>
                    </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Assessment</div>
                    <div className="text-sm text-gray-600 font-medium">
                      Risk Factors
                  </div>
                  </div>
                  {expandedSections.has('site_risk_assessment') ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                              </div>
            </CardHeader>
            {expandedSections.has('site_risk_assessment') && (
              <CardContent className="pt-0">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="grid lg:grid-cols-4">
                  {Object.entries(proposalBundle.site_risks).filter(([key]) => key !== 'id' && key !== 'project_id' && key !== 'updated_at').map(([key, value], idx) => {
                    // Convert 0/1 values to Yes/No
                    let displayValue = value;
                    if (value === 0 || value === '0') {
                      displayValue = 'No';
                    } else if (value === 1 || value === '1') {
                      displayValue = 'Yes';
                    }
                    
                    return (
                    <div key={key} className="p-3 border-r border-b border-gray-200 last:border-r-0">
                      <div className="text-xs text-gray-500 mb-1">{formatFieldName(key)}</div>
                      <div className="text-sm font-medium">
                        {formatFieldValue(key, displayValue)}
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

        {/* Required Documents */}
        {proposalBundle.required_documents && Array.isArray(proposalBundle.required_documents) && proposalBundle.required_documents.length > 0 && (
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
                      {proposalBundle.quote_meta.created_at ? 
                        new Date(proposalBundle.quote_meta.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : 'No date available'
                      }
                </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Documents</div>
                    <div className="text-sm text-gray-600 font-medium">
                      {Array.isArray(proposalBundle.required_documents) ? proposalBundle.required_documents.length : 0} documents
                    </div>
                  </div>
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
                  <div className="space-y-4">
                {Array.isArray(proposalBundle.required_documents) && proposalBundle.required_documents.map((doc, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="grid lg:grid-cols-3">
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-sm font-medium">{formatFieldValue('label', doc.label)}</div>
                  </div>
                      <div className="p-3 border-r border-b border-gray-200">
                        <div className="text-sm font-medium">
                          {doc.url ? (
                            <Badge variant="default" className="text-xs">Uploaded</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          )}
                   </div>
                   </div>
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-sm font-medium">
                          {doc.url ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 flex items-center gap-1"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = doc.url;
                                link.download = doc.label || 'document';
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">No file available</span>
                          )}
                   </div>
                    </div>
                    </div>
                  </div>
                ))}
                </div>
              </CardContent>
            )}
            </Card>
        )}

        {/* Fallback message if no data sections are available */}
        {(!proposalBundle.quote_meta && 
          !proposalBundle.project && 
          !proposalBundle.insured?.details &&
          !proposalBundle.contract_structure &&
          !proposalBundle.site_risks &&
          !proposalBundle.cover_requirements &&
          (!proposalBundle.required_documents || !Array.isArray(proposalBundle.required_documents) || proposalBundle.required_documents.length === 0) &&
          (!proposalBundle.plans || proposalBundle.plans.length === 0)) && (
          <Card className="bg-white border-0 mb-8">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-gray-500 mb-2">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Quote In Progress</h3>
                <p className="text-gray-600">
                  This quote is still being prepared. Information will appear here as it becomes available.
                </p>
              </div>
              </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
};

export default QuoteDetails;
