import * as XLSX from 'xlsx';
import type { Order } from '../types/ecommerce';

// Helper to format currency for export
const formatFCFA = (amount: number): string => {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
};

// Helper to format date for export
const formatDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
};

// Helper for status text
const formatStatus = (status: string): string => {
  switch (status) {
    case 'recue': return 'EN ATTENTE';
    case 'preparation': return 'EN PRÉPARATION';
    case 'expedie': return 'EXPÉDIÉE';
    case 'transit': return 'EN TRANSIT';
    case 'livree': return 'LIVRÉE';
    default: return status.toUpperCase();
  }
};

// Helper for payment status
const formatPaymentStatus = (status: string): string => {
  switch (status) {
    case 'paid': return 'PAYÉ';
    case 'pending': return 'EN ATTENTE';
    case 'failed': return 'ÉCHOUÉ';
    default: return status.toUpperCase();
  }
};

// Helper for payment method label
const formatPaymentMethod = (method: string): string => {
  switch (method) {
    case 'wave': return 'WAVE SÉNÉGAL';
    case 'orange_money': return 'ORANGE MONEY';
    case 'card': return 'CARTE BANCAIRE';
    case 'cash_on_delivery': return 'CASH À LA LIVRAISON';
    default: return method.toUpperCase();
  }
};

/**
 * Professional CSV Export with UTF-8 BOM & Semicolon Separator (Excel FR Compatible)
 */
export const exportOrdersToCSV = (orders: Order[], isFiltered = false) => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = isFiltered
    ? `pros_commandes_filtrees_${dateStr}.csv`
    : `pros_commandes_${dateStr}.csv`;

  // UTF-8 BOM to force Excel French to recognize accents and correct encoding
  const BOM = '\uFEFF';

  const headers = [
    'N° COMMANDE',
    'N° SUIVI',
    'CLIENT',
    'TÉLÉPHONE',
    'RÉGION',
    'VILLE',
    'ARTICLES',
    'MONTANT TOTAL',
    'MODE DE PAIEMENT',
    'STATUT PAIEMENT',
    'STATUT COMMANDE',
    'DATE DE COMMANDE',
  ];

  const rows = orders.map((o) => {
    const itemsSummary = o.items.map((it) => `${it.quantity}x ${it.product.name} (${it.color}/${it.size})`).join(' | ');
    return [
      `"${o.id}"`,
      `"${o.trackingNumber}"`,
      `"${o.customer.firstName} ${o.customer.lastName}"`,
      `"${o.customer.phone}"`,
      `"${o.customer.region}"`,
      `"${o.customer.city || o.customer.region}"`,
      `"${itemsSummary}"`,
      `"${formatFCFA(o.total)}"`,
      `"${formatPaymentMethod(o.paymentMethod)}"`,
      `"${formatPaymentStatus(o.paymentStatus)}"`,
      `"${formatStatus(o.status)}"`,
      `"${formatDate(o.createdAt)}"`,
    ].join(';');
  });

  const csvContent = BOM + headers.join(';') + '\n' + rows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Professional Excel XLSX Export with 3 Sheets (RÉSUMÉ, COMMANDES, ARTICLES)
 */
export const exportOrdersToExcel = (orders: Order[], isFiltered = false) => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const formattedToday = formatDate(new Date().toISOString());
  const filename = isFiltered
    ? `pros_commandes_filtrees_${dateStr}.xlsx`
    : `pros_commandes_${dateStr}.xlsx`;

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // SHEET 1: RÉSUMÉ (Executive Overview & Analytics)
  // -------------------------------------------------------------
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalCount = orders.length;

  const statusCounts = {
    recue: orders.filter((o) => o.status === 'recue').length,
    preparation: orders.filter((o) => o.status === 'preparation').length,
    expedie: orders.filter((o) => o.status === 'expedie').length,
    livree: orders.filter((o) => o.status === 'livree').length,
  };

  const paymentCounts = {
    wave: orders.filter((o) => o.paymentMethod === 'wave').length,
    orange_money: orders.filter((o) => o.paymentMethod === 'orange_money').length,
    card: orders.filter((o) => o.paymentMethod === 'card').length,
    cash_on_delivery: orders.filter((o) => o.paymentMethod === 'cash_on_delivery').length,
  };

  const resumeData = [
    ['PROS — PRÉSIDENT OUSMANE SONKO'],
    ['EXPORT ANNALYTIQUE DES COMMANDES'],
    [`Généré le : ${formattedToday}`],
    [],
    ['INDICATEURS CLÉS (KPIs)', 'VALEUR'],
    ['Nombre Total de Commandes Exportées', totalCount],
    ['Chiffre d’Affaires Total', formatFCFA(totalSales)],
    ['Commandes en Attente', statusCounts.recue],
    ['Commandes en Préparation', statusCounts.preparation],
    ['Commandes Expédiées', statusCounts.expedie],
    ['Commandes Livrées', statusCounts.livree],
    [],
    ['RÉPARTITION PAR MODE DE PAIEMENT', 'NOMBRE'],
    ['Wave Sénégal', paymentCounts.wave],
    ['Orange Money', paymentCounts.orange_money],
    ['Carte Bancaire', paymentCounts.card],
    ['Paiement Cash à la Livraison', paymentCounts.cash_on_delivery],
  ];

  const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
  wsResume['!cols'] = [{ wch: 40 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsResume, 'RÉSUMÉ');

  // -------------------------------------------------------------
  // SHEET 2: COMMANDES (Main Orders Data Table)
  // -------------------------------------------------------------
  const ordersHeaders = [
    'N° COMMANDE',
    'N° SUIVI',
    'CLIENT',
    'TÉLÉPHONE',
    'RÉGION',
    'VILLE',
    'ARTICLES',
    'MONTANT TOTAL',
    'MODE DE PAIEMENT',
    'STATUT PAIEMENT',
    'STATUT COMMANDE',
    'DATE DE COMMANDE',
  ];

  const ordersRows = orders.map((o) => {
    const itemsSummary = o.items.map((it) => `${it.quantity}x ${it.product.name} (${it.color}/${it.size})`).join(' | ');
    return [
      o.id,
      o.trackingNumber,
      `${o.customer.firstName} ${o.customer.lastName}`.toUpperCase(),
      o.customer.phone,
      o.customer.region.toUpperCase(),
      o.customer.city || o.customer.region,
      itemsSummary,
      formatFCFA(o.total),
      formatPaymentMethod(o.paymentMethod),
      formatPaymentStatus(o.paymentStatus),
      formatStatus(o.status),
      formatDate(o.createdAt),
    ];
  });

  const ordersData = [
    ['PROS — MAISON DE COUTURE'],
    ['TABLEAU D’EXPLOITATION DES COMMANDES'],
    [`Export effectué le : ${formattedToday}`],
    [],
    ordersHeaders,
    ...ordersRows,
  ];

  const wsOrders = XLSX.utils.aoa_to_sheet(ordersData);

  // Auto column widths
  wsOrders['!cols'] = [
    { wch: 22 }, // N° COMMANDE
    { wch: 20 }, // N° SUIVI
    { wch: 28 }, // CLIENT
    { wch: 18 }, // TÉLÉPHONE
    { wch: 18 }, // RÉGION
    { wch: 20 }, // VILLE
    { wch: 45 }, // ARTICLES
    { wch: 20 }, // MONTANT TOTAL
    { wch: 25 }, // MODE PAIEMENT
    { wch: 18 }, // STATUT PAIEMENT
    { wch: 20 }, // STATUT COMMANDE
    { wch: 22 }, // DATE DE COMMANDE
  ];

  // Auto-filter on main table (Row 5 is 0-indexed row 4)
  const lastRowIndex = ordersData.length;
  wsOrders['!autofilter'] = { ref: `A5:L${lastRowIndex}` };

  XLSX.utils.book_append_sheet(wb, wsOrders, 'COMMANDES');

  // -------------------------------------------------------------
  // SHEET 3: ARTICLES (Detailed Line Items)
  // -------------------------------------------------------------
  const itemsHeaders = [
    'N° COMMANDE',
    'NOM DU PRODUIT',
    'CATÉGRIE',
    'COULEUR',
    'TAILLE',
    'QUANTITÉ',
    'PRIX UNITAIRE',
    'MONTANT TOTAL',
    'CLIENT',
    'DATE',
  ];

  const itemsRows: any[][] = [];
  orders.forEach((o) => {
    o.items.forEach((it) => {
      itemsRows.push([
        o.id,
        it.product.name.toUpperCase(),
        it.product.category.toUpperCase(),
        it.color,
        it.size,
        it.quantity,
        formatFCFA(it.price),
        formatFCFA(it.price * it.quantity),
        `${o.customer.firstName} ${o.customer.lastName}`.toUpperCase(),
        formatDate(o.createdAt),
      ]);
    });
  });

  const itemsData = [
    ['PROS — DÉTAIL ARTICLES VENDUS'],
    [`Export du ${formattedToday}`],
    [],
    itemsHeaders,
    ...itemsRows,
  ];

  const wsItems = XLSX.utils.aoa_to_sheet(itemsData);
  wsItems['!cols'] = [
    { wch: 22 }, // N° COMMANDE
    { wch: 35 }, // PRODUIT
    { wch: 18 }, // CATÉGORIE
    { wch: 15 }, // COULEUR
    { wch: 10 }, // TAILLE
    { wch: 12 }, // QUANTITÉ
    { wch: 18 }, // PRIX UNITAIRE
    { wch: 20 }, // MONTANT TOTAL
    { wch: 25 }, // CLIENT
    { wch: 22 }, // DATE
  ];

  wsItems['!autofilter'] = { ref: `A4:J${itemsData.length}` };
  XLSX.utils.book_append_sheet(wb, wsItems, 'ARTICLES');

  // Trigger File Download
  XLSX.writeFile(wb, filename);
};
