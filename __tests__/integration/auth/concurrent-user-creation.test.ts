import { findOrCreateUser } from '@/lib/db/queries/users';
import { prisma } from '@/lib/prisma';

// Mock Kinde Auth session to supply user data
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: jest.fn(),
  }),
}));

import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const mockGetUser = (getKindeServerSession as jest.Mock)().getUser as jest.Mock;

describe('Concurrent User Creation (Integration)', () => {
  const mockKindeUser = {
    id: 'kinde_user_concurrent_test',
    email: 'concurrent@example.com',
    given_name: 'Concurrent',
    family_name: 'User',
  };

  const userData = {
    id: mockKindeUser.id,
    email: mockKindeUser.email,
    firstName: mockKindeUser.given_name,
    lastName: mockKindeUser.family_name,
    name: `${mockKindeUser.given_name} ${mockKindeUser.family_name}`,
  };

  beforeEach(async () => {
    mockGetUser.mockResolvedValue(mockKindeUser);
    await prisma.user.deleteMany({ where: { id: mockKindeUser.id } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: mockKindeUser.id } });
    await prisma.$disconnect();
  });

  it('creates a single user when multiple concurrent requests occur', async () => {
    const promises = Array.from({ length: 10 }, () => findOrCreateUser(userData));
    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    results.forEach((result) => {
      expect(result.id).toBe(userData.id);
      expect(result.email).toBe(userData.email);
    });

    const usersInDb = await prisma.user.findMany({ where: { id: userData.id } });
    expect(usersInDb).toHaveLength(1);
  });
}); 