import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers } from 'lucide-react';
import { useStore } from '../store/storeContext';

export const CollectionsPage: React.FC = () => {
  const { collections } = useStore();

  // Filter published & visible collections on store
  const publishedCollections = collections.filter(
    (c) => c.status === 'ACTIVE' && c.showOnStore
  );

  return (
    <div className="min-h-screen bg-pros-black text-white py-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="border-b border-white/10 pb-8 space-y-4">
          <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">EXPLORATION VISUELLE</span>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase tracking-wider">
            COLLECTIONS PROS
          </h1>
          <p className="text-xs sm:text-sm text-white/60 max-w-2xl uppercase tracking-wider">
            Chaque collection incarne une facette de l'univers PROS : du minimalisme de nos essentiels au luxe raffiné de la haute couture.
          </p>
        </div>

        {publishedCollections.length === 0 ? (
          <div className="bg-neutral-900 border border-white/10 p-16 text-center space-y-4">
            <Layers className="mx-auto text-pros-sand" size={48} />
            <h2 className="font-display font-bold text-2xl uppercase text-white">PROCHAINEMENT DISPONIBLE</h2>
            <p className="text-xs text-white/60 max-w-md mx-auto uppercase tracking-wider">
              Les collections officielles PROS sont actuellement en préparation dans nos ateliers. Revenez très bientôt.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold text-xs uppercase hover:bg-neutral-200"
            >
              <span>DECOUVRIR LE CATALOGUE</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {publishedCollections.map((col, idx) => (
              <div
                key={col.id}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-neutral-900 border border-white/10 overflow-hidden ${
                  idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className={`lg:col-span-7 h-[420px] overflow-hidden ${idx % 2 === 1 ? 'lg:order-2' : ''}`}>
                  {col.imageUrl ? (
                    <img
                      src={col.imageUrl}
                      alt={col.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 space-y-2">
                      <img src="/brand/LOGOPROS.png" alt="PROS" className="h-10 w-auto object-contain opacity-80" />
                      <span className="text-[10px] font-mono text-pros-sand font-bold tracking-widest uppercase">
                        PROS COLLECTION
                      </span>
                    </div>
                  )}
                </div>

                <div className={`lg:col-span-5 p-8 space-y-6 ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <span className="text-[10px] font-bold tracking-superwide uppercase text-pros-sand">
                    SÉLECTION EXCLUSIVE
                  </span>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-white">
                    {col.name}
                  </h2>
                  <p className="text-xs text-white/70 leading-relaxed uppercase tracking-wider">
                    {col.description}
                  </p>
                  <Link
                    to={`/shop?collection=${col.slug}`}
                    className="btn-pros-primary py-4 px-8 text-xs inline-flex items-center space-x-2"
                  >
                    <span>DÉCOUVRIR LA COLLECTION</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
