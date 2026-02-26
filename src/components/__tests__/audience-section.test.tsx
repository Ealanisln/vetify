/**
 * Component tests for AudienceSection
 * Tests "¿Para quién es Vetify?" section targeting small clinics
 */

import { render, screen } from '@testing-library/react';
import { AudienceSection } from '../audience-section';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon-check">Check</span>,
}));

describe('AudienceSection', () => {
  describe('Rendering', () => {
    it('should render the section header', () => {
      render(<AudienceSection />);

      expect(screen.getByText('¿Para quién es Vetify?')).toBeInTheDocument();
    });

    it('should render the intro text', () => {
      render(<AudienceSection />);

      expect(screen.getByText('Vetify es ideal si:')).toBeInTheDocument();
    });

    it('should render all four qualifying criteria', () => {
      render(<AudienceSection />);

      expect(
        screen.getByText('Tienes una veterinaria pequeña o familiar')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Atiendes tú mismo o con 1-2 doctores más')
      ).toBeInTheDocument();
      expect(
        screen.getByText('No quieres sistemas complicados ni caros')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Buscas algo práctico que realmente uses todos los días')
      ).toBeInTheDocument();
    });

    it('should render the closing statement', () => {
      render(<AudienceSection />);

      expect(
        screen.getByText(
          /No es un sistema corporativo. Es una herramienta hecha para el día a día/i
        )
      ).toBeInTheDocument();
    });

    it('should render check icons for each criterion', () => {
      render(<AudienceSection />);

      const checkIcons = screen.getAllByTestId('icon-check');
      expect(checkIcons.length).toBe(4);
    });
  });

  describe('Styling', () => {
    it('should render as a section element', () => {
      const { container } = render(<AudienceSection />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should have background styling', () => {
      const { container } = render(<AudienceSection />);

      const section = container.querySelector('section');
      expect(section).toHaveClass('bg-secondary/30');
    });

    it('should have proper dark mode border classes on card', () => {
      const { container } = render(<AudienceSection />);

      const card = container.querySelector('.rounded-2xl');
      expect(card).toHaveClass('border-gray-200');
      expect(card).toHaveClass('dark:border-gray-700');
    });

    it('should have dark mode border on divider', () => {
      const { container } = render(<AudienceSection />);

      const divider = container.querySelector('.border-t');
      expect(divider).toHaveClass('border-gray-200');
      expect(divider).toHaveClass('dark:border-gray-700');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<AudienceSection />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('¿Para quién es Vetify?');
    });

    it('should render criteria as a list', () => {
      render(<AudienceSection />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(4);
    });
  });
});
