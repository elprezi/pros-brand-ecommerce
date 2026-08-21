import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  MapPin,
  Copy,
  Share2,
  Download,
  Printer,
  RefreshCw,
  MessageCircle,
  HelpCircle,
  AlertCircle,
  Check,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../store/storeContext';
import {
  apiGetPublicTracking,
  type PublicTrackingResponse,
} from '../lib/server/trackingApi';
import { apiGetOrderInvoice } from '../lib/server/invoiceApi';
import { generateQrCodeSvg } from '../lib/utils/qrcode';
import { downloadInvoicePdf, printOrderReceipt } from '../lib/utils/pdfGenerator';

export const OrderTrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const trackingParam = searchParams.get('tracking') || '';
  const { orders, formatPrice, settings } = useStore();

  const [inputCode, setInputCode] = useState(trackingParam || 'PROS-DAK-3436');
  const [trackingData, setTrackingData] = useState<PublicTrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // SEARCH AND INITIAL FETCH LOGIC (SECTION 6 & 7)
  const performSearch = async (query: string) => {
    if (!query || query.trim().length === 0) return;
    setIsLoading(true);
    setErrorMsg(null);

    const res = await apiGetPublicTracking(query, orders);
    setIsLoading(false);

    if (res.success && res.data) {
      setTrackingData(res.data);
      setSearchParams({ tracking: res.data.trackingNumber });
    } else {
      setTrackingData(null);
      setErrorMsg(res.error || `Aucune commande trouvée pour la référence "${query}". Veuillez vérifier la référence.`);
    }
  };

  useEffect(() => {
    if (trackingParam) {
      setInputCode(trackingParam);
      performSearch(trackingParam);
    } else if (orders.length > 0) {
      const defaultOrder = orders[0];
      setInputCode(defaultOrder.trackingNumber);
      performSearch(defaultOrder.trackingNumber);
    }
  }, [trackingParam, orders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(inputCode);
  };

  const showToast = (text: string) => {
    setToastNotice(text);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // COPY TRACKING CODE TO CLIPBOARD
  const handleCopyTrackingCode = () => {
    if (!trackingData) return;
    navigator.clipboard.writeText(trackingData.trackingNumber);
    showToast('Numéro de suivi copié.');
  };

  // SHARE TRACKING LINK
  const handleShareTracking = () => {
    if (!trackingData) return;
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: `Suivi de commande PROS — ${trackingData.trackingNumber}`,
          text: `Consulter l'avancement de la commande PROS ${trackingData.trackingNumber}`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      showToast('Lien de suivi copié.');
    }
  };

  // REFRESH TRACKING
  const handleRefreshTracking = () => {
    if (trackingData) {
      performSearch(trackingData.trackingNumber);
      showToast('Suivi de commande actualisé.');
    }
  };

  // TÉLÉCHARGER LE REÇU PDF (SECTION 1, 2, 3)
  const handleDownloadInvoicePdf = async () => {
    if (!trackingData) return;
    setIsGeneratingPdf(true);

    try {
      const res = await apiGetOrderInvoice(trackingData.trackingNumber, orders, settings);
      if (res.success && res.data) {
        downloadInvoicePdf(res.data);
        showToast('Facture / Reçu PDF téléchargé avec succès.');
      } else {
        console.error('Invoice API Error:', res.error);
        showToast('Impossible de générer la facture. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('PDF Download Error:', err);
      showToast('Erreur lors du téléchargement de la facture PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // IMPRIMER LE REÇU DE COMMANDE (SECTION 10, 11, 12)
  const handleNativePrint = () => {
    if (!trackingData) return;
    printOrderReceipt(trackingData);
  };

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] font-sans antialiased selection:bg-pros-sand selection:text-black pb-20">
      
      {/* PRINT MEDIA STYLE OVERRIDE FOR DIRECT NATIVE PRINT (SECTION 10, 11, 12) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-invoice-document, .printable-invoice-document * {
            visibility: visible !important;
          }
          .printable-invoice-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 20px !important;
            border: none !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 portrait !important;
            margin: 10mm !important;
          }
        }
      `}</style>

      {/* TOAST NOTIFICATION FLOATING BADGE */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] text-white text-xs font-bold px-4 py-3 shadow-2xl flex items-center space-x-2 border border-[#C9A45C] animate-fadeIn font-sans no-print">
          <CheckCircle2 size={16} className="text-[#0A9F68]" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* 1. BREADCRUMB */}
      <div className="border-b border-[#E8E8E8] bg-[#F9F9F8] py-3 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 font-mono text-[11px] text-[#777777] uppercase tracking-wider flex items-center space-x-2">
          <Link to="/" className="hover:text-black transition-colors">ACCUEIL</Link>
          <span>/</span>
          <span className="text-black font-bold">SUIVI DE COMMANDE</span>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-4 font-sans no-print">
        <span className="text-[11px] font-mono font-bold tracking-superwide uppercase text-[#C9A45C] block">
          SERVICE CLIENT PROS
        </span>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-wider text-[#0A0A0A]">
          SUIVI DE COMMANDE
        </h1>
        <p className="text-xs text-[#777777] max-w-lg mx-auto leading-relaxed font-sans">
          Suivez l'avancement de votre commande en temps réel. Entrez votre numéro de suivi pour consulter l'état de votre livraison.
        </p>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearchSubmit} className="pt-4 max-w-xl mx-auto flex flex-col sm:flex-row gap-2 font-sans">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="🔍 PROS-DAK-3436 ou N° Téléphone..."
              className="w-full bg-white border border-[#E8E8E8] pl-10 pr-4 py-3 text-xs text-[#0A0A0A] uppercase font-mono placeholder-[#777777] focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="py-3 px-8 bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-50 font-sans flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>RECHERCHE...</span>
              </>
            ) : (
              <span>RECHERCHER</span>
            )}
          </button>
        </form>
      </section>

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 no-print">
        
        {/* ERROR NOTICE (SECTION 16) */}
        {errorMsg && (
          <div className="p-8 bg-[#F9F9F8] border border-[#E8E8E8] text-center space-y-3 max-w-md mx-auto font-sans">
            <AlertCircle size={36} className="mx-auto text-red-600" />
            <h3 className="font-bold uppercase text-xs text-[#0A0A0A]">COMMANDE INTROUVABLE</h3>
            <p className="text-xs text-[#777777] leading-relaxed">
              Nous ne trouvons aucune commande correspondant à ce numéro de suivi. Veuillez vérifier la référence et réessayer.
            </p>
          </div>
        )}

        {/* TRACKING DATA DISPLAY */}
        {trackingData && (
          <div className="space-y-8 font-sans animate-fadeIn">
            
            {/* MAIN ORDER CARD */}
            <div className="bg-white border border-[#E8E8E8] p-6 sm:p-8 space-y-6 shadow-sm">
              
              {/* TOP CARD BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E8E8E8] gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#777777] block">
                    CODE DE SUIVI
                  </span>
                  <div className="flex items-center space-x-3">
                    <h2 className="font-display font-extrabold text-2xl uppercase tracking-wider text-[#0A0A0A] font-mono">
                      {trackingData.trackingNumber}
                    </h2>
                    <button
                      onClick={handleCopyTrackingCode}
                      className="p-1.5 bg-[#F9F9F8] border border-[#E8E8E8] hover:border-[#0A0A0A] text-[#777777] hover:text-black transition-colors"
                      title="Copier le numéro de suivi"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <span className="text-[11px] text-[#777777] font-mono block">
                    Passée le {new Date(trackingData.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {/* STATUS & PAYMENT BADGES */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1.5 bg-[#0A0A0A] text-white text-xs font-mono font-bold uppercase border border-[#0A0A0A]">
                    STATUT : {trackingData.statusLabel}
                  </span>
                  <span className="px-3 py-1.5 bg-[#E6F4ED] text-[#0A9F68] text-xs font-mono font-bold uppercase border border-[#0A9F68]/30 flex items-center space-x-1.5">
                    <CheckCircle2 size={14} />
                    <span>PAIEMENT : {trackingData.paymentStatus}</span>
                  </span>
                </div>
              </div>

              {/* INFORMATION SUMMARY GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F9F9F8] border border-[#E8E8E8] font-sans text-xs">
                <div>
                  <span className="text-[10px] font-mono text-[#777777] uppercase block">CLIENT</span>
                  <strong className="font-bold text-[#0A0A0A] block">{trackingData.customerDisplayName}</strong>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#777777] uppercase block">ARTICLES</span>
                  <strong className="font-bold text-[#0A0A0A] block">{trackingData.items.length} article(s)</strong>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#777777] uppercase block">TOTAL DE LA COMMANDE</span>
                  <strong className="font-mono font-bold text-[#0A9F68] block">{formatPrice(trackingData.total)}</strong>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#777777] uppercase block">LIVRAISON ESTIMÉE</span>
                  <strong className="font-mono font-bold text-[#C9A45C] block">{trackingData.estimatedDeliveryDate}</strong>
                </div>
              </div>

              {/* ACTION UTILITY BUTTONS */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleRefreshTracking}
                  className="px-4 py-2 border border-[#E8E8E8] hover:border-[#0A0A0A] text-xs font-mono font-bold uppercase flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>ACTUALISER LE SUIVI</span>
                </button>

                <button
                  onClick={handleShareTracking}
                  className="px-4 py-2 bg-[#F9F9F8] border border-[#E8E8E8] hover:border-[#0A0A0A] text-xs font-mono font-bold uppercase flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>PARTAGER LE SUIVI</span>
                </button>
              </div>

            </div>

            {/* MODERN TIMELINE STEPPER (SECTION 8) */}
            <div className="bg-white border border-[#E8E8E8] p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="border-b border-[#E8E8E8] pb-3">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#C9A45C] block">
                  AVANCEMENT EN TEMPS RÉEL
                </span>
                <h3 className="font-display font-bold text-lg uppercase text-[#0A0A0A]">
                  SUIVI DE VOTRE LIVRAISON
                </h3>
              </div>

              {/* HORIZONTAL TIMELINE FOR DESKTOP / VERTICAL FOR MOBILE */}
              <div className="relative">
                {/* Desktop Stepper */}
                <div className="hidden md:grid grid-cols-5 gap-4 relative">
                  {trackingData.timeline.map((step, idx) => (
                    <div key={step.stepNumber} className="space-y-3 relative z-10">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 transition-all ${
                            step.status === 'completed'
                              ? 'bg-[#0A9F68] border-[#0A9F68] text-white'
                              : step.status === 'active'
                              ? 'bg-[#0A0A0A] border-[#0A0A0A] text-[#C9A45C]'
                              : 'bg-[#F9F9F8] border-[#E8E8E8] text-[#777777]'
                          }`}
                        >
                          {step.status === 'completed' ? <Check size={18} /> : step.stepNumber}
                        </div>
                        {idx < trackingData.timeline.length - 1 && (
                          <div
                            className={`flex-1 h-1 transition-all ${
                              step.status === 'completed' ? 'bg-[#0A9F68]' : 'bg-[#E8E8E8]'
                            }`}
                          ></div>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <strong className="font-bold text-xs uppercase block text-[#0A0A0A]">
                          {step.title}
                        </strong>
                        <span className="text-[10px] font-mono text-[#777777] block">
                          {step.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile Vertical Stepper */}
                <div className="md:hidden space-y-6 relative pl-6 border-l-2 border-[#E8E8E8]">
                  {trackingData.timeline.map((step) => (
                    <div key={step.stepNumber} className="relative space-y-1">
                      <div
                        className={`absolute -left-[33px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 ${
                          step.status === 'completed'
                            ? 'bg-[#0A9F68] border-[#0A9F68] text-white'
                            : step.status === 'active'
                            ? 'bg-[#0A0A0A] border-[#0A0A0A] text-[#C9A45C]'
                            : 'bg-[#F9F9F8] border-[#E8E8E8] text-[#777777]'
                        }`}
                      >
                        {step.status === 'completed' ? <Check size={14} /> : step.stepNumber}
                      </div>

                      <strong className="font-bold text-xs uppercase block text-[#0A0A0A]">
                        {step.title}
                      </strong>
                      <span className="text-[10px] font-mono text-[#777777] block">
                        {step.timestamp} • {step.subtitle}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DELIVERED SPECIAL NOTICE */}
              {trackingData.status === 'livree' ? (
                <div className="p-4 bg-[#E6F4ED] border border-[#0A9F68]/40 text-[#0A9F68] text-xs font-bold flex items-center space-x-3">
                  <CheckCircle2 size={24} className="shrink-0 text-[#0A9F68]" />
                  <div>
                    <strong className="uppercase text-sm block font-display">✓ COMMANDE LIVRÉE AVEC SUCCÈS</strong>
                    <span className="text-[11px] font-sans font-normal text-[#0A9F68]">
                      Votre commande a été livrée. Merci de votre confiance envers la Maison PROS.
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ORDER HISTORY LOGS */}
            <div className="bg-white border border-[#E8E8E8] p-6 sm:p-8 space-y-4 shadow-sm font-sans">
              <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A] border-b border-[#E8E8E8] pb-3">
                HISTORIQUE DE LA COMMANDE
              </h3>

              <div className="space-y-3 font-sans text-xs">
                {trackingData.history.map((log, idx) => (
                  <div key={idx} className="p-3 bg-[#F9F9F8] border border-[#E8E8E8] space-y-1 font-sans">
                    <div className="flex justify-between items-center font-mono text-[10px] text-[#777777]">
                      <span>{log.timestamp}</span>
                      <span className="font-bold text-black uppercase">{log.actor}</span>
                    </div>
                    <strong className="font-bold text-[#0A0A0A] block">{log.title}</strong>
                    {log.notes && <span className="text-[11px] text-[#777777] block">{log.notes}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* DELIVERY & ITEMS INFORMATION CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
              
              {/* CARD 1: DELIVERY DESTINATION */}
              <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm font-sans">
                <div className="border-b border-[#E8E8E8] pb-2 flex items-center space-x-2">
                  <MapPin size={18} className="text-[#C9A45C]" />
                  <h3 className="font-display font-bold text-xs uppercase text-[#0A0A0A]">
                    DESTINATION DE LIVRAISON
                  </h3>
                </div>

                <div className="space-y-1.5 text-xs text-[#0A0A0A] font-sans">
                  <strong className="font-bold text-sm block">{trackingData.customerDisplayName}</strong>
                  <p>{trackingData.deliveryAddress}</p>
                  <p>{trackingData.deliveryCity}, {trackingData.deliveryRegion} — Sénégal</p>
                  <p className="font-mono text-[#777777] pt-1">Téléphone : {trackingData.maskedPhone}</p>
                </div>
              </div>

              {/* CARD 2: PAYMENT & SHIPPING DETAILS */}
              <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm font-sans">
                <div className="border-b border-[#E8E8E8] pb-2 flex items-center space-x-2">
                  <ShieldCheck size={18} className="text-[#C9A45C]" />
                  <h3 className="font-display font-bold text-xs uppercase text-[#0A0A0A]">
                    PAIEMENT & LIVRAISON
                  </h3>
                </div>

                <div className="space-y-2 text-xs font-sans">
                  <div className="flex justify-between border-b border-[#E8E8E8] pb-1">
                    <span className="text-[#777777]">Mode de Paiement :</span>
                    <strong className="font-mono uppercase font-bold text-[#0A9F68]">{trackingData.paymentMethod}</strong>
                  </div>

                  <div className="flex justify-between border-b border-[#E8E8E8] pb-1">
                    <span className="text-[#777777]">Zone de Livraison :</span>
                    <strong className="font-mono uppercase font-bold">{trackingData.deliveryCity}</strong>
                  </div>

                  <div className="flex justify-between border-b border-[#E8E8E8] pb-1">
                    <span className="text-[#777777]">Frais de Livraison :</span>
                    <strong className="font-mono font-bold">{formatPrice(trackingData.shippingFee)}</strong>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-[#777777]">Date Estimée :</span>
                    <strong className="font-mono font-bold text-[#C9A45C]">{trackingData.estimatedDeliveryDate}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* ORDERED ITEMS TABLE */}
            <div className="bg-white border border-[#E8E8E8] p-6 sm:p-8 space-y-4 shadow-sm font-sans">
              <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A] border-b border-[#E8E8E8] pb-3">
                ARTICLES COMMANDÉS ({trackingData.items.length})
              </h3>

              <div className="space-y-3 font-sans">
                {trackingData.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#F9F9F8] border border-[#E8E8E8] flex items-center justify-between gap-4 font-sans">
                    <div className="flex items-center space-x-3">
                      <img src={item.image} alt={item.name} className="w-14 h-14 object-cover border border-[#E8E8E8]" />
                      <div>
                        <strong className="font-bold text-xs uppercase text-[#0A0A0A] block">{item.name}</strong>
                        <span className="text-[11px] font-mono text-[#777777] block">
                          Taille : {item.size} • Couleur : {item.color} • Quantité : {item.quantity}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono font-bold text-xs text-[#0A0A0A]">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* OFFICIAL RECEIPT & QR CODE SECTION (SECTION 1, 4, 10, 14) */}
            <div className="bg-[#F9F9F8] border border-[#E8E8E8] p-6 sm:p-8 space-y-6 shadow-sm font-sans">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E8E8E8] pb-4 gap-4">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#C9A45C] block">
                    JUSTIFICATIF D'ACHAT OFFICIEL
                  </span>
                  <h3 className="font-display font-bold text-lg uppercase text-[#0A0A0A]">
                    VOTRE REÇU DE COMMANDE
                  </h3>
                  <p className="text-xs text-[#777777] font-sans mt-1">
                    Téléchargez votre reçu officiel PROS contenant les informations de votre commande et votre code QR de suivi.
                  </p>
                </div>

                {/* QR CODE DISPLAY (SECTION 4, 14) */}
                <div className="p-3 bg-white border border-[#E8E8E8] text-center shadow-sm shrink-0 mx-auto sm:mx-0">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generateQrCodeSvg(`https://pros-store.sn/order-tracking?tracking=${trackingData.trackingNumber}`, 110),
                    }}
                  />
                  <span className="text-[9px] font-mono font-bold text-[#C9A45C] uppercase block mt-1">
                    SCANNEZ POUR SUIVRE
                  </span>
                </div>
              </div>

              {/* DOWNLOAD & PRINT BUTTONS (SECTION 1, 10, 12) */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadInvoicePdf}
                  disabled={isGeneratingPdf}
                  className="px-6 py-3.5 bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer shadow-sm font-sans disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>GÉNÉRATION DU REÇU...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      <span>TÉLÉCHARGER LE REÇU PDF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleNativePrint}
                  className="px-6 py-3.5 bg-white border border-[#E8E8E8] hover:border-[#0A0A0A] text-[#0A0A0A] font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer shadow-sm font-sans"
                >
                  <Printer size={16} />
                  <span>IMPRIMER LE REÇU</span>
                </button>
              </div>
            </div>

            {/* CUSTOMER SERVICE SUPPORT */}
            <div className="p-8 bg-[#0A0A0A] text-white text-center space-y-4 border border-[#C9A45C] font-sans shadow-lg">
              <HelpCircle size={32} className="mx-auto text-[#C9A45C]" />
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg uppercase tracking-wider text-white">
                  BESOIN D'AIDE ?
                </h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Notre équipe du service client PROS est disponible pour vous accompagner et répondre à toutes vos questions.
                </p>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
                <a
                  href={`https://wa.me/${(settings?.whatsAppNumber || '+221770000000').replace(/[^0-9]/g, '')}?text=Bonjour%20Service%20PROS,%20je%20souhaite%20des%20informations%20sur%20ma%20commande%20${trackingData.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-[#0A9F68] hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 cursor-pointer shadow-sm font-sans"
                >
                  <MessageCircle size={16} />
                  <span>WHATSAPP SUPPORT</span>
                </a>

                <Link
                  to="/about"
                  className="px-6 py-3 bg-white text-[#0A0A0A] font-bold text-xs uppercase tracking-wider hover:bg-neutral-100 cursor-pointer shadow-sm font-sans"
                >
                  CONTACTER LE SERVICE CLIENT
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 4. OFFICIAL PRINTABLE INVOICE DOCUMENT DOM (SECTION 10, 11, 12, 18) */}
      {trackingData && (
        <div className="printable-invoice-document hidden font-sans">
          <div className="p-8 bg-white border border-[#E8E8E8] space-y-6">
            
            {/* TOP HEADER */}
            <div className="flex justify-between items-start border-b-2 border-[#0A0A0A] pb-4">
              <div>
                <h1 className="text-3xl font-black tracking-widest uppercase font-display">PROS</h1>
                <p className="text-[10px] text-[#C9A45C] font-bold tracking-widest uppercase">
                  MAISON D'ÉDITION & E-COMMERCE
                </p>
              </div>
              <div className="text-right font-mono text-xs space-y-0.5">
                <strong className="text-sm font-bold block uppercase text-[#0A0A0A]">FACTURE / REÇU</strong>
                <p className="text-[#777777]">FACTURE N° : INV-2026-003436</p>
                <p className="text-[#777777]">COMMANDE N° : {trackingData.trackingNumber}</p>
                <p className="text-[#777777]">
                  DATE : {new Date(trackingData.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* VENDOR & CUSTOMER GRID */}
            <div className="grid grid-cols-2 gap-6 p-4 bg-[#F9F9F8] border border-[#E8E8E8] text-xs">
              <div>
                <strong className="text-[10px] font-mono text-[#C9A45C] uppercase block mb-1">
                  ÉMETTEUR & VENTES (PROS)
                </strong>
                <strong className="font-bold block">PROS Store Sénégal</strong>
                <p>Avenue Cheikh Anta Diop, Fann Résidence</p>
                <p>Dakar, Sénégal</p>
                <p className="font-mono text-[#777777]">Email: support@pros.sn • Tél: {settings?.whatsAppNumber || '+221 77 000 00 00'}</p>
              </div>

              <div>
                <strong className="text-[10px] font-mono text-[#C9A45C] uppercase block mb-1">
                  FACTURÉ À (CLIENT)
                </strong>
                <strong className="font-bold block">{trackingData.customerDisplayName}</strong>
                <p>{trackingData.deliveryAddress}</p>
                <p>{trackingData.deliveryCity}, {trackingData.deliveryRegion} — Sénégal</p>
                <p className="font-mono text-[#777777]">Tél: {trackingData.maskedPhone}</p>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#0A0A0A] text-white font-mono text-[10px] uppercase">
                  <th className="p-2 text-left">PRODUIT</th>
                  <th className="p-2 text-left">DÉTAILS</th>
                  <th className="p-2 text-center">QTÉ</th>
                  <th className="p-2 text-right">PRIX UNITAIRE</th>
                  <th className="p-2 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {trackingData.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-[#E8E8E8]">
                    <td className="p-2 font-bold uppercase">{it.name}</td>
                    <td className="p-2 text-[#777777]">Taille: {it.size} • Couleur: {it.color}</td>
                    <td className="p-2 text-center font-bold">{it.quantity}</td>
                    <td className="p-2 text-right font-mono">{formatPrice(it.price)}</td>
                    <td className="p-2 text-right font-mono font-bold">{formatPrice(it.price * it.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* RECAP & PAYMENT */}
            <div className="flex justify-between items-start gap-6 pt-2">
              <div className="flex-1 p-4 bg-[#E6F4ED] border border-[#0A9F68] text-xs space-y-1">
                <strong className="text-[#0A9F68] uppercase font-bold block">
                  ✓ STATUT DU PAIEMENT : {trackingData.paymentStatus}
                </strong>
                <p className="text-[#0A0A0A]">Mode de Règlement : <strong>{trackingData.paymentMethod}</strong></p>
                <p className="text-[10px] text-[#777777]">Transaction de paiement sécurisée et archivée sur le réseau PROS.</p>
              </div>

              <div className="w-64 text-xs space-y-1 font-sans">
                <div className="flex justify-between text-[#777777]">
                  <span>Sous-total articles :</span>
                  <span className="font-mono font-bold text-black">{formatPrice(trackingData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#777777]">
                  <span>Frais de livraison ({trackingData.deliveryCity}) :</span>
                  <span className="font-mono text-black">{formatPrice(trackingData.shippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#0A9F68] pt-2 border-t-2 border-[#0A0A0A]">
                  <span>TOTAL RÉGLÉ :</span>
                  <span className="font-mono">{formatPrice(trackingData.total)}</span>
                </div>
              </div>
            </div>

            {/* DYNAMIC SCANNABLE VECTOR QR CODE ZONE */}
            <div className="flex justify-between items-center p-4 bg-[#F9F9F8] border border-dashed border-[#C9A45C] gap-4">
              <div className="space-y-1">
                <strong className="text-xs font-bold uppercase block text-[#0A0A0A]">
                  SUIVI EN TEMPS RÉEL DE VOTRE LIVRAISON
                </strong>
                <p className="text-[11px] text-[#777777]">
                  Scannez ce QR Code avec votre téléphone portable pour consulter l'état actuel et l'historique d'expédition de votre commande sur pros-store.sn.
                </p>
                <p className="text-[11px] font-mono text-[#C9A45C] font-bold">
                  CODE DE SUIVI : {trackingData.trackingNumber}
                </p>
              </div>

              <div className="p-2 bg-white border border-[#E8E8E8] text-center shrink-0">
                <div
                  dangerouslySetInnerHTML={{
                    __html: generateQrCodeSvg(`https://pros-store.sn/order-tracking?tracking=${trackingData.trackingNumber}`, 120),
                  }}
                />
                <span className="text-[8px] font-mono font-bold text-[#C9A45C] uppercase block mt-1">
                  SCANNEZ POUR SUIVRE
                </span>
              </div>
            </div>

            {/* FOOTER */}
            <div className="text-center pt-4 border-t border-[#E8E8E8] font-mono text-[10px] text-[#777777] uppercase space-y-0.5">
              <p>DOCUMENT OFFICIEL REÇU — FORMAT A4 PORTRAIT — PROS STORE SÉNÉGAL</p>
              <p>Merci pour votre confiance. Service Client: support@pros.sn • Tél: {settings?.whatsAppNumber || '+221 77 000 00 00'}</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
