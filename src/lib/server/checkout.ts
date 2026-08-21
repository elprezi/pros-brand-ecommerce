import { INITIAL_PRODUCTS, INITIAL_PROMO_CODES, INITIAL_SETTINGS } from '../../data/products';
import type { ProductSize } from '../../types/ecommerce';

export interface CheckoutInputItem {
  productId: string;
  color: string;
  size: ProductSize;
  quantity: number;
}

export interface CheckoutInput {
  items: CheckoutInputItem[];
  couponCode?: string;
  customerRegion: string;
  deliveryMethod: 'dakar_express' | 'region_standard' | 'boutique_pickup';
  customerInfo: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    country: string;
  };
}

export interface CheckoutCalculationResult {
  valid: boolean;
  orderNumber: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  itemsSnapshot: {
    productId: string;
    productName: string;
    sku: string;
    color: string;
    size: ProductSize;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  errorMessage?: string;
}

// Order Number Sequence Generator (e.g., PROS-2026-000124)
let orderCounter = 124;

export function generateOrderNumber(): string {
  orderCounter += 1;
  const sequence = String(orderCounter).padStart(6, '0');
  return `PROS-2026-${sequence}`;
}

export function processServerCheckout(input: CheckoutInput): CheckoutCalculationResult {
  const { items, couponCode, customerRegion, deliveryMethod } = input;

  if (!items || items.length === 0) {
    return {
      valid: false,
      orderNumber: '',
      subtotal: 0,
      discount: 0,
      shippingCost: 0,
      total: 0,
      itemsSnapshot: [],
      errorMessage: 'Le panier est vide.',
    };
  }

  const itemsSnapshot: CheckoutCalculationResult['itemsSnapshot'] = [];
  let subtotal = 0;

  // Server-side Price & Stock Verification (RULE 1 & RULE 2)
  for (const item of items) {
    const product = INITIAL_PRODUCTS.find((p) => p.id === item.productId);
    if (!product) {
      return {
        valid: false,
        orderNumber: '',
        subtotal: 0,
        discount: 0,
        shippingCost: 0,
        total: 0,
        itemsSnapshot: [],
        errorMessage: `Le produit "${item.productId}" n'existe plus dans le catalogue.`,
      };
    }

    const availableStock = product.stockPerSize[item.size] || 0;
    if (availableStock < item.quantity) {
      return {
        valid: false,
        orderNumber: '',
        subtotal: 0,
        discount: 0,
        shippingCost: 0,
        total: 0,
        itemsSnapshot: [],
        errorMessage: `Stock insuffisant pour ${product.name} (Taille ${item.size}). Stock disponible : ${availableStock}`,
      };
    }

    const unitPrice = product.price; // Server authoritative price
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    itemsSnapshot.push({
      productId: product.id,
      productName: product.name,
      sku: `PROS-${product.category.toUpperCase()}-${product.id.slice(-4)}-${item.color.slice(0, 3).toUpperCase()}-${item.size}`,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    });
  }

  // Coupon Calculation
  let discount = 0;
  if (couponCode) {
    const foundCoupon = INITIAL_PROMO_CODES.find((c) => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (foundCoupon) {
      if (foundCoupon.discountPercent) {
        discount = Math.round((subtotal * foundCoupon.discountPercent) / 100);
      } else if (foundCoupon.discountFixed) {
        discount = foundCoupon.discountFixed;
      }
    }
  }

  // Shipping Fee Calculation
  let shippingCost = 0;
  if (subtotal < INITIAL_SETTINGS.freeShippingThreshold) {
    if (deliveryMethod === 'boutique_pickup') {
      shippingCost = 0;
    } else if (deliveryMethod === 'dakar_express' || customerRegion.toLowerCase().includes('dakar')) {
      shippingCost = INITIAL_SETTINGS.dakarShippingFee;
    } else {
      shippingCost = INITIAL_SETTINGS.regionShippingFee;
    }
  }

  const total = Math.max(0, subtotal - discount + shippingCost);
  const orderNumber = generateOrderNumber();

  return {
    valid: true,
    orderNumber,
    subtotal,
    discount,
    shippingCost,
    total,
    itemsSnapshot,
  };
}
