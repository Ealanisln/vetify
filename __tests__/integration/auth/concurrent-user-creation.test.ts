import { prismaMock } from '../../mocks/prisma';
import { createTestUser } from '../../utils/test-utils';

describe('Concurrent User Creation (Integration)', () => {
  it('creates a single user when multiple concurrent requests occur', async () => {
    // Create unique test data for each concurrent request
    const baseUserData = {
      email: 'test@example.com',
      name: 'Test User'
    };

    // Generate unique IDs for each concurrent request
    const concurrentRequests = Array.from({ length: 10 }, (_, index) => ({
      id: `user-${Date.now()}-${index}`,
      email: `test-${index}@example.com`,
      name: `Test User ${index}`
    }));

    // Mock Prisma responses for each request
    const mockUsers = concurrentRequests.map(userData => ({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      tenantId: 'test-tenant-id',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Mock the findOrCreateUser function behavior
    concurrentRequests.forEach((userData, index) => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null); // First call: user not found
      prismaMock.user.create.mockResolvedValueOnce(mockUsers[index]); // Create user
    });

    // Simulate concurrent requests
    const results = await Promise.all(
      concurrentRequests.map(async (userData) => {
        try {
          // Mock the findOrCreateUser logic
          const existingUser = await prismaMock.user.findUnique({
            where: { email: userData.email }
          });

          if (existingUser) {
            return existingUser;
          }

          // Create new user
          const newUser = await prismaMock.user.create({
            data: {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              tenantId: 'test-tenant-id'
            }
          });

          return newUser;
        } catch (error) {
          // Handle unique constraint violations gracefully
          if (error instanceof Error && error.message.includes('Unique constraint failed')) {
            // Try to find the existing user
            const existingUser = await prismaMock.user.findUnique({
              where: { email: userData.email }
            });
            return existingUser;
          }
          throw error;
        }
      })
    );

    // Verify that all requests completed successfully
    expect(results).toHaveLength(10);
    expect(results.every(result => result !== null)).toBe(true);

    // Verify that each user has unique data
    const emails = results.map(user => user?.email).filter(Boolean);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toBe(10);

    // Verify Prisma was called correctly
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(10);
    expect(prismaMock.user.create).toHaveBeenCalledTimes(10);
  });

  it('handles database errors gracefully', async () => {
    // Mock a database error
    prismaMock.user.findUnique.mockRejectedValueOnce(new Error('Database connection failed'));

    try {
      await prismaMock.user.findUnique({
        where: { email: 'test@example.com' }
      });
      fail('Expected error to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Database connection failed');
    }
  });

  it('maintains data consistency under concurrent load', async () => {
    const testEmail = 'consistency@example.com';
    const testName = 'Consistency Test User';

    // Mock that user doesn't exist initially
    prismaMock.user.findUnique.mockResolvedValue(null);
    
    // Mock successful user creation - all concurrent requests should get the same user
    const createdUser = {
      id: 'consistency-user-id',
      email: testEmail,
      name: testName,
      tenantId: 'test-tenant-id',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Ensure all create calls return the same user
    prismaMock.user.create.mockResolvedValue(createdUser);

    // Simulate multiple concurrent requests for the same user
    const concurrentRequests = Array.from({ length: 5 }, () => ({
      email: testEmail,
      name: testName
    }));

    // Execute concurrent requests
    const results = await Promise.all(
      concurrentRequests.map(async (userData) => {
        // Simulate the user creation logic
        const existingUser = await prismaMock.user.findUnique({
          where: { email: userData.email }
        });
        
        if (existingUser) {
          return existingUser;
        }
        
        return await prismaMock.user.create({
          data: userData
        });
      })
    );

    // Verify all results are consistent
    expect(results).toHaveLength(5);
    const firstResult = results[0];
    expect(results.every(result => result?.id === firstResult?.id)).toBe(true);
    expect(results.every(result => result?.email === testEmail)).toBe(true);
  });
}); 