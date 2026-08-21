import { requireRole } from '../../../lib/auth/serverAuth';

export async function handleAdminApi(token: string | null) {
  const authResult = requireRole(token, 'ADMIN');

  if (!authResult.user) {
    return {
      status: authResult.statusCode || 401,
      body: {
        error: authResult.error || 'Accès refusé.',
      },
    };
  }

  return {
    status: 200,
    body: {
      message: 'Accès API d’administration autorisé.',
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        role: authResult.user.role,
      },
    },
  };
}
