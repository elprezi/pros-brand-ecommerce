export interface RouteGuardResult {
  allowed: boolean;
  redirectTo?: string;
}

export function evaluateRouteGuard(path: string, userRole: string | null): RouteGuardResult {
  // Public routes
  if (
    path === '/' ||
    path.startsWith('/shop') ||
    path.startsWith('/product') ||
    path.startsWith('/auth') ||
    path === '/admin/unauthorized'
  ) {
    return { allowed: true };
  }

  // Account route requires authentication
  if (path.startsWith('/account')) {
    if (!userRole) {
      return { allowed: false, redirectTo: '/auth/login?redirect=/account' };
    }
    return { allowed: true };
  }

  // Admin routes require ADMIN or STAFF role
  if (path.startsWith('/admin')) {
    if (!userRole) {
      return { allowed: false, redirectTo: '/auth/login?redirect=/admin' };
    }
    if (userRole === 'CUSTOMER') {
      return { allowed: false, redirectTo: '/admin/unauthorized' };
    }
    if (userRole === 'ADMIN' || userRole === 'STAFF') {
      return { allowed: true };
    }
    return { allowed: false, redirectTo: '/admin/unauthorized' };
  }

  return { allowed: true };
}
