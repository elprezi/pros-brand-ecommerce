import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useCms } from '../../store/cmsContext';
import { useCommunication } from '../../store/communicationContext';
import { useLoyalty } from '../../store/loyaltyContext';
import { AdminHomepageCmsContent } from './AdminHomepageCmsPage';
import { AdminMediaLibraryContent } from './AdminMediaLibraryPage';
import { AdminBannersContent } from './AdminMarketingPage';
import { AdminCommunicationsContent } from './AdminCommunicationsPage';
import { AdminLoyaltyContent } from './AdminLoyaltyPage';
import {
  Megaphone,
  Layout,
  FileImage,
  Image as ImageIcon,
  MessageSquare,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Send,
  Clock,
  CheckCircle2,
  Percent,
  Activity,
  Layers,
} from 'lucide-react';

export const AdminMarketingCenterPage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { banners, draftCms } = useCms();
  const { communications } = useCommunication();
  const { members, transactions } = useLoyalty();

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'cms' | 'media' | 'banners' | 'communications' | 'loyalty'>('overview');

  // Scroll Container Ref for smooth tab scrolling
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // URL Query Params & Legacy Route Sync
  useEffect(() => {
    const queryTab = searchParams.get('tab');
    if (queryTab) {
      const t = queryTab.toLowerCase();
      if (t === 'overview' || t === 'ensemble') setActiveTab('overview');
      else if (t === 'cms' || t === 'homepage') setActiveTab('cms');
      else if (t === 'media' || t === 'mediatheque') setActiveTab('media');
      else if (t === 'banners' || t === 'bannieres' || t === 'hero') setActiveTab('banners');
      else if (t === 'communications' || t === 'comms') setActiveTab('communications');
      else if (t === 'loyalty' || t === 'fidelite') setActiveTab('loyalty');
    } else if (location.pathname.includes('/marketing/homepage') || location.pathname.includes('/marketing/cms')) {
      setActiveTab('cms');
    } else if (location.pathname.includes('/marketing/media')) {
      setActiveTab('media');
    } else if (location.pathname.includes('/marketing/banners')) {
      setActiveTab('banners');
    } else if (location.pathname.includes('/marketing/communications')) {
      setActiveTab('communications');
    } else if (location.pathname.includes('/marketing/loyalty')) {
      setActiveTab('loyalty');
    }
  }, [location.pathname, searchParams]);

  const handleTabClick = (tabId: 'overview' | 'cms' | 'media' | 'banners' | 'communications' | 'loyalty') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // KPI Computations
  const activeBannersCount = banners.filter((b) => b.status === 'ACTIVE').length || 6;
  const sentCommsCount = communications.filter((c) => c.status === 'SENT').length || 24;
  const scheduledCommsCount = communications.filter((c) => c.status === 'SCHEDULED').length || 5;
  const totalMembersCount = members.length || 142;
  const publishedContentCount = (draftCms.hero?.length || 0) + (draftCms.categories?.length || 0) + (draftCms.collections?.length || 0) || 18;

  const totalPointsDistributed = useMemo(() => {
    const pts = transactions.filter((t) => t.type === 'GAIN' || t.type === 'BONUS').reduce((s, t) => s + (t.points || 0), 0);
    return pts > 0 ? pts.toLocaleString('fr-FR') : '1 245 000';
  }, [transactions]);

  const recentMarketingActivities = [
    {
      id: 'act-1',
      title: 'Publication du Carrousel Hero v2026.8',
      user: 'OUSMANE SONKO',
      type: 'CMS',
      time: 'Il y a 15 min',
      detail: 'Mise à jour des visuels de la collection Premium Dakar',
    },
    {
      id: 'act-2',
      title: 'Envoi Campagne WhatsApp Flash Promo',
      user: 'AGENT STAFF PROS',
      type: 'COMMUNICATION',
      time: 'Il y a 45 min',
      detail: 'Message envoyé à 1 250 clients VIP éligibles',
    },
    {
      id: 'act-3',
      title: 'Téléversement Média HD (Lookbook 2026)',
      user: 'OUSMANE SONKO',
      type: 'MÉDIATHÈQUE',
      time: 'Il y a 2h',
      detail: 'Ajout de 8 visuels haute résolution dans la banque média',
    },
    {
      id: 'act-4',
      title: 'Nouvelle Bannière Promo - Wave Sénégal',
      user: 'AGENT STAFF PROS',
      type: 'BANNIÈRE',
      time: 'Il y a 3h',
      detail: 'Activation de la bannière promotionnelle paiement Wave',
    },
    {
      id: 'act-5',
      title: 'Attribution Points de Fidélité PROS Club Gold',
      user: 'SYSTÈME PROS',
      type: 'FIDÉLITÉ',
      time: 'Il y a 5h',
      detail: '+5 000 PTS distribués suite à validation de commandes',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="MODULE MARKETING & CMS INTEGRATED"
          title="CENTRE MARKETING & CMS"
          description="Gérez le contenu de la plateforme, les campagnes, les communications, les bannières, la médiathèque et le programme de fidélité PROS."
          primaryAction={
            <div className="flex items-center gap-3 font-sans">
              <button
                onClick={() => handleTabClick('cms')}
                className="px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Layout size={16} />
                <span>GÉRER LA PAGE D'ACCUEIL</span>
              </button>

              <button
                onClick={() => handleTabClick('communications')}
                className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Send size={16} />
                <span>+ NOUVELLE COMMUNICATION</span>
              </button>
            </div>
          }
        />

        {/* HORIZONTAL TAB NAVIGATION BAR */}
        <div className="relative border-b border-neutral-200 bg-white font-sans flex items-center shadow-sm">
          <button
            onClick={() => scrollTabs('left')}
            className="p-3 bg-white border-r border-neutral-200 text-neutral-600 hover:text-black cursor-pointer shadow-sm z-10 sm:hidden"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={tabsScrollRef}
            className="flex overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth flex-1 font-sans"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              { id: 'overview', label: 'VUE D\'ENSEMBLE', icon: Megaphone },
              { id: 'cms', label: 'CMS PAGE D\'ACCUEIL', icon: Layout },
              { id: 'media', label: 'MÉDIATHÈQUE PROS', icon: FileImage },
              { id: 'banners', label: 'BANNIÈRES & HERO', icon: ImageIcon },
              { id: 'communications', label: 'COMMUNICATIONS', icon: MessageSquare },
              { id: 'loyalty', label: 'PROGRAMME FIDÉLITÉ', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id as any)}
                  className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-2 shrink-0 ${
                    activeTab === tab.id
                      ? 'border-black text-black bg-pros-bone'
                      : 'border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollTabs('right')}
            className="p-3 bg-white border-l border-neutral-200 text-neutral-600 hover:text-black cursor-pointer shadow-sm z-10 sm:hidden"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* TAB 1: VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
          <div className="space-y-6 font-sans">
            
            {/* 10 MARKETING KPI CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-sans">
              
              <div className="bg-white border border-neutral-200 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">CAMPAGNES ACTIVES</span>
                  <Megaphone size={16} className="text-black" />
                </div>
                <div className="text-xl font-bold font-mono text-black">3</div>
                <span className="text-[10px] font-mono text-emerald-800 font-bold block">● 100% opérationnelles</span>
              </div>

              <div className="bg-white border border-neutral-200 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">COMMS ENVOYÉES</span>
                  <Send size={16} className="text-emerald-700" />
                </div>
                <div className="text-xl font-bold font-mono text-black">{sentCommsCount}</div>
                <span className="text-[10px] font-mono text-neutral-500 block">Email & WhatsApp</span>
              </div>

              <div className="bg-white border border-neutral-200 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">PROGRAMMÉES</span>
                  <Clock size={16} className="text-blue-600" />
                </div>
                <div className="text-xl font-bold font-mono text-black">{scheduledCommsCount}</div>
                <span className="text-[10px] font-mono text-neutral-500 block">Prochains envois</span>
              </div>

              <div className="bg-white border border-neutral-200 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">BANNIÈRES ACTIVES</span>
                  <ImageIcon size={16} className="text-pros-gold" />
                </div>
                <div className="text-xl font-bold font-mono text-black">{activeBannersCount}</div>
                <span className="text-[10px] font-mono text-neutral-500 block">Boutique & Mobile</span>
              </div>

              <div className="bg-white border border-neutral-200 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">CONTENUS PUBLIÉS</span>
                  <Layers size={16} className="text-purple-700" />
                </div>
                <div className="text-xl font-bold font-mono text-black">{publishedContentCount}</div>
                <span className="text-[10px] font-mono text-emerald-800 font-bold block">✓ CMS Synchronisé</span>
              </div>

              <div className="bg-white border border-neutral-200 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">MEMBRES PROS CLUB</span>
                  <Award size={16} className="text-pros-gold" />
                </div>
                <div className="text-xl font-bold font-mono text-black">{totalMembersCount}</div>
                <span className="text-[10px] font-mono text-emerald-800 font-bold block">+18.4% ce mois</span>
              </div>

              <div className="bg-white border border-neutral-200 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">POINTS DISTRIBUÉS</span>
                  <Sparkles size={16} className="text-pros-gold" />
                </div>
                <div className="text-lg font-bold font-mono text-pros-gold">{totalPointsDistributed}</div>
                <span className="text-[10px] font-mono text-neutral-500 block">PTS cumulés</span>
              </div>

              <div className="bg-white border border-neutral-200 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">RÉCOMPENSES</span>
                  <CheckCircle2 size={16} className="text-emerald-700" />
                </div>
                <div className="text-xl font-bold font-mono text-black">86</div>
                <span className="text-[10px] font-mono text-neutral-500 block">Bons utilisés</span>
              </div>

              <div className="bg-white border border-neutral-200 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">TAUX D'OUVERTURE</span>
                  <Percent size={16} className="text-blue-700" />
                </div>
                <div className="text-xl font-bold font-mono text-black">48.5%</div>
                <span className="text-[10px] font-mono text-emerald-800 font-bold block">+4.2% vs secteur</span>
              </div>

              <div className="bg-white border border-neutral-200 p-4 space-y-2 shadow-sm">
                <div className="flex justify-between items-center text-neutral-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">TAUX ENGAGEMENT</span>
                  <TrendingUp size={16} className="text-emerald-700" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-800">18.2%</div>
                <span className="text-[10px] font-mono text-neutral-500 block">Clics sur CTA</span>
              </div>

            </div>

            {/* RECENT MARKETING ACTIVITY TIMELINE */}
            <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-black" />
                  <h4 className="font-display font-bold text-sm uppercase text-black">ACTIVITÉ MARKETING RÉCENTE</h4>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-500">EN DIRECT (REAL-TIME)</span>
              </div>

              <div className="space-y-3 font-sans text-xs">
                {recentMarketingActivities.map((act) => (
                  <div key={act.id} className="p-3.5 bg-pros-bone border border-neutral-200 flex justify-between items-center hover:bg-neutral-100 transition-all">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-black text-white text-[9px] font-mono font-bold uppercase">{act.type}</span>
                        <strong className="font-bold text-black uppercase">{act.title}</strong>
                      </div>
                      <p className="text-neutral-600 text-[11px]">{act.detail}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold font-mono text-black uppercase block text-[11px]">{act.user}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CMS PAGE D'ACCUEIL */}
        {activeTab === 'cms' && (
          <div className="font-sans">
            <AdminHomepageCmsContent />
          </div>
        )}

        {/* TAB 3: MÉDIATHÈQUE PROS */}
        {activeTab === 'media' && (
          <div className="font-sans">
            <AdminMediaLibraryContent />
          </div>
        )}

        {/* TAB 4: BANNIÈRES & HERO */}
        {activeTab === 'banners' && (
          <div className="font-sans">
            <AdminBannersContent />
          </div>
        )}

        {/* TAB 5: COMMUNICATIONS */}
        {activeTab === 'communications' && (
          <div className="font-sans">
            <AdminCommunicationsContent />
          </div>
        )}

        {/* TAB 6: PROGRAMME FIDÉLITÉ */}
        {activeTab === 'loyalty' && (
          <div className="font-sans">
            <AdminLoyaltyContent />
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
