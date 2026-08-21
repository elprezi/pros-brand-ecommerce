import type { Order } from '../../../types/ecommerce';

export interface CustomerAnalytics {
  totalCustomersCount: number;
  newCustomersCount: number;
  repeatPurchaseRate: string;
}

export const getCustomerAnalytics = (orders: Order[]): CustomerAnalytics => {
  const customerEmails = new Set(orders.map((o) => o.customer.email.toLowerCase()));
  const emailCounts: Record<string, number> = {};

  orders.forEach((o) => {
    const email = o.customer.email.toLowerCase();
    emailCounts[email] = (emailCounts[email] || 0) + 1;
  });

  const repeatCustomers = Object.values(emailCounts).filter((c) => c > 1).length;
  const repeatRate = customerEmails.size > 0 ? ((repeatCustomers / customerEmails.size) * 100).toFixed(1) : '0';

  return {
    totalCustomersCount: customerEmails.size,
    newCustomersCount: customerEmails.size,
    repeatPurchaseRate: `${repeatRate}%`,
  };
};
