import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/storeContext';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, products, formatPrice } = useStore();
  const [query, setQuery] = useState('');

  if (!isSearchOpen) return null;

  const popularKeywords = ['Hoodie Oversize', 'Polo Luxe', 'Bomber', 'Casquette', 'Ensemble Sport', 'Bonnet'];

  const searchResults = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()) ||
          p.subCategory.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-pros-black/95 backdrop-blur-xl animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Close */}
        <div className="flex justify-between items-center pb-6 border-b border-white/10">
          <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">RECHERCHE INSTANTANÉE PROS</span>
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setQuery('');
            }}
            className="text-white/60 hover:text-white p-2"
          >
            <X size={28} />
          </button>
        </div>

        {/* Input Field */}
        <div className="relative mt-8">
          <Search size={28} className="absolute left-0 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Que recherchez-vous ? (Hoodie, Polo, Casquette, Noir...)"
            autoFocus
            className="w-full bg-transparent pl-12 pr-4 py-4 text-2xl md:text-3xl font-display font-bold text-white placeholder-white/20 border-b-2 border-white/20 focus:border-pros-sand focus:outline-none transition-colors"
          />
        </div>

        {/* Popular searches suggestions */}
        {!query && (
          <div className="mt-8 space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-white/40 uppercase">RECHERCHES POPULAIRES</h3>
            <div className="flex flex-wrap gap-2">
              {popularKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => setQuery(kw)}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-medium text-white/80 hover:bg-white hover:text-black transition-all"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {query && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-semibold text-white/60">
                {searchResults.length} RÉSULTAT{searchResults.length > 1 ? 'S' : ''} POUR "{query.toUpperCase()}"
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-12 text-center text-white/40 text-sm">
                Aucun produit ne correspond à votre recherche. Essayez un autre mot-clé.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setQuery('');
                    }}
                    className="group bg-pros-dark border border-white/10 overflow-hidden flex flex-col hover:border-pros-sand/50 transition-all"
                  >
                    <div className="h-48 overflow-hidden bg-black">
                      <img
                        src={product.colors[0]?.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <span className="text-[10px] tracking-wider uppercase text-pros-sand font-semibold">
                          {product.category}
                        </span>
                        <h4 className="text-xs font-bold uppercase text-white line-clamp-1 group-hover:text-pros-sand transition-colors">
                          {product.name}
                        </h4>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="text-xs font-mono font-bold text-white">
                          {formatPrice(product.price)}
                        </span>
                        <ArrowRight size={14} className="text-white/40 group-hover:text-pros-sand group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
