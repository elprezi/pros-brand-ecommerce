import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Grid,
  Boxes,
  Warehouse,
  Star,
  Tag,
  Users,
  ShieldCheck,
  MapPin,
  Megaphone,
  Image as ImageIcon,
  Award,
  BarChart3,
  Landmark,
  RotateCcw,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useStore } from '../../store/storeContext';
import { useAuth } from '../../store/authContext';
import type { Permission } from '../../types/rbac';

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: any;
  requiredPermission?: Permission;
  badge?: number;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen = false,
  onMobileClose = () => {},
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders, products } = useStore();
  const { hasPermission } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'recue' || o.status === 'preparation'
  ).length;

  const lowStockCount = products.filter((p) => {
    return Object.values(p.stockPerSize || {}).some((qty) => qty <= 3);
  }).length;

  const handleLogout = () => {
    localStorage.removeItem('pros_user_role');
    localStorage.removeItem('pros_user_name');
    navigate('/auth/login');
  };

  const navGroups: NavGroup[] = [
    {
      title: 'BOUTIQUE',
      items: [
        { name: 'Tableau de bord', path: '/admin', icon: LayoutDashboard, requiredPermission: 'VIEW_DASHBOARD' },
        { name: 'Commandes', path: '/admin/orders', icon: ShoppingBag, requiredPermission: 'VIEW_ORDERS', badge: pendingOrdersCount },
        { name: 'Produits', path: '/admin/products', icon: Package, requiredPermission: 'VIEW_PRODUCTS' },
        { name: 'Catégories', path: '/admin/categories', icon: Layers, requiredPermission: 'VIEW_CATEGORIES' },
        { name: 'Collections', path: '/admin/collections', icon: Grid, requiredPermission: 'VIEW_COLLECTIONS' },
        { name: 'Variantes & SKUs', path: '/admin/variants', icon: Boxes, requiredPermission: 'VIEW_VARIANTS' },
        { name: 'Stock & Inventaire', path: '/admin/inventory', icon: Warehouse, requiredPermission: 'VIEW_INVENTORY', badge: lowStockCount, badgeColor: 'bg-amber-500' },
        { name: 'Avis clients', path: '/admin/reviews', icon: Star, requiredPermission: 'VIEW_REVIEWS' },
        { name: 'Coupons & Promos', path: '/admin/coupons', icon: Tag, requiredPermission: 'VIEW_COUPONS' },
      ],
    },
    {
      title: 'CLIENTS',
      items: [
        { name: 'Clients', path: '/admin/customers', icon: Users, requiredPermission: 'VIEW_CUSTOMERS' },
        { name: 'Groupes & Rôles', path: '/admin/roles', icon: ShieldCheck, requiredPermission: 'VIEW_ROLES' },
        { name: 'Adresses de livraison', path: '/admin/addresses', icon: MapPin, requiredPermission: 'VIEW_DELIVERY_ADDRESSES' },
      ],
    },
    {
      title: 'MARKETING & CMS',
      items: [
        { name: 'Centre Marketing & CMS', path: '/admin/marketing', icon: Megaphone, requiredPermission: 'VIEW_CMS' },
        { name: 'Bibliothèque d\'Images', path: '/admin/media-library', icon: ImageIcon, requiredPermission: 'VIEW_CMS' },
        { name: 'Parrainage & PROS Club', path: '/admin/loyalty', icon: Award, requiredPermission: 'VIEW_CMS' },
      ],
    },
    {
      title: 'ANALYTIQUE',
      items: [
        { name: 'Centre Analytique', path: '/admin/analytics', icon: BarChart3, requiredPermission: 'VIEW_REPORTS' },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Comptabilité & Finance', path: '/admin/accounting', icon: Landmark, requiredPermission: 'VIEW_REPORTS' },
        { name: 'Remboursements', path: '/admin/refunds', icon: RotateCcw, requiredPermission: 'VIEW_REPORTS' },
      ],
    },
    {
      title: 'PARAMÈTRES',
      items: [
        { name: 'Général & Boutique', path: '/admin/settings', icon: Settings, requiredPermission: 'VIEW_DASHBOARD' },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-pros-black text-white font-sans border-r border-white/10 select-none">
      {/* Sidebar Header with LOGOPROS logo */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/brand/LOGOPROS.png"
            alt="PROS"
            className="h-7 w-auto max-h-8 max-w-[130px] object-contain invert brightness-200"
          />
        </Link>

        {/* Collapsible toggle desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
          title={isCollapsed ? 'Développer la sidebar' : 'Réduire la sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Mobile close trigger */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 text-white/60 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-5 py-2.5 bg-white/5 border-b border-white/5 text-[9px] uppercase tracking-widest text-pros-sand font-bold">
          PANNEAU D'ADMINISTRATION PROS
        </div>
      )}

      {/* Navigation Groups (Times New Roman font-sans) */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => !item.requiredPermission || hasPermission(item.requiredPermission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 font-sans">
                  {group.title}
                </h3>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/admin/settings'
                  ? location.pathname.startsWith('/admin/settings')
                  : item.path === '/admin/analytics'
                  ? location.pathname.startsWith('/admin/analytics') || location.pathname === '/admin/reports' || location.pathname === '/admin/statistics'
                  : item.path === '/admin/marketing'
                  ? location.pathname.startsWith('/admin/marketing')
                  : location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onMobileClose}
                    className={`flex items-center justify-between px-3 py-2.5 rounded text-xs font-sans transition-all ${
                      isActive
                        ? 'bg-white text-black font-bold shadow-md'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isActive ? 'text-black' : 'text-white/80'} />
                      {!isCollapsed && <span className="font-sans font-medium">{item.name}</span>}
                    </div>

                    {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full ${
                          item.badgeColor || 'bg-pros-gold text-black'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/10 bg-black/40 font-sans">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-pros-gold text-black font-extrabold flex items-center justify-center text-xs">
                OS
              </div>
              <div className="text-[11px] leading-tight font-sans">
                <div className="font-bold text-white uppercase">Ousmane Sonko</div>
                <div className="text-[9px] text-green-400 font-bold">ADMIN SUPRÊME</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-white/60 hover:text-red-400 transition-colors"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 text-white/60 hover:text-red-400"
            title="Déconnexion"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 h-screen z-30 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/70 backdrop-blur-sm flex">
          <div className="w-72 h-full bg-pros-black animate-slide-right">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onMobileClose} />
        </div>
      )}
    </>
  );
};
