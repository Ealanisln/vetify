import { render, screen } from '@testing-library/react';
import {
  UpgradePrompt,
  UpgradePromptInline,
  UpgradePromptBanner,
} from '@/components/UpgradePrompt';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

describe('UpgradePrompt', () => {
  const defaultProps = {
    tenantId: 'tenant-1',
  };

  describe('UpgradePrompt (Card variant)', () => {
    it('should render advancedReports feature correctly', () => {
      render(
        <UpgradePrompt feature="advancedReports" {...defaultProps} />
      );

      expect(screen.getByText('Reportes Avanzados')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Obtén insights detallados sobre tu clínica veterinaria'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('Toma decisiones informadas con datos precisos')
      ).toBeInTheDocument();
    });

    it('should render multiDoctor feature correctly', () => {
      render(
        <UpgradePrompt feature="multiDoctor" {...defaultProps} />
      );

      expect(screen.getByText('Agenda Multi-Doctor')).toBeInTheDocument();
      expect(
        screen.getByText('Gestiona citas para múltiples veterinarios')
      ).toBeInTheDocument();
    });

    it('should render smsReminders feature correctly', () => {
      render(
        <UpgradePrompt feature="smsReminders" {...defaultProps} />
      );

      expect(screen.getByText('Recordatorios SMS')).toBeInTheDocument();
      expect(
        screen.getByText('Envía recordatorios por mensaje de texto')
      ).toBeInTheDocument();
    });

    it('should show Pro Feature badge', () => {
      render(
        <UpgradePrompt feature="advancedReports" {...defaultProps} />
      );

      expect(screen.getByText('Pro Feature')).toBeInTheDocument();
    });

    it('should show Actualizar Plan button linking to /precios', () => {
      render(
        <UpgradePrompt feature="advancedReports" {...defaultProps} />
      );

      const upgradeLink = screen.getByRole('link', {
        name: /Actualizar Plan/i,
      });
      expect(upgradeLink).toHaveAttribute('href', '/precios');
    });

    it('should show Ver Limites del Plan button linking to settings', () => {
      render(
        <UpgradePrompt feature="advancedReports" {...defaultProps} />
      );

      const limitsLink = screen.getByRole('link', {
        name: /Ver Límites del Plan/i,
      });
      expect(limitsLink).toHaveAttribute('href', '/dashboard/settings');
    });

    it('should hide icon when showIcon is false', () => {
      const { container } = render(
        <UpgradePrompt
          feature="advancedReports"
          {...defaultProps}
          showIcon={false}
        />
      );

      // The icon wrapper should not be present
      expect(container.querySelector('.text-2xl')).not.toBeInTheDocument();
    });

    it('should apply size classes correctly', () => {
      const { container: smContainer } = render(
        <UpgradePrompt
          feature="advancedReports"
          {...defaultProps}
          size="sm"
        />
      );
      expect(smContainer.querySelector('.p-4')).toBeInTheDocument();

      const { container: lgContainer } = render(
        <UpgradePrompt
          feature="advancedReports"
          {...defaultProps}
          size="lg"
        />
      );
      expect(lgContainer.querySelector('.p-8')).toBeInTheDocument();
    });
  });

  describe('UpgradePromptInline', () => {
    it('should render inline variant with feature title', () => {
      render(
        <UpgradePromptInline feature="advancedReports" {...defaultProps} />
      );

      expect(screen.getByText(/Reportes Avanzados/)).toBeInTheDocument();
    });

    it('should show Actualizar link', () => {
      render(
        <UpgradePromptInline feature="multiDoctor" {...defaultProps} />
      );

      const link = screen.getByRole('link', { name: /Actualizar/i });
      expect(link).toHaveAttribute('href', '/precios');
    });
  });

  describe('UpgradePromptBanner', () => {
    it('should render banner variant with feature title', () => {
      render(
        <UpgradePromptBanner feature="smsReminders" {...defaultProps} />
      );

      expect(
        screen.getByText('Recordatorios SMS requiere actualización')
      ).toBeInTheDocument();
    });

    it('should show benefit text', () => {
      render(
        <UpgradePromptBanner feature="smsReminders" {...defaultProps} />
      );

      expect(
        screen.getByText('Reduce las faltas a citas y mejora la asistencia')
      ).toBeInTheDocument();
    });

    it('should show Actualizar Plan button', () => {
      render(
        <UpgradePromptBanner feature="advancedReports" {...defaultProps} />
      );

      const link = screen.getByRole('link', {
        name: /Actualizar Plan/i,
      });
      expect(link).toHaveAttribute('href', '/precios');
    });
  });
});
