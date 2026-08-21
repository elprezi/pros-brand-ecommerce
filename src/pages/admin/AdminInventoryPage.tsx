import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useStore } from '../../store/storeContext';
import type { Product, ProductSize } from '../../types/ecommerce';
import {
  Search,
  Check,
  X,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight,
  History,
  Boxes,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  sku: string;
  color: string;
  size: ProductSize;
  price: number;
  stockPhysical: number;
  stockReserved: number;
  stockAvailable: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  image: string;
  updatedAt: string;
}

export type MovementType =
  | 'PURCHASE'
  | 'IMPORT'
  | 'SALE'
  | 'ORDER_RESERVATION'
  | 'ORDER_RELEASE'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'LOSS'
  | 'CORRECTION'
  | 'RESTOCK'
  | 'TRANSFER';

export interface InventoryMovement {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  previousStock: number;
  changeText: string;
  newStock: number;
  type: MovementType;
  reason: string;
  note?: string;
  adminName: string;
}

interface ParsedImportRow {
  lineNum: number;
  rawSku: string;
  productName: string;
  variantName: string;
  color: string;
  size: ProductSize;
  productId: string;
  isNewProduct: boolean;
  currentStock: number;
  importedValue: number;
  calculatedNewStock: number;
  action: 'UPDATE' | 'CREATION' | 'ERROR';
  errorMessage?: string;
}

const LOCAL_STORAGE_KEY_THRESHOLD = 'pros_store_v2_stock_threshold';
const LOCAL_STORAGE_KEY_HISTORY = 'pros_store_v2_inventory_history';

export const AdminInventoryPage: React.FC = () => {
  const { products, addProduct, updateProduct, updateStockPerSize, formatPrice } = useStore();
  const navigate = useNavigate();

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Configurable Low Stock Alert Threshold
  const [alertThreshold, setAlertThreshold] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_THRESHOLD);
    return saved ? Number(saved) : 3;
  });
  const [tempThreshold, setTempThreshold] = useState<number>(alertThreshold);
  const [thresholdSavedMsg, setThresholdSavedMsg] = useState(false);

  // Movement History State
  const [movementsHistory, setMovementsHistory] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_HISTORY);
    return saved ? JSON.parse(saved) : [];
  });

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stock-asc' | 'stock-desc' | 'name-asc' | 'name-desc' | 'newest'>('stock-asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Selection & Modal State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);

  // CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1);
  const [importMode, setImportMode] = useState<'REPLACEMENT' | 'ADJUSTMENT'>('REPLACEMENT');
  const [importFileName, setImportFileName] = useState('');
  const [importRawText, setImportRawText] = useState('');
  const [parsedImportRows, setParsedImportRows] = useState<ParsedImportRow[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; errors: number; currentTotalStock: number; newTotalStock: number } | null>(null);

  // Stock Adjustment Form State
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(5);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Réception fournisseur');
  const [adjustmentNote, setAdjustmentNote] = useState<string>('');
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Simulated Load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_HISTORY, JSON.stringify(movementsHistory));
  }, [movementsHistory]);

  const handleRetryLoad = () => {
    setIsLoading(true);
    setIsError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 450);
  };

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertThreshold(tempThreshold);
    localStorage.setItem(LOCAL_STORAGE_KEY_THRESHOLD, tempThreshold.toString());
    setThresholdSavedMsg(true);
    setTimeout(() => setThresholdSavedMsg(false), 3000);
  };

  // Extract all inventory variant items with GUARANTEED UNIQUE SKUs across entire store
  const inventoryItems: InventoryItem[] = useMemo(() => {
    const list: InventoryItem[] = [];
    const seenSkus = new Set<string>();

    products.forEach((p) => {
      const colors = p.colors && p.colors.length > 0 ? p.colors : [{ name: 'Noir', hex: '#0A0A0A', images: [] }];
      const sizes = p.sizes && p.sizes.length > 0 ? p.sizes : (['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ProductSize[]);

      colors.forEach((col) => {
        sizes.forEach((sz) => {
          const stockPhysical = p.stockPerSize?.[sz] ?? 0;
          const stockReserved = 0; // Reserved from active orders
          const stockAvailable = Math.max(0, stockPhysical - stockReserved);

          // Clean unique SKU format: PROS-{SLUG}-{COLOR}-{SIZE}
          const colorCode = col.name.replace(/[^a-z0-9]+/gi, '').toUpperCase().substring(0, 4) || 'BLK';
          const pSlugCode = p.slug.replace(/[^a-z0-9]+/gi, '-').toUpperCase().replace(/-(HOMME|FEMME|ACCESSOIRES)/g, '') || 'PROD';
          
          let baseSku = `PROS-${pSlugCode}-${colorCode}-${sz}`;
          let uniqueSku = baseSku;
          let dupCounter = 1;

          // Guarantee absolute uniqueness - no duplicate SKUs allowed
          while (seenSkus.has(uniqueSku)) {
            dupCounter++;
            uniqueSku = `${baseSku}-${dupCounter}`;
          }
          seenSkus.add(uniqueSku);

          const image = col.images?.[0] || p.colors?.[0]?.images?.[0] || '';

          let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' = 'IN_STOCK';
          if (stockAvailable === 0) {
            status = 'OUT_OF_STOCK';
          } else if (stockAvailable <= alertThreshold) {
            status = 'LOW_STOCK';
          } else if (stockAvailable > 50) {
            status = 'OVERSTOCK';
          }

          list.push({
            id: `${p.id}-${col.name}-${sz}`,
            productId: p.id,
            productName: p.name,
            category: p.category,
            sku: uniqueSku,
            color: col.name,
            size: sz,
            price: p.price,
            stockPhysical,
            stockReserved,
            stockAvailable,
            status,
            image,
            updatedAt: p.updatedAt || new Date().toISOString(),
          });
        });
      });
    });

    return list;
  }, [products, alertThreshold]);

  // Real-time 6 KPI Cards with Internal Cost-Based Stock Valuation
  const stats = useMemo(() => {
    const totalUnits = inventoryItems.reduce((sum, item) => sum + item.stockPhysical, 0);
    const productsInStock = new Set(inventoryItems.filter((i) => i.stockPhysical > 0).map((i) => i.productId)).size;
    const lowStockCount = inventoryItems.filter((i) => i.stockAvailable > 0 && i.stockAvailable <= alertThreshold).length;
    const outOfStockCount = inventoryItems.filter((i) => i.stockAvailable === 0).length;
    const reservedUnits = inventoryItems.reduce((sum, item) => sum + item.stockReserved, 0);

    // Stock Valuation based on internal cost (costPrice) or 45% of retail price
    const inventoryValueFCFA = inventoryItems.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = (prod && (prod as any).internalCost) ? Number((prod as any).internalCost) : Math.round(item.price * 0.45);
      return sum + item.stockAvailable * unitCost;
    }, 0);

    return { totalUnits, productsInStock, lowStockCount, outOfStockCount, reservedUnits, inventoryValueFCFA };
  }, [inventoryItems, alertThreshold, products]);

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    return inventoryItems
      .filter((item) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          item.productName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.color.toLowerCase().includes(query) ||
          item.size.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === 'stock-asc') return a.stockPhysical - b.stockPhysical;
        if (sortBy === 'stock-desc') return b.stockPhysical - a.stockPhysical;
        if (sortBy === 'name-asc') return a.productName.localeCompare(b.productName);
        if (sortBy === 'name-desc') return b.productName.localeCompare(a.productName);
        if (sortBy === 'newest') return b.id.localeCompare(a.id);
        return 0;
      });
  }, [inventoryItems, searchTerm, statusFilter, categoryFilter, sortBy]);

  // Paginated Items
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Open Quick Stock Adjustment Modal
  const handleOpenAdjustModal = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustmentType('ADD');
    setAdjustmentQuantity(5);
    setAdjustmentReason('Réception fournisseur');
    setAdjustmentNote('');
    setShowConfirmStep(false);
  };

  // Calculate new stock during adjustment
  const calculatedNewStock = useMemo(() => {
    if (!adjustingItem) return 0;
    if (adjustmentType === 'ADD') return adjustingItem.stockPhysical + Number(adjustmentQuantity);
    if (adjustmentType === 'REMOVE') return Math.max(0, adjustingItem.stockPhysical - Number(adjustmentQuantity));
    return Math.max(0, Number(adjustmentQuantity));
  }, [adjustingItem, adjustmentType, adjustmentQuantity]);

  // Submit Stock Adjustment with Transactional History Log
  const handleConfirmAdjustment = () => {
    if (!adjustingItem) return;

    const previousStock = adjustingItem.stockPhysical;
    const newStock = calculatedNewStock;
    let changeText = '';
    if (adjustmentType === 'ADD') changeText = `+${adjustmentQuantity}`;
    if (adjustmentType === 'REMOVE') changeText = `-${adjustmentQuantity}`;
    if (adjustmentType === 'SET') changeText = `Set -> ${newStock}`;

    // Update central store state
    updateStockPerSize(adjustingItem.productId, adjustingItem.size, newStock);

    // Create transactional movement log
    const movementRecord: InventoryMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: adjustingItem.productId,
      productName: adjustingItem.productName,
      variantName: `${adjustingItem.color} / ${adjustingItem.size}`,
      sku: adjustingItem.sku,
      previousStock,
      changeText,
      newStock,
      type: adjustmentType === 'ADD' ? 'RESTOCK' : adjustmentType === 'REMOVE' ? 'DAMAGE' : 'CORRECTION',
      reason: adjustmentReason,
      note: adjustmentNote || undefined,
      adminName: 'Admin PROS',
    };

    setMovementsHistory((prev) => [movementRecord, ...prev]);
    setSuccessMsg(`Stock ajusté pour ${adjustingItem.sku} : ${previousStock} -> ${newStock} unités.`);
    setAdjustingItem(null);
    setShowConfirmStep(false);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // CSV Import File Handler & Parser
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportRawText(text);
        parseCSVText(text, importMode);
      }
    };
    reader.readAsText(file);
  };

  // Intelligent CSV Parser & Validation Engine
  const parseCSVText = (rawText: string, mode: 'REPLACEMENT' | 'ADJUSTMENT') => {
    const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setParsedImportRows([]);
      return;
    }

    const rows: ParsedImportRow[] = [];
    let startIdx = 0;

    // Detect header row
    const firstLineLower = lines[0].toLowerCase();
    if (firstLineLower.includes('sku') || firstLineLower.includes('produit')) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const lineNum = i + 1;
      const rawLine = lines[i];
      const cols = rawLine.split(/[;,]/).map((c) => c.replace(/^"|"$/g, '').trim());

      if (cols.length < 2) {
        rows.push({
          lineNum,
          rawSku: cols[0] || '—',
          productName: '—',
          variantName: '—',
          color: '—',
          size: 'M',
          productId: '',
          isNewProduct: false,
          currentStock: 0,
          importedValue: 0,
          calculatedNewStock: 0,
          action: 'ERROR',
          errorMessage: 'Format de ligne invalide (au moins 2 colonnes requises : SKU;Stock)',
        });
        continue;
      }

      const skuInput = cols[0];
      const stockInputVal = Number(cols[cols.length - 1]);

      if (isNaN(stockInputVal)) {
        rows.push({
          lineNum,
          rawSku: skuInput,
          productName: '—',
          variantName: '—',
          color: '—',
          size: 'M',
          productId: '',
          isNewProduct: false,
          currentStock: 0,
          importedValue: 0,
          calculatedNewStock: 0,
          action: 'ERROR',
          errorMessage: `Valeur de stock non numérique ("${cols[cols.length - 1]}")`,
        });
        continue;
      }

      // 1. Try matching an existing inventory item by SKU or Product Name + Size
      const matchedItem = inventoryItems.find(
        (inv) =>
          inv.sku.toLowerCase() === skuInput.toLowerCase() ||
          (cols[1] && inv.productName.toLowerCase() === cols[1].toLowerCase() && inv.size === (cols[3] || 'M'))
      );

      if (matchedItem) {
        const calculatedNewStock = mode === 'REPLACEMENT'
          ? Math.max(0, stockInputVal)
          : Math.max(0, matchedItem.stockPhysical + stockInputVal);

        rows.push({
          lineNum,
          rawSku: matchedItem.sku,
          productName: matchedItem.productName,
          variantName: `${matchedItem.color} / ${matchedItem.size}`,
          color: matchedItem.color,
          size: matchedItem.size,
          productId: matchedItem.productId,
          isNewProduct: false,
          currentStock: matchedItem.stockPhysical,
          importedValue: stockInputVal,
          calculatedNewStock,
          action: 'UPDATE',
        });
        continue;
      }

      // 2. Try matching an existing product in products catalog
      const matchedProduct = products.find(
        (p) =>
          (cols[1] && p.name.toLowerCase() === cols[1].toLowerCase()) ||
          skuInput.toLowerCase().includes(p.slug.toLowerCase())
      );

      const parsedProductName = cols[1] || matchedProduct?.name || 'Produit PROS';
      const parsedColor = cols[2] || 'Noir';
      const parsedSize = (cols[3] as ProductSize) || 'M';

      if (matchedProduct) {
        const currentStock = matchedProduct.stockPerSize?.[parsedSize] ?? 0;
        const calculatedNewStock = mode === 'REPLACEMENT'
          ? Math.max(0, stockInputVal)
          : Math.max(0, currentStock + stockInputVal);

        rows.push({
          lineNum,
          rawSku: skuInput,
          productName: matchedProduct.name,
          variantName: `${parsedColor} / ${parsedSize}`,
          color: parsedColor,
          size: parsedSize,
          productId: matchedProduct.id,
          isNewProduct: false,
          currentStock,
          importedValue: stockInputVal,
          calculatedNewStock,
          action: 'UPDATE',
        });
        continue;
      }

      // 3. New Product & Variant Creation (e.g. sample CSV file lines)
      const calculatedNewStock = Math.max(0, stockInputVal);

      rows.push({
        lineNum,
        rawSku: skuInput,
        productName: parsedProductName,
        variantName: `${parsedColor} / ${parsedSize}`,
        color: parsedColor,
        size: parsedSize,
        productId: `prod-csv-${Date.now()}-${lineNum}`,
        isNewProduct: true,
        currentStock: 0,
        importedValue: stockInputVal,
        calculatedNewStock,
        action: 'CREATION',
      });
    }

    setParsedImportRows(rows);
    const validCount = rows.filter((r) => r.action === 'UPDATE' || r.action === 'CREATION').length;
    const errorCount = rows.filter((r) => r.action === 'ERROR').length;
    const currentTotalStock = rows.reduce((s, r) => s + r.currentStock, 0);
    const newTotalStock = rows.reduce((s, r) => s + (r.action === 'ERROR' ? r.currentStock : r.calculatedNewStock), 0);

    setImportSummary({ total: rows.length, valid: validCount, errors: errorCount, currentTotalStock, newTotalStock });
    setImportStep(2);
  };

  // Re-calculate preview when mode changes
  const handleModeChange = (newMode: 'REPLACEMENT' | 'ADJUSTMENT') => {
    setImportMode(newMode);
    if (importRawText) {
      parseCSVText(importRawText, newMode);
    }
  };

  // Transactional Bulk Execution of CSV Import
  const handleExecuteImport = () => {
    const validRows = parsedImportRows.filter((r) => r.action === 'UPDATE' || r.action === 'CREATION');
    if (validRows.length === 0) return;

    const newMovements: InventoryMovement[] = [];

    validRows.forEach((r) => {
      if (r.isNewProduct) {
        // Check if product was already created in this import batch
        const existingProduct = products.find(
          (p) => p.name.toLowerCase() === r.productName.toLowerCase() || p.id === r.productId
        );

        if (existingProduct) {
          const updatedSizes = Array.from(new Set([...existingProduct.sizes, r.size]));
          const updatedColors = [...(existingProduct.colors || [])];
          if (!updatedColors.some((c) => c.name.toLowerCase() === r.color.toLowerCase())) {
            updatedColors.push({ name: r.color, hex: '#0A0A0A', images: [] });
          }
          const updatedStockPerSize = { ...existingProduct.stockPerSize, [r.size]: r.calculatedNewStock };
          updateProduct({
            ...existingProduct,
            colors: updatedColors,
            sizes: updatedSizes,
            stockPerSize: updatedStockPerSize,
            updatedAt: new Date().toISOString(),
          });
        } else {
          const newProd: Product = {
            id: r.productId,
            slug: r.productName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: r.productName,
            category: 'homme',
            subCategory: 'hoodie',
            price: 25000,
            description: `Produit créé automatiquement via l'importation de stock CSV PROS.`,
            shortDescription: `Création automatique via import CSV.`,
            material: 'Coton 100%',
            care: 'Lavage à froid',
            fit: 'Coupe Regular',
            colors: [{ name: r.color, hex: '#0A0A0A', images: [] }],
            sizes: [r.size],
            stockPerSize: { [r.size]: r.calculatedNewStock } as Record<ProductSize, number>,
            rating: 5,
            reviewsCount: 0,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          addProduct(newProd);
        }
      } else {
        updateStockPerSize(r.productId, r.size, r.calculatedNewStock);
      }

      const changeText = importMode === 'REPLACEMENT'
        ? `Remplace -> ${r.calculatedNewStock}`
        : `${r.importedValue >= 0 ? '+' : ''}${r.importedValue}`;

      newMovements.push({
        id: `mov-imp-${Date.now()}-${r.lineNum}`,
        timestamp: new Date().toISOString(),
        productId: r.productId,
        productName: r.productName,
        variantName: r.variantName,
        sku: r.rawSku,
        previousStock: r.currentStock,
        changeText,
        newStock: r.calculatedNewStock,
        type: 'IMPORT',
        reason: `Import CSV (${importFileName || 'stock.csv'}) - Mode ${importMode}`,
        adminName: 'Admin PROS',
      });
    });

    setMovementsHistory((prev) => [...newMovements, ...prev]);
    setSuccessMsg(`Importation réussie : ${validRows.length} variante(s) traitée(s) et mise(s) à jour.`);
    setIsImportModalOpen(false);
    setImportStep(1);
    setImportFileName('');
    setImportRawText('');
    setParsedImportRows([]);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Bulk Export CSV (UTF-8 BOM ; delimiter for French Excel)
  const handleExportCSV = () => {
    const targetItems = selectedItemIds.length > 0
      ? inventoryItems.filter((i) => selectedItemIds.includes(i.id))
      : filteredItems;

    if (targetItems.length === 0) return;

    const BOM = '\uFEFF';
    const headers = [
      'SKU',
      'Produit',
      'Catégorie',
      'Collection',
      'Couleur',
      'Taille',
      'Stock physique',
      'Stock réservé',
      'Stock disponible',
      'Seuil',
      'Statut',
      'Coût',
      'Valeur stock FCFA'
    ];

    const rows = targetItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = (prod && (prod as any).internalCost) ? Number((prod as any).internalCost) : Math.round(item.price * 0.45);
      const stockVal = item.stockAvailable * unitCost;

      return [
        `"${item.sku}"`,
        `"${item.productName.replace(/"/g, '""')}"`,
        `"${item.category.toUpperCase()}"`,
        `"${(prod?.collection || 'SIGNATURE').toUpperCase()}"`,
        `"${item.color}"`,
        `"${item.size}"`,
        `"${item.stockPhysical}"`,
        `"${item.stockReserved}"`,
        `"${item.stockAvailable}"`,
        `"${alertThreshold}"`,
        `"${item.status}"`,
        `"${unitCost}"`,
        `"${stockVal}"`,
      ].join(';');
    });

    const csvContent = BOM + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pros_inventaire_stock_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample CSV Template pre-filled with real catalog SKUs
  const handleDownloadSampleCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['SKU', 'Produit', 'Couleur', 'Taille', 'Stock'];

    let rows: string[] = [];
    if (inventoryItems.length > 0) {
      rows = inventoryItems.slice(0, 15).map((item) => {
        return [
          `"${item.sku}"`,
          `"${item.productName.replace(/"/g, '""')}"`,
          `"${item.color}"`,
          `"${item.size}"`,
          `"${item.stockPhysical}"`,
        ].join(';');
      });
    } else {
      rows = [
        'PROS-HOODIE-NOIR-M;HOODIE OVERSIZE PROS;Noir;M;25',
        'PROS-HOODIE-NOIR-L;HOODIE OVERSIZE PROS;Noir;L;18',
        'PROS-HOODIE-BLANC-M;HOODIE OVERSIZE PROS;Blanc;M;12',
        'PROS-SWEAT-GRIS-L;SWEATSHIRT COL ROND PROS;Gris;L;30',
      ];
    }

    const csvContent = BOM + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `modele_import_stock_pros.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (item: InventoryItem) => {
    if (item.status === 'OUT_OF_STOCK') {
      return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase font-sans">RUPTURE</span>;
    }
    if (item.status === 'LOW_STOCK') {
      return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase font-sans">STOCK FAIBLE</span>;
    }
    if (item.status === 'OVERSTOCK') {
      return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-300 uppercase font-sans">SURSTOCK</span>;
    }
    return <span className="px-2.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase font-sans">EN STOCK</span>;
  };

  // Render Error State
  if (isError) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto py-16 text-center space-y-4 font-sans text-pros-black">
          <AlertTriangle className="mx-auto text-red-600" size={48} />
          <h2 className="font-display font-bold text-xl uppercase">IMPOSSIBLE DE CHARGER L'INVENTAIRE</h2>
          <p className="text-xs text-neutral-600">Une erreur s'est produite lors du chargement des données de stock.</p>
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
          title="GESTION ET ALERTES DE STOCK"
          description="Centralisez votre inventaire PROS, contrôlez les niveaux de stock et synchronisez automatiquement votre catalogue."
          primaryAction={
            <div className="flex flex-wrap items-center gap-3 font-sans">
              <button
                onClick={() => {
                  setImportStep(1);
                  setIsImportModalOpen(true);
                }}
                className="px-4 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-md font-sans"
              >
                <Upload size={14} />
                <span>IMPORTER LE STOCK (CSV)</span>
              </button>
              <button
                onClick={handleRetryLoad}
                className="px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer font-sans"
              >
                <RefreshCw size={14} />
                <span>ACTUALISER</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer font-sans"
              >
                <Download size={14} />
                <span>EXPORTER</span>
              </button>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-4 py-2.5 bg-pros-gold hover:bg-amber-600 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer font-sans"
              >
                <History size={14} />
                <span>HISTORIQUE ({movementsHistory.length})</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 font-sans">
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider">STOCK TOTAL</span>
            <div className="text-2xl font-bold text-black">{isLoading ? '...' : `${stats.totalUnits} pcs`}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider">PRODUITS EN STOCK</span>
            <div className="text-2xl font-bold text-emerald-700">{isLoading ? '...' : `${stats.productsInStock} prods`}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[9px] text-amber-600 uppercase font-bold tracking-wider">STOCK FAIBLE</span>
            <div className="text-2xl font-bold text-amber-700">{isLoading ? '...' : `${stats.lowStockCount} vars`}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[9px] text-red-600 uppercase font-bold tracking-wider">RUPTURES</span>
            <div className="text-2xl font-bold text-red-700">{isLoading ? '...' : `${stats.outOfStockCount} vars`}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[9px] text-blue-600 uppercase font-bold tracking-wider">STOCK RÉSERVÉ</span>
            <div className="text-2xl font-bold text-blue-700">{isLoading ? '...' : `${stats.reservedUnits} pcs`}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[9px] text-pros-gold uppercase font-bold tracking-wider">VALEUR DU STOCK (COÛT)</span>
            <div className="text-lg font-bold text-pros-gold">{isLoading ? '...' : formatPrice(stats.inventoryValueFCFA)}</div>
          </div>
        </div>

        {/* Configurable Low Stock Alert Threshold Banner */}
        <div className="p-4 bg-pros-bone border border-neutral-300 flex flex-wrap items-center justify-between gap-4 font-sans shadow-sm">
          <div className="flex items-center gap-3 text-black">
            <div className="p-2 bg-amber-100 text-amber-800 border border-amber-300">
              <AlertTriangle size={18} />
            </div>
            <div>
              <span className="font-bold uppercase text-xs text-black block">SEUIL D'ALERTE DE STOCK FAIBLE</span>
              <span className="text-[11px] text-neutral-600 font-sans">
                Les pièces ayant un stock égal ou inférieur à <strong className="text-black font-mono">{alertThreshold} unités</strong> déclenchent une alerte prioritaire.
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveThreshold} className="flex items-center gap-2 font-sans">
            <label className="text-xs font-bold text-neutral-700 uppercase">Seuil :</label>
            <input
              type="number"
              min="1"
              max="50"
              value={tempThreshold}
              onChange={(e) => setTempThreshold(Number(e.target.value))}
              className="w-16 bg-white border border-neutral-300 px-2 py-1 text-center font-mono font-bold text-xs focus:outline-none focus:border-black"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 cursor-pointer shadow-sm font-sans"
            >
              ENREGISTRER
            </button>
            {thresholdSavedMsg && (
              <span className="text-[10px] text-emerald-700 font-bold font-mono">ENREGISTRÉ !</span>
            )}
          </form>
        </div>

        {/* Toolbar & Multi-Filters */}
        <div className="bg-pros-bone border border-neutral-200 p-4 space-y-4 shadow-sm font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
            
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher un produit, SKU, variante, couleur..."
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
              <option value="all">STATUT STOCK : TOUS</option>
              <option value="IN_STOCK">EN STOCK (&gt; {alertThreshold})</option>
              <option value="LOW_STOCK">STOCK FAIBLE (1 - {alertThreshold})</option>
              <option value="OUT_OF_STOCK">RUPTURE (0)</option>
              <option value="OVERSTOCK">SURSTOCK (&gt; 50)</option>
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

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="stock-asc">STOCK CROISSANT</option>
              <option value="stock-desc">STOCK DÉCROISSANT</option>
              <option value="name-asc">NOM A-Z</option>
              <option value="name-desc">NOM Z-A</option>
              <option value="newest">PLUS RÉCENT</option>
            </select>

          </div>

          {/* Bulk Selection Actions Bar */}
          {selectedItemIds.length > 0 && (
            <div className="p-3 bg-pros-black text-white text-xs flex flex-wrap items-center justify-between gap-3 animate-fade-in font-sans">
              <span className="font-bold">
                {selectedItemIds.length} DÉCLINAISON(S) SÉLECTIONNÉE(S) :
              </span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1 bg-pros-gold hover:bg-amber-600 text-black font-bold text-[10px] uppercase font-sans flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} />
                  <span>EXPORTER CSV</span>
                </button>
                <button
                  onClick={() => setSelectedItemIds([])}
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
        ) : products.length === 0 ? (
          /* Official Empty State when products.length === 0 */
          <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm font-sans">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-pros-bone border border-neutral-300 flex items-center justify-center mx-auto text-black">
                <Package size={32} />
              </div>
              <h3 className="font-display font-bold text-xl uppercase text-black">AUCUN INVENTAIRE</h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                Créez votre premier produit pour commencer à gérer votre stock.
              </p>
              <div className="flex justify-center gap-3 pt-2 font-sans">
                <button
                  onClick={() => navigate('/admin/products')}
                  className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 cursor-pointer shadow-md font-sans"
                >
                  + CRÉER UN PRODUIT
                </button>
                <button
                  onClick={() => navigate('/admin/variants')}
                  className="px-5 py-3 border border-neutral-300 bg-white text-black font-bold text-xs uppercase hover:bg-neutral-100 cursor-pointer font-sans"
                >
                  VOIR LES VARIANTES
                </button>
              </div>
            </div>
          </div>
        ) : inventoryItems.length === 0 ? (
          /* Empty state when products exist but no variants */
          <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm font-sans">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-pros-bone border border-neutral-300 flex items-center justify-center mx-auto text-black">
                <Boxes size={32} />
              </div>
              <h3 className="font-display font-bold text-xl uppercase text-black">AUCUNE VARIANTE</h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                Les produits possédant des variantes apparaîtront ici.
              </p>
              <button
                onClick={() => navigate('/admin/variants')}
                className="px-6 py-3 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800 cursor-pointer shadow-md font-sans"
              >
                CRÉER DES VARIANTES
              </button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-16 text-center shadow-sm font-sans">
            <div className="max-w-sm mx-auto space-y-3">
              <Search className="mx-auto text-neutral-400" size={36} />
              <h3 className="font-display font-bold text-sm uppercase text-black">AUCUN ARTICLE TROUVÉ</h3>
              <p className="text-xs text-neutral-500">Aucun article ne correspond à vos critères de recherche.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
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
                        checked={selectedItemIds.length === paginatedItems.length && paginatedItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItemIds(paginatedItems.map((i) => i.id));
                          } else {
                            setSelectedItemIds([]);
                          }
                        }}
                        className="accent-pros-black cursor-pointer"
                      />
                    </th>
                    <th className="p-3">VISUEL</th>
                    <th className="p-3">PRODUIT</th>
                    <th className="p-3">VARIANTE</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3 text-center">STOCK PHYSIQUE</th>
                    <th className="p-3 text-center">RÉSERVÉ</th>
                    <th className="p-3 text-center">DISPONIBLE</th>
                    <th className="p-3 text-center">STATUT</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs font-sans">
                  {paginatedItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);

                    return (
                      <tr key={item.id} className={`hover:bg-pros-bone transition-colors font-sans ${isSelected ? 'bg-pros-bone/80' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedItemIds(selectedItemIds.filter((id) => id !== item.id));
                              } else {
                                setSelectedItemIds([...selectedItemIds, item.id]);
                              }
                            }}
                            className="accent-pros-black cursor-pointer"
                          />
                        </td>

                        {/* Visuel */}
                        <td className="p-3">
                          <div className="w-10 h-12 bg-pros-black overflow-hidden border border-neutral-200 shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white">
                                <img src="/brand/LOGOPROS.png" alt="PROS" className="h-3 w-auto opacity-70" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Produit */}
                        <td className="p-3">
                          <div className="font-bold text-black uppercase font-sans">{item.productName}</div>
                          <span className="text-[9px] font-mono text-neutral-500 uppercase">{item.category}</span>
                        </td>

                        {/* Variante (COLOR / SIZE) */}
                        <td className="p-3">
                          <div className="font-bold text-black uppercase">{item.color} / <span className="font-mono">{item.size}</span></div>
                        </td>

                        {/* SKU Unique */}
                        <td className="p-3 font-mono font-bold text-pros-gold text-[11px]">
                          {item.sku}
                        </td>

                        {/* Stock Physique */}
                        <td className="p-3 text-center font-mono font-bold text-sm text-black">
                          {item.stockPhysical} pcs
                        </td>

                        {/* Stock Réservé */}
                        <td className="p-3 text-center font-mono text-neutral-500">
                          {item.stockReserved} pcs
                        </td>

                        {/* Stock Disponible */}
                        <td className="p-3 text-center font-mono font-bold text-sm text-emerald-700">
                          {item.stockAvailable} pcs
                        </td>

                        {/* Statut Badge */}
                        <td className="p-3 text-center font-sans">
                          {getStatusBadge(item)}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right font-sans">
                          <button
                            onClick={() => handleOpenAdjustModal(item)}
                            className="px-3 py-1.5 bg-pros-black text-white hover:bg-neutral-800 font-bold text-[10px] uppercase cursor-pointer shadow-sm"
                          >
                            AJUSTER LE STOCK
                          </button>
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
                    <option value={20}>20 par page</option>
                    <option value={50}>50 par page</option>
                    <option value={100}>100 par page</option>
                  </select>
                  <span className="text-neutral-500 text-[10px] uppercase font-mono ml-2">
                    {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredItems.length)} sur {filteredItems.length} variantes
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

        {/* Stock CSV Import Modal (`IMPORTER LE STOCK`) */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden font-sans">
              
              {/* Sticky Header */}
              <div className="p-6 bg-white border-b border-neutral-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-pros-bone border border-neutral-300">
                    <FileSpreadsheet className="text-black" size={24} />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl uppercase tracking-wider text-black">
                      IMPORTER LE STOCK (CSV)
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans">
                      Mettez à jour le stock en masse via fichier CSV avec validation et aperçu des mouvements.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-neutral-500 hover:text-black p-2 border border-neutral-200 hover:border-black cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
                
                {importStep === 1 ? (
                  /* STEP 1: FILE UPLOAD & MODE CHOICE */
                  <div className="space-y-6 font-sans">
                    
                    {/* SAMPLE TEMPLATE DOWNLOAD BOX */}
                    <div className="p-4 bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-4 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-200 text-amber-900 border border-amber-400">
                          <Download size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs uppercase text-amber-950">MODÈLE CSV OFFICIEL CONFORME</h4>
                          <p className="text-[11px] text-amber-900 mt-0.5">
                            Téléchargez notre fichier modèle pré-rempli avec vos SKUs exacts. Modifiez uniquement les quantités sous la colonne <strong className="font-mono">Stock</strong> pour garantir un import à 100% sans erreur.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadSampleCSV}
                        className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs uppercase flex items-center gap-2 shadow-sm cursor-pointer shrink-0 font-sans"
                      >
                        <Download size={14} />
                        <span>TÉLÉCHARGER LE MODÈLE (.CSV)</span>
                      </button>
                    </div>

                    <div className="p-6 border-2 border-dashed border-neutral-300 bg-pros-bone text-center space-y-4">
                      <Upload className="mx-auto text-neutral-400" size={40} />
                      <div>
                        <h4 className="font-bold text-sm uppercase text-black">CHOISIR UN FICHIER CSV</h4>
                        <p className="text-xs text-neutral-500 mt-1 font-sans">
                          Format accepté: <span className="font-mono text-black font-bold">SKU;Produit;Couleur;Taille;Stock</span> ou <span className="font-mono text-black font-bold">SKU;Stock</span>
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileSelected}
                        className="block mx-auto text-xs text-neutral-600 file:mr-4 file:py-2 file:px-4 file:border file:border-neutral-300 file:text-xs file:font-bold file:bg-white file:text-black hover:file:bg-neutral-100 cursor-pointer"
                      />
                    </div>

                    {/* Mode Choice */}
                    <div className="p-4 bg-white border border-neutral-300 space-y-3">
                      <label className="font-bold uppercase text-xs text-black block">MODE D'IMPORTATION DE STOCK :</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                        <label
                          onClick={() => handleModeChange('REPLACEMENT')}
                          className={`p-4 border cursor-pointer flex items-start gap-3 transition-colors ${
                            importMode === 'REPLACEMENT' ? 'bg-pros-bone border-pros-black text-black' : 'bg-white border-neutral-200 text-neutral-600'
                          }`}
                        >
                          <input type="radio" name="importMode" checked={importMode === 'REPLACEMENT'} readOnly className="mt-0.5 accent-pros-black" />
                          <div>
                            <span className="font-bold uppercase block text-black">MODE REMPLACEMENT</span>
                            <span className="text-[11px] text-neutral-500">Le stock physique devient exactement la valeur importée du fichier CSV.</span>
                          </div>
                        </label>

                        <label
                          onClick={() => handleModeChange('ADJUSTMENT')}
                          className={`p-4 border cursor-pointer flex items-start gap-3 transition-colors ${
                            importMode === 'ADJUSTMENT' ? 'bg-pros-bone border-pros-black text-black' : 'bg-white border-neutral-200 text-neutral-600'
                          }`}
                        >
                          <input type="radio" name="importMode" checked={importMode === 'ADJUSTMENT'} readOnly className="mt-0.5 accent-pros-black" />
                          <div>
                            <span className="font-bold uppercase block text-black">MODE AJUSTEMENT</span>
                            <span className="text-[11px] text-neutral-500">La valeur importée s'ajoute ou se retranche au stock physique existant.</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STEP 2: PREVIEW MATRIX TABLE & VALIDATION */
                  <div className="space-y-4 font-sans">
                    {/* Summary Badge */}
                    {importSummary && (
                      <div className="p-4 bg-pros-bone border border-neutral-300 space-y-3 font-sans">
                        <div className="flex flex-wrap items-center justify-between gap-4 font-sans">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet size={20} className="text-black" />
                            <span className="font-bold uppercase text-xs text-black">
                              Fichier : <span className="font-mono text-pros-gold">{importFileName}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold font-sans">
                            <span className="px-2.5 py-1 bg-white border border-neutral-300">Total : {importSummary.total} lignes</span>
                            <span className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800">Valides : {importSummary.valid}</span>
                            {importSummary.errors > 0 && (
                              <span className="px-2.5 py-1 bg-red-100 border border-red-300 text-red-800">Erreurs : {importSummary.errors}</span>
                            )}
                          </div>
                        </div>

                        {/* Detailed Stock Impact Summary Box */}
                        <div className="p-3 bg-white border border-neutral-200 grid grid-cols-3 gap-3 text-center text-xs font-sans">
                          <div>
                            <span className="text-[9px] text-neutral-500 font-bold uppercase block">STOCK ACTUEL CONCERNÉ</span>
                            <strong className="font-mono text-black font-bold text-sm">{importSummary.currentTotalStock} pcs</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-500 font-bold uppercase block">STOCK APRÈS IMPORT</span>
                            <strong className="font-mono text-emerald-700 font-bold text-sm">{importSummary.newTotalStock} pcs</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-500 font-bold uppercase block">VARIATION DE STOCK</span>
                            <strong className={`font-mono font-bold text-sm ${importSummary.newTotalStock >= importSummary.currentTotalStock ? 'text-emerald-800' : 'text-red-700'}`}>
                              {importSummary.newTotalStock - importSummary.currentTotalStock >= 0 ? '+' : ''}
                              {importSummary.newTotalStock - importSummary.currentTotalStock} pcs
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mode Toggle Bar */}
                    <div className="flex items-center justify-between p-3 bg-white border border-neutral-200 text-xs">
                      <span className="font-bold uppercase text-neutral-600">Mode sélectionné : <strong className="text-black">{importMode === 'REPLACEMENT' ? 'REPLACEMENT (Valeur fixe)' : 'AJUSTEMENT (Variation)'}</strong></span>
                      <div className="flex gap-2 font-sans">
                        <button
                          type="button"
                          onClick={() => handleModeChange('REPLACEMENT')}
                          className={`px-3 py-1 text-[10px] font-bold uppercase border ${importMode === 'REPLACEMENT' ? 'bg-pros-black text-white' : 'bg-white text-black'}`}
                        >
                          Remplacement
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModeChange('ADJUSTMENT')}
                          className={`px-3 py-1 text-[10px] font-bold uppercase border ${importMode === 'ADJUSTMENT' ? 'bg-pros-black text-white' : 'bg-white text-black'}`}
                        >
                          Ajustement
                        </button>
                      </div>
                    </div>

                    {/* Live Preview Table */}
                    <div className="bg-white border border-neutral-300 max-h-72 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead className="bg-pros-bone border-b border-neutral-200 text-[10px] font-bold text-black uppercase font-sans">
                          <tr>
                            <th className="p-2 w-12 text-center">LIGNE</th>
                            <th className="p-2">SKU</th>
                            <th className="p-2">PRODUIT & VARIANTE</th>
                            <th className="p-2 text-center">STOCK ACTUEL</th>
                            <th className="p-2 text-center">VALEUR CSV</th>
                            <th className="p-2 text-center">NOUVEAU STOCK</th>
                            <th className="p-2 text-right">ACTION / RÉSULTAT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-xs font-sans">
                          {parsedImportRows.map((row) => (
                            <tr key={row.lineNum} className={row.action === 'ERROR' ? 'bg-red-50/70' : 'hover:bg-pros-bone'}>
                              <td className="p-2 text-center font-mono text-neutral-500">{row.lineNum}</td>
                              <td className="p-2 font-mono font-bold text-pros-gold text-[11px]">{row.rawSku}</td>
                              <td className="p-2">
                                <div className="font-bold text-black uppercase">{row.productName}</div>
                                <div className="text-[10px] text-neutral-500">{row.variantName}</div>
                              </td>
                              <td className="p-2 text-center font-mono font-bold text-neutral-600">{row.currentStock}</td>
                              <td className="p-2 text-center font-mono font-bold text-black">
                                {importMode === 'ADJUSTMENT' && row.importedValue >= 0 ? `+${row.importedValue}` : row.importedValue}
                              </td>
                              <td className="p-2 text-center font-mono font-bold text-emerald-800 text-sm">
                                {row.action === 'ERROR' ? '—' : row.calculatedNewStock}
                              </td>
                              <td className="p-2 text-right font-sans">
                                {row.action === 'UPDATE' ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold uppercase inline-flex items-center gap-1">
                                    <CheckCircle2 size={10} /> MISE À JOUR
                                  </span>
                                ) : row.action === 'CREATION' ? (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 text-[9px] font-bold uppercase inline-flex items-center gap-1">
                                    <CheckCircle2 size={10} /> CRÉATION
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 text-[9px] font-bold uppercase inline-flex items-center gap-1" title={row.errorMessage}>
                                    <XCircle size={10} /> ERREUR
                                  </span>
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

              {/* Sticky Footer */}
              <div className="p-6 bg-pros-bone border-t border-neutral-200 flex items-center justify-between shrink-0 font-sans">
                <span className="text-xs text-neutral-500 font-sans">
                  {importStep === 2 && importSummary ? `${importSummary.valid} variante(s) prête(s) à être mise(s) à jour` : 'Sélectionnez un fichier CSV'}
                </span>
                <div className="flex gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-5 py-3 border border-neutral-300 bg-white text-black font-bold hover:bg-neutral-100 uppercase text-xs font-sans cursor-pointer"
                  >
                    ANNULER
                  </button>

                  {importStep === 2 && (
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={!importSummary || importSummary.valid === 0}
                      className="px-8 py-3 bg-pros-black text-white font-bold uppercase text-xs hover:bg-neutral-800 transition-colors shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2 font-sans"
                    >
                      <span>CONFIRMER L'IMPORTATION ({importSummary?.valid || 0})</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Stock Quick Adjustment Modal (`AJUSTER LE STOCK`) */}
        {adjustingItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 p-8 max-w-lg w-full space-y-6 text-black font-sans shadow-2xl">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="font-display font-bold text-base uppercase text-black">
                  {showConfirmStep ? "CONFIRMER L'AJUSTEMENT" : "AJUSTER LE STOCK"}
                </h3>
                <button onClick={() => setAdjustingItem(null)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              {/* Product Info Header */}
              <div className="p-4 bg-pros-bone border border-neutral-200 space-y-1 font-sans">
                <div className="font-bold text-black text-xs uppercase">{adjustingItem.productName}</div>
                <div className="text-xs text-neutral-600 font-sans">
                  Déclinaison : <span className="font-bold uppercase text-black">{adjustingItem.color}</span> / <span className="font-mono font-bold text-black">{adjustingItem.size}</span>
                </div>
                <div className="text-xs font-mono text-pros-gold font-bold">
                  SKU: {adjustingItem.sku}
                </div>
                <div className="text-[11px] text-neutral-500 pt-1">
                  Stock physique actuel : <strong className="text-black font-mono text-sm">{adjustingItem.stockPhysical} unités</strong>
                </div>
              </div>

              {!showConfirmStep ? (
                /* STEP 1: FORM */
                <div className="space-y-4 text-xs font-sans">
                  {/* Type selector */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-black block">TYPE D'AJUSTEMENT</label>
                    <div className="grid grid-cols-3 gap-2 font-sans">
                      <button
                        type="button"
                        onClick={() => setAdjustmentType('ADD')}
                        className={`p-2 border text-center font-bold uppercase cursor-pointer ${
                          adjustmentType === 'ADD' ? 'bg-pros-black text-white border-pros-black' : 'bg-white text-black border-neutral-300'
                        }`}
                      >
                        (+) AJOUTER
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustmentType('REMOVE')}
                        className={`p-2 border text-center font-bold uppercase cursor-pointer ${
                          adjustmentType === 'REMOVE' ? 'bg-pros-black text-white border-pros-black' : 'bg-white text-black border-neutral-300'
                        }`}
                      >
                        (-) RETIRER
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustmentType('SET')}
                        className={`p-2 border text-center font-bold uppercase cursor-pointer ${
                          adjustmentType === 'SET' ? 'bg-pros-black text-white border-pros-black' : 'bg-white text-black border-neutral-300'
                        }`}
                      >
                        (=) DÉFINIR
                      </button>
                    </div>
                  </div>

                  {/* Quantity input */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-black block">QUANTITÉ DE MODIFICATION</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={adjustmentQuantity}
                      onChange={(e) => setAdjustmentQuantity(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black focus:outline-none font-mono font-bold text-base"
                    />
                  </div>

                  {/* Calculated Result */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex justify-between items-center font-sans">
                    <span className="font-bold uppercase">NOUVEAU STOCK CALCULÉ :</span>
                    <span className="font-mono text-base font-bold">{calculatedNewStock} pièces</span>
                  </div>

                  {/* Reason select */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-black block">MOTIF DE L'AJUSTEMENT *</label>
                    <select
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black focus:outline-none uppercase font-sans font-bold"
                    >
                      <option value="Réception fournisseur">Réception marchandise</option>
                      <option value="Inventaire">Inventaire</option>
                      <option value="Correction">Correction</option>
                      <option value="Retour client">Retour client</option>
                      <option value="Produit endommagé">Produit endommagé</option>
                      <option value="Perte">Perte</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  {/* Note */}
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-black block">NOTE / COMMENTAIRE (OPTIONNEL)</label>
                    <textarea
                      rows={2}
                      placeholder="Précisions sur l'opération de stock..."
                      value={adjustmentNote}
                      onChange={(e) => setAdjustmentNote(e.target.value)}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black focus:outline-none font-sans"
                    />
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                    <button
                      type="button"
                      onClick={() => setAdjustingItem(null)}
                      className="px-4 py-2 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                    >
                      ANNULER
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmStep(true)}
                      className="px-6 py-2 bg-pros-black text-white font-bold uppercase text-xs hover:bg-neutral-800 shadow-md cursor-pointer"
                    >
                      CONTINUER
                    </button>
                  </div>
                </div>
              ) : (
                /* STEP 2: CONFIRMATION MODAL */
                <div className="space-y-4 text-xs font-sans">
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 space-y-2 font-sans">
                    <span className="font-bold uppercase text-xs block text-black">Vérification de l'opération :</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Stock actuel : <strong className="font-mono">{adjustingItem.stockPhysical}</strong></div>
                      <div>Opération : <strong className="font-mono">{adjustmentType === 'ADD' ? `+${adjustmentQuantity}` : adjustmentType === 'REMOVE' ? `-${adjustmentQuantity}` : `Set -> ${calculatedNewStock}`}</strong></div>
                      <div>Nouveau stock : <strong className="font-mono text-emerald-800 text-sm">{calculatedNewStock}</strong></div>
                      <div>Motif : <strong>{adjustmentReason}</strong></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                    <button
                      type="button"
                      onClick={() => setShowConfirmStep(false)}
                      className="px-4 py-2 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                    >
                      RETOUR
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAdjustment}
                      className="px-6 py-2 bg-pros-black text-white font-bold uppercase text-xs hover:bg-neutral-800 shadow-md cursor-pointer"
                    >
                      CONFIRMER L'AJUSTEMENT
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Inventory Movement History Modal */}
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <History className="text-black" size={22} />
                  <h3 className="font-display font-bold text-lg uppercase text-black">
                    HISTORIQUE DES MOUVEMENTS DE STOCK ({movementsHistory.length})
                  </h3>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto border border-neutral-200">
                {movementsHistory.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500 font-sans">
                    Aucun mouvement de stock enregistré.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead className="bg-pros-bone border-b border-neutral-200 text-[10px] font-bold text-black uppercase font-sans">
                      <tr>
                        <th className="p-3">DATE / HEURE</th>
                        <th className="p-3">PRODUIT & VARIANTE</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3 text-center">MOUVEMENT</th>
                        <th className="p-3">MOTIF / REQUISITION</th>
                        <th className="p-3">ADMIN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-xs font-sans">
                      {movementsHistory.map((m) => (
                        <tr key={m.id} className="hover:bg-pros-bone">
                          <td className="p-3 font-mono text-[10px] text-neutral-600">
                            {new Date(m.timestamp).toLocaleString('fr-FR')}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-black uppercase">{m.productName}</div>
                            <div className="text-[10px] text-neutral-500">{m.variantName}</div>
                          </td>
                          <td className="p-3 font-mono text-pros-gold font-bold text-[11px]">{m.sku}</td>
                          <td className="p-3 text-center font-mono font-bold text-xs">
                            <span className="text-neutral-500">{m.previousStock}</span>
                            <span className="text-black font-bold mx-1.5">→ {m.changeText} →</span>
                            <span className="text-emerald-700 font-bold">{m.newStock}</span>
                          </td>
                          <td className="p-3 font-bold text-neutral-700">{m.reason}</td>
                          <td className="p-3 font-mono text-[10px] text-neutral-600">{m.adminName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-end">
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-6 py-2 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800"
                >
                  FERMER
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
