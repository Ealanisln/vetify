/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../../mocks/prisma';

import {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deactivatePartner,
  getPartnerCodes,
  createReferralCode,
  updateReferralCode,
  deactivateReferralCode,
  resolveReferralCode,
  incrementClickCount,
  createConversion,
  markConversionConverted,
  markConversionChurned,
  updatePayoutStatus,
  bulkUpdatePayoutStatus,
  getConversions,
  getReferralStats,
  getPartnerReport,
} from '@/lib/referrals/queries';

// Test data factories
const createMockPartner = (overrides = {}) => ({
  id: 'partner-1',
  name: 'Dr. Smith',
  email: 'drsmith@example.com',
  phone: '555-1234',
  company: 'Vet Clinic A',
  commissionPercent: 20,
  isActive: true,
  notes: null,
  createdBy: 'admin-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const createMockCode = (overrides = {}) => ({
  id: 'code-1',
  code: 'DRSMITH',
  partnerId: 'partner-1',
  isActive: true,
  discountPercent: null,
  discountMonths: null,
  stripeCouponId: null,
  clickCount: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const createMockConversion = (overrides = {}) => ({
  id: 'conv-1',
  partnerId: 'partner-1',
  codeId: 'code-1',
  tenantId: 'tenant-1',
  status: 'SIGNUP',
  signedUpAt: new Date('2026-01-15'),
  convertedAt: null,
  planKey: null,
  subscriptionAmount: null,
  commissionPercent: null,
  commissionAmount: null,
  payoutStatus: 'PENDING',
  paidAt: null,
  paidBy: null,
  payoutNotes: null,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
  ...overrides,
});

describe('Referral Queries', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================================
  // PARTNER CRUD
  // ============================================================================

  describe('getAllPartners', () => {
    it('should return all partners with codes and conversion count', async () => {
      const partners = [
        { ...createMockPartner(), referralCodes: [createMockCode()], _count: { conversions: 3 } },
      ];
      prismaMock.referralPartner.findMany.mockResolvedValue(partners as any);

      const result = await getAllPartners();

      expect(result).toEqual(partners);
      expect(prismaMock.referralPartner.findMany).toHaveBeenCalledWith({
        include: {
          referralCodes: {
            select: { id: true, code: true, isActive: true, clickCount: true },
          },
          _count: { select: { conversions: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no partners exist', async () => {
      prismaMock.referralPartner.findMany.mockResolvedValue([]);

      const result = await getAllPartners();

      expect(result).toEqual([]);
    });
  });

  describe('getPartnerById', () => {
    it('should return partner with codes and conversions', async () => {
      const partner = {
        ...createMockPartner(),
        referralCodes: [createMockCode()],
        conversions: [],
      };
      prismaMock.referralPartner.findUnique.mockResolvedValue(partner as any);

      const result = await getPartnerById('partner-1');

      expect(result).toEqual(partner);
      expect(prismaMock.referralPartner.findUnique).toHaveBeenCalledWith({
        where: { id: 'partner-1' },
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
    });

    it('should return null when partner not found', async () => {
      prismaMock.referralPartner.findUnique.mockResolvedValue(null);

      const result = await getPartnerById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createPartner', () => {
    it('should create a partner with all fields', async () => {
      const input = {
        name: 'Dr. Smith',
        email: 'drsmith@example.com',
        phone: '555-1234',
        company: 'Vet Clinic A',
        commissionPercent: 20,
        notes: 'VIP partner',
        createdBy: 'admin-1',
      };
      const created = createMockPartner(input);
      prismaMock.referralPartner.create.mockResolvedValue(created as any);

      const result = await createPartner(input);

      expect(result).toEqual(created);
      expect(prismaMock.referralPartner.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          commissionPercent: input.commissionPercent,
          notes: input.notes,
          createdBy: input.createdBy,
        },
      });
    });

    it('should create a partner with minimal fields', async () => {
      const input = {
        name: 'Dr. Jones',
        email: 'drjones@example.com',
        commissionPercent: 15,
      };
      const created = createMockPartner(input);
      prismaMock.referralPartner.create.mockResolvedValue(created as any);

      const result = await createPartner(input);

      expect(result).toEqual(created);
      expect(prismaMock.referralPartner.create).toHaveBeenCalledWith({
        data: {
          name: input.name,
          email: input.email,
          phone: undefined,
          company: undefined,
          commissionPercent: input.commissionPercent,
          notes: undefined,
          createdBy: undefined,
        },
      });
    });
  });

  describe('updatePartner', () => {
    it('should update partner fields', async () => {
      const updated = createMockPartner({ name: 'Updated Name' });
      prismaMock.referralPartner.update.mockResolvedValue(updated as any);

      const result = await updatePartner('partner-1', { name: 'Updated Name' });

      expect(result).toEqual(updated);
      expect(prismaMock.referralPartner.update).toHaveBeenCalledWith({
        where: { id: 'partner-1' },
        data: { name: 'Updated Name' },
      });
    });
  });

  describe('deactivatePartner', () => {
    it('should set isActive to false', async () => {
      const deactivated = createMockPartner({ isActive: false });
      prismaMock.referralPartner.update.mockResolvedValue(deactivated as any);

      const result = await deactivatePartner('partner-1');

      expect(result.isActive).toBe(false);
      expect(prismaMock.referralPartner.update).toHaveBeenCalledWith({
        where: { id: 'partner-1' },
        data: { isActive: false },
      });
    });
  });

  // ============================================================================
  // REFERRAL CODE CRUD
  // ============================================================================

  describe('getPartnerCodes', () => {
    it('should return codes for a partner ordered by createdAt desc', async () => {
      const codes = [createMockCode(), createMockCode({ id: 'code-2', code: 'DRSMITH2' })];
      prismaMock.referralCode.findMany.mockResolvedValue(codes as any);

      const result = await getPartnerCodes('partner-1');

      expect(result).toEqual(codes);
      expect(prismaMock.referralCode.findMany).toHaveBeenCalledWith({
        where: { partnerId: 'partner-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('createReferralCode', () => {
    it('should create a code with uppercase conversion', async () => {
      const created = createMockCode({ code: 'NEWCODE' });
      prismaMock.referralCode.create.mockResolvedValue(created as any);

      const result = await createReferralCode({
        code: 'newcode',
        partnerId: 'partner-1',
      });

      expect(result).toEqual(created);
      expect(prismaMock.referralCode.create).toHaveBeenCalledWith({
        data: {
          code: 'NEWCODE',
          partnerId: 'partner-1',
          discountPercent: undefined,
          discountMonths: undefined,
          stripeCouponId: undefined,
        },
      });
    });

    it('should create a code with discount and coupon', async () => {
      const created = createMockCode({
        code: 'SAVE20',
        discountPercent: 20,
        discountMonths: 3,
        stripeCouponId: 'coupon_abc',
      });
      prismaMock.referralCode.create.mockResolvedValue(created as any);

      await createReferralCode({
        code: 'save20',
        partnerId: 'partner-1',
        discountPercent: 20,
        discountMonths: 3,
        stripeCouponId: 'coupon_abc',
      });

      expect(prismaMock.referralCode.create).toHaveBeenCalledWith({
        data: {
          code: 'SAVE20',
          partnerId: 'partner-1',
          discountPercent: 20,
          discountMonths: 3,
          stripeCouponId: 'coupon_abc',
        },
      });
    });
  });

  describe('updateReferralCode', () => {
    it('should uppercase code when updating', async () => {
      const updated = createMockCode({ code: 'UPDATED' });
      prismaMock.referralCode.update.mockResolvedValue(updated as any);

      await updateReferralCode('code-1', { code: 'updated' });

      expect(prismaMock.referralCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { code: 'UPDATED' },
      });
    });

    it('should handle update without code field', async () => {
      const updated = createMockCode({ discountPercent: 30 });
      prismaMock.referralCode.update.mockResolvedValue(updated as any);

      await updateReferralCode('code-1', { discountPercent: 30 });

      expect(prismaMock.referralCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { discountPercent: 30, code: undefined },
      });
    });
  });

  describe('deactivateReferralCode', () => {
    it('should set isActive to false', async () => {
      const deactivated = createMockCode({ isActive: false });
      prismaMock.referralCode.update.mockResolvedValue(deactivated as any);

      const result = await deactivateReferralCode('code-1');

      expect(result.isActive).toBe(false);
      expect(prismaMock.referralCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { isActive: false },
      });
    });
  });

  describe('resolveReferralCode', () => {
    it('should resolve a valid active code with active partner', async () => {
      const resolved = {
        ...createMockCode(),
        partner: {
          id: 'partner-1',
          name: 'Dr. Smith',
          email: 'drsmith@example.com',
          commissionPercent: 20,
        },
      };
      prismaMock.referralCode.findFirst.mockResolvedValue(resolved as any);

      const result = await resolveReferralCode('drsmith');

      expect(result).toEqual(resolved);
      expect(prismaMock.referralCode.findFirst).toHaveBeenCalledWith({
        where: {
          code: 'DRSMITH',
          isActive: true,
          partner: { isActive: true },
        },
        include: {
          partner: {
            select: { id: true, name: true, email: true, commissionPercent: true },
          },
        },
      });
    });

    it('should perform case-insensitive lookup by uppercasing input', async () => {
      prismaMock.referralCode.findFirst.mockResolvedValue(null);

      await resolveReferralCode('DrSmith');

      expect(prismaMock.referralCode.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ code: 'DRSMITH' }) })
      );
    });

    it('should return null when code not found or inactive', async () => {
      prismaMock.referralCode.findFirst.mockResolvedValue(null);

      const result = await resolveReferralCode('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('incrementClickCount', () => {
    it('should atomically increment click count', async () => {
      prismaMock.referralCode.update.mockResolvedValue(createMockCode({ clickCount: 1 }) as any);

      await incrementClickCount('code-1');

      expect(prismaMock.referralCode.update).toHaveBeenCalledWith({
        where: { id: 'code-1' },
        data: { clickCount: { increment: 1 } },
      });
    });
  });

  // ============================================================================
  // CONVERSION TRACKING
  // ============================================================================

  describe('createConversion', () => {
    it('should create a conversion with SIGNUP status', async () => {
      const conversion = createMockConversion();
      prismaMock.referralConversion.create.mockResolvedValue(conversion as any);

      const result = await createConversion({
        partnerId: 'partner-1',
        codeId: 'code-1',
        tenantId: 'tenant-1',
      });

      expect(result).toEqual(conversion);
      expect(prismaMock.referralConversion.create).toHaveBeenCalledWith({
        data: {
          partnerId: 'partner-1',
          codeId: 'code-1',
          tenantId: 'tenant-1',
          status: 'SIGNUP',
        },
      });
    });
  });

  describe('markConversionConverted', () => {
    it('should convert a SIGNUP conversion and calculate commission', async () => {
      const signupConversion = {
        ...createMockConversion(),
        partner: { commissionPercent: 20 },
      };
      prismaMock.referralConversion.findFirst.mockResolvedValue(signupConversion as any);

      const convertedConversion = createMockConversion({
        status: 'CONVERTED',
        convertedAt: new Date(),
        planKey: 'PROFESIONAL',
        subscriptionAmount: 499,
        commissionPercent: 20,
        commissionAmount: 99.8,
      });
      prismaMock.referralConversion.update.mockResolvedValue(convertedConversion as any);

      const result = await markConversionConverted('tenant-1', 'PROFESIONAL', 499);

      expect(result).toEqual(convertedConversion);
      expect(prismaMock.referralConversion.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', status: 'SIGNUP' },
        include: { partner: { select: { commissionPercent: true } } },
      });
      expect(prismaMock.referralConversion.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: expect.objectContaining({
          status: 'CONVERTED',
          planKey: 'PROFESIONAL',
          subscriptionAmount: 499,
          commissionPercent: 20,
          commissionAmount: 99.8,
        }),
      });
    });

    it('should return null when no SIGNUP conversion exists for tenant', async () => {
      prismaMock.referralConversion.findFirst.mockResolvedValue(null);

      const result = await markConversionConverted('tenant-no-referral', 'BASICO', 299);

      expect(result).toBeNull();
      expect(prismaMock.referralConversion.update).not.toHaveBeenCalled();
    });

    it('should calculate commission correctly with decimal percentages', async () => {
      const signupConversion = {
        ...createMockConversion(),
        partner: { commissionPercent: 15.5 },
      };
      prismaMock.referralConversion.findFirst.mockResolvedValue(signupConversion as any);
      prismaMock.referralConversion.update.mockResolvedValue(createMockConversion() as any);

      await markConversionConverted('tenant-1', 'CORPORATIVO', 999);

      expect(prismaMock.referralConversion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commissionPercent: 15.5,
            commissionAmount: (999 * 15.5) / 100,
          }),
        })
      );
    });
  });

  describe('markConversionChurned', () => {
    it('should update all CONVERTED conversions for tenant to CHURNED', async () => {
      prismaMock.referralConversion.updateMany.mockResolvedValue({ count: 1 } as any);

      await markConversionChurned('tenant-1');

      expect(prismaMock.referralConversion.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', status: 'CONVERTED' },
        data: { status: 'CHURNED' },
      });
    });
  });

  // ============================================================================
  // PAYOUT MANAGEMENT
  // ============================================================================

  describe('updatePayoutStatus', () => {
    it('should update payout to APPROVED without paidAt', async () => {
      const updated = createMockConversion({ payoutStatus: 'APPROVED' });
      prismaMock.referralConversion.update.mockResolvedValue(updated as any);

      await updatePayoutStatus('conv-1', 'APPROVED', 'admin-1');

      expect(prismaMock.referralConversion.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { payoutStatus: 'APPROVED' },
      });
    });

    it('should set paidAt and paidBy when marking as PAID', async () => {
      const updated = createMockConversion({ payoutStatus: 'PAID', paidAt: new Date(), paidBy: 'admin-1' });
      prismaMock.referralConversion.update.mockResolvedValue(updated as any);

      await updatePayoutStatus('conv-1', 'PAID', 'admin-1');

      expect(prismaMock.referralConversion.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: expect.objectContaining({
          payoutStatus: 'PAID',
          paidAt: expect.any(Date),
          paidBy: 'admin-1',
        }),
      });
    });

    it('should include notes when provided', async () => {
      const updated = createMockConversion({ payoutStatus: 'VOID', payoutNotes: 'Cancelled' });
      prismaMock.referralConversion.update.mockResolvedValue(updated as any);

      await updatePayoutStatus('conv-1', 'VOID', 'admin-1', 'Cancelled');

      expect(prismaMock.referralConversion.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: expect.objectContaining({
          payoutStatus: 'VOID',
          payoutNotes: 'Cancelled',
        }),
      });
    });
  });

  describe('bulkUpdatePayoutStatus', () => {
    it('should update multiple conversions at once', async () => {
      prismaMock.referralConversion.updateMany.mockResolvedValue({ count: 3 } as any);

      await bulkUpdatePayoutStatus(['conv-1', 'conv-2', 'conv-3'], 'APPROVED', 'admin-1');

      expect(prismaMock.referralConversion.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['conv-1', 'conv-2', 'conv-3'] } },
        data: { payoutStatus: 'APPROVED' },
      });
    });

    it('should set paidAt/paidBy on bulk PAID', async () => {
      prismaMock.referralConversion.updateMany.mockResolvedValue({ count: 2 } as any);

      await bulkUpdatePayoutStatus(['conv-1', 'conv-2'], 'PAID', 'admin-1', 'Batch payment');

      expect(prismaMock.referralConversion.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['conv-1', 'conv-2'] } },
        data: expect.objectContaining({
          payoutStatus: 'PAID',
          paidAt: expect.any(Date),
          paidBy: 'admin-1',
          payoutNotes: 'Batch payment',
        }),
      });
    });
  });

  // ============================================================================
  // QUERIES & STATS
  // ============================================================================

  describe('getConversions', () => {
    it('should return paginated conversions with default limit/offset', async () => {
      const conversions = [createMockConversion()];
      prismaMock.referralConversion.findMany.mockResolvedValue(conversions as any);
      prismaMock.referralConversion.count.mockResolvedValue(1);

      const result = await getConversions();

      expect(result).toEqual({ conversions, total: 1 });
      expect(prismaMock.referralConversion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50, skip: 0 })
      );
    });

    it('should apply filters when provided', async () => {
      prismaMock.referralConversion.findMany.mockResolvedValue([]);
      prismaMock.referralConversion.count.mockResolvedValue(0);

      await getConversions({
        status: 'CONVERTED',
        payoutStatus: 'PENDING',
        partnerId: 'partner-1',
        limit: 10,
        offset: 20,
      });

      expect(prismaMock.referralConversion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'CONVERTED', payoutStatus: 'PENDING', partnerId: 'partner-1' },
          take: 10,
          skip: 20,
        })
      );
    });

    it('should not include undefined filters in where clause', async () => {
      prismaMock.referralConversion.findMany.mockResolvedValue([]);
      prismaMock.referralConversion.count.mockResolvedValue(0);

      await getConversions({ status: 'SIGNUP' });

      const callArgs = prismaMock.referralConversion.findMany.mock.calls[0][0] as any;
      expect(callArgs.where).toEqual({ status: 'SIGNUP' });
      expect(callArgs.where).not.toHaveProperty('payoutStatus');
      expect(callArgs.where).not.toHaveProperty('partnerId');
    });
  });

  describe('getReferralStats', () => {
    it('should return aggregated statistics', async () => {
      prismaMock.referralPartner.count
        .mockResolvedValueOnce(5)  // totalPartners
        .mockResolvedValueOnce(3); // activePartners
      prismaMock.referralCode.count.mockResolvedValue(8); // totalCodes
      prismaMock.referralConversion.count
        .mockResolvedValueOnce(10) // totalSignups
        .mockResolvedValueOnce(5); // totalConverted
      prismaMock.referralConversion.aggregate
        .mockResolvedValueOnce({ _sum: { commissionAmount: 500 } } as any) // pendingPayouts
        .mockResolvedValueOnce({ _sum: { commissionAmount: 1200 } } as any); // totalPaid

      const result = await getReferralStats();

      expect(result).toEqual({
        totalPartners: 5,
        activePartners: 3,
        totalCodes: 8,
        totalSignups: 10,
        totalConverted: 5,
        conversionRate: '33.3',
        pendingCommissions: 500,
        totalPaidCommissions: 1200,
      });
    });

    it('should return 0 conversion rate when no signups', async () => {
      prismaMock.referralPartner.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prismaMock.referralCode.count.mockResolvedValue(0);
      prismaMock.referralConversion.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      prismaMock.referralConversion.aggregate
        .mockResolvedValueOnce({ _sum: { commissionAmount: null } } as any)
        .mockResolvedValueOnce({ _sum: { commissionAmount: null } } as any);

      const result = await getReferralStats();

      expect(result.conversionRate).toBe('0');
      expect(result.pendingCommissions).toBe(0);
      expect(result.totalPaidCommissions).toBe(0);
    });
  });

  describe('getPartnerReport', () => {
    it('should return partner report with totals', async () => {
      const partner = { ...createMockPartner(), referralCodes: [createMockCode()] };
      const conversions = [createMockConversion({ status: 'CONVERTED' })];
      const totals = {
        _sum: { commissionAmount: 99.8, subscriptionAmount: 499 },
        _count: 1,
      };

      prismaMock.referralPartner.findUnique.mockResolvedValue(partner as any);
      prismaMock.referralConversion.findMany.mockResolvedValue(conversions as any);
      prismaMock.referralConversion.aggregate.mockResolvedValue(totals as any);

      const result = await getPartnerReport('partner-1');

      expect(result).toEqual({
        partner,
        conversions,
        totalConversions: 1,
        totalCommission: 99.8,
        totalRevenue: 499,
      });
    });

    it('should handle partner with no conversions', async () => {
      const partner = { ...createMockPartner(), referralCodes: [] };
      const totals = {
        _sum: { commissionAmount: null, subscriptionAmount: null },
        _count: 0,
      };

      prismaMock.referralPartner.findUnique.mockResolvedValue(partner as any);
      prismaMock.referralConversion.findMany.mockResolvedValue([]);
      prismaMock.referralConversion.aggregate.mockResolvedValue(totals as any);

      const result = await getPartnerReport('partner-1');

      expect(result.totalConversions).toBe(0);
      expect(result.totalCommission).toBe(0);
      expect(result.totalRevenue).toBe(0);
    });
  });
});
