import React, { useState, useMemo, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { useAuth } from '../../store/authContext';
import { MODULE_PERMISSION_GROUPS, ALL_PERMISSIONS, getPermissionStats, auditRolesPermissions } from '../../lib/server/rbacEngine';
import type { Permission, RoleDefinition } from '../../types/rbac';
import type { AdminUser } from '../../store/authContext';
import {
  ShieldCheck,
  UserPlus,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Shield,
  X,
  Check,
  AlertCircle,
  FileText,
  Download,
  Search,
} from 'lucide-react';

export const AdminRolesPage: React.FC = () => {
  const {
    currentUser,
    staffUsers,
    roles,
    auditLogs,
    createStaffMember,
    updateStaffPermissions,
    deleteStaffMember,
    toggleStaffStatus,
    addRole,
    updateRole,
    deleteRole,
    duplicateRole,
  } = useAuth();

  // Active Tab: Roles Matrix, Staff Directory, Audit Logs
  const [activeTab, setActiveTab] = useState<'roles' | 'staff' | 'logs'>('roles');

  // Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleForm, setRoleForm] = useState<{
    name: string;
    code: string;
    description: string;
    permissions: Permission[];
  }>({
    name: '',
    code: '',
    description: '',
    permissions: [],
  });

  // Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AdminUser | null>(null);
  const [staffForm, setStaffForm] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    roleCode: string;
    status: 'ACTIVE' | 'SUSPENDED';
    permissions: Permission[];
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleCode: 'ADMIN',
    status: 'ACTIVE',
    permissions: [],
  });

  // Confirm Delete Dialog State
  const [itemToDelete, setItemToDelete] = useState<{ type: 'role' | 'staff'; id: string; name: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audit Filter & CSV Export
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        !logSearchQuery ||
        log.adminEmail.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        (log.targetId && log.targetId.toLowerCase().includes(logSearchQuery.toLowerCase()));

      const matchAction = logActionFilter === 'ALL' || log.action === logActionFilter;

      return matchSearch && matchAction;
    });
  }, [auditLogs, logSearchQuery, logActionFilter]);

  const handleExportLogsCsv = () => {
    const headers = ['ID', 'Date', 'Administrateur', 'Action', 'Type Cible', 'ID Cible', 'Ancienne Valeur', 'Nouvelle Valeur', 'IP Address', 'Statut'];
    const rows = filteredLogs.map((log) => [
      log.id,
      new Date(log.timestamp).toLocaleString('fr-FR'),
      log.adminEmail,
      log.action,
      log.targetType || 'SYSTEM',
      log.targetId || '-',
      log.oldValue || '-',
      log.newValue || '-',
      log.ipAddress || '127.0.0.1',
      log.status || 'SUCCESS',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PROS_RBAC_SECURITY_LOGS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run automated RBAC audit on mount
  useEffect(() => {
    auditRolesPermissions(roles, staffUsers);
  }, [roles, staffUsers]);

  // Handle Role Creation / Edition Form Submit
  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!roleForm.name.trim() || !roleForm.code.trim()) {
      setErrorMsg('Veuillez remplir le nom et le code du rôle.');
      return;
    }

    if (editingRole) {
      const res = updateRole({
        ...editingRole,
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        updatedAt: new Date().toISOString(),
      });
      if (!res.success) {
        setErrorMsg(res.message || 'Erreur lors de la mise à jour.');
        return;
      }
      setSuccessMsg(`Rôle "${roleForm.name}" mis à jour.`);
    } else {
      const res = addRole({
        id: `role-custom-${Date.now()}`,
        code: roleForm.code.toUpperCase().replace(/\s+/g, '_'),
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        isSystemRole: false,
        createdAt: new Date().toISOString(),
      });
      if (!res.success) {
        setErrorMsg(res.message || 'Erreur lors de la création.');
        return;
      }
      setSuccessMsg(`Nouveau rôle "${roleForm.name}" créé avec succès.`);
    }

    setIsRoleModalOpen(false);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Open Create Role Modal
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      code: 'CUSTOM_ROLE',
      description: '',
      permissions: ['VIEW_DASHBOARD', 'VIEW_PRODUCTS', 'VIEW_ORDERS'],
    });
    setIsRoleModalOpen(true);
  };

  // Open Edit Role Modal
  const handleOpenEditRole = (role: RoleDefinition) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      code: role.code,
      description: role.description,
      permissions: [...role.permissions],
    });
    setIsRoleModalOpen(true);
  };

  // Toggle Single Permission in Role Form
  const handleTogglePermission = (perm: Permission) => {
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(perm);
      let updated = exists ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm];
      return { ...prev, permissions: updated };
    });
  };

  // Select / Deselect All Permissions in a Module Group
  const handleToggleGroupPermissions = (groupPermissions: Permission[]) => {
    setRoleForm((prev) => {
      const allSelected = groupPermissions.every((p) => prev.permissions.includes(p));
      let updated: Permission[];
      if (allSelected) {
        updated = prev.permissions.filter((p) => !groupPermissions.includes(p));
      } else {
        const set = new Set([...prev.permissions, ...groupPermissions]);
        updated = Array.from(set);
      }
      return { ...prev, permissions: updated };
    });
  };

  // Open Staff Create Modal
  const handleOpenCreateStaff = () => {
    setEditingStaff(null);
    const defaultRole = roles.find((r) => r.code === 'ADMIN') || roles[0];
    setStaffForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '+221 ',
      roleCode: defaultRole.code,
      status: 'ACTIVE',
      permissions: defaultRole.permissions,
    });
    setIsStaffModalOpen(true);
  };

  // Open Staff Edit Modal
  const handleOpenEditStaff = (user: AdminUser) => {
    setEditingStaff(user);
    setStaffForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      roleCode: user.role,
      status: user.status,
      permissions: user.permissions,
    });
    setIsStaffModalOpen(true);
  };

  // Staff Submit
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (editingStaff) {
      const res = updateStaffPermissions(editingStaff.id, staffForm.permissions, staffForm.status, staffForm.roleCode);
      if (!res.success) {
        setErrorMsg(res.message || 'Erreur lors de la modification.');
        return;
      }
      setSuccessMsg(`Fiche administrateur de "${staffForm.firstName} ${staffForm.lastName}" mise à jour.`);
    } else {
      const res = createStaffMember({
        firstName: staffForm.firstName,
        lastName: staffForm.lastName,
        email: staffForm.email,
        phone: staffForm.phone,
        roleCode: staffForm.roleCode,
        customPermissions: staffForm.permissions,
      });
      if (!res.success) {
        setErrorMsg(res.message || 'Erreur lors de la création.');
        return;
      }
      setSuccessMsg(`Nouvel administrateur "${staffForm.firstName} ${staffForm.lastName}" créé.`);
    }

    setIsStaffModalOpen(false);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'role') {
      const res = deleteRole(itemToDelete.id);
      if (!res.success) {
        setErrorMsg(res.message || 'Erreur lors de la suppression.');
      } else {
        setSuccessMsg(res.message || 'Rôle supprimé.');
      }
    } else if (itemToDelete.type === 'staff') {
      const res = deleteStaffMember(itemToDelete.id);
      if (!res.success) {
        setErrorMsg(res.message || 'Erreur lors de la suppression.');
      } else {
        setSuccessMsg(res.message || 'Administrateur supprimé.');
      }
    }

    setItemToDelete(null);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Page Header */}
        <AdminPageHeader
          eyebrow="SÉCURITÉ & HABILITATIONS"
          title="GESTION DES RÔLES ET PERMISSIONS (RBAC)"
          description="Définissez les privilèges d'accès par module (Produits, Stock, Commandes, Clients) et gérez l'annuaire des administrateurs PROS."
          primaryAction={
            <div className="flex items-center gap-3 font-sans">
              <button
                onClick={handleOpenCreateRole}
                className="px-4 py-2.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm font-sans"
              >
                <Plus size={16} />
                <span>NOUVEAU RÔLE</span>
              </button>
              <button
                onClick={handleOpenCreateStaff}
                className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md font-sans"
              >
                <UserPlus size={16} />
                <span>AJOUTER UN ADMINISTRATEUR</span>
              </button>
            </div>
          }
        />

        {/* Global Primary Admin Banner */}
        <div className="p-4 bg-pros-bone border border-neutral-300 font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} className="text-emerald-600 flex-shrink-0" />
            <div>
              <div className="font-bold text-black text-xs uppercase">
                ADMINISTRATEUR PRINCIPAL SYSTÈME : {currentUser?.email || 'servicepro.sn@gmail.com'}
              </div>
              <p className="text-[11px] text-neutral-600 font-sans mt-0.5">
                Ce compte détient le privilège SUPER ADMIN immuable. Le dernier Super Admin est automatiquement protégé contre la suppression ou le blocage.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-pros-black text-pros-gold font-bold text-[10px] uppercase font-mono tracking-wider flex-shrink-0">
            ★ PROTÉGÉ
          </span>
        </div>

        {/* Banners for Messages */}
        {successMsg && (
          <div className="p-4 bg-green-100 border border-green-300 text-green-900 text-xs font-bold flex items-center justify-between animate-fade-in font-sans">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-green-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-100 border border-red-300 text-red-900 text-xs font-bold flex items-center justify-between animate-fade-in font-sans">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 gap-2 font-sans">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-5 py-3 font-bold text-xs uppercase cursor-pointer transition-colors border-b-2 font-sans ${
              activeTab === 'roles' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            MATRICE DES RÔLES ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-5 py-3 font-bold text-xs uppercase cursor-pointer transition-colors border-b-2 font-sans ${
              activeTab === 'staff' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            ANNUAIRE DES ADMINISTRATEURS ({staffUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-5 py-3 font-bold text-xs uppercase cursor-pointer transition-colors border-b-2 font-sans ${
              activeTab === 'logs' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            JOURNAL D'AUDIT & SÉCURITÉ ({auditLogs.length})
          </button>
        </div>

        {/* TAB 1: ROLES MATRIX */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
            {roles.map((role) => {
              const assignedUsersCount = staffUsers.filter((u) => u.role === role.code || u.roleId === role.id).length;
              return (
                <div key={role.id} className="bg-white border border-neutral-200 p-5 space-y-4 shadow-sm flex flex-col justify-between font-sans">
                  
                  <div className="space-y-2 font-sans">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 font-mono block uppercase">{role.code}</span>
                        <h3 className="font-display font-bold text-base uppercase text-black">{role.name}</h3>
                      </div>
                      {role.isSystemRole ? (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-pros-bone text-neutral-700 border border-neutral-300 font-sans">
                          SISTÈME
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-sans">
                          PERSONNALISÉ
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed font-sans min-h-[36px]">
                      {role.description}
                    </p>

                    <div className="pt-2 border-t border-neutral-100 text-[11px] font-sans flex items-center justify-between">
                      <span className="text-neutral-500">Permissions accordées:</span>
                      <span className="font-bold font-mono text-black">
                        {getPermissionStats(role).granted} / {getPermissionStats(role).total}
                      </span>
                    </div>

                    <div className="text-[11px] font-sans flex items-center justify-between">
                      <span className="text-neutral-500">Admins assignés:</span>
                      <span className="font-bold text-black">{assignedUsersCount} membre(s)</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 flex items-center justify-between gap-2 font-sans">
                    <button
                      onClick={() => duplicateRole(role.id)}
                      className="px-3 py-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black text-[11px] font-bold uppercase flex items-center gap-1 cursor-pointer font-sans"
                      title="Dupliquer ce rôle"
                    >
                      <Copy size={12} /> DUPLIQUER
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditRole(role)}
                        className="px-3 py-1.5 bg-pros-black text-white text-[11px] font-bold uppercase hover:bg-neutral-800 flex items-center gap-1 cursor-pointer font-sans"
                        title="Éditer les permissions"
                      >
                        <Edit2 size={12} /> ÉDITER
                      </button>

                      {!role.isSystemRole && (
                        <button
                          onClick={() => setItemToDelete({ type: 'role', id: role.id, name: role.name })}
                          className="p-1.5 bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 cursor-pointer"
                          title="Supprimer le rôle"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: STAFF DIRECTORY */}
        {activeTab === 'staff' && (
          <div className="bg-white border border-neutral-200 shadow-sm font-sans">
            <div className="overflow-x-auto font-sans">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-pros-bone border-b border-neutral-200 text-[10px] font-bold text-black uppercase font-sans">
                  <tr>
                    <th className="p-3">ADMINISTRATEUR</th>
                    <th className="p-3">EMAIL & CONTACT</th>
                    <th className="p-3 text-center">RÔLE ACCORDÉ</th>
                    <th className="p-3 text-center">STATUT</th>
                    <th className="p-3">DERNIÈRE CONNEXION</th>
                    <th className="p-3 text-right">ACTIONS SÉCURITÉ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs font-sans">
                  {staffUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-pros-bone/70 transition-colors font-sans">
                      <td className="p-3 align-top">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-pros-black text-pros-gold font-bold text-xs flex items-center justify-center">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-black uppercase text-xs">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.isPrimaryAdmin && (
                              <span className="text-[9px] text-pros-gold font-bold font-mono uppercase block">★ SUPER ADMIN</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 align-top font-mono">
                        <div className="text-black font-bold">{user.email}</div>
                        <div className="text-[10px] text-neutral-500">{user.phone || 'Non renseigné'}</div>
                      </td>

                      <td className="p-3 align-top text-center">
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-neutral-100 border border-neutral-300 text-black uppercase font-sans">
                          {user.role}
                        </span>
                      </td>

                      <td className="p-3 align-top text-center">
                        {user.status === 'ACTIVE' ? (
                          <span className="px-2.5 py-1 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase font-sans">
                            ACTIF
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase font-sans">
                            SUSPENDU
                          </span>
                        )}
                      </td>

                      <td className="p-3 align-top font-mono text-[11px]">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('fr-FR') : 'Jamais'}
                      </td>

                      <td className="p-3 align-top text-right space-x-1.5 font-sans">
                        {user.isPrimaryAdmin ? (
                          <span className="px-2 py-1 bg-pros-black text-pros-gold text-[10px] font-bold uppercase font-mono">
                            PROTÉGÉ
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEditStaff(user)}
                              className="px-2.5 py-1 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-[10px] uppercase cursor-pointer"
                              title="Modifier les privilèges"
                            >
                              MODIFIER
                            </button>
                            <button
                              onClick={() => toggleStaffStatus(user.id)}
                              className={`p-1.5 border cursor-pointer inline-flex items-center ${
                                user.status === 'SUSPENDED' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-900'
                              }`}
                              title={user.status === 'SUSPENDED' ? 'Réactiver le compte' : 'Suspendre le compte'}
                            >
                              {user.status === 'SUSPENDED' ? <Unlock size={14} /> : <Lock size={14} />}
                            </button>
                            <button
                              onClick={() => setItemToDelete({ type: 'staff', id: user.id, name: user.email })}
                              className="p-1.5 bg-red-50 border border-red-300 hover:bg-red-100 text-red-600 cursor-pointer"
                              title="Supprimer l'administrateur"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-neutral-200 shadow-sm p-4 font-sans space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-200">
              <h3 className="font-display font-bold text-xs uppercase text-black tracking-wider flex items-center gap-2">
                <FileText size={16} /> JOURNAL CHRONOLOGIQUE D'AUDIT & SÉCURITÉ ({filteredLogs.length} LOGS)
              </h3>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Rechercher admin, action..."
                    className="pl-8 pr-3 py-1.5 bg-pros-bone border border-neutral-300 text-black text-xs font-sans focus:outline-none focus:border-black w-48 sm:w-64"
                  />
                </div>

                {/* Filter */}
                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="bg-pros-bone border border-neutral-300 px-3 py-1.5 text-black text-xs font-bold font-sans uppercase focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TOUTES LES ACTIONS</option>
                  <option value="ADMIN_LOGIN">ADMIN_LOGIN</option>
                  <option value="ADMIN_LOGOUT">ADMIN_LOGOUT</option>
                  <option value="ROLE_CREATED">ROLE_CREATED</option>
                  <option value="ROLE_UPDATED">ROLE_UPDATED</option>
                  <option value="ROLE_DELETED">ROLE_DELETED</option>
                  <option value="ADMIN_CREATED">ADMIN_CREATED</option>
                  <option value="ADMIN_UPDATED">ADMIN_UPDATED</option>
                  <option value="ADMIN_DELETED">ADMIN_DELETED</option>
                  <option value="ADMIN_ACCESS_DENIED">ADMIN_ACCESS_DENIED</option>
                </select>

                {/* CSV Export */}
                <button
                  onClick={handleExportLogsCsv}
                  className="px-3 py-1.5 bg-pros-black text-white text-xs font-bold uppercase flex items-center gap-1.5 hover:bg-neutral-800 cursor-pointer shadow-sm"
                >
                  <Download size={14} />
                  <span>EXPORTER CSV</span>
                </button>
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 font-sans">
                Aucun événement d'audit ne correspond à vos filtres.
              </div>
            ) : (
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-pros-bone border-b border-neutral-200 text-[10px] font-bold text-black uppercase font-sans">
                    <tr>
                      <th className="p-3">DATE & HEURE</th>
                      <th className="p-3">ADMINISTRATEUR</th>
                      <th className="p-3">ACTION SÉCURITÉ</th>
                      <th className="p-3">CIBLE / APPLIQUÉ À</th>
                      <th className="p-3">ANCIENNE VALEUR</th>
                      <th className="p-3">NOUVELLE VALEUR</th>
                      <th className="p-3">ADRESSE IP</th>
                      <th className="p-3 text-center">STATUT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-xs font-sans">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-pros-bone/60 transition-colors font-sans">
                        <td className="p-3 align-top font-mono text-[11px] text-neutral-600">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </td>

                        <td className="p-3 align-top font-bold text-black">
                          {log.adminEmail}
                        </td>

                        <td className="p-3 align-top">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-neutral-100 border border-neutral-300 text-black font-mono">
                            {log.action}
                          </span>
                        </td>

                        <td className="p-3 align-top font-mono text-neutral-700">
                          {log.targetId || log.targetType || '-'}
                        </td>

                        <td className="p-3 align-top font-mono text-neutral-500 text-[11px]">
                          {log.oldValue || '-'}
                        </td>

                        <td className="p-3 align-top font-mono text-neutral-800 text-[11px] font-bold">
                          {log.newValue || '-'}
                        </td>

                        <td className="p-3 align-top font-mono text-[11px] text-neutral-500">
                          {log.ipAddress || '127.0.0.1'}
                        </td>

                        <td className="p-3 align-top text-center">
                          {log.status === 'DENIED' ? (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 font-sans">
                              REFUSÉ
                            </span>
                          ) : log.status === 'WARNING' ? (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 font-sans">
                              AVERTISSEMENT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-sans">
                              SUCCÈS
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ROLE CREATE / EDIT MODAL (GRANULAR 14 MODULES EDITOR) */}
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-4xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[92vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="font-display font-bold text-lg uppercase text-black flex items-center gap-2">
                  <Shield size={20} className="text-pros-gold" />
                  <span>{editingRole ? `ÉDITER LE RÔLE : ${editingRole.name}` : 'CRÉER UN RÔLE PERSONNALISÉ'}</span>
                </h3>
                <button onClick={() => setIsRoleModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleRoleSubmit} className="space-y-6 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">INTITULÉ DU RÔLE *</label>
                    <input
                      type="text"
                      required
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      placeholder="ex: GESTIONNAIRE MARKETING"
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="font-bold uppercase text-black block mb-1">CODE IDENTIFIANT *</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingRole?.isSystemRole}
                      value={roleForm.code}
                      onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                      placeholder="ex: MARKETING_MANAGER"
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-mono focus:outline-none focus:border-black disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase text-black block mb-1">DESCRIPTION DU RÔLE</label>
                  <textarea
                    rows={2}
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    placeholder="Description du périmètre fonctionnel..."
                    className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-black font-sans focus:outline-none focus:border-black"
                  />
                </div>

                {/* 14 Granular Module Permission Checklist */}
                <div className="space-y-4 pt-4 border-t border-neutral-200 font-sans">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-xs uppercase text-black tracking-wider">
                      MATRICE DES {ALL_PERMISSIONS.length} PERMISSIONS (PAR MODULE)
                    </h4>
                    <span className="font-mono text-xs font-bold text-pros-gold">
                      {new Set(roleForm.permissions).size} / {ALL_PERMISSIONS.length} sélectionnées
                    </span>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {MODULE_PERMISSION_GROUPS.map((group) => {
                      const groupPermissionIds = group.permissions.map((p) => p.id);
                      const allGroupSelected = groupPermissionIds.every((id) => roleForm.permissions.includes(id));

                      return (
                        <div key={group.id} className="p-4 border border-neutral-200 bg-pros-bone/50 space-y-3 font-sans">
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                            <span className="font-bold text-black uppercase text-xs tracking-wider">{group.name}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleGroupPermissions(groupPermissionIds)}
                              className="text-[10px] font-bold text-pros-gold hover:underline uppercase cursor-pointer"
                            >
                              {allGroupSelected ? 'TOUT DÉSÉLECTIONNER' : '[✓] TOUT SÉLECTIONNER'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {group.permissions.map((permOpt) => {
                              const isChecked = roleForm.permissions.includes(permOpt.id);
                              return (
                                <label
                                  key={permOpt.id}
                                  className={`p-2.5 border flex items-start gap-2 cursor-pointer transition-colors ${
                                    isChecked ? 'bg-white border-black font-bold shadow-sm' : 'bg-white/60 border-neutral-200 text-neutral-500'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleTogglePermission(permOpt.id)}
                                    className="mt-0.5 accent-pros-black cursor-pointer"
                                  />
                                  <div>
                                    <div className="text-black text-xs font-sans">{permOpt.label}</div>
                                    <div className="text-[10px] text-neutral-500 font-sans">{permOpt.description}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(false)}
                    className="px-5 py-2.5 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                  >
                    ANNULER
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer"
                  >
                    ENREGISTRER LE RÔLE
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* STAFF CREATE / EDIT MODAL */}
        {isStaffModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-xl w-full p-8 space-y-6 text-black font-sans shadow-2xl">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="font-display font-bold text-lg uppercase text-black">
                  {editingStaff ? `MODIFIER COMPTE : ${editingStaff.email}` : 'AJOUTER UN ADMINISTRATEUR'}
                </h3>
                <button onClick={() => setIsStaffModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">PRÉNOM *</label>
                    <input
                      type="text"
                      required
                      value={staffForm.firstName}
                      onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold uppercase text-black block mb-1">NOM *</label>
                    <input
                      type="text"
                      required
                      value={staffForm.lastName}
                      onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                      className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase text-black block mb-1">EMAIL PRO *</label>
                  <input
                    type="email"
                    required
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-black block mb-1">RÔLE ET MATRICE ACCORDÉE</label>
                  <select
                    value={staffForm.roleCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const selectedRoleObj = roles.find((r) => r.code === code);
                      setStaffForm({
                        ...staffForm,
                        roleCode: code,
                        permissions: selectedRoleObj?.permissions || staffForm.permissions,
                      });
                    }}
                    className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black font-sans font-bold uppercase focus:outline-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.name} ({r.permissions.length} PERMISSIONS)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsStaffModalOpen(false)}
                    className="px-5 py-2.5 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                  >
                    ANNULER
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer"
                  >
                    {editingStaff ? 'ENREGISTRER' : 'CRÉER LE COMPTE'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM DIALOG */}
        <AdminConfirmDialog
          isOpen={!!itemToDelete}
          title="CONFIRMATION DE SUPPRESSION"
          message={`Êtes-vous sûr de vouloir supprimer définitivement ${itemToDelete?.type === 'role' ? 'le rôle' : 'l\'administrateur'} "${itemToDelete?.name}" ? cette action est irréversible.`}
          confirmText="SUPPRIMER DÉFINITIVEMENT"
          onConfirm={handleConfirmDelete}
          onCancel={() => setItemToDelete(null)}
        />

      </div>
    </AdminLayout>
  );
};
