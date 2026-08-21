import React from 'react';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-pros-black text-white text-[11px] font-semibold tracking-wider py-2.5 px-4 border-b border-white/10 select-none">
      <div className="max-w-7xl mx-auto flex justify-between md:justify-center items-center gap-6 md:gap-12 text-center overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <Truck className="w-3.5 h-3.5 text-pros-sand" />
          <span className="uppercase tracking-widest text-white">LIVRAISON PARTOUT AU SÉNÉGAL</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <RotateCcw className="w-3.5 h-3.5 text-pros-sand" />
          <span className="uppercase tracking-widest text-white">RETOURS SOUS 14 JOURS</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-pros-sand" />
          <span className="uppercase tracking-widest text-white">PAIEMENT SÉCURISÉ</span>
        </div>
      </div>
    </div>
  );
};
