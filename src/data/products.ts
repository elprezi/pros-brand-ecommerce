import type { Product, LookbookItem, StoreSettings, PromoCode } from '../types/ecommerce';

export const INITIAL_SETTINGS: StoreSettings = {
  // General
  platformName: 'PROS ERP',
  companyName: 'Service PRO',
  adminEmail: 'admin@pros.sn',
  supportEmail: 'support@pros.sn',
  supportPhone: '+221 77 000 00 00',
  country: 'Sénégal',
  currency: 'FCFA',
  timezone: 'Africa/Dakar',
  defaultLanguage: 'Français',
  dateFormat: 'JJ/MM/AAAA',

  // Boutique
  storeName: 'PROS — E-Shop Officiel Sénégal',
  shortDescription: 'Maison de Haute Couture Africaine & Prêt-à-Porter Engage',
  welcomeMessage: 'Bienvenue sur la boutique officielle de la marque PROS.',
  maintenanceMode: false,
  maintenanceMessage: 'La boutique est temporairement indisponible pour maintenance. Merci de votre patience.',

  // Announcement Banner
  announcementText: 'LIVRAISON DISPONIBLE PARTOUT AU SÉNÉGAL (DAKAR, THIÈS, SAINT-LOUIS, TOUBA...) — NOUVELLE COLLECTION PROS',
  announcementEnabled: true,
  announcementType: 'livraison',
  announcementStyle: 'standard',

  // Orders
  ordersEnabled: true,
  minOrderAmount: 0,
  guestCheckoutAllowed: true,
  whatsappOrdersAllowed: true,
  cancellationAllowed: true,
  cancellationWindowMinutes: 30,
  defaultOrderStatus: 'EN ATTENTE',
  autoOrderNumberFormat: 'PROS-2026-000001',

  // Shipping & Pickup
  dakarShippingFee: 2500,
  regionShippingFee: 5000,
  freeShippingThreshold: 100000,
  freeShippingEnabled: true,
  showShippingBeforePayment: true,
  autoShippingCalc: true,
  pickupAddress: 'Showroom PROS — Avenue Léopold Sédar Senghor, Dakar, Sénégal',
  deliveryZones: [
    { id: 'zone-dakar', name: 'DAKAR (Grand Dakar & Banlieue)', fee: 2500, estimatedDelay: '24h - 48h', active: true },
    { id: 'zone-thies', name: 'THIÈS & MBOUR', fee: 4000, estimatedDelay: '48h', active: true },
    { id: 'zone-saintlouis', name: 'SAINT-LOUIS', fee: 5000, estimatedDelay: '48h - 72h', active: true },
    { id: 'zone-touba', name: 'TOUBA & DIOURBEL', fee: 5000, estimatedDelay: '48h - 72h', active: true },
    { id: 'zone-kaolack', name: 'KAOLACK & FATICK', fee: 5000, estimatedDelay: '72h', active: true },
    { id: 'zone-ziguinchor', name: 'ZIGUINCHOR & CASAMANCE', fee: 7000, estimatedDelay: '3 à 5 jours', active: true },
    { id: 'zone-tambacounda', name: 'TAMBACOUNDA & KÉDOUGOU', fee: 7000, estimatedDelay: '3 à 5 jours', active: true },
  ],

  // Payments & WhatsApp Commerce
  whatsAppNumber: '+221 77 000 00 00',
  whatsAppOrderNumber: '+221 77 000 00 00',
  whatsAppAutoMessage: 'Bonjour PROS, je souhaite passer commande sur la boutique en ligne.',
  whatsAppCommerceEnabled: true,
  paymentMethods: [
    { id: 'wave', name: 'Wave Mobile Money', active: true, displayOrder: 1 },
    { id: 'orange_money', name: 'Orange Money Sénégal', active: true, displayOrder: 2 },
    { id: 'free_money', name: 'Free Money Sénégal', active: true, displayOrder: 3 },
    { id: 'cod', name: 'Paiement à la Livraison (Cash)', active: true, displayOrder: 4 },
    { id: 'card', name: 'Carte Bancaire (VISA / Mastercard)', active: true, displayOrder: 5 },
  ],

  // Customers
  registrationMandatory: false,
  guestAccountsAllowed: true,
  emailVerificationEnabled: false,
  phoneVerificationEnabled: true,
  profileEditAllowed: true,
  orderHistoryVisible: true,

  // Loyalty
  loyaltyEnabled: true,
  pointsPerFcfa: 1,
  pointsExpirationMonths: 12,

  // Notifications & Communication
  autoNotifications: {
    newOrderAdmin: true,
    orderConfirmedClient: true,
    orderShippedClient: true,
    orderDeliveredClient: true,
    lowStockAdmin: true,
    refundAdmin: true,
  },

  // Stock
  stockManagementEnabled: true,
  allowBackorders: false,
  lowStockThreshold: 5,
  autoLowStockNotification: true,
  reserveStockOnOrder: true,
  releaseStockOnCancel: true,

  // Analytics & Tracking
  visitorTrackingEnabled: false,
  sessionTrackingEnabled: false,
  pageviewTrackingEnabled: false,
  cartTrackingEnabled: true,
  checkoutTrackingEnabled: true,
  conversionTrackingEnabled: true,

  // Security
  sessionTimeoutMinutes: 60,
  twoFactorAuthEnabled: false,
  confirmBeforeDelete: true,
  adminActionLogging: true,
  allowedIps: '',

  // Audit History
  modificationHistory: [
    {
      id: 'log-001',
      timestamp: '2026-08-18T14:32:00.000Z',
      user: 'Admin PROS',
      settingKey: 'dakarShippingFee',
      oldVal: '2000 FCFA',
      newVal: '2500 FCFA',
    },
    {
      id: 'log-002',
      timestamp: '2026-08-18T14:35:00.000Z',
      user: 'Admin PROS',
      settingKey: 'freeShippingThreshold',
      oldVal: '50000 FCFA',
      newVal: '100000 FCFA',
    },
  ],
};

export const INITIAL_PROMO_CODES: PromoCode[] = [];

// Clean slate: 0 initial demo products
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_LOOKBOOK: LookbookItem[] = [];
