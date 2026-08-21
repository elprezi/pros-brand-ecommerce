import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { INITIAL_LOOKBOOK } from '../data/products';

export const LookbookPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-pros-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="border-b border-white/10 pb-8 text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">EDITORIAL FASHION MAGAZINE</span>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase tracking-ultra">
            LOOKBOOK PROS 2026
          </h1>
          <p className="text-xs sm:text-sm text-white/70 uppercase tracking-widest leading-relaxed">
            Une immersion photographique dans l’univers streetwear & haute couture de la marque. Conçu et mis en scène à Dakar.
          </p>
        </div>

        {/* Masonry / Editorial Spreads */}
        <div className="space-y-24">
          {INITIAL_LOOKBOOK.map((item) => (
            <div key={item.id} className="space-y-8">
              <div className="relative h-[650px] w-full bg-pros-dark overflow-hidden border border-white/10 group">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pros-black via-pros-black/20 to-transparent" />
                <div className="absolute bottom-12 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-2 max-w-xl">
                    <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">{item.season}</span>
                    <h2 className="font-display text-3xl sm:text-5xl font-extrabold uppercase text-white drop-shadow-lg">
                      {item.title}
                    </h2>
                    <p className="text-xs text-white/80 uppercase tracking-wider">{item.subtitle}</p>
                  </div>

                  <Link
                    to={`/product/${item.featuredProductIds[0] || 'hoodie-oversize-pros-blanc'}`}
                    className="btn-pros-primary py-4 px-8 text-xs flex items-center space-x-2 shadow-2xl"
                  >
                    <span>VOIR LA SILHOUETTE</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
