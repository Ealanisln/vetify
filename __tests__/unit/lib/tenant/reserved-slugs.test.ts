/**
 * @jest-environment node
 *
 * A clinic's public page lives at /{slug}. A slug equal to a static route
 * (precios, admin, api, invite, ...) is shadowed by that route, so the clinic
 * would never get its public page. Those slugs must never count as available.
 */

const mockTenantFindUnique = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findUnique: (...args: unknown[]) => mockTenantFindUnique(...args) },
  },
}));

import fs from 'fs';
import path from 'path';
import { isSlugAvailable, generateUniqueSlug } from '@/lib/tenant';
import { isReservedSlug } from '@/lib/reserved-slugs';
import { GET as checkSlug } from '@/app/api/onboarding/check-slug/route';
import { NextRequest } from 'next/server';

const STATIC_ROUTE_SLUGS = [
  'precios',
  'contacto',
  'dashboard',
  'admin',
  'setup',
  'invite',
  'api',
  'onboarding',
  'sign-in',
  'sign-up',
  'actualizaciones',
  'funcionalidades',
  'acerca',
  'privacidad',
  'offline',
];

beforeEach(() => {
  mockTenantFindUnique.mockReset();
  // No tenant owns any slug: only the reserved list can make one unavailable.
  mockTenantFindUnique.mockResolvedValue(null);
});

describe('isSlugAvailable – reserved slugs', () => {
  it.each(STATIC_ROUTE_SLUGS)('rejects "%s" because it collides with a static route', async (slug) => {
    await expect(isSlugAvailable(slug)).resolves.toBe(false);
  });

  it('reserves every top-level route folder in src/app', () => {
    const appDir = path.join(process.cwd(), 'src/app');
    const routeFolders = fs
      .readdirSync(appDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^[a-z0-9-]+$/.test(entry.name))
      .map((entry) => entry.name);

    expect(routeFolders.length).toBeGreaterThan(10);
    expect(routeFolders.filter((name) => !isReservedSlug(name))).toEqual([]);
  });

  it('still accepts a normal clinic slug', async () => {
    await expect(isSlugAvailable('clinica-norte')).resolves.toBe(true);
  });

  it('suggests a free variant for a reserved slug', async () => {
    await expect(generateUniqueSlug('precios')).resolves.toBe('precios-1');
  });
});

describe('GET /api/onboarding/check-slug – reserved slugs', () => {
  it('reports a reserved slug as unavailable and offers a suggestion', async () => {
    const response = await checkSlug(
      new Request('http://localhost:3000/api/onboarding/check-slug?slug=admin') as unknown as NextRequest
    );
    const data = await response.json();

    expect(data.available).toBe(false);
    expect(data.suggestion).toBe('admin-1');
  });
});
