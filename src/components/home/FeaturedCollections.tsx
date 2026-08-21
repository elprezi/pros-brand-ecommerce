import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const FeaturedCollections: React.FC = () => {
  const collections = [
    {
      title: 'HOMME',
      subtitle: 'Hoodies, Sweatshirts, Polos, Bombers & Ensembles',
      image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
      link: '/shop?category=homme',
      subcategories: ['Hoodies', 'Sweatshirts', 'Pulls', 'Polos', 'Vestes', 'Jogging']
    },
    {
      title: 'FEMME',
      subtitle: 'Silhouettes oversize, Ensembles sport & Hoodies Crop',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
      link: '/shop?category=femme',
      subcategories: ['Hoodies', 'Sweatshirts', 'Pulls', 'Polos', 'T-shirts', 'Leggings']
    },
    {
      title: 'ACCESSOIRES',
      subtitle: 'Casquettes 3D, Bonnets mérinos, Écharpes & Sacs',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
      link: '/shop?category=accessoires',
      subcategories: ['Casquettes', 'Bonnets', 'Écharpes', 'Sacs', 'Chaussettes', 'Gants']
    }
  ];

  return (
    <section id="collections" className="py-24 bg-pros-black text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">COLLECTIONS OFFICIELLES</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider mt-1">
              UNIVERS PROS
            </h2>
          </div>
          <Link
            to="/collections"
            className="mt-4 md:mt-0 text-xs font-bold tracking-superwide uppercase text-pros-sand hover:text-white flex items-center space-x-2 transition-colors"
          >
            <span>VOIR TOUTES LES COLLECTIONS</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((col) => (
            <Link
              key={col.title}
              to={col.link}
              className="group relative h-[520px] bg-pros-dark overflow-hidden border border-white/10 flex flex-col justify-between p-8 hover:border-pros-sand transition-all duration-500"
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <img
                  src={col.image}
                  alt={col.title}
                  className="w-full h-full object-cover opacity-50 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pros-black via-pros-black/40 to-transparent" />
              </div>

              {/* Top Category Badge */}
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-black/60 backdrop-blur-md text-[10px] font-bold tracking-superwide uppercase text-pros-sand border border-white/10">
                  {col.title}
                </span>
              </div>

              {/* Bottom Content Reveal */}
              <div className="relative z-10 space-y-4">
                <h3 className="font-display font-bold text-3xl tracking-wider text-white uppercase group-hover:text-pros-sand transition-colors">
                  {col.title}
                </h3>
                <p className="text-xs text-white/70 font-medium">
                  {col.subtitle}
                </p>

                {/* Subcategories Pills */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {col.subcategories.map((sub) => (
                    <span
                      key={sub}
                      className="px-2.5 py-1 bg-white/10 text-[9px] uppercase tracking-wider text-white/80 font-mono"
                    >
                      {sub}
                    </span>
                  ))}
                </div>

                <div className="pt-4 flex items-center space-x-2 text-xs font-bold tracking-superwide uppercase text-white group-hover:translate-x-2 transition-transform">
                  <span>DÉCOUVRIR</span>
                  <ArrowRight size={16} className="text-pros-sand" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
