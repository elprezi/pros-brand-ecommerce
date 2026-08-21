import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useStore } from '../../store/storeContext';
import { RefreshCw, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { getDashboardData } from '../../lib/admin/analytics/dashboard';
import { DashboardKpis } from '../../components/admin/dashboard/DashboardKpis';
import { SalesChart } from '../../components/admin/dashboard/SalesChart';
import { CategoryBreakdown } from '../../components/admin/dashboard/CategoryBreakdown';
import { RecentOrdersWidget } from '../../components/admin/dashboard/RecentOrdersWidget';
import { LowStockWidget } from '../../components/admin/dashboard/LowStockWidget';
import { QuickActionsWidget } from '../../components/admin/dashboard/QuickActionsWidget';
import { ActivityFeedWidget } from '../../components/admin/dashboard/ActivityFeedWidget';
import { PeriodSelector } from '../../components/admin/dashboard/PeriodSelector';

export const AdminDashboardPage: React.FC = () => {
  const { products, orders } = useStore();
  const [period, setPeriod] = useState<string>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Dynamic real data calculations
  const dashboardData = useMemo(() => {
    try {
      return getDashboardData(orders, products, period);
    } catch {
      setHasError(true);
      return null;
    }
  }, [orders, products, period]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setHasError(false);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshToast(true);
      setTimeout(() => setRefreshToast(false), 3000);
    }, 500);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Unified AdminPageHeader with PeriodSelector */}
        <AdminPageHeader
          eyebrow="TABLEAU DE BORD EXÉCUTIF"
          title="BIENVENUE, ADMIN PROS 👋"
          description="Aperçu analytique en temps réel des ventes, commandes et performances commerciales au Sénégal."
          secondaryActions={
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 transition-colors text-black cursor-pointer flex items-center justify-center font-sans"
              title="Actualiser les données"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-pros-gold' : ''} />
            </button>
          }
          primaryAction={
            <PeriodSelector value={period} onChange={setPeriod} />
          }
        />

        {/* Refresh Confirmation Toast */}
        {refreshToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 font-sans shadow-sm">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Tableau de bord actualisé avec les données transactionnelles en temps réel.</span>
          </div>
        )}

        {/* Error State Handler */}
        {hasError && (
          <div className="p-8 bg-red-50 border border-red-200 text-center space-y-4 font-sans">
            <AlertTriangle className="mx-auto text-red-600" size={36} />
            <h3 className="font-display font-bold text-lg text-red-900 uppercase">IMPOSSIBLE DE CHARGER LES DONNÉES</h3>
            <p className="text-xs text-red-700">Une erreur est survenue lors de la récupération des métriques transactionnelles.</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2.5 bg-red-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-colors inline-flex items-center gap-2 cursor-pointer font-sans"
            >
              <RotateCcw size={14} />
              <span>RÉESSAYER</span>
            </button>
          </div>
        )}

        {!hasError && dashboardData && (
          <>
            {/* 6 Dynamic KPI Cards */}
            <DashboardKpis metrics={dashboardData.metrics} />

            {/* Sales Chart & Category Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <SalesChart series={dashboardData.sales} />
              </div>

              <div className="lg:col-span-4">
                <CategoryBreakdown categories={dashboardData.categories} />
              </div>
            </div>

            {/* Grid: Recent Orders & Stock Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <RecentOrdersWidget orders={dashboardData.recentOrders} />
              </div>

              <div className="lg:col-span-4 space-y-6">
                <QuickActionsWidget />
                <LowStockWidget items={dashboardData.lowStock} />
              </div>
            </div>

            {/* Platform Audit Activity Feed */}
            <ActivityFeedWidget activities={dashboardData.activity} />
          </>
        )}

      </div>
    </AdminLayout>
  );
};
