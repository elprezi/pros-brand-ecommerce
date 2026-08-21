import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useStore } from '../../store/storeContext';
import {
  apiGetRefunds,
  apiCreateRefund,
  apiCanRefundOrder,
  apiApproveRefund,
  apiExecuteRefund,
  apiCancelRefund,
  INITIAL_CREDITS,
} from '../../lib/server/accountingApi';
import { ALL_COUNTRIES } from '../../lib/server/internationalApi';
import type { Order } from '../../types/ecommerce';
import type {
  RefundRecord,
  RefundType,
  RestockOption,
  ReturnedItem,
} from '../../types/international';
import {
  RotateCcw,
  Plus,
  CheckCircle2,
  Search,
  Download,
  Eye,
  X,
  Clock,
  DollarSign,
  Tag,
} from 'lucide-react';

export const AdminRefundsPage: React.FC = () => {
  const { orders, formatPrice, updateOrderStatus } = useStore();
  const [refunds, setRefunds] = useState<RefundRecord[]>(() => apiGetRefunds());

  // Filter States (Section 20)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  // Modal States for Create Refund (Section 6, 7, 8, 9, 10, 14)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Refund Form Inputs
  const [refundType, setRefundType] = useState<RefundType>('TOTAL');
  const [refundMethod, setRefundMethod] = useState('WAVE');
  const [reasonCategory, setReasonCategory] = useState('TAILLE INCORRECTE');
  const [customReasonNote, setCustomReasonNote] = useState('');
  const [customRefundAmount, setCustomRefundAmount] = useState('');
  const [restockOption, setRestockOption] = useState<RestockOption>('REMISE_EN_STOCK');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // View Details Drawer State (Section 19)
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Selected Order for Modal
  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId || o.trackingNumber === selectedOrderId),
    [orders, selectedOrderId]
  );

  // Order Refund Capability Check
  const refundCheck = useMemo(() => {
    if (!selectedOrder) return null;
    const initialAmt = refundType === 'TOTAL' ? selectedOrder.total : Number(customRefundAmount) || selectedOrder.total;
    return apiCanRefundOrder(selectedOrder, initialAmt);
  }, [selectedOrder, refundType, customRefundAmount]);

  // Filtered Orders for Modal Search
  const matchingOrders = useMemo(() => {
    if (!orderSearchQuery) return orders.slice(0, 5);
    const q = orderSearchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.trackingNumber.toLowerCase().includes(q) ||
        `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.customer.phone.includes(q)
    );
  }, [orders, orderSearchQuery]);

  // Filtered Refunds Table (Section 20)
  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.refundType !== typeFilter) return false;
      if (countryFilter !== 'all' && !r.country.toLowerCase().includes(countryFilter.toLowerCase())) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.refundNumber.toLowerCase().includes(q) ||
          r.trackingNumber.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerEmail.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [refunds, statusFilter, typeFilter, countryFilter, searchQuery]);

  // Top KPI Statistics Cards (Section 21)
  const totalRefundedThisMonthXOF = useMemo(() => {
    return refunds
      .filter((r) => r.status === 'EXECUTE')
      .reduce((acc, curr) => acc + (curr.baseRefundAmountXOF || curr.refundAmount), 0);
  }, [refunds]);

  const pendingRefundsCount = useMemo(() => {
    return refunds.filter((r) => r.status === 'DEMANDE' || r.status === 'EN_VERIFICATION' || r.status === 'APPROUVE').length;
  }, [refunds]);

  const activeCreditsXOF = useMemo(() => {
    return INITIAL_CREDITS.reduce((acc, curr) => acc + curr.remainingAmountXOF, 0);
  }, []);

  // Handle Order Select in Modal
  const handleSelectOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    const check = apiCanRefundOrder(order, order.total);
    if (!check.allowed) {
      showToast(check.error || "Aucun paiement confirmé n'est associé à cette commande.");
      return;
    }
    // Pre-populate items
    const initQtys: Record<string, number> = {};
    const initItemIds: string[] = [];
    (order.items || []).forEach((item) => {
      initQtys[item.id] = item.quantity;
      initItemIds.push(item.id);
    });
    setItemQuantities(initQtys);
    setSelectedItemIds(initItemIds);
    setCustomRefundAmount(String(check.remainingRefundable));
    setModalStep(2);
  };

  // Submit New Refund (Section 6, 7, 8, 14, 15)
  const handleCreateRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    let finalAmount = refundType === 'TOTAL' ? (selectedOrder.baseTotalXOF || selectedOrder.total) : Number(customRefundAmount);

    if (refundType === 'PARTIAL') {
      // Calculate partial items amount
      const itemsSum = selectedItemIds.reduce((sum, itemId) => {
        const item = selectedOrder.items.find((i) => i.id === itemId);
        if (!item) return sum;
        const qty = itemQuantities[itemId] || 1;
        return sum + item.price * qty;
      }, 0);
      finalAmount = itemsSum > 0 ? itemsSum : finalAmount;
    }

    const finalReason = reasonCategory === 'AUTRE' ? customReasonNote || 'Motif spécifique' : reasonCategory;

    // Create returned items array
    const returnedItems: ReturnedItem[] = selectedItemIds.map((id) => {
      const item = selectedOrder.items.find((i) => i.id === id);
      const qty = itemQuantities[id] || 1;
      return {
        productId: item?.productId || id,
        name: item?.product.name || 'Produit PROS',
        size: item?.size || 'M',
        color: item?.color || 'Noir',
        quantityPurchased: item?.quantity || qty,
        quantityReturned: qty,
        unitPrice: item?.price || 0,
        totalAmount: (item?.price || 0) * qty,
        restockOption,
      };
    });

    const res = apiCreateRefund(
      {
        refundType,
        refundMethod,
        reason: finalReason,
        reasonCategory,
        refundAmount: finalAmount,
        baseRefundAmountXOF: finalAmount,
        returnedItems,
        restockOption,
        status: 'DEMANDE',
        requestedBy: 'Administrateur PROS',
        notes: `Demande de remboursement (${refundType}) enregistrée via l'administration.`,
      },
      selectedOrder
    );

    if (!res.success) {
      showToast(res.error || 'Le montant demandé dépasse le montant restant remboursable.');
      return;
    }

    setRefunds(apiGetRefunds());
    setIsCreateModalOpen(false);
    setModalStep(1);
    setSelectedOrderId('');
    showToast(`Demande de remboursement ${res.data?.refundNumber} créée avec succès.`);
  };

  // Workflow Transition: Approve Refund (Section 11, 12)
  const handleApproveRefund = (refundId: string) => {
    const success = apiApproveRefund(refundId, 'Finance Admin');
    if (success) {
      setRefunds([...apiGetRefunds()]);
      showToast('Remboursement approuvé par l\'administration finance.');
    }
  };

  // Workflow Transition: Execute Refund (Section 11, 12, 14, 15)
  const handleExecuteRefund = (refRecord: RefundRecord) => {
    const success = apiExecuteRefund(refRecord.id, 'Service Comptabilité PROS');
    if (success) {
      // 1. Update Order status
      const order = orders.find((o) => o.id === refRecord.orderId || o.trackingNumber === refRecord.trackingNumber);
      if (order) {
        updateOrderStatus(order.id, 'remboursee' as any);
      }

      setRefunds([...apiGetRefunds()]);
      showToast(`Remboursement ${refRecord.refundNumber} EXÉCUTÉ. Comptabilité et commande mises à jour.`);
    }
  };

  // Workflow Transition: Cancel Refund
  const handleCancelRefund = (refundId: string) => {
    if (confirm('Voulez-vous vraiment annuler/refuser ce remboursement ?')) {
      apiCancelRefund(refundId, 'Admin Finance', 'Refusé par l\'administrateur');
      setRefunds([...apiGetRefunds()]);
      showToast('Demande de remboursement annulée.');
    }
  };

  // Export CSV Report (Section 22)
  const handleExportCSV = () => {
    const headers = ['N° REMBOURSEMENT', 'COMMANDE', 'CLIENT', 'PAYS', 'MONTANT COMMANDE', 'MONTANT PAYÉ', 'MONTANT REMBOURSÉ', 'SOLDE', 'TYPE', 'MÉTHODE', 'STATUT', 'DATE'];
    const rows = filteredRefunds.map((r) => [
      r.refundNumber,
      r.trackingNumber,
      r.customerName,
      r.country,
      r.originalOrderAmount.toString(),
      r.totalPaidAmount.toString(),
      r.refundAmount.toString(),
      r.remainingRefundableAmount.toString(),
      r.refundType,
      r.refundMethod,
      r.status,
      new Date(r.requestedAt).toLocaleDateString('fr-FR'),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PROS_REMBOURSEMENTS_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Registre des remboursements exporté en CSV.');
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-8 font-sans bg-white text-[#0A0A0A] min-h-screen">
        
        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0A0A0A] text-white text-xs font-bold px-4 py-3 shadow-2xl flex items-center space-x-2 border border-[#C9A45C] max-w-md">
            <CheckCircle2 size={16} className="text-[#0A9F68] shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#E8E8E8] pb-6 gap-4 font-sans">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#C9A45C] block">
              GESTION FINANCIÈRE ADMIN
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-wider text-[#0A0A0A]">
              REMBOURSEMENTS & AVOIRS CLIENTS
            </h1>
            <p className="text-xs text-[#777777] mt-1 font-sans">
              Module professionnel de gestion des retours, remboursements, avoirs et réajustements comptables de PROS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white border border-[#0A0A0A] hover:bg-neutral-100 text-[#0A0A0A] font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>EXPORTER CSV</span>
            </button>

            <button
              onClick={() => {
                setIsCreateModalOpen(true);
                setModalStep(1);
              }}
              className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>NOUVEAU REMBOURSEMENT</span>
            </button>
          </div>
        </div>

        {/* 4 TOP KPI CARDS (SECTION 21) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
          
          <div className="p-5 bg-white border border-[#E8E8E8] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#777777]">
              <span className="text-[10px] font-mono font-bold uppercase">REMBOURSEMENTS CE MOIS</span>
              <RotateCcw size={18} className="text-[#C9A45C]" />
            </div>
            <h3 className="font-mono font-black text-2xl text-[#0A0A0A]">{refunds.length}</h3>
            <span className="text-[10px] font-mono text-[#777777] block">Dossiers de retour traités</span>
          </div>

          <div className="p-5 bg-white border border-[#E8E8E8] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#777777]">
              <span className="text-[10px] font-mono font-bold uppercase">MONTANT REMBOURSÉ (XOF)</span>
              <DollarSign size={18} className="text-red-600" />
            </div>
            <h3 className="font-mono font-black text-xl text-red-600">
              {formatPrice(totalRefundedThisMonthXOF)}
            </h3>
            <span className="text-[10px] font-mono text-[#777777] block">Déduit du CA Net Comptable</span>
          </div>

          <div className="p-5 bg-white border border-[#E8E8E8] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#777777]">
              <span className="text-[10px] font-mono font-bold uppercase">EN ATTENTE / À APPROUVER</span>
              <Clock size={18} className="text-amber-600" />
            </div>
            <h3 className="font-mono font-black text-2xl text-amber-600">{pendingRefundsCount}</h3>
            <span className="text-[10px] font-mono text-[#777777] block">Requiert validation admin</span>
          </div>

          <div className="p-5 bg-[#0A0A0A] text-white border border-[#C9A45C] space-y-2 shadow-sm">
            <div className="flex justify-between items-center text-[#C9A45C]">
              <span className="text-[10px] font-mono font-bold uppercase">AVOIRS PROS EN CIRCULATION</span>
              <Tag size={18} className="text-[#C9A45C]" />
            </div>
            <h3 className="font-mono font-black text-xl text-[#0A9F68]">
              {formatPrice(activeCreditsXOF)}
            </h3>
            <span className="text-[10px] font-mono text-[#777777] block">Bons d'achat utilisables par clients</span>
          </div>

        </div>

        {/* SEARCH & FILTERS TOOLBAR (SECTION 20) */}
        <div className="p-4 bg-[#F9F9F8] border border-[#E8E8E8] grid grid-cols-1 sm:grid-cols-4 gap-4 font-sans text-xs">
          
          <div className="relative">
            <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">RECHERCHE RAPIDE</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-[#777777]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Réf, Commande, Client, Email..."
                className="w-full bg-white border border-[#E8E8E8] pl-8 pr-3 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">STATUT DE LA DEMANDE</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-[#E8E8E8] px-3 py-2 text-xs font-bold uppercase focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="DEMANDE">DEMANDE (À vérifier)</option>
              <option value="APPROUVE">APPROUVÉ (En attente d'exécution)</option>
              <option value="EXECUTE">EXÉCUTÉ (Payé & comptabilisé)</option>
              <option value="REFUSE">REFUSÉ / ANNULÉ</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">TYPE DE REMBOURSEMENT</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-[#E8E8E8] px-3 py-2 text-xs font-bold uppercase focus:outline-none"
            >
              <option value="all">Tous les types</option>
              <option value="TOTAL">Remboursement Total</option>
              <option value="PARTIAL">Remboursement Partiel</option>
              <option value="AVOIR_PROS">Avoir Client (Bon d'achat)</option>
              <option value="REMPLACEMENT">Remplacement Produit</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#777777] uppercase block mb-1">PAYS DE COMMANDE</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full bg-white border border-[#E8E8E8] px-3 py-2 text-xs font-bold uppercase focus:outline-none"
            >
              <option value="all">Tous les pays</option>
              {ALL_COUNTRIES.map((c) => (
                <option key={c.isoCode} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* REFUNDS TABLE (SECTION 18) */}
        <div className="bg-white border border-[#E8E8E8] p-6 space-y-4 shadow-sm font-sans">
          <h3 className="font-display font-bold text-sm uppercase text-[#0A0A0A] border-b border-[#E8E8E8] pb-3">
            REGISTRE OFFICIEL DES REMBOURSEMENTS & RETOURS ({filteredRefunds.length})
          </h3>

          {filteredRefunds.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#777777]">
              AUCUN REMBOURSEMENT ENREGISTRÉ POUR CETTE PÉRIODE.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans border-collapse">
                <thead>
                  <tr className="bg-[#0A0A0A] text-white font-mono text-[10px] uppercase">
                    <th className="p-3 text-left">N° REMBOURSEMENT</th>
                    <th className="p-3 text-left">COMMANDE</th>
                    <th className="p-3 text-left">CLIENT</th>
                    <th className="p-3 text-left">PAYS</th>
                    <th className="p-3 text-right">MONTANT COMMANDE</th>
                    <th className="p-3 text-right">MONTANT PAYÉ</th>
                    <th className="p-3 text-right">DÉJÀ REMBOURSÉ</th>
                    <th className="p-3 text-right">REMBOURSEMENT</th>
                    <th className="p-3 text-left">TYPE</th>
                    <th className="p-3 text-center">STATUT</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.map((ref) => (
                    <tr key={ref.id} className="border-b border-[#E8E8E8] hover:bg-[#F9F9F8]">
                      <td className="p-3 font-mono font-bold text-[#0A0A0A]">{ref.refundNumber}</td>
                      <td className="p-3 font-mono font-bold text-[#C9A45C]">{ref.trackingNumber}</td>
                      <td className="p-3 font-bold">{ref.customerName}</td>
                      <td className="p-3 font-mono">{ref.country}</td>
                      <td className="p-3 text-right font-mono text-[#777777]">{formatPrice(ref.originalOrderAmount)}</td>
                      <td className="p-3 text-right font-mono font-bold text-black">{formatPrice(ref.totalPaidAmount)}</td>
                      <td className="p-3 text-right font-mono text-neutral-500">{formatPrice(ref.alreadyRefundedAmount)}</td>
                      <td className="p-3 text-right font-mono font-bold text-red-600">
                        {formatPrice(ref.refundAmount)}
                      </td>
                      <td className="p-3 font-mono text-[10px] uppercase font-bold text-[#C9A45C]">
                        {ref.refundType}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                          ref.status === 'EXECUTE' ? 'bg-[#E6F4ED] text-[#0A9F68]' :
                          ref.status === 'APPROUVE' ? 'bg-amber-50 text-amber-700' :
                          ref.status === 'DEMANDE' ? 'bg-blue-50 text-blue-700' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {ref.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 font-sans">
                        <button
                          onClick={() => setSelectedRefund(ref)}
                          className="p-1.5 bg-[#F9F9F8] border border-[#E8E8E8] text-black hover:bg-[#0A0A0A] hover:text-white transition-colors cursor-pointer"
                          title="Voir détails du remboursement"
                        >
                          <Eye size={14} />
                        </button>

                        {ref.status === 'DEMANDE' && (
                          <button
                            onClick={() => handleApproveRefund(ref.id)}
                            className="px-2 py-1 bg-[#0A9F68] text-white font-bold text-[10px] uppercase cursor-pointer"
                            title="Approuver la demande"
                          >
                            APPROUVER
                          </button>
                        )}

                        {ref.status === 'APPROUVE' && (
                          <button
                            onClick={() => handleExecuteRefund(ref)}
                            className="px-2 py-1 bg-[#0A0A0A] text-white font-bold text-[10px] uppercase cursor-pointer"
                            title="Exécuter et comptabiliser"
                          >
                            EXÉCUTER
                          </button>
                        )}

                        {ref.status !== 'EXECUTE' && ref.status !== 'REFUSE' && (
                          <button
                            onClick={() => handleCancelRefund(ref.id)}
                            className="p-1 text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Refuser / Annuler"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MULTI-STEP NEW REFUND MODAL (SECTIONS 6, 7, 8, 9, 10, 14) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white border border-[#0A0A0A] p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            
            <div className="border-b border-[#E8E8E8] pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C9A45C] uppercase">NOUVELLE DEMANDE DE REMBOURSEMENT — ÉTAPE {modalStep}/3</span>
                <h3 className="font-display font-bold text-base uppercase text-[#0A0A0A]">
                  {modalStep === 1 ? '1. RECHERCHER UNE COMMANDE CLIENT' : modalStep === 2 ? '2. TYPE & SELECTION DES ARTICLES' : '3. PAIEMENT & STOCK'}
                </h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-black font-bold text-sm">✕</button>
            </div>

            {/* STEP 1: ORDER SEARCH */}
            {modalStep === 1 && (
              <div className="space-y-4 text-xs font-sans">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-[#777777]" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Recherche par N° commande (PROS-DAK-3436), client, email ou téléphone..."
                    className="w-full border border-[#E8E8E8] pl-9 pr-3 py-2.5 text-xs font-mono focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {matchingOrders.map((o) => {
                    const check = apiCanRefundOrder(o, o.total);
                    return (
                      <div
                        key={o.id}
                        onClick={() => check.allowed && handleSelectOrder(o)}
                        className={`p-3 border flex justify-between items-center cursor-pointer transition-colors ${
                          check.allowed ? 'hover:border-[#0A0A0A] bg-white' : 'bg-neutral-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div>
                          <strong className="font-mono font-bold text-sm text-[#0A0A0A] block">{o.trackingNumber}</strong>
                          <span className="text-[#777777] font-sans text-xs">
                            {o.customer.firstName} {o.customer.lastName} ({o.customer.phone}) — {o.customer.country || 'Sénégal'}
                          </span>
                          <span className="text-[10px] font-mono text-[#777777] block mt-0.5">
                            Paiement: <strong className={o.paymentStatus === 'paid' ? 'text-[#0A9F68]' : 'text-amber-600'}>{o.paymentStatus.toUpperCase()}</strong>
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-black block">{formatPrice(o.total)}</span>
                          <span className="text-[10px] font-mono text-[#C9A45C] block">
                            Solde remboursable: {formatPrice(check.remainingRefundable)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: REFUND TYPE & ITEMS SELECTION */}
            {modalStep === 2 && selectedOrder && refundCheck && (
              <form onSubmit={handleCreateRefundSubmit} className="space-y-4 text-xs font-sans">
                
                {/* ORDER METADATA SUMMARY */}
                <div className="p-3 bg-[#F9F9F8] border border-[#E8E8E8] grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                  <div>
                    <span className="text-[#777777] block">COMMANDE N°</span>
                    <strong className="text-black">{selectedOrder.trackingNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[#777777] block">PAGEMENT CONFIRMÉ</span>
                    <strong className="text-[#0A9F68]">{formatPrice(refundCheck.paidAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-[#777777] block">DÉJÀ REMBOURSÉ</span>
                    <strong className="text-neutral-600">{formatPrice(refundCheck.alreadyRefunded)}</strong>
                  </div>
                  <div>
                    <span className="text-[#777777] block">SOLDE REMBOURSABLE</span>
                    <strong className="text-[#C9A45C] font-black">{formatPrice(refundCheck.remainingRefundable)}</strong>
                  </div>
                </div>

                {/* TYPE SELECTOR (SECTION 7) */}
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">TYPE DE REMBOURSEMENT</label>
                  <select
                    value={refundType}
                    onChange={(e) => setRefundType(e.target.value as any)}
                    className="w-full border border-[#E8E8E8] p-2 font-bold uppercase focus:outline-none"
                  >
                    <option value="TOTAL">REMBOURSEMENT TOTAL ({formatPrice(refundCheck.remainingRefundable)})</option>
                    <option value="PARTIAL">REMBOURSEMENT PARTIEL SUR ARTICLES</option>
                    <option value="AVOIR_PROS">AVOIR CLIENT (BON D'ACHAT BOUTIQUE)</option>
                    <option value="REMPLACEMENT">REMPLACEMENT DE PRODUIT</option>
                  </select>
                </div>

                {/* PARTIAL ITEMS SELECTION (SECTION 8) */}
                {refundType === 'PARTIAL' && (
                  <div className="space-y-2 border border-[#E8E8E8] p-3 bg-white">
                    <label className="font-mono text-[10px] uppercase text-[#777777] block">SÉLECTIONNER LES ARTICLES RETOURNÉS</label>
                    {selectedOrder.items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center p-2 border-b border-[#E8E8E8]">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(it.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedItemIds([...selectedItemIds, it.id]);
                              else setSelectedItemIds(selectedItemIds.filter((id) => id !== it.id));
                            }}
                          />
                          <div>
                            <strong className="text-xs font-bold uppercase">{it.product.name}</strong>
                            <span className="text-[10px] font-mono text-[#777777] block">Taille: {it.size} • {formatPrice(it.price)}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px]">Qté retour:</span>
                          <input
                            type="number"
                            min="1"
                            max={it.quantity}
                            value={itemQuantities[it.id] || 1}
                            onChange={(e) => setItemQuantities({ ...itemQuantities, [it.id]: Number(e.target.value) })}
                            className="w-12 border p-1 font-mono text-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* REASON CATEGORY (SECTION 9) */}
                <div>
                  <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">MOTIF DU RETOUR</label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="w-full border border-[#E8E8E8] p-2 font-bold uppercase focus:outline-none"
                  >
                    <option value="TAILLE INCORRECTE">TAILLE INCORRECTE</option>
                    <option value="COULEUR INCORRECTE">COULEUR INCORRECTE</option>
                    <option value="PRODUIT DÉFECTUEUX">PRODUIT DÉFECTUEUX</option>
                    <option value="PRODUIT ENDOMMAGÉ">PRODUIT ENDOMMAGÉ</option>
                    <option value="MAUVAIS PRODUIT REÇU">MAUVAIS PRODUIT REÇU</option>
                    <option value="CLIENT CHANGE D'AVIS">CLIENT CHANGE D'AVIS</option>
                    <option value="AUTRE">AUTRE MOTIF (PRÉCISER)</option>
                  </select>
                </div>

                {reasonCategory === 'AUTRE' && (
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">PRÉCISER LE MOTIF</label>
                    <textarea
                      rows={2}
                      value={customReasonNote}
                      onChange={(e) => setCustomReasonNote(e.target.value)}
                      placeholder="Précisions sur la raison du retour..."
                      className="w-full border border-[#E8E8E8] p-2 focus:outline-none"
                    />
                  </div>
                )}

                {/* METHOD & RESTOCK (SECTION 10 & 14) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">MÉTHODE DE REMBOURSEMENT</label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="w-full border border-[#E8E8E8] p-2 font-bold uppercase focus:outline-none"
                    >
                      <option value="WAVE">WAVE MOBILE MONEY</option>
                      <option value="ORANGE MONEY">ORANGE MONEY</option>
                      <option value="CARTE BANCAIRE">CARTE BANCAIRE</option>
                      <option value="VIREMENT BANCAIRE">VIREMENT BANCAIRE</option>
                      <option value="AVOIR PROS">AVOIR BOUTIQUE PROS</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#777777] block mb-1">GESTION DU STOCK (SECTION 14)</label>
                    <select
                      value={restockOption}
                      onChange={(e) => setRestockOption(e.target.value as any)}
                      className="w-full border border-[#E8E8E8] p-2 font-bold uppercase focus:outline-none"
                    >
                      <option value="REMISE_EN_STOCK">REMISE EN STOCK (+Quantité)</option>
                      <option value="PRODUIT_ENDOMMAGE">PRODUIT ENDOMMAGÉ (Ne pas réintégrer)</option>
                      <option value="PERTE">PERTE LOGISTIQUE</option>
                      <option value="A_INSPECTER">À INSPECTER À L'ATELIER</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-[#E8E8E8]">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="px-4 py-2 border border-[#E8E8E8] text-black font-bold uppercase text-xs"
                  >
                    RETOUR
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#0A0A0A] text-white font-bold uppercase text-xs hover:bg-neutral-800"
                  >
                    ENREGISTRER LA DEMANDE
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* DETAIL VIEW DRAWER (SECTION 19) */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end font-sans">
          <div className="bg-white max-w-xl w-full h-full p-6 space-y-6 overflow-y-auto shadow-2xl animate-slideLeft">
            
            <div className="border-b border-[#E8E8E8] pb-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C9A45C] uppercase">DÉTAILS DU REMBOURSEMENT</span>
                <h3 className="font-display font-black text-xl uppercase text-[#0A0A0A]">{selectedRefund.refundNumber}</h3>
              </div>
              <button onClick={() => setSelectedRefund(null)} className="text-black font-bold text-base">✕</button>
            </div>

            {/* METADATA GRID */}
            <div className="p-4 bg-[#F9F9F8] border border-[#E8E8E8] grid grid-cols-2 gap-3 text-xs font-sans">
              <div>
                <span className="text-[10px] font-mono text-[#777777] uppercase block">COMMANDE N°</span>
                <strong className="font-mono text-[#C9A45C]">{selectedRefund.trackingNumber}</strong>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#777777] uppercase block">CLIENT</span>
                <strong className="text-black">{selectedRefund.customerName}</strong>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#777777] uppercase block">FACTURE N°</span>
                <strong className="font-mono text-black">{selectedRefund.invoiceId || 'INV-2026'}</strong>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#777777] uppercase block">PAYS</span>
                <strong className="text-black">{selectedRefund.country}</strong>
              </div>
            </div>

            {/* FINANCIAL SUMMARY */}
            <div className="p-4 border border-[#E8E8E8] space-y-2 text-xs font-sans">
              <h4 className="font-display font-bold uppercase border-b border-[#E8E8E8] pb-2">RÉSUMÉ FINANCIER DU DOSSIER</h4>
              <div className="flex justify-between text-[#777777]">
                <span>Montant Total Commande:</span>
                <span className="font-mono font-bold text-black">{formatPrice(selectedRefund.originalOrderAmount)}</span>
              </div>
              <div className="flex justify-between text-[#777777]">
                <span>Montant Réellement Payé:</span>
                <span className="font-mono font-bold text-[#0A9F68]">{formatPrice(selectedRefund.totalPaidAmount)}</span>
              </div>
              <div className="flex justify-between text-[#777777]">
                <span>Déjà Remboursé Auparavant:</span>
                <span className="font-mono text-neutral-600">{formatPrice(selectedRefund.alreadyRefundedAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-red-600 border-t border-[#E8E8E8] pt-2">
                <span>MONTANT DU REMBOURSEMENT:</span>
                <span className="font-mono">{formatPrice(selectedRefund.refundAmount)}</span>
              </div>
            </div>

            {/* REASON & METHOD */}
            <div className="space-y-2 text-xs font-sans">
              <div className="p-3 bg-[#F9F9F8] border border-[#E8E8E8]">
                <span className="text-[10px] font-mono text-[#777777] uppercase block">MOTIF DU RETOUR</span>
                <strong>{selectedRefund.reasonCategory}: {selectedRefund.reason}</strong>
              </div>
              <div className="p-3 bg-[#F9F9F8] border border-[#E8E8E8]">
                <span className="text-[10px] font-mono text-[#777777] uppercase block">MODE DE RÈGLEMENT</span>
                <strong className="text-[#0A9F68]">{selectedRefund.refundMethod}</strong>
              </div>
            </div>

            {/* ACTION LOGS TIMELINE (SECTION 19) */}
            <div className="space-y-3 font-sans">
              <h4 className="font-display font-bold uppercase text-xs border-b border-[#E8E8E8] pb-2">HISTORIQUE ET TRAÇABILITÉ DES ACTIONS</h4>
              <div className="space-y-2 text-xs font-sans">
                {selectedRefund.actionLogs?.map((log, idx) => (
                  <div key={idx} className="p-3 bg-[#F9F9F8] border-l-2 border-[#0A0A0A]">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#777777]">
                      <span>{new Date(log.date).toLocaleString('fr-FR')}</span>
                      <strong className="text-black">{log.user}</strong>
                    </div>
                    <div className="font-bold text-xs mt-1">{log.action}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
};
