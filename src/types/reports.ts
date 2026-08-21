export type ReportType =
  | 'VENTES'
  | 'FINANCE'
  | 'COMMANDES'
  | 'PRODUITS'
  | 'STOCK'
  | 'CLIENTS'
  | 'LIVRAISONS'
  | 'MARKETING'
  | 'PROS_CLUB'
  | 'GLOBAL';

export type ReportFormat = 'PDF' | 'EXCEL' | 'CSV' | 'JSON';

export type ReportStatus = 'TERMINÉ' | 'EN COURS' | 'PROGRAMMÉ' | 'ÉCHEC' | 'EXPIRÉ' | 'ARCHIVÉ';

export type ReportPeriod = 'today' | '7d' | '30d' | '90d' | '12m' | 'custom';

export interface PROSReport {
  id: string; // e.g. RPT-2026-0001
  title: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  generatedAt: string;
  generatedBy: string;
  fileSize: string;
  fileSizeBytes: number;
  downloadCount: number;
  includedFields: string[];
  isScheduled?: boolean;
  scheduleFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  recipientEmails?: string[];
  dataPayload?: any;
}

export interface ScheduledReport {
  id: string;
  title: string;
  type: ReportType;
  format: ReportFormat;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  nextRunAt: string;
  recipientEmails: string[];
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
  createdBy: string;
}

export interface ReportHistoryEntry {
  id: string;
  reportId: string;
  reportTitle: string;
  type: ReportType;
  format: ReportFormat;
  action: 'GENERATION' | 'DOWNLOAD' | 'RENAME' | 'DUPLICATE' | 'ARCHIVE' | 'DELETE';
  timestamp: string;
  user: string;
  status: ReportStatus;
  durationMs?: number;
  fileSize?: string;
  errorMessage?: string;
}

export interface ReportDownloadLog {
  id: string;
  reportId: string;
  reportTitle: string;
  format: ReportFormat;
  downloadedAt: string;
  downloadedBy: string;
}

export interface ReportGenerationOptions {
  title?: string;
  type: ReportType;
  format: ReportFormat;
  period: ReportPeriod;
  startDate?: string;
  endDate?: string;
  includedFields: string[];
  recipientEmails?: string[];
  isScheduled?: boolean;
  scheduleFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}
