/**
 * Staff invitation API routes: send, validate and accept.
 *
 * These call the real route handlers together with the real invitation-token
 * and invitation-email modules. Only the boundaries are mocked: the Kinde
 * session (`@/lib/auth`), the email provider (`sendEmail`) and Prisma. The
 * TenantInvitation table is an in-memory store that enforces the
 * `staffId @unique` constraint, so a regression to "revoke + create" on
 * re-invite fails here the same way it failed in production (P2002).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { addDays, subDays } from 'date-fns';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({
  requirePermission: jest.fn(),
  getAuthenticatedUser: jest.fn(),
}));

jest.mock('@/lib/email/email-service', () => ({
  sendEmail: jest.fn(),
}));

import { POST as sendInvitation } from '@/app/api/invitations/send/route';
import { GET as validateInvitation } from '@/app/api/invitations/validate/route';
import { POST as acceptInvitation } from '@/app/api/invitations/accept/route';
import { requirePermission, getAuthenticatedUser } from '@/lib/auth';
import { sendEmail } from '@/lib/email/email-service';
import { StaffInvitationEmail } from '@/lib/email/templates';

const mockRequirePermission = requirePermission as jest.Mock;
const mockGetUser = getAuthenticatedUser as jest.Mock;
const mockSendEmail = sendEmail as jest.Mock;

const TENANT = { id: 'tenant-1', name: 'Clínica Norte', logo: null };
const STAFF_ID = '0b9d6a52-7c1e-4f3e-9a7e-2f1a3c4d5e6f';

type StaffRow = {
  id: string;
  name: string;
  email: string | null;
  position: string;
  userId: string | null;
  tenantId: string;
};

let staffRows: StaffRow[];
let invitations: any[];
let idCounter: number;

const staffRow = (overrides: Partial<StaffRow> = {}): StaffRow => ({
  id: STAFF_ID,
  name: 'Ana López',
  email: 'Ana@Example.com',
  position: 'RECEPTIONIST',
  userId: null,
  tenantId: TENANT.id,
  ...overrides,
});

const invitationRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'inv-1',
  tenantId: TENANT.id,
  staffId: STAFF_ID,
  email: 'ana@example.com',
  roleKey: 'RECEPTIONIST',
  token: 'tok-existing',
  status: 'PENDING',
  expiresAt: addDays(new Date(), 7),
  createdAt: subDays(new Date(), 10),
  ...overrides,
});

const uniqueViolation = () =>
  Object.assign(new Error('Unique constraint failed on the fields: (`staffId`)'), { code: 'P2002' });

const withRelations = (row: any) => {
  const staff = staffRows.find((s) => s.id === row.staffId);
  return {
    ...row,
    tenant: TENANT,
    staff: staff ? { id: staff.id, name: staff.name, position: staff.position, email: staff.email } : null,
  };
};

const matchesWhere = (row: any, where: any = {}) =>
  Object.entries(where).every(([key, value]: [string, any]) => {
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('gt' in value) return row[key] > value.gt;
      if ('lt' in value) return row[key] < value.lt;
    }
    return row[key] === value;
  });

function installInvitationStore() {
  const inv = prismaMock.tenantInvitation;

  inv.findFirst.mockImplementation((async ({ where }: any) => {
    const rows = invitations
      .filter((row) => matchesWhere(row, where))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return rows[0] ?? null;
  }) as any);

  inv.findUnique.mockImplementation((async ({ where }: any) => {
    const row = invitations.find((r) => matchesWhere(r, where));
    return row ? withRelations(row) : null;
  }) as any);

  inv.create.mockImplementation((async ({ data }: any) => {
    if (invitations.some((r) => r.staffId === data.staffId)) throw uniqueViolation();
    const row = { id: `inv-${++idCounter}`, createdAt: new Date(), ...data };
    invitations.push(row);
    return row;
  }) as any);

  inv.upsert.mockImplementation((async ({ where, update, create }: any) => {
    const row = invitations.find((r) => matchesWhere(r, where));
    if (row) return Object.assign(row, update);
    return (inv.create as any)({ data: create });
  }) as any);

  inv.update.mockImplementation((async ({ where, data }: any) => {
    const row = invitations.find((r) => r.id === where.id);
    if (!row) throw Object.assign(new Error('Record not found'), { code: 'P2025' });
    return Object.assign(row, data);
  }) as any);
}

const jsonPost = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

const validateRequest = (token?: string) =>
  new NextRequest(`http://localhost/api/invitations/validate${token ? `?token=${token}` : ''}`);

describe('Staff invitation routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    staffRows = [staffRow()];
    invitations = [];
    idCounter = 1;

    installInvitationStore();
    prismaMock.staff.findUnique.mockImplementation((async ({ where }: any) =>
      staffRows.find((s) => (where.id ? s.id === where.id : s.userId === where.userId)) ?? null) as any);
    prismaMock.tenant.findUnique.mockImplementation((async ({ where }: any) =>
      where.id === TENANT.id ? TENANT : null) as any);
    prismaMock.$transaction.mockImplementation((async (fn: any) => fn(prismaMock)) as any);

    mockRequirePermission.mockResolvedValue({ tenant: { id: TENANT.id }, user: { id: 'owner-1' } });
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-1' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/invitations/send', () => {
    it('creates a pending invitation scoped to the tenant and emails the invite link', async () => {
      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockRequirePermission).toHaveBeenCalledWith('staff', 'write');
      expect(data).toEqual({
        success: true,
        invitationId: invitations[0].id,
        message: 'Invitación enviada exitosamente',
        staffName: 'Ana López',
        email: 'Ana@Example.com',
      });

      expect(invitations).toHaveLength(1);
      expect(invitations[0]).toMatchObject({
        tenantId: TENANT.id,
        staffId: STAFF_ID,
        email: 'ana@example.com',
        roleKey: 'RECEPTIONIST',
        status: 'PENDING',
      });
      expect(invitations[0].token).toHaveLength(32);
      expect(invitations[0].expiresAt.getTime()).toBeGreaterThan(addDays(new Date(), 6).getTime());

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      const email = mockSendEmail.mock.calls[0][0];
      expect(email).toMatchObject({
        to: { email: 'Ana@Example.com', name: 'Ana López' },
        tenantId: TENANT.id,
        template: 'staff-invitation',
        subject: 'Clínica Norte te ha invitado a unirte al equipo',
      });
      expect(email.data.inviteUrl).toMatch(new RegExp(`/invite\\?token=${invitations[0].token}$`));
    });

    it('names the role in the email with the same label the app uses', async () => {
      await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));

      const { data } = mockSendEmail.mock.calls[0][0];
      expect(data.position).toBe('RECEPTIONIST');
      const html = renderToStaticMarkup(StaffInvitationEmail(data));
      expect(html).toContain('<strong>Recepcionista</strong>');
      expect(html).not.toContain('RECEPTIONIST');
    });

    it('re-invites after the previous invitation expired by reusing the row (staffId is unique)', async () => {
      invitations.push(invitationRow({ status: 'EXPIRED', expiresAt: subDays(new Date(), 3) }));

      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({ success: true, invitationId: 'inv-1', message: 'Invitación enviada exitosamente' });
      expect(prismaMock.tenantInvitation.create).not.toHaveBeenCalled();
      expect(invitations).toHaveLength(1);
      expect(invitations[0].status).toBe('PENDING');
      expect(invitations[0].token).not.toBe('tok-existing');
      expect(invitations[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(mockSendEmail.mock.calls[0][0].data.inviteUrl).toContain(invitations[0].token);
    });

    it('re-invites after an expired invitation that is still marked PENDING', async () => {
      invitations.push(invitationRow({ expiresAt: subDays(new Date(), 1) }));

      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));

      expect(response.status).toBe(200);
      expect(invitations).toHaveLength(1);
      expect(invitations[0].token).not.toBe('tok-existing');
      expect(invitations[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('resends an active invitation keeping its link and extending it', async () => {
      invitations.push(invitationRow({ expiresAt: addDays(new Date(), 1) }));

      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Invitación reenviada exitosamente');
      expect(invitations).toHaveLength(1);
      expect(invitations[0].token).toBe('tok-existing');
      expect(invitations[0].expiresAt.getTime()).toBeGreaterThan(addDays(new Date(), 6).getTime());
      expect(mockSendEmail.mock.calls[0][0].data.inviteUrl).toContain('tok-existing');
    });

    it('answers in Spanish when the database still reports a unique conflict', async () => {
      prismaMock.tenantInvitation.upsert.mockRejectedValue(uniqueViolation());

      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toMatch(/^Ya existe una invitación para este miembro del personal/);
      expect(data.error).not.toMatch(/Unique constraint/);
    });

    it('returns 500 with a Spanish message when the email provider fails', async () => {
      mockSendEmail.mockResolvedValue({ success: false, error: 'Resend down' });

      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({ error: 'Error al enviar el email de invitación' });
    });

    it("refuses to invite another tenant's staff member", async () => {
      staffRows = [staffRow({ tenantId: 'tenant-2' })];

      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'No tienes permiso para invitar a este personal' });
      expect(invitations).toHaveLength(0);
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it.each([
      ['the staff member does not exist', () => { staffRows = []; }, 404, 'Personal no encontrado'],
      ['the staff member has no email', () => { staffRows = [staffRow({ email: null })]; }, 400, 'El personal no tiene email configurado'],
      ['the staff member already has an account', () => { staffRows = [staffRow({ userId: 'user-9' })]; }, 400, 'El personal ya tiene una cuenta vinculada'],
    ])('returns an error when %s', async (_label, arrange, status, error) => {
      arrange();

      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));

      expect(response.status).toBe(status);
      await expect(response.json()).resolves.toEqual({ error });
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('rejects a staffId that is not a UUID', async () => {
      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: 'staff-1' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details).toContainEqual(expect.objectContaining({ message: 'ID de personal inválido' }));
    });

    it('returns 403 when the caller lacks the staff:write permission', async () => {
      mockRequirePermission.mockRejectedValue(
        new Error("Access denied. You don't have permission to write staff.")
      );

      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({ error: 'No tienes permiso para enviar invitaciones' });
      expect(prismaMock.staff.findUnique).not.toHaveBeenCalled();
    });

    it('returns 401 without a session', async () => {
      mockRequirePermission.mockRejectedValue(new Error('No authenticated user'));

      const response = await sendInvitation(jsonPost('/api/invitations/send', { staffId: STAFF_ID }));

      expect(response.status).toBe(401);
    });

    // Plan staff limits are not enforced by /api/staff or the invitation
    // routes yet (docs/PENDIENTES.md, "Decisiones pendientes").
    it.todo('enforces the plan staff limit once the product decision is made');
  });

  describe('GET /api/invitations/validate', () => {
    it('returns the sanitized invitation details for a valid token', async () => {
      invitations.push(invitationRow());

      const response = await validateInvitation(validateRequest('tok-existing'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(prismaMock.tenantInvitation.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { token: 'tok-existing' } })
      );
      expect(data).toEqual({
        valid: true,
        invitation: {
          id: 'inv-1',
          email: 'ana@example.com',
          roleKey: 'RECEPTIONIST',
          expiresAt: invitations[0].expiresAt.toISOString(),
          tenant: { name: 'Clínica Norte', logo: null },
          staff: { name: 'Ana López', position: 'RECEPTIONIST' },
        },
      });
      expect(JSON.stringify(data)).not.toContain('tok-existing');
    });

    it('rejects an expired invitation and marks it EXPIRED', async () => {
      invitations.push(invitationRow({ expiresAt: subDays(new Date(), 1) }));

      const response = await validateInvitation(validateRequest('tok-existing'));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ valid: false, error: 'Esta invitación ha expirado' });
      expect(prismaMock.tenantInvitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'EXPIRED' },
      });
      expect(invitations[0].status).toBe('EXPIRED');
    });

    it.each([
      ['ACCEPTED', 'Esta invitación ya fue aceptada'],
      ['REVOKED', 'Esta invitación fue revocada'],
      ['EXPIRED', 'Esta invitación ha expirado'],
    ])('rejects a %s invitation', async (status, error) => {
      invitations.push(invitationRow({ status }));

      const response = await validateInvitation(validateRequest('tok-existing'));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ valid: false, error });
    });

    it('rejects an unknown token and points to the latest email', async () => {
      const response = await validateInvitation(validateRequest('nope'));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.valid).toBe(false);
      expect(data.error).toMatch(/^Invitación no encontrada/);
    });

    it('requires a token', async () => {
      const response = await validateInvitation(validateRequest());

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: 'Token de invitación requerido' });
    });
  });

  describe('POST /api/invitations/accept', () => {
    const invitee = (overrides: Record<string, unknown> = {}) => ({
      id: 'user-ana',
      email: 'ana@example.com',
      tenantId: null,
      ...overrides,
    });

    beforeEach(() => {
      invitations.push(invitationRow());
      prismaMock.user.findUnique.mockImplementation((async ({ where }: any) =>
        where.id === 'user-ana' ? { id: 'user-ana', tenantId: null } : null) as any);
    });

    it('links the user to the inviting tenant and staff record in one transaction', async () => {
      mockGetUser.mockResolvedValue(invitee({ email: 'ANA@example.com' }));

      const response = await acceptInvitation(jsonPost('/api/invitations/accept', { token: 'tok-existing' }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: '¡Invitación aceptada! Ahora tienes acceso al sistema.',
        staffId: STAFF_ID,
        tenantName: 'Clínica Norte',
      });
      expect(mockGetUser).toHaveBeenCalledWith({ autoAcceptInvitations: false });
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-ana' },
        data: { tenantId: TENANT.id },
      });
      expect(prismaMock.staff.update).toHaveBeenCalledWith({
        where: { id: STAFF_ID },
        data: { userId: 'user-ana' },
      });
      expect(invitations[0].status).toBe('ACCEPTED');
    });

    it('returns 403 EMAIL_MISMATCH with the invited email when signed in with another account', async () => {
      mockGetUser.mockResolvedValue(invitee({ id: 'user-other', email: 'otro@example.com' }));

      const response = await acceptInvitation(jsonPost('/api/invitations/accept', { token: 'tok-existing' }));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        code: 'EMAIL_MISMATCH',
        invitationEmail: 'ana@example.com',
        error: 'Esta invitación es para ana@example.com. Debes iniciar sesión con ese email.',
      });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(invitations[0].status).toBe('PENDING');
    });

    it('returns 409 USER_IN_OTHER_TENANT when the user already has a clinic', async () => {
      mockGetUser.mockResolvedValue(invitee({ tenantId: 'tenant-own' }));
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-ana', tenantId: 'tenant-own' } as any);

      const response = await acceptInvitation(jsonPost('/api/invitations/accept', { token: 'tok-existing' }));
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data).toMatchObject({ success: false, code: 'USER_IN_OTHER_TENANT' });
      expect(data.error).toMatch(/Tu cuenta ya pertenece a otra clínica/);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(invitations[0].status).toBe('PENDING');
    });

    it('returns 409 STAFF_ALREADY_LINKED when the staff record belongs to someone else', async () => {
      staffRows = [staffRow({ userId: 'someone-else' })];
      mockGetUser.mockResolvedValue(invitee());

      const response = await acceptInvitation(jsonPost('/api/invitations/accept', { token: 'tok-existing' }));

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({ success: false, code: 'STAFF_ALREADY_LINKED' });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('is idempotent when the staff record is already linked to this user', async () => {
      staffRows = [staffRow({ userId: 'user-ana' })];
      mockGetUser.mockResolvedValue(invitee({ tenantId: TENANT.id }));

      const response = await acceptInvitation(jsonPost('/api/invitations/accept', { token: 'tok-existing' }));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ success: true, staffId: STAFF_ID });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('reports success when the invitation was already accepted and the user has a clinic', async () => {
      invitations[0].status = 'ACCEPTED';
      mockGetUser.mockResolvedValue(invitee({ tenantId: TENANT.id }));

      const response = await acceptInvitation(jsonPost('/api/invitations/accept', { token: 'tok-existing' }));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        success: true,
        alreadyAccepted: true,
        tenantName: 'Clínica Norte',
      });
      expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: TENANT.id } })
      );
    });

    it('rejects an already accepted invitation for a user without a clinic', async () => {
      invitations[0].status = 'ACCEPTED';
      mockGetUser.mockResolvedValue(invitee());

      const response = await acceptInvitation(jsonPost('/api/invitations/accept', { token: 'tok-existing' }));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ success: false, error: 'Esta invitación ya fue aceptada' });
    });

    it('rejects an expired invitation', async () => {
      invitations[0].expiresAt = subDays(new Date(), 1);
      mockGetUser.mockResolvedValue(invitee());

      const response = await acceptInvitation(jsonPost('/api/invitations/accept', { token: 'tok-existing' }));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ success: false, error: 'Esta invitación ha expirado' });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('rejects an unknown token', async () => {
      mockGetUser.mockResolvedValue(invitee());

      const response = await acceptInvitation(jsonPost('/api/invitations/accept', { token: 'nope' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/^Invitación no encontrada/);
    });

    it('returns 401 without a session', async () => {
      mockGetUser.mockRejectedValue(new Error('No authenticated user'));

      const response = await acceptInvitation(jsonPost('/api/invitations/accept', { token: 'tok-existing' }));

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toEqual({ error: 'Debes iniciar sesión para aceptar la invitación' });
    });
  });
});
