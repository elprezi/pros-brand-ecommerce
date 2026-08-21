import type { Order } from '../../../types/ecommerce';
import type { SalesBar } from './dashboard';

export const getSalesSeries = (orders: Order[], _period: string): SalesBar[] => {
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const dayTotals: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0 };

  orders.forEach((o) => {
    if (o.paymentStatus !== 'failed') {
      try {
        const d = new Date(o.createdAt);
        const dayIdx = (d.getDay() + 6) % 7;
        const dayName = dayNames[dayIdx];
        dayTotals[dayName] = (dayTotals[dayName] || 0) + o.total;
      } catch {
        // fallback
      }
    }
  });

  const maxAmount = Math.max(...Object.values(dayTotals));

  return dayNames.map((day) => {
    const amount = dayTotals[day] || 0;
    const heightPercent = maxAmount > 0 ? Math.round((amount / maxAmount) * 100) : 0;
    const formattedAmount =
      amount === 0
        ? '0 FCFA'
        : amount >= 1000000
        ? `${(amount / 1000000).toFixed(1)}M`
        : `${Math.round(amount / 1000)}k`;

    return {
      label: day,
      amount,
      formattedAmount,
      heightPercent,
    };
  });
};
