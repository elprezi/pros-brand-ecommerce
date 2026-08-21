/**
 * PROS ERP & E-Commerce Server-side Invoice & Receipt Engine
 * Authoritative API Handler for PDF Receipts, Invoices, and Dynamic QR Codes
 */

import type { Order, StoreSettings } from '../../types/ecommerce';
import { generateQrCodeSvg } from '../utils/qrcode';

export interface InvoiceVendorInfo {
  companyName: string;
  subTitle: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  taxId?: string;
}

export interface InvoiceCustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  country: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceFinancials {
  subtotal: number;
  discount: number;
  shippingCost: number;
  taxes: number;
  grandTotal: number;
}

export interface OrderInvoiceData {
  invoiceNumber: string;
  orderId: string;
  trackingNumber: string;
  trackingToken: string;
  createdAt: string;
  generatedAt: string;
  vendor: InvoiceVendorInfo;
  customer: InvoiceCustomerInfo;
  items: InvoiceItem[];
  financials: InvoiceFinancials;
  paymentStatus: string;
  paymentMethod: string;
  trackingUrl: string;
  qrCodeSvg: string;
  rawOrder?: Order;
}

function getPublicAppUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://pros-brand.com';
}

// DIRECT INVOICE DATA BUILDER (FOR PDF & PRINT RECEIPT ENGINE)
export function generateInvoiceData(order: Order, settings?: StoreSettings | null): OrderInvoiceData {
  const numericPart = order.trackingNumber.replace(/[^0-9]/g, '') || order.id.replace(/[^0-9]/g, '').slice(-6) || '003436';
  const invoiceNumber = `INV-2026-${numericPart.padStart(6, '0')}`;

  const vendor: InvoiceVendorInfo = {
    companyName: 'PROS',
    subTitle: 'Maison d\'Édition & E-Commerce Premium',
    address: 'Avenue Cheikh Anta Diop, Fann Résidence',
    city: 'Dakar',
    country: 'Sénégal',
    email: 'support@pros.sn',
    phone: settings?.whatsAppNumber || '+221 77 000 00 00',
    taxId: 'NINEA: 009823471 2V3',
  };

  const customer: InvoiceCustomerInfo = {
    name: `${order.customer.firstName} ${order.customer.lastName}`,
    email: order.customer.email,
    phone: order.customer.phone,
    address: order.customer.address || 'Dakar, Sénégal',
    city: order.customer.city || 'Dakar',
    region: order.customer.region || 'Dakar',
    country: 'Sénégal',
  };

  const items: InvoiceItem[] = (order.items || []).map((i) => ({
    id: i.product?.id || `item-${Date.now()}`,
    name: i.product?.name || 'Article PROS',
    size: i.size || 'M',
    color: i.color || 'Noir',
    quantity: i.quantity,
    unitPrice: i.price,
    totalPrice: i.price * i.quantity,
  }));

  const subtotal = order.subtotal || items.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const discount = order.discount || 0;
  const shippingCost = order.shippingCost !== undefined ? order.shippingCost : 2500;
  const taxes = 0;
  const grandTotal = order.total || subtotal - discount + shippingCost;

  const financials: InvoiceFinancials = {
    subtotal,
    discount,
    shippingCost,
    taxes,
    grandTotal,
  };

  const publicAppUrl = getPublicAppUrl();
  const trackingToken = `trk_tok_${order.trackingNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const trackingUrl = `${publicAppUrl}/order-tracking?tracking=${order.trackingNumber}`;

  const qrCodeSvg = generateQrCodeSvg(trackingUrl, 160);

  const paymentStatusMap: Record<string, string> = {
    paid: 'PAYÉ',
    pending: 'EN ATTENTE DE PAIEMENT',
    failed: 'ÉCHEC DE PAIEMENT',
  };

  const paymentMethodMap: Record<string, string> = {
    wave: 'WAVE MOBILE MONEY',
    orange_money: 'ORANGE MONEY SÉNÉGAL',
    card: 'CARTE BANCAIRE (VISA / MASTERCARD)',
    cash_on_delivery: 'PAIEMENT À LA LIVRAISON',
  };

  return {
    invoiceNumber,
    orderId: order.id,
    trackingNumber: order.trackingNumber,
    trackingToken,
    createdAt: order.createdAt,
    generatedAt: new Date().toISOString(),
    vendor,
    customer,
    items,
    financials,
    paymentStatus: paymentStatusMap[order.paymentStatus] || String(order.paymentStatus).toUpperCase(),
    paymentMethod: paymentMethodMap[order.paymentMethod] || String(order.paymentMethod).toUpperCase(),
    trackingUrl,
    qrCodeSvg,
    rawOrder: order,
  };
}

// API ENDPOINT 1: GET /api/invoice/:orderId
export async function apiGetOrderInvoice(
  orderIdOrTracking: string,
  allOrders: Order[],
  settings?: StoreSettings | null
): Promise<{ success: boolean; data?: OrderInvoiceData; error?: string }> {
  if (!orderIdOrTracking || orderIdOrTracking.trim().length === 0) {
    return { success: false, error: 'Référence de commande manquante.' };
  }

  const cleanQuery = orderIdOrTracking.trim().toUpperCase();

  const order = allOrders.find(
    (o) =>
      o.id.toUpperCase() === cleanQuery ||
      o.trackingNumber.toUpperCase() === cleanQuery ||
      o.trackingNumber.replace(/[^A-Z0-9]/g, '').toUpperCase() === cleanQuery.replace(/[^A-Z0-9]/g, '')
  );

  if (!order) {
    return {
      success: false,
      error: `Commande introuvable pour la référence "${orderIdOrTracking}".`,
    };
  }

  return { success: true, data: generateInvoiceData(order, settings) };
}
