import jsPDF from 'jspdf';
import { ProposalBundleResponse } from '@/lib/api/quotes';

interface QuoteData {
  id: number;
  planName: string;
  insurerName: string;
  annualPremium: number;
  coverageAmount: number;
  deductible: string;
  rating: number;
  keyCoverage: string[];
  benefits: string[];
  validationResult?: any;
  pricingConfig?: any;
}

interface CEWData {
  selectedItems: any[];
  mandatoryAdjustments: { percentage: number; fixed: number };
  optionalAdjustments: { percentage: number; fixed: number };
  tplAdjustment: number;
}

interface ProposalData {
  project: any;
  quote: QuoteData;
  cewData?: CEWData;
  premiumSummary: {
    basePremium: number;
    tplAdjustment: number;
    mandatoryAdjustments: number;
    optionalAdjustments: number;
    totalBeforeCommission: number;
    brokerCommission: number;
    totalAnnualPremium: number;
  };
}


// Wrapper function for backward compatibility with ProposalBundleResponse
export const generatePolicyPDF = (proposalBundle: ProposalBundleResponse): void => {
  // Convert ProposalBundleResponse to ProposalData format
  const proposalData: ProposalData = {
    project: {
      project_id: proposalBundle.project.project_id,
      project_name: proposalBundle.project.project_name,
      client_name: proposalBundle.project.client_name,
      address: proposalBundle.project.address,
      region: proposalBundle.project.region,
      country: proposalBundle.project.country
    },
    insured: proposalBundle.insured,
    contract_structure: proposalBundle.contract_structure,
    cover_requirements: proposalBundle.cover_requirements,
    quote: {
      coverageAmount: parseFloat(proposalBundle.project.sum_insured),
      deductibleAmount: proposalBundle.plans[0]?.extensions?.selected_plan?.deductible || 0,
      tplDeductibleAmount: 0, // Not available in old format
      professionalIndemnityDeductibleAmount: 0, // Not available in old format
      basePremium: proposalBundle.plans[0]?.extensions?.selected_plan?.base_premium || 0,
      tplAdjustmentAmount: 0, // Not available in old format
      cewAdjustmentAmount: 0, // Not available in old format
      subtotal: proposalBundle.plans[0]?.premium_amount || 0,
      brokerCommission: 0, // Not available in old format
      totalAnnualPremium: proposalBundle.plans[0]?.premium_amount || 0
    },
    cewData: {
      selectedItems: [], // Not available in old format
      tplAdjustment: 0 // Not available in old format
    },
    premiumSummary: {
      basePremium: proposalBundle.plans[0]?.extensions?.selected_plan?.base_premium || 0,
      tplAdjustment: 0,
      mandatoryAdjustments: 0,
      optionalAdjustments: 0,
      totalBeforeCommission: proposalBundle.plans[0]?.premium_amount || 0,
      brokerCommission: 0,
      totalAnnualPremium: proposalBundle.plans[0]?.premium_amount || 0
    }
  };
  
  generateInsuranceProposalPDF(proposalData);
};

export const generateInsuranceProposalPDF = (proposalData: ProposalData): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to check if we need a new page and add one if necessary
  const checkPageBreak = (requiredHeight: number = 20) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize: number = 10, fontStyle: string = 'normal') => {
    const lines = doc.splitTextToSize(text, maxWidth || contentWidth);
    doc.setTextColor(0, 0, 0); // Ensure text is always black
    doc.setFontSize(fontSize);
    doc.setFont(undefined, fontStyle);
    doc.text(lines, x, y);
    return y + (lines.length * (fontSize * 0.35));
  };

  // Helper function to add a line
  const addLine = (y: number, color: number[] = [0, 0, 0]) => {
    doc.setDrawColor(...color);
    doc.line(margin, y, pageWidth - margin, y);
    return y + 2;
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return `AED ${amount.toLocaleString()}`;
  };

  // Helper function to add a table row
  const addTableRow = (label: string, value: string, y: number, isBold: boolean = false) => {
    const labelWidth = contentWidth * 0.4;
    const valueWidth = contentWidth * 0.6;
    
    // Label
    doc.setTextColor(0, 0, 0); // Ensure text is always black
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(label, margin, y);
    
    // Value
    doc.setTextColor(0, 0, 0); // Ensure text is always black
    doc.setFont(undefined, isBold ? 'bold' : 'normal');
    const valueLines = doc.splitTextToSize(value, valueWidth);
    doc.text(valueLines, margin + labelWidth, y);
    
    return y + Math.max(5, valueLines.length * 3.5);
  };

  // Header Section - Company Logo and Info
  // Company Information (left side)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const companyInfo = [
    'Insurer One',
    '+971 555-5555',
    'www.insurerone.com'
  ];
  
  let companyY = margin;
  companyInfo.forEach(line => {
    companyY = addText(line, margin, companyY, 50, 9);
  });

  // Company Logo (right side)
  doc.setFillColor(255, 165, 0); // Orange color
  doc.rect(pageWidth - 60, margin, 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('INSURER', pageWidth - 40, margin + 8, { align: 'center' });
  doc.text('ONE', pageWidth - 40, margin + 12, { align: 'center' });

  yPosition = margin + 25;

  // Proposal Title
  doc.setTextColor(0, 0, 0); // Ensure text is black
  yPosition = addText('Insurance Proposal Prepared Exclusively For:', margin, yPosition, contentWidth, 12, 'bold');
  yPosition += 5;

  // Client Information with proper sentence case
  const clientInfo = [
    proposalData.project.client_name || 'Al Habtoor Construction LLC',
    proposalData.project.address || 'Sheikh Zayed Road, Business Bay, Dubai, UAE',
    `${(proposalData.project.region || 'Dubai').toLowerCase()}, ${(proposalData.project.country || 'United Arab Emirates').toUpperCase()}`
  ];
  
  clientInfo.forEach(line => {
    doc.setTextColor(0, 0, 0); // Ensure text is black
    yPosition = addText(line, margin, yPosition, contentWidth, 10);
  });

  // Prepared By Information
  const preparedByY = margin + 25;
  const preparedByInfo = [
    'Prepared By',
    'Insurance Broker',
    '(555) 123-4567',
    'broker@insurance.com',
    new Date().toLocaleDateString()
  ];
  
  let preparedY = preparedByY;
  preparedByInfo.forEach(line => {
    doc.setTextColor(0, 0, 0); // Ensure text is black
    preparedY = addText(line, pageWidth - 60, preparedY, 50, 9);
  });

  yPosition = Math.max(yPosition, preparedY) + 10;

  // Introduction Paragraph
  const introText = 'Thank you for the opportunity to assist you in assessing your insurance needs. I am pleased to present to you the following construction insurance proposal:';
  doc.setTextColor(0, 0, 0); // Ensure text is black
  yPosition = addText(introText, margin, yPosition, contentWidth, 8); // 10 * 0.8
  yPosition += 10;

  // Policy Details Section
  doc.setTextColor(0, 0, 0); // Ensure text is black
  yPosition = addText('Contractors All Risk Insurance Quote - ' + (proposalData.project.project_name || 'Project Name'), margin, yPosition, contentWidth, 9.6, 'bold'); // 12 * 0.8
  yPosition += 5;

  // Insured Details Section
  if (proposalData.insured?.details) {
    // Table title with grey background and outline
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition, contentWidth, 8);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Insured Details', margin + 2, yPosition + 5);
    yPosition += 8;
    
    // Create table for insured details
    const tableWidth = contentWidth;
    const col1Width = tableWidth * 0.4;
    const col2Width = tableWidth * 0.6;
    
    // Table rows (no header)
    const insuredData = [
      { label: 'Insured Name', value: proposalData.insured.details.insured_name || 'N/A' },
      { label: 'Role of Insured', value: proposalData.insured.details.role_of_insured || 'N/A' }
    ];
    
    insuredData.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPosition, tableWidth, 6, 'F');
      }
      
      // Row border
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPosition, tableWidth, 6);
      doc.line(margin + col1Width, yPosition, margin + col1Width, yPosition + 6);
      
      // Text (reduced font size by 20%)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(6.4); // 8 * 0.8
      doc.setFont(undefined, 'normal');
      doc.text(item.label, margin + 2, yPosition + 4);
      doc.text(item.value, margin + col1Width + 2, yPosition + 4);
      
      yPosition += 6;
    });
    
  }

  // Combined Project Structure & Contract Structure Table (4 columns)
  // Check for page break before this section
  checkPageBreak(50);
  
  // Table title with grey background and outline
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, contentWidth, 8, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPosition, contentWidth, 8);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('Project Structure & Subcontractors/Consultants', margin + 2, yPosition + 5);
  yPosition += 8;
  
  // Create 4-column table
  const tableWidth = contentWidth;
  const col1Width = tableWidth * 0.25; // Project Structure
  const col2Width = tableWidth * 0.25; // Project Values
  const col3Width = tableWidth * 0.25; // Contract Structure
  const col4Width = tableWidth * 0.25; // Contract Values
  
  // Project Structure Data
  const projectStructureData = [
    { label: 'Project Value', value: formatCurrency(proposalData.cover_requirements?.project_value || 0) },
    { label: 'Contract Works', value: formatCurrency(proposalData.cover_requirements?.contract_works || 0) },
    { label: 'Plant & Equipment', value: formatCurrency(proposalData.cover_requirements?.plant_and_equipment || 0) },
    { label: 'Temporary Works', value: formatCurrency(proposalData.cover_requirements?.temporary_works || 0) },
    { label: 'Other Materials', value: formatCurrency(proposalData.cover_requirements?.other_materials || 0) },
    { label: 'Principal\'s Property', value: formatCurrency(proposalData.cover_requirements?.principals_property || 0) },
    { label: 'Cross Liability Cover', value: proposalData.cover_requirements?.cross_liability_cover === 'yes' ? 'Yes' : 'No' },
    { label: 'Sum Insured', value: formatCurrency(proposalData.cover_requirements?.sum_insured || proposalData.quote.coverageAmount) }
  ];
  
  // Contract Structure Data - removed main contractor details
  const contractStructureData = [];
  
  // Subcontractors Data
  const subcontractorsData = proposalData.contract_structure?.sub_contractors || [];
  
  // Consultants Data
  const consultantsData = proposalData.contract_structure?.consultants || [];
  
  // Calculate maximum rows needed (including consultants)
  const maxRows = Math.max(projectStructureData.length, subcontractorsData.length, consultantsData.length);
  
  // Create table rows
  for (let i = 0; i < maxRows; i++) {
    // Check for page break before each row
    checkPageBreak(10);
    
    // Alternate row colors
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition, tableWidth, 6, 'F');
    }
    
    // Row border
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition, tableWidth, 6);
    doc.line(margin + col1Width, yPosition, margin + col1Width, yPosition + 6);
    doc.line(margin + col1Width + col2Width, yPosition, margin + col1Width + col2Width, yPosition + 6);
    doc.line(margin + col1Width + col2Width + col3Width, yPosition, margin + col1Width + col2Width + col3Width, yPosition + 6);
    
    // Text (reduced font size by 20%)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(6.4); // 8 * 0.8
    doc.setFont(undefined, 'normal');
    
    // Column 1: Project Structure Label
    const projectItem = projectStructureData[i];
    if (projectItem) {
      doc.text(projectItem.label, margin + 2, yPosition + 4);
    }
    
    // Column 2: Project Structure Value
    if (projectItem) {
      doc.text(projectItem.value, margin + col1Width + 2, yPosition + 4);
    }
    
    // Column 3: Subcontractor Name or Consultant Name
    if (i < subcontractorsData.length) {
      // Show subcontractor name
      doc.text(subcontractorsData[i].name, margin + col1Width + col2Width + 2, yPosition + 4);
    } else if (i < subcontractorsData.length + consultantsData.length) {
      // Show consultant name
      const consultantIndex = i - subcontractorsData.length;
      doc.text(consultantsData[consultantIndex].name, margin + col1Width + col2Width + 2, yPosition + 4);
    }
    
    // Column 4: Subcontractor Details or Consultant Details
    if (i < subcontractorsData.length) {
      // Show subcontractor details
      doc.text(`${subcontractorsData[i].contract_type} (${subcontractorsData[i].contract_number})`, margin + col1Width + col2Width + col3Width + 2, yPosition + 4);
    } else if (i < subcontractorsData.length + consultantsData.length) {
      // Show consultant details
      const consultantIndex = i - subcontractorsData.length;
      doc.text(`${consultantsData[consultantIndex].role} (${consultantsData[consultantIndex].license_number})`, margin + col1Width + col2Width + col3Width + 2, yPosition + 4);
    }
    
    yPosition += 6;
  }
  
  // Consultants are now integrated into the main table above

  // Selected Extensions Section
  if (proposalData.cewData && proposalData.cewData.selectedItems.length > 0) {
    checkPageBreak(30);
    
    // Filter to only show actually selected items (not just available ones)
    const actuallySelectedItems = proposalData.cewData.selectedItems.filter(item => 
      item.isSelected || item.selectedOptionId || (item.isMandatory && item.selectedOptionId)
    );
    
    if (actuallySelectedItems.length > 0) {
      // Table title with grey background and outline
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition, contentWidth, 8, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, yPosition, contentWidth, 8);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text('Selected Extensions & Conditions', margin + 2, yPosition + 5);
      yPosition += 8;

      // Create table for selected extensions
      const extensionTableWidth = contentWidth;
      const extensionCol1Width = extensionTableWidth * 0.4;
      const extensionCol2Width = extensionTableWidth * 0.6;

      actuallySelectedItems.forEach((item, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPosition, extensionTableWidth, 6, 'F');
        }
        
        // Row border
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPosition, extensionTableWidth, 6);
        doc.line(margin + extensionCol1Width, yPosition, margin + extensionCol1Width, yPosition + 6);
        
        // Text (reduced font size by 20%)
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(6.4); // 8 * 0.8
        doc.setFont(undefined, 'normal');
        
        const impactText = item.isMandatory ? 'Mandatory' : 'Optional';
        
        // Show specific option selected and its impact
        let adjustmentText = item.code || 'N/A'; // Show the code instead of Base Rate
        if (item.selectedOptionId && item.options) {
          const selectedOption = item.options.find(opt => opt.id === item.selectedOptionId);
          if (selectedOption) {
            adjustmentText = selectedOption.code || selectedOption.label || item.code || 'N/A';
            // Add impact information if available
            if (selectedOption.impact) {
              if (selectedOption.impact.percentage) {
                adjustmentText += ` (+${selectedOption.impact.percentage}%)`;
              }
              if (selectedOption.impact.fixed) {
                adjustmentText += ` (+${formatCurrency(selectedOption.impact.fixed)})`;
              }
            }
          }
        }
        
        doc.text(`${item.name} (${impactText})`, margin + 2, yPosition + 4);
        doc.text(adjustmentText, margin + extensionCol1Width + 2, yPosition + 4);
        
        yPosition += 6;
      });
      
      yPosition += 5;
    }
  }

  // TPL Limit Extensions
  if (proposalData.cewData && proposalData.cewData.tplAdjustment !== 0) {
    checkPageBreak(20);
    yPosition = addText('TPL Limit Extensions', margin, yPosition, contentWidth, 11, 'bold');
    yPosition += 3;
    
    const tplText = proposalData.cewData.tplAdjustment > 0 ? 
      `Enhanced TPL Coverage (+${proposalData.cewData.tplAdjustment}%)` : 
      `Standard TPL Coverage (${proposalData.cewData.tplAdjustment}%)`;
    
    yPosition = addTableRow('Third Party Liability', tplText, yPosition);
  }

  // Premium Summary Section
  checkPageBreak(40);
  // Table title with grey background and outline
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, contentWidth, 8, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPosition, contentWidth, 8);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9.6); // 12 * 0.8
  doc.setFont(undefined, 'bold');
  doc.text('Premium Summary', margin + 2, yPosition + 5);
  yPosition += 8;

  const premiumData = [
    { label: 'Nett Premium', value: formatCurrency(proposalData.premiumSummary.basePremium) }
  ];

  // Only add TPL adjustment if it has a value
  if (proposalData.premiumSummary.tplAdjustment !== 0) {
    premiumData.push({ label: 'TPL Adjustment', value: formatCurrency(proposalData.premiumSummary.tplAdjustment) });
  }

  // Only add mandatory CEW adjustments if they have values
  if (proposalData.premiumSummary.mandatoryAdjustments !== 0) {
    premiumData.push({ label: 'Mandatory CEW Adjustments', value: formatCurrency(proposalData.premiumSummary.mandatoryAdjustments) });
  }

  // Only add optional CEW adjustments if they have values
  if (proposalData.premiumSummary.optionalAdjustments !== 0) {
    premiumData.push({ label: 'Optional CEW Adjustments', value: formatCurrency(proposalData.premiumSummary.optionalAdjustments) });
  }

  premiumData.push(
    { label: 'Subtotal', value: formatCurrency(proposalData.premiumSummary.totalBeforeCommission) },
    { label: 'Broker Commission', value: formatCurrency(proposalData.premiumSummary.brokerCommission) }
  );

  // Create table for premium summary
  const premiumTableWidth = contentWidth;
  const premiumCol1Width = premiumTableWidth * 0.5;
  const premiumCol2Width = premiumTableWidth * 0.5;
  
  // Table rows (no header)
  premiumData.forEach((item, index) => {
    // Check for page break before each row
    checkPageBreak(10);
    
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition, premiumTableWidth, 6, 'F');
    }
    
    // Row border
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition, premiumTableWidth, 6);
    doc.line(margin + premiumCol1Width, yPosition, margin + premiumCol1Width, yPosition + 6);
    
    // Text (reduced font size by 20%)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(6.4); // 8 * 0.8
    doc.setFont(undefined, 'normal');
    doc.text(item.label, margin + 2, yPosition + 4);
    doc.text(item.value, margin + premiumCol1Width + 2, yPosition + 4);
    
    yPosition += 6;
  });

  // Total Line with bold text
  yPosition += 2;
  // Total row with bold text
  doc.setFillColor(250, 250, 250);
  doc.rect(margin, yPosition, tableWidth, 8, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, yPosition, tableWidth, 8);
  doc.line(margin + col1Width, yPosition, margin + col1Width, yPosition + 8);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(6.4);
  doc.setFont(undefined, 'bold');
  doc.text('Total Annual Premium', margin + 2, yPosition + 5);
  doc.text(formatCurrency(proposalData.premiumSummary.totalAnnualPremium), margin + col1Width + 2, yPosition + 5);
  yPosition += 8;

  // Add proper spacing before disclosure
  yPosition += 10;

  // Additional Comments
  // yPosition = addText('Underwritten through AM BEST rated company.', margin, yPosition, contentWidth, 9);
  // yPosition += 10;

  // Disclosure Statement
  const disclosureText = 'Disclosure: The premium estimates and coverage limits outlined in the proposal above are based upon the accuracy of the information you provided and may not represent all coverages available. This proposal does not constitute a contract or binder of insurance and premium amounts cannot be guaranteed until coverage is purchased. For additional information regarding the assumptions used to prepare this proposal or to purchase insurance coverage, please contact your agent at the phone number listed above.';
  
  yPosition = addText(disclosureText, margin, yPosition, contentWidth * 0.95, 7); // Use 95% of content width and reduced font size
  yPosition += 5;

  // Footer
  const footerY = pageHeight - 10;
  doc.setFontSize(6);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated on ' + new Date().toLocaleString(), margin, footerY);
  doc.text('Page ' + doc.getCurrentPageInfo().pageNumber, pageWidth - margin - 15, footerY);

  // Save the PDF
  const fileName = `Insurance_Proposal_${proposalData.project.project_id || 'CAR'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
