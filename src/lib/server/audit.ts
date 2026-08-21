export interface AuditLogEntry {
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const auditLogsStore: AuditLogEntry[] = [];

export function createAuditLog(
  action: string,
  entity: string,
  entityId: string,
  userId?: string,
  metadata?: Record<string, any>
): AuditLogEntry {
  const entry: AuditLogEntry = {
    userId: userId || 'SYSTEM_ADMIN',
    action,
    entity,
    entityId,
    metadata,
    createdAt: new Date().toISOString(),
  };

  auditLogsStore.push(entry);
  console.log(`[AUDIT LOG] ${entry.action} on ${entry.entity} (${entry.entityId}) by ${entry.userId}`);
  return entry;
}

export function getAuditLogs(): AuditLogEntry[] {
  return auditLogsStore;
}
