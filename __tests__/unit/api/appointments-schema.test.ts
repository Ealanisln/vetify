import { appointmentSchema } from '@/lib/validations/appointments-api';

describe('POST /api/appointments — appointmentSchema', () => {
  const validBase = {
    dateTime: '2026-05-01T15:00:00.000Z',
    duration: 30,
    customerId: 'cust_1',
    petId: 'pet_1',
    reason: 'Consulta general',
  };

  it('accepts null staffId and null locationId (regression: VETIFY-NEXTJS-1M)', () => {
    const result = appointmentSchema.safeParse({
      ...validBase,
      staffId: null,
      locationId: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.staffId).toBeUndefined();
      expect(result.data.locationId).toBeUndefined();
    }
  });

  it('accepts empty-string staffId and locationId', () => {
    const result = appointmentSchema.safeParse({
      ...validBase,
      staffId: '',
      locationId: '',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.staffId).toBeUndefined();
      expect(result.data.locationId).toBeUndefined();
    }
  });

  it('preserves non-empty staffId and locationId', () => {
    const result = appointmentSchema.safeParse({
      ...validBase,
      staffId: 'staff_1',
      locationId: 'loc_1',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.staffId).toBe('staff_1');
      expect(result.data.locationId).toBe('loc_1');
    }
  });

  it('rejects invalid dateTime', () => {
    const result = appointmentSchema.safeParse({
      ...validBase,
      dateTime: 'not-a-date',
    });

    expect(result.success).toBe(false);
  });
});
