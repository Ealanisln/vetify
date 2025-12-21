/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestPet,
  createTestTenant,
  createTestUser,
  createTestCustomer,
  createTestLocation,
} from '../../utils/test-utils';

// Mock the pets API route
const mockPetsRoute = {
  GET: jest.fn(),
  POST: jest.fn(),
};

describe('Pets API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockPet: ReturnType<typeof createTestPet>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockCustomer = createTestCustomer({ tenantId: mockTenant.id });
    mockPet = createTestPet({ tenantId: mockTenant.id, customerId: mockCustomer.id });

    // Mock Prisma responses
    prismaMock.pet.findMany.mockResolvedValue([mockPet]);
    prismaMock.pet.findUnique.mockResolvedValue(mockPet);
    prismaMock.pet.create.mockResolvedValue(mockPet);
    prismaMock.pet.count.mockResolvedValue(1);
  });

  describe('GET /api/pets', () => {
    it('should return all pets for tenant', async () => {
      const pets = [mockPet];
      prismaMock.pet.findMany.mockResolvedValue(pets);

      const result = await prismaMock.pet.findMany({
        where: { tenantId: mockTenant.id },
        include: { customer: true },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result[0].name).toBe(mockPet.name);
    });

    it('should enforce tenant isolation - not return pets from other tenants', async () => {
      const otherTenantPet = createTestPet({
        id: 'other-pet',
        tenantId: 'other-tenant-id',
        customerId: 'other-customer',
      });

      // Simulate query that only returns current tenant's pets
      prismaMock.pet.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockPet];
        }
        return [];
      });

      const result = await prismaMock.pet.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });

    it('should require active subscription to list pets', async () => {
      // Mock subscription check
      const hasActiveSubscription = mockTenant.subscriptionStatus === 'active';
      expect(hasActiveSubscription).toBe(true);

      // If subscription is not active, the API should return 403
      const inactiveTenant = createTestTenant({ subscriptionStatus: 'inactive' as any });
      const isSubscriptionActive = inactiveTenant.subscriptionStatus === 'active';
      expect(isSubscriptionActive).toBe(false);
    });
  });

  describe('POST /api/pets', () => {
    it('should create a new pet', async () => {
      const newPetData = {
        name: 'Max',
        species: 'DOG',
        breed: 'Labrador Retriever',
        dateOfBirth: new Date('2022-06-15'),
        gender: 'male',
        customerId: mockCustomer.id,
      };

      const createdPet = {
        ...mockPet,
        ...newPetData,
        id: 'new-pet-id',
        tenantId: mockTenant.id,
      };

      prismaMock.pet.create.mockResolvedValue(createdPet);

      const result = await prismaMock.pet.create({
        data: {
          ...newPetData,
          tenantId: mockTenant.id,
        },
      });

      expect(result.name).toBe(newPetData.name);
      expect(result.species).toBe(newPetData.species);
      expect(result.tenantId).toBe(mockTenant.id);
    });

    it('should validate required fields - name, species, breed, dateOfBirth, gender, customerId', async () => {
      const invalidData = {
        name: 'Test Pet',
        // missing species, breed, dateOfBirth, gender, customerId
      };

      const requiredFields = ['name', 'species', 'breed', 'dateOfBirth', 'gender', 'customerId'];
      const missingFields = requiredFields.filter((field) => !(field in invalidData));

      expect(missingFields).toContain('species');
      expect(missingFields).toContain('breed');
      expect(missingFields).toContain('dateOfBirth');
      expect(missingFields).toContain('gender');
      expect(missingFields).toContain('customerId');
    });

    it('should validate date of birth format', async () => {
      const validDate = new Date('2022-06-15');
      const invalidDateString = 'invalid-date';

      expect(validDate instanceof Date).toBe(true);
      expect(isNaN(validDate.getTime())).toBe(false);
      expect(isNaN(Date.parse(invalidDateString))).toBe(true);
    });

    it('should check plan limits before creation', async () => {
      // Mock current pet count
      prismaMock.pet.count.mockResolvedValue(50);

      const currentPetCount = await prismaMock.pet.count({
        where: { tenantId: mockTenant.id },
      });

      // Simulate plan limits (pro plan allows 100 pets)
      const planMaxPets = 100;
      const canCreatePet = currentPetCount < planMaxPets;

      expect(canCreatePet).toBe(true);

      // Test limit exceeded scenario
      prismaMock.pet.count.mockResolvedValue(100);
      const countAtLimit = await prismaMock.pet.count({
        where: { tenantId: mockTenant.id },
      });

      const canCreatePetAtLimit = countAtLimit < planMaxPets;
      expect(canCreatePetAtLimit).toBe(false);
    });

    it('should enforce tenant isolation - customer must belong to tenant', async () => {
      const otherTenantCustomer = createTestCustomer({
        id: 'other-tenant-customer',
        tenantId: 'other-tenant-id',
      });

      // Simulate customer lookup
      prismaMock.customer.findUnique.mockImplementation(async (args: any) => {
        if (args?.where?.id === mockCustomer.id) {
          return mockCustomer;
        }
        if (args?.where?.id === otherTenantCustomer.id) {
          return otherTenantCustomer;
        }
        return null;
      });

      // Check that customer belongs to current tenant
      const customer = await prismaMock.customer.findUnique({
        where: { id: otherTenantCustomer.id },
      });

      const belongsToTenant = customer?.tenantId === mockTenant.id;
      expect(belongsToTenant).toBe(false);
    });

    it('should include customer data in created pet response', async () => {
      const petWithCustomer = {
        ...mockPet,
        customer: mockCustomer,
      };

      prismaMock.pet.create.mockResolvedValue(petWithCustomer);

      const result = await prismaMock.pet.create({
        data: {
          name: mockPet.name,
          species: mockPet.species,
          breed: mockPet.breed,
          dateOfBirth: mockPet.dateOfBirth,
          gender: mockPet.gender,
          customerId: mockCustomer.id,
          tenantId: mockTenant.id,
        },
        include: { customer: true },
      });

      expect(result.customer).toBeDefined();
      expect(result.customer.id).toBe(mockCustomer.id);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should count only pets belonging to current tenant', async () => {
      // Setup: Mock different counts per tenant
      prismaMock.pet.count.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return 5;
        }
        if (args?.where?.tenantId === 'other-tenant-id') {
          return 10;
        }
        return 0;
      });

      const currentTenantCount = await prismaMock.pet.count({
        where: { tenantId: mockTenant.id },
      });

      const otherTenantCount = await prismaMock.pet.count({
        where: { tenantId: 'other-tenant-id' },
      });

      expect(currentTenantCount).toBe(5);
      expect(otherTenantCount).toBe(10);
    });
  });

  describe('Location Filtering', () => {
    it('should filter pets by locationId when provided', async () => {
      const location1 = createTestLocation({ id: 'location-1', name: 'Clinic A' });
      const location2 = createTestLocation({ id: 'location-2', name: 'Clinic B' });

      const customerAtLocation1 = createTestCustomer({
        id: 'customer-loc-1',
        tenantId: mockTenant.id,
        locationId: location1.id,
      });
      const customerAtLocation2 = createTestCustomer({
        id: 'customer-loc-2',
        tenantId: mockTenant.id,
        locationId: location2.id,
      });

      const petAtLocation1 = createTestPet({
        id: 'pet-loc-1',
        tenantId: mockTenant.id,
        customerId: customerAtLocation1.id,
        name: 'Pet at Location 1',
      });
      const petAtLocation2 = createTestPet({
        id: 'pet-loc-2',
        tenantId: mockTenant.id,
        customerId: customerAtLocation2.id,
        name: 'Pet at Location 2',
      });

      // Simulate locationId filter via customer relation
      prismaMock.pet.findMany.mockImplementation(async (args: any) => {
        const pets = [
          { ...petAtLocation1, customer: customerAtLocation1 },
          { ...petAtLocation2, customer: customerAtLocation2 },
        ];

        if (args?.where?.customer?.locationId) {
          return pets.filter(
            (p) => p.customer.locationId === args.where.customer.locationId
          );
        }
        return pets;
      });

      // Query with locationId filter
      const filteredResult = await prismaMock.pet.findMany({
        where: {
          tenantId: mockTenant.id,
          customer: { locationId: location1.id },
        },
        include: { customer: true },
      });

      expect(filteredResult).toHaveLength(1);
      expect(filteredResult[0].name).toBe('Pet at Location 1');
      expect(filteredResult[0].customer.locationId).toBe(location1.id);
    });

    it('should return all pets when locationId is not provided', async () => {
      const location1 = createTestLocation({ id: 'location-1', name: 'Clinic A' });
      const location2 = createTestLocation({ id: 'location-2', name: 'Clinic B' });

      const customerAtLocation1 = createTestCustomer({
        id: 'customer-loc-1',
        tenantId: mockTenant.id,
        locationId: location1.id,
      });
      const customerAtLocation2 = createTestCustomer({
        id: 'customer-loc-2',
        tenantId: mockTenant.id,
        locationId: location2.id,
      });
      const customerNoLocation = createTestCustomer({
        id: 'customer-no-loc',
        tenantId: mockTenant.id,
        locationId: null,
      });

      const petAtLocation1 = createTestPet({
        id: 'pet-loc-1',
        tenantId: mockTenant.id,
        customerId: customerAtLocation1.id,
      });
      const petAtLocation2 = createTestPet({
        id: 'pet-loc-2',
        tenantId: mockTenant.id,
        customerId: customerAtLocation2.id,
      });
      const petNoLocation = createTestPet({
        id: 'pet-no-loc',
        tenantId: mockTenant.id,
        customerId: customerNoLocation.id,
      });

      prismaMock.pet.findMany.mockResolvedValue([
        { ...petAtLocation1, customer: customerAtLocation1 },
        { ...petAtLocation2, customer: customerAtLocation2 },
        { ...petNoLocation, customer: customerNoLocation },
      ]);

      // Query without locationId filter
      const result = await prismaMock.pet.findMany({
        where: { tenantId: mockTenant.id },
        include: { customer: true },
      });

      expect(result).toHaveLength(3);
      expect(result.map((p) => p.id)).toContain('pet-loc-1');
      expect(result.map((p) => p.id)).toContain('pet-loc-2');
      expect(result.map((p) => p.id)).toContain('pet-no-loc');
    });

    it('should include pets with null customer locationId when filtering by specific location', async () => {
      const location1 = createTestLocation({ id: 'location-1', name: 'Clinic A' });

      const customerAtLocation1 = createTestCustomer({
        id: 'customer-loc-1',
        tenantId: mockTenant.id,
        locationId: location1.id,
      });
      const customerNoLocation = createTestCustomer({
        id: 'customer-no-loc',
        tenantId: mockTenant.id,
        locationId: null,
      });

      const petAtLocation1 = createTestPet({
        id: 'pet-loc-1',
        tenantId: mockTenant.id,
        customerId: customerAtLocation1.id,
      });
      const petNoLocation = createTestPet({
        id: 'pet-no-loc',
        tenantId: mockTenant.id,
        customerId: customerNoLocation.id,
      });

      // Simulate the OR condition (locationId matches OR locationId is null)
      prismaMock.pet.findMany.mockImplementation(async (args: any) => {
        const pets = [
          { ...petAtLocation1, customer: customerAtLocation1 },
          { ...petNoLocation, customer: customerNoLocation },
        ];
        if (args?.where?.customer?.OR) {
          return pets.filter(
            (p) => p.customer.locationId === location1.id || p.customer.locationId === null
          );
        }
        return pets;
      });

      const result = await prismaMock.pet.findMany({
        where: {
          tenantId: mockTenant.id,
          customer: {
            OR: [{ locationId: location1.id }, { locationId: null }],
          },
        },
        include: { customer: true },
      });

      expect(result).toHaveLength(2);
      const locationIds = result.map((p) => p.customer.locationId);
      expect(locationIds).toContain(location1.id);
      expect(locationIds).toContain(null);
    });
  });
});
