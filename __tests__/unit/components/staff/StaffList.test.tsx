/**
 * Unit Tests for StaffList Component - Access Status Styling
 *
 * Tests that the access status container has w-fit class to prevent full-width expansion
 * This is a code structure verification test since the component has complex dependencies
 */

import * as fs from 'fs';
import * as path from 'path';

describe('StaffList Component - Access Status Styling', () => {
  const componentPath = path.join(process.cwd(), 'src/components/staff/StaffList.tsx');

  describe('w-fit class on access status container', () => {
    it('should have w-fit class on access status container div', () => {
      const componentSource = fs.readFileSync(componentPath, 'utf-8');

      // Verify the access status container has w-fit class
      // The pattern we're looking for: <div className="mt-3 w-fit">
      expect(componentSource).toContain('className="mt-3 w-fit"');
    });

    it('should have Access Status comment before the w-fit container', () => {
      const componentSource = fs.readFileSync(componentPath, 'utf-8');

      // Verify the comment exists
      expect(componentSource).toContain('{/* Access Status */}');
    });

    it('should call renderAccessStatus inside the w-fit container', () => {
      const componentSource = fs.readFileSync(componentPath, 'utf-8');

      // Find the pattern: w-fit container with renderAccessStatus
      const wFitPattern = /className="mt-3 w-fit"[^>]*>\s*\{renderAccessStatus/;
      expect(componentSource).toMatch(wFitPattern);
    });

    it('should NOT have w-full class on access status container', () => {
      const componentSource = fs.readFileSync(componentPath, 'utf-8');

      // The access status container should not have w-full
      // Extract the access status section
      const accessStatusMatch = componentSource.match(/\{\/\* Access Status \*\/\}[\s\S]*?renderAccessStatus/);

      if (accessStatusMatch) {
        expect(accessStatusMatch[0]).not.toContain('w-full');
      }
    });
  });

  describe('renderAccessStatus function', () => {
    it('should return Badge component for active access', () => {
      const componentSource = fs.readFileSync(componentPath, 'utf-8');

      // Verify the function returns a Badge with "Acceso activo" text
      expect(componentSource).toContain('Acceso activo');
    });

    it('should have CheckCircleIcon for active access badge', () => {
      const componentSource = fs.readFileSync(componentPath, 'utf-8');

      // The active access badge should have the check icon
      expect(componentSource).toContain('CheckCircleIcon');
    });

    it('should have green styling for active access badge', () => {
      const componentSource = fs.readFileSync(componentPath, 'utf-8');

      // The badge should have green background styling
      expect(componentSource).toContain('bg-green-100');
      expect(componentSource).toContain('text-green-800');
    });
  });
});
