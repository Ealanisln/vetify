import {
  applyDefaultChange,
  buildDefaultWeek,
  completeWeek,
  defaultDayHours,
  getScheduleErrors,
  timeToMinutes,
} from '@/lib/business-hours';

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

describe('defaultDayHours', () => {
  it('opens Monday to Saturday 08:00-18:00 with lunch 13:00-14:00 and 15 min slots', () => {
    expect(defaultDayHours(1)).toEqual({
      dayOfWeek: 1,
      isWorkingDay: true,
      startTime: '08:00',
      endTime: '18:00',
      lunchStart: '13:00',
      lunchEnd: '14:00',
      slotDuration: 15,
    });
    expect(defaultDayHours(6).isWorkingDay).toBe(true);
  });

  it('closes Sunday', () => {
    expect(defaultDayHours(0).isWorkingDay).toBe(false);
  });

  it('uses the tenant defaults when given, including "no lunch"', () => {
    expect(defaultDayHours(2, {
      defaultStartTime: '09:00',
      defaultEndTime: '17:00',
      defaultLunchStart: null,
      defaultLunchEnd: null,
      defaultSlotDuration: 30,
    })).toEqual(expect.objectContaining({
      startTime: '09:00',
      endTime: '17:00',
      lunchStart: null,
      lunchEnd: null,
      slotDuration: 30,
    }));
  });
});

describe('buildDefaultWeek', () => {
  it('builds one row per day, Sunday first', () => {
    const week = buildDefaultWeek();
    expect(week.map(day => day.dayOfWeek)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(week.filter(day => day.isWorkingDay)).toHaveLength(6);
  });
});

describe('completeWeek', () => {
  it('keeps the first row per day and fills missing days with defaults', () => {
    const monday = { ...defaultDayHours(1), id: 'a', startTime: '10:00' };
    const mondayDuplicate = { ...defaultDayHours(1), id: 'b', startTime: '11:00' };

    const week = completeWeek([monday, mondayDuplicate], null);

    expect(week).toHaveLength(7);
    expect(week[1]).toBe(monday);
    expect(week[2]).toEqual(defaultDayHours(2));
  });
});

describe('applyDefaultChange', () => {
  const data = () => ({
    defaultStartTime: '08:00',
    defaultEndTime: '18:00',
    defaultLunchStart: '13:00' as string | null,
    defaultLunchEnd: '14:00' as string | null,
    defaultSlotDuration: 15,
    businessHours: buildDefaultWeek().map(day => (
      // Monday was customized by the owner
      day.dayOfWeek === 1 ? { ...day, startTime: '10:00', slotDuration: 45 } : day
    )) as Array<ReturnType<typeof defaultDayHours> & { slotDuration: number | null }>,
  });

  it('moves days still on the old default and leaves customized days alone', () => {
    const next = applyDefaultChange(data(), 'defaultSlotDuration', 30);

    expect(next.defaultSlotDuration).toBe(30);
    expect(next.businessHours[2].slotDuration).toBe(30);
    expect(next.businessHours[0].slotDuration).toBe(30); // closed days too, for when they reopen
    expect(next.businessHours[1].slotDuration).toBe(45);
  });

  it('treats a missing day slot duration as following the default', () => {
    const input = data();
    input.businessHours[3] = { ...input.businessHours[3], slotDuration: null };

    expect(applyDefaultChange(input, 'defaultSlotDuration', 20).businessHours[3].slotDuration).toBe(20);
  });

  it('applies opening time only to days not customized', () => {
    const next = applyDefaultChange(data(), 'defaultStartTime', '09:00');

    expect(next.businessHours[2].startTime).toBe('09:00');
    expect(next.businessHours[1].startTime).toBe('10:00');
  });

  it('removing the default lunch clears lunch on days that used it', () => {
    const input = data();
    input.businessHours[4] = { ...input.businessHours[4], lunchStart: '12:00', lunchEnd: '13:00' };

    const next = applyDefaultChange(input, 'defaultLunchStart', null);

    expect(next.defaultLunchStart).toBeNull();
    expect(next.defaultLunchEnd).toBeNull();
    expect(next.businessHours[2]).toEqual(expect.objectContaining({ lunchStart: null, lunchEnd: null }));
    expect(next.businessHours[4]).toEqual(expect.objectContaining({ lunchStart: '12:00', lunchEnd: '13:00' }));
  });

  it('keeps a day set to "Sin comida" when the default lunch moves', () => {
    const input = data();
    input.businessHours[2] = { ...input.businessHours[2], lunchStart: null, lunchEnd: null };

    const next = applyDefaultChange(input, 'defaultLunchStart', '12:00');

    expect(next.businessHours[2].lunchStart).toBeNull();
    expect(next.businessHours[3].lunchStart).toBe('12:00');
  });

  it('does not mutate its input', () => {
    const input = data();
    applyDefaultChange(input, 'defaultEndTime', '20:00');

    expect(input.defaultEndTime).toBe('18:00');
    expect(input.businessHours[2].endTime).toBe('18:00');
  });
});
