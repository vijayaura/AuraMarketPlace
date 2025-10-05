import jsPDF from 'jspdf';
import { ProposalBundleResponse } from '@/lib/api/quotes';
import { QuoteFormatResponse } from '@/lib/api/insurers';

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
  // Keep a reference to the original API bundle for rich field mapping
  raw?: any;
}


// Wrapper function for backward compatibility with ProposalBundleResponse
export const generateQuotePDF = async (proposalBundle: ProposalBundleResponse, quoteFormat?: QuoteFormatResponse): Promise<void> => {
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
    },
    raw: proposalBundle
  };
  
  generateInsuranceProposalPDF(proposalData, quoteFormat);
};

export const generateInsuranceProposalPDF = (proposalData: ProposalData, quoteFormat?: QuoteFormatResponse): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  // Add header with quote format data
  const addHeader = () => {
    if (!quoteFormat) return;

    const headerHeight = 35; // increased to avoid clipping
    const headerBgColor = hexToRgb(quoteFormat.header_bg_color || '#004080');
    const headerTextColor = hexToRgb(quoteFormat.header_text_color || '#FFFFFF');

    // Header background
    doc.setFillColor(...headerBgColor);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Company logo (if available and positioned correctly)
    if (quoteFormat.url && quoteFormat.logo_position === 'RIGHT') {
      // Note: jsPDF doesn't directly support loading images from URLs
      // For now, we'll add a placeholder for the logo
      doc.setTextColor(...headerTextColor);
      doc.setFontSize(8);
      doc.text('[LOGO]', pageWidth - 25, 15);
    }

    // Company name and info
    doc.setTextColor(...headerTextColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(quoteFormat.company_name || 'Insurance Company', 15, 10);

    // Company address
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    const addressLines = doc.splitTextToSize(quoteFormat.company_address || '', 80);
    doc.text(addressLines, 15, 16);

    // Contact info
    if (quoteFormat.contact_info) {
      const contactInfo = [
        `Email: ${quoteFormat.contact_info.email || ''}`,
        `Phone: ${quoteFormat.contact_info.phone || ''}`,
        `Website: ${quoteFormat.contact_info.website || ''}`
      ].filter(info => info.length > 6); // Filter out empty entries

      doc.text(contactInfo, 15, 22);
    }

    // push content start further down to prevent clipping
    yPosition = headerHeight + 12;
  };

  // Add footer with quote format data
  const addFooter = (pageNumber: number, totalPages: number) => {
    if (!quoteFormat || !quoteFormat.show_footer) return;

    const footerHeight = 20;
    const footerY = pageHeight - footerHeight;
    const footerBgColor = hexToRgb(quoteFormat.footer_bg_color || '#F2F2F2');
    const footerTextColor = hexToRgb(quoteFormat.footer_text_color || '#333333');

    // Footer background
    doc.setFillColor(...footerBgColor);
    doc.rect(0, footerY, pageWidth, footerHeight, 'F');

    // Footer content
    doc.setTextColor(...footerTextColor);
    doc.setFontSize(7);

    let footerContent = [];

    // General disclaimer
    if (quoteFormat.show_general_disclaimer && quoteFormat.general_disclaimer_text) {
      footerContent.push(quoteFormat.general_disclaimer_text);
    }

    // Regulatory info
    if (quoteFormat.show_regulatory_info && quoteFormat.regulatory_info_text) {
      footerContent.push(quoteFormat.regulatory_info_text);
    }

    // Add footer content
    if (footerContent.length > 0) {
      doc.text(footerContent, 15, footerY + 5);
    }

    // Page number
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 25, footerY + 5);
  };

  // Add header to first page
  addHeader();

  // Helper function to check if we need a new page and add one if necessary
  const checkPageBreak = (requiredHeight: number = 20) => {
    if (yPosition + requiredHeight > pageHeight - margin - (quoteFormat?.show_footer ? 25 : 0)) {
      doc.addPage();
      // draw header on new page
      addHeader();
      // ensure content starts below header
      yPosition = margin + (quoteFormat ? 42 : 0);
    }
  };

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize: number = 10, fontStyle: string = 'normal', align: string = 'left') => {
    const lines = doc.splitTextToSize(text, maxWidth || contentWidth);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(fontSize);
    doc.setFont(undefined, fontStyle);
    doc.text(lines, x, y, { align: align as any });
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

  // Helper function to create a table with borders
  const createTable = (data: Array<{label: string, value: string}>, startY: number, title?: string) => {
    let currentY = startY;
    
    if (title) {
      // Table title
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, currentY, contentWidth, 10, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, currentY, contentWidth, 10);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
      doc.text(title, margin + 3, currentY + 7);
      currentY += 10;
    }
    
    // Table rows
    data.forEach((item, index) => {
      const baseRowHeight = 8;
      
      // Split long text into multiple lines
      const labelLines = doc.splitTextToSize(item.label, contentWidth * 0.3);
      const valueLines = doc.splitTextToSize(item.value, contentWidth * 0.65);
      
      // Calculate the height needed for this row
      const maxLines = Math.max(labelLines.length, valueLines.length);
      const actualRowHeight = Math.max(baseRowHeight, maxLines * 3.5 + 3);
      
      // Check for page break before drawing the row
      const footerSpace = quoteFormat?.show_footer ? 25 : 10;
      if (currentY + actualRowHeight > pageHeight - margin - footerSpace) {
        // Add new page
        doc.addPage();
        // draw header on new page
        addHeader();
        // ensure table resumes below header
        currentY = margin + (quoteFormat ? 42 : 0);
      }
      
      // Row background
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, currentY, contentWidth, actualRowHeight, 'F');
      }
      
      // Row borders
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, currentY, contentWidth, actualRowHeight);
      doc.line(margin + contentWidth * 0.3, currentY, margin + contentWidth * 0.3, currentY + actualRowHeight);
      
      // Text
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      // Draw label text
      doc.text(labelLines, margin + 2, currentY + 5);
      
      // Draw value text
      doc.text(valueLines, margin + contentWidth * 0.3 + 2, currentY + 5);
      
      currentY += actualRowHeight;
    });
    
    return currentY;
  };

  // Main Title - Updated Table Structure (centered)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  const title = 'CONTRACTORS ALL RISKS INSURANCE QUOTATION';
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' as any });
  yPosition += 10;

  // Combined Single Table Structure
  const combinedTableData = [
    { label: 'QUOTATION REFERENCE', value: '................................dated.................................' },
    { 
      label: 'Proposer', 
      value: 'M/s ________________ as Principal &/or M/s. ________________ as Contractor &/o their sub-contractors for their respective rights and interests' 
    },
    { label: 'Scope of Work', value: '' },
    { label: 'Period of insurance', value: 'Not exceeding 12 Months' },
    { label: 'Maintenance Period', value: '12 Months from the date of handing over the project' },
    { 
      label: 'Site of erection', 
      value: 'Anywhere in UAE (excluding any work within 100 meter of water body/ Wet risk)' 
    },
    { 
      label: 'Interest covered', 
      value: 'Section I Material Damage\nAny unforeseen and sudden physical loss and/or damage to the insured items as mentioned below from any cause other than those specifically excluded as per Standard Munich Re Wordings\n\nSection II Third Party Liability\nThe Company will indemnify The Participant against such sums which The Participant shall become legally liable to pay as damage consequent upon\n• accidental bodily injury to or illness of third parties (whether fatal or not),\n• accidental loss of or damage to property belonging to third parties\nOccurring in direct connection with the construction or erection of the items Covered under Section 1 and happening on or in the immediate vicinity of the contract site during the period of cover' 
    },
    { 
      label: 'Sum Insured', 
      value: `(AED) Description\nContract Value\nPrincipal existing surrounding property\nContractors Plant & Machinery\nTotal\nSection I` 
    },
    { 
      label: '', 
      value: 'Section II\nLimit of liability AED --------/- any one accident or series of accidents arising out of one event and in the aggregate' 
    },
    { 
      label: 'Deductible', 
      value: 'Section I:\nAED 5,000/- each and every loss in respect of major perils / Act of God perils\nAED 3,500/- each and every loss in respect of loss or damage from any other cause\n\nSection II:\nAED 7,500/- each and every loss for Third Party Property damage\nUnderground Property / Vibration/Weakening of Support - AED 10,000/- each and every loss' 
    },
    { 
      label: 'Premium', 
      value: `AED ${proposalData.premiumSummary.totalAnnualPremium.toLocaleString()}/- including policy fees` 
    }
  ];

  // Add remaining sections to the combined table
  combinedTableData.push(
    { 
      label: 'Cover', 
      value: 'As per standard Contractors All Risks Takaful Cover - Munich Re wordings\n• Strike, Riot and Civil Commotion\n• Maintenance visit cover -12 Months\n• Cross Liability\n• Professional Fees Clause -10% of the claim amount subject to a maximum of AED 10,000/- in the aggregate\n• Debris Removal clause -10% of the claim amount subject to a maximum of AED 10,000/- in the aggregate\n• Fire Brigade and Extinguishing Charges -10% of the claim amount subject to a maximum of AED 10,000/- in the aggregate\n• Automatic Reinstatement of Sum Covered Clause subject to additional premium\n• 72 Hours Clause\n• Public Authorities Clause\n• Primary Insurance Cover Clause\n• 30 days' Notice of cancellation by either parties' 
    },
    { 
      label: 'Exclusions', 
      value: '(only indicative in nature and not exhaustive. Full list of exclusions available in the Policy document)\n• Seepage, Pollution and Contamination Exclusion Clause\n• Terrorism & Political risks Exclusion Clause\n• Nuclear Exclusion Clause\n• Cyber Clause / IT Clarification Agreement Exclusion Clause\n• Electronic Date Recognition Endorsement\n• Toxic Mould Exclusion Clause\n• Loss or damage due to Subsidence Exclusion Clause\n• Third party claims arising from Asbestos and /or derivatives thereof Excluded\n• Offshore / Marine / Wet works Excluded\n• Loss or damage to Crops, Forests and Culture Exclusion\n• UN Sanction Exclusion Clause' 
    },
    { 
      label: 'Subjectivity', 
      value: 'No Known or reported claims at the time of binding the cover' 
    },
    { 
      label: 'Validity', 
      value: '30 days from the Date of Issuance of the Quote' 
    },
    { 
      label: 'Warranties', 
      value: '• Warranty concerning construction material\n• Warranty that work areas to be cordoned off and no Visitors are allowed entry to such areas unless authorized\n• Warranted No Smoking instruction to all staff / workers' 
    }
  );

  yPosition = createTable(combinedTableData, yPosition);

  // Footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    if (quoteFormat?.show_footer) {
      addFooter(i, totalPages);
    } else {
      // Default footer if no quote format
  const footerY = pageHeight - 10;
  doc.setFontSize(6);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated on ' + new Date().toLocaleString(), margin, footerY);
      doc.text('Page ' + i + ' of ' + totalPages, pageWidth - margin - 15, footerY);
    }
  }

  // Save the PDF
  const fileName = `Contractors_All_Risks_Quote_${proposalData.project.project_id || 'CAR'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
