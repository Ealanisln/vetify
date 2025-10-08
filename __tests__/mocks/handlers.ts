import { http, HttpResponse } from 'msw';

// Mock data factories
const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  tenantId: 'tenant-1',
  role: 'USER',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Clinic',
  slug: 'test-clinic',
  subscriptionStatus: 'active',
  plan: 'pro',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockPet = (overrides = {}) => ({
  id: 'pet-1',
  name: 'Buddy',
  species: 'DOG',
  breed: 'Golden Retriever',
  ownerId: 'customer-1',
  tenantId: 'tenant-1',
  dateOfBirth: '2020-01-01',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockAppointment = (overrides = {}) => ({
  id: 'appointment-1',
  title: 'Annual Checkup',
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 3600000).toISOString(),
  status: 'SCHEDULED',
  petId: 'pet-1',
  customerId: 'customer-1',
  staffId: 'staff-1',
  tenantId: 'tenant-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// API Handlers
export const handlers = [
  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }),

  // Authentication
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      user: createMockUser(),
      token: 'mock-jwt-token',
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true });
  }),

  // User management
  http.get('/api/user', () => {
    return HttpResponse.json(createMockUser());
  }),

  http.put('/api/user', () => {
    return HttpResponse.json(createMockUser());
  }),

  // Tenant management
  http.get('/api/tenant', () => {
    return HttpResponse.json(createMockTenant());
  }),

  http.post('/api/tenant', () => {
    return HttpResponse.json(createMockTenant());
  }),

  // Pets
  http.get('/api/pets', () => {
    return HttpResponse.json([createMockPet()]);
  }),

  http.get('/api/pets/:id', ({ params }) => {
    return HttpResponse.json(createMockPet({ id: params.id as string }));
  }),

  http.post('/api/pets', () => {
    return HttpResponse.json(createMockPet());
  }),

  http.put('/api/pets/:id', ({ params }) => {
    return HttpResponse.json(createMockPet({ id: params.id as string }));
  }),

  http.delete('/api/pets/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Appointments
  http.get('/api/appointments', () => {
    return HttpResponse.json([createMockAppointment()]);
  }),

  http.get('/api/appointments/:id', ({ params }) => {
    return HttpResponse.json(createMockAppointment({ id: params.id as string }));
  }),

  http.post('/api/appointments', () => {
    return HttpResponse.json(createMockAppointment());
  }),

  http.put('/api/appointments/:id', ({ params }) => {
    return HttpResponse.json(createMockAppointment({ id: params.id as string }));
  }),

  http.delete('/api/appointments/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Customers
  http.get('/api/customers', () => {
    return HttpResponse.json([
      {
        id: 'customer-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }),

  // Services
  http.get('/api/services', () => {
    return HttpResponse.json([
      {
        id: 'service-1',
        name: 'Annual Checkup',
        description: 'Comprehensive health examination',
        price: 75.00,
        duration: 30,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }),

  // Stripe webhooks
  http.post('/api/webhooks/stripe', () => {
    return HttpResponse.json({ received: true });
  }),

  // WhatsApp integration
  http.post('/api/whatsapp/send', () => {
    return HttpResponse.json({ success: true, messageId: 'msg-123' });
  }),

  // Admin endpoints
  http.get('/api/admin/users', () => {
    return HttpResponse.json([createMockUser()]);
  }),

  http.get('/api/admin/tenants', () => {
    return HttpResponse.json([createMockTenant()]);
  }),

  // Subscription management
  http.get('/api/subscription', () => {
    return HttpResponse.json({
      id: 'sub-1',
      status: 'active',
      plan: 'pro',
      currentPeriodEnd: new Date(Date.now() + 2592000000).toISOString(),
    });
  }),

  // Catch-all for unmatched routes
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }),
];
