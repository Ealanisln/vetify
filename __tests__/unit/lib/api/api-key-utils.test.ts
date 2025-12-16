/**
 * Tests for API Key Utilities
 */

import {
  API_KEY_PREFIX,
  API_SCOPES,
  SCOPE_BUNDLES,
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
  extractKeyPrefix,
  hasScope,
  hasAnyScope,
  hasAllScopes,
  validateScopes,
  getScopeDescription,
  parseScopeString,
  formatScopes,
  ApiScope,
} from '@/lib/api/api-key-utils';

describe('API Key Utilities', () => {
  describe('generateApiKey', () => {
    it('should generate a key with correct format', () => {
      const { fullKey, keyPrefix, keyHash } = generateApiKey();

      expect(fullKey).toMatch(/^vfy_[a-f0-9]{8}_[a-f0-9]{32}$/);
      expect(keyPrefix).toMatch(/^vfy_[a-f0-9]{8}$/);
      expect(keyHash).toHaveLength(64); // SHA-256 hex
    });

    it('should generate unique keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();

      expect(key1.fullKey).not.toBe(key2.fullKey);
      expect(key1.keyHash).not.toBe(key2.keyHash);
    });

    it('should generate consistent hash for the same key', () => {
      const { fullKey, keyHash } = generateApiKey();
      const rehash = hashApiKey(fullKey);

      expect(rehash).toBe(keyHash);
    });
  });

  describe('hashApiKey', () => {
    it('should produce consistent hashes', () => {
      const key = 'vfy_12345678_abcdef1234567890abcdef1234567890';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different keys', () => {
      const key1 = 'vfy_12345678_abcdef1234567890abcdef1234567890';
      const key2 = 'vfy_87654321_0987654321fedcba0987654321fedcba';

      expect(hashApiKey(key1)).not.toBe(hashApiKey(key2));
    });

    it('should produce 64-character hex hash', () => {
      const hash = hashApiKey('test-key');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('isValidApiKeyFormat', () => {
    it('should validate correct format', () => {
      expect(isValidApiKeyFormat('vfy_12345678_abcdef1234567890abcdef1234567890')).toBe(true);
      expect(isValidApiKeyFormat('vfy_abcdef12_1234567890abcdef1234567890abcdef')).toBe(true);
    });

    it('should reject invalid formats', () => {
      // Wrong prefix
      expect(isValidApiKeyFormat('api_12345678_abcdef1234567890abcdef1234567890')).toBe(false);

      // Wrong prefix length
      expect(isValidApiKeyFormat('vfy_1234567_abcdef1234567890abcdef1234567890')).toBe(false);

      // Wrong secret length
      expect(isValidApiKeyFormat('vfy_12345678_abcdef1234567890abcdef12345678')).toBe(false);

      // Invalid characters
      expect(isValidApiKeyFormat('vfy_1234567g_abcdef1234567890abcdef1234567890')).toBe(false);

      // Missing underscore
      expect(isValidApiKeyFormat('vfy12345678_abcdef1234567890abcdef1234567890')).toBe(false);

      // Empty string
      expect(isValidApiKeyFormat('')).toBe(false);
    });
  });

  describe('extractKeyPrefix', () => {
    it('should extract prefix from valid key', () => {
      const key = 'vfy_12345678_abcdef1234567890abcdef1234567890';
      expect(extractKeyPrefix(key)).toBe('vfy_12345678');
    });

    it('should return null for invalid key', () => {
      expect(extractKeyPrefix('invalid_key')).toBeNull();
      expect(extractKeyPrefix('')).toBeNull();
    });
  });

  describe('hasScope', () => {
    it('should return true when scope exists', () => {
      const scopes = ['read:pets', 'write:pets', 'read:appointments'];
      expect(hasScope(scopes, 'read:pets')).toBe(true);
      expect(hasScope(scopes, 'write:pets')).toBe(true);
    });

    it('should return false when scope does not exist', () => {
      const scopes = ['read:pets'];
      expect(hasScope(scopes, 'write:pets')).toBe(false);
    });

    it('should handle empty scopes array', () => {
      expect(hasScope([], 'read:pets')).toBe(false);
    });
  });

  describe('hasAnyScope', () => {
    it('should return true if any scope matches', () => {
      const scopes = ['read:pets', 'read:appointments'];
      expect(hasAnyScope(scopes, ['write:pets', 'read:pets'])).toBe(true);
    });

    it('should return false if no scopes match', () => {
      const scopes = ['read:pets'];
      expect(hasAnyScope(scopes, ['write:pets', 'write:appointments'])).toBe(false);
    });

    it('should handle empty arrays', () => {
      expect(hasAnyScope([], ['read:pets'])).toBe(false);
      expect(hasAnyScope(['read:pets'], [])).toBe(false);
    });
  });

  describe('hasAllScopes', () => {
    it('should return true if all scopes match', () => {
      const scopes = ['read:pets', 'write:pets', 'read:appointments'];
      expect(hasAllScopes(scopes, ['read:pets', 'write:pets'])).toBe(true);
    });

    it('should return false if not all scopes match', () => {
      const scopes = ['read:pets'];
      expect(hasAllScopes(scopes, ['read:pets', 'write:pets'])).toBe(false);
    });

    it('should handle empty required scopes', () => {
      expect(hasAllScopes(['read:pets'], [])).toBe(true);
    });
  });

  describe('validateScopes', () => {
    it('should identify valid scopes', () => {
      const { valid, invalid } = validateScopes(['read:pets', 'write:pets']);
      expect(valid).toEqual(['read:pets', 'write:pets']);
      expect(invalid).toEqual([]);
    });

    it('should identify invalid scopes', () => {
      const { valid, invalid } = validateScopes(['read:pets', 'invalid:scope', 'write:pets']);
      expect(valid).toEqual(['read:pets', 'write:pets']);
      expect(invalid).toEqual(['invalid:scope']);
    });

    it('should handle empty array', () => {
      const { valid, invalid } = validateScopes([]);
      expect(valid).toEqual([]);
      expect(invalid).toEqual([]);
    });
  });

  describe('getScopeDescription', () => {
    it('should return description for valid scope', () => {
      expect(getScopeDescription('read:pets')).toBe('Read pet information');
      expect(getScopeDescription('write:appointments')).toBe('Create and update appointments');
    });

    it('should return undefined for invalid scope', () => {
      expect(getScopeDescription('invalid:scope')).toBeUndefined();
    });
  });

  describe('parseScopeString', () => {
    it('should parse comma-separated scopes', () => {
      expect(parseScopeString('read:pets, write:pets, read:appointments')).toEqual([
        'read:pets',
        'write:pets',
        'read:appointments',
      ]);
    });

    it('should handle extra whitespace', () => {
      expect(parseScopeString('  read:pets ,  write:pets  ')).toEqual(['read:pets', 'write:pets']);
    });

    it('should handle empty string', () => {
      expect(parseScopeString('')).toEqual([]);
    });
  });

  describe('formatScopes', () => {
    it('should format scopes as comma-separated string', () => {
      expect(formatScopes(['read:pets', 'write:pets'])).toBe('read:pets, write:pets');
    });

    it('should handle single scope', () => {
      expect(formatScopes(['read:pets'])).toBe('read:pets');
    });

    it('should handle empty array', () => {
      expect(formatScopes([])).toBe('');
    });
  });

  describe('API_SCOPES', () => {
    it('should contain all expected scopes', () => {
      const expectedScopes = [
        'read:pets',
        'write:pets',
        'read:appointments',
        'write:appointments',
        'read:customers',
        'write:customers',
        'read:inventory',
        'write:inventory',
        'read:locations',
        'read:reports',
        'read:sales',
        'write:sales',
      ];

      expectedScopes.forEach((scope) => {
        expect(API_SCOPES).toHaveProperty(scope);
      });
    });
  });

  describe('SCOPE_BUNDLES', () => {
    it('should have readonly bundle with only read scopes', () => {
      SCOPE_BUNDLES.readonly.forEach((scope) => {
        expect(scope).toMatch(/^read:/);
      });
    });

    it('should have full bundle with all scopes', () => {
      expect(SCOPE_BUNDLES.full.length).toBe(Object.keys(API_SCOPES).length);
    });
  });

  describe('API_KEY_PREFIX', () => {
    it('should be vfy_', () => {
      expect(API_KEY_PREFIX).toBe('vfy_');
    });
  });
});
