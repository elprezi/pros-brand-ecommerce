import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useStore } from '../../store/storeContext';
import type { Order, OrderStatus, PaymentMethod } from '../../types/ecommerce';
import { exportOrdersToCSV, exportOrdersToExcel } from '../../utils/exportService';
import {
  Search,
  Download,
  Eye,
  X,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  Check,
  RotateCcw,
  Package,
  User,
  Printer,
} from 'lucide-react';
import { apiGetOrderInvoice } from '../../lib/server/invoiceApi';
import { downloadInvoicePdf } from '../../lib/utils/pdfGenerator';

export const AdminOrdersPage: React.FC = () => {
  const { orders, updateOrderStatus, formatPrice } = useStore();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'total-desc' | 'total-asc'>('newest');

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Bulk Selection & View Drawer State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, regionFilter, sortBy, pageSize]);

  // Close Export Dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Stats
  const stats = useMemo(() => {
    return {
      total: orders.length,
      recue: orders.filter((o) => o.status === 'recue').length,
      preparation: orders.filter((o) => o.status === 'preparation').length,
      expedie: orders.filter((o) => o.status === 'expedie' || o.status === 'transit').length,
      livree: orders.filter((o) => o.status === 'livree').length,
    };
  }, [orders]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          order.id.toLowerCase().includes(query) ||
          order.trackingNumber.toLowerCase().includes(query) ||
          `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(query) ||
          order.customer.email.toLowerCase().includes(query) ||
          order.customer.phone.includes(query);

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;
        const matchesRegion = regionFilter === 'all' || order.customer.region === regionFilter;

        return matchesSearch && matchesStatus && matchesPayment && matchesRegion;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'total-desc') return b.total - a.total;
        if (sortBy === 'total-asc') return a.total - b.total;
        return 0;
      });
  }, [orders, searchTerm, statusFilter, paymentFilter, regionFilter, sortBy]);

  // Paginated Orders
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Target orders for Export
  const targetOrdersForExport = useMemo(() => {
    if (selectedOrderIds.length > 0) {
      return orders.filter((o) => selectedOrderIds.includes(o.id));
    }
    return filteredOrders;
  }, [orders, selectedOrderIds, filteredOrders]);

  const isFilteredExport =
    selectedOrderIds.length === 0 &&
    (statusFilter !== 'all' || paymentFilter !== 'all' || regionFilter !== 'all' || searchTerm.trim() !== '');

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(paginatedOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter((item) => item !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  // Bulk Status Change Actions
  const handleBulkStatusChange = (newStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    selectedOrderIds.forEach((id) => {
      updateOrderStatus(id, newStatus);
    });
    setNotificationMsg(`${selectedOrderIds.length} commande(s) mise(s) à jour vers "${newStatus.toUpperCase()}".`);
    setSelectedOrderIds([]);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Trigger Excel XLSX Export
  const handleTriggerExcel = () => {
    if (targetOrdersForExport.length === 0) {
      setNotificationMsg('Aucune commande disponible à exporter.');
      setTimeout(() => setNotificationMsg(null), 4000);
      return;
    }
    setIsExportMenuOpen(false);
    setIsExporting(true);

    setTimeout(() => {
      exportOrdersToExcel(targetOrdersForExport, isFilteredExport);
      setIsExporting(false);
      setNotificationMsg(`✓ Export Excel XLSX généré (${targetOrdersForExport.length} commandes).`);
      setTimeout(() => setNotificationMsg(null), 4000);
    }, 400);
  };

  // Trigger CSV Export
  const handleTriggerCSV = () => {
    if (targetOrdersForExport.length === 0) {
      setNotificationMsg('Aucune commande disponible à exporter.');
      setTimeout(() => setNotificationMsg(null), 4000);
      return;
    }
    setIsExportMenuOpen(false);
    setIsExporting(true);

    setTimeout(() => {
      exportOrdersToCSV(targetOrdersForExport, isFilteredExport);
      setIsExporting(false);
      setNotificationMsg(`✓ Export CSV UTF-8 généré (${targetOrdersForExport.length} commandes).`);
      setTimeout(() => setNotificationMsg(null), 4000);
    }, 400);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setRegionFilter('all');
    setSortBy('newest');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'recue':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase font-sans">REÇUE</span>;
      case 'preparation':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 uppercase font-sans">EN PRÉPARATION</span>;
      case 'expedie':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 uppercase font-sans">EXPÉDIÉE</span>;
      case 'transit':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 uppercase font-sans">EN TRANSIT</span>;
      case 'livree':
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-800 border border-green-300 uppercase font-sans">LIVRÉE</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300 uppercase font-sans">{status}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Page Header with Dual Export Menu */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-200 gap-4 font-sans">
          <div>
            <span className="text-[10px] font-bold tracking-superwide uppercase text-pros-gold block">ADMINISTRATION PROS</span>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-superwide uppercase text-pros-black">
              GESTION ET SUIVI DES COMMANDES
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Gérez, traitez, filtrez et modifiez l'état de livraison de toutes les commandes PROS au Sénégal.
            </p>
          </div>

          {/* Export Dropdown Menu */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting}
              className="px-4 py-2.5 bg-pros-black text-white hover:bg-neutral-800 transition-colors text-xs font-bold uppercase flex items-center gap-2 font-sans cursor-pointer shadow-md disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 size={16} className="animate-spin text-pros-gold" />
              ) : (
                <Download size={16} />
              )}
              <span>
                {selectedOrderIds.length > 0
                  ? `EXPORTER ${selectedOrderIds.length} COMMANDES`
                  : `EXPORTER (${targetOrdersForExport.length})`}
              </span>
              <ChevronDown size={14} className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Options */}
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-neutral-300 shadow-2xl z-40 animate-fade-in font-sans py-2">
                <div className="px-3 py-1.5 text-[9px] font-bold uppercase text-neutral-400 border-b border-neutral-100">
                  {selectedOrderIds.length > 0 ? `${selectedOrderIds.length} commandes sélectionnées` : `${targetOrdersForExport.length} commandes`}
                </div>

                <button
                  onClick={handleTriggerExcel}
                  className="w-full px-4 py-3 text-left hover:bg-pros-bone flex items-start gap-3 transition-colors group cursor-pointer"
                >
                  <FileSpreadsheet size={18} className="text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-black group-hover:text-pros-gold flex items-center gap-2">
                      <span>Exporter Excel (.XLSX)</span>
                      <span className="px-1.5 py-0.2 bg-green-100 text-green-800 text-[8px] font-bold uppercase">RECOMMANDÉ</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      3 feuilles (Résumé, Commandes, Articles), filtres et mise en forme.
                    </div>
                  </div>
                </button>

                <div className="border-t border-neutral-100 my-1" />

                <button
                  onClick={handleTriggerCSV}
                  className="w-full px-4 py-3 text-left hover:bg-pros-bone flex items-start gap-3 transition-colors group cursor-pointer"
                >
                  <FileText size={18} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-black group-hover:text-pros-gold">
                      Exporter CSV (UTF-8 BOM)
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      Séparateur semi-colon (;) optimisé Excel.
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* System Notification Banner */}
        {notificationMsg && (
          <div className="p-4 bg-green-100 border border-green-300 text-green-900 text-xs font-bold uppercase flex justify-between items-center animate-fade-in font-sans">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-green-700" />
              <span>{notificationMsg}</span>
            </div>
            <button onClick={() => setNotificationMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Quick Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-sans">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 border cursor-pointer transition-all ${
              statusFilter === 'all' ? 'bg-pros-black text-white border-pros-black' : 'bg-white text-black border-neutral-200 hover:border-black'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-neutral-400">TOUTES</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </div>

          <div
            onClick={() => setStatusFilter('recue')}
            className={`p-4 border cursor-pointer transition-all ${
              statusFilter === 'recue' ? 'bg-amber-500 text-black font-bold border-amber-500' : 'bg-white text-black border-neutral-200 hover:border-amber-500'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-neutral-400">EN ATTENTE</div>
            <div className="text-xl font-bold">{stats.recue}</div>
          </div>

          <div
            onClick={() => setStatusFilter('preparation')}
            className={`p-4 border cursor-pointer transition-all ${
              statusFilter === 'preparation' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-black border-neutral-200 hover:border-blue-600'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-neutral-400">PRÉPARATION</div>
            <div className="text-xl font-bold">{stats.preparation}</div>
          </div>

          <div
            onClick={() => setStatusFilter('expedie')}
            className={`p-4 border cursor-pointer transition-all ${
              statusFilter === 'expedie' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-black border-neutral-200 hover:border-purple-600'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-neutral-400">EXPÉDIÉES</div>
            <div className="text-xl font-bold">{stats.expedie}</div>
          </div>

          <div
            onClick={() => setStatusFilter('livree')}
            className={`p-4 border cursor-pointer transition-all ${
              statusFilter === 'livree' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-black border-neutral-200 hover:border-green-600'
            }`}
          >
            <div className="text-[10px] uppercase font-bold text-neutral-400">LIVRÉES</div>
            <div className="text-xl font-bold">{stats.livree}</div>
          </div>
        </div>

        {/* Order Toolbar (Search, Filter, Sort, Pagination) */}
        <div className="bg-pros-bone border border-neutral-200 p-4 space-y-4 shadow-sm font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-sans">
            
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="N° commande, client, téléphone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans"
              />
            </div>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentMethod | 'all')}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase cursor-pointer font-sans"
            >
              <option value="all">PAIEMENT : TOUS</option>
              <option value="wave">WAVE SÉNÉGAL</option>
              <option value="orange_money">ORANGE MONEY</option>
              <option value="card">CARTE BANCAIRE</option>
              <option value="cash_on_delivery">À LA LIVRAISON</option>
            </select>

            {/* Region Filter Senegal 14 Regions */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase cursor-pointer font-sans"
            >
              <option value="all">RÉGION : TOUTES</option>
              <option value="Dakar">DAKAR & BANLIEUE</option>
              <option value="Thiès">THIÈS</option>
              <option value="Saint-Louis">SAINT-LOUIS</option>
              <option value="Diourbel">DIOURBEL / TOUBA</option>
              <option value="Ziguinchor">ZIGUINCHOR</option>
              <option value="Louga">LOUGA</option>
              <option value="Fatick">FATICK</option>
              <option value="Kaolack">KAOLACK</option>
              <option value="Kaffrine">KAFFRINE</option>
              <option value="Kédougou">KÉDOUGOU</option>
              <option value="Matam">MATAM</option>
              <option value="Sédhiou">SÉDHIOU</option>
              <option value="Kolda">KOLDA</option>
              <option value="Tambacounda">TAMBACOUNDA</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase cursor-pointer font-sans"
            >
              <option value="newest">PLUS RÉCENTES</option>
              <option value="oldest">PLUS ANCIENNES</option>
              <option value="total-desc">MONTANT DÉCROISSANT</option>
              <option value="total-asc">MONTANT CROISSANT</option>
            </select>

          </div>

          {/* Bulk Selection Actions Toolbar */}
          {selectedOrderIds.length > 0 && (
            <div className="p-3 bg-pros-black text-white text-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in font-sans">
              <span className="font-bold font-sans">
                {selectedOrderIds.length} COMMANDES SÉLECTIONNÉES :
              </span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={() => handleBulkStatusChange('preparation')}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase font-sans cursor-pointer"
                >
                  PRÉPARER
                </button>
                <button
                  onClick={() => handleBulkStatusChange('expedie')}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] uppercase font-sans cursor-pointer"
                >
                  EXPÉDIER
                </button>
                <button
                  onClick={() => handleBulkStatusChange('livree')}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] uppercase font-sans cursor-pointer"
                >
                  MARQUER LIVRÉE
                </button>
                <button
                  onClick={handleTriggerExcel}
                  className="px-3 py-1 bg-pros-gold hover:bg-amber-600 text-black font-bold text-[10px] uppercase font-sans flex items-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet size={12} />
                  <span>EXPORTER EXCEL ({selectedOrderIds.length})</span>
                </button>
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] uppercase font-sans cursor-pointer"
                >
                  ANNULER SÉLECTION
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Orders Data Table (Light UI) */}
        <div className="bg-white border border-neutral-200 overflow-x-auto shadow-sm font-sans">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-pros-bone text-neutral-600 uppercase border-b border-neutral-200 text-[10px] tracking-wider font-sans font-bold">
              <tr>
                <th className="py-4 px-4 w-8">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedOrders.length > 0 &&
                      selectedOrderIds.length === paginatedOrders.length
                    }
                    className="accent-pros-black cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4 font-sans">Commande</th>
                <th className="py-4 px-4 font-sans">Client</th>
                <th className="py-4 px-4 font-sans">Région</th>
                <th className="py-4 px-4 font-sans">Montant Total</th>
                <th className="py-4 px-4 font-sans">Mode Paiement</th>
                <th className="py-4 px-4 font-sans">Statut</th>
                <th className="py-4 px-4 text-right font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-black font-sans">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center font-sans">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Package className="mx-auto text-neutral-400" size={40} />
                      <div className="font-display font-bold text-sm uppercase text-black">AUCUNE COMMANDE</div>
                      <p className="text-xs text-neutral-500">Aucune commande n'a encore été enregistrée sur la plateforme.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center font-sans">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Search className="mx-auto text-neutral-400" size={36} />
                      <div className="font-display font-bold text-sm uppercase text-black">AUCUN RÉSULTAT</div>
                      <p className="text-xs text-neutral-500">Aucune commande ne correspond à vos critères de recherche actuels.</p>
                      <button
                        onClick={resetFilters}
                        className="px-4 py-2 bg-pros-black text-white text-xs font-bold uppercase hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-sans"
                      >
                        <RotateCcw size={14} />
                        <span>RÉINITIALISER LES FILTRES</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-pros-bone transition-colors font-sans">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => handleSelectOne(order.id)}
                        className="accent-pros-black cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => setSelectedOrderForView(order)}
                        className="font-bold text-black hover:text-pros-gold font-mono text-left cursor-pointer underline decoration-dotted"
                      >
                        {order.id}
                      </button>
                      <div className="text-[10px] text-neutral-500 font-mono">Suivi: {order.trackingNumber}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-black uppercase font-sans">{order.customer.firstName} {order.customer.lastName}</div>
                      <div className="text-[10px] text-neutral-500 font-sans">{order.customer.phone}</div>
                    </td>
                    <td className="py-4 px-4 uppercase text-neutral-700 font-bold font-sans">{order.customer.region}</td>
                    <td className="py-4 px-4 font-bold text-black font-sans">{formatPrice(order.total)}</td>
                    <td className="py-4 px-4 uppercase text-neutral-600 font-sans">{order.paymentMethod}</td>
                    <td className="py-4 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-4 px-4 text-right space-x-2 font-sans">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="bg-pros-bone border border-neutral-300 px-2 py-1 text-[10px] text-black font-bold uppercase cursor-pointer font-sans"
                      >
                        <option value="recue">REÇUE</option>
                        <option value="preparation">PRÉPARATION</option>
                        <option value="expedie">EXPÉDIÉE</option>
                        <option value="transit">EN TRANSIT</option>
                        <option value="livree">LIVRÉE</option>
                      </select>

                      <button
                        onClick={() => setSelectedOrderForView(order)}
                        className="p-1.5 bg-pros-black text-white hover:bg-neutral-800 cursor-pointer inline-flex items-center"
                        title="Voir le détail de la commande"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filteredOrders.length > 0 && (
            <div className="p-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs bg-pros-bone">
              <div className="flex items-center gap-3 text-neutral-600 font-sans">
                <span>Afficher :</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-white border border-neutral-300 px-2 py-1 font-bold text-black cursor-pointer font-sans"
                >
                  <option value={20}>20 par page</option>
                  <option value={50}>50 par page</option>
                  <option value={100}>100 par page</option>
                </select>
                <span className="font-bold text-black font-sans">
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredOrders.length)} sur {filteredOrders.length} commandes
                </span>
              </div>

              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-40 font-bold uppercase cursor-pointer font-sans"
                >
                  &larr; Précédent
                </button>
                <span className="font-bold px-2 font-mono text-black">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-40 font-bold uppercase cursor-pointer font-sans"
                >
                  Suivant &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Order View Modal / Drawer */}
        {selectedOrderForView && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end font-sans">
            <div className="w-full max-w-2xl bg-white h-full p-8 space-y-6 overflow-y-auto text-black border-l border-neutral-300 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-sans">DÉTAIL COMPLET DE LA COMMANDE</span>
                  <h2 className="font-display font-bold text-xl text-black font-mono">{selectedOrderForView.id}</h2>
                </div>
                <button
                  onClick={() => setSelectedOrderForView(null)}
                  className="p-2 text-neutral-500 hover:text-black cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Status History Timeline */}
              <div className="bg-pros-bone p-4 border border-neutral-200 space-y-3 font-sans">
                <div className="text-xs font-bold uppercase text-black font-sans flex items-center justify-between">
                  <span>HISTORIQUE DE LIVRAISON</span>
                  <span className="font-mono text-[10px] text-neutral-500">SUIVI: {selectedOrderForView.trackingNumber}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-2">
                  {[
                    { key: 'recue', label: 'Créée' },
                    { key: 'preparation', label: 'Préparation' },
                    { key: 'expedie', label: 'Expédiée' },
                    { key: 'livree', label: 'Livrée' },
                  ].map((step, idx) => (
                    <div key={step.key} className="flex flex-col items-center gap-1 font-sans">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          selectedOrderForView.status === step.key || idx < 2
                            ? 'bg-pros-black text-white'
                            : 'bg-neutral-300 text-neutral-600'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="uppercase text-neutral-700 font-bold font-sans">{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3 pt-2 font-sans">
                <h3 className="font-bold uppercase text-sm border-b border-neutral-200 pb-2 flex items-center gap-2">
                  <User size={16} /> CLIENT & LIVRAISON
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-500 block">Nom complet :</span>
                    <strong className="text-black uppercase">{selectedOrderForView.customer.firstName} {selectedOrderForView.customer.lastName}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Téléphone WhatsApp :</span>
                    <strong className="text-black font-mono">{selectedOrderForView.customer.phone}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Adresse de livraison (Snapshot Historique) :</span>
                    <strong className="text-black">
                      {selectedOrderForView.shippingAddressSnapshot
                        ? `${selectedOrderForView.shippingAddressSnapshot.recipientName} — ${selectedOrderForView.shippingAddressSnapshot.addressLine1}, ${selectedOrderForView.shippingAddressSnapshot.city} (${selectedOrderForView.shippingAddressSnapshot.phone})`
                        : selectedOrderForView.customer.address}
                    </strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Région Sénégal :</span>
                    <strong className="text-black uppercase">{selectedOrderForView.customer.region}</strong>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 pt-2 font-sans">
                <h3 className="font-bold uppercase text-sm border-b border-neutral-200 pb-2 flex items-center gap-2">
                  <Package size={16} /> ARTICLES DANS LA COMMANDE
                </h3>
                <div className="space-y-2">
                  {selectedOrderForView.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-center p-3 bg-pros-bone border border-neutral-200 text-xs font-sans">
                      <div>
                        <div className="font-bold text-black uppercase font-sans">{it.product.name}</div>
                        <div className="text-[10px] text-neutral-500 font-sans">
                          Taille: {it.size} • Couleur: {it.color} • Quantité: {it.quantity}
                        </div>
                      </div>
                      <span className="font-bold font-sans">{formatPrice(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="pt-4 border-t border-neutral-200 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-neutral-600 font-sans">
                  <span>Sous-total articles :</span>
                  <span>{formatPrice(selectedOrderForView.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 font-sans">
                  <span>Frais d'expédition :</span>
                  <span>{formatPrice(selectedOrderForView.shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-black pt-2 border-t border-neutral-200 font-sans">
                  <span>MONTANT TOTAL PAYÉ :</span>
                  <span className="text-black">{formatPrice(selectedOrderForView.total)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex flex-wrap gap-2 font-sans">
                <button
                  onClick={async () => {
                    if (!selectedOrderForView) return;
                    const res = await apiGetOrderInvoice(selectedOrderForView.id, orders);
                    if (res.success && res.data) {
                      downloadInvoicePdf(res.data);
                    }
                  }}
                  className="flex-1 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <Download size={14} />
                  <span>TÉLÉCHARGER LA FACTURE PDF</span>
                </button>
                <button
                  onClick={async () => {
                    if (!selectedOrderForView) return;
                    const res = await apiGetOrderInvoice(selectedOrderForView.id, orders);
                    if (res.success && res.data) {
                      downloadInvoicePdf(res.data);
                    }
                  }}
                  className="py-2.5 px-4 bg-white border border-neutral-300 hover:border-black text-black font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer font-sans"
                >
                  <Printer size={14} />
                  <span>IMPRIMER</span>
                </button>
              </div>

              <div className="pt-4 border-t border-neutral-200 font-sans">
                <button
                  onClick={() => setSelectedOrderForView(null)}
                  className="w-full py-3 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer font-sans"
                >
                  FERMER LA VUE DÉTAILLÉE
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
