import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { useStore } from '../../store/storeContext';
import type { CatalogCategory, CategoryStatus } from '../../types/ecommerce';
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
  FolderOpen,
  ExternalLink,
  GripVertical,
  RefreshCw,
  Upload,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory, reorderCategories, duplicateCategory, formatPrice } = useStore();
  const navigate = useNavigate();

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CategoryStatus | 'all'>('all');
  const [contentFilter, setContentFilter] = useState<'all' | 'with_products' | 'empty'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'most-products' | 'least-products' | 'order-asc'>('order-asc');

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Selection & Modal State
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CatalogCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CatalogCategory | null>(null);
  const [deleteBlockedMsg, setDeleteBlockedMsg] = useState<string | null>(null);
  const [detailDrawerCategory, setDetailDrawerCategory] = useState<CatalogCategory | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    fullDescription: '',
    imageUrl: '',
    status: 'ACTIVE' as CategoryStatus,
    displayOrder: 1,
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

  // Keyboard ESC Key to close Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleRetryLoad = () => {
    setIsLoading(true);
    setIsError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Real-time Product count per category
  const categoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat.slug.toLowerCase()] = 0;
    });

    products.forEach((p) => {
      const pCat = p.category.toLowerCase();
      if (counts[pCat] !== undefined) {
        counts[pCat] += 1;
      } else {
        counts[pCat] = 1;
      }
    });

    return counts;
  }, [categories, products]);

  // Total products classified across all categories
  const totalClassifiedProducts = useMemo(() => {
    return products.filter((p) => Boolean(p.category)).length;
  }, [products]);

  // Real-time KPIs
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.status === 'ACTIVE').length;
    const empty = categories.filter((c) => (categoryProductCounts[c.slug.toLowerCase()] || 0) === 0).length;
    const classified = totalClassifiedProducts;

    return { total, active, empty, classified };
  }, [categories, categoryProductCounts, totalClassifiedProducts]);

  // Filtered & Sorted Categories
  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          c.name.toLowerCase().includes(query) ||
          c.slug.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        
        const count = categoryProductCounts[c.slug.toLowerCase()] || 0;
        let matchesContent = true;
        if (contentFilter === 'with_products') matchesContent = count > 0;
        if (contentFilter === 'empty') matchesContent = count === 0;

        return matchesSearch && matchesStatus && matchesContent;
      })
      .sort((a, b) => {
        const countA = categoryProductCounts[a.slug.toLowerCase()] || 0;
        const countB = categoryProductCounts[b.slug.toLowerCase()] || 0;

        if (sortBy === 'order-asc') return (a.displayOrder || 99) - (b.displayOrder || 99);
        if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
        if (sortBy === 'oldest') return (a.id || '').localeCompare(b.id || '');
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'most-products') return countB - countA;
        if (sortBy === 'least-products') return countA - countB;
        return 0;
      });
  }, [categories, searchTerm, statusFilter, contentFilter, sortBy, categoryProductCounts]);

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...filteredCategories];
    const item = updated.splice(draggedIndex, 1)[0];
    updated.splice(index, 0, item);

    reorderCategories(updated);
    setDraggedIndex(null);
    setSuccessMsg('Ordre d’affichage réorganisé par glisser-déposer.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Open Creation Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setSlugError(null);
    setIsSubmitting(false);

    const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.displayOrder || 1)) + 1 : 1;

    setFormData({
      name: '',
      slug: '',
      description: 'Découvrez la nouvelle sélection officielle PROS.',
      fullDescription: 'Pièces confectionnées avec exigence et élégance pour le vestiaire PROS.',
      imageUrl: '',
      status: 'ACTIVE',
      displayOrder: nextOrder,
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
  const handleOpenEditModal = (c: CatalogCategory) => {
    setEditingCategory(c);
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

  // Auto-generate slug and SEO fields from name
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
      slug: editingCategory ? prev.slug : generatedSlug,
      seoSlug: editingCategory ? prev.seoSlug : generatedSlug,
      metaTitle: editingCategory ? prev.metaTitle : `${name} — Collection PROS`,
      metaDescription: editingCategory ? prev.metaDescription : `Découvrez la collection ${name} officielle de la marque PROS. Vestiaire haute couture africaine.`,
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

  // Form Submit (Create or Edit with simulation of database transaction)
  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setSlugError(null);

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setSlugError('Le nom de la catégorie doit comporter au moins 2 caractères.');
      return;
    }

    const slug = formData.slug.trim().toLowerCase() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Validate Unique Slug
    const existing = categories.find((c) => c.slug.toLowerCase() === slug && c.id !== editingCategory?.id);
    if (existing) {
      setSlugError(`Le slug "/${slug}" existe déjà dans le catalogue.`);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (editingCategory) {
        const updated: CatalogCategory = {
          ...editingCategory,
          name: formData.name.toUpperCase().trim(),
          slug,
          description: formData.description,
          fullDescription: formData.fullDescription,
          imageUrl: formData.imageUrl.trim() || undefined,
          status: formData.status,
          displayOrder: Number(formData.displayOrder),
          metaTitle: formData.metaTitle || `${formData.name} — Collection PROS`,
          metaDescription: formData.metaDescription || `Découvrez la collection ${formData.name} officielle PROS.`,
          seoSlug: formData.seoSlug || slug,
          showOnStore: formData.showOnStore,
          showInMenu: formData.showInMenu,
          showOnHomepage: formData.showOnHomepage,
          updatedAt: new Date().toISOString(),
        };
        updateCategory(updated);
        setSuccessMsg(`Catégorie "${updated.name}" mise à jour avec succès.`);
      } else {
        const newCategory: CatalogCategory = {
          id: `cat-${Date.now()}`,
          name: formData.name.toUpperCase().trim(),
          slug,
          description: formData.description,
          fullDescription: formData.fullDescription,
          imageUrl: formData.imageUrl.trim() || undefined,
          status: formData.status,
          displayOrder: Number(formData.displayOrder),
          metaTitle: formData.metaTitle || `${formData.name} — Collection PROS`,
          metaDescription: formData.metaDescription || `Découvrez la collection ${formData.name} officielle PROS.`,
          seoSlug: formData.seoSlug || slug,
          showOnStore: formData.showOnStore,
          showInMenu: formData.showInMenu,
          showOnHomepage: formData.showOnHomepage,
          createdAt: new Date().toISOString(),
        };
        addCategory(newCategory);
        setSuccessMsg(`Catégorie "${newCategory.name}" créée avec succès.`);
      }

      setIsSubmitting(false);
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 450);
  };

  // Duplicate Category Action
  const handleDuplicate = (c: CatalogCategory) => {
    const dup = duplicateCategory(c);
    setSuccessMsg(`Catégorie "${c.name}" dupliquée en tant que "${dup.name}" (INACTIVE).`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Toggle Status Action
  const handleToggleStatus = (c: CatalogCategory) => {
    const nextStatus: CategoryStatus = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateCategory({ ...c, status: nextStatus, updatedAt: new Date().toISOString() });
    setSuccessMsg(`Catégorie "${c.name}" ${nextStatus === 'ACTIVE' ? 'activée' : 'désactivée'}.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Explicit Visibility Toggles (Boutique, Menu, Homepage)
  const handleToggleVisibilityField = (c: CatalogCategory, field: 'showOnStore' | 'showInMenu' | 'showOnHomepage') => {
    const updated = { ...c, [field]: !c[field], updatedAt: new Date().toISOString() };
    updateCategory(updated);
    setSuccessMsg(`Visibilité ${field} mise à jour pour "${c.name}".`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Move Category Order (Up / Down)
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const updated = [...filteredCategories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    reorderCategories(updated);
    setSuccessMsg('Ordre d’affichage des catégories mis à jour.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Attempt Delete Category Action (With Deletion Protection)
  const handleAttemptDelete = (c: CatalogCategory) => {
    const productCount = categoryProductCounts[c.slug.toLowerCase()] || 0;
    if (productCount > 0) {
      setDeleteBlockedMsg(`Cette catégorie contient ${productCount} produit(s). Vous devez d'abord réaffecter ces produits ou archiver la catégorie.`);
      return;
    }
    setCategoryToDelete(c);
  };

  // Confirm Delete Action
  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      setSuccessMsg(`Catégorie "${categoryToDelete.name}" supprimée définitivement.`);
      setCategoryToDelete(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Bulk Status Update
  const handleBulkStatusChange = (newStatus: CategoryStatus) => {
    selectedCategoryIds.forEach((id) => {
      const c = categories.find((cat) => cat.id === id);
      if (c) {
        updateCategory({ ...c, status: newStatus, updatedAt: new Date().toISOString() });
      }
    });
    setSuccessMsg(`${selectedCategoryIds.length} catégorie(s) mise(s) à jour vers "${newStatus}".`);
    setSelectedCategoryIds([]);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Bulk Export CSV
  const handleExportCSV = () => {
    const targetCategories = selectedCategoryIds.length > 0
      ? categories.filter((c) => selectedCategoryIds.includes(c.id))
      : filteredCategories;

    if (targetCategories.length === 0) return;

    const BOM = '\uFEFF';
    const headers = ['ID', 'NOM', 'SLUG', 'DESCRIPTION', 'STATUT', 'NOMBRE PRODUITS', 'ORDRE', 'VISIBLE BOUTIQUE', 'VISIBLE MENU', 'VISIBLE HOMEPAGE', 'DATE CRÉATION'];

    const rows = targetCategories.map((c) => {
      const pCount = categoryProductCounts[c.slug.toLowerCase()] || 0;
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
    link.download = `pros_categories_produits_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: CategoryStatus) => {
    if (status === 'ACTIVE') {
      return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-green-100 text-green-800 border border-green-300 uppercase font-sans">ACTIF</span>;
    }
    if (status === 'INACTIVE') {
      return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase font-sans">INACTIF</span>;
    }
    return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300 uppercase font-sans">ARCHIVÉ</span>;
  };

  // Render Error State
  if (isError) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto py-16 text-center space-y-4 font-sans text-pros-black">
          <AlertTriangle className="mx-auto text-red-600" size={48} />
          <h2 className="font-display font-bold text-xl uppercase">IMPOSSIBLE DE CHARGER LES CATÉGORIES</h2>
          <p className="text-xs text-neutral-600">Une erreur s'est produite lors de la récupération des données du catalogue.</p>
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
          eyebrow="CATALOGUE & ORGANISATION"
          title="GESTION DES CATÉGORIES"
          description="Organisez le catalogue PROS, gérez les catégories de produits et contrôlez leur visibilité sur la boutique."
          primaryAction={
            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase tracking-superwide hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-lg font-sans"
            >
              <Plus size={18} />
              <span>AJOUTER UNE CATÉGORIE</span>
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

        {/* Deletion Blocked Banner */}
        {deleteBlockedMsg && (
          <div className="p-4 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-between animate-fade-in font-sans">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <span>{deleteBlockedMsg}</span>
            </div>
            <button onClick={() => setDeleteBlockedMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* 4 Category KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans">
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">TOTAL CATÉGORIES</span>
            <div className="text-3xl font-bold text-black">{isLoading ? '...' : stats.total}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">CATÉGORIES ACTIVES</span>
            <div className="text-3xl font-bold text-emerald-700">{isLoading ? '...' : stats.active}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">CATÉGORIES VIDES</span>
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
                placeholder="Rechercher une catégorie par nom, slug, description..."
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
              <option value="ACTIVE">ACTIVES</option>
              <option value="INACTIVE">INACTIVES</option>
              <option value="ARCHIVED">ARCHIVÉES</option>
            </select>

            {/* Content Filter */}
            <select
              value={contentFilter}
              onChange={(e) => setContentFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">CONTENU : TOUTES</option>
              <option value="with_products">AVEC PRODUITS</option>
              <option value="empty">SANS PRODUITS (VIDES)</option>
            </select>

            {/* Sort */}
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
          {selectedCategoryIds.length > 0 && (
            <div className="p-3 bg-pros-black text-white text-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in font-sans">
              <span className="font-bold">
                {selectedCategoryIds.length} CATÉGORIE(S) SÉLECTIONNÉE(S) :
              </span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={() => handleBulkStatusChange('ACTIVE')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase font-sans cursor-pointer"
                >
                  ACTIVER
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
                  onClick={() => setSelectedCategoryIds([])}
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
        ) : categories.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm font-sans">
            <div className="max-w-sm mx-auto space-y-4">
              <Layers className="mx-auto text-neutral-400" size={48} />
              <h3 className="font-display font-bold text-lg uppercase text-black">AUCUNE CATÉGORIE</h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                Aucune catégorie n'est encore configurée.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md font-sans"
              >
                <Plus size={16} />
                <span>+ AJOUTER UNE CATÉGORIE</span>
              </button>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm font-sans">
            <div className="max-w-sm mx-auto space-y-3">
              <Search className="mx-auto text-neutral-400" size={36} />
              <h3 className="font-display font-bold text-sm uppercase text-black">AUCUNE CATÉGORIE TROUVÉE</h3>
              <p className="text-xs text-neutral-500">Aucune catégorie ne correspond à vos critères de recherche.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
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
          /* Category Cards Grid with Drag & Drop */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
            {filteredCategories.map((c, index) => {
              const productCount = categoryProductCounts[c.slug.toLowerCase()] || 0;
              const isSelected = selectedCategoryIds.includes(c.id);
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
                          PROS CATEGORY PLACEHOLDER
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
                                setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== c.id));
                              } else {
                                setSelectedCategoryIds([...selectedCategoryIds, c.id]);
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
                        onClick={() => navigate(`/admin/products?category=${c.slug}`)}
                        className="font-bold text-black hover:text-pros-gold flex items-center gap-1 cursor-pointer font-sans uppercase"
                        title="Voir les produits de cette catégorie"
                      >
                        <FolderOpen size={14} />
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
                          disabled={index === filteredCategories.length - 1}
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
                      onClick={() => setDetailDrawerCategory(c)}
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
                        title={c.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                      >
                        {c.status === 'ACTIVE' ? 'DÉSACTIVER' : 'ACTIVER'}
                      </button>
                      <button
                        onClick={() => handleAttemptDelete(c)}
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
                      {editingCategory ? `ÉDITEUR CATÉGORIE : ${editingCategory.name}` : 'AJOUTER UNE NOUVELLE CATÉGORIE PROS'}
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans">
                      Créez une catégorie et contrôlez sa présence dans la boutique PROS.
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
                  
                  {/* Left Column: Category Editor Form (Col Span 7) */}
                  <form id="categoryForm" onSubmit={handleSubmitCategory} className="lg:col-span-7 space-y-6 text-xs font-sans">
                    
                    {/* SECTION 1: INFORMATIONS GÉNÉRALES */}
                    <div className="space-y-4 bg-pros-bone p-5 border border-neutral-200">
                      <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                        1. INFORMATIONS GÉNÉRALES
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold uppercase text-black block">Nom de la catégorie *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: HOMME"
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
                            placeholder="Ex: homme"
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
                          placeholder="Ex: Vestiaire masculin contemporain PROS peigné 480GSM"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>

                      {/* Description détaillée with char count */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="font-bold uppercase text-black">Description détaillée (SEO & Présentation)</label>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {formData.fullDescription.length} / 400 caractères
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={400}
                          placeholder="Présentation éditoriale complète de la catégorie..."
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

                    {/* SECTION 3: ORGANISATION & STATUT */}
                    <div className="space-y-4 bg-pros-bone p-5 border border-neutral-200">
                      <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                        3. ORGANISATION & STATUT
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
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as CategoryStatus })}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans font-bold cursor-pointer"
                          >
                            <option value="DRAFT">BROUILLON (MASQUÉE)</option>
                            <option value="ACTIVE">ACTIVE (PUBLIÉE)</option>
                            <option value="INACTIVE">DÉSACTIVÉE</option>
                            <option value="ARCHIVED">ARCHIVÉE</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: VISIBILITÉ SUR LA BOUTIQUE */}
                    <div className="space-y-3 bg-pros-bone p-5 border border-neutral-200">
                      <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                        4. VISIBILITÉ SUR LA BOUTIQUE PUBLIQUE
                      </h3>
                      <div className="space-y-2 font-sans">
                        <label className="p-3 border border-neutral-300 bg-white flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="font-bold uppercase text-black block">AFFICHER SUR LA BOUTIQUE</span>
                            <span className="text-[10px] text-neutral-500 font-sans">Rend cette catégorie accessible depuis la boutique publique.</span>
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
                            <span className="text-[10px] text-neutral-500 font-sans">Ajoute cette catégorie à la navigation principale du header.</span>
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
                            <span className="text-[10px] text-neutral-500 font-sans">Autorise l'affichage de cette catégorie sur la page d'accueil.</span>
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

                    {/* SECTION 5: OPTIMISATION SEO INTELLIGENTE */}
                    <div className="space-y-4 bg-pros-bone p-5 border border-neutral-200">
                      <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2 flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>5. OPTIMISATION SEO INTELLIGENTE</span>
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
                          {formData.metaTitle || 'Catégorie — Collection PROS'}
                        </div>
                        <div className="text-emerald-700 text-xs font-mono">
                          https://pros.sn/shop?category={formData.slug || 'slug'}
                        </div>
                        <p className="text-xs text-neutral-600 line-clamp-2">
                          {formData.metaDescription || 'Découvrez la collection officielle PROS.'}
                        </p>
                      </div>
                    </div>
                  </form>

                  {/* Right Column: APERÇU BOUTIQUE LIVE (Col Span 5) */}
                  <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4 font-sans">
                    <div className="p-4 bg-pros-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Eye size={16} className="text-pros-gold" />
                        <span>APERÇU BOUTIQUE LIVE</span>
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">TEMPS RÉEL</span>
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
                              PROS CATEGORY PLACEHOLDER
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
                              {formData.name || 'NOM DE LA CATÉGORIE'}
                            </h3>
                            <span className="text-xs font-mono text-pros-sand font-bold">
                              /{formData.slug || 'slug'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-4 font-sans">
                        <p className="text-xs text-neutral-700 leading-relaxed font-sans min-h-[3rem]">
                          {formData.description || 'Description courte de la catégorie telle qu’elle apparaîtra sur les cartes de la boutique PROS.'}
                        </p>

                        <div className="pt-3 border-t border-neutral-200 flex flex-wrap gap-2 text-[10px] uppercase font-sans">
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
                  * Champs obligatoires pour valider la catégorie.
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
                    form="categoryForm"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-pros-black text-white font-bold uppercase text-xs hover:bg-neutral-800 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2 font-sans"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>CRÉATION EN COURS...</span>
                      </>
                    ) : (
                      <span>{editingCategory ? 'ENREGISTRER LES MODIFICATIONS' : 'CRÉER LA CATÉGORIE'}</span>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Detail Drawer Slide-over */}
        {detailDrawerCategory && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end font-sans">
            <div className="w-full max-w-xl bg-white h-full p-8 space-y-6 overflow-y-auto font-sans text-xs text-black border-l border-neutral-200 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] text-pros-gold font-bold uppercase">FICHE DÉTAILLÉE CATÉGORIE</span>
                  <h2 className="font-display font-bold text-xl uppercase tracking-wider text-black">{detailDrawerCategory.name}</h2>
                </div>
                <button onClick={() => setDetailDrawerCategory(null)} className="text-black font-bold p-1 cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              {/* Banner Image or Neutral Placeholder */}
              <div className="h-48 bg-pros-black border border-neutral-200 overflow-hidden relative">
                {detailDrawerCategory.imageUrl ? (
                  <img src={detailDrawerCategory.imageUrl} alt={detailDrawerCategory.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 space-y-2">
                    <img src="/brand/LOGOPROS.png" alt="PROS" className="h-7 w-auto object-contain opacity-80" />
                    <span className="text-[10px] font-mono text-pros-sand font-bold tracking-widest uppercase">
                      PLACEHOLDER PROS
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3">{getStatusBadge(detailDrawerCategory.status)}</div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-pros-bone p-4 border border-neutral-200">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">SLUG OFFICIEL</span>
                  <div className="font-mono text-xs font-bold">/{detailDrawerCategory.slug}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">ORDRE D'AFFICHAGE</span>
                  <div className="font-mono text-xs font-bold">#{detailDrawerCategory.displayOrder || 1}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">PRODUITS ASSOCIÉS</span>
                  <div className="font-mono text-xs font-bold text-emerald-700">
                    {categoryProductCounts[detailDrawerCategory.slug.toLowerCase()] || 0} produit(s)
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">DATE CRÉATION</span>
                  <div className="font-mono text-[11px] text-neutral-600">
                    {new Date(detailDrawerCategory.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold uppercase text-black block">DESCRIPTION ÉDITORIALE</span>
                <p className="text-neutral-700 leading-relaxed font-sans">{detailDrawerCategory.description}</p>
              </div>

              {/* Associated Products List Preview */}
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold uppercase text-black text-xs">PRODUITS ACTUELS DANS CE VESTIAIRE</h3>
                  <button
                    onClick={() => navigate(`/admin/products?category=${detailDrawerCategory.slug}`)}
                    className="text-pros-gold font-bold uppercase text-[10px] hover:underline flex items-center gap-1"
                  >
                    VOIR DANS L'ADMIN PRODUCTS <ExternalLink size={10} />
                  </button>
                </div>

                {products.filter((p) => p.category.toLowerCase() === detailDrawerCategory.slug.toLowerCase()).length === 0 ? (
                  <div className="p-4 bg-pros-bone text-neutral-500 text-center text-xs font-sans border border-neutral-200">
                    Aucun produit n'est actuellement associé à cette catégorie.
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 border border-neutral-200 max-h-48 overflow-y-auto font-sans">
                    {products
                      .filter((p) => p.category.toLowerCase() === detailDrawerCategory.slug.toLowerCase())
                      .map((p) => (
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
                      ))}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                <button
                  onClick={() => {
                    const c = detailDrawerCategory;
                    setDetailDrawerCategory(null);
                    handleOpenEditModal(c);
                  }}
                  className="px-5 py-2.5 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 font-sans cursor-pointer"
                >
                  MODIFIER CETTE CATÉGORIE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog for Category Deletion */}
        <AdminConfirmDialog
          isOpen={!!categoryToDelete}
          title="SUPPRIMER LA CATÉGORIE"
          message={`Êtes-vous sûr de vouloir supprimer définitivement la catégorie "${categoryToDelete?.name}" ? Cette action est irréversible.`}
          confirmText="SUPPRIMER DÉFINITIVEMENT"
          onConfirm={confirmDelete}
          onCancel={() => setCategoryToDelete(null)}
        />
      </div>
    </AdminLayout>
  );
};
