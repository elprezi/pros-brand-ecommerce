import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  ProsCommunication,
  CommunicationTemplate,
  CommunicationAuditLog,
} from '../types/communication';

interface CommunicationContextType {
  communications: ProsCommunication[];
  templates: CommunicationTemplate[];
  logs: CommunicationAuditLog[];
  
  // Actions
  addCommunication: (commData: Partial<ProsCommunication>, adminName?: string) => ProsCommunication;
  updateCommunication: (updatedComm: ProsCommunication, adminName?: string) => void;
  deleteCommunication: (id: string, adminName?: string) => void;
  duplicateCommunication: (id: string, adminName?: string) => ProsCommunication | undefined;
  sendCommunicationNow: (id: string, adminName?: string) => { success: boolean; error?: string };
  scheduleCommunication: (id: string, scheduledAt: string, adminName?: string) => { success: boolean; error?: string };
  cancelSchedule: (id: string, adminName?: string) => void;
  archiveCommunication: (id: string, adminName?: string) => void;
  
  // Templates Actions
  addTemplate: (templateData: Partial<CommunicationTemplate>) => CommunicationTemplate;
  updateTemplate: (updatedTemplate: CommunicationTemplate) => void;
  deleteTemplate: (id: string) => void;
}

const DEFAULT_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'tpl-1',
    name: 'BIENVENUE NOUVEAU CLIENT',
    category: 'Onboarding',
    type: 'BIENVENUE',
    title: 'Bienvenue dans l’univers PROS',
    eyebrow: 'MARQUE OFFICIELLE SÉNÉGAL',
    content: 'Bonjour {{prenom}},\n\nToute l’équipe PROS est honorée de vous compter parmi nos membres privilégiés. Découvrez dès maintenant notre vestiaire exclusif fabriqué avec passion.',
    channels: ['EMAIL', 'NOTIFICATION'],
    emailSubject: 'Bienvenue chez PROS Brand Sénégal',
    createdAt: '2026-08-18T10:00:00.000Z',
  },
  {
    id: 'tpl-2',
    name: 'CONFIRMATION DE COMMANDE',
    category: 'Commandes',
    type: 'COMMANDE',
    title: 'Votre commande {{commande}} est confirmée',
    eyebrow: 'CONFIRMATION D’ACHAT',
    content: 'Bonjour {{prenom}},\n\nNous avons bien reçu votre commande {{commande}} d’un montant de {{montant}} FCFA. Notre atelier procède actuellement à sa préparation.',
    channels: ['WHATSAPP', 'NOTIFICATION'],
    whatsAppTemplate: 'Bonjour {{prenom}}, votre commande {{commande}} d’un montant de {{montant}} FCFA est validée et en préparation.',
    createdAt: '2026-08-18T10:30:00.000Z',
  },
  {
    id: 'tpl-3',
    name: 'COMMANDE EXPÉDIÉE',
    category: 'Commandes',
    type: 'COMMANDE',
    title: 'Votre commande {{commande}} est en cours de livraison',
    eyebrow: 'EXPÉDITION EXPRESS DAKAR & SÉNÉGAL',
    content: 'Bonjour {{prenom}},\n\nBonne nouvelle ! Votre colis est confié à notre livreur express. Vous serez contacté très prochainement pour la remise en main propre.',
    channels: ['WHATSAPP', 'NOTIFICATION', 'SMS'],
    whatsAppTemplate: 'Bonjour {{prenom}}, votre colis {{commande}} est en route avec notre livreur. Merci de votre confiance !',
    createdAt: '2026-08-18T11:00:00.000Z',
  },
  {
    id: 'tpl-4',
    name: 'NOUVELLE COLLECTION SIGNATURE',
    category: 'Promotions & Lancement',
    type: 'PROMOTION',
    title: 'Lancement exclusif Collection Signature 2026',
    eyebrow: 'SÉRIE LIMITÉE HAUTE DENSITÉ 480GSM',
    content: 'Bonjour {{prenom}},\n\nDécouvrez en avant-première les nouvelles pièces d’exception de la Collection Signature PROS. Stocks ultra-limités.',
    channels: ['SITE', 'WHATSAPP', 'EMAIL'],
    emailSubject: 'Lancement officiel : Collection Signature PROS 2026',
    whatsAppTemplate: 'Bonjour {{prenom}}, découvrez la nouvelle Collection Signature 2026 en avant-première privée sur www.pros.sn',
    createdAt: '2026-08-18T11:30:00.000Z',
  },
  {
    id: 'tpl-5',
    name: 'CODE PROMO -15% PROS CLUB',
    category: 'Fidélité',
    type: 'FIDELITE',
    title: 'Vos points de fidélité vous offrent -15%',
    eyebrow: 'OFFRE PRIVILÈGE PROS CLUB',
    content: 'Bonjour {{prenom}},\n\nPour vous remercier de votre fidélité, profitez d’une remise immédiate de 15% avec le code {{code_promo}} dès 30 000 FCFA d’achats.',
    channels: ['WHATSAPP', 'NOTIFICATION', 'EMAIL'],
    createdAt: '2026-08-18T12:00:00.000Z',
  },
];

const INITIAL_COMMUNICATIONS: ProsCommunication[] = [];

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

const COMM_KEY = 'pros_communications_v1';
const TEMPLATE_KEY = 'pros_comm_templates_v1';
const LOG_KEY = 'pros_comm_logs_v1';

export const CommunicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [communications, setCommunications] = useState<ProsCommunication[]>(() => {
    const saved = localStorage.getItem(COMM_KEY);
    return saved ? JSON.parse(saved) : INITIAL_COMMUNICATIONS;
  });

  const [templates, setTemplates] = useState<CommunicationTemplate[]>(() => {
    const saved = localStorage.getItem(TEMPLATE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });

  const [logs, setLogs] = useState<CommunicationAuditLog[]>(() => {
    const saved = localStorage.getItem(LOG_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(COMM_KEY, JSON.stringify(communications));
  }, [communications]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  }, [logs]);

  const addLog = (communicationId: string, action: string, adminName = 'Service Pro (Admin)', oldStatus?: string, newStatus?: string, notes?: string) => {
    const newLog: CommunicationAuditLog = {
      id: `comm-log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      communicationId,
      action,
      adminName,
      oldStatus,
      newStatus,
      notes,
      timestamp: new Date().toLocaleString('fr-FR'),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const addCommunication = (commData: Partial<ProsCommunication>, adminName = 'Service Pro (Admin)'): ProsCommunication => {
    const nextId = `COM-2026-${String(communications.length + 1).padStart(3, '0')}`;
    const newComm: ProsCommunication = {
      id: nextId,
      type: commData.type || 'MESSAGE',
      title: commData.title || 'Nouvelle Communication PROS',
      eyebrow: commData.eyebrow,
      content: commData.content || '',
      mediaId: commData.mediaId,
      imageUrl: commData.imageUrl,
      ctaText: commData.ctaText || 'DÉCOUVRIR',
      ctaUrl: commData.ctaUrl || '/shop',
      channels: commData.channels || ['SITE'],
      whatsAppTemplate: commData.whatsAppTemplate,
      emailSubject: commData.emailSubject,
      emailSenderName: commData.emailSenderName || 'PROS Brand Sénégal',
      emailSenderEmail: commData.emailSenderEmail || 'contact@pros.sn',
      notificationIcon: commData.notificationIcon || 'Bell',
      audienceType: commData.audienceType || 'ALL_CUSTOMERS',
      customRules: commData.customRules,
      targetCustomerId: commData.targetCustomerId,
      recipientsCount: commData.recipientsCount || 100,
      status: commData.status || 'DRAFT',
      scheduledAt: commData.scheduledAt,
      createdAt: new Date().toISOString(),
      createdBy: adminName,
      statistics: commData.statistics || { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, converted: 0 },
    };

    setCommunications((prev) => [newComm, ...prev]);
    addLog(newComm.id, 'COMMUNICATION_CREATED', adminName, undefined, newComm.status, `Création communication (${newComm.title})`);
    return newComm;
  };

  const updateCommunication = (updatedComm: ProsCommunication, adminName = 'Service Pro (Admin)') => {
    const target = communications.find((c) => c.id === updatedComm.id);
    const updated: ProsCommunication = {
      ...updatedComm,
      updatedAt: new Date().toISOString(),
    };

    setCommunications((prev) => prev.map((c) => (c.id === updatedComm.id ? updated : c)));
    addLog(updatedComm.id, 'COMMUNICATION_UPDATED', adminName, target?.status, updatedComm.status, `Mise à jour (${updatedComm.title})`);
  };

  const deleteCommunication = (id: string, adminName = 'Service Pro (Admin)') => {
    const target = communications.find((c) => c.id === id);
    setCommunications((prev) => prev.filter((c) => c.id !== id));
    addLog(id, 'COMMUNICATION_DELETED', adminName, target?.status, 'DELETED', `Suppression communication (${target?.title})`);
  };

  const duplicateCommunication = (id: string, adminName = 'Service Pro (Admin)'): ProsCommunication | undefined => {
    const target = communications.find((c) => c.id === id);
    if (!target) return undefined;

    const dupData: Partial<ProsCommunication> = {
      ...JSON.parse(JSON.stringify(target)),
      title: `${target.title} (Copie)`,
      status: 'DRAFT',
      scheduledAt: undefined,
      sentAt: undefined,
      createdAt: new Date().toISOString(),
      createdBy: adminName,
      statistics: { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, converted: 0 },
    };
    delete dupData.id;

    const created = addCommunication(dupData, adminName);
    addLog(created.id, 'COMMUNICATION_DUPLICATED', adminName, 'DRAFT', 'DRAFT', `Dupliqué depuis ${target.id}`);
    return created;
  };

  const sendCommunicationNow = (id: string, adminName = 'Service Pro (Admin)'): { success: boolean; error?: string } => {
    const target = communications.find((c) => c.id === id);
    if (!target) return { success: false, error: 'Communication introuvable.' };

    const recipients = target.recipientsCount || 100;
    const delivered = Math.floor(recipients * 0.97);
    const failed = recipients - delivered;
    const opened = Math.floor(delivered * 0.75);
    const clicked = Math.floor(opened * 0.40);
    const converted = Math.floor(clicked * 0.20);

    const updated: ProsCommunication = {
      ...target,
      status: 'SENT',
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statistics: {
        sent: recipients,
        delivered,
        failed,
        opened,
        clicked,
        converted,
      },
    };

    setCommunications((prev) => prev.map((c) => (c.id === id ? updated : c)));
    addLog(id, 'COMMUNICATION_SENT', adminName, target.status, 'SENT', `Envoi immédiat effectué à ${recipients} destinataires`);
    return { success: true };
  };

  const scheduleCommunication = (id: string, scheduledAt: string, adminName = 'Service Pro (Admin)'): { success: boolean; error?: string } => {
    const target = communications.find((c) => c.id === id);
    if (!target) return { success: false, error: 'Communication introuvable.' };

    const updated: ProsCommunication = {
      ...target,
      status: 'SCHEDULED',
      scheduledAt,
      updatedAt: new Date().toISOString(),
    };

    setCommunications((prev) => prev.map((c) => (c.id === id ? updated : c)));
    addLog(id, 'COMMUNICATION_SCHEDULED', adminName, target.status, 'SCHEDULED', `Programmation pour ${new Date(scheduledAt).toLocaleString('fr-FR')}`);
    return { success: true };
  };

  const cancelSchedule = (id: string, adminName = 'Service Pro (Admin)') => {
    const target = communications.find((c) => c.id === id);
    if (!target) return;

    const updated: ProsCommunication = {
      ...target,
      status: 'DRAFT',
      scheduledAt: undefined,
      updatedAt: new Date().toISOString(),
    };

    setCommunications((prev) => prev.map((c) => (c.id === id ? updated : c)));
    addLog(id, 'COMMUNICATION_SCHEDULE_CANCELLED', adminName, 'SCHEDULED', 'DRAFT', 'Programmation annulée, retour en brouillon');
  };

  const archiveCommunication = (id: string, adminName = 'Service Pro (Admin)') => {
    const target = communications.find((c) => c.id === id);
    if (!target) return;

    const updated: ProsCommunication = {
      ...target,
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
    };

    setCommunications((prev) => prev.map((c) => (c.id === id ? updated : c)));
    addLog(id, 'COMMUNICATION_ARCHIVED', adminName, target.status, 'ARCHIVED', 'Archivage');
  };

  const addTemplate = (templateData: Partial<CommunicationTemplate>): CommunicationTemplate => {
    const newTpl: CommunicationTemplate = {
      id: `tpl-${Date.now()}`,
      name: templateData.name || 'NOUVEAU MODÈLE',
      category: templateData.category || 'Général',
      type: templateData.type || 'PROMOTION',
      title: templateData.title || '',
      eyebrow: templateData.eyebrow,
      content: templateData.content || '',
      channels: templateData.channels || ['SITE'],
      whatsAppTemplate: templateData.whatsAppTemplate,
      emailSubject: templateData.emailSubject,
      createdAt: new Date().toISOString(),
    };

    setTemplates((prev) => [newTpl, ...prev]);
    return newTpl;
  };

  const updateTemplate = (updatedTemplate: CommunicationTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)));
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <CommunicationContext.Provider
      value={{
        communications,
        templates,
        logs,
        addCommunication,
        updateCommunication,
        deleteCommunication,
        duplicateCommunication,
        sendCommunicationNow,
        scheduleCommunication,
        cancelSchedule,
        archiveCommunication,
        addTemplate,
        updateTemplate,
        deleteTemplate,
      }}
    >
      {children}
    </CommunicationContext.Provider>
  );
};

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};
