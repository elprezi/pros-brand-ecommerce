import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-pros-dark border border-white/10 overflow-hidden flex flex-col justify-between animate-pulse">
      <div className="aspect-[3/4] w-full bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-white/10 w-1/3 rounded-none" />
        <div className="h-4 bg-white/10 w-3/4 rounded-none" />
        <div className="flex items-center space-x-2 pt-1">
          <div className="w-3.5 h-3.5 rounded-full bg-white/10" />
          <div className="w-3.5 h-3.5 rounded-full bg-white/10" />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <div className="h-4 bg-white/10 w-1/2 rounded-none" />
          <div className="h-3 bg-white/10 w-1/4 rounded-none" />
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};
