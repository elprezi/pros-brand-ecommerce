import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, ArrowRight, Package } from 'lucide-react';
import { useStore } from '../store/storeContext';
import { ProductCard } from '../components/product/ProductCard';

export const SearchPage: React.FC = () => {
  const { products } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [inputQuery, setInputQuery] = useState(queryParam);

  useEffect(() => {
    setInputQuery(queryParam);
  }, [queryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      setSearchParams({ q: inputQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const searchResults = useMemo(() => {
    if (!queryParam.trim()) return [];
    const q = queryParam.toLowerCase().trim();

    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subCategory.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        (p.badge && p.badge.toLowerCase().includes(q))
      );
    });
  }, [products, queryParam]);

  return (
    <div className="min-h-screen bg-pros-black text-white pt-8 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb */}
        <div className="text-xs text-white/50 space-x-2 font-mono uppercase">
          <Link to="/" className="hover:text-white transition-colors">ACCUEIL</Link>
          <span>/</span>
          <span className="text-white font-bold">RECHERCHE</span>
        </div>

        {/* Search Header & Input Bar */}
        <div className="border-b border-white/10 pb-8 space-y-6 max-w-3xl">
          <div>
            <span className="text-xs font-bold tracking-superwide uppercase text-white/70">PROS SEARCH ENGINE</span>
            <h1 className="font-display text-3xl md:text-5xl font-black uppercase tracking-wider mt-1 text-white">
              RECHERCHE D’ARTICLES
            </h1>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
            <input
              type="text"
              placeholder="Tapez un produit, une catégorie (ex: Hoodie, Sweat, Casquette...)"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-white/20 pl-12 pr-32 py-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white font-mono"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-5 bg-white text-black font-extrabold text-xs uppercase tracking-superwide hover:bg-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>RECHERCHER</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>

        {/* Results Metadata */}
        {queryParam.trim() && (
          <div className="flex justify-between items-center text-xs font-mono border-b border-white/10 pb-4">
            <span className="text-white/70 uppercase">
              RÉSULTATS POUR : <strong className="text-white font-bold">"{queryParam}"</strong>
            </span>
            <span className="text-white/50">
              {searchResults.length} PIÈCE{searchResults.length > 1 ? 'S' : ''} TROUVÉE{searchResults.length > 1 ? 'S' : ''}
            </span>
          </div>
        )}

        {/* Search Results Display */}
        {!queryParam.trim() ? (
          <div className="bg-neutral-900 border border-white/10 p-12 text-center space-y-6">
            <Package size={48} className="mx-auto text-white/20" />
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold uppercase">ENTREZ UN MOT CLÉ POUR RECHERCHER</h3>
              <p className="text-xs text-white/60 max-w-sm mx-auto font-mono">
                Trouvez vos créations préférées de la maison PROS par nom, type de pièce ou couleur.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {['Hoodie', 'Sweatshirt', 'Polo', 'Casquette', 'Sac', 'Homme', 'Femme'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchParams({ q: tag })}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-mono text-white/80 hover:bg-white hover:text-black uppercase transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="bg-neutral-900 border border-white/10 p-12 text-center space-y-6">
            <Package size={48} className="mx-auto text-white/20" />
            <div className="space-y-2">
              <h3 className="font-display text-xl font-bold uppercase">AUCUNE PIÈCE CORRESPONDANTE</h3>
              <p className="text-xs text-white/60 max-w-sm mx-auto font-mono">
                Aucun article ne correspond à "{queryParam}". Vérifiez l’orthographe ou découvrez nos catégories principales.
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-2">
              <Link to="/shop?category=homme" className="btn-pros-primary text-xs py-3 px-6">
                EXPLORER HOMME
              </Link>
              <Link to="/shop?category=femme" className="btn-pros-secondary text-xs py-3 px-6">
                EXPLORER FEMME
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {searchResults.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
