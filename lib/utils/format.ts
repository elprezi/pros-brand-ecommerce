import { siteConfig } from '../config/site';

/**
 * Formats numeric price into FCFA currency (e.g. 25000 -> "25 000 FCFA")
 */
export function formatPrice(amount: number): string {
  const formatted = new Intl.NumberFormat('fr-FR').format(amount);
  return `${formatted} ${siteConfig.currencyDisplay}`;
}
