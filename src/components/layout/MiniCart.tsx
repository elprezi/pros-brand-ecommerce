import React from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/storeContext';

export const MiniCart: React.FC = () => {
  const { cart, isMiniCartOpen, setIsMiniCartOpen, removeFromCart, updateCartQuantity, formatPrice, settings } = useStore();

  if (!isMiniCartOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingNeeded = Math.max(0, settings.freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / settings.freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsMiniCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-pros-dark border-l border-white/10 text-white shadow-2xl flex flex-col justify-between animate-fade-in">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ShoppingBag size={20} className="text-pros-sand" />
              <h2 className="font-display text-lg font-bold tracking-wider uppercase">MON PANIER</h2>
              <span className="bg-white/10 px-2 py-0.5 text-xs font-mono text-white/70">
                {cart.length}
              </span>
            </div>
            <button
              onClick={() => setIsMiniCartOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X size={24} />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="bg-pros-black px-6 py-3 border-b border-white/5">
            {freeShippingNeeded > 0 ? (
              <p className="text-xs text-white/70">
                Plus que <span className="text-pros-sand font-semibold">{formatPrice(freeShippingNeeded)}</span> pour la livraison OFFERTE partout au Sénégal !
              </p>
            ) : (
              <p className="text-xs text-green-400 font-semibold flex items-center space-x-1">
                <span>✓</span>
                <span>Félicitations ! Vous bénéficiez de la LIVRAISON OFFERTE.</span>
              </p>
            )}
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-pros-sand h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-white/5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <ShoppingBag size={48} className="text-white/20" />
                <p className="text-sm font-medium text-white/60">Votre panier est actuellement vide.</p>
                <button
                  onClick={() => setIsMiniCartOpen(false)}
                  className="btn-pros-primary text-xs"
                >
                  DÉCOUVRIR LA COLLECTION
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const currentImage = item.product.colors.find(c => c.name === item.color)?.images[0] || item.product.colors[0]?.images[0];
                return (
                  <div key={item.id} className="pt-6 first:pt-0 flex space-x-4">
                    <img
                      src={currentImage}
                      alt={item.product.name}
                      className="w-20 h-24 object-cover bg-pros-black border border-white/10"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs font-bold text-white tracking-wide uppercase line-clamp-1">
                            {item.product.name}
                          </h3>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-white/40 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="text-[11px] text-white/50 space-x-2 mt-1">
                          <span>Couleur: {item.color}</span>
                          <span>•</span>
                          <span>Taille: {item.size}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center border border-white/20 bg-black/40">
                          <button
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="p-1 text-white/70 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 text-xs font-mono font-bold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="p-1 text-white/70 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <span className="text-xs font-bold font-mono text-pros-sand">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer CTAs */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-pros-black space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-white/70">
                  <span>Sous-total</span>
                  <span className="font-mono text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Livraison</span>
                  <span className="text-pros-sand font-medium">Calculée au checkout</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-white/10">
                  <span>TOTAL ESTIMA.</span>
                  <span className="font-mono text-pros-sand">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/cart"
                  onClick={() => setIsMiniCartOpen(false)}
                  className="btn-pros-secondary text-center text-[11px] py-3.5"
                >
                  VOIR LE PANIER
                </Link>
                <Link
                  to="/checkout"
                  onClick={() => setIsMiniCartOpen(false)}
                  className="btn-pros-primary text-center text-[11px] py-3.5 flex items-center justify-center space-x-1"
                >
                  <span>COMMANDER</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
