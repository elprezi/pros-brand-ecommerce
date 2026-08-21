import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, PackageX } from 'lucide-react';
import type { LowStockItem } from '../../../lib/admin/analytics/dashboard';

interface LowStockWidgetProps {
  items: LowStockItem[];
}

export const LowStockWidget: React.FC<LowStockWidgetProps> = ({ items }) => {
  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
      <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle size={18} />
          <h3 className="font-display font-bold text-sm uppercase text-pros-black tracking-wider">
            STOCK FAIBLE ({items.length})
          </h3>
        </div>
        <Link to="/admin/inventory" className="text-xs text-black hover:text-pros-gold flex items-center gap-1 font-bold">
          <span>VOIR LE STOCK</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="space-y-2 text-xs font-sans">
        {items.length === 0 ? (
          <div className="text-center py-6 text-neutral-500 font-sans bg-pros-bone border border-neutral-200 p-4">
            Aucune alerte de stock.
          </div>
        ) : (
          items.slice(0, 5).map((item) => {
            const isCritical = item.stock === 1;
            const isOut = item.stock === 0;

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2.5 border transition-colors ${
                  isOut
                    ? 'bg-red-50 border-red-200'
                    : isCritical
                    ? 'bg-amber-50 border-amber-300 font-bold'
                    : 'bg-pros-bone border-neutral-200'
                }`}
              >
                <div>
                  <div className="font-bold text-black uppercase font-sans">{item.name}</div>
                  <div className="text-[10px] text-neutral-500 font-sans">
                    {item.color} · Taille {item.size}
                  </div>
                </div>

                {isOut ? (
                  <span className="px-2.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase flex items-center gap-1 font-sans">
                    <PackageX size={10} />
                    RUPTURE
                  </span>
                ) : isCritical ? (
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 font-mono">
                    CRITIQUE ({item.stock})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 font-mono">
                    {item.stock} dispo
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
