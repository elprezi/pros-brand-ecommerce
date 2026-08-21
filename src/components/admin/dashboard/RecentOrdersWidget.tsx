import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Order } from '../../../types/ecommerce';
import { useStore } from '../../../store/storeContext';

interface RecentOrdersWidgetProps {
  orders: Order[];
}

export const RecentOrdersWidget: React.FC<RecentOrdersWidgetProps> = ({ orders }) => {
  const { formatPrice } = useStore();
  const navigate = useNavigate();

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'recue':
        return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-300 uppercase font-sans">REÇUE</span>;
      case 'preparation':
        return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase font-sans">EN PRÉPARATION</span>;
      case 'expedie':
      case 'transit':
        return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 uppercase font-sans">EXPÉDIÉE</span>;
      case 'livree':
        return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-green-100 text-green-800 border border-green-300 uppercase font-sans">LIVRÉE</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-800 border uppercase font-sans">{status}</span>;
    }
  };

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold text-pros-gold uppercase tracking-wider block">SUIVI DIRECT</span>
          <h3 className="font-display font-bold text-sm uppercase text-pros-black tracking-wider">
            COMMANDES RÉCENTES
          </h3>
        </div>
        <Link to="/admin/orders" className="text-xs text-black hover:text-pros-gold flex items-center gap-1 font-bold font-sans">
          <span>VOIR TOUT</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-pros-bone text-neutral-600 uppercase border-b border-neutral-200 text-[10px] font-bold">
            <tr>
              <th className="py-3 px-3 font-sans">N° Commande</th>
              <th className="py-3 px-3 font-sans">Client</th>
              <th className="py-3 px-3 font-sans">Montant</th>
              <th className="py-3 px-3 text-right font-sans">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-black">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-neutral-500 font-sans bg-pros-bone">
                  Aucune commande enregistrée.
                </td>
              </tr>
            ) : (
              orders.slice(0, 5).map((ord) => (
                <tr
                  key={ord.id}
                  onClick={() => navigate('/admin/orders')}
                  className="hover:bg-pros-bone transition-colors font-sans cursor-pointer"
                >
                  <td className="py-3 px-3 font-bold text-black font-mono">{ord.id}</td>
                  <td className="py-3 px-4 uppercase font-sans">
                    {ord.customer.firstName} {ord.customer.lastName}
                  </td>
                  <td className="py-3 px-3 font-bold font-sans">{formatPrice(ord.total)}</td>
                  <td className="py-3 px-3 text-right font-sans">
                    {getStatusBadge(ord.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
