import React from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Users, PackageCheck, BarChart3 } from 'lucide-react';
import { AdminKpiCard } from '../AdminKpiCard';
import type { DashboardMetrics } from '../../../lib/admin/analytics/dashboard';
import { useStore } from '../../../store/storeContext';

interface DashboardKpisProps {
  metrics: DashboardMetrics;
}

export const DashboardKpis: React.FC<DashboardKpisProps> = ({ metrics }) => {
  const { formatPrice } = useStore();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 font-sans">
      <AdminKpiCard
        title="CHIFFRE D'AFFAIRES"
        value={formatPrice(metrics.totalSales)}
        change={metrics.salesChange}
        comparison="vs période précédente"
        icon={DollarSign}
        isPositive={metrics.isSalesPositive}
      />

      <AdminKpiCard
        title="COMMANDES"
        value={String(metrics.totalOrders)}
        change={metrics.ordersChange}
        comparison="vs période précédente"
        icon={ShoppingBag}
        isPositive={metrics.isOrdersPositive}
      />

      <AdminKpiCard
        title="PANIER MOYEN"
        value={formatPrice(metrics.averageOrderValue)}
        change={metrics.aovChange}
        comparison="vs période précédente"
        icon={TrendingUp}
        isPositive={metrics.isAovPositive}
      />

      <AdminKpiCard
        title="NOUVEAUX CLIENTS"
        value={String(metrics.newCustomersCount)}
        change={metrics.customersChange}
        comparison="vs période précédente"
        icon={Users}
        isPositive={metrics.isCustomersPositive}
      />

      <AdminKpiCard
        title="PRODUITS VENDUS"
        value={`${metrics.itemsSold} pièces`}
        change={metrics.itemsSoldChange}
        comparison="vs période précédente"
        icon={PackageCheck}
        isPositive={metrics.isItemsPositive}
      />

      {/* Taux de conversion avec affichage N/D et explication */}
      <div className="bg-white border border-neutral-200 p-5 space-y-3 font-sans shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center text-neutral-500 text-[10px] uppercase font-bold tracking-wider">
          <span>TAUX DE CONVERSION</span>
          <BarChart3 size={16} className="text-pros-black" />
        </div>
        <div className="font-display font-bold text-xl text-neutral-700 tracking-tight">
          {metrics.conversionRate}
        </div>
        <div className="pt-2 border-t border-neutral-100 text-[9px] text-neutral-400 font-bold">
          {metrics.conversionRateExplanation}
        </div>
      </div>
    </div>
  );
};
