/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import type { Tenant } from '@prisma/client';

let searchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}));

const tenant = { id: 'tenant-1', name: 'Clínica Test' } as unknown as Tenant;

describe('WelcomeBanner', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders nothing without a welcome or subscription param', () => {
    searchParams = new URLSearchParams();
    const { container } = render(<WelcomeBanner tenant={tenant} />);

    expect(container).toBeEmptyDOMElement();
  });

  describe('welcome=1 (post-onboarding trial greeting)', () => {
    beforeEach(() => {
      searchParams = new URLSearchParams('welcome=1');
    });

    it('greets the new trial with a CTA to register the first pet', async () => {
      render(<WelcomeBanner tenant={tenant} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /bienvenido a vetify/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/prueba/i)).toBeInTheDocument();
      const cta = screen.getByRole('link', { name: 'Registrar mi primera mascota' });
      expect(cta).toHaveAttribute('href', '/dashboard/pets/new');
    });

    it('does not repeat the first-run card copy', async () => {
      render(<WelcomeBanner tenant={tenant} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /bienvenido a vetify/i })).toBeInTheDocument();
      });

      expect(screen.queryByText('Registra tu primera mascota')).not.toBeInTheDocument();
    });

    it('can be dismissed', async () => {
      render(<WelcomeBanner tenant={tenant} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /bienvenido a vetify/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Cerrar banner de bienvenida' }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /bienvenido a vetify/i })).not.toBeInTheDocument();
      });
    });

    it('only shows once per tenant', async () => {
      const first = render(<WelcomeBanner tenant={tenant} />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /bienvenido a vetify/i })).toBeInTheDocument();
      });
      first.unmount();

      const { container } = render(<WelcomeBanner tenant={tenant} />);
      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('success=subscription_created (existing behaviour)', () => {
    it('still renders the plan banner', async () => {
      searchParams = new URLSearchParams('success=subscription_created&plan=profesional');
      render(<WelcomeBanner tenant={tenant} />);

      await waitFor(() => {
        expect(screen.getByText(/Bienvenido a Plan Profesional/)).toBeInTheDocument();
      });
    });
  });
});
