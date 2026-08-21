export type Permission =
  | 'VIEW_DASHBOARD'
  // Products
  | 'VIEW_PRODUCTS'
  | 'CREATE_PRODUCTS'
  | 'EDIT_PRODUCTS'
  | 'DELETE_PRODUCTS'
  | 'PUBLISH_PRODUCTS'
  | 'IMPORT_PRODUCTS'
  | 'EXPORT_PRODUCTS'
  // Categories
  | 'VIEW_CATEGORIES'
  | 'CREATE_CATEGORIES'
  | 'EDIT_CATEGORIES'
  | 'DELETE_CATEGORIES'
  // Collections
  | 'VIEW_COLLECTIONS'
  | 'CREATE_COLLECTIONS'
  | 'EDIT_COLLECTIONS'
  | 'DELETE_COLLECTIONS'
  // Variants & SKUs
  | 'VIEW_VARIANTS'
  | 'CREATE_VARIANTS'
  | 'EDIT_VARIANTS'
  | 'DELETE_VARIANTS'
  | 'MANAGE_SKUS'
  // Inventory
  | 'VIEW_INVENTORY'
  | 'MANAGE_INVENTORY'
  | 'IMPORT_INVENTORY'
  | 'EXPORT_INVENTORY'
  | 'ADJUST_STOCK'
  // Orders
  | 'VIEW_ORDERS'
  | 'CREATE_ORDERS'
  | 'EDIT_ORDERS'
  | 'CANCEL_ORDERS'
  | 'REFUND_ORDERS'
  | 'MANAGE_PAYMENTS'
  // Customers
  | 'VIEW_CUSTOMERS'
  | 'CREATE_CUSTOMERS'
  | 'EDIT_CUSTOMERS'
  | 'DELETE_CUSTOMERS'
  | 'IMPORT_CUSTOMERS'
  | 'EXPORT_CUSTOMERS'
  | 'BLOCK_CUSTOMERS'
  // Delivery Addresses
  | 'VIEW_DELIVERY_ADDRESSES'
  | 'CREATE_DELIVERY_ADDRESSES'
  | 'EDIT_DELIVERY_ADDRESSES'
  | 'DELETE_DELIVERY_ADDRESSES'
  | 'IMPORT_DELIVERY_ADDRESSES'
  | 'EXPORT_DELIVERY_ADDRESSES'
  | 'SET_DEFAULT_DELIVERY_ADDRESS'
  // Reviews
  | 'VIEW_REVIEWS'
  | 'APPROVE_REVIEWS'
  | 'REJECT_REVIEWS'
  | 'HIDE_REVIEWS'
  | 'DELETE_REVIEWS'
  // Coupons
  | 'VIEW_COUPONS'
  | 'CREATE_COUPONS'
  | 'EDIT_COUPONS'
  | 'DELETE_COUPONS'
  // CMS Page d'Accueil
  | 'VIEW_CMS'
  | 'EDIT_CMS'
  | 'PUBLISH_CMS'
  // Médiathèque PROS
  | 'VIEW_MEDIA'
  | 'UPLOAD_MEDIA'
  | 'EDIT_MEDIA'
  | 'DELETE_MEDIA'
  // Bannières & Hero
  | 'VIEW_BANNERS'
  | 'CREATE_BANNERS'
  | 'EDIT_BANNERS'
  | 'DELETE_BANNERS'
  | 'PUBLISH_BANNERS'
  // Communications
  | 'VIEW_COMMUNICATIONS'
  | 'CREATE_COMMUNICATIONS'
  | 'EDIT_COMMUNICATIONS'
  | 'DELETE_COMMUNICATIONS'
  | 'SEND_COMMUNICATIONS'
  // Reports
  | 'VIEW_REPORTS'
  | 'EXPORT_REPORTS'
  // Admins
  | 'VIEW_ADMINS'
  | 'CREATE_ADMINS'
  | 'EDIT_ADMINS'
  | 'BLOCK_ADMINS'
  | 'DELETE_ADMINS'
  // Roles
  | 'VIEW_ROLES'
  | 'CREATE_ROLES'
  | 'EDIT_ROLES'
  | 'DELETE_ROLES'
  | 'ASSIGN_ROLES'
  // Audit
  | 'VIEW_AUDIT_LOGS'
  | 'EXPORT_AUDIT_LOGS';

export interface PermissionGroup {
  id: string;
  name: string;
  permissions: {
    id: Permission;
    label: string;
    description: string;
    requires?: Permission;
  }[];
}

export interface RoleDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export type AuditSeverity = 'INFO' | 'IMPORTANT' | 'CRITIQUE' | 'SÉCURITÉ';
export type AuditStatus = 'SUCCÈS' | 'ÉCHEC' | 'BLOQUÉ';

export interface RbacAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  userName?: string;
  userRole?: string;
  action: string;
  actionCode?: string;
  actionLabel?: string;
  actionCategory?: string;
  targetType?: string;
  targetId?: string;
  entityName?: string;
  description?: string;
  severity?: AuditSeverity;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  beforeData?: Record<string, any> | string;
  afterData?: Record<string, any> | string;
  diffItems?: Array<{ parameter: string; before: string; after: string }>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  status: AuditStatus | 'SUCCESS' | 'DENIED' | 'WARNING';
}
