import { Badge } from "@/components/ui/badge";

export const QUOTE_STATUSES = {
  QUOTE_GENERATED: "quote_generated",
  QUOTE_CONFIRMED: "quote_confirmed", 
  SELECTED_PRODUCT: "selected_product",
  QUOTE_EDITED: "quote_edited",
  POLICY_GENERATED: "policy_generated",
  PAYMENT_PENDING: "payment_pending"
} as const;

export type QuoteStatus = typeof QUOTE_STATUSES[keyof typeof QUOTE_STATUSES];

// Statuses that indicate a quote has been converted to a policy
export const POLICY_STATUSES = [
  QUOTE_STATUSES.POLICY_GENERATED,
  QUOTE_STATUSES.PAYMENT_PENDING
] as const;

// Helper function to check if a quote has been converted to a policy
export const isQuoteConvertedToPolicy = (status: QuoteStatus | string): boolean => {
  return POLICY_STATUSES.includes(status as any);
};

// Helper function to filter quotes (excludes converted policies)
export const filterActiveQuotes = (quotes: any[]) => {
  return quotes.filter(quote => !isQuoteConvertedToPolicy(quote.status));
};

export const getQuoteStatusLabel = (status: QuoteStatus | string): string => {
  // Handle null, undefined, or empty string
  if (!status || status === '') {
    return "Unknown";
  }
  
  // Use the same mapping as QuoteDetails page
  const statusMap: Record<string, string> = {
    'project_details': 'Project Details',
    'insured_details': 'Insured Details',
    'contract_structure': 'Contract Structure',
    'site_risk': 'Site Risk Assessment',
    'cover_requirements': 'Cover Requirements',
    'required_documents': 'Underwriting Documents',
    'plan_selected': 'Plan Selected',
    'declaration_documents': 'Declaration Documents',
    'policy_created': 'Policy Created',
    'draft': 'Draft',
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'expired': 'Expired',
    // Legacy status mappings for backward compatibility
    'quote_generated': 'Quote Generated',
    'quote_confirmed': 'Quote Confirmed',
    'selected_product': 'Selected Product',
    'quote_edited': 'Quote Edited',
    'policy_generated': 'Policy Generated',
    'payment_pending': 'Payment Pending'
  };
  
  return statusMap[status?.toLowerCase()] || (typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : status);
};

export const getQuoteStatusColor = (status: QuoteStatus | string): string => {
  // Handle null, undefined, or empty string
  if (!status || status === '') {
    return "text-muted-foreground";
  }
  
  const statusLower = status?.toLowerCase();
  
  // Map statuses to colors
  switch (statusLower) {
    case 'project_details':
    case 'insured_details':
    case 'contract_structure':
    case 'site_risk':
      return "text-orange-600"; // In progress statuses
    case 'cover_requirements':
    case 'required_documents':
    case 'plan_selected':
      return "text-blue-600"; // Review statuses
    case 'declaration_documents':
    case 'policy_created':
    case 'approved':
      return "text-green-600"; // Completed statuses
    case 'draft':
      return "text-gray-600"; // Draft status
    case 'submitted':
    case 'under_review':
      return "text-yellow-600"; // Under review statuses
    case 'rejected':
    case 'expired':
      return "text-red-600"; // Negative statuses
    // Legacy status mappings
    case 'quote_generated':
    case QUOTE_STATUSES.QUOTE_GENERATED:
      return "text-primary";
    case 'quote_confirmed':
    case QUOTE_STATUSES.QUOTE_CONFIRMED:
      return "text-success";
    case 'selected_product':
    case QUOTE_STATUSES.SELECTED_PRODUCT:
      return "text-accent";
    case 'quote_edited':
    case QUOTE_STATUSES.QUOTE_EDITED:
      return "text-warning";
    case 'policy_generated':
    case QUOTE_STATUSES.POLICY_GENERATED:
      return "text-secondary";
    case 'payment_pending':
    case QUOTE_STATUSES.PAYMENT_PENDING:
      return "text-warning";
    default:
      return "text-muted-foreground";
  }
};

export const getQuoteStatusDotColor = (status: QuoteStatus | string): string => {
  // Handle null, undefined, or empty string
  if (!status || status === '') {
    return "bg-muted-foreground";
  }
  
  const statusLower = status?.toLowerCase();
  
  // Map statuses to dot colors
  switch (statusLower) {
    case 'project_details':
    case 'insured_details':
    case 'contract_structure':
    case 'site_risk':
      return "bg-orange-500"; // In progress statuses
    case 'cover_requirements':
    case 'required_documents':
    case 'plan_selected':
      return "bg-blue-500"; // Review statuses
    case 'declaration_documents':
    case 'policy_created':
    case 'approved':
      return "bg-green-500"; // Completed statuses
    case 'draft':
      return "bg-gray-500"; // Draft status
    case 'submitted':
    case 'under_review':
      return "bg-yellow-500"; // Under review statuses
    case 'rejected':
    case 'expired':
      return "bg-red-500"; // Negative statuses
    // Legacy status mappings
    case 'quote_generated':
    case QUOTE_STATUSES.QUOTE_GENERATED:
      return "bg-primary";
    case 'quote_confirmed':
    case QUOTE_STATUSES.QUOTE_CONFIRMED:
      return "bg-success";
    case 'selected_product':
    case QUOTE_STATUSES.SELECTED_PRODUCT:
      return "bg-accent";
    case 'quote_edited':
    case QUOTE_STATUSES.QUOTE_EDITED:
      return "bg-warning";
    case 'policy_generated':
    case QUOTE_STATUSES.POLICY_GENERATED:
      return "bg-secondary";
    case 'payment_pending':
    case QUOTE_STATUSES.PAYMENT_PENDING:
      return "bg-warning";
    default:
      return "bg-muted-foreground";
  }
};

export const getQuoteStatusBadge = (status: QuoteStatus | string) => {
  return {
    component: Badge,
    className: getQuoteStatusColor(status),
    label: getQuoteStatusLabel(status)
  };
};