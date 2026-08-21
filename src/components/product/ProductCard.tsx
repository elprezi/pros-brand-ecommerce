import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import type { Product } from '../../types/ecommerce';
import { useStore } from '../../store/storeContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { formatPrice, isInWishlist, toggleWishlist, addToCart } = useStore();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const isLiked = isInWishlist(product.id);
  const colorsList = product.colors && product.colors.length > 0 ? product.colors : [];
  const currentColor = colorsList[selectedColorIndex] || colorsList[0] || {
    name: 'Noir',
    hex: '#0A0A0A',
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800']
  };

  const primaryImage = currentColor?.images?.[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800';
  const secondaryImage = currentColor?.images?.[1] || primaryImage;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const availableSize = product.sizes.find(sz => (product.stockPerSize[sz] || 0) > 0) || product.sizes[0] || 'M';
    addToCart(product, currentColor.name, availableSize, 1);
    
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const badgeLabels: Record<string, { label: string; bg: string }> = {
    nouveau: { label: 'NOUVEAU', bg: 'bg-pros-black text-white font-bold' },
    bestseller: { label: 'BEST-SELLER', bg: 'bg-pros-gold text-black font-bold' },
    essentiel: { label: 'ESSENTIEL', bg: 'bg-neutral-200 text-black font-bold' },
    exclusif: { label: 'EXCLUSIF', bg: 'bg-pros-black text-white font-bold' },
  };

  const badgeMeta = product.badge ? badgeLabels[product.badge] : null;

  return (
    <div
      className="group relative bg-white border border-neutral-200 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg select-none font-sans"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Toast Notification upon quick add */}
      {addedToast && (
        <div className="absolute top-3 left-3 right-3 z-30 bg-pros-black text-white text-[10px] font-bold py-2 px-3 flex items-center justify-between uppercase font-mono animate-fade-in shadow-xl">
          <div className="flex items-center gap-1.5">
            <Check size={14} className="text-green-400" />
            <span>AJOUTÉ AU PANIER !</span>
          </div>
        </div>
      )}

      {/* Image Container on Light Bone Background */}
      <div className="relative aspect-[3/4] w-full bg-pros-bone overflow-hidden">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={isHovered ? secondaryImage : primaryImage}
            alt={product.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
          />
        </Link>

        {/* Badge Overlay */}
        {badgeMeta && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`px-2.5 py-1 text-[9px] tracking-widest uppercase ${badgeMeta.bg}`}>
              {badgeMeta.label}
            </span>
          </div>
        )}

        {/* Wishlist Icon Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 z-10 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 cursor-pointer ${
            isLiked
              ? 'bg-pros-black text-white shadow-lg'
              : 'bg-white/80 text-black hover:bg-pros-black hover:text-white'
          }`}
          aria-label="Ajouter aux favoris"
        >
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
        </button>

        {/* Quick Add CTA overlay */}
        <div className="absolute bottom-3 left-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleQuickAdd}
            className="w-full py-3 bg-pros-black text-white font-semibold text-xs tracking-superwide uppercase hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xl"
          >
            <ShoppingBag size={14} />
            <span>AJOUT RAPIDE</span>
          </button>
        </div>
      </div>

      {/* Card Information Content (Light UI) */}
      <div className="p-4 space-y-3 bg-white">
        {/* Category & Colors Swatches */}
        <div className="flex justify-between items-center text-[10px] uppercase font-mono text-neutral-500">
          <span>{product.category} • {product.subCategory}</span>
          {colorsList.length > 1 && (
            <div className="flex items-center gap-1.5">
              {colorsList.map((c, idx) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColorIndex(idx)}
                  className={`w-3 h-3 rounded-full border transition-transform ${
                    selectedColorIndex === idx ? 'scale-125 border-black' : 'border-neutral-300 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Title */}
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="font-display font-extrabold text-sm uppercase text-pros-black tracking-wider line-clamp-1 group-hover:text-pros-gold transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Pricing (Normal & Compare at Price) */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-pros-black">{formatPrice(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
            {product.sizes.length} TAILLES
          </span>
        </div>
      </div>
    </div>
  );
};
