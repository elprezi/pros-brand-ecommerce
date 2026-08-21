import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useReports } from '../../store/reportContext';
import { useStore } from '../../store/storeContext';
import type { ReportType, ReportFormat, ReportPeriod, PROSReport } from '../../types/reports';
import {
  FileText,
  Download,
  Plus,
  Eye,
  Trash2,
  Copy,
  Edit2,
  Archive,
  Clock,
  CheckCircle2,
  Search,
  Sparkles,
  X,
  Pause,
  Play,
} from 'lucide-react';

export const AdminReportsContent: React.FC = () => {
  const {
    reports,
    scheduledReports,
    historyEntries,
    generateReport,
    downloadReport,
    deleteReport,
    renameReport,
    duplicateReport,
    archiveReport,
    scheduleReport,
    toggleScheduledReportStatus,
    cancelScheduledReport,
  } = useReports();

  const { formatPrice } = useStore();

  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'history'>('all');

  // Search, Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [formatFilter, setFormatFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size'>('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modal & Drawer State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [previewReportItem, setPreviewReportItem] = useState<PROSReport | null>(null);
  const [renameReportItem, setRenameReportItem] = useState<{ id: string; title: string } | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<PROSReport | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Generator Form State
  const [genType, setGenType] = useState<ReportType>('VENTES');
  const [genFormat, setGenFormat] = useState<ReportFormat>('PDF');
  const [genPeriod, setGenPeriod] = useState<ReportPeriod>('30d');
  const [genStartDate, setGenStartDate] = useState('2026-08-01');
  const [genEndDate, setGenEndDate] = useState('2026-08-19');
  const [genTitle, setGenTitle] = useState('');
  const [genIncludedFields, setGenIncludedFields] = useState<string[]>([
    'Chiffre d\'affaires',
    'Commandes',
    'Produits les plus vendus',
    'Géographie',
    'Fidélité PROS Club',
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Schedule Form State
  const [schedTitle, setSchedTitle] = useState('');
  const [schedType, setSchedType] = useState<ReportType>('VENTES');
  const [schedFormat, setSchedFormat] = useState<ReportFormat>('PDF');
  const [schedFreq, setSchedFreq] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [schedEmails, setSchedEmails] = useState('admin@pros.sn, direction@pros.sn');

  // KPI STATS (Separating Generations vs Downloads)
  const totalReportsCount = reports.filter((r) => r.status !== 'ARCHIVÉ').length;
  const reportsThisMonth = reports.filter((r) => {
    const d = new Date(r.generatedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const scheduledCount = scheduledReports.filter((s) => s.status === 'ACTIVE').length;

  // Real Downloads Count (Distinct from generations count)
  const downloadsThisMonth = historyEntries.filter((h) => h.action === 'DOWNLOAD').length +
    reports.reduce((s, r) => s + (r.downloadCount || 0), 0);

  const lastGeneratedReport = reports[0];

  // FILTERED & SORTED REPORTS
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchTitle = r.title.toLowerCase().includes(term);
          const matchId = r.id.toLowerCase().includes(term);
          const matchUser = r.generatedBy.toLowerCase().includes(term);
          if (!matchTitle && !matchId && !matchUser) return false;
        }

        if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
        if (formatFilter !== 'ALL' && r.format !== formatFilter) return false;
        if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
        if (sortBy === 'oldest') return new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
        if (sortBy === 'name-asc') return a.title.localeCompare(b.title);
        if (sortBy === 'name-desc') return b.title.localeCompare(a.title);
        if (sortBy === 'size') return b.fileSizeBytes - a.fileSizeBytes;
        return 0;
      });
  }, [reports, searchTerm, typeFilter, formatFilter, statusFilter, sortBy]);

  // Pagination Slice
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage]);

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;

  // Handle New Report Submission
  const handleStartGeneration = () => {
    setIsGenerating(true);
    setGenerationProgress(15);

    setTimeout(() => setGenerationProgress(45), 300);
    setTimeout(() => setGenerationProgress(80), 600);

    setTimeout(() => {
      setGenerationProgress(100);
      const newRep = generateReport({
        title: genTitle || undefined,
        type: genType,
        format: genFormat,
        period: genPeriod,
        startDate: genStartDate,
        endDate: genEndDate,
        includedFields: genIncludedFields,
      });

      setIsGenerating(false);
      setIsGenerateModalOpen(false);
      setGenerationProgress(0);
      showToast(`Rapport ${newRep.id} généré avec succès au format ${genFormat}.`);

      // Trigger immediate download
      downloadReport(newRep.id);
    }, 900);
  };

  // Handle Schedule Creation
  const handleCreateSchedule = () => {
    const emailList = schedEmails.split(',').map((e) => e.trim()).filter(Boolean);
    scheduleReport({
      title: schedTitle || `Rapport ${schedType} ${schedFreq}`,
      type: schedType,
      format: schedFormat,
      frequency: schedFreq,
      recipientEmails: emailList,
    });

    setIsScheduleModalOpen(false);
    showToast('Nouveau rapport programmé avec succès.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="MODULE ADMINISTRATION & PILOTAGE"
          title="RAPPORTS & EXPORTS DE DONNÉES"
          description="Générez, consultez et exportez les données commerciales, opérationnelles et administratives réelles de la plateforme PROS."
          primaryAction={
            <div className="flex items-center gap-3 font-sans">
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-4 py-2.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Clock size={16} />
                <span>+ RAPPORT PROGRAMMÉ</span>
              </button>

              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus size={16} />
                <span>+ GÉNÉRER UN RAPPORT</span>
              </button>
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

        {/* SECTION 1: 5 DYNAMIC KPI CARDS (REAL GENERATIONS & DOWNLOADS COUNTS) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-sans">
          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">RAPPORTS GÉNÉRÉS</div>
            <div className="text-xl font-bold font-mono text-black">{totalReportsCount}</div>
            <div className="text-[10px] text-neutral-400 font-mono">Total enregistrés</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">RAPPORTS CE MOIS</div>
            <div className="text-xl font-bold font-mono text-emerald-700">{reportsThisMonth}</div>
            <div className="text-[10px] text-neutral-400 font-mono">Mois en cours</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">RAPPORTS PROGRAMMÉS</div>
            <div className="text-xl font-bold font-mono text-pros-gold">{scheduledCount}</div>
            <div className="text-[10px] text-neutral-400 font-mono">Récurrences actives</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">EXPORTS CE MOIS</div>
            <div className="text-xl font-bold font-mono text-blue-700">{downloadsThisMonth}</div>
            <div className="text-[10px] text-neutral-400 font-mono">Téléchargements réels</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1.5 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">DERNIÈRE GÉNÉRATION</div>
            <div className="text-xs font-bold font-mono text-black">
              {lastGeneratedReport ? new Date(lastGeneratedReport.generatedAt).toLocaleDateString('fr-FR') : 'N/A'}
            </div>
            <div className="text-[9px] text-neutral-400 font-mono">
              {lastGeneratedReport ? lastGeneratedReport.generatedBy : 'Aucune entrée'}
            </div>
          </div>
        </div>

        {/* SECTION 2: TAB NAVIGATION */}
        <div className="flex border-b border-neutral-200 bg-white font-sans">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              activeTab === 'all' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            RAPPORTS DISPONIBLES ({reports.filter((r) => r.status !== 'ARCHIVÉ').length})
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              activeTab === 'scheduled' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            RAPPORTS PROGRAMMÉS ({scheduledReports.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 ${
              activeTab === 'history' ? 'border-black text-black bg-pros-bone' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            HISTORIQUE DES GÉNÉRATIONS ({historyEntries.length})
          </button>
        </div>

        {/* TAB 1: ALL AVAILABLE REPORTS */}
        {activeTab === 'all' && (
          <div className="space-y-4 font-sans">
            {/* SEARCH & FILTERS BAR */}
            <div className="bg-white border border-neutral-200 p-4 space-y-3 shadow-sm font-sans">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                
                {/* Search Input */}
                <div className="relative flex-1 w-full font-sans">
                  <Search className="absolute left-3 top-2.5 text-neutral-400" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher un rapport par nom, ID ou utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-pros-bone border border-neutral-300 text-xs font-bold text-black focus:outline-none"
                  />
                </div>

                {/* Filter Selects */}
                <div className="flex flex-wrap items-center gap-2 font-sans text-xs">
                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none cursor-pointer uppercase"
                  >
                    <option value="ALL">TOUS LES TYPES</option>
                    <option value="VENTES">Ventes</option>
                    <option value="FINANCE">Finance</option>
                    <option value="COMMANDES">Commandes</option>
                    <option value="PRODUITS">Produits</option>
                    <option value="STOCK">Stock</option>
                    <option value="CLIENTS">Clients</option>
                    <option value="LIVRAISONS">Livraisons</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="PROS_CLUB">PROS Club</option>
                    <option value="GLOBAL">Global</option>
                  </select>

                  {/* Format Filter */}
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value)}
                    className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none cursor-pointer uppercase"
                  >
                    <option value="ALL">TOUS FORMATS</option>
                    <option value="PDF">PDF</option>
                    <option value="EXCEL">EXCEL</option>
                    <option value="CSV">CSV</option>
                    <option value="JSON">JSON</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none cursor-pointer uppercase"
                  >
                    <option value="ALL">TOUS STATUTS</option>
                    <option value="TERMINÉ">Terminé</option>
                    <option value="EN COURS">En Cours</option>
                    <option value="PROGRAMMÉ">Programmé</option>
                    <option value="ÉCHEC">Échec</option>
                    <option value="ARCHIVÉ">Archivé</option>
                  </select>

                  {/* Sort Selector */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-pros-bone border border-neutral-300 px-3 py-2 text-xs font-bold text-black focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Plus récents</option>
                    <option value="oldest">Plus anciens</option>
                    <option value="name-asc">Nom A-Z</option>
                    <option value="name-desc">Nom Z-A</option>
                    <option value="size">Taille du fichier</option>
                  </select>
                </div>
              </div>
            </div>

            {/* REPORTS TABLE */}
            <div className="bg-white border border-neutral-200 overflow-x-auto shadow-sm font-sans">
              {paginatedReports.length === 0 ? (
                <div className="p-12 text-center text-xs text-neutral-400 font-sans space-y-2">
                  <FileText size={32} className="mx-auto text-neutral-300" />
                  <p className="font-bold uppercase text-black">AUCUN RAPPORT DISPONIBLE</p>
                  <p>Aucun rapport ne correspond aux critères de recherche ou de filtrage.</p>
                  <button
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="mt-3 px-4 py-2 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer"
                  >
                    + GÉNÉRER UN RAPPORT
                  </button>
                </div>
              ) : (
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                      <th className="p-3">NOM DU RAPPORT / ID</th>
                      <th className="p-3">TYPE</th>
                      <th className="p-3">PÉRIODE</th>
                      <th className="p-3">FORMAT</th>
                      <th className="p-3">TAILLE</th>
                      <th className="p-3">STATUT</th>
                      <th className="p-3">GÉNÉRÉ LE</th>
                      <th className="p-3">PAR</th>
                      <th className="p-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-sans">
                    {paginatedReports.map((r) => (
                      <tr key={r.id} className="hover:bg-neutral-50 font-sans">
                        <td className="p-3">
                          <strong className="font-bold text-black uppercase block">{r.title}</strong>
                          <span className="text-[10px] text-neutral-400 font-mono">{r.id}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-xs uppercase text-neutral-700">{r.type}</td>
                        <td className="p-3 font-mono text-xs uppercase text-neutral-500">
                          {r.period === 'custom' && r.startDate && r.endDate
                            ? `${new Date(r.startDate).toLocaleDateString('fr-FR')} → ${new Date(r.endDate).toLocaleDateString('fr-FR')}`
                            : r.period.toUpperCase()}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold font-mono border ${
                              r.format === 'PDF'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : r.format === 'EXCEL'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : r.format === 'CSV'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            {r.format}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs font-bold text-black">{r.fileSize}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 text-[9px] font-bold uppercase font-mono border ${
                              r.status === 'TERMINÉ'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : r.status === 'EN COURS'
                                ? 'bg-blue-100 text-blue-900 border-blue-300'
                                : r.status === 'PROGRAMMÉ'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : r.status === 'ARCHIVÉ'
                                ? 'bg-neutral-100 text-neutral-700 border-neutral-300'
                                : 'bg-red-100 text-red-900 border-red-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-neutral-500">
                          {new Date(r.generatedAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-3 font-sans text-xs text-neutral-700">{r.generatedBy}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2 font-sans relative">
                            <button
                              onClick={() => setPreviewReportItem(r)}
                              className="px-2.5 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                              title="Aperçu"
                            >
                              <Eye size={12} />
                              <span>APERÇU</span>
                            </button>

                            <button
                              onClick={() => downloadReport(r.id)}
                              className="px-2.5 py-1 bg-pros-black hover:bg-neutral-800 text-white font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                              title="Télécharger"
                            >
                              <Download size={12} />
                              <span>TÉLÉCHARGER</span>
                            </button>

                            <button
                              onClick={() => setActionMenuId(actionMenuId === r.id ? null : r.id)}
                              className="p-1 text-neutral-500 hover:text-black cursor-pointer font-bold text-sm"
                            >
                              ⋮
                            </button>

                            {/* Dropdown Action Menu */}
                            {actionMenuId === r.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 shadow-xl z-50 w-48 font-sans text-xs text-left">
                                <button
                                  onClick={() => {
                                    setPreviewReportItem(r);
                                    setActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-black flex items-center gap-2"
                                >
                                  <Eye size={13} /> APERÇU RAPPORT
                                </button>

                                <button
                                  onClick={() => {
                                    downloadReport(r.id);
                                    setActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-black flex items-center gap-2"
                                >
                                  <Download size={13} /> TÉLÉCHARGER
                                </button>

                                <button
                                  onClick={() => {
                                    duplicateReport(r.id);
                                    setActionMenuId(null);
                                    showToast('Rapport duplicité générée avec succès.');
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-black flex items-center gap-2"
                                >
                                  <Copy size={13} /> DUPLIQUER
                                </button>

                                <button
                                  onClick={() => {
                                    setRenameReportItem({ id: r.id, title: r.title });
                                    setActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-black flex items-center gap-2"
                                >
                                  <Edit2 size={13} /> RENOMMER
                                </button>

                                <button
                                  onClick={() => {
                                    archiveReport(r.id);
                                    setActionMenuId(null);
                                    showToast('Rapport archivé.');
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-neutral-100 font-bold block text-neutral-700 flex items-center gap-2"
                                >
                                  <Archive size={13} /> ARCHIVER
                                </button>

                                <button
                                  onClick={() => {
                                    setDeleteConfirmItem(r);
                                    setActionMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-700 font-bold block flex items-center gap-2 border-t border-neutral-100"
                                >
                                  <Trash2 size={13} /> SUPPRIMER
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 bg-pros-bone border-t border-neutral-200 flex justify-between items-center text-xs font-mono">
                  <span>Page {currentPage} sur {totalPages}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`px-3 py-1 cursor-pointer font-bold ${
                          currentPage === idx + 1 ? 'bg-black text-white' : 'bg-white border border-neutral-300 text-black'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULED REPORTS TABLE */}
        {activeTab === 'scheduled' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h4 className="font-display font-bold text-sm uppercase text-black">RAPPORTS PROGRAMMÉS ET ENVOIS AUTOMATIQUES</h4>
                <p className="text-xs text-neutral-500">Gestion des synthèses récurrentes envoyées automatiquement par email.</p>
              </div>

              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-4 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer"
              >
                <Plus size={14} /> + RAPPORT PROGRAMMÉ
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <th className="p-3">RAPPORT</th>
                    <th className="p-3">TYPE</th>
                    <th className="p-3">FRÉQUENCE</th>
                    <th className="p-3">PROCHAINE EXÉCUTION</th>
                    <th className="p-3">FORMAT</th>
                    <th className="p-3">DESTINATAIRES</th>
                    <th className="p-3">STATUT</th>
                    <th className="p-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-sans">
                  {scheduledReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-neutral-400 font-sans">
                        Aucun rapport programmé actuellement.
                      </td>
                    </tr>
                  ) : (
                    scheduledReports.map((s) => (
                      <tr key={s.id} className="hover:bg-neutral-50 font-sans">
                        <td className="p-3 font-bold text-black uppercase">{s.title}</td>
                        <td className="p-3 font-mono font-bold text-neutral-600">{s.type}</td>
                        <td className="p-3 font-mono text-neutral-700">{s.frequency}</td>
                        <td className="p-3 font-mono text-neutral-500">{new Date(s.nextRunAt).toLocaleDateString('fr-FR')}</td>
                        <td className="p-3 font-mono font-bold text-black">{s.format}</td>
                        <td className="p-3 font-mono text-neutral-600">{s.recipientEmails.join(', ')}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 font-mono font-bold text-[9px] uppercase border ${
                              s.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                toggleScheduledReportStatus(s.id);
                                showToast(`Statut du rapport ${s.id} mis à jour.`);
                              }}
                              className="px-2 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 text-black font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                            >
                              {s.status === 'ACTIVE' ? <Pause size={12} /> : <Play size={12} />}
                              <span>{s.status === 'ACTIVE' ? 'PAUSE' : 'ACTIVER'}</span>
                            </button>

                            <button
                              onClick={() => {
                                cancelScheduledReport(s.id);
                                showToast('Programmation supprimée.');
                              }}
                              className="text-red-700 font-bold hover:underline text-xs"
                            >
                              SUPPRIMER
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: GENERATION HISTORY LOGS TABLE */}
        {activeTab === 'history' && (
          <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
            <h4 className="font-display font-bold text-sm uppercase text-black border-b border-neutral-100 pb-3">
              HISTORIQUE DES OPÉRATIONS & LOGS AUDIT
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-pros-bone border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                    <th className="p-3">DATE / HEURE</th>
                    <th className="p-3">RAPPORT / ACTION</th>
                    <th className="p-3">ACTION</th>
                    <th className="p-3">UTILISATEUR</th>
                    <th className="p-3">FORMAT</th>
                    <th className="p-3">DURÉE (MS)</th>
                    <th className="p-3">TAILLE</th>
                    <th className="p-3 text-right">STATUT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-sans">
                  {historyEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-neutral-400 font-sans">
                        Aucun historique d'opération disponible.
                      </td>
                    </tr>
                  ) : (
                    historyEntries.map((h) => (
                      <tr key={h.id} className="hover:bg-neutral-50 font-sans">
                        <td className="p-3 font-mono text-neutral-500">{new Date(h.timestamp).toLocaleString('fr-FR')}</td>
                        <td className="p-3 font-bold text-black uppercase">{h.reportTitle}</td>
                        <td className="p-3 font-mono text-xs font-bold text-neutral-700">{h.action}</td>
                        <td className="p-3">{h.user}</td>
                        <td className="p-3 font-mono font-bold text-neutral-600">{h.format}</td>
                        <td className="p-3 font-mono text-neutral-500">{h.durationMs ? `${h.durationMs} ms` : '—'}</td>
                        <td className="p-3 font-mono font-bold text-black">{h.fileSize || '—'}</td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-bold text-[9px] uppercase">
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL 1: NEW REPORT GENERATOR */}
        {isGenerateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-6 space-y-6 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-pros-gold" size={20} />
                  <h3 className="font-display font-bold text-base uppercase text-black">NOUVEAU RAPPORT PROS</h3>
                </div>
                <button onClick={() => setIsGenerateModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-4 text-xs font-sans">
                {/* Title Input */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Titre du Rapport (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Ex: RAPPORT COMMERCIAL MENSUEL PROS"
                    value={genTitle}
                    onChange={(e) => setGenTitle(e.target.value)}
                    className="w-full p-2.5 bg-pros-bone border border-neutral-300 text-xs font-bold text-black focus:outline-none"
                  />
                </div>

                {/* Report Type Selector */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Étape 1 : TYPE DE RAPPORT</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      'VENTES',
                      'FINANCE',
                      'COMMANDES',
                      'PRODUITS',
                      'STOCK',
                      'CLIENTS',
                      'LIVRAISONS',
                      'MARKETING',
                      'PROS_CLUB',
                      'GLOBAL',
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setGenType(t as any)}
                        className={`p-2 text-center text-[10px] font-bold font-mono uppercase transition-all cursor-pointer border ${
                          genType === t ? 'bg-black text-white border-black' : 'bg-pros-bone text-neutral-700 border-neutral-300 hover:bg-neutral-200'
                        }`}
                      >
                        {t.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period Selector */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Étape 2 : PÉRIODE CIBLÉE</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'today', label: "AUJOURD'HUI" },
                      { id: '7d', label: '7 JOURS' },
                      { id: '30d', label: '30 JOURS' },
                      { id: '90d', label: '90 JOURS' },
                      { id: '12m', label: '12 MOIS' },
                      { id: 'custom', label: 'PERSONNALISÉE' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setGenPeriod(p.id as any)}
                        className={`px-3 py-1.5 text-xs font-bold font-mono cursor-pointer border ${
                          genPeriod === p.id ? 'bg-black text-white' : 'bg-pros-bone text-neutral-700 border-neutral-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                    {genPeriod === 'custom' && (
                      <div className="pt-2 flex items-center gap-3 w-full font-mono text-xs">
                        <span className="text-neutral-500 font-bold text-[10px] uppercase">Du :</span>
                        <input
                          type="date"
                          value={genStartDate}
                          onChange={(e) => setGenStartDate(e.target.value)}
                          className="bg-pros-bone border border-neutral-300 p-1.5 text-xs text-black"
                        />
                        <span className="text-neutral-500 font-bold text-[10px] uppercase">Au :</span>
                        <input
                          type="date"
                          value={genEndDate}
                          onChange={(e) => setGenEndDate(e.target.value)}
                          className="bg-pros-bone border border-neutral-300 p-1.5 text-xs text-black"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Included Fields Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Étape 3 : DONNÉES À INCLURE</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      'Chiffre d\'affaires',
                      'Commandes',
                      'Produits les plus vendus',
                      'Stock & Alertes',
                      'Clients & Inscriptions',
                      'Remises & Coupons',
                      'Livraisons & Transport',
                      'Fidélité PROS Club',
                      'Géographie Sénégal',
                    ].map((field) => (
                      <label key={field} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={genIncludedFields.includes(field)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGenIncludedFields([...genIncludedFields, field]);
                            } else {
                              setGenIncludedFields(genIncludedFields.filter((f) => f !== field));
                            }
                          }}
                          className="accent-black cursor-pointer"
                        />
                        <span>{field}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Format Selector */}
                <div className="space-y-1 pt-2 border-t border-neutral-200">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Étape 4 : FORMAT D'EXPORTATION</label>
                  <div className="flex items-center gap-3">
                    {(['PDF', 'EXCEL', 'CSV', 'JSON'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setGenFormat(fmt)}
                        className={`px-4 py-2 text-xs font-bold font-mono cursor-pointer border ${
                          genFormat === fmt ? 'bg-black text-white' : 'bg-pros-bone text-neutral-700 border-neutral-300'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Bar during generation */}
                {isGenerating && (
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-[10px] font-mono font-bold text-neutral-500">
                      <span>GÉNÉRATION DU RAPPORT...</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 h-2">
                      <div style={{ width: `${generationProgress}%` }} className="bg-emerald-600 h-full transition-all"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setIsGenerateModalOpen(false)}
                  disabled={isGenerating}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase hover:bg-neutral-100 cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  onClick={handleStartGeneration}
                  disabled={isGenerating}
                  className="px-6 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  <span>{isGenerating ? 'GÉNÉRATION EN COURS...' : 'GÉNÉRER ET TÉLÉCHARGER'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: SCHEDULE REPORT */}
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-lg w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-display font-bold text-base uppercase text-black">PROGRAMMER UN RAPPORT</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Titre du Rapport Automatisé</label>
                  <input
                    type="text"
                    placeholder="Rapport Ventes Hebdomadaire"
                    value={schedTitle}
                    onChange={(e) => setSchedTitle(e.target.value)}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Type de Rapport</label>
                  <select
                    value={schedType}
                    onChange={(e) => setSchedType(e.target.value as any)}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-xs font-bold"
                  >
                    <option value="VENTES">VENTES</option>
                    <option value="COMMANDES">COMMANDES</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="STOCK">STOCK</option>
                    <option value="CLIENTS">CLIENTS</option>
                    <option value="GLOBAL">GLOBAL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Fréquence d'Envoi</label>
                  <select
                    value={schedFreq}
                    onChange={(e) => setSchedFreq(e.target.value as any)}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-xs font-bold"
                  >
                    <option value="DAILY">TOUS LES JOURS (08h00)</option>
                    <option value="WEEKLY">CHAQUE LUNDI (08h00)</option>
                    <option value="MONTHLY">CHAQUE 1er DU MOIS (08h00)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Format d'Export</label>
                  <select
                    value={schedFormat}
                    onChange={(e) => setSchedFormat(e.target.value as any)}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-xs font-bold"
                  >
                    <option value="PDF">PDF</option>
                    <option value="EXCEL">EXCEL</option>
                    <option value="CSV">CSV</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Adresse(s) Email Destinataire(s)</label>
                  <input
                    type="text"
                    placeholder="admin@pros.sn, direction@pros.sn"
                    value={schedEmails}
                    onChange={(e) => setSchedEmails(e.target.value)}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  onClick={handleCreateSchedule}
                  className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase shadow-sm cursor-pointer"
                >
                  ENREGISTRER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: PREVIEW REPORT (FULL DETAILS & REAL CALCULATED METRICS) */}
        {previewReportItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-3xl w-full p-6 space-y-6 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-display font-bold text-base uppercase text-black">{previewReportItem.title}</h3>
                  <span className="text-[10px] text-neutral-400 font-mono">ID: {previewReportItem.id} | Format: {previewReportItem.format}</span>
                </div>
                <button onClick={() => setPreviewReportItem(null)} className="text-neutral-500 hover:text-black cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div className="p-4 bg-pros-bone border border-neutral-200 space-y-1.5 font-mono">
                  <div><strong>Période :</strong> {previewReportItem.startDate && previewReportItem.endDate ? `${previewReportItem.startDate} → ${previewReportItem.endDate}` : previewReportItem.period.toUpperCase()}</div>
                  <div><strong>Généré le :</strong> {new Date(previewReportItem.generatedAt).toLocaleString('fr-FR')}</div>
                  <div><strong>Généré par :</strong> {previewReportItem.generatedBy}</div>
                  <div><strong>Taille :</strong> {previewReportItem.fileSize}</div>
                  <div><strong>Champs inclus :</strong> {previewReportItem.includedFields.join(', ')}</div>
                </div>

                <div className="p-4 border border-neutral-200 space-y-3 font-sans">
                  <strong className="font-bold uppercase text-black block border-b pb-2">Résumé des métriques calculées</strong>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                    <div className="p-2 bg-pros-bone">
                      <span className="text-[10px] text-neutral-400 block font-sans uppercase">Chiffre d'Affaires</span>
                      <strong className="text-emerald-700 text-sm">{formatPrice(previewReportItem.dataPayload?.summary?.totalRevenue || 0)}</strong>
                    </div>
                    <div className="p-2 bg-pros-bone">
                      <span className="text-[10px] text-neutral-400 block font-sans uppercase">Commandes</span>
                      <strong className="text-black text-sm">{previewReportItem.dataPayload?.summary?.paidOrdersCount || 0}</strong>
                    </div>
                    <div className="p-2 bg-pros-bone">
                      <span className="text-[10px] text-neutral-400 block font-sans uppercase">Panier Moyen</span>
                      <strong className="text-black text-sm">{formatPrice(previewReportItem.dataPayload?.summary?.averageOrderValue || 0)}</strong>
                    </div>
                    <div className="p-2 bg-pros-bone">
                      <span className="text-[10px] text-neutral-400 block font-sans uppercase">Clients Actifs</span>
                      <strong className="text-black text-sm">{previewReportItem.dataPayload?.summary?.activeCustomersCount || 0}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2 font-sans">
                <button
                  onClick={() => setPreviewReportItem(null)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  FERMER
                </button>
                <button
                  onClick={() => {
                    downloadReport(previewReportItem.id);
                    setPreviewReportItem(null);
                  }}
                  className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  <span>TÉLÉCHARGER LE FICHIER</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: RENAME REPORT */}
        {renameReportItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <h3 className="font-display font-bold text-sm uppercase text-black">RENOMMER LE RAPPORT</h3>
              <input
                type="text"
                value={renameReportItem.title}
                onChange={(e) => setRenameReportItem({ ...renameReportItem, title: e.target.value })}
                className="w-full p-2 bg-pros-bone border border-neutral-300 text-xs font-bold text-black"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setRenameReportItem(null)}
                  className="px-4 py-2 border text-xs font-bold uppercase cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  onClick={() => {
                    renameReport(renameReportItem.id, renameReportItem.title);
                    setRenameReportItem(null);
                    showToast('Rapport renommé avec succès.');
                  }}
                  className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer"
                >
                  ENREGISTRER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: DELETE CONFIRMATION DIALOG */}
        {deleteConfirmItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex items-center gap-2 text-red-700 font-bold uppercase text-sm">
                <Trash2 size={18} />
                <span>SUPPRIMER LE RAPPORT ?</span>
              </div>

              <p className="text-xs text-neutral-600">
                Cette action supprimera définitivement le rapport <strong>{deleteConfirmItem.title}</strong> ({deleteConfirmItem.id}) et son fichier associé.
              </p>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirmItem(null)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  onClick={() => {
                    deleteReport(deleteConfirmItem.id);
                    setDeleteConfirmItem(null);
                    showToast('Rapport supprimé définitivement.');
                  }}
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase cursor-pointer"
                >
                  SUPPRIMER
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
};

export const AdminReportsPage: React.FC = () => (
  <AdminLayout>
    <AdminReportsContent />
  </AdminLayout>
);
