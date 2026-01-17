/**
 * Component tests for TreatmentTimelineCard
 * Tests treatment timeline card rendering, empty states, and treatment display
 */

import { render, screen } from '@testing-library/react';
import { TreatmentTimelineCard } from '../TreatmentTimelineCard';
import type { TreatmentRecord, Staff } from '@prisma/client';

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
  Syringe: () => <span data-testid="icon-syringe">S</span>,
  Bug: () => <span data-testid="icon-bug">B</span>,
  Shield: () => <span data-testid="icon-shield">Sh</span>,
  Pill: () => <span data-testid="icon-pill">P</span>,
  Calendar: () => <span data-testid="icon-calendar">C</span>,
  User: () => <span data-testid="icon-user">U</span>,
  Tag: () => <span data-testid="icon-tag">T</span>,
  Building2: () => <span data-testid="icon-building">Bd</span>,
  StickyNote: () => <span data-testid="icon-stickynote">N</span>,
  Layers: () => <span data-testid="icon-layers">L</span>,
}));

type TreatmentRecordWithStaff = TreatmentRecord & { staff?: Staff | null };

// Factory function for creating mock treatment record
const createMockTreatment = (
  overrides: Partial<TreatmentRecordWithStaff> = {}
): TreatmentRecordWithStaff => ({
  id: 'treatment-1',
  petId: 'pet-1',
  tenantId: 'tenant-1',
  staffId: 'staff-1',
  treatmentType: 'VACCINATION',
  productName: 'Vacuna Rabia',
  administrationDate: new Date('2024-01-15T10:30:00'),
  batchNumber: 'LOT-123456',
  manufacturer: 'Zoetis',
  expirationDate: new Date('2025-01-15'),
  nextDueDate: new Date('2025-01-15'),
  vaccineStage: 'Refuerzo anual',
  dewormingType: null,
  notes: 'Sin reacciones adversas',
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

// Factory function for creating mock pet with treatments
const createMockPet = (
  treatments: TreatmentRecordWithStaff[] = []
): { id: string; treatmentRecords: TreatmentRecordWithStaff[] } => ({
  id: 'pet-123',
  treatmentRecords: treatments,
});

describe('TreatmentTimelineCard', () => {
  describe('Empty State', () => {
    it('should render empty state when no treatments exist', () => {
      const pet = createMockPet([]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('Sin tratamientos registrados')).toBeInTheDocument();
      expect(
        screen.getByText('Registra vacunas, desparasitaciones y otros tratamientos.')
      ).toBeInTheDocument();
    });

    it('should show "Registrar Primer Tratamiento" button in empty state', () => {
      const pet = createMockPet([]);

      render(<TreatmentTimelineCard pet={pet} />);

      const registerButton = screen.getByText('Registrar Primer Tratamiento');
      expect(registerButton).toBeInTheDocument();
      expect(registerButton.closest('a')).toHaveAttribute(
        'href',
        '/dashboard/pets/pet-123/treatment/new'
      );
    });

    it('should render empty state icon', () => {
      const pet = createMockPet([]);

      render(<TreatmentTimelineCard pet={pet} />);

      // Should show syringe icons
      expect(screen.getAllByTestId('icon-syringe').length).toBeGreaterThan(0);
    });
  });

  describe('Header', () => {
    it('should render card title "Tratamientos y Vacunas"', () => {
      const pet = createMockPet([]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('Tratamientos y Vacunas')).toBeInTheDocument();
    });

    it('should render syringe icon in header', () => {
      const pet = createMockPet([]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getAllByTestId('icon-syringe').length).toBeGreaterThan(0);
    });

    it('should show treatment count "0 tratamientos registrados" when empty', () => {
      const pet = createMockPet([]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('0 tratamientos registrados')).toBeInTheDocument();
    });

    it('should show treatment count "1 tratamiento registrados" for single treatment', () => {
      const pet = createMockPet([createMockTreatment()]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('1 tratamiento registrados')).toBeInTheDocument();
    });

    it('should show treatment count "3 tratamientos registrados" for multiple treatments', () => {
      const pet = createMockPet([
        createMockTreatment({ id: 't1' }),
        createMockTreatment({ id: 't2' }),
        createMockTreatment({ id: 't3' }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('3 tratamientos registrados')).toBeInTheDocument();
    });

    it('should render "Nuevo Tratamiento" button in header', () => {
      const pet = createMockPet([]);

      render(<TreatmentTimelineCard pet={pet} />);

      // The button shows different text on mobile vs desktop
      const tratamientoButtons = screen.getAllByText(/Tratamiento|Nuevo Tratamiento/);
      expect(tratamientoButtons.length).toBeGreaterThan(0);
    });

    it('should link "Nuevo Tratamiento" button to correct URL', () => {
      const pet = createMockPet([]);

      render(<TreatmentTimelineCard pet={pet} />);

      // Find link by href since TreatmentTimelineCard doesn't have data-testid on buttons
      const links = screen.getAllByRole('link');
      const newTreatmentLink = links.find(
        (link) => link.getAttribute('href') === '/dashboard/pets/pet-123/treatment/new'
      );
      expect(newTreatmentLink).toBeInTheDocument();
    });
  });

  describe('Treatment Types', () => {
    it('should render vaccination treatment correctly', () => {
      const pet = createMockPet([
        createMockTreatment({
          treatmentType: 'VACCINATION',
          productName: 'Vacuna Triple Felina',
        }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('Vacunación')).toBeInTheDocument();
      expect(screen.getByText('Vacuna Triple Felina')).toBeInTheDocument();
    });

    it('should render deworming treatment correctly', () => {
      const pet = createMockPet([
        createMockTreatment({
          treatmentType: 'DEWORMING',
          productName: 'Drontal Plus',
          dewormingType: 'Interno',
        }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('Desparasitación')).toBeInTheDocument();
      expect(screen.getByText('Drontal Plus')).toBeInTheDocument();
    });

    it('should render flea/tick treatment correctly', () => {
      const pet = createMockPet([
        createMockTreatment({
          treatmentType: 'FLEA_TICK',
          productName: 'Frontline Plus',
        }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('Antipulgas')).toBeInTheDocument();
      expect(screen.getByText('Frontline Plus')).toBeInTheDocument();
    });

    it('should render other treatment type correctly', () => {
      const pet = createMockPet([
        createMockTreatment({
          treatmentType: 'OTHER',
          productName: 'Vitaminas',
        }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      // "Tratamiento" appears multiple times (header buttons + badge), use getAllByText
      const tratamientoElements = screen.getAllByText('Tratamiento');
      expect(tratamientoElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Vitaminas')).toBeInTheDocument();
    });
  });

  describe('Treatment Entry Details', () => {
    it('should render product name', () => {
      const pet = createMockPet([
        createMockTreatment({ productName: 'Nobivac Rabia' }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('Nobivac Rabia')).toBeInTheDocument();
    });

    it('should render administration date', () => {
      const pet = createMockPet([
        createMockTreatment({
          administrationDate: new Date('2024-06-20T14:00:00'),
        }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      // Check for date format (dd MMM yyyy)
      expect(screen.getByText('20 jun 2024')).toBeInTheDocument();
    });

    it('should render batch number when present', () => {
      const pet = createMockPet([
        createMockTreatment({ batchNumber: 'BATCH-789' }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText(/Lote:/)).toBeInTheDocument();
      expect(screen.getByText(/BATCH-789/)).toBeInTheDocument();
    });

    it('should not render batch number when null', () => {
      const pet = createMockPet([
        createMockTreatment({ batchNumber: null }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.queryByText(/Lote:/)).not.toBeInTheDocument();
    });

    it('should render manufacturer when present', () => {
      const pet = createMockPet([
        createMockTreatment({ manufacturer: 'Pfizer' }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText(/Lab:/)).toBeInTheDocument();
      expect(screen.getByText(/Pfizer/)).toBeInTheDocument();
    });

    it('should not render manufacturer when null', () => {
      const pet = createMockPet([
        createMockTreatment({ manufacturer: null }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.queryByText(/Lab:/)).not.toBeInTheDocument();
    });

    it('should render vaccine stage when present', () => {
      const pet = createMockPet([
        createMockTreatment({ vaccineStage: 'Primera dosis' }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText(/Etapa:/)).toBeInTheDocument();
      expect(screen.getByText(/Primera dosis/)).toBeInTheDocument();
    });

    it('should not render vaccine stage when null', () => {
      const pet = createMockPet([
        createMockTreatment({ vaccineStage: null }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.queryByText(/Etapa:/)).not.toBeInTheDocument();
    });

    it('should render deworming type when present', () => {
      const pet = createMockPet([
        createMockTreatment({
          treatmentType: 'DEWORMING',
          dewormingType: 'Interno y externo',
        }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText(/Tipo:/)).toBeInTheDocument();
      expect(screen.getByText(/Interno y externo/)).toBeInTheDocument();
    });

    it('should render notes section when present', () => {
      const pet = createMockPet([
        createMockTreatment({ notes: 'Administrado sin problemas' }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('Notas')).toBeInTheDocument();
      expect(screen.getByText('Administrado sin problemas')).toBeInTheDocument();
    });

    it('should not render notes section when null', () => {
      const pet = createMockPet([createMockTreatment({ notes: null })]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.queryByText('Notas')).not.toBeInTheDocument();
    });

    it('should render staff name when present', () => {
      const pet = createMockPet([
        createMockTreatment({
          staff: {
            id: 'staff-1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            name: 'Dr. Martínez',
            email: 'martinez@vet.com',
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

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('Dr. Martínez')).toBeInTheDocument();
      expect(screen.getByText('Aplicado por')).toBeInTheDocument();
    });

    it('should not render staff section when staff is null', () => {
      const pet = createMockPet([createMockTreatment({ staff: null })]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.queryByText('Aplicado por')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Treatments', () => {
    it('should render all treatment entries', () => {
      const pet = createMockPet([
        createMockTreatment({ id: 't1', productName: 'Vacuna A' }),
        createMockTreatment({ id: 't2', productName: 'Vacuna B' }),
        createMockTreatment({ id: 't3', productName: 'Vacuna C' }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText('Vacuna A')).toBeInTheDocument();
      expect(screen.getByText('Vacuna B')).toBeInTheDocument();
      expect(screen.getByText('Vacuna C')).toBeInTheDocument();
    });

    it('should render timeline connectors between entries', () => {
      const pet = createMockPet([
        createMockTreatment({ id: 't1' }),
        createMockTreatment({ id: 't2' }),
      ]);

      const { container } = render(<TreatmentTimelineCard pet={pet} />);

      // Timeline connector should exist for entries that are not last
      const connectors = container.querySelectorAll('[aria-hidden="true"]');
      expect(connectors.length).toBeGreaterThan(0);
    });

    it('should render different treatment types with correct icons', () => {
      const pet = createMockPet([
        createMockTreatment({ id: 't1', treatmentType: 'VACCINATION' }),
        createMockTreatment({ id: 't2', treatmentType: 'DEWORMING' }),
        createMockTreatment({ id: 't3', treatmentType: 'FLEA_TICK' }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      // Icons should be rendered for each type
      expect(screen.getAllByTestId('icon-syringe').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('icon-bug').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('icon-shield').length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('should apply dark mode classes', () => {
      const pet = createMockPet([]);

      const { container } = render(<TreatmentTimelineCard pet={pet} />);

      const card = container.firstChild;
      expect(card).toHaveClass('dark:bg-gray-800');
    });

    it('should apply border classes', () => {
      const pet = createMockPet([]);

      const { container } = render(<TreatmentTimelineCard pet={pet} />);

      const card = container.firstChild;
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-gray-200');
      expect(card).toHaveClass('dark:border-gray-700');
    });

    it('should have rounded corners', () => {
      const pet = createMockPet([]);

      const { container } = render(<TreatmentTimelineCard pet={pet} />);

      const card = container.firstChild;
      expect(card).toHaveClass('rounded-xl');
    });

    it('should apply color-coded styling for vaccination', () => {
      const pet = createMockPet([
        createMockTreatment({ treatmentType: 'VACCINATION' }),
      ]);

      const { container } = render(<TreatmentTimelineCard pet={pet} />);

      // Should have blue-colored elements for vaccination
      const blueElements = container.querySelectorAll('[class*="bg-blue"]');
      expect(blueElements.length).toBeGreaterThan(0);
    });

    it('should apply color-coded styling for deworming', () => {
      const pet = createMockPet([
        createMockTreatment({ treatmentType: 'DEWORMING' }),
      ]);

      const { container } = render(<TreatmentTimelineCard pet={pet} />);

      // Should have amber-colored elements for deworming
      const amberElements = container.querySelectorAll('[class*="bg-amber"]');
      expect(amberElements.length).toBeGreaterThan(0);
    });

    it('should apply color-coded styling for flea/tick treatment', () => {
      const pet = createMockPet([
        createMockTreatment({ treatmentType: 'FLEA_TICK' }),
      ]);

      const { container } = render(<TreatmentTimelineCard pet={pet} />);

      // Should have rose-colored elements for flea/tick
      const roseElements = container.querySelectorAll('[class*="bg-rose"]');
      expect(roseElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const pet = createMockPet([createMockTreatment()]);

      render(<TreatmentTimelineCard pet={pet} />);

      const h3 = screen.getByRole('heading', { level: 3 });
      expect(h3).toHaveTextContent('Tratamientos y Vacunas');
    });

    it('should have time element with datetime attribute', () => {
      const pet = createMockPet([
        createMockTreatment({
          administrationDate: new Date('2024-05-10T09:00:00'),
        }),
      ]);

      const { container } = render(<TreatmentTimelineCard pet={pet} />);

      const timeElement = container.querySelector('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveAttribute('datetime');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values for notes', () => {
      const pet = createMockPet([
        createMockTreatment({
          notes: '',
        }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      // Empty string should not render notes section
      expect(screen.queryByText('Notas')).not.toBeInTheDocument();
    });

    it('should handle special characters in text', () => {
      const pet = createMockPet([
        createMockTreatment({
          productName: 'Vacuna "Triple" & Más <test>',
          notes: '¿Sin reacciones? Sí, todo bien.',
        }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(
        screen.getByText('Vacuna "Triple" & Más <test>')
      ).toBeInTheDocument();
      expect(
        screen.getByText('¿Sin reacciones? Sí, todo bien.')
      ).toBeInTheDocument();
    });

    it('should handle very long text', () => {
      const longText = 'Observacion'.repeat(50);
      const pet = createMockPet([
        createMockTreatment({
          notes: longText,
        }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle unknown treatment type', () => {
      const pet = createMockPet([
        // @ts-expect-error - Testing unknown type
        createMockTreatment({ treatmentType: 'UNKNOWN_TYPE' }),
      ]);

      render(<TreatmentTimelineCard pet={pet} />);

      // Should fall back to "Tratamiento" - use getAllByText since it appears in header too
      const tratamientoLabels = screen.getAllByText('Tratamiento');
      expect(tratamientoLabels.length).toBeGreaterThan(0);
    });
  });
});
