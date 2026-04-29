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

const getJsonLdScripts = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('script[type="application/ld+json"]'));

describe('StructuredData Component', () => {
  describe('Single schema rendering', () => {
    it('should render valid schema as JSON-LD script', () => {
      const { container } = render(
        <StructuredData data={validOrganizationSchema as any} />
      );

      const scripts = getJsonLdScripts(container);
      expect(scripts).toHaveLength(1);

      const content = JSON.parse(scripts[0].innerHTML || '{}');
      expect(content['@context']).toBe('https://schema.org');
      expect(content['@type']).toBe('Organization');
      expect(content.name).toBe('Test Clinic');
    });

    it('should not render schema without @context', () => {
      const { container } = render(
        <StructuredData data={invalidSchemaWithoutContext as any} />
      );
      expect(getJsonLdScripts(container)).toHaveLength(0);
    });

    it('should not render null data', () => {
      const { container } = render(<StructuredData data={null as any} />);
      expect(getJsonLdScripts(container)).toHaveLength(0);
    });

    it('should not render undefined data', () => {
      const { container } = render(<StructuredData data={undefined as any} />);
      expect(getJsonLdScripts(container)).toHaveLength(0);
    });
  });

  describe('Array schema rendering', () => {
    it('should render one <script> per schema (not a single array script)', () => {
      const schemas = [validOrganizationSchema, validSoftwareSchema];
      const { container } = render(<StructuredData data={schemas as any} />);

      const scripts = getJsonLdScripts(container);
      expect(scripts).toHaveLength(2);

      const first = JSON.parse(scripts[0].innerHTML);
      const second = JSON.parse(scripts[1].innerHTML);
      expect(Array.isArray(first)).toBe(false);
      expect(first['@type']).toBe('Organization');
      expect(second['@type']).toBe('SoftwareApplication');
    });

    it('should filter out invalid schemas from array', () => {
      const schemas = [
        validOrganizationSchema,
        invalidSchemaWithoutContext,
        validSoftwareSchema,
      ];
      const { container } = render(<StructuredData data={schemas as any} />);

      const scripts = getJsonLdScripts(container);
      expect(scripts).toHaveLength(2);
      expect(JSON.parse(scripts[0].innerHTML)['@type']).toBe('Organization');
      expect(JSON.parse(scripts[1].innerHTML)['@type']).toBe('SoftwareApplication');
    });

    it('should filter out null items from array', () => {
      const schemas = [validOrganizationSchema, null, validSoftwareSchema];
      const { container } = render(<StructuredData data={schemas as any} />);
      expect(getJsonLdScripts(container)).toHaveLength(2);
    });

    it('should filter out undefined items from array', () => {
      const schemas = [validOrganizationSchema, undefined, validSoftwareSchema];
      const { container } = render(<StructuredData data={schemas as any} />);
      expect(getJsonLdScripts(container)).toHaveLength(2);
    });

    it('should not render empty array after filtering', () => {
      const schemas = [invalidSchemaWithoutContext, null, undefined];
      const { container } = render(<StructuredData data={schemas as any} />);
      expect(getJsonLdScripts(container)).toHaveLength(0);
    });

    it('should not render empty array', () => {
      const { container } = render(<StructuredData data={[] as any} />);
      expect(getJsonLdScripts(container)).toHaveLength(0);
    });

    it('every emitted <script> parses to an object whose @context is a string (regression VETIFY-NEXTJS-1K)', () => {
      const { container } = render(
        <StructuredData data={[validOrganizationSchema, validSoftwareSchema] as any} />
      );
      const scripts = getJsonLdScripts(container);
      expect(scripts.length).toBeGreaterThan(0);
      for (const script of scripts) {
        const parsed = JSON.parse(script.textContent || '');
        expect(Array.isArray(parsed)).toBe(false);
        expect(typeof parsed['@context']).toBe('string');
        // Simulate Umami's call: parsed["@context"].toLowerCase()
        expect(() => parsed['@context'].toLowerCase()).not.toThrow();
      }
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

      const scripts = getJsonLdScripts(container);
      expect(scripts).toHaveLength(1);

      const content = JSON.parse(scripts[0].innerHTML);
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

      const { container } = render(<StructuredData data={nestedSchema as any} />);
      const scripts = getJsonLdScripts(container);
      expect(scripts).toHaveLength(1);

      const content = JSON.parse(scripts[0].innerHTML);
      expect(content.address['@type']).toBe('PostalAddress');
      expect(content.address.streetAddress).toBe('123 Main St');
    });
  });
});
