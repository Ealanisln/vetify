import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VaccinationForm } from '@/components/medical/VaccinationForm';
import { vaccinationSchema } from '@/lib/medical-validation';

jest.mock('@/components/medical/InlineVeterinarianCreator', () => ({
  InlineVeterinarianCreator: () => null,
}));

global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
global.alert = jest.fn();

const staff = [{ id: 'vet-1', name: 'Dr. García', position: 'VETERINARIAN', licenseNumber: null }];

function postedBody() {
  const call = mockFetch.mock.calls.find(([url]) => url === '/api/medical/vaccinations');
  return call ? JSON.parse((call[1] as RequestInit).body as string) : null;
}

describe('VaccinationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation(async (url) =>
      (url === '/api/medical/vaccinations'
        ? { ok: true, status: 201, json: async () => ({ id: 'vac-1' }) }
        : { ok: true, json: async () => staff }) as Response
    );
  });

  it('submits when "Etapa de vacunación" is left empty', async () => {
    const onSuccess = jest.fn();
    render(<VaccinationForm petId="pet-1" tenantId="tenant-1" onSuccess={onSuccess} />);

    await screen.findByRole('option', { name: /Dr. García/ });
    fireEvent.change(screen.getByLabelText(/Tipo\/Marca de vacuna/), { target: { value: 'Nobivac Rabia' } });
    fireEvent.change(screen.getByLabelText(/Número de lote/), { target: { value: 'LOT-1' } });
    fireEvent.change(screen.getByLabelText(/Fecha de aplicación/), { target: { value: '2026-11-12' } });
    fireEvent.change(screen.getByLabelText(/Próxima vacuna/), { target: { value: '2027-11-12' } });
    fireEvent.change(screen.getByLabelText(/Selecciona el veterinario/), { target: { value: 'vet-1' } });
    expect((screen.getByLabelText(/Etapa de vacunación/) as HTMLSelectElement).value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: /Registrar Vacuna/ }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    const body = postedBody();
    expect(body.vaccine_brand).toBe('Nobivac Rabia');
    expect(body.vaccine_stage).toBeUndefined();
  });

  it('shows the field error when the stage is invalid instead of failing silently', async () => {
    render(<VaccinationForm petId="pet-1" tenantId="tenant-1" />);

    await screen.findByRole('option', { name: /Dr. García/ });
    const select = screen.getByLabelText(/Etapa de vacunación/) as HTMLSelectElement;
    // Simulate a stale/unknown option value
    const bogus = document.createElement('option');
    bogus.value = 'NOT_A_STAGE';
    select.appendChild(bogus);
    fireEvent.change(select, { target: { value: 'NOT_A_STAGE' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrar Vacuna/ }));

    expect(await screen.findByText('Selecciona una etapa válida')).toBeInTheDocument();
    expect(postedBody()).toBeNull();
  });
});

describe('vaccinationSchema', () => {
  const base = {
    vaccine_type: 'VACCINATION',
    vaccine_brand: 'Nobivac',
    batch_number: 'LOT-1',
    administered_date: new Date('2026-11-12T00:00:00Z'),
    next_due_date: new Date('2027-11-12T00:00:00Z'),
    veterinarian_id: 'vet-1',
  };

  it('treats an empty stage as not provided', () => {
    const parsed = vaccinationSchema.parse({ ...base, vaccine_stage: '' });
    expect(parsed.vaccine_stage).toBeUndefined();
  });
});
