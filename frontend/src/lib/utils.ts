import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts English digits to Bengali digits.
 */
export function toBanglaDigits(numberOrString: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return numberOrString
    .toString()
    .replace(/[0-9]/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

/**
 * Format currency in Bangladeshi Taka (৳).
 * Amount is stored as integer Taka.
 */
export function formatBDT(
  amount: number,
  options?: { locale?: 'bn' | 'en'; showSymbol?: boolean }
): string {
  const locale = options?.locale || 'bn';
  const showSymbol = options?.showSymbol !== false;
  const formattedNumber = new Intl.NumberFormat('en-IN').format(amount);

  if (locale === 'bn') {
    const banglaFormatted = toBanglaDigits(formattedNumber);
    return showSymbol ? `৳${banglaFormatted}` : banglaFormatted;
  }

  return showSymbol ? `৳${formattedNumber}` : formattedNumber;
}

/**
 * Validate and normalize Bangladeshi mobile phone number.
 * Accepts formats: 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX
 */
export function normalizeBDPhone(phone: string): string | null {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^\+?8801[3-9]\d{8}$/.test(cleaned)) {
    return cleaned.replace(/^\+?88/, '');
  }
  return null;
}
