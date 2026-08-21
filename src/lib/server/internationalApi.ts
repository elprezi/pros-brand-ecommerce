/**
 * PROS International E-Commerce Engine
 * Authoritative Service for Countries, Multi-Currency, Exchange Rates, Taxes, & International Shipping Zones
 */

import type { CountryConfig, Currency, CurrencyCode, ShippingZoneRule } from '../../types/international';

// 1. SUPPORTED CURRENCIES REGISTRY (SECTION 4)
export const ALL_CURRENCIES: Currency[] = [
  { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA (BCEAO)', decimals: 0, exchangeRateToBase: 1.0, isActive: true },
  { code: 'EUR', symbol: '€', name: 'Euro (€)', decimals: 2, exchangeRateToBase: 655.957, isActive: true },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)', decimals: 2, exchangeRateToBase: 600.0, isActive: true },
  { code: 'GBP', symbol: '£', name: 'Livre Sterling (£)', decimals: 2, exchangeRateToBase: 760.0, isActive: true },
  { code: 'CAD', symbol: 'C$', name: 'Dollar Canadien (C$)', decimals: 2, exchangeRateToBase: 440.0, isActive: true },
  { code: 'NGN', symbol: '₦', name: 'Naira Nigérian (₦)', decimals: 2, exchangeRateToBase: 0.40, isActive: true },
  { code: 'GHS', symbol: '₵', name: 'Cedi Ghanéen (₵)', decimals: 2, exchangeRateToBase: 40.0, isActive: true },
  { code: 'MAD', symbol: 'DH', name: 'Dirham Marocain (DH)', decimals: 2, exchangeRateToBase: 60.0, isActive: true },
];

// 2. INTERNATIONAL COUNTRIES & MARKETS REGISTRY (SECTION 1)
export const ALL_COUNTRIES: CountryConfig[] = [
  // SÉNÉGAL (MARCHÉ PRINCIPAL)
  {
    isoCode: 'SN',
    name: 'Sénégal',
    phoneCode: '+221',
    defaultCurrency: 'XOF',
    marketZone: 'SÉNÉGAL',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '24-48h',
    taxRate: 0.18,
    postalCodeRequired: false,
    stateRequired: false,
    paymentMethods: ['WAVE', 'ORANGE MONEY', 'CARTE BANCAIRE', 'PAIEMENT À LA LIVRAISON'],
  },
  // AFRIQUE DE L'OUEST
  {
    isoCode: 'CI',
    name: 'Côte d\'Ivoire',
    phoneCode: '+225',
    defaultCurrency: 'XOF',
    marketZone: 'AFRIQUE DE L\'OUEST',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '3-5 jours',
    taxRate: 0.18,
    postalCodeRequired: false,
    stateRequired: false,
    paymentMethods: ['WAVE', 'ORANGE MONEY', 'CARTE BANCAIRE'],
  },
  {
    isoCode: 'ML',
    name: 'Mali',
    phoneCode: '+223',
    defaultCurrency: 'XOF',
    marketZone: 'AFRIQUE DE L\'OUEST',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '3-5 jours',
    taxRate: 0.18,
    postalCodeRequired: false,
    stateRequired: false,
    paymentMethods: ['ORANGE MONEY', 'CARTE BANCAIRE'],
  },
  {
    isoCode: 'GN',
    name: 'Guinée',
    phoneCode: '+224',
    defaultCurrency: 'XOF',
    marketZone: 'AFRIQUE DE L\'OUEST',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '4-6 jours',
    taxRate: 0.18,
    postalCodeRequired: false,
    stateRequired: false,
    paymentMethods: ['ORANGE MONEY', 'CARTE BANCAIRE'],
  },
  {
    isoCode: 'GM',
    name: 'Gambie',
    phoneCode: '+220',
    defaultCurrency: 'XOF',
    marketZone: 'AFRIQUE DE L\'OUEST',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '2-4 jours',
    taxRate: 0.15,
    postalCodeRequired: false,
    stateRequired: false,
    paymentMethods: ['CARTE BANCAIRE'],
  },
  {
    isoCode: 'BF',
    name: 'Burkina Faso',
    phoneCode: '+226',
    defaultCurrency: 'XOF',
    marketZone: 'AFRIQUE DE L\'OUEST',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '4-6 jours',
    taxRate: 0.18,
    postalCodeRequired: false,
    stateRequired: false,
    paymentMethods: ['ORANGE MONEY', 'CARTE BANCAIRE'],
  },
  {
    isoCode: 'TG',
    name: 'Togo',
    phoneCode: '+228',
    defaultCurrency: 'XOF',
    marketZone: 'AFRIQUE DE L\'OUEST',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '4-6 jours',
    taxRate: 0.18,
    postalCodeRequired: false,
    stateRequired: false,
    paymentMethods: ['CARTE BANCAIRE'],
  },
  {
    isoCode: 'BJ',
    name: 'Bénin',
    phoneCode: '+229',
    defaultCurrency: 'XOF',
    marketZone: 'AFRIQUE DE L\'OUEST',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '4-6 jours',
    taxRate: 0.18,
    postalCodeRequired: false,
    stateRequired: false,
    paymentMethods: ['CARTE BANCAIRE'],
  },
  {
    isoCode: 'NG',
    name: 'Nigeria',
    phoneCode: '+234',
    defaultCurrency: 'NGN',
    marketZone: 'AFRIQUE DE L\'OUEST',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '5-7 jours',
    taxRate: 0.075,
    postalCodeRequired: true,
    stateRequired: true,
    paymentMethods: ['CARTE BANCAIRE'],
  },
  // EUROPE
  {
    isoCode: 'FR',
    name: 'France',
    phoneCode: '+33',
    defaultCurrency: 'EUR',
    marketZone: 'EUROPE',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '3-5 jours Express DHL',
    taxRate: 0.20,
    postalCodeRequired: true,
    stateRequired: false,
    paymentMethods: ['CARTE BANCAIRE', 'APPLE PAY', 'PAYPAL'],
  },
  {
    isoCode: 'BE',
    name: 'Belgique',
    phoneCode: '+32',
    defaultCurrency: 'EUR',
    marketZone: 'EUROPE',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '3-5 jours Express',
    taxRate: 0.21,
    postalCodeRequired: true,
    stateRequired: false,
    paymentMethods: ['CARTE BANCAIRE', 'PAYPAL'],
  },
  {
    isoCode: 'GB',
    name: 'Royaume-Uni',
    phoneCode: '+44',
    defaultCurrency: 'GBP',
    marketZone: 'EUROPE',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '4-6 jours Express',
    taxRate: 0.20,
    postalCodeRequired: true,
    stateRequired: false,
    paymentMethods: ['CARTE BANCAIRE', 'APPLE PAY'],
  },
  // AMÉRIQUE DU NORD
  {
    isoCode: 'US',
    name: 'États-Unis',
    phoneCode: '+1',
    defaultCurrency: 'USD',
    marketZone: 'AMÉRIQUE DU NORD',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '4-7 jours FedEx Express',
    taxRate: 0.08875,
    postalCodeRequired: true,
    stateRequired: true,
    paymentMethods: ['CARTE BANCAIRE', 'APPLE PAY', 'GOOGLE PAY', 'PAYPAL'],
  },
  {
    isoCode: 'CA',
    name: 'Canada',
    phoneCode: '+1',
    defaultCurrency: 'CAD',
    marketZone: 'AMÉRIQUE DU NORD',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '5-8 jours Express',
    taxRate: 0.13,
    postalCodeRequired: true,
    stateRequired: true,
    paymentMethods: ['CARTE BANCAIRE', 'APPLE PAY', 'PAYPAL'],
  },
  // RESTE DU MONDE / AFRIQUE
  {
    isoCode: 'MA',
    name: 'Maroc',
    phoneCode: '+212',
    defaultCurrency: 'MAD',
    marketZone: 'RESTE DE L\'AFRIQUE',
    isActive: true,
    isShippingAvailable: true,
    estimatedDeliveryDays: '4-6 jours',
    taxRate: 0.20,
    postalCodeRequired: true,
    stateRequired: false,
    paymentMethods: ['CARTE BANCAIRE'],
  },
];

// 3. SHIPPING ZONES & RATES REGISTRY (SECTION 8)
export const SHIPPING_ZONE_RULES: ShippingZoneRule[] = [
  {
    id: 'sz-sn',
    marketZone: 'SÉNÉGAL',
    name: 'Livraison Sénégal (Dakar & Régions)',
    countries: ['SN'],
    baseCost: 2500,
    expressCost: 5000,
    freeShippingThreshold: 50000,
    minDays: 1,
    maxDays: 2,
    isActive: true,
  },
  {
    id: 'sz-wa',
    marketZone: 'AFRIQUE DE L\'OUEST',
    name: 'Livraison Afrique de l\'Ouest (CEDEAO)',
    countries: ['CI', 'ML', 'GN', 'GM', 'BF', 'TG', 'BJ', 'NG'],
    baseCost: 7500,
    expressCost: 12500,
    freeShippingThreshold: 150000,
    minDays: 3,
    maxDays: 5,
    isActive: true,
  },
  {
    id: 'sz-af',
    marketZone: 'RESTE DE L\'AFRIQUE',
    name: 'Livraison Reste de l\'Afrique',
    countries: ['MA', 'CM', 'GA', 'CG', 'CD', 'ZA', 'TN', 'DZ'],
    baseCost: 12500,
    expressCost: 20000,
    freeShippingThreshold: 200000,
    minDays: 4,
    maxDays: 7,
    isActive: true,
  },
  {
    id: 'sz-eu',
    marketZone: 'EUROPE',
    name: 'Livraison Europe Express (DHL / FedEx)',
    countries: ['FR', 'BE', 'ES', 'IT', 'DE', 'GB', 'CH', 'NL'],
    baseCost: 15000, // approx 23 EUR
    expressCost: 25000, // approx 38 EUR
    freeShippingThreshold: 250000,
    minDays: 3,
    maxDays: 5,
    isActive: true,
  },
  {
    id: 'sz-na',
    marketZone: 'AMÉRIQUE DU NORD',
    name: 'Livraison Amérique du Nord Express',
    countries: ['US', 'CA'],
    baseCost: 20000, // approx 33 USD
    expressCost: 32000,
    freeShippingThreshold: 300000,
    minDays: 4,
    maxDays: 7,
    isActive: true,
  },
  {
    id: 'sz-row',
    marketZone: 'RESTE DU MONDE',
    name: 'Livraison Internationale Rest of World',
    countries: [],
    baseCost: 25000,
    expressCost: 40000,
    freeShippingThreshold: 350000,
    minDays: 5,
    maxDays: 10,
    isActive: true,
  },
];

// HELPER: CONVERT PRICE FROM BASE XOF TO TARGET CURRENCY (SECTION 5)
export function convertPriceFromXOF(amountXOF: number, targetCurrency: CurrencyCode): number {
  const curr = ALL_CURRENCIES.find((c) => c.code === targetCurrency) || ALL_CURRENCIES[0];
  if (curr.code === 'XOF') return Math.round(amountXOF);
  const converted = amountXOF / curr.exchangeRateToBase;
  return Number(converted.toFixed(curr.decimals));
}

// HELPER: CONVERT PRICE TO BASE XOF (SECTION 28)
export function convertPriceToXOF(amountInCurrency: number, sourceCurrency: CurrencyCode): number {
  const curr = ALL_CURRENCIES.find((c) => c.code === sourceCurrency) || ALL_CURRENCIES[0];
  if (curr.code === 'XOF') return Math.round(amountInCurrency);
  return Math.round(amountInCurrency * curr.exchangeRateToBase);
}

// HELPER: FORMAT CURRENCY DISPLAY
export function formatCurrencyPrice(amount: number, currencyCode: CurrencyCode = 'XOF'): string {
  const curr = ALL_CURRENCIES.find((c) => c.code === currencyCode) || ALL_CURRENCIES[0];
  if (currencyCode === 'XOF') {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  }
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: curr.decimals })} ${curr.symbol}`;
}

// CALCULATE SHIPPING FEE BY COUNTRY ISO CODE (SECTION 9)
export function apiCalculateInternationalShipping(
  countryIso: string,
  subtotalXOF: number,
  method: 'STANDARD' | 'EXPRESS' = 'STANDARD'
): { shippingCostXOF: number; deliveryDays: string; zoneName: string } {
  const country = ALL_COUNTRIES.find((c) => c.isoCode.toUpperCase() === countryIso.toUpperCase()) || ALL_COUNTRIES[0];
  const zone = SHIPPING_ZONE_RULES.find((z) => z.countries.includes(country.isoCode)) || SHIPPING_ZONE_RULES[SHIPPING_ZONE_RULES.length - 1];

  let cost = method === 'EXPRESS' ? zone.expressCost : zone.baseCost;

  if (zone.freeShippingThreshold && subtotalXOF >= zone.freeShippingThreshold) {
    cost = 0;
  }

  return {
    shippingCostXOF: cost,
    deliveryDays: `${zone.minDays}-${zone.maxDays} jours`,
    zoneName: zone.name,
  };
}
