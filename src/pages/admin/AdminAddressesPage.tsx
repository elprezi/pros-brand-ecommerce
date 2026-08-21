import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { useStore } from '../../store/storeContext';
import { useAuth } from '../../store/authContext';
import type { DeliveryAddress, AddressLabel } from '../../types/ecommerce';
import {
  MapPin,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Star,
  Lock,
  Unlock,
  Eye,
  User,
  ShoppingBag,
} from 'lucide-react';

export const AdminAddressesPage: React.FC = () => {
  const {
    addresses,
    customers,
    orders,
    addDeliveryAddress,
    updateDeliveryAddress,
    deleteDeliveryAddress,
    setDefaultDeliveryAddress,
    toggleAddressActiveStatus,
    importDeliveryAddresses,
    formatPrice,
  } = useStore();

  const { hasPermission } = useAuth();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [cityFilter, setCityFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [defaultOnlyFilter, setDefaultOnlyFilter] = useState<boolean>(false);

  // Modal & Drawer State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [viewingAddress, setViewingAddress] = useState<DeliveryAddress | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Delete Confirm Dialog State
  const [addressToDelete, setAddressToDelete] = useState<DeliveryAddress | null>(null);

  // Toast notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<{
    customerId: string;
    label: AddressLabel;
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    region: string;
    country: string;
    postalCode: string;
    additionalInfo: string;
    isDefault: boolean;
    isActive: boolean;
  }>({
    customerId: '',
    label: 'DOMICILE',
    recipientName: '',
    phone: '+221 ',
    addressLine1: '',
    addressLine2: '',
    city: 'Dakar',
    region: 'Dakar',
    country: 'Sénégal',
    postalCode: '',
    additionalInfo: '',
    isDefault: false,
    isActive: true,
  });

  // CSV Import State
  const [rawCsvText, setRawCsvText] = useState('');
  const [importParsedRows, setImportParsedRows] = useState<any[]>([]);

  // Unique Cities & Regions for Filter Options
  const availableCities = useMemo(() => {
    const set = new Set(addresses.map((a) => a.city).filter(Boolean));
    return Array.from(set);
  }, [addresses]);

  const availableRegions = useMemo(() => {
    const set = new Set(addresses.map((a) => a.region).filter(Boolean));
    return Array.from(set);
  }, [addresses]);

  // Filtered Addresses
  const filteredAddresses = useMemo(() => {
    return addresses.filter((addr) => {
      const customer = customers.find((c) => c.id === addr.customerId);
      const searchTarget = `${customer?.firstName || ''} ${customer?.lastName || ''} ${customer?.email || ''} ${addr.recipientName} ${addr.phone} ${addr.city} ${addr.region} ${addr.addressLine1} ${addr.label}`.toLowerCase();

      const matchesSearch = !searchQuery || searchTarget.includes(searchQuery.toLowerCase().trim());
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? addr.isActive : !addr.isActive);
      const matchesCity = cityFilter === 'ALL' || addr.city.toLowerCase() === cityFilter.toLowerCase();
      const matchesRegion = regionFilter === 'ALL' || addr.region.toLowerCase() === regionFilter.toLowerCase();
      const matchesType = typeFilter === 'ALL' || addr.label === typeFilter;
      const matchesDefault = !defaultOnlyFilter || addr.isDefault;

      return matchesSearch && matchesStatus && matchesCity && matchesRegion && matchesType && matchesDefault;
    });
  }, [addresses, customers, searchQuery, statusFilter, cityFilter, regionFilter, typeFilter, defaultOnlyFilter]);

  // KPI Calculations
  const totalAddressesCount = addresses.length;
  const activeAddressesCount = addresses.filter((a) => a.isActive).length;
  const defaultAddressesCount = addresses.filter((a) => a.isDefault).length;
  const customersWithAddressCount = new Set(addresses.map((a) => a.customerId)).size;
  const customersWithoutAddressCount = Math.max(0, customers.length - customersWithAddressCount);

  // Selected Customer in Form Info
  const selectedCustomerInfo = useMemo(() => {
    if (!formState.customerId) return null;
    const cust = customers.find((c) => c.id === formState.customerId);
    if (!cust) return null;
    const existingAddrs = addresses.filter((a) => a.customerId === cust.id);
    const hasDefault = existingAddrs.some((a) => a.isDefault && a.id !== editingAddress?.id);
    return {
      cust,
      count: existingAddrs.length,
      hasDefault,
    };
  }, [formState.customerId, customers, addresses, editingAddress]);

  // Open Create Form Modal
  const handleOpenCreateModal = () => {
    setErrorMsg(null);
    const firstCust = customers[0];
    setEditingAddress(null);
    setFormState({
      customerId: firstCust ? firstCust.id : '',
      label: 'DOMICILE',
      recipientName: firstCust ? `${firstCust.firstName} ${firstCust.lastName}` : '',
      phone: firstCust ? firstCust.phone : '+221 ',
      addressLine1: '',
      addressLine2: '',
      city: firstCust ? firstCust.city : 'Dakar',
      region: firstCust ? firstCust.region : 'Dakar',
      country: 'Sénégal',
      postalCode: '',
      additionalInfo: '',
      isDefault: false,
      isActive: true,
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Form Modal
  const handleOpenEditModal = (addr: DeliveryAddress) => {
    setErrorMsg(null);
    setEditingAddress(addr);
    setFormState({
      customerId: addr.customerId,
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      region: addr.region,
      country: addr.country || 'Sénégal',
      postalCode: addr.postalCode || '',
      additionalInfo: addr.additionalInfo || '',
      isDefault: addr.isDefault,
      isActive: addr.isActive,
    });
    setIsFormModalOpen(true);
  };

  // Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formState.customerId) {
      setErrorMsg('Veuillez sélectionner un client.');
      return;
    }
    if (!formState.recipientName.trim() || !formState.phone.trim() || !formState.addressLine1.trim() || !formState.city.trim()) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires (*).');
      return;
    }

    if (editingAddress) {
      updateDeliveryAddress({
        ...editingAddress,
        customerId: formState.customerId,
        label: formState.label,
        recipientName: formState.recipientName.trim(),
        phone: formState.phone.trim(),
        addressLine1: formState.addressLine1.trim(),
        addressLine2: formState.addressLine2.trim(),
        city: formState.city.trim(),
        region: formState.region.trim(),
        country: formState.country.trim() || 'Sénégal',
        postalCode: formState.postalCode.trim(),
        additionalInfo: formState.additionalInfo.trim(),
        isDefault: formState.isDefault,
        isActive: formState.isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin PROS',
      });
      setSuccessMsg(`Adresse de "${formState.recipientName}" mise à jour.`);
    } else {
      addDeliveryAddress({
        customerId: formState.customerId,
        label: formState.label,
        recipientName: formState.recipientName.trim(),
        phone: formState.phone.trim(),
        addressLine1: formState.addressLine1.trim(),
        addressLine2: formState.addressLine2.trim(),
        city: formState.city.trim(),
        region: formState.region.trim(),
        country: formState.country.trim() || 'Sénégal',
        postalCode: formState.postalCode.trim(),
        additionalInfo: formState.additionalInfo.trim(),
        isDefault: formState.isDefault,
        isActive: formState.isActive,
        createdBy: 'Admin PROS',
      });
      setSuccessMsg(`Nouvelle adresse pour "${formState.recipientName}" ajoutée avec succès.`);
    }

    setIsFormModalOpen(false);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (!addressToDelete) return;
    const res = deleteDeliveryAddress(addressToDelete.id);
    if (!res.success) {
      setErrorMsg(res.message || 'Impossible de supprimer cette adresse.');
    } else {
      setSuccessMsg(res.message || 'Adresse supprimée.');
    }
    setAddressToDelete(null);
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4000);
  };

  // Export CSV Handler
  const handleExportCsv = () => {
    const headers = [
      'ID Adresse',
      'Client Email',
      'Client Nom',
      'Label Type',
      'Destinataire',
      'Téléphone',
      'Adresse Ligne 1',
      'Adresse Ligne 2',
      'Ville',
      'Région',
      'Pays',
      'Code Postal',
      'Par Défaut',
      'Statut',
      'Date Création',
    ];

    const rows = filteredAddresses.map((addr) => {
      const cust = customers.find((c) => c.id === addr.customerId);
      return [
        addr.id,
        cust ? cust.email : '-',
        cust ? `${cust.firstName} ${cust.lastName}` : '-',
        addr.label,
        addr.recipientName,
        addr.phone,
        addr.addressLine1,
        addr.addressLine2 || '',
        addr.city,
        addr.region,
        addr.country,
        addr.postalCode || '',
        addr.isDefault ? 'OUI' : 'NON',
        addr.isActive ? 'ACTIF' : 'INACTIF',
        new Date(addr.createdAt).toLocaleString('fr-FR'),
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PROS_ADRESSES_LIVRAISON_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import Parser
  const handleParseCsvText = (text: string) => {
    setRawCsvText(text);
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setImportParsedRows([]);
      return;
    }

    const rows = lines.slice(1).map((line, idx) => {
      const parts = line.split(';').map((p) => p.replace(/^"|"$/g, '').trim());
      const email = parts[0] || '';
      const label = (parts[1]?.toUpperCase() || 'DOMICILE') as AddressLabel;
      const recipient = parts[2] || '';
      const phone = parts[3] || '';
      const line1 = parts[4] || '';
      const line2 = parts[5] || '';
      const city = parts[6] || '';
      const region = parts[7] || '';
      const country = parts[8] || 'Sénégal';
      const postalCode = parts[9] || '';
      const isDefault = parts[11]?.toUpperCase() === 'OUI' || parts[11]?.toUpperCase() === 'TRUE';
      const isActive = parts[12]?.toUpperCase() !== 'NON' && parts[12]?.toUpperCase() !== 'FALSE';

      const cust = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
      const isValid = Boolean(cust && recipient && line1 && city && phone);
      let errorReason = '';
      if (!cust) errorReason = 'Client introuvable';
      else if (!recipient) errorReason = 'Destinataire manquant';
      else if (!line1) errorReason = 'Adresse ligne 1 manquante';
      else if (!city) errorReason = 'Ville manquante';
      else if (!phone) errorReason = 'Téléphone manquant';

      return {
        lineNum: idx + 2,
        email,
        customerId: cust ? cust.id : '',
        customerName: cust ? `${cust.firstName} ${cust.lastName}` : 'INCONNU',
        label,
        recipient,
        phone,
        line1,
        line2,
        city,
        region,
        country,
        postalCode,
        isDefault,
        isActive,
        isValid,
        errorReason,
      };
    });

    setImportParsedRows(rows);
  };

  // Execute CSV Import
  const handleExecuteImport = () => {
    const validRows = importParsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('Aucune ligne valide à importer.');
      return;
    }

    const payload = validRows.map((r) => ({
      customerId: r.customerId,
      label: r.label,
      recipientName: r.recipient,
      phone: r.phone,
      addressLine1: r.line1,
      addressLine2: r.line2,
      city: r.city,
      region: r.region || r.city,
      country: r.country || 'Sénégal',
      postalCode: r.postalCode,
      additionalInfo: '',
      isDefault: r.isDefault,
      isActive: r.isActive,
      createdBy: 'Import CSV',
    }));

    const res = importDeliveryAddresses(payload);
    setSuccessMsg(`${res.count} adresse(s) importée(s) avec succès.`);
    setIsImportModalOpen(false);
    setRawCsvText('');
    setImportParsedRows([]);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Page Header */}
        <AdminPageHeader
          eyebrow="LOGISTIQUE & LIVRAISONS"
          title="RÉPERTOIRE DES ADRESSES DE LIVRAISON"
          description="Gérez les adresses de livraison des clients, définissez les points par défaut, et synchronisez-les avec le CRM et l'historique des commandes."
          primaryAction={
            <div className="flex flex-wrap items-center gap-3 font-sans">
              <button
                onClick={() => {
                  const sample = `customer_email;label;recipient_name;phone;address_line1;address_line2;city;region;country;postal_code;additional_info;is_default;is_active\nmoussa.diop@gmail.com;DOMICILE;Moussa Diop;+221 77 123 45 67;Avenue Cheikh Anta Diop;Villa 12;Dakar;Dakar;Sénégal;11500;;OUI;OUI`;
                  handleParseCsvText(sample);
                  setIsImportModalOpen(true);
                }}
                className="px-4 py-2.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                <Upload size={16} />
                <span>IMPORTER CSV</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="px-4 py-2.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                <Download size={16} />
                <span>EXPORTER CSV</span>
              </button>

              {hasPermission('CREATE_DELIVERY_ADDRESSES') && (
                <button
                  onClick={handleOpenCreateModal}
                  className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md font-sans"
                >
                  <Plus size={16} />
                  <span>NOUVELLE ADRESSE</span>
                </button>
              )}
            </div>
          }
        />

        {/* Message Banners */}
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

        {errorMsg && (
          <div className="p-4 bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-center justify-between animate-fade-in font-sans">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* 5 Dynamic KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 font-sans">
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-sans">TOTAL ADRESSES</div>
            <div className="text-2xl font-bold font-mono text-black">{totalAddressesCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Base de données PROS</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-sans">ADRESSES ACTIVES</div>
            <div className="text-2xl font-bold font-mono text-emerald-600">{activeAddressesCount}</div>
            <div className="text-[10px] text-emerald-800 font-sans font-bold">Disponibles checkout</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-pros-gold font-sans">PAR DÉFAUT</div>
            <div className="text-2xl font-bold font-mono text-black">{defaultAddressesCount}</div>
            <div className="text-[10px] text-neutral-500 font-sans">1 adresse / client</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-sans">CLIENTS AVEC ADRESSE</div>
            <div className="text-2xl font-bold font-mono text-black">{customersWithAddressCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Membres rattachés</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 font-sans">SANS ADRESSE</div>
            <div className="text-2xl font-bold font-mono text-amber-600">{customersWithoutAddressCount}</div>
            <div className="text-[10px] text-amber-800 font-sans">Prospects / Nouveaux</div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white border border-neutral-200 p-4 space-y-4 shadow-sm font-sans">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par client, téléphone, ville, région, adresse..."
                className="w-full pl-9 pr-4 py-2 bg-pros-bone border border-neutral-300 text-xs text-black font-sans focus:outline-none focus:border-black"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-neutral-400 hover:text-black">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
              
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Statut:</span>
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-pros-bone border border-neutral-300 px-2.5 py-1.5 text-xs text-black font-bold uppercase focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TOUS</option>
                  <option value="ACTIVE">ACTIVES</option>
                  <option value="INACTIVE">INACTIVES</option>
                </select>
              </div>

              {/* City Filter */}
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Ville:</span>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="bg-pros-bone border border-neutral-300 px-2.5 py-1.5 text-xs text-black font-bold uppercase focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TOUTES LES VILLES</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Région:</span>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="bg-pros-bone border border-neutral-300 px-2.5 py-1.5 text-xs text-black font-bold uppercase focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TOUTES LES RÉGIONS</option>
                  {availableRegions.map((region) => (
                    <option key={region} value={region}>
                      {region.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 font-sans">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-pros-bone border border-neutral-300 px-2.5 py-1.5 text-xs text-black font-bold uppercase focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TOUS LES TYPES</option>
                  <option value="DOMICILE">DOMICILE</option>
                  <option value="BUREAU">BUREAU</option>
                  <option value="TRAVAIL">TRAVAIL</option>
                  <option value="AUTRE">AUTRE</option>
                </select>
              </div>

              {/* Default Only Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none bg-pros-bone border border-neutral-300 px-3 py-1.5">
                <input
                  type="checkbox"
                  checked={defaultOnlyFilter}
                  onChange={(e) => setDefaultOnlyFilter(e.target.checked)}
                  className="accent-pros-black cursor-pointer"
                />
                <span className="text-xs font-bold text-black uppercase">PAR DÉFAUT</span>
              </label>

            </div>
          </div>
        </div>

        {/* Addresses Main Table */}
        <div className="bg-white border border-neutral-200 shadow-sm font-sans">
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-pros-bone border-b border-neutral-200 text-[10px] font-bold text-black uppercase font-sans">
                <tr>
                  <th className="p-3">CLIENT</th>
                  <th className="p-3">DESTINATAIRE</th>
                  <th className="p-3">ADRESSE COMPLÈTE</th>
                  <th className="p-3">VILLE & RÉGION</th>
                  <th className="p-3">TÉLÉPHONE</th>
                  <th className="p-3 text-center">TYPE</th>
                  <th className="p-3 text-center">PAR DÉFAUT</th>
                  <th className="p-3 text-center">STATUT</th>
                  <th className="p-3">DERNIÈRE MODIF.</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs font-sans">
                {filteredAddresses.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-neutral-500 font-sans">
                      Aucune adresse de livraison ne correspond à vos critères de recherche.
                    </td>
                  </tr>
                ) : (
                  filteredAddresses.map((addr) => {
                    const cust = customers.find((c) => c.id === addr.customerId);
                    const linkedOrdersCount = orders.filter(
                      (o) => o.deliveryAddressId === addr.id || (o.customer && o.customer.email.toLowerCase() === addr.recipientName.toLowerCase())
                    ).length;

                    return (
                      <tr key={addr.id} className="hover:bg-pros-bone/70 transition-colors font-sans">
                        
                        {/* CLIENT */}
                        <td className="p-3 align-top font-sans">
                          {cust ? (
                            <div>
                              <div className="font-bold text-black uppercase">{cust.firstName} {cust.lastName}</div>
                              <div className="text-[10px] text-neutral-500 font-mono">{cust.email}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">Client non rattaché</span>
                          )}
                        </td>

                        {/* DESTINATAIRE */}
                        <td className="p-3 align-top font-bold text-black uppercase font-sans">
                          {addr.recipientName}
                        </td>

                        {/* ADRESSE COMPLÈTE */}
                        <td className="p-3 align-top font-sans">
                          <div className="font-bold text-black">{addr.addressLine1}</div>
                          {addr.addressLine2 && <div className="text-[11px] text-neutral-600">{addr.addressLine2}</div>}
                          {addr.additionalInfo && (
                            <div className="text-[10px] text-amber-800 font-mono italic">Note: {addr.additionalInfo}</div>
                          )}
                        </td>

                        {/* VILLE & RÉGION */}
                        <td className="p-3 align-top font-sans">
                          <div className="font-bold text-black uppercase">{addr.city}</div>
                          <div className="text-[10px] text-neutral-500 uppercase">{addr.region}, {addr.country}</div>
                        </td>

                        {/* TÉLÉPHONE */}
                        <td className="p-3 align-top font-mono text-black font-bold">
                          {addr.phone}
                        </td>

                        {/* TYPE */}
                        <td className="p-3 align-top text-center font-sans">
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-neutral-100 border border-neutral-300 text-black uppercase font-mono">
                            {addr.label}
                          </span>
                        </td>

                        {/* PAR DÉFAUT */}
                        <td className="p-3 align-top text-center font-sans">
                          {addr.isDefault ? (
                            <span className="px-2.5 py-0.5 text-[9px] font-extrabold bg-pros-black text-pros-gold uppercase font-mono tracking-wider">
                              ★ PAR DÉFAUT
                            </span>
                          ) : (
                            <span className="text-neutral-300 text-[10px]">-</span>
                          )}
                        </td>

                        {/* STATUT */}
                        <td className="p-3 align-top text-center font-sans">
                          {addr.isActive ? (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase font-sans">
                              ACTIF
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase font-sans">
                              INACTIF
                            </span>
                          )}
                        </td>

                        {/* DERNIÈRE MODIF. */}
                        <td className="p-3 align-top font-mono text-[10px] text-neutral-500">
                          {addr.updatedAt ? new Date(addr.updatedAt).toLocaleString('fr-FR') : new Date(addr.createdAt).toLocaleDateString('fr-FR')}
                        </td>

                        {/* ACTIONS */}
                        <td className="p-3 align-top text-right space-x-1.5 font-sans">
                          <button
                            onClick={() => setViewingAddress(addr)}
                            className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black cursor-pointer inline-flex items-center"
                            title={`Voir la fiche détaillée (${linkedOrdersCount} commande(s) associée(s))`}
                          >
                            <Eye size={13} />
                          </button>

                          {hasPermission('EDIT_DELIVERY_ADDRESSES') && (
                            <button
                              onClick={() => handleOpenEditModal(addr)}
                              className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black cursor-pointer inline-flex items-center"
                              title="Modifier l'adresse"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}

                          {hasPermission('SET_DEFAULT_DELIVERY_ADDRESS') && !addr.isDefault && (
                            <button
                              onClick={() => setDefaultDeliveryAddress(addr.id)}
                              className="p-1.5 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-900 cursor-pointer inline-flex items-center"
                              title="Définir comme adresse par défaut"
                            >
                              <Star size={13} />
                            </button>
                          )}

                          <button
                            onClick={() => toggleAddressActiveStatus(addr.id)}
                            className={`p-1.5 border cursor-pointer inline-flex items-center ${
                              addr.isActive ? 'bg-neutral-100 border-neutral-300 text-neutral-700' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            }`}
                            title={addr.isActive ? 'Désactiver l\'adresse' : 'Activer l\'adresse'}
                          >
                            {addr.isActive ? <Lock size={13} /> : <Unlock size={13} />}
                          </button>

                          {hasPermission('DELETE_DELIVERY_ADDRESSES') && (
                            <button
                              onClick={() => setAddressToDelete(addr)}
                              className="p-1.5 bg-red-50 border border-red-300 hover:bg-red-100 text-red-600 cursor-pointer inline-flex items-center"
                              title="Supprimer l'adresse"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: CREATE / EDIT ADDRESS */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[92vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="font-display font-bold text-lg uppercase text-black flex items-center gap-2">
                  <MapPin size={20} className="text-pros-gold" />
                  <span>{editingAddress ? 'MODIFIER L\'ADRESSE DE LIVRAISON' : 'AJOUTER UNE NOUVELLE ADRESSE'}</span>
                </h3>
                <button onClick={() => setIsFormModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans">
                
                {/* Customer Selection */}
                <div>
                  <label className="font-bold uppercase text-black block mb-1">CLIENT RATTACHÉ *</label>
                  <select
                    required
                    value={formState.customerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const cust = customers.find((c) => c.id === cid);
                      setFormState({
                        ...formState,
                        customerId: cid,
                        recipientName: cust ? `${cust.firstName} ${cust.lastName}` : formState.recipientName,
                        phone: cust ? cust.phone : formState.phone,
                        city: cust ? cust.city : formState.city,
                        region: cust ? cust.region : formState.region,
                      });
                    }}
                    className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans font-bold uppercase focus:outline-none cursor-pointer"
                  >
                    <option value="">-- SÉLECTIONNER UN CLIENT --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.email}) - {c.city}
                      </option>
                    ))}
                  </select>

                  {selectedCustomerInfo && (
                    <div className="mt-2 p-3 bg-pros-bone border border-neutral-300 space-y-1 font-sans text-[11px]">
                      <div className="font-bold text-black flex justify-between">
                        <span>Fiche Client: {selectedCustomerInfo.cust.firstName} {selectedCustomerInfo.cust.lastName}</span>
                        <span className="font-mono text-neutral-500">{selectedCustomerInfo.count} adresse(s) existante(s)</span>
                      </div>
                      <div className="text-neutral-600">Email: {selectedCustomerInfo.cust.email} | Tél: {selectedCustomerInfo.cust.phone}</div>
                      {selectedCustomerInfo.hasDefault && formState.isDefault && (
                        <div className="text-amber-800 font-bold flex items-center gap-1 mt-1">
                          <AlertCircle size={12} />
                          <span>Attention: Définir cette adresse comme par défaut remplacera l'adresse par défaut actuelle du client.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Label Type */}
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">TYPE D'ADRESSE *</label>
                    <select
                      value={formState.label}
                      onChange={(e: any) => setFormState({ ...formState, label: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans font-bold uppercase focus:outline-none cursor-pointer"
                    >
                      <option value="DOMICILE">DOMICILE</option>
                      <option value="BUREAU">BUREAU</option>
                      <option value="TRAVAIL">TRAVAIL</option>
                      <option value="AUTRE">AUTRE</option>
                    </select>
                  </div>

                  {/* Recipient Name */}
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">NOM DU DESTINATAIRE *</label>
                    <input
                      type="text"
                      required
                      value={formState.recipientName}
                      onChange={(e) => setFormState({ ...formState, recipientName: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">TÉLÉPHONE CONTACT *</label>
                    <input
                      type="text"
                      required
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-mono focus:outline-none"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">VILLE *</label>
                    <input
                      type="text"
                      required
                      value={formState.city}
                      onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                      placeholder="ex: Dakar, Thiès, Saint-Louis..."
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans uppercase focus:outline-none"
                    />
                  </div>
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="font-bold uppercase text-black block mb-1">ADRESSE LIGNE 1 *</label>
                  <input
                    type="text"
                    required
                    value={formState.addressLine1}
                    onChange={(e) => setFormState({ ...formState, addressLine1: e.target.value })}
                    placeholder="ex: Avenue Cheikh Anta Diop, Rue 10 x Corniche..."
                    className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none"
                  />
                </div>

                {/* Address Line 2 */}
                <div>
                  <label className="font-bold uppercase text-black block mb-1">COMPLÉMENT D'ADRESSE (RÉSIDENCE / ÉTAGE)</label>
                  <input
                    type="text"
                    value={formState.addressLine2}
                    onChange={(e) => setFormState({ ...formState, addressLine2: e.target.value })}
                    placeholder="ex: Immeuble Khadija, Apt 4B, 2ème étage..."
                    className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Region */}
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">RÉGION *</label>
                    <input
                      type="text"
                      required
                      value={formState.region}
                      onChange={(e) => setFormState({ ...formState, region: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans uppercase focus:outline-none"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">PAYS</label>
                    <input
                      type="text"
                      value={formState.country}
                      onChange={(e) => setFormState({ ...formState, country: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">CODE POSTAL</label>
                    <input
                      type="text"
                      value={formState.postalCode}
                      onChange={(e) => setFormState({ ...formState, postalCode: e.target.value })}
                      placeholder="ex: 11500"
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Additional Info / Instructions */}
                <div>
                  <label className="font-bold uppercase text-black block mb-1">INSTRUCTIONS DE LIVRAISON</label>
                  <textarea
                    rows={2}
                    value={formState.additionalInfo}
                    onChange={(e) => setFormState({ ...formState, additionalInfo: e.target.value })}
                    placeholder="ex: Appeler au portail, livrer uniquement les jours ouvrés..."
                    className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-black font-sans focus:outline-none"
                  />
                </div>

                {/* Checkboxes */}
                <div className="pt-2 flex flex-wrap gap-6 font-sans">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formState.isDefault}
                      onChange={(e) => setFormState({ ...formState, isDefault: e.target.checked })}
                      className="accent-pros-black cursor-pointer"
                    />
                    <span className="font-bold text-black uppercase">DÉFINIR COMME ADRESSE PAR DÉFAUT</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formState.isActive}
                      onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                      className="accent-pros-black cursor-pointer"
                    />
                    <span className="font-bold text-black uppercase">ADRESSE ACTIVE (CHECKOUT)</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-5 py-2.5 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                  >
                    ANNULER
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer"
                  >
                    {editingAddress ? 'ENREGISTRER LES MODIFICATIONS' : 'AJOUTER L\'ADRESSE'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL: DETAIL DRAWER ("VOIR") */}
        {viewingAddress && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-8 space-y-6 text-black font-sans shadow-2xl">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-3">
                  <MapPin size={22} className="text-pros-gold" />
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 font-mono block">FICHE ADRESSE #{viewingAddress.id}</span>
                    <h3 className="font-display font-bold text-base uppercase text-black">{viewingAddress.recipientName}</h3>
                  </div>
                </div>
                <button onClick={() => setViewingAddress(null)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                
                {/* Badges */}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-neutral-100 border border-neutral-300 text-black font-mono">
                    TYPE: {viewingAddress.label}
                  </span>
                  {viewingAddress.isDefault && (
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-pros-black text-pros-gold font-mono uppercase">
                      ★ PAR DÉFAUT
                    </span>
                  )}
                  {viewingAddress.isActive ? (
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                      ACTIF
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase">
                      INACTIF
                    </span>
                  )}
                </div>

                {/* Customer Info */}
                {(() => {
                  const cust = customers.find((c) => c.id === viewingAddress.customerId);
                  return (
                    <div className="p-4 bg-pros-bone border border-neutral-200 space-y-1 font-sans">
                      <div className="font-bold text-black text-xs uppercase flex items-center gap-2">
                        <User size={14} /> CLIENT RATTACHÉ : {cust ? `${cust.firstName} ${cust.lastName}` : 'INCONNU'}
                      </div>
                      {cust && (
                        <div className="text-[11px] text-neutral-600">
                          Email: {cust.email} | Tél: {cust.phone} | Segment: {cust.status}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Address Lines */}
                <div className="space-y-1 font-sans">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase">Adresse physique:</div>
                  <div className="font-bold text-black text-sm">{viewingAddress.addressLine1}</div>
                  {viewingAddress.addressLine2 && <div className="text-neutral-700 text-xs">{viewingAddress.addressLine2}</div>}
                  <div className="text-neutral-800 text-xs uppercase font-bold">
                    {viewingAddress.city}, {viewingAddress.region} — {viewingAddress.country} {viewingAddress.postalCode && `(${viewingAddress.postalCode})`}
                  </div>
                  {viewingAddress.additionalInfo && (
                    <div className="text-amber-800 font-mono text-[11px] pt-1">
                      Instructions: {viewingAddress.additionalInfo}
                    </div>
                  )}
                </div>

                {/* Linked Orders History */}
                {(() => {
                  const linkedOrders = orders.filter(
                    (o) => o.deliveryAddressId === viewingAddress.id || (o.customer && o.customer.email.toLowerCase() === viewingAddress.recipientName.toLowerCase())
                  );
                  return (
                    <div className="pt-4 border-t border-neutral-200 space-y-2 font-sans">
                      <div className="font-bold text-black text-xs uppercase flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><ShoppingBag size={14} /> HISTORIQUE DES COMMANDES ASSOCIÉES</span>
                        <span className="font-mono text-neutral-500">{linkedOrders.length} commande(s)</span>
                      </div>

                      {linkedOrders.length === 0 ? (
                        <div className="text-[11px] text-neutral-500 font-sans italic">
                          Aucune commande passée avec cette adresse pour le moment.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-100 max-h-40 overflow-y-auto font-sans">
                          {linkedOrders.map((o) => (
                            <div key={o.id} className="py-2 flex items-center justify-between text-[11px] font-sans">
                              <div>
                                <span className="font-mono font-bold text-black">#{o.trackingNumber}</span>
                                <span className="text-neutral-500 ml-2">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                              <div className="font-mono font-bold text-black">{formatPrice(o.total)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                <button
                  onClick={() => setViewingAddress(null)}
                  className="px-6 py-2 bg-pros-black text-white font-bold uppercase text-xs cursor-pointer"
                >
                  FERMER
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: IMPORT CSV PREVIEW */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[92vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="font-display font-bold text-lg uppercase text-black flex items-center gap-2">
                  <Upload size={20} className="text-pros-gold" />
                  <span>IMPORTATION MASSIVE D'ADRESSES (CSV)</span>
                </h3>
                <button onClick={() => setIsImportModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="font-bold uppercase text-black block mb-1">COLLER LE CONTENU DU FICHIER CSV (SÉPARATEUR ';')</label>
                  <textarea
                    rows={4}
                    value={rawCsvText}
                    onChange={(e) => handleParseCsvText(e.target.value)}
                    placeholder="customer_email;label;recipient_name;phone;address_line1;address_line2;city;region;country;postal_code;additional_info;is_default;is_active"
                    className="w-full bg-pros-bone border border-neutral-300 p-2.5 font-mono text-[11px] text-black focus:outline-none"
                  />
                </div>

                {importParsedRows.length > 0 && (
                  <div className="space-y-3 font-sans">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-xs uppercase text-black">APERÇU DE L'ANALYSE ({importParsedRows.length} LIGNES)</h4>
                      <div className="flex gap-3 text-[11px] font-bold font-mono">
                        <span className="text-emerald-700">{importParsedRows.filter((r) => r.isValid).length} VALIDES</span>
                        <span className="text-red-700">{importParsedRows.filter((r) => !r.isValid).length} INVALIDES</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-60 border border-neutral-200 font-sans">
                      <table className="w-full text-left text-[11px] border-collapse font-sans">
                        <thead className="bg-pros-bone border-b border-neutral-200 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2">LIGNE</th>
                            <th className="p-2">CLIENT EMAIL</th>
                            <th className="p-2">DESTINATAIRE</th>
                            <th className="p-2">ADRESSE LIGNE 1</th>
                            <th className="p-2">VILLE</th>
                            <th className="p-2 text-center">VALIDITÉ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 font-sans">
                          {importParsedRows.map((row) => (
                            <tr key={row.lineNum} className={row.isValid ? 'bg-white' : 'bg-red-50'}>
                              <td className="p-2 font-mono font-bold">{row.lineNum}</td>
                              <td className="p-2 font-mono">{row.email}</td>
                              <td className="p-2 font-bold uppercase">{row.recipient}</td>
                              <td className="p-2">{row.line1}</td>
                              <td className="p-2 font-bold uppercase">{row.city}</td>
                              <td className="p-2 text-center">
                                {row.isValid ? (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800">OK</span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-800">{row.errorReason}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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
                  disabled={importParsedRows.filter((r) => r.isValid).length === 0}
                  onClick={handleExecuteImport}
                  className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  CONFIRMER L'IMPORTATION ({importParsedRows.filter((r) => r.isValid).length})
                </button>
              </div>

            </div>
          </div>
        )}

        {/* CONFIRM DELETE DIALOG */}
        <AdminConfirmDialog
          isOpen={!!addressToDelete}
          title="CONFIRMATION DE SUPPRESSION D'ADRESSE"
          message={`Êtes-vous sûr de vouloir supprimer l'adresse de "${addressToDelete?.recipientName}" à ${addressToDelete?.city} ? Si cette adresse est associée à des commandes historiques, elle devra être désactivée au lieu d'être supprimée.`}
          confirmText="SUPPRIMER"
          onConfirm={handleConfirmDelete}
          onCancel={() => setAddressToDelete(null)}
        />

      </div>
    </AdminLayout>
  );
};
