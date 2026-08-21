import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Tag, FileText, Image as ImageIcon, Warehouse, ShoppingBag } from 'lucide-react';

export const QuickActionsWidget: React.FC = () => {
  const actions = [
    { label: 'PUBLIER PRODUIT', path: '/admin/products', icon: Plus },
    { label: 'CRÉER COUPON', path: '/admin/coupons', icon: Tag },
    { label: 'AJUSTER STOCK', path: '/admin/inventory', icon: Warehouse },
    { label: 'VOIR COMMANDES', path: '/admin/orders', icon: ShoppingBag },
    { label: 'RAPPORTS', path: '/admin/reports', icon: FileText },
    { label: 'BANNIÈRES CMS', path: '/admin/marketing/homepage', icon: ImageIcon },
  ];

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
      <div className="pb-3 border-b border-neutral-200">
        <span className="text-[10px] font-bold text-pros-gold uppercase tracking-wider block">RACCOURCIS EXÉCUTIFS</span>
        <h3 className="font-display font-bold text-sm uppercase text-pros-black tracking-wider">
          ACTIONS RAPIDES
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-sans">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.label}
              to={act.path}
              className="p-3 bg-pros-bone hover:bg-pros-black hover:text-white border border-neutral-300 flex flex-col items-center gap-2 text-center text-black transition-all font-bold shadow-sm group font-sans cursor-pointer"
            >
              <Icon size={18} className="group-hover:scale-110 transition-transform" />
              <span>{act.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
