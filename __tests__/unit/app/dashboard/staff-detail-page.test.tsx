/**
 * @jest-environment node
 *
 * A missing staff record must reach Next's 404, not the generic error card.
 */
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    // Same shape as Next's real notFound(): it throws a control-flow error
    throw Object.assign(new Error('NEXT_HTTP_ERROR_FALLBACK;404'), {
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    });
  }),
}));
jest.mock('@/lib/auth', () => ({ requireAuth: jest.fn() }));
jest.mock('@/lib/staff', () => ({ getStaffById: jest.fn() }));
jest.mock('@/app/dashboard/staff/[id]/StaffDetailClient', () => ({
  __esModule: true,
  default: () => null,
}));

import StaffDetailPage from '@/app/dashboard/staff/[id]/page';
import { requireAuth } from '@/lib/auth';
import { getStaffById } from '@/lib/staff';

describe('StaffDetailPage', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (requireAuth as jest.Mock).mockResolvedValue({ user: { id: 'u-1' }, tenant: { id: 't-1' } });
  });

  afterEach(() => consoleSpy.mockRestore());

  it('lets notFound() propagate when the staff record does not exist', async () => {
    (getStaffById as jest.Mock).mockResolvedValue(null);

    await expect(
      StaffDetailPage({ params: Promise.resolve({ id: 'missing' }) })
    ).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' });
  });

  it('still shows the error card for real failures', async () => {
    (getStaffById as jest.Mock).mockRejectedValue(new Error('db down'));

    const result = await StaffDetailPage({ params: Promise.resolve({ id: 's-1' }) });

    expect(JSON.stringify(result)).toContain('No se pudo cargar la información del personal');
  });
});
