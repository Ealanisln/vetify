import dotenv from 'dotenv';
import '@testing-library/jest-dom';

dotenv.config({ path: '.env.local' });

// Mock Next.js router utilities that may be imported in server components
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
}));

// Provide basic env vars required by the codebase
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/vetify_test';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ?? 'test-secret';

// Ensure fetch exists in the Node environment
if (!(global as any).fetch) {
  (global as any).fetch = jest.fn();
}

// Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks();
}); 