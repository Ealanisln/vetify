import { render, screen } from '@testing-library/react';
import AdvancedInventoryUpgradePrompt from '@/components/inventory/AdvancedInventoryUpgradePrompt';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('AdvancedInventoryUpgradePrompt', () => {
  it('renders the upgrade prompt title', () => {
    render(<AdvancedInventoryUpgradePrompt />);

    expect(screen.getByText('Desbloquea Inventario Avanzado')).toBeInTheDocument();
  });

  it('renders all four feature cards', () => {
    render(<AdvancedInventoryUpgradePrompt />);

    expect(screen.getByText('Análisis de Rotación')).toBeInTheDocument();
    expect(screen.getByText('Alertas Automáticas')).toBeInTheDocument();
    expect(screen.getByText('Reportes Detallados')).toBeInTheDocument();
    expect(screen.getByText('Gestión de Lotes')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<AdvancedInventoryUpgradePrompt />);

    expect(screen.getByText(/Identifica productos de lenta rotación/i)).toBeInTheDocument();
    expect(screen.getByText(/Recibe notificaciones cuando el stock/i)).toBeInTheDocument();
    expect(screen.getByText(/Historial completo de movimientos/i)).toBeInTheDocument();
    expect(screen.getByText(/Control de lotes, vencimientos/i)).toBeInTheDocument();
  });

  it('renders the upgrade button linking to /precios', () => {
    render(<AdvancedInventoryUpgradePrompt />);

    const button = screen.getByRole('link', { name: /Actualizar a Plan Profesional/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('href', '/precios');
  });

  it('renders the description text', () => {
    render(<AdvancedInventoryUpgradePrompt />);

    expect(screen.getByText(/Optimiza tu gestión de inventario/i)).toBeInTheDocument();
  });

  it('renders the reassurance text', () => {
    render(<AdvancedInventoryUpgradePrompt />);

    expect(screen.getByText(/Acceso inmediato • Sin compromiso • Cancela cuando quieras/i)).toBeInTheDocument();
  });
});
