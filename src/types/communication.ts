export type CommunicationType =
  | 'MESSAGE'
  | 'NOTIFICATION'
  | 'ANNONCE'
  | 'PROMOTION'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'COMMANDE'
  | 'FIDELITE'
  | 'SYSTEME'
  | 'BIENVENUE';

export type CommunicationChannel = 'SITE' | 'NOTIFICATION' | 'WHATSAPP' | 'EMAIL' | 'SMS';

export type CommunicationStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'ARCHIVED';

export type CommunicationAudienceType =
  | 'ALL_CUSTOMERS'
  | 'ACTIVE_CUSTOMERS'
  | 'NEW_CUSTOMERS'
  | 'PROSPECTS'
  | 'PREMIUM_CUSTOMERS'
  | 'PROS_CLUB_MEMBERS'
  | 'PAST_BUYERS'
  | 'INACTIVE_30_DAYS'
  | 'CUSTOM_SEGMENT'
  | 'SINGLE_CUSTOMER';

export interface CustomAudienceRules {
  city?: string;
  region?: string;
  minOrders?: number;
  minSpentFcfa?: number;
  lastOrderDays?: number;
  customerStatus?: string;
}

export interface CommunicationStats {
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface ProsCommunication {
  id: string;
  type: CommunicationType;
  title: string;
  eyebrow?: string;
  content: string;
  mediaId?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;

  channels: CommunicationChannel[];

  // Channel specific details
  whatsAppTemplate?: string;
  emailSubject?: string;
  emailSenderName?: string;
  emailSenderEmail?: string;
  notificationIcon?: string;

  // Targeting
  audienceType: CommunicationAudienceType;
  customRules?: CustomAudienceRules;
  targetCustomerId?: string; // For 360° single customer direct messaging
  recipientsCount: number;

  status: CommunicationStatus;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;

  statistics: CommunicationStats;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  category: string;
  type: CommunicationType;
  title: string;
  eyebrow?: string;
  content: string;
  channels: CommunicationChannel[];
  whatsAppTemplate?: string;
  emailSubject?: string;
  createdAt: string;
}

export interface CommunicationAuditLog {
  id: string;
  communicationId: string;
  action: string;
  adminName: string;
  oldStatus?: string;
  newStatus?: string;
  notes?: string;
  timestamp: string;
}
