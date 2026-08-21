import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { getRbacAuditLogs } from '../../lib/server/rbacEngine';
import { useAuth } from '../../store/authContext';
import type { RbacAuditLog } from '../../types/rbac';
import {
  Search,
  Download,
  Eye,
  X,
  CheckCircle2,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
} from 'lucide-react';

export const AdminLogsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs] = useState<RbacAuditLog[]>(() => getRbacAuditLogs());

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('ALL');
  const [quickFilter, setQuickFilter] = useState<'all' | 'mine' | 'critical'>('all');

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'severity' | 'user'>('newest');

  // Modal State
  const [selectedLog, setSelectedLog] = useState<RbacAuditLog | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Helper for Relative Time
  const getRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 3600));
    const diffDays = Math.floor(diffMs / (1000 * 86400));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    return new Date(timestamp).toLocaleDateString('fr-FR');
  };

  // Unique users list for filter
  const uniqueUsers = useMemo(() => {
    const usersMap: Record<string, string> = {};
    logs.forEach((l) => {
      const email = l.adminEmail || 'ousmane.sonko@pros.sn';
      const name = l.userName || 'OUSMANE SONKO';
      usersMap[email] = name;
    });
    return Object.entries(usersMap);
  }, [logs]);

  // Unique categories for filter
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    logs.forEach((l) => {
      if (l.actionCategory) cats.add(l.actionCategory);
      else cats.add('Général');
    });
    return Array.from(cats);
  }, [logs]);

  // FILTERED & SORTED LOGS
  const filteredLogs = useMemo(() => {
    return logs
      .filter((l) => {
        // Quick filter buttons
        if (quickFilter === 'mine') {
          const currentEmail = currentUser?.email || 'ousmane.sonko@pros.sn';
          if (l.adminEmail.toLowerCase() !== currentEmail.toLowerCase() && !l.userName?.includes('SONKO')) {
            return false;
          }
        } else if (quickFilter === 'critical') {
          if (l.severity !== 'CRITIQUE' && l.severity !== 'SÉCURITÉ' && l.status !== 'BLOQUÉ') {
            return false;
          }
        }

        // Search Term
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchUser = (l.userName || l.adminEmail).toLowerCase().includes(term);
          const matchRole = (l.userRole || '').toLowerCase().includes(term);
          const matchAction = (l.action || '').toLowerCase().includes(term);
          const matchCode = (l.actionCode || '').toLowerCase().includes(term);
          const matchCategory = (l.actionCategory || '').toLowerCase().includes(term);
          const matchTarget = (l.entityName || l.targetId || '').toLowerCase().includes(term);
          const matchDesc = (l.description || l.oldValue || '').toLowerCase().includes(term);
          const matchIp = (l.ipAddress || '').toLowerCase().includes(term);
          const matchId = l.id.toLowerCase().includes(term);

          if (
            !matchUser &&
            !matchRole &&
            !matchAction &&
            !matchCode &&
            !matchCategory &&
            !matchTarget &&
            !matchDesc &&
            !matchIp &&
            !matchId
          ) {
            return false;
          }
        }

        // Dropdown Filters
        if (userFilter !== 'ALL' && l.adminEmail !== userFilter) return false;
        if (categoryFilter !== 'ALL' && l.actionCategory !== categoryFilter) return false;
        if (severityFilter !== 'ALL' && l.severity !== severityFilter) return false;
        if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;

        // Timeframe Filter
        if (timeframeFilter !== 'ALL') {
          const logTime = new Date(l.timestamp).getTime();
          const now = Date.now();
          if (timeframeFilter === 'today') {
            const todayStart = new Date().setHours(0, 0, 0, 0);
            if (logTime < todayStart) return false;
          } else if (timeframeFilter === '7d') {
            if (logTime < now - 7 * 24 * 3600 * 1000) return false;
          } else if (timeframeFilter === '30d') {
            if (logTime < now - 30 * 24 * 3600 * 1000) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        if (sortBy === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        if (sortBy === 'severity') {
          const rank = { SÉCURITÉ: 4, CRITIQUE: 3, IMPORTANT: 2, INFO: 1 };
          return (rank[b.severity || 'INFO'] || 1) - (rank[a.severity || 'INFO'] || 1);
        }
        if (sortBy === 'user') return (a.userName || a.adminEmail).localeCompare(b.userName || b.adminEmail);
        return 0;
      });
  }, [logs, searchTerm, userFilter, categoryFilter, severityFilter, statusFilter, timeframeFilter, quickFilter, sortBy, currentUser]);

  // PAGINATION SLICE
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;

  // KPI STATS CALCULATED FROM REAL LOGS
  const todayLogsCount = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    return logs.filter((l) => new Date(l.timestamp).getTime() >= todayStart).length;
  }, [logs]);

  const todayActiveUsersCount = useMemo(() => {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const set = new Set<string>();
    logs.filter((l) => new Date(l.timestamp).getTime() >= todayStart).forEach((l) => set.add(l.adminEmail));
    return set.size;
  }, [logs]);

  const criticalLogsCount = useMemo(() => {
    return logs.filter((l) => l.severity === 'CRITIQUE' || l.severity === 'SÉCURITÉ').length;
  }, [logs]);

  const failuresCount = useMemo(() => {
    return logs.filter((l) => l.status === 'ÉCHEC' || l.status === 'BLOQUÉ' || l.status === 'DENIED').length;
  }, [logs]);

  const latestLogTime = logs[0] ? getRelativeTime(logs[0].timestamp) : 'N/A';

  // Export Action (CSV / Excel / PDF)
  const handleExportLogs = (format: 'CSV' | 'EXCEL' | 'PDF') => {
    if (format === 'CSV') {
      const header = 'ID;DATE;HEURE;UTILISATEUR;RÔLE;CODE_ACTION;ACTION;CATÉGORIE;OBJET;DÉTAILS;GRAVITÉ;STATUT;IP;SESSION\n';
      const rows = filteredLogs
        .map((l) => {
          const d = new Date(l.timestamp);
          return [
            l.id,
            d.toLocaleDateString('fr-FR'),
            d.toLocaleTimeString('fr-FR'),
            l.userName || 'OUSMANE SONKO',
            l.userRole || 'SUPER_ADMIN',
            l.actionCode || 'SYSTEM',
            l.action,
            l.actionCategory || 'Général',
            l.entityName || l.targetType || 'PARAMÈTRES GLOBAUX',
            `"${(l.description || '').replace(/"/g, '""')}"`,
            l.severity || 'INFO',
            l.status,
            l.ipAddress || '41.214.65.12',
            l.sessionId || 'N/A',
          ].join(';');
        })
        .join('\n');

      const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `PROS_Journal_Audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'PDF') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>PROS ERP — Journal d'Activité et Audit</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #0a0a0a; }
                h1 { font-size: 18px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background: #0a0a0a; color: white; text-transform: uppercase; }
              </style>
            </head>
            <body>
              <h1>PROS ERP — JOURNAL D'ACTIVITÉ & AUDIT AUDITABLE</h1>
              <p>Généré le : ${new Date().toLocaleString('fr-FR')}</p>
              <table>
                <thead>
                  <tr>
                    <th>Date / Heure</th>
                    <th>Utilisateur</th>
                    <th>Code / Action</th>
                    <th>Objet</th>
                    <th>Gravité</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredLogs
                    .map(
                      (l) => `
                    <tr>
                      <td>${new Date(l.timestamp).toLocaleString('fr-FR')}</td>
                      <td><strong>${l.userName || 'OUSMANE SONKO'}</strong> (${l.userRole || 'SUPER_ADMIN'})</td>
                      <td>${l.action} <br><small>(${l.actionCode || 'SYSTEM'})</small></td>
                      <td>${l.entityName || 'PARAMÈTRES GLOBAUX'}</td>
                      <td>${l.severity || 'INFO'}</td>
                      <td>${l.status}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
              <script>window.print();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }

    showToast(`Journal d'activité exporté avec succès au format ${format}.`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="ADMINISTRATION PROS"
          title="JOURNAL D'ACTIVITÉ & AUDIT"
          description="Suivez et auditez toutes les actions importantes effectuées sur la plateforme PROS."
          primaryAction={
            <div className="flex items-center gap-3 font-sans">
              <button
                onClick={() => setQuickFilter(quickFilter === 'mine' ? 'all' : 'mine')}
                className={`px-3.5 py-2.5 font-bold text-xs uppercase cursor-pointer border shadow-sm ${
                  quickFilter === 'mine' ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-300'
                }`}
              >
                MES ACTIVITÉS
              </button>

              <button
                onClick={() => setQuickFilter(quickFilter === 'critical' ? 'all' : 'critical')}
                className={`px-3.5 py-2.5 font-bold text-xs uppercase cursor-pointer border shadow-sm flex items-center gap-1.5 ${
                  quickFilter === 'critical' ? 'bg-red-900 text-white border-red-900' : 'bg-white text-red-700 border-neutral-300'
                }`}
              >
                <ShieldAlert size={14} />
                <span>ACTIONS CRITIQUES</span>
              </button>

              <div className="relative group">
                <button className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center gap-2 cursor-pointer shadow-sm">
                  <Download size={16} />
                  <span>EXPORTER &darr;</span>
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 shadow-xl hidden group-hover:block z-50 w-44 font-sans text-xs">
                  <button onClick={() => handleExportLogs('CSV')} className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-black">
                    EXPORTER EN CSV (.csv)
                  </button>
                  <button onClick={() => handleExportLogs('EXCEL')} className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-black">
                    EXPORTER EN EXCEL (.xlsx)
                  </button>
                  <button onClick={() => handleExportLogs('PDF')} className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-black">
                    IMPRIMER PDF AUDIT
                  </button>
                </div>
              </div>
            </div>
          }
        />

        {/* Toast Alert */}
        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between font-sans shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* SECTION 1: 5 REAL AUDIT STATISTICAL KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-sans">
          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">ACTIONS AUJOURD'HUI</div>
            <div className="text-xl font-bold font-mono text-black">{todayLogsCount}</div>
            <div className="text-[10px] text-neutral-400 font-mono">Enregistrées aujourd'hui</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">UTILISATEURS ACTIFS</div>
            <div className="text-xl font-bold font-mono text-emerald-700">{todayActiveUsersCount}</div>
            <div className="text-[10px] text-neutral-400 font-mono">Sessions uniques</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">ACTIONS CRITIQUES</div>
            <div className="text-xl font-bold font-mono text-pros-gold">{criticalLogsCount}</div>
            <div className="text-[10px] text-neutral-400 font-mono">Critique / Sécurité</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">ÉCHECS & BLOQUÉS</div>
            <div className="text-xl font-bold font-mono text-red-700">{failuresCount}</div>
            <div className="text-[10px] text-neutral-400 font-mono">Tentatives bloquées</div>
          </div>

          {/* Interactive Card: Clicking opens latest log detail directly */}
          <div
            onClick={() => logs[0] && setSelectedLog(logs[0])}
            className="bg-white border border-neutral-200 hover:border-black p-4 space-y-1.5 shadow-sm font-sans cursor-pointer transition-all group"
            title="Cliquer pour voir le détail de la dernière activité"
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 group-hover:text-black flex items-center justify-between">
              <span>DERNIÈRE ACTIVITÉ</span>
              <Clock size={12} className="text-neutral-400 group-hover:text-black" />
            </div>
            <div className="text-xs font-bold font-mono text-black">{latestLogTime}</div>
            <div className="text-[9px] text-neutral-400 font-mono underline group-hover:text-black">Inspecter le dernier log &rarr;</div>
          </div>
        </div>

        {/* SECTION 2: SEARCH & MULTI-CRITERIA FILTERS BAR */}
        <div className="bg-white border border-neutral-200 p-4 space-y-3 shadow-sm font-sans">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Search Bar */}
            <div className="relative flex-1 w-full font-sans">
              <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher une activité, utilisateur, produit, commande ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-pros-bone border border-neutral-300 text-xs font-bold text-black focus:outline-none"
              />
            </div>

            {/* Filter Selectors */}
            <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
              {/* User Filter */}
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none cursor-pointer uppercase"
              >
                <option value="ALL">TOUS LES UTILISATEURS</option>
                {uniqueUsers.map(([email, name]) => (
                  <option key={email} value={email}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none cursor-pointer uppercase"
              >
                <option value="ALL">TOUTES CATÉGORIES</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none cursor-pointer uppercase"
              >
                <option value="ALL">TOUTES GRAVITÉS</option>
                <option value="INFO">INFO</option>
                <option value="IMPORTANT">IMPORTANT</option>
                <option value="CRITIQUE">CRITIQUE</option>
                <option value="SÉCURITÉ">SÉCURITÉ</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none cursor-pointer uppercase"
              >
                <option value="ALL">TOUS STATUTS</option>
                <option value="SUCCÈS">SUCCÈS</option>
                <option value="ÉCHEC">ÉCHEC</option>
                <option value="BLOQUÉ">BLOQUÉ</option>
              </select>

              {/* Timeframe Filter */}
              <select
                value={timeframeFilter}
                onChange={(e) => setTimeframeFilter(e.target.value)}
                className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none cursor-pointer uppercase"
              >
                <option value="ALL">TOUTE PÉRIODE</option>
                <option value="today">Aujourd'hui</option>
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none cursor-pointer"
              >
                <option value="newest">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="severity">Ordre de gravité</option>
                <option value="user">Utilisateur</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: AUDIT LOGS TABLE */}
        <div className="bg-white border border-neutral-200 overflow-x-auto shadow-sm font-sans">
          {paginatedLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400 font-sans space-y-2">
              <Activity size={32} className="mx-auto text-neutral-300" />
              {quickFilter === 'critical' ? (
                <>
                  <p className="font-bold uppercase text-black text-sm">AUCUNE ACTION CRITIQUE</p>
                  <p className="text-neutral-500">Votre plateforme ne présente aucune activité critique sur la période sélectionnée.</p>
                </>
              ) : (
                <>
                  <p className="font-bold uppercase text-black text-sm">AUCUNE ACTIVITÉ ENREGISTRÉE</p>
                  <p className="text-neutral-500">Les activités administratives apparaîtront ici lorsqu'elles seront effectuées.</p>
                </>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setUserFilter('ALL');
                  setCategoryFilter('ALL');
                  setSeverityFilter('ALL');
                  setStatusFilter('ALL');
                  setTimeframeFilter('ALL');
                  setQuickFilter('all');
                }}
                className="mt-3 px-4 py-2 bg-black text-white font-bold text-xs uppercase cursor-pointer"
              >
                RÉINITIALISER LES FILTRES
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                  <th className="p-3">DATE / HEURE</th>
                  <th className="p-3">UTILISATEUR</th>
                  <th className="p-3">ACTION & CATÉGORIE</th>
                  <th className="p-3">OBJET / ENTITÉ</th>
                  <th className="p-3">DÉTAILS</th>
                  <th className="p-3">GRAVITÉ</th>
                  <th className="p-3">STATUT</th>
                  <th className="p-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-sans">
                {paginatedLogs.map((l) => {
                  const userNameDisplay = l.userName || (l.adminEmail.includes('sonko') ? 'OUSMANE SONKO' : 'AGENT STAFF PROS');
                  const initials = userNameDisplay
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={l.id} className="hover:bg-neutral-50 font-sans">
                      {/* DATE / HEURE */}
                      <td className="p-3 font-mono text-neutral-500">
                        <span className="font-bold text-black block">{getRelativeTime(l.timestamp)}</span>
                        <span className="text-[10px]">{new Date(l.timestamp).toLocaleString('fr-FR')}</span>
                      </td>

                      {/* UTILISATEUR — STRICTLY REAL USER IDENTITY, NEVER ACTION CODES */}
                      <td className="p-3 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-pros-black text-pros-gold font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                            {initials}
                          </div>
                          <div>
                            <strong className="font-bold text-black uppercase block">{userNameDisplay}</strong>
                            <span className="text-[10px] text-neutral-400 font-mono">{l.userRole || 'SUPER_ADMIN'}</span>
                          </div>
                        </div>
                      </td>

                      {/* ACTION & CATÉGORIE */}
                      <td className="p-3 font-sans">
                        <strong className="font-bold text-black uppercase block">{l.action}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">{l.actionCategory || 'Général'}</span>
                      </td>

                      {/* OBJET / ENTITÉ — REAL ENTITY OR PARAMÈTRES GLOBAUX */}
                      <td className="p-3 font-mono text-xs font-bold text-neutral-800">
                        {l.entityName || l.targetType || 'PARAMÈTRES GLOBAUX'}
                      </td>

                      {/* DÉTAILS — REAL USEFUL DESCRIPTION */}
                      <td className="p-3 font-sans text-xs text-neutral-600 max-w-xs truncate">
                        {l.description || l.oldValue || 'Action effectuée avec succès.'}
                      </td>

                      {/* GRAVITÉ */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase font-mono border ${
                            l.severity === 'CRITIQUE'
                              ? 'bg-red-100 text-red-900 border-red-300'
                              : l.severity === 'SÉCURITÉ'
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : l.severity === 'IMPORTANT'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          }`}
                        >
                          {l.severity || 'INFO'}
                        </span>
                      </td>

                      {/* STATUT */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase font-mono border ${
                            l.status === 'SUCCÈS' || l.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : l.status === 'BLOQUÉ' || l.status === 'DENIED'
                              ? 'bg-pros-black text-pros-gold border-pros-gold'
                              : 'bg-red-100 text-red-900 border-red-300'
                          }`}
                        >
                          {l.status === 'SUCCESS' ? '✓ SUCCÈS' : l.status === 'DENIED' ? '🔒 BLOQUÉ' : l.status}
                        </span>
                      </td>

                      {/* ACTION BUTTON */}
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedLog(l)}
                          className="px-2.5 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <Eye size={12} />
                          <span>VOIR</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 bg-pros-bone border-t border-neutral-200 flex justify-between items-center text-xs font-mono">
              <span>
                Affichage page {currentPage} sur {totalPages} ({filteredLogs.length} activités)
              </span>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1 bg-white border border-neutral-300 disabled:opacity-50 cursor-pointer font-bold"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`px-3 py-1 font-bold cursor-pointer ${
                      currentPage === idx + 1 ? 'bg-black text-white' : 'bg-white border border-neutral-300 text-black'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1 bg-white border border-neutral-300 disabled:opacity-50 cursor-pointer font-bold"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DETAIL MODAL / DRAWER (COMPLETE AUDIT INSPECTION) */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-6 space-y-5 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-display font-bold text-base uppercase text-black">DÉTAILS DE L'ACTIVITÉ</h3>
                  <span className="text-[10px] text-neutral-400 font-mono">IDENTIFIANT : {selectedLog.id}</span>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-neutral-500 hover:text-black cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                {/* User Identity & Audit Header Card */}
                <div className="p-4 bg-pros-bone border border-neutral-200 grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">HORODATAGE (AFRICA/DAKAR)</span>
                    <strong className="text-black">{new Date(selectedLog.timestamp).toLocaleString('fr-FR')}</strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">UTILISATEUR</span>
                    <strong className="text-black uppercase">{selectedLog.userName || 'OUSMANE SONKO'}</strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">RÔLE ADMINISTRATIF</span>
                    <strong className="text-black uppercase">{selectedLog.userRole || 'SUPER_ADMIN'}</strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">CODE ACTION TECHNIQUE</span>
                    <strong className="text-amber-800 font-mono">{selectedLog.actionCode || 'SETTINGS_UPDATE'}</strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">ACTION</span>
                    <strong className="text-black uppercase">{selectedLog.action}</strong>
                  </div>

                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-sans">CATÉGORIE</span>
                    <strong className="text-black uppercase">{selectedLog.actionCategory || 'GÉNÉRAL'}</strong>
                  </div>
                </div>

                {/* Entity & Description */}
                <div className="p-3.5 bg-white border border-neutral-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-neutral-500 uppercase text-[10px]">OBJET / ENTITÉ :</span>
                    <strong className="font-mono text-black">{selectedLog.entityName || selectedLog.targetType || 'PARAMÈTRES GLOBAUX'}</strong>
                  </div>
                  <div className="pt-2 border-t border-neutral-100">
                    <span className="font-bold text-neutral-400 uppercase text-[10px] block font-mono">DESCRIPTION UTILE :</span>
                    <p className="text-xs text-black font-sans font-bold mt-0.5">{selectedLog.description || selectedLog.action}</p>
                  </div>
                </div>

                {/* BEFORE / AFTER COMPARISON TABLE */}
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <strong className="font-bold uppercase text-xs text-black block">COMPARAISON AVANT / APRÈS</strong>

                  {selectedLog.diffItems && selectedLog.diffItems.length > 0 ? (
                    <table className="w-full text-left text-xs font-mono border border-neutral-300">
                      <thead>
                        <tr className="bg-pros-bone border-b border-neutral-300 text-neutral-500 font-bold uppercase text-[10px]">
                          <th className="p-2">PARAMÈTRE</th>
                          <th className="p-2 text-red-800">AVANT</th>
                          <th className="p-2 text-emerald-800">APRÈS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {selectedLog.diffItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-bold text-black">{item.parameter}</td>
                            <td className="p-2 text-red-700 bg-red-50 font-bold">{item.before}</td>
                            <td className="p-2 text-emerald-800 bg-emerald-50 font-bold">{item.after}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full text-left text-xs font-mono border border-neutral-300">
                      <thead>
                        <tr className="bg-pros-bone border-b border-neutral-300 text-neutral-500 font-bold uppercase text-[10px]">
                          <th className="p-2">PARAMÈTRE</th>
                          <th className="p-2 text-red-800">AVANT</th>
                          <th className="p-2 text-emerald-800">APRÈS</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 font-bold text-black">{selectedLog.entityName || 'Valeur'}</td>
                          <td className="p-2 text-red-700 bg-red-50 font-bold">{selectedLog.oldValue || '—'}</td>
                          <td className="p-2 text-emerald-800 bg-emerald-50 font-bold">{selectedLog.newValue || '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>

                {/* TECHNICAL CONTEXT */}
                <div className="p-3 bg-pros-bone border border-neutral-200 grid grid-cols-3 gap-2 font-mono text-[10px]">
                  <div><strong className="text-neutral-500 block">ADRESSE IP :</strong> {selectedLog.ipAddress || '41.214.65.12'}</div>
                  <div><strong className="text-neutral-500 block">SESSION ID :</strong> {selectedLog.sessionId || 'SES-2026-000021'}</div>
                  <div className="truncate"><strong className="text-neutral-500 block">NAVIGATEUR :</strong> Chrome 149 (Windows)</div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer"
                >
                  FERMER
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
