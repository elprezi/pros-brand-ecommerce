import type { Order, Product } from '../../../types/ecommerce';
import { getDashboardMetrics } from './metrics';
import { getSalesSeries } from './sales';
import { getCategoryBreakdown } from './categories';
import { getLowStockProducts } from './inventory';
import { getRecentActivity } from './activity';

export interface DashboardMetrics {
  totalSales: number;
  salesChange: string;
  isSalesPositive: boolean;
  
  totalOrders: number;
  ordersChange: string;
  isOrdersPositive: boolean;

  averageOrderValue: number;
  aovChange: string;
  isAovPositive: boolean;

  newCustomersCount: number;
  customersChange: string;
  isCustomersPositive: boolean;

  itemsSold: number;
  itemsSoldChange: string;
  isItemsPositive: boolean;

  conversionRate: string;
  conversionRateExplanation: string;
}

export interface SalesBar {
  label: string;
  amount: number;
  formattedAmount: string;
  heightPercent: number;
}

export interface CategoryBreakdownItem {
  name: string;
  categoryKey: string;
  amount: number;
  formattedAmount: string;
  percentage: number;
  colorClass: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  color: string;
  size: string;
  stock: number;
  isOutOfStock: boolean;
}

export interface ActivityEvent {
  id: string;
  text: string;
  time: string;
  type: 'order' | 'stock' | 'customer' | 'coupon' | 'review';
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'order' | 'stock' | 'review' | 'payment';
}

export interface DashboardData {
  metrics: DashboardMetrics;
  sales: SalesBar[];
  categories: CategoryBreakdownItem[];
  recentOrders: Order[];
  lowStock: LowStockItem[];
  activity: ActivityEvent[];
  notifications: AdminNotification[];
}

export { getDashboardMetrics, getSalesSeries, getCategoryBreakdown, getLowStockProducts, getRecentActivity };

/**
 * Master service returning all consolidated dashboard data
 */
export const getDashboardData = (orders: Order[], products: Product[], period = '7d'): DashboardData => {
  const metrics = getDashboardMetrics(orders, products, period);
  const sales = getSalesSeries(orders, period);
  const categories = getCategoryBreakdown(orders);
  const recentOrders = orders.slice(0, 5);
  const lowStock = getLowStockProducts(products, 3);
  const activity = getRecentActivity(orders, products);

  // Generate real notifications from store state
  const notifications: AdminNotification[] = [];
  const pendingOrders = orders.filter((o) => o.status === 'recue' || o.status === 'preparation');

  if (pendingOrders.length > 0) {
    notifications.push({
      id: 'notif-ord-1',
      title: 'Commandes à traiter',
      message: `${pendingOrders.length} commande(s) en attente de préparation ou d'expédition.`,
      time: 'Récemment',
      read: false,
      type: 'order',
    });
  }

  if (lowStock.length > 0) {
    notifications.push({
      id: 'notif-stk-1',
      title: 'Alerte stock faible',
      message: `${lowStock.length} variante(s) de produit en stock critique ou rupture.`,
      time: 'Aujourd\'hui',
      read: false,
      type: 'stock',
    });
  }

  return {
    metrics,
    sales,
    categories,
    recentOrders,
    lowStock,
    activity,
    notifications,
  };
};
