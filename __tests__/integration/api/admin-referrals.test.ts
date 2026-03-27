/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';

// Mock super-admin check
const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: () => mockRequireSuperAdmin(),
}));

// Mock referral queries
const mockGetAllPartners = jest.fn();
const mockCreatePartner = jest.fn();
const mockGetReferralStats = jest.fn();
const mockGetPartnerById = jest.fn();
const mockUpdatePartner = jest.fn();
const mockDeactivatePartner = jest.fn();
const mockGetPartnerCodes = jest.fn();
const mockCreateReferralCode = jest.fn();
const mockGetConversions = jest.fn();
const mockUpdatePayoutStatus = jest.fn();
const mockBulkUpdatePayoutStatus = jest.fn();

jest.mock('@/lib/referrals/queries', () => ({
  getAllPartners: (...args: any[]) => mockGetAllPartners(...args),
  createPartner: (...args: any[]) => mockCreatePartner(...args),
  getReferralStats: (...args: any[]) => mockGetReferralStats(...args),
  getPartnerById: (...args: any[]) => mockGetPartnerById(...args),
  updatePartner: (...args: any[]) => mockUpdatePartner(...args),
  deactivatePartner: (...args: any[]) => mockDeactivatePartner(...args),
  getPartnerCodes: (...args: any[]) => mockGetPartnerCodes(...args),
  createReferralCode: (...args: any[]) => mockCreateReferralCode(...args),
  getConversions: (...args: any[]) => mockGetConversions(...args),
  updatePayoutStatus: (...args: any[]) => mockUpdatePayoutStatus(...args),
  bulkUpdatePayoutStatus: (...args: any[]) => mockBulkUpdatePayoutStatus(...args),
}));

// Import after mocks
import { GET as getPartners, POST as createPartnerRoute } from '@/app/api/admin/referrals/route';
import { GET as getPartnerDetail, PUT as updatePartnerRoute, DELETE as deletePartnerRoute } from '@/app/api/admin/referrals/[id]/route';
import { GET as getCodesRoute, POST as createCodeRoute } from '@/app/api/admin/referrals/[id]/codes/route';
import { GET as getConversionsRoute } from '@/app/api/admin/referrals/conversions/route';
import { PUT as updatePayoutRoute } from '@/app/api/admin/referrals/conversions/[id]/route';
import { NextRequest } from 'next/server';

const createRequest = (url: string, options?: RequestInit) =>
  new NextRequest(`http://localhost:3000${url}`, options);

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
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  referralCodes: [],
  _count: { conversions: 0 },
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
  clickCount: 5,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const createMockConversion = (overrides = {}) => ({
  id: 'conv-1',
  partnerId: 'partner-1',
  codeId: 'code-1',
  tenantId: 'tenant-1',
  status: 'CONVERTED',
  convertedAt: '2026-02-01T00:00:00.000Z',
  planKey: 'PROFESIONAL',
  subscriptionAmount: 499,
  commissionPercent: 20,
  commissionAmount: 99.8,
  payoutStatus: 'PENDING',
  ...overrides,
});

const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('Admin Referrals API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSuperAdmin.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@vetify.pro' } });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================================
  // GET /api/admin/referrals
  // ============================================================================

  describe('GET /api/admin/referrals', () => {
    it('should return 500 when not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

      const request = createRequest('/api/admin/referrals');
      const response = await getPartners(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should return partners list without stats', async () => {
      const partners = [createMockPartner()];
      mockGetAllPartners.mockResolvedValue(partners);

      const request = createRequest('/api/admin/referrals');
      const response = await getPartners(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(partners);
      expect(data.stats).toBeUndefined();
    });

    it('should include stats when includeStats=true', async () => {
      const partners = [createMockPartner()];
      const stats = { totalPartners: 1, activePartners: 1, totalCodes: 2 };
      mockGetAllPartners.mockResolvedValue(partners);
      mockGetReferralStats.mockResolvedValue(stats);

      const request = createRequest('/api/admin/referrals?includeStats=true');
      const response = await getPartners(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(partners);
      expect(data.stats).toEqual(stats);
    });
  });

  // ============================================================================
  // POST /api/admin/referrals
  // ============================================================================

  describe('POST /api/admin/referrals', () => {
    const validBody = {
      name: 'Dr. Jones',
      email: 'drjones@example.com',
      commissionPercent: 15,
    };

    it('should create a partner with valid data', async () => {
      const created = createMockPartner(validBody);
      mockCreatePartner.mockResolvedValue(created);

      const request = createRequest('/api/admin/referrals', {
        method: 'POST',
        body: JSON.stringify(validBody),
      });
      const response = await createPartnerRoute(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(created);
      expect(data.message).toBe('Partner creado exitosamente');
      expect(mockCreatePartner).toHaveBeenCalledWith({
        ...validBody,
        createdBy: 'admin-1',
      });
    });

    it('should return 400 for invalid email', async () => {
      const request = createRequest('/api/admin/referrals', {
        method: 'POST',
        body: JSON.stringify({ ...validBody, email: 'not-an-email' }),
      });
      const response = await createPartnerRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Datos invalidos');
    });

    it('should return 400 for missing name', async () => {
      const request = createRequest('/api/admin/referrals', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', commissionPercent: 10 }),
      });
      const response = await createPartnerRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 for commission out of range', async () => {
      const request = createRequest('/api/admin/referrals', {
        method: 'POST',
        body: JSON.stringify({ ...validBody, commissionPercent: 60 }),
      });
      const response = await createPartnerRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should return 400 for duplicate email (P2002)', async () => {
      const prismaError = new Error('Unique constraint');
      (prismaError as any).code = 'P2002';
      mockCreatePartner.mockRejectedValue(prismaError);

      const request = createRequest('/api/admin/referrals', {
        method: 'POST',
        body: JSON.stringify(validBody),
      });
      const response = await createPartnerRoute(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('email');
    });
  });

  // ============================================================================
  // GET /api/admin/referrals/[id]
  // ============================================================================

  describe('GET /api/admin/referrals/[id]', () => {
    it('should return partner details', async () => {
      const partner = createMockPartner({ conversions: [] });
      mockGetPartnerById.mockResolvedValue(partner);

      const request = createRequest('/api/admin/referrals/partner-1');
      const response = await getPartnerDetail(request, createParams('partner-1'));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(partner);
    });

    it('should return 404 when partner not found', async () => {
      mockGetPartnerById.mockResolvedValue(null);

      const request = createRequest('/api/admin/referrals/not-found');
      const response = await getPartnerDetail(request, createParams('not-found'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('no encontrado');
    });
  });

  // ============================================================================
  // PUT /api/admin/referrals/[id]
  // ============================================================================

  describe('PUT /api/admin/referrals/[id]', () => {
    it('should update partner with valid data', async () => {
      const updated = createMockPartner({ name: 'Updated Name' });
      mockUpdatePartner.mockResolvedValue(updated);

      const request = createRequest('/api/admin/referrals/partner-1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const response = await updatePartnerRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toBe('Partner actualizado exitosamente');
      expect(mockUpdatePartner).toHaveBeenCalledWith('partner-1', { name: 'Updated Name' });
    });

    it('should return 400 for invalid commission percent', async () => {
      const request = createRequest('/api/admin/referrals/partner-1', {
        method: 'PUT',
        body: JSON.stringify({ commissionPercent: 100 }),
      });
      const response = await updatePartnerRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should allow setting nullable fields to null', async () => {
      const updated = createMockPartner({ phone: null, company: null });
      mockUpdatePartner.mockResolvedValue(updated);

      const request = createRequest('/api/admin/referrals/partner-1', {
        method: 'PUT',
        body: JSON.stringify({ phone: null, company: null }),
      });
      const response = await updatePartnerRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockUpdatePartner).toHaveBeenCalledWith('partner-1', { phone: null, company: null });
    });
  });

  // ============================================================================
  // DELETE /api/admin/referrals/[id]
  // ============================================================================

  describe('DELETE /api/admin/referrals/[id]', () => {
    it('should soft-delete (deactivate) partner', async () => {
      mockDeactivatePartner.mockResolvedValue(createMockPartner({ isActive: false }));

      const request = createRequest('/api/admin/referrals/partner-1', { method: 'DELETE' });
      const response = await deletePartnerRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('desactivado');
      expect(mockDeactivatePartner).toHaveBeenCalledWith('partner-1');
    });

    it('should return 500 on deactivation error', async () => {
      mockDeactivatePartner.mockRejectedValue(new Error('DB error'));

      const request = createRequest('/api/admin/referrals/partner-1', { method: 'DELETE' });
      const response = await deletePartnerRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  // ============================================================================
  // GET /api/admin/referrals/[id]/codes
  // ============================================================================

  describe('GET /api/admin/referrals/[id]/codes', () => {
    it('should return codes for a partner', async () => {
      const codes = [createMockCode(), createMockCode({ id: 'code-2', code: 'DRSMITH2' })];
      mockGetPartnerCodes.mockResolvedValue(codes);

      const request = createRequest('/api/admin/referrals/partner-1/codes');
      const response = await getCodesRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(codes);
      expect(mockGetPartnerCodes).toHaveBeenCalledWith('partner-1');
    });
  });

  // ============================================================================
  // POST /api/admin/referrals/[id]/codes
  // ============================================================================

  describe('POST /api/admin/referrals/[id]/codes', () => {
    it('should create a code with valid data', async () => {
      const created = createMockCode({ code: 'NEWCODE' });
      mockCreateReferralCode.mockResolvedValue(created);

      const request = createRequest('/api/admin/referrals/partner-1/codes', {
        method: 'POST',
        body: JSON.stringify({ code: 'NEWCODE' }),
      });
      const response = await createCodeRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(created);
      expect(mockCreateReferralCode).toHaveBeenCalledWith({
        code: 'NEWCODE',
        partnerId: 'partner-1',
      });
    });

    it('should return 400 for invalid code format', async () => {
      const request = createRequest('/api/admin/referrals/partner-1/codes', {
        method: 'POST',
        body: JSON.stringify({ code: 'invalid code!@#' }),
      });
      const response = await createCodeRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 400 for empty code', async () => {
      const request = createRequest('/api/admin/referrals/partner-1/codes', {
        method: 'POST',
        body: JSON.stringify({ code: '' }),
      });
      const response = await createCodeRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('should accept code with discount parameters', async () => {
      const created = createMockCode({ discountPercent: 20, discountMonths: 3 });
      mockCreateReferralCode.mockResolvedValue(created);

      const request = createRequest('/api/admin/referrals/partner-1/codes', {
        method: 'POST',
        body: JSON.stringify({
          code: 'SAVE20',
          discountPercent: 20,
          discountMonths: 3,
          stripeCouponId: 'coupon_abc',
        }),
      });
      const response = await createCodeRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockCreateReferralCode).toHaveBeenCalledWith({
        code: 'SAVE20',
        partnerId: 'partner-1',
        discountPercent: 20,
        discountMonths: 3,
        stripeCouponId: 'coupon_abc',
      });
    });

    it('should return 400 for duplicate code (P2002)', async () => {
      const prismaError = new Error('Unique constraint');
      (prismaError as any).code = 'P2002';
      mockCreateReferralCode.mockRejectedValue(prismaError);

      const request = createRequest('/api/admin/referrals/partner-1/codes', {
        method: 'POST',
        body: JSON.stringify({ code: 'EXISTING' }),
      });
      const response = await createCodeRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('codigo');
    });

    it('should return 400 for discount percent out of range', async () => {
      const request = createRequest('/api/admin/referrals/partner-1/codes', {
        method: 'POST',
        body: JSON.stringify({ code: 'TEST', discountPercent: 150 }),
      });
      const response = await createCodeRoute(request, createParams('partner-1'));
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  // ============================================================================
  // GET /api/admin/referrals/conversions
  // ============================================================================

  describe('GET /api/admin/referrals/conversions', () => {
    it('should return conversions with default pagination', async () => {
      const result = { conversions: [createMockConversion()], total: 1 };
      mockGetConversions.mockResolvedValue(result);

      const request = createRequest('/api/admin/referrals/conversions');
      const response = await getConversionsRoute(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(result.conversions);
      expect(data.total).toBe(1);
      expect(data.limit).toBe(50);
      expect(data.offset).toBe(0);
    });

    it('should pass filters to getConversions', async () => {
      mockGetConversions.mockResolvedValue({ conversions: [], total: 0 });

      const request = createRequest(
        '/api/admin/referrals/conversions?status=CONVERTED&payoutStatus=PENDING&partnerId=partner-1&limit=10&offset=5'
      );
      const response = await getConversionsRoute(request);
      await response.json();

      expect(mockGetConversions).toHaveBeenCalledWith({
        status: 'CONVERTED',
        payoutStatus: 'PENDING',
        partnerId: 'partner-1',
        limit: 10,
        offset: 5,
      });
    });

    it('should handle no filters gracefully', async () => {
      mockGetConversions.mockResolvedValue({ conversions: [], total: 0 });

      const request = createRequest('/api/admin/referrals/conversions');
      await getConversionsRoute(request);

      expect(mockGetConversions).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
      });
    });
  });

  // ============================================================================
  // PUT /api/admin/referrals/conversions/[id]
  // ============================================================================

  describe('PUT /api/admin/referrals/conversions/[id]', () => {
    it('should update single conversion payout status', async () => {
      const updated = createMockConversion({ payoutStatus: 'APPROVED' });
      mockUpdatePayoutStatus.mockResolvedValue(updated);

      const request = createRequest('/api/admin/referrals/conversions/conv-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      const response = await updatePayoutRoute(request, createParams('conv-1'));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(updated);
      expect(mockUpdatePayoutStatus).toHaveBeenCalledWith('conv-1', 'APPROVED', 'admin-1', undefined);
    });

    it('should handle bulk update when id is "bulk"', async () => {
      mockBulkUpdatePayoutStatus.mockResolvedValue({ count: 3 });

      const request = createRequest('/api/admin/referrals/conversions/bulk', {
        method: 'PUT',
        body: JSON.stringify({
          status: 'PAID',
          conversionIds: ['conv-1', 'conv-2', 'conv-3'],
          notes: 'Batch payment',
        }),
      });
      const response = await updatePayoutRoute(request, createParams('bulk'));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.message).toContain('3 conversiones');
      expect(mockBulkUpdatePayoutStatus).toHaveBeenCalledWith(
        ['conv-1', 'conv-2', 'conv-3'],
        'PAID',
        'admin-1',
        'Batch payment'
      );
    });

    it('should return 400 for invalid status', async () => {
      const request = createRequest('/api/admin/referrals/conversions/conv-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'INVALID_STATUS' }),
      });
      const response = await updatePayoutRoute(request, createParams('conv-1'));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should pass notes to single update', async () => {
      const updated = createMockConversion({ payoutStatus: 'VOID', payoutNotes: 'Cancelled by admin' });
      mockUpdatePayoutStatus.mockResolvedValue(updated);

      const request = createRequest('/api/admin/referrals/conversions/conv-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'VOID', notes: 'Cancelled by admin' }),
      });
      const response = await updatePayoutRoute(request, createParams('conv-1'));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockUpdatePayoutStatus).toHaveBeenCalledWith('conv-1', 'VOID', 'admin-1', 'Cancelled by admin');
    });

    it('should require authentication', async () => {
      mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

      const request = createRequest('/api/admin/referrals/conversions/conv-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      const response = await updatePayoutRoute(request, createParams('conv-1'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
