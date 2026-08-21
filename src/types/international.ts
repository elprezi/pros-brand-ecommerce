/**
 * PROS International E-Commerce & Financial Accounting System Types
 */

export type MarketZone = 'SÉNÉGAL' | 'AFRIQUE DE L\'OUEST' | 'RESTE DE L\'AFRIQUE' | 'EUROPE' | 'AMÉRIQUE DU NORD' | 'RESTE DU MONDE';

export type CurrencyCode = 'XOF' | 'EUR' | 'USD' | 'GBP' | 'CAD' | 'NGN' | 'GHS' | 'MAD';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
  exchangeRateToBase: number; // 1 EUR = X XOF, 1 USD = Y XOF. Base is XOF (1.0)
  isActive: boolean;
}

export interface CountryConfig {
  isoCode: string; // e.g. SN, CI, ML, FR, US
  name: string;
  phoneCode: string; // e.g. +221, +225, +33, +1
  defaultCurrency: CurrencyCode;
  marketZone: MarketZone;
  isActive: boolean;
  isShippingAvailable: boolean;
  estimatedDeliveryDays: string;
  taxRate: number; // e.g. 0.18 for 18% TVA
  postalCodeRequired: boolean;
  stateRequired: boolean;
  paymentMethods: string[];
}

export interface ExchangeRateHistory {
  id: string;
  currency: CurrencyCode;
  rate: number;
  updatedAt: string;
  updatedBy: string;
}

export interface TaxRule {
  id: string;
  name: string;
  country: string;
  region?: string;
  rate: number; // e.g. 0.18 for 18%
  isInclusive: boolean;
  isActive: boolean;
}

export interface ShippingZoneRule {
  id: string;
  marketZone: MarketZone;
  name: string;
  countries: string[];
  baseCost: number; // in XOF
  expressCost: number;
  freeShippingThreshold?: number; // in XOF
  minDays: number;
  maxDays: number;
  isActive: boolean;
}

export type ExpenseCategory =
  | 'ACHAT STOCK'
  | 'TRANSPORT'
  | 'LIVRAISON'
  | 'PUBLICITÉ / MARKETING'
  | 'SALAIRES'
  | 'LOYER'
  | 'SERVICES'
  | 'FOURNITURES'
  | 'DOUANES'
  | 'FRAIS BANCAIRES'
  | 'AUTRES';

export interface Expense {
  id: string;
  reference: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: CurrencyCode;
  baseAmountXOF: number;
  date: string;
  supplierId?: string;
  supplierName?: string;
  paymentMethod: string;
  status: 'PAYÉ' | 'EN ATTENTE' | 'ANNULÉ';
  attachmentUrl?: string;
  createdBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  country: string;
  address?: string;
  category: string;
  createdAt: string;
}

export type TransactionType = 'VENTE' | 'PAIEMENT' | 'REMBOURSEMENT' | 'DÉPENSE' | 'TAXE' | 'LIVRAISON' | 'AJUSTEMENT';

export interface AccountingTransaction {
  id: string;
  reference: string;
  date: string;
  type: TransactionType;
  orderId?: string;
  customerName: string;
  country: string;
  currency: CurrencyCode;
  amount: number;
  baseAmountXOF: number;
  costPriceXOF?: number;
  grossMarginXOF?: number;
  paymentMethod: string;
  status: 'VALIDÉ' | 'EN ATTENTE' | 'ANNULÉ' | 'REMBOURSÉ';
  notes?: string;
}

export type RefundStatus = 'DEMANDE' | 'EN_VERIFICATION' | 'APPROUVE' | 'EN_TRAITEMENT' | 'EXECUTE' | 'REFUSE' | 'ANNULE';

export type RefundType = 'TOTAL' | 'PARTIAL' | 'AVOIR_PROS' | 'REMPLACEMENT';

export type RestockOption = 'REMISE_EN_STOCK' | 'PRODUIT_ENDOMMAGE' | 'PERTE' | 'A_INSPECTER';

export interface ReturnedItem {
  productId: string;
  name: string;
  size: string;
  color: string;
  quantityPurchased: number;
  quantityReturned: number;
  unitPrice: number;
  totalAmount: number;
  restockOption: RestockOption;
}

export interface ActionLog {
  date: string;
  action: string;
  user: string;
  note?: string;
}

export interface CustomerCredit {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  amountXOF: number;
  usedAmountXOF: number;
  remainingAmountXOF: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

export interface RefundRecord {
  id: string;
  refundNumber: string;
  orderId: string;
  trackingNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  country: string;
  currency?: CurrencyCode;
  paymentId?: string;
  invoiceId?: string;

  originalOrderAmount: number;
  totalPaidAmount: number;
  alreadyRefundedAmount: number;
  remainingRefundableAmount: number;
  refundAmount: number;
  baseRefundAmountXOF: number;

  refundType: RefundType;
  refundMethod: string;
  reason: string;
  reasonCategory: string;
  status: RefundStatus;

  returnedItems?: ReturnedItem[];
  restockOption?: RestockOption;

  requestedAt: string;
  approvedAt?: string;
  processedAt?: string;

  requestedBy: string;
  approvedBy?: string;
  processedBy?: string;

  notes?: string;
  actionLogs?: ActionLog[];
}

export interface AccountingKPIs {
  grossRevenueXOF: number;
  netRevenueXOF: number;
  totalCollectedXOF: number;
  totalExpensesXOF: number;
  totalCOGSXOF: number;
  grossMarginXOF: number;
  grossMarginPercentage: number;
  netProfitXOF: number;
  netProfitPercentage: number;
  taxesToPayXOF: number;
  issuedInvoicesCount: number;
  unpaidInvoicesCount: number;
  totalRefundsXOF: number;
  refundsCount: number;
  totalOrdersCount: number;
}
