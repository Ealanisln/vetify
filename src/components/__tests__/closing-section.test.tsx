/**
 * Component tests for ClosingSection
 * Tests human/personal closing message with CTA
 */

import { render, screen } from '@testing-library/react';
import { ClosingSection } from '../closing-section';

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

describe('ClosingSection', () => {
  describe('Rendering', () => {
    it('should render the growth/feedback message', () => {
      render(<ClosingSection />);

      expect(
        screen.getByText(
          'Vetify está en crecimiento y se construye con feedback real de veterinarios.'
        )
      ).toBeInTheDocument();
    });

    it('should render the target audience message', () => {
      render(<ClosingSection />);

      expect(
        screen.getByText(
          'Si tienes una clínica pequeña y buscas algo sencillo que funcione, probablemente Vetify es para ti.'
        )
      ).toBeInTheDocument();
    });

    it('should render CTA button with correct text', () => {
      render(<ClosingSection />);

      expect(
        screen.getByRole('button', { name: 'Crear cuenta gratis' })
      ).toBeInTheDocument();
    });

    it('should link CTA to registration page', () => {
      render(<ClosingSection />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/api/auth/register');
    });
  });

  describe('Styling', () => {
    it('should render as a section element', () => {
      const { container } = render(<ClosingSection />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should be centered with max-width', () => {
      const { container } = render(<ClosingSection />);

      const content = container.querySelector('.max-w-2xl');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('text-center');
    });

    it('should have large button size', () => {
      render(<ClosingSection />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-size', 'lg');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible link', () => {
      render(<ClosingSection />);

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should have accessible button', () => {
      render(<ClosingSection />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Crear cuenta gratis');
    });
  });
});
