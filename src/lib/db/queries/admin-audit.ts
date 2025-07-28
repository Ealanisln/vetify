import { prisma } from '@/lib/prisma';
import { AdminAction, Prisma } from '@prisma/client';

export async function logAdminAction(params: {
  action: AdminAction;
  performedByUserId: string | null;
  targetUserId: string;
  targetEmail: string;
  metadata?: Record<string, unknown>;
}) {
  const { action, performedByUserId, targetUserId, targetEmail, metadata } = params;
  return prisma.adminAuditLog.create({
    data: {
      action,
      performedBy: performedByUserId ?? null,
      targetUserId,
      targetEmail,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function fetchAuditLogs(limit = 50) {
  return prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
} 