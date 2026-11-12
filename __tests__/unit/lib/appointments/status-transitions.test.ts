import {
  ALLOWED_STATUS_TRANSITIONS,
  evaluateStatusChange,
} from '@/lib/appointments/status-transitions';
import { appointmentStatus } from '@/lib/validations/appointments';

describe('appointment status transitions', () => {
  it('defines transitions for every status', () => {
    expect(Object.keys(ALLOWED_STATUS_TRANSITIONS).sort()).toEqual([...appointmentStatus].sort());
  });

  it.each([
    ['SCHEDULED', 'CONFIRMED'],
    ['SCHEDULED', 'IN_PROGRESS'],
    ['SCHEDULED', 'CANCELLED_CLINIC'],
    ['CONFIRMED', 'CHECKED_IN'],
    ['CONFIRMED', 'NO_SHOW'],
    ['CHECKED_IN', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'COMPLETED'],
    ['IN_PROGRESS', 'CANCELLED_CLINIC'],
  ] as const)('allows %s -> %s', (from, to) => {
    expect(evaluateStatusChange(from, to)).toEqual({ type: 'allowed' });
  });

  it.each([
    ['COMPLETED', 'CANCELLED_CLINIC'],
    ['COMPLETED', 'CANCELLED_CLIENT'],
    ['COMPLETED', 'SCHEDULED'],
    ['CANCELLED_CLINIC', 'SCHEDULED'],
    ['CANCELLED_CLIENT', 'COMPLETED'],
    ['NO_SHOW', 'CANCELLED_CLINIC'],
    ['IN_PROGRESS', 'SCHEDULED'],
    ['CHECKED_IN', 'NO_SHOW'],
  ] as const)('rejects %s -> %s with a Spanish message', (from, to) => {
    const result = evaluateStatusChange(from, to);
    expect(result.type).toBe('invalid');
    expect(result.type === 'invalid' && result.message).toMatch(/^No se puede/);
  });

  it('explains that a completed appointment cannot be cancelled', () => {
    const result = evaluateStatusChange('COMPLETED', 'CANCELLED_CLINIC');
    expect(result).toEqual({
      type: 'invalid',
      message: 'No se puede cancelar una cita con estado "Completada".',
    });
  });

  it('treats the same status as unchanged', () => {
    expect(evaluateStatusChange('CONFIRMED', 'CONFIRMED')).toEqual({ type: 'unchanged' });
  });

  it('treats re-cancelling an already cancelled appointment as unchanged, whatever the variant', () => {
    expect(evaluateStatusChange('CANCELLED_CLINIC', 'CANCELLED_CLINIC')).toEqual({ type: 'unchanged' });
    expect(evaluateStatusChange('CANCELLED_CLIENT', 'CANCELLED_CLINIC')).toEqual({ type: 'unchanged' });
    expect(evaluateStatusChange('CANCELLED_CLINIC', 'CANCELLED_CLIENT')).toEqual({ type: 'unchanged' });
  });
});
