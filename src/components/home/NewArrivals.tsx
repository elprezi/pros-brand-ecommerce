import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../store/storeContext';
import { ProductCard } from '../product/ProductCard';

export const NewArrivals: React.FC = () => {
  const { products } = useStore();
  const [activeTab, setActiveTab] = useState<'TOUS' | 'HOMME' | 'FEMME' | 'ACCESSOIRES'>('TOUS');

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'HOMME') return p.category === 'homme';
    if (activeTab === 'FEMME') return p.category === 'femme';
    if (activeTab === 'ACCESSOIRES') return p.category === 'accessoires';
    return true;
  }).slice(0, 8);

  return (
    <section className="py-24 bg-pros-dark text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">PIÈCES EXCLUSIVES</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider mt-1">
              NOUVEAUTÉS & BEST-SELLERS
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            {(['TOUS', 'HOMME', 'FEMME', 'ACCESSOIRES'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold tracking-superwide uppercase transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* CTA to Shop */}
        <div className="text-center pt-8">
          <Link
            to="/shop"
            className="btn-pros-primary py-4 px-10 text-xs inline-flex items-center space-x-3"
          >
            <span>EXPLORER TOUT LE CATALOGUE</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};
