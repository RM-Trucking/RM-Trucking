export interface AuditLog {
  auditId: number;
  actorUserId: number | null;
  subjectUserId: number | null;
  eventType: string;
  objectType: string;
  objectId: string | null;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILURE';
  reason: string | null;
  requestId: string | null;
  sourceIp: string | null;
  occurredAt: Date;
  details: Record<string, unknown> | null;
}
