/**
 * Component tests for MedicalHistoryCard
 * Tests medical history card rendering, empty states, and consultation display
 */

import { render, screen } from '@testing-library/react';
import { MedicalHistoryCard } from '../MedicalHistoryCard';
import type { MedicalHistory, Staff } from '@prisma/client';

// Mock next/link - preserve data-testid from component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
    'data-testid': dataTestId,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    'data-testid'?: string;
  }) => (
    <a href={href} className={className} data-testid={dataTestId || 'link'}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus">+</span>,
  Stethoscope: () => <span data-testid="icon-stethoscope">S</span>,
  FileText: () => <span data-testid="icon-filetext">F</span>,
  Activity: () => <span data-testid="icon-activity">A</span>,
  StickyNote: () => <span data-testid="icon-stickynote">N</span>,
  User: () => <span data-testid="icon-user">U</span>,
  Calendar: () => <span data-testid="icon-calendar">C</span>,
}));

type MedicalHistoryWithStaff = MedicalHistory & { staff?: Staff | null };

// Factory function for creating mock medical history
const createMockMedicalHistory = (
  overrides: Partial<MedicalHistoryWithStaff> = {}
): MedicalHistoryWithStaff => ({
  id: 'history-1',
  petId: 'pet-1',
  tenantId: 'tenant-1',
  staffId: 'staff-1',
  visitDate: new Date('2024-01-15T10:30:00'),
  reasonForVisit: 'Consulta de rutina',
  diagnosis: 'Paciente sano',
  treatment: 'Sin tratamiento requerido',
  notes: 'Próxima revisión en 6 meses',
  weight: null,
  temperature: null,
  heartRate: null,
  respiratoryRate: null,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  staff: {
    id: 'staff-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    name: 'Dr. García',
    email: 'garcia@vet.com',
    phone: null,
    roleId: 'role-1',
    specialty: 'General',
    licenseNumber: 'VET-001',
    isActive: true,
    profileImage: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  ...overrides,
});

// Factory function for creating mock pet with histories
const createMockPet = (
  histories: MedicalHistoryWithStaff[] = []
): { id: string; name: string; medicalHistories: MedicalHistoryWithStaff[] } => ({
  id: 'pet-123',
  name: 'Max',
  medicalHistories: histories,
});

describe('MedicalHistoryCard', () => {
  describe('Empty State', () => {
    it('should render empty state when no histories exist', () => {
      const pet = createMockPet([]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('Sin historial médico')).toBeInTheDocument();
      expect(
        screen.getByText(/Comienza registrando la primera consulta de Max/i)
      ).toBeInTheDocument();
    });

    it('should show "Registrar Primera Consulta" button in empty state', () => {
      const pet = createMockPet([]);

      render(<MedicalHistoryCard pet={pet} />);

      const registerButton = screen.getByText('Registrar Primera Consulta');
      expect(registerButton).toBeInTheDocument();
      expect(registerButton.closest('a')).toHaveAttribute(
        'href',
        '/dashboard/pets/pet-123/consultation/new'
      );
    });

    it('should render empty state icon', () => {
      const pet = createMockPet([]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByTestId('icon-filetext')).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('should render card title "Historial Médico"', () => {
      const pet = createMockPet([]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('Historial Médico')).toBeInTheDocument();
    });

    it('should render stethoscope icon in header', () => {
      const pet = createMockPet([]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getAllByTestId('icon-stethoscope').length).toBeGreaterThan(0);
    });

    it('should show consultation count "0 consultas registradas" when empty', () => {
      const pet = createMockPet([]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('0 consultas registradas')).toBeInTheDocument();
    });

    it('should show consultation count "1 consulta registradas" for single history', () => {
      const pet = createMockPet([createMockMedicalHistory()]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('1 consulta registradas')).toBeInTheDocument();
    });

    it('should show consultation count "3 consultas registradas" for multiple histories', () => {
      const pet = createMockPet([
        createMockMedicalHistory({ id: 'h1' }),
        createMockMedicalHistory({ id: 'h2' }),
        createMockMedicalHistory({ id: 'h3' }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('3 consultas registradas')).toBeInTheDocument();
    });

    it('should render "Nueva Consulta" button in header', () => {
      const pet = createMockPet([]);

      render(<MedicalHistoryCard pet={pet} />);

      // The button shows different text on mobile vs desktop
      const consultaButtons = screen.getAllByText(/Consulta|Nueva Consulta/);
      expect(consultaButtons.length).toBeGreaterThan(0);
    });

    it('should link "Nueva Consulta" button to correct URL', () => {
      const pet = createMockPet([]);

      render(<MedicalHistoryCard pet={pet} />);

      const link = screen.getByTestId('new-consultation-button');
      expect(link).toHaveAttribute('href', '/dashboard/pets/pet-123/consultation/new');
    });

    it('should have data-testid="new-consultation-button"', () => {
      const pet = createMockPet([]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByTestId('new-consultation-button')).toBeInTheDocument();
    });
  });

  describe('Medical History Entry', () => {
    it('should render reason for visit', () => {
      const pet = createMockPet([
        createMockMedicalHistory({ reasonForVisit: 'Vacunación anual' }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('Vacunación anual')).toBeInTheDocument();
    });

    it('should render visit date', () => {
      const pet = createMockPet([
        createMockMedicalHistory({
          visitDate: new Date('2024-03-20T14:00:00'),
        }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      // Check for date format (dd MMM yyyy)
      expect(screen.getByText('20 mar 2024')).toBeInTheDocument();
    });

    it('should render diagnosis section when present', () => {
      const pet = createMockPet([
        createMockMedicalHistory({ diagnosis: 'Otitis externa leve' }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('Diagnóstico')).toBeInTheDocument();
      expect(screen.getByText('Otitis externa leve')).toBeInTheDocument();
    });

    it('should not render diagnosis section when empty', () => {
      const pet = createMockPet([
        createMockMedicalHistory({ diagnosis: null }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.queryByText('Diagnóstico')).not.toBeInTheDocument();
    });

    it('should render treatment section when present', () => {
      const pet = createMockPet([
        createMockMedicalHistory({ treatment: 'Antibiótico por 7 días' }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('Tratamiento')).toBeInTheDocument();
      expect(screen.getByText('Antibiótico por 7 días')).toBeInTheDocument();
    });

    it('should not render treatment section when empty', () => {
      const pet = createMockPet([
        createMockMedicalHistory({ treatment: null }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.queryByText('Tratamiento')).not.toBeInTheDocument();
    });

    it('should render notes section when present', () => {
      const pet = createMockPet([
        createMockMedicalHistory({ notes: 'Control en 2 semanas' }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('Notas')).toBeInTheDocument();
      expect(screen.getByText('Control en 2 semanas')).toBeInTheDocument();
    });

    it('should not render notes section when empty', () => {
      const pet = createMockPet([createMockMedicalHistory({ notes: null })]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.queryByText('Notas')).not.toBeInTheDocument();
    });

    it('should render staff name when present', () => {
      const pet = createMockPet([
        createMockMedicalHistory({
          staff: {
            id: 'staff-1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            name: 'Dra. López',
            email: 'lopez@vet.com',
            phone: null,
            roleId: 'role-1',
            specialty: null,
            licenseNumber: null,
            isActive: true,
            profileImage: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('Dra. López')).toBeInTheDocument();
      expect(screen.getByText('Atendido por')).toBeInTheDocument();
    });

    it('should not render staff section when staff is null', () => {
      const pet = createMockPet([createMockMedicalHistory({ staff: null })]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.queryByText('Atendido por')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Histories', () => {
    it('should render all history entries', () => {
      const pet = createMockPet([
        createMockMedicalHistory({ id: 'h1', reasonForVisit: 'Primera consulta' }),
        createMockMedicalHistory({ id: 'h2', reasonForVisit: 'Segunda consulta' }),
        createMockMedicalHistory({ id: 'h3', reasonForVisit: 'Tercera consulta' }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText('Primera consulta')).toBeInTheDocument();
      expect(screen.getByText('Segunda consulta')).toBeInTheDocument();
      expect(screen.getByText('Tercera consulta')).toBeInTheDocument();
    });

    it('should render timeline connectors between entries', () => {
      const pet = createMockPet([
        createMockMedicalHistory({ id: 'h1' }),
        createMockMedicalHistory({ id: 'h2' }),
      ]);

      const { container } = render(<MedicalHistoryCard pet={pet} />);

      // Timeline connector should exist for entries that are not last
      const connectors = container.querySelectorAll('[aria-hidden="true"]');
      expect(connectors.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('should have data-testid="medical-history-card"', () => {
      const pet = createMockPet([]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByTestId('medical-history-card')).toBeInTheDocument();
    });

    it('should apply dark mode classes', () => {
      const pet = createMockPet([]);

      const { container } = render(<MedicalHistoryCard pet={pet} />);

      const card = container.firstChild;
      expect(card).toHaveClass('dark:bg-gray-800');
    });

    it('should apply border classes', () => {
      const pet = createMockPet([]);

      const { container } = render(<MedicalHistoryCard pet={pet} />);

      const card = container.firstChild;
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-gray-200');
      expect(card).toHaveClass('dark:border-gray-700');
    });

    it('should have rounded corners', () => {
      const pet = createMockPet([]);

      const { container } = render(<MedicalHistoryCard pet={pet} />);

      const card = container.firstChild;
      expect(card).toHaveClass('rounded-xl');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const pet = createMockPet([createMockMedicalHistory()]);

      render(<MedicalHistoryCard pet={pet} />);

      const h3 = screen.getByRole('heading', { level: 3 });
      expect(h3).toHaveTextContent('Historial Médico');
    });

    it('should have time element with datetime attribute', () => {
      const pet = createMockPet([
        createMockMedicalHistory({
          visitDate: new Date('2024-05-10T09:00:00'),
        }),
      ]);

      const { container } = render(<MedicalHistoryCard pet={pet} />);

      const timeElement = container.querySelector('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveAttribute('datetime');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      const pet = createMockPet([
        createMockMedicalHistory({
          diagnosis: '',
          treatment: '',
          notes: '',
        }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      // Empty strings should not render sections
      expect(screen.queryByText('Diagnóstico')).not.toBeInTheDocument();
      expect(screen.queryByText('Tratamiento')).not.toBeInTheDocument();
      expect(screen.queryByText('Notas')).not.toBeInTheDocument();
    });

    it('should handle special characters in text', () => {
      const pet = createMockPet([
        createMockMedicalHistory({
          reasonForVisit: '¿Revisión de oídos? <test> & más',
          diagnosis: 'Diagnóstico con "comillas" y <símbolos>',
        }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(
        screen.getByText('¿Revisión de oídos? <test> & más')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Diagnóstico con "comillas" y <símbolos>')
      ).toBeInTheDocument();
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(500);
      const pet = createMockPet([
        createMockMedicalHistory({
          reasonForVisit: longText,
        }),
      ]);

      render(<MedicalHistoryCard pet={pet} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });
  });
});
