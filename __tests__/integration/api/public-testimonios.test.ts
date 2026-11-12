import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/public/[clinicSlug]/testimonios/route';

jest.mock('@/lib/tenant', () => ({
  getTenantBySlug: jest.fn(),
}));

import { getTenantBySlug } from '@/lib/tenant';

const mockGetTenantBySlug = getTenantBySlug as jest.Mock;

const context = { params: Promise.resolve({ clinicSlug: 'test-clinic' }) };

function getRequest(): NextRequest {
  return { url: 'http://localhost/api/public/test-clinic/testimonios' } as unknown as NextRequest;
}

function postRequest(body: Record<string, unknown>): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest;
}

describe('Public testimonials API errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('answers an unknown clinic in Spanish on GET and POST', async () => {
    mockGetTenantBySlug.mockResolvedValue(null);

    for (const response of [await GET(getRequest(), context), await POST(postRequest({}), context)]) {
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Clínica no disponible' });
    }
  });

  it('answers unexpected GET failures in Spanish', async () => {
    mockGetTenantBySlug.mockRejectedValue(new Error('db down'));

    const response = await GET(getRequest(), context);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Error interno del servidor' });
  });
});
