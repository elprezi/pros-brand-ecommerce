import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { useCms } from '../../store/cmsContext';
import type {
  ProsBanner,
  BannerType,
  BannerStatus,
  BannerValidationStatus,
  BannerValidationReason,
  BannerLocation,
  MediaItem,
} from '../../store/cmsContext';
import { useStore } from '../../store/storeContext';
import { useAuth } from '../../store/authContext';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Image as ImageIcon,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  RotateCcw,
  Smartphone,
  Monitor,
  Phone,
  Wrench,
  AlertTriangle,
} from 'lucide-react';

export const AdminBannersContent: React.FC = () => {
  const {
    banners,
    draftCms,
    mediaLibrary,
    addBanner,
    updateBanner,
    replaceBannerMedia,
    deleteBanner,
    toggleBannerStatus,
    publishBanner,
    restoreBannerVersion,
    activeVersion,
  } = useCms();

  const { categories: storeCategories, collections: storeCollections, settings } = useStore();
  const { hasPermission, currentUser } = useAuth();

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'order' | 'active'>('order');

  // Modals State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<ProsBanner> | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'info' | 'visuals' | 'content' | 'cta' | 'targeting' | 'scheduling' | 'history'>('info');

  // Media Picker Modal Target State
  const [mediaPickerTarget, setMediaPickerTarget] = useState<{
    bannerId?: string;
    type: 'desktop' | 'mobile';
    isFormPicker?: boolean;
  } | null>(null);

  // Preview Modal State
  const [previewBanner, setPreviewBanner] = useState<ProsBanner | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  // Confirmation Modals State
  const [deleteWarningBanner, setDeleteWarningBanner] = useState<ProsBanner | null>(null);
  const [deactivateConfirmBanner, setDeactivateConfirmBanner] = useState<ProsBanner | null>(null);

  // Version History Drawer State
  const [versionHistoryBanner, setVersionHistoryBanner] = useState<ProsBanner | null>(null);

  // Notifications Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, msg });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Media Integrity Check
  const isMediaValid = (mediaId?: string, imageUrl?: string) => {
    if (mediaId) {
      return mediaLibrary.some((m) => m.id === mediaId);
    }
    return !!imageUrl && imageUrl.trim().length > 0;
  };

  // WhatsApp Link & Number Check
  const getResolvedWhatsAppUrl = (banner: Partial<ProsBanner>) => {
    if (banner.ctaUrl && (banner.ctaUrl.includes('wa.me') || banner.ctaUrl.includes('whatsapp.com'))) {
      return banner.ctaUrl;
    }
    const storePhone = settings.whatsAppNumber || '+221 77 000 00 00';
    const cleanPhone = storePhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}`;
  };

  const isWhatsAppConfigured = (banner: Partial<ProsBanner>) => {
    if (banner.type !== 'WHATSAPP') return true;
    const resolvedUrl = getResolvedWhatsAppUrl(banner);
    return resolvedUrl.includes('wa.me') && resolvedUrl.length > 15;
  };

  // Validate Banner Data
  const validateBannerData = (banner: Partial<ProsBanner>): { isValid: boolean; reason: BannerValidationReason; errors: string[] } => {
    const errors: string[] = [];
    let reason: BannerValidationReason = 'NONE';

    // 1. Desktop Media Validation
    if (!isMediaValid(banner.desktopMediaId, banner.desktopImageUrl)) {
      reason = 'MEDIA_MISSING';
      errors.push(`Média Desktop (${banner.desktopMediaId || 'URL'}) manquant dans la Médiathèque PROS.`);
    }

    // 2. WhatsApp Validation
    if (banner.type === 'WHATSAPP' && !isWhatsAppConfigured(banner)) {
      if (reason === 'NONE') reason = 'INVALID_WHATSAPP';
      errors.push('Numéro WhatsApp non configuré ou lien de chat invalide.');
    }

    // 3. Target Entity Validation
    if (banner.targetLocation === 'COLLECTION' && !banner.targetEntityId) {
      if (reason === 'NONE') reason = 'MISSING_ENTITY';
      errors.push('Collection ciblée obligatoire pour cet emplacement.');
    } else if (banner.targetLocation === 'CATEGORY' && !banner.targetEntityId) {
      if (reason === 'NONE') reason = 'MISSING_ENTITY';
      errors.push('Catégorie ciblée obligatoire pour cet emplacement.');
    }

    return { isValid: errors.length === 0, reason, errors };
  };

  // ABSOLUTE BUSINESS RULE: Calculate Effective Banner Status & Validation
  const getEffectiveBannerStatus = (banner: ProsBanner): {
    status: BannerStatus;
    validationStatus: BannerValidationStatus;
    validationReason: BannerValidationReason;
  } => {
    const validation = validateBannerData(banner);

    // CRITICAL: If media or required config is missing, status MUST BE INACTIVE and INVALID!
    if (!validation.isValid) {
      return {
        status: 'INACTIVE',
        validationStatus: 'INVALID',
        validationReason: validation.reason,
      };
    }

    if (banner.status === 'INACTIVE' || banner.status === 'DRAFT') {
      return {
        status: banner.status,
        validationStatus: 'VALID',
        validationReason: 'NONE',
      };
    }

    const now = new Date();
    if (banner.endAt && new Date(banner.endAt) < now) {
      return {
        status: 'EXPIRED',
        validationStatus: 'VALID',
        validationReason: 'NONE',
      };
    }

    if (banner.startAt && new Date(banner.startAt) > now) {
      return {
        status: 'SCHEDULED',
        validationStatus: 'VALID',
        validationReason: 'NONE',
      };
    }

    return {
      status: 'ACTIVE',
      validationStatus: 'VALID',
      validationReason: 'NONE',
    };
  };

  // Helper: Get French Label for Status
  const getFrenchStatusLabel = (eff: { status: BannerStatus; validationStatus: BannerValidationStatus; validationReason: BannerValidationReason }) => {
    if (eff.validationStatus === 'INVALID') {
      if (eff.validationReason === 'MEDIA_MISSING') return 'INACTIVE (MÉDIA MANQUANT)';
      if (eff.validationReason === 'INVALID_WHATSAPP') return 'INACTIVE (WHATSAPP INVALIDE)';
      return 'INACTIVE (À CORRIGER)';
    }

    switch (eff.status) {
      case 'DRAFT': return 'BROUILLON';
      case 'SCHEDULED': return 'PLANIFIÉE';
      case 'ACTIVE': return 'ACTIVE';
      case 'INACTIVE': return 'INACTIVE';
      case 'EXPIRED': return 'EXPIRÉE';
      case 'READY': return 'PRÊT À PUBLIER';
      default: return eff.status;
    }
  };

  // Filtered & Sorted Banners List
  const filteredBanners = useMemo(() => {
    return banners
      .filter((b) => {
        const eff = getEffectiveBannerStatus(b);

        // Search in name, title, eyebrow, description, ctaText
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (b.name || '').toLowerCase().includes(q);
          const matchTitle = (b.title || '').toLowerCase().includes(q);
          const matchEyebrow = (b.eyebrow || '').toLowerCase().includes(q);
          const matchDesc = (b.description || '').toLowerCase().includes(q);
          const matchCta = (b.ctaText || '').toLowerCase().includes(q);
          if (!matchName && !matchTitle && !matchEyebrow && !matchDesc && !matchCta) return false;
        }

        // Type Filter
        if (typeFilter !== 'ALL' && b.type !== typeFilter) return false;

        // Status Filter (includes 'INVALID' for À CORRIGER)
        if (statusFilter === 'INVALID' && eff.validationStatus !== 'INVALID') return false;
        if (statusFilter !== 'ALL' && statusFilter !== 'INVALID' && eff.status !== statusFilter) return false;

        // Location Filter
        if (locationFilter !== 'ALL' && b.targetLocation !== locationFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'active') {
          const effA = getEffectiveBannerStatus(a);
          const effB = getEffectiveBannerStatus(b);
          return (effB.status === 'ACTIVE' && effB.validationStatus === 'VALID' ? 1 : 0) - (effA.status === 'ACTIVE' && effA.validationStatus === 'VALID' ? 1 : 0);
        }
        return (a.sortOrder || 99) - (b.sortOrder || 99);
      });
  }, [banners, searchQuery, typeFilter, statusFilter, locationFilter, sortBy, mediaLibrary, settings]);

  // Dynamic Statistics (Calculated strictly from real state)
  const totalCount = banners.length;

  // Active Count: ONLY banners that are status === 'ACTIVE' AND validationStatus === 'VALID'!
  const activeCount = banners.filter((b) => {
    const eff = getEffectiveBannerStatus(b);
    return eff.status === 'ACTIVE' && eff.validationStatus === 'VALID';
  }).length;

  const scheduledCount = banners.filter((b) => getEffectiveBannerStatus(b).status === 'SCHEDULED').length;
  const draftCount = banners.filter((b) => b.status === 'DRAFT').length;
  const expiredCount = banners.filter((b) => getEffectiveBannerStatus(b).status === 'EXPIRED').length;
  
  // INVALID Count (Banners with missing media or config errors needing repair)
  const invalidCount = banners.filter((b) => getEffectiveBannerStatus(b).validationStatus === 'INVALID').length;

  // Hero Editorial Slider Dynamic Metrics (Strictly bound to CMS Homepage)
  const activeHeroSlidesCount = draftCms.hero.filter((s) => s.status === 'ACTIVE' && isMediaValid(s.desktopMediaId, s.desktopImageUrl)).length;
  const totalHeroSlidesCount = draftCms.hero.length;
  const invalidHeroSlidesCount = draftCms.hero.filter((s) => !isMediaValid(s.desktopMediaId, s.desktopImageUrl)).length;

  // Open Create Modal
  const handleOpenCreateModal = () => {
    if (!hasPermission('CREATE_BANNERS')) {
      showToast("Vous n'avez pas la permission de créer une bannière.", 'error');
      return;
    }

    setEditingBanner({
      name: '',
      type: 'PROMOTION',
      status: 'DRAFT',
      desktopMediaId: 'MEDIA_001',
      desktopImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
      mobileMediaId: 'MEDIA_001',
      mobileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      eyebrow: 'PROS BRAND',
      title: '',
      subtitle: '',
      description: '',
      ctaText: 'DÉCOUVRIR',
      ctaUrl: '/shop',
      targetLocation: 'HOMEPAGE',
      sortOrder: banners.length + 1,
      version: '1.0',
    });
    setActiveFormTab('info');
    setIsBannerModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (banner: ProsBanner) => {
    if (!hasPermission('EDIT_BANNERS')) {
      showToast("Vous n'avez pas la permission de modifier des bannières.", 'error');
      return;
    }

    setEditingBanner({ ...banner });
    setActiveFormTab('info');
    setIsBannerModalOpen(true);
  };

  // Save Banner Handler
  const handleSaveBanner = (asDraft = false) => {
    if (!editingBanner) return;

    if (!asDraft) {
      const val = validateBannerData(editingBanner);
      if (!val.isValid) {
        showToast(`Publication impossible : ${val.errors[0]}`, 'error');
        return;
      }
    }

    const payload = {
      ...editingBanner,
      status: asDraft ? ('DRAFT' as BannerStatus) : editingBanner.status || ('ACTIVE' as BannerStatus),
      ctaUrl: editingBanner.type === 'WHATSAPP' ? getResolvedWhatsAppUrl(editingBanner) : editingBanner.ctaUrl || '/shop',
      validationStatus: asDraft ? ('VALID' as BannerValidationStatus) : ('VALID' as BannerValidationStatus),
      validationReason: 'NONE' as BannerValidationReason,
    };

    if (editingBanner.id) {
      updateBanner(payload as ProsBanner, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
      showToast(`Bannière "${editingBanner.name}" mise à jour et revalidée avec succès.`);
    } else {
      addBanner(payload, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
      showToast(`Bannière "${editingBanner.name}" créée avec succès.`);
    }

    setIsBannerModalOpen(false);
    setEditingBanner(null);
  };

  // Publish Banner Handler
  const handlePublishBanner = (banner: ProsBanner) => {
    if (!hasPermission('PUBLISH_BANNERS')) {
      showToast("Vous n'avez pas la permission de publier des bannières.", 'error');
      return;
    }

    const val = validateBannerData(banner);
    if (!val.isValid) {
      showToast(`PUBLICATION IMPOSSIBLE : ${val.errors[0]}`, 'error');
      return;
    }

    const res = publishBanner(banner.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
    if (res.success) {
      showToast(`Bannière "${banner.name}" publiée avec succès (Version v${res.version}).`);
    }
  };

  // Toggle Status Handler
  const handleToggleStatusRequest = (banner: ProsBanner) => {
    const eff = getEffectiveBannerStatus(banner);

    if (eff.status === 'ACTIVE') {
      setDeactivateConfirmBanner(banner);
    } else {
      // Validate before activating!
      const val = validateBannerData(banner);
      if (!val.isValid) {
        showToast(`ACTIVATION IMPOSSIBLE : ${val.errors[0]}`, 'error');
        return;
      }

      toggleBannerStatus(banner.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
      showToast(`Bannière "${banner.name}" activée et mise en ligne.`);
    }
  };

  // Confirm Deactivation
  const handleConfirmDeactivate = () => {
    if (!deactivateConfirmBanner) return;
    toggleBannerStatus(deactivateConfirmBanner.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
    showToast(`Bannière "${deactivateConfirmBanner.name}" désactivée.`);
    setDeactivateConfirmBanner(null);
  };

  // Delete Attempt Handler
  const handleDeleteAttempt = (banner: ProsBanner, force = false) => {
    if (!hasPermission('DELETE_BANNERS')) {
      showToast("Vous n'avez pas la permission de supprimer des bannières.", 'error');
      return;
    }

    const eff = getEffectiveBannerStatus(banner);
    if (eff.status === 'ACTIVE' && !force) {
      setDeleteWarningBanner(banner);
      return;
    }

    const res = deleteBanner(banner.id, force);
    if (res.success) {
      showToast(`Bannière "${banner.name}" supprimée.`);
      setDeleteWarningBanner(null);
    } else if (res.message) {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="MARKETING & BANNIÈRES PROMOTIONNELLES"
          title="GESTION DU CATALOGUE DE BANNIÈRES"
          description="Gérez les bannières carrousel, promotions, bannières WhatsApp, programmes fidélité et ciblages éditoriaux."
          primaryAction={
            hasPermission('CREATE_BANNERS') && (
              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                <Plus size={16} />
                <span>AJOUTER UNE BANNIÈRE</span>
              </button>
            )
          }
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`p-4 border text-xs font-bold flex items-center justify-between font-sans shadow-sm ${
              toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-red-600" />}
              <span>{toastMessage.msg}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Dynamic Statistics Bar (Calculated strictly from real state, no hardcoding) */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 font-sans">
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-sans">TOTAL BANNIÈRES</div>
            <div className="text-2xl font-bold font-mono text-black">{totalCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Campagnes enregistrées</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-sans">BANNIÈRES ACTIVES</div>
            <div className="text-2xl font-bold font-mono text-black">{activeCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Visibles & Valides</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 font-sans">PLANIFIÉES</div>
            <div className="text-2xl font-bold font-mono text-black">{scheduledCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Déclenchement programmé</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 font-sans">BROUILLONS</div>
            <div className="text-2xl font-bold font-mono text-black">{draftCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">En cours d'édition</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 font-sans">EXPIRÉES</div>
            <div className="text-2xl font-bold font-mono text-black">{expiredCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Dates dépassées</div>
          </div>

          {/* NEW STATISTIC CARD: À CORRIGER / INVALIDES */}
          <div className={`p-4 space-y-1 border shadow-sm font-sans ${invalidCount > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-neutral-200'}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-700 font-sans flex items-center gap-1">
              <AlertTriangle size={12} />
              <span>À CORRIGER</span>
            </div>
            <div className="text-2xl font-bold font-mono text-red-700">{invalidCount}</div>
            <div className="text-[10px] text-red-600 font-sans">Médias ou URLs manquants</div>
          </div>
        </div>

        {/* Search, Filters & Sorting Toolbar */}
        <div className="bg-white p-4 border border-neutral-200 space-y-4 font-sans shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher une bannière par nom, titre, eyebrow ou bouton CTA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-pros-bone border border-neutral-300 pl-10 pr-4 py-2 text-xs text-black focus:outline-none focus:border-black font-sans"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-neutral-400 hover:text-black">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 text-xs font-sans w-full md:w-auto">
              <span className="font-bold uppercase text-neutral-500 whitespace-nowrap">TRIER PAR :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs text-black font-bold focus:outline-none cursor-pointer"
              >
                <option value="order">ORDRE D'AFFICHAGE</option>
                <option value="active">ACTIVES EN PREMIER</option>
                <option value="newest">PLUS RÉCENTES</option>
                <option value="oldest">PLUS ANCIENNES</option>
              </select>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-neutral-100 text-xs font-sans">
            <div className="flex items-center gap-1.5 text-neutral-500 font-bold uppercase mr-2">
              <SlidersHorizontal size={14} />
              <span>FILTRES :</span>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-pros-bone border border-neutral-300 px-2.5 py-1 text-xs text-black font-sans focus:outline-none cursor-pointer"
            >
              <option value="ALL">TOUS LES TYPES</option>
              <option value="HERO">HERO EDITORIAL</option>
              <option value="PROMOTION">PROMOTION</option>
              <option value="COLLECTION">COLLECTION</option>
              <option value="COMMUNICATION">COMMUNICATION</option>
              <option value="WHATSAPP">WHATSAPP</option>
              <option value="FIDELITE">FIDÉLITÉ</option>
              <option value="PROS_CLUB">PROS CLUB</option>
            </select>

            {/* Status Filter (with À CORRIGER option) */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-pros-bone border border-neutral-300 px-2.5 py-1 text-xs text-black font-sans focus:outline-none cursor-pointer font-bold"
            >
              <option value="ALL">TOUS LES STATUTS</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INVALID">⚠ À CORRIGER / INVALIDES ({invalidCount})</option>
              <option value="SCHEDULED">PLANIFIÉE</option>
              <option value="DRAFT">BROUILLON</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="EXPIRED">EXPIRÉE</option>
            </select>

            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-pros-bone border border-neutral-300 px-2.5 py-1 text-xs text-black font-sans focus:outline-none cursor-pointer"
            >
              <option value="ALL">TOUS LES EMPLACEMENTS</option>
              <option value="HOMEPAGE">PAGE D'ACCUEIL</option>
              <option value="SHOP">BOUTIQUE (/SHOP)</option>
              <option value="COLLECTION">COLLECTIONS</option>
              <option value="CATEGORY">CATÉGORIES</option>
              <option value="PROS_CLUB">PROS CLUB</option>
            </select>
          </div>
        </div>

        {/* Banners Grid / List */}
        <div className="space-y-6 font-sans">
          
          {/* FEATURED CARD 1: HERO EDITORIAL SLIDER (Unified directly with Homepage CMS) */}
          <div className="bg-white border-2 border-pros-black p-6 space-y-4 shadow-md font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pros-black text-pros-gold">
                  <ImageIcon size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-pros-black text-white uppercase font-mono">
                      UNIFIÉ HOMEPAGE CMS
                    </span>
                    {invalidHeroSlidesCount > 0 ? (
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-red-600 text-white uppercase flex items-center gap-1">
                        <AlertTriangle size={11} /> SLIDE NON PUBLIABLE (MÉDIA MANQUANT)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                        ACTIVE ({activeHeroSlidesCount} SLIDES)
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-lg text-black uppercase mt-1">HERO EDITORIAL SLIDER</h3>
                  <p className="text-xs text-neutral-500">Bannière Carrousel Principale de la Page d'Accueil PROS.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/admin/marketing/homepage"
                  className="px-4 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Edit3 size={14} />
                  <span>GÉRER CMS HOMEPAGE</span>
                </a>
              </div>
            </div>

            {/* Dynamic Status Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-pros-bone border border-neutral-200 font-sans text-xs">
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Visuels Actifs</span>
                <strong className="text-black font-mono text-sm">{activeHeroSlidesCount} VISUELS EN LIGNE</strong>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Total Slides</span>
                <strong className="text-black font-mono text-sm">{totalHeroSlidesCount} SLIDES CONFIGURÉES</strong>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Version Publiée</span>
                <strong className="text-pros-gold font-mono text-sm">{activeVersion}</strong>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Support Viewports</span>
                <strong className="text-black font-mono text-sm">DESKTOP & MOBILE 390px</strong>
              </div>
            </div>
          </div>

          {/* DYNAMIC BANNERS CARDS GRID */}
          {filteredBanners.length === 0 ? (
            <div className="bg-white border border-neutral-200 p-12 text-center text-xs text-neutral-500 font-sans">
              Aucune bannière ne correspond à vos critères de recherche.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              {filteredBanners.map((banner) => {
                const eff = getEffectiveBannerStatus(banner);
                const isHeroBanner = banner.type === 'HERO';
                const mediaValid = isMediaValid(banner.desktopMediaId, banner.desktopImageUrl);
                const whatsappConfigured = isWhatsAppConfigured(banner);
                const isInvalid = eff.validationStatus === 'INVALID';

                return (
                  <div key={banner.id} className={`bg-white border p-5 space-y-4 shadow-sm flex flex-col justify-between font-sans group transition-colors ${
                    isInvalid ? 'border-red-400 bg-red-50/20' : 'border-neutral-200 hover:border-black'
                  }`}>
                    <div className="space-y-3 font-sans">
                      
                      {/* Image Preview Header */}
                      <div className="relative aspect-video bg-neutral-900 overflow-hidden border border-neutral-100">
                        {mediaValid ? (
                          <img
                            src={banner.desktopImageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-900 border-2 border-dashed border-red-500 flex flex-col items-center justify-center text-red-400 p-4 text-center">
                            <AlertTriangle size={32} className="mb-1 text-red-500 animate-pulse" />
                            <span className="text-[11px] font-bold uppercase text-white">⚠ MÉDIA MANQUANT OU SUPPRIMÉ</span>
                            <span className="text-[9px] font-mono text-neutral-400 mt-1">ID: {banner.desktopMediaId || 'N/A'}</span>
                          </div>
                        )}

                        <div className="absolute top-2 left-2 flex gap-1.5">
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-black/80 text-pros-gold uppercase">
                            {banner.type}
                          </span>
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-white text-black uppercase">
                            v{banner.version || '1.0'}
                          </span>
                        </div>

                        <div className="absolute bottom-2 right-2">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                              isInvalid
                                ? 'bg-red-600 text-white'
                                : eff.status === 'ACTIVE'
                                ? 'bg-emerald-500 text-white'
                                : eff.status === 'SCHEDULED'
                                ? 'bg-blue-600 text-white'
                                : eff.status === 'DRAFT'
                                ? 'bg-amber-500 text-black'
                                : 'bg-neutral-600 text-white'
                            }`}
                          >
                            {getFrenchStatusLabel(eff)}
                          </span>
                        </div>
                      </div>

                      {/* Warnings if Media Missing or WhatsApp unconfigured */}
                      {isInvalid && (
                        <div className="p-3 bg-red-50 border border-red-300 text-red-900 text-[11px] font-bold space-y-1 font-sans">
                          {!mediaValid && (
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
                              <span>⚠ Média introuvable dans la Médiathèque PROS ({banner.desktopMediaId || 'N/A'})</span>
                            </div>
                          )}
                          {banner.type === 'WHATSAPP' && !whatsappConfigured && (
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-red-600 flex-shrink-0" />
                              <span>⚠ Numéro WhatsApp non configuré ou lien de chat invalide</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content Overview */}
                      <div className="space-y-1 font-sans">
                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                          {banner.eyebrow || banner.targetLocation}
                        </div>
                        <h4 className="font-display font-bold text-base text-black uppercase line-clamp-1">{banner.title}</h4>
                        <p className="text-xs text-neutral-600 line-clamp-2">{banner.subtitle || banner.description}</p>
                      </div>

                      {/* CTA & Target Details */}
                      <div className="p-3 bg-pros-bone border border-neutral-200 text-[11px] font-sans space-y-1">
                        <div><span className="text-neutral-500">Bouton CTA :</span> <strong>{banner.ctaText}</strong></div>
                        <div>
                          <span className="text-neutral-500">URL Cible :</span>{' '}
                          <span className="font-mono text-black font-bold">
                            {banner.type === 'WHATSAPP' ? getResolvedWhatsAppUrl(banner) : banner.ctaUrl}
                          </span>
                        </div>
                        <div><span className="text-neutral-500">Emplacement :</span> <strong className="text-pros-gold uppercase">{banner.targetLocation}</strong></div>
                        {banner.desktopMediaId && (
                          <div><span className="text-neutral-500">Media ID :</span> <span className="font-mono bg-pros-black text-white px-1 font-bold text-[9px]">{banner.desktopMediaId}</span></div>
                        )}
                      </div>

                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-neutral-200 space-y-2 font-sans">
                      
                      {/* PRIMARY ACTION BUTTON IF INVALID: REPAIR / REPLACE MEDIA */}
                      {isInvalid && !mediaValid && (
                        <button
                          type="button"
                          onClick={() => setMediaPickerTarget({ bannerId: banner.id, type: 'desktop' })}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md cursor-pointer font-sans"
                        >
                          <Wrench size={14} />
                          <span>REMPLACER LE MÉDIA</span>
                        </button>
                      )}

                      <div className="flex items-center justify-between font-sans">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPreviewBanner(banner)}
                            className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                            title="Aperçu temps réel"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(banner)}
                            className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                            title="Modifier la fiche détaillée"
                          >
                            <Edit3 size={16} />
                          </button>
                          {banner.versionHistory && banner.versionHistory.length > 0 && (
                            <button
                              onClick={() => setVersionHistoryBanner(banner)}
                              className="p-1.5 text-neutral-600 hover:text-pros-gold hover:bg-neutral-100 cursor-pointer"
                              title="Historique des versions & Restauration"
                            >
                              <History size={16} />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {eff.status === 'DRAFT' && hasPermission('PUBLISH_BANNERS') && (
                            <button
                              onClick={() => handlePublishBanner(banner)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase shadow-sm cursor-pointer"
                            >
                              PUBLIER
                            </button>
                          )}

                          {hasPermission('EDIT_BANNERS') && (
                            <button
                              onClick={() => handleToggleStatusRequest(banner)}
                              disabled={isInvalid}
                              className={`px-3 py-1 text-[10px] font-bold uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                eff.status === 'ACTIVE'
                                  ? 'bg-pros-bone border border-neutral-300 text-black hover:bg-neutral-200'
                                  : 'bg-pros-black text-white hover:bg-neutral-800'
                              }`}
                            >
                              {eff.status === 'ACTIVE' ? 'DÉSACTIVER' : 'ACTIVER'}
                            </button>
                          )}

                          {hasPermission('DELETE_BANNERS') && !isHeroBanner && (
                            <button
                              onClick={() => handleDeleteAttempt(banner)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* MODAL: CREATE / EDIT BANNER DETAILED FORM */}
        {isBannerModalOpen && editingBanner && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <ImageIcon size={22} className="text-pros-gold" />
                  <div>
                    <h3 className="font-display font-bold text-base uppercase text-black">
                      {editingBanner.id ? `FICHE DÉTAILLÉE — ${editingBanner.name}` : 'CRÉER UNE NOUVELLE BANNIÈRE'}
                    </h3>
                    {editingBanner.id && (
                      <div className="text-[10px] font-mono text-neutral-500 flex gap-3 mt-0.5">
                        <span>ID: {editingBanner.id}</span>
                        <span>Version: v{editingBanner.version || '1.0'}</span>
                        <span>Créée par: {editingBanner.createdBy || 'Admin'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setIsBannerModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              {/* Form Navigation Tabs */}
              <div className="flex border-b border-neutral-200 gap-3 text-xs font-bold uppercase font-sans flex-shrink-0 overflow-x-auto">
                {[
                  { id: 'info', label: '1. INFORMATIONS' },
                  { id: 'visuals', label: '2. VISUELS' },
                  { id: 'content', label: '3. CONTENU' },
                  { id: 'cta', label: '4. CTA & LINK' },
                  { id: 'targeting', label: '5. CIBLAGE' },
                  { id: 'scheduling', label: '6. PLANIFICATION' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFormTab(tab.id as any)}
                    className={`pb-2.5 border-b-2 font-sans cursor-pointer whitespace-nowrap ${
                      activeFormTab === tab.id ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Form Body Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1 font-sans">
                
                {/* TAB 1: INFORMATIONS */}
                {activeFormTab === 'info' && (
                  <div className="space-y-4 font-sans">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">NOM DE LA BANNIÈRE *</label>
                      <input
                        type="text"
                        value={editingBanner.name || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, name: e.target.value })}
                        placeholder="Ex: Campagne Collection Signature 2026"
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none focus:border-black font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">TYPE DE BANNIÈRE *</label>
                        <select
                          value={editingBanner.type || 'PROMOTION'}
                          onChange={(e) => setEditingBanner({ ...editingBanner, type: e.target.value as BannerType })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none cursor-pointer font-bold"
                        >
                          <option value="HERO">HERO EDITORIAL</option>
                          <option value="PROMOTION">PROMOTION</option>
                          <option value="COLLECTION">COLLECTION</option>
                          <option value="COMMUNICATION">COMMUNICATION</option>
                          <option value="WHATSAPP">WHATSAPP</option>
                          <option value="FIDELITE">FIDÉLITÉ</option>
                          <option value="PROS_CLUB">PROS CLUB</option>
                          <option value="CUSTOM">SUR MESURE</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">STATUT DE PUBLICATION</label>
                        <select
                          value={editingBanner.status || 'DRAFT'}
                          onChange={(e) => setEditingBanner({ ...editingBanner, status: e.target.value as BannerStatus })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none cursor-pointer font-bold"
                        >
                          <option value="DRAFT">BROUILLON</option>
                          <option value="READY">PRÊT À PUBLIER</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">ORDRE D'AFFICHAGE (PRIORITÉ)</label>
                      <input
                        type="number"
                        value={editingBanner.sortOrder || 1}
                        onChange={(e) => setEditingBanner({ ...editingBanner, sortOrder: parseInt(e.target.value, 10) || 1 })}
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: VISUELS */}
                {activeFormTab === 'visuals' && (
                  <div className="space-y-6 font-sans">
                    
                    {/* Desktop Image */}
                    <div className="space-y-2 p-4 bg-pros-bone border border-neutral-200">
                      <label className="font-bold uppercase text-black flex items-center justify-between">
                        <span>IMAGE DESKTOP (GRAND ÉCRAN) *</span>
                        <Monitor size={16} className="text-neutral-500" />
                      </label>
                      <div className="flex gap-4 items-center">
                        <img src={editingBanner.desktopImageUrl} alt="Desktop" className="w-32 h-20 object-cover border border-neutral-300" />
                        <div className="space-y-2 flex-1 text-xs">
                          {editingBanner.desktopMediaId && (
                            <span className="px-2 py-0.5 text-[10px] font-mono bg-pros-black text-pros-gold font-bold">
                              ID: {editingBanner.desktopMediaId}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setMediaPickerTarget({ type: 'desktop', isFormPicker: true })}
                            className="px-4 py-2 bg-white border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer hover:bg-neutral-100 flex items-center gap-1.5"
                          >
                            <ImageIcon size={14} />
                            <span>SÉLECTIONNER DANS LA MÉDIATHÈQUE PROS</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Image */}
                    <div className="space-y-2 p-4 bg-pros-bone border border-neutral-200">
                      <label className="font-bold uppercase text-black flex items-center justify-between">
                        <span>IMAGE MOBILE (VIEWPORT 390PX)</span>
                        <Smartphone size={16} className="text-neutral-500" />
                      </label>
                      <div className="flex gap-4 items-center">
                        <img src={editingBanner.mobileImageUrl || editingBanner.desktopImageUrl} alt="Mobile" className="w-16 h-20 object-cover border border-neutral-300" />
                        <div className="space-y-2 flex-1 text-xs">
                          {editingBanner.mobileMediaId && (
                            <span className="px-2 py-0.5 text-[10px] font-mono bg-pros-black text-pros-gold font-bold">
                              ID: {editingBanner.mobileMediaId}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setMediaPickerTarget({ type: 'mobile', isFormPicker: true })}
                            className="px-4 py-2 bg-white border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer hover:bg-neutral-100 flex items-center gap-1.5"
                          >
                            <ImageIcon size={14} />
                            <span>SÉLECTIONNER DANS LA MÉDIATHÈQUE PROS</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 3: CONTENU */}
                {activeFormTab === 'content' && (
                  <div className="space-y-4 font-sans">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">EYEBROW (PETIT TITRE SURMONTÉ)</label>
                      <input
                        type="text"
                        value={editingBanner.eyebrow || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, eyebrow: e.target.value })}
                        placeholder="Ex: ÉLÉGANCE. FORCE. ENGAGÉE."
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">TITRE PRINCIPAL *</label>
                      <input
                        type="text"
                        value={editingBanner.title || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                        placeholder="Ex: COLLECTION SIGNATURE 2026"
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">SOUS-TITRE / SLOGAN</label>
                      <input
                        type="text"
                        value={editingBanner.subtitle || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                        placeholder="Ex: Le vestiaire contemporain du Président Ousmane Sonko."
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">DESCRIPTION DÉTAILLÉE</label>
                      <textarea
                        rows={3}
                        value={editingBanner.description || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                        placeholder="Explication ou détails de l'offre..."
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: CTA & LINK */}
                {activeFormTab === 'cta' && (
                  <div className="space-y-4 font-sans">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">TEXTE DU BOUTON CTA *</label>
                      <input
                        type="text"
                        value={editingBanner.ctaText || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                        placeholder="Ex: DÉCOUVRIR, COMMANDER, CONTACTER SUR WHATSAPP..."
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">URL CIBLE DU BOUTON *</label>
                      <input
                        type="text"
                        value={editingBanner.ctaUrl || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, ctaUrl: e.target.value })}
                        placeholder="Ex: /shop, /collections, https://wa.me/221770000000"
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black font-mono focus:outline-none"
                      />
                    </div>

                    {editingBanner.type === 'WHATSAPP' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-1 font-sans">
                        <div className="font-bold uppercase flex items-center gap-1.5">
                          <Phone size={14} className="text-emerald-700" />
                          <span>Lien WhatsApp Calculé Dynamiquement</span>
                        </div>
                        <div className="font-mono text-[11px] font-bold text-emerald-800">
                          {getResolvedWhatsAppUrl(editingBanner)}
                        </div>
                        <p className="text-[10px] text-emerald-700">
                          Numéro WhatsApp officiel extrait de la configuration du magasin PROS.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: CIBLAGE */}
                {activeFormTab === 'targeting' && (
                  <div className="space-y-4 font-sans">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">EMPLACEMENT DE DESTINATION *</label>
                      <select
                        value={editingBanner.targetLocation || 'HOMEPAGE'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, targetLocation: e.target.value as BannerLocation })}
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none cursor-pointer font-bold"
                      >
                        <option value="HOMEPAGE">PAGE D'ACCUEIL (HOMEPAGE)</option>
                        <option value="SHOP">BOUTIQUE GLOBALE (/SHOP)</option>
                        <option value="COLLECTION">PAGE COLLECTION CIBLÉE</option>
                        <option value="CATEGORY">PAGE CATÉGORIE CIBLÉE</option>
                        <option value="PROS_CLUB">ESPACE PROS CLUB / COMPTE</option>
                        <option value="OTHER">AUTRE LIEN PERSONNALISÉ</option>
                      </select>
                    </div>

                    {editingBanner.targetLocation === 'COLLECTION' && (
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">COLLECTION DU CATALOGUE RÉEL *</label>
                        <select
                          value={editingBanner.targetEntityId || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, targetEntityId: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none cursor-pointer font-bold"
                        >
                          <option value="">Sélectionner une collection réelle...</option>
                          {storeCollections.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.name} ({col.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {editingBanner.targetLocation === 'CATEGORY' && (
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">CATÉGORIE DU CATALOGUE RÉEL *</label>
                        <select
                          value={editingBanner.targetEntityId || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, targetEntityId: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none cursor-pointer font-bold"
                        >
                          <option value="">Sélectionner une catégorie réelle...</option>
                          {storeCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({cat.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: PLANIFICATION */}
                {activeFormTab === 'scheduling' && (
                  <div className="space-y-4 font-sans">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">DATE DE DÉBUT</label>
                        <input
                          type="datetime-local"
                          value={editingBanner.startAt ? editingBanner.startAt.substring(0, 16) : ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, startAt: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">DATE DE FIN (EXPIRATION)</label>
                        <input
                          type="datetime-local"
                          value={editingBanner.endAt ? editingBanner.endAt.substring(0, 16) : ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, endAt: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-neutral-200 flex justify-between gap-3 flex-shrink-0 font-sans">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-5 py-2.5 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                >
                  ANNULER
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveBanner(true)}
                    className="px-5 py-2.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold uppercase text-xs cursor-pointer"
                  >
                    ENREGISTRER BROUILLON
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveBanner(false)}
                    className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer"
                  >
                    PUBLIER LA BANNIÈRE
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MEDIA PICKER MODAL TRIGGER */}
        {mediaPickerTarget && (
          <MediaPickerModal
            isOpen={true}
            onClose={() => setMediaPickerTarget(null)}
            onSelectMedia={(media) => {
              if (mediaPickerTarget.isFormPicker && editingBanner) {
                if (mediaPickerTarget.type === 'desktop') {
                  setEditingBanner({
                    ...editingBanner,
                    desktopMediaId: media.id,
                    desktopImageUrl: media.url,
                  });
                } else {
                  setEditingBanner({
                    ...editingBanner,
                    mobileMediaId: media.id,
                    mobileImageUrl: media.url,
                  });
                }
              } else if (mediaPickerTarget.bannerId) {
                // Direct replacement from banner card button "REMPLACER LE MÉDIA"
                replaceBannerMedia(
                  mediaPickerTarget.bannerId,
                  mediaPickerTarget.type,
                  media as MediaItem,
                  currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS'
                );
                showToast(`Média de la bannière remplacé par "${media.filename}" (${media.id}).`);
              }
              setMediaPickerTarget(null);
            }}
          />
        )}

        {/* MODAL: LIVE PREVIEW */}
        {previewBanner && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full p-8 space-y-6 text-black font-sans shadow-2xl">
              
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-pros-black text-pros-gold">
                    APERÇU TEMPS RÉEL
                  </span>
                  <h3 className="font-display font-bold text-base uppercase text-black">{previewBanner.title}</h3>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex border border-neutral-300 text-xs font-bold uppercase">
                    <button
                      onClick={() => setPreviewViewport('desktop')}
                      className={`px-3 py-1 flex items-center gap-1.5 cursor-pointer ${previewViewport === 'desktop' ? 'bg-black text-white' : 'bg-white text-black'}`}
                    >
                      <Monitor size={14} /> DESKTOP
                    </button>
                    <button
                      onClick={() => setPreviewViewport('mobile')}
                      className={`px-3 py-1 flex items-center gap-1.5 cursor-pointer ${previewViewport === 'mobile' ? 'bg-black text-white' : 'bg-white text-black'}`}
                    >
                      <Smartphone size={14} /> MOBILE 390px
                    </button>
                  </div>

                  <button onClick={() => setPreviewBanner(null)} className="text-neutral-500 hover:text-black">
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* Render Preview Container */}
              <div className="flex justify-center bg-neutral-900 p-6 overflow-hidden">
                <div
                  className={`relative overflow-hidden bg-neutral-900 border border-neutral-700 transition-all text-white flex flex-col justify-end p-8 ${
                    previewViewport === 'mobile' ? 'w-[390px] h-[520px]' : 'w-full h-[360px]'
                  }`}
                >
                  <img
                    src={previewViewport === 'mobile' ? previewBanner.mobileImageUrl || previewBanner.desktopImageUrl : previewBanner.desktopImageUrl}
                    alt={previewBanner.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  <div className="relative z-10 space-y-2">
                    {previewBanner.eyebrow && <span className="text-[10px] font-bold uppercase text-pros-gold tracking-widest block">{previewBanner.eyebrow}</span>}
                    <h2 className="font-display font-bold text-2xl uppercase text-white leading-tight">{previewBanner.title}</h2>
                    {previewBanner.subtitle && <p className="text-xs text-neutral-200">{previewBanner.subtitle}</p>}
                    <span className="inline-block px-5 py-2.5 bg-white text-black font-bold text-xs uppercase mt-3 shadow-md">
                      {previewBanner.ctaText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end font-sans">
                <button onClick={() => setPreviewBanner(null)} className="px-6 py-2 bg-pros-black text-white font-bold uppercase text-xs">
                  FERMER L'APERÇU
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: DEACTIVATION CONFIRMATION */}
        {deactivateConfirmBanner && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle size={28} />
                <h3 className="font-display font-bold text-base uppercase text-black">DÉSACTIVER CETTE BANNIÈRE ?</h3>
              </div>

              <p className="text-xs text-neutral-600 font-sans">
                La bannière <strong>"{deactivateConfirmBanner.name}"</strong> ne sera plus affichée sur la plateforme PROS.
              </p>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setDeactivateConfirmBanner(null)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-100"
                >
                  ANNULER
                </button>
                <button
                  onClick={handleConfirmDeactivate}
                  className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase shadow-sm hover:bg-neutral-800"
                >
                  CONFIRMER LA DÉSACTIVATION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DELETION PROTECTION WARNING */}
        {deleteWarningBanner && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-8 space-y-6 text-black font-sans shadow-2xl">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle size={32} />
                <h3 className="font-display font-bold text-base uppercase text-black">CETTE BANNIÈRE EST ACTUELLEMENT UTILISÉE</h3>
              </div>

              <p className="text-xs text-neutral-600 font-sans">
                La bannière <strong>"{deleteWarningBanner.name}"</strong> est actuellement <strong>ACTIVE</strong> et référencée sur l'emplacement <strong>{deleteWarningBanner.targetLocation}</strong>.
              </p>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setDeleteWarningBanner(null)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-100"
                >
                  ANNULER
                </button>
                <button
                  onClick={() => {
                    toggleBannerStatus(deleteWarningBanner.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
                    setDeleteWarningBanner(null);
                    showToast(`Bannière "${deleteWarningBanner.name}" désactivée.`);
                  }}
                  className="px-4 py-2 bg-pros-bone border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-200"
                >
                  DÉSACTIVER PLUTÔT
                </button>
                <button
                  onClick={() => handleDeleteAttempt(deleteWarningBanner, true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase shadow-sm"
                >
                  FORCER SUPPRESSION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: VERSION HISTORY & ROLLBACK */}
        {versionHistoryBanner && versionHistoryBanner.versionHistory && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-8 space-y-6 text-black font-sans shadow-2xl">
              
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <History size={20} className="text-pros-gold" />
                  <h3 className="font-display font-bold text-base uppercase text-black">HISTORIQUE DES VERSIONS — {versionHistoryBanner.name}</h3>
                </div>
                <button onClick={() => setVersionHistoryBanner(null)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto font-sans text-xs">
                {versionHistoryBanner.versionHistory.map((ver, idx) => (
                  <div key={idx} className="p-4 bg-pros-bone border border-neutral-200 flex items-center justify-between font-sans">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-pros-black text-pros-gold">v{ver.version}</span>
                        <span className="text-neutral-500">{new Date(ver.publishedAt).toLocaleString('fr-FR')}</span>
                      </div>
                      <p className="text-neutral-700 text-[11px] font-sans">{ver.notes || 'Publication manuelle par administrateur'}</p>
                      <div className="text-[10px] text-neutral-400 font-mono">Par: {ver.publishedBy}</div>
                    </div>

                    <button
                      onClick={() => {
                        restoreBannerVersion(versionHistoryBanner.id, ver.version, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
                        setVersionHistoryBanner(null);
                        showToast(`Version v${ver.version} restaurée avec succès (Nouvelle version créée).`);
                      }}
                      className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold uppercase text-[10px] flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RotateCcw size={12} />
                      <span>RESTAURER CETTE VERSION</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end font-sans">
                <button onClick={() => setVersionHistoryBanner(null)} className="px-6 py-2 bg-pros-black text-white font-bold uppercase text-xs font-sans">
                  FERMER
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
  );
};

export const AdminMarketingPage: React.FC = () => (
  <AdminLayout>
    <AdminBannersContent />
  </AdminLayout>
);
