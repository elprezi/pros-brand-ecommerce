import type { ReportGenerationOptions } from '../../types/reports';
import type { Order, Product, CatalogCategory, CustomerUser } from '../../types/ecommerce';
import type { LoyaltyMember } from '../../types/loyalty';

// Format human-readable file size from bytes
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Calculate dynamic payload data based on report type and filter options
export const buildReportPayload = (
  options: ReportGenerationOptions,
  orders: Order[],
  products: Product[],
  categories: CatalogCategory[],
  customers: CustomerUser[],
  members: LoyaltyMember[]
) => {
  const period = options.period;
  const startDate = options.startDate;
  const endDate = options.endDate;

  // Filter orders by date range
  const filteredOrders = orders.filter((o) => {
    const orderDate = new Date(o.createdAt).getTime();
    const now = Date.now();

    if (period === 'today') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      if (orderDate < todayStart) return false;
    } else if (period === '7d') {
      if (orderDate < now - 7 * 24 * 3600 * 1000) return false;
    } else if (period === '30d') {
      if (orderDate < now - 30 * 24 * 3600 * 1000) return false;
    } else if (period === '90d') {
      if (orderDate < now - 90 * 24 * 3600 * 1000) return false;
    } else if (period === '12m') {
      if (orderDate < now - 365 * 24 * 3600 * 1000) return false;
    } else if (period === 'custom') {
      if (startDate && orderDate < new Date(startDate).getTime()) return false;
      if (endDate && orderDate > new Date(endDate).getTime() + 86400000) return false;
    }
    return true;
  });

  const paidOrders = filteredOrders.filter(
    (o) =>
      (o.status === 'livree' || o.status === 'expedie' || o.status === 'preparation' || o.paymentStatus === 'paid') &&
      !o.notes?.toLowerCase().includes('annul')
  );

  const grossRevenue = paidOrders.reduce((sum, o) => sum + (o.subtotal || o.total), 0);
  const totalDiscounts = paidOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
  const totalShippingFees = paidOrders.reduce((sum, o) => sum + (o.shippingCost || 0), 0);
  const totalRevenue = Math.max(0, grossRevenue - totalDiscounts);
  const paidOrdersCount = paidOrders.length;
  const totalOrdersCount = filteredOrders.length;
  const averageOrderValue = paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0;

  // Category breakdown
  const categoryMap: Record<string, { name: string; revenue: number; ordersCount: number; unitsSold: number }> = {};
  categories.forEach((cat) => {
    categoryMap[cat.name.toUpperCase()] = { name: cat.name.toUpperCase(), revenue: 0, ordersCount: 0, unitsSold: 0 };
  });
  paidOrders.forEach((o) => {
    o.items.forEach((item) => {
      const pCat = item.product?.category
        ? String(item.product.category).toUpperCase()
        : products.find((p) => p.id === item.productId)?.category
        ? String(products.find((p) => p.id === item.productId)?.category).toUpperCase()
        : 'AUTRE';
      if (!categoryMap[pCat]) {
        categoryMap[pCat] = { name: pCat, revenue: 0, ordersCount: 0, unitsSold: 0 };
      }
      categoryMap[pCat].revenue += item.price * item.quantity;
      categoryMap[pCat].unitsSold += item.quantity;
      categoryMap[pCat].ordersCount += 1;
    });
  });

  // Top selling products
  const productSalesMap: Record<string, { id: string; name: string; category: string; unitsSold: number; revenue: number }> = {};
  paidOrders.forEach((o) => {
    o.items.forEach((item) => {
      const pId = item.productId || item.product?.id || 'PROD-UNKN';
      const pName = item.product?.name || 'Produit PROS';
      const pCat = String(item.product?.category || 'PROS').toUpperCase();
      if (!productSalesMap[pId]) {
        productSalesMap[pId] = { id: pId, name: pName, category: pCat, unitsSold: 0, revenue: 0 };
      }
      productSalesMap[pId].unitsSold += item.quantity;
      productSalesMap[pId].revenue += item.price * item.quantity;
    });
  });
  const topProductsList = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  // Regional breakdown
  const regionMap: Record<string, { region: string; revenue: number; ordersCount: number }> = {};
  paidOrders.forEach((o) => {
    const reg = o.customer.region || o.customer.city || 'Dakar';
    if (!regionMap[reg]) {
      regionMap[reg] = { region: reg, revenue: 0, ordersCount: 0 };
    }
    regionMap[reg].revenue += o.total;
    regionMap[reg].ordersCount += 1;
  });
  const regionalList = Object.values(regionMap).sort((a, b) => b.revenue - a.revenue);

  // PROS Club Metrics
  const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));
  let memberCA = 0;
  let nonMemberCA = 0;
  paidOrders.forEach((o) => {
    if (memberEmails.has(o.customer.email.toLowerCase())) {
      memberCA += o.total;
    } else {
      nonMemberCA += o.total;
    }
  });

  return {
    reportType: options.type,
    period: options.period,
    generatedAt: new Date().toISOString(),
    summary: {
      grossRevenue,
      totalDiscounts,
      totalShippingFees,
      totalRevenue,
      totalOrdersCount,
      paidOrdersCount,
      averageOrderValue,
      activeCustomersCount: new Set(paidOrders.map((o) => o.customer.email)).size,
      totalRegisteredCustomers: customers.length,
      memberCA,
      nonMemberCA,
    },
    orders: paidOrders.map((o) => ({
      id: o.id,
      trackingNumber: o.trackingNumber,
      date: o.createdAt,
      customerName: `${o.customer.firstName} ${o.customer.lastName}`,
      customerEmail: o.customer.email,
      region: o.customer.region || o.customer.city,
      itemsCount: o.items.reduce((s, i) => s + i.quantity, 0),
      total: o.total,
      discount: o.discount || 0,
      paymentMethod: o.paymentMethod,
      status: o.status,
    })),
    categories: Object.values(categoryMap).filter((c) => c.revenue > 0 || c.unitsSold > 0),
    topProducts: topProductsList,
    regions: regionalList,
    productsInventory: products.map((p) => {
      const stock = Object.values(p.stockPerSize || {}).reduce((a, b) => a + Number(b), 0);
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        stock,
        status: stock === 0 ? 'RUPTURE' : stock < 5 ? 'STOCK FAIBLE' : 'EN STOCK',
      };
    }),
    customersList: customers.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      city: c.city,
      region: c.region,
      status: c.status,
      createdAt: c.createdAt,
    })),
  };
};

// Generate and trigger download for CSV file
export const downloadCSVReport = (reportTitle: string, payload: any) => {
  const lines: string[] = [];
  lines.push(`PROS ERP - ${reportTitle.toUpperCase()}`);
  lines.push(`Généré le;${new Date(payload.generatedAt).toLocaleString('fr-FR')}`);
  lines.push(`Période;${payload.period}`);
  lines.push('');
  lines.push('RÉSUMÉ EXÉCUTIF');
  lines.push(`Chiffre d'Affaires Net;${payload.summary.totalRevenue} FCFA`);
  lines.push(`Commandes Éligibles;${payload.summary.paidOrdersCount}`);
  lines.push(`Panier Moyen;${payload.summary.averageOrderValue} FCFA`);
  lines.push(`Frais de Livraison Encassés;${payload.summary.totalShippingFees} FCFA`);
  lines.push(`Remises Accordées;${payload.summary.totalDiscounts} FCFA`);
  lines.push('');

  if (payload.orders && payload.orders.length > 0) {
    lines.push('LISTE DES COMMANDES');
    lines.push('ID COMMANDE;DATE;CLIENT;EMAIL;RÉGION;ARTICLES;TOTAL (FCFA);STATUT');
    payload.orders.forEach((o: any) => {
      lines.push(
        `${o.id};${new Date(o.date).toLocaleDateString('fr-FR')};"${o.customerName}";${o.customerEmail};"${o.region}";${o.itemsCount};${o.total};${o.status}`
      );
    });
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate and trigger download for JSON file
export const downloadJSONReport = (reportTitle: string, payload: any) => {
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
