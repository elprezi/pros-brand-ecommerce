import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { useStore } from '../../store/storeContext';
import type { PromoCode, CouponDiscountType, CouponStatus } from '../../types/ecommerce';
import {
  Tag,
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Percent,
  Coins,
  Truck,
  ChevronLeft,
  ChevronRight,
  Power,
} from 'lucide-react';

export const AdminCouponsPage: React.FC = () => {
  const { promoCodes, addPromoCode, updatePromoCode, deletePromoCode, togglePromoCodeStatus, formatPrice } = useStore();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CouponDiscountType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'usage' | 'discount'>('newest');

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<PromoCode | null>(null);
  const [activeDetailCoupon, setActiveDetailCoupon] = useState<PromoCode | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<PromoCode | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State for Create / Edit Modal
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    description: string;
    discountType: CouponDiscountType;
    discountValue: number;
    minimumOrderAmount: number;
    maximumDiscountAmount: number;
    usageLimit: number;
    usageLimitPerCustomer: number;
    startsAt: string;
    expiresAt: string;
    active: boolean;
    freeShipping: boolean;
    firstOrderOnly: boolean;
  }>({
    code: '',
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minimumOrderAmount: 30000,
    maximumDiscountAmount: 25000,
    usageLimit: 100,
    usageLimitPerCustomer: 1,
    startsAt: new Date().toISOString().slice(0, 10),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    active: true,
    freeShipping: false,
    firstOrderOnly: false,
  });

  // Calculate Real-time KPI Stats from Store Context / PostgreSQL
  const stats = useMemo(() => {
    const total = promoCodes.length;
    const active = promoCodes.filter((c) => c.active && c.status === 'ACTIVE').length;
    const scheduled = promoCodes.filter((c) => c.status === 'SCHEDULED').length;
    const expired = promoCodes.filter((c) => c.status === 'EXPIRED').length;
    const exhausted = promoCodes.filter((c) => c.status === 'EXHAUSTED' || c.status === 'DISABLED' || !c.active).length;
    
    const totalUsages = promoCodes.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    const totalDiscounts = promoCodes.reduce((sum, c) => sum + (c.totalDiscountGranted || 0), 0);

    return { total, active, scheduled, expired, exhausted, totalUsages, totalDiscounts };
  }, [promoCodes]);

  // Filtered & Sorted Coupons List
  const filteredCoupons = useMemo(() => {
    return promoCodes
      .filter((c) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query));

        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesType = typeFilter === 'all' || c.discountType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'usage') return (b.usageCount || 0) - (a.usageCount || 0);
        if (sortBy === 'discount') return (b.totalDiscountGranted || 0) - (a.totalDiscountGranted || 0);
        return 0;
      });
  }, [promoCodes, searchTerm, statusFilter, typeFilter, sortBy]);

  // Paginated List
  const totalPages = Math.ceil(filteredCoupons.length / pageSize) || 1;
  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCoupons.slice(start, start + pageSize);
  }, [filteredCoupons, currentPage, pageSize]);

  // Helper to generate a random unique promo code
  const handleGenerateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    let rand2 = '';
    for (let i = 0; i < 4; i++) rand2 += chars.charAt(Math.floor(Math.random() * chars.length));
    const generated = `PROS-${rand}-${rand2}`;
    setFormData((prev) => ({ ...prev, code: generated }));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: `PROS${new Date().getFullYear()}`,
      name: 'Remise Exclusive PROS',
      description: 'Offre promotionnelle accordée aux membres privilège PROS.',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minimumOrderAmount: 30000,
      maximumDiscountAmount: 25000,
      usageLimit: 100,
      usageLimitPerCustomer: 1,
      startsAt: new Date().toISOString().slice(0, 10),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      active: true,
      freeShipping: false,
      firstOrderOnly: false,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (coupon: PromoCode) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderAmount: coupon.minimumOrderAmount || 0,
      maximumDiscountAmount: coupon.maximumDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      usageLimitPerCustomer: coupon.usageLimitPerCustomer || 1,
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
      active: coupon.active,
      freeShipping: coupon.freeShipping || false,
      firstOrderOnly: coupon.firstOrderOnly || false,
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) return;

    if (editingCoupon) {
      const updated: PromoCode = {
        ...editingCoupon,
        code: cleanCode,
        name: formData.name,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minimumOrderAmount: Number(formData.minimumOrderAmount),
        maximumDiscountAmount: Number(formData.maximumDiscountAmount),
        usageLimit: Number(formData.usageLimit),
        usageLimitPerCustomer: Number(formData.usageLimitPerCustomer),
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        active: formData.active,
        status: formData.active ? 'ACTIVE' : 'DISABLED',
        freeShipping: formData.discountType === 'FREE_SHIPPING' || formData.freeShipping,
        firstOrderOnly: formData.firstOrderOnly,
        updatedAt: new Date().toISOString(),
      };
      updatePromoCode(updated);
      setSuccessMsg(`Code promo "${cleanCode}" mis à jour avec succès.`);
    } else {
      const newCoupon: PromoCode = {
        id: `coupon-${Date.now()}`,
        code: cleanCode,
        name: formData.name,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minimumOrderAmount: Number(formData.minimumOrderAmount),
        maximumDiscountAmount: Number(formData.maximumDiscountAmount),
        usageLimit: Number(formData.usageLimit),
        usageLimitPerCustomer: Number(formData.usageLimitPerCustomer),
        usageCount: 0,
        totalDiscountGranted: 0,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        status: formData.active ? 'ACTIVE' : 'DISABLED',
        active: formData.active,
        freeShipping: formData.discountType === 'FREE_SHIPPING' || formData.freeShipping,
        firstOrderOnly: formData.firstOrderOnly,
        createdAt: new Date().toISOString(),
      };
      addPromoCode(newCoupon);
      setSuccessMsg(`Code promo "${cleanCode}" créé avec succès et actif sur la boutique.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Toggle Active Status
  const handleToggleStatus = (coupon: PromoCode) => {
    togglePromoCodeStatus(coupon.id);
    setSuccessMsg(`Code promo "${coupon.code}" ${coupon.active ? 'désactivé' : 'activé'}.`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (couponToDelete) {
      deletePromoCode(couponToDelete.id);
      setSuccessMsg(`Code promo "${couponToDelete.code}" supprimé.`);
      setCouponToDelete(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredCoupons.length === 0) return;

    const BOM = '\uFEFF';
    const headers = ['CODE', 'NOM', 'TYPE', 'VALEUR', 'MINIMUM_PANIER', 'LIMITATION', 'UTILISATIONS', 'REMISES_CUMULÉES', 'DÉBUT', 'EXPIRATION', 'STATUT'];

    const rows = filteredCoupons.map((c) => [
      `"${c.code}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.discountType}"`,
      `"${c.discountType === 'PERCENTAGE' ? c.discountValue + '%' : c.discountType === 'FIXED_AMOUNT' ? c.discountValue + ' FCFA' : 'LIVRAISON GRATUITE'}"`,
      `"${c.minimumOrderAmount ? c.minimumOrderAmount + ' FCFA' : 'AUCUN'}"`,
      `"${c.usageLimit ? c.usageLimit + ' max' : 'ILLIMITÉ'}"`,
      `"${c.usageCount || 0}"`,
      `"${c.totalDiscountGranted || 0} FCFA"`,
      `"${c.startsAt ? new Date(c.startsAt).toLocaleDateString('fr-FR') : 'IMMÉDIAT'}"`,
      `"${c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fr-FR') : 'PERMANENT'}"`,
      `"${c.status}"`,
    ].join(';'));

    const csvContent = BOM + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pros_codes_promo_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (coupon: PromoCode) => {
    if (!coupon.active || coupon.status === 'DISABLED') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300 uppercase font-sans">DÉSACTIVÉ</span>;
    }
    if (coupon.status === 'EXPIRED') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase font-sans">EXPIRÉ</span>;
    }
    if (coupon.status === 'EXHAUSTED' || (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit)) {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-orange-100 text-orange-800 border border-orange-300 uppercase font-sans">ÉPUISÉ</span>;
    }
    if (coupon.status === 'SCHEDULED') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-300 uppercase font-sans">PROGRAMMÉ</span>;
    }
    return <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase font-sans">ACTIF</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="MARKETING & PROMOTIONS PROS"
          title="GESTION DES CODES PROMOTIONNELS"
          description="Créez et gagnez l'engagement client avec des coupons de réduction, remises fixes et livraisons offertes."
          primaryAction={
            <div className="flex flex-wrap items-center gap-3 font-sans">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                <Download size={14} />
                <span>EXPORTER CSV</span>
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md font-sans"
              >
                <Plus size={16} />
                <span>CRÉER UN COUPON</span>
              </button>
            </div>
          }
        />

        {/* Success Banner */}
        {successMsg && (
          <div className="p-4 bg-green-100 border border-green-300 text-green-900 text-xs font-bold flex items-center justify-between animate-fade-in font-sans">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-green-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* 7 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-sans">
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block">TOTAL</span>
            <div className="text-xl font-bold text-black">{stats.total}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider block">ACTIFS</span>
            <div className="text-xl font-bold text-emerald-700">{stats.active}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider block">PROGRAMMÉS</span>
            <div className="text-xl font-bold text-blue-700">{stats.scheduled}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-red-600 uppercase font-bold tracking-wider block">EXPIRÉS</span>
            <div className="text-xl font-bold text-red-700">{stats.expired}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-orange-600 uppercase font-bold tracking-wider block">ÉPUISÉS</span>
            <div className="text-xl font-bold text-orange-700">{stats.exhausted}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-pros-gold uppercase font-bold tracking-wider block">UTILISATIONS</span>
            <div className="text-xl font-bold text-pros-gold">{stats.totalUsages}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans col-span-2 sm:col-span-1">
            <span className="text-[10px] text-pros-black uppercase font-bold tracking-wider block truncate">REMISES TOTALES</span>
            <div className="text-base font-bold text-black font-mono truncate">{formatPrice(stats.totalDiscounts)}</div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-pros-bone border border-neutral-200 p-4 space-y-4 shadow-sm font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-sans">
            
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par code (ex: PROS2026), intitulé, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">STATUT : TOUS</option>
              <option value="ACTIVE">ACTIFS</option>
              <option value="SCHEDULED">PROGRAMMÉS</option>
              <option value="EXPIRED">EXPIRÉS</option>
              <option value="EXHAUSTED">ÉPUISÉS</option>
              <option value="DISABLED">DÉSACTIVÉS</option>
            </select>

            {/* Discount Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">TYPE DE REMISE : TOUS</option>
              <option value="PERCENTAGE">POURCENTAGE (%)</option>
              <option value="FIXED_AMOUNT">MONTANT FIXE (FCFA)</option>
              <option value="FREE_SHIPPING">LIVRAISON GRATUITE</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="newest">PLUS RÉCENTS</option>
              <option value="oldest">PLUS ANCIENS</option>
              <option value="usage">PLUS UTILISÉS</option>
              <option value="discount">PLUS GRANDE REMISE</option>
            </select>

          </div>
        </div>

        {/* Data Container: Responsive Desktop Table / Mobile Cards */}
        <div className="bg-white border border-neutral-200 shadow-sm font-sans">
          {promoCodes.length === 0 ? (
            /* Official Empty State when promoCodes.length === 0 */
            <div className="p-16 text-center font-sans">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-pros-bone border border-neutral-300 flex items-center justify-center mx-auto text-black">
                  <Tag size={32} />
                </div>
                <h3 className="font-display font-bold text-xl uppercase text-black">AUCUN CODE PROMOTIONNEL</h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                  Créez votre premier code promotionnel pour lancer des campagnes marketing sur la boutique PROS.
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-6 py-3 bg-pros-black text-white text-xs font-bold uppercase hover:bg-neutral-800 inline-flex items-center gap-2 cursor-pointer font-sans"
                >
                  <Plus size={16} />
                  <span>CRÉER UN COUPON PROS</span>
                </button>
              </div>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="p-16 text-center font-sans">
              <div className="max-w-sm mx-auto space-y-3">
                <Search className="mx-auto text-neutral-400" size={36} />
                <h3 className="font-display font-bold text-sm uppercase text-black">AUCUN CODE TROUVÉ</h3>
                <p className="text-xs text-neutral-500">Aucun code promo ne correspond à vos filtres actuels.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                  className="px-4 py-2 bg-pros-black text-white text-xs font-bold uppercase hover:bg-neutral-800 inline-flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <RotateCcw size={14} />
                  <span>RÉINITIALISER FILTRES</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto font-sans">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-pros-bone border-b border-neutral-200 text-[10px] font-bold text-black uppercase font-sans">
                    <tr>
                      <th className="p-3 w-40">CODE PROMO</th>
                      <th className="p-3">INTITULÉ & DESCRIPTION</th>
                      <th className="p-3 w-36">VALEUR DE REMISE</th>
                      <th className="p-3 w-40">CONDITIONS</th>
                      <th className="p-3 w-32 text-center">UTILISATIONS</th>
                      <th className="p-3 w-36 text-right">REMISES ACCORDÉES</th>
                      <th className="p-3 text-center w-28">STATUT</th>
                      <th className="p-3 text-right w-36">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-xs font-sans">
                    {paginatedCoupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-pros-bone/70 transition-colors font-sans">
                        
                        {/* Code Promo */}
                        <td className="p-3 align-top">
                          <div className="inline-flex items-center gap-1.5 font-mono font-bold text-xs bg-black text-pros-gold px-2.5 py-1 uppercase tracking-wider border border-pros-gold/30">
                            <Tag size={12} className="text-pros-gold" />
                            <span>{coupon.code}</span>
                          </div>
                        </td>

                        {/* Intitulé & Description */}
                        <td className="p-3 align-top max-w-xs">
                          <div className="font-bold text-black text-xs uppercase">{coupon.name}</div>
                          {coupon.description && (
                            <p className="text-neutral-600 text-[11px] leading-relaxed line-clamp-1 mt-0.5">{coupon.description}</p>
                          )}
                          <div className="text-[10px] text-neutral-400 font-mono mt-1">
                            {coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString('fr-FR') : 'Actif'} →{' '}
                            {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('fr-FR') : 'Illimité'}
                          </div>
                        </td>

                        {/* Valeur de Remise */}
                        <td className="p-3 align-top font-sans">
                          {coupon.discountType === 'PERCENTAGE' && (
                            <div className="font-bold text-emerald-700 text-xs flex items-center gap-1">
                              <Percent size={13} />
                              <span>{coupon.discountValue} % OFF</span>
                            </div>
                          )}
                          {coupon.discountType === 'FIXED_AMOUNT' && (
                            <div className="font-bold text-emerald-700 text-xs font-mono flex items-center gap-1">
                              <Coins size={13} />
                              <span>-{formatPrice(coupon.discountValue)}</span>
                            </div>
                          )}
                          {(coupon.discountType === 'FREE_SHIPPING' || coupon.freeShipping) && (
                            <div className="font-bold text-blue-700 text-xs uppercase flex items-center gap-1">
                              <Truck size={13} />
                              <span>LIVRAISON OFFERTE</span>
                            </div>
                          )}
                          {coupon.maximumDiscountAmount ? (
                            <span className="text-[10px] text-neutral-500 font-mono block">Plafond: {formatPrice(coupon.maximumDiscountAmount)}</span>
                          ) : null}
                        </td>

                        {/* Conditions */}
                        <td className="p-3 align-top text-[11px]">
                          {coupon.minimumOrderAmount ? (
                            <div className="text-neutral-800 font-mono">Min: {formatPrice(coupon.minimumOrderAmount)}</div>
                          ) : (
                            <div className="text-neutral-400">Sans minimum</div>
                          )}
                          {coupon.firstOrderOnly && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 uppercase mt-0.5 inline-block">1ère COMMANDE</span>
                          )}
                        </td>

                        {/* Utilisations */}
                        <td className="p-3 align-top text-center font-mono text-xs">
                          <span className="font-bold text-black">{coupon.usageCount || 0}</span>
                          <span className="text-neutral-400 font-normal"> / {coupon.usageLimit || '∞'}</span>
                        </td>

                        {/* Remises Accordées */}
                        <td className="p-3 align-top text-right font-mono text-xs font-bold text-black">
                          {formatPrice(coupon.totalDiscountGranted || 0)}
                        </td>

                        {/* Statut Badge */}
                        <td className="p-3 align-top text-center">
                          {getStatusBadge(coupon)}
                        </td>

                        {/* Actions */}
                        <td className="p-3 align-top text-right space-x-1 font-sans">
                          <button
                            onClick={() => setActiveDetailCoupon(coupon)}
                            className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black cursor-pointer inline-flex items-center"
                            title="Voir détail complet"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black cursor-pointer inline-flex items-center"
                            title="Modifier le coupon"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(coupon)}
                            className={`p-1.5 border cursor-pointer inline-flex items-center ${
                              coupon.active ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100' : 'bg-neutral-100 border-neutral-300 text-neutral-500 hover:bg-neutral-200'
                            }`}
                            title={coupon.active ? 'Désactiver le coupon' : 'Activer le coupon'}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => setCouponToDelete(coupon)}
                            className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-red-100 hover:border-red-300 text-red-600 cursor-pointer inline-flex items-center"
                            title="Supprimer le coupon"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="block md:hidden divide-y divide-neutral-200 font-sans">
                {paginatedCoupons.map((coupon) => (
                  <div key={coupon.id} className="p-4 space-y-3 bg-white font-sans">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex items-center gap-1.5 font-mono font-bold text-xs bg-black text-pros-gold px-2.5 py-1 uppercase tracking-wider">
                        <Tag size={12} />
                        <span>{coupon.code}</span>
                      </div>
                      <div>{getStatusBadge(coupon)}</div>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-black uppercase">{coupon.name}</div>
                      {coupon.description && <p className="text-xs text-neutral-600 mt-0.5">{coupon.description}</p>}
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-b border-neutral-100 py-2">
                      <span className="font-bold text-emerald-700 font-mono">
                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : coupon.discountType === 'FIXED_AMOUNT' ? `-${formatPrice(coupon.discountValue)}` : 'LIVRAISON OFFERTE'}
                      </span>
                      <span className="text-neutral-500 font-mono">
                        {coupon.usageCount || 0} / {coupon.usageLimit || '∞'} utilisations
                      </span>
                    </div>

                    <div className="flex gap-2 font-sans">
                      <button
                        onClick={() => setActiveDetailCoupon(coupon)}
                        className="flex-1 py-2 bg-pros-bone border border-neutral-300 font-bold text-xs uppercase"
                      >
                        DÉTAIL
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(coupon)}
                        className="flex-1 py-2 bg-pros-black text-white font-bold text-xs uppercase"
                      >
                        MODIFIER
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {filteredCoupons.length > 0 && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-pros-bone border-t border-neutral-200 text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-bold uppercase text-[10px]">Afficher :</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-neutral-300 px-2 py-1 text-black text-xs focus:outline-none"
                >
                  <option value={20}>20 par page</option>
                  <option value={50}>50 par page</option>
                </select>
                <span className="text-neutral-500 text-[10px] uppercase font-mono ml-2">
                  {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredCoupons.length)} sur {filteredCoupons.length} coupons
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 font-bold text-xs uppercase cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> PRÉCÉDENT
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 font-bold text-xs uppercase cursor-pointer flex items-center gap-1"
                >
                  SUIVANT <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Coupon Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-3xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <Tag size={22} className="text-pros-gold" />
                  <h3 className="font-display font-bold text-lg uppercase text-black">
                    {editingCoupon ? `MODIFIER LE CODE PROMO #${editingCoupon.code}` : 'CRÉER UN NOUVEAU COUPON PROS'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6 text-xs font-sans">
                
                {/* Section 1: Informations de base */}
                <div className="space-y-3 p-4 bg-pros-bone border border-neutral-200">
                  <span className="font-bold uppercase text-[11px] text-pros-gold block">SECTION 1 — INFORMATIONS DE BASE</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold uppercase text-black block mb-1">CODE PROMO (UNIQUE) *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                          placeholder="EX: PROS2026"
                          className="flex-1 bg-white border border-neutral-300 px-3 py-2 text-black font-mono font-bold uppercase text-xs focus:outline-none focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateCode}
                          className="px-3 py-2 bg-black text-pros-gold font-bold text-[10px] uppercase hover:bg-neutral-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={12} /> GENERER
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold uppercase text-black block mb-1">NOM / INTITULÉ DE LA PROMOTION *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Offre Inaugurale PROS 15%"
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-black font-sans text-xs focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold uppercase text-black block mb-1">DESCRIPTION PUBLIQUE / INTERNE</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Précisez le cadre de validité et la cible de l'offre..."
                      className="w-full bg-white border border-neutral-300 px-3 py-2 text-black font-sans text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Section 2: Type et Valeur de Remise */}
                <div className="space-y-3 p-4 bg-pros-bone border border-neutral-200">
                  <span className="font-bold uppercase text-[11px] text-pros-gold block">SECTION 2 — VALEUR & REMISE</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold uppercase text-black block mb-1">TYPE DE REMISE *</label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value as CouponDiscountType })}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-black font-sans font-bold uppercase text-xs focus:outline-none"
                      >
                        <option value="PERCENTAGE">Pourcentage (%)</option>
                        <option value="FIXED_AMOUNT">Montant Fixe (FCFA)</option>
                        <option value="FREE_SHIPPING">Livraison Gratuite</option>
                      </select>
                    </div>

                    {formData.discountType !== 'FREE_SHIPPING' && (
                      <div>
                        <label className="font-bold uppercase text-black block mb-1">
                          {formData.discountType === 'PERCENTAGE' ? 'VALEUR EN POURCENT (%) *' : 'VALEUR EN FCFA *'}
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={formData.discountValue}
                          onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black font-mono font-bold text-xs focus:outline-none"
                        />
                      </div>
                    )}

                    {formData.discountType === 'PERCENTAGE' && (
                      <div>
                        <label className="font-bold uppercase text-black block mb-1">PLAFOND MAX DE REMISE (FCFA)</label>
                        <input
                          type="number"
                          min={0}
                          value={formData.maximumDiscountAmount}
                          onChange={(e) => setFormData({ ...formData, maximumDiscountAmount: Number(e.target.value) })}
                          placeholder="Ex: 25000"
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black font-mono text-xs focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Conditions & Limites */}
                <div className="space-y-3 p-4 bg-pros-bone border border-neutral-200">
                  <span className="font-bold uppercase text-[11px] text-pros-gold block">SECTION 3 — CONDITIONS & LIMITES D'UTILISATION</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold uppercase text-black block mb-1">MINIMUM D'ACHAT PANIER (FCFA)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.minimumOrderAmount}
                        onChange={(e) => setFormData({ ...formData, minimumOrderAmount: Number(e.target.value) })}
                        placeholder="Ex: 30000"
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-black font-mono text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold uppercase text-black block mb-1">LIMITE GLOBALE D'UTILISATION</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.usageLimit}
                        onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                        placeholder="0 = Illimité"
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-black font-mono text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold uppercase text-black block mb-1">PÉRIODE DE VALIDITÉ (DATES)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={formData.startsAt}
                          onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-2 py-1.5 text-black font-mono text-[11px]"
                        />
                        <input
                          type="date"
                          value={formData.expiresAt}
                          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-2 py-1.5 text-black font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.firstOrderOnly}
                        onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                        className="accent-black"
                      />
                      <span className="font-bold uppercase text-black text-xs">Première commande uniquement</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="accent-black"
                      />
                      <span className="font-bold uppercase text-emerald-800 text-xs">Coupon Actif immédiatement</span>
                    </label>
                  </div>
                </div>

                {/* Live Dynamic Preview Box */}
                <div className="p-4 bg-black text-white space-y-2 border border-pros-gold/40">
                  <span className="text-[10px] text-pros-gold font-bold uppercase tracking-wider block">APERÇU EN DIRECT SUR LA BOUTIQUE</span>
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-sm font-bold text-pros-gold uppercase">{formData.code || 'CODEPROMO'}</div>
                    <span className="text-xs font-bold text-emerald-400">
                      {formData.discountType === 'PERCENTAGE' ? `-${formData.discountValue}%` : formData.discountType === 'FIXED_AMOUNT' ? `-${formatPrice(formData.discountValue)}` : 'LIVRAISON OFFERTE'}
                    </span>
                  </div>
                  <div className="text-xs text-white/80 font-sans">{formData.name}</div>
                  <div className="text-[10px] text-white/50 font-mono">
                    Minimum panier: {formData.minimumOrderAmount ? formatPrice(formData.minimumOrderAmount) : 'Aucun'} • Limite: {formData.usageLimit || 'Illimitée'}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                  >
                    ANNULER
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer"
                  >
                    {editingCoupon ? 'ENREGISTRER MODIFICATIONS' : 'PUBLIER LE COUPON PROS'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Detailed Coupon Drawer / Modal */}
        {activeDetailCoupon && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-xl w-full p-8 space-y-6 text-black font-sans shadow-2xl">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <Tag size={22} className="text-pros-gold" />
                  <h3 className="font-display font-bold text-lg uppercase text-black">
                    FICHE TECHNIQUE COUPON #{activeDetailCoupon.code}
                  </h3>
                </div>
                <button onClick={() => setActiveDetailCoupon(null)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-black text-white">
                <div className="font-mono text-base font-bold text-pros-gold uppercase">{activeDetailCoupon.code}</div>
                {getStatusBadge(activeDetailCoupon)}
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">INTITULÉ DE LA PROMOTION</span>
                  <div className="font-bold text-sm text-black uppercase">{activeDetailCoupon.name}</div>
                  {activeDetailCoupon.description && <p className="text-neutral-600 mt-1">{activeDetailCoupon.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-pros-bone border border-neutral-200 font-sans">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">VALEUR DE REMISE</span>
                    <div className="font-bold text-emerald-800 text-sm font-mono">
                      {activeDetailCoupon.discountType === 'PERCENTAGE' ? `${activeDetailCoupon.discountValue}% DE RÉDUCTION` : activeDetailCoupon.discountType === 'FIXED_AMOUNT' ? `-${formatPrice(activeDetailCoupon.discountValue)}` : 'LIVRAISON OFFERTE'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">MINIMUM PANIER</span>
                    <div className="font-bold text-black text-sm font-mono">
                      {activeDetailCoupon.minimumOrderAmount ? formatPrice(activeDetailCoupon.minimumOrderAmount) : 'SANS MINIMUM'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 border border-neutral-200 font-sans">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">UTILISATIONS RÉALISÉES</span>
                    <div className="font-bold text-black text-sm font-mono">
                      {activeDetailCoupon.usageCount || 0} / {activeDetailCoupon.usageLimit || 'Illimité'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase font-bold block">TOTAL CUMULÉ REMISÉ</span>
                    <div className="font-bold text-pros-gold text-sm font-mono">
                      {formatPrice(activeDetailCoupon.totalDiscountGranted || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-end">
                <button
                  onClick={() => setActiveDetailCoupon(null)}
                  className="px-6 py-2 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800"
                >
                  FERMER
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AdminConfirmDialog
          isOpen={!!couponToDelete}
          title="SUPPRIMER LE CODE PROMO"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le code promo "${couponToDelete?.code}" ? Cette action empêchera son utilisation future.`}
          confirmText="SUPPRIMER DÉFINITIVEMENT"
          onConfirm={handleConfirmDelete}
          onCancel={() => setCouponToDelete(null)}
        />

      </div>
    </AdminLayout>
  );
};
