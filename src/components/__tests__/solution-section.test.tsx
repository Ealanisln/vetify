/**
 * Component tests for SolutionSection
 * Tests simplified feature grid for small veterinary clinics
 */

import { render, screen } from '@testing-library/react';
import { SolutionSection } from '../solution-section';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  PawPrint: () => <span data-testid="icon-paw-print">PawPrint</span>,
  Calendar: () => <span data-testid="icon-calendar">Calendar</span>,
  Bell: () => <span data-testid="icon-bell">Bell</span>,
  FileText: () => <span data-testid="icon-file-text">FileText</span>,
  Package: () => <span data-testid="icon-package">Package</span>,
  Smartphone: () => <span data-testid="icon-smartphone">Smartphone</span>,
}));

describe('SolutionSection', () => {
  describe('Rendering', () => {
    it('should render the section header', () => {
      render(<SolutionSection />);

      expect(screen.getByText('Todo en un solo lugar')).toBeInTheDocument();
    });

    it('should render the section subheader', () => {
      render(<SolutionSection />);

      expect(
        screen.getByText('Las herramientas esenciales para tu día a día, sin complicaciones.')
      ).toBeInTheDocument();
    });

    it('should render all six features', () => {
      render(<SolutionSection />);

      expect(screen.getByText('Pacientes y mascotas')).toBeInTheDocument();
      expect(screen.getByText('Citas y agenda')).toBeInTheDocument();
      expect(screen.getByText('Recordatorios automáticos')).toBeInTheDocument();
      expect(screen.getByText('Historial clínico')).toBeInTheDocument();
      expect(screen.getByText('Inventario básico')).toBeInTheDocument();
      expect(screen.getByText('Acceso desde cualquier dispositivo')).toBeInTheDocument();
    });

    it('should render feature descriptions', () => {
      render(<SolutionSection />);

      expect(
        screen.getByText('Toda la información de tus pacientes organizada')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Programa y gestiona tus citas fácilmente')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Nunca más olvides una vacuna o seguimiento')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Consultas, vacunas y tratamientos en un solo lugar')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Control de medicamentos y productos')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Funciona en computadora, tablet o celular')
      ).toBeInTheDocument();
    });

    it('should render all icons', () => {
      render(<SolutionSection />);

      expect(screen.getByTestId('icon-paw-print')).toBeInTheDocument();
      expect(screen.getByTestId('icon-calendar')).toBeInTheDocument();
      expect(screen.getByTestId('icon-bell')).toBeInTheDocument();
      expect(screen.getByTestId('icon-file-text')).toBeInTheDocument();
      expect(screen.getByTestId('icon-package')).toBeInTheDocument();
      expect(screen.getByTestId('icon-smartphone')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should render as a section element with correct id', () => {
      const { container } = render(<SolutionSection />);

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('id', 'funcionalidades');
    });

    it('should have proper dark mode border classes on feature cards', () => {
      const { container } = render(<SolutionSection />);

      const featureCards = container.querySelectorAll('.border-gray-200');
      expect(featureCards.length).toBe(6); // 6 feature cards

      featureCards.forEach((card) => {
        expect(card).toHaveClass('dark:border-gray-700');
      });
    });

    it('should have grid layout', () => {
      const { container } = render(<SolutionSection />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('lg:grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<SolutionSection />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Todo en un solo lugar');
    });

    it('should have h3 headings for each feature', () => {
      render(<SolutionSection />);

      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s.length).toBe(6);
    });
  });
});
