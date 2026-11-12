import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BusinessHoursSettings } from '@/components/settings/BusinessHoursSettings';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const day = (dayOfWeek: number, overrides: Record<string, unknown> = {}) => ({
  id: `hours-${dayOfWeek}`,
  dayOfWeek,
  isWorkingDay: dayOfWeek >= 1 && dayOfWeek <= 6,
  startTime: '08:00',
  endTime: '18:00',
  lunchStart: '13:00',
  lunchEnd: '14:00',
  slotDuration: 15,
  ...overrides,
});

const settings = (overrides: Record<string, unknown> = {}) => ({
  id: 'settings-1',
  defaultStartTime: '08:00',
  defaultEndTime: '18:00',
  defaultLunchStart: '13:00',
  defaultLunchEnd: '14:00',
  defaultSlotDuration: 15,
  businessHours: Array.from({ length: 7 }, (_, i) => day(i)),
  ...overrides,
});

const jsonResponse = (body: unknown, ok = true) =>
  Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);

function mockGetThenPut(initial = settings()) {
  mockFetch.mockImplementation((_url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') {
      return jsonResponse({ success: true, data: JSON.parse(init.body as string) });
    }
    return jsonResponse({ success: true, data: initial });
  });
}

function putBody() {
  const call = mockFetch.mock.calls.find(([, init]) => init?.method === 'PUT');
  return JSON.parse(call![1].body as string);
}

async function renderLoaded() {
  render(<BusinessHoursSettings tenantId="tenant-1" />);
  await screen.findByTestId('business-hours-settings');
}

describe('BusinessHoursSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('"Sin comida"', () => {
    it('sends null for a day whose lunch is removed', async () => {
      mockGetThenPut();
      await renderLoaded();

      fireEvent.change(screen.getByTestId('lunch-start-monday'), { target: { value: '' } });
      fireEvent.click(screen.getByTestId('save-business-hours'));

      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      const monday = putBody().businessHours.find((d: { dayOfWeek: number }) => d.dayOfWeek === 1);
      expect(monday.lunchStart).toBeNull();
      expect(monday.lunchEnd).toBeNull();
    });

    it('sends null for removed default lunch', async () => {
      mockGetThenPut();
      await renderLoaded();

      fireEvent.change(screen.getByTestId('default-lunch-start'), { target: { value: '' } });
      fireEvent.click(screen.getByTestId('save-business-hours'));

      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      expect(putBody().defaultLunchStart).toBeNull();
      expect(putBody().defaultLunchEnd).toBeNull();
    });
  });
});
