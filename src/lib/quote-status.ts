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
    return "Quote_status";
  }
  
  switch (status) {
    case QUOTE_STATUSES.QUOTE_GENERATED:
      return "Quote Generated";
    case QUOTE_STATUSES.QUOTE_CONFIRMED:
      return "Quote Confirmed";
    case QUOTE_STATUSES.SELECTED_PRODUCT:
      return "Selected Product";
    case QUOTE_STATUSES.QUOTE_EDITED:
      return "Quote Edited";
    case QUOTE_STATUSES.POLICY_GENERATED:
      return "Policy Generated";
    case QUOTE_STATUSES.PAYMENT_PENDING:
      return "Payment Pending";
    default:
      return typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : status;
  }
};

export const getQuoteStatusColor = (status: QuoteStatus | string): string => {
  // Handle null, undefined, or empty string
  if (!status || status === '') {
    return "text-muted-foreground";
  }
  
  switch (status) {
    case QUOTE_STATUSES.QUOTE_GENERATED:
      return "text-primary";
    case QUOTE_STATUSES.QUOTE_CONFIRMED:
      return "text-success";
    case QUOTE_STATUSES.SELECTED_PRODUCT:
      return "text-accent";
    case QUOTE_STATUSES.QUOTE_EDITED:
      return "text-warning";
    case QUOTE_STATUSES.POLICY_GENERATED:
      return "text-secondary";
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
  
  switch (status) {
    case QUOTE_STATUSES.QUOTE_GENERATED:
      return "bg-primary";
    case QUOTE_STATUSES.QUOTE_CONFIRMED:
      return "bg-success";
    case QUOTE_STATUSES.SELECTED_PRODUCT:
      return "bg-accent";
    case QUOTE_STATUSES.QUOTE_EDITED:
      return "bg-warning";
    case QUOTE_STATUSES.POLICY_GENERATED:
      return "bg-secondary";
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