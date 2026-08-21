import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface AdminKpiCardProps {
  title: string;
  value: string;
  change?: string;
  comparison?: string;
  icon: LucideIcon;
  isPositive?: boolean;
}

export const AdminKpiCard: React.FC<AdminKpiCardProps> = ({
  title,
  value,
  change,
  comparison = 'vs période précédente',
  icon: Icon,
  isPositive = true,
}) => {
  return (
    <div className="bg-white border border-neutral-200 p-5 space-y-3 font-sans shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
        <span>{title}</span>
        <Icon size={16} className="text-pros-black" />
      </div>
      <div className="font-display font-bold text-xl text-pros-black tracking-tight">{value}</div>
      {(change || comparison) && (
        <div className="flex items-center justify-between text-[10px] pt-2 border-t border-neutral-100">
          {change && (
            <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </span>
          )}
          {comparison && <span className="text-neutral-400">{comparison}</span>}
        </div>
      )}
    </div>
  );
};
