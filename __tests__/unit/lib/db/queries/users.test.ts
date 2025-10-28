import { findOrCreateUser, findUserById, CreateOrUpdateUserData } from '@/lib/db/queries/users';
import { prisma } from '@/lib/prisma';
import { UserWithTenant } from '@/types';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock serializers
jest.mock('@/lib/serializers', () => ({
  serializeUser: jest.fn((user) => user),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('findOrCreateUser', () => {
  const validUserData: CreateOrUpdateUserData = {
    id: 'kinde_user_123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
  };

  const mockUser: UserWithTenant = {
    id: 'kinde_user_123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenantId: null,
    tenant: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('creates new user when not exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(mockUser);

    const result = await findOrCreateUser(validUserData);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: validUserData.id },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        }
      }
    });

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        id: validUserData.id,
        email: validUserData.email,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        name: validUserData.name,
        isActive: true,
      },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        }
      }
    });

    expect(result).toEqual(mockUser);
  });

  it('returns existing user when already exists', async () => {
    const existingUser = { ...mockUser, updatedAt: new Date() };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue(existingUser);

    const result = await findOrCreateUser(validUserData);

    expect(result).toEqual(existingUser);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
  });

  it('updates user data on subsequent calls', async () => {
    const updatedData = {
      ...validUserData,
      firstName: 'Jane',
      lastName: 'Smith',
      name: 'Jane Smith',
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({ ...mockUser, ...updatedData });

    const result = await findOrCreateUser(updatedData);

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: updatedData.id },
        data: expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Smith',
          name: 'Jane Smith',
        }),
      })
    );
  });

  it('handles concurrent calls without error', async () => {
    // First call creates, subsequent calls update
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null) // First call: no existing user
      .mockResolvedValue(mockUser); // Subsequent calls: user exists
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue(mockUser);

    // Simulate concurrent calls
    const promises = [
      findOrCreateUser(validUserData),
      findOrCreateUser(validUserData),
      findOrCreateUser(validUserData),
    ];

    const results = await Promise.all(promises);

    // All should succeed and return the same user
    results.forEach(result => {
      expect(result).toEqual(mockUser);
    });

    // Should handle concurrent requests gracefully
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(3);
  });

  it('validates required fields - missing id', async () => {
    const invalidData = { ...validUserData, id: '' };

    await expect(findOrCreateUser(invalidData)).rejects.toThrow(
      'User ID and email are required'
    );

    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('validates required fields - missing email', async () => {
    const invalidData = { ...validUserData, email: '' };

    await expect(findOrCreateUser(invalidData)).rejects.toThrow(
      'User ID and email are required'
    );

    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('handles missing name gracefully', async () => {
    const dataWithoutName = {
      id: 'kinde_user_123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(mockUser);

    await findOrCreateUser(dataWithoutName);

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'John Doe', // Should generate from firstName + lastName
        }),
      })
    );
  });

  it('uses email username as fallback name', async () => {
    const dataWithoutNames = {
      id: 'kinde_user_123',
      email: 'john.doe@example.com',
      firstName: null,
      lastName: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(mockUser);

    await findOrCreateUser(dataWithoutNames);

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'john.doe', // Should use email username as fallback
        }),
      })
    );
  });

  it('handles database errors gracefully', async () => {
    const dbError = new Error('Database connection failed');
    mockPrisma.user.findUnique.mockRejectedValue(dbError);

    await expect(findOrCreateUser(validUserData)).rejects.toThrow(
      'Failed to find or create user: Database connection failed'
    );
  });
});

describe('findUserById', () => {
  const mockUser: UserWithTenant = {
    id: 'kinde_user_123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    name: 'John Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenantId: 'tenant_123',
    tenant: {
      id: 'tenant_123',
      name: 'Test Clinic',
      slug: 'test-clinic',
      email: 'clinic@test.com',
      phone: '+1234567890',
      whatsappPhone: '+1234567890',
      isActive: true,
      planName: 'PRO',
      subscriptionStatus: 'active',
      subscriptionEndsAt: new Date(),
      isTrialPeriod: false,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      stripeProductId: 'prod_123',
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantSubscription: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('returns user with tenant data when found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await findUserById('kinde_user_123');

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'kinde_user_123' },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        }
      }
    });

    expect(result).toEqual(mockUser);
  });

  it('returns null when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await findUserById('nonexistent_user');

    expect(result).toBeNull();
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it('handles database errors gracefully', async () => {
    const dbError = new Error('Database query failed');
    mockPrisma.user.findUnique.mockRejectedValue(dbError);

    await expect(findUserById('kinde_user_123')).rejects.toThrow(
      'Failed to find user: Database query failed'
    );
  });

  it('includes tenant with subscription data in query', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await findUserById('kinde_user_123');

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'kinde_user_123' },
      include: {
        tenant: {
          include: {
            tenantSubscription: {
              include: { plan: true }
            }
          }
        }
      }
    });
  });
}); 