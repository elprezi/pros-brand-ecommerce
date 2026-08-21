import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  ShoppingBag,
  ArrowRight,
  Tag,
  Settings,
  Layers,
  Users,
  DollarSign,
  RotateCcw,
  MessageSquare,
  ShieldCheck,
  FileText,
  X,
} from 'lucide-react';
import { useStore } from '../../store/storeContext';
import { useAuth } from '../../store/authContext';
import { apiGetRefunds } from '../../lib/server/accountingApi';
import type { RefundRecord } from '../../types/international';
import type { Permission } from '../../types/rbac';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FlatSearchResult {
  id: string;
  category: 'RACCOURCIS' | 'PRODUITS' | 'COMMANDES' | 'CLIENTS' | 'REMBOURSEMENTS' | 'COUPONS';
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  badgeColor?: string;
  path: string;
  icon?: any;
  image?: string;
}

export const AdminCommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { products, orders, customers, promoCodes, formatPrice } = useStore();
  const { hasPermission } = useAuth();

  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Refunds from single source of truth
  const refunds: RefundRecord[] = useMemo(() => {
    try {
      return apiGetRefunds();
    } catch {
      return [];
    }
  }, [isOpen]);

  // Debounce input (Section 2 & 9)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(rawQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  // Focus input on open & keyboard listener (Section 6)
  useEffect(() => {
    if (isOpen) {
      setRawQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Defined Navigation Shortcuts (Section 3 & 10)
  const allShortcuts = useMemo(() => {
    const shortcuts: Array<{ label: string; path: string; icon: any; permission: Permission | null; categoryName: string }> = [
      { label: 'Publier / Gérer les Produits', path: '/admin/products', icon: Package, permission: 'VIEW_PRODUCTS', categoryName: 'Catalogue' },
      { label: 'Gestion des Commandes Clients', path: '/admin/orders', icon: ShoppingBag, permission: 'VIEW_ORDERS', categoryName: 'Ventes' },
      { label: 'Gestion et Alertes de Stock', path: '/admin/inventory', icon: Layers, permission: 'VIEW_INVENTORY', categoryName: 'Stock' },
      { label: 'Comptabilité & Synthèse Finance', path: '/admin/accounting', icon: DollarSign, permission: 'VIEW_REPORTS', categoryName: 'Finance' },
      { label: 'Remboursements & Avoirs Clients', path: '/admin/refunds', icon: RotateCcw, permission: 'VIEW_ORDERS', categoryName: 'Finance' },
      { label: 'Gestion de la Clientèle (CRM)', path: '/admin/customers', icon: Users, permission: 'VIEW_CUSTOMERS', categoryName: 'Clients' },
      { label: 'Promotions & Codes Coupons', path: '/admin/coupons', icon: Tag, permission: 'VIEW_COUPONS', categoryName: 'Marketing' },
      { label: 'Modération des Avis Clients', path: '/admin/reviews', icon: MessageSquare, permission: 'VIEW_REVIEWS', categoryName: 'Modération' },
      { label: 'Permissions & Rôles Utilisateurs', path: '/admin/roles', icon: ShieldCheck, permission: 'VIEW_ROLES', categoryName: 'Sécurité' },
      { label: 'Journal des Logs d\'Audit', path: '/admin/settings/logs', icon: FileText, permission: 'VIEW_AUDIT_LOGS', categoryName: 'Audit' },
      { label: 'Réglages & Configuration du Site', path: '/admin/settings', icon: Settings, permission: null, categoryName: 'Général' },
    ];

    // Filter shortcuts by RBAC permissions (Section 10)
    return shortcuts.filter((s) => !s.permission || hasPermission(s.permission));
  }, [hasPermission]);

  const q = debouncedQuery.toLowerCase().trim();

  // Search Filtering across REAL Data (Section 1, 4, 8)
  const filteredShortcuts = useMemo(() => {
    if (!q) return allShortcuts.slice(0, 6);
    return allShortcuts.filter(
      (s) => s.label.toLowerCase().includes(q) || s.categoryName.toLowerCase().includes(q)
    );
  }, [allShortcuts, q]);

  const canViewProducts = hasPermission('VIEW_PRODUCTS');
  const matchingProducts = useMemo(() => {
    if (!canViewProducts || !q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subCategory.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.material && p.material.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [products, q, canViewProducts]);

  const canViewOrders = hasPermission('VIEW_ORDERS');
  const matchingOrders = useMemo(() => {
    if (!canViewOrders || !q) return [];
    return orders
      .filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.trackingNumber.toLowerCase().includes(q) ||
          `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q) ||
          o.customer.phone.includes(q)
      )
      .slice(0, 5);
  }, [orders, q, canViewOrders]);

  const canViewCustomers = hasPermission('VIEW_CUSTOMERS');
  const matchingCustomers = useMemo(() => {
    if (!canViewCustomers || !q) return [];
    return customers
      .filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.city && c.city.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [customers, q, canViewCustomers]);

  const matchingRefunds = useMemo(() => {
    if (!canViewOrders || !q) return [];
    return refunds
      .filter(
        (r) =>
          r.refundNumber.toLowerCase().includes(q) ||
          r.trackingNumber.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerEmail.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [refunds, q, canViewOrders]);

  const canViewCoupons = hasPermission('VIEW_COUPONS');
  const matchingCoupons = useMemo(() => {
    if (!canViewCoupons || !q) return [];
    return promoCodes
      .filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [promoCodes, q, canViewCoupons]);

  // Flatten active results for Keyboard Navigation (Section 6)
  const flatResults = useMemo<FlatSearchResult[]>(() => {
    const list: FlatSearchResult[] = [];

    // 1. Shortcuts
    filteredShortcuts.forEach((s) => {
      list.push({
        id: `sc-${s.path}`,
        category: 'RACCOURCIS',
        title: s.label,
        subtitle: `Navigation directe • ${s.categoryName}`,
        path: s.path,
        icon: s.icon,
      });
    });

    // 2. Products
    matchingProducts.forEach((p) => {
      const img = p.colors?.[0]?.images?.[0] || '';
      list.push({
        id: `prod-${p.id}`,
        category: 'PRODUITS',
        title: p.name,
        subtitle: `${p.category.toUpperCase()} • ${p.subCategory.toUpperCase()}`,
        meta: formatPrice(p.price),
        path: `/admin/products?search=${encodeURIComponent(p.name)}`,
        image: img,
      });
    });

    // 3. Orders
    matchingOrders.forEach((o) => {
      list.push({
        id: `ord-${o.id}`,
        category: 'COMMANDES',
        title: `${o.trackingNumber} — ${o.customer.firstName} ${o.customer.lastName}`,
        subtitle: `${o.items.length} article(s) • ${o.customer.city || 'Dakar'}, ${o.customer.country || 'Sénégal'}`,
        meta: formatPrice(o.total),
        badge: o.status.toUpperCase(),
        badgeColor: o.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800',
        path: `/admin/orders?search=${encodeURIComponent(o.trackingNumber)}`,
      });
    });

    // 4. Customers
    matchingCustomers.forEach((c) => {
      list.push({
        id: `cust-${c.id}`,
        category: 'CLIENTS',
        title: `${c.firstName} ${c.lastName}`,
        subtitle: `${c.email} • ${c.phone || 'Sans tel'} • ${c.city || 'Dakar'}`,
        path: `/admin/customers?search=${encodeURIComponent(c.email)}`,
        icon: Users,
      });
    });

    // 5. Refunds
    matchingRefunds.forEach((r) => {
      list.push({
        id: `ref-${r.id}`,
        category: 'REMBOURSEMENTS',
        title: `${r.refundNumber} (${r.trackingNumber})`,
        subtitle: `Client: ${r.customerName} • Motif: ${r.reason}`,
        meta: formatPrice(r.refundAmount),
        badge: r.status,
        badgeColor: r.status === 'EXECUTE' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-blue-950 text-blue-300 border-blue-800',
        path: `/admin/refunds?search=${encodeURIComponent(r.refundNumber)}`,
      });
    });

    // 6. Coupons
    matchingCoupons.forEach((cp) => {
      list.push({
        id: `cp-${cp.id}`,
        category: 'COUPONS',
        title: `${cp.code} — ${cp.name}`,
        subtitle: cp.discountType === 'PERCENTAGE' ? `Remise ${cp.discountValue}%` : `Remise ${formatPrice(cp.discountValue)}`,
        path: `/admin/coupons?search=${encodeURIComponent(cp.code)}`,
        icon: Tag,
      });
    });

    return list;
  }, [filteredShortcuts, matchingProducts, matchingOrders, matchingCustomers, matchingRefunds, matchingCoupons, formatPrice]);

  // Keyboard navigation handler (Section 6)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatResults[selectedIndex];
      if (target) {
        onClose();
        navigate(target.path);
      }
    }
  };

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-20 px-4 select-none font-sans animate-fade-in">
      <div className="bg-[#0A0A0A] border border-white/20 w-full max-w-3xl overflow-hidden shadow-2xl space-y-0 font-sans text-white">
        
        {/* INPUT HEADER */}
        <div className="relative border-b border-white/10 p-4 flex items-center gap-3 bg-black">
          <Search className="text-[#C9A45C] shrink-0" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher des produits, SKU, commandes, clients, factures, remboursements ou raccourcis (⌘K)..."
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none font-sans font-medium"
          />
          {rawQuery && (
            <button
              onClick={() => {
                setRawQuery('');
                setDebouncedQuery('');
              }}
              className="text-white/40 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 text-xs font-mono border border-white/10 px-2 flex items-center gap-1"
          >
            <span>ESC</span>
          </button>
        </div>

        {/* CONTENT & RESULTS BODY */}
        <div ref={listRef} className="max-h-[65vh] overflow-y-auto p-4 space-y-6 font-sans text-xs">
          
          {/* SEARCH ACTIVE RESULTS */}
          {q ? (
            flatResults.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="text-white/40 font-mono text-xs uppercase">AUCUN RÉSULTAT TROUVÉ POUR « {debouncedQuery} »</div>
                <p className="text-[11px] text-white/30 font-sans">
                  Vérifiez l'orthographe ou recherchez un N° de commande, un email client ou une référence de produit.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group by Categories */}
                {['RACCOURCIS', 'PRODUITS', 'COMMANDES', 'CLIENTS', 'REMBOURSEMENTS', 'COUPONS'].map((catKey) => {
                  const catResults = flatResults.filter((r) => r.category === catKey);
                  if (catResults.length === 0) return null;

                  return (
                    <div key={catKey} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-[#C9A45C] border-b border-white/10 pb-1">
                        <span>{catKey} ({catResults.length})</span>
                      </div>

                      <div className="space-y-1">
                        {catResults.map((item) => {
                          const flatIdx = flatResults.findIndex((r) => r.id === item.id);
                          const isSelected = flatIdx === selectedIndex;
                          const IconComp = item.icon || Package;

                          return (
                            <div
                              key={item.id}
                              onClick={() => handleNavigate(item.path)}
                              onMouseEnter={() => setSelectedIndex(flatIdx)}
                              className={`w-full flex items-center justify-between p-2.5 transition-colors cursor-pointer border ${
                                isSelected
                                  ? 'bg-white/15 border-[#C9A45C] text-white font-bold'
                                  : 'bg-white/5 border-transparent text-white/90 hover:bg-white/10'
                              }`}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                {item.image ? (
                                  <img src={item.image} alt={item.title} className="w-8 h-10 object-cover border border-white/10 shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center shrink-0">
                                    <IconComp size={16} className="text-[#C9A45C]" />
                                  </div>
                                )}

                                <div className="truncate">
                                  <div className="font-bold text-xs uppercase text-white truncate flex items-center gap-2">
                                    <span>{item.title}</span>
                                    {item.badge && (
                                      <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold border uppercase ${item.badgeColor || 'bg-white/10 text-white'}`}>
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  {item.subtitle && (
                                    <div className="text-[10px] text-white/50 truncate font-sans">{item.subtitle}</div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 ml-2">
                                {item.meta && (
                                  <span className="font-mono font-bold text-xs text-white">{item.meta}</span>
                                )}
                                <ArrowRight size={14} className={isSelected ? 'text-[#C9A45C]' : 'text-white/30'} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* DEFAULT INITIAL STATE (WHEN SEARCH IS EMPTY) */
            <div className="space-y-6">
              
              {/* REAL DATABASE STATS SUMMARY */}
              <div className="p-3 bg-white/5 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-mono">
                <div>
                  <span className="text-white/40 text-[9px] uppercase block">PRODUITS CATALOGUE</span>
                  <strong className="text-white font-bold text-base">{products.length}</strong>
                </div>
                <div>
                  <span className="text-white/40 text-[9px] uppercase block">COMMANDES CLIENTS</span>
                  <strong className="text-white font-bold text-base">{orders.length}</strong>
                </div>
                <div>
                  <span className="text-white/40 text-[9px] uppercase block">CLIENTS INSCRITS</span>
                  <strong className="text-white font-bold text-base">{customers.length}</strong>
                </div>
                <div>
                  <span className="text-white/40 text-[9px] uppercase block">DOSSIERS REMBOURSEMENT</span>
                  <strong className="text-white font-bold text-base">{refunds.length}</strong>
                </div>
              </div>

              {/* QUICK SHORTCUTS GRID (SECTION 3) */}
              <div className="space-y-2">
                <div className="text-[10px] text-[#C9A45C] uppercase tracking-widest font-mono font-bold">
                  RACCOURCIS & NAVIGATION RAPIDE
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredShortcuts.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between p-3 border transition-colors text-left cursor-pointer font-sans ${
                          isSelected
                            ? 'bg-white/15 border-[#C9A45C] text-white'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={16} className="text-[#C9A45C]" />
                          <span className="font-bold text-xs font-sans">{item.label}</span>
                        </div>
                        <ArrowRight size={14} className="text-white/40" />
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* FOOTER KEYBOARD HINT (SECTION 6) */}
        <div className="p-3 bg-black border-t border-white/10 flex flex-wrap justify-between items-center text-[10px] text-white/40 font-mono gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white/10 border border-white/20 text-white font-bold">↑</kbd>
              <kbd className="px-1 bg-white/10 border border-white/20 text-white font-bold">↓</kbd>
              <span>NAVIGUER</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white/10 border border-white/20 text-white font-bold">↵</kbd>
              <span>SÉLECTIONNER</span>
            </span>
          </div>
          <span>PROS GLOBAL SEARCH ENGINE</span>
        </div>

      </div>
    </div>
  );
};
