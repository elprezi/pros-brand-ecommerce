import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Layers, Tag, BarChart3, Settings, ShieldAlert } from 'lucide-react';

interface AdminModule {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  available: boolean;
}

export const AdminSidebar: React.FC = () => {
  const location = useLocation();

  const modules: AdminModule[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin', available: true },
    { name: 'Produits', icon: Package, path: '/admin/products', available: false },
    { name: 'Commandes', icon: ShoppingBag, path: '/admin/orders', available: false },
    { name: 'Clients', icon: Users, path: '/admin/customers', available: false },
    { name: 'Stock', icon: Layers, path: '/admin/stock', available: false },
    { name: 'Promotions', icon: Tag, path: '/admin/promotions', available: false },
    { name: 'Collections', icon: Layers, path: '/admin/collections', available: false },
    { name: 'Analytics', icon: BarChart3, path: '/admin/analytics', available: false },
    { name: 'Paramètres', icon: Settings, path: '/admin/settings', available: false },
  ];

  return (
    <aside className="w-64 bg-neutral-950 border-r border-white/10 p-6 flex flex-col justify-between min-h-screen">
      <div className="space-y-8">
        {/* Brand Header */}
        <Link to="/" className="block">
          <img src="/brand/logo-pros-white.svg" alt="PROS ADMIN" className="h-10 w-auto object-contain" />
          <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-bold bg-pros-gold text-black uppercase tracking-widest">
            PANNEAU DE CONTRÔLE
          </span>
        </Link>

        {/* Navigation Modules */}
        <nav className="space-y-1">
          {modules.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <div key={item.name} className="relative group">
                <Link
                  to={item.available ? item.path : '#'}
                  className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white border-l-2 border-pros-sand'
                      : item.available
                      ? 'text-white/70 hover:bg-white/5 hover:text-white'
                      : 'text-white/30 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {!item.available && (
                    <span className="text-[8px] bg-white/10 text-white/50 px-1.5 py-0.5 uppercase tracking-widest font-mono">
                      Phase 2
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-white/10 text-[10px] text-white/40 font-mono uppercase">
        PROS PLATFORM v1.0.0 (PHASE 1)
      </div>
    </aside>
  );
};
