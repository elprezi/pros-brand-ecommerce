import type { Order, Product } from '../../../types/ecommerce';
import type { DashboardMetrics } from './dashboard';

export const filterOrdersByPeriod = (orders: Order[], period: string): { current: Order[]; previous: Order[] } => {
  const now = new Date();
  let days = 7;

  if (period === 'today') days = 1;
  else if (period === 'yesterday') days = 2;
  else if (period === '7d') days = 7;
  else if (period === '30d') days = 30;
  else if (period === 'month') days = 30;
  else if (period === '90d') days = 90;
  else if (period === 'year' || period === 'all') days = 365;

  const currentCutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousCutoff = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

  const currentOrders = orders.filter((o) => {
    const oDate = new Date(o.createdAt);
    return oDate >= currentCutoff && o.paymentStatus !== 'failed';
  });

  const previousOrders = orders.filter((o) => {
    const oDate = new Date(o.createdAt);
    return oDate >= previousCutoff && oDate < currentCutoff && o.paymentStatus !== 'failed';
  });

  return { current: currentOrders, previous: previousOrders };
};

export const calculateVariation = (current: number, previous: number): { text: string; isPositive: boolean } => {
  if (previous === 0 && current > 0) {
    return { text: 'Nouvelle activité', isPositive: true };
  }
  if (previous === 0 && current === 0) {
    return { text: 'Pas de variation', isPositive: true };
  }
  const pct = ((current - previous) / previous) * 100;
  const isPos = pct >= 0;
  return {
    text: `${isPos ? '↑ +' : '↓ '}${Math.abs(pct).toFixed(1)}%`,
    isPositive: isPos,
  };
};

export const getDashboardMetrics = (orders: Order[], _products: Product[], period: string): DashboardMetrics => {
  const { current, previous } = filterOrdersByPeriod(orders, period);

  // 1. Total Sales (Valid/Paid Orders)
  const currentSales = current.reduce((sum, o) => sum + o.total, 0);
  const prevSales = previous.reduce((sum, o) => sum + o.total, 0);
  const salesVar = calculateVariation(currentSales, prevSales);

  // 2. Orders Count
  const currentOrdersCount = current.length;
  const prevOrdersCount = previous.length;
  const ordersVar = calculateVariation(currentOrdersCount, prevOrdersCount);

  // 3. Average Order Value (Panier Moyen)
  const currentAov = currentOrdersCount > 0 ? Math.round(currentSales / currentOrdersCount) : 0;
  const prevAov = prevOrdersCount > 0 ? Math.round(prevSales / prevOrdersCount) : 0;
  const aovVar = calculateVariation(currentAov, prevAov);

  // 4. New Customers (Unique emails in period)
  const currentEmails = new Set(current.map((o) => o.customer.email.toLowerCase()));
  const prevEmails = new Set(previous.map((o) => o.customer.email.toLowerCase()));
  const newCustomersCount = currentEmails.size;
  const prevCustomersCount = prevEmails.size;
  const customersVar = calculateVariation(newCustomersCount, prevCustomersCount);

  // 5. Items Sold (SUM(OrderItem.quantity))
  const currentItemsSold = current.reduce(
    (sum, o) => sum + o.items.reduce((iSum, it) => iSum + it.quantity, 0),
    0
  );
  const prevItemsSold = previous.reduce(
    (sum, o) => sum + o.items.reduce((iSum, it) => iSum + it.quantity, 0),
    0
  );
  const itemsVar = calculateVariation(currentItemsSold, prevItemsSold);

  return {
    totalSales: currentSales,
    salesChange: salesVar.text,
    isSalesPositive: salesVar.isPositive,

    totalOrders: currentOrdersCount,
    ordersChange: ordersVar.text,
    isOrdersPositive: ordersVar.isPositive,

    averageOrderValue: currentAov,
    aovChange: aovVar.text,
    isAovPositive: aovVar.isPositive,

    newCustomersCount,
    customersChange: customersVar.text,
    isCustomersPositive: customersVar.isPositive,

    itemsSold: currentItemsSold,
    itemsSoldChange: itemsVar.text,
    isItemsPositive: itemsVar.isPositive,

    conversionRate: 'N/D',
    conversionRateExplanation: 'Données visiteurs insuffisantes',
  };
};
