import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { useStore } from '../../store/storeContext';
import type { Product, Category, SubCategory, ProductBadge, ProductStatus, ProductCollection, ProductSize } from '../../types/ecommerce';
import {
  Plus,
  Trash2,
  Search,
  Check,
  X,
  Package,
  Download,
  Eye,
  Copy,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const { products, categories, collections, addProduct, updateProduct, deleteProduct, formatPrice } = useStore();
  const navigate = useNavigate();

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [collectionFilter, setCollectionFilter] = useState<ProductCollection | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'low' | 'out'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'promo' | 'regular'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-low'>('newest');

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selection & Modal State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'homme' as Category,
    subCategory: 'hoodie' as SubCategory,
    collection: 'signature' as ProductCollection,
    status: 'ACTIVE' as ProductStatus,
    price: 45000,
    originalPrice: 55000,
    internalCost: 20000,
    description: 'Création officielle PROS confectionnée dans un coton premium molletonné haute densité 480GSM.',
    shortDescription: 'Coupe contemporaine, broderie signature PROS.',
    material: '100% Coton peigné 480GSM',
    fit: 'Coupe oversize structurée',
    care: 'Lavage en machine à 30°C à l’envers',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    colorName: 'Noir Mat',
    colorHex: '#0A0A0A',
    badge: 'nouveau' as ProductBadge,
    stockXS: 5,
    stockS: 10,
    stockM: 15,
    stockL: 20,
    stockXL: 15,
    stockXXL: 5,
    metaTitle: '',
    metaDescription: '',
    seoSlug: '',
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (!editingProduct && formData.name) {
      const generatedSlug = formData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      
      setFormData((prev) => ({
        ...prev,
        slug: generatedSlug,
        metaTitle: `${formData.name} — E-Shop Officiel PROS`,
        metaDescription: formData.shortDescription || `Achetez ${formData.name} sur la boutique officielle PROS.`,
        seoSlug: generatedSlug,
      }));
    }
  }, [formData.name, editingProduct]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, collectionFilter, stockFilter, priceFilter, sortBy, pageSize]);

  // KPIs Calculation
  const stats = useMemo(() => {
    let total = products.length;
    let published = 0;
    let drafts = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let promos = 0;

    products.forEach((p) => {
      const pStatus = p.status || 'ACTIVE';
      if (pStatus === 'ACTIVE') published++;
      if (pStatus === 'DRAFT') drafts++;

      const totalStock = p.stockPerSize ? Object.values(p.stockPerSize).reduce((a, b) => a + b, 0) : 0;
      if (totalStock === 0) outOfStock++;
      else if (Object.values(p.stockPerSize || {}).some((qty) => qty <= 3)) lowStock++;

      if (p.originalPrice && p.originalPrice > p.price) promos++;
    });

    return { total, published, drafts, lowStock, outOfStock, promos };
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const query = searchTerm.toLowerCase().trim();
        const primarySku = `SKU-PROS-${p.name.slice(0, 6).toUpperCase()}-${p.colors?.[0]?.name?.slice(0, 3)?.toUpperCase() || 'BLK'}`;
        const matchesSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.subCategory.toLowerCase().includes(query) ||
          primarySku.toLowerCase().includes(query);

        const pStatus = p.status || 'ACTIVE';
        const matchesStatus = statusFilter === 'all' || pStatus === statusFilter;
        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
        const matchesCollection = collectionFilter === 'all' || p.collection === collectionFilter;

        const totalStock = p.stockPerSize ? Object.values(p.stockPerSize).reduce((a, b) => a + b, 0) : 0;
        const isLow = Object.values(p.stockPerSize || {}).some((qty) => qty <= 3 && qty > 0);

        let matchesStock = true;
        if (stockFilter === 'available') matchesStock = totalStock > 0;
        if (stockFilter === 'low') matchesStock = isLow;
        if (stockFilter === 'out') matchesStock = totalStock === 0;

        let matchesPrice = true;
        if (priceFilter === 'promo') matchesPrice = Boolean(p.originalPrice && p.originalPrice > p.price);
        if (priceFilter === 'regular') matchesPrice = !p.originalPrice || p.originalPrice <= p.price;

        return matchesSearch && matchesStatus && matchesCategory && matchesCollection && matchesStock && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
        if (sortBy === 'oldest') return (a.id || '').localeCompare(b.id || '');
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'stock-low') {
          const stockA = Object.values(a.stockPerSize || {}).reduce((s, v) => s + v, 0);
          const stockB = Object.values(b.stockPerSize || {}).reduce((s, v) => s + v, 0);
          return stockA - stockB;
        }
        return 0;
      });
  }, [products, searchTerm, statusFilter, categoryFilter, collectionFilter, stockFilter, priceFilter, sortBy]);

  // Paginated list
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Total calculated stock for form preview
  const calculatedTotalStock = useMemo(() => {
    return Number(formData.stockXS) + Number(formData.stockS) + Number(formData.stockM) + Number(formData.stockL) + Number(formData.stockXL) + Number(formData.stockXXL);
  }, [formData]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((item) => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  // Open Creation Modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setValidationError(null);
    const initialCategory = categories.length > 0 ? categories[0].slug : 'homme';
    const initialCollection = collections.length > 0 ? collections[0].slug : 'signature';

    setFormData({
      name: '',
      slug: '',
      category: initialCategory as Category,
      subCategory: 'hoodie',
      collection: initialCollection as ProductCollection,
      status: 'ACTIVE',
      price: 45000,
      originalPrice: 55000,
      internalCost: 20000,
      description: 'Création officielle PROS confectionnée dans un coton premium molletonné haute densité 480GSM.',
      shortDescription: 'Coupe contemporaine, broderie signature PROS.',
      material: '100% Coton peigné 480GSM',
      fit: 'Coupe oversize structurée',
      care: 'Lavage en machine à 30°C à l’envers',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
      colorName: 'Noir Mat',
      colorHex: '#0A0A0A',
      badge: 'nouveau',
      stockXS: 5,
      stockS: 10,
      stockM: 15,
      stockL: 20,
      stockXL: 15,
      stockXXL: 5,
      metaTitle: '',
      metaDescription: '',
      seoSlug: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setValidationError(null);
    setFormData({
      name: p.name,
      slug: p.slug,
      category: p.category,
      subCategory: p.subCategory,
      collection: p.collection || 'signature',
      status: p.status || 'ACTIVE',
      price: p.price,
      originalPrice: p.originalPrice || 0,
      internalCost: Math.round(p.price * 0.45),
      description: p.description,
      shortDescription: p.shortDescription,
      material: p.material,
      fit: p.fit,
      care: p.care,
      imageUrl: p.colors?.[0]?.images?.[0] || '',
      colorName: p.colors?.[0]?.name || 'Noir Mat',
      colorHex: p.colors?.[0]?.hex || '#0A0A0A',
      badge: p.badge || 'nouveau',
      stockXS: p.stockPerSize?.XS || 0,
      stockS: p.stockPerSize?.S || 0,
      stockM: p.stockPerSize?.M || 0,
      stockL: p.stockPerSize?.L || 0,
      stockXL: p.stockPerSize?.XL || 0,
      stockXXL: p.stockPerSize?.XXL || 0,
      metaTitle: `${p.name} — E-Shop Officiel PROS`,
      metaDescription: p.shortDescription,
      seoSlug: p.slug,
    });
    setIsModalOpen(true);
  };

  // Image File Upload Handler (FileReader -> Data URL base64)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag & Drop Image File Handler
  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Duplicate Product Action
  const handleDuplicateProduct = (p: Product) => {
    const duplicated: Product = {
      ...p,
      id: `pros-p-${Date.now()}`,
      slug: `${p.slug}-copie-${Date.now().toString().slice(-4)}`,
      name: `${p.name} (COPIE)`,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };
    addProduct(duplicated);
    setSuccessMsg(`Produit "${duplicated.name}" dupliqué avec succès en brouillon.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Form Submit (Create or Edit) with Validation & Duplicate Slug Check
  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation 1: Name required
    if (!formData.name.trim()) {
      setValidationError('Le nom du produit est obligatoire.');
      return;
    }

    // Validation 2: Price > 0
    if (!formData.price || Number(formData.price) <= 0) {
      setValidationError('Le prix de vente doit être supérieur à 0 FCFA.');
      return;
    }

    setIsSubmitting(true);

    // Slug generation and uniqueness check
    let rawSlug = formData.slug.trim() || formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let finalSlug = rawSlug;

    // Check slug collision
    let counter = 1;
    while (products.some((p) => p.slug === finalSlug && (!editingProduct || p.id !== editingProduct.id))) {
      finalSlug = `${rawSlug}-${counter}`;
      counter++;
    }

    setTimeout(() => {
      if (editingProduct) {
        const updated: Product = {
          ...editingProduct,
          name: formData.name.trim(),
          slug: finalSlug,
          category: formData.category,
          subCategory: formData.subCategory,
          collection: formData.collection,
          status: formData.status,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          description: formData.description,
          shortDescription: formData.shortDescription,
          material: formData.material,
          care: formData.care,
          fit: formData.fit,
          badge: formData.badge,
          colors: [
            {
              name: formData.colorName,
              hex: formData.colorHex,
              images: [formData.imageUrl, formData.imageUrl],
            },
          ],
          sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          stockPerSize: {
            XS: Number(formData.stockXS),
            S: Number(formData.stockS),
            M: Number(formData.stockM),
            L: Number(formData.stockL),
            XL: Number(formData.stockXL),
            XXL: Number(formData.stockXXL),
          },
          updatedAt: new Date().toISOString(),
        };
        updateProduct(updated);
        setSuccessMsg(`Produit "${updated.name}" mis à jour avec succès.`);
      } else {
        const newProduct: Product = {
          id: `pros-p-${Date.now()}`,
          slug: finalSlug,
          name: formData.name.trim(),
          category: formData.category,
          subCategory: formData.subCategory,
          collection: formData.collection,
          status: formData.status,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          description: formData.description,
          shortDescription: formData.shortDescription,
          material: formData.material,
          care: formData.care,
          fit: formData.fit,
          badge: formData.badge,
          colors: [
            {
              name: formData.colorName,
              hex: formData.colorHex,
              images: [formData.imageUrl, formData.imageUrl],
            },
          ],
          sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          stockPerSize: {
            XS: Number(formData.stockXS),
            S: Number(formData.stockS),
            M: Number(formData.stockM),
            L: Number(formData.stockL),
            XL: Number(formData.stockXL),
            XXL: Number(formData.stockXXL),
          },
          rating: 5.0,
          reviewsCount: 1,
          isFeatured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addProduct(newProduct);
        setSuccessMsg(`Produit "${newProduct.name}" publié avec succès dans le catalogue PROS.`);
      }

      setIsSubmitting(false);
      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4500);
    }, 400);
  };

  // Bulk Status Update
  const handleBulkStatusChange = (newStatus: ProductStatus) => {
    selectedProductIds.forEach((id) => {
      const p = products.find((prod) => prod.id === id);
      if (p) {
        updateProduct({ ...p, status: newStatus });
      }
    });
    setSuccessMsg(`${selectedProductIds.length} produit(s) mis à jour vers "${newStatus}".`);
    setSelectedProductIds([]);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Bulk CSV Export
  const handleExportCSV = () => {
    const targetProducts = selectedProductIds.length > 0
      ? products.filter((p) => selectedProductIds.includes(p.id))
      : filteredProducts;

    if (targetProducts.length === 0) return;

    const BOM = '\uFEFF';
    const headers = ['ID', 'SKU PRINCIPAL', 'NOM PRODUIT', 'CATÉGORIE', 'COLLECTION', 'PRIX', 'PRIX ORIGINAL', 'STOCK TOTAL', 'STATUT'];

    const rows = targetProducts.map((p) => {
      const totalStock = Object.values(p.stockPerSize || {}).reduce((s, v) => s + v, 0);
      const sku = `SKU-PROS-${p.name.slice(0, 6).toUpperCase()}`;
      return [
        `"${p.id}"`,
        `"${sku}"`,
        `"${p.name}"`,
        `"${p.category.toUpperCase()}"`,
        `"${(p.collection || 'signature').toUpperCase()}"`,
        `"${formatPrice(p.price)}"`,
        `"${p.originalPrice ? formatPrice(p.originalPrice) : '—'}"`,
        `"${totalStock}"`,
        `"${p.status || 'ACTIVE'}"`,
      ].join(';');
    });

    const csvContent = BOM + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pros_catalogue_produits_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete product action
  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setSuccessMsg(`Produit "${productToDelete.name}" supprimé définitivement.`);
      setProductToDelete(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const getStatusBadge = (status?: ProductStatus) => {
    const s = status || 'ACTIVE';
    if (s === 'ACTIVE') {
      return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-green-100 text-green-800 border border-green-300 uppercase font-sans">PUBLIÉ</span>;
    }
    if (s === 'DRAFT') {
      return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase font-sans">BROUILLON</span>;
    }
    return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300 uppercase font-sans">ARCHIVÉ</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="CATALOGUE & PIÈCES PROS"
          title="GESTION DU CATALOGUE PRODUITS"
          description="Publiez, modifiez et gérez l'ensemble des produits PROS disponibles sur la boutique en ligne."
          primaryAction={
            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase tracking-superwide hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-lg font-sans"
            >
              <Plus size={18} />
              <span>PUBLIER UN PRODUIT</span>
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

        {/* 6 Catalog KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-sans">
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">TOTAL PRODUITS</span>
            <div className="text-2xl font-bold text-black">{stats.total}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">PUBLIÉS</span>
            <div className="text-2xl font-bold text-emerald-700">{stats.published}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">BROUILLONS</span>
            <div className="text-2xl font-bold text-amber-700">{stats.drafts}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">STOCK FAIBLE</span>
            <div className="text-2xl font-bold text-amber-700">{stats.lowStock}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-red-600 uppercase font-bold tracking-wider">RUPTURES</span>
            <div className="text-2xl font-bold text-red-700">{stats.outOfStock}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-pros-gold uppercase font-bold tracking-wider">PROMOTIONS</span>
            <div className="text-2xl font-bold text-pros-gold">{stats.promos}</div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-pros-bone border border-neutral-200 p-4 space-y-4 shadow-sm font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 text-xs font-sans">
            
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par nom, SKU, catégorie..."
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
              <option value="ACTIVE">PUBLIÉ (ACTIF)</option>
              <option value="DRAFT">BROUILLON</option>
              <option value="ARCHIVED">ARCHIVÉ</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">CATÉGORIE : TOUTES</option>
              <option value="homme">HOMME</option>
              <option value="femme">FEMME</option>
              <option value="accessoires">ACCESSOIRES</option>
            </select>

            {/* Collection Filter */}
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">COLLECTION : TOUTES</option>
              <option value="essentielle">ESSENTIELLE</option>
              <option value="signature">SIGNATURE</option>
              <option value="sport">SPORT</option>
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">STOCK : TOUS</option>
              <option value="available">DISPONIBLE</option>
              <option value="low">STOCK FAIBLE</option>
              <option value="out">RUPTURE</option>
            </select>

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">PRIX : TOUS</option>
              <option value="promo">EN PROMOTION</option>
              <option value="regular">PRIX NORMAL</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="newest">PLUS RÉCENT</option>
              <option value="oldest">PLUS ANCIEN</option>
              <option value="name-asc">NOM A-Z</option>
              <option value="name-desc">NOM Z-A</option>
              <option value="price-asc">PRIX CROISSANT</option>
              <option value="price-desc">PRIX DÉCROISSANT</option>
              <option value="stock-low">STOCK CRITIQUE</option>
            </select>

          </div>

          {/* Bulk Selection Actions Bar */}
          {selectedProductIds.length > 0 && (
            <div className="p-3 bg-pros-black text-white text-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in font-sans">
              <span className="font-bold">
                {selectedProductIds.length} PRODUIT(S) SÉLECTIONNÉ(S) :
              </span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={() => handleBulkStatusChange('ACTIVE')}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase font-sans cursor-pointer"
                >
                  PUBLIER
                </button>
                <button
                  onClick={() => handleBulkStatusChange('DRAFT')}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] uppercase font-sans cursor-pointer"
                >
                  DÉPUBLIER
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
                  onClick={() => setSelectedProductIds([])}
                  className="px-2 py-1 bg-neutral-800 text-neutral-300 text-[10px] uppercase font-sans cursor-pointer"
                >
                  ANNULER
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Data Table */}
        <div className="bg-white border border-neutral-200 overflow-x-auto shadow-sm font-sans">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-pros-bone text-neutral-600 uppercase border-b border-neutral-200 text-[10px] tracking-wider font-sans font-bold">
              <tr>
                <th className="py-4 px-4 w-8">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      paginatedProducts.length > 0 &&
                      selectedProductIds.length === paginatedProducts.length
                    }
                    className="accent-pros-black cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4 font-sans">Visuel</th>
                <th className="py-4 px-4 font-sans">Nom / SKU</th>
                <th className="py-4 px-4 font-sans">Catégorie</th>
                <th className="py-4 px-4 font-sans">Collection</th>
                <th className="py-4 px-4 font-sans">Prix (FCFA)</th>
                <th className="py-4 px-4 font-sans">Stock</th>
                <th className="py-4 px-4 font-sans">Statut</th>
                <th className="py-4 px-4 text-right font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-black font-sans">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center font-sans">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Package className="mx-auto text-neutral-400" size={44} />
                      <div className="font-display font-bold text-base uppercase text-black">VOTRE CATALOGUE EST VIDE</div>
                      <p className="text-xs text-neutral-500">Commencez par créer votre premier produit PROS pour alimenter la boutique.</p>
                      <button
                        onClick={handleOpenCreateModal}
                        className="px-5 py-2.5 bg-pros-black text-white text-xs font-bold uppercase hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer font-sans shadow-md"
                      >
                        <Plus size={16} />
                        <span>PUBLIER UN PRODUIT</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center font-sans">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Search className="mx-auto text-neutral-400" size={36} />
                      <div className="font-display font-bold text-sm uppercase text-black">AUCUN PRODUIT TROUVÉ</div>
                      <p className="text-xs text-neutral-500">Aucun produit ne correspond à vos critères de recherche actuels.</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setCategoryFilter('all');
                          setCollectionFilter('all');
                          setStockFilter('all');
                          setPriceFilter('all');
                          setSortBy('newest');
                        }}
                        className="px-4 py-2 bg-pros-black text-white text-xs font-bold uppercase hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-sans"
                      >
                        <RotateCcw size={14} />
                        <span>RÉINITIALISER FILTRES</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const totalStock = Object.values(p.stockPerSize || {}).reduce((a, b) => a + b, 0);
                  const isLow = Object.values(p.stockPerSize || {}).some((q) => q <= 3 && q > 0);
                  const isOut = totalStock === 0;
                  const pImage = p.colors?.[0]?.images?.[0] || '';
                  const primarySku = `SKU-PROS-${p.name.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '')}`;

                  return (
                    <tr key={p.id} className="hover:bg-pros-bone transition-colors font-sans">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => handleSelectOne(p.id)}
                          className="accent-pros-black cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <img src={pImage} alt={p.name} className="w-12 h-14 object-cover border border-neutral-200 bg-pros-bone" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-black uppercase font-sans">{p.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{primarySku}</div>
                      </td>
                      <td className="py-4 px-4 uppercase text-neutral-600 font-sans">{p.category} • {p.subCategory}</td>
                      <td className="py-4 px-4 uppercase text-neutral-600 font-bold font-sans">{p.collection || 'signature'}</td>
                      <td className="py-4 px-4 font-sans">
                        <div className="font-bold text-black">{formatPrice(p.price)}</div>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <div className="text-[10px] text-neutral-400 line-through font-mono">
                            {formatPrice(p.originalPrice)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-sans">
                        {isOut ? (
                          <span className="px-2.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase font-sans">RUPTURE</span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 font-mono">
                            FAIBLE ({totalStock})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                            {totalStock} dispo
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(p.status)}</td>
                      <td className="py-4 px-4 text-right space-x-1.5 font-sans">
                        <button
                          onClick={() => navigate(`/product/${p.slug}`)}
                          className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black cursor-pointer inline-flex items-center"
                          title="Aperçu Boutique"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black cursor-pointer inline-flex items-center font-bold text-[10px]"
                          title="Modifier le produit"
                        >
                          ÉDITER
                        </button>
                        <button
                          onClick={() => handleDuplicateProduct(p)}
                          className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black cursor-pointer inline-flex items-center"
                          title="Dupliquer le produit"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-red-100 hover:border-red-300 text-red-600 cursor-pointer inline-flex items-center"
                          title="Supprimer définitivement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filteredProducts.length > 0 && (
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
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredProducts.length)} sur {filteredProducts.length} produits
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

        {/* Modal Form (Créer / Éditer Produit en 7 Sections) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden font-sans">
              
              {/* Sticky Header */}
              <div className="p-6 bg-white border-b border-neutral-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pros-bone border border-neutral-300">
                    <Package className="text-black" size={24} />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl uppercase tracking-wider text-black">
                      {editingProduct ? `ÉDITION : ${editingProduct.name}` : 'PUBLIER UN NOUVEL ARTICLE PROS'}
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans">
                      Remplissez les informations ci-dessous pour publier directement votre produit sur le catalogue PROS.
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-black p-2 border border-neutral-200 hover:border-black cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Center Content */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
                
                {validationError && (
                  <div className="p-4 bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-center justify-between font-sans">
                    <span>{validationError}</span>
                    <button onClick={() => setValidationError(null)} className="text-neutral-500 hover:text-black">
                      <X size={16} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmitProduct} className="space-y-6 text-xs font-sans">
                  
                  {/* SECTION 1: INFORMATIONS PRINCIPALES */}
                  <div className="space-y-3 bg-pros-bone p-5 border border-neutral-200 font-sans">
                    <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                      1. INFORMATIONS PRINCIPALES
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Nom de l’article *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: HOODIE SIGNATURE PROS"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Slug URL (Auto-généré)</label>
                        <input
                          type="text"
                          placeholder="hoodie-signature-pros"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">Accroche courte</label>
                      <input
                        type="text"
                        placeholder="Coupe contemporaine, coton peigné 480GSM"
                        value={formData.shortDescription}
                        onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">Description complète du produit</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans"
                      />
                    </div>
                  </div>

                  {/* SECTION 2: ORGANISATION & CATALOGUE */}
                  <div className="space-y-3 bg-pros-bone p-5 border border-neutral-200 font-sans">
                    <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                      2. ORGANISATION & CATALOGUE
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Catégorie *</label>
                        {categories.length === 0 ? (
                          <div className="text-[10px] text-amber-700 bg-amber-50 p-2 border border-amber-200">
                            Aucune catégorie. Créez d'abord une catégorie.
                          </div>
                        ) : (
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer font-bold"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.slug}>{c.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Collection</label>
                        {collections.length === 0 ? (
                          <select
                            value={formData.collection}
                            onChange={(e) => setFormData({ ...formData, collection: e.target.value as ProductCollection })}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
                          >
                            <option value="signature">SIGNATURE</option>
                            <option value="essentielle">ESSENTIELLE</option>
                            <option value="sport">SPORT</option>
                          </select>
                        ) : (
                          <select
                            value={formData.collection}
                            onChange={(e) => setFormData({ ...formData, collection: e.target.value as ProductCollection })}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
                          >
                            {collections.map((col) => (
                              <option key={col.id} value={col.slug}>{col.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Sous-catégorie</label>
                        <select
                          value={formData.subCategory}
                          onChange={(e) => setFormData({ ...formData, subCategory: e.target.value as SubCategory })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
                        >
                          <option value="hoodie">HOODIE</option>
                          <option value="sweatshirt">SWEATSHIRT</option>
                          <option value="polo">POLO</option>
                          <option value="bomber">BOMBER</option>
                          <option value="veste">VESTE</option>
                          <option value="casquette">CASQUETTE</option>
                          <option value="ensemble">ENSEMBLE</option>
                          <option value="sac">SAC</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Badge Produit</label>
                        <select
                          value={formData.badge}
                          onChange={(e) => setFormData({ ...formData, badge: e.target.value as ProductBadge })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
                        >
                          <option value="nouveau">NOUVEAU</option>
                          <option value="bestseller">BEST-SELLER</option>
                          <option value="essentiel">ESSENTIEL</option>
                          <option value="exclusif">EXCLUSIF</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: PRIX & STATUT PUBLICATION */}
                  <div className="space-y-3 bg-pros-bone p-5 border border-neutral-200 font-sans">
                    <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                      3. PRIX & STATUT PUBLICATION
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Prix de Vente (FCFA) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-mono font-bold text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Prix d'origine (Barré)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Coût d'achat interne</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.internalCost}
                          onChange={(e) => setFormData({ ...formData, internalCost: Number(e.target.value) })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Statut *</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans font-bold cursor-pointer"
                        >
                          <option value="ACTIVE">PUBLIÉ (VISIBLE SOUR BOUTIQUE)</option>
                          <option value="DRAFT">BROUILLON (MASQUÉ)</option>
                          <option value="ARCHIVED">ARCHIVÉ</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: VISUELS & MÉDIAS PROS */}
                  <div className="space-y-3 bg-pros-bone p-5 border border-neutral-200 font-sans">
                    <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                      4. VISUELS & MÉDIAS PROS
                    </h3>

                    <div className="space-y-4">
                      {/* Upload Drag & Drop Zone */}
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">IMPORTER UNE IMAGE DEPUIS VOTRE APPAREIL *</label>
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDropImage}
                          className="p-6 border-2 border-dashed border-neutral-300 bg-white text-center space-y-3 hover:border-black transition-colors"
                        >
                          <Upload className="mx-auto text-neutral-400" size={32} />
                          <div>
                            <span className="font-bold text-xs uppercase text-black block">GLISSER-DÉPOSER UNE IMAGE ICI OU CLIQUER POUR PARCOURIR</span>
                            <span className="text-[10px] text-neutral-500 block mt-0.5 font-sans">
                              Formats acceptés : PNG, JPG, WEBP, SVG (Recommandé : 800x1000px HD)
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="block mx-auto text-xs text-neutral-600 file:mr-4 file:py-2 file:px-4 file:border file:border-neutral-300 file:text-xs file:font-bold file:bg-pros-bone file:text-black hover:file:bg-neutral-200 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Media Library Picker Trigger Button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setIsMediaPickerOpen(true)}
                          className="w-full py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm font-sans"
                        >
                          <Sparkles size={16} className="text-pros-gold" />
                          <span>SÉLECTIONNER DEPUIS LA MÉDIATHÈQUE PROS</span>
                        </button>
                      </div>

                      {/* Optional URL input */}
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">OU SAISIR UN LIEN / URL D'IMAGE HD</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans text-xs"
                        />
                      </div>

                      {/* Real-time Image Preview & Delete */}
                      {formData.imageUrl ? (
                        <div className="p-3 bg-white border border-neutral-300 flex items-center justify-between gap-4 font-sans">
                          <div className="flex items-center gap-3">
                            <img src={formData.imageUrl} alt="Aperçu HD" className="w-16 h-20 object-cover border border-neutral-200 bg-pros-bone shrink-0" />
                            <div>
                              <span className="font-bold text-xs uppercase text-black block">IMAGE PRINCIPALE SÉLECTIONNÉE (isPrimary = true)</span>
                              <span className="text-[10px] text-emerald-700 font-mono font-bold block mt-0.5">
                                ✓ Image chargée et prête pour la publication en boutique
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
                            className="p-2 text-red-600 hover:bg-red-50 border border-neutral-200 hover:border-red-300 text-xs font-bold uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={14} />
                            <span>SUPPRIMER</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans">
                          Veuillez importer une image ou saisir une URL pour la fiche produit.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 5: COULEURS, VARIANTES & STOCKS */}
                  <div className="space-y-3 bg-pros-bone p-5 border border-neutral-200 font-sans">
                    <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                      5. COULEURS, VARIANTES & STOCKS
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Nom de la Couleur principale</label>
                        <input
                          type="text"
                          value={formData.colorName}
                          onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Code Hex Couleur</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.colorHex}
                            onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                            className="w-10 h-9 p-0 border border-neutral-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={formData.colorHex}
                            onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                            className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="font-bold uppercase text-black block">Stock disponible par Taille (Total : <strong className="font-mono text-pros-gold">{calculatedTotalStock} unités</strong>)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ProductSize[]).map((sz) => {
                          const key = `stock${sz}` as keyof typeof formData;
                          return (
                            <div key={sz} className="text-center bg-white p-2 border border-neutral-200">
                              <span className="block font-bold text-black text-[10px] uppercase font-mono">{sz}</span>
                              <input
                                type="number"
                                min="0"
                                value={formData[key] as number}
                                onChange={(e) => setFormData({ ...formData, [key]: Number(e.target.value) })}
                                className="w-full bg-pros-bone border border-neutral-300 px-1 py-1 text-center font-bold text-black font-mono text-xs focus:outline-none focus:border-black mt-1"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 6: RÉFÉRENCEMENT SEO */}
                  <div className="space-y-3 bg-pros-bone p-5 border border-neutral-200 font-sans">
                    <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2">
                      6. RÉFÉRENCEMENT SEO & GOOGLE PREVIEW
                    </h3>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Titre SEO (Meta Title)</label>
                        <input
                          type="text"
                          value={formData.metaTitle}
                          onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Description SEO (Meta Description)</label>
                        <textarea
                          rows={2}
                          value={formData.metaDescription}
                          onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 7: RÉSUMÉ DU PRODUIT AVANT PUBLICATION */}
                  <div className="p-4 bg-white border border-neutral-300 space-y-2 font-sans">
                    <span className="text-[10px] font-bold text-pros-gold uppercase tracking-wider block flex items-center gap-1">
                      <Sparkles size={14} /> RÉSUMÉ DE LA FICHE PRODUIT
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-sans">
                      <div><span className="text-neutral-500 font-bold uppercase text-[9px] block">PRODUIT</span><strong className="uppercase">{formData.name || '—'}</strong></div>
                      <div><span className="text-neutral-500 font-bold uppercase text-[9px] block">CATÉGORIE</span><strong className="uppercase">{formData.category}</strong></div>
                      <div><span className="text-neutral-500 font-bold uppercase text-[9px] block">PRIX</span><strong className="font-mono text-pros-gold">{formatPrice(formData.price)}</strong></div>
                      <div><span className="text-neutral-500 font-bold uppercase text-[9px] block">STOCK TOTAL</span><strong className="font-mono">{calculatedTotalStock} unités (6 variantes)</strong></div>
                    </div>
                  </div>

                </form>
              </div>

              {/* Sticky Footer */}
              <div className="p-6 bg-pros-bone border-t border-neutral-200 flex items-center justify-between shrink-0 font-sans">
                <span className="text-xs text-neutral-500 font-sans">
                  Statut : <strong className="uppercase text-black">{formData.status}</strong>
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 border border-neutral-300 bg-white text-black font-bold hover:bg-neutral-100 uppercase text-xs font-sans cursor-pointer"
                  >
                    ANNULER
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitProduct}
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-pros-black text-white font-bold uppercase text-xs hover:bg-neutral-800 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2 font-sans"
                  >
                    {isSubmitting ? (
                      <span>PUBLICATION...</span>
                    ) : (
                      <span>{editingProduct ? 'ENREGISTRER LES MODIFICATIONS' : 'PUBLIER AU CATALOGUE'}</span>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Confirmation Dialog for Product Deletion */}
        <AdminConfirmDialog
          isOpen={!!productToDelete}
          title="SUPPRIMER DU CATALOGUE"
          message={`Êtes-vous sûr de vouloir supprimer définitivement l'article "${productToDelete?.name}" du catalogue PROS ? Cette action est irréversible.`}
          confirmText="SUPPRIMER DÉFINITIVEMENT"
          onConfirm={confirmDelete}
          onCancel={() => setProductToDelete(null)}
        />

        {/* Media Picker Modal for Product Image Selection */}
        <MediaPickerModal
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelectMedia={(media) => {
            setFormData((prev) => ({ ...prev, imageUrl: media.url }));
          }}
          title="SÉLECTIONNER L'IMAGE DU PRODUIT DEPUIS LA MÉDIATHÈQUE PROS"
        />
      </div>
    </AdminLayout>
  );
};
