import { siteConfig } from '../config/site';

/**
 * Formats numeric price into FCFA currency (e.g. 25000 -> "25 000 FCFA")
 */
export function formatPrice(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR').format(amount);
  return `${formatted} ${siteConfig.currencyDisplay}`;
}

/**
 * Normalizes Senegalese phone numbers to standard E.164 format (+221XXXXXXXXX)
 * Supports prefixes 77, 78, 76, 70, 75
 */
export function normalizeSenegalPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.startsWith('221') && digits.length === 11) {
    return `+${digits}`;
  }

  if (digits.length === 9) {
    return `+221${digits}`;
  }

  return rawPhone.trim();
}

/**
 * Flexible validation for Senegalese phone numbers
 */
export function isValidSenegalPhone(rawPhone: string): boolean {
  const digits = rawPhone.replace(/\D/g, '');
  const localDigits = digits.startsWith('221') ? digits.slice(3) : digits;

  if (localDigits.length !== 9) return false;
  const validPrefixes = ['77', '78', '76', '70', '75'];
  return validPrefixes.some((prefix) => localDigits.startsWith(prefix));
}
