import type { Order } from '../../../types/ecommerce';
import type { CategoryBreakdownItem } from './dashboard';

export const getCategoryBreakdown = (orders: Order[]): CategoryBreakdownItem[] => {
  let hommeAmount = 0;
  let femmeAmount = 0;
  let accessoiresAmount = 0;

  orders.forEach((o) => {
    if (o.paymentStatus !== 'failed') {
      o.items.forEach((it) => {
        const cat = it.product?.category?.toLowerCase();
        const lineTotal = (it.price || 0) * (it.quantity || 1);
        if (cat === 'homme') hommeAmount += lineTotal;
        else if (cat === 'femme') femmeAmount += lineTotal;
        else accessoiresAmount += lineTotal;
      });
    }
  });

  const grandTotal = hommeAmount + femmeAmount + accessoiresAmount;

  if (grandTotal === 0) {
    return [
      { name: 'HOMME', categoryKey: 'homme', amount: 0, formattedAmount: '0 FCFA', percentage: 0, colorClass: 'bg-pros-black' },
      { name: 'FEMME', categoryKey: 'femme', amount: 0, formattedAmount: '0 FCFA', percentage: 0, colorClass: 'bg-pros-sand' },
      { name: 'ACCESSOIRES', categoryKey: 'accessoires', amount: 0, formattedAmount: '0 FCFA', percentage: 0, colorClass: 'bg-pros-gold' },
    ];
  }

  const hommePct = Math.round((hommeAmount / grandTotal) * 100);
  const femmePct = Math.round((femmeAmount / grandTotal) * 100);
  const accessoiresPct = Math.max(0, 100 - hommePct - femmePct);

  return [
    {
      name: 'HOMME',
      categoryKey: 'homme',
      amount: hommeAmount,
      formattedAmount: `${hommeAmount.toLocaleString('fr-FR')} FCFA`,
      percentage: hommePct,
      colorClass: 'bg-pros-black',
    },
    {
      name: 'FEMME',
      categoryKey: 'femme',
      amount: femmeAmount,
      formattedAmount: `${femmeAmount.toLocaleString('fr-FR')} FCFA`,
      percentage: femmePct,
      colorClass: 'bg-pros-sand',
    },
    {
      name: 'ACCESSOIRES',
      categoryKey: 'accessoires',
      amount: accessoiresAmount,
      formattedAmount: `${accessoiresAmount.toLocaleString('fr-FR')} FCFA`,
      percentage: accessoiresPct,
      colorClass: 'bg-pros-gold',
    },
  ];
};
