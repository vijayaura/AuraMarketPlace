import { getQuoteStatusLabel, getQuoteStatusDotColor, type QuoteStatus } from "@/lib/quote-status";

interface QuoteStatusDotProps {
  status: QuoteStatus | string;
  className?: string;
}

export const QuoteStatusDot = ({ status, className = "" }: QuoteStatusDotProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getQuoteStatusDotColor(status)}`} />
      <span className="text-sm font-medium text-foreground">
        {getQuoteStatusLabel(status)}
      </span>
    </div>
  );
};