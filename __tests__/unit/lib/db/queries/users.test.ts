/**
 * Tests for users.ts query functions
 * VETIF-168: Performance optimization tests
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';

// Import the pure function directly for testing
import { userDataNeedsUpdate } from '@/lib/db/queries/users';

describe('userDataNeedsUpdate', () => {
  describe('Performance: Detect when updates are needed', () => {
    it('should return false when no data has changed', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isActive: true,
      };

      const newData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(false);
    });

    it('should return true when email has changed', () => {
      const existingUser = {
        email: 'old@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isActive: true,
      };

      const newData = {
        email: 'new@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(true);
    });

    it('should return true when firstName has changed', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isActive: true,
      };

      const newData = {
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        name: 'Jane Doe',
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(true);
    });

    it('should return true when lastName has changed', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isActive: true,
      };

      const newData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Smith',
        name: 'John Smith',
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(true);
    });

    it('should return true when isActive is false (needs reactivation)', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isActive: false, // User is deactivated
      };

      const newData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(true);
    });

    it('should handle computed name comparison when name is not provided', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe', // Computed from firstName + lastName
        isActive: true,
      };

      const newData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        // No explicit name provided - should compute to 'John Doe'
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(false);
    });

    it('should return true when stored name differs from computed name', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'Old Name', // Different from what would be computed
        isActive: true,
      };

      const newData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        // Computed name will be 'John Doe', different from 'Old Name'
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(true);
    });

    it('should use email username as name fallback when firstName/lastName are empty', () => {
      const existingUser = {
        email: 'testuser@example.com',
        firstName: null,
        lastName: null,
        name: 'testuser', // From email
        isActive: true,
      };

      const newData = {
        email: 'testuser@example.com',
        firstName: null,
        lastName: null,
        // Name should compute to 'testuser' from email
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(false);
    });

    it('should return true when firstName changes from null to value', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        name: 'test',
        isActive: true,
      };

      const newData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: null,
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(true);
    });

    it('should return true when firstName changes from value to null', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isActive: true,
      };

      const newData = {
        email: 'test@example.com',
        firstName: null,
        lastName: 'Doe',
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(true);
    });

    it('should treat undefined firstName same as null', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        name: 'test',
        isActive: true,
      };

      const newData = {
        email: 'test@example.com',
        // firstName is undefined (not provided)
        lastName: undefined,
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should detect change when firstName changes from null to empty string', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: null,
        lastName: null,
        name: 'test',
        isActive: true,
      };

      const newData = {
        email: 'test@example.com',
        firstName: '',  // Empty string is different from null
        lastName: '',
      };

      // Empty strings are treated as provided values, different from null
      // This is a valid data change that should trigger an update
      expect(userDataNeedsUpdate(existingUser, newData)).toBe(true);
    });

    it('should handle whitespace in name computation', () => {
      const existingUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: null,
        name: 'John', // Just firstName with no trailing space
        isActive: true,
      };

      const newData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: null,
        // Computed: 'John ' + '' = 'John ' -> trimmed to 'John'
      };

      expect(userDataNeedsUpdate(existingUser, newData)).toBe(false);
    });
  });
});
