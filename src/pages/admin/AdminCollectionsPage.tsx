import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { useStore } from '../../store/storeContext';
import type { CatalogCollection, CollectionStatus } from '../../types/ecommerce';
import {
  Plus,
  Trash2,
  Search,
  Check,
  X,
  Layers,
  Download,
  Eye,
  Copy,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Globe,
  Menu as MenuIcon,
  Home,
  AlertTriangle,
  ExternalLink,
  GripVertical,
  RefreshCw,
  Upload,
  Loader2,
  Sparkles,
  Package,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const AdminCollectionsPage: React.FC = () => {
  const { collections, products, addCollection, updateCollection, deleteCollection, reorderCollections, duplicateCollection, formatPrice } = useStore();
  const navigate = useNavigate();

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CollectionStatus | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'store' | 'menu' | 'homepage'>('all');
  const [contentFilter, setContentFilter] = useState<'all' | 'with_products' | 'empty'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'most-products' | 'least-products' | 'order-asc'>('order-asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Selection & Modal State
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CatalogCollection | null>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<CatalogCollection | null>(null);
  const [detailDrawerCollection, setDetailDrawerCollection] = useState<CatalogCollection | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Product Selector Drawer State within Creation Form
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    fullDescription: '',
    imageUrl: '',
    status: 'DRAFT' as CollectionStatus,
    displayOrder: 1,
    productIds: [] as string[],
    metaTitle: '',
    metaDescription: '',
    seoSlug: '',
    showOnStore: true,
    showInMenu: true,
    showOnHomepage: true,
  });

  // Simulated Database Load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard ESC Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && !isProductPickerOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isProductPickerOpen]);

  const handleRetryLoad = () => {
    setIsLoading(true);
    setIsError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Real-time Product count per collection
  const collectionProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    collections.forEach((col) => {
      const explicitCount = col.productIds ? col.productIds.length : 0;
      // Also match by product.collection field
      const matchByTag = products.filter((p) => p.collection?.toLowerCase() === col.slug.toLowerCase()).length;
      counts[col.id] = Math.max(explicitCount, matchByTag);
    });
    return counts;
  }, [collections, products]);

  // Total products classified across all collections
  const totalClassifiedProducts = useMemo(() => {
    return products.filter((p) => Boolean(p.collection)).length;
  }, [products]);

  // Real-time KPIs
  const stats = useMemo(() => {
    const total = collections.length;
    const active = collections.filter((c) => c.status === 'ACTIVE').length;
    const empty = collections.filter((c) => (collectionProductCounts[c.id] || 0) === 0).length;
    const classified = totalClassifiedProducts;

    return { total, active, empty, classified };
  }, [collections, collectionProductCounts, totalClassifiedProducts]);

  // Filtered & Sorted Collections
  const filteredCollections = useMemo(() => {
    return collections
      .filter((c) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          c.name.toLowerCase().includes(query) ||
          c.slug.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

        let matchesVisibility = true;
        if (visibilityFilter === 'store') matchesVisibility = c.showOnStore;
        if (visibilityFilter === 'menu') matchesVisibility = c.showInMenu;
        if (visibilityFilter === 'homepage') matchesVisibility = c.showOnHomepage;

        const count = collectionProductCounts[c.id] || 0;
        let matchesContent = true;
        if (contentFilter === 'with_products') matchesContent = count > 0;
        if (contentFilter === 'empty') matchesContent = count === 0;

        return matchesSearch && matchesStatus && matchesVisibility && matchesContent;
      })
      .sort((a, b) => {
        const countA = collectionProductCounts[a.id] || 0;
        const countB = collectionProductCounts[b.id] || 0;

        if (sortBy === 'order-asc') return (a.displayOrder || 99) - (b.displayOrder || 99);
        if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
        if (sortBy === 'oldest') return (a.id || '').localeCompare(b.id || '');
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'most-products') return countB - countA;
        if (sortBy === 'least-products') return countA - countB;
        return 0;
      });
  }, [collections, searchTerm, statusFilter, visibilityFilter, contentFilter, sortBy, collectionProductCounts]);

  // Paginated Collections
  const totalPages = Math.ceil(filteredCollections.length / itemsPerPage) || 1;
  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCollections.slice(start, start + itemsPerPage);
  }, [filteredCollections, currentPage, itemsPerPage]);

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...filteredCollections];
    const item = updated.splice(draggedIndex, 1)[0];
    updated.splice(index, 0, item);

    reorderCollections(updated);
    setDraggedIndex(null);
    setSuccessMsg('Ordre d’affichage réorganisé par glisser-déposer.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Open Creation Modal
  const handleOpenCreateModal = () => {
    setEditingCollection(null);
    setSlugError(null);
    setIsSubmitting(false);

    const nextOrder = collections.length > 0 ? Math.max(...collections.map((c) => c.displayOrder || 1)) + 1 : 1;

    setFormData({
      name: '',
      slug: '',
      description: 'Découvrez la nouvelle collection officielle PROS.',
      fullDescription: 'Pièces d’exception confectionnées selon les standards de la haute couture PROS.',
      imageUrl: '',
      status: 'DRAFT',
      displayOrder: nextOrder,
      productIds: [],
      metaTitle: '',
      metaDescription: '',
      seoSlug: '',
      showOnStore: true,
      showInMenu: true,
      showOnHomepage: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: CatalogCollection) => {
    setEditingCollection(c);
    setSlugError(null);
    setIsSubmitting(false);
    setFormData({
      name: c.name,
      slug: c.slug,
      description: c.description,
      fullDescription: c.fullDescription || '',
      imageUrl: c.imageUrl || '',
      status: c.status,
      displayOrder: c.displayOrder || 1,
      productIds: c.productIds || [],
      metaTitle: c.metaTitle || '',
      metaDescription: c.metaDescription || '',
      seoSlug: c.seoSlug || c.slug,
      showOnStore: c.showOnStore ?? true,
      showInMenu: c.showInMenu ?? true,
      showOnHomepage: c.showOnHomepage ?? true,
    });
    setIsModalOpen(true);
  };

  // Close Modal Handler
  const handleCloseModal = () => {
    if (formData.name.trim() !== '') {
      if (window.confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?')) {
        setIsModalOpen(false);
      }
    } else {
      setIsModalOpen(false);
    }
  };

  // Auto-generate slug & SEO from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCollection ? prev.slug : generatedSlug,
      seoSlug: editingCollection ? prev.seoSlug : generatedSlug,
      metaTitle: editingCollection ? prev.metaTitle : `${name} — Collection PROS`,
      metaDescription: editingCollection ? prev.metaDescription : `Découvrez la collection ${name} officielle de la marque PROS.`,
    }));
  };

  // Media Upload File Handling
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const processImageFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      alert('Veuillez sélectionner un fichier image au format JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Taille d’image trop lourde. La taille maximale recommandée est 5 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({ ...prev, imageUrl: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle Product Selection in Collection Form
  const handleToggleProductInCollection = (productId: string) => {
    setFormData((prev) => {
      const exists = prev.productIds.includes(productId);
      if (exists) {
        return { ...prev, productIds: prev.productIds.filter((id) => id !== productId) };
      }
      return { ...prev, productIds: [...prev.productIds, productId] };
    });
  };

  // Reorder Products inside Collection Form
  const handleMoveProductInCollection = (index: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const updated = [...prev.productIds];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;

      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, productIds: updated };
    });
  };

  // Form Submit (Create or Edit with simulation of database transaction)
  const handleSubmitCollection = (e: React.FormEvent) => {
    e.preventDefault();
    setSlugError(null);

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setSlugError('Le nom de la collection doit comporter au moins 2 caractères.');
      return;
    }

    const slug = formData.slug.trim().toLowerCase() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Validate Unique Slug
    const existing = collections.find((c) => c.slug.toLowerCase() === slug && c.id !== editingCollection?.id);
    if (existing) {
      setSlugError(`Le slug "/${slug}" existe déjà pour une autre collection.`);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (editingCollection) {
        const updated: CatalogCollection = {
          ...editingCollection,
          name: formData.name.toUpperCase().trim(),
          slug,
          description: formData.description,
          fullDescription: formData.fullDescription,
          imageUrl: formData.imageUrl.trim() || undefined,
          status: formData.status,
          displayOrder: Number(formData.displayOrder),
          productIds: formData.productIds,
          metaTitle: formData.metaTitle || `${formData.name} — Collection PROS`,
          metaDescription: formData.metaDescription || `Découvrez la collection ${formData.name} officielle PROS.`,
          seoSlug: formData.seoSlug || slug,
          showOnStore: formData.showOnStore,
          showInMenu: formData.showInMenu,
          showOnHomepage: formData.showOnHomepage,
          updatedAt: new Date().toISOString(),
        };
        updateCollection(updated);
        setSuccessMsg(`Collection "${updated.name}" mise à jour avec succès.`);
      } else {
        const newCollection: CatalogCollection = {
          id: `col-${Date.now()}`,
          name: formData.name.toUpperCase().trim(),
          slug,
          description: formData.description,
          fullDescription: formData.fullDescription,
          imageUrl: formData.imageUrl.trim() || undefined,
          status: formData.status,
          displayOrder: Number(formData.displayOrder),
          productIds: formData.productIds,
          metaTitle: formData.metaTitle || `${formData.name} — Collection PROS`,
          metaDescription: formData.metaDescription || `Découvrez la collection ${formData.name} officielle PROS.`,
          seoSlug: formData.seoSlug || slug,
          showOnStore: formData.showOnStore,
          showInMenu: formData.showInMenu,
          showOnHomepage: formData.showOnHomepage,
          createdAt: new Date().toISOString(),
        };
        addCollection(newCollection);
        setSuccessMsg(`Collection "${newCollection.name}" créée avec succès.`);
      }

      setIsSubmitting(false);
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 450);
  };

  // Duplicate Collection Action
  const handleDuplicate = (c: CatalogCollection) => {
    const dup = duplicateCollection(c);
    setSuccessMsg(`Collection "${c.name}" dupliquée sous le nom "${dup.name}" (BROUILLON).`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Toggle Status Action
  const handleToggleStatus = (c: CatalogCollection) => {
    const nextStatus: CollectionStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateCollection({ ...c, status: nextStatus, updatedAt: new Date().toISOString() });
    setSuccessMsg(`Collection "${c.name}" ${nextStatus === 'ACTIVE' ? 'publiée' : 'désactivée'}.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Explicit Visibility Toggles (Boutique, Menu, Homepage)
  const handleToggleVisibilityField = (c: CatalogCollection, field: 'showOnStore' | 'showInMenu' | 'showOnHomepage') => {
    const updated = { ...c, [field]: !c[field], updatedAt: new Date().toISOString() };
    updateCollection(updated);
    setSuccessMsg(`Visibilité ${field} mise à jour pour "${c.name}".`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Move Collection Order (Up / Down)
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const updated = [...filteredCollections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    reorderCollections(updated);
    setSuccessMsg('Ordre d’affichage des collections mis à jour.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Confirm Delete Action (Protection dialog)
  const confirmDelete = () => {
    if (collectionToDelete) {
      deleteCollection(collectionToDelete.id);
      setSuccessMsg(`Collection "${collectionToDelete.name}" supprimée définitivement. Les produits associés conservent leur présence au catalogue.`);
      setCollectionToDelete(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Bulk Status Update
  const handleBulkStatusChange = (newStatus: CollectionStatus) => {
    selectedCollectionIds.forEach((id) => {
      const c = collections.find((col) => col.id === id);
      if (c) {
        updateCollection({ ...c, status: newStatus, updatedAt: new Date().toISOString() });
      }
    });
    setSuccessMsg(`${selectedCollectionIds.length} collection(s) mise(s) à jour vers le statut "${newStatus}".`);
    setSelectedCollectionIds([]);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Bulk Export CSV
  const handleExportCSV = () => {
    const targetCollections = selectedCollectionIds.length > 0
      ? collections.filter((c) => selectedCollectionIds.includes(c.id))
      : filteredCollections;

    if (targetCollections.length === 0) return;

    const BOM = '\uFEFF';
    const headers = ['ID', 'NOM', 'SLUG', 'DESCRIPTION', 'STATUT', 'NOMBRE PRODUITS', 'ORDRE', 'VISIBLE BOUTIQUE', 'VISIBLE MENU', 'VISIBLE HOMEPAGE', 'DATE CRÉATION'];

    const rows = targetCollections.map((c) => {
      const pCount = collectionProductCounts[c.id] || 0;
      return [
        `"${c.id}"`,
        `"${c.name}"`,
        `"${c.slug}"`,
        `"${c.description.replace(/"/g, '""')}"`,
        `"${c.status}"`,
        `"${pCount}"`,
        `"${c.displayOrder || 1}"`,
        `"${c.showOnStore ? 'OUI' : 'NON'}"`,
        `"${c.showInMenu ? 'OUI' : 'NON'}"`,
        `"${c.showOnHomepage ? 'OUI' : 'NON'}"`,
        `"${c.createdAt}"`,
      ].join(';');
    });

    const csvContent = BOM + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pros_collections_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: CollectionStatus) => {
    if (status === 'ACTIVE') {
      return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-green-100 text-green-800 border border-green-300 uppercase font-sans">PUBLIÉE</span>;
    }
    if (status === 'DRAFT') {
      return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-neutral-200 text-neutral-800 border border-neutral-300 uppercase font-sans">BROUILLON</span>;
    }
    if (status === 'INACTIVE') {
      return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase font-sans">DÉSACTIVÉE</span>;
    }
    return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300 uppercase font-sans">ARCHIVÉE</span>;
  };

  // Render Error State
  if (isError) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto py-16 text-center space-y-4 font-sans text-pros-black">
          <AlertTriangle className="mx-auto text-red-600" size={48} />
          <h2 className="font-display font-bold text-xl uppercase">IMPOSSIBLE DE CHARGER LES COLLECTIONS</h2>
          <p className="text-xs text-neutral-600">Une erreur s'est produite lors de la récupération des données PostgreSQL des collections.</p>
          <button
            onClick={handleRetryLoad}
            className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase tracking-superwide hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer font-sans shadow-md"
          >
            <RefreshCw size={16} />
            <span>RÉESSAYER</span>
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="ADMINISTRATION PROS"
          title="GESTION DES COLLECTIONS"
          description="Créez, organisez et publiez les collections officielles de la boutique PROS."
          primaryAction={
            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase tracking-superwide hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-lg font-sans"
            >
              <Plus size={18} />
              <span>CRÉER UNE COLLECTION</span>
            </button>
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

        {/* 4 Collection KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans">
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">TOTAL COLLECTIONS</span>
            <div className="text-3xl font-bold text-black">{isLoading ? '...' : stats.total}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">COLLECTIONS PUBLIÉES</span>
            <div className="text-3xl font-bold text-emerald-700">{isLoading ? '...' : stats.active}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">COLLECTIONS VIDES</span>
            <div className="text-3xl font-bold text-amber-700">{isLoading ? '...' : stats.empty}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-pros-gold uppercase font-bold tracking-wider">PRODUITS CLASSÉS</span>
            <div className="text-3xl font-bold text-pros-gold">{isLoading ? '...' : stats.classified}</div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-pros-bone border border-neutral-200 p-4 space-y-4 shadow-sm font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-sans">
            
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher une collection par nom, slug, description..."
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
              <option value="ACTIVE">PUBLIÉES</option>
              <option value="DRAFT">BROUILLONS</option>
              <option value="INACTIVE">DÉSACTIVÉES</option>
              <option value="ARCHIVED">ARCHIVÉES</option>
            </select>

            {/* Visibility Filter */}
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">VISIBILITÉ : TOUTES</option>
              <option value="store">VISIBLE BOUTIQUE</option>
              <option value="menu">VISIBLE MENU</option>
              <option value="homepage">VISIBLE HOMEPAGE</option>
            </select>

            {/* Content Filter & Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="order-asc">ORDRE D'AFFICHAGE</option>
              <option value="newest">PLUS RÉCENTES</option>
              <option value="oldest">PLUS ANCIENNES</option>
              <option value="name-asc">NOM A-Z</option>
              <option value="name-desc">NOM Z-A</option>
              <option value="most-products">PLUS DE PRODUITS</option>
              <option value="least-products">MOINS DE PRODUITS</option>
            </select>

          </div>

          {/* Bulk Selection Actions Bar */}
          {selectedCollectionIds.length > 0 && (
            <div className="p-3 bg-pros-black text-white text-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in font-sans">
              <span className="font-bold">
                {selectedCollectionIds.length} COLLECTION(S) SÉLECTIONNÉE(S) :
              </span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={() => handleBulkStatusChange('ACTIVE')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase font-sans cursor-pointer"
                >
                  PUBLIER
                </button>
                <button
                  onClick={() => handleBulkStatusChange('INACTIVE')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase font-sans cursor-pointer"
                >
                  DÉSACTIVER
                </button>
                <button
                  onClick={() => handleBulkStatusChange('ARCHIVED')}
                  className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold text-[10px] uppercase font-sans cursor-pointer"
                >
                  ARCHIVER
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1 bg-pros-gold hover:bg-amber-600 text-black font-bold text-[10px] uppercase font-sans flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} />
                  <span>EXPORTER CSV</span>
                </button>
                <button
                  onClick={() => setSelectedCollectionIds([])}
                  className="px-2 py-1 bg-neutral-800 text-neutral-300 text-[10px] uppercase font-sans cursor-pointer"
                >
                  ANNULER
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Skeleton Loaders during fetch */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-neutral-200 h-96 p-6 space-y-4 animate-pulse">
                <div className="h-40 bg-neutral-200 w-full"></div>
                <div className="h-4 bg-neutral-200 w-3/4"></div>
                <div className="h-3 bg-neutral-200 w-1/2"></div>
                <div className="h-10 bg-neutral-200 w-full mt-auto"></div>
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          /* Official Real Empty State */
          <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm font-sans">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-pros-bone border border-neutral-300 flex items-center justify-center mx-auto text-black">
                <Layers size={32} />
              </div>
              <h3 className="font-display font-bold text-xl uppercase text-black">AUCUNE COLLECTION</h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                Vous n'avez encore créé aucune collection. Créez votre première collection pour organiser et mettre en avant vos produits sur la boutique PROS.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md font-sans"
              >
                <Plus size={16} />
                <span>CRÉER UNE COLLECTION</span>
              </button>
            </div>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm font-sans">
            <div className="max-w-sm mx-auto space-y-3">
              <Search className="mx-auto text-neutral-400" size={36} />
              <h3 className="font-display font-bold text-sm uppercase text-black">AUCUNE COLLECTION TROUVÉE</h3>
              <p className="text-xs text-neutral-500">Aucune collection ne correspond à vos critères de recherche.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setVisibilityFilter('all');
                  setContentFilter('all');
                }}
                className="px-4 py-2 bg-pros-black text-white text-xs font-bold uppercase hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <RotateCcw size={14} />
                <span>RÉINITIALISER FILTRES</span>
              </button>
            </div>
          </div>
        ) : (
          /* Collection Cards Grid with Drag & Drop */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              {paginatedCollections.map((c, index) => {
                const productCount = collectionProductCounts[c.id] || 0;
                const isSelected = selectedCollectionIds.includes(c.id);
                const hasImage = Boolean(c.imageUrl && c.imageUrl.trim() !== '');

                return (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className={`bg-white border transition-all shadow-sm font-sans h-full flex flex-col justify-between overflow-hidden relative cursor-grab active:cursor-grabbing ${
                      isSelected ? 'border-pros-black ring-1 ring-pros-black' : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {/* Top Image or Neutral PROS Placeholder */}
                    <div className="relative h-48 bg-pros-black overflow-hidden border-b border-neutral-200">
                      {hasImage ? (
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-pros-black text-white p-4 space-y-2">
                          <img src="/brand/LOGOPROS.png" alt="PROS" className="h-6 w-auto object-contain opacity-80" />
                          <span className="text-[10px] font-mono text-pros-sand font-bold tracking-widest uppercase">
                            PROS COLLECTION PLACEHOLDER
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-4 text-white">
                        
                        {/* Top Badges & Drag Grip */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedCollectionIds(selectedCollectionIds.filter((id) => id !== c.id));
                                } else {
                                  setSelectedCollectionIds([...selectedCollectionIds, c.id]);
                                }
                              }}
                              className="accent-pros-black cursor-pointer w-4 h-4"
                            />
                            <span className="p-1 bg-black/60 backdrop-blur-sm text-neutral-300" title="Glisser-déposer pour réordonner">
                              <GripVertical size={14} />
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white font-mono text-[9px] font-bold border border-white/20">
                              ORDRE #{c.displayOrder || index + 1}
                            </span>
                            {getStatusBadge(c.status)}
                          </div>
                        </div>

                        {/* Title & Slug */}
                        <div>
                          <h3 className="font-display font-bold text-xl uppercase tracking-wider text-white">
                            {c.name}
                          </h3>
                          <span className="text-[11px] font-mono text-pros-sand font-bold">
                            /{c.slug}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between font-sans">
                      <div className="space-y-3">
                        <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed font-sans">
                          {c.description}
                        </p>

                        {/* Explicit Visibility Toggles (Boutique, Menu, Accueil) */}
                        <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-[10px] uppercase font-sans">
                          <div className="flex items-center justify-between bg-pros-bone p-1.5 border border-neutral-200">
                            <span className="font-bold text-neutral-700 flex items-center gap-1">
                              <Globe size={11} /> VISIBLE BOUTIQUE
                            </span>
                            <button
                              onClick={() => handleToggleVisibilityField(c, 'showOnStore')}
                              className={`px-2 py-0.5 font-bold font-mono border text-[9px] cursor-pointer ${
                                c.showOnStore ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-neutral-200 text-neutral-600 border-neutral-300'
                              }`}
                            >
                              {c.showOnStore ? 'ON' : 'OFF'}
                            </button>
                          </div>

                          <div className="flex items-center justify-between bg-pros-bone p-1.5 border border-neutral-200">
                            <span className="font-bold text-neutral-700 flex items-center gap-1">
                              <MenuIcon size={11} /> VISIBLE MENU
                            </span>
                            <button
                              onClick={() => handleToggleVisibilityField(c, 'showInMenu')}
                              className={`px-2 py-0.5 font-bold font-mono border text-[9px] cursor-pointer ${
                                c.showInMenu ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-neutral-200 text-neutral-600 border-neutral-300'
                              }`}
                            >
                              {c.showInMenu ? 'ON' : 'OFF'}
                            </button>
                          </div>

                          <div className="flex items-center justify-between bg-pros-bone p-1.5 border border-neutral-200">
                            <span className="font-bold text-neutral-700 flex items-center gap-1">
                              <Home size={11} /> VISIBLE ACCUEIL
                            </span>
                            <button
                              onClick={() => handleToggleVisibilityField(c, 'showOnHomepage')}
                              className={`px-2 py-0.5 font-bold font-mono border text-[9px] cursor-pointer ${
                                c.showOnHomepage ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-neutral-200 text-neutral-600 border-neutral-300'
                              }`}
                            >
                              {c.showOnHomepage ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Footer Info & Product Count Link */}
                      <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-sans">
                        <button
                          onClick={() => navigate(`/admin/products?collection=${c.slug}`)}
                          className="font-bold text-black hover:text-pros-gold flex items-center gap-1 cursor-pointer font-sans uppercase"
                          title="Voir les produits de cette collection"
                        >
                          <Package size={14} />
                          <span>{productCount} PRODUIT(S)</span>
                        </button>

                        {/* Order Control Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveOrder(index, 'up')}
                            disabled={index === 0}
                            className="p-1 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                            title="Monter l'ordre"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(index, 'down')}
                            disabled={index === paginatedCollections.length - 1}
                            className="p-1 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                            title="Descendre l'ordre"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Toolbar */}
                    <div className="bg-pros-bone border-t border-neutral-200 p-3 flex items-center justify-between text-xs font-sans">
                      <button
                        onClick={() => setDetailDrawerCollection(c)}
                        className="px-2.5 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold uppercase text-[10px] cursor-pointer inline-flex items-center gap-1 font-sans"
                      >
                        <Eye size={12} /> DÉTAILS
                      </button>

                      <div className="flex items-center gap-1 font-sans">
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black cursor-pointer font-bold text-[10px] uppercase font-sans"
                          title="Modifier"
                        >
                          ÉDITER
                        </button>
                        <button
                          onClick={() => handleDuplicate(c)}
                          className="p-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black cursor-pointer"
                          title="Dupliquer"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`p-1.5 border text-[10px] font-bold uppercase cursor-pointer ${
                            c.status === 'ACTIVE'
                              ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                              : 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
                          }`}
                          title={c.status === 'ACTIVE' ? 'Dépublier' : 'Publier'}
                        >
                          {c.status === 'ACTIVE' ? 'DÉPUBLIER' : 'PUBLIER'}
                        </button>
                        <button
                          onClick={() => setCollectionToDelete(c)}
                          className="p-1.5 bg-white border border-neutral-300 hover:bg-red-100 hover:border-red-300 text-red-600 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-neutral-200 text-xs font-sans">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-bold uppercase text-[10px]">Afficher :</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-pros-bone border border-neutral-300 px-2 py-1 text-black text-xs focus:outline-none"
                  >
                    <option value={10}>10 par page</option>
                    <option value={25}>25 par page</option>
                    <option value={50}>50 par page</option>
                  </select>
                  <span className="text-neutral-500 text-[10px] uppercase font-mono ml-2">
                    Page {currentPage} sur {totalPages} ({filteredCollections.length} collections)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 disabled:opacity-30 font-bold text-xs uppercase cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> PRÉCÉDENT
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 disabled:opacity-30 font-bold text-xs uppercase cursor-pointer flex items-center gap-1"
                  >
                    SUIVANT <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Creation & Editing Modal Editor */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
            <div className="bg-white border border-neutral-300 max-w-6xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden font-sans">
              
              {/* Fixed Modal Header */}
              <div className="p-6 bg-white border-b border-neutral-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pros-bone border border-neutral-300">
                    <Layers className="text-black" size={24} />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl uppercase tracking-wider text-black">
                      {editingCollection ? `ÉDITEUR COLLECTION : ${editingCollection.name}` : 'CRÉER UNE NOUVELLE COLLECTION PROS'}
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans">
                      Créez, organisez et publiez les collections officielles de la boutique PROS.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-neutral-500 hover:text-black p-2 border border-neutral-200 hover:border-black transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Center Content: 2 Columns on Desktop, 1 Column on Mobile */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
                
                {slugError && (
                  <div className="p-4 bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-center gap-2 font-sans">
                    <AlertTriangle size={18} className="text-red-600" />
                    <span>{slugError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Form Editor (Col Span 7) */}
                  <form id="collectionForm" onSubmit={handleSubmitCollection} className="lg:col-span-7 space-y-6 text-xs font-sans">
                    
                    {/* SECTION 1: INFORMATIONS GÉNÉRALES */}
                    <div className="space-y-4 bg-pros-bone p-5 border border-neutral-200">
                      <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                        1. INFORMATIONS GÉNÉRALES
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold uppercase text-black block">Nom de la collection *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: COLLECTION SIGNATURE"
                            value={formData.name}
                            onChange={handleNameChange}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans uppercase font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold uppercase text-black block">Slug URL *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: collection-signature"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-mono"
                          />
                        </div>
                      </div>

                      {/* Description courte with char count */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="font-bold uppercase text-black">Description courte</label>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {formData.description.length} / 120 caractères
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          maxLength={120}
                          placeholder="Ex: Les pièces emblématiques de la haute couture PROS."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>

                      {/* Description détaillée with char count */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="font-bold uppercase text-black">Description détaillée (Présentation & Éditorial)</label>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {formData.fullDescription.length} / 400 caractères
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={400}
                          placeholder="Présentation éditoriale complète de la collection..."
                          value={formData.fullDescription}
                          onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>
                    </div>

                    {/* SECTION 2: IMAGE DE COUVERTURE (MEDIA UPLOADER) */}
                    <div className="space-y-4 bg-pros-bone p-5 border border-neutral-200">
                      <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                        2. IMAGE DE COUVERTURE (MEDIA UPLOADER)
                      </h3>

                      {/* Upload Drag & Drop Zone */}
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={handleFileDrop}
                        className={`p-6 border-2 border-dashed text-center transition-colors font-sans ${
                          isDraggingFile ? 'border-black bg-white' : 'border-neutral-300 bg-white hover:border-black'
                        }`}
                      >
                        {formData.imageUrl ? (
                          <div className="space-y-3">
                            <img src={formData.imageUrl} alt="Aperçu" className="w-full h-36 object-cover border border-neutral-300 mx-auto" />
                            <div className="flex justify-center gap-2">
                              <label className="px-3 py-1.5 bg-pros-black text-white font-bold text-[10px] uppercase cursor-pointer hover:bg-neutral-800">
                                <span>REMPLACER L'IMAGE</span>
                                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileInputChange} className="hidden" />
                              </label>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, imageUrl: '' })}
                                className="px-3 py-1.5 bg-red-100 text-red-800 border border-red-300 font-bold text-[10px] uppercase hover:bg-red-200 cursor-pointer"
                              >
                                SUPPRIMER
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Upload size={32} className="mx-auto text-neutral-400" />
                            <div>
                              <p className="font-bold uppercase text-black text-xs">Glissez-déposez votre image ici</p>
                              <p className="text-[10px] text-neutral-500 font-sans mt-0.5">ou choisissez un fichier depuis votre ordinateur</p>
                            </div>
                            <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer hover:bg-neutral-800 shadow-sm font-sans">
                              <span>CHOISIR UNE IMAGE</span>
                              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileInputChange} className="hidden" />
                            </label>
                            <p className="text-[9px] text-neutral-400 uppercase font-mono">
                              Formats supportés : JPG, PNG, WEBP — Max : 5 Mo
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 3: PRODUITS DE LA COLLECTION */}
                    <div className="space-y-4 bg-pros-bone p-5 border border-neutral-200">
                      <div className="flex justify-between items-center border-b border-neutral-300 pb-2">
                        <h3 className="font-bold uppercase text-xs text-pros-gold">
                          3. PRODUITS DE LA COLLECTION ({formData.productIds.length})
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsProductPickerOpen(true)}
                          className="px-3 py-1 bg-pros-black text-white font-bold text-[10px] uppercase cursor-pointer hover:bg-neutral-800"
                        >
                          + SÉLECTIONNER DES PRODUITS
                        </button>
                      </div>

                      {formData.productIds.length === 0 ? (
                        <div className="p-4 bg-white border border-neutral-300 text-center text-neutral-500 text-xs font-sans">
                          Aucun produit n'est associé à cette collection. Cliquez sur "+ SÉLECTIONNER DES PRODUITS" pour en ajouter.
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-200 bg-white border border-neutral-300 max-h-56 overflow-y-auto">
                          {formData.productIds.map((pId, idx) => {
                            const p = products.find((prod) => prod.id === pId);
                            if (!p) return null;
                            return (
                              <div key={p.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-pros-bone">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[10px] text-neutral-400 font-bold">#{idx + 1}</span>
                                  <img src={p.colors?.[0]?.images?.[0]} alt={p.name} className="w-8 h-10 object-cover border border-neutral-200" />
                                  <div>
                                    <div className="font-bold uppercase text-black text-xs">{p.name}</div>
                                    <div className="text-[10px] font-mono text-neutral-500">{formatPrice(p.price)}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveProductInCollection(idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-1 border border-neutral-300 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowUp size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveProductInCollection(idx, 'down')}
                                    disabled={idx === formData.productIds.length - 1}
                                    className="p-1 border border-neutral-300 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowDown size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleProductInCollection(p.id)}
                                    className="p-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 cursor-pointer ml-1"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* SECTION 4: ORGANISATION & STATUT */}
                    <div className="space-y-4 bg-pros-bone p-5 border border-neutral-200">
                      <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                        4. ORGANISATION & STATUT
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold uppercase text-black block">Ordre d'affichage (Position)</label>
                          <input
                            type="number"
                            min="1"
                            value={formData.displayOrder}
                            onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-mono font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold uppercase text-black block">Statut *</label>
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as CollectionStatus })}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans font-bold cursor-pointer"
                          >
                            <option value="DRAFT">BROUILLON (MASQUÉE)</option>
                            <option value="ACTIVE">PUBLIÉE (VISIBLE)</option>
                            <option value="INACTIVE">DÉSACTIVÉE</option>
                            <option value="ARCHIVED">ARCHIVÉE</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 5: VISIBILITÉ SUR LA BOUTIQUE */}
                    <div className="space-y-3 bg-pros-bone p-5 border border-neutral-200">
                      <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                        5. VISIBILITÉ SUR LA BOUTIQUE PUBLIQUE
                      </h3>
                      <div className="space-y-2 font-sans">
                        <label className="p-3 border border-neutral-300 bg-white flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="font-bold uppercase text-black block">AFFICHER SUR LA BOUTIQUE</span>
                            <span className="text-[10px] text-neutral-500 font-sans">Rend cette collection accessible depuis la boutique publique.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.showOnStore}
                            onChange={(e) => setFormData({ ...formData, showOnStore: e.target.checked })}
                            className="accent-pros-black cursor-pointer w-4 h-4"
                          />
                        </label>

                        <label className="p-3 border border-neutral-300 bg-white flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="font-bold uppercase text-black block">AFFICHER DANS LE MENU</span>
                            <span className="text-[10px] text-neutral-500 font-sans">Ajoute cette collection à la navigation principale du header.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.showInMenu}
                            onChange={(e) => setFormData({ ...formData, showInMenu: e.target.checked })}
                            className="accent-pros-black cursor-pointer w-4 h-4"
                          />
                        </label>

                        <label className="p-3 border border-neutral-300 bg-white flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="font-bold uppercase text-black block">AFFICHER SUR LA HOMEPAGE</span>
                            <span className="text-[10px] text-neutral-500 font-sans">Autorise l'affichage de cette collection sur la page d'accueil.</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={formData.showOnHomepage}
                            onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
                            className="accent-pros-black cursor-pointer w-4 h-4"
                          />
                        </label>
                      </div>
                    </div>

                    {/* SECTION 6: OPTIMISATION SEO INTELLIGENTE */}
                    <div className="space-y-4 bg-pros-bone p-5 border border-neutral-200">
                      <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2 flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>6. OPTIMISATION SEO INTELLIGENTE</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold uppercase text-black block">Méta-Titre SEO</label>
                          <input
                            type="text"
                            value={formData.metaTitle}
                            onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold uppercase text-black block">SEO Slug</label>
                          <input
                            type="text"
                            value={formData.seoSlug}
                            onChange={(e) => setFormData({ ...formData, seoSlug: e.target.value })}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="font-bold uppercase text-black">Méta-Description SEO</label>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {formData.metaDescription.length} / 160 caractères
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={160}
                          value={formData.metaDescription}
                          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>

                      {/* Google Search Live Snippet Card */}
                      <div className="p-4 bg-white border border-neutral-300 space-y-1 font-sans">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">APERÇU GOOGLE SEARCH</span>
                        <div className="text-blue-800 font-bold text-sm hover:underline cursor-pointer">
                          {formData.metaTitle || 'Collection Signature — PROS'}
                        </div>
                        <div className="text-emerald-700 text-xs font-mono">
                          https://pros.sn/collections/{formData.slug || 'slug'}
                        </div>
                        <p className="text-xs text-neutral-600 line-clamp-2">
                          {formData.metaDescription || 'Découvrez la collection officielle PROS.'}
                        </p>
                      </div>
                    </div>
                  </form>

                  {/* Right Column: APERÇU LIVE (Col Span 5) */}
                  <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4 font-sans">
                    <div className="p-4 bg-pros-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Eye size={16} className="text-pros-gold" />
                        <span>APERÇU EN TEMPS RÉEL</span>
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">LIVE PREVIEW</span>
                    </div>

                    {/* Live Preview Card */}
                    <div className="bg-white border border-neutral-300 overflow-hidden shadow-lg font-sans">
                      <div className="relative h-56 bg-pros-black overflow-hidden border-b border-neutral-200">
                        {formData.imageUrl ? (
                          <img src={formData.imageUrl} alt="Live Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 space-y-2">
                            <img src="/brand/LOGOPROS.png" alt="PROS" className="h-8 w-auto object-contain opacity-80" />
                            <span className="text-[10px] font-mono text-pros-sand font-bold tracking-widest uppercase">
                              PROS COLLECTION PLACEHOLDER
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-4 text-white">
                          <div className="flex justify-between items-start">
                            <span className="px-2 py-0.5 bg-black/70 text-white font-mono text-[9px] font-bold border border-white/20">
                              POSITION #{formData.displayOrder}
                            </span>
                            {getStatusBadge(formData.status)}
                          </div>

                          <div>
                            <h3 className="font-display font-bold text-2xl uppercase tracking-wider text-white">
                              {formData.name || 'NOM DE LA COLLECTION'}
                            </h3>
                            <span className="text-xs font-mono text-pros-sand font-bold">
                              /{formData.slug || 'slug'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 font-sans">
                        <p className="text-xs text-neutral-700 leading-relaxed font-sans min-h-[3rem]">
                          {formData.description || 'Description courte de la collection telle qu’elle apparaîtra sur les cartes de la boutique PROS.'}
                        </p>

                        <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-[10px] uppercase font-sans">
                          <span className="font-bold text-black flex items-center gap-1">
                            <Package size={12} /> {formData.productIds.length} PRODUIT(S) ASSOCIÉ(S)
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-[10px] uppercase font-sans">
                          {formData.showOnStore && (
                            <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold">
                              BOUTIQUE ON
                            </span>
                          )}
                          {formData.showInMenu && (
                            <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold">
                              MENU ON
                            </span>
                          )}
                          {formData.showOnHomepage && (
                            <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold">
                              HOMEPAGE ON
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Fixed Modal Footer */}
              <div className="p-6 bg-pros-bone border-t border-neutral-200 flex items-center justify-between shrink-0 font-sans">
                <span className="text-xs text-neutral-500 font-sans">
                  * Champs obligatoires pour valider la collection.
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-5 py-3 border border-neutral-300 bg-white text-black font-bold hover:bg-neutral-100 uppercase text-xs font-sans cursor-pointer"
                  >
                    ANNULER
                  </button>
                  <button
                    type="submit"
                    form="collectionForm"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-pros-black text-white font-bold uppercase text-xs hover:bg-neutral-800 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2 font-sans"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>CRÉATION EN COURS...</span>
                      </>
                    ) : (
                      <span>{editingCollection ? 'ENREGISTRER LES MODIFICATIONS' : 'CRÉER LA COLLECTION'}</span>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Product Picker Dialog inside Collection Modal */}
        {isProductPickerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col font-sans">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="font-display font-bold text-base uppercase text-black">
                  SÉLECTIONNER DES PRODUITS ({formData.productIds.length} SÉLECTIONNÉS)
                </h3>
                <button onClick={() => setIsProductPickerOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              {/* Product Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                <input
                  type="text"
                  placeholder="Filtrer par nom de produit..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-pros-bone border border-neutral-300 pl-9 pr-3 py-1.5 text-xs text-black focus:outline-none"
                />
              </div>

              {/* Products Checkbox List */}
              <div className="flex-1 overflow-y-auto border border-neutral-200 divide-y divide-neutral-100">
                {products.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500 font-sans">
                    Aucun produit disponible dans le catalogue.
                  </div>
                ) : (
                  products
                    .filter((p) => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((p) => {
                      const isSelected = formData.productIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleProductInCollection(p.id)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-pros-bone font-bold' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-black">
                              {isSelected ? <CheckSquare size={16} className="text-black" /> : <Square size={16} className="text-neutral-400" />}
                            </div>
                            <img src={p.colors?.[0]?.images?.[0]} alt={p.name} className="w-8 h-10 object-cover border border-neutral-200" />
                            <div>
                              <div className="text-xs uppercase text-black">{p.name}</div>
                              <div className="text-[10px] font-mono text-neutral-500">{formatPrice(p.price)}</div>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-neutral-100 text-neutral-700 uppercase">
                            {p.category}
                          </span>
                        </div>
                      );
                    })
                )}
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-end">
                <button
                  onClick={() => setIsProductPickerOpen(false)}
                  className="px-6 py-2 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800"
                >
                  VALIDER LA SÉLECTION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Drawer Slide-over */}
        {detailDrawerCollection && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end font-sans">
            <div className="w-full max-w-xl bg-white h-full p-8 space-y-6 overflow-y-auto font-sans text-xs text-black border-l border-neutral-200 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] text-pros-gold font-bold uppercase">FICHE DÉTAILLÉE COLLECTION</span>
                  <h2 className="font-display font-bold text-xl uppercase tracking-wider text-black">{detailDrawerCollection.name}</h2>
                </div>
                <button onClick={() => setDetailDrawerCollection(null)} className="text-black font-bold p-1 cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              {/* Banner Image or Neutral Placeholder */}
              <div className="h-48 bg-pros-black border border-neutral-200 overflow-hidden relative">
                {detailDrawerCollection.imageUrl ? (
                  <img src={detailDrawerCollection.imageUrl} alt={detailDrawerCollection.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 space-y-2">
                    <img src="/brand/LOGOPROS.png" alt="PROS" className="h-7 w-auto object-contain opacity-80" />
                    <span className="text-[10px] font-mono text-pros-sand font-bold tracking-widest uppercase">
                      PLACEHOLDER PROS
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3">{getStatusBadge(detailDrawerCollection.status)}</div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-pros-bone p-4 border border-neutral-200">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">SLUG OFFICIEL</span>
                  <div className="font-mono text-xs font-bold">/{detailDrawerCollection.slug}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">ORDRE D'AFFICHAGE</span>
                  <div className="font-mono text-xs font-bold">#{detailDrawerCollection.displayOrder || 1}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">PRODUITS ASSOCIÉS</span>
                  <div className="font-mono text-xs font-bold text-emerald-700">
                    {collectionProductCounts[detailDrawerCollection.id] || 0} produit(s)
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">DATE CRÉATION</span>
                  <div className="font-mono text-[11px] text-neutral-600">
                    {new Date(detailDrawerCollection.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold uppercase text-black block">DESCRIPTION ÉDITORIALE</span>
                <p className="text-neutral-700 leading-relaxed font-sans">{detailDrawerCollection.description}</p>
              </div>

              {/* Associated Products List Preview */}
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold uppercase text-black text-xs">PRODUITS DE CETTE COLLECTION</h3>
                  <button
                    onClick={() => navigate(`/admin/products?collection=${detailDrawerCollection.slug}`)}
                    className="text-pros-gold font-bold uppercase text-[10px] hover:underline flex items-center gap-1"
                  >
                    VOIR DANS L'ADMIN PRODUCTS <ExternalLink size={10} />
                  </button>
                </div>

                {(detailDrawerCollection.productIds || []).length === 0 ? (
                  <div className="p-4 bg-pros-bone text-neutral-500 text-center text-xs font-sans border border-neutral-200">
                    Aucun produit n'est actuellement associé à cette collection.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 border border-neutral-200 max-h-48 overflow-y-auto font-sans">
                    {(detailDrawerCollection.productIds || []).map((pId) => {
                      const p = products.find((item) => item.id === pId);
                      if (!p) return null;
                      return (
                        <div key={p.id} className="p-3 flex items-center justify-between hover:bg-pros-bone font-sans">
                          <div className="flex items-center gap-3">
                            <img src={p.colors?.[0]?.images?.[0]} alt={p.name} className="w-8 h-10 object-cover border border-neutral-200" />
                            <div>
                              <div className="font-bold text-black uppercase font-sans text-xs">{p.name}</div>
                              <div className="text-[10px] text-neutral-500 font-mono">{formatPrice(p.price)}</div>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase font-sans">
                            {p.status || 'ACTIVE'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                <button
                  onClick={() => {
                    const c = detailDrawerCollection;
                    setDetailDrawerCollection(null);
                    handleOpenEditModal(c);
                  }}
                  className="px-5 py-2.5 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 font-sans cursor-pointer"
                >
                  MODIFIER CETTE COLLECTION
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog for Collection Deletion */}
        <AdminConfirmDialog
          isOpen={!!collectionToDelete}
          title="SUPPRIMER LA COLLECTION"
          message={`Êtes-vous sûr de vouloir supprimer définitivement la collection "${collectionToDelete?.name}" ? Les produits associés conserveront leur présence au catalogue. Action irréversible.`}
          confirmText="SUPPRIMER DÉFINITIVEMENT"
          onConfirm={confirmDelete}
          onCancel={() => setCollectionToDelete(null)}
        />
      </div>
    </AdminLayout>
  );
};
