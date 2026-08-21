import React from 'react';
import type { CategoryBreakdownItem } from '../../../lib/admin/analytics/dashboard';
import { PieChart } from 'lucide-react';

interface CategoryBreakdownProps {
  categories: CategoryBreakdownItem[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categories }) => {
  const totalCategorySales = categories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
      <div className="pb-4 border-b border-neutral-200">
        <span className="text-[10px] font-bold text-pros-gold uppercase tracking-wider block">RÉPARTITION COMMERCIAL</span>
        <h3 className="font-display font-bold text-sm uppercase text-pros-black tracking-wider">
          RÉPARTITION PAR CATÉGORIE
        </h3>
      </div>

      {totalCategorySales === 0 ? (
        <div className="p-6 bg-pros-bone border border-neutral-200 text-center space-y-2 font-sans">
          <PieChart className="mx-auto text-neutral-400" size={32} />
          <div className="font-bold text-black uppercase text-xs">AUCUNE VENTE ENREGISTRÉE</div>
          <p className="text-[11px] text-neutral-500">Les ventes par catégorie s'afficheront dès vos premières commandes.</p>
        </div>
      ) : (
        <div className="space-y-5 font-sans">
          {categories.map((cat) => (
            <div key={cat.name} className="space-y-1.5 font-sans">
              <div className="flex justify-between text-xs font-bold font-sans">
                <span className="text-black uppercase">{cat.name}</span>
                <span className="text-neutral-700">{cat.percentage}% ({cat.formattedAmount})</span>
              </div>
              <div className="w-full h-2.5 bg-neutral-100 overflow-hidden">
                <div
                  className={`h-full ${cat.colorClass} transition-all duration-500`}
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
