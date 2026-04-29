import { prisma } from '@/lib/prisma';
import type { Prisma, ReferralPartner, ReferralCode, ReferralConversion } from '@prisma/client';

// ============================================================================
// PARTNER CRUD
// ============================================================================

export type PartnerCreateInput = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  commissionPercent: number;
  notes?: string;
  createdBy?: string;
};

export type PartnerUpdateInput = Partial<Omit<PartnerCreateInput, 'createdBy'>>;

export async function getAllPartners() {
  return prisma.referralPartner.findMany({
    include: {
      referralCodes: {
        select: { id: true, code: true, isActive: true, clickCount: true },
      },
      _count: {
        select: { conversions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPartnerById(id: string) {
  return prisma.referralPartner.findUnique({
    where: { id },
    include: {
      referralCodes: true,
      conversions: {
        include: {
          tenant: { select: { id: true, name: true, slug: true, planType: true } },
          code: { select: { code: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createPartner(data: PartnerCreateInput): Promise<ReferralPartner> {
  return prisma.referralPartner.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      commissionPercent: data.commissionPercent,
      notes: data.notes,
      createdBy: data.createdBy,
    },
  });
}

export async function updatePartner(id: string, data: PartnerUpdateInput): Promise<ReferralPartner> {
  return prisma.referralPartner.update({
    where: { id },
    data,
  });
}

export async function deactivatePartner(id: string): Promise<ReferralPartner> {
  return prisma.referralPartner.update({
    where: { id },
    data: { isActive: false },
  });
}

// ============================================================================
// REFERRAL CODE CRUD
// ============================================================================

export type CodeCreateInput = {
  code: string;
  partnerId: string;
  discountPercent?: number;
  discountMonths?: number;
  stripeCouponId?: string;
};

export async function getPartnerCodes(partnerId: string): Promise<ReferralCode[]> {
  return prisma.referralCode.findMany({
    where: { partnerId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createReferralCode(data: CodeCreateInput): Promise<ReferralCode> {
  return prisma.referralCode.create({
    data: {
      code: data.code.toUpperCase(),
      partnerId: data.partnerId,
      discountPercent: data.discountPercent,
      discountMonths: data.discountMonths,
      stripeCouponId: data.stripeCouponId,
    },
  });
}

export async function updateReferralCode(
  id: string,
  data: Partial<Omit<CodeCreateInput, 'partnerId'>>
): Promise<ReferralCode> {
  return prisma.referralCode.update({
    where: { id },
    data: {
      ...data,
      code: data.code?.toUpperCase(),
    },
  });
}

export async function deactivateReferralCode(id: string): Promise<ReferralCode> {
  return prisma.referralCode.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Resolve a referral code string to its active code + partner.
 * Used at onboarding/checkout to validate and attribute referrals.
 */
export async function resolveReferralCode(code: string) {
  return prisma.referralCode.findFirst({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      partner: { isActive: true },
    },
    include: {
      partner: {
        select: {
          id: true,
          name: true,
          email: true,
          commissionPercent: true,
        },
      },
    },
  });
}

/**
 * Atomically increment click counter for a referral code.
 */
export async function incrementClickCount(codeId: string): Promise<void> {
  await prisma.referralCode.update({
    where: { id: codeId },
    data: { clickCount: { increment: 1 } },
  });
}

// ============================================================================
// CONVERSION TRACKING
// ============================================================================

export async function createConversion(data: {
  partnerId: string;
  codeId: string;
  tenantId: string;
}): Promise<ReferralConversion> {
  return prisma.referralConversion.create({
    data: {
      partnerId: data.partnerId,
      codeId: data.codeId,
      tenantId: data.tenantId,
      status: 'SIGNUP',
    },
  });
}

/**
 * Mark a conversion as CONVERTED when the tenant makes their first payment.
 * Calculates commission based on the partner's rate at time of conversion.
 */
export async function markConversionConverted(
  tenantId: string,
  planKey: string,
  subscriptionAmount: number
): Promise<ReferralConversion | null> {
  const conversion = await prisma.referralConversion.findFirst({
    where: {
      tenantId,
      status: 'SIGNUP',
    },
    include: {
      partner: { select: { commissionPercent: true } },
    },
  });

  if (!conversion) return null;

  const commissionPercent = Number(conversion.partner.commissionPercent);
  const commissionAmount = (subscriptionAmount * commissionPercent) / 100;

  return prisma.referralConversion.update({
    where: { id: conversion.id },
    data: {
      status: 'CONVERTED',
      convertedAt: new Date(),
      planKey,
      subscriptionAmount,
      commissionPercent,
      commissionAmount,
    },
  });
}

/**
 * Mark a conversion as CHURNED when the tenant cancels.
 */
export async function markConversionChurned(tenantId: string): Promise<void> {
  await prisma.referralConversion.updateMany({
    where: {
      tenantId,
      status: 'CONVERTED',
    },
    data: { status: 'CHURNED' },
  });
}

// ============================================================================
// PAYOUT MANAGEMENT
// ============================================================================

export async function updatePayoutStatus(
  conversionId: string,
  status: 'APPROVED' | 'PAID' | 'VOID',
  adminId: string,
  notes?: string
): Promise<ReferralConversion> {
  return prisma.referralConversion.update({
    where: { id: conversionId },
    data: {
      payoutStatus: status,
      ...(status === 'PAID' ? { paidAt: new Date(), paidBy: adminId } : {}),
      ...(notes ? { payoutNotes: notes } : {}),
    },
  });
}

export async function bulkUpdatePayoutStatus(
  conversionIds: string[],
  status: 'APPROVED' | 'PAID' | 'VOID',
  adminId: string,
  notes?: string
) {
  return prisma.referralConversion.updateMany({
    where: { id: { in: conversionIds } },
    data: {
      payoutStatus: status,
      ...(status === 'PAID' ? { paidAt: new Date(), paidBy: adminId } : {}),
      ...(notes ? { payoutNotes: notes } : {}),
    },
  });
}

// ============================================================================
// QUERIES & STATS
// ============================================================================

export async function getConversions(filters?: {
  status?: 'SIGNUP' | 'CONVERTED' | 'CHURNED';
  payoutStatus?: 'PENDING' | 'APPROVED' | 'PAID' | 'VOID';
  partnerId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.ReferralConversionWhereInput = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.payoutStatus) where.payoutStatus = filters.payoutStatus;
  if (filters?.partnerId) where.partnerId = filters.partnerId;

  const [conversions, total] = await Promise.all([
    prisma.referralConversion.findMany({
      where,
      include: {
        partner: { select: { id: true, name: true, email: true } },
        code: { select: { code: true } },
        tenant: { select: { id: true, name: true, slug: true, planType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    }),
    prisma.referralConversion.count({ where }),
  ]);

  return { conversions, total };
}

export async function getReferralStats() {
  const [
    totalPartners,
    activePartners,
    totalCodes,
    totalSignups,
    totalConverted,
    pendingPayouts,
    totalPaid,
  ] = await Promise.all([
    prisma.referralPartner.count(),
    prisma.referralPartner.count({ where: { isActive: true } }),
    prisma.referralCode.count({ where: { isActive: true } }),
    prisma.referralConversion.count({ where: { status: 'SIGNUP' } }),
    prisma.referralConversion.count({ where: { status: 'CONVERTED' } }),
    prisma.referralConversion.aggregate({
      where: { status: 'CONVERTED', payoutStatus: { in: ['PENDING', 'APPROVED'] } },
      _sum: { commissionAmount: true },
    }),
    prisma.referralConversion.aggregate({
      where: { payoutStatus: 'PAID' },
      _sum: { commissionAmount: true },
    }),
  ]);

  return {
    totalPartners,
    activePartners,
    totalCodes,
    totalSignups,
    totalConverted,
    conversionRate: totalSignups > 0 ? ((totalConverted / (totalSignups + totalConverted)) * 100).toFixed(1) : '0',
    pendingCommissions: Number(pendingPayouts._sum.commissionAmount || 0),
    totalPaidCommissions: Number(totalPaid._sum.commissionAmount || 0),
  };
}

export async function getPartnerReport(partnerId: string) {
  const [partner, conversions, totals] = await Promise.all([
    prisma.referralPartner.findUnique({
      where: { id: partnerId },
      include: { referralCodes: true },
    }),
    prisma.referralConversion.findMany({
      where: { partnerId },
      include: {
        code: { select: { code: true } },
        tenant: { select: { name: true, planType: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.referralConversion.aggregate({
      where: { partnerId, status: 'CONVERTED' },
      _sum: { commissionAmount: true, subscriptionAmount: true },
      _count: true,
    }),
  ]);

  return {
    partner,
    conversions,
    totalConversions: totals._count,
    totalCommission: Number(totals._sum.commissionAmount || 0),
    totalRevenue: Number(totals._sum.subscriptionAmount || 0),
  };
}
