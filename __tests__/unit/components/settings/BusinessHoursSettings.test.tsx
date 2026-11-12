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

  describe('defaults', () => {
    it('saving a new default duration updates every day that was not customized', async () => {
      mockGetThenPut(settings({
        businessHours: Array.from({ length: 7 }, (_, i) => day(i, i === 5 ? { slotDuration: 60 } : {})),
      }));
      await renderLoaded();

      fireEvent.change(screen.getByTestId('default-slot-duration'), { target: { value: '30' } });
      fireEvent.click(screen.getByTestId('save-business-hours'));

      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      const durations = putBody().businessHours.map((d: { slotDuration: number }) => d.slotDuration);
      expect(putBody().defaultSlotDuration).toBe(30);
      expect(durations).toEqual([30, 30, 30, 30, 30, 60, 30]);
    });

    it('shows the new default opening time on days that follow the default', async () => {
      mockGetThenPut();
      await renderLoaded();

      fireEvent.change(screen.getByTestId('default-open-time'), { target: { value: '09:00' } });

      expect(screen.getByTestId('open-time-monday')).toHaveValue('09:00');
    });
  });

  describe('validation', () => {
    it('shows an inline message and blocks saving when closing is before opening', async () => {
      mockGetThenPut();
      await renderLoaded();

      fireEvent.change(screen.getByTestId('close-time-monday'), { target: { value: '07:00' } });

      expect(screen.getByText('La hora de cierre debe ser posterior a la de apertura')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('save-business-hours'));

      expect(mockFetch.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false);
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Revisa'));
    });

    it('asks for the lunch end when only the start is set', async () => {
      mockGetThenPut(settings({
        businessHours: Array.from({ length: 7 }, (_, i) => day(i, { lunchStart: null, lunchEnd: null })),
      }));
      await renderLoaded();

      fireEvent.change(screen.getByTestId('lunch-start-monday'), { target: { value: '13:00' } });

      expect(screen.getByText('Indica el fin de la comida')).toBeInTheDocument();
    });

    it('shows server validation details in the error toast', async () => {
      mockFetch.mockImplementation((_url: string, init?: RequestInit) => {
        if (init?.method === 'PUT') {
          return jsonResponse({
            success: false,
            error: 'Datos inválidos',
            details: [{ path: ['businessHours', 2, 'lunchStart'], message: 'La comida debe quedar dentro del horario de atención' }],
          }, false);
        }
        return jsonResponse({ success: true, data: settings() });
      });
      await renderLoaded();

      fireEvent.change(screen.getByTestId('open-time-tuesday'), { target: { value: '09:00' } });
      fireEvent.click(screen.getByTestId('save-business-hours'));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
        'Martes: La comida debe quedar dentro del horario de atención'
      ));
    });
  });

  describe('load error', () => {
    it('offers a retry that reloads the settings', async () => {
      mockFetch
        .mockImplementationOnce(() => jsonResponse({ success: false, error: 'boom' }, false))
        .mockImplementation(() => jsonResponse({ success: true, data: settings() }));

      render(<BusinessHoursSettings tenantId="tenant-1" />);
      fireEvent.click(await screen.findByRole('button', { name: /reintentar/i }));

      expect(await screen.findByTestId('business-hours-settings')).toBeInTheDocument();
    });
  });
});
