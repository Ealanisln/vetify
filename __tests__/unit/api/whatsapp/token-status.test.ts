/**
 * WhatsApp Token Status API Tests
 * Tests that the endpoint requires super admin auth and does NOT leak prefix/length.
 */

const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: (...args: unknown[]) => mockRequireSuperAdmin(...args),
}));

const mockGetTokenInfo = jest.fn();
const mockAutoRefreshToken = jest.fn();
jest.mock('@/lib/whatsapp', () => ({
  whatsappService: {
    getTokenInfo: (...args: unknown[]) => mockGetTokenInfo(...args),
    autoRefreshToken: (...args: unknown[]) => mockAutoRefreshToken(...args),
  },
}));

import { GET, POST } from '@/app/api/whatsapp/token-status/route';

describe('WhatsApp Token Status API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, WHATSAPP_ACCESS_TOKEN: 'EAAG_test_token_value_here' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET', () => {
    it('returns 403 when user is not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(
        new Error('Access denied. Super admin privileges required.')
      );

      const response = await GET();

      expect(response.status).toBe(403);
    });

    it('response does NOT include prefix field', async () => {
      mockRequireSuperAdmin.mockResolvedValue({
        user: { id: 'admin-1' },
      });
      mockGetTokenInfo.mockResolvedValue({
        valid: true,
        expires_at: '2026-04-27T00:00:00.000Z',
        app_id: 'app-123',
      });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.valid).toBe(true);

      // Verify no prefix or length is leaked
      expect(body.tokenInfo?.prefix).toBeUndefined();
      expect(body.tokenInfo?.length).toBeUndefined();

      // Verify safe fields are present
      expect(body.tokenInfo?.configured).toBe(true);
    });

    it('error response does NOT include prefix field', async () => {
      mockRequireSuperAdmin.mockResolvedValue({
        user: { id: 'admin-1' },
      });
      mockGetTokenInfo.mockRejectedValue(new Error('Network error'));

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.tokenInfo?.prefix).toBeUndefined();
      expect(body.tokenInfo?.length).toBeUndefined();
    });
  });

  describe('POST', () => {
    it('returns 403 when user is not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(
        new Error('Access denied. Super admin privileges required.')
      );

      const response = await POST();

      expect(response.status).toBe(403);
    });

    it('response does NOT include prefix field', async () => {
      mockRequireSuperAdmin.mockResolvedValue({
        user: { id: 'admin-1' },
      });
      mockAutoRefreshToken.mockResolvedValue({ refreshed: false, error: null });
      mockGetTokenInfo.mockResolvedValue({
        valid: true,
        expires_at: '2026-04-27T00:00:00.000Z',
        app_id: 'app-123',
      });

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.tokenInfo?.prefix).toBeUndefined();
      expect(body.tokenInfo?.length).toBeUndefined();
    });
  });
});
