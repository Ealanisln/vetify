// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return `[Image: ${props.alt || 'image'}]`;
  },
}));

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    redirectToCheckout: jest.fn(),
    confirmCardPayment: jest.fn(),
    createToken: jest.fn(),
  })),
}));

// Mock Kinde Auth
jest.mock('@kinde-oss/kinde-auth-nextjs', () => ({
  useKindeAuth: () => ({
    isAuthenticated: true,
    user: {
      id: 'user-1',
      email: 'test@example.com',
      given_name: 'Test',
      family_name: 'User',
    },
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    getUser: jest.fn(),
    getToken: jest.fn(),
    getPermissions: jest.fn(),
    getOrganization: jest.fn(),
    getOrganizations: jest.fn(),
    createOrg: jest.fn(),
    joinOrg: jest.fn(),
  }),
  getKindeServerSession: jest.fn(() => Promise.resolve({
    isAuthenticated: true,
    user: {
      id: 'user-1',
      email: 'test@example.com',
      given_name: 'Test',
      family_name: 'User',
    },
  })),
}));

// Mock Upstash Redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  })),
}));

// Mock Upstash Rate Limit
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn(() => ({
    limit: jest.fn(() => Promise.resolve({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    })),
  })),
}));

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  tenantId: 'tenant-1',
  role: 'USER' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Clinic',
  slug: 'test-clinic',
  subscriptionStatus: 'active' as const,
  plan: 'pro' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestPet = (overrides = {}) => ({
  id: 'pet-1',
  name: 'Buddy',
  species: 'DOG' as const,
  breed: 'Golden Retriever',
  ownerId: 'customer-1',
  tenantId: 'tenant-1',
  dateOfBirth: '2020-01-01',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestAppointment = (overrides = {}) => ({
  id: 'appointment-1',
  title: 'Annual Checkup',
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T11:00:00Z'),
  status: 'SCHEDULED' as const,
  petId: 'pet-1',
  customerId: 'customer-1',
  staffId: 'staff-1',
  tenantId: 'tenant-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Helper functions
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

export const mockConsoleError = () => {
  const originalError = console.error;
  const mockError = jest.fn();
  console.error = mockError;
  
  return {
    mockError,
    restore: () => {
      console.error = originalError;
    },
  };
};

export const mockConsoleWarn = () => {
  const originalWarn = console.warn;
  const mockWarn = jest.fn();
  console.warn = mockWarn;
  
  return {
    mockWarn,
    restore: () => {
      console.warn = originalWarn;
    },
  };
};
