import { requireRole } from '../../../lib/auth/serverAuth';
import type { Product } from '../../../types/ecommerce';

export interface AdminProductRequestPayload {
  token: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  product?: Partial<Product>;
  productId?: string;
}

export function handleAdminProductApi(payload: AdminProductRequestPayload) {
  // Check role protection: require ADMIN or STAFF
  const authResult = requireRole(payload.token, 'ADMIN');

  if (!authResult.user) {
    return {
      status: authResult.statusCode || 401,
      body: {
        error: authResult.error || 'Accès refusé.',
      },
    };
  }

  // Validate payload action
  if (payload.action === 'CREATE') {
    if (!payload.product?.name || !payload.product?.price) {
      return {
        status: 400,
        body: { error: 'Payload invalide: Nom et prix obligatoires.' },
      };
    }
    return {
      status: 201,
      body: {
        message: 'Produit créé avec succès par l’administrateur.',
        productId: payload.product.id || `pros-p-${Date.now()}`,
      },
    };
  }

  if (payload.action === 'DELETE') {
    if (!payload.productId) {
      return {
        status: 400,
        body: { error: 'Payload invalide: ID produit requis.' },
      };
    }
    return {
      status: 200,
      body: { message: `Produit ${payload.productId} supprimé du catalogue.` },
    };
  }

  return {
    status: 200,
    body: { message: 'Opération administrateur validée.' },
  };
}
