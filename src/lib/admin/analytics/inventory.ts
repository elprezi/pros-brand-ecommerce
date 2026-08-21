import type { Product } from '../../../types/ecommerce';
import type { LowStockItem } from './dashboard';

export const getLowStockProducts = (products: Product[], threshold = 3): LowStockItem[] => {
  const items: LowStockItem[] = [];

  products.forEach((p) => {
    const color = p.colors?.[0]?.name || 'Noir';
    const sizes = p.sizes || [];
    sizes.forEach((sz) => {
      const stock = p.stockPerSize?.[sz] ?? 0;
      if (stock <= threshold) {
        items.push({
          id: `${p.id}-${sz}`,
          name: p.name,
          color,
          size: sz,
          stock,
          isOutOfStock: stock === 0,
        });
      }
    });
  });

  return items;
};
