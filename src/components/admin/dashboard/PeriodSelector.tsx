import React from 'react';
import { Calendar } from 'lucide-react';

interface PeriodSelectorProps {
  value: string;
  onChange: (newPeriod: string) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2 bg-pros-bone border border-neutral-300 px-3.5 py-2 text-xs text-black shadow-sm font-sans">
      <Calendar size={14} className="text-neutral-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-black font-bold focus:outline-none cursor-pointer font-sans"
      >
        <option value="today" className="bg-white">Aujourd'hui</option>
        <option value="yesterday" className="bg-white">Hier</option>
        <option value="7d" className="bg-white">7 derniers jours</option>
        <option value="30d" className="bg-white">30 derniers jours</option>
        <option value="month" className="bg-white">Ce mois</option>
        <option value="prev_month" className="bg-white">Mois précédent</option>
        <option value="year" className="bg-white">Cette année</option>
        <option value="custom" className="bg-white">Période personnalisée</option>
      </select>
    </div>
  );
};
