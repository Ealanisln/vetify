/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { FirstRunCard } from '@/components/dashboard/FirstRunCard';

describe('FirstRunCard', () => {
  it('renders the first-pet title and copy', () => {
    render(<FirstRunCard />);

    expect(screen.getByRole('heading', { name: 'Registra tu primera mascota' })).toBeInTheDocument();
    expect(screen.getByText(/expediente/i)).toBeInTheDocument();
  });

  it('links the primary CTA to the new pet page', () => {
    render(<FirstRunCard />);

    const cta = screen.getByRole('link', { name: 'Registrar mascota' });
    expect(cta).toHaveAttribute('href', '/dashboard/pets/new');
    expect(cta.className).toContain('#75a99c');
  });

  it('links the secondary text to the new customer page', () => {
    render(<FirstRunCard />);

    const secondary = screen.getByRole('link', { name: /empieza por registrar un cliente/i });
    expect(secondary).toHaveAttribute('href', '/dashboard/customers/new');
  });

  it('uses dark-mode variants for its border and background', () => {
    const { container } = render(<FirstRunCard />);
    const card = container.firstChild as HTMLElement;

    expect(card.className).toMatch(/dark:border-/);
    expect(card.className).toMatch(/dark:bg-/);
  });
});
