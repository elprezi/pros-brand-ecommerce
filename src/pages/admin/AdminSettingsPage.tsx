import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useStore } from '../../store/storeContext';
import { useAuth } from '../../store/authContext';
import { logRbacAction, getRbacAuditLogs } from '../../lib/server/rbacEngine';
import type { DeliveryZoneSetting, StoreSettings } from '../../types/ecommerce';
import type { RbacAuditLog } from '../../types/rbac';
import {
  Save,
  CheckCircle2,
  X,
  Plus,
  Smartphone,
  Truck,
  CreditCard,
  ShoppingBag,
  Bell,
  Award,
  Globe,
  Lock,
  History,
  Store,
  Users,
  BarChart2,
  RefreshCcw,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Percent,
  Search,
  Download,
  Eye,
  ShieldAlert,
  Activity,
  Clock,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, updateSettings, formatPrice } = useStore();
  const { currentUser } = useAuth();

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<
    | 'general'
    | 'boutique'
    | 'banner'
    | 'commandes'
    | 'livraison'
    | 'zones'
    | 'paiements'
    | 'whatsapp'
    | 'clients'
    | 'notifications'
    | 'taxes'
    | 'securite'
    | 'logs'
    | 'fidelite'
    | 'stock'
    | 'analytics'
  >('general');

  // Form State initialized from store settings
  const [formState, setFormState] = useState<StoreSettings>({ ...settings });
  const [isModified, setIsModified] = useState(false);
  const [pendingTabSwitch, setPendingTabSwitch] = useState<string | null>(null);

  // Scroll Container Ref for smooth tab scrolling
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Modal & Toast State
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false);
  const [isUnsavedWarningOpen, setIsUnsavedWarningOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // AUDIT LOGS INTERNAL TAB STATE
  const [logs] = useState<RbacAuditLog[]>(() => getRbacAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [categoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter] = useState<string>('ALL');
  const [timeframeFilter] = useState<string>('ALL');
  const [quickFilter, setQuickFilter] = useState<'all' | 'mine' | 'critical'>('all');
  const [currentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy] = useState<'newest' | 'oldest' | 'severity' | 'user'>('newest');
  const [selectedLog, setSelectedLog] = useState<RbacAuditLog | null>(null);

  const [newZone, setNewZone] = useState<DeliveryZoneSetting>({
    id: '',
    name: '',
    fee: 5000,
    estimatedDelay: '48h - 72h',
    active: true,
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // URL Query Params & Legacy Route Sync
  useEffect(() => {
    const queryTab = searchParams.get('tab');
    if (queryTab) {
      const t = queryTab.toLowerCase();
      if (t === 'general') setActiveTab('general');
      else if (t === 'shop' || t === 'boutique') setActiveTab('boutique');
      else if (t === 'banner' || t === 'bandeau') setActiveTab('banner');
      else if (t === 'orders' || t === 'commandes') setActiveTab('commandes');
      else if (t === 'delivery' || t === 'shipping' || t === 'livraison') setActiveTab('livraison');
      else if (t === 'zones') setActiveTab('zones');
      else if (t === 'payments' || t === 'paiements') setActiveTab('paiements');
      else if (t === 'whatsapp') setActiveTab('whatsapp');
      else if (t === 'clients') setActiveTab('clients');
      else if (t === 'notifications') setActiveTab('notifications');
      else if (t === 'taxes') setActiveTab('taxes');
      else if (t === 'security' || t === 'securite') setActiveTab('securite');
      else if (t === 'logs' || t === 'journal' || t === 'historique') setActiveTab('logs');
      else if (t === 'fidelite') setActiveTab('fidelite');
      else if (t === 'stock') setActiveTab('stock');
      else if (t === 'analytics') setActiveTab('analytics');
    } else if (location.pathname.endsWith('/payments')) {
      setActiveTab('paiements');
    } else if (location.pathname.endsWith('/shipping') || location.pathname.endsWith('/delivery')) {
      setActiveTab('livraison');
    } else if (location.pathname.endsWith('/zones')) {
      setActiveTab('zones');
    } else if (location.pathname.endsWith('/taxes')) {
      setActiveTab('taxes');
    } else if (location.pathname.endsWith('/notifications')) {
      setActiveTab('notifications');
    } else if (location.pathname.endsWith('/logs')) {
      setActiveTab('logs');
    }
  }, [location.pathname, searchParams]);

  // Helper to calculate modification count
  const modifiedCount = useMemo(() => {
    let count = 0;
    Object.keys(formState).forEach((key) => {
      const k = key as keyof StoreSettings;
      if (JSON.stringify(formState[k]) !== JSON.stringify(settings[k])) {
        count += 1;
      }
    });
    return count;
  }, [formState, settings]);

  // Helper to update field and mark form as modified
  const updateField = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    setIsModified(true);
  };

  // Smooth Tab Scroll
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      tabsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Tab Switch Handler with Unsaved Guard
  const handleTabClick = (tabId: string) => {
    if (isModified) {
      setPendingTabSwitch(tabId);
      setIsUnsavedWarningOpen(true);
    } else {
      setActiveTab(tabId as any);
      setSearchParams({ tab: tabId });
    }
  };

  // Confirm Tab Switch without Saving
  const handleConfirmTabSwitch = () => {
    setFormState({ ...settings });
    setIsModified(false);
    setIsUnsavedWarningOpen(false);
    if (pendingTabSwitch) {
      setActiveTab(pendingTabSwitch as any);
      setSearchParams({ tab: pendingTabSwitch });
      setPendingTabSwitch(null);
    }
  };

  // Save Settings Workflow
  const handleSave = () => {
    if (formState.dakarShippingFee < 0 || formState.regionShippingFee < 0) {
      showToast('Les frais de livraison doivent être supérieurs ou égaux à 0.', 'error');
      return;
    }

    updateSettings(formState);
    setIsModified(false);

    // Record Audit Modification Log
    const newAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'OUSMANE SONKO',
      settingKey: 'GLOBAL_CONFIG_UPDATE',
      oldVal: `${modifiedCount} paramètre(s) modifié(s)`,
      newVal: 'Configuration sauvegardée',
    };

    const updatedHistory = [newAuditLog, ...(formState.modificationHistory || [])];
    setFormState((prev) => ({ ...prev, modificationHistory: updatedHistory }));

    logRbacAction(
      currentUser?.email || 'ousmane.sonko@pros.sn',
      'MODIFICATION DES RÉGLAGES',
      'Mise à jour des paramètres globaux de la plateforme PROS',
      'Configuration',
      'GLOBAL',
      'Version précédente',
      'Configuration sauvegardée',
      'IMPORTANT',
      'SUCCÈS'
    );

    showToast('✓ Modifications enregistrées avec succès à ' + new Date().toLocaleTimeString('fr-FR'));
  };

  // Reset / Cancel Changes
  const handleReset = () => {
    setFormState({ ...settings });
    setIsModified(false);
    showToast('Modifications annulées. Paramètres restaurés.', 'info');
  };

  // Add Delivery Zone
  const handleAddZone = () => {
    if (!newZone.name) {
      showToast('Le nom de la zone est obligatoire.', 'error');
      return;
    }

    const zoneId = `zone-${Date.now()}`;
    const zoneToAdd = { ...newZone, id: zoneId };
    const currentZones = formState.deliveryZones || [];
    updateField('deliveryZones', [...currentZones, zoneToAdd]);

    setIsAddZoneModalOpen(false);
    setNewZone({ id: '', name: '', fee: 5000, estimatedDelay: '48h - 72h', active: true });
    showToast(`Nouvelle zone de livraison "${zoneToAdd.name}" ajoutée.`);
  };

  // Toggle Zone Active Status
  const toggleZoneActive = (zoneId: string) => {
    const currentZones = formState.deliveryZones || [];
    const updated = currentZones.map((z) => (z.id === zoneId ? { ...z, active: !z.active } : z));
    updateField('deliveryZones', updated);
  };

  // Toggle Payment Method Active Status
  const togglePaymentMethod = (methodId: string) => {
    const currentMethods = formState.paymentMethods || [];
    const updated = currentMethods.map((p) => (p.id === methodId ? { ...p, active: !p.active } : p));
    updateField('paymentMethods', updated);
  };

  // Validate & Test WhatsApp Number
  const handleTestWhatsApp = () => {
    const cleanNum = formState.whatsAppNumber.replace(/[^0-9]/g, '');
    if (!cleanNum || cleanNum.length < 8) {
      showToast('Veuillez saisir un numéro WhatsApp valide.', 'error');
      return;
    }
    window.open(`https://wa.me/${cleanNum}`, '_blank');
  };

  // AUDIT LOGS FILTERING & COMPUTATIONS
  const getRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 3600));
    const diffDays = Math.floor(diffMs / (1000 * 86400));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    return new Date(timestamp).toLocaleDateString('fr-FR');
  };

  const uniqueUsers = useMemo(() => {
    const usersMap: Record<string, string> = {};
    logs.forEach((l) => {
      const email = l.adminEmail || 'ousmane.sonko@pros.sn';
      const name = l.userName || 'OUSMANE SONKO';
      usersMap[email] = name;
    });
    return Object.entries(usersMap);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs
      .filter((l) => {
        if (quickFilter === 'mine') {
          const currentEmail = currentUser?.email || 'ousmane.sonko@pros.sn';
          if (l.adminEmail.toLowerCase() !== currentEmail.toLowerCase() && !l.userName?.includes('SONKO')) {
            return false;
          }
        } else if (quickFilter === 'critical') {
          if (l.severity !== 'CRITIQUE' && l.severity !== 'SÉCURITÉ' && l.status !== 'BLOQUÉ') {
            return false;
          }
        }

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchUser = (l.userName || l.adminEmail).toLowerCase().includes(term);
          const matchRole = (l.userRole || '').toLowerCase().includes(term);
          const matchAction = (l.action || '').toLowerCase().includes(term);
          const matchCode = (l.actionCode || '').toLowerCase().includes(term);
          const matchCategory = (l.actionCategory || '').toLowerCase().includes(term);
          const matchTarget = (l.entityName || l.targetId || '').toLowerCase().includes(term);
          const matchDesc = (l.description || l.oldValue || '').toLowerCase().includes(term);
          const matchIp = (l.ipAddress || '').toLowerCase().includes(term);
          const matchId = l.id.toLowerCase().includes(term);

          if (
            !matchUser &&
            !matchRole &&
            !matchAction &&
            !matchCode &&
            !matchCategory &&
            !matchTarget &&
            !matchDesc &&
            !matchIp &&
            !matchId
          ) {
            return false;
          }
        }

        if (userFilter !== 'ALL' && l.adminEmail !== userFilter) return false;
        if (categoryFilter !== 'ALL' && l.actionCategory !== categoryFilter) return false;
        if (severityFilter !== 'ALL' && l.severity !== severityFilter) return false;
        if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;

        if (timeframeFilter !== 'ALL') {
          const logTime = new Date(l.timestamp).getTime();
          const now = Date.now();
          if (timeframeFilter === 'today') {
            const todayStart = new Date().setHours(0, 0, 0, 0);
            if (logTime < todayStart) return false;
          } else if (timeframeFilter === '7d') {
            if (logTime < now - 7 * 24 * 3600 * 1000) return false;
          } else if (timeframeFilter === '30d') {
            if (logTime < now - 30 * 24 * 3600 * 1000) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        if (sortBy === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        if (sortBy === 'severity') {
          const rank: Record<string, number> = { SÉCURITÉ: 4, CRITIQUE: 3, IMPORTANT: 2, INFO: 1 };
          return (rank[b.severity || 'INFO'] || 1) - (rank[a.severity || 'INFO'] || 1);
        }
        if (sortBy === 'user') return (a.userName || a.adminEmail).localeCompare(b.userName || b.adminEmail);
        return 0;
      });
  }, [logs, searchTerm, userFilter, categoryFilter, severityFilter, statusFilter, timeframeFilter, quickFilter, sortBy, currentUser]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const todayLogsCount = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    return logs.filter((l) => new Date(l.timestamp).getTime() >= todayStart).length;
  }, [logs]);

  const todayActiveUsersCount = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const set = new Set<string>();
    logs.filter((l) => new Date(l.timestamp).getTime() >= todayStart).forEach((l) => set.add(l.adminEmail));
    return set.size;
  }, [logs]);

  const criticalLogsCount = useMemo(() => {
    return logs.filter((l) => l.severity === 'CRITIQUE' || l.severity === 'SÉCURITÉ').length;
  }, [logs]);

  const failuresCount = useMemo(() => {
    return logs.filter((l) => l.status === 'ÉCHEC' || l.status === 'BLOQUÉ' || l.status === 'DENIED').length;
  }, [logs]);

  const latestLogTime = logs[0] ? getRelativeTime(logs[0].timestamp) : 'N/A';

  const handleExportLogs = (format: 'CSV' | 'EXCEL' | 'PDF') => {
    if (format === 'CSV') {
      const header = 'ID;DATE;HEURE;UTILISATEUR;RÔLE;CODE_ACTION;ACTION;CATÉGORIE;OBJET;DÉTAILS;GRAVITÉ;STATUT;IP;SESSION\n';
      const rows = filteredLogs
        .map((l) => {
          const d = new Date(l.timestamp);
          return [
            l.id,
            d.toLocaleDateString('fr-FR'),
            d.toLocaleTimeString('fr-FR'),
            l.userName || 'OUSMANE SONKO',
            l.userRole || 'SUPER_ADMIN',
            l.actionCode || 'SYSTEM',
            l.action,
            l.actionCategory || 'Général',
            l.entityName || l.targetType || 'PARAMÈTRES GLOBAUX',
            `"${(l.description || '').replace(/"/g, '""')}"`,
            l.severity || 'INFO',
            l.status,
            l.ipAddress || '41.214.65.12',
            l.sessionId || 'N/A',
          ].join(';');
        })
        .join('\n');

      const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `PROS_Journal_Audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    showToast(`Journal d'activité exporté avec succès au format ${format}.`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="ADMINISTRATION PROS"
          title="RÉGLAGES & CONFIGURATION"
          description="Configurez les paramètres globaux de votre boutique, de vos commandes, livraisons, paiements, clients, notifications et fonctionnalités commerciales."
          primaryAction={
            <div className="flex items-center gap-3 font-sans">
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-3.5 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <History size={16} />
                <span>HISTORIQUE</span>
              </button>

              {isModified && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCcw size={16} />
                  <span>ANNULER</span>
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={!isModified}
                className={`px-5 py-2.5 font-bold text-xs uppercase tracking-superwide flex items-center gap-2 cursor-pointer shadow-sm transition-all ${
                  isModified
                    ? 'bg-pros-black hover:bg-neutral-800 text-white'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                }`}
              >
                <Save size={16} />
                <span>{isModified ? 'ENREGISTRER LES MODIFICATIONS' : 'AUCUNE MODIFICATION'}</span>
              </button>
            </div>
          }
        />

        {/* MODIFICATION INDICATOR BADGE */}
        {isModified ? (
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold font-mono flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>● {modifiedCount} modification(s) non enregistrée(s)</span>
            </div>
            <button onClick={handleSave} className="px-3 py-1 bg-black text-white text-[10px] uppercase font-bold cursor-pointer">
              ENREGISTRER MAINTENANT
            </button>
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold font-mono flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-700" />
            <span>✓ TOUS LES PARAMÈTRES SONT À JOUR ET ENREGISTRÉS</span>
          </div>
        )}

        {/* Toast Alert */}
        {toastMsg && (
          <div
            className={`p-4 text-xs font-bold flex items-center justify-between font-sans shadow-sm border ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : toastMsg.type === 'error'
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-blue-50 border-blue-300 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className={toastMsg.type === 'success' ? 'text-emerald-600' : 'text-neutral-600'} />
              <span>{toastMsg.text}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* SECTION 1: SLEEK HORIZONTAL TAB NAVIGATION WITH SCROLL ARROWS */}
        <div className="relative border-b border-neutral-200 bg-white font-sans flex items-center">
          {/* Scroll Left Button */}
          <button
            onClick={() => scrollTabs('left')}
            className="p-3 bg-white border-r border-neutral-200 text-neutral-600 hover:text-black cursor-pointer shadow-sm z-10"
            title="Défiler vers la gauche"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Scrollable Container */}
          <div
            ref={tabsScrollRef}
            className="flex overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth flex-1 font-sans"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              { id: 'general', label: 'GÉNÉRAL', icon: Globe },
              { id: 'boutique', label: 'BOUTIQUE', icon: Store },
              { id: 'banner', label: 'BANDEAU', icon: Bell },
              { id: 'commandes', label: 'COMMANDES', icon: ShoppingBag },
              { id: 'livraison', label: 'LIVRAISON', icon: Truck },
              { id: 'zones', label: 'ZONES', icon: MapPin },
              { id: 'paiements', label: 'PAIEMENTS', icon: CreditCard },
              { id: 'whatsapp', label: 'WHATSAPP', icon: Smartphone },
              { id: 'clients', label: 'CLIENTS', icon: Users },
              { id: 'notifications', label: 'NOTIFICATIONS', icon: Bell },
              { id: 'taxes', label: 'TAXES', icon: Percent },
              { id: 'securite', label: 'SÉCURITÉ', icon: Lock },
              { id: 'logs', label: 'JOURNAL D\'ACTIVITÉ', icon: History },
              { id: 'fidelite', label: 'FIDÉLITÉ', icon: Award },
              { id: 'stock', label: 'STOCK', icon: Store },
              { id: 'analytics', label: 'ANALYTICS', icon: BarChart2 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-2 shrink-0 ${
                    activeTab === tab.id
                      ? 'border-black text-black bg-pros-bone'
                      : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scrollTabs('right')}
            className="p-3 bg-white border-l border-neutral-200 text-neutral-600 hover:text-black cursor-pointer shadow-sm z-10"
            title="Défiler vers la droite"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* TAB 1: GÉNÉRAL */}
        {activeTab === 'general' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              INFORMATIONS GÉNÉRALES DE LA PLATEFORME
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Nom de la Plateforme</label>
                <input
                  type="text"
                  value={formState.platformName || 'PROS ERP'}
                  onChange={(e) => updateField('platformName', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono font-bold text-black"
                />
                <span className="text-[9px] text-neutral-400 block">Identifiant système du back-office ERP.</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Nom Commercial / Maison</label>
                <input
                  type="text"
                  value={formState.companyName || 'Service PRO'}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono font-bold text-black"
                />
                <span className="text-[9px] text-neutral-400 block">Raison sociale affichée sur les factures et emails.</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Email Administrateur Principal</label>
                <input
                  type="email"
                  value={formState.adminEmail || 'admin@pros.sn'}
                  onChange={(e) => updateField('adminEmail', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Email Support Client</label>
                <input
                  type="email"
                  value={formState.supportEmail || 'support@pros.sn'}
                  onChange={(e) => updateField('supportEmail', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Téléphone Support</label>
                <input
                  type="text"
                  value={formState.supportPhone || '+221 77 000 00 00'}
                  onChange={(e) => updateField('supportPhone', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Devise Principale</label>
                <select
                  value={formState.currency || 'FCFA'}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono font-bold text-black cursor-pointer"
                >
                  <option value="FCFA">FCFA — Franc CFA (XOF)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="USD">USD — Dollar américain ($)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Fuseau Horaire</label>
                <select
                  value={formState.timezone || 'Africa/Dakar'}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono font-bold text-black cursor-pointer"
                >
                  <option value="Africa/Dakar">Africa/Dakar (GMT+0 - Sénégal)</option>
                  <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                </select>
                <span className="text-[9px] text-neutral-400 block">Utilisé pour les horodatages de commandes, rapports et logs.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOUTIQUE */}
        {activeTab === 'boutique' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h4 className="font-display font-bold text-sm uppercase text-black">IDENTITÉ & STATUT DE LA BOUTIQUE</h4>
              <span
                className={`px-3 py-1 text-xs font-mono font-bold uppercase border ${
                  formState.maintenanceMode ? 'bg-red-100 text-red-900 border-red-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                ● {formState.maintenanceMode ? 'BOUTIQUE EN MAINTENANCE' : 'BOUTIQUE ACTIVE'}
              </span>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Nom Commercial de la Boutique</label>
                <input
                  type="text"
                  value={formState.storeName || 'PROS — E-Shop Officiel Sénégal'}
                  onChange={(e) => updateField('storeName', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-bold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Description Courte (SEO)</label>
                <textarea
                  rows={2}
                  value={formState.shortDescription || 'Maison de Haute Couture Africaine & Prêt-à-Porter Engagé'}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 text-black"
                />
              </div>

              <div className="p-4 bg-pros-bone border border-neutral-200 space-y-3 font-sans">
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="font-bold text-black uppercase block">ACTIVER LE MODE MAINTENANCE</strong>
                    <span className="text-[10px] text-neutral-500">Affiche une page d'attente personnalisée aux visiteurs.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateField('maintenanceMode', !formState.maintenanceMode)}
                    className={`px-4 py-2 font-bold text-xs uppercase font-mono cursor-pointer border ${
                      formState.maintenanceMode ? 'bg-red-700 text-white border-red-800' : 'bg-emerald-700 text-white border-emerald-800'
                    }`}
                  >
                    {formState.maintenanceMode ? 'DESACTIVER LE MODE MAINTENANCE' : 'ACTIVER LE MODE MAINTENANCE'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BANDEAU */}
        {activeTab === 'banner' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              BANDEAU D'ANNONCE SUPÉRIEUR (TOP BANNER)
            </h4>

            <div className="space-y-4 text-xs font-sans">
              <div className="flex items-center gap-3">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Afficher le Bandeau d'Annonce :</label>
                <button
                  type="button"
                  onClick={() => updateField('announcementEnabled', !formState.announcementEnabled)}
                  className={`px-3 py-1 font-bold text-xs uppercase font-mono border cursor-pointer ${
                    formState.announcementEnabled ? 'bg-black text-white border-black' : 'bg-neutral-200 text-neutral-600 border-neutral-300'
                  }`}
                >
                  {formState.announcementEnabled ? 'ACTIVÉ (VISIBLE)' : 'DÉSACTIVÉ'}
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Texte de l'Annonce</label>
                <textarea
                  rows={2}
                  value={formState.announcementText}
                  onChange={(e) => updateField('announcementText', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono text-black font-bold"
                />
              </div>

              <div className="p-3 bg-pros-black text-white text-center font-mono text-xs tracking-wider uppercase border border-pros-gold">
                {formState.announcementText}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMMANDES */}
        {activeTab === 'commandes' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              PARAMÈTRES ET RÈGLES DES COMMANDES
            </h4>

            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center">
                  <span>Autoriser les commandes sans compte (Invités)</span>
                  <input
                    type="checkbox"
                    checked={formState.guestCheckoutAllowed !== false}
                    onChange={(e) => updateField('guestCheckoutAllowed', e.target.checked)}
                    className="accent-black cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center">
                  <span>Autoriser l'annulation de commande par le client</span>
                  <input
                    type="checkbox"
                    checked={formState.cancellationAllowed !== false}
                    onChange={(e) => updateField('cancellationAllowed', e.target.checked)}
                    className="accent-black cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LIVRAISON */}
        {activeTab === 'livraison' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              TARIFS ET SEUILS DE LIVRAISON SÉNÉGAL
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Frais Livraison Dakar (FCFA)</label>
                <input
                  type="number"
                  value={formState.dakarShippingFee}
                  onChange={(e) => updateField('dakarShippingFee', Number(e.target.value))}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono font-bold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Frais Livraison Régions (FCFA)</label>
                <input
                  type="number"
                  value={formState.regionShippingFee}
                  onChange={(e) => updateField('regionShippingFee', Number(e.target.value))}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono font-bold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Seuil Livraison Gratuite (FCFA)</label>
                <input
                  type="number"
                  value={formState.freeShippingThreshold}
                  onChange={(e) => updateField('freeShippingThreshold', Number(e.target.value))}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono font-bold text-emerald-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ZONES */}
        {activeTab === 'zones' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h4 className="font-display font-bold text-sm uppercase text-black">ZONES DE LIVRAISON ET DÉLAIS ESTIMÉS</h4>
              <button
                onClick={() => setIsAddZoneModalOpen(true)}
                className="px-4 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer"
              >
                <Plus size={14} /> + AJOUTER UNE ZONE
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <th className="p-3">ZONE / RÉGION</th>
                    <th className="p-3">FRAIS DE LIVRAISON</th>
                    <th className="p-3">DÉLAI ESTIMÉ</th>
                    <th className="p-3">STATUT</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-sans">
                  {(formState.deliveryZones || []).map((z) => (
                    <tr key={z.id} className="hover:bg-neutral-50 font-sans">
                      <td className="p-3 font-bold text-black uppercase">{z.name}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{formatPrice(z.fee)}</td>
                      <td className="p-3 font-mono text-neutral-600">{z.estimatedDelay}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border ${
                            z.active ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-neutral-100 text-neutral-500 border-neutral-300'
                          }`}
                        >
                          {z.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleZoneActive(z.id)}
                          className="px-2.5 py-1 bg-white border border-neutral-300 font-bold text-[10px] uppercase cursor-pointer"
                        >
                          {z.active ? 'DÉSACTIVER' : 'ACTIVER'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: PAIEMENTS */}
        {activeTab === 'paiements' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              MOYENS DE PAIEMENT ACCEPTER SUR PROS E-SHOP
            </h4>

            <div className="space-y-3 font-sans text-xs">
              {(formState.paymentMethods || []).map((p) => (
                <div key={p.id} className="p-4 bg-pros-bone border border-neutral-200 flex justify-between items-center">
                  <div>
                    <strong className="font-bold text-black uppercase block">{p.name}</strong>
                    <span className="text-[10px] text-neutral-500">Méthode éligible au checkout en ligne</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => togglePaymentMethod(p.id)}
                    className={`px-4 py-2 font-bold text-xs uppercase font-mono cursor-pointer border ${
                      p.active ? 'bg-black text-white border-black' : 'bg-neutral-200 text-neutral-600 border-neutral-300'
                    }`}
                  >
                    {p.active ? 'ACTIF' : 'DÉSACTIVÉ'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: WHATSAPP */}
        {activeTab === 'whatsapp' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              WHATSAPP COMMERCE & SUPPORT CLIENT
            </h4>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Numéro WhatsApp Support</label>
                <input
                  type="text"
                  value={formState.whatsAppNumber}
                  onChange={(e) => updateField('whatsAppNumber', e.target.value)}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono font-bold text-black"
                />
              </div>

              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer"
              >
                <Smartphone size={14} /> TESTER LE NUMÉRO WHATSAPP
              </button>
            </div>
          </div>
        )}

        {/* TAB 9: CLIENTS */}
        {activeTab === 'clients' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              POLITIQUES DU COMPTE CLIENT
            </h4>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center">
                <span>Vérification obligatoire du numéro de téléphone</span>
                <input
                  type="checkbox"
                  checked={formState.phoneVerificationEnabled !== false}
                  onChange={(e) => updateField('phoneVerificationEnabled', e.target.checked)}
                  className="accent-black cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              DÉCLENCHEURS DE NOTIFICATIONS AUTOMATIQUES
            </h4>

            <div className="space-y-3 font-sans text-xs">
              {[
                { key: 'newOrderAdmin', label: 'Nouvelle commande reçue (Alerte Admin)' },
                { key: 'orderConfirmedClient', label: 'Confirmation de commande envoyée au client' },
                { key: 'orderShippedClient', label: 'Avis d\'expédition envoyé au client' },
              ].map((item) => (
                <div key={item.key} className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center">
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={formState.autoNotifications?.[item.key] !== false}
                    onChange={(e) =>
                      updateField('autoNotifications', {
                        ...(formState.autoNotifications || {}),
                        [item.key]: e.target.checked,
                      })
                    }
                    className="accent-black cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 11: TAXES */}
        {activeTab === 'taxes' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              RÈGLES FISCALES & TVA SÉNÉGAL
            </h4>

            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Taux Standard TVA (%)</label>
                  <input
                    type="number"
                    value={18}
                    disabled
                    className="w-full p-2.5 bg-neutral-100 border border-neutral-300 font-mono text-black font-bold"
                  />
                  <span className="text-[9px] text-neutral-400 block">Taux légal de TVA au Sénégal (18%).</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Numéro NINEA / NIF Entreprise</label>
                  <input
                    type="text"
                    value="NINEA: 007654321 - SN DKR 2026"
                    disabled
                    className="w-full p-2.5 bg-neutral-100 border border-neutral-300 font-mono text-black font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center">
                <div>
                  <strong className="font-bold text-black uppercase block">PRIX AFFICHÉS TTC (TOUTES TAXES COMPRISES)</strong>
                  <span className="text-[10px] text-neutral-500">Affiche les prix finaux incluant la TVA au client sur la boutique.</span>
                </div>
                <input type="checkbox" checked readOnly className="accent-black cursor-pointer" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 12: SÉCURITÉ */}
        {activeTab === 'securite' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h4 className="font-display font-bold text-sm uppercase text-black">SÉCURITÉ DE L'ADMINISTRATION</h4>
              <span className="text-xs font-mono font-bold text-amber-700 flex items-center gap-1">
                <ShieldCheck size={14} /> 🔒 PARAMÈTRES CRITIQUES (SUPER_ADMIN)
              </span>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="font-bold text-neutral-600 uppercase text-[10px]">Session Timeout (Minutes)</label>
                <input
                  type="number"
                  value={formState.sessionTimeoutMinutes || 60}
                  onChange={(e) => updateField('sessionTimeoutMinutes', Number(e.target.value))}
                  className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono text-black font-bold"
                />
              </div>

              <div className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center">
                <span>Journalisation des actions d'administration (Audit RBAC)</span>
                <input
                  type="checkbox"
                  checked={formState.adminActionLogging !== false}
                  onChange={(e) => updateField('adminActionLogging', e.target.checked)}
                  className="accent-black cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 13: JOURNAL D'ACTIVITÉ & AUDIT (COMPLETE INTEGRATED AUDIT CENTER) */}
        {activeTab === 'logs' && (
          <div className="space-y-6 font-sans">
            <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <div>
                  <h4 className="font-display font-bold text-base uppercase text-black">CENTRE D'AUDIT & JOURNAL D'ACTIVITÉ PROS</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Traçabilité complète des actions administratives effectuées sur la plateforme.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuickFilter(quickFilter === 'mine' ? 'all' : 'mine')}
                    className={`px-3 py-1.5 font-bold text-xs uppercase cursor-pointer border ${
                      quickFilter === 'mine' ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-300'
                    }`}
                  >
                    MES ACTIVITÉS
                  </button>

                  <button
                    onClick={() => setQuickFilter(quickFilter === 'critical' ? 'all' : 'critical')}
                    className={`px-3 py-1.5 font-bold text-xs uppercase cursor-pointer border flex items-center gap-1 ${
                      quickFilter === 'critical' ? 'bg-red-900 text-white border-red-900' : 'bg-white text-red-700 border-neutral-300'
                    }`}
                  >
                    <ShieldAlert size={14} />
                    <span>ACTIONS CRITIQUES</span>
                  </button>

                  <button
                    onClick={() => handleExportLogs('CSV')}
                    className="px-4 py-1.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer"
                  >
                    <Download size={14} /> EXPORTER (.csv)
                  </button>
                </div>
              </div>

              {/* 5 KPI CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-sans pt-2">
                <div className="bg-pros-bone border border-neutral-200 p-3 space-y-1">
                  <div className="text-[9px] font-bold uppercase text-neutral-500">ACTIONS AUJOURD'HUI</div>
                  <div className="text-lg font-bold font-mono text-black">{todayLogsCount}</div>
                </div>

                <div className="bg-pros-bone border border-neutral-200 p-3 space-y-1">
                  <div className="text-[9px] font-bold uppercase text-neutral-500">UTILISATEURS ACTIFS</div>
                  <div className="text-lg font-bold font-mono text-emerald-700">{todayActiveUsersCount}</div>
                </div>

                <div className="bg-pros-bone border border-neutral-200 p-3 space-y-1">
                  <div className="text-[9px] font-bold uppercase text-neutral-500">ACTIONS CRITIQUES</div>
                  <div className="text-lg font-bold font-mono text-pros-gold">{criticalLogsCount}</div>
                </div>

                <div className="bg-pros-bone border border-neutral-200 p-3 space-y-1">
                  <div className="text-[9px] font-bold uppercase text-neutral-500">ÉCHECS & BLOQUÉS</div>
                  <div className="text-lg font-bold font-mono text-red-700">{failuresCount}</div>
                </div>

                <div
                  onClick={() => logs[0] && setSelectedLog(logs[0])}
                  className="bg-pros-bone border border-neutral-200 hover:border-black p-3 space-y-1 cursor-pointer"
                >
                  <div className="text-[9px] font-bold uppercase text-neutral-500 flex justify-between">
                    <span>DERNIÈRE ACTIVITÉ</span>
                    <Clock size={10} />
                  </div>
                  <div className="text-xs font-bold font-mono text-black">{latestLogTime}</div>
                </div>
              </div>

              {/* SEARCH & FILTERS BAR */}
              <div className="p-3 bg-pros-bone border border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="relative flex-1 w-full font-sans">
                  <Search className="absolute left-3 top-2 text-neutral-400" size={14} />
                  <input
                    type="text"
                    placeholder="Rechercher une activité, utilisateur, produit, commande ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-300 text-xs font-bold text-black"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="bg-white border border-neutral-300 px-2 py-1.5 text-xs font-bold text-black uppercase"
                  >
                    <option value="ALL">TOUS UTILISATEURS</option>
                    {uniqueUsers.map(([email, name]) => (
                      <option key={email} value={email}>{name}</option>
                    ))}
                  </select>

                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-white border border-neutral-300 px-2 py-1.5 text-xs font-bold text-black uppercase"
                  >
                    <option value="ALL">TOUTES GRAVITÉS</option>
                    <option value="INFO">INFO</option>
                    <option value="IMPORTANT">IMPORTANT</option>
                    <option value="CRITIQUE">CRITIQUE</option>
                    <option value="SÉCURITÉ">SÉCURITÉ</option>
                  </select>
                </div>
              </div>

              {/* AUDIT LOGS TABLE */}
              <div className="overflow-x-auto border border-neutral-200">
                {paginatedLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500 font-sans space-y-2">
                    <Activity size={28} className="mx-auto text-neutral-300" />
                    <p className="font-bold uppercase text-black">
                      {quickFilter === 'critical' ? 'AUCUNE ACTION CRITIQUE' : 'AUCUNE ACTIVITÉ ENREGISTRÉE'}
                    </p>
                    <p className="text-[11px]">
                      {quickFilter === 'critical'
                        ? 'Votre plateforme ne présente aucune activité critique sur la période sélectionnée.'
                        : 'Les activités administratives apparaîtront ici lorsqu\'elles seront effectuées.'}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                        <th className="p-3">DATE / HEURE</th>
                        <th className="p-3">UTILISATEUR</th>
                        <th className="p-3">ACTION & CATÉGORIE</th>
                        <th className="p-3">OBJET / ENTITÉ</th>
                        <th className="p-3">DÉTAILS</th>
                        <th className="p-3">GRAVITÉ</th>
                        <th className="p-3">STATUT</th>
                        <th className="p-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {paginatedLogs.map((l) => {
                        const userNameDisplay = l.userName || (l.adminEmail.includes('sonko') ? 'OUSMANE SONKO' : 'AGENT STAFF PROS');
                        const initials = userNameDisplay
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase();

                        return (
                          <tr key={l.id} className="hover:bg-neutral-50">
                            <td className="p-3 font-mono text-neutral-500">
                              <span className="font-bold text-black block">{getRelativeTime(l.timestamp)}</span>
                              <span className="text-[10px]">{new Date(l.timestamp).toLocaleString('fr-FR')}</span>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-pros-black text-pros-gold font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <strong className="font-bold text-black uppercase block">{userNameDisplay}</strong>
                                  <span className="text-[10px] text-neutral-400 font-mono">{l.userRole || 'SUPER_ADMIN'}</span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <strong className="font-bold text-black uppercase block">{l.action}</strong>
                              <span className="text-[10px] text-neutral-400 font-mono">{l.actionCategory || 'Général'}</span>
                            </td>

                            <td className="p-3 font-mono text-xs font-bold text-neutral-800">
                              {l.entityName || l.targetType || 'PARAMÈTRES GLOBAUX'}
                            </td>

                            <td className="p-3 text-xs text-neutral-600 max-w-xs truncate">
                              {l.description || l.oldValue || 'Action effectuée.'}
                            </td>

                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 text-[9px] font-bold uppercase font-mono border ${
                                  l.severity === 'CRITIQUE'
                                    ? 'bg-red-100 text-red-900 border-red-300'
                                    : l.severity === 'SÉCURITÉ'
                                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                                    : l.severity === 'IMPORTANT'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                                }`}
                              >
                                {l.severity || 'INFO'}
                              </span>
                            </td>

                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 text-[9px] font-bold uppercase font-mono border ${
                                  l.status === 'SUCCÈS' || l.status === 'SUCCESS'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : l.status === 'BLOQUÉ' || l.status === 'DENIED'
                                    ? 'bg-pros-black text-pros-gold border-pros-gold'
                                    : 'bg-red-100 text-red-900 border-red-300'
                                }`}
                              >
                                {l.status === 'SUCCESS' ? '✓ SUCCÈS' : l.status === 'DENIED' ? '🔒 BLOQUÉ' : l.status}
                              </span>
                            </td>

                            <td className="p-3 text-right">
                              <button
                                onClick={() => setSelectedLog(l)}
                                className="px-2 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer ml-auto"
                              >
                                <Eye size={12} /> VOIR
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 14: FIDÉLITÉ */}
        {activeTab === 'fidelite' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="text-pros-gold" size={18} />
                <h4 className="font-display font-bold text-sm uppercase text-black">PROGRAMME PROS CLUB (SYNCHRONISÉ)</h4>
              </div>
              <button
                onClick={() => navigate('/admin/marketing/loyalty')}
                className="px-4 py-2 bg-pros-black hover:bg-neutral-800 text-pros-gold font-bold text-xs uppercase flex items-center gap-2 cursor-pointer"
              >
                <span>GÉRER LE PROGRAMME</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 15: STOCK */}
        {activeTab === 'stock' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              RÈGLES D'INVENTAIRE ET ALERTES STOCK
            </h4>
            <div className="space-y-1 text-xs">
              <label className="font-bold text-neutral-600 uppercase text-[10px]">Seuil d'Alerte Stock Faible (Unités)</label>
              <input
                type="number"
                value={formState.lowStockThreshold || 5}
                onChange={(e) => updateField('lowStockThreshold', Number(e.target.value))}
                className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono text-black font-bold"
              />
            </div>
          </div>
        )}

        {/* TAB 16: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              TRACKING ET MESURE D'AUDIENCE (ANALYTICS & STATISTICS)
            </h4>
            <div className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center text-xs">
              <span>Tracking des visiteurs web</span>
              <button
                type="button"
                onClick={() => updateField('visitorTrackingEnabled', !formState.visitorTrackingEnabled)}
                className={`px-3 py-1 font-bold text-xs uppercase font-mono border cursor-pointer ${
                  formState.visitorTrackingEnabled ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-neutral-200 text-neutral-600 border-neutral-300'
                }`}
              >
                {formState.visitorTrackingEnabled ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
              </button>
            </div>
          </div>
        )}

        {/* MODAL 1: UNSAVED CHANGES WARNING */}
        {isUnsavedWarningOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex items-center gap-2 text-amber-700 font-bold uppercase text-sm">
                <AlertTriangle size={18} />
                <span>MODIFICATIONS NON ENREGISTRÉES</span>
              </div>
              <p className="text-xs text-neutral-600">
                Vous avez des modifications non enregistrées. Voulez-vous continuer et abandonner vos changements ?
              </p>
              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  onClick={() => setIsUnsavedWarningOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  onClick={handleConfirmTabSwitch}
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  CONTINUER SANS ENREGISTRER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: HISTORY MODAL */}
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-3xl w-full p-6 space-y-6 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-display font-bold text-base uppercase text-black">HISTORIQUE DES MODIFICATIONS CONFIGURATION</h3>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-neutral-500 hover:text-black cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                      <th className="p-3">DATE / HEURE</th>
                      <th className="p-3">UTILISATEUR</th>
                      <th className="p-3">PARAMÈTRE</th>
                      <th className="p-3">ANCIENNE VALEUR</th>
                      <th className="p-3 text-right">NOUVELLE VALEUR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-sans">
                    {(formState.modificationHistory || []).map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50 font-sans">
                        <td className="p-3 font-mono text-neutral-500">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                        <td className="p-3 font-bold text-black uppercase">{log.user}</td>
                        <td className="p-3 font-mono font-bold text-neutral-700">{log.settingKey}</td>
                        <td className="p-3 font-mono text-neutral-500">{log.oldVal}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-800">{log.newVal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer"
                >
                  FERMER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: AUDIT LOG DETAIL INSPECTION MODAL */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-6 space-y-5 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-display font-bold text-base uppercase text-black">DÉTAILS DE L'ACTIVITÉ</h3>
                  <span className="text-[10px] text-neutral-400 font-mono">IDENTIFIANT : {selectedLog.id}</span>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-neutral-500 hover:text-black cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div className="p-4 bg-pros-bone border border-neutral-200 grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">HORODATAGE (AFRICA/DAKAR)</span>
                    <strong className="text-black">{new Date(selectedLog.timestamp).toLocaleString('fr-FR')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">UTILISATEUR</span>
                    <strong className="text-black uppercase">{selectedLog.userName || 'OUSMANE SONKO'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">RÔLE ADMINISTRATIF</span>
                    <strong className="text-black uppercase">{selectedLog.userRole || 'SUPER_ADMIN'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">CODE ACTION TECHNIQUE</span>
                    <strong className="text-amber-800 font-mono">{selectedLog.actionCode || 'SETTINGS_UPDATE'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">ACTION</span>
                    <strong className="text-black uppercase">{selectedLog.action}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">CATÉGORIE</span>
                    <strong className="text-black uppercase">{selectedLog.actionCategory || 'GÉNÉRAL'}</strong>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-neutral-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-neutral-500 uppercase text-[10px]">OBJET / ENTITÉ :</span>
                    <strong className="font-mono text-black">{selectedLog.entityName || selectedLog.targetType || 'PARAMÈTRES GLOBAUX'}</strong>
                  </div>
                  <div className="pt-2 border-t border-neutral-100">
                    <span className="font-bold text-neutral-400 uppercase text-[10px] block font-mono">DESCRIPTION UTILE :</span>
                    <p className="text-xs text-black font-sans font-bold mt-0.5">{selectedLog.description || selectedLog.action}</p>
                  </div>
                </div>

                {/* BEFORE / AFTER COMPARISON TABLE */}
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <strong className="font-bold uppercase text-xs text-black block">COMPARAISON AVANT / APRÈS</strong>
                  {selectedLog.diffItems && selectedLog.diffItems.length > 0 ? (
                    <table className="w-full text-left text-xs font-mono border border-neutral-300">
                      <thead>
                        <tr className="bg-pros-bone border-b border-neutral-300 text-neutral-500 font-bold uppercase text-[10px]">
                          <th className="p-2">PARAMÈTRE</th>
                          <th className="p-2 text-red-800">AVANT</th>
                          <th className="p-2 text-emerald-800">APRÈS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {selectedLog.diffItems.map((item: { parameter: string; before: string; after: string }, idx: number) => (
                          <tr key={idx}>
                            <td className="p-2 font-bold text-black">{item.parameter}</td>
                            <td className="p-2 text-red-700 bg-red-50 font-bold">{item.before}</td>
                            <td className="p-2 text-emerald-800 bg-emerald-50 font-bold">{item.after}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left text-xs font-mono border border-neutral-300">
                      <thead>
                        <tr className="bg-pros-bone border-b border-neutral-300 text-neutral-500 font-bold uppercase text-[10px]">
                          <th className="p-2">PARAMÈTRE</th>
                          <th className="p-2 text-red-800">AVANT</th>
                          <th className="p-2 text-emerald-800">APRÈS</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 font-bold text-black">{selectedLog.entityName || 'Valeur'}</td>
                          <td className="p-2 text-red-700 bg-red-50 font-bold">{selectedLog.oldValue || '—'}</td>
                          <td className="p-2 text-emerald-800 bg-emerald-50 font-bold">{selectedLog.newValue || '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="p-3 bg-pros-bone border border-neutral-200 grid grid-cols-3 gap-2 font-mono text-[10px]">
                  <div><strong className="text-neutral-500 block">ADRESSE IP :</strong> {selectedLog.ipAddress || '41.214.65.12'}</div>
                  <div><strong className="text-neutral-500 block">SESSION ID :</strong> {selectedLog.sessionId || 'SES-2026-000021'}</div>
                  <div className="truncate"><strong className="text-neutral-500 block">NAVIGATEUR :</strong> Chrome 149 (Windows)</div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer"
                >
                  FERMER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: ADD DELIVERY ZONE */}
        {isAddZoneModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-display font-bold text-sm uppercase text-black">AJOUTER UNE ZONE DE LIVRAISON</h3>
                <button onClick={() => setIsAddZoneModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Nom de la Zone / Région</label>
                  <input
                    type="text"
                    placeholder="Ex: KAOLACK & FATICK"
                    value={newZone.name}
                    onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-xs font-bold text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Frais de Livraison (FCFA)</label>
                  <input
                    type="number"
                    value={newZone.fee}
                    onChange={(e) => setNewZone({ ...newZone, fee: Number(e.target.value) })}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-xs font-mono font-bold text-black"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  onClick={() => setIsAddZoneModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  onClick={handleAddZone}
                  className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer"
                >
                  AJOUTER LA ZONE
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
