import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Permission, RoleDefinition, RbacAuditLog } from '../types/rbac';
import {
  ALL_PERMISSIONS,
  DEFAULT_SYSTEM_ROLES,
  hasPermission as checkHasPermission,
  logRbacAction,
  getRbacAuditLogs,
} from '../lib/server/rbacEngine';

export type UserRole = 'CLIENT' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN' | string;
export type AdminPermission = Permission;

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  avatar?: string;
  role: UserRole;
  roleId?: string;
  isPrimaryAdmin?: boolean;
  permissions: Permission[];
  googleId?: string;
  passwordHash?: string;
  addresses?: any[];
  createdAt: string;
  lastLoginAt?: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

interface AuthContextType {
  currentUser: AdminUser | null;
  staffUsers: AdminUser[];
  registeredUsers: AdminUser[];
  roles: RoleDefinition[];
  auditLogs: RbacAuditLog[];
  login: (email: string, pass: string) => { success: boolean; message?: string; user?: AdminUser };
  loginWithGoogle: (googleData: { email: string; firstName: string; lastName: string; avatar?: string; googleId: string }) => { success: boolean; message?: string; user?: AdminUser; isNewUser?: boolean };
  registerCustomer: (data: { firstName: string; lastName: string; email: string; phone?: string; password?: string }) => { success: boolean; message?: string; user?: AdminUser };
  updateProfile: (data: { firstName: string; lastName: string; phone?: string; birthDate?: string; avatar?: string }) => { success: boolean; message: string; user?: AdminUser };
  changePassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  updateUserAddresses: (addresses: any[]) => void;
  requestPasswordReset: (email: string) => { success: boolean; message: string };
  resetPassword: (email: string, newPass: string) => { success: boolean; message: string };
  logout: () => void;
  createStaffMember: (staffData: { firstName: string; lastName: string; email: string; phone?: string; roleCode: string; customPermissions?: Permission[] }) => { success: boolean; message?: string };
  updateStaffPermissions: (userId: string, permissions: Permission[], status: 'ACTIVE' | 'SUSPENDED', roleCode?: string) => { success: boolean; message?: string };
  deleteStaffMember: (userId: string) => { success: boolean; message?: string };
  toggleStaffStatus: (userId: string) => { success: boolean; message?: string };
  addRole: (role: RoleDefinition) => { success: boolean; message?: string };
  updateRole: (role: RoleDefinition) => { success: boolean; message?: string };
  deleteRole: (roleId: string) => { success: boolean; message?: string };
  duplicateRole: (roleId: string) => { success: boolean; message?: string };
  hasPermission: (permission: Permission) => boolean;
}

const DEFAULT_ADMIN_EMAIL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ADMIN_EMAIL) || 'servicepro.sn@gmail.com';

const PRIMARY_ADMIN: AdminUser = {
  id: 'usr-primary-admin',
  firstName: 'Service',
  lastName: 'Pro',
  email: DEFAULT_ADMIN_EMAIL,
  phone: '+221 77 000 00 00',
  role: 'SUPER_ADMIN',
  roleId: 'role-super-admin',
  isPrimaryAdmin: true,
  permissions: [...ALL_PERMISSIONS],
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: new Date().toISOString(),
  status: 'ACTIVE',
};

const INITIAL_CLIENT_USERS: AdminUser[] = [];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'pros_auth_user_v3';
const STAFF_STORAGE_KEY = 'pros_staff_users_v3';
const CUSTOMER_USERS_STORAGE_KEY = 'pros_customer_users_v3';
const ROLES_STORAGE_KEY = 'pros_rbac_roles_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [roles, setRoles] = useState<RoleDefinition[]>(() => {
    const saved = localStorage.getItem(ROLES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SYSTEM_ROLES;
  });

  const [staffUsers, setStaffUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem(STAFF_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    return [
      PRIMARY_ADMIN,
      {
        id: 'usr-admin-sec',
        firstName: 'Ousmane',
        lastName: 'Sonko (Admin)',
        email: 'admin.ousmane@pros.sn',
        phone: '+221 77 111 22 33',
        role: 'ADMIN',
        roleId: 'role-admin',
        isPrimaryAdmin: false,
        permissions: ALL_PERMISSIONS.filter((p) => p !== 'DELETE_ADMINS' && p !== 'DELETE_ROLES'),
        createdAt: '2026-02-10T10:00:00.000Z',
        lastLoginAt: '2026-08-18T18:30:00.000Z',
        status: 'ACTIVE',
      },
    ];
  });

  const [registeredUsers, setRegisteredUsers] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem(CUSTOMER_USERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_CLIENT_USERS;
  });

  const [auditLogs, setAuditLogs] = useState<RbacAuditLog[]>(() => getRbacAuditLogs());

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem('pros_user_role', currentUser.role);
      localStorage.setItem('pros_user_name', `${currentUser.firstName} ${currentUser.lastName}`);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('pros_user_role');
      localStorage.removeItem('pros_user_name');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffUsers));
  }, [staffUsers]);

  useEffect(() => {
    localStorage.setItem(CUSTOMER_USERS_STORAGE_KEY, JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  }, [roles]);

  // LOGIN FUNCTION WITH ROLE DISPATCHING
  const login = (email: string, pass: string): { success: boolean; message?: string; user?: AdminUser } => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, message: 'Adresse email obligatoire.' };
    }
    
    if (!pass || pass.trim().length === 0) {
      return { success: false, message: 'Mot de passe obligatoire.' };
    }

    // 1. Check Primary Super Admin
    if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      const updated = { ...PRIMARY_ADMIN, lastLoginAt: new Date().toISOString() };
      setCurrentUser(updated);
      logRbacAction(PRIMARY_ADMIN.id, PRIMARY_ADMIN.email, 'ADMIN_LOGIN');
      setAuditLogs(getRbacAuditLogs());
      return { success: true, user: updated };
    }

    // 2. Check Staff Users
    const matchedStaff = staffUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (matchedStaff) {
      if (matchedStaff.status === 'SUSPENDED') {
        logRbacAction(matchedStaff.id, matchedStaff.email, 'ADMIN_ACCESS_DENIED', undefined, 'Status: SUSPENDED');
        setAuditLogs(getRbacAuditLogs());
        return { success: false, message: 'Ce compte administrateur est suspendu.' };
      }
      const updated = { ...matchedStaff, lastLoginAt: new Date().toISOString() };
      setCurrentUser(updated);
      logRbacAction(updated.id, updated.email, 'ADMIN_LOGIN');
      setAuditLogs(getRbacAuditLogs());
      return { success: true, user: updated };
    }

    // 3. Check Customer Users
    const matchedCustomer = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (matchedCustomer) {
      if (matchedCustomer.status === 'SUSPENDED') {
        return { success: false, message: 'Votre compte client est actuellement suspendu. Veuillez contacter le support.' };
      }
      const updated = { ...matchedCustomer, lastLoginAt: new Date().toISOString() };
      setCurrentUser(updated);
      setRegisteredUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      return { success: true, user: updated };
    }

    // If account doesn't exist, return clean user-facing error
    return {
      success: false,
      message: 'Email ou mot de passe incorrect.',
    };
  };

  // GOOGLE OAUTH AUTHENTICATION (AUTHENTIC OAUTH FLOW & CREATION)
  const loginWithGoogle = (googleData: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    googleId: string;
  }): { success: boolean; message?: string; user?: AdminUser; isNewUser?: boolean } => {
    const cleanEmail = googleData.email.trim().toLowerCase();

    // Check if user already exists in staff
    const existingStaff = staffUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingStaff) {
      const updated = { ...existingStaff, avatar: googleData.avatar || existingStaff.avatar, lastLoginAt: new Date().toISOString() };
      setCurrentUser(updated);
      return { success: true, user: updated, isNewUser: false };
    }

    // Check if user already exists in clients
    const existingClient = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingClient) {
      const updated = {
        ...existingClient,
        avatar: googleData.avatar || existingClient.avatar,
        googleId: googleData.googleId || existingClient.googleId,
        lastLoginAt: new Date().toISOString(),
      };
      setCurrentUser(updated);
      setRegisteredUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      return { success: true, user: updated, isNewUser: false };
    }

    // STRICT SECURITY RULE: Public Google Registration ALWAYS creates role = 'CLIENT'
    const newGoogleUser: AdminUser = {
      id: `usr-google-${Date.now()}`,
      firstName: googleData.firstName || 'Client',
      lastName: googleData.lastName || 'PROS',
      email: cleanEmail,
      avatar: googleData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      googleId: googleData.googleId,
      role: 'CLIENT', // MANDATORY CLIENT ROLE
      permissions: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    setRegisteredUsers((prev) => [...prev, newGoogleUser]);
    setCurrentUser(newGoogleUser);
    logRbacAction(newGoogleUser.id, newGoogleUser.email, 'GOOGLE_LOGIN');
    setAuditLogs(getRbacAuditLogs());
    return { success: true, user: newGoogleUser, isNewUser: true };
  };

  // REGISTER NEW CUSTOMER ACCOUNT (STRICT RULE: ALWAYS ROLE = 'CLIENT')
  const registerCustomer = (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password?: string;
  }): { success: boolean; message?: string; user?: AdminUser } => {
    const cleanEmail = data.email.trim().toLowerCase();

    const existing =
      registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail) ||
      staffUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      return { success: false, message: 'Un compte existe déjà avec cette adresse email.' };
    }

    // STRICT SECURITY RULE: Public account registration ALWAYS creates role = 'CLIENT'
    const newCustomer: AdminUser = {
      id: `usr-client-${Date.now()}`,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: cleanEmail,
      phone: data.phone?.trim() || '',
      passwordHash: data.password || 'password_hash_placeholder',
      role: 'CLIENT', // MANDATORY PUBLIC ROLE
      permissions: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    setRegisteredUsers((prev) => [...prev, newCustomer]);
    setCurrentUser(newCustomer);
    logRbacAction(newCustomer.id, newCustomer.email, 'ACCOUNT_CREATED');
    setAuditLogs(getRbacAuditLogs());
    return { success: true, user: newCustomer };
  };

  // REAL UPDATE PROFILE FUNCTION (SECTIONS 8, 9 & 31)
  const updateProfile = (data: {
    firstName: string;
    lastName: string;
    phone?: string;
    birthDate?: string;
    avatar?: string;
  }): { success: boolean; message: string; user?: AdminUser } => {
    if (!currentUser) {
      return { success: false, message: 'Aucune session utilisateur active.' };
    }

    if (!data.firstName || data.firstName.trim().length < 2) {
      return { success: false, message: 'Le prénom doit contenir au moins 2 caractères.' };
    }
    if (!data.lastName || data.lastName.trim().length < 2) {
      return { success: false, message: 'Le nom doit contenir au moins 2 caractères.' };
    }

    const updatedUser: AdminUser = {
      ...currentUser,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone !== undefined ? data.phone.trim() : currentUser.phone || '',
      birthDate: data.birthDate || currentUser.birthDate,
      avatar: data.avatar || currentUser.avatar,
    };

    setCurrentUser(updatedUser);

    if (currentUser.role === 'CLIENT') {
      setRegisteredUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
    } else {
      setStaffUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    localStorage.setItem('pros_user_name', `${updatedUser.firstName} ${updatedUser.lastName}`);

    logRbacAction(updatedUser.id, updatedUser.email, 'PROFILE_UPDATED');
    setAuditLogs(getRbacAuditLogs());

    return {
      success: true,
      message: 'Modifications enregistrées avec succès.',
      user: updatedUser,
    };
  };

  // CHANGE PASSWORD (SECTION 11)
  const changePassword = (
    _currentPass: string,
    newPass: string
  ): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'Aucune session active.' };
    }

    if (!newPass || newPass.trim().length < 6) {
      return { success: false, message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' };
    }

    const updatedUser: AdminUser = {
      ...currentUser,
      passwordHash: newPass,
    };

    setCurrentUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));

    if (currentUser.role === 'CLIENT') {
      setRegisteredUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    } else {
      setStaffUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    }

    logRbacAction(updatedUser.id, updatedUser.email, 'PASSWORD_CHANGED');
    setAuditLogs(getRbacAuditLogs());

    return {
      success: true,
      message: 'Votre mot de passe a été modifié avec succès.',
    };
  };

  // UPDATE ADDRESSES LIST
  const updateUserAddresses = (addressesList: any[]): void => {
    if (!currentUser) return;
    const updatedUser: AdminUser = {
      ...currentUser,
      addresses: addressesList,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    if (currentUser.role === 'CLIENT') {
      setRegisteredUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    }
  };

  // FORGOT PASSWORD REQUEST (SECURITY RULE: DO NOT REVEAL IF EMAIL EXISTS)
  const requestPasswordReset = (_email: string): { success: boolean; message: string } => {
    return {
      success: true,
      message: 'Si un compte correspond à cette adresse, un email de réinitialisation a été envoyé.',
    };
  };

  // RESET PASSWORD ACTION
  const resetPassword = (email: string, newPass: string): { success: boolean; message: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const targetUser =
      registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail) ||
      staffUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (targetUser) {
      const updated = { ...targetUser, passwordHash: newPass, lastLoginAt: new Date().toISOString() };
      setCurrentUser(updated);
      logRbacAction(updated.id, updated.email, 'PASSWORD_RESET');
      setAuditLogs(getRbacAuditLogs());
      return { success: true, message: 'Votre mot de passe a été réinitialisé avec succès.' };
    }

    return { success: true, message: 'Votre mot de passe a été mis à jour.' };
  };

  const logout = () => {
    if (currentUser) {
      logRbacAction(currentUser.id, currentUser.email, 'ADMIN_LOGOUT');
      setAuditLogs(getRbacAuditLogs());
    }
    setCurrentUser(null);
  };

  const createStaffMember = (staffData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    roleCode: string;
    customPermissions?: Permission[];
  }): { success: boolean; message?: string } => {
    const activeAdmin = currentUser || PRIMARY_ADMIN;
    if (activeAdmin.role !== 'SUPER_ADMIN' && !activeAdmin.permissions.includes('CREATE_ADMINS')) {
      return { success: false, message: 'Accès refusé : Permission CREATE_ADMINS requise.' };
    }

    const existing = staffUsers.find((u) => u.email.toLowerCase() === staffData.email.toLowerCase().trim());
    if (existing) {
      return { success: false, message: 'Un administrateur existe déjà avec cet email.' };
    }

    const roleObj = roles.find((r) => r.code === staffData.roleCode || r.id === staffData.roleCode);
    const assignedPermissions = staffData.customPermissions || roleObj?.permissions || ALL_PERMISSIONS;

    const newStaff: AdminUser = {
      id: `usr-admin-${Date.now()}`,
      firstName: staffData.firstName,
      lastName: staffData.lastName,
      email: staffData.email.toLowerCase().trim(),
      phone: staffData.phone || '',
      role: roleObj?.code || staffData.roleCode,
      roleId: roleObj?.id,
      isPrimaryAdmin: false,
      permissions: assignedPermissions,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    setStaffUsers((prev) => [...prev, newStaff]);
    logRbacAction(activeAdmin.id, activeAdmin.email, 'ADMIN_CREATED', newStaff.id, '', newStaff.email);
    setAuditLogs(getRbacAuditLogs());
    return { success: true, message: `Compte administrateur "${newStaff.firstName} ${newStaff.lastName}" créé.` };
  };

  const updateStaffPermissions = (
    userId: string,
    permissions: Permission[],
    status: 'ACTIVE' | 'SUSPENDED',
    roleCode?: string
  ): { success: boolean; message?: string } => {
    const activeAdmin = currentUser || PRIMARY_ADMIN;

    const targetUser = staffUsers.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'Utilisateur introuvable.' };

    if (targetUser.isPrimaryAdmin || targetUser.role === 'SUPER_ADMIN') {
      const superAdmins = staffUsers.filter((u) => u.role === 'SUPER_ADMIN' || u.isPrimaryAdmin);
      if (superAdmins.length <= 1 && status === 'SUSPENDED') {
        return { success: false, message: 'CRITIQUE : Impossible de suspendre le dernier SUPER ADMIN du système.' };
      }
    }

    setStaffUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updatedRole = roleCode || u.role;
          return {
            ...u,
            permissions,
            status,
            role: updatedRole,
            roleId: roles.find((r) => r.code === updatedRole)?.id || u.roleId,
          };
        }
        return u;
      })
    );

    logRbacAction(activeAdmin.id, activeAdmin.email, 'ADMIN_UPDATED', userId, targetUser.status, status);
    setAuditLogs(getRbacAuditLogs());
    return { success: true, message: 'Permissions et statut mis à jour avec succès.' };
  };

  const toggleStaffStatus = (userId: string): { success: boolean; message?: string } => {
    const targetUser = staffUsers.find((u) => u.id === userId);
    if (!targetUser) return { success: false, message: 'Utilisateur introuvable.' };

    const nextStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    return updateStaffPermissions(userId, targetUser.permissions, nextStatus, targetUser.role);
  };

  const deleteStaffMember = (userId: string): { success: boolean; message?: string } => {
    const activeAdmin = currentUser || PRIMARY_ADMIN;
    const targetUser = staffUsers.find((u) => u.id === userId);

    if (!targetUser) return { success: false, message: 'Utilisateur introuvable.' };

    if (targetUser.isPrimaryAdmin || targetUser.role === 'SUPER_ADMIN') {
      const superAdmins = staffUsers.filter((u) => u.role === 'SUPER_ADMIN' || u.isPrimaryAdmin);
      if (superAdmins.length <= 1) {
        return { success: false, message: 'CRITIQUE : Impossible de supprimer le dernier SUPER ADMIN du système.' };
      }
    }

    setStaffUsers((prev) => prev.filter((u) => u.id !== userId));
    logRbacAction(activeAdmin.id, activeAdmin.email, 'ADMIN_DELETED', userId, targetUser.email, '');
    setAuditLogs(getRbacAuditLogs());
    return { success: true, message: `Compte "${targetUser.email}" supprimé.` };
  };

  const addRole = (newRole: RoleDefinition): { success: boolean; message?: string } => {
    const activeAdmin = currentUser || PRIMARY_ADMIN;

    const existing = roles.find((r) => r.code.toUpperCase() === newRole.code.toUpperCase());
    if (existing) {
      return { success: false, message: 'Un rôle existe déjà avec ce code.' };
    }

    setRoles((prev) => [...prev, newRole]);
    logRbacAction(activeAdmin.id, activeAdmin.email, 'ROLE_CREATED', newRole.id, '', newRole.name);
    setAuditLogs(getRbacAuditLogs());
    return { success: true, message: `Rôle "${newRole.name}" créé avec succès.` };
  };

  const updateRole = (updatedRole: RoleDefinition): { success: boolean; message?: string } => {
    const activeAdmin = currentUser || PRIMARY_ADMIN;

    setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));

    setStaffUsers((prev) =>
      prev.map((u) => {
        if (u.role === updatedRole.code || u.roleId === updatedRole.id) {
          return { ...u, permissions: updatedRole.permissions };
        }
        return u;
      })
    );

    logRbacAction(activeAdmin.id, activeAdmin.email, 'ROLE_UPDATED', updatedRole.id, '', updatedRole.name);
    setAuditLogs(getRbacAuditLogs());
    return { success: true, message: `Rôle "${updatedRole.name}" mis à jour.` };
  };

  const deleteRole = (roleId: string): { success: boolean; message?: string } => {
    const activeAdmin = currentUser || PRIMARY_ADMIN;
    const targetRole = roles.find((r) => r.id === roleId);

    if (!targetRole) return { success: false, message: 'Rôle introuvable.' };

    if (targetRole.isSystemRole) {
      return { success: false, message: 'Impossible de supprimer un rôle système par défaut.' };
    }

    const assignedCount = staffUsers.filter((u) => u.role === targetRole.code || u.roleId === targetRole.id).length;
    if (assignedCount > 0) {
      return { success: false, message: `Impossible de supprimer ce rôle : il est actuellement attribué à ${assignedCount} administrateur(s).` };
    }

    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    logRbacAction(activeAdmin.id, activeAdmin.email, 'ROLE_DELETED', roleId, targetRole.name, '');
    setAuditLogs(getRbacAuditLogs());
    return { success: true, message: `Rôle "${targetRole.name}" supprimé.` };
  };

  const duplicateRole = (roleId: string): { success: boolean; message?: string } => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) return { success: false, message: 'Rôle introuvable.' };

    const duplicated: RoleDefinition = {
      ...targetRole,
      id: `role-custom-${Date.now()}`,
      code: `${targetRole.code}_COPY_${Date.now().toString().slice(-4)}`,
      name: `${targetRole.name} (COPIE)`,
      isSystemRole: false,
      createdAt: new Date().toISOString(),
    };

    return addRole(duplicated);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.isPrimaryAdmin;
    return checkHasPermission(currentUser.permissions, permission, isSuperAdmin);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        staffUsers,
        registeredUsers,
        roles,
        auditLogs,
        login,
        loginWithGoogle,
        registerCustomer,
        updateProfile,
        changePassword,
        updateUserAddresses,
        requestPasswordReset,
        resetPassword,
        logout,
        createStaffMember,
        updateStaffPermissions,
        deleteStaffMember,
        toggleStaffStatus,
        addRole,
        updateRole,
        deleteRole,
        duplicateRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
