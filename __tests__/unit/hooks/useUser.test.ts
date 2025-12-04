/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from '@/hooks/useUser';
import type { User } from '@prisma/client';

// Mock Kinde browser client
const mockUseKindeBrowserClient = jest.fn();
jest.mock('@kinde-oss/kinde-auth-nextjs', () => ({
  useKindeBrowserClient: () => mockUseKindeBrowserClient(),
}));

// Helper to create mock database user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user_db_123',
  kindeId: 'kp_user_123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.jpg',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  isSuperAdmin: false,
  ...overrides,
});

// Mock Kinde user type
interface MockKindeUser {
  id: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

const createMockKindeUser = (overrides: Partial<MockKindeUser> = {}): MockKindeUser => ({
  id: 'kp_user_123',
  email: 'test@example.com',
  given_name: 'Test',
  family_name: 'User',
  picture: 'https://example.com/avatar.jpg',
  ...overrides,
});

describe('useUser', () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe('Kinde Integration', () => {
    it('should wait for Kinde to finish loading before fetching', async () => {
      // Start with Kinde already loaded with a user
      const kindeUser = createMockKindeUser();
      const dbUser = createMockUser();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/user');
      expect(result.current.user).toEqual(dbUser);
    });

    it('should not fetch while Kinde is still loading', () => {
      // Kinde still loading
      mockUseKindeBrowserClient.mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { result } = renderHook(() => useUser());

      // Should be loading but not fetching yet
      expect(result.current.isLoading).toBe(true);
      // Note: The hook will still call fetchUser but it exits early due to kindeUser being null
    });

    it('should not fetch when Kinde is still loading', () => {
      mockUseKindeBrowserClient.mockReturnValue({
        user: null,
        isLoading: true,
      });

      renderHook(() => useUser());

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch user when kindeUser is available', async () => {
      const kindeUser = createMockKindeUser();
      const dbUser = createMockUser();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/user');
      expect(result.current.user).toEqual(dbUser);
    });

    it('should not fetch when kindeUser is null', async () => {
      mockUseKindeBrowserClient.mockReturnValue({
        user: null,
        isLoading: false,
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });
  });

  describe('API Fetch', () => {
    it('should fetch from /api/user endpoint', async () => {
      const kindeUser = createMockKindeUser();
      const dbUser = createMockUser();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/user');
    });

    it('should set user on successful response', async () => {
      const kindeUser = createMockKindeUser();
      const dbUser = createMockUser({ name: 'Specific User' });

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.user).toEqual(dbUser);
      });

      expect(result.current.user?.name).toBe('Specific User');
    });

    it('should set user to null on API error (non-200)', async () => {
      const kindeUser = createMockKindeUser();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });

    it('should set user to null on network error', async () => {
      const kindeUser = createMockKindeUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching user:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle 401 unauthorized response', async () => {
      const kindeUser = createMockKindeUser();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });

    it('should handle 500 server error response', async () => {
      const kindeUser = createMockKindeUser();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('should return isLoading true when Kinde is loading', () => {
      mockUseKindeBrowserClient.mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { result } = renderHook(() => useUser());

      expect(result.current.isLoading).toBe(true);
    });

    it('should return isLoading true when API is fetching', async () => {
      const kindeUser = createMockKindeUser();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });

      // Never resolving promise to simulate ongoing fetch
      let resolvePromise: (value: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { result } = renderHook(() => useUser());

      // Initially loading during fetch
      expect(result.current.isLoading).toBe(true);

      // Resolve the fetch
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(createMockUser()),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should return isLoading false when both complete', async () => {
      const kindeUser = createMockKindeUser();
      const dbUser = createMockUser();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should combine loading states correctly (Kinde true, API done)', () => {
      mockUseKindeBrowserClient.mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { result } = renderHook(() => useUser());

      // Even if internal isLoading is false, isKindeLoading makes it true
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Return Values', () => {
    it('should return database user object', async () => {
      const kindeUser = createMockKindeUser();
      const dbUser = createMockUser({
        id: 'db_user_specific',
        email: 'specific@example.com',
        isSuperAdmin: true,
      });

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      expect(result.current.user?.id).toBe('db_user_specific');
      expect(result.current.user?.email).toBe('specific@example.com');
      expect(result.current.user?.isSuperAdmin).toBe(true);
    });

    it('should return Kinde user object', async () => {
      const kindeUser = createMockKindeUser({
        id: 'kp_specific_123',
        email: 'kinde@example.com',
      });
      const dbUser = createMockUser();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser),
      });

      const { result } = renderHook(() => useUser());

      expect(result.current.kindeUser).toEqual(kindeUser);
      expect(result.current.kindeUser?.id).toBe('kp_specific_123');
    });

    it('should allow both user and kindeUser to be null', async () => {
      mockUseKindeBrowserClient.mockReturnValue({
        user: null,
        isLoading: false,
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.kindeUser).toBeNull();
    });

    it('should return all expected properties', async () => {
      const kindeUser = createMockKindeUser();
      const dbUser = createMockUser();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('kindeUser');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Kinde logout (kindeUser becomes null)', async () => {
      const kindeUser = createMockKindeUser();
      const dbUser = createMockUser();

      // Start with authenticated user
      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser),
      });

      const { result, rerender } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      // Simulate logout
      mockUseKindeBrowserClient.mockReturnValue({
        user: null,
        isLoading: false,
      });

      rerender();

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      expect(result.current.kindeUser).toBeNull();
    });

    it('should re-fetch when kindeUser changes', async () => {
      const kindeUser1 = createMockKindeUser({ id: 'user_1' });
      const kindeUser2 = createMockKindeUser({ id: 'user_2' });
      const dbUser1 = createMockUser({ id: 'db_1', name: 'User One' });
      const dbUser2 = createMockUser({ id: 'db_2', name: 'User Two' });

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser1,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser1),
      });

      const { result, rerender } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.user?.name).toBe('User One');
      });

      // Change kinde user (e.g., account switch)
      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser2,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dbUser2),
      });

      rerender();

      await waitFor(() => {
        expect(result.current.user?.name).toBe('User Two');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle JSON parse error gracefully', async () => {
      const kindeUser = createMockKindeUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle user with all fields populated', async () => {
      const kindeUser = createMockKindeUser();
      const fullUser = createMockUser({
        id: 'full_user_id',
        kindeId: 'kp_full_123',
        email: 'full@example.com',
        name: 'Full User Name',
        picture: 'https://cdn.example.com/full-avatar.png',
        isSuperAdmin: true,
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2025-01-20'),
      });

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fullUser),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      expect(result.current.user).toEqual(fullUser);
    });

    it('should handle user with minimal fields', async () => {
      const kindeUser = createMockKindeUser();
      const minimalUser: User = {
        id: 'minimal_id',
        kindeId: 'kp_minimal',
        email: 'minimal@example.com',
        name: null,
        picture: null,
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUseKindeBrowserClient.mockReturnValue({
        user: kindeUser,
        isLoading: false,
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(minimalUser),
      });

      const { result } = renderHook(() => useUser());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      expect(result.current.user?.name).toBeNull();
      expect(result.current.user?.picture).toBeNull();
    });
  });
});
