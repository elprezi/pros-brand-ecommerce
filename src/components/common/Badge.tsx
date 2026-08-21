import React from 'react';
import type { ProductBadge } from '../../types/ecommerce';

interface BadgeProps {
  type: ProductBadge | 'epuise';
}

export const Badge: React.FC<BadgeProps> = ({ type }) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'nouveau':
        return 'bg-white text-black font-bold';
      case 'bestseller':
        return 'bg-pros-sand text-black font-bold';
      case 'exclusif':
        return 'bg-pros-gold text-black font-bold';
      case 'essentiel':
        return 'bg-white/10 text-white border border-white/20';
      case 'epuise':
        return 'bg-red-900/80 text-white font-bold border border-red-500/30';
      default:
        return 'bg-white/10 text-white';
    }
  };

  const getBadgeLabel = () => {
    switch (type) {
      case 'nouveau':
        return 'NOUVEAU';
      case 'bestseller':
        return 'BEST-SELLER';
      case 'exclusif':
        return 'EXCLUSIF';
      case 'essentiel':
        return 'ESSENTIEL';
      case 'epuise':
        return 'ÉPUISÉ';
      default:
        return type;
    }
  };

  return (
    <span className={`inline-block px-2.5 py-1 text-[10px] tracking-superwide uppercase ${getBadgeStyle()}`}>
      {getBadgeLabel()}
    </span>
  );
};
