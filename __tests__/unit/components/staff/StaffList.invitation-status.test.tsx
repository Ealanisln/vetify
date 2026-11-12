/**
 * StaffList access badge: an expired invitation must not read as pending,
 * and the owner must be able to resend it.
 */
import { render, screen, within } from '@testing-library/react';
import StaffList from '@/components/staff/StaffList';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const DAY = 86400000;

function member(id: string, name: string, invitation: { status: 'PENDING' | 'EXPIRED'; expiresAt: string }) {
  return {
    id,
    name,
    position: 'VETERINARIAN',
    email: `${id}@example.com`,
    isActive: true,
    userId: null,
    invitation: { id: `inv-${id}`, ...invitation },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    _count: { appointments: 0, medicalHistories: 0, medicalOrders: 0, Sale: 0 },
  };
}

const staff = [
  member('a', 'Ana Activa', { status: 'PENDING', expiresAt: new Date(Date.now() + 3 * DAY).toISOString() }),
  member('b', 'Beto Vencido', { status: 'PENDING', expiresAt: new Date(Date.now() - DAY).toISOString() }),
  member('c', 'Carla Expirada', { status: 'EXPIRED', expiresAt: new Date(Date.now() - 2 * DAY).toISOString() }),
];

function cardOf(name: string) {
  const heading = screen.getByText(name);
  // Walk up to the card that contains both the name and the access badge
  let node: HTMLElement | null = heading;
  while (node && within(node).queryAllByText(/Invitación (pendiente|expirada)/).length === 0) {
    node = node.parentElement;
  }
  if (!node) throw new Error(`No card found for ${name}`);
  return node;
}

describe('StaffList invitation status', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], staff, pagination: { total: 3, page: 1, limit: 20, totalPages: 1 } }),
      })
    ) as unknown as typeof fetch;
  });

  it('shows pending only for invitations that have not expired', () => {
    render(
      <StaffList initialStaff={staff} pagination={{ total: 3, page: 1, limit: 20, totalPages: 1 }} />
    );

    expect(within(cardOf('Ana Activa')).getByText('Invitación pendiente')).toBeInTheDocument();
    expect(within(cardOf('Beto Vencido')).getByText('Invitación expirada')).toBeInTheDocument();
    expect(within(cardOf('Carla Expirada')).getByText('Invitación expirada')).toBeInTheDocument();
  });

  it('offers to resend an expired invitation', () => {
    render(
      <StaffList initialStaff={staff} pagination={{ total: 3, page: 1, limit: 20, totalPages: 1 }} />
    );

    expect(within(cardOf('Beto Vencido')).getByRole('button', { name: 'Reenviar' })).toBeInTheDocument();
    expect(within(cardOf('Carla Expirada')).getByRole('button', { name: 'Reenviar' })).toBeInTheDocument();
  });
});
