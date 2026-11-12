/**
 * @jest-environment node
 *
 * Unit tests for the low-stock alert emails.
 *
 * The previous version mocked prisma.tenant.findUnique to return
 * `staff[].user.email` and asserted a `staff.role.permissions` filter, the
 * same shape as the code. Neither relation exists on Staff, so in production
 * Prisma rejected the query and no alert was ever sent while the tests
 * passed. Here every query is checked against the real Prisma datamodel
 * (DMMF) before the fake answers it, so an impossible field fails the test.
 */

// The global setup stubs @prisma/client; the real module exposes the DMMF
// without creating a client or opening a connection.
jest.mock('@prisma/client', () => jest.requireActual('@prisma/client'));

import { Prisma } from '@prisma/client';

type Args = Record<string, unknown>;

const LOGICAL_KEYS = new Set(['AND', 'OR', 'NOT']);

function modelFields(modelName: string) {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName);
  if (!model) throw new Error(`Unknown model ${modelName}`);
  return new Map(model.fields.map((f) => [f.name, f]));
}

/** Throws when `where` names a field that does not exist on the model */
function assertWhere(modelName: string, where: unknown, path: string): void {
  if (!where || typeof where !== 'object') return;
  const fields = modelFields(modelName);
  for (const [key, value] of Object.entries(where as Args)) {
    if (LOGICAL_KEYS.has(key)) {
      for (const clause of Array.isArray(value) ? value : [value]) {
        assertWhere(modelName, clause, `${path}.${key}`);
      }
      continue;
    }
    const field = fields.get(key);
    if (!field) throw new Error(`${path}: ${modelName} has no field "${key}"`);
    if (field.kind === 'object' && value && typeof value === 'object') {
      // Relation filters: { some/every/none/is/isNot: {...} } or a direct filter
      for (const [op, nested] of Object.entries(value as Args)) {
        const target = ['some', 'every', 'none', 'is', 'isNot'].includes(op) ? nested : { [op]: nested };
        assertWhere(field.type, target, `${path}.${key}`);
      }
    }
  }
}

/** Throws when `select` names a field that does not exist on the model */
function assertSelect(modelName: string, select: unknown, path: string): void {
  if (!select || typeof select !== 'object') return;
  const fields = modelFields(modelName);
  for (const [key, value] of Object.entries(select as Args)) {
    const field = fields.get(key);
    if (!field) throw new Error(`${path}: ${modelName} has no field "${key}"`);
    if (field.kind === 'object' && value && typeof value === 'object') {
      const nested = value as Args;
      assertWhere(field.type, nested.where, `${path}.${key}.where`);
      assertSelect(field.type, nested.select, `${path}.${key}.select`);
    }
  }
}

interface StaffRow {
  name: string;
  position: string;
  email: string | null;
  isActive: boolean;
}

function staffMatches(row: StaffRow, where: Args = {}): boolean {
  return Object.entries(where).every(([key, condition]) => {
    if (key === 'OR') return (condition as Args[]).some((c) => staffMatches(row, c));
    if (key === 'AND') return (condition as Args[]).every((c) => staffMatches(row, c));
    const value = row[key as keyof StaffRow];
    if (condition && typeof condition === 'object') {
      const c = condition as Args;
      if ('in' in c && !(c.in as unknown[]).includes(value)) return false;
      if ('not' in c && value === c.not) return false;
      if ('equals' in c && value !== c.equals) return false;
      return true;
    }
    return value === condition;
  });
}

const tenantStaff: { rows: StaffRow[] } = { rows: [] };
const preferences: { lowStockAlert?: boolean } = {};

jest.mock('@/lib/inventory', () => ({
  getLowStockItems: jest.fn(),
}));

jest.mock('@/lib/webhooks', () => ({
  triggerWebhookEvent: jest.fn(),
}));

jest.mock('@/lib/email/email-service', () => ({
  sendLowStockAlert: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(async (args: Args) => {
        assertWhere('Tenant', args.where, 'tenant.findUnique.where');
        assertSelect('Tenant', args.select, 'tenant.findUnique.select');
        const select = args.select as { staff?: { where?: Args; select?: Args } };
        if ((args.where as Args).id === 'missing') return null;
        return {
          id: (args.where as Args).id,
          name: 'Clínica Veterinaria Central',
          staff: tenantStaff.rows
            .filter((row) => staffMatches(row, select.staff?.where))
            .map((row) =>
              Object.fromEntries(
                Object.keys(select.staff?.select ?? {}).map((k) => [k, row[k as keyof StaffRow]])
              )
            ),
        };
      }),
      findMany: jest.fn(async (args: Args) => {
        assertWhere('Tenant', args.where, 'tenant.findMany.where');
        return [
          { id: 'tenant-1', name: 'Clinic 1' },
          { id: 'tenant-2', name: 'Clinic 2' },
        ];
      }),
    },
    tenantSettings: {
      findUnique: jest.fn(async () =>
        preferences.lowStockAlert === undefined
          ? null
          : { notificationPreferences: { lowStockAlert: preferences.lowStockAlert } }
      ),
    },
  },
}));

import { getLowStockItems } from '@/lib/inventory';
import { sendLowStockAlert } from '@/lib/email/email-service';
import {
  checkAndSendLowStockAlerts,
  checkAllTenantsInventory,
  sendLowStockAlertNow,
} from '../inventory-alerts';

const mockGetLowStockItems = getLowStockItems as jest.Mock;
const mockSendLowStockAlert = sendLowStockAlert as jest.Mock;

const LOW_ITEMS = [
  { id: '1', name: 'Vacuna Rabia', quantity: 5, minStock: 10, measure: 'dosis', category: 'Vacunas', locationId: null },
  { id: '2', name: 'Antibiótico X', quantity: 2, minStock: 15, measure: null, category: null, locationId: null },
];

beforeEach(() => {
  jest.clearAllMocks();
  delete preferences.lowStockAlert;
  tenantStaff.rows = [
    { name: 'Dr. López', position: 'Administrador', email: 'admin@clinic.test', isActive: true },
    { name: 'Dra. García', position: 'MANAGER', email: 'manager@clinic.test', isActive: true },
    { name: 'Dr. Ruiz', position: 'VETERINARIAN', email: 'vet@clinic.test', isActive: true },
    { name: 'Ex gerente', position: 'MANAGER', email: 'former@clinic.test', isActive: false },
    { name: 'Gerente sin correo', position: 'MANAGER', email: null, isActive: true },
  ];
  mockGetLowStockItems.mockResolvedValue(LOW_ITEMS);
  mockSendLowStockAlert.mockResolvedValue({ success: true, messageId: 'msg-1' });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('checkAndSendLowStockAlerts', () => {
  it('emails the active admins and managers of the clinic', async () => {
    const result = await checkAndSendLowStockAlerts('tenant-123');

    expect(result).toEqual({ success: true, itemsChecked: 2, alertsSent: 1, errors: [] });
    expect(mockSendLowStockAlert).toHaveBeenCalledTimes(1);
    const email = mockSendLowStockAlert.mock.calls[0][0];
    expect([email.to.email, ...email.bcc.map((r: { email: string }) => r.email)].sort()).toEqual([
      'admin@clinic.test',
      'manager@clinic.test',
    ]);
  });

  it('includes the low stock items in the email', async () => {
    await checkAndSendLowStockAlerts('tenant-123');

    expect(mockSendLowStockAlert.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        clinicName: 'Clínica Veterinaria Central',
        totalLowStockItems: 2,
        items: [
          { productName: 'Vacuna Rabia', currentStock: 5, minimumStock: 10, unit: 'dosis', category: 'Vacunas' },
          { productName: 'Antibiótico X', currentStock: 2, minimumStock: 15, unit: 'unidades', category: undefined },
        ],
      })
    );
  });

  it('does not email when the clinic turned off low stock alerts', async () => {
    preferences.lowStockAlert = false;

    const result = await checkAndSendLowStockAlerts('tenant-123');

    expect(mockSendLowStockAlert).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.alertsSent).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it('does nothing when no item is low', async () => {
    mockGetLowStockItems.mockResolvedValue([]);

    const result = await checkAndSendLowStockAlerts('tenant-123');

    expect(result).toEqual({ success: true, itemsChecked: 0, alertsSent: 0, errors: [] });
    expect(mockSendLowStockAlert).not.toHaveBeenCalled();
  });

  it('reports a clinic without admin or manager emails', async () => {
    tenantStaff.rows = [{ name: 'Dr. Ruiz', position: 'VETERINARIAN', email: 'vet@clinic.test', isActive: true }];

    const result = await checkAndSendLowStockAlerts('tenant-123');

    expect(mockSendLowStockAlert).not.toHaveBeenCalled();
    expect(result.alertsSent).toBe(0);
    expect(result.errors).toContain('No staff emails configured');
  });

  it('fails when the tenant does not exist', async () => {
    const result = await checkAndSendLowStockAlerts('missing');

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('not found');
  });

  it('surfaces a failed send', async () => {
    mockSendLowStockAlert.mockResolvedValue({ success: false, error: 'Resend down' });

    const result = await checkAndSendLowStockAlerts('tenant-123');

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(['Resend down']);
  });
});

describe('checkAllTenantsInventory', () => {
  it('sends one alert per tenant with low stock', async () => {
    const result = await checkAllTenantsInventory();

    expect(result).toEqual({ success: true, tenantsChecked: 2, totalAlertsSent: 2, errors: {} });
  });

  it('records per-tenant failures and keeps going', async () => {
    mockGetLowStockItems
      .mockRejectedValueOnce(new Error('Database error'))
      .mockResolvedValueOnce(LOW_ITEMS);

    const result = await checkAllTenantsInventory();

    expect(result.success).toBe(false);
    expect(result.errors['tenant-1']).toEqual(['Database error']);
    expect(result.totalAlertsSent).toBe(1);
  });
});

describe('sendLowStockAlertNow', () => {
  it('reports the alert that was sent', async () => {
    const result = await sendLowStockAlertNow('tenant-123');

    expect(result).toEqual({ success: true, message: 'Alert sent for 2 low stock items', itemsCount: 2 });
  });

  it('returns the send error', async () => {
    mockSendLowStockAlert.mockResolvedValue({ success: false, error: 'SMTP error' });

    const result = await sendLowStockAlertNow('tenant-123');

    expect(result).toEqual({ success: false, message: 'SMTP error' });
  });
});
