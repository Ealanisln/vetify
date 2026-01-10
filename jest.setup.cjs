require('@testing-library/jest-dom');

// Polyfill for Next.js server components
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Request/Response/Headers for Node.js test environment
class MockHeaders {
  constructor(init = {}) {
    this._headers = new Map(Object.entries(init));
  }
  get(name) {
    return this._headers.get(name.toLowerCase()) || null;
  }
  set(name, value) {
    this._headers.set(name.toLowerCase(), value);
  }
  has(name) {
    return this._headers.has(name.toLowerCase());
  }
  delete(name) {
    this._headers.delete(name.toLowerCase());
  }
  entries() {
    return this._headers.entries();
  }
  forEach(callback) {
    this._headers.forEach(callback);
  }
}

class MockRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this._body = options.body;
    this._headers = new MockHeaders(options.headers || {});
    this.nextUrl = new URL(url);
  }
  get headers() {
    return this._headers;
  }
  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
  }
  async text() {
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
  }
}

class MockResponse {
  constructor(body, options = {}) {
    this._body = body;
    this.status = options.status || 200;
    this._headers = new MockHeaders(options.headers || {});
  }
  get headers() {
    return this._headers;
  }
  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
  }
  async text() {
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
  }
}

global.Request = MockRequest;
global.Response = MockResponse;
global.Headers = MockHeaders;

// Mock NextResponse with static json method
jest.mock('next/server', () => {
  // Re-create MockHeaders inside the factory since jest.mock is hoisted
  class InnerMockHeaders {
    constructor(init = {}) {
      this._headers = new Map(Object.entries(init));
    }
    get(name) {
      return this._headers.get(name.toLowerCase()) || null;
    }
    set(name, value) {
      this._headers.set(name.toLowerCase(), value);
    }
    has(name) {
      return this._headers.has(name.toLowerCase());
    }
    delete(name) {
      this._headers.delete(name.toLowerCase());
    }
    entries() {
      return this._headers.entries();
    }
    forEach(callback) {
      this._headers.forEach(callback);
    }
  }

  class MockNextRequest {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this._body = options.body;
      this._headers = new InnerMockHeaders(options.headers || {});
      this.nextUrl = new URL(url);
    }
    get headers() {
      return this._headers;
    }
    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }
    async text() {
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
    }
  }

  class MockNextResponse {
    constructor(body, options = {}) {
      this._body = body;
      this.status = options.status || 200;
      this._headers = new InnerMockHeaders(options.headers || {});
    }

    static json(body, options = {}) {
      const response = new MockNextResponse(JSON.stringify(body), options);
      response._jsonBody = body;
      return response;
    }

    get headers() {
      return this._headers;
    }

    async json() {
      if (this._jsonBody !== undefined) {
        return this._jsonBody;
      }
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }

    async text() {
      return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

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
}));

// Mock Kinde Auth
jest.mock('@kinde-oss/kinde-auth-nextjs', () => ({
  getKindeServerSession: jest.fn(() => ({
    getUser: jest.fn(),
    getPermissions: jest.fn(),
    getOrganization: jest.fn(),
  })),
  LoginLink: ({ children }) => children,
  LogoutLink: ({ children }) => children,
  RegisterLink: ({ children }) => children,
}));

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
  // Prisma enums
  TreatmentType: {
    VACCINATION: 'VACCINATION',
    DEWORMING: 'DEWORMING',
    FLEA_TICK: 'FLEA_TICK',
    OTHER_PREVENTATIVE: 'OTHER_PREVENTATIVE',
  },
  VaccinationStage: {
    PUPPY_KITTEN: 'PUPPY_KITTEN',
    ADULT: 'ADULT',
    SENIOR: 'SENIOR',
    BOOSTER: 'BOOSTER',
  },
  DewormingType: {
    INTERNAL: 'INTERNAL',
    EXTERNAL: 'EXTERNAL',
    BOTH: 'BOTH',
  },
  TreatmentStatus: {
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    OVERDUE: 'OVERDUE',
    CANCELLED: 'CANCELLED',
  },
  AppointmentStatus: {
    SCHEDULED: 'SCHEDULED',
    CONFIRMED: 'CONFIRMED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW',
  },
  TransferStatus: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
}));

// Global test environment setup
global.fetch = jest.fn();

// Mock nanoid (ESM-only module)
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-nanoid-1234567890123456'),
}));

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/vetify_test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.KINDE_CLIENT_ID = 'test-client-id';
process.env.KINDE_CLIENT_SECRET = 'test-client-secret';
process.env.KINDE_ISSUER_URL = 'https://test.kinde.com';

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
