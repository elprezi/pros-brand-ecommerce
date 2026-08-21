import React, { useState } from 'react';
import type { SalesBar } from '../../../lib/admin/analytics/dashboard';
import { BarChart2 } from 'lucide-react';

interface SalesChartProps {
  series: SalesBar[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ series }) => {
  const [chartMode, setChartMode] = useState<'jour' | 'semaine' | 'mois'>('jour');

  const totalSalesInSeries = series.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
      <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
        <div>
          <span className="text-[10px] font-bold text-pros-gold uppercase tracking-wider block">ANALYTIQUE VENTES</span>
          <h3 className="font-display font-bold text-sm uppercase text-pros-black tracking-wider">
            ÉVOLUTION DES VENTES (FCFA)
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-sans">
          <button
            onClick={() => setChartMode('jour')}
            className={`px-3 py-1 font-bold transition-colors cursor-pointer ${
              chartMode === 'jour' ? 'bg-pros-black text-white' : 'bg-pros-bone text-black hover:bg-neutral-200'
            }`}
          >
            JOUR
          </button>
          <button
            onClick={() => setChartMode('semaine')}
            className={`px-3 py-1 font-bold transition-colors cursor-pointer ${
              chartMode === 'semaine' ? 'bg-pros-black text-white' : 'bg-pros-bone text-black hover:bg-neutral-200'
            }`}
          >
            SEMAINE
          </button>
          <button
            onClick={() => setChartMode('mois')}
            className={`px-3 py-1 font-bold transition-colors cursor-pointer ${
              chartMode === 'mois' ? 'bg-pros-black text-white' : 'bg-pros-bone text-black hover:bg-neutral-200'
            }`}
          >
            MOIS
          </button>
        </div>
      </div>

      {totalSalesInSeries === 0 ? (
        <div className="h-52 flex flex-col items-center justify-center space-y-2 text-center p-6 bg-pros-bone border border-neutral-200 font-sans">
          <BarChart2 className="text-neutral-400" size={36} />
          <div className="font-bold text-black uppercase text-xs font-sans">AUCUNE VENTE ENREGISTRÉE</div>
          <p className="text-[11px] text-neutral-500 font-sans max-w-sm">
            Les données de ventes apparaîtront ici dès la première commande enregistrée.
          </p>
        </div>
      ) : (
        <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2">
          {series.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group font-sans">
              <span className="text-[9px] text-neutral-500 group-hover:text-black font-bold font-sans">
                {bar.formattedAmount}
              </span>
              <div
                className="w-full bg-pros-black group-hover:bg-pros-gold transition-colors duration-300 rounded-t-sm"
                style={{ height: `${bar.heightPercent}%` }}
              />
              <span className="text-[10px] text-neutral-600 font-bold font-sans">{bar.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
