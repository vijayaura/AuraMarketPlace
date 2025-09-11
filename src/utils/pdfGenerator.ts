import jsPDF from 'jspdf';
import { ProposalBundleResponse } from '@/lib/api/quotes';

export const generatePolicyPDF = (proposalBundle: ProposalBundleResponse): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize: number = 10) => {
    const lines = doc.splitTextToSize(text, maxWidth || contentWidth);
    doc.setFontSize(fontSize);
    doc.text(lines, x, y);
    return y + (lines.length * (fontSize * 0.4));
  };

  // Helper function to add a section header
  const addSectionHeader = (title: string, y: number) => {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    const newY = addText(title, margin, y, contentWidth, 14);
    doc.setFont(undefined, 'normal');
    return newY + 5;
  };

  // Helper function to add a table
  const addTable = (data: Array<{label: string, value: string}>, startY: number) => {
    let currentY = startY;
    const col1Width = contentWidth * 0.4;
    const col2Width = contentWidth * 0.6;
    
    data.forEach((row, index) => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }
      
      // Add row background for better readability
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, currentY - 2, contentWidth, 8, 'F');
      }
      
      // Label
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(row.label, margin + 2, currentY + 5);
      
      // Value
      doc.setFont(undefined, 'normal');
      const valueLines = doc.splitTextToSize(row.value, col2Width);
      doc.text(valueLines, margin + col1Width, currentY + 5);
      
      currentY += Math.max(8, valueLines.length * 4) + 2;
    });
    
    return currentY + 5;
  };

  // Header
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('INSURANCE POLICY', pageWidth / 2, 20, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPosition = 40;

  // Policy Details Section
  yPosition = addSectionHeader('POLICY DETAILS', yPosition);
  const policyData = [
    { label: 'Quote ID', value: proposalBundle.quote_meta.quote_id.toString() },
    { label: 'Project ID', value: proposalBundle.project.project_id },
    { label: 'Status', value: proposalBundle.quote_meta.status || 'Active' },
    { label: 'Insurer', value: proposalBundle.plans[0]?.insurer_name || 'N/A' },
    { label: 'Premium Amount', value: `AED ${proposalBundle.plans[0]?.premium_amount?.toLocaleString() || 'N/A'}` },
    { label: 'Sum Insured', value: `AED ${parseFloat(proposalBundle.project.sum_insured).toLocaleString()}` },
    { label: 'Start Date', value: new Date(proposalBundle.project.start_date).toLocaleDateString() },
    { label: 'Completion Date', value: new Date(proposalBundle.project.completion_date).toLocaleDateString() },
    { label: 'Validity Date', value: new Date(proposalBundle.quote_meta.validity_date).toLocaleDateString() }
  ];
  yPosition = addTable(policyData, yPosition);

  // Project Details Section
  yPosition = addSectionHeader('PROJECT DETAILS', yPosition);
  const projectData = [
    { label: 'Client Name', value: proposalBundle.project.client_name },
    { label: 'Project Name', value: proposalBundle.project.project_name },
    { label: 'Project Type', value: proposalBundle.project.project_type.toUpperCase() },
    { label: 'Sub Project Type', value: proposalBundle.project.sub_project_type },
    { label: 'Construction Type', value: proposalBundle.project.construction_type.toUpperCase() },
    { label: 'Address', value: proposalBundle.project.address },
    { label: 'Country', value: proposalBundle.project.country },
    { label: 'Region', value: proposalBundle.project.region.toUpperCase() },
    { label: 'Zone', value: proposalBundle.project.zone.toUpperCase() },
    { label: 'Construction Period', value: `${proposalBundle.project.construction_period_months} months` },
    { label: 'Maintenance Period', value: `${proposalBundle.project.maintenance_period_months} months` }
  ];
  yPosition = addTable(projectData, yPosition);

  // Insured Details Section
  yPosition = addSectionHeader('INSURED DETAILS', yPosition);
  const insuredData = [
    { label: 'Insured Name', value: proposalBundle.insured.details.insured_name },
    { label: 'Role of Insured', value: proposalBundle.insured.details.role_of_insured.toUpperCase() },
    { label: 'Had Losses Last 5 Years', value: proposalBundle.insured.details.had_losses_last_5yrs ? 'Yes' : 'No' }
  ];
  
  // Add claims information if available
  if (proposalBundle.insured.claims.length > 0) {
    insuredData.push({ label: 'Claims History', value: 'See details below:' });
    proposalBundle.insured.claims.forEach((claim, index) => {
      insuredData.push({ 
        label: `Claim ${index + 1}`, 
        value: `${claim.claim_year}: ${claim.count_of_claims} claim(s), Amount: AED ${parseFloat(claim.amount_of_claims).toLocaleString()}, Description: ${claim.description}` 
      });
    });
  }
  
  yPosition = addTable(insuredData, yPosition);

  // Contract Structure Section
  yPosition = addSectionHeader('CONTRACT STRUCTURE', yPosition);
  const contractData = [
    { label: 'Main Contractor', value: proposalBundle.contract_structure.details.main_contractor },
    { label: 'Principal Owner', value: proposalBundle.contract_structure.details.principal_owner },
    { label: 'Contract Type', value: proposalBundle.contract_structure.details.contract_type.toUpperCase() },
    { label: 'Contract Number', value: proposalBundle.contract_structure.details.contract_number },
    { label: 'Experience Years', value: proposalBundle.contract_structure.details.experience_years.toString() }
  ];
  
  // Add subcontractors
  if (proposalBundle.contract_structure.sub_contractors.length > 0) {
    contractData.push({ label: 'Sub Contractors', value: 'See details below:' });
    proposalBundle.contract_structure.sub_contractors.forEach((sub, index) => {
      contractData.push({ 
        label: `Sub Contractor ${index + 1}`, 
        value: `${sub.name} (${sub.contract_type}) - ${sub.contract_number}` 
      });
    });
  }
  
  // Add consultants
  if (proposalBundle.contract_structure.consultants.length > 0) {
    contractData.push({ label: 'Consultants', value: 'See details below:' });
    proposalBundle.contract_structure.consultants.forEach((consultant, index) => {
      contractData.push({ 
        label: `Consultant ${index + 1}`, 
        value: `${consultant.name} - ${consultant.role} (License: ${consultant.license_number})` 
      });
    });
  }
  
  yPosition = addTable(contractData, yPosition);

  // Site Risks Section
  yPosition = addSectionHeader('SITE RISKS', yPosition);
  const siteRiskData = [
    { label: 'Near Water Body', value: proposalBundle.site_risks.near_water_body ? 'Yes' : 'No' },
    { label: 'Flood Prone Zone', value: proposalBundle.site_risks.flood_prone_zone ? 'Yes' : 'No' },
    { label: 'Within City Center', value: proposalBundle.site_risks.within_city_center.toUpperCase() },
    { label: 'Soil Type', value: proposalBundle.site_risks.soil_type.toUpperCase() },
    { label: 'Existing Structure', value: proposalBundle.site_risks.existing_structure ? 'Yes' : 'No' },
    { label: 'Blasting or Deep Excavation', value: proposalBundle.site_risks.blasting_or_deep_excavation ? 'Yes' : 'No' },
    { label: 'Site Security Arrangements', value: proposalBundle.site_risks.site_security_arrangements.toUpperCase() },
    { label: 'Area Type', value: proposalBundle.site_risks.area_type },
    { label: 'Existing Structure Description', value: proposalBundle.site_risks.describe_existing_structure }
  ];
  yPosition = addTable(siteRiskData, yPosition);

  // Cover Requirements Section
  yPosition = addSectionHeader('COVER REQUIREMENTS', yPosition);
  const coverData = [
    { label: 'Project Value', value: `AED ${parseFloat(proposalBundle.cover_requirements.project_value).toLocaleString()}` },
    { label: 'Contract Works', value: `AED ${parseFloat(proposalBundle.cover_requirements.contract_works).toLocaleString()}` },
    { label: 'Plant and Equipment', value: `AED ${parseFloat(proposalBundle.cover_requirements.plant_and_equipment).toLocaleString()}` },
    { label: 'Temporary Works', value: `AED ${parseFloat(proposalBundle.cover_requirements.temporary_works).toLocaleString()}` },
    { label: 'Other Materials', value: `AED ${parseFloat(proposalBundle.cover_requirements.other_materials).toLocaleString()}` },
    { label: 'Principal\'s Property', value: `AED ${parseFloat(proposalBundle.cover_requirements.principals_property).toLocaleString()}` },
    { label: 'Cross Liability Cover', value: proposalBundle.cover_requirements.cross_liability_cover.toUpperCase() },
    { label: 'Computed Sum Insured', value: `AED ${proposalBundle.cover_requirements.computed_sum_insured.toLocaleString()}` }
  ];
  yPosition = addTable(coverData, yPosition);

  // Plan Details Section
  if (proposalBundle.plans.length > 0) {
    yPosition = addSectionHeader('SELECTED PLAN DETAILS', yPosition);
    const plan = proposalBundle.plans[0];
    const planData = [
      { label: 'Insurer Name', value: plan.insurer_name },
      { label: 'Premium Amount', value: `AED ${plan.premium_amount.toLocaleString()}` },
      { label: 'Base Premium', value: `AED ${plan.extensions.selected_plan.base_premium.toLocaleString()}` },
      { label: 'Coverage Amount', value: `AED ${plan.extensions.selected_plan.coverage_amount.toLocaleString()}` },
      { label: 'Deductible', value: `AED ${plan.extensions.selected_plan.deductible.toLocaleString()}` },
      { label: 'Minimum Premium Value', value: `AED ${plan.minimum_premium_value.toLocaleString()}` },
      { label: 'Minimum Premium Applied', value: plan.is_minimum_premium_applied ? 'Yes' : 'No' }
    ];
    
    // Add TPL Limit
    if (plan.extensions.tpl_limit) {
      planData.push({ 
        label: 'TPL Limit', 
        value: `${plan.extensions.tpl_limit.label} - ${plan.extensions.tpl_limit.description}` 
      });
    }
    
    // Add selected extensions
    if (Object.keys(plan.extensions.selected_extensions).length > 0) {
      planData.push({ label: 'Selected Extensions', value: 'See details below:' });
      Object.entries(plan.extensions.selected_extensions).forEach(([key, extension]) => {
        planData.push({ 
          label: extension.code, 
          value: `${extension.label} (${extension.impact_pct}% impact) - ${extension.description}` 
        });
      });
    }
    
    yPosition = addTable(planData, yPosition);
  }

  // Required Documents Section
  if (Object.keys(proposalBundle.required_documents).length > 0) {
    yPosition = addSectionHeader('REQUIRED DOCUMENTS', yPosition);
    const documentData = Object.entries(proposalBundle.required_documents).map(([key, doc]) => ({
      label: doc.label,
      value: 'Uploaded ✓'
    }));
    yPosition = addTable(documentData, yPosition);
  }

  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated on ' + new Date().toLocaleString(), margin, footerY);
  doc.text('Page ' + doc.getCurrentPageInfo().pageNumber, pageWidth - margin - 20, footerY);

  // Save the PDF
  const fileName = `Policy_${proposalBundle.project.project_id}_${proposalBundle.quote_meta.quote_id}.pdf`;
  doc.save(fileName);
};
