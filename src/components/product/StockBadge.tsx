import React from 'react';

interface StockBadgeProps {
  stockCount: number;
}

export const StockBadge: React.FC<StockBadgeProps> = ({ stockCount }) => {
  if (stockCount === 0) {
    return (
      <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span>ÉPUISÉ</span>
      </span>
    );
  }

  if (stockCount <= 5) {
    return (
      <span className="text-xs font-bold uppercase tracking-wider text-pros-sand flex items-center space-x-1.5">
        <span className="w-2 h-2 rounded-full bg-pros-sand animate-pulse" />
        <span>PLUS QUE {stockCount} DISPONIBLES</span>
      </span>
    );
  }

  return (
    <span className="text-xs font-medium uppercase tracking-wider text-green-400 flex items-center space-x-1.5">
      <span className="w-2 h-2 rounded-full bg-green-500" />
      <span>EN STOCK — EXPÉDITION 24H</span>
    </span>
  );
};
