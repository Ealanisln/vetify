/**
 * Invite page: account-mismatch and other-clinic states must offer a way out
 * (log out and come back to the same invite) instead of a retry loop.
 */
import { render, screen } from '@testing-library/react';
import InvitePage from '@/app/invite/page';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('token=tok-1'),
  useRouter: () => ({ push: jest.fn() }),
}));

const invitation = {
  id: 'inv-1',
  email: 'ana@example.com',
  roleKey: 'VETERINARIAN',
  expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  tenant: { name: 'Clínica Norte', logo: null },
  staff: { name: 'Ana', position: 'VETERINARIAN' },
};

type Reply = { status: number; body: unknown };

function mockFetch(replies: { me: Reply; accept?: Reply }) {
  global.fetch = jest.fn((url: string) => {
    const reply: Reply = url.startsWith('/api/invitations/validate')
      ? { status: 200, body: { valid: true, invitation } }
      : url.startsWith('/api/auth/me')
        ? replies.me
        : replies.accept ?? { status: 500, body: {} };
    return Promise.resolve({
      ok: reply.status >= 200 && reply.status < 300,
      status: reply.status,
      json: () => Promise.resolve(reply.body),
    });
  }) as unknown as typeof fetch;
}

const signedIn: Reply = { status: 200, body: { authenticated: true } };
const expectedLogoutTarget = encodeURIComponent('/invite?token=tok-1');

describe('InvitePage', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => consoleSpy.mockRestore());

  it('pre-fills the invited email on the register and login links', async () => {
    mockFetch({ me: { status: 401, body: { authenticated: false } } });

    render(<InvitePage />);

    const register = await screen.findByRole('link', { name: 'Crear cuenta y aceptar' });
    const login = screen.getByRole('link', { name: 'Iniciar sesión' });
    expect(register.getAttribute('href')).toContain('login_hint=ana%40example.com');
    expect(login.getAttribute('href')).toContain('login_hint=ana%40example.com');
  });

  it('offers to log out and return to the invite when signed in with another email', async () => {
    mockFetch({
      me: signedIn,
      accept: {
        status: 403,
        body: {
          success: false,
          code: 'EMAIL_MISMATCH',
          invitationEmail: 'ana@example.com',
          error: 'Esta invitación es para ana@example.com. Debes iniciar sesión con ese email.',
        },
      },
    });

    render(<InvitePage />);

    const logout = await screen.findByRole('link', { name: /cerrar sesión/i });
    expect(logout.getAttribute('href')).toContain(`post_logout_redirect_url=${expectedLogoutTarget}`);
    expect(screen.getAllByText(/ana@example\.com/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Intentar de nuevo' })).toBeNull();
  });

  it('explains when the account already belongs to another clinic', async () => {
    mockFetch({
      me: signedIn,
      accept: {
        status: 409,
        body: {
          success: false,
          code: 'USER_IN_OTHER_TENANT',
          error: 'Tu cuenta ya pertenece a otra clínica en Vetify.',
        },
      },
    });

    render(<InvitePage />);

    expect(await screen.findByText(/ya pertenece a otra clínica/)).toBeInTheDocument();
    const logout = screen.getByRole('link', { name: /cerrar sesión/i });
    expect(logout.getAttribute('href')).toContain(`post_logout_redirect_url=${expectedLogoutTarget}`);
    expect(screen.getByRole('link', { name: 'Ir a mi clínica' })).toHaveAttribute('href', '/dashboard');
    expect(screen.queryByRole('button', { name: 'Intentar de nuevo' })).toBeNull();
  });
});
