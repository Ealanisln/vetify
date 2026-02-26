/**
 * Component tests for CTASection
 * Tests simplified CTA (no "Agendar demo")
 */

import { render, screen } from '@testing-library/react';
import { CTASection } from '../cta-section';

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    size,
    className,
  }: {
    children: React.ReactNode;
    size?: string;
    className?: string;
  }) => (
    <button className={className} data-size={size}>
      {children}
    </button>
  ),
}));

describe('CTASection', () => {
  describe('Rendering', () => {
    it('should render the section header', () => {
      render(<CTASection />);

      expect(
        screen.getByText('Prueba gratis, sin compromiso')
      ).toBeInTheDocument();
    });

    it('should render the subheader', () => {
      render(<CTASection />);

      expect(
        screen.getByText('30 días para probarlo. Sin tarjeta de crédito.')
      ).toBeInTheDocument();
    });

    it('should render CTA button with correct text', () => {
      render(<CTASection />);

      expect(
        screen.getByRole('button', { name: 'Empieza tu prueba gratis' })
      ).toBeInTheDocument();
    });

    it('should link CTA to registration page', () => {
      render(<CTASection />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/api/auth/register');
    });

    it('should NOT render "Agendar demo" button', () => {
      render(<CTASection />);

      expect(screen.queryByText('Agendar demo')).not.toBeInTheDocument();
    });

    it('should only have one CTA button', () => {
      render(<CTASection />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1);
    });
  });

  describe('Styling', () => {
    it('should render as a section element', () => {
      const { container } = render(<CTASection />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should have proper dark mode border classes on card', () => {
      const { container } = render(<CTASection />);

      const card = container.querySelector('.rounded-2xl');
      expect(card).toHaveClass('border-gray-200');
      expect(card).toHaveClass('dark:border-gray-700');
    });

    it('should have gradient background', () => {
      const { container } = render(<CTASection />);

      const card = container.querySelector('.rounded-2xl');
      expect(card).toHaveClass('bg-gradient-to-br');
    });

    it('should be centered with max-width', () => {
      const { container } = render(<CTASection />);

      const card = container.querySelector('.max-w-3xl');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('text-center');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<CTASection />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Prueba gratis, sin compromiso');
    });

    it('should have accessible button', () => {
      render(<CTASection />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Empieza tu prueba gratis');
    });
  });
});
