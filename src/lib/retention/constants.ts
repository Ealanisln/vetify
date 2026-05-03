export const DATA_RETENTION_DAYS = 90;
export const RETENTION_WARNING_DAYS_BEFORE = 7;
export const RETENTION_PURGE_BATCH_LIMIT = 10;
export const RETENTION_WARNING_BATCH_LIMIT = 50;

export const RETENTION_TRIGGER_STATUSES = [
  'CANCELED',
  'UNPAID',
  'INCOMPLETE_EXPIRED',
] as const;

export function computeRetentionEndsAt(from: Date = new Date()): Date {
  const end = new Date(from);
  end.setUTCDate(end.getUTCDate() + DATA_RETENTION_DAYS);
  return end;
}
