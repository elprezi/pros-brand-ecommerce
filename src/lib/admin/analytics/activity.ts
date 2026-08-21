import type { Order, Product } from '../../../types/ecommerce';
import type { ActivityEvent } from './dashboard';

export const getRecentActivity = (orders: Order[], products: Product[]): ActivityEvent[] => {
  const events: ActivityEvent[] = [];

  // Real Order Events
  orders.slice(0, 5).forEach((o) => {
    events.push({
      id: `act-ord-${o.id}`,
      text: `Nouvelle commande #${o.id} par ${o.customer.firstName} ${o.customer.lastName} (${o.total.toLocaleString('fr-FR')} FCFA)`,
      time: 'Récemment',
      type: 'order',
    });
  });

  // Real Out-of-Stock Events
  products.forEach((p) => {
    Object.entries(p.stockPerSize || {}).forEach(([sz, stock]) => {
      if (stock === 0) {
        events.push({
          id: `act-stk-${p.id}-${sz}`,
          text: `Alerte rupture de stock : ${p.name} (Taille ${sz})`,
          time: 'Aujourd\'hui',
          type: 'stock',
        });
      }
    });
  });

  return events;
};
