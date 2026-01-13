/**
 * Unit Tests for TeamSection Component
 *
 * Tests the public team section including position translation functionality
 */

import { render, screen } from '@testing-library/react';
import { TeamSection } from '@/components/public/TeamSection';
import {
  createMockPublicTenant,
} from '../../../utils/public-test-factories';
import type { PublicStaffMember } from '@/lib/tenant';

// Helper to filter framer-motion props
const filterMotionProps = (props: Record<string, unknown>) => {
  const motionProps = [
    'initial', 'animate', 'exit', 'transition', 'variants',
    'whileHover', 'whileTap', 'whileInView', 'whileFocus', 'whileDrag',
    'viewport', 'onAnimationStart', 'onAnimationComplete',
    'layout', 'layoutId', 'drag', 'dragConstraints',
  ];
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!motionProps.includes(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
};

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    section: ({
      children,
      className,
      style,
      ...props
    }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <section className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </section>
    ),
    div: ({
      children,
      className,
      style,
      ...props
    }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <div className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => <img src={src} alt={alt} {...filterMotionProps(props)} />,
}));

// Mock useThemeAware hook
jest.mock('@/hooks/useThemeAware', () => ({
  useThemeAware: () => ({ isDark: false }),
}));

// Helper to create mock staff members
const createMockStaffMember = (overrides: Partial<PublicStaffMember> = {}): PublicStaffMember => ({
  id: 'staff-1',
  name: 'Dr. Test User',
  position: 'VETERINARIAN',
  publicBio: 'Test bio',
  publicPhoto: 'https://example.com/photo.jpg',
  specialties: ['Cirugía'],
  ...overrides,
});

describe('TeamSection Component', () => {
  const mockTenant = createMockPublicTenant();

  describe('Position Translation', () => {
    it('should translate VETERINARIAN to Spanish', () => {
      const team = [createMockStaffMember({ position: 'VETERINARIAN' })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Veterinario/a')).toBeInTheDocument();
      expect(screen.queryByText('VETERINARIAN')).not.toBeInTheDocument();
    });

    it('should translate ASSISTANT to Spanish', () => {
      const team = [createMockStaffMember({ position: 'ASSISTANT', name: 'Ana Asistente' })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Asistente')).toBeInTheDocument();
      expect(screen.queryByText('ASSISTANT')).not.toBeInTheDocument();
    });

    it('should translate VETERINARY_TECHNICIAN to Spanish', () => {
      const team = [createMockStaffMember({ position: 'VETERINARY_TECHNICIAN', name: 'Luis Técnico' })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Técnico Veterinario')).toBeInTheDocument();
      expect(screen.queryByText('VETERINARY_TECHNICIAN')).not.toBeInTheDocument();
    });

    it('should translate RECEPTIONIST to Spanish', () => {
      const team = [createMockStaffMember({ position: 'RECEPTIONIST', name: 'María Recepción' })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Recepcionista')).toBeInTheDocument();
      expect(screen.queryByText('RECEPTIONIST')).not.toBeInTheDocument();
    });

    it('should translate MANAGER to Spanish', () => {
      const team = [createMockStaffMember({ position: 'MANAGER', name: 'Carlos Gerente' })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Gerente')).toBeInTheDocument();
      expect(screen.queryByText('MANAGER')).not.toBeInTheDocument();
    });

    it('should translate GROOMER to Spanish', () => {
      const team = [createMockStaffMember({ position: 'GROOMER', name: 'Pedro Peluquero' })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Peluquero/a')).toBeInTheDocument();
      expect(screen.queryByText('GROOMER')).not.toBeInTheDocument();
    });

    it('should translate ADMIN to Spanish', () => {
      const team = [createMockStaffMember({ position: 'ADMIN', name: 'Admin User' })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Administrador/a')).toBeInTheDocument();
      expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
    });

    it('should translate OTHER to Spanish', () => {
      const team = [createMockStaffMember({ position: 'OTHER', name: 'Otro Personal' })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Otro')).toBeInTheDocument();
      expect(screen.queryByText('OTHER')).not.toBeInTheDocument();
    });

    it('should fallback to original value for unknown positions', () => {
      const team = [createMockStaffMember({ position: 'CUSTOM_POSITION', name: 'Custom User' })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      // Should show the original value as fallback
      expect(screen.getByText('CUSTOM_POSITION')).toBeInTheDocument();
    });

    it('should translate multiple team members positions correctly', () => {
      const team = [
        createMockStaffMember({ id: '1', position: 'VETERINARIAN', name: 'Dr. Vet' }),
        createMockStaffMember({ id: '2', position: 'ASSISTANT', name: 'Asistente Test' }),
        createMockStaffMember({ id: '3', position: 'VETERINARY_TECHNICIAN', name: 'Técnico Test' }),
      ];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Veterinario/a')).toBeInTheDocument();
      expect(screen.getByText('Asistente')).toBeInTheDocument();
      expect(screen.getByText('Técnico Veterinario')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('should not render when team is empty', () => {
      const { container } = render(<TeamSection tenant={mockTenant} team={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render team member names', () => {
      const team = [
        createMockStaffMember({ name: 'Dr. Juan Pérez' }),
        createMockStaffMember({ id: '2', name: 'María García' }),
      ];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Dr. Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
    });

    it('should render team member bios', () => {
      const team = [createMockStaffMember({ publicBio: 'Especialista en cirugía de pequeños animales' })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Especialista en cirugía de pequeños animales')).toBeInTheDocument();
    });

    it('should render team member specialties', () => {
      const team = [createMockStaffMember({ specialties: ['Cirugía', 'Cardiología', 'Dermatología'] })];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Cirugía')).toBeInTheDocument();
      expect(screen.getByText('Cardiología')).toBeInTheDocument();
      expect(screen.getByText('Dermatología')).toBeInTheDocument();
    });

    it('should render section header', () => {
      const team = [createMockStaffMember()];
      render(<TeamSection tenant={mockTenant} team={team} />);

      expect(screen.getByText('Nuestro Equipo')).toBeInTheDocument();
      expect(screen.getByText('Profesionales dedicados al cuidado y bienestar de tus mascotas')).toBeInTheDocument();
    });
  });
});
