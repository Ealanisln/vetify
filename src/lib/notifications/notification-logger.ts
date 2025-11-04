/**
 * Notification Logger Service
 *
 * Handles logging of email notifications to the database for audit trail
 * and delivery tracking purposes.
 */

import { prisma } from '@/lib/prisma';
import type { EmailData, EmailSendResult } from '../email/types';
import { EmailStatus, EmailTemplate } from '@prisma/client';

/**
 * Log email send attempt
 */
export async function logEmailSend(
  emailData: EmailData,
  result: EmailSendResult
): Promise<void> {
  try {
    const status: EmailStatus = result.success ? 'SENT' : 'FAILED';

    const templateMap: Record<string, EmailTemplate> = {
      'appointment-confirmation': 'APPOINTMENT_CONFIRMATION',
      'appointment-reminder': 'APPOINTMENT_REMINDER',
      'low-stock-alert': 'LOW_STOCK_ALERT',
      'treatment-reminder': 'TREATMENT_REMINDER',
    };

    await prisma.emailLog.create({
      data: {
        tenantId: emailData.tenantId,
        recipientEmail: emailData.to.email,
        recipientName: emailData.to.name,
        subject: emailData.subject,
        template: templateMap[emailData.template],
        status,
        sentAt: result.success ? new Date() : null,
        failedAt: result.success ? null : new Date(),
        error: result.error,
        resendId: result.messageId,
        metadata: {
          template: emailData.template,
          from: emailData.from,
          ...('data' in emailData ? { data: emailData.data } : {}),
        },
      },
    });
  } catch (error) {
    // Log error but don't throw - logging should not break email sending
    console.error('[NOTIFICATION_LOGGER] Failed to log email send:', error);
  }
}

/**
 * Update email delivery status
 */
export async function updateEmailStatus(
  resendId: string,
  status: EmailStatus,
  error?: string
): Promise<void> {
  try {
    const updateData: {
      status: EmailStatus;
      deliveredAt?: Date;
      bouncedAt?: Date;
      failedAt?: Date;
      error?: string;
    } = { status };

    switch (status) {
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        break;
      case 'BOUNCED':
        updateData.bouncedAt = new Date();
        updateData.error = error;
        break;
      case 'FAILED':
        updateData.failedAt = new Date();
        updateData.error = error;
        break;
    }

    await prisma.emailLog.update({
      where: { resendId },
      data: updateData,
    });
  } catch (error) {
    console.error('[NOTIFICATION_LOGGER] Failed to update email status:', error);
  }
}

/**
 * Get email logs for a tenant
 */
export async function getEmailLogs(
  tenantId: string,
  options: {
    template?: EmailTemplate;
    status?: EmailStatus;
    recipientEmail?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { template, status, recipientEmail, limit = 50, offset = 0 } = options;

  return prisma.emailLog.findMany({
    where: {
      tenantId,
      ...(template && { template }),
      ...(status && { status }),
      ...(recipientEmail && { recipientEmail }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Get email log by ID
 */
export async function getEmailLog(id: string) {
  return prisma.emailLog.findUnique({
    where: { id },
  });
}

/**
 * Get email statistics for a tenant
 */
export async function getEmailStats(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where = {
    tenantId,
    ...(startDate && { createdAt: { gte: startDate } }),
    ...(endDate && { createdAt: { lte: endDate } }),
  };

  const [total, sent, delivered, bounced, failed, byTemplate] = await Promise.all([
    // Total emails
    prisma.emailLog.count({ where }),

    // Sent emails
    prisma.emailLog.count({
      where: { ...where, status: 'SENT' },
    }),

    // Delivered emails
    prisma.emailLog.count({
      where: { ...where, status: 'DELIVERED' },
    }),

    // Bounced emails
    prisma.emailLog.count({
      where: { ...where, status: 'BOUNCED' },
    }),

    // Failed emails
    prisma.emailLog.count({
      where: { ...where, status: 'FAILED' },
    }),

    // By template
    prisma.emailLog.groupBy({
      by: ['template'],
      where,
      _count: true,
    }),
  ]);

  return {
    total,
    sent,
    delivered,
    bounced,
    failed,
    pending: total - sent - delivered - bounced - failed,
    deliveryRate: total > 0 ? ((delivered / total) * 100).toFixed(2) : '0',
    bounceRate: total > 0 ? ((bounced / total) * 100).toFixed(2) : '0',
    failureRate: total > 0 ? ((failed / total) * 100).toFixed(2) : '0',
    byTemplate: byTemplate.map((item) => ({
      template: item.template,
      count: item._count,
    })),
  };
}

/**
 * Delete old email logs (cleanup)
 */
export async function deleteOldEmailLogs(
  tenantId: string,
  olderThanDays: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.emailLog.deleteMany({
    where: {
      tenantId,
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Get recent failed emails for debugging
 */
export async function getRecentFailures(
  tenantId: string,
  limit: number = 10
) {
  return prisma.emailLog.findMany({
    where: {
      tenantId,
      status: 'FAILED',
    },
    orderBy: { failedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      recipientEmail: true,
      subject: true,
      template: true,
      error: true,
      failedAt: true,
      metadata: true,
    },
  });
}
