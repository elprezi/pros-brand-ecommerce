import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useStore } from '../../store/storeContext';
import type { Product, ProductSize } from '../../types/ecommerce';
import {
  Plus,
  Search,
  Check,
  X,
  Download,
  Eye,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Sparkles,
  Lock,
} from 'lucide-react';

interface ExtractedVariant {
  id: string;
  productId: string;
  productName: string;
  category: string;
  subCategory?: string;
  sku: string;
  barcode: string;
  color: string;
  hex: string;
  size: ProductSize;
  price: number;
  compareAtPrice?: number;
  discountPercent: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  image: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomColor {
  name: string;
  hex: string;
}

export const AdminVariantsPage: React.FC = () => {
  const { products, updateProduct, updateStockPerSize, formatPrice } = useStore();
  const navigate = useNavigate();

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'normal' | 'discounted'>('all');
  const [sortBy, setSortBy] = useState<'sku-asc' | 'sku-desc' | 'product-asc' | 'price-asc' | 'price-desc' | 'stock-low' | 'newest' | 'oldest'>('sku-asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection & Modal State
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailDrawerVariant, setDetailDrawerVariant] = useState<ExtractedVariant | null>(null);
  const [stockEditVariant, setStockEditVariant] = useState<ExtractedVariant | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Generator Form State
  const [generatorProductId, setGeneratorProductId] = useState<string>('');
  const [customColorsList, setCustomColorsList] = useState<CustomColor[]>([
    { name: 'Noir', hex: '#000000' },
    { name: 'Blanc', hex: '#FFFFFF' },
    { name: 'Vert PROS', hex: '#00843D' },
    { name: 'Bleu Nuit', hex: '#0A2540' },
    { name: 'Rouge', hex: '#C8102E' },
    { name: 'Beige Sand', hex: '#D5CAAF' },
    { name: 'Gris', hex: '#888888' },
  ]);
  const [selectedColorNames, setSelectedColorNames] = useState<string[]>(['Noir']);
  const [selectedSizes, setSelectedSizes] = useState<ProductSize[]>(['S', 'M', 'L', 'XL']);
  const [defaultStock, setDefaultStock] = useState<number>(0);
  const [overridePrice, setOverridePrice] = useState<string>('');

  // Custom Color Input State
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [showAddColorInput, setShowAddColorInput] = useState(false);

  // Simulated Database Load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  const handleRetryLoad = () => {
    setIsLoading(true);
    setIsError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 450);
  };

  // Extract all variants from products
  const allVariants: ExtractedVariant[] = useMemo(() => {
    const list: ExtractedVariant[] = [];

    products.forEach((p) => {
      const colors = p.colors && p.colors.length > 0 ? p.colors : [{ name: 'Noir', hex: '#0A0A0A', images: [] }];
      const sizes = p.sizes && p.sizes.length > 0 ? p.sizes : (['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ProductSize[]);

      colors.forEach((col) => {
        sizes.forEach((sz) => {
          const stock = p.stockPerSize?.[sz] ?? 0;
          const reservedStock = 0;
          const availableStock = Math.max(0, stock - reservedStock);
          const colorCode = col.name.substring(0, 3).toUpperCase();
          const pSlugCode = p.slug.replace(/[^a-z0-9]+/gi, '-').toUpperCase();
          const sku = `SKU-PROS-${pSlugCode}-${colorCode}-${sz}`;
          const barcode = `370${Math.abs(p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) * 1000 + sz.charCodeAt(0))}`;
          const compareAtPrice = p.originalPrice;
          const price = p.price;
          const discountPercent = compareAtPrice && compareAtPrice > price
            ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
            : 0;

          const variantImage = col.images?.[0] || p.colors?.[0]?.images?.[0] || '';

          const variantStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' =
            p.status === 'ARCHIVED' ? 'ARCHIVED' : stock > 0 ? 'ACTIVE' : 'INACTIVE';

          list.push({
            id: `${p.id}-${col.name}-${sz}`,
            productId: p.id,
            productName: p.name,
            category: p.category,
            subCategory: p.subCategory,
            sku,
            barcode,
            color: col.name,
            hex: col.hex || '#0A0A0A',
            size: sz,
            price,
            compareAtPrice,
            discountPercent,
            stock,
            reservedStock,
            availableStock,
            status: variantStatus,
            image: variantImage,
            createdAt: p.createdAt || '2026-08-18T10:00:00.000Z',
            updatedAt: p.updatedAt || new Date().toISOString(),
          });
        });
      });
    });

    return list;
  }, [products]);

  // Selected Parent Product Details
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === generatorProductId) || null;
  }, [products, generatorProductId]);

  // Distinct Filter Options
  const availableColors = useMemo(() => {
    const set = new Set<string>();
    allVariants.forEach((v) => set.add(v.color));
    return Array.from(set);
  }, [allVariants]);

  // Real-time KPIs
  const stats = useMemo(() => {
    const total = allVariants.length;
    const active = allVariants.filter((v) => v.status === 'ACTIVE' || v.stock > 0).length;
    const totalStockUnits = allVariants.reduce((sum, v) => sum + v.stock, 0);
    const lowStockCount = allVariants.filter((v) => v.stock > 0 && v.stock <= 3).length;

    return { total, active, totalStockUnits, lowStockCount };
  }, [allVariants]);

  // Filtered & Sorted Variants
  const filteredVariants = useMemo(() => {
    return allVariants
      .filter((v) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          v.sku.toLowerCase().includes(query) ||
          v.productName.toLowerCase().includes(query) ||
          v.color.toLowerCase().includes(query) ||
          v.size.toLowerCase().includes(query) ||
          v.barcode.includes(query);

        const matchesProduct = productFilter === 'all' || v.productId === productFilter;
        const matchesCategory = categoryFilter === 'all' || v.category.toLowerCase() === categoryFilter.toLowerCase();
        const matchesColor = colorFilter === 'all' || v.color.toLowerCase() === colorFilter.toLowerCase();
        const matchesSize = sizeFilter === 'all' || v.size === sizeFilter;
        const matchesStatus = statusFilter === 'all' || v.status === statusFilter;

        let matchesStock = true;
        if (stockFilter === 'in_stock') matchesStock = v.stock > 3;
        if (stockFilter === 'low_stock') matchesStock = v.stock > 0 && v.stock <= 3;
        if (stockFilter === 'out_of_stock') matchesStock = v.stock === 0;

        let matchesPrice = true;
        if (priceFilter === 'normal') matchesPrice = !v.compareAtPrice || v.compareAtPrice <= v.price;
        if (priceFilter === 'discounted') matchesPrice = Boolean(v.compareAtPrice && v.compareAtPrice > v.price);

        return matchesSearch && matchesProduct && matchesCategory && matchesColor && matchesSize && matchesStatus && matchesStock && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'sku-asc') return a.sku.localeCompare(b.sku);
        if (sortBy === 'sku-desc') return b.sku.localeCompare(a.sku);
        if (sortBy === 'product-asc') return a.productName.localeCompare(b.productName);
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'stock-low') return a.stock - b.stock;
        if (sortBy === 'newest') return b.id.localeCompare(a.id);
        if (sortBy === 'oldest') return a.id.localeCompare(b.id);
        return 0;
      });
  }, [allVariants, searchTerm, productFilter, categoryFilter, colorFilter, sizeFilter, statusFilter, stockFilter, priceFilter, sortBy]);

  // Paginated Variants
  const totalPages = Math.ceil(filteredVariants.length / itemsPerPage) || 1;
  const paginatedVariants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVariants.slice(start, start + itemsPerPage);
  }, [filteredVariants, currentPage, itemsPerPage]);

  // Matrix Generator Calculation & Duplicate Detection
  const matrixCombinations = useMemo(() => {
    if (!selectedProduct) return [];

    const existingKeys = new Set(
      allVariants.filter((v) => v.productId === selectedProduct.id).map((v) => `${v.color.toLowerCase()}-${v.size}`)
    );

    const result: Array<{
      color: string;
      hex: string;
      size: ProductSize;
      sku: string;
      price: number;
      stock: number;
      isExisting: boolean;
    }> = [];

    const finalPrice = overridePrice ? Number(overridePrice) : selectedProduct.price;

    selectedColorNames.forEach((colName) => {
      const colorObj = customColorsList.find((c) => c.name === colName) || { name: colName, hex: '#0A0A0A' };

      selectedSizes.forEach((sz) => {
        const key = `${colName.toLowerCase()}-${sz}`;
        const isExisting = existingKeys.has(key);
        const colorCode = colName.substring(0, 3).toUpperCase();
        const pSlugCode = selectedProduct.slug.replace(/[^a-z0-9]+/gi, '-').toUpperCase();
        const sku = `SKU-PROS-${pSlugCode}-${colorCode}-${sz}`;

        result.push({
          color: colName,
          hex: colorObj.hex,
          size: sz,
          sku,
          price: finalPrice,
          stock: defaultStock,
          isExisting,
        });
      });
    });

    return result;
  }, [selectedProduct, selectedColorNames, selectedSizes, customColorsList, overridePrice, defaultStock, allVariants]);

  // New combinations to create count
  const newCombinationsCount = useMemo(() => {
    return matrixCombinations.filter((m) => !m.isExisting).length;
  }, [matrixCombinations]);

  // Add Custom Color Handler
  const handleAddCustomColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) return;

    const trimmed = newColorName.trim();
    if (!customColorsList.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      const newColor = { name: trimmed, hex: newColorHex };
      setCustomColorsList((prev) => [...prev, newColor]);
      setSelectedColorNames((prev) => [...prev, trimmed]);
    }
    setNewColorName('');
    setShowAddColorInput(false);
  };

  // Quick Stock Adjustment Submit
  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockEditVariant) return;

    updateStockPerSize(stockEditVariant.productId, stockEditVariant.size, newStockValue);
    setSuccessMsg(`Stock mis à jour pour SKU ${stockEditVariant.sku} : ${newStockValue} unités.`);
    setStockEditVariant(null);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Bulk Generator Submission
  const handleGenerateBulkVariants = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Veuillez d’abord sélectionner un produit parent.');
      return;
    }
    if (newCombinationsCount === 0) {
      alert('Toutes les combinaisons sélectionnées existent déjà pour ce produit.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Merge colors & sizes onto product
      const existingColors = selectedProduct.colors || [];
      const newColorsToAdd = selectedColorNames.map((cName) => {
        const found = customColorsList.find((c) => c.name === cName);
        return { name: cName, hex: found?.hex || '#0A0A0A', images: selectedProduct.colors?.[0]?.images || [] };
      });

      // Avoid color name duplicates
      const mergedColors = [...existingColors];
      newColorsToAdd.forEach((nCol) => {
        if (!mergedColors.some((c) => c.name.toLowerCase() === nCol.name.toLowerCase())) {
          mergedColors.push(nCol);
        }
      });

      const mergedSizes = Array.from(new Set([...selectedProduct.sizes, ...selectedSizes]));
      const updatedStockPerSize = { ...selectedProduct.stockPerSize };

      selectedSizes.forEach((sz) => {
        if (updatedStockPerSize[sz] === undefined || updatedStockPerSize[sz] === 0) {
          updatedStockPerSize[sz] = defaultStock;
        }
      });

      const priceVal = overridePrice ? Number(overridePrice) : selectedProduct.price;

      const updatedProduct: Product = {
        ...selectedProduct,
        colors: mergedColors,
        sizes: mergedSizes,
        price: priceVal,
        stockPerSize: updatedStockPerSize,
        updatedAt: new Date().toISOString(),
      };

      updateProduct(updatedProduct);
      setIsSubmitting(false);
      setIsCreateModalOpen(false);
      setSuccessMsg(`Succès : ${newCombinationsCount} déclinaison(s) créée(s) pour "${selectedProduct.name}".`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }, 450);
  };

  // Bulk Export CSV
  const handleExportCSV = () => {
    const targetVariants = selectedVariantIds.length > 0
      ? allVariants.filter((v) => selectedVariantIds.includes(v.id))
      : filteredVariants;

    if (targetVariants.length === 0) return;

    const BOM = '\uFEFF';
    const headers = [
      'SKU',
      'CODE_BARRES',
      'PRODUIT',
      'CATÉGORIE',
      'COULEUR',
      'TAILLE',
      'PRIX_FCFA',
      'PRIX_PROMO_FCFA',
      'STOCK_TOTAL',
      'STOCK_RÉSERVÉ',
      'STOCK_DISPONIBLE',
      'STATUT',
      'DATE_MODIFICATION'
    ];

    const rows = targetVariants.map((v) => {
      return [
        `"${v.sku}"`,
        `"${v.barcode}"`,
        `"${v.productName.replace(/"/g, '""')}"`,
        `"${v.category}"`,
        `"${v.color}"`,
        `"${v.size}"`,
        `"${v.price}"`,
        `"${v.compareAtPrice || ''}"`,
        `"${v.stock}"`,
        `"${v.reservedStock}"`,
        `"${v.availableStock}"`,
        `"${v.status}"`,
        `"${v.updatedAt}"`,
      ].join(';');
    });

    const csvContent = BOM + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pros_variantes_skus_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (v: ExtractedVariant) => {
    if (v.stock === 0) {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase font-sans">RUPTURE</span>;
    }
    if (v.stock <= 3) {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase font-sans">STOCK FAIBLE</span>;
    }
    return <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase font-sans">EN STOCK</span>;
  };

  // Render Error State
  if (isError) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto py-16 text-center space-y-4 font-sans text-pros-black">
          <AlertTriangle className="mx-auto text-red-600" size={48} />
          <h2 className="font-display font-bold text-xl uppercase">IMPOSSIBLE DE CHARGER LES VARIANTES</h2>
          <p className="text-xs text-neutral-600">Une erreur s'est produite lors de la récupération des données de déclinaison.</p>
          <button
            onClick={handleRetryLoad}
            className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 inline-flex items-center gap-2 font-sans shadow-md"
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
          title="GESTION DES VARIANTES & SKUS"
          description="Gérez les déclinaisons, références SKUs, prix et stocks de chaque produit PROS."
          primaryAction={
            <button
              onClick={() => {
                if (products.length > 0) setGeneratorProductId(products[0].id);
                setIsCreateModalOpen(true);
              }}
              className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase tracking-superwide hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-lg font-sans"
            >
              <Plus size={18} />
              <span>AJOUTER / GÉNÉRER DES VARIANTES</span>
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

        {/* 4 Real-time KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans">
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">TOTAL VARIANTES</span>
            <div className="text-3xl font-bold text-black">{isLoading ? '...' : stats.total}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">SKUS ACTIFS</span>
            <div className="text-3xl font-bold text-emerald-700">{isLoading ? '...' : stats.active}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-pros-gold uppercase font-bold tracking-wider">STOCK TOTAL (UNITÉS)</span>
            <div className="text-3xl font-bold text-pros-gold">{isLoading ? '...' : stats.totalStockUnits}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-5 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">STOCK FAIBLE</span>
            <div className="text-3xl font-bold text-amber-700">{isLoading ? '...' : stats.lowStockCount}</div>
          </div>
        </div>

        {/* Toolbar & Multi-Filters */}
        <div className="bg-pros-bone border border-neutral-200 p-4 space-y-4 shadow-sm font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
            
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par SKU, produit, couleur, taille..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans"
              />
            </div>

            {/* Product Filter */}
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">PRODUIT : TOUS</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">CATÉGORIE : TOUTES</option>
              <option value="homme">HOMME</option>
              <option value="femme">FEMME</option>
              <option value="accessoires">ACCESSOIRES</option>
            </select>

            {/* Size Filter */}
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">TAILLE : TOUTES</option>
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>

            {/* Color Filter */}
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">COULEUR : TOUTES</option>
              {availableColors.map((col) => (
                <option key={col} value={col}>{col.toUpperCase()}</option>
              ))}
            </select>

            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">STOCK : TOUS</option>
              <option value="in_stock">DISPONIBLE (&gt; 3)</option>
              <option value="low_stock">STOCK FAIBLE (1 - 3)</option>
              <option value="out_of_stock">RUPTURE (0)</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="sku-asc">SKU A-Z</option>
              <option value="sku-desc">SKU Z-A</option>
              <option value="product-asc">PRODUIT A-Z</option>
              <option value="price-asc">PRIX CROISSANT</option>
              <option value="price-desc">PRIX DÉCROISSANT</option>
              <option value="stock-low">STOCK PLUS FAIBLE</option>
            </select>

          </div>

          {/* Bulk Selection Actions Bar */}
          {selectedVariantIds.length > 0 && (
            <div className="p-3 bg-pros-black text-white text-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in font-sans">
              <span className="font-bold">
                {selectedVariantIds.length} VARIANTE(S) SÉLECTIONNÉE(S) :
              </span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1 bg-pros-gold hover:bg-amber-600 text-black font-bold text-[10px] uppercase font-sans flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} />
                  <span>EXPORTER CSV (EXCEL)</span>
                </button>
                <button
                  onClick={() => setSelectedVariantIds([])}
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
          <div className="bg-white border border-neutral-200 p-8 space-y-4 animate-pulse">
            <div className="h-8 bg-neutral-200 w-full"></div>
            <div className="h-8 bg-neutral-200 w-full"></div>
            <div className="h-8 bg-neutral-200 w-full"></div>
          </div>
        ) : allVariants.length === 0 ? (
          /* Official Empty State */
          <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm font-sans">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-pros-bone border border-neutral-300 flex items-center justify-center mx-auto text-black">
                <Package size={32} />
              </div>
              <h3 className="font-display font-bold text-xl uppercase text-black">AUCUNE VARIANTE</h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                Les variantes de vos produits apparaîtront ici. Créez d'abord un produit puis ajoutez ses déclinaisons.
              </p>
              <div className="flex justify-center gap-3 pt-2 font-sans">
                <button
                  onClick={() => navigate('/admin/products')}
                  className="px-5 py-2.5 border border-neutral-300 bg-white text-black font-bold text-xs uppercase hover:bg-neutral-100 cursor-pointer font-sans"
                >
                  VOIR LES PRODUITS
                </button>
                <button
                  onClick={() => navigate('/admin/products')}
                  className="px-6 py-2.5 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 cursor-pointer shadow-md font-sans"
                >
                  + CRÉER UN PRODUIT
                </button>
              </div>
            </div>
          </div>
        ) : filteredVariants.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm font-sans">
            <div className="max-w-sm mx-auto space-y-3">
              <Search className="mx-auto text-neutral-400" size={36} />
              <h3 className="font-display font-bold text-sm uppercase text-black">AUCUNE VARIANTE TROUVÉE</h3>
              <p className="text-xs text-neutral-500">Aucune déclinaison ne correspond à vos critères de recherche.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setProductFilter('all');
                  setCategoryFilter('all');
                  setColorFilter('all');
                  setSizeFilter('all');
                  setStatusFilter('all');
                  setStockFilter('all');
                  setPriceFilter('all');
                }}
                className="px-4 py-2 bg-pros-black text-white text-xs font-bold uppercase hover:bg-neutral-800 inline-flex items-center gap-1.5 cursor-pointer font-sans"
              >
                <RotateCcw size={14} />
                <span>RÉINITIALISER FILTRES</span>
              </button>
            </div>
          </div>
        ) : (
          /* Desktop DataTable / Mobile Cards */
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200 overflow-x-auto shadow-sm font-sans">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-pros-bone border-b border-neutral-200 text-[11px] font-bold text-black uppercase tracking-wider font-sans">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedVariantIds.length === paginatedVariants.length && paginatedVariants.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVariantIds(paginatedVariants.map((v) => v.id));
                          } else {
                            setSelectedVariantIds([]);
                          }
                        }}
                        className="accent-pros-black cursor-pointer"
                      />
                    </th>
                    <th className="p-3">VISUEL</th>
                    <th className="p-3">SKU UNIQUE</th>
                    <th className="p-3">PRODUIT</th>
                    <th className="p-3">COULEUR</th>
                    <th className="p-3">TAILLE</th>
                    <th className="p-3">PRIX</th>
                    <th className="p-3 text-center">STOCK (DISPO)</th>
                    <th className="p-3 text-center">STATUT</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs font-sans">
                  {paginatedVariants.map((v) => {
                    const isSelected = selectedVariantIds.includes(v.id);

                    return (
                      <tr key={v.id} className={`hover:bg-pros-bone transition-colors font-sans ${isSelected ? 'bg-pros-bone/80' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedVariantIds(selectedVariantIds.filter((id) => id !== v.id));
                              } else {
                                setSelectedVariantIds([...selectedVariantIds, v.id]);
                              }
                            }}
                            className="accent-pros-black cursor-pointer"
                          />
                        </td>
                        
                        {/* Thumbnail or PROS Monogram Placeholder */}
                        <td className="p-3">
                          <div className="w-10 h-12 bg-pros-black overflow-hidden border border-neutral-200 shrink-0">
                            {v.image ? (
                              <img src={v.image} alt={v.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-white">
                                <img src="/brand/LOGOPROS.png" alt="PROS" className="h-3 w-auto opacity-70" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="p-3 font-mono font-bold text-pros-gold text-[11px]">
                          {v.sku}
                        </td>

                        {/* Product Name & Category */}
                        <td className="p-3">
                          <div className="font-bold text-black uppercase font-sans">{v.productName}</div>
                          <span className="text-[9px] font-mono text-neutral-500 uppercase">{v.category}</span>
                        </td>

                        {/* Color */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="w-3 h-3 rounded-full border border-neutral-300" style={{ backgroundColor: v.hex }}></span>
                            <span className="text-black font-bold uppercase text-[11px]">{v.color}</span>
                          </div>
                        </td>

                        {/* Size */}
                        <td className="p-3 font-mono font-bold text-black text-xs">
                          <span className="px-2 py-0.5 bg-pros-bone border border-neutral-300">
                            {v.size}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="p-3 font-sans">
                          <div className="font-bold text-black">{formatPrice(v.price)}</div>
                          {v.compareAtPrice && v.compareAtPrice > v.price && (
                            <div className="flex items-center gap-1">
                              <span className="line-through text-neutral-400 font-mono text-[10px]">
                                {formatPrice(v.compareAtPrice)}
                              </span>
                              <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 border border-red-200">
                                -{v.discountPercent}%
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Stock breakdown */}
                        <td className="p-3 text-center font-sans">
                          <div className="font-mono font-bold text-sm text-black">{v.stock} pcs</div>
                          <div className="text-[9px] text-neutral-500 font-mono">
                            Dispo: {v.availableStock} | Rés: {v.reservedStock}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center font-sans">
                          {getStatusBadge(v)}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1 font-sans">
                            <button
                              onClick={() => setDetailDrawerVariant(v)}
                              className="px-2 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-[10px] uppercase cursor-pointer"
                              title="Détails"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => {
                                setStockEditVariant(v);
                                setNewStockValue(v.stock);
                              }}
                              className="px-2 py-1 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-[10px] uppercase cursor-pointer"
                              title="Ajuster Stock"
                            >
                              STOCK
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                    Variantes {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredVariants.length)} sur {filteredVariants.length}
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

        {/* Stock Quick Adjustment Modal */}
        {stockEditVariant && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 p-6 max-w-md w-full space-y-4 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="font-display font-bold text-sm uppercase text-black">
                  AJUSTER LE STOCK — {stockEditVariant.sku}
                </h3>
                <button onClick={() => setStockEditVariant(null)} className="text-neutral-500 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-pros-bone p-3 border border-neutral-200 space-y-1 font-sans">
                <div className="font-bold text-black text-xs uppercase">{stockEditVariant.productName}</div>
                <div className="text-[11px] text-neutral-600 font-sans">
                  Déclinaison : <span className="font-bold uppercase text-black">{stockEditVariant.color}</span> / <span className="font-mono font-bold text-black">{stockEditVariant.size}</span>
                </div>
              </div>

              <form onSubmit={handleSaveStockAdjustment} className="space-y-4 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-black block">Nouveau Stock Total (Unités)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black focus:outline-none font-mono font-bold text-base"
                  />
                </div>

                <div className="pt-2 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                  <button
                    type="button"
                    onClick={() => setStockEditVariant(null)}
                    className="px-4 py-2 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100"
                  >
                    ANNULER
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-pros-black text-white font-bold uppercase text-xs hover:bg-neutral-800 shadow-md"
                  >
                    ENREGISTRER LE STOCK
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Generator Modal (`AJOUTER / GÉNÉRER DES VARIANTES MULTIPLES`) */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden font-sans">
              
              {/* Sticky Header */}
              <div className="p-6 bg-white border-b border-neutral-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pros-bone border border-neutral-300">
                    <Sliders className="text-black" size={24} />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl uppercase tracking-wider text-black">
                      GÉNÉRER DES VARIANTES MULTIPLES
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans">
                      Sélectionnez un produit, configurez les attributs et générez dynamiquement le catalogue de déclinaisons.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (generatorProductId && window.confirm('Abandonner la création des variantes ?')) {
                      setIsCreateModalOpen(false);
                    } else if (!generatorProductId) {
                      setIsCreateModalOpen(false);
                    }
                  }}
                  className="text-neutral-500 hover:text-black p-2 border border-neutral-200 hover:border-black transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Center Content */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
                
                {/* STEP 1: PRODUIT PARENT */}
                <div className="space-y-4 bg-pros-bone p-5 border border-neutral-200 font-sans">
                  <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2 flex items-center justify-between">
                    <span>1. PRODUIT PARENT</span>
                    {selectedProduct && (
                      <span className="text-emerald-700 font-mono text-[10px] flex items-center gap-1">
                        <Check size={14} /> PRODUIT SÉLECTIONNÉ
                      </span>
                    )}
                  </h3>

                  {products.length === 0 ? (
                    /* BLOCKING EMPTY STATE WHEN PRODUCTS.LENGTH === 0 */
                    <div className="p-8 bg-white border border-red-200 text-center space-y-4">
                      <div className="w-12 h-12 bg-red-50 text-red-600 border border-red-200 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base uppercase text-red-900">AUCUN PRODUIT DISPONIBLE</h4>
                        <p className="text-xs text-neutral-600 mt-1 max-w-md mx-auto font-sans">
                          Vous devez d'abord créer un produit avant de pouvoir générer ses variantes.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          navigate('/admin/products');
                        }}
                        className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 inline-flex items-center gap-2 shadow-md cursor-pointer font-sans"
                      >
                        <Plus size={16} />
                        <span>CRÉER UN PRODUIT</span>
                      </button>
                    </div>
                  ) : selectedProduct ? (
                    /* SELECTED PRODUCT CARD WITH CHANGE BUTTON */
                    <div className="p-4 bg-white border border-neutral-300 flex items-center justify-between font-sans">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-14 bg-pros-black border border-neutral-200 overflow-hidden shrink-0">
                          {selectedProduct.colors?.[0]?.images?.[0] ? (
                            <img src={selectedProduct.colors[0].images[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white">
                              <img src="/brand/LOGOPROS.png" alt="PROS" className="h-3 w-auto opacity-70" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm uppercase text-black">{selectedProduct.name}</div>
                          <div className="text-xs font-mono text-pros-gold font-bold">
                            SKU-PROS-{selectedProduct.slug.toUpperCase()}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-sans mt-0.5">
                            Catégorie : <span className="uppercase font-bold">{selectedProduct.category}</span> | Prix de base : <span className="font-bold">{formatPrice(selectedProduct.price)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGeneratorProductId('')}
                        className="px-3 py-1.5 border border-neutral-300 text-black font-bold text-[10px] uppercase hover:bg-neutral-100 cursor-pointer"
                      >
                        CHANGER DE PRODUIT
                      </button>
                    </div>
                  ) : (
                    /* PRODUCT SELECT COMBOBOX */
                    <div className="space-y-2 font-sans">
                      <label className="font-bold uppercase text-black text-xs block">Sélectionnez un produit du catalogue :</label>
                      <select
                        value={generatorProductId}
                        onChange={(e) => setGeneratorProductId(e.target.value)}
                        className="w-full bg-white border border-neutral-300 px-3 py-2.5 text-black focus:outline-none uppercase font-bold text-xs cursor-pointer"
                      >
                        <option value="">-- CHOISIR UN PRODUIT PARENT --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({formatPrice(p.price)}) — /{p.category}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* STEP 2: ATTRIBUTS (SIZES & COLORS) - LOCKED IF NO PRODUCT SELECTED */}
                <div className={`space-y-4 bg-pros-bone p-5 border border-neutral-200 font-sans transition-opacity ${!selectedProduct ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2 flex items-center justify-between">
                    <span>2. SELECTION DES ATTRIBUTS (TAILLES & COULEURS)</span>
                    {!selectedProduct && <Lock size={14} className="text-neutral-400" />}
                  </h3>

                  {/* SIZES MULTI-SELECT */}
                  <div className="space-y-2">
                    <label className="font-bold uppercase text-black text-xs block">A. TAILLES DE VÊTEMENT</label>
                    <div className="flex flex-wrap gap-2 font-mono font-bold">
                      {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ProductSize[]).map((sz) => {
                        const isChecked = selectedSizes.includes(sz);
                        return (
                          <button
                            type="button"
                            key={sz}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedSizes(selectedSizes.filter((s) => s !== sz));
                              } else {
                                setSelectedSizes([...selectedSizes, sz]);
                              }
                            }}
                            className={`px-4 py-2 border font-bold text-xs cursor-pointer transition-colors ${
                              isChecked ? 'bg-pros-black text-white border-pros-black' : 'bg-white text-black border-neutral-300 hover:border-black'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* COLORS MULTI-SELECT */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold uppercase text-black text-xs">B. COULEURS PROS</label>
                      <button
                        type="button"
                        onClick={() => setShowAddColorInput(!showAddColorInput)}
                        className="text-[10px] font-bold uppercase text-pros-gold hover:underline flex items-center gap-1"
                      >
                        + AJOUTER UNE COULEUR PERSONNALISÉE
                      </button>
                    </div>

                    {/* Custom Color Input Inline Form */}
                    {showAddColorInput && (
                      <form onSubmit={handleAddCustomColor} className="p-3 bg-white border border-neutral-300 flex items-center gap-3 animate-fade-in font-sans">
                        <input
                          type="text"
                          required
                          placeholder="Nom de couleur (ex: Kaki PROS)"
                          value={newColorName}
                          onChange={(e) => setNewColorName(e.target.value)}
                          className="flex-1 bg-pros-bone border border-neutral-300 px-3 py-1.5 text-xs text-black focus:outline-none"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="color"
                            value={newColorHex}
                            onChange={(e) => setNewColorHex(e.target.value)}
                            className="w-8 h-8 p-0 border border-neutral-300 cursor-pointer"
                          />
                          <span className="font-mono text-[10px] text-neutral-500 uppercase">{newColorHex}</span>
                        </div>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-pros-black text-white font-bold text-[10px] uppercase cursor-pointer"
                        >
                          AJOUTER
                        </button>
                      </form>
                    )}

                    <div className="flex flex-wrap gap-2 font-sans">
                      {customColorsList.map((col) => {
                        const isChecked = selectedColorNames.includes(col.name);
                        return (
                          <button
                            type="button"
                            key={col.name}
                            onClick={() => {
                              if (isChecked) {
                                setSelectedColorNames(selectedColorNames.filter((c) => c !== col.name));
                              } else {
                                setSelectedColorNames([...selectedColorNames, col.name]);
                              }
                            }}
                            className={`px-3 py-1.5 border font-bold text-xs cursor-pointer flex items-center gap-2 transition-colors ${
                              isChecked ? 'bg-pros-black text-white border-pros-black' : 'bg-white text-black border-neutral-300 hover:border-black'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-full border border-neutral-300 shrink-0" style={{ backgroundColor: col.hex }}></span>
                            <span className="uppercase text-[11px]">{col.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* STEP 3: STOCK & PRIX - LOCKED IF NO PRODUCT SELECTED */}
                <div className={`space-y-4 bg-pros-bone p-5 border border-neutral-200 font-sans transition-opacity ${!selectedProduct ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h3 className="font-bold uppercase text-xs text-pros-gold border-b border-neutral-300 pb-2 flex items-center justify-between">
                    <span>3. STOCK INITIAL & PRIX</span>
                    {!selectedProduct && <Lock size={14} className="text-neutral-400" />}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">Stock initial par déclinaison (par défaut: 0)</label>
                      <input
                        type="number"
                        min="0"
                        value={defaultStock}
                        onChange={(e) => setDefaultStock(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none font-mono font-bold text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">Prix personnalisé FCFA (Optionnel)</label>
                      <input
                        type="number"
                        placeholder={`Prix de base : ${selectedProduct ? formatPrice(selectedProduct.price) : '25 000 FCFA'}`}
                        value={overridePrice}
                        onChange={(e) => setOverridePrice(e.target.value)}
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* STEP 4: PREVIEW MATRIX TABLE & DUPLICATE DETECTION */}
                <div className={`space-y-4 bg-pros-bone p-5 border border-neutral-200 font-sans transition-opacity ${!selectedProduct ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex flex-wrap items-center justify-between border-b border-neutral-300 pb-2">
                    <h3 className="font-bold uppercase text-xs text-pros-gold flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>4. APERÇU DE LA MATRICE DE GÉNÉRATION ({matrixCombinations.length} COMBINAISONS)</span>
                    </h3>
                    <div className="text-xs font-bold text-black font-sans">
                      <span className="text-emerald-700">{newCombinationsCount} NOUVELLE(S)</span>
                      {matrixCombinations.length - newCombinationsCount > 0 && (
                        <span className="text-amber-700 ml-2 font-mono">({matrixCombinations.length - newCombinationsCount} DÉJÀ EXISTANTE(S))</span>
                      )}
                    </div>
                  </div>

                  {matrixCombinations.length === 0 ? (
                    <div className="p-4 bg-white border border-neutral-300 text-center text-neutral-500 text-xs font-sans">
                      Veuillez sélectionner au moins une couleur et une taille pour générer la matrice.
                    </div>
                  ) : (
                    <div className="bg-white border border-neutral-300 max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead className="bg-pros-bone border-b border-neutral-200 text-[10px] font-bold text-black uppercase font-sans">
                          <tr>
                            <th className="p-2">VARIANTE</th>
                            <th className="p-2">SKU PROPOSÉ</th>
                            <th className="p-2">COULEUR</th>
                            <th className="p-2">TAILLE</th>
                            <th className="p-2">PRIX</th>
                            <th className="p-2 text-center">STOCK</th>
                            <th className="p-2 text-right">STATUT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-xs font-sans">
                          {matrixCombinations.map((m, idx) => (
                            <tr key={idx} className={m.isExisting ? 'bg-amber-50/50 opacity-70 font-sans' : 'hover:bg-pros-bone'}>
                              <td className="p-2 font-bold uppercase text-black">
                                {m.color} / {m.size}
                              </td>
                              <td className="p-2 font-mono font-bold text-pros-gold text-[11px]">
                                {m.sku}
                              </td>
                              <td className="p-2 uppercase">{m.color}</td>
                              <td className="p-2 font-mono font-bold">{m.size}</td>
                              <td className="p-2 font-bold">{formatPrice(m.price)}</td>
                              <td className="p-2 text-center font-mono font-bold">{m.stock} pcs</td>
                              <td className="p-2 text-right font-sans">
                                {m.isExisting ? (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-bold uppercase">
                                    DÉJÀ EXISTANTE (IGNORÉE)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold uppercase">
                                    NOUVELLE
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Sticky Footer */}
              <div className="p-6 bg-pros-bone border-t border-neutral-200 flex items-center justify-between shrink-0 font-sans">
                <span className="text-xs text-neutral-500 font-sans">
                  {selectedProduct ? `Produit parent : ${selectedProduct.name}` : 'Aucun produit sélectionné'}
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (generatorProductId && window.confirm('Abandonner la création des variantes ?')) {
                        setIsCreateModalOpen(false);
                      } else {
                        setIsCreateModalOpen(false);
                      }
                    }}
                    className="px-5 py-3 border border-neutral-300 bg-white text-black font-bold hover:bg-neutral-100 uppercase text-xs font-sans cursor-pointer"
                  >
                    ANNULER
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateBulkVariants}
                    disabled={isSubmitting || !selectedProduct || newCombinationsCount === 0}
                    className="px-8 py-3 bg-pros-black text-white font-bold uppercase text-xs hover:bg-neutral-800 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2 font-sans"
                  >
                    {isSubmitting ? (
                      <span>CRÉATION EN COURS...</span>
                    ) : (
                      <span>CRÉER {newCombinationsCount} VARIANTE(S)</span>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Detail Drawer Slide-over */}
        {detailDrawerVariant && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end font-sans">
            <div className="w-full max-w-xl bg-white h-full p-8 space-y-6 overflow-y-auto font-sans text-xs text-black border-l border-neutral-200 shadow-2xl">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                <div>
                  <span className="text-[10px] text-pros-gold font-bold uppercase">FICHE TECHNIQUE VARIANTE</span>
                  <h2 className="font-mono font-bold text-xl uppercase tracking-wider text-black">{detailDrawerVariant.sku}</h2>
                </div>
                <button onClick={() => setDetailDrawerVariant(null)} className="text-black font-bold p-1 cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              {/* Banner Image or Neutral Placeholder */}
              <div className="h-48 bg-pros-black border border-neutral-200 overflow-hidden relative">
                {detailDrawerVariant.image ? (
                  <img src={detailDrawerVariant.image} alt={detailDrawerVariant.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white p-4 space-y-2">
                    <img src="/brand/LOGOPROS.png" alt="PROS" className="h-7 w-auto object-contain opacity-80" />
                    <span className="text-[10px] font-mono text-pros-sand font-bold tracking-widest uppercase">
                      PLACEHOLDER PROS
                    </span>
                  </div>
                )}
                <div className="absolute top-3 right-3">{getStatusBadge(detailDrawerVariant)}</div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-pros-bone p-4 border border-neutral-200 font-sans">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">PRODUIT PARENT</span>
                  <div className="font-bold text-xs uppercase">{detailDrawerVariant.productName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">CODE BARRES</span>
                  <div className="font-mono text-xs font-bold">{detailDrawerVariant.barcode}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">COULEUR & TAILLE</span>
                  <div className="font-bold text-xs uppercase">{detailDrawerVariant.color} / <span className="font-mono">{detailDrawerVariant.size}</span></div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">PRIX DE VENTE</span>
                  <div className="font-bold text-xs">{formatPrice(detailDrawerVariant.price)}</div>
                </div>
              </div>

              {/* Stock Details */}
              <div className="p-4 border border-neutral-200 space-y-2 bg-white font-sans">
                <span className="font-bold uppercase text-black text-xs block border-b border-neutral-200 pb-1">
                  ÉTABLISSEMENT DES STOCKS & UNITÉS
                </span>
                <div className="grid grid-cols-3 gap-2 text-center font-mono py-2">
                  <div className="bg-pros-bone p-2 border border-neutral-200">
                    <span className="text-[9px] text-neutral-500 uppercase font-sans font-bold block">STOCK TOTAL</span>
                    <span className="font-bold text-sm">{detailDrawerVariant.stock}</span>
                  </div>
                  <div className="bg-pros-bone p-2 border border-neutral-200">
                    <span className="text-[9px] text-neutral-500 uppercase font-sans font-bold block">RÉSERVÉ</span>
                    <span className="font-bold text-sm">{detailDrawerVariant.reservedStock}</span>
                  </div>
                  <div className="bg-emerald-50 p-2 border border-emerald-200 text-emerald-900">
                    <span className="text-[9px] uppercase font-sans font-bold block">DISPONIBLE</span>
                    <span className="font-bold text-sm">{detailDrawerVariant.availableStock}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                <button
                  onClick={() => {
                    const target = detailDrawerVariant;
                    setDetailDrawerVariant(null);
                    setStockEditVariant(target);
                    setNewStockValue(target.stock);
                  }}
                  className="px-5 py-2.5 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 cursor-pointer"
                >
                  AJUSTER LE STOCK DE CE SKU
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
