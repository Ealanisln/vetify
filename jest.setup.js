import '@testing-library/jest-dom'

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
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pet: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    appointment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}))

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
