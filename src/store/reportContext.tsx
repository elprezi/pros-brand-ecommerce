import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  PROSReport,
  ScheduledReport,
  ReportHistoryEntry,
  ReportGenerationOptions,
} from '../types/reports';
import { useStore } from './storeContext';
import { useLoyalty } from './loyaltyContext';
import { useAuth } from './authContext';
import { buildReportPayload, formatBytes, downloadCSVReport, downloadJSONReport } from '../lib/server/reportEngine';
import { logRbacAction } from '../lib/server/rbacEngine';

interface ReportContextType {
  reports: PROSReport[];
  scheduledReports: ScheduledReport[];
  historyEntries: ReportHistoryEntry[];
  generateReport: (options: ReportGenerationOptions) => PROSReport;
  downloadReport: (reportId: string) => void;
  deleteReport: (reportId: string) => void;
  renameReport: (reportId: string, newTitle: string) => void;
  duplicateReport: (reportId: string) => PROSReport;
  archiveReport: (reportId: string) => void;
  scheduleReport: (options: Partial<ScheduledReport>) => ScheduledReport;
  toggleScheduledReportStatus: (scheduleId: string) => void;
  cancelScheduledReport: (scheduleId: string) => void;
}

const LOCAL_STORAGE_PREFIX = 'pros_reports_';

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { orders, products, categories, customers } = useStore();
  const { members } = useLoyalty();
  const { currentUser } = useAuth();

  // CLEAN INITIAL SEED REPORTS (Reset to empty array for fresh platform)
  const INITIAL_REPORTS: PROSReport[] = [];
  const INITIAL_SCHEDULED: ScheduledReport[] = [];

  const [reports, setReports] = useState<PROSReport[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'list');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'scheduled');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULED;
  });

  const [historyEntries, setHistoryEntries] = useState<ReportHistoryEntry[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'history');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'list', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'scheduled', JSON.stringify(scheduledReports));
  }, [scheduledReports]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'history', JSON.stringify(historyEntries));
  }, [historyEntries]);

  // 1. GENERATE REPORT
  const generateReport = (options: ReportGenerationOptions): PROSReport => {
    const startTime = Date.now();
    const payload = buildReportPayload(options, orders, products, categories, customers, members);
    const payloadString = JSON.stringify(payload);
    const fileSizeBytes = new Blob([payloadString]).size;
    const fileSize = formatBytes(fileSizeBytes);

    const reportId = `RPT-2026-${String(reports.length + 1).padStart(4, '0')}`;
    const generatedBy = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS';

    const defaultTitle = options.title || `RAPPORT ${options.type.toUpperCase()} — ${new Date().toLocaleDateString('fr-FR')}`;

    const newReport: PROSReport = {
      id: reportId,
      title: defaultTitle,
      type: options.type,
      format: options.format,
      status: 'TERMINÉ',
      period: options.period,
      startDate: options.startDate,
      endDate: options.endDate,
      generatedAt: new Date().toISOString(),
      generatedBy,
      fileSize,
      fileSizeBytes,
      downloadCount: 0,
      includedFields: options.includedFields,
      dataPayload: payload,
    };

    setReports((prev) => [newReport, ...prev]);

    // Record History Log
    const historyItem: ReportHistoryEntry = {
      id: `HST-${Date.now()}`,
      reportId,
      reportTitle: defaultTitle,
      type: options.type,
      format: options.format,
      action: 'GENERATION',
      timestamp: new Date().toISOString(),
      user: generatedBy,
      status: 'TERMINÉ',
      durationMs: Date.now() - startTime + 120,
      fileSize,
    };

    setHistoryEntries((prev) => [historyItem, ...prev]);
    logRbacAction(currentUser?.email || 'admin@pros.sn', 'REPORT_GENERATE', `Génération du rapport ${defaultTitle} (${options.format})`);

    return newReport;
  };

  // 2. DOWNLOAD REPORT (Separate download count & download history log)
  const downloadReport = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    let payload = report.dataPayload;
    if (!payload) {
      payload = buildReportPayload(
        { type: report.type, format: report.format, period: report.period, includedFields: report.includedFields },
        orders,
        products,
        categories,
        customers,
        members
      );
    }

    // Increment download count on report
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r))
    );

    const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS';

    // Log Download History Entry
    const downloadHistoryItem: ReportHistoryEntry = {
      id: `HST-DL-${Date.now()}`,
      reportId,
      reportTitle: report.title,
      type: report.type,
      format: report.format,
      action: 'DOWNLOAD',
      timestamp: new Date().toISOString(),
      user: userName,
      status: 'TERMINÉ',
      fileSize: report.fileSize,
    };

    setHistoryEntries((prev) => [downloadHistoryItem, ...prev]);

    if (report.format === 'CSV' || report.format === 'EXCEL') {
      downloadCSVReport(report.title, payload);
    } else if (report.format === 'JSON') {
      downloadJSONReport(report.title, payload);
    } else {
      // PDF Printable Window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${report.title}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #0A0A0A; }
                h1 { font-size: 20px; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .meta { background: #f7f6f2; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px; font-size: 12px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #0a0a0a; color: white; text-transform: uppercase; }
              </style>
            </head>
            <body>
              <h1>PROS ERP — ${report.title}</h1>
              <div class="meta">
                <p><strong>ID :</strong> ${report.id}</p>
                <p><strong>Généré le :</strong> ${new Date(report.generatedAt).toLocaleString('fr-FR')}</p>
                <p><strong>Généré par :</strong> ${report.generatedBy}</p>
                <p><strong>Chiffre d'Affaires Net :</strong> ${payload.summary?.totalRevenue || 0} FCFA</p>
                <p><strong>Commandes Payées :</strong> ${payload.summary?.paidOrdersCount || 0}</p>
              </div>
              <script>window.print();</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }

    logRbacAction(currentUser?.email || 'admin@pros.sn', 'REPORT_DOWNLOAD', `Téléchargement du rapport ${report.title}`);
  };

  // 3. DELETE REPORT
  const deleteReport = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      logRbacAction(currentUser?.email || 'admin@pros.sn', 'REPORT_DELETE', `Suppression du rapport ${report.title}`);
    }
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  };

  // 4. RENAME REPORT
  const renameReport = (reportId: string, newTitle: string) => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, title: newTitle } : r)));
    logRbacAction(currentUser?.email || 'admin@pros.sn', 'REPORT_RENAME', `Renommage du rapport ${reportId} en ${newTitle}`);
  };

  // 5. DUPLICATE REPORT (Creates new generation entry with new ID & timestamp)
  const duplicateReport = (reportId: string): PROSReport => {
    const original = reports.find((r) => r.id === reportId);
    if (!original) throw new Error('Rapport non trouvé');

    const newOptions: ReportGenerationOptions = {
      title: `${original.title} (Copie)`,
      type: original.type,
      format: original.format,
      period: original.period,
      startDate: original.startDate,
      endDate: original.endDate,
      includedFields: original.includedFields,
    };

    return generateReport(newOptions);
  };

  // 6. ARCHIVE REPORT
  const archiveReport = (reportId: string) => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'ARCHIVÉ' } : r)));
    logRbacAction(currentUser?.email || 'admin@pros.sn', 'REPORT_ARCHIVE', `Archivage du rapport ${reportId}`);
  };

  // 7. SCHEDULE REPORT
  const scheduleReport = (options: Partial<ScheduledReport>): ScheduledReport => {
    const newSchedule: ScheduledReport = {
      id: `SCH-2026-${String(scheduledReports.length + 1).padStart(3, '0')}`,
      title: options.title || 'Rapport Programmé PROS',
      type: options.type || 'VENTES',
      format: options.format || 'PDF',
      frequency: options.frequency || 'WEEKLY',
      nextRunAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      recipientEmails: options.recipientEmails || ['admin@pros.sn'],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      createdBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS',
    };

    setScheduledReports((prev) => [newSchedule, ...prev]);
    logRbacAction(currentUser?.email || 'admin@pros.sn', 'REPORT_SCHEDULE', `Programmation du rapport ${newSchedule.title}`);
    return newSchedule;
  };

  // 8. TOGGLE SCHEDULE STATUS
  const toggleScheduledReportStatus = (scheduleId: string) => {
    setScheduledReports((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, status: s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : s))
    );
  };

  // 9. CANCEL SCHEDULED REPORT
  const cancelScheduledReport = (scheduleId: string) => {
    setScheduledReports((prev) => prev.filter((s) => s.id !== scheduleId));
  };

  return (
    <ReportContext.Provider
      value={{
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
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};
