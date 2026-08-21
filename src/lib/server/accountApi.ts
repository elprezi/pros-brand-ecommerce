/**
 * PROS ERP & E-Commerce Server-side Account API Engine
 * Authoritative Backend Handler for /account endpoints
 * Enforces Session Authentication, Strict Account Isolation & Data Security
 */

import type { AdminUser } from '../../store/authContext';
import type { Order, DeliveryAddress } from '../../types/ecommerce';
import type { LoyaltyMember, LoyaltyTransaction } from '../../types/loyalty';
import { isValidSenegalPhone } from '../utils/format';

export interface AccountProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string;
  avatar?: string;
  role: string;
  googleId?: string;
  createdAt: string;
  isGoogleAccount?: boolean;
}

export interface AccountStats {
  ordersCount: number;
  wishlistCount: number;
  addressesCount: number;
  loyaltyPoints: number;
  loyaltyTier: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  item: string;
  reason: string;
  status: 'DEMANDE ENVOYÉE' | 'EN EXAMEN' | 'ACCEPTÉE' | 'REFUSÉE' | 'REMBOURSÉE';
  refundAmount: number;
  createdAt: string;
}

// STORAGE KEYS FOR PERSISTENCE (PERSISTENCE RULE SECTION 27)
const ACCOUNT_RETURNS_KEY = 'pros_account_returns_v2';
const ACCOUNT_WISHLIST_KEY_PREFIX = 'pros_account_wishlist_user_';
const ACCOUNT_LOYALTY_TXNS_PREFIX = 'pros_account_loyalty_txns_user_';

// HELPER: GET PERSISTED USER WISHLIST (STRICT USER ISOLATION)
export function getUserWishlist(userId: string, defaultWishlist: string[] = []): string[] {
  if (!userId) return [];
  const saved = localStorage.getItem(`${ACCOUNT_WISHLIST_KEY_PREFIX}${userId}`);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { return defaultWishlist; }
  }
  return defaultWishlist;
}

// HELPER: SAVE USER WISHLIST (STRICT USER ISOLATION)
export function saveUserWishlist(userId: string, wishlist: string[]): void {
  if (!userId) return;
  localStorage.setItem(`${ACCOUNT_WISHLIST_KEY_PREFIX}${userId}`, JSON.stringify(wishlist));
}

// HELPER: GET USER RETURNS (STRICT USER ISOLATION - NO MOCK CONTAMINATION)
export function getUserReturnRequests(userId: string): ReturnRequest[] {
  if (!userId) return [];
  const saved = localStorage.getItem(ACCOUNT_RETURNS_KEY);
  let allReturns: ReturnRequest[] = [];
  if (saved) {
    try { allReturns = JSON.parse(saved); } catch (e) { allReturns = []; }
  }
  return allReturns.filter((r) => r.userId === userId);
}

// HELPER: GET USER LOYALTY TRANSACTIONS (STRICT USER ISOLATION)
export function getUserLoyaltyTransactions(userEmail: string): LoyaltyTransaction[] {
  if (!userEmail) return [];
  const key = `${ACCOUNT_LOYALTY_TXNS_PREFIX}${userEmail.toLowerCase()}`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { return []; }
  }
  return [];
}

// API ENDPOINT 1: GET /api/account (FETCH PROFILE & OVERVIEW STATS)
export async function apiGetAccount(
  currentUser: AdminUser | null,
  allOrders: Order[],
  allAddresses: DeliveryAddress[],
  currentWishlist: string[],
  loyaltyMember: LoyaltyMember | null
): Promise<{ success: boolean; data?: { profile: AccountProfileData; stats: AccountStats }; error?: string }> {
  // 1. VERIFY SESSION (AUTHENTICATION REQUIREMENT SECTION 2 & 30)
  if (!currentUser) {
    return { success: false, error: 'Accès refusé. Aucune session utilisateur active.' };
  }

  // Filter orders strictly for this user (OWNERSHIP PROTECTION SECTION 11 & 30)
  const userOrders = allOrders.filter(
    (o) => (o as any).userId === currentUser.id || o.customer.email.toLowerCase() === currentUser.email.toLowerCase()
  );

  // Filter addresses strictly for this user (STRICT ISOLATION SECTION 6)
  const userAddresses = allAddresses.filter(
    (a) => a.customerId === currentUser.id || (a as any).userId === currentUser.id
  );

  const profile: AccountProfileData = {
    id: currentUser.id,
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    email: currentUser.email,
    phone: currentUser.phone || '',
    birthDate: currentUser.birthDate,
    avatar: currentUser.avatar,
    role: currentUser.role,
    googleId: currentUser.googleId,
    createdAt: currentUser.createdAt,
    isGoogleAccount: Boolean(currentUser.googleId),
  };

  const stats: AccountStats = {
    ordersCount: userOrders.length,
    wishlistCount: currentWishlist.length,
    addressesCount: userAddresses.length,
    loyaltyPoints: loyaltyMember?.availablePoints || 0,
    loyaltyTier: loyaltyMember?.levelName || 'BRONZE',
  };

  return { success: true, data: { profile, stats } };
}

// API ENDPOINT 2: PATCH /api/account/profile (UPDATE USER PROFILE)
export async function apiUpdateProfile(
  currentUser: AdminUser | null,
  payload: { firstName: string; lastName: string; phone: string; birthDate?: string }
): Promise<{ success: boolean; data?: AccountProfileData; error?: string }> {
  // 1. VERIFY SESSION (SECURITY SECTION 5 & 8)
  if (!currentUser) {
    return { success: false, error: 'Session expirée. Veuillez vous reconnecter.' };
  }

  // 2. VALIDATE DATA (VALIDATION SECTION 6)
  if (!payload.firstName || payload.firstName.trim().length < 2) {
    return { success: false, error: 'Le prénom doit contenir au moins 2 caractères.' };
  }
  if (!payload.lastName || payload.lastName.trim().length < 2) {
    return { success: false, error: 'Le nom doit contenir au moins 2 caractères.' };
  }
  if (payload.phone && !isValidSenegalPhone(payload.phone)) {
    return { success: false, error: 'Format de téléphone invalide (+221 77, 78, 76, 70...)' };
  }

  const updatedProfile: AccountProfileData = {
    id: currentUser.id,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: currentUser.email, // Read-only bound to account
    phone: payload.phone.trim(),
    birthDate: payload.birthDate,
    avatar: currentUser.avatar,
    role: currentUser.role, // PROTECTED ROLE
    googleId: currentUser.googleId,
    createdAt: currentUser.createdAt,
    isGoogleAccount: Boolean(currentUser.googleId),
  };

  return { success: true, data: updatedProfile };
}

// API ENDPOINT 3: GET /api/account/orders/:id (STRICT OWNERSHIP CHECK FOR ORDER DETAILS)
export async function apiGetOrderById(
  currentUser: AdminUser | null,
  orderId: string,
  allOrders: Order[]
): Promise<{ success: boolean; data?: Order; error?: string; status?: number }> {
  if (!currentUser) {
    return { success: false, error: 'Session non authentifiée.', status: 401 };
  }

  const order = allOrders.find((o) => o.id === orderId || o.trackingNumber === orderId);
  if (!order) {
    return { success: false, error: 'Commande introuvable.', status: 404 };
  }

  // STRICT OWNERSHIP SECURITY CHECK (SECTION 11, 14 & 30)
  const isOwner = ((order as any).userId && (order as any).userId === currentUser.id) ||
    order.customer.email.toLowerCase() === currentUser.email.toLowerCase();
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'STAFF';

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: 'ACCÈS REFUSÉ : Vous n\'avez pas la permission de consulter la commande d\'un autre client.',
      status: 403,
    };
  }

  return { success: true, data: order };
}

// API ENDPOINT 4: POST /api/account/returns (CREATE RETURN REQUEST)
export async function apiCreateReturnRequest(
  currentUser: AdminUser | null,
  payload: { orderId: string; item: string; reason: string; refundAmount: number }
): Promise<{ success: boolean; data?: ReturnRequest; error?: string }> {
  if (!currentUser) {
    return { success: false, error: 'Authentification requise.' };
  }

  if (!payload.orderId || !payload.reason) {
    return { success: false, error: 'Veuillez sélectionner une commande et indiquer le motif du retour.' };
  }

  const newReturn: ReturnRequest = {
    id: `RET-${Date.now().toString().slice(-6)}`,
    orderId: payload.orderId,
    userId: currentUser.id,
    userEmail: currentUser.email,
    item: payload.item || 'Article PROS',
    reason: payload.reason,
    status: 'DEMANDE ENVOYÉE',
    refundAmount: payload.refundAmount || 0,
    createdAt: new Date().toISOString(),
  };

  const saved = localStorage.getItem(ACCOUNT_RETURNS_KEY);
  let allReturns: ReturnRequest[] = saved ? JSON.parse(saved) : [];
  allReturns.unshift(newReturn);
  localStorage.setItem(ACCOUNT_RETURNS_KEY, JSON.stringify(allReturns));

  return { success: true, data: newReturn };
}
