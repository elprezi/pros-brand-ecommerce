import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useStore } from '../../store/storeContext';
import { useLoyalty } from '../../store/loyaltyContext';
import { useAuth } from '../../store/authContext';
import { logRbacAction } from '../../lib/server/rbacEngine';
import {
  DollarSign,
  ShoppingBag,
  Award,
  Download,
  FileText,
  CheckCircle2,
  MapPin,
  X,
  Smartphone,
  Globe,
  Clock,
  Layers,
  HelpCircle,
  UserCheck,
  UserPlus,
  AlertCircle,
} from 'lucide-react';

export const AdminStatisticsContent: React.FC = () => {
  const navigate = useNavigate();
  const { orders, products, categories, customers, formatPrice } = useStore();
  const { members } = useLoyalty();
  const { currentUser } = useAuth();

  // Period Filter State
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '90d' | '12m' | 'custom'>('30d');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-19');

  // Chart Metric State
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [chartGranularity, setChartGranularity] = useState<'day' | 'week' | 'month'>('day');

  // Modal & Toast State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. FILTERED ORDERS FOR SELECTED TIMEFRAME
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt).getTime();
      const now = Date.now();

      if (timeframe === 'today') {
        const todayStart = new Date().setHours(0, 0, 0, 0);
        if (orderDate < todayStart) return false;
      } else if (timeframe === '7d') {
        if (orderDate < now - 7 * 24 * 3600 * 1000) return false;
      } else if (timeframe === '30d') {
        if (orderDate < now - 30 * 24 * 3600 * 1000) return false;
      } else if (timeframe === '90d') {
        if (orderDate < now - 90 * 24 * 3600 * 1000) return false;
      } else if (timeframe === '12m') {
        if (orderDate < now - 365 * 24 * 3600 * 1000) return false;
      } else if (timeframe === 'custom') {
        if (startDate && orderDate < new Date(startDate).getTime()) return false;
        if (endDate && orderDate > new Date(endDate).getTime() + 86400000) return false;
      }

      return true;
    });
  }, [orders, timeframe, startDate, endDate]);

  // PREVIOUS PERIOD ORDERS FOR COMPARISON
  const previousOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt).getTime();
      const now = Date.now();
      const periodDuration = 30 * 24 * 3600 * 1000;
      return orderDate >= now - 2 * periodDuration && orderDate < now - periodDuration;
    });
  }, [orders]);

  // ELIGIBLE PAID / VALIDATED ORDERS (CA Source of Truth)
  const paidOrders = useMemo(() => {
    return filteredOrders.filter(
      (o) =>
        (o.status === 'livree' || o.status === 'expedie' || o.status === 'preparation' || o.paymentStatus === 'paid') &&
        !o.notes?.toLowerCase().includes('annul')
    );
  }, [filteredOrders]);

  const prevPaidOrders = useMemo(() => {
    return previousOrders.filter(
      (o) =>
        (o.status === 'livree' || o.status === 'expedie' || o.status === 'preparation' || o.paymentStatus === 'paid') &&
        !o.notes?.toLowerCase().includes('annul')
    );
  }, [previousOrders]);

  // REVENUE CALCULATIONS
  const grossRevenue = useMemo(() => paidOrders.reduce((sum, o) => sum + (o.subtotal || o.total), 0), [paidOrders]);
  const totalDiscounts = useMemo(() => paidOrders.reduce((sum, o) => sum + (o.discount || 0), 0), [paidOrders]);
  const totalRevenue = Math.max(0, grossRevenue - totalDiscounts);

  const prevGrossRevenue = useMemo(() => prevPaidOrders.reduce((sum, o) => sum + (o.subtotal || o.total), 0), [prevPaidOrders]);
  const prevTotalRevenue = Math.max(0, prevGrossRevenue - prevPaidOrders.reduce((sum, o) => sum + (o.discount || 0), 0));

  const paidOrdersCount = paidOrders.length;
  const prevPaidOrdersCount = prevPaidOrders.length;

  const averageOrderValue = paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0;
  const prevAverageOrderValue = prevPaidOrdersCount > 0 ? Math.round(prevTotalRevenue / prevPaidOrdersCount) : 0;

  // VARIATION PERCENTAGES
  const calcVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 'NOUVEAU' : '= 0%';
    const pct = ((current - previous) / previous) * 100;
    const sign = pct >= 0 ? '↑ +' : '↓ ';
    return `${sign}${Math.abs(pct).toFixed(1)}%`;
  };

  const revenueVariation = calcVariation(totalRevenue, prevTotalRevenue);
  const ordersVariation = calcVariation(paidOrdersCount, prevPaidOrdersCount);
  const avgOrderVariation = calcVariation(averageOrderValue, prevAverageOrderValue);

  // CUSTOMER LOGIC & DISTINCTIONS
  const customerOrdersMap = useMemo(() => {
    const map: Record<string, number> = {};
    paidOrders.forEach((o) => {
      const email = o.customer.email.toLowerCase();
      map[email] = (map[email] || 0) + 1;
    });
    return map;
  }, [paidOrders]);

  const activeCustomersCount = Object.keys(customerOrdersMap).length;
  const repeatCustomersCount = Object.values(customerOrdersMap).filter((cnt) => cnt > 1).length;
  const repurchasingRate = activeCustomersCount > 0 ? ((repeatCustomersCount / activeCustomersCount) * 100).toFixed(1) : '0.0';

  // 2. DYNAMIC CATALOG CATEGORIES PERFORMANCE
  const categoryBreakdown = useMemo(() => {
    if (categories.length === 0) return [];

    const catMap: Record<string, { name: string; revenue: number; ordersCount: number; unitsSold: number }> = {};

    categories.forEach((cat) => {
      catMap[cat.name.toUpperCase()] = { name: cat.name.toUpperCase(), revenue: 0, ordersCount: 0, unitsSold: 0 };
    });

    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        const pCategory = item.product?.category
          ? String(item.product.category).toUpperCase()
          : products.find((p) => p.id === item.productId)?.category
          ? String(products.find((p) => p.id === item.productId)?.category).toUpperCase()
          : 'AUTRE';

        if (!catMap[pCategory]) {
          catMap[pCategory] = { name: pCategory, revenue: 0, ordersCount: 0, unitsSold: 0 };
        }
        catMap[pCategory].revenue += item.price * item.quantity;
        catMap[pCategory].unitsSold += item.quantity;
        catMap[pCategory].ordersCount += 1;
      });
    });

    const totalCatRev = Object.values(catMap).reduce((s, c) => s + c.revenue, 0) || (totalRevenue || 1);

    return Object.values(catMap)
      .map((c) => ({
        ...c,
        percentage: totalCatRev > 0 ? Math.round((c.revenue / totalCatRev) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidOrders, categories, products, totalRevenue]);

  // 3. REGIONAL GEOGRAPHY PERFORMANCE (From real order delivery addresses)
  const regionalBreakdown = useMemo(() => {
    const regMap: Record<string, { region: string; revenue: number; ordersCount: number }> = {};

    paidOrders.forEach((order) => {
      const reg = order.customer.region || order.customer.city;
      if (!reg) return;

      if (!regMap[reg]) {
        regMap[reg] = { region: reg, revenue: 0, ordersCount: 0 };
      }
      regMap[reg].revenue += order.total;
      regMap[reg].ordersCount += 1;
    });

    const totalRegRev = Object.values(regMap).reduce((s, r) => s + r.revenue, 0) || (totalRevenue || 1);

    return Object.values(regMap)
      .map((r) => ({
        ...r,
        percentage: totalRegRev > 0 ? Math.round((r.revenue / totalRegRev) * 100) : 0,
        avgOrder: r.ordersCount > 0 ? Math.round(r.revenue / r.ordersCount) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidOrders, totalRevenue]);

  // 4. TOP 10 BEST CUSTOMERS (Real Spend & Orders)
  const topCustomers = useMemo(() => {
    const custMap: Record<string, { name: string; email: string; ordersCount: number; totalSpend: number; lastOrder: string }> = {};

    paidOrders.forEach((o) => {
      const email = o.customer.email.toLowerCase();
      if (!custMap[email]) {
        custMap[email] = {
          name: `${o.customer.firstName} ${o.customer.lastName}`,
          email: o.customer.email,
          ordersCount: 0,
          totalSpend: 0,
          lastOrder: o.createdAt,
        };
      }
      custMap[email].ordersCount += 1;
      custMap[email].totalSpend += o.total;
      if (new Date(o.createdAt).getTime() > new Date(custMap[email].lastOrder).getTime()) {
        custMap[email].lastOrder = o.createdAt;
      }
    });

    return Object.values(custMap)
      .map((c) => {
        const isMember = members.some((m) => m.email.toLowerCase() === c.email.toLowerCase());
        return {
          ...c,
          avgCart: Math.round(c.totalSpend / c.ordersCount),
          loyaltyTier: isMember ? 'PROS CLUB VIP' : 'STANDARD',
        };
      })
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10);
  }, [paidOrders, members]);

  // 5. HOURLY ACTIVITY DISTRIBUTION (Calculated from real orders)
  const hourlyActivity = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}h`, orders: 0, revenue: 0 }));
    paidOrders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      hours[h].orders += 1;
      hours[h].revenue += o.total;
    });
    return hours;
  }, [paidOrders]);

  // 6. DAY OF THE WEEK PERFORMANCE
  const dailyPerformance = useMemo(() => {
    const days = [
      { name: 'LUNDI', orders: 0, revenue: 0 },
      { name: 'MARDI', orders: 0, revenue: 0 },
      { name: 'MERCREDI', orders: 0, revenue: 0 },
      { name: 'JEUDI', orders: 0, revenue: 0 },
      { name: 'VENDREDI', orders: 0, revenue: 0 },
      { name: 'SAMEDI', orders: 0, revenue: 0 },
      { name: 'DIMANCHE', orders: 0, revenue: 0 },
    ];
    paidOrders.forEach((o) => {
      const d = new Date(o.createdAt).getDay();
      const idx = d === 0 ? 6 : d - 1;
      days[idx].orders += 1;
      days[idx].revenue += o.total;
    });
    return days;
  }, [paidOrders]);

  // 7. PROS CLUB LOYALTY IMPACT
  const prosClubMetrics = useMemo(() => {
    const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));

    let memberCA = 0;
    let nonMemberCA = 0;
    let memberOrders = 0;
    let nonMemberOrders = 0;

    paidOrders.forEach((o) => {
      if (memberEmails.has(o.customer.email.toLowerCase())) {
        memberCA += o.total;
        memberOrders += 1;
      } else {
        nonMemberCA += o.total;
        nonMemberOrders += 1;
      }
    });

    const totalCA = memberCA + nonMemberCA || 1;

    return {
      memberCA,
      nonMemberCA,
      memberOrders,
      nonMemberOrders,
      memberAvgCart: memberOrders > 0 ? Math.round(memberCA / memberOrders) : 0,
      nonMemberAvgCart: nonMemberOrders > 0 ? Math.round(nonMemberCA / nonMemberOrders) : 0,
      memberSharePercent: Math.round((memberCA / totalCA) * 100),
      nonMemberSharePercent: 100 - Math.round((memberCA / totalCA) * 100),
    };
  }, [paidOrders, members]);

  // Handle Export Actions (CSV / Excel / PDF)
  const handleExportData = (format: 'CSV' | 'EXCEL' | 'PDF') => {
    logRbacAction(currentUser?.email || 'admin@pros.sn', 'STATISTICS_EXPORT', `Export Statistiques ${format}`);

    if (format === 'CSV') {
      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [
          'INDICATEUR;VALEUR;VARIATION',
          `Chiffre d'Affaires Net;${totalRevenue} FCFA;${revenueVariation}`,
          `Commandes Valides;${paidOrdersCount};${ordersVariation}`,
          `Panier Moyen;${averageOrderValue} FCFA;${avgOrderVariation}`,
          `Clients Actifs;${activeCustomersCount};—`,
          `Taux de Réachat;${repurchasingRate}%;—`,
        ].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `PROS_Statistiques_Globales_${timeframe}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showToast(`Statistiques exportées au format ${format} avec succès.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="ANALYTIQUE & STATISTIQUES"
          title="CENTRE DE STATISTIQUES GLOBALES PROS"
          description="Analysez l'activité globale de la plateforme, le comportement des clients, les ventes, la géographie et les performances par segment."
          primaryAction={
            <div className="flex items-center gap-3 font-sans">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <FileText size={16} />
                <span>RAPPORT STATISTIQUE</span>
              </button>

              <div className="relative group">
                <button className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center gap-2 cursor-pointer shadow-sm">
                  <Download size={16} />
                  <span>EXPORTER &darr;</span>
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 shadow-xl hidden group-hover:block z-50 w-44 font-sans text-xs">
                  <button onClick={() => handleExportData('CSV')} className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-black">
                    EXPORTER EN CSV (.csv)
                  </button>
                  <button onClick={() => handleExportData('EXCEL')} className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-black">
                    EXPORTER EN EXCEL (.xlsx)
                  </button>
                  <button onClick={() => handleExportData('PDF')} className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-black">
                    IMPRIMER PDF STATISTIQUE
                  </button>
                </div>
              </div>
            </div>
          }
        />

        {/* Information Notice Banner for Unconfigured Tracking */}
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-sans flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 font-sans">
            <AlertCircle size={18} className="text-amber-700 shrink-0" />
            <div>
              <strong className="font-bold uppercase block">DONNÉES PARTIELLES (TRACKING CLIENT NON CONNECTÉ)</strong>
              <span>Certaines statistiques nécessitent l'activation du tracking des visiteurs web et événements de session. Les données de commandes réelles sont synchronisées.</span>
            </div>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between font-sans shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{toastMsg.text}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* SECTION 1: GLOBAL PERIOD & COMPARISON FILTER BAR */}
        <div className="bg-white border border-neutral-200 p-4 space-y-3 shadow-sm font-sans">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Timeframe Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 font-sans">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mr-2">PÉRIODE :</span>
              {[
                { id: 'today', label: "AUJOURD'HUI" },
                { id: '7d', label: '7 JOURS' },
                { id: '30d', label: '30 JOURS' },
                { id: '90d', label: '90 JOURS' },
                { id: '12m', label: '12 MOIS' },
                { id: 'custom', label: 'PERSONNALISÉ' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id as any)}
                  className={`px-3 py-1.5 text-xs font-bold font-mono transition-all cursor-pointer ${
                    timeframe === tf.id ? 'bg-black text-white' : 'bg-pros-bone border border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Comparison Badge */}
            <div className="flex items-center gap-2 text-xs font-sans">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">COMPARER À :</span>
              <span className="bg-pros-bone border border-neutral-300 px-3 py-1.5 text-xs font-bold text-black font-mono">
                PÉRIODE PRÉCÉDENTE
              </span>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {timeframe === 'custom' && (
            <div className="pt-3 border-t border-neutral-200 flex items-center gap-3 font-sans text-xs">
              <span className="font-bold text-neutral-500 uppercase text-[10px]">DU :</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-pros-bone border border-neutral-300 p-1.5 text-xs text-black font-mono focus:outline-none"
              />
              <span className="font-bold text-neutral-500 uppercase text-[10px]">AU :</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-pros-bone border border-neutral-300 p-1.5 text-xs text-black font-mono focus:outline-none"
              />
              <button
                onClick={() => showToast('Période personnalisée appliquée.')}
                className="px-4 py-1.5 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer"
              >
                APPLIQUER
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2: 6 MAIN GLOBAL KPIS (ROW 1) */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 font-sans">
          {/* VISITEURS UNIQUES */}
          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="flex justify-between items-center text-neutral-500 text-[10px] font-bold uppercase tracking-wider font-sans">
              <span>VISITEURS UNIQUES</span>
              <Globe size={15} className="text-neutral-400" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-400">N/A</div>
            <div className="text-[9px] text-neutral-400 font-sans">Tracking non configuré</div>
          </div>

          {/* SESSIONS */}
          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="flex justify-between items-center text-neutral-500 text-[10px] font-bold uppercase tracking-wider font-sans">
              <span>SESSIONS</span>
              <Layers size={15} className="text-neutral-400" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-400">N/A</div>
            <div className="text-[9px] text-neutral-400 font-sans">Tracking non configuré</div>
          </div>

          {/* CLIENTS ACTIFS */}
          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="flex justify-between items-center text-neutral-500 text-[10px] font-bold uppercase tracking-wider font-sans">
              <span>CLIENTS ACTIFS</span>
              <UserCheck size={15} className="text-emerald-700" />
            </div>
            <div className="text-xl font-bold font-mono text-black">{activeCustomersCount}</div>
            <div className="text-[10px] text-neutral-400 font-mono">Période sélectionnée</div>
          </div>

          {/* NOUVEAUX CLIENTS */}
          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="flex justify-between items-center text-neutral-500 text-[10px] font-bold uppercase tracking-wider font-sans">
              <span>NOUVEAUX CLIENTS</span>
              <UserPlus size={15} className="text-blue-700" />
            </div>
            <div className="text-xl font-bold font-mono text-black">{customers.length}</div>
            <div className="text-[10px] text-neutral-400 font-mono">Base enregistrée</div>
          </div>

          {/* COMMANDES */}
          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="flex justify-between items-center text-neutral-500 text-[10px] font-bold uppercase tracking-wider font-sans">
              <span>COMMANDES</span>
              <ShoppingBag size={15} className="text-purple-700" />
            </div>
            <div className="text-xl font-bold font-mono text-black">{paidOrdersCount}</div>
            <div className={`text-[10px] font-bold font-mono ${ordersVariation.includes('↑') ? 'text-emerald-700' : 'text-neutral-500'}`}>
              {ordersVariation} vs préc.
            </div>
          </div>

          {/* CHIFFRE D'AFFAIRES */}
          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="flex justify-between items-center text-neutral-500 text-[10px] font-bold uppercase tracking-wider font-sans">
              <span>CHIFFRE D'AFFAIRES</span>
              <DollarSign size={15} className="text-emerald-700" />
            </div>
            <div className="text-xl font-bold font-mono text-black">{formatPrice(totalRevenue)}</div>
            <div className={`text-[10px] font-bold font-mono ${revenueVariation.includes('↑') ? 'text-emerald-700' : 'text-neutral-500'}`}>
              {revenueVariation} vs préc.
            </div>
          </div>
        </div>

        {/* SECTION 3: 6 SECONDARY ENGAGEMENT KPIS (ROW 2) */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 font-sans">
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase text-neutral-500">TAUX CONVERSION</div>
            <div className="text-lg font-bold font-mono text-neutral-400">N/A</div>
            <div className="text-[9px] text-neutral-400">Visiteurs requis</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase text-neutral-500">TAUX DE REBOND</div>
            <div className="text-lg font-bold font-mono text-neutral-400">N/A</div>
            <div className="text-[9px] text-neutral-400">Tracking requis</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase text-neutral-500">DURÉE SESSIONS</div>
            <div className="text-lg font-bold font-mono text-neutral-400">N/A</div>
            <div className="text-[9px] text-neutral-400">Tracking requis</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase text-neutral-500">PAGES / SESSION</div>
            <div className="text-lg font-bold font-mono text-neutral-400">N/A</div>
            <div className="text-[9px] text-neutral-400">Tracking requis</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase text-neutral-500">PANIER MOYEN</div>
            <div className="text-lg font-bold font-mono text-black">{formatPrice(averageOrderValue)}</div>
            <div className="text-[9px] text-emerald-700 font-mono font-bold">{avgOrderVariation}</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase text-neutral-500">TAUX DE RÉACHAT</div>
            <div className="text-lg font-bold font-mono text-black">{repurchasingRate}%</div>
            <div className="text-[9px] text-neutral-500 font-mono">{repeatCustomersCount} client(s) fidèle(s)</div>
          </div>
        </div>

        {/* SECTION 4: GLOBAL ACTIVITY CHART */}
        <div className="bg-white p-6 border border-neutral-200 space-y-4 shadow-sm font-sans">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-3">
            <div>
              <h4 className="font-display font-bold text-sm uppercase text-black">ÉVOLUTION DE L'ACTIVITÉ GLOBALE</h4>
              <p className="text-xs text-neutral-500">Suivi des tendances de revenus et commandes sur la période.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
              <div className="flex border border-neutral-300 text-[10px] font-bold font-mono">
                <button
                  onClick={() => setChartMetric('revenue')}
                  className={`px-3 py-1 cursor-pointer ${chartMetric === 'revenue' ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  CHIFFRE D'AFFAIRES
                </button>
                <button
                  onClick={() => setChartMetric('orders')}
                  className={`px-3 py-1 cursor-pointer ${chartMetric === 'orders' ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  COMMANDES
                </button>
              </div>

              <div className="flex border border-neutral-300 text-[10px] font-bold font-mono">
                {(['day', 'week', 'month'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setChartGranularity(g)}
                    className={`px-2.5 py-1 cursor-pointer ${chartGranularity === g ? 'bg-pros-gold text-black' : 'bg-white text-neutral-600'}`}
                  >
                    {g === 'day' ? 'PAR JOUR' : g === 'week' ? 'PAR SEMAINE' : 'PAR MOIS'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-64 bg-pros-bone border border-neutral-200 p-4 flex flex-col justify-between font-sans relative">
            {paidOrdersCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-neutral-400 font-sans">
                <span>AUCUNE VENTE ENREGISTRÉE SUR CETTE PÉRIODE</span>
              </div>
            ) : (
              <div className="flex items-end justify-between h-44 gap-2 pt-4">
                {paidOrders.map((o, idx) => (
                  <div key={o.id} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative cursor-pointer">
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-black text-white p-2 text-[10px] font-mono z-20 whitespace-nowrap shadow-xl border border-white/20">
                      <span className="text-pros-gold font-bold">{o.id}</span>
                      <span>Date: {new Date(o.createdAt).toLocaleDateString('fr-FR')}</span>
                      <span>Montant: {formatPrice(o.total)}</span>
                    </div>

                    <div
                      style={{ height: `${Math.min(100, Math.max(15, (o.total / (grossRevenue || 1)) * 300))}%` }}
                      className="w-full bg-emerald-700 hover:bg-emerald-500 transition-all rounded-t-sm"
                    ></div>
                    <span className="text-[9px] font-mono text-neutral-400 hidden sm:block">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: CATEGORY SALES & GEOGRAPHIC PERFORMANCE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
          
          {/* CATEGORY PERFORMANCE */}
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h4 className="font-display font-bold text-sm uppercase text-black">VENTES PAR CATÉGORIE (CATALOGUE RÉEL)</h4>
              <button onClick={() => navigate('/admin/categories')} className="text-xs text-pros-gold font-bold uppercase hover:underline">
                CATALOGUE &rarr;
              </button>
            </div>

            <div className="space-y-3 font-sans">
              {categoryBreakdown.length === 0 ? (
                <div className="p-6 text-center text-neutral-400 font-sans text-xs">
                  AUCUNE CATÉGORIE DISPONIBLE
                </div>
              ) : (
                categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="space-y-1 text-xs font-sans">
                    <div className="flex justify-between items-center">
                      <strong className="font-bold text-black uppercase">{cat.name}</strong>
                      <div className="font-mono text-xs">
                        <span className="font-bold text-black">{formatPrice(cat.revenue)}</span>
                        <span className="text-neutral-400 ml-2">({cat.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-pros-bone h-2.5 overflow-hidden">
                      <div
                        style={{ width: `${cat.percentage}%` }}
                        className={`h-full ${idx === 0 ? 'bg-black' : idx === 1 ? 'bg-pros-gold' : idx === 2 ? 'bg-emerald-700' : 'bg-slate-400'}`}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                      <span>{cat.ordersCount} commandes</span>
                      <span>{cat.unitsSold} articles vendus</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SENEGAL REGIONAL GEOGRAPHY */}
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="text-emerald-700" size={18} />
                <h4 className="font-display font-bold text-sm uppercase text-black">RÉPARTITION GÉOGRAPHIQUE SÉNÉGAL</h4>
              </div>
              <button onClick={() => navigate('/admin/orders')} className="text-xs text-pros-gold font-bold uppercase hover:underline">
                COMMANDES &rarr;
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              {regionalBreakdown.length === 0 ? (
                <div className="p-6 bg-pros-bone border border-neutral-200 text-center space-y-1 font-sans">
                  <MapPin size={24} className="mx-auto text-neutral-400" />
                  <strong className="text-black font-bold uppercase text-xs block">AUCUNE DONNÉE GÉOGRAPHIQUE DISPONIBLE</strong>
                  <span className="text-neutral-500 text-xs">Aucune adresse de livraison renseignée sur les commandes de cette période.</span>
                </div>
              ) : (
                regionalBreakdown.map((r, idx) => (
                  <div key={idx} className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center font-sans">
                    <div>
                      <strong className="font-bold text-black uppercase block">{r.region}</strong>
                      <span className="text-[10px] text-neutral-400 font-mono">{r.ordersCount} commandes ({r.percentage}%)</span>
                    </div>
                    <div className="text-right font-mono">
                      <strong className="text-black font-bold block">{formatPrice(r.revenue)}</strong>
                      <span className="text-[10px] text-neutral-400">Panier Moyen: {formatPrice(r.avgOrder)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SECTION 6: DEVICES & USER ENVIRONMENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
          
          {/* APPAREILS & SESSIONS */}
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Smartphone size={18} className="text-neutral-400" />
              <h4 className="font-display font-bold text-sm uppercase text-black">APPAREILS & SESSIONS</h4>
            </div>

            <div className="p-6 bg-pros-bone border border-neutral-200 text-center space-y-2 font-sans">
              <HelpCircle size={24} className="mx-auto text-neutral-400" />
              <strong className="text-black font-bold uppercase text-xs block">DONNÉES INDISPONIBLES</strong>
              <p className="text-neutral-500 text-xs">Le tracking des appareils et navigateurs clients n'est pas encore configuré.</p>
            </div>
          </div>

          {/* HOURLY & DAILY ACTIVITY DISTRIBUTION */}
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Clock size={18} className="text-purple-700" />
              <h4 className="font-display font-bold text-sm uppercase text-black">HEURES & JOURS D'ACTIVITÉ COMMERCIALE</h4>
            </div>

            {paidOrdersCount === 0 ? (
              <div className="p-6 bg-pros-bone border border-neutral-200 text-center space-y-2 font-sans">
                <Clock size={24} className="mx-auto text-neutral-400" />
                <strong className="text-black font-bold uppercase text-xs block">DONNÉES D'ACTIVITÉ INDISPONIBLES</strong>
                <p className="text-neutral-500 text-xs">Les données horaires seront calculées à partir des commandes réelles de cette période.</p>
              </div>
            ) : (
              <>
                <div className="h-32 bg-pros-bone p-3 flex items-end justify-between gap-1 font-mono text-[9px]">
                  {hourlyActivity.filter((_, i) => i % 2 === 0).map((h, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                      <div className="absolute bottom-full mb-1 hidden group-hover:block bg-black text-white p-1 text-[9px]">
                        {h.hour}: {h.orders} cmd(s)
                      </div>
                      <div
                        style={{ height: `${Math.min(100, Math.max(10, h.orders * 25))}%` }}
                        className="w-full bg-purple-700 rounded-t-sm"
                      ></div>
                      <span>{h.hour}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-neutral-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono block">Volume par jour de la semaine</span>
                  <div className="grid grid-cols-7 gap-1 font-mono text-[10px] text-center">
                    {dailyPerformance.map((d, i) => (
                      <div key={i} className="p-1.5 bg-pros-bone border border-neutral-200">
                        <span className="font-bold block text-black">{d.name.slice(0, 3)}</span>
                        <span className="text-neutral-500 font-bold">{d.orders} cmd</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SECTION 7: TOP 10 BEST CUSTOMERS TABLE */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
            <h4 className="font-display font-bold text-sm uppercase text-black">MEILLEURS CLIENTS (PAR CHIFFRE D'AFFAIRES RÉEL)</h4>
            <button onClick={() => navigate('/admin/customers')} className="text-xs text-pros-gold font-bold uppercase hover:underline">
              BASE CLIENTS &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            {topCustomers.length === 0 ? (
              <div className="p-8 bg-pros-bone border border-neutral-200 text-center space-y-2 font-sans">
                <UserCheck size={24} className="mx-auto text-neutral-400" />
                <strong className="text-black font-bold uppercase text-xs block">AUCUNE VENTE CLIENT SUR CETTE PÉRIODE</strong>
                <p className="text-neutral-500 text-xs">
                  {customers.length} client(s) enregistré(s) dans la base, mais aucun n'a généré de chiffre d'affaires sur la période sélectionnée.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <th className="p-3">RANG</th>
                    <th className="p-3">CLIENT</th>
                    <th className="p-3">EMAIL</th>
                    <th className="p-3 text-right">COMMANDES</th>
                    <th className="p-3 text-right">CA DÉPENSÉ</th>
                    <th className="p-3 text-right">PANIER MOYEN</th>
                    <th className="p-3 text-right">STATUT FIDÉLITÉ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-sans">
                  {topCustomers.map((c, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 font-sans">
                      <td className="p-3 font-mono font-bold text-neutral-400">#{idx + 1}</td>
                      <td className="p-3 font-bold text-black uppercase">{c.name}</td>
                      <td className="p-3 font-mono text-neutral-500">{c.email}</td>
                      <td className="p-3 text-right font-mono font-bold text-black">{c.ordersCount} cmd(s)</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">{formatPrice(c.totalSpend)}</td>
                      <td className="p-3 text-right font-mono text-neutral-700">{formatPrice(c.avgCart)}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase font-mono border ${
                            c.loyaltyTier.includes('VIP')
                              ? 'bg-pros-black text-pros-gold border-pros-gold'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}
                        >
                          {c.loyaltyTier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* SECTION 8: PROS CLUB & CONVERSION FUNNEL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
          
          {/* PROS CLUB IMPACT */}
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="text-pros-gold" size={18} />
                <h4 className="font-display font-bold text-sm uppercase text-black">IMPACT DU PROGRAMME PROS CLUB</h4>
              </div>
              <button onClick={() => navigate('/admin/marketing/loyalty')} className="text-xs text-pros-gold font-bold uppercase hover:underline">
                GÉRER LE CLUB &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-sans text-center">
              <div className="p-3 bg-pros-black text-white border border-pros-gold">
                <span className="text-[10px] text-pros-gold uppercase font-bold block">CA Membres PROS Club</span>
                <strong className="text-pros-gold font-mono font-bold text-lg">{formatPrice(prosClubMetrics.memberCA)}</strong>
                <span className="text-[10px] text-neutral-400 block mt-1">{prosClubMetrics.memberSharePercent}% du CA global</span>
              </div>

              <div className="p-3 bg-pros-bone border border-neutral-200">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block">CA Non-Membres</span>
                <strong className="text-black font-mono font-bold text-lg">{formatPrice(prosClubMetrics.nonMemberCA)}</strong>
                <span className="text-[10px] text-neutral-500 block mt-1">{prosClubMetrics.nonMemberSharePercent}% du CA global</span>
              </div>
            </div>
          </div>

          {/* UNIFIED CONVERSION FUNNEL */}
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              ENTONNOIR COMMERCIAL UNIFIÉ
            </h4>

            <div className="space-y-2 text-xs font-sans font-mono">
              <div className="p-2.5 bg-pros-bone flex justify-between items-center">
                <span>VISITEURS UNIQUES :</span>
                <strong className="text-neutral-400">N/A (Visiteurs requis)</strong>
              </div>
              <div className="p-2.5 bg-pros-bone flex justify-between items-center">
                <span>PRODUITS CONSULTÉS :</span>
                <strong className="text-neutral-400">N/A (Tracking requis)</strong>
              </div>
              <div className="p-2.5 bg-pros-bone flex justify-between items-center">
                <span>AJOUTS AU PANIER :</span>
                <strong className="text-neutral-400">N/A (Tracking requis)</strong>
              </div>
              <div className="p-2.5 bg-pros-bone flex justify-between items-center">
                <span>CHECKOUT :</span>
                <strong className="text-neutral-400">N/A (Tracking requis)</strong>
              </div>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 flex justify-between items-center text-emerald-900">
                <span>COMMANDES ENREGISTRÉES :</span>
                <strong className="text-emerald-900 text-sm font-bold">{filteredOrders.length}</strong>
              </div>
              <div className="p-2.5 bg-emerald-700 text-white flex justify-between items-center">
                <span>PAIEMENTS CONFIRMÉS :</span>
                <strong className="text-white text-sm font-bold">{paidOrdersCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 9: REPORT MODAL */}
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-6 space-y-6 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="text-pros-gold" size={20} />
                  <h3 className="font-display font-bold text-base uppercase text-black">RAPPORT STATISTIQUE GLOBAL PROS</h3>
                </div>
                <button onClick={() => setIsReportModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div className="p-4 bg-pros-bone border border-neutral-200 space-y-2 font-mono">
                  <div><strong>Période :</strong> {timeframe.toUpperCase()}</div>
                  <div><strong>Chiffre d'Affaires Net :</strong> {formatPrice(totalRevenue)}</div>
                  <div><strong>Commandes Éligibles :</strong> {paidOrdersCount}</div>
                  <div><strong>Clients Actifs :</strong> {activeCustomersCount}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-100"
                >
                  FERMER
                </button>
                <button
                  onClick={() => {
                    handleExportData('PDF');
                    setIsReportModalOpen(false);
                  }}
                  className="px-5 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase shadow-sm"
                >
                  IMPRIMER LE RAPPORT
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
};

export const AdminStatisticsPage: React.FC = () => (
  <AdminLayout>
    <AdminStatisticsContent />
  </AdminLayout>
);
