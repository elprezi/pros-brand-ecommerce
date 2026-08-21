import React, { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AdminSidebar } from '../admin/AdminSidebar';
import { AdminCommandPalette } from '../admin/AdminCommandPalette';
import { Search, Bell, Menu, Check, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/storeContext';
import { useAuth } from '../../store/authContext';
import { getDashboardData, type AdminNotification } from '../../lib/admin/analytics/dashboard';
import type { Permission } from '../../types/rbac';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { orders, products } = useStore();
  const { currentUser, hasPermission } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Real dashboard data & notifications
  const dashboardData = useMemo(() => getDashboardData(orders, products), [orders, products]);
  const [notifications, setNotifications] = useState<AdminNotification[]>(dashboardData.notifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/admin') return 'TABLEAU DE BORD PRINCIPAL';
    if (p.includes('/admin/products')) return 'GESTION DU CATALOGUE PRODUITS';
    if (p.includes('/admin/orders')) return 'GESTION DES COMMANDES';
    if (p.includes('/admin/categories')) return 'GESTION DES CATÉGORIES';
    if (p.includes('/admin/collections')) return 'GESTION DES COLLECTIONS';
    if (p.includes('/admin/variants')) return 'GESTION DES VARIANTES & SKUS';
    if (p.includes('/admin/inventory')) return 'GESTION ET ALERTES DE STOCK';
    if (p.includes('/admin/reviews')) return 'MODÉRATION DES AVIS CLIENTS';
    if (p.includes('/admin/coupons')) return 'CODES PROMOTIONNELS & COUPONS';
    if (p.includes('/admin/customers')) return 'GESTION DE LA CLIENTÈLE';
    if (p.includes('/admin/roles')) return 'PERMISSIONS & RÔLES UTILISATEURS';
    if (p.includes('/admin/addresses')) return 'CARTE DES ADRESSES DE LIVRAISON';
    if (p.includes('/admin/marketing')) return 'MARKETING & COMMUNICATION';
    if (p.includes('/admin/analytics')) return 'ANALYTIQUE & PERFORMANCE VENTES';
    if (p.includes('/admin/reports')) return 'RAPPORTS & EXPORTS DE DONNÉES';
    if (p.includes('/admin/statistics')) return 'STATISTIQUES AVANCÉES';
    if (p.includes('/admin/settings')) return 'RÉGLAGES ET CONFIGURATION';
    return 'PANNEAU D’ADMINISTRATION';
  };

  const getRequiredPermissionForPath = (path: string): Permission | null => {
    if (path === '/admin') return 'VIEW_DASHBOARD';
    if (path.includes('/admin/products')) return 'VIEW_PRODUCTS';
    if (path.includes('/admin/orders')) return 'VIEW_ORDERS';
    if (path.includes('/admin/categories')) return 'VIEW_CATEGORIES';
    if (path.includes('/admin/collections')) return 'VIEW_COLLECTIONS';
    if (path.includes('/admin/variants')) return 'VIEW_VARIANTS';
    if (path.includes('/admin/inventory')) return 'VIEW_INVENTORY';
    if (path.includes('/admin/reviews')) return 'VIEW_REVIEWS';
    if (path.includes('/admin/coupons')) return 'VIEW_COUPONS';
    if (path.includes('/admin/customers')) return 'VIEW_CUSTOMERS';
    if (path.includes('/admin/addresses')) return 'VIEW_DELIVERY_ADDRESSES';
    if (path.includes('/admin/marketing/homepage')) return 'VIEW_CMS';
    if (path.includes('/admin/marketing/media')) return 'VIEW_MEDIA';
    if (path.includes('/admin/marketing/banners')) return 'VIEW_BANNERS';
    if (path.includes('/admin/marketing/communications')) return 'VIEW_COMMUNICATIONS';
    if (path.includes('/admin/roles')) return 'VIEW_ROLES';
    if (path.includes('/admin/reports') || path.includes('/admin/analytics') || path.includes('/admin/statistics')) return 'VIEW_REPORTS';
    if (path.includes('/admin/settings/logs')) return 'VIEW_AUDIT_LOGS';
    return null;
  };

  const requiredPerm = getRequiredPermissionForPath(location.pathname);
  const isAccessDenied = requiredPerm ? !hasPermission(requiredPerm) : false;

  return (
    <div className="min-h-screen bg-white text-pros-black font-sans selection:bg-pros-sand selection:text-black">
      {/* Signature Dark Sidebar */}
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Light Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen font-sans">
        {/* Topbar (Light UI) */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-sm font-sans">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden text-black hover:text-neutral-600 p-1"
            >
              <Menu size={22} />
            </button>

            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-neutral-500">
                ADMINISTRATION PROS
              </span>
              <h1 className="font-display font-bold text-sm sm:text-base tracking-superwide uppercase text-pros-black">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 font-sans">
            {/* Global Search Triggering ⌘K Palette */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-3 bg-pros-bone border border-neutral-300 text-neutral-600 hover:text-black px-3 py-1.5 text-xs transition-colors cursor-pointer font-sans"
            >
              <Search size={14} />
              <span>Rechercher...</span>
              <kbd className="bg-white text-black px-1.5 py-0.5 text-[9px] font-mono border border-neutral-300 shadow-sm">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="sm:hidden text-black p-1.5"
            >
              <Search size={18} />
            </button>

            {/* Notification Center Popover Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-neutral-700 hover:text-black transition-colors relative cursor-pointer font-sans"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                  </>
                )}
              </button>

              {/* Notification Center Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-neutral-300 shadow-2xl z-50 p-4 space-y-3 font-sans">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200 font-sans">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-xs uppercase text-black">CENTRE DE NOTIFICATIONS</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                          {unreadCount} NOUVEAU(X)
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-neutral-500 hover:text-black underline font-bold uppercase font-sans"
                      >
                        TOUT MARQUER COMME LU
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto space-y-2 font-sans">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-neutral-500 font-sans">
                        Aucune notification non lue.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 space-y-1 transition-colors ${n.read ? 'bg-white opacity-70' : 'bg-pros-bone border-l-2 border-pros-black'}`}
                        >
                          <div className="flex justify-between items-center text-xs font-bold text-black font-sans">
                            <span className="flex items-center gap-1.5">
                              {n.type === 'order' && <ShoppingBag size={12} className="text-black" />}
                              {n.type === 'stock' && <AlertTriangle size={12} className="text-amber-600" />}
                              {n.title}
                            </span>
                            {!n.read && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="text-neutral-400 hover:text-black"
                                title="Marquer comme lu"
                              >
                                <Check size={12} />
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-600 font-sans">{n.message}</p>
                          <div className="text-[9px] text-neutral-400 font-mono pt-1">{n.time}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-200 text-center font-sans">
                    <Link
                      to="/admin/settings/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-xs text-black font-bold hover:text-pros-gold uppercase tracking-wider font-sans"
                    >
                      VOIR TOUTES LES NOTIFICATIONS &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-neutral-200 font-sans">
              <div className="w-7 h-7 bg-pros-black text-white font-extrabold flex items-center justify-center text-[11px] font-sans">
                {currentUser?.firstName?.charAt(0) || 'A'}{currentUser?.lastName?.charAt(0) || 'P'}
              </div>
              <div className="hidden sm:block text-left font-sans">
                <div className="text-[11px] font-bold uppercase leading-none text-pros-black font-sans">
                  {currentUser?.firstName} {currentUser?.lastName}
                </div>
                <div className="text-[9px] text-emerald-600 font-sans font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {currentUser?.role}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Light Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 space-y-8 bg-white font-sans">
          {isAccessDenied ? (
            /* 403 FORBIDDEN SCREEN */
            <div className="p-12 bg-red-50 border border-red-200 text-center space-y-4 max-w-2xl mx-auto my-12 font-sans shadow-md">
              <div className="w-16 h-16 bg-red-100 border border-red-300 text-red-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold font-mono">
                403
              </div>
              <h2 className="font-display font-extrabold text-2xl text-red-900 uppercase tracking-wider">
                ACCÈS REFUSÉ / PERMISSION INSUFFISANTE
              </h2>
              <p className="text-xs text-red-800 leading-relaxed font-sans">
                Vous ne possédez pas la permission <code>{requiredPerm}</code> nécessaire pour accéder à ce module d'administration.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <Link
                  to="/admin"
                  className="px-5 py-2.5 bg-pros-black text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 font-sans inline-block"
                >
                  RETOURNER AU DASHBOARD
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      <AdminCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};
