import type { Product, Category, ProductSize } from '../../types/ecommerce';
import { INITIAL_PRODUCTS } from '../../data/products';

export interface GetProductsQuery {
  search?: string;
  category?: Category | 'all';
  collection?: string;
  badge?: string;
  size?: ProductSize;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'relevance' | 'newest' | 'price-asc' | 'price-desc' | 'bestsellers';
  page?: number;
  limit?: number;
}

export function filterProducts(query: GetProductsQuery, allProducts: Product[] = INITIAL_PRODUCTS) {
  const {
    search,
    category,
    badge,
    size,
    minPrice,
    maxPrice,
    sortBy = 'relevance',
    page = 1,
    limit = 20,
  } = query;

  let result = [...allProducts];

  // Search filter
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subCategory.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q)
    );
  }

  // Category filter
  if (category && category !== 'all') {
    result = result.filter((p) => p.category === category);
  }

  // Badge filter
  if (badge && badge !== 'all') {
    result = result.filter((p) => p.badge === badge);
  }

  // Size filter
  if (size) {
    result = result.filter((p) => (p.stockPerSize[size] || 0) > 0);
  }

  // Price range filter
  if (minPrice !== undefined) {
    result = result.filter((p) => p.price >= minPrice);
  }
  if (maxPrice !== undefined) {
    result = result.filter((p) => p.price <= maxPrice);
  }

  // Sorting
  result.sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'newest') return b.id.localeCompare(a.id);
    if (sortBy === 'bestsellers') return (b.badge === 'bestseller' ? 1 : 0) - (a.badge === 'bestseller' ? 1 : 0);
    return 0;
  });

  const total = result.length;
  const startIndex = (page - 1) * limit;
  const items = result.slice(startIndex, startIndex + limit);

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
