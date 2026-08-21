import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, RefreshCw, Package, Plus } from 'lucide-react';
import { useStore } from '../store/storeContext';
import { ProductCard } from '../components/product/ProductCard';
import type { Category, ProductBadge, ProductSize } from '../types/ecommerce';

export const ShopPage: React.FC = () => {
  const { products } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Filter state reading from URL
  const selectedCategory = (searchParams.get('category') || 'all') as Category | 'all';
  const selectedBadge = (searchParams.get('badge') || 'all') as ProductBadge | 'all';
  const selectedSize = (searchParams.get('size') || 'all') as ProductSize | 'all';
  const selectedSort = searchParams.get('sort') || 'relevance';
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 100000;

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter handlers updating URL state
  const updateUrlParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearchParams({});
  };

  // Filter logic (Storefront rule: only display active published products)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Hide Draft and Archived products from public storefront
      const pStatus = p.status || 'ACTIVE';
      if (pStatus !== 'ACTIVE') return false;

      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedBadge !== 'all' && p.badge !== selectedBadge) return false;
      if (selectedSize !== 'all' && (!p.stockPerSize[selectedSize] || p.stockPerSize[selectedSize] === 0)) return false;
      if (p.price > maxPriceParam) return false;
      return true;
    }).sort((a, b) => {
      if (selectedSort === 'price-asc') return a.price - b.price;
      if (selectedSort === 'price-desc') return b.price - a.price;
      if (selectedSort === 'newest') return b.id.localeCompare(a.id);
      return 0;
    });
  }, [products, selectedCategory, selectedBadge, selectedSize, maxPriceParam, selectedSort]);

  return (
    <div className="min-h-screen bg-white text-pros-black pt-8 pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Breadcrumb Navigation */}
        <div className="text-xs text-neutral-500 space-x-2 font-sans uppercase">
          <Link to="/" className="hover:text-black transition-colors">ACCUEIL</Link>
          <span>/</span>
          <span className="text-black font-bold">BOUTIQUE OFFICIELLE</span>
          {selectedCategory !== 'all' && (
            <>
              <span>/</span>
              <span className="text-pros-gold font-bold uppercase">{selectedCategory}</span>
            </>
          )}
        </div>

        {/* Editorial Header (Light UI) */}
        <div className="border-b border-neutral-200 pb-8 space-y-3 font-sans">
          <span className="text-xs font-bold tracking-superwide uppercase text-pros-gold">
            COLLECTION EXCLUSIVE SÉNÉGAL
          </span>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-wider text-pros-black">
            {selectedCategory === 'all' ? 'TOUTE LA BOUTIQUE PROS' : `COLLECTION ${selectedCategory}`}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl font-sans">
            Découvrez le vestiaire contemporain PROS pensé pour associer élégance haute couture, coupe structurée et confort d'exception.
          </p>
        </div>

        {/* Control Bar (Sort, Filter Drawer trigger & Product count) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-pros-bone p-4 border border-neutral-200 text-xs font-sans">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-pros-black text-white font-bold uppercase tracking-wider text-xs font-sans"
            >
              <Filter size={14} />
              <span>FILTRER ({filteredProducts.length})</span>
            </button>

            <span className="text-neutral-600 font-sans">
              <strong>{filteredProducts.length}</strong> PIÈCES DISPONIBLES
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end font-sans">
            <span className="text-neutral-500 uppercase text-[11px]">TRIER PAR :</span>
            <select
              value={selectedSort}
              onChange={(e) => updateUrlParam('sort', e.target.value)}
              className="bg-white border border-neutral-300 text-black px-3 py-1.5 font-bold uppercase focus:outline-none focus:border-black cursor-pointer text-xs font-sans"
            >
              <option value="relevance">PERTINENCE</option>
              <option value="newest">NOUVEAUTÉS</option>
              <option value="price-asc">PRIX CROISSANT</option>
              <option value="price-desc">PRIX DÉCROISSANT</option>
            </select>
          </div>
        </div>

        {/* Main Grid & Desktop Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Desktop Left Filter Sidebar (Light UI) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-8 bg-pros-bone p-6 border border-neutral-200 font-sans text-xs">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
              <span className="font-bold uppercase tracking-wider text-black">FILTRES CATALOGUE</span>
              <button onClick={resetFilters} className="text-[10px] text-neutral-500 hover:text-black flex items-center gap-1 font-sans">
                <RefreshCw size={10} /> RÉINITIALISER
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <label className="font-bold uppercase text-black block">CATÉGORIES</label>
              <div className="space-y-1.5">
                {[
                  { label: 'TOUTES LES PIÈCES', val: 'all' },
                  { label: 'HOMME', val: 'homme' },
                  { label: 'FEMME', val: 'femme' },
                  { label: 'ACCESSOIRES', val: 'accessoires' },
                ].map((c) => (
                  <button
                    key={c.val}
                    onClick={() => updateUrlParam('category', c.val)}
                    className={`w-full text-left py-1.5 px-3 uppercase text-xs transition-colors font-sans ${
                      selectedCategory === c.val
                        ? 'bg-pros-black text-white font-bold'
                        : 'text-neutral-700 hover:bg-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge Filter */}
            <div className="space-y-3">
              <label className="font-bold uppercase text-black block">COLLECTION / BADGE</label>
              <div className="space-y-1.5">
                {[
                  { label: 'TOUS LES BADGES', val: 'all' },
                  { label: 'NOUVEAU', val: 'nouveau' },
                  { label: 'BEST-SELLER', val: 'bestseller' },
                  { label: 'ESSENTIEL', val: 'essentiel' },
                  { label: 'EXCLUSIF', val: 'exclusif' },
                ].map((b) => (
                  <button
                    key={b.val}
                    onClick={() => updateUrlParam('badge', b.val)}
                    className={`w-full text-left py-1.5 px-3 uppercase text-xs transition-colors font-sans ${
                      selectedBadge === b.val
                        ? 'bg-pros-black text-white font-bold'
                        : 'text-neutral-700 hover:bg-white'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="space-y-3">
              <label className="font-bold uppercase text-black block">TAILLES DISPONIBLES</label>
              <div className="grid grid-cols-3 gap-2 text-center font-sans">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => updateUrlParam('size', selectedSize === sz ? 'all' : sz)}
                    className={`py-2 border font-bold text-xs uppercase transition-colors font-sans ${
                      selectedSize === sz
                        ? 'bg-pros-black text-white border-pros-black'
                        : 'bg-white text-black border-neutral-300 hover:border-black'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Max Filter */}
            <div className="space-y-3 font-sans">
              <div className="flex justify-between font-bold text-black font-sans">
                <span>PRIX MAX :</span>
                <span>{new Intl.NumberFormat('fr-FR').format(maxPriceParam)} FCFA</span>
              </div>
              <input
                type="range"
                min="10000"
                max="100000"
                step="5000"
                value={maxPriceParam}
                onChange={(e) => updateUrlParam('maxPrice', e.target.value)}
                className="w-full accent-pros-black cursor-pointer"
              />
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="bg-pros-bone border border-neutral-200 p-12 text-center space-y-4 font-sans shadow-sm max-w-xl mx-auto my-8">
                <Package className="mx-auto text-neutral-400" size={48} />
                <h3 className="font-display text-xl font-bold uppercase text-black">CATALOGUE BIENTÔT DISPONIBLE</h3>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                  Votre catalogue officiel PROS est actuellement vide. Les nouvelles pièces exclusives de la collection seront publiées très prochainement.
                </p>
                <Link to="/admin/products" className="inline-flex items-center gap-2 px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase tracking-superwide hover:bg-neutral-800 transition-colors font-sans mt-2">
                  <Plus size={16} />
                  <span>AJOUTER UN PRODUIT DANS L'ADMIN</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer (Light UI) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end lg:hidden font-sans">
          <div className="w-80 bg-white h-full p-6 space-y-6 overflow-y-auto font-sans text-xs text-black border-l border-neutral-200">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
              <h3 className="font-display font-bold text-lg uppercase">FILTRER LES PRODUITS</h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="text-black p-1 font-bold">✕</button>
            </div>

            {/* Mobile Category */}
            <div className="space-y-2">
              <label className="font-bold uppercase text-black block">Catégorie</label>
              {['all', 'homme', 'femme', 'accessoires'].map((c) => (
                <button
                  key={c}
                  onClick={() => { updateUrlParam('category', c); setIsMobileFilterOpen(false); }}
                  className={`w-full text-left py-2 px-3 uppercase text-xs font-sans ${selectedCategory === c ? 'bg-black text-white font-bold' : 'bg-pros-bone text-black'}`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-4 bg-black text-white font-bold uppercase tracking-wider mt-4 font-sans"
            >
              VOIR LES RÉSULTATS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
