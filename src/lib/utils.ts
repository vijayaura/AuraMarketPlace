import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return value.toString();
  return num.toLocaleString();
}

export function formatCurrency(value: number | string, currency: string = 'AED'): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return value.toString();
  
  // Format in millions if value is >= 1,000,000
  if (num >= 1000000) {
    const millions = (num / 1000000).toFixed(2);
    return `${currency} ${millions}M`;
  }
  
  const formattedNumber = formatNumber(value);
  return `${currency} ${formattedNumber}`;
}
