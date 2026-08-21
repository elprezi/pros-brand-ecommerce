import type { UserSession } from './session';

export function isAdmin(user: UserSession | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' && user.status === 'ACTIVE';
}

export function isStaff(user: UserSession | null): boolean {
  if (!user) return false;
  return (user.role === 'ADMIN' || user.role === 'STAFF') && user.status === 'ACTIVE';
}

export function canManageProducts(user: UserSession | null): boolean {
  return isStaff(user);
}

export function canManageOrders(user: UserSession | null): boolean {
  return isStaff(user);
}

export function canManageCustomers(user: UserSession | null): boolean {
  return isAdmin(user);
}

export function canViewAnalytics(user: UserSession | null): boolean {
  return isAdmin(user);
}
