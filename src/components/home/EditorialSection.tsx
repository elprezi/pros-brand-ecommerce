import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { INITIAL_LOOKBOOK } from '../../data/products';

export const EditorialSection: React.FC = () => {
  return (
    <section className="py-24 bg-pros-black text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">EDITORIAL & LIFESTYLE</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider mt-1">
              LOOKBOOK — SÉRIE 2026
            </h2>
          </div>
          <Link
            to="/lookbook"
            className="mt-4 md:mt-0 text-xs font-bold tracking-superwide uppercase text-pros-sand hover:text-white flex items-center space-x-2 transition-colors"
          >
            <span>DISCOVER FULL MAGAZINE</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {INITIAL_LOOKBOOK.map((item) => (
            <div
              key={item.id}
              className="group bg-pros-dark border border-white/10 overflow-hidden flex flex-col justify-between"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-black">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 text-[9px] uppercase font-bold text-pros-sand border border-white/10 backdrop-blur-md">
                  {item.season}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h3 className="font-display font-bold text-lg uppercase tracking-wider text-white group-hover:text-pros-sand transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-white/60">
                  {item.subtitle}
                </p>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-white/40 font-mono uppercase">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
