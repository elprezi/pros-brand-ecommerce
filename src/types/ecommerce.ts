export type Category = 'homme' | 'femme' | 'accessoires' | string;

export type SubCategory = 
  | 'hoodie' 
  | 'sweatshirt' 
  | 'pull' 
  | 'polo' 
  | 'bomber' 
  | 'veste' 
  | 'tshirt' 
  | 'pantalon' 
  | 'ensemble' 
  | 'casquette' 
  | 'bonnet' 
  | 'echarpe' 
  | 'sac' 
  | 'chaussettes' 
  | 'gants' 
  | 'legging';

export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | 'XXXXL';

export type ProductBadge = 'nouveau' | 'bestseller' | 'essentiel' | 'exclusif';

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export type ProductCollection = 'essentielle' | 'signature' | 'sport' | string;

export type CategoryStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type CollectionStatus = 'ACTIVE' | 'DRAFT' | 'INACTIVE' | 'ARCHIVED';

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  fullDescription?: string;
  imageUrl?: string;
  status: CategoryStatus;
  displayOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  seoSlug?: string;
  showOnStore: boolean;
  showInMenu: boolean;
  showOnHomepage: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CatalogCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  fullDescription?: string;
  imageUrl?: string;
  status: CollectionStatus;
  displayOrder: number;
  productIds?: string[];
  metaTitle?: string;
  metaDescription?: string;
  seoSlug?: string;
  showOnStore: boolean;
  showInMenu: boolean;
  showOnHomepage: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  subCategory: SubCategory;
  price: number; // in FCFA
  costPrice?: number; // Cost of Goods Sold (COGS) in FCFA
  internalCost?: number; // Raw cost entered by admin in FCFA
  originalPrice?: number;
  description: string;
  shortDescription: string;
  material: string;
  care: string;
  fit: string;
  colors: ProductColor[];
  sizes: ProductSize[];
  stockPerSize: Record<ProductSize, number>;
  badge?: ProductBadge;
  isFeatured?: boolean;
  rating: number;
  reviewsCount: number;
  status?: ProductStatus;
  collection?: ProductCollection;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  color: string;
  size: ProductSize;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  country: string;
  notes?: string;
}

export type DeliveryMethod = 'dakar_express' | 'region_standard' | 'boutique_pickup';
export type PaymentMethod = 'wave' | 'orange_money' | 'card' | 'cash_on_delivery';

export type OrderStatus = 'recue' | 'preparation' | 'expedie' | 'transit' | 'livree';

export interface Order {
  id: string;
  trackingNumber: string;
  createdAt: string;
  userId?: string;
  customer: ShippingAddress;
  shippingAddressSnapshot?: ShippingAddressSnapshot;
  deliveryAddressId?: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  taxAmount?: number;
  customsFee?: number;
  total: number;
  currency?: string; // Currency code e.g. 'XOF', 'EUR', 'USD'
  exchangeRate?: number; // Taux au moment de l'achat e.g. 655.957
  baseTotalXOF?: number; // Real reference total in XOF
  costPriceTotalXOF?: number; // Total COGS in XOF
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending' | 'failed';
  status: OrderStatus;
  couponId?: string;
  couponCode?: string;
  notes?: string;
}

export type CouponDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
export type CouponStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'EXHAUSTED' | 'DISABLED';

export interface PromoCode {
  id: string;
  code: string; // Unique uppercase promo code (e.g. PROS2026)
  name: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number; // e.g. 15 for %, 5000 for FCFA, 0 for FREE_SHIPPING
  discountPercent?: number; // Backwards compatibility
  discountFixed?: number; // Backwards compatibility
  minAmount?: number; // Backwards compatibility
  minimumOrderAmount?: number; // min cart amount in FCFA
  maximumDiscountAmount?: number; // ceiling max discount in FCFA for % coupons
  usageLimit?: number; // total global max usages allowed
  usageLimitPerCustomer?: number; // max usages per customer
  usageCount: number; // current usages count
  totalDiscountGranted?: number; // accumulated total FCFA discounted
  startsAt?: string; // ISO date
  expiresAt?: string; // ISO date
  status: CouponStatus;
  active: boolean;
  freeShipping?: boolean;
  firstOrderOnly?: boolean;
  targetCategory?: string;
  targetCollection?: string;
  targetProducts?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface LookbookItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  season: string;
  tags: string[];
  featuredProductIds: string[];
}

export interface DeliveryZoneSetting {
  id: string;
  name: string;
  fee: number;
  estimatedDelay: string;
  active: boolean;
}

export interface PaymentMethodSetting {
  id: string;
  name: string;
  active: boolean;
  displayOrder: number;
}

export interface SettingsModificationLog {
  id: string;
  timestamp: string;
  user: string;
  settingKey: string;
  oldVal: string;
  newVal: string;
}

export interface StoreSettings {
  // General
  platformName?: string;
  companyName?: string;
  adminEmail?: string;
  supportEmail?: string;
  supportPhone?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  defaultLanguage?: string;
  dateFormat?: string;

  // Boutique
  storeName?: string;
  shortDescription?: string;
  welcomeMessage?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;

  // Announcement Banner
  announcementText: string;
  announcementEnabled?: boolean;
  announcementType?: 'info' | 'promo' | 'livraison' | 'urgence';
  announcementStyle?: 'standard' | 'accent' | 'alerte';

  // Orders
  ordersEnabled?: boolean;
  minOrderAmount?: number;
  guestCheckoutAllowed?: boolean;
  whatsappOrdersAllowed?: boolean;
  cancellationAllowed?: boolean;
  cancellationWindowMinutes?: number;
  defaultOrderStatus?: string;
  autoOrderNumberFormat?: string;

  // Shipping & Pickup
  dakarShippingFee: number;
  regionShippingFee: number;
  freeShippingThreshold: number;
  freeShippingEnabled?: boolean;
  showShippingBeforePayment?: boolean;
  autoShippingCalc?: boolean;
  pickupAddress: string;
  deliveryZones?: DeliveryZoneSetting[];

  // Payments & WhatsApp
  whatsAppNumber: string;
  whatsAppOrderNumber?: string;
  whatsAppAutoMessage?: string;
  whatsAppCommerceEnabled?: boolean;
  paymentMethods?: PaymentMethodSetting[];

  // OAuth & Security
  googleClientId?: string;

  // Customers
  registrationMandatory?: boolean;
  guestAccountsAllowed?: boolean;
  emailVerificationEnabled?: boolean;
  phoneVerificationEnabled?: boolean;
  profileEditAllowed?: boolean;
  orderHistoryVisible?: boolean;

  // Loyalty
  loyaltyEnabled?: boolean;
  pointsPerFcfa?: number;
  pointsExpirationMonths?: number;

  // Notifications & Communication
  autoNotifications?: Record<string, boolean>;

  // Stock
  stockManagementEnabled?: boolean;
  allowBackorders?: boolean;
  lowStockThreshold?: number;
  autoLowStockNotification?: boolean;
  reserveStockOnOrder?: boolean;
  releaseStockOnCancel?: boolean;

  // Analytics
  visitorTrackingEnabled?: boolean;
  sessionTrackingEnabled?: boolean;
  pageviewTrackingEnabled?: boolean;
  cartTrackingEnabled?: boolean;
  checkoutTrackingEnabled?: boolean;
  conversionTrackingEnabled?: boolean;

  // Security
  sessionTimeoutMinutes?: number;
  twoFactorAuthEnabled?: boolean;
  confirmBeforeDelete?: boolean;
  adminActionLogging?: boolean;
  allowedIps?: string;

  // Audit History
  modificationHistory?: SettingsModificationLog[];
}

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';

export interface CustomerReview {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderId?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  adminNote?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'MODERATOR' | 'SUPER_ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type CustomerSegment = 'PROSPECT' | 'CLIENT' | 'CLIENT FIDÈLE' | 'CLIENT PREMIUM';

export interface CustomerUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city: string;
  region: string;
  country: string;
  role: UserRole;
  status: UserStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  lastOrderAt?: string;
}

export type AddressLabel = 'DOMICILE' | 'BUREAU' | 'TRAVAIL' | 'AUTRE';

export interface DeliveryAddress {
  id: string;
  customerId: string;
  label: AddressLabel;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  additionalInfo?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ShippingAddressSnapshot {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  additionalInfo?: string;
}
