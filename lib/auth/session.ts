import type { Role } from '@prisma/client';

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
}

// In-memory demo sessions & token engine for Phase 1
const activeSessions = new Map<string, UserSession>();

export function createSession(token: string, session: UserSession) {
  activeSessions.set(token, session);
}

export function getSession(token: string): UserSession | null {
  return activeSessions.get(token) || null;
}

export function destroySession(token: string) {
  activeSessions.delete(token);
}
