/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

// Simple in-memory store to simulate database operations across tests
const userStore: Record<string, any> = {};

// Helper to reset store before each test
beforeEach(() => {
  mockReset(prismaMock);
  for (const key in userStore) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete userStore[key];
  }

  // Configure default implementations after reset
  prismaMock.user.upsert.mockImplementation(async ({ where, create, update }) => {
    const id = where.id;
    if (userStore[id]) {
      userStore[id] = { ...userStore[id], ...update };
    } else {
      userStore[id] = { ...create };
    }
    return userStore[id];
  });

  prismaMock.user.findMany.mockImplementation(async ({ where } = {}) => {
    if (where?.id) {
      return Object.values(userStore).filter((u) => u.id === where.id);
    }
    return Object.values(userStore);
  });

  prismaMock.user.deleteMany.mockImplementation(async ({ where } = {}) => {
    if (where?.id) {
      if (userStore[where.id]) {
        delete userStore[where.id];
      }
    } else {
      Object.keys(userStore).forEach((key) => delete userStore[key]);
    }
    return { count: 0 };
  });
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>; 