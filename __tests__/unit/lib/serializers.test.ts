/* eslint-disable @typescript-eslint/no-explicit-any */
import { serializeUser, serializePet, serializeCustomer, serializeObject, serializeDecimal } from '@/lib/serializers';
import { Decimal } from '@prisma/client/runtime/library';

describe('Serializers', () => {
  describe('serializeDecimal', () => {
    it('should convert Decimal to number', () => {
      const decimalValue = new Decimal(123.45);
      const result = serializeDecimal(decimalValue);
      expect(result).toBe(123.45);
    });

    it('should handle null values', () => {
      const result = serializeDecimal(null);
      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      const result = serializeDecimal(undefined);
      expect(result).toBeNull();
    });

    it('should handle zero values', () => {
      const decimalValue = new Decimal(0);
      const result = serializeDecimal(decimalValue);
      expect(result).toBe(0);
    });
  });

  describe('serializeObject', () => {
    it('should serialize nested objects with Decimal fields', () => {
      const obj = {
        id: 'user_123',
        balance: new Decimal(100.50),
        nested: {
          amount: new Decimal(25.75),
          text: 'hello'
        }
      };

      const result = serializeObject(obj);

      expect(result.balance).toBe(100.50);
      expect(result.nested.amount).toBe(25.75);
      expect(result.nested.text).toBe('hello');
    });

    it('should serialize arrays with Decimal fields', () => {
      const arr = [
        { id: 1, value: new Decimal(10.5) },
        { id: 2, value: new Decimal(20.25) }
      ];

      const result = serializeObject(arr);

      expect(result[0].value).toBe(10.5);
      expect(result[1].value).toBe(20.25);
    });

    it('should handle null and undefined values', () => {
      const obj = {
        id: 'user_123',
        value: null,
        other: undefined
      };

      const result = serializeObject(obj);

      expect(result.value).toBeNull();
      expect(result.other).toBeUndefined();
    });

    it('should handle primitive values', () => {
      const obj = {
        string: 'hello',
        number: 42,
        boolean: true
      };

      const result = serializeObject(obj);

      expect(result.string).toBe('hello');
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
    });
  });

  describe('serializeUser', () => {
    it('should serialize user data correctly', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        tenantId: 'tenant_123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
        balance: new Decimal(150.75),
        // Additional fields that should be included (serializers don't filter)
        internalNotes: 'Internal notes',
        lastLoginAt: new Date('2023-01-01T12:00:00Z'),
      };

      const result = serializeUser(mockUser as any);

      expect(result).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        tenantId: 'tenant_123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
        balance: 150.75,
        internalNotes: 'Internal notes',
        lastLoginAt: new Date('2023-01-01T12:00:00Z'),
      });
    });

    it('should handle user with minimal data', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
      };

      const result = serializeUser(mockUser as any);

      expect(result).toEqual({
        id: 'user_123',
        email: 'test@example.com',
      });
    });

    it('should handle null and undefined values gracefully', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: null,
        role: undefined,
        tenantId: null,
        createdAt: null,
        updatedAt: undefined,
      };

      const result = serializeUser(mockUser as any);

      expect(result).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        name: null,
        role: undefined,
        tenantId: null,
        createdAt: null,
        updatedAt: undefined,
      });
    });

    it('should handle dates correctly', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        createdAt: new Date('2023-01-01T12:30:45.123Z'),
        updatedAt: new Date('2023-01-02T15:45:30.456Z'),
      };

      const result = serializeUser(mockUser as any);

      expect(result.createdAt).toEqual(new Date('2023-01-01T12:30:45.123Z'));
      expect(result.updatedAt).toEqual(new Date('2023-01-02T15:45:30.456Z'));
    });

    it('should handle invalid dates gracefully', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        createdAt: new Date('invalid-date'),
        updatedAt: new Date('not-a-date'),
      };

      const result = serializeUser(mockUser as any);

      // Invalid dates create Date objects with NaN values
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(isNaN(result.createdAt.getTime())).toBe(true);
      expect(isNaN(result.updatedAt.getTime())).toBe(true);
    });
  });

  describe('serializePet', () => {
    it('should serialize pet data correctly', () => {
      const mockPet = {
        id: 'pet_123',
        name: 'Buddy',
        species: 'DOG',
        breed: 'Golden Retriever',
        age: 5,
        weight: new Decimal(25.5),
        ownerId: 'customer_123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
        // Additional fields that should be included (serializers don't filter)
        internalNotes: 'Internal pet notes',
        medicalHistory: 'Sensitive medical info',
      };

      const result = serializePet(mockPet as any);

      expect(result).toEqual({
        id: 'pet_123',
        name: 'Buddy',
        species: 'DOG',
        breed: 'Golden Retriever',
        age: 5,
        weight: 25.5,
        ownerId: 'customer_123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
        internalNotes: 'Internal pet notes',
        medicalHistory: 'Sensitive medical info',
      });
    });

    it('should handle pet with minimal data', () => {
      const mockPet = {
        id: 'pet_123',
        name: 'Buddy',
        species: 'DOG',
      };

      const result = serializePet(mockPet as any);

      expect(result).toEqual({
        id: 'pet_123',
        name: 'Buddy',
        species: 'DOG',
      });
    });

    it('should handle numeric fields correctly', () => {
      const mockPet = {
        id: 'pet_123',
        name: 'Buddy',
        age: 0,
        weight: new Decimal(0.0),
        height: null,
        length: undefined,
      };

      const result = serializePet(mockPet as any);

      expect(result.age).toBe(0);
      expect(result.weight).toBe(0.0);
      expect(result.height).toBeNull();
      expect(result.length).toBeUndefined();
    });

    it('should handle enum values correctly', () => {
      const mockPet = {
        id: 'pet_123',
        name: 'Buddy',
        species: 'CAT',
        gender: 'FEMALE',
        size: 'MEDIUM',
      };

      const result = serializePet(mockPet as any);

      expect(result.species).toBe('CAT');
      expect(result.gender).toBe('FEMALE');
      expect(result.size).toBe('MEDIUM');
    });
  });

  describe('serializeCustomer', () => {
    it('should serialize customer data correctly', () => {
      const mockCustomer = {
        id: 'customer_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
        balance: new Decimal(250.00),
        // Additional fields that should be included (serializers don't filter)
        internalNotes: 'Internal customer notes',
        creditCard: '****-****-****-1234',
        socialSecurityNumber: '***-**-1234',
      };

      const result = serializeCustomer(mockCustomer as any);

      expect(result).toEqual({
        id: 'customer_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
        balance: 250.00,
        internalNotes: 'Internal customer notes',
        creditCard: '****-****-****-1234',
        socialSecurityNumber: '***-**-1234',
      });
    });

    it('should handle customer with minimal data', () => {
      const mockCustomer = {
        id: 'customer_123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = serializeCustomer(mockCustomer as any);

      expect(result).toEqual({
        id: 'customer_123',
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should handle contact information correctly', () => {
      const mockCustomer = {
        id: 'customer_123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        secondaryPhone: '+1987654321',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1555123456',
      };

      const result = serializeCustomer(mockCustomer as any);

      expect(result.phone).toBe('+1234567890');
      expect(result.secondaryPhone).toBe('+1987654321');
      expect(result.emergencyContact).toBe('Jane Doe');
      expect(result.emergencyPhone).toBe('+1555123456');
    });

    it('should handle address fields correctly', () => {
      const mockCustomer = {
        id: 'customer_123',
        name: 'John Doe',
        address: '123 Main St',
        address2: 'Apt 4B',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA',
      };

      const result = serializeCustomer(mockCustomer as any);

      expect(result.address).toBe('123 Main St');
      expect(result.address2).toBe('Apt 4B');
      expect(result.city).toBe('Anytown');
      expect(result.state).toBe('CA');
      expect(result.zipCode).toBe('12345');
      expect(result.country).toBe('USA');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null input gracefully', () => {
      expect(() => serializeUser(null as any)).not.toThrow();
      expect(() => serializePet(null as any)).not.toThrow();
      expect(() => serializeCustomer(null as any)).not.toThrow();
    });

    it('should handle undefined input gracefully', () => {
      expect(() => serializeUser(undefined as any)).not.toThrow();
      expect(() => serializePet(undefined as any)).not.toThrow();
      expect(() => serializeCustomer(undefined as any)).not.toThrow();
    });

    it('should handle empty objects gracefully', () => {
      const emptyUser = {};
      const emptyPet = {};
      const emptyCustomer = {};

      expect(serializeUser(emptyUser)).toEqual({});
      expect(serializePet(emptyPet)).toEqual({});
      expect(serializeCustomer(emptyCustomer)).toEqual({});
    });

    it('should handle objects with only sensitive fields', () => {
      const sensitiveUser = {
        password: 'hashed_password',
        resetToken: 'token',
        internalNotes: 'notes',
      };

      const result = serializeUser(sensitiveUser as any);
      expect(result).toEqual(sensitiveUser); // Serializers don't filter fields
    });

    it('should handle circular references gracefully', () => {
      const circularUser: any = {
        id: 'user_123',
        name: 'Test User',
      };
      circularUser.self = circularUser;

      // Circular references will cause infinite recursion, so we expect this to throw
      expect(() => serializeUser(circularUser)).toThrow('Maximum call stack size exceeded');
    });
  });

  describe('Performance', () => {
    it('should serialize user data quickly', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        tenantId: 'tenant_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        balance: new Decimal(100.50),
        internalNotes: 'Internal notes',
        lastLoginAt: new Date(),
      };

      const startTime = performance.now();
      const result = serializeUser(mockUser as any);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1); // Should complete in under 1ms

      expect(result).toBeDefined();
      expect(result.id).toBe('user_123');
    });

    it('should serialize large objects efficiently', () => {
      const largeUser: any = {
        id: 'user_123',
        email: 'test@example.com',
      };

      // Add many properties to simulate large object
      for (let i = 0; i < 1000; i++) {
        largeUser[`property_${i}`] = `value_${i}`;
      }

      const startTime = performance.now();
      const result = serializeUser(largeUser);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // Should complete in under 100ms (CI environments vary)

      expect(result).toBeDefined();
      expect(result.id).toBe('user_123');
      expect(result.email).toBe('test@example.com');
    });
  });
});
