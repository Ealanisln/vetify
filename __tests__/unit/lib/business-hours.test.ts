import { getScheduleErrors, timeToMinutes } from '@/lib/business-hours';

const schedule = (overrides: Record<string, string | null> = {}) => ({
  startTime: '08:00',
  endTime: '18:00',
  lunchStart: '13:00' as string | null,
  lunchEnd: '14:00' as string | null,
  ...overrides,
});

describe('timeToMinutes', () => {
  it.each([
    ['00:00', 0],
    ['8:00', 480],
    ['08:30', 510],
    ['23:59', 1439],
  ])('parses %s as %d', (time, minutes) => {
    expect(timeToMinutes(time)).toBe(minutes);
  });
});

describe('getScheduleErrors', () => {
  it('accepts a normal day with lunch', () => {
    expect(getScheduleErrors(schedule())).toEqual([]);
  });

  it('accepts a day without lunch', () => {
    expect(getScheduleErrors(schedule({ lunchStart: null, lunchEnd: null }))).toEqual([]);
  });

  it('compares times numerically, not as strings', () => {
    expect(getScheduleErrors(schedule({ startTime: '8:00', endTime: '10:00', lunchStart: null, lunchEnd: null }))).toEqual([]);
  });

  it('rejects closing at or before opening', () => {
    expect(getScheduleErrors(schedule({ startTime: '18:00', endTime: '18:00' }))).toContainEqual({
      field: 'endTime',
      message: 'La hora de cierre debe ser posterior a la de apertura',
    });
  });

  it('rejects lunch start without lunch end', () => {
    expect(getScheduleErrors(schedule({ lunchEnd: null }))).toEqual([
      { field: 'lunchEnd', message: 'Indica el fin de la comida' },
    ]);
  });

  it('rejects lunch end without lunch start', () => {
    expect(getScheduleErrors(schedule({ lunchStart: null }))).toEqual([
      { field: 'lunchStart', message: 'Indica el inicio de la comida' },
    ]);
  });

  it('rejects lunch end at or before lunch start', () => {
    expect(getScheduleErrors(schedule({ lunchStart: '14:00', lunchEnd: '13:00' }))).toContainEqual({
      field: 'lunchEnd',
      message: 'El fin de la comida debe ser posterior al inicio',
    });
  });

  it.each([
    ['starts before opening', { lunchStart: '07:00', lunchEnd: '09:00' }],
    ['ends after closing', { lunchStart: '17:00', lunchEnd: '19:00' }],
  ])('rejects lunch that %s', (_label, overrides) => {
    expect(getScheduleErrors(schedule(overrides))).toContainEqual({
      field: 'lunchStart',
      message: 'La comida debe quedar dentro del horario de atención',
    });
  });
});
