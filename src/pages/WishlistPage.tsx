import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useStore } from '../store/storeContext';
import { ProductCard } from '../components/product/ProductCard';

export const WishlistPage: React.FC = () => {
  const { wishlist, products } = useStore();

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-pros-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="border-b border-white/10 pb-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">PIÈCES FAVORITES</span>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-wider mt-1">
              MA WISHLIST ({savedProducts.length})
            </h1>
          </div>
          <Link to="/shop" className="text-xs text-pros-sand hover:underline font-bold uppercase tracking-wider">
            ← RETOUR AU CATALOGUE
          </Link>
        </div>

        {savedProducts.length === 0 ? (
          <div className="bg-pros-dark border border-white/10 p-16 text-center space-y-6 max-w-2xl mx-auto">
            <Heart size={64} className="mx-auto text-white/20" />
            <h2 className="font-display text-2xl font-bold uppercase">VOTRE WISHLIST EST VIDE</h2>
            <p className="text-xs text-white/60 uppercase tracking-wider">
              Sauvegardez vos articles coup de cœur en cliquant sur le cœur afin de les retrouver plus tard.
            </p>
            <Link to="/shop" className="btn-pros-primary py-4 px-8 text-xs inline-block">
              DÉCOUVRIR LE CATALOGUE
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {savedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
