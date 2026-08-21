import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useLoyalty } from '../../store/loyaltyContext';
import type {
  LoyaltyLevelName,
  LoyaltyMember,
  LoyaltyReward,
  LoyaltyLevel,
  LoyaltyCampaign,
} from '../../types/loyalty';
import { useAuth } from '../../store/authContext';
import {
  Plus,
  Search,
  Settings,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Eye,
  AlertTriangle,
  Check,
} from 'lucide-react';

export const AdminLoyaltyContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: memberRouteId } = useParams<{ id?: string }>();

  const {
    config,
    levels,
    members,
    rewards,
    rules,
    campaigns,
    transactions,
    auditLogs,
    stats,
    toggleProgramStatus,
    updateConfig,
    adjustMemberPoints,
    addReward,
    deleteReward,
    redeemRewardForMember,
    addLevel,
    deleteLevel,
    toggleRule,
    addCampaign,
  } = useLoyalty();

  const { currentUser } = useAuth();

  // Active Tab State (Sync with Route URL)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'members' | 'transactions' | 'levels' | 'rewards' | 'rules' | 'campaigns' | 'settings' | 'audit'
  >('overview');

  // Timeframe selector for chart on Overview
  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '30d' | '90d' | '12m'>('30d');

  // Members View Filters
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberLevelFilter, setMemberLevelFilter] = useState<string>('ALL');
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>('ALL');
  const [memberSortBy, setMemberSortBy] = useState<'points' | 'newest' | 'spent'>('points');

  // Modals State
  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null);
  const [isAdjustPointsModalOpen, setIsAdjustPointsModalOpen] = useState(false);
  const [adjustTargetMember, setAdjustTargetMember] = useState<LoyaltyMember | null>(null);
  const [adjustPointsValue, setAdjustPointsValue] = useState<number>(100);
  const [adjustType, setAdjustType] = useState<'GAIN' | 'UTILISATION' | 'AJUSTEMENT' | 'BONUS'>('AJUSTEMENT');
  const [adjustReason, setAdjustReason] = useState('');

  // Reward Modal State
  const [isAddRewardModalOpen, setIsAddRewardModalOpen] = useState(false);
  const [rewardForm, setRewardForm] = useState<Partial<LoyaltyReward>>({
    name: '',
    description: '',
    type: 'COUPON',
    pointsCost: 500,
    monetaryValue: 500,
    allowedLevels: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    status: 'ACTIVE',
  });

  // Level Modal State
  const [isAddLevelModalOpen, setIsAddLevelModalOpen] = useState(false);
  const [levelForm, setLevelForm] = useState<Partial<LoyaltyLevel>>({
    name: 'SILVER',
    minPoints: 1000,
    maxPoints: 4999,
    perks: ['Bonus points x1.25'],
    badgeColor: 'bg-slate-400 text-slate-900',
    status: 'ACTIVE',
  });

  // Campaign Modal State
  const [isAddCampaignModalOpen, setIsAddCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState<Partial<LoyaltyCampaign>>({
    name: '',
    description: '',
    multiplier: 2.0,
    bonusPoints: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ACTIVE',
    targetLevels: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
  });

  // Status Confirm Modal State
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, msg });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync activeTab & selectedMember with URL Path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/loyalty/members')) {
      setActiveTab('members');
      if (memberRouteId) {
        const found = members.find((m) => m.id === memberRouteId || m.customerId === memberRouteId);
        if (found) setSelectedMember(found);
      }
    } else if (path.includes('/loyalty/transactions')) setActiveTab('transactions');
    else if (path.includes('/loyalty/levels')) setActiveTab('levels');
    else if (path.includes('/loyalty/rewards')) setActiveTab('rewards');
    else if (path.includes('/loyalty/rules')) setActiveTab('rules');
    else if (path.includes('/loyalty/campaigns')) setActiveTab('campaigns');
    else if (path.includes('/loyalty/settings')) setActiveTab('settings');
    else if (path.includes('/loyalty/audit')) setActiveTab('audit');
    else setActiveTab('overview');
  }, [location.pathname, memberRouteId, members]);

  // Tab Navigation Handler with URL syncing
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'overview') navigate('/admin/marketing/loyalty');
    else navigate(`/admin/marketing/loyalty/${tab}`);
  };

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        if (memberSearchQuery.trim()) {
          const q = memberSearchQuery.toLowerCase().trim();
          const name = `${m.firstName} ${m.lastName}`.toLowerCase();
          if (!name.includes(q) && !m.email.toLowerCase().includes(q) && !m.phone.includes(q) && !m.id.toLowerCase().includes(q)) {
            return false;
          }
        }
        if (memberLevelFilter !== 'ALL' && m.levelName !== memberLevelFilter) return false;
        if (memberStatusFilter !== 'ALL' && m.status !== memberStatusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (memberSortBy === 'points') return b.availablePoints - a.availablePoints;
        if (memberSortBy === 'spent') return b.totalSpentPoints - a.totalSpentPoints;
        if (memberSortBy === 'newest') return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
        return 0;
      });
  }, [members, memberSearchQuery, memberLevelFilter, memberStatusFilter, memberSortBy]);

  // Top Members (Dashboard Overview)
  const topMembers = useMemo(() => {
    return [...members].sort((a, b) => b.availablePoints - a.availablePoints).slice(0, 5);
  }, [members]);

  // Handle Manual Point Adjustment
  const handleConfirmAdjustPoints = () => {
    if (!adjustTargetMember) return;
    if (!adjustPointsValue || adjustPointsValue <= 0) {
      showToast('Veuillez saisir un nombre de points valide.', 'error');
      return;
    }

    const delta = adjustType === 'UTILISATION' ? -Math.abs(adjustPointsValue) : Math.abs(adjustPointsValue);
    const res = adjustMemberPoints(
      adjustTargetMember.id,
      delta,
      adjustType,
      'ADMIN_ADJUSTMENT',
      adjustReason || 'Ajustement manuel admin',
      currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS'
    );

    if (res.success) {
      showToast(`Points de ${adjustTargetMember.firstName} ${adjustTargetMember.lastName} mis à jour.`);
      setIsAdjustPointsModalOpen(false);
      setAdjustTargetMember(null);
      setAdjustReason('');
    } else {
      showToast(res.error || 'Erreur lors de l’ajustement.', 'error');
    }
  };

  // Handle Save Reward
  const handleSaveReward = () => {
    if (!rewardForm.name || !rewardForm.name.trim()) {
      showToast('Veuillez saisir un nom pour la récompense.', 'error');
      return;
    }

    addReward(
      {
        name: rewardForm.name,
        description: rewardForm.description || '',
        type: rewardForm.type || 'COUPON',
        pointsCost: rewardForm.pointsCost || 500,
        monetaryValue: rewardForm.monetaryValue || 500,
        stock: rewardForm.stock ?? null,
        userLimit: rewardForm.userLimit ?? null,
        allowedLevels: rewardForm.allowedLevels || ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
        status: rewardForm.status || 'ACTIVE',
      },
      currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS'
    );

    showToast(`Récompense "${rewardForm.name}" ajoutée.`);
    setIsAddRewardModalOpen(false);
    setRewardForm({
      name: '',
      description: '',
      type: 'COUPON',
      pointsCost: 500,
      monetaryValue: 500,
      allowedLevels: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      status: 'ACTIVE',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="MARKETING & FIDÉLISATION"
          title="PROGRAMME DE FIDÉLITÉ PROS"
          description="Gérez les points, les niveaux, les récompenses et les avantages accordés aux clients fidèles de la plateforme PROS."
          primaryAction={
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleTabChange('settings')}
                className="px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                <Settings size={16} />
                <span>PARAMÈTRES</span>
              </button>

              <button
                onClick={() => setIsAddRewardModalOpen(true)}
                className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                <Plus size={16} />
                <span>AJOUTER UNE RÉCOMPENSE</span>
              </button>
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

        {/* 6 Real Statistics Cards (Dynamically calculated from stats) */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 font-sans">
          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-sans">MEMBRES DU PROGRAMME</div>
            <div className="text-xl font-bold font-mono text-black">{stats.totalMembers.toLocaleString('fr-FR')}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Clients inscrits</div>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-sans">POINTS DISTRIBUÉS</div>
            <div className="text-xl font-bold font-mono text-black">{stats.totalPointsDistributed.toLocaleString('fr-FR')}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Total cumulé</div>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 font-sans">POINTS UTILISÉS</div>
            <div className="text-xl font-bold font-mono text-black">{stats.totalPointsSpent.toLocaleString('fr-FR')}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Points échangés</div>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 font-sans">RÉCOMPENSES UTILISÉES</div>
            <div className="text-xl font-bold font-mono text-black">{stats.totalRewardsRedeemed}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Ce mois-ci</div>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-pros-gold font-sans">CLIENTS PREMIUM</div>
            <div className="text-xl font-bold font-mono text-black">{stats.premiumMembersCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Gold & Platinum</div>
          </div>

          <div className="bg-white border border-neutral-200 p-3.5 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 font-sans">TAUX D'ACTIVITÉ</div>
            <div className="text-xl font-bold font-mono text-black">{stats.activityRatePercent}%</div>
            <div className="text-[10px] text-neutral-400 font-sans">Clients actifs</div>
          </div>
        </div>

        {/* Program Status Card */}
        <div className="bg-white border border-neutral-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm font-sans">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-display font-bold text-base uppercase text-black">PROGRAMME PROS CLUB</h3>
              <span
                className={`px-3 py-0.5 text-[10px] font-bold uppercase font-mono border ${
                  config.isActive
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {config.isActive ? 'ACTIF' : 'INACTIF'}
              </span>
            </div>
            <p className="text-xs text-neutral-600 font-sans max-w-2xl">
              Le programme de fidélité est actuellement {config.isActive ? 'actif' : 'suspendu'}. Les clients gagnent automatiquement des points
              selon les règles configurées lors de leurs achats sur la plateforme PROS.
            </p>
          </div>

          <div className="flex items-center gap-6 font-sans">
            <div className="text-right text-xs font-sans hidden sm:block">
              <span className="text-[10px] text-neutral-400 uppercase font-bold block">Membres actifs</span>
              <strong className="font-mono text-black text-sm">{stats.totalMembers.toLocaleString('fr-FR')}</strong>
            </div>

            <button
              onClick={() => setIsStatusConfirmOpen(true)}
              className={`px-5 py-2.5 font-bold text-xs uppercase cursor-pointer shadow-sm font-sans ${
                config.isActive
                  ? 'bg-white border border-red-300 text-red-700 hover:bg-red-50'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {config.isActive ? 'DÉSACTIVER LE PROGRAMME' : 'ACTIVER LE PROGRAMME'}
            </button>
          </div>
        </div>

        {/* Internal Navigation Tabs (9 Tabs) */}
        <div className="flex border-b border-neutral-200 gap-4 text-xs font-bold uppercase font-sans overflow-x-auto">
          {[
            { id: 'overview', label: "VUE D'ENSEMBLE" },
            { id: 'members', label: 'MEMBRES' },
            { id: 'transactions', label: 'POINTS & TRANSACTIONS' },
            { id: 'levels', label: 'NIVEAUX' },
            { id: 'rewards', label: 'RÉCOMPENSES' },
            { id: 'rules', label: 'RÈGLES' },
            { id: 'campaigns', label: 'CAMPAGNES' },
            { id: 'settings', label: 'PARAMÈTRES' },
            { id: 'audit', label: "JOURNAL D'AUDIT" },
          ].map((tab) => {
            const isCurrent = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`pb-2.5 border-b-2 font-sans cursor-pointer whitespace-nowrap transition-all ${
                  isCurrent ? 'border-black text-black font-bold' : 'border-transparent text-neutral-500 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
          <div className="space-y-6 font-sans">
            
            {/* Chart Container Mockup */}
            <div className="bg-white p-6 border border-neutral-200 space-y-4 shadow-sm font-sans">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <div>
                  <h4 className="font-display font-bold text-sm uppercase text-black">ACTIVITÉ DU PROGRAMME</h4>
                  <p className="text-xs text-neutral-500">Évolution des points distribués et consommés par les membres.</p>
                </div>

                <div className="flex border border-neutral-300 text-[10px] font-bold font-mono">
                  {(['7d', '30d', '90d', '12m'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setChartTimeframe(t)}
                      className={`px-3 py-1 cursor-pointer ${chartTimeframe === t ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'}`}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimalist Professional Chart Layout */}
              <div className="h-48 bg-pros-bone border border-neutral-200 p-4 flex flex-col justify-between font-sans">
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                  <span>Points cumulés (Peak: +14,500 pts)</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-600 inline-block"></span> Points Gagnés</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-600 inline-block"></span> Points Échangés</span>
                  </div>
                </div>

                {/* Simulated Chart Bars */}
                <div className="flex items-end justify-between h-32 gap-2 pt-4">
                  {[45, 60, 35, 80, 95, 70, 110, 85, 120, 100, 130, 90].map((h, i) => (
                    <div key={i} className="flex-1 flex items-end gap-0.5 h-full">
                      <div style={{ height: `${h}%` }} className="w-full bg-emerald-700/80 hover:bg-emerald-600 transition-all"></div>
                      <div style={{ height: `${h * 0.4}%` }} className="w-full bg-blue-600/80 hover:bg-blue-500 transition-all"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Members List */}
            <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <h4 className="font-display font-bold text-sm uppercase text-black">MEILLEURS MEMBRES (TOP FIDÉLITÉ)</h4>
                <button onClick={() => handleTabChange('members')} className="text-xs text-pros-gold font-bold uppercase hover:underline cursor-pointer">
                  VOIR TOUS LES MEMBRES &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                      <th className="p-3 w-12">RANG</th>
                      <th className="p-3">CLIENT</th>
                      <th className="p-3">NIVEAU</th>
                      <th className="p-3 text-right">POINTS DISPONIBLES</th>
                      <th className="p-3 text-right">RÉCOMPENSES</th>
                      <th className="p-3">DERNIÈRE ACTIVITÉ</th>
                      <th className="p-3">STATUT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {topMembers.map((m, idx) => (
                      <tr
                        key={m.id}
                        onClick={() => navigate(`/admin/marketing/loyalty/members/${m.id}`)}
                        className="hover:bg-neutral-50 font-sans cursor-pointer"
                      >
                        <td className="p-3 font-mono font-bold text-neutral-400">0{idx + 1}</td>
                        <td className="p-3">
                          <strong className="font-bold text-black uppercase block">{m.firstName} {m.lastName}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">{m.email}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase font-mono ${m.levelName === 'GOLD' ? 'bg-amber-400 text-amber-950' : m.levelName === 'PLATINUM' ? 'bg-black text-pros-gold' : 'bg-slate-200 text-black'}`}>
                            {m.levelName}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                          {m.availablePoints.toLocaleString('fr-FR')} pts
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-black">{m.rewardsRedeemedCount}</td>
                        <td className="p-3 font-mono text-neutral-500">{m.lastActivityDate}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MEMBRES DU PROGRAMME */}
        {activeTab === 'members' && (
          <div className="space-y-4 font-sans">
            
            {/* Search & Filters */}
            <div className="bg-white p-4 border border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm font-sans">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
                <input
                  type="text"
                  placeholder="Rechercher un membre par nom, email, téléphone..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full bg-pros-bone border border-neutral-300 pl-9 pr-4 py-2 text-xs text-black focus:outline-none focus:border-black font-sans"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
                <select
                  value={memberLevelFilter}
                  onChange={(e) => setMemberLevelFilter(e.target.value)}
                  className="bg-pros-bone border border-neutral-300 px-3 py-1.5 text-xs text-black font-sans focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TOUS LES NIVEAUX</option>
                  <option value="BRONZE">BRONZE</option>
                  <option value="SILVER">SILVER</option>
                  <option value="GOLD">GOLD</option>
                  <option value="PLATINUM">PLATINUM</option>
                </select>

                <select
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value)}
                  className="bg-pros-bone border border-neutral-300 px-3 py-1.5 text-xs text-black font-sans focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TOUS LES STATUTS</option>
                  <option value="ACTIVE">ACTIF</option>
                  <option value="INACTIVE">INACTIF</option>
                  <option value="SUSPENDED">SUSPENDU</option>
                </select>

                <select
                  value={memberSortBy}
                  onChange={(e) => setMemberSortBy(e.target.value as any)}
                  className="bg-pros-bone border border-neutral-300 px-3 py-1.5 text-xs text-black font-bold focus:outline-none cursor-pointer"
                >
                  <option value="points">PLUS DE POINTS</option>
                  <option value="spent">PLUS DE POINTS DÉPENSÉS</option>
                  <option value="newest">PLUS RÉCENTS</option>
                </select>
              </div>
            </div>

            {/* Members Data Table */}
            <div className="bg-white border border-neutral-200 overflow-x-auto shadow-sm font-sans">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <th className="p-3">CLIENT MEMBRE</th>
                    <th className="p-3">NIVEAU</th>
                    <th className="p-3 text-right">POINTS DISPONIBLES</th>
                    <th className="p-3 text-right">CUMUL GAGNÉ</th>
                    <th className="p-3 text-right">POINTS UTILISÉS</th>
                    <th className="p-3 text-right">RÉCOMPENSES</th>
                    <th className="p-3">DERNIÈRE ACTIVITÉ</th>
                    <th className="p-3">STATUT</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-neutral-50 font-sans">
                      <td className="p-3">
                        <strong className="font-bold text-black uppercase block">{m.firstName} {m.lastName}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">{m.email}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase font-mono ${m.levelName === 'GOLD' ? 'bg-amber-400 text-amber-950' : m.levelName === 'PLATINUM' ? 'bg-black text-pros-gold' : 'bg-slate-200 text-black'}`}>
                          {m.levelName}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                        {m.availablePoints.toLocaleString('fr-FR')} pts
                      </td>
                      <td className="p-3 text-right font-mono text-neutral-700">{m.totalEarnedPoints.toLocaleString('fr-FR')}</td>
                      <td className="p-3 text-right font-mono text-neutral-500">{m.totalSpentPoints.toLocaleString('fr-FR')}</td>
                      <td className="p-3 text-right font-mono text-black font-bold">{m.rewardsRedeemedCount}</td>
                      <td className="p-3 font-mono text-neutral-500">{m.lastActivityDate}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/marketing/loyalty/members/${m.id}`)}
                            className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
                            title="Voir la fiche 360°"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setAdjustTargetMember(m);
                              setIsAdjustPointsModalOpen(true);
                            }}
                            className="px-2 py-1 bg-pros-black hover:bg-neutral-800 text-white font-bold text-[10px] uppercase shadow-sm cursor-pointer"
                          >
                            AJUSTER
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 3: POINTS & TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 font-sans">
            <div className="bg-white p-4 border border-neutral-200 flex justify-between items-center shadow-sm font-sans">
              <h4 className="font-display font-bold text-sm uppercase text-black">HISTORIQUE DES TRANSACTIONS DE POINTS</h4>
              <button
                onClick={() => {
                  if (members.length > 0) {
                    setAdjustTargetMember(members[0]);
                    setIsAdjustPointsModalOpen(true);
                  }
                }}
                className="px-4 py-2 bg-pros-black text-white font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>AJUSTER LES POINTS</span>
              </button>
            </div>

            <div className="bg-white border border-neutral-200 overflow-x-auto shadow-sm font-sans">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <th className="p-3">DATE / HEURE</th>
                    <th className="p-3">MEMBRE</th>
                    <th className="p-3">TYPE</th>
                    <th className="p-3">SOURCE</th>
                    <th className="p-3 text-right">POINTS</th>
                    <th className="p-3 text-right">SOLDE APRÈS</th>
                    <th className="p-3">REMARQUES / OPÉRATEUR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-mono text-xs">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-neutral-50 font-sans">
                      <td className="p-3 text-neutral-500">{new Date(txn.timestamp).toLocaleString('fr-FR')}</td>
                      <td className="p-3 font-bold text-black">{txn.memberName}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                            txn.type === 'GAIN' || txn.type === 'BONUS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : txn.type === 'UTILISATION'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-600">{txn.source}</td>
                      <td className={`p-3 text-right font-bold text-sm ${txn.points > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {txn.points > 0 ? `+${txn.points}` : txn.points} pts
                      </td>
                      <td className="p-3 text-right font-bold text-black">{txn.balanceAfter.toLocaleString('fr-FR')}</td>
                      <td className="p-3 text-neutral-500 font-sans text-[11px]">{txn.notes} {txn.adminName && `(${txn.adminName})`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: NIVEAUX DE FIDÉLITÉ */}
        {activeTab === 'levels' && (
          <div className="space-y-6 font-sans">
            <div className="flex justify-between items-center bg-white p-4 border border-neutral-200">
              <div>
                <h4 className="font-display font-bold text-sm uppercase text-black">NIVEAUX DU PROS CLUB</h4>
                <p className="text-xs text-neutral-500">Configurez les seuils de qualification et les avantages accordés.</p>
              </div>
              <button
                onClick={() => setIsAddLevelModalOpen(true)}
                className="px-4 py-2 bg-pros-black text-white font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>NOUVEAU NIVEAU</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans">
              {levels.map((lvl) => (
                <div key={lvl.id} className="bg-white border border-neutral-200 p-5 space-y-4 shadow-sm flex flex-col justify-between font-sans">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`px-2.5 py-1 text-xs uppercase font-mono ${lvl.badgeColor}`}>{lvl.name}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{lvl.membersCount} membres</span>
                    </div>

                    <div className="text-xl font-bold font-mono text-black">
                      {lvl.minPoints.toLocaleString('fr-FR')} {lvl.maxPoints ? `à ${lvl.maxPoints.toLocaleString('fr-FR')}` : '+'} pts
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-neutral-100 text-xs text-neutral-700">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">AVANTAGES :</span>
                      {lvl.perks.map((p, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <Check size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2 text-xs font-sans">
                    <button
                      onClick={() => deleteLevel(lvl.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS')}
                      className="p-1.5 text-red-600 hover:bg-red-50 border border-neutral-200 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CATALOGUE DES RÉCOMPENSES */}
        {activeTab === 'rewards' && (
          <div className="space-y-6 font-sans">
            <div className="flex justify-between items-center bg-white p-4 border border-neutral-200">
              <div>
                <h4 className="font-display font-bold text-sm uppercase text-black">CATALOGUE DES RÉCOMPENSES</h4>
                <p className="text-xs text-neutral-500">Bons d’achat, réductions et privilèges à débloquer avec des points.</p>
              </div>
              <button
                onClick={() => setIsAddRewardModalOpen(true)}
                className="px-4 py-2 bg-pros-black text-white font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>AJOUTER UNE RÉCOMPENSE</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans">
              {rewards.map((r) => (
                <div key={r.id} className="bg-white border border-neutral-200 p-5 space-y-3 shadow-sm font-sans flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 text-[9px] font-bold font-mono bg-pros-black text-pros-gold uppercase">{r.type}</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">{r.pointsCost} pts</span>
                    </div>

                    <strong className="font-display font-bold text-sm uppercase text-black block">{r.name}</strong>
                    <p className="text-xs text-neutral-600">{r.description}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-xs font-sans">
                    <span className="text-[10px] text-neutral-400 font-mono">{r.totalRedeemedCount} utilisations</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (members.length > 0) {
                            const res = redeemRewardForMember(members[0].id, r.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
                            if (res.success) {
                              showToast(`Récompense "${r.name}" échangée ! Code Coupon: ${res.couponCode}`);
                            } else {
                              showToast(res.error || 'Erreur lors de l’échange', 'error');
                            }
                          }
                        }}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] uppercase shadow-sm cursor-pointer"
                      >
                        ÉCHANGER
                      </button>
                      <button
                        onClick={() => deleteReward(r.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS')}
                        className="p-1 text-red-600 hover:bg-red-50 border border-neutral-200 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: RÈGLES D'ATTRIBUTION */}
        {activeTab === 'rules' && (
          <div className="space-y-4 font-sans">
            <div className="bg-white p-4 border border-neutral-200 font-sans">
              <h4 className="font-display font-bold text-sm uppercase text-black">RÈGLES D'ATTRIBUTION DES POINTS</h4>
            </div>

            <div className="bg-white border border-neutral-200 overflow-x-auto shadow-sm font-sans">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <th className="p-3">RÈGLE</th>
                    <th className="p-3">DESCRIPTION</th>
                    <th className="p-3 text-right">POINTS ATTRIBUÉS</th>
                    <th className="p-3">STATUT</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-neutral-50 font-sans">
                      <td className="p-3">
                        <strong className="font-bold text-black uppercase block">{rule.name}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">CODE: {rule.code}</span>
                      </td>
                      <td className="p-3 text-neutral-600">{rule.description}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">+{rule.pointsAwarded} pts</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${rule.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
                          {rule.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleRule(rule.id, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS')}
                          className="px-3 py-1 bg-pros-black hover:bg-neutral-800 text-white font-bold text-[10px] uppercase cursor-pointer"
                        >
                          {rule.status === 'ACTIVE' ? 'DÉSACTIVER' : 'ACTIVER'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: CAMPAGNES */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4 font-sans">
            <div className="bg-white p-4 border border-neutral-200 flex justify-between items-center shadow-sm font-sans">
              <h4 className="font-display font-bold text-sm uppercase text-black">CAMPAGNES DE FIDÉLITÉ</h4>
              <button
                onClick={() => setIsAddCampaignModalOpen(true)}
                className="px-4 py-2 bg-pros-black text-white font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>NOUVELLE CAMPAGNE</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
              {campaigns.map((camp) => (
                <div key={camp.id} className="bg-white border border-neutral-200 p-5 space-y-3 shadow-sm font-sans">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                      {camp.status}
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">{camp.multiplier}x POINTS</span>
                  </div>

                  <strong className="font-display font-bold text-base uppercase text-black block">{camp.name}</strong>
                  <p className="text-xs text-neutral-600">{camp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: PARAMÈTRES DU PROGRAMME */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 border border-neutral-200 space-y-6 shadow-sm font-sans max-w-3xl">
            <h4 className="font-display font-bold text-base uppercase text-black border-b pb-3">PARAMÈTRES DU PROGRAMME PROS CLUB</h4>

            <div className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase text-black block text-xs">NOM DU PROGRAMME DE FIDÉLITÉ</label>
                <input
                  type="text"
                  value={config.programName}
                  onChange={(e) => updateConfig({ programName: e.target.value }, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS')}
                  className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block text-xs">MONTANT POUR 1 POINT (FCFA)</label>
                  <input
                    type="number"
                    value={config.spendAmountPerPoint}
                    onChange={(e) => updateConfig({ spendAmountPerPoint: parseInt(e.target.value, 10) || 100 }, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS')}
                    className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block text-xs">EXPIRATION DES POINTS (MOIS)</label>
                  <input
                    type="number"
                    value={config.expirationMonths}
                    onChange={(e) => updateConfig({ expirationMonths: parseInt(e.target.value, 10) || 12 }, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS')}
                    className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-xs text-black font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: JOURNAL D'AUDIT SÉCURITÉ */}
        {activeTab === 'audit' && (
          <div className="space-y-4 font-sans">
            <div className="bg-white p-4 border border-neutral-200 font-sans">
              <h4 className="font-display font-bold text-sm uppercase text-black">JOURNAL D'AUDIT SÉCURITÉ FIDÉLITÉ</h4>
            </div>

            <div className="bg-white border border-neutral-200 overflow-x-auto shadow-sm font-sans">
              <table className="w-full text-left border-collapse text-xs font-sans font-mono">
                <thead>
                  <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <th className="p-3">DATE / HEURE</th>
                    <th className="p-3">ADMINISTRATEUR</th>
                    <th className="p-3">ACTION</th>
                    <th className="p-3">CIBLE</th>
                    <th className="p-3">VALEUR AVANT</th>
                    <th className="p-3">VALEUR APRÈS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50 font-sans">
                      <td className="p-3 text-neutral-500">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                      <td className="p-3 font-bold text-black">{log.adminName}</td>
                      <td className="p-3 font-bold text-emerald-800">{log.action}</td>
                      <td className="p-3 text-neutral-700">{log.targetMemberName || '—'}</td>
                      <td className="p-3 text-neutral-500">{log.valueBefore}</td>
                      <td className="p-3 text-black font-bold">{log.valueAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: MANUAL POINT ADJUSTMENT */}
        {isAdjustPointsModalOpen && adjustTargetMember && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-display font-bold text-base uppercase text-black">AJUSTER LES POINTS CLIENT</h3>
                <button onClick={() => setIsAdjustPointsModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className="p-3 bg-pros-bone border border-neutral-200 font-sans">
                  <div><strong>Client :</strong> {adjustTargetMember.firstName} {adjustTargetMember.lastName}</div>
                  <div><strong>Solde Actuel :</strong> <span className="font-mono text-emerald-700 font-bold">{adjustTargetMember.availablePoints} pts</span></div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block">TYPE D'AJUSTEMENT</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black font-bold focus:outline-none"
                  >
                    <option value="AJUSTEMENT">AJOUTER DES POINTS (+)</option>
                    <option value="UTILISATION">RETIRER DES POINTS (-)</option>
                    <option value="BONUS">BONUS EXCEPTIONNEL (+)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block">NOMBRE DE POINTS</label>
                  <input
                    type="number"
                    value={adjustPointsValue}
                    onChange={(e) => setAdjustPointsValue(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black font-mono focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block">MOTIF / REMARQUES (REQUIS)</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Ex: Geste commercial suite commande #CMD-145"
                    className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setIsAdjustPointsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-100"
                >
                  ANNULER
                </button>
                <button
                  onClick={handleConfirmAdjustPoints}
                  className="px-5 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase shadow-sm"
                >
                  CONFIRMER L'AJUSTEMENT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD REWARD */}
        {isAddRewardModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-lg w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-display font-bold text-base uppercase text-black">NOUVELLE RÉCOMPENSE FIDÉLITÉ</h3>
                <button onClick={() => setIsAddRewardModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block">NOM DE LA RÉCOMPENSE *</label>
                  <input
                    type="text"
                    value={rewardForm.name || ''}
                    onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                    placeholder="Ex: Bon de réduction 1 000 FCFA"
                    className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    value={rewardForm.description || ''}
                    onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                    className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-black block">COÛT EN POINTS *</label>
                    <input
                      type="number"
                      value={rewardForm.pointsCost || 500}
                      onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: parseInt(e.target.value, 10) || 500 })}
                      className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase text-black block">VALEUR (FCFA) *</label>
                    <input
                      type="number"
                      value={rewardForm.monetaryValue || 500}
                      onChange={(e) => setRewardForm({ ...rewardForm, monetaryValue: parseInt(e.target.value, 10) || 500 })}
                      className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setIsAddRewardModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-100"
                >
                  ANNULER
                </button>
                <button
                  onClick={handleSaveReward}
                  className="px-5 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase shadow-sm"
                >
                  ENREGISTRER LA RÉCOMPENSE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: STATUS TOGGLE CONFIRMATION */}
        {isStatusConfirmOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle size={28} />
                <h3 className="font-display font-bold text-base uppercase text-black">CONFIRMER LE CHANGEMENT DE STATUT</h3>
              </div>

              <p className="text-xs text-neutral-600 font-sans">
                Êtes-vous sûr de vouloir {config.isActive ? 'désactiver' : 'activer'} le programme PROS Club ?
                {config.isActive && ' Les clients ne cumuleront plus de points automatiquement.'}
              </p>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setIsStatusConfirmOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-100"
                >
                  ANNULER
                </button>
                <button
                  onClick={() => {
                    toggleProgramStatus(!config.isActive, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
                    setIsStatusConfirmOpen(false);
                    showToast(`Programme de fidélité ${!config.isActive ? 'activé' : 'désactivé'}.`);
                  }}
                  className="px-5 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase shadow-sm"
                >
                  CONFIRMER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: 360° MEMBER FICHE */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-6 space-y-6 text-black font-sans shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] text-neutral-400 font-mono">ID MEMBRE : {selectedMember.id}</span>
                  <h3 className="font-display font-bold text-lg uppercase text-black">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </h3>
                </div>
                <button onClick={() => setSelectedMember(null)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 p-4 bg-pros-bone border border-neutral-200 text-center font-sans text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Niveau</span>
                  <strong className="text-black font-mono font-bold">{selectedMember.levelName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Points Dispo</span>
                  <strong className="text-emerald-700 font-mono font-bold text-sm">{selectedMember.availablePoints}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Cumul Gagné</span>
                  <strong className="text-black font-mono">{selectedMember.totalEarnedPoints}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Points Dépensés</span>
                  <strong className="text-black font-mono">{selectedMember.totalSpentPoints}</strong>
                </div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto min-h-0 font-sans">
                <h4 className="font-display font-bold text-xs uppercase text-black border-b pb-1">HISTORIQUE DES TRANSACTIONS MEMBRE</h4>
                <div className="space-y-2">
                  {transactions
                    .filter((t) => t.memberId === selectedMember.id)
                    .map((t) => (
                      <div key={t.id} className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center text-xs font-sans">
                        <div>
                          <strong className="font-bold text-black block">{t.type} — {t.notes}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">{new Date(t.timestamp).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <span className={`font-mono font-bold ${t.points > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {t.points > 0 ? `+${t.points}` : t.points} pts
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end">
                <button onClick={() => setSelectedMember(null)} className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase">
                  FERMER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD LEVEL */}
        {isAddLevelModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-display font-bold text-base uppercase text-black">NOUVELLE NIVEAU DE FIDÉLITÉ</h3>
                <button onClick={() => setIsAddLevelModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block">NOM DU NIVEAU</label>
                  <input
                    type="text"
                    value={levelForm.name || ''}
                    onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value as any })}
                    placeholder="Ex: VIP SILVER"
                    className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-black block">SEUIL MIN (PTS)</label>
                    <input
                      type="number"
                      value={levelForm.minPoints || 0}
                      onChange={(e) => setLevelForm({ ...levelForm, minPoints: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-black block">SEUIL MAX (PTS)</label>
                    <input
                      type="number"
                      value={levelForm.maxPoints ?? ''}
                      onChange={(e) => setLevelForm({ ...levelForm, maxPoints: e.target.value ? parseInt(e.target.value, 10) : null })}
                      placeholder="Vide si infini"
                      className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setIsAddLevelModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-100"
                >
                  ANNULER
                </button>
                <button
                  onClick={() => {
                    addLevel(
                      {
                        name: (levelForm.name || 'SILVER') as LoyaltyLevelName,
                        minPoints: levelForm.minPoints || 0,
                        maxPoints: levelForm.maxPoints ?? null,
                        perks: levelForm.perks || ['Bonus points x1.25'],
                        badgeColor: levelForm.badgeColor || 'bg-slate-400 text-slate-900',
                        status: 'ACTIVE',
                      },
                      currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS'
                    );
                    showToast('Nouveau niveau ajouté avec succès.');
                    setIsAddLevelModalOpen(false);
                  }}
                  className="px-5 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase shadow-sm"
                >
                  ENREGISTRER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD CAMPAIGN */}
        {isAddCampaignModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-display font-bold text-base uppercase text-black">NOUVELLE CAMPAGNE FIDÉLITÉ</h3>
                <button onClick={() => setIsAddCampaignModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block">NOM DE LA CAMPAGNE *</label>
                  <input
                    type="text"
                    value={campaignForm.name || ''}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="Ex: Double Points Week-End"
                    className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    value={campaignForm.description || ''}
                    onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                    className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-black block">MULTIPLICATEUR (EX: 2X)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={campaignForm.multiplier || 2.0}
                      onChange={(e) => setCampaignForm({ ...campaignForm, multiplier: parseFloat(e.target.value) || 1.0 })}
                      className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black font-mono focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-black block">BONUS FIXE (PTS)</label>
                    <input
                      type="number"
                      value={campaignForm.bonusPoints || 0}
                      onChange={(e) => setCampaignForm({ ...campaignForm, bonusPoints: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setIsAddCampaignModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-100"
                >
                  ANNULER
                </button>
                <button
                  onClick={() => {
                    addCampaign(
                      {
                        name: campaignForm.name || 'Nouvelle Campagne',
                        description: campaignForm.description || '',
                        multiplier: campaignForm.multiplier || 2.0,
                        bonusPoints: campaignForm.bonusPoints || 0,
                        startDate: campaignForm.startDate || new Date().toISOString().split('T')[0],
                        endDate: campaignForm.endDate || new Date().toISOString().split('T')[0],
                        status: 'ACTIVE',
                        targetLevels: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
                      },
                      currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS'
                    );
                    showToast('Campagne créée avec succès.');
                    setIsAddCampaignModalOpen(false);
                  }}
                  className="px-5 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase shadow-sm"
                >
                  CRÉER LA CAMPAGNE
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
};

export const AdminLoyaltyPage: React.FC = () => (
  <AdminLayout>
    <AdminLoyaltyContent />
  </AdminLayout>
);
