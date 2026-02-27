/**
 * WhatsApp Generate Token API Tests
 * Tests that the endpoint requires super admin auth and does NOT leak access_token.
 */

const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: (...args: unknown[]) => mockRequireSuperAdmin(...args),
}));

const mockGenerateLongLivedToken = jest.fn();
jest.mock('@/lib/whatsapp', () => ({
  whatsappService: {
    generateLongLivedToken: (...args: unknown[]) => mockGenerateLongLivedToken(...args),
  },
}));

import { POST, GET } from '@/app/api/whatsapp/generate-token/route';

describe('WhatsApp Generate Token API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('returns 403 when user is not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(
        new Error('Access denied. Super admin privileges required.')
      );

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it('does NOT include access_token in response', async () => {
      mockRequireSuperAdmin.mockResolvedValue({
        user: { id: 'admin-1' },
      });
      mockGenerateLongLivedToken.mockResolvedValue({
        access_token: 'EAAG_SECRET_TOKEN_VALUE',
        expires_in: 5184000,
        generated_at: '2026-02-27T00:00:00.000Z',
        token_type: 'bearer',
      });

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.tokenInfo).toBeDefined();
      expect(body.tokenInfo.access_token).toBeUndefined();
      expect(body.tokenInfo.expires_in_days).toBeDefined();
      expect(body.tokenInfo.generated_at).toBe('2026-02-27T00:00:00.000Z');
      expect(body.tokenInfo.token_type).toBe('bearer');
    });

    it('includes expires_in_days and generated_at in response', async () => {
      mockRequireSuperAdmin.mockResolvedValue({
        user: { id: 'admin-1' },
      });
      mockGenerateLongLivedToken.mockResolvedValue({
        access_token: 'token',
        expires_in: 5184000, // 60 days
        generated_at: '2026-02-27T00:00:00.000Z',
        token_type: 'bearer',
      });

      const response = await POST();
      const body = await response.json();

      expect(body.tokenInfo.expires_in_days).toBe(60);
      expect(body.tokenInfo.generated_at).toBe('2026-02-27T00:00:00.000Z');
    });
  });

  describe('GET', () => {
    it('returns 403 when user is not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(
        new Error('Access denied. Super admin privileges required.')
      );

      const response = await GET();

      expect(response.status).toBe(403);
    });

    it('returns usage instructions when authorized', async () => {
      mockRequireSuperAdmin.mockResolvedValue({
        user: { id: 'admin-1' },
      });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.method).toBe('POST');
    });
  });
});
