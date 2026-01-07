/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const createTestCustomer = (overrides = {}) => ({
  id: 'customer-1',
  tenantId: 'tenant-1',
  locationId: null,
  name: 'John Doe',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+52 1 55 1234 5678',
  address: '123 Test Street',
  preferredContactMethod: 'phone' as const,
  notes: null,
  isActive: true,
  source: 'MANUAL' as const,
  needsReview: false,
  reviewedAt: null,
  reviewedBy: null,
  mergedFrom: [],
  userId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestLocation = (overrides = {}) => ({
  id: 'location-1',
  tenantId: 'tenant-1',
  name: 'Main Clinic',
  slug: 'main-clinic',
  address: '456 Clinic Avenue',
  phone: '+52 1 55 9876 5432',
  email: 'clinic@example.com',
  timezone: 'America/Mexico_City',
  isActive: true,
  isPrimary: true,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestInventoryItem = (overrides = {}) => ({
  id: 'inventory-1',
  tenantId: 'tenant-1',
  locationId: 'location-1',
  name: 'Rabies Vaccine',
  category: 'VACCINE' as const,
  description: 'Standard rabies vaccine for dogs and cats',
  activeCompound: 'Inactivated Rabies Virus',
  presentation: 'Vial',
  measure: '1ml',
  brand: 'VetPharm',
  quantity: 100,
  minStock: 10,
  expirationDate: new Date('2025-12-31'),
  status: 'ACTIVE' as const,
  batchNumber: 'BATCH-001',
  specialNotes: null,
  cost: 50.00,
  price: 75.00,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestInventoryTransfer = (overrides = {}) => ({
  id: 'transfer-1',
  tenantId: 'tenant-1',
  inventoryItemId: 'inventory-1',
  fromLocationId: 'location-1',
  toLocationId: 'location-2',
  quantity: 10,
  status: 'PENDING' as const,
  notes: 'Transfer for stock balancing',
  requestedById: 'staff-1',
  completedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestService = (overrides = {}) => ({
  id: 'service-1',
  tenantId: 'tenant-1',
  locationId: null,
  name: 'General Consultation',
  description: 'Basic veterinary consultation and examination',
  category: 'CONSULTATION' as const,
  price: 500.00,
  duration: 30,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestStaff = (overrides = {}) => ({
  id: 'staff-1',
  tenantId: 'tenant-1',
  locationId: null,
  userId: null,
  name: 'Dr. Maria Garcia',
  position: 'Veterinarian',
  email: 'maria.garcia@example.com',
  phone: '+52 1 55 1111 2222',
  licenseNumber: 'VET-MX-12345',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestStaffLocation = (overrides = {}) => ({
  id: 'staff-location-1',
  staffId: 'staff-1',
  locationId: 'location-1',
  isPrimary: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Sale-related factories
export const createTestSale = (overrides = {}) => ({
  id: 'sale-1',
  tenantId: 'tenant-1',
  customerId: 'customer-1',
  petId: 'pet-1',
  userId: 'user-1',
  staffId: 'staff-1',
  saleNumber: 'SALE-202401010001',
  subtotal: 100.0,
  tax: 16.0,
  discount: 0,
  total: 116.0,
  status: 'COMPLETED' as const,
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestSaleItem = (overrides = {}) => ({
  id: 'sale-item-1',
  saleId: 'sale-1',
  itemId: 'inventory-1',
  serviceId: null,
  description: 'Rabies Vaccine',
  quantity: 1,
  unitPrice: 100.0,
  discount: 0,
  total: 100.0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestSalePayment = (overrides = {}) => ({
  id: 'payment-1',
  saleId: 'sale-1',
  paymentMethod: 'CASH' as const,
  amount: 116.0,
  paymentDate: new Date('2024-01-01'),
  transactionId: null,
  notes: null,
  cashTransactionId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Cash Register (Caja) factories
export const createTestCashDrawer = (overrides = {}) => ({
  id: 'drawer-1',
  tenantId: 'tenant-1',
  locationId: null,
  openedById: 'user-1',
  closedById: null,
  initialAmount: 500.0,
  finalAmount: null,
  expectedAmount: null,
  difference: null,
  status: 'OPEN' as const,
  notes: null,
  openedAt: new Date(),
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestCashTransaction = (overrides = {}) => ({
  id: 'transaction-1',
  drawerId: 'drawer-1',
  amount: 100.0,
  type: 'SALE_CASH' as const,
  description: 'Sale payment',
  relatedId: 'sale-1',
  relatedType: 'SALE',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestCashShift = (overrides = {}) => ({
  id: 'shift-1',
  tenantId: 'tenant-1',
  drawerId: 'drawer-1',
  cashierId: 'staff-1',
  startedAt: new Date(),
  endedAt: null,
  startingBalance: 1000.0,
  endingBalance: null,
  expectedBalance: null,
  difference: null,
  status: 'ACTIVE' as const,
  notes: null,
  handedOffToId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Treatment Schedule factories
export const createTestTreatmentSchedule = (overrides = {}) => ({
  id: 'schedule-1',
  tenantId: 'tenant-1',
  petId: 'pet-1',
  treatmentType: 'VACCINATION' as const,
  productName: 'Rabies Vaccine',
  scheduledDate: new Date('2024-06-01'),
  status: 'SCHEDULED' as const,
  reminderSent: false,
  vaccineStage: 'ADULT' as const,
  dewormingType: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Reminder factory
export const createTestReminder = (overrides = {}) => ({
  id: 'reminder-1',
  tenantId: 'tenant-1',
  petId: 'pet-1',
  customerId: 'customer-1',
  userId: null,
  type: 'TREATMENT' as const,
  title: 'Vaccination Reminder',
  message: 'Your pet has a vaccination scheduled',
  dueDate: new Date('2024-05-25'),
  status: 'PENDING' as const,
  sentAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// Medical History factories
export const createTestMedicalHistory = (overrides = {}) => ({
  id: 'history-1',
  tenantId: 'tenant-1',
  petId: 'pet-1',
  staffId: 'staff-1',
  visitDate: new Date('2024-01-15'),
  reasonForVisit: 'Annual checkup and vaccination',
  diagnosis: 'Healthy pet, no issues found',
  treatment: 'Administered annual vaccines',
  notes: 'Pet appears healthy overall',
  medicalOrderId: null,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

export const createTestMedicalOrder = (overrides = {}) => ({
  id: 'order-1',
  tenantId: 'tenant-1',
  petId: 'pet-1',
  staffId: 'staff-1',
  userId: null,
  visitDate: new Date('2024-01-15'),
  diagnosis: 'Minor infection',
  treatment: 'Antibiotics prescribed',
  notes: null,
  status: 'PENDING' as const,
  saleId: null,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

export const createTestPrescription = (overrides = {}) => ({
  id: 'prescription-1',
  orderId: 'order-1',
  productId: 'inventory-1',
  quantity: 1,
  unitPrice: 150.0,
  dosage: '10mg',
  frequency: 'Twice daily',
  duration: '7 days',
  instructions: 'Give with food',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

// Cron job test utilities
// Note: NextRequest type is imported inline to avoid module resolution issues in test environment

export const createMockCronRequest = (authHeader?: string) => ({
  headers: {
    get: jest.fn((name: string) =>
      name === 'authorization' ? authHeader : null
    ),
  },
} as unknown as NextRequest);

export const createMockInventoryResult = (overrides = {}) => ({
  success: true,
  tenantsChecked: 5,
  totalAlertsSent: 3,
  errors: {} as Record<string, string[]>,
  ...overrides,
});

export const createMockAppointmentReminderResult = (overrides = {}) => ({
  success: true,
  appointmentsChecked: 10,
  emailsSent: 8,
  errors: [] as string[],
  ...overrides,
});

export const createMockTreatmentReminderResult = (overrides = {}) => ({
  success: true,
  remindersProcessed: 6,
  emailsSent: 6,
  errors: [] as string[],
  ...overrides,
});

// Testimonial factory
export const createTestTestimonial = (overrides = {}) => ({
  id: 'testimonial-1',
  tenantId: 'tenant-1',
  customerId: null,
  appointmentId: null,
  reviewerName: 'Maria Garcia',
  reviewerEmail: 'maria@example.com',
  rating: 5,
  text: 'Excelente servicio, muy profesionales y amables con mi mascota.',
  status: 'PENDING' as const,
  isFeatured: false,
  displayOrder: null,
  source: 'PUBLIC_FORM' as const,
  submittedAt: new Date('2024-01-15'),
  moderatedAt: null,
  moderatedById: null,
  moderationNote: null,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
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
