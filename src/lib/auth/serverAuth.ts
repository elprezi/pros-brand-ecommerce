import type { UserSession } from './session';
import { getSession } from './session';
import { hasPermission, type Permission } from './permissions';

export interface ServerAuthResult {
  user: UserSession | null;
  statusCode?: number;
  error?: string;
}

export function getCurrentUser(token?: string | null): UserSession | null {
  if (!token) return null;
  return getSession(token);
}

export function requireUser(token?: string | null): ServerAuthResult {
  const user = getCurrentUser(token);
  if (!user) {
    return {
      user: null,
      statusCode: 401,
      error: 'HTTP 401 Unauthorized: Session invalide ou expirée.',
    };
  }
  if (user.status !== 'ACTIVE') {
    return {
      user: null,
      statusCode: 403,
      error: 'HTTP 403 Forbidden: Compte suspendu.',
    };
  }
  return { user };
}

export function requireRole(token: string | null, requiredRole: 'ADMIN' | 'STAFF' | 'CUSTOMER'): ServerAuthResult {
  const authResult = requireUser(token);
  if (!authResult.user) return authResult;

  if (requiredRole === 'ADMIN' && authResult.user.role !== 'ADMIN') {
    return {
      user: null,
      statusCode: 403,
      error: 'HTTP 403 Forbidden: Droits d’administration requis.',
    };
  }

  if (requiredRole === 'STAFF' && authResult.user.role !== 'ADMIN' && authResult.user.role !== 'STAFF') {
    return {
      user: null,
      statusCode: 403,
      error: 'HTTP 403 Forbidden: Accès réservé au personnel autorisés.',
    };
  }

  return { user: authResult.user };
}

export function requirePermission(token: string | null, permission: Permission): ServerAuthResult {
  const authResult = requireUser(token);
  if (!authResult.user) return authResult;

  if (!hasPermission(authResult.user, permission)) {
    return {
      user: null,
      statusCode: 403,
      error: `HTTP 403 Forbidden: Permission insuffisante (${permission}).`,
    };
  }

  return { user: authResult.user };
}
