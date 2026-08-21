import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { useCommunication } from '../../store/communicationContext';
import type {
  ProsCommunication,
  CommunicationType,
  CommunicationChannel,
  CommunicationStatus,
  CommunicationAudienceType,
} from '../../types/communication';
import { useStore } from '../../store/storeContext';
import { useAuth } from '../../store/authContext';
import {
  Plus,
  Search,
  SlidersHorizontal,
  MessageSquare,
  Send,
  FileText,
  Users,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  Archive,
  MoreVertical,
  Mail,
  Phone,
  Bell,
  Globe,
  Smartphone,
  Layers,
  Sparkles,
  Tag,
  Gift,
  FileCheck,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const AdminCommunicationsContent: React.FC = () => {
  const {
    communications,
    templates,
    logs,
    addCommunication,
    updateCommunication,
    deleteCommunication,
    duplicateCommunication,
    sendCommunicationNow,
    scheduleCommunication,
    cancelSchedule,
    archiveCommunication,
    addTemplate,
    deleteTemplate,
  } = useCommunication();

  const { customers } = useStore();
  const { hasPermission, currentUser } = useAuth();

  // Search, Filters, Tab & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [audienceFilter, setAudienceFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'sent_newest' | 'recipients' | 'open_rate' | 'alpha'>('newest');
  const [activeTab, setActiveTab] = useState<'ALL' | 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'ARCHIVED'>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingComm, setEditingComm] = useState<Partial<ProsCommunication> | null>(null);
  const [formStep, setFormStep] = useState<'type' | 'content' | 'channels' | 'targeting' | 'scheduling' | 'preview' | 'confirm'>('type');

  // Preview Channel Viewport State inside Creation Wizard
  const [previewChannel, setPreviewChannel] = useState<'SITE' | 'WHATSAPP' | 'EMAIL' | 'NOTIFICATION'>('SITE');

  // Detail Modal State (360° View)
  const [detailComm, setDetailComm] = useState<ProsCommunication | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'preview' | 'content' | 'audience' | 'performance' | 'history'>('overview');

  // Templates Modal State
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  // Media Picker Trigger State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Action Dropdown Popup State
  const [activeMenuCommId, setActiveMenuCommId] = useState<string | null>(null);

  // Send Confirmation Modal State
  const [sendConfirmComm, setSendConfirmComm] = useState<ProsCommunication | null>(null);

  // Notifications Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, msg });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper: Open Rate Calculator
  const getOpenRate = (comm: ProsCommunication) => {
    if (!comm.statistics || comm.statistics.delivered === 0) return 0;
    return Math.round((comm.statistics.opened / comm.statistics.delivered) * 100);
  };

  // Dynamic Real Statistics Calculation
  const totalCount = communications.length;
  const sentCount = communications.filter((c) => c.status === 'SENT').length;
  const scheduledCount = communications.filter((c) => c.status === 'SCHEDULED').length;
  const draftCount = communications.filter((c) => c.status === 'DRAFT').length;
  const sendingCount = communications.filter((c) => c.status === 'SENDING').length;
  const archivedCount = communications.filter((c) => c.status === 'ARCHIVED').length;

  const totalRecipientsCount = communications
    .filter((c) => c.status === 'SENT' || c.status === 'SCHEDULED')
    .reduce((sum, c) => sum + (c.recipientsCount || 0), 0);

  const avgOpenRate = useMemo(() => {
    const sentComms = communications.filter((c) => c.status === 'SENT' && c.statistics.delivered > 0);
    if (sentComms.length === 0) return 0;
    const sumOpenRates = sentComms.reduce((sum, c) => sum + getOpenRate(c), 0);
    return Math.round(sumOpenRates / sentComms.length);
  }, [communications]);

  // Audience Recipient Estimator
  const estimateAudienceRecipients = (audienceType: CommunicationAudienceType): number => {
    const realCustomerCount = customers.length > 0 ? customers.length : 1245;
    switch (audienceType) {
      case 'ALL_CUSTOMERS': return realCustomerCount;
      case 'ACTIVE_CUSTOMERS': return Math.round(realCustomerCount * 0.75);
      case 'NEW_CUSTOMERS': return Math.round(realCustomerCount * 0.20);
      case 'PROSPECTS': return Math.round(realCustomerCount * 0.15);
      case 'PREMIUM_CUSTOMERS': return Math.round(realCustomerCount * 0.10);
      case 'PROS_CLUB_MEMBERS': return Math.round(realCustomerCount * 0.40);
      case 'PAST_BUYERS': return Math.round(realCustomerCount * 0.65);
      case 'INACTIVE_30_DAYS': return Math.round(realCustomerCount * 0.25);
      case 'SINGLE_CUSTOMER': return 1;
      default: return realCustomerCount;
    }
  };

  // Filtered Communications List
  const filteredCommunications = useMemo(() => {
    return communications
      .filter((c) => {
        // Tab Filter
        if (activeTab !== 'ALL' && c.status !== activeTab) return false;

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (c.title || '').toLowerCase().includes(q);
          const matchContent = (c.content || '').toLowerCase().includes(q);
          const matchEyebrow = (c.eyebrow || '').toLowerCase().includes(q);
          const matchId = (c.id || '').toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchEyebrow && !matchId) return false;
        }

        // Type Filter
        if (typeFilter !== 'ALL' && c.type !== typeFilter) return false;

        // Status Filter
        if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

        // Channel Filter
        if (channelFilter !== 'ALL') {
          if (channelFilter === 'MULTI' && c.channels.length <= 1) return false;
          if (channelFilter !== 'MULTI' && !c.channels.includes(channelFilter as CommunicationChannel)) return false;
        }

        // Audience Filter
        if (audienceFilter !== 'ALL' && c.audienceType !== audienceFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'sent_newest') return new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime();
        if (sortBy === 'recipients') return b.recipientsCount - a.recipientsCount;
        if (sortBy === 'open_rate') return getOpenRate(b) - getOpenRate(a);
        if (sortBy === 'alpha') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [communications, activeTab, searchQuery, typeFilter, statusFilter, channelFilter, audienceFilter, sortBy]);

  // Paginated Communications Slice
  const totalPages = Math.ceil(filteredCommunications.length / itemsPerPage) || 1;
  const paginatedCommunications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCommunications.slice(start, start + itemsPerPage);
  }, [filteredCommunications, currentPage, itemsPerPage]);

  // Open Create Communication Modal
  const handleOpenCreateModal = () => {
    if (!hasPermission('CREATE_COMMUNICATIONS')) {
      showToast("Vous n'avez pas la permission de créer des communications.", 'error');
      return;
    }

    setEditingComm({
      type: 'PROMOTION',
      title: '',
      eyebrow: 'MARQUE OFFICIELLE PROS',
      content: '',
      ctaText: 'DÉCOUVRIR',
      ctaUrl: '/shop',
      channels: ['SITE', 'WHATSAPP'],
      whatsAppTemplate: 'Bonjour {{prenom}},\n\nDécouvrez nos dernières actualités et promotions sur https://pros.sn',
      emailSubject: 'Information importante — PROS Brand',
      emailSenderName: 'PROS Brand Sénégal',
      emailSenderEmail: 'contact@pros.sn',
      audienceType: 'ALL_CUSTOMERS',
      recipientsCount: estimateAudienceRecipients('ALL_CUSTOMERS'),
      status: 'DRAFT',
    });
    setFormStep('type');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (comm: ProsCommunication) => {
    if (!hasPermission('EDIT_COMMUNICATIONS')) {
      showToast("Vous n'avez pas la permission de modifier cette communication.", 'error');
      return;
    }

    setEditingComm({ ...comm });
    setFormStep('content');
    setIsCreateModalOpen(true);
  };

  // Save Communication (Draft or Ready)
  const handleSaveCommunication = (asDraft = true) => {
    if (!editingComm) return;

    if (!editingComm.title || !editingComm.title.trim()) {
      showToast('Veuillez saisir un titre pour la communication.', 'error');
      return;
    }

    if (!editingComm.content || !editingComm.content.trim()) {
      showToast('Veuillez saisir le contenu du message.', 'error');
      return;
    }

    if (!editingComm.channels || editingComm.channels.length === 0) {
      showToast('Veuillez sélectionner au moins un canal de diffusion.', 'error');
      return;
    }

    const isScheduled = !!editingComm.scheduledAt && new Date(editingComm.scheduledAt) > new Date();
    const payloadStatus: CommunicationStatus = asDraft
      ? 'DRAFT'
      : isScheduled
      ? 'SCHEDULED'
      : editingComm.status || 'DRAFT';

    const payload = {
      ...editingComm,
      recipientsCount: estimateAudienceRecipients(editingComm.audienceType || 'ALL_CUSTOMERS'),
      status: payloadStatus,
    };

    let targetId = editingComm.id;

    if (editingComm.id) {
      updateCommunication(payload as ProsCommunication, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
      showToast(`Communication "${editingComm.title}" enregistrée.`);
    } else {
      const created = addCommunication(payload, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
      targetId = created.id;
      showToast(`Communication "${editingComm.title}" créée avec succès.`);
    }

    if (targetId && isScheduled && editingComm.scheduledAt) {
      scheduleCommunication(targetId, editingComm.scheduledAt, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
    }

    setIsCreateModalOpen(false);
    setEditingComm(null);
  };

  // Trigger Send Now
  const handleTriggerSendNow = (comm: ProsCommunication) => {
    if (!hasPermission('SEND_COMMUNICATIONS')) {
      showToast("Vous n'avez pas la permission d'envoyer des communications.", 'error');
      return;
    }

    setSendConfirmComm(comm);
  };

  // Confirm Send Now
  const handleConfirmSendNow = () => {
    if (!sendConfirmComm) return;

    const res = sendCommunicationNow(sendConfirmComm.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
    if (res.success) {
      showToast(`Communication "${sendConfirmComm.title}" envoyée avec succès à ${sendConfirmComm.recipientsCount} destinataires.`);
    } else {
      showToast(res.error || 'Erreur lors de l’envoi.', 'error');
    }
    setSendConfirmComm(null);
  };

  // Type Icon Provider Helper
  const getTypeIcon = (type: CommunicationType) => {
    switch (type) {
      case 'MESSAGE': return <MessageSquare size={16} className="text-neutral-700" />;
      case 'NOTIFICATION': return <Bell size={16} className="text-blue-600" />;
      case 'ANNONCE': return <Sparkles size={16} className="text-pros-gold" />;
      case 'PROMOTION': return <Tag size={16} className="text-emerald-600" />;
      case 'WHATSAPP': return <Phone size={16} className="text-emerald-700" />;
      case 'EMAIL': return <Mail size={16} className="text-purple-600" />;
      case 'COMMANDE': return <FileCheck size={16} className="text-amber-600" />;
      case 'FIDELITE': return <Gift size={16} className="text-pros-gold" />;
      case 'BIENVENUE': return <Users size={16} className="text-blue-700" />;
      default: return <Layers size={16} className="text-neutral-600" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="MARKETING & COMMUNICATION"
          title="CENTRE DE COMMUNICATION PROS"
          description="Créez, programmez et suivez les communications envoyées à vos clients sur tous vos canaux."
          primaryAction={
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTemplatesModalOpen(true)}
                className="px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                <FileText size={16} />
                <span>MODÈLES</span>
              </button>

              {hasPermission('CREATE_COMMUNICATIONS') && (
                <button
                  onClick={handleOpenCreateModal}
                  className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center gap-2 cursor-pointer shadow-sm font-sans"
                >
                  <Plus size={16} />
                  <span>NOUVELLE COMMUNICATION</span>
                </button>
              )}
            </div>
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

        {/* Dynamic Real Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 font-sans">
          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-sans">TOTAL COMMUNICATIONS</div>
            <div className="text-xl font-bold font-mono text-black">{totalCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Campagnes créées</div>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-sans">ENVOYÉES</div>
            <div className="text-xl font-bold font-mono text-black">{sentCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Campagnes distribuées</div>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 font-sans">PROGRAMMÉES</div>
            <div className="text-xl font-bold font-mono text-black">{scheduledCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Envoi automatique</div>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 font-sans">BROUILLONS</div>
            <div className="text-xl font-bold font-mono text-black">{draftCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">En rédaction</div>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 font-sans">DESTINATAIRES</div>
            <div className="text-xl font-bold font-mono text-black">{totalRecipientsCount.toLocaleString('fr-FR')}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Clients ciblés</div>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-pros-gold font-sans">TAUX D'OUVERTURE</div>
            <div className="text-xl font-bold font-mono text-black">{avgOpenRate}%</div>
            <div className="text-[10px] text-neutral-400 font-sans">Moyenne globale</div>
          </div>
        </div>

        {/* Search & 4-Dropdown Filters Toolbar */}
        <div className="bg-white p-4 border border-neutral-200 space-y-3 font-sans shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            
            {/* Search Bar */}
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
              <input
                type="text"
                placeholder="Rechercher une communication par titre, contenu ou campagne..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-pros-bone border border-neutral-300 pl-9 pr-4 py-2 text-xs text-black focus:outline-none focus:border-black font-sans"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-neutral-400 hover:text-black">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs font-sans w-full md:w-auto">
              <span className="font-bold uppercase text-neutral-500 whitespace-nowrap text-[11px]">TRIER PAR :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-pros-bone border border-neutral-300 px-3 py-1.5 text-xs text-black font-bold focus:outline-none cursor-pointer"
              >
                <option value="newest">PLUS RÉCENTS</option>
                <option value="oldest">PLUS ANCIENS</option>
                <option value="sent_newest">DATES D'ENVOI</option>
                <option value="recipients">PLUS DE DESTINATAIRES</option>
                <option value="open_rate">MEILLEUR TAUX D'OUVERTURE</option>
                <option value="alpha">ALPHABÉTIQUE</option>
              </select>
            </div>
          </div>

          {/* 4 Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-neutral-100 text-xs font-sans">
            <div className="flex items-center gap-1.5 text-neutral-500 font-bold uppercase mr-1 text-[11px]">
              <SlidersHorizontal size={14} />
              <span>FILTRES :</span>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="bg-pros-bone border border-neutral-300 px-2.5 py-1 text-xs text-black font-sans focus:outline-none cursor-pointer"
            >
              <option value="ALL">TOUS LES TYPES</option>
              <option value="MESSAGE">MESSAGE</option>
              <option value="NOTIFICATION">NOTIFICATION</option>
              <option value="ANNONCE">ANNONCE</option>
              <option value="PROMOTION">PROMOTION</option>
              <option value="WHATSAPP">CAMPAGNE WHATSAPP</option>
              <option value="EMAIL">CAMPAGNE EMAIL</option>
              <option value="COMMANDE">COMMANDE</option>
              <option value="FIDELITE">FIDÉLITÉ</option>
              <option value="BIENVENUE">BIENVENUE</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-pros-bone border border-neutral-300 px-2.5 py-1 text-xs text-black font-sans focus:outline-none cursor-pointer font-bold"
            >
              <option value="ALL">TOUS LES STATUTS</option>
              <option value="DRAFT">BROUILLON</option>
              <option value="SCHEDULED">PROGRAMMÉ</option>
              <option value="SENDING">EN COURS</option>
              <option value="SENT">ENVOYÉ</option>
              <option value="ARCHIVED">ARCHIVÉ</option>
            </select>

            {/* Canal Filter */}
            <select
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value); setCurrentPage(1); }}
              className="bg-pros-bone border border-neutral-300 px-2.5 py-1 text-xs text-black font-sans focus:outline-none cursor-pointer"
            >
              <option value="ALL">TOUS LES CANAUX</option>
              <option value="SITE">SITE PROS</option>
              <option value="NOTIFICATION">NOTIFICATION</option>
              <option value="WHATSAPP">WHATSAPP</option>
              <option value="EMAIL">EMAIL</option>
              <option value="MULTI">MULTI-CANAL</option>
            </select>

            {/* Audience Filter */}
            <select
              value={audienceFilter}
              onChange={(e) => { setAudienceFilter(e.target.value); setCurrentPage(1); }}
              className="bg-pros-bone border border-neutral-300 px-2.5 py-1 text-xs text-black font-sans focus:outline-none cursor-pointer"
            >
              <option value="ALL">TOUTES LES AUDIENCES</option>
              <option value="ALL_CUSTOMERS">ALL CUSTOMERS</option>
              <option value="ACTIVE_CUSTOMERS">ACTIVE CUSTOMERS</option>
              <option value="NEW_CUSTOMERS">NEW CUSTOMERS</option>
              <option value="PROSPECTS">PROSPECTS</option>
              <option value="PREMIUM_CUSTOMERS">PREMIUM</option>
              <option value="PROS_CLUB_MEMBERS">PROS CLUB</option>
              <option value="PAST_BUYERS">PAST BUYERS</option>
            </select>
          </div>
        </div>

        {/* Category Navigation Tabs with Counters UX */}
        <div className="flex border-b border-neutral-200 gap-4 text-xs font-bold uppercase font-sans overflow-x-auto">
          {[
            { id: 'ALL', label: 'TOUTES', count: totalCount },
            { id: 'DRAFT', label: 'BROUILLONS', count: draftCount },
            { id: 'SCHEDULED', label: 'PROGRAMMÉES', count: scheduledCount },
            { id: 'SENDING', label: 'EN COURS', count: sendingCount },
            { id: 'SENT', label: 'ENVOYÉES', count: sentCount },
            { id: 'ARCHIVED', label: 'ARCHIVÉES', count: archivedCount },
          ].map((tab) => {
            const isCurrent = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
                className={`pb-2.5 border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap font-sans transition-all ${
                  isCurrent ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
                    isCurrent ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* CRM COMPACT DENSE DATA TABLE */}
        <div className="bg-white border border-neutral-200 overflow-x-auto shadow-sm font-sans relative">
          <table className="w-full text-left border-collapse text-xs font-sans table-fixed">
            
            {/* STICKY HEADER */}
            <thead className="sticky top-0 z-10 bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px] font-sans">
              <tr>
                <th className="p-3 w-[80px]">TYPE</th>
                <th className="p-3 w-[320px]">COMMUNICATION</th>
                <th className="p-3 w-[160px]">CANAL</th>
                <th className="p-3 w-[160px]">AUDIENCE</th>
                <th className="p-3 w-[110px] text-right">DESTINATAIRES</th>
                <th className="p-3 w-[120px]">STATUT</th>
                <th className="p-3 w-[130px]">DATE</th>
                <th className="p-3 w-[140px] text-right">PERFORMANCE</th>
                <th className="p-3 w-[110px] text-right">ACTIONS</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-200 font-sans">
              {paginatedCommunications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-neutral-500 text-xs font-sans space-y-3">
                    <div className="font-display font-bold text-sm uppercase text-black">AUCUNE COMMUNICATION</div>
                    <p className="text-neutral-500">Aucune communication ne correspond à vos critères actuels.</p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="px-4 py-2 bg-pros-black text-white font-bold text-xs uppercase inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>NOUVELLE COMMUNICATION</span>
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedCommunications.map((comm) => {
                  const openRate = getOpenRate(comm);

                  return (
                    <tr
                      key={comm.id}
                      onClick={() => setDetailComm(comm)}
                      className="hover:bg-neutral-50/80 transition-colors font-sans cursor-pointer group h-[120px] max-h-[140px]"
                    >
                      
                      {/* TYPE ICON */}
                      <td className="p-3 align-middle">
                        <div className="p-2 bg-pros-bone border border-neutral-200 flex items-center justify-center w-8 h-8 group-hover:border-black transition-colors">
                          {getTypeIcon(comm.type)}
                        </div>
                      </td>

                      {/* COMMUNICATION (EYEBROW + CLAMPED TITLE + ID) */}
                      <td className="p-3 align-middle overflow-hidden">
                        <div className="space-y-0.5 pr-2">
                          {comm.eyebrow && (
                            <span className="text-[9px] font-bold text-pros-gold uppercase tracking-widest block truncate">
                              {comm.eyebrow}
                            </span>
                          )}
                          <strong className="font-display font-bold text-xs text-black uppercase block leading-tight line-clamp-2">
                            {comm.title}
                          </strong>
                          <span className="text-[10px] text-neutral-400 font-mono block">ID : {comm.id}</span>
                        </div>
                      </td>

                      {/* CANAL BADGES */}
                      <td className="p-3 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {comm.channels.map((ch) => (
                            <span key={ch} className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-pros-bone border border-neutral-300 font-mono text-black">
                              {ch}
                            </span>
                          ))}
                          {comm.channels.length > 1 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-pros-black text-pros-gold uppercase font-mono">
                              MULTI
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AUDIENCE BADGE */}
                      <td className="p-3 align-middle">
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-neutral-100 border border-neutral-200 text-neutral-800 font-mono inline-block truncate max-w-[140px]">
                          {comm.audienceType.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* DESTINATAIRES */}
                      <td className="p-3 align-middle text-right">
                        <span className="font-mono font-bold text-black text-xs block">
                          {comm.recipientsCount.toLocaleString('fr-FR')}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-sans block">destinataires</span>
                      </td>

                      {/* STATUT */}
                      <td className="p-3 align-middle">
                        <span
                          className={`px-2.5 py-1 text-[9px] font-bold uppercase inline-block ${
                            comm.status === 'SENT'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : comm.status === 'SCHEDULED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : comm.status === 'DRAFT'
                              ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                              : comm.status === 'FAILED'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-neutral-800 text-white'
                          }`}
                        >
                          {comm.status === 'SENT' ? 'ENVOYÉ' : comm.status === 'SCHEDULED' ? 'PROGRAMMÉ' : comm.status === 'DRAFT' ? 'BROUILLON' : comm.status}
                        </span>
                      </td>

                      {/* DATE */}
                      <td className="p-3 align-middle font-sans text-xs">
                        {comm.sentAt ? (
                          <div>
                            <span className="font-mono font-bold text-black block">{new Date(comm.sentAt).toLocaleDateString('fr-FR')}</span>
                            <span className="text-[10px] text-neutral-500 block">Envoyé à {new Date(comm.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : comm.scheduledAt ? (
                          <div>
                            <span className="font-mono font-bold text-blue-700 block">{new Date(comm.scheduledAt).toLocaleDateString('fr-FR')}</span>
                            <span className="text-[10px] text-blue-600 block">Programmé pour {new Date(comm.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono text-neutral-600 block">{new Date(comm.createdAt).toLocaleDateString('fr-FR')}</span>
                            <span className="text-[10px] text-neutral-400 block">Créé le</span>
                          </div>
                        )}
                      </td>

                      {/* PERFORMANCE */}
                      <td className="p-3 align-middle text-right">
                        {comm.status === 'SENT' ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-emerald-700 text-xs block">{openRate} % ouverture</span>
                            <span className="text-[10px] text-neutral-500 font-mono block">{comm.statistics.clicked} clics</span>
                          </div>
                        ) : comm.status === 'SCHEDULED' ? (
                          <div className="space-y-0.5">
                            <span className="text-neutral-400 text-xs font-mono block">—</span>
                            <span className="text-[10px] text-neutral-400 font-sans block">Pas encore envoyé</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-neutral-400 text-xs font-mono block">—</span>
                            <span className="text-[10px] text-neutral-400 font-sans block">Non envoyé</span>
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="p-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          
                          <button
                            onClick={() => { setDetailComm(comm); setDetailTab('overview'); }}
                            className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                            title="Voir la fiche détaillée"
                          >
                            <Eye size={15} />
                          </button>

                          {hasPermission('EDIT_COMMUNICATIONS') && (
                            <button
                              onClick={() => handleOpenEditModal(comm)}
                              className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                              title="Modifier"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuCommId(activeMenuCommId === comm.id ? null : comm.id)}
                              className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {activeMenuCommId === comm.id && (
                              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-neutral-300 shadow-xl w-48 text-left py-1 font-sans text-xs">
                                <button
                                  onClick={() => {
                                    setDetailComm(comm);
                                    setActiveMenuCommId(null);
                                  }}
                                  className="w-full px-4 py-2 hover:bg-neutral-100 flex items-center gap-2 text-black cursor-pointer"
                                >
                                  <Eye size={14} /> Voir la communication
                                </button>

                                <button
                                  onClick={() => {
                                    duplicateCommunication(comm.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
                                    setActiveMenuCommId(null);
                                    showToast(`Communication "${comm.title}" dupliquée.`);
                                  }}
                                  className="w-full px-4 py-2 hover:bg-neutral-100 flex items-center gap-2 text-black cursor-pointer"
                                >
                                  <Copy size={14} /> Dupliquer
                                </button>

                                {comm.status === 'DRAFT' && hasPermission('SEND_COMMUNICATIONS') && (
                                  <button
                                    onClick={() => {
                                      handleTriggerSendNow(comm);
                                      setActiveMenuCommId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-neutral-100 flex items-center gap-2 text-emerald-700 font-bold cursor-pointer"
                                  >
                                    <Send size={14} /> Envoyer maintenant
                                  </button>
                                )}

                                {comm.status === 'SCHEDULED' && (
                                  <button
                                    onClick={() => {
                                      cancelSchedule(comm.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
                                      setActiveMenuCommId(null);
                                      showToast('Programmation annulée, remise en brouillon.');
                                    }}
                                    className="w-full px-4 py-2 hover:bg-neutral-100 flex items-center gap-2 text-amber-700 cursor-pointer"
                                  >
                                    <X size={14} /> Annuler programmation
                                  </button>
                                )}

                                {comm.status !== 'ARCHIVED' && (
                                  <button
                                    onClick={() => {
                                      archiveCommunication(comm.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
                                      setActiveMenuCommId(null);
                                      showToast('Communication archivée.');
                                    }}
                                    className="w-full px-4 py-2 hover:bg-neutral-100 flex items-center gap-2 text-neutral-700 cursor-pointer"
                                  >
                                    <Archive size={14} /> Archiver
                                  </button>
                                )}

                                {hasPermission('DELETE_COMMUNICATIONS') && (
                                  <button
                                    onClick={() => {
                                      deleteCommunication(comm.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
                                      setActiveMenuCommId(null);
                                      showToast('Communication supprimée.');
                                    }}
                                    className="w-full px-4 py-2 hover:bg-neutral-100 flex items-center gap-2 text-red-600 border-t border-neutral-100 cursor-pointer font-bold"
                                  >
                                    <Trash2 size={14} /> Supprimer
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        <div className="bg-white p-4 border border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-sans shadow-sm">
          <div className="text-neutral-500 font-sans">
            Affichage <strong className="text-black font-mono">{filteredCommunications.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> à{' '}
            <strong className="text-black font-mono">{Math.min(currentPage * itemsPerPage, filteredCommunications.length)}</strong> sur{' '}
            <strong className="text-black font-mono">{filteredCommunications.length}</strong> communications
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 font-bold uppercase text-[10px]">PAR PAGE :</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(parseInt(e.target.value, 10)); setCurrentPage(1); }}
                className="bg-pros-bone border border-neutral-300 px-2 py-1 text-xs text-black font-bold focus:outline-none cursor-pointer font-mono"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1 font-mono">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-neutral-300 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`px-3 py-1 font-bold text-xs cursor-pointer ${
                    currentPage === pg ? 'bg-pros-black text-white' : 'bg-white border border-neutral-300 hover:bg-neutral-100 text-black'
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-neutral-300 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL: WIZARD MULTI-STEP CREATION WITH PROGRESS BAR & LIVE PREVIEW */}
        {isCreateModalOpen && editingComm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <MessageSquare size={22} className="text-pros-gold" />
                  <div>
                    <h3 className="font-display font-bold text-base uppercase text-black">
                      {editingComm.id ? `MODIFIER COMMUNICATION — ${editingComm.id}` : 'NOUVELLE COMMUNICATION PROS'}
                    </h3>
                    <p className="text-xs text-neutral-500">Configurez le message, les canaux et le ciblage des destinataires.</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              {/* Step Progress Bar (7 Steps) */}
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 text-xs font-bold uppercase font-sans flex-shrink-0 overflow-x-auto gap-2">
                {[
                  { id: 'type', label: '1. TYPE' },
                  { id: 'content', label: '2. CONTENU' },
                  { id: 'channels', label: '3. CANAUX' },
                  { id: 'targeting', label: '4. AUDIENCE' },
                  { id: 'scheduling', label: '5. PLANIFICATION' },
                  { id: 'preview', label: '6. APERÇU' },
                ].map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setFormStep(step.id as any)}
                    className={`pb-1 border-b-2 font-sans cursor-pointer whitespace-nowrap transition-all ${
                      formStep === step.id ? 'border-black text-black font-bold' : 'border-transparent text-neutral-400 hover:text-black'
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>

              {/* Form Content Body */}
              <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1 font-sans">
                
                {/* STEP 1: TYPE */}
                {formStep === 'type' && (
                  <div className="space-y-4 font-sans">
                    <label className="font-bold uppercase text-black block text-xs">SÉLECTIONNEZ LE TYPE DE COMMUNICATION *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-sans">
                      {[
                        { type: 'PROMOTION', label: 'PROMOTION', desc: 'Offres, codes réductions et soldes', icon: Tag },
                        { type: 'WHATSAPP', label: 'CAMPAGNE WHATSAPP', desc: 'Messages directs WhatsApp Sénégal', icon: Phone },
                        { type: 'EMAIL', label: 'CAMPAGNE EMAIL', desc: 'Newsletters et courriels illustrés', icon: Mail },
                        { type: 'NOTIFICATION', label: 'NOTIFICATION', desc: 'Alertes push et notifications web', icon: Bell },
                        { type: 'COMMANDE', label: 'COMMANDE', desc: 'Suivis et mises à jour de livraison', icon: FileCheck },
                        { type: 'FIDELITE', label: 'FIDÉLITÉ PROS CLUB', desc: 'Points, récompenses et ventes privées', icon: Gift },
                        { type: 'BIENVENUE', label: 'BIENVENUE', desc: 'Accueil et onboarding nouveaux membres', icon: Users },
                        { type: 'ANNONCE', label: 'ANNONCE ÉDITORIALE', desc: 'Actualités majeures et lancements', icon: Sparkles },
                        { type: 'MESSAGE', label: 'MESSAGE SYSTÈME', desc: 'Informations d’exploitation', icon: MessageSquare },
                      ].map((item) => {
                        const IconComp = item.icon;
                        const isSelected = editingComm.type === item.type;

                        return (
                          <div
                            key={item.type}
                            onClick={() => setEditingComm({ ...editingComm, type: item.type as CommunicationType })}
                            className={`p-4 border cursor-pointer space-y-2 transition-all font-sans ${
                              isSelected ? 'border-black bg-pros-bone ring-1 ring-black' : 'border-neutral-200 hover:border-neutral-400 bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <IconComp size={18} className={isSelected ? 'text-black' : 'text-neutral-500'} />
                              {isSelected && <CheckCircle2 size={16} className="text-black" />}
                            </div>
                            <strong className="font-display font-bold text-xs uppercase block text-black">{item.label}</strong>
                            <p className="text-[10px] text-neutral-500 leading-tight">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: CONTENU */}
                {formStep === 'content' && (
                  <div className="space-y-4 font-sans">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block text-xs">EYEBROW (PETIT SURTITRE)</label>
                      <input
                        type="text"
                        value={editingComm.eyebrow || ''}
                        onChange={(e) => setEditingComm({ ...editingComm, eyebrow: e.target.value })}
                        placeholder="Ex: ÉLÉGANTE. FORTE. ENGAGÉE."
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block text-xs">TITRE PRINCIPAL *</label>
                      <input
                        type="text"
                        value={editingComm.title || ''}
                        onChange={(e) => setEditingComm({ ...editingComm, title: e.target.value })}
                        placeholder="Ex: Lancement Nouvelle Collection PROS 2026"
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block text-xs">MESSAGE PRINCIPAL *</label>
                      <textarea
                        rows={5}
                        value={editingComm.content || ''}
                        onChange={(e) => setEditingComm({ ...editingComm, content: e.target.value })}
                        placeholder="Rédigez le texte complet de votre message..."
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none"
                      />
                    </div>

                    {/* Visual Selection */}
                    <div className="space-y-2 p-4 bg-pros-bone border border-neutral-200">
                      <label className="font-bold uppercase text-black block text-xs">VISUEL / BANNIÈRE ATTACHÉE</label>
                      <div className="flex items-center gap-4">
                        {editingComm.imageUrl ? (
                          <img src={editingComm.imageUrl} alt="Preview" className="w-24 h-16 object-cover border border-neutral-300" />
                        ) : (
                          <div className="w-24 h-16 bg-neutral-200 border border-neutral-300 flex items-center justify-center text-neutral-500 text-[10px]">
                            Aucun visuel
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsMediaPickerOpen(true)}
                          className="px-4 py-2 bg-white border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer hover:bg-neutral-100 flex items-center gap-1.5"
                        >
                          <ImageIcon size={14} />
                          <span>CHOISIR DANS LA MÉDIATHÈQUE</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block text-xs">TEXTE DU BOUTON CTA</label>
                        <input
                          type="text"
                          value={editingComm.ctaText || ''}
                          onChange={(e) => setEditingComm({ ...editingComm, ctaText: e.target.value })}
                          placeholder="Ex: DÉCOUVRIR"
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block text-xs">URL CIBLE DU BOUTON</label>
                        <input
                          type="text"
                          value={editingComm.ctaUrl || ''}
                          onChange={(e) => setEditingComm({ ...editingComm, ctaUrl: e.target.value })}
                          placeholder="Ex: /shop"
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: CANAUX */}
                {formStep === 'channels' && (
                  <div className="space-y-6 font-sans">
                    <label className="font-bold uppercase text-black block text-xs">SÉLECTIONNEZ LES CANAUX DE DIFFUSION *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-sans">
                      {[
                        { id: 'SITE', label: 'SITE PROS', icon: Globe },
                        { id: 'NOTIFICATION', label: 'NOTIFICATION', icon: Bell },
                        { id: 'WHATSAPP', label: 'WHATSAPP', icon: Phone },
                        { id: 'EMAIL', label: 'EMAIL', icon: Mail },
                        { id: 'SMS', label: 'SMS', icon: Smartphone },
                      ].map((ch) => {
                        const IconComp = ch.icon;
                        const isChecked = (editingComm.channels || []).includes(ch.id as CommunicationChannel);

                        return (
                          <div
                            key={ch.id}
                            onClick={() => {
                              const currentCh = editingComm.channels || [];
                              const nextCh = isChecked
                                ? currentCh.filter((c) => c !== ch.id)
                                : [...currentCh, ch.id as CommunicationChannel];
                              setEditingComm({ ...editingComm, channels: nextCh });
                            }}
                            className={`p-4 border cursor-pointer flex flex-col items-center gap-2 transition-all font-sans text-center ${
                              isChecked ? 'border-black bg-pros-bone ring-1 ring-black' : 'border-neutral-200 hover:border-neutral-400 bg-white'
                            }`}
                          >
                            <IconComp size={20} className={isChecked ? 'text-black' : 'text-neutral-500'} />
                            <span className="font-bold text-xs uppercase block text-black">{ch.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 4: AUDIENCE */}
                {formStep === 'targeting' && (
                  <div className="space-y-4 font-sans">
                    <label className="font-bold uppercase text-black block text-xs">CIBLAGE DES DESTINATAIRES *</label>
                    
                    <select
                      value={editingComm.audienceType || 'ALL_CUSTOMERS'}
                      onChange={(e) => {
                        const newAud = e.target.value as CommunicationAudienceType;
                        setEditingComm({
                          ...editingComm,
                          audienceType: newAud,
                          recipientsCount: estimateAudienceRecipients(newAud),
                        });
                      }}
                      className="w-full bg-pros-bone border border-neutral-300 p-3 text-xs text-black font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="ALL_CUSTOMERS">ALL CUSTOMERS (100% BASE CLIENTÈLE)</option>
                      <option value="ACTIVE_CUSTOMERS">ACTIVE CUSTOMERS (COMMANDES RÉCENTES)</option>
                      <option value="NEW_CUSTOMERS">NEW CUSTOMERS (MOINS DE 30 JOURS)</option>
                      <option value="PROSPECTS">PROSPECTS (INSCRITS SANS COMMANDE)</option>
                      <option value="PREMIUM_CUSTOMERS">PREMIUM (DÉPENSES &gt; 100 000 FCFA)</option>
                      <option value="PROS_CLUB_MEMBERS">PROS CLUB (MEMBRES OFFICIELS)</option>
                      <option value="PAST_BUYERS">PAST BUYERS (CLIENTS AYANT DÉJÀ COMMANDÉ)</option>
                      <option value="INACTIVE_30_DAYS">INACTIVE 30 DAYS (PLUS DE 30 JOURS)</option>
                    </select>

                    <div className="p-6 bg-pros-black text-white space-y-2 font-sans border border-neutral-800">
                      <div className="text-[10px] font-bold uppercase text-pros-gold tracking-widest font-mono">ESTIMATION TEMPS RÉEL</div>
                      <div className="text-3xl font-bold font-mono text-white">
                        {estimateAudienceRecipients(editingComm.audienceType || 'ALL_CUSTOMERS').toLocaleString('fr-FR')} DESTINATAIRES
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: PLANIFICATION */}
                {formStep === 'scheduling' && (
                  <div className="space-y-4 font-sans">
                    <label className="font-bold uppercase text-black block text-xs">OPTION DE PLANIFICATION</label>
                    <div className="space-y-3 font-sans">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block text-xs">DATE ET HEURE DE PROGRAMMATION</label>
                        <input
                          type="datetime-local"
                          value={editingComm.scheduledAt ? editingComm.scheduledAt.substring(0, 16) : ''}
                          onChange={(e) => setEditingComm({ ...editingComm, scheduledAt: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: LIVE PREVIEW IN CREATION WIZARD */}
                {formStep === 'preview' && (
                  <div className="space-y-4 font-sans">
                    <div className="flex border border-neutral-300 text-xs font-bold uppercase">
                      {(['SITE', 'WHATSAPP', 'EMAIL', 'NOTIFICATION'] as const).map((ch) => (
                        <button
                          key={ch}
                          onClick={() => setPreviewChannel(ch)}
                          className={`px-4 py-2 cursor-pointer ${previewChannel === ch ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'}`}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>

                    <div className="p-6 bg-neutral-900 flex justify-center items-center min-h-[260px] border border-neutral-700">
                      {previewChannel === 'SITE' && (
                        <div className="bg-white text-black p-6 max-w-md w-full border border-neutral-300 space-y-3 shadow-xl font-sans">
                          {editingComm.eyebrow && <span className="text-[10px] font-bold uppercase text-pros-gold">{editingComm.eyebrow}</span>}
                          <h3 className="font-display font-bold text-lg uppercase text-black leading-tight">{editingComm.title}</h3>
                          <p className="text-xs text-neutral-600">{editingComm.content}</p>
                          <span className="inline-block px-5 py-2 bg-black text-white font-bold text-xs uppercase">
                            {editingComm.ctaText || 'DÉCOUVRIR'}
                          </span>
                        </div>
                      )}

                      {previewChannel === 'WHATSAPP' && (
                        <div className="bg-emerald-950 p-4 max-w-sm w-full font-sans rounded-lg space-y-2 text-white border border-emerald-800">
                          <div className="text-[10px] font-bold text-emerald-400 font-mono">PROS Brand Official Business</div>
                          <div className="bg-emerald-900 p-3 rounded text-xs text-emerald-50 whitespace-pre-wrap font-sans">
                            {editingComm.whatsAppTemplate || editingComm.content}
                          </div>
                        </div>
                      )}

                      {previewChannel === 'EMAIL' && (
                        <div className="bg-white p-6 max-w-md w-full border border-neutral-300 space-y-3 text-black font-sans">
                          <div className="border-b pb-2 text-xs">
                            <div><span className="text-neutral-400">De :</span> <strong>{editingComm.emailSenderName} &lt;{editingComm.emailSenderEmail}&gt;</strong></div>
                            <div><span className="text-neutral-400">Objet :</span> <strong>{editingComm.emailSubject || editingComm.title}</strong></div>
                          </div>
                          <p className="text-xs text-neutral-700 whitespace-pre-wrap">{editingComm.content}</p>
                        </div>
                      )}

                      {previewChannel === 'NOTIFICATION' && (
                        <div className="bg-neutral-800 text-white p-4 max-w-sm w-full rounded-xl flex items-start gap-3 shadow-2xl border border-neutral-700 font-sans">
                          <Bell size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <strong className="font-bold text-xs uppercase block text-white">{editingComm.title}</strong>
                            <p className="text-[11px] text-neutral-300 leading-tight">{editingComm.content}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Wizard Footer Actions */}
              <div className="pt-4 border-t border-neutral-200 flex justify-between gap-3 flex-shrink-0 font-sans">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer font-sans"
                >
                  ANNULER
                </button>

                <div className="flex gap-2 font-sans">
                  <button
                    type="button"
                    onClick={() => handleSaveCommunication(true)}
                    className="px-5 py-2.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold uppercase text-xs cursor-pointer font-sans"
                  >
                    ENREGISTRER BROUILLON
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveCommunication(false)}
                    className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer font-sans"
                  >
                    VALIDER ET PROGRAMMER
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: MEDIA PICKER TRIGGER */}
        {isMediaPickerOpen && (
          <MediaPickerModal
            isOpen={true}
            onClose={() => setIsMediaPickerOpen(false)}
            onSelectMedia={(media) => {
              if (editingComm) {
                setEditingComm({
                  ...editingComm,
                  mediaId: media.id,
                  imageUrl: media.url,
                });
              }
              setIsMediaPickerOpen(false);
            }}
          />
        )}

        {/* MODAL: 360° COMMUNICATION DETAIL & STATISTICAL FICHE */}
        {detailComm && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[90vh] flex flex-col">
              
              {/* Detail Header */}
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pros-black text-pros-gold">
                    {getTypeIcon(detailComm.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold font-mono bg-pros-black text-pros-gold uppercase">
                        #{detailComm.id}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-neutral-100 border border-neutral-300">
                        {detailComm.type}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                        {detailComm.status}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-lg uppercase text-black mt-0.5">{detailComm.title}</h3>
                  </div>
                </div>
                <button onClick={() => setDetailComm(null)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              {/* Detail Navigation Tabs */}
              <div className="flex border-b border-neutral-200 gap-4 text-xs font-bold uppercase font-sans flex-shrink-0">
                {[
                  { id: 'overview', label: 'VUE D’ENSEMBLE' },
                  { id: 'content', label: 'CONTENU & VISUEL' },
                  { id: 'performance', label: 'PERFORMANCES CRM' },
                  { id: 'history', label: 'HISTORIQUE D’AUDIT' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id as any)}
                    className={`pb-2.5 border-b-2 font-sans cursor-pointer whitespace-nowrap ${
                      detailTab === t.id ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-1 font-sans">
                
                {detailTab === 'overview' && (
                  <div className="space-y-6 font-sans">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-pros-bone border border-neutral-200 font-sans text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Statut Actuel</span>
                        <strong className="text-black font-bold uppercase">{detailComm.status}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Destinataires</span>
                        <strong className="text-black font-mono text-sm">{detailComm.recipientsCount.toLocaleString('fr-FR')}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Créé par</span>
                        <strong className="text-black text-xs">{detailComm.createdBy}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Canaux</span>
                        <strong className="text-pros-gold font-mono text-xs">{detailComm.channels.join(', ')}</strong>
                      </div>
                    </div>

                    <div className="p-4 border border-neutral-200 space-y-2">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">MESSAGE PRINCIPAL</span>
                      <p className="text-xs text-neutral-800 whitespace-pre-wrap">{detailComm.content}</p>
                    </div>
                  </div>
                )}

                {detailTab === 'content' && (
                  <div className="space-y-4 font-sans">
                    {detailComm.imageUrl && (
                      <img src={detailComm.imageUrl} alt="Visual" className="w-full max-h-64 object-cover border border-neutral-200" />
                    )}
                    <div className="p-4 bg-pros-bone border border-neutral-200 space-y-2 text-xs font-sans">
                      <div><span className="text-neutral-500">Eyebrow :</span> <strong>{detailComm.eyebrow}</strong></div>
                      <div><span className="text-neutral-500">CTA Label :</span> <strong>{detailComm.ctaText}</strong></div>
                      <div><span className="text-neutral-500">CTA URL :</span> <span className="font-mono">{detailComm.ctaUrl}</span></div>
                    </div>
                  </div>
                )}

                {detailTab === 'performance' && (
                  <div className="space-y-6 font-sans">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 bg-pros-bone border border-neutral-200 text-center space-y-1 font-sans">
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Envois Réussis</span>
                        <strong className="text-xl font-mono font-bold text-black">{detailComm.statistics.delivered}</strong>
                      </div>
                      <div className="p-4 bg-pros-bone border border-neutral-200 text-center space-y-1 font-sans">
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Ouvertures</span>
                        <strong className="text-xl font-mono font-bold text-emerald-700">{detailComm.statistics.opened} ({getOpenRate(detailComm)}%)</strong>
                      </div>
                      <div className="p-4 bg-pros-bone border border-neutral-200 text-center space-y-1 font-sans">
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Clics CTA</span>
                        <strong className="text-xl font-mono font-bold text-blue-700">{detailComm.statistics.clicked}</strong>
                      </div>
                      <div className="p-4 bg-pros-bone border border-neutral-200 text-center space-y-1 font-sans">
                        <span className="text-[10px] text-neutral-500 uppercase font-bold block">Conversions</span>
                        <strong className="text-xl font-mono font-bold text-purple-700">{detailComm.statistics.converted}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === 'history' && (
                  <div className="space-y-3 font-sans text-xs">
                    {logs
                      .filter((l) => l.communicationId === detailComm.id)
                      .map((log) => (
                        <div key={log.id} className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center font-sans">
                          <div>
                            <strong className="font-bold text-black block">{log.action}</strong>
                            <span className="text-[10px] text-neutral-500">{log.notes} — Par: {log.adminName}</span>
                          </div>
                          <span className="font-mono text-[10px] text-neutral-400">{log.timestamp}</span>
                        </div>
                      ))}
                  </div>
                )}

              </div>

              {/* Detail Footer */}
              <div className="pt-4 border-t border-neutral-200 flex justify-end font-sans">
                <button onClick={() => setDetailComm(null)} className="px-6 py-2 bg-pros-black text-white font-bold uppercase text-xs">
                  FERMER
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: TEMPLATES MANAGEMENT */}
        {isTemplatesModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[90vh] flex flex-col">
              
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-pros-gold" />
                  <h3 className="font-display font-bold text-base uppercase text-black">MODÈLES DE COMMUNICATION REUTILISABLES</h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const newT = addTemplate({
                        name: `MODÈLE PERSO #${templates.length + 1}`,
                        category: 'Sur Mesure',
                        type: 'PROMOTION',
                        title: 'Titre du modèle',
                        content: 'Message personnalisé...',
                        channels: ['SITE', 'WHATSAPP'],
                      });
                      showToast(`Modèle "${newT.name}" créé.`);
                    }}
                    className="px-3 py-1 bg-pros-black hover:bg-neutral-800 text-white font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>NOUVEAU MODÈLE</span>
                  </button>
                  <button onClick={() => setIsTemplatesModalOpen(false)} className="text-neutral-500 hover:text-black">
                    <X size={22} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto min-h-0 flex-1 pr-1 font-sans text-xs">
                {templates.map((tpl) => (
                  <div key={tpl.id} className="p-4 bg-pros-bone border border-neutral-200 space-y-3 font-sans">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-pros-black text-pros-gold uppercase font-mono mr-2">
                          {tpl.category}
                        </span>
                        <strong className="font-display font-bold text-sm uppercase text-black">{tpl.name}</strong>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            deleteTemplate(tpl.id);
                            showToast(`Modèle "${tpl.name}" supprimé.`);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 border border-neutral-200 cursor-pointer"
                          title="Supprimer ce modèle"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingComm({
                              type: tpl.type,
                              title: tpl.title,
                              eyebrow: tpl.eyebrow,
                              content: tpl.content,
                              channels: tpl.channels,
                              whatsAppTemplate: tpl.whatsAppTemplate,
                              emailSubject: tpl.emailSubject,
                              status: 'DRAFT',
                            });
                            setIsTemplatesModalOpen(false);
                            setFormStep('content');
                            setIsCreateModalOpen(true);
                            showToast(`Modèle "${tpl.name}" prérempli.`);
                          }}
                          className="px-3 py-1.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-[10px] uppercase cursor-pointer shadow-sm"
                        >
                          UTILISER CE MODÈLE
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 font-sans">{tpl.content}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end font-sans">
                <button onClick={() => setIsTemplatesModalOpen(false)} className="px-6 py-2 bg-pros-black text-white font-bold uppercase text-xs">
                  FERMER
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: SEND CONFIRMATION */}
        {sendConfirmComm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex items-center gap-3 text-emerald-600">
                <Send size={28} />
                <h3 className="font-display font-bold text-base uppercase text-black">CONFIRMER L'ENVOI DE LA COMMUNICATION</h3>
              </div>

              <p className="text-xs text-neutral-600 font-sans">
                Vous êtes sur le point d'envoyer la communication <strong>"{sendConfirmComm.title}"</strong> à :
              </p>

              <div className="p-4 bg-pros-bone border border-neutral-200 font-mono text-center text-sm font-bold text-black">
                {sendConfirmComm.recipientsCount.toLocaleString('fr-FR')} DESTINATAIRES
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setSendConfirmComm(null)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-100"
                >
                  ANNULER
                </button>
                <button
                  onClick={handleConfirmSendNow}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase shadow-sm"
                >
                  CONFIRMER L'ENVOI
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
};

export const AdminCommunicationsPage: React.FC = () => (
  <AdminLayout>
    <AdminCommunicationsContent />
  </AdminLayout>
);
