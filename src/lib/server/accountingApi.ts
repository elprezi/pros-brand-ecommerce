/**
 * PROS ERP & E-Commerce Financial Accounting Backend Engine
 * Authoritative Service for CA Brut, CA Net, COGS, Expenses, Refunds, Taxes, Net Profit/Deficit, and Audit Ledger
 */

import type { Order } from '../../types/ecommerce';
import type {
  AccountingKPIs,
  AccountingTransaction,
  CurrencyCode,
  Expense,
  RefundRecord,
  Supplier,
} from '../../types/international';
import { convertPriceToXOF } from './internationalApi';

// CLEAN INITIAL EXPENSES REGISTRY (SECTION 1, 3, 8 & 13)
export const INITIAL_EXPENSES: Expense[] = [];

// CLEAN INITIAL REFUNDS REGISTRY (SECTION 1, 7 & 17)
export const INITIAL_REFUNDS: RefundRecord[] = [];

// CLEAN INITIAL CUSTOMER CREDITS (AVOIRS PROS) (SECTION 1, 17)
export const INITIAL_CREDITS: any[] = [];

// CLEAN INITIAL SUPPLIERS REGISTRY (SECTION 15)
export const INITIAL_SUPPLIERS: Supplier[] = [];

// IN-MEMORY STORES
let expensesStore: Expense[] = [...INITIAL_EXPENSES];
let refundsStore: RefundRecord[] = [...INITIAL_REFUNDS];
let suppliersStore: Supplier[] = [...INITIAL_SUPPLIERS];

// GET SUPPLIERS
export function apiGetSuppliers(): Supplier[] {
  return suppliersStore;
}

// GET EXPENSES
export function apiGetExpenses(): Expense[] {
  return expensesStore;
}

// CREATE EXPENSE (SECTION 10 & 23)
export function apiCreateExpense(expense: Omit<Expense, 'id' | 'reference' | 'baseAmountXOF'>): Expense {
  const baseAmountXOF = convertPriceToXOF(expense.amount, expense.currency);
  const newExp: Expense = {
    ...expense,
    id: `exp-${Date.now()}`,
    reference: `EXP-2026-${String(expensesStore.length + 1).padStart(3, '0')}`,
    baseAmountXOF,
  };
  expensesStore.unshift(newExp);
  return newExp;
}

// DELETE EXPENSE
export function apiDeleteExpense(id: string): boolean {
  const prevLen = expensesStore.length;
  expensesStore = expensesStore.filter((e) => e.id !== id);
  return expensesStore.length < prevLen;
}

// GET REFUNDS (SECTION 6)
export function apiGetRefunds(): RefundRecord[] {
  return refundsStore;
}

// STRICT REFUND CONTROL (SECTION 1, 4, 5, 24 & TEST C)
export function apiCanRefundOrder(
  order: Order,
  amountToRefund: number
): { allowed: boolean; paidAmount: number; alreadyRefunded: number; remainingRefundable: number; error?: string } {
  // Check if order payment status is paid (Section 24)
  if (order.paymentStatus !== 'paid') {
    return {
      allowed: false,
      paidAmount: 0,
      alreadyRefunded: 0,
      remainingRefundable: 0,
      error: "Aucun paiement confirmé n'est associé à cette commande.",
    };
  }

  const paidAmount = order.baseTotalXOF || order.total;
  
  const existingOrderRefunds = refundsStore.filter(
    (r) => (r.orderId === order.id || r.trackingNumber === order.trackingNumber) && (r.status === 'EXECUTE' || r.status === 'APPROUVE')
  );
  
  const alreadyRefunded = existingOrderRefunds.reduce((acc, curr) => acc + (curr.baseRefundAmountXOF || curr.refundAmount), 0);
  const remainingRefundable = Math.max(0, paidAmount - alreadyRefunded);
  const isAllowed = amountToRefund > 0 && amountToRefund <= remainingRefundable;
  
  return {
    allowed: isAllowed,
    paidAmount,
    alreadyRefunded,
    remainingRefundable,
    error: isAllowed ? undefined : `Le montant demandé (${amountToRefund.toLocaleString()} FCFA) dépasse le montant restant remboursable (${remainingRefundable.toLocaleString()} FCFA) pour cette commande.`,
  };
}

// CREATE REFUND RECORD WITH STRICT VALIDATION (SECTION 5, 6 & 11)
export function apiCreateRefund(
  refundInput: Partial<RefundRecord>,
  order: Order
): { success: boolean; data?: RefundRecord; error?: string } {
  const refundAmount = refundInput.refundAmount || refundInput.baseRefundAmountXOF || order.total;
  const check = apiCanRefundOrder(order, refundAmount);

  if (!check.allowed) {
    return {
      success: false,
      error: check.error || 'Le montant du remboursement dépasse le montant restant remboursable.',
    };
  }

  const now = new Date().toISOString();
  const refundNumber = `REF-2026-${String(refundsStore.length + 1).padStart(3, '0')}`;

  const newRef: RefundRecord = {
    id: `ref-${Date.now()}`,
    refundNumber,
    orderId: order.id,
    trackingNumber: order.trackingNumber,
    customerId: order.customer.email,
    customerName: `${order.customer.firstName} ${order.customer.lastName}`,
    customerEmail: order.customer.email || 'client@pros.sn',
    country: order.customer.country || 'Sénégal',
    currency: (order.currency as any) || 'XOF',
    paymentId: `PAY-${order.id}`,
    invoiceId: `INV-2026-${order.trackingNumber.replace(/[^0-9]/g, '').padStart(6, '0')}`,

    originalOrderAmount: order.total,
    totalPaidAmount: check.paidAmount,
    alreadyRefundedAmount: check.alreadyRefunded,
    remainingRefundableAmount: Math.max(0, check.remainingRefundable - refundAmount),
    refundAmount,
    baseRefundAmountXOF: refundAmount,

    refundType: refundInput.refundType || 'TOTAL',
    refundMethod: refundInput.refundMethod || 'WAVE',
    reason: refundInput.reason || 'Retour sous délai légal',
    reasonCategory: refundInput.reasonCategory || 'CLIENT CHANGE D\'AVIS',
    status: refundInput.status || 'DEMANDE',

    returnedItems: refundInput.returnedItems || [],
    restockOption: refundInput.restockOption || 'REMISE_EN_STOCK',

    requestedAt: now,
    requestedBy: refundInput.requestedBy || 'Administrateur PROS',

    notes: refundInput.notes || 'Demande enregistrée via panneau admin.',
    actionLogs: [
      { date: now, action: 'Demande de remboursement enregistrée', user: refundInput.requestedBy || 'Admin' },
    ],
  };

  refundsStore.unshift(newRef);
  return { success: true, data: newRef };
}

// WORKFLOW TRANSITION: APPROVE REFUND (SECTION 11 & 12)
export function apiApproveRefund(refundId: string, approvedBy: string): boolean {
  const ref = refundsStore.find((r) => r.id === refundId);
  if (!ref) return false;

  const now = new Date().toISOString();
  ref.status = 'APPROUVE';
  ref.approvedAt = now;
  ref.approvedBy = approvedBy;
  ref.actionLogs?.push({ date: now, action: 'Remboursement approuvé', user: approvedBy });
  return true;
}

// WORKFLOW TRANSITION: EXECUTE REFUND (SECTION 11, 12, 15)
export function apiExecuteRefund(refundId: string, processedBy: string): boolean {
  const ref = refundsStore.find((r) => r.id === refundId);
  if (!ref) return false;

  const now = new Date().toISOString();
  ref.status = 'EXECUTE';
  ref.processedAt = now;
  ref.processedBy = processedBy;
  ref.actionLogs?.push({ date: now, action: 'Remboursement exécuté avec succès', user: processedBy });
  return true;
}

// WORKFLOW TRANSITION: CANCEL / REFUSE REFUND
export function apiCancelRefund(refundId: string, user: string, reasonNote?: string): boolean {
  const ref = refundsStore.find((r) => r.id === refundId);
  if (!ref) return false;

  const now = new Date().toISOString();
  ref.status = 'REFUSE';
  ref.actionLogs?.push({ date: now, action: `Demande refusée: ${reasonNote || 'Non conforme'}`, user });
  return true;
}

// COMPUTE FULL FINANCIAL ACCOUNTING KPIs (SECTIONS 3, 4, 5, 8, 9, 11, 12, 16, 17)
export function apiGetAccountingKPIs(
  _period: string = '30_days',
  countryFilter: string = 'all',
  _currencyFilter: string = 'all',
  orders: Order[] = []
): AccountingKPIs & { isDeficit: boolean; grossMarginPercentageFormatted: string } {
  // 1. Filter PAID orders ONLY for CA BRUT (SECTION 3)
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');

  // Filter orders by country if specified (SECTION 15)
  const filteredOrders = paidOrders.filter((o) => {
    if (countryFilter === 'all') return true;
    const country = o.customer?.country || 'Sénégal';
    return country.toLowerCase().includes(countryFilter.toLowerCase());
  });

  // 2. CHIFFRE D'AFFAIRES BRUT (SECTION 3)
  const grossRevenueXOF = filteredOrders.reduce((acc, curr) => acc + (curr.baseTotalXOF || curr.total), 0);

  // 3. REMBOURSEMENTS VALIDÉS (SECTION 6 & 7)
  const totalRefundsXOF = refundsStore
    .filter((r) => r.status === 'EXECUTE')
    .reduce((acc, curr) => acc + (curr.baseRefundAmountXOF || curr.refundAmount), 0);

  // 4. CHIFFRE D'AFFAIRES NET (SECTION 4 & 18)
  const netRevenueXOF = Math.max(0, grossRevenueXOF - totalRefundsXOF);

  // 5. ENCAISSEMENTS EFFECTIFS (SECTION 5)
  const totalCollectedXOF = grossRevenueXOF; // Paid orders only

  // 6. DÉPENSES DE FONCTIONNEMENT (SECTION 10)
  const totalExpensesXOF = expensesStore
    .filter((exp) => exp.status === 'PAYÉ')
    .reduce((acc, curr) => acc + curr.baseAmountXOF, 0);

  // 7. COÛT DES PRODUITS (COGS) (SECTION 8)
  const totalCOGSXOF = filteredOrders.reduce((acc, curr) => {
    if (curr.costPriceTotalXOF && curr.costPriceTotalXOF > 0) {
      return acc + curr.costPriceTotalXOF;
    }
    // Compute COGS from items or fallback
    const itemsCogs = (curr.items || []).reduce((itemAcc, item) => {
      const cost = item.product?.costPrice || Math.round(item.price * 0.45);
      return itemAcc + cost * item.quantity;
    }, 0);
    return acc + (itemsCogs > 0 ? itemsCogs : Math.round((curr.subtotal || curr.total) * 0.45));
  }, 0);

  // 8. MARGE BRUTE & MARGE % (SECTION 9)
  const grossMarginXOF = netRevenueXOF - totalCOGSXOF;
  const grossMarginPercentage = netRevenueXOF > 0 ? (grossMarginXOF / netRevenueXOF) * 100 : 0;
  const grossMarginPercentageFormatted = netRevenueXOF > 0 ? `${grossMarginPercentage.toFixed(1)}%` : 'N/A';

  // 9. TAXES & TVA RÉELLES COLLECTÉES (SECTION 12)
  const taxesToPayXOF = filteredOrders.reduce((acc, curr) => {
    if (curr.taxAmount && curr.taxAmount > 0) return acc + curr.taxAmount;
    return acc + Math.round((curr.subtotal || curr.total) * 0.1525);
  }, 0);

  // 10. ESTIMATION FRAIS DE PAIEMENT & EXPÉDITIONS
  const totalPaymentFees = Math.round(grossRevenueXOF * 0.015); // 1.5% gateway fee

  // 11. BÉNÉFICE NET / RÉSULTAT NET (SECTION 11 & 17)
  const netProfitXOF = netRevenueXOF - totalCOGSXOF - totalExpensesXOF - totalPaymentFees;
  const isDeficit = netProfitXOF < 0;
  const netProfitPercentage = netRevenueXOF > 0 ? (netProfitXOF / netRevenueXOF) * 100 : 0;

  // Invoice Metrics (SECTION 16)
  const issuedInvoicesCount = orders.length;
  const unpaidInvoicesCount = orders.filter((o) => o.paymentStatus !== 'paid').length;

  return {
    grossRevenueXOF,
    netRevenueXOF,
    totalCollectedXOF,
    totalExpensesXOF,
    totalCOGSXOF,
    grossMarginXOF,
    grossMarginPercentage: Number(grossMarginPercentage.toFixed(1)),
    grossMarginPercentageFormatted,
    netProfitXOF,
    netProfitPercentage: Number(netProfitPercentage.toFixed(1)),
    isDeficit,
    taxesToPayXOF,
    issuedInvoicesCount,
    unpaidInvoicesCount,
    totalRefundsXOF,
    refundsCount: refundsStore.length,
    totalOrdersCount: filteredOrders.length,
  };
}

// MARKET PERFORMANCE BREAKDOWN (SECTION 19)
export interface MarketPerformance {
  marketZone: string;
  grossRevenueXOF: number;
  ordersCount: number;
  averageBasketXOF: number; // Panier moyen
  grossMarginXOF: number;
}

export function apiGetMarketPerformance(orders: Order[]): MarketPerformance[] {
  const markets = ['Sénégal', 'Afrique', 'Europe', 'Amérique', 'Reste du Monde'];
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');

  return markets.map((m) => {
    const marketOrders = paidOrders.filter((o) => {
      const country = (o.customer?.country || 'Sénégal').toLowerCase();
      if (m === 'Sénégal') return country.includes('sénégal') || country.includes('senegal');
      if (m === 'Afrique') return country.includes('ivoire') || country.includes('mali') || country.includes('guin') || country.includes('maroc');
      if (m === 'Europe') return country.includes('france') || country.includes('belg') || country.includes('uk') || country.includes('royaume');
      if (m === 'Amérique') return country.includes('état') || country.includes('us') || country.includes('canada');
      return true;
    });

    const rev = marketOrders.reduce((acc, curr) => acc + (curr.baseTotalXOF || curr.total), 0);
    const count = marketOrders.length;
    const avgBasket = count > 0 ? Math.round(rev / count) : 0;
    const margin = Math.round(rev * 0.40); // 40% margin estimate

    return {
      marketZone: m,
      grossRevenueXOF: rev,
      ordersCount: count,
      averageBasketXOF: avgBasket,
      grossMarginXOF: margin,
    };
  });
}

// GATEWAY PERFORMANCE BREAKDOWN (SECTION 22)
export interface GatewayPerformance {
  method: string;
  transactionsCount: number;
  collectedXOF: number;
  pendingXOF: number;
  failedCount: number;
  refundsXOF: number;
}

export function apiGetGatewayPerformance(orders: Order[]): GatewayPerformance[] {
  const methods = [
    { code: 'wave', label: 'WAVE MOBILE MONEY' },
    { code: 'orange_money', label: 'ORANGE MONEY' },
    { code: 'card', label: 'CARTE BANCAIRE (VISA / MC)' },
    { code: 'cash_on_delivery', label: 'PAIEMENT À LA LIVRAISON' },
  ];

  return methods.map((m) => {
    const gatewayOrders = orders.filter((o) => o.paymentMethod === m.code);
    const paid = gatewayOrders.filter((o) => o.paymentStatus === 'paid');
    const pending = gatewayOrders.filter((o) => o.paymentStatus === 'pending');
    const failed = gatewayOrders.filter((o) => o.paymentStatus === 'failed');

    const collectedXOF = paid.reduce((acc, curr) => acc + (curr.baseTotalXOF || curr.total), 0);
    const pendingXOF = pending.reduce((acc, curr) => acc + (curr.baseTotalXOF || curr.total), 0);

    return {
      method: m.label,
      transactionsCount: gatewayOrders.length,
      collectedXOF,
      pendingXOF,
      failedCount: failed.length,
      refundsXOF: 0,
    };
  });
}

// UNIFIED TRANSACTIONS LEDGER WITH SEARCH & FILTERS (SECTION 20)
export function apiGetAccountingTransactionsLedger(
  orders: Order[] = [],
  searchQuery: string = '',
  typeFilter: string = 'all'
): AccountingTransaction[] {
  const ledger: AccountingTransaction[] = [];

  // Add Sales Transactions for Paid Orders
  orders.forEach((o) => {
    const amountXOF = o.baseTotalXOF || o.total;
    const currency = (o.currency as CurrencyCode) || 'XOF';
    const country = o.customer?.country || 'Sénégal';

    if (o.paymentStatus === 'paid') {
      ledger.push({
        id: `tx-sale-${o.id}`,
        reference: `FAC-${o.trackingNumber}`,
        date: o.createdAt,
        type: 'VENTE',
        orderId: o.id,
        customerName: `${o.customer.firstName} ${o.customer.lastName}`,
        country,
        currency,
        amount: o.total,
        baseAmountXOF: amountXOF,
        paymentMethod: o.paymentMethod ? o.paymentMethod.toUpperCase() : 'WAVE',
        status: 'VALIDÉ',
        notes: `Vente e-commerce (${o.items?.length || 1} article(s))`,
      });
    }
  });

  // Add Expenses Transactions
  expensesStore.forEach((exp) => {
    ledger.push({
      id: `tx-exp-${exp.id}`,
      reference: exp.reference,
      date: exp.date,
      type: 'DÉPENSE',
      customerName: exp.supplierName || 'Fournisseur Général',
      country: 'Sénégal',
      currency: exp.currency,
      amount: exp.amount,
      baseAmountXOF: exp.baseAmountXOF,
      paymentMethod: exp.paymentMethod,
      status: exp.status === 'PAYÉ' ? 'VALIDÉ' : 'EN ATTENTE',
      notes: `${exp.category}: ${exp.description}`,
    });
  });

  // Add Refund Transactions
  refundsStore.forEach((ref) => {
    const amt = ref.baseRefundAmountXOF || ref.refundAmount;
    ledger.push({
      id: `tx-ref-${ref.id}`,
      reference: ref.refundNumber,
      date: ref.requestedAt,
      type: 'REMBOURSEMENT',
      customerName: ref.customerName,
      country: ref.country,
      currency: 'XOF',
      amount: amt,
      baseAmountXOF: amt,
      paymentMethod: ref.refundMethod,
      status: ref.status === 'EXECUTE' ? 'REMBOURSÉ' : 'EN ATTENTE',
      notes: `Motif: ${ref.reason}`,
    });
  });

  // Filter ledger by query and type
  return ledger
    .filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          tx.reference.toLowerCase().includes(q) ||
          tx.customerName.toLowerCase().includes(q) ||
          tx.country.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
