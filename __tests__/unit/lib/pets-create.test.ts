/**
 * @jest-environment node
 */

// Regression: createPetSchema dropped locationId, so the location picked in
// AddPetForm was never saved on the pet.
// Found by /qa follow-up on 2026-10-02

jest.mock('@/lib/prisma', () => ({
  prisma: {
    pet: { count: jest.fn(), create: jest.fn() },
    tenant: { findUnique: jest.fn() },
    customer: { findFirst: jest.fn() },
    location: { findFirst: jest.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { createPet, createPetSchema } from '@/lib/pets';

const mockPetCreate = prisma.pet.create as jest.Mock;
const mockLocationFindFirst = prisma.location.findFirst as jest.Mock;

const baseInput = {
  name: 'Firulais',
  species: 'dog',
  dateOfBirth: new Date('2022-05-10'),
  gender: 'male',
  customerId: 'customer-1',
};

describe('createPet location', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.pet.count as jest.Mock).mockResolvedValue(0);
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.customer.findFirst as jest.Mock).mockResolvedValue({ id: 'customer-1' });
    mockPetCreate.mockResolvedValue({ id: 'pet-1', weight: null });
  });

  it('keeps locationId through schema validation', () => {
    const parsed = createPetSchema.parse({ ...baseInput, locationId: 'loc-1' });
    expect(parsed.locationId).toBe('loc-1');
  });

  it('accepts a null or missing locationId', () => {
    expect(createPetSchema.parse({ ...baseInput, locationId: null }).locationId).toBeNull();
    expect(createPetSchema.parse(baseInput).locationId).toBeUndefined();
  });

  it('saves the location when it belongs to the tenant', async () => {
    mockLocationFindFirst.mockResolvedValue({ id: 'loc-1' });

    await createPet('tenant-1', createPetSchema.parse({ ...baseInput, locationId: 'loc-1' }));

    expect(mockLocationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 'loc-1', tenantId: 'tenant-1' }) })
    );
    expect(mockPetCreate.mock.calls[0][0].data.locationId).toBe('loc-1');
  });

  it('rejects a location from another tenant', async () => {
    mockLocationFindFirst.mockResolvedValue(null);

    await expect(
      createPet('tenant-1', createPetSchema.parse({ ...baseInput, locationId: 'loc-other' }))
    ).rejects.toThrow();
    expect(mockPetCreate).not.toHaveBeenCalled();
  });

  it('creates the pet without a location when none is given', async () => {
    await createPet('tenant-1', createPetSchema.parse(baseInput));

    expect(mockLocationFindFirst).not.toHaveBeenCalled();
    expect(mockPetCreate.mock.calls[0][0].data.locationId ?? null).toBeNull();
  });
});
