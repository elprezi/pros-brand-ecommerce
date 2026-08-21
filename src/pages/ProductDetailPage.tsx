import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, Heart, ShoppingBag, Check } from 'lucide-react';
import { useStore } from '../store/storeContext';
import { ProductCard } from '../components/product/ProductCard';
import type { ProductSize } from '../types/ecommerce';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, formatPrice, addToCart, isInWishlist, toggleWishlist } = useStore();

  const product = products.find((p) => p.slug === slug) || products[0];

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize>('M');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToast, setAddedToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'materials' | 'care'>('desc');

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-pros-black flex flex-col justify-center items-center p-6 font-mono">
        <h2 className="text-xl font-bold uppercase mb-4">ARTICLE INTROUVABLE</h2>
        <Link to="/shop" className="btn-pros-primary text-xs py-3 px-6">RETOURNER À LA BOUTIQUE</Link>
      </div>
    );
  }

  const colorsList = product.colors && product.colors.length > 0 ? product.colors : [];
  const currentColor = colorsList[selectedColorIndex] || colorsList[0] || {
    name: 'Noir',
    hex: '#0A0A0A',
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800']
  };

  const images = currentColor?.images || ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'];
  const currentImage = images[selectedImageIndex] || images[0];
  const isLiked = isInWishlist(product.id);

  const currentSizeStock = product.stockPerSize?.[selectedSize] ?? 5;

  const handleAddToCart = () => {
    addToCart(product, currentColor.name, selectedSize, 1);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const relatedProducts = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <div className="min-h-screen bg-white text-pros-black pt-6 pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Breadcrumb */}
        <div className="text-xs text-neutral-500 space-x-2 font-mono uppercase">
          <Link to="/" className="hover:text-black transition-colors">ACCUEIL</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-black transition-colors">BOUTIQUE</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-black transition-colors">{product.category}</Link>
          <span>/</span>
          <span className="text-black font-bold uppercase">{product.name}</span>
        </div>

        {/* Added Toast Banner */}
        {addedToast && (
          <div className="p-4 bg-pros-black text-white text-xs font-mono font-bold flex justify-between items-center animate-fade-in shadow-xl">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-green-400" />
              <span>PIÈCE AJOUTÉE AVEC SUCCÈS AU PANIER !</span>
            </div>
            <button onClick={() => navigate('/cart')} className="underline text-pros-sand font-bold uppercase">
              VOIR LE PANIER &rarr;
            </button>
          </div>
        )}

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          
          {/* Left Column: Image Gallery on Light Bone Background */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[3/4] w-full bg-pros-bone border border-neutral-200 overflow-hidden">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`aspect-[3/4] border overflow-hidden bg-pros-bone ${
                      selectedImageIndex === idx ? 'border-pros-black ring-1 ring-pros-black' : 'border-neutral-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Detail Info (Light UI) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Title & Price */}
            <div className="space-y-3 pb-6 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[9px] font-bold bg-pros-black text-white uppercase font-mono tracking-widest">
                  {product.badge || 'PROS OFFICIAL'}
                </span>
                <span className="text-xs text-neutral-500 font-mono uppercase">{product.category} • {product.subCategory}</span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-wider text-pros-black leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 font-mono pt-2">
                <span className="text-xl font-bold text-pros-black">{formatPrice(product.price)}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-neutral-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Color Swatches Selection */}
            {colorsList.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold uppercase text-black">COULEUR :</span>
                  <span className="text-neutral-600">{currentColor.name}</span>
                </div>
                <div className="flex gap-3">
                  {colorsList.map((col, idx) => (
                    <button
                      key={col.name}
                      onClick={() => { setSelectedColorIndex(idx); setSelectedImageIndex(0); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                        selectedColorIndex === idx ? 'border-pros-black scale-110 shadow-md' : 'border-neutral-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono">
                <span className="font-bold uppercase text-black">TAILLE :</span>
                <span className="text-neutral-600 font-bold">{selectedSize}</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {product.sizes.map((sz) => {
                  const stock = product.stockPerSize?.[sz] || 0;
                  const isAvailable = stock > 0;

                  return (
                    <button
                      key={sz}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(sz)}
                      className={`py-3 border text-xs font-mono font-bold uppercase transition-all ${
                        selectedSize === sz
                          ? 'bg-pros-black text-white border-pros-black shadow-md'
                          : isAvailable
                          ? 'bg-white text-black border-neutral-300 hover:border-black'
                          : 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed line-through'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock Availability Indicator */}
            <div className="text-xs font-mono">
              {currentSizeStock > 3 ? (
                <span className="text-green-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> EN STOCK — EXPÉDITION SOUS 24H
                </span>
              ) : currentSizeStock > 0 ? (
                <span className="text-amber-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> STOCK LIMITÉ ({currentSizeStock} PIÈCES RESTANTES)
                </span>
              ) : (
                <span className="text-red-600 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> RUPTURE DE STOCK SUR CETTE TAILLE
                </span>
              )}
            </div>

            {/* CTAs: Add to Cart & Wishlist */}
            <div className="flex gap-4 pt-2">
              <button
                disabled={currentSizeStock === 0}
                onClick={handleAddToCart}
                className="flex-1 py-4 bg-pros-black text-white font-extrabold text-xs tracking-superwide uppercase hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={16} />
                <span>{currentSizeStock === 0 ? 'ÉPUISÉ' : 'AJOUTER AU PANIER'}</span>
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-4 border border-neutral-300 transition-colors cursor-pointer ${
                  isLiked ? 'bg-pros-black text-white' : 'bg-white text-black hover:bg-neutral-100'
                }`}
                title="Favoris"
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200 text-[11px] font-mono text-neutral-600 text-center">
              <div className="flex flex-col items-center gap-1">
                <Truck size={18} className="text-pros-black" />
                <span>Livraison Sénégal</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw size={18} className="text-pros-black" />
                <span>Retours 14 jours</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck size={18} className="text-pros-black" />
                <span>100% Authentique</span>
              </div>
            </div>

            {/* Tabs for Description & Care */}
            <div className="pt-6 border-t border-neutral-200 space-y-4">
              <div className="flex border-b border-neutral-200 text-xs font-mono uppercase">
                <button
                  onClick={() => setActiveTab('desc')}
                  className={`py-2 px-4 font-bold ${activeTab === 'desc' ? 'border-b-2 border-pros-black text-black' : 'text-neutral-500'}`}
                >
                  DESCRIPTION
                </button>
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`py-2 px-4 font-bold ${activeTab === 'materials' ? 'border-b-2 border-pros-black text-black' : 'text-neutral-500'}`}
                >
                  COMPOSITION
                </button>
                <button
                  onClick={() => setActiveTab('care')}
                  className={`py-2 px-4 font-bold ${activeTab === 'care' ? 'border-b-2 border-pros-black text-black' : 'text-neutral-500'}`}
                >
                  ENTRETIEN
                </button>
              </div>

              <div className="text-xs text-neutral-700 font-mono leading-relaxed">
                {activeTab === 'desc' && <p>{product.description}</p>}
                {activeTab === 'materials' && <p><strong>Matière :</strong> {product.material}<br /><strong>Coupe :</strong> {product.fit}</p>}
                {activeTab === 'care' && <p><strong>Entretien :</strong> {product.care}</p>}
              </div>
            </div>

          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pt-16 border-t border-neutral-200 space-y-8">
            <h2 className="font-display font-black text-2xl uppercase tracking-superwide text-pros-black">
              VOUS AIMEREZ AUSSI
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
