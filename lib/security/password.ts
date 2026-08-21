import { logger } from '../utils/logger';

/**
 * Basic Hash utility for Phase 1 session management.
 * Note: In production with full Node crypto or bcrypt/argon2, use crypto.scrypt or bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  // Simple deterministic SHA-256 equivalent for Phase 1 session demonstration
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_pros_${Math.abs(hash)}_${password.length}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === storedHash;
}

export function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
