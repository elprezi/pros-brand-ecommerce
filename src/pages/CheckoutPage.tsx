import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Globe, Loader2 } from 'lucide-react';
import { useStore } from '../store/storeContext';
import { useAuth } from '../store/authContext';
import type { DeliveryMethod, PaymentMethod, Order } from '../types/ecommerce';
import {
  ALL_COUNTRIES,
  ALL_CURRENCIES,
  apiCalculateInternationalShipping,
  formatCurrencyPrice,
  convertPriceFromXOF,
} from '../lib/server/internationalApi';
import type { CurrencyCode } from '../types/international';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, addOrder, clearCart, formatPrice } = useStore();
  const { currentUser } = useAuth();

  const [selectedCountryIso, setSelectedCountryIso] = useState('SN');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('XOF');

  const selectedCountry = ALL_COUNTRIES.find((c) => c.isoCode === selectedCountryIso) || ALL_COUNTRIES[0];

  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: selectedCountry.phoneCode + ' ',
    address: '',
    city: selectedCountry.isoCode === 'SN' ? 'Dakar' : '',
    region: selectedCountry.isoCode === 'SN' ? 'Dakar' : '',
    country: selectedCountry.name,
    postalCode: '',
    notes: '',
  });

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('dakar_express');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wave');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update country metadata when country selection changes
  useEffect(() => {
    const countryObj = ALL_COUNTRIES.find((c) => c.isoCode === selectedCountryIso) || ALL_COUNTRIES[0];
    setCustomer((prev) => ({
      ...prev,
      country: countryObj.name,
      phone: prev.phone.startsWith('+') ? prev.phone : countryObj.phoneCode + ' ',
      city: countryObj.isoCode === 'SN' ? 'Dakar' : prev.city,
    }));

    // Auto-select currency
    if (countryObj.defaultCurrency) {
      setSelectedCurrency(countryObj.defaultCurrency);
    }
  }, [selectedCountryIso]);

  const subtotalXOF = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Dynamic International Shipping Cost Calculation (Section 9)
  const shippingInfo = apiCalculateInternationalShipping(
    selectedCountryIso,
    subtotalXOF,
    deliveryMethod === 'dakar_express' ? 'EXPRESS' : 'STANDARD'
  );

  const finalShippingCostXOF = deliveryMethod === 'boutique_pickup' ? 0 : shippingInfo.shippingCostXOF;

  // Taxes calculation (Section 10)
  const taxRate = selectedCountry.taxRate || 0.18;
  const taxAmountXOF = Math.round(subtotalXOF * (taxRate / (1 + taxRate)));

  const grandTotalXOF = subtotalXOF + finalShippingCostXOF;

  // Display Amount in selected currency
  const displaySubtotal = convertPriceFromXOF(subtotalXOF, selectedCurrency);
  const displayShipping = convertPriceFromXOF(finalShippingCostXOF, selectedCurrency);
  const displayGrandTotal = convertPriceFromXOF(grandTotalXOF, selectedCurrency);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.firstName || !customer.lastName || !customer.phone || !customer.address) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires (Nom, Prénom, Téléphone, Adresse).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    setTimeout(() => {
      const trackingCode = `PROS-${selectedCountryIso}-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const currObj = ALL_CURRENCIES.find((c) => c.code === selectedCurrency) || ALL_CURRENCIES[0];

      const newOrder: Order = {
        id: orderId,
        trackingNumber: trackingCode,
        createdAt: new Date().toISOString(),
        userId: currentUser?.id,
        customer: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email || currentUser?.email || 'client@pros.sn',
          phone: customer.phone,
          address: customer.address,
          city: customer.city || 'Dakar',
          region: customer.region || customer.city || 'Dakar',
          country: customer.country,
          notes: customer.notes,
        },
        items: [...cart],
        subtotal: subtotalXOF,
        shippingCost: finalShippingCostXOF,
        taxAmount: taxAmountXOF,
        discount: 0,
        total: grandTotalXOF,
        currency: selectedCurrency,
        exchangeRate: currObj.exchangeRateToBase,
        baseTotalXOF: grandTotalXOF,
        deliveryMethod,
        paymentMethod,
        paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
        status: 'recue',
      };

      addOrder(newOrder);
      clearCart();
      setIsSubmitting(false);

      navigate(`/order-tracking?tracking=${trackingCode}`);
    }, 800);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white py-20 px-4 font-sans text-center text-[#0A0A0A]">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="font-display text-2xl font-bold uppercase">VOTRE PANIER EST VIDE</h2>
          <p className="text-xs text-[#777777]">Ajoutez des articles à votre panier avant de passer commande.</p>
          <Link
            to="/shop"
            className="inline-block px-8 py-3 bg-[#0A0A0A] text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800"
          >
            DÉCOUVRIR LE CATALOGUE
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 font-sans">
        
        {/* HEADER */}
        <div className="border-b border-[#E8E8E8] pb-4 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#C9A45C] block">
              FINALISATION DE LA COMMANDE
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-wider">
              CHECKOUT INTERNATIONAL PROS
            </h1>
          </div>

          {/* CURRENCY SELECTOR (SECTION 5) */}
          <div className="flex items-center space-x-2">
            <Globe size={16} className="text-[#C9A45C]" />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
              className="bg-[#F9F9F8] border border-[#E8E8E8] px-3 py-1.5 text-xs font-mono font-bold uppercase focus:outline-none"
            >
              {ALL_CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.code} ({cur.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          
          {/* LEFT COLUMN: CUSTOMER & ADDRESS DETAILS */}
          <div className="lg:col-span-7 space-y-6 font-sans">
            
            {/* COUNTRY & MARKET SELECTION (SECTION 1 & 2) */}
            <div className="bg-[#F9F9F8] border border-[#E8E8E8] p-6 space-y-4 shadow-sm">
              <h3 className="font-display font-bold text-sm uppercase border-b border-[#E8E8E8] pb-2">
                1. PAYS DE DESTINATION DE LIVRAISON
              </h3>

              <div>
                <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">PAYS DE LIVRAISON</label>
                <select
                  value={selectedCountryIso}
                  onChange={(e) => setSelectedCountryIso(e.target.value)}
                  className="w-full bg-white border border-[#E8E8E8] p-3 text-xs font-bold uppercase focus:outline-none focus:border-[#0A0A0A]"
                >
                  {ALL_COUNTRIES.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name} ({c.marketZone}) — {c.phoneCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-white border border-[#E8E8E8] flex justify-between items-center text-xs font-mono text-[#777777]">
                <span>Délai estimé de livraison :</span>
                <strong className="text-[#C9A45C] font-bold">{selectedCountry.estimatedDeliveryDays}</strong>
              </div>
            </div>

            {/* ADAPTABLE ADRESS FORM (SECTION 2 & 3) */}
            <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm">
              <h3 className="font-display font-bold text-sm uppercase border-b border-[#E8E8E8] pb-2">
                2. INFORMATIONS DU DESTINATAIRE
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">PRÉNOM *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={customer.firstName}
                    onChange={handleInputChange}
                    placeholder="Ousmane"
                    className="w-full border border-[#E8E8E8] p-3 text-xs focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">NOM *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={customer.lastName}
                    onChange={handleInputChange}
                    placeholder="Sonko"
                    className="w-full border border-[#E8E8E8] p-3 text-xs focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">TÉLÉPHONE *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={customer.phone}
                    onChange={handleInputChange}
                    placeholder="+221 77 000 00 00"
                    className="w-full border border-[#E8E8E8] p-3 text-xs font-mono focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">EMAIL (FACTURE & SUIVI)</label>
                  <input
                    type="email"
                    name="email"
                    value={customer.email}
                    onChange={handleInputChange}
                    placeholder="ousmane@domain.com"
                    className="w-full border border-[#E8E8E8] p-3 text-xs focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">ADRESSE COMPLÈTE *</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={customer.address}
                  onChange={handleInputChange}
                  placeholder="Avenue Cheikh Anta Diop, Fann Résidence..."
                  className="w-full border border-[#E8E8E8] p-3 text-xs focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">VILLE *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={customer.city}
                    onChange={handleInputChange}
                    placeholder="Dakar"
                    className="w-full border border-[#E8E8E8] p-3 text-xs focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">RÉGION / ÉTAT</label>
                  <input
                    type="text"
                    name="region"
                    value={customer.region}
                    onChange={handleInputChange}
                    placeholder="Dakar / NY"
                    className="w-full border border-[#E8E8E8] p-3 text-xs focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">CODE POSTAL</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={customer.postalCode}
                    onChange={handleInputChange}
                    placeholder="10001"
                    className="w-full border border-[#E8E8E8] p-3 text-xs font-mono focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              </div>
            </div>

            {/* DELIVERY METHOD SELECTION (SECTION 9) */}
            <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm">
              <h3 className="font-display font-bold text-sm uppercase border-b border-[#E8E8E8] pb-2">
                3. MODE DE LIVRAISON
              </h3>

              <div className="space-y-2 font-sans">
                <label className={`p-4 border flex items-center justify-between cursor-pointer ${deliveryMethod === 'dakar_express' ? 'border-[#0A0A0A] bg-[#F9F9F8]' : 'border-[#E8E8E8]'}`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'dakar_express'}
                      onChange={() => setDeliveryMethod('dakar_express')}
                    />
                    <div>
                      <strong className="text-xs uppercase font-bold block">LIVRAISON EXPRESS / INTERNATIONAL</strong>
                      <span className="text-[11px] text-[#777777] font-mono">{shippingInfo.zoneName} ({shippingInfo.deliveryDays})</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold">{formatCurrencyPrice(convertPriceFromXOF(shippingInfo.shippingCostXOF, selectedCurrency), selectedCurrency)}</span>
                </label>

                {selectedCountryIso === 'SN' && (
                  <label className={`p-4 border flex items-center justify-between cursor-pointer ${deliveryMethod === 'boutique_pickup' ? 'border-[#0A0A0A] bg-[#F9F9F8]' : 'border-[#E8E8E8]'}`}>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={deliveryMethod === 'boutique_pickup'}
                        onChange={() => setDeliveryMethod('boutique_pickup')}
                      />
                      <div>
                        <strong className="text-xs uppercase font-bold block">RETRAIT EN SHOWROOM PROS (DAKAR)</strong>
                        <span className="text-[11px] text-[#777777] font-mono">Fann Résidence (Gratuit)</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#0A9F68]">GRATUIT</span>
                  </label>
                )}
              </div>
            </div>

            {/* PAYMENT METHODS (SECTION 20) */}
            <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm">
              <h3 className="font-display font-bold text-sm uppercase border-b border-[#E8E8E8] pb-2">
                3. MODE DE PAIEMENT SÉCURISÉ
              </h3>

              <div className="space-y-2 font-sans">
                {selectedCountry.paymentMethods.includes('WAVE') && (
                  <label className={`p-4 border flex items-center justify-between cursor-pointer ${paymentMethod === 'wave' ? 'border-[#0A0A0A] bg-[#F9F9F8]' : 'border-[#E8E8E8]'}`}>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'wave'}
                        onChange={() => setPaymentMethod('wave')}
                      />
                      <strong className="text-xs uppercase font-bold">WAVE MOBILE MONEY</strong>
                    </div>
                    <span className="text-[10px] font-mono text-[#0A9F68] font-bold">INSTANTANÉ</span>
                  </label>
                )}

                {selectedCountry.paymentMethods.includes('ORANGE MONEY') && (
                  <label className={`p-4 border flex items-center justify-between cursor-pointer ${paymentMethod === 'orange_money' ? 'border-[#0A0A0A] bg-[#F9F9F8]' : 'border-[#E8E8E8]'}`}>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'orange_money'}
                        onChange={() => setPaymentMethod('orange_money')}
                      />
                      <strong className="text-xs uppercase font-bold">ORANGE MONEY SÉNÉGAL / AFRIQUE</strong>
                    </div>
                    <span className="text-[10px] font-mono text-[#0A9F68] font-bold">INSTANTANÉ</span>
                  </label>
                )}

                <label className={`p-4 border flex items-center justify-between cursor-pointer ${paymentMethod === 'card' ? 'border-[#0A0A0A] bg-[#F9F9F8]' : 'border-[#E8E8E8]'}`}>
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <strong className="text-xs uppercase font-bold">CARTE BANCAIRE (VISA / MASTERCARD)</strong>
                  </div>
                  <span className="text-[10px] font-mono text-[#777777]">SÉCURISÉ 3D</span>
                </label>

                {selectedCountryIso === 'SN' && (
                  <label className={`p-4 border flex items-center justify-between cursor-pointer ${paymentMethod === 'cash_on_delivery' ? 'border-[#0A0A0A] bg-[#F9F9F8]' : 'border-[#E8E8E8]'}`}>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'cash_on_delivery'}
                        onChange={() => setPaymentMethod('cash_on_delivery')}
                      />
                      <strong className="text-xs uppercase font-bold">PAIEMENT À LA LIVRAISON (DAKAR)</strong>
                    </div>
                    <span className="text-[10px] font-mono text-[#777777]">ESPÈCES</span>
                  </label>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY & TOTALS */}
          <div className="lg:col-span-5 space-y-6 font-sans">
            <div className="bg-[#F9F9F8] border border-[#E8E8E8] p-6 space-y-6 shadow-sm sticky top-24">
              <h3 className="font-display font-bold text-sm uppercase border-b border-[#E8E8E8] pb-3">
                RÉCAPITULATIF DE LA COMMANDE
              </h3>

              {/* ITEMS BREAKDOWN */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <div>
                      <strong className="font-bold uppercase block text-[#0A0A0A]">{item.product.name}</strong>
                      <span className="text-[11px] font-mono text-[#777777]">Taille: {item.size} • Qté: {item.quantity}</span>
                    </div>
                    <span className="font-mono font-bold">{formatCurrencyPrice(convertPriceFromXOF(item.price * item.quantity, selectedCurrency), selectedCurrency)}</span>
                  </div>
                ))}
              </div>

              {/* TOTALS TABLE (SECTION 7) */}
              <div className="border-t border-[#E8E8E8] pt-4 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-[#777777]">
                  <span>Sous-total :</span>
                  <span className="font-mono font-bold text-[#0A0A0A]">{formatCurrencyPrice(displaySubtotal, selectedCurrency)}</span>
                </div>

                <div className="flex justify-between text-[#777777]">
                  <span>Frais de livraison ({selectedCountry.name}) :</span>
                  <span className="font-mono text-[#0A0A0A]">{formatCurrencyPrice(displayShipping, selectedCurrency)}</span>
                </div>

                <div className="flex justify-between text-[#777777]">
                  <span>Taxes estimées ({Math.round(selectedCountry.taxRate * 100)}%) :</span>
                  <span className="font-mono text-[#777777]">Incluses</span>
                </div>

                <div className="flex justify-between text-base font-bold text-[#0A9F68] pt-3 border-t-2 border-[#0A0A0A]">
                  <span>TOTAL À REGLER :</span>
                  <span className="font-mono">{formatCurrencyPrice(displayGrandTotal, selectedCurrency)}</span>
                </div>

                {selectedCurrency !== 'XOF' && (
                  <span className="text-[10px] font-mono text-[#777777] block text-right pt-1">
                    Équivalent référence : {formatPrice(grandTotalXOF)}
                  </span>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>VALISATION EN COURS...</span>
                  </>
                ) : (
                  <>
                    <span>CONFIRMER & PAYER</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-[10px] text-center text-[#777777] font-mono">
                Facture & Reçu PDF avec QR Code générés automatiquement.
              </div>

            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
