export interface PurgeResult {
  scanned: number;
  purged: string[];
  skippedReactivated: string[];
  failed: { tenantId: string; error: string }[];
  remaining: boolean;
}

export interface TenantSnapshot {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  canceledAt: Date | null;
  dataRetentionEndsAt: Date | null;
  counts: {
    customers: number;
    pets: number;
    medicalHistories: number;
    appointments: number;
    sales: number;
    users: number;
  };
}
