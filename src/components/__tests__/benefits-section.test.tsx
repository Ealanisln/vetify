/**
 * Component tests for BenefitsSection
 * Tests qualitative benefits (not stats) for small veterinary clinics
 */

import { render, screen } from '@testing-library/react';
import { BenefitsSection } from '../benefits-section';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Clock: () => <span data-testid="icon-clock">Clock</span>,
  CalendarCheck: () => <span data-testid="icon-calendar-check">CalendarCheck</span>,
  FolderOpen: () => <span data-testid="icon-folder-open">FolderOpen</span>,
  Smile: () => <span data-testid="icon-smile">Smile</span>,
}));

describe('BenefitsSection', () => {
  describe('Rendering', () => {
    it('should render the section header', () => {
      render(<BenefitsSection />);

      expect(
        screen.getByText('Beneficios reales para tu clínica')
      ).toBeInTheDocument();
    });

    it('should render all four benefit titles', () => {
      render(<BenefitsSection />);

      expect(screen.getByText('Menos administración, más atención')).toBeInTheDocument();
      expect(screen.getByText('No más citas perdidas')).toBeInTheDocument();
      expect(screen.getByText('Información siempre a la mano')).toBeInTheDocument();
      expect(screen.getByText('Empieza fácil')).toBeInTheDocument();
    });

    it('should render all benefit descriptions', () => {
      render(<BenefitsSection />);

      expect(
        screen.getByText('Dedica tu tiempo a lo que importa: tus pacientes y clientes.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Recordatorios automáticos para ti y para tus clientes.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Accede al historial de cualquier paciente en segundos.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Si sabes usar WhatsApp, puedes usar Vetify.')
      ).toBeInTheDocument();
    });

    it('should render all icons', () => {
      render(<BenefitsSection />);

      expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
      expect(screen.getByTestId('icon-calendar-check')).toBeInTheDocument();
      expect(screen.getByTestId('icon-folder-open')).toBeInTheDocument();
      expect(screen.getByTestId('icon-smile')).toBeInTheDocument();
    });

    it('should NOT render percentage stats (qualitative only)', () => {
      render(<BenefitsSection />);

      // These old stats should NOT be present
      expect(screen.queryByText('-30%')).not.toBeInTheDocument();
      expect(screen.queryByText('+20%')).not.toBeInTheDocument();
      expect(screen.queryByText('95%')).not.toBeInTheDocument();
      expect(screen.queryByText('+40%')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should render as a section element', () => {
      const { container } = render(<BenefitsSection />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should have proper dark mode border classes on cards', () => {
      const { container } = render(<BenefitsSection />);

      const benefitCards = container.querySelectorAll('.border-gray-200');
      expect(benefitCards.length).toBe(4); // 4 benefit cards

      benefitCards.forEach((card) => {
        expect(card).toHaveClass('dark:border-gray-700');
      });
    });

    it('should have grid layout', () => {
      const { container } = render(<BenefitsSection />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('lg:grid-cols-4');
    });

    it('should have centered text in cards', () => {
      const { container } = render(<BenefitsSection />);

      const cards = container.querySelectorAll('.rounded-xl');
      cards.forEach((card) => {
        expect(card).toHaveClass('text-center');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<BenefitsSection />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Beneficios reales para tu clínica');
    });

    it('should have h3 headings for each benefit', () => {
      render(<BenefitsSection />);

      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s.length).toBe(4);
    });
  });
});
