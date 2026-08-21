export type Role = 'CUSTOMER' | 'ADMIN' | 'STAFF';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
}

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
