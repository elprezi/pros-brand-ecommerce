import type { UserSession } from './session';

export type Permission =
  | 'MANAGE_PRODUCTS'
  | 'MANAGE_ORDERS'
  | 'MANAGE_CUSTOMERS'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_SETTINGS';

export function isAdmin(user: UserSession | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' && user.status === 'ACTIVE';
}

export function isStaff(user: UserSession | null): boolean {
  if (!user) return false;
  return (user.role === 'ADMIN' || user.role === 'STAFF') && user.status === 'ACTIVE';
}

export function hasPermission(user: UserSession | null, permission: Permission): boolean {
  if (!user || user.status !== 'ACTIVE') return false;

  // ADMIN gets full permissions
  if (user.role === 'ADMIN') return true;

  // STAFF gets operational permissions only (products & orders)
  if (user.role === 'STAFF') {
    return permission === 'MANAGE_PRODUCTS' || permission === 'MANAGE_ORDERS';
  }

  // CUSTOMER gets no admin permissions
  return false;
}

export function canManageProducts(user: UserSession | null): boolean {
  return hasPermission(user, 'MANAGE_PRODUCTS');
}

export function canManageOrders(user: UserSession | null): boolean {
  return hasPermission(user, 'MANAGE_ORDERS');
}

export function canManageCustomers(user: UserSession | null): boolean {
  return hasPermission(user, 'MANAGE_CUSTOMERS');
}

export function canViewAnalytics(user: UserSession | null): boolean {
  return hasPermission(user, 'VIEW_ANALYTICS');
}

export function canManageSettings(user: UserSession | null): boolean {
  return hasPermission(user, 'MANAGE_SETTINGS');
}

/**
 * Role Escalation Guard: Prevents non-ADMIN users from altering role or status.
 */
export function validateRoleMutation(actor: UserSession | null, _targetUserId?: string, _requestedRole?: string): boolean {
  if (!actor || !isAdmin(actor)) {
    return false; // Only active ADMIN can mutate roles or status
  }
  return true;
}
