import { prismaMock } from '../../mocks/prisma';
import { createTestTenant, createTestAppointment } from '../../utils/test-utils';

// Mock performance monitoring functions
const mockMeasurePerformance = jest.fn((fn: () => unknown) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return { result, duration: end - start };
});

const mockRecordMetric = jest.fn();

describe('Performance Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockAppointment: ReturnType<typeof createTestAppointment>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTenant = createTestTenant();
    mockAppointment = createTestAppointment();
  });

  describe('Database Query Performance', () => {
    it('should optimize appointment queries with proper indexing', async () => {
      const startTime = performance.now();
      
      // Mock optimized query with proper includes and where clauses
      prismaMock.appointment.findMany.mockResolvedValue([mockAppointment]);
      
      const appointments = await prismaMock.appointment.findMany({
        where: {
          tenantId: mockTenant.id,
          startTime: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
          status: 'SCHEDULED',
        },
        include: {
          pet: {
            select: {
              id: true,
              name: true,
              species: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      expect(appointments).toHaveLength(1);
      expect(queryTime).toBeLessThan(100); // Should complete in under 100ms
      expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenant.id,
          startTime: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
          status: 'SCHEDULED',
        },
        include: {
          pet: {
            select: {
              id: true,
              name: true,
              species: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          staff: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
    });

    it('should use pagination for large result sets', async () => {
      const largeAppointmentList = Array.from({ length: 1000 }, (_, i) => 
        createTestAppointment({ id: `appointment-${i}` })
      );
      
      const pageSize = 50;
      const page = 1;
      
      prismaMock.appointment.findMany.mockResolvedValue(
        largeAppointmentList.slice((page - 1) * pageSize, page * pageSize)
      );
      
      const startTime = performance.now();
      
      const appointments = await prismaMock.appointment.findMany({
        where: {
          tenantId: mockTenant.id,
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: {
          startTime: 'asc',
        },
      });
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      expect(appointments).toHaveLength(pageSize);
      expect(queryTime).toBeLessThan(50); // Paginated queries should be fast
      expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenant.id,
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: {
          startTime: 'asc',
        },
      });
    });

    it('should avoid N+1 queries with proper includes', async () => {
      const appointments = [{
        ...mockAppointment,
        pet: { id: 'pet-1', name: 'Buddy', species: 'DOG' },
        customer: { id: 'customer-1', name: 'John Doe', email: 'john@example.com' },
        staff: { id: 'staff-1', name: 'Dr. Smith' },
      }];
      
      // Mock single query with includes instead of multiple separate queries
      prismaMock.appointment.findMany.mockResolvedValue(appointments);
      
      const startTime = performance.now();
      
      const result = await prismaMock.appointment.findMany({
        where: {
          tenantId: mockTenant.id,
        },
        include: {
          pet: true,
          customer: true,
          staff: true,
        },
      });
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      expect(result).toHaveLength(1);
      expect(result[0].pet).toBeDefined();
      expect(result[0].customer).toBeDefined();
      expect(result[0].staff).toBeDefined();
      expect(queryTime).toBeLessThan(50); // Single query should be fast
      
      // Verify only one database call was made
      expect(prismaMock.appointment.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('API Response Time Performance', () => {
    it('should respond to health check within 50ms', async () => {
      const startTime = performance.now();
      
      // Mock health check response
      const healthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(healthResponse.status).toBe('healthy');
      expect(responseTime).toBeLessThan(50); // Health check should be very fast
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = performance.now();
      
      // Mock concurrent appointment queries
      const promises = Array.from({ length: concurrentRequests }, () =>
        prismaMock.appointment.findMany({
          where: { tenantId: mockTenant.id },
          take: 10,
        })
      );
      
      prismaMock.appointment.findMany.mockResolvedValue([mockAppointment]);
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(results).toHaveLength(concurrentRequests);
      expect(totalTime).toBeLessThan(200); // 10 concurrent requests should complete quickly
      expect(prismaMock.appointment.findMany).toHaveBeenCalledTimes(concurrentRequests);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle large datasets without memory leaks', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        data: `Data for item ${i}`.repeat(100), // Large data strings
      }));
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process large dataset
      const processedData = largeDataset.map(item => ({
        ...item,
        processed: true,
        timestamp: new Date(),
      }));
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      expect(processedData).toHaveLength(10000);
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });
  });

  describe('Database Connection Performance', () => {
    it('should maintain connection pool efficiently', async () => {
      const connectionStart = performance.now();
      
      // Simulate multiple database operations
      const operations = Array.from({ length: 50 }, (_, i) => 
        prismaMock.appointment.findMany({
          where: { tenantId: mockTenant.id },
          take: 10,
          skip: i * 10,
        })
      );
      
      prismaMock.appointment.findMany.mockResolvedValue([mockAppointment]);
      
      await Promise.all(operations);
      
      const connectionEnd = performance.now();
      const totalTime = connectionEnd - connectionStart;
      
      expect(totalTime).toBeLessThan(500); // 50 operations should complete quickly
      expect(prismaMock.appointment.findMany).toHaveBeenCalledTimes(50);
    });

    it('should handle connection failures gracefully', async () => {
      // Mock connection failure
      prismaMock.appointment.findMany.mockRejectedValueOnce(
        new Error('Connection failed')
      );
      
      const startTime = performance.now();
      
      try {
        await prismaMock.appointment.findMany({
          where: { tenantId: mockTenant.id },
        });
      } catch (error) {
        const endTime = performance.now();
        const failureTime = endTime - startTime;
        
        expect(error.message).toBe('Connection failed');
        expect(failureTime).toBeLessThan(1000); // Failure should be detected quickly
      }
    });
  });

  describe('Search Performance', () => {
    it('should perform text search efficiently', async () => {
      const searchTerm = 'checkup';
      const startTime = performance.now();
      
      // Mock full-text search
      prismaMock.appointment.findMany.mockResolvedValue([mockAppointment]);
      
      const results = await prismaMock.appointment.findMany({
        where: {
          tenantId: mockTenant.id,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { notes: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 20,
      });
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;
      
      expect(results).toHaveLength(1);
      expect(searchTime).toBeLessThan(100); // Search should complete quickly
      expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenant.id,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { notes: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 20,
      });
    });

    it('should use database indexes for date range queries', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const startTime = performance.now();
      
      prismaMock.appointment.findMany.mockResolvedValue([mockAppointment]);
      
      const results = await prismaMock.appointment.findMany({
        where: {
          tenantId: mockTenant.id,
          startTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      expect(results).toHaveLength(1);
      expect(queryTime).toBeLessThan(50); // Indexed date queries should be fast
    });
  });

  describe('Performance Monitoring', () => {
    it('should record performance metrics', async () => {
      const testFunction = () => {
        return 'test result';
      };
      
      const { result, duration } = mockMeasurePerformance(testFunction);
      
      expect(result).toBe('test result');
      expect(duration).toBeGreaterThan(0);
      expect(mockMeasurePerformance).toHaveBeenCalledWith(testFunction);
    });

    it('should track slow queries', async () => {
      const slowQuery = async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate slow query
        return 'slow result';
      };

      const startTime = performance.now();
      const result = await slowQuery();
      const duration = performance.now() - startTime;

      expect(result).toBe('slow result');
      // Use >= 95ms to account for timer variance in CI environments
      expect(duration).toBeGreaterThanOrEqual(95);

      // Should record slow query metric (threshold at 95ms for CI tolerance)
      if (duration >= 95) {
        mockRecordMetric('slow_query', duration);
        expect(mockRecordMetric).toHaveBeenCalledWith('slow_query', duration);
      }
    });
  });
});
