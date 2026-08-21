import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCms } from '../../store/cmsContext';

export const CollectionsSection: React.FC = () => {
  const { publishedCms } = useCms();
  const activeCollections = publishedCms.collections.filter((c) => c.status === 'ACTIVE');

  if (activeCollections.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-[#F7F6F2] text-black font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 gap-4 border-b border-neutral-200 font-sans">
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-superwide uppercase text-black">
            NOS COLLECTIONS
          </h2>
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 text-xs font-bold tracking-superwide uppercase text-black hover:text-pros-gold transition-colors font-sans"
          >
            <span>VOIR TOUTES LES COLLECTIONS</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Collections Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 font-sans">
          {activeCollections.map((col) => (
            <Link
              key={col.id}
              to={col.url}
              className="group relative h-[380px] overflow-hidden bg-neutral-900 shadow-lg hover:shadow-2xl transition-all duration-300 font-sans"
            >
              <img
                src={col.imageUrl}
                alt={col.imageAlt || col.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-8 space-y-2 text-white font-sans">
                <h3 className="font-display font-bold text-2xl tracking-superwide uppercase text-white group-hover:text-pros-gold transition-colors font-sans">
                  {col.title}
                </h3>
                <p className="text-xs font-medium text-neutral-300 font-sans">
                  {col.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
