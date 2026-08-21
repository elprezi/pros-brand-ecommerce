import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { useStore } from '../../store/storeContext';
import { auditCustomersData } from '../../lib/server/customerAudit';
import type { CustomerUser, UserRole, UserStatus, CustomerSegment } from '../../types/ecommerce';
import {
  User,
  Plus,
  Search,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  RotateCcw,
  Mail,
  MapPin,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Award,
} from 'lucide-react';

export const AdminCustomersPage: React.FC = () => {
  const { customers, orders, reviews, addresses, addCustomer, updateCustomer, deleteCustomer, toggleCustomerBlockStatus, setDefaultDeliveryAddress, toggleAddressActiveStatus, formatPrice } = useStore();
  const navigate = useNavigate();

  // Search, Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | 'all'>('all');
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'none' | '1+' | '3+' | '5+'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'orders-desc' | 'spent-desc' | 'last-order'>('newest');

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerUser | null>(null);
  const [active360Customer, setActive360Customer] = useState<CustomerUser | null>(null);
  const [active360Tab, setActive360Tab] = useState<'identity' | 'addresses' | 'orders' | 'reviews' | 'coupons' | 'products'>('identity');
  const [customerToDelete, setCustomerToDelete] = useState<CustomerUser | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Automatic Data Audit
  useEffect(() => {
    auditCustomersData(customers, orders, reviews);
  }, [customers, orders, reviews]);

  // Customer Form State
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    country: string;
    role: UserRole;
    status: UserStatus;
    notes: string;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Dakar',
    region: 'Dakar',
    country: 'Sénégal',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    notes: '',
  });

  // Calculate Extended Customer Metrics (Orders, Total Spent, Last Order, Segment) dynamically from database
  const getCustomerMetrics = (c: CustomerUser) => {
    const emailLower = c.email.toLowerCase().trim();
    const customerOrders = orders.filter((o) => o.customer.email.toLowerCase().trim() === emailLower);
    
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

    let segment: CustomerSegment = 'PROSPECT';
    if (totalOrders >= 6) segment = 'CLIENT PREMIUM';
    else if (totalOrders >= 3) segment = 'CLIENT FIDÈLE';
    else if (totalOrders >= 1) segment = 'CLIENT';

    const customerReviews = reviews.filter((r) => r.customerEmail.toLowerCase().trim() === emailLower);
    const avgRatingGiven = customerReviews.length > 0
      ? (customerReviews.reduce((sum, r) => sum + r.rating, 0) / customerReviews.length).toFixed(1)
      : 'N/A';

    return { customerOrders, totalOrders, totalSpent, avgOrderValue, segment, customerReviews, avgRatingGiven };
  };

  // Real-time KPI Stats
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === 'ACTIVE').length;
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();
    const newCustomers = customers.filter((c) => new Date(c.createdAt).getTime() >= thirtyDaysAgo).length;

    let totalRevenue = 0;
    let customersWithOrders = 0;
    let loyalCustomersCount = 0;

    customers.forEach((c) => {
      const emailLower = c.email.toLowerCase().trim();
      const customerOrders = orders.filter((o) => o.customer.email.toLowerCase().trim() === emailLower);
      const spent = customerOrders.reduce((sum, o) => sum + o.total, 0);
      totalRevenue += spent;
      if (customerOrders.length > 0) customersWithOrders++;
      if (customerOrders.length >= 3) loyalCustomersCount++;
    });

    const globalAvgOrderValue = orders.length > 0
      ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length)
      : 0;

    return { total, active, newCustomers, loyalCustomersCount, totalRevenue, globalAvgOrderValue, customersWithOrders };
  }, [customers, orders]);

  // Filtered & Sorted Customer List
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const query = searchTerm.toLowerCase().trim();
        const metrics = getCustomerMetrics(c);

        const matchesSearch =
          !query ||
          c.firstName.toLowerCase().includes(query) ||
          c.lastName.toLowerCase().includes(query) ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query) ||
          c.city.toLowerCase().includes(query) ||
          c.id.toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesRole = roleFilter === 'all' || c.role === roleFilter;
        const matchesSegment = segmentFilter === 'all' || metrics.segment === segmentFilter;

        const matchesOrders =
          ordersFilter === 'all' ||
          (ordersFilter === 'none' && metrics.totalOrders === 0) ||
          (ordersFilter === '1+' && metrics.totalOrders >= 1) ||
          (ordersFilter === '3+' && metrics.totalOrders >= 3) ||
          (ordersFilter === '5+' && metrics.totalOrders >= 5);

        return matchesSearch && matchesStatus && matchesRole && matchesSegment && matchesOrders;
      })
      .sort((a, b) => {
        const metricsA = getCustomerMetrics(a);
        const metricsB = getCustomerMetrics(b);

        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'orders-desc') return metricsB.totalOrders - metricsA.totalOrders;
        if (sortBy === 'spent-desc') return metricsB.totalSpent - metricsA.totalSpent;
        if (sortBy === 'last-order') {
          const dateA = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : 0;
          const dateB = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : 0;
          return dateB - dateA;
        }
        return 0;
      });
  }, [customers, orders, reviews, searchTerm, statusFilter, roleFilter, segmentFilter, ordersFilter, sortBy]);

  // Paginated List
  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '+221 ',
      address: '',
      city: 'Dakar',
      region: 'Dakar',
      country: 'Sénégal',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: CustomerUser) => {
    setEditingCustomer(c);
    setFormData({
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      address: c.address || '',
      city: c.city,
      region: c.region,
      country: c.country,
      role: c.role,
      status: c.status,
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) return;

    if (editingCustomer) {
      const updated: CustomerUser = {
        ...editingCustomer,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        region: formData.region,
        country: formData.country,
        role: formData.role,
        status: formData.status,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
      };
      updateCustomer(updated);
      setSuccessMsg(`Fiche de "${formData.firstName} ${formData.lastName}" mise à jour.`);
    } else {
      const newCust: CustomerUser = {
        id: `cust-${Date.now()}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        region: formData.region,
        country: formData.country,
        role: formData.role,
        status: formData.status,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
      };
      addCustomer(newCust);
      setSuccessMsg(`Nouveau membre "${formData.firstName} ${formData.lastName}" créé avec succès.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Toggle Block Status
  const handleToggleBlock = (c: CustomerUser) => {
    toggleCustomerBlockStatus(c.id);
    setSuccessMsg(`Statut de "${c.firstName} ${c.lastName}" mis à jour (${c.status === 'BLOCKED' ? 'Débloqué' : 'Bloqué'}).`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setSuccessMsg(`Membre "${customerToDelete.firstName} ${customerToDelete.lastName}" supprimé.`);
      setCustomerToDelete(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // Bulk CSV Export
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) return;

    const BOM = '\uFEFF';
    const headers = ['ID', 'PRÉNOM', 'NOM', 'EMAIL', 'TÉLÉPHONE', 'VILLE', 'RÉGION', 'COMMANDES', 'TOTAL_DÉPENSÉ_FCFA', 'SEGMENT', 'STATUT', 'RÔLE', 'DATE_INSCRIPTION'];

    const rows = filteredCustomers.map((c) => {
      const m = getCustomerMetrics(c);
      return [
        `"${c.id}"`,
        `"${c.firstName.replace(/"/g, '""')}"`,
        `"${c.lastName.replace(/"/g, '""')}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.city}"`,
        `"${c.region}"`,
        `"${m.totalOrders}"`,
        `"${m.totalSpent}"`,
        `"${m.segment}"`,
        `"${c.status}"`,
        `"${c.role}"`,
        `"${new Date(c.createdAt).toLocaleDateString('fr-FR')}"`,
      ].join(';');
    });

    const csvContent = BOM + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pros_clientele_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Template Download for Import
  const handleDownloadSampleCSV = () => {
    const BOM = '\uFEFF';
    const sample = 'first_name;last_name;email;phone;city;region;address\nOusmane;Sow;ousmane.sow@gmail.com;+221 77 000 11 22;Dakar;Dakar;Point E\nAwa;Diallo;awa.diallo@yahoo.fr;+221 78 333 44 55;Thiès;Thiès;Mbour 2';
    const blob = new Blob([BOM + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele_importation_clients_pros.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Batch CSV Import Handler
  const handleProcessImport = () => {
    if (!importCsvText.trim()) return;

    const lines = importCsvText.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return;

    let addedCount = 0;
    const existingEmails = new Set(customers.map((c) => c.email.toLowerCase().trim()));

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(';').map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length >= 3) {
        const firstName = parts[0] || 'Client';
        const lastName = parts[1] || 'PROS';
        const email = parts[2] || `import-${Date.now()}-${i}@pros.sn`;
        const phone = parts[3] || '+221 ';
        const city = parts[4] || 'Dakar';
        const region = parts[5] || 'Dakar';
        const address = parts[6] || '';

        if (!existingEmails.has(email.toLowerCase())) {
          existingEmails.add(email.toLowerCase());
          addCustomer({
            id: `cust-imp-${Date.now()}-${i}`,
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            region,
            country: 'Sénégal',
            role: 'CUSTOMER',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          });
          addedCount++;
        }
      }
    }

    setSuccessMsg(`Importation terminée : ${addedCount} nouveaux clients importés avec succès.`);
    setIsImportModalOpen(false);
    setImportCsvText('');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const getSegmentBadge = (segment: CustomerSegment) => {
    if (segment === 'CLIENT PREMIUM') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-pros-black text-pros-gold border border-pros-gold/40 uppercase font-sans">★ PREMIUM</span>;
    }
    if (segment === 'CLIENT FIDÈLE') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase font-sans">FIDÈLE</span>;
    }
    if (segment === 'CLIENT') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase font-sans">CLIENT</span>;
    }
    return <span className="px-2 py-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300 uppercase font-sans">PROSPECT</span>;
  };

  const getStatusBadge = (status: UserStatus) => {
    if (status === 'ACTIVE') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase font-sans">ACTIF</span>;
    }
    if (status === 'BLOCKED') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase font-sans">BLOQUÉ</span>;
    }
    return <span className="px-2 py-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300 uppercase font-sans">INACTIF</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="CLIENTÈLE & RELATION CLIENT CRM"
          title="GESTION ET FICHE CLIENT 360°"
          description="Consultez l'historique d'achat centralisé, modérez les comptes membres et suivez la valeur client PROS."
          primaryAction={
            <div className="flex flex-wrap items-center gap-3 font-sans">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                <Upload size={14} />
                <span>IMPORTER CLIENTS</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                <Download size={14} />
                <span>EXPORTER CSV</span>
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md font-sans"
              >
                <Plus size={16} />
                <span>NOUVEAU CLIENT</span>
              </button>
            </div>
          }
        />

        {/* Success Banner */}
        {successMsg && (
          <div className="p-4 bg-green-100 border border-green-300 text-green-900 text-xs font-bold flex items-center justify-between animate-fade-in font-sans">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-green-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* 6 Real-time KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-sans">
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block">TOTAL CLIENTS</span>
            <div className="text-xl font-bold text-black">{stats.total}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider block">ACTIFS</span>
            <div className="text-xl font-bold text-emerald-700">{stats.active}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider block">NOUVEAUX (30J)</span>
            <div className="text-xl font-bold text-blue-700">{stats.newCustomers}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-pros-gold uppercase font-bold tracking-wider block">FIDÈLES / PREMIUM</span>
            <div className="text-xl font-bold text-pros-gold">{stats.loyalCustomersCount}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans col-span-2 sm:col-span-1">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block truncate">CA TOTAL CLIENTS</span>
            <div className="text-base font-bold text-black font-mono truncate">{formatPrice(stats.totalRevenue)}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-3 space-y-1 shadow-sm font-sans col-span-2 sm:col-span-1">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block truncate">PANIER MOYEN</span>
            <div className="text-base font-bold text-black font-mono truncate">{formatPrice(stats.globalAvgOrderValue)}</div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-pros-bone border border-neutral-200 p-4 space-y-4 shadow-sm font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-sans">
            
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">STATUT : TOUS</option>
              <option value="ACTIVE">ACTIFS</option>
              <option value="INACTIVE">INACTIFS</option>
              <option value="BLOCKED">BLOQUÉS</option>
            </select>

            {/* Segment Filter */}
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">SEGMENT : TOUS</option>
              <option value="PROSPECT">PROSPECTS (0 COMMANDE)</option>
              <option value="CLIENT">CLIENTS (1-2 COMMANDES)</option>
              <option value="CLIENT FIDÈLE">FIDÈLES (3-5 COMMANDES)</option>
              <option value="CLIENT PREMIUM">PREMIUM (6+ COMMANDES)</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="newest">PLUS RÉCENTS</option>
              <option value="oldest">PLUS ANCIENS</option>
              <option value="orders-desc">PLUS DE COMMANDES</option>
              <option value="spent-desc">PLUS DÉPENSÉ</option>
              <option value="last-order">DERNIÈRE COMMANDE</option>
            </select>

          </div>
        </div>

        {/* Data Container: Responsive Desktop Table / Mobile Cards */}
        <div className="bg-white border border-neutral-200 shadow-sm font-sans">
          {customers.length === 0 ? (
            /* Official Empty State when customers.length === 0 */
            <div className="p-16 text-center font-sans">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-pros-bone border border-neutral-300 flex items-center justify-center mx-auto text-black">
                  <User size={32} />
                </div>
                <h3 className="font-display font-bold text-xl uppercase text-black">AUCUN CLIENT ENREGISTRÉ</h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                  Les comptes clients apparaîtront ici après leur première inscription ou commande.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-5 py-2.5 bg-pros-bone border border-neutral-300 text-black text-xs font-bold uppercase hover:bg-neutral-200 inline-flex items-center gap-2 cursor-pointer font-sans"
                  >
                    <Upload size={14} /> IMPORTER CLIENTS
                  </button>
                  <button
                    onClick={handleOpenCreateModal}
                    className="px-5 py-2.5 bg-pros-black text-white text-xs font-bold uppercase hover:bg-neutral-800 inline-flex items-center gap-2 cursor-pointer font-sans"
                  >
                    <Plus size={16} /> NOUVEAU CLIENT
                  </button>
                </div>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-16 text-center font-sans">
              <div className="max-w-sm mx-auto space-y-3">
                <Search className="mx-auto text-neutral-400" size={36} />
                <h3 className="font-display font-bold text-sm uppercase text-black">AUCUN CLIENT TROUVÉ</h3>
                <p className="text-xs text-neutral-500">Aucun client ne correspond actuellement à vos critères de recherche.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setRoleFilter('all');
                    setSegmentFilter('all');
                    setOrdersFilter('all');
                  }}
                  className="px-4 py-2 bg-pros-black text-white text-xs font-bold uppercase hover:bg-neutral-800 inline-flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <RotateCcw size={14} />
                  <span>RÉINITIALISER FILTRES</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto font-sans">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-pros-bone border-b border-neutral-200 text-[10px] font-bold text-black uppercase font-sans">
                    <tr>
                      <th className="p-3 w-48">MEMBRE</th>
                      <th className="p-3 w-48">CONTACT</th>
                      <th className="p-3 w-32">VILLE & RÉGION</th>
                      <th className="p-3 w-28 text-center">COMMANDES</th>
                      <th className="p-3 w-36 text-right">TOTAL DÉPENSÉ</th>
                      <th className="p-3 text-center w-36">SEGMENT</th>
                      <th className="p-3 text-center w-28">STATUT</th>
                      <th className="p-3 text-right w-44">ACTIONS CRM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-xs font-sans">
                    {paginatedCustomers.map((c) => {
                      const metrics = getCustomerMetrics(c);
                      return (
                        <tr key={c.id} className="hover:bg-pros-bone/70 transition-colors font-sans">
                          
                          {/* Membre */}
                          <td className="p-3 align-top">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-pros-black text-pros-gold font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-black uppercase text-xs">{c.firstName} {c.lastName}</div>
                                <div className="text-[10px] text-neutral-400 font-mono">Inscrit le {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="p-3 align-top">
                            <div className="text-black font-mono text-[11px] truncate max-w-[170px]" title={c.email}>{c.email}</div>
                            <div className="text-[10px] text-neutral-500 font-mono">{c.phone}</div>
                          </td>

                          {/* Ville & Région */}
                          <td className="p-3 align-top">
                            <div className="font-bold text-black text-xs uppercase">{c.city}</div>
                            <div className="text-[10px] text-neutral-500 font-mono">{c.region}</div>
                          </td>

                          {/* Commandes */}
                          <td className="p-3 align-top text-center font-mono">
                            <span className="font-bold text-black text-xs">{metrics.totalOrders}</span>
                            <span className="text-[10px] text-neutral-500 block">cmd(s)</span>
                          </td>

                          {/* Total Dépensé */}
                          <td className="p-3 align-top text-right font-mono font-bold text-xs text-black">
                            {formatPrice(metrics.totalSpent)}
                          </td>

                          {/* Segment */}
                          <td className="p-3 align-top text-center">
                            {getSegmentBadge(metrics.segment)}
                          </td>

                          {/* Statut Badge */}
                          <td className="p-3 align-top text-center">
                            {getStatusBadge(c.status)}
                          </td>

                          {/* Actions CRM */}
                          <td className="p-3 align-top text-right space-x-1.5 font-sans">
                            <button
                              onClick={() => { setActive360Customer(c); setActive360Tab('identity'); }}
                              className="px-2.5 py-1 bg-pros-black hover:bg-neutral-800 text-white font-bold text-[10px] uppercase cursor-pointer shadow-sm inline-flex items-center gap-1"
                              title="Voir Fiche Client 360°"
                            >
                              <Eye size={12} /> FICHE 360
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(c)}
                              className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black cursor-pointer inline-flex items-center"
                              title="Modifier les coordonnées"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleBlock(c)}
                              className={`p-1.5 border cursor-pointer inline-flex items-center ${
                                c.status === 'BLOCKED' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100' : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                              }`}
                              title={c.status === 'BLOCKED' ? 'Débloquer le membre' : 'Bloquer le membre'}
                            >
                              {c.status === 'BLOCKED' ? <Unlock size={14} /> : <Lock size={14} />}
                            </button>
                            <button
                              onClick={() => setCustomerToDelete(c)}
                              className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-red-100 hover:border-red-300 text-red-600 cursor-pointer inline-flex items-center"
                              title="Supprimer définitivement"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="block md:hidden divide-y divide-neutral-200 font-sans">
                {paginatedCustomers.map((c) => {
                  const metrics = getCustomerMetrics(c);
                  return (
                    <div key={c.id} className="p-4 space-y-3 bg-white font-sans">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-pros-black text-pros-gold font-bold text-xs flex items-center justify-center">
                            {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-black uppercase text-sm">{c.firstName} {c.lastName}</div>
                            <div className="text-[10px] text-neutral-500 font-mono">{c.email}</div>
                          </div>
                        </div>
                        <div>{getStatusBadge(c.status)}</div>
                      </div>

                      <div className="flex items-center justify-between text-xs border-t border-b border-neutral-100 py-2 font-mono">
                        <div>
                          <span className="text-neutral-500 block text-[10px]">COMMANDES</span>
                          <span className="font-bold text-black">{metrics.totalOrders} cmd(s)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-500 block text-[10px]">TOTAL DÉPENSÉ</span>
                          <span className="font-bold text-black">{formatPrice(metrics.totalSpent)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 font-sans">
                        <button
                          onClick={() => { setActive360Customer(c); setActive360Tab('identity'); }}
                          className="flex-1 py-2 bg-pros-black text-white font-bold text-xs uppercase flex items-center justify-center gap-1"
                        >
                          <Eye size={14} /> FICHE 360°
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="py-2 px-3 bg-pros-bone border border-neutral-300 text-black font-bold text-xs uppercase"
                        >
                          MODIFIER
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {filteredCustomers.length > 0 && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-pros-bone border-t border-neutral-200 text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-bold uppercase text-[10px]">Afficher :</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-neutral-300 px-2 py-1 text-black text-xs focus:outline-none"
                >
                  <option value={20}>20 par page</option>
                  <option value={50}>50 par page</option>
                </select>
                <span className="text-neutral-500 text-[10px] uppercase font-mono ml-2">
                  {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredCustomers.length)} sur {filteredCustomers.length} membres
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 font-bold text-xs uppercase cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> PRÉCÉDENT
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 font-bold text-xs uppercase cursor-pointer flex items-center gap-1"
                >
                  SUIVANT <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CUSTOMER 360 DRAWER / MODAL */}
        {active360Customer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[92vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-neutral-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-pros-black text-pros-gold font-bold text-lg flex items-center justify-center">
                    {active360Customer.firstName.charAt(0)}{active360Customer.lastName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-xl uppercase text-black">
                        {active360Customer.firstName} {active360Customer.lastName}
                      </h3>
                      {getSegmentBadge(getCustomerMetrics(active360Customer).segment)}
                      {getStatusBadge(active360Customer.status)}
                    </div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">
                      Membre #{active360Customer.id} • Inscrit le {new Date(active360Customer.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <button onClick={() => setActive360Customer(null)} className="text-neutral-500 hover:text-black">
                  <X size={24} />
                </button>
              </div>

              {/* 360 Navigation Tabs */}
              <div className="flex border-b border-neutral-200 gap-1 text-xs font-bold uppercase font-sans overflow-x-auto">
                <button
                  onClick={() => setActive360Tab('identity')}
                  className={`px-4 py-2.5 border-b-2 font-sans cursor-pointer whitespace-nowrap ${
                    active360Tab === 'identity' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  Vue d'ensemble 360°
                </button>
                <button
                  onClick={() => setActive360Tab('addresses')}
                  className={`px-4 py-2.5 border-b-2 font-sans cursor-pointer whitespace-nowrap ${
                    active360Tab === 'addresses' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  Adresses de livraison ({addresses.filter((a) => a.customerId === active360Customer.id).length})
                </button>
                <button
                  onClick={() => setActive360Tab('orders')}
                  className={`px-4 py-2.5 border-b-2 font-sans cursor-pointer whitespace-nowrap ${
                    active360Tab === 'orders' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  Commandes ({getCustomerMetrics(active360Customer).totalOrders})
                </button>
                <button
                  onClick={() => setActive360Tab('reviews')}
                  className={`px-4 py-2.5 border-b-2 font-sans cursor-pointer whitespace-nowrap ${
                    active360Tab === 'reviews' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  Avis Clients ({getCustomerMetrics(active360Customer).customerReviews.length})
                </button>
                <button
                  onClick={() => setActive360Tab('coupons')}
                  className={`px-4 py-2.5 border-b-2 font-sans cursor-pointer whitespace-nowrap ${
                    active360Tab === 'coupons' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  Coupons Utilisés
                </button>
                <button
                  onClick={() => setActive360Tab('products')}
                  className={`px-4 py-2.5 border-b-2 font-sans cursor-pointer whitespace-nowrap ${
                    active360Tab === 'products' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
                  }`}
                >
                  Produits Achetés
                </button>
              </div>

              {/* TAB ADDRESSES */}
              {active360Tab === 'addresses' && (
                <div className="space-y-4 font-sans">
                  {(() => {
                    const custAddresses = addresses.filter((a) => a.customerId === active360Customer.id);
                    if (custAddresses.length === 0) {
                      return (
                        <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-200 font-sans">
                          Aucune adresse de livraison enregistrée pour ce client.
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-3 font-sans">
                        {custAddresses.map((addr) => (
                          <div key={addr.id} className="p-4 border border-neutral-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans shadow-sm">
                            <div className="space-y-1 font-sans">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-neutral-100 border border-neutral-300 text-black font-mono">
                                  {addr.label}
                                </span>
                                {addr.isDefault && (
                                  <span className="px-2.5 py-0.5 text-[9px] font-bold bg-pros-black text-pros-gold font-mono uppercase">
                                    ★ PAR DÉFAUT
                                  </span>
                                )}
                                {addr.isActive ? (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800">ACTIF</span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-800">INACTIF</span>
                                )}
                              </div>
                              <div className="font-bold text-black text-xs uppercase">{addr.recipientName} ({addr.phone})</div>
                              <div className="text-xs text-neutral-700">{addr.addressLine1} {addr.addressLine2 && `— ${addr.addressLine2}`}</div>
                              <div className="text-[11px] text-neutral-500 uppercase">{addr.city}, {addr.region} — {addr.country}</div>
                            </div>

                            <div className="flex items-center gap-2 font-sans flex-shrink-0">
                              {!addr.isDefault && (
                                <button
                                  onClick={() => setDefaultDeliveryAddress(addr.id)}
                                  className="px-3 py-1 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold uppercase hover:bg-amber-100 cursor-pointer"
                                >
                                  DÉFINIR PAR DÉFAUT
                                </button>
                              )}
                              <button
                                onClick={() => toggleAddressActiveStatus(addr.id)}
                                className="px-3 py-1 bg-pros-bone border border-neutral-300 text-black text-xs font-bold uppercase hover:bg-neutral-200 cursor-pointer"
                              >
                                {addr.isActive ? 'DÉSACTIVER' : 'ACTIVER'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 1: IDENTITY & OVERVIEW */}
              {active360Tab === 'identity' && (
                <div className="space-y-6 font-sans">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-pros-bone border border-neutral-200">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">COMMANDES PASSÉES</span>
                      <div className="text-lg font-bold text-black font-mono">{getCustomerMetrics(active360Customer).totalOrders}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">TOTAL DÉPENSÉ</span>
                      <div className="text-lg font-bold text-black font-mono">{formatPrice(getCustomerMetrics(active360Customer).totalSpent)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">PANIER MOYEN</span>
                      <div className="text-lg font-bold text-black font-mono">{formatPrice(getCustomerMetrics(active360Customer).avgOrderValue)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">AVIS RÉDIGÉS</span>
                      <div className="text-lg font-bold text-pros-gold font-mono">{getCustomerMetrics(active360Customer).customerReviews.length}</div>
                    </div>
                  </div>

                  {/* Contact & Address Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="p-4 border border-neutral-200 space-y-2 font-sans">
                      <span className="font-bold text-pros-gold uppercase text-[10px] block flex items-center gap-1">
                        <Mail size={12} /> COORDONNÉES DE CONTACT
                      </span>
                      <div><strong>Email:</strong> <span className="font-mono">{active360Customer.email}</span></div>
                      <div><strong>Téléphone:</strong> <span className="font-mono">{active360Customer.phone}</span></div>
                      <div><strong>Rôle Plateforme:</strong> <span className="font-mono font-bold uppercase">{active360Customer.role}</span></div>
                    </div>

                    <div className="p-4 border border-neutral-200 space-y-2 font-sans">
                      <span className="font-bold text-pros-gold uppercase text-[10px] block flex items-center gap-1">
                        <MapPin size={12} /> ADRESSE DE LIVRAISON PRINCIPALE
                      </span>
                      <div><strong>Adresse:</strong> {active360Customer.address || 'Non spécifiée'}</div>
                      <div><strong>Ville / Région:</strong> {active360Customer.city}, {active360Customer.region}</div>
                      <div><strong>Pays:</strong> {active360Customer.country}</div>
                    </div>
                  </div>

                  {/* PROS CLUB LOYALTY INTEGRATION CARD */}
                  <div className="p-4 bg-pros-black text-white border border-pros-gold space-y-3 font-sans shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Award className="text-pros-gold" size={18} />
                        <h4 className="font-display font-bold text-sm uppercase text-pros-gold">PROGRAMME FIDÉLITÉ PROS CLUB</h4>
                      </div>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono bg-pros-gold text-black">
                        NIVEAU GOLD
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono border-t border-neutral-800 pt-3">
                      <div>
                        <span className="text-[9px] text-neutral-400 font-sans uppercase block">Points Dispo</span>
                        <strong className="text-emerald-400 text-sm">8 450 pts</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 font-sans uppercase block">Cumul Gagné</span>
                        <strong className="text-white">12 800 pts</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 font-sans uppercase block">Points Dépensés</span>
                        <strong className="text-neutral-400">4 350 pts</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 font-sans uppercase block">Récompenses</span>
                        <strong className="text-pros-gold">12</strong>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setActive360Customer(null);
                          navigate(`/admin/marketing/loyalty/members/${active360Customer.id}`);
                        }}
                        className="px-4 py-2 bg-pros-gold text-black font-bold text-xs uppercase hover:bg-amber-400 cursor-pointer shadow-sm"
                      >
                        VOIR LE PROGRAMME FIDÉLITÉ &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDERS HISTORY */}
              {active360Tab === 'orders' && (
                <div className="space-y-4 font-sans">
                  {getCustomerMetrics(active360Customer).customerOrders.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-200 font-sans">
                      Ce membre n'a encore passé aucune commande.
                    </div>
                  ) : (
                    <div className="border border-neutral-200 overflow-x-auto font-sans">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-pros-bone text-[10px] font-bold uppercase border-b border-neutral-200">
                          <tr>
                            <th className="p-3">N° COMMANDE</th>
                            <th className="p-3">DATE</th>
                            <th className="p-3">ARTICLES</th>
                            <th className="p-3 text-right">TOTAL</th>
                            <th className="p-3 text-center">STATUT</th>
                            <th className="p-3 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 font-sans">
                          {getCustomerMetrics(active360Customer).customerOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-pros-bone">
                              <td className="p-3 font-mono font-bold text-black">{o.id}</td>
                              <td className="p-3 font-mono text-[11px]">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                              <td className="p-3">{o.items.length} article(s)</td>
                              <td className="p-3 text-right font-mono font-bold">{formatPrice(o.total)}</td>
                              <td className="p-3 text-center font-bold text-[10px] uppercase">{o.status}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => { setActive360Customer(null); navigate('/admin/orders'); }}
                                  className="text-pros-gold font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <span>VOIR</span> <ExternalLink size={10} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: REVIEWS HISTORY */}
              {active360Tab === 'reviews' && (
                <div className="space-y-4 font-sans">
                  {getCustomerMetrics(active360Customer).customerReviews.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-200 font-sans">
                      Ce membre n'a rédigé aucun avis client.
                    </div>
                  ) : (
                    <div className="space-y-3 font-sans">
                      {getCustomerMetrics(active360Customer).customerReviews.map((r) => (
                        <div key={r.id} className="p-4 border border-neutral-200 space-y-2 bg-pros-bone/50 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-black uppercase">{r.productName}</div>
                              <div className="text-amber-500 font-bold">★ {r.rating}/5</div>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-500">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <p className="text-neutral-700 italic">"{r.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: COUPONS USED */}
              {active360Tab === 'coupons' && (
                <div className="space-y-4 font-sans">
                  {getCustomerMetrics(active360Customer).customerOrders.filter((o) => o.couponCode).length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-200 font-sans">
                      Aucun code promo n'a été utilisé par ce membre.
                    </div>
                  ) : (
                    <div className="border border-neutral-200 overflow-x-auto font-sans">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-pros-bone text-[10px] font-bold uppercase border-b border-neutral-200">
                          <tr>
                            <th className="p-3">CODE PROMO</th>
                            <th className="p-3">COMMANDE</th>
                            <th className="p-3">DATE</th>
                            <th className="p-3 text-right">REMISE OBTENUE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 font-sans">
                          {getCustomerMetrics(active360Customer).customerOrders.filter((o) => o.couponCode).map((o) => (
                            <tr key={o.id} className="hover:bg-pros-bone">
                              <td className="p-3 font-mono font-bold text-pros-black">🏷 {o.couponCode}</td>
                              <td className="p-3 font-mono">{o.id}</td>
                              <td className="p-3 font-mono text-[11px]">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                              <td className="p-3 text-right font-mono font-bold text-emerald-700">-{formatPrice(o.discount || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PRODUCTS PURCHASED */}
              {active360Tab === 'products' && (
                <div className="space-y-4 font-sans">
                  {getCustomerMetrics(active360Customer).customerOrders.flatMap((o) => o.items).length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-200 font-sans">
                      Aucun produit acheté enregistrer.
                    </div>
                  ) : (
                    <div className="border border-neutral-200 overflow-x-auto font-sans">
                      <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-pros-bone text-[10px] font-bold uppercase border-b border-neutral-200">
                          <tr>
                            <th className="p-3">PRODUIT</th>
                            <th className="p-3 text-center">TAILLE</th>
                            <th className="p-3 text-center">QUANTITÉ TOTALE</th>
                            <th className="p-3 text-right">MONTANT ACHETÉ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 font-sans">
                          {getCustomerMetrics(active360Customer).customerOrders.flatMap((o) => o.items).map((item, idx) => (
                            <tr key={idx} className="hover:bg-pros-bone">
                              <td className="p-3 font-bold text-black uppercase">{item.product.name}</td>
                              <td className="p-3 text-center font-mono">{item.size}</td>
                              <td className="p-3 text-center font-mono font-bold">{item.quantity}</td>
                              <td className="p-3 text-right font-mono font-bold">{formatPrice(item.product.price * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-neutral-200 flex justify-end">
                <button
                  onClick={() => setActive360Customer(null)}
                  className="px-6 py-2 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800"
                >
                  FERMER LA FICHE 360°
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Create / Edit Customer Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="font-display font-bold text-lg uppercase text-black">
                  {editingCustomer ? `MODIFIER LE MEMBRE #${editingCustomer.id}` : 'CRÉER UN NOUVEAU CLIENT PROS'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">PRÉNOM *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase text-black block mb-1">NOM *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">EMAIL *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-mono focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase text-black block mb-1">TÉLÉPHONE</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+221 77 000 00 00"
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-mono focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">VILLE</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase text-black block mb-1">RÉGION</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase text-black block mb-1">STATUT COMPTE</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans font-bold uppercase focus:outline-none"
                    >
                      <option value="ACTIVE">ACTIF</option>
                      <option value="INACTIVE">INACTIF</option>
                      <option value="BLOCKED">BLOQUÉ</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                  >
                    ANNULER
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer"
                  >
                    {editingCustomer ? 'ENREGISTRER MODIFICATIONS' : 'CRÉER LE MEMBRE'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-8 space-y-6 text-black font-sans shadow-2xl">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="font-display font-bold text-lg uppercase text-black flex items-center gap-2">
                  <Upload size={20} className="text-pros-gold" />
                  <span>IMPORTER DES CLIENTS EN MASSE (CSV)</span>
                </h3>
                <button onClick={() => setIsImportModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <p className="text-neutral-600 leading-relaxed font-sans">
                  Collez ci-dessous le contenu de votre fichier CSV avec le séparateur ponto-virgule (`;`).
                  Format attendu : <code>first_name;last_name;email;phone;city;region;address</code>
                </p>

                <div className="flex justify-between items-center">
                  <button
                    onClick={handleDownloadSampleCSV}
                    className="text-pros-gold font-bold underline hover:text-black text-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <Download size={14} /> Télécharger un exemple de fichier CSV
                  </button>
                </div>

                <textarea
                  rows={8}
                  placeholder={`first_name;last_name;email;phone;city;region;address\nOusmane;Sow;ousmane.sow@gmail.com;+221 77 000 11 22;Dakar;Dakar;Point E`}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  className="w-full bg-pros-bone border border-neutral-300 p-3 text-black font-mono text-xs focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-5 py-2.5 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  disabled={!importCsvText.trim()}
                  className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer disabled:opacity-40"
                >
                  VALIDER ET IMPORTER
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AdminConfirmDialog
          isOpen={!!customerToDelete}
          title="SUPPRIMER LE MEMBRE"
          message={`Êtes-vous sûr de vouloir supprimer définitivement la fiche de "${customerToDelete?.firstName} ${customerToDelete?.lastName}" ? Ses commandes historiques resteront conservées.`}
          confirmText="SUPPRIMER DÉFINITIVEMENT"
          onConfirm={handleConfirmDelete}
          onCancel={() => setCustomerToDelete(null)}
        />

      </div>
    </AdminLayout>
  );
};
