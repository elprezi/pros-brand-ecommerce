import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag, CheckCircle } from 'lucide-react';
import { useStore } from '../store/storeContext';

export const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateCartQuantity, formatPrice, validateAndApplyPromoCode } = useStore();
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; amount: number; isFreeShipping: boolean } | null>(null);
  const [promoError, setPromoError] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');

    const res = validateAndApplyPromoCode(promoInput, subtotal);
    if (!res.valid) {
      setPromoError(res.message || 'Code promo invalide.');
      return;
    }

    setAppliedPromo({
      code: res.promo?.code || promoInput.toUpperCase(),
      amount: res.discountAmount,
      isFreeShipping: res.isFreeShipping,
    });
    setPromoInput('');
  };

  const finalDiscount = appliedPromo ? appliedPromo.amount : 0;
  const estimatedTotal = Math.max(0, subtotal - finalDiscount);

  return (
    <div className="min-h-screen bg-pros-black text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="border-b border-white/10 pb-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold tracking-superwide uppercase text-pros-sand">RECAPITULATIF</span>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-wider mt-1">
              VOTRE PANIER ({cart.length})
            </h1>
          </div>
          <Link to="/shop" className="text-xs text-pros-sand hover:underline font-bold uppercase tracking-wider">
            ← CONTINUER VOS ACHATS
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="bg-pros-dark border border-white/10 p-16 text-center space-y-6 max-w-2xl mx-auto">
            <ShoppingBag size={64} className="mx-auto text-white/20" />
            <h2 className="font-display text-2xl font-bold uppercase">VOTRE PANIER EST ACTUELLEMENT VIDE</h2>
            <p className="text-xs text-white/60 uppercase tracking-wider">
              Découvrez la collection exclusive PROS et ajoutez des pièces d’exception à votre sélection.
            </p>
            <Link to="/shop" className="btn-pros-primary py-4 px-8 text-xs inline-block">
              EXPLORER LA COLLECTION
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Items Table */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-pros-dark border border-white/10 divide-y divide-white/10">
                {cart.map((item) => {
                  const currentImage = item.product.colors.find(c => c.name === item.color)?.images[0] || item.product.colors[0]?.images[0];
                  return (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex items-center space-x-4 w-full sm:w-auto">
                        <img
                          src={currentImage}
                          alt={item.product.name}
                          className="w-20 h-24 object-cover bg-black border border-white/10"
                        />
                        <div className="space-y-1">
                          <Link to={`/product/${item.product.slug}`} className="font-bold text-sm uppercase text-white hover:text-pros-sand transition-colors">
                            {item.product.name}
                          </Link>
                          <div className="text-xs text-white/50 space-x-3 font-mono">
                            <span>Couleur: <strong className="text-white">{item.color}</strong></span>
                            <span>•</span>
                            <span>Taille: <strong className="text-white">{item.size}</strong></span>
                          </div>
                          <div className="text-xs font-mono font-bold text-pros-sand sm:hidden pt-1">
                            {formatPrice(item.price)} / unité
                          </div>
                        </div>
                      </div>

                      {/* Quantity Adjuster */}
                      <div className="flex items-center justify-between w-full sm:w-auto space-x-6">
                        <div className="flex items-center border border-white/20 bg-black/40">
                          <button
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="px-3 py-1.5 text-white/70 hover:text-white"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-4 text-xs font-mono font-bold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="px-3 py-1.5 text-white/70 hover:text-white"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="text-right font-mono font-bold text-sm text-white">
                          {formatPrice(item.price * item.quantity)}
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-white/40 hover:text-red-400 p-2 transition-colors"
                          title="Supprimer la pièce"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security info banner */}
              <div className="bg-pros-dark p-4 border border-white/10 flex items-center space-x-3 text-xs text-white/70">
                <ShieldCheck size={20} className="text-pros-sand flex-shrink-0" />
                <span>Paiement 100% sécurisé via Wave, Orange Money et Carte Bancaire. Assistance client disponible sur WhatsApp.</span>
              </div>
            </div>

            {/* Right Summary Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-pros-dark border border-white/10 p-6 sm:p-8 space-y-6">
                <h2 className="font-display font-bold text-lg uppercase tracking-wider text-white border-b border-white/10 pb-4">
                  RÉCAPITULATIF COMMANDE
                </h2>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center space-x-1">
                    <Tag size={14} className="text-pros-sand" />
                    <span>CODE PROMO / RÉDUCTION</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Ex: PROS2026"
                      className="flex-1 bg-black border border-white/20 px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-pros-sand"
                    />
                    <button type="submit" className="btn-pros-secondary py-2 px-4 text-xs font-bold">
                      APPLIQUER
                    </button>
                  </div>
                  {promoError && <p className="text-[11px] text-red-400 font-mono">{promoError}</p>}
                  {appliedPromo && (
                    <p className="text-[11px] text-green-400 font-mono flex items-center space-x-1">
                      <CheckCircle size={12} />
                      <span>Code {appliedPromo.code} appliqué (-{formatPrice(appliedPromo.amount)})</span>
                    </p>
                  )}
                </form>

                {/* Subtotals breakdown */}
                <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                  <div className="flex justify-between text-white/70">
                    <span>Sous-total HT</span>
                    <span className="font-mono text-white">{formatPrice(subtotal)}</span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-green-400">
                      <span>Réduction ({appliedPromo.code})</span>
                      <span className="font-mono">-{formatPrice(appliedPromo.amount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-white/70">
                    <span>Estimation Livraison</span>
                    <span className="text-pros-sand font-medium">Calculée à l’étape suivante</span>
                  </div>

                  <div className="flex justify-between font-bold text-base text-white pt-4 border-t border-white/10">
                    <span>TOTAL ESTIMÉ</span>
                    <span className="font-mono text-pros-sand">{formatPrice(estimatedTotal)}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Link
                  to="/checkout"
                  className="w-full btn-pros-primary py-4 text-xs flex items-center justify-center space-x-2 shadow-2xl"
                >
                  <span>PASSER À LA COMMANDE</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
