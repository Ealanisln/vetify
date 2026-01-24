/**
 * Tests for Webhook Signature Utilities
 */

import {
  generateWebhookSecret,
  signPayload,
  verifySignature,
  extractSignatureHash,
  isValidWebhookSecret,
} from '@/lib/webhooks/webhook-signature';

describe('Webhook Signature Utilities', () => {
  describe('generateWebhookSecret', () => {
    it('should generate secret with correct prefix', () => {
      const secret = generateWebhookSecret();
      expect(secret).toMatch(/^whsec_/);
    });

    it('should generate secret with correct length', () => {
      const secret = generateWebhookSecret();
      // whsec_ (6 chars) + 48 hex chars = 54 total
      expect(secret.length).toBe(54);
    });

    it('should generate unique secrets', () => {
      const secret1 = generateWebhookSecret();
      const secret2 = generateWebhookSecret();
      const secret3 = generateWebhookSecret();

      expect(secret1).not.toBe(secret2);
      expect(secret2).not.toBe(secret3);
      expect(secret1).not.toBe(secret3);
    });

    it('should generate hex characters after prefix', () => {
      const secret = generateWebhookSecret();
      const hexPart = secret.slice(6);
      expect(hexPart).toMatch(/^[a-f0-9]{48}$/);
    });
  });

  describe('signPayload', () => {
    const testPayload = '{"event":"pet.created","data":{"id":"123"}}';
    const testSecret = 'whsec_000000000000000000000000000000000000000000000003';
    const testTimestamp = 1704067200; // 2024-01-01 00:00:00 UTC

    it('should produce signature with sha256= prefix', () => {
      const signature = signPayload(testPayload, testSecret, testTimestamp);
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it('should produce consistent signatures', () => {
      const sig1 = signPayload(testPayload, testSecret, testTimestamp);
      const sig2 = signPayload(testPayload, testSecret, testTimestamp);
      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different payloads', () => {
      const payload1 = '{"event":"pet.created"}';
      const payload2 = '{"event":"pet.updated"}';

      const sig1 = signPayload(payload1, testSecret, testTimestamp);
      const sig2 = signPayload(payload2, testSecret, testTimestamp);

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const secret1 = 'whsec_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const secret2 = 'whsec_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

      const sig1 = signPayload(testPayload, secret1, testTimestamp);
      const sig2 = signPayload(testPayload, secret2, testTimestamp);

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different signatures for different timestamps', () => {
      const sig1 = signPayload(testPayload, testSecret, testTimestamp);
      const sig2 = signPayload(testPayload, testSecret, testTimestamp + 1);

      expect(sig1).not.toBe(sig2);
    });

    it('should work with secret without prefix', () => {
      const secretWithPrefix = 'whsec_000000000000000000000000000000000000000000000004';
      const secretWithoutPrefix = '000000000000000000000000000000000000000000000004';

      const sig1 = signPayload(testPayload, secretWithPrefix, testTimestamp);
      const sig2 = signPayload(testPayload, secretWithoutPrefix, testTimestamp);

      expect(sig1).toBe(sig2);
    });
  });

  describe('verifySignature', () => {
    const testPayload = '{"event":"pet.created","data":{"id":"123"}}';
    const testSecret = 'whsec_000000000000000000000000000000000000000000000003';

    it('should verify valid signature', () => {
      const now = Math.floor(Date.now() / 1000);
      const signature = signPayload(testPayload, testSecret, now);

      const isValid = verifySignature(testPayload, signature, testSecret, now);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const now = Math.floor(Date.now() / 1000);
      const invalidSignature = 'sha256=0000000000000000000000000000000000000000000000000000000000000000';

      const isValid = verifySignature(testPayload, invalidSignature, testSecret, now);
      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const now = Math.floor(Date.now() / 1000);
      const signature = signPayload(testPayload, testSecret, now);
      const wrongSecret = 'whsec_000000000000000000000000000000000000000000000005';

      const isValid = verifySignature(testPayload, signature, wrongSecret, now);
      expect(isValid).toBe(false);
    });

    it('should reject expired timestamp (too old)', () => {
      const now = Math.floor(Date.now() / 1000);
      const oldTimestamp = now - 400; // 6+ minutes ago (default tolerance is 5 minutes)
      const signature = signPayload(testPayload, testSecret, oldTimestamp);

      const isValid = verifySignature(testPayload, signature, testSecret, oldTimestamp);
      expect(isValid).toBe(false);
    });

    it('should reject future timestamp', () => {
      const now = Math.floor(Date.now() / 1000);
      const futureTimestamp = now + 400; // 6+ minutes in the future
      const signature = signPayload(testPayload, testSecret, futureTimestamp);

      const isValid = verifySignature(testPayload, signature, testSecret, futureTimestamp);
      expect(isValid).toBe(false);
    });

    it('should accept timestamp within tolerance', () => {
      const now = Math.floor(Date.now() / 1000);
      const recentTimestamp = now - 60; // 1 minute ago (within 5 minute tolerance)
      const signature = signPayload(testPayload, testSecret, recentTimestamp);

      const isValid = verifySignature(testPayload, signature, testSecret, recentTimestamp);
      expect(isValid).toBe(true);
    });

    it('should work with custom tolerance', () => {
      const now = Math.floor(Date.now() / 1000);
      const timestamp = now - 120; // 2 minutes ago
      const signature = signPayload(testPayload, testSecret, timestamp);

      // Should fail with 60 second tolerance
      expect(verifySignature(testPayload, signature, testSecret, timestamp, 60)).toBe(false);

      // Should pass with 300 second tolerance
      expect(verifySignature(testPayload, signature, testSecret, timestamp, 300)).toBe(true);
    });

    it('should reject tampered payload', () => {
      const now = Math.floor(Date.now() / 1000);
      const signature = signPayload(testPayload, testSecret, now);
      const tamperedPayload = '{"event":"pet.created","data":{"id":"999"}}';

      const isValid = verifySignature(tamperedPayload, signature, testSecret, now);
      expect(isValid).toBe(false);
    });
  });

  describe('extractSignatureHash', () => {
    it('should extract hash from valid signature', () => {
      const hash = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const signature = `sha256=${hash}`;

      expect(extractSignatureHash(signature)).toBe(hash);
    });

    it('should return null for invalid format', () => {
      expect(extractSignatureHash('invalid_signature')).toBeNull();
      expect(extractSignatureHash('md5=abc123')).toBeNull();
      expect(extractSignatureHash('')).toBeNull();
      expect(extractSignatureHash('sha256')).toBeNull();
    });
  });

  describe('isValidWebhookSecret', () => {
    it('should validate correct format', () => {
      expect(isValidWebhookSecret('whsec_000000000000000000000000000000000000000000000003')).toBe(true);
      expect(isValidWebhookSecret('whsec_000000000000000000000000000000000000000000000006')).toBe(true);
    });

    it('should reject wrong prefix', () => {
      expect(isValidWebhookSecret('secret_1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(false);
      expect(isValidWebhookSecret('wh_1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(false);
    });

    it('should reject wrong length', () => {
      expect(isValidWebhookSecret('whsec_123456')).toBe(false);
      expect(isValidWebhookSecret('whsec_000000000000000000000000000000000000000000000003AB')).toBe(false);
    });

    it('should reject invalid hex characters', () => {
      expect(isValidWebhookSecret('whsec_ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ')).toBe(false);
      expect(isValidWebhookSecret('whsec_1234567890abcdef1234567890abcdef1234567890abcdeg')).toBe(false);
    });

    it('should validate secrets generated by generateWebhookSecret', () => {
      const secret = generateWebhookSecret();
      expect(isValidWebhookSecret(secret)).toBe(true);
    });
  });
});
