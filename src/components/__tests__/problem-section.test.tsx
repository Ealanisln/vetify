/**
 * Component tests for ProblemSection
 * Tests pain points rendering for small veterinary clinics
 */

import { render, screen } from '@testing-library/react';
import { ProblemSection } from '../problem-section';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  FileSpreadsheet: () => <span data-testid="icon-file-spreadsheet">FileSpreadsheet</span>,
  MessageCircle: () => <span data-testid="icon-message-circle">MessageCircle</span>,
  Bell: () => <span data-testid="icon-bell">Bell</span>,
  Clock: () => <span data-testid="icon-clock">Clock</span>,
}));

describe('ProblemSection', () => {
  describe('Rendering', () => {
    it('should render the section header', () => {
      render(<ProblemSection />);

      expect(
        screen.getByText('Si tienes una veterinaria pequeña, probablemente...')
      ).toBeInTheDocument();
    });

    it('should render all four pain points', () => {
      render(<ProblemSection />);

      expect(
        screen.getByText('Llevas pacientes y citas en Excel o libretas')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Usas WhatsApp para todo (y se te pierden mensajes)')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Olvidas citas o recordatorios importantes')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Pierdes tiempo administrativo que podrías usar atendiendo')
      ).toBeInTheDocument();
    });

    it('should render the empathetic closing message', () => {
      render(<ProblemSection />);

      expect(
        screen.getByText(
          /Esto no es falta de ganas. Es falta de una herramienta hecha para clínicas pequeñas/i
        )
      ).toBeInTheDocument();
    });

    it('should render all icons', () => {
      render(<ProblemSection />);

      expect(screen.getByTestId('icon-file-spreadsheet')).toBeInTheDocument();
      expect(screen.getByTestId('icon-message-circle')).toBeInTheDocument();
      expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
      expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should render as a section element', () => {
      const { container } = render(<ProblemSection />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should have proper dark mode border classes', () => {
      const { container } = render(<ProblemSection />);

      // Check for dark mode border classes on problem cards
      const problemCards = container.querySelectorAll('.border-gray-200');
      expect(problemCards.length).toBeGreaterThan(0);

      // Each card should have dark mode variant
      problemCards.forEach((card) => {
        expect(card).toHaveClass('dark:border-gray-700');
      });
    });

    it('should have background styling for section', () => {
      const { container } = render(<ProblemSection />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-secondary/30');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ProblemSection />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Si tienes una veterinaria pequeña, probablemente...');
    });
  });
});
