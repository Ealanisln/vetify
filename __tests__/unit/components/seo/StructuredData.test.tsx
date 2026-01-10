/**
 * Unit tests for StructuredData component
 * Tests the sanitization of JSON-LD structured data
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render } from '@testing-library/react';
import { StructuredData } from '@/components/seo/StructuredData';
import type { Organization, SoftwareApplication } from '@/lib/seo/structured-data';

// Mock schema types for testing
const validOrganizationSchema: Organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Test Clinic',
  url: 'https://example.com',
};

const validSoftwareSchema: SoftwareApplication = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Test App',
  applicationCategory: 'BusinessApplication',
};

const invalidSchemaWithoutContext = {
  '@type': 'Organization',
  name: 'Invalid Schema',
};

describe('StructuredData Component', () => {
  describe('Single schema rendering', () => {
    it('should render valid schema as JSON-LD script', () => {
      const { container } = render(
        <StructuredData data={validOrganizationSchema as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const content = JSON.parse(script?.innerHTML || '{}');
      expect(content['@context']).toBe('https://schema.org');
      expect(content['@type']).toBe('Organization');
      expect(content.name).toBe('Test Clinic');
    });

    it('should not render schema without @context', () => {
      const { container } = render(
        <StructuredData data={invalidSchemaWithoutContext as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeNull();
    });

    it('should not render null data', () => {
      const { container } = render(
        <StructuredData data={null as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeNull();
    });

    it('should not render undefined data', () => {
      const { container } = render(
        <StructuredData data={undefined as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeNull();
    });
  });

  describe('Array schema rendering', () => {
    it('should render array of valid schemas', () => {
      const schemas = [validOrganizationSchema, validSoftwareSchema];

      const { container } = render(
        <StructuredData data={schemas as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const content = JSON.parse(script?.innerHTML || '[]');
      expect(Array.isArray(content)).toBe(true);
      expect(content).toHaveLength(2);
      expect(content[0]['@type']).toBe('Organization');
      expect(content[1]['@type']).toBe('SoftwareApplication');
    });

    it('should filter out invalid schemas from array', () => {
      const schemas = [
        validOrganizationSchema,
        invalidSchemaWithoutContext, // Should be filtered out
        validSoftwareSchema,
      ];

      const { container } = render(
        <StructuredData data={schemas as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const content = JSON.parse(script?.innerHTML || '[]');
      expect(Array.isArray(content)).toBe(true);
      expect(content).toHaveLength(2); // Only 2 valid schemas
      expect(content[0]['@type']).toBe('Organization');
      expect(content[1]['@type']).toBe('SoftwareApplication');
    });

    it('should filter out null items from array', () => {
      const schemas = [
        validOrganizationSchema,
        null,
        validSoftwareSchema,
      ];

      const { container } = render(
        <StructuredData data={schemas as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const content = JSON.parse(script?.innerHTML || '[]');
      expect(content).toHaveLength(2);
    });

    it('should filter out undefined items from array', () => {
      const schemas = [
        validOrganizationSchema,
        undefined,
        validSoftwareSchema,
      ];

      const { container } = render(
        <StructuredData data={schemas as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const content = JSON.parse(script?.innerHTML || '[]');
      expect(content).toHaveLength(2);
    });

    it('should not render empty array after filtering', () => {
      const schemas = [
        invalidSchemaWithoutContext, // Will be filtered
        null,
        undefined,
      ];

      const { container } = render(
        <StructuredData data={schemas as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeNull();
    });

    it('should not render empty array', () => {
      const { container } = render(
        <StructuredData data={[] as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle schema with special characters in values', () => {
      const schemaWithSpecialChars = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test & Clinic "Special"',
        description: 'A clinic with <special> characters',
      };

      const { container } = render(
        <StructuredData data={schemaWithSpecialChars as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const content = JSON.parse(script?.innerHTML || '{}');
      expect(content.name).toBe('Test & Clinic "Special"');
      expect(content.description).toBe('A clinic with <special> characters');
    });

    it('should handle deeply nested schema objects', () => {
      const nestedSchema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'Test Clinic',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Main St',
          addressLocality: 'City',
        },
      };

      const { container } = render(
        <StructuredData data={nestedSchema as any} />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).toBeTruthy();

      const content = JSON.parse(script?.innerHTML || '{}');
      expect(content.address['@type']).toBe('PostalAddress');
      expect(content.address.streetAddress).toBe('123 Main St');
    });
  });
});
