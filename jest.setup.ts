/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Mocks and global setup for Jest tests
import dotenv from 'dotenv';
import '@testing-library/jest-dom';

dotenv.config({ path: '.env.local' });

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  notFound: jest.fn(),
  redirect: jest.fn(),
}))

// Mock Kinde Auth
jest.mock('@kinde-oss/kinde-auth-nextjs', () => ({
  getKindeServerSession: jest.fn(() => ({
    getUser: jest.fn(),
    getPermissions: jest.fn(),
    getOrganization: jest.fn(),
  })),
  LoginLink: ({ children }: { children: React.ReactNode }) => children,
  LogoutLink: ({ children }: { children: React.ReactNode }) => children,
  RegisterLink: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock Prisma
jest.mock('@prisma/client', () => {
  // Create a minimal mock of Prisma.TransactionIsolationLevel enum
  const TransactionIsolationLevel = {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable',
  } as const;

  return {
    PrismaClient: jest.fn(() => {
      // Simple in-memory store per model name for basic integration test behaviour
      const store: Record<string, Record<string, unknown>[]> = {
        user: [],
        tenant: [],
        pet: [],
        appointment: [],
      };

      const modelActions = (modelName: keyof typeof store) => ({
        findUnique: jest.fn(({ where }: { where: { id: string } }) => {
          return Promise.resolve(store[modelName].find((item) => (item as any).id === where.id) || null);
        }),
        findMany: jest.fn(({ where }: { where?: { id?: string } } = {}) => {
          if (where?.id) {
            return Promise.resolve(store[modelName].filter((item) => (item as any).id === where.id));
          }
          return Promise.resolve(store[modelName]);
        }),
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          store[modelName].push({ ...data, createdAt: new Date(), updatedAt: new Date() });
          return Promise.resolve(store[modelName][store[modelName].length - 1]);
        }),
        update: jest.fn(({ where, data }: { where: { id: string }, data: Record<string, unknown> }) => {
          const index = store[modelName].findIndex((item) => (item as any).id === where.id);
          if (index !== -1) {
            store[modelName][index] = { ...store[modelName][index], ...data, updatedAt: new Date() };
            return Promise.resolve(store[modelName][index]);
          }
          return Promise.resolve(null);
        }),
        delete: jest.fn(({ where }: { where: { id: string } }) => {
          const index = store[modelName].findIndex((item) => (item as any).id === where.id);
          if (index !== -1) {
            const [removed] = store[modelName].splice(index, 1);
            return Promise.resolve(removed);
          }
          return Promise.resolve(null);
        }),
        upsert: jest.fn(({ where, update, create }: { where: { id: string }, update: Record<string, unknown>, create: Record<string, unknown> }) => {
          const existing = store[modelName].find((item) => (item as any).id === where.id);
          if (existing) {
            const updated = { ...existing, ...update, updatedAt: new Date() };
            const idx = store[modelName].indexOf(existing);
            store[modelName][idx] = updated;
            return Promise.resolve(updated);
          }
          const newRecord = { ...create, createdAt: new Date(), updatedAt: new Date() };
          store[modelName].push(newRecord);
          return Promise.resolve(newRecord);
        }),
        deleteMany: jest.fn(({ where }: { where?: { id?: string } } = {}) => {
          if (where?.id) {
            store[modelName] = store[modelName].filter((item) => (item as any).id !== where.id);
          } else {
            store[modelName] = [];
          }
          return Promise.resolve({ count: 0 });
        }),
      });

      // The mock client instance
      const mockClientInstance: Record<string, unknown> = {
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        tenant: modelActions('tenant'),
        user: modelActions('user'),
        pet: modelActions('pet'),
        appointment: modelActions('appointment'),
      };

      // Attach $transaction that passes the mock instance as tx
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockClientInstance as any).$transaction = jest.fn((cb: (tx: typeof mockClientInstance) => unknown) => cb(mockClientInstance));

      return mockClientInstance;
    }),
    // Expose a mock Prisma namespace with the enum used in code
    Prisma: {
      TransactionIsolationLevel,
    },
  };
})

// Global test environment setup
global.fetch = jest.fn()

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/vetify_test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.KINDE_CLIENT_ID = 'test-client-id'
process.env.KINDE_CLIENT_SECRET = 'test-client-secret'
process.env.KINDE_ISSUER_URL = 'https://test.kinde.com'

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
