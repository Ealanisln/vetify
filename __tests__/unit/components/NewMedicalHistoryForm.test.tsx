import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewMedicalHistoryForm } from '@/components/medical/NewMedicalHistoryForm';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, back: jest.fn() }),
}));

global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
global.alert = jest.fn();

const pet = {
  id: 'pet-1',
  name: 'Firulais',
  species: 'dog',
  customer: { id: 'customer-1', name: 'Ana López', phone: '5512345678' },
};

const product = {
  id: 'product-1',
  name: 'Amoxicilina 500 mg',
  presentation: 'Tabletas',
  quantity: '12',
  category: 'MEDICINE',
};

describe('NewMedicalHistoryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockImplementation(async (url) => {
      if (String(url).startsWith('/api/inventory')) {
        // Real /api/inventory shape: { items, total }; Decimal quantity arrives as a string
        return {
          ok: true,
          json: async () => ({ items: [product], total: 1 }),
        } as Response;
      }
      if (String(url).startsWith('/api/pets')) {
        // Real /api/pets shape
        return {
          ok: true,
          json: async () => ({ success: true, data: [pet], pagination: { page: 1, limit: 10, total: 1 } }),
        } as Response;
      }
      return { ok: true, status: 201, json: async () => ({ id: 'history-1' }) } as Response;
    });
  });

  async function selectPet() {
    fireEvent.change(screen.getByPlaceholderText(/Buscar mascota/), { target: { value: 'Firu' } });
    fireEvent.click(await screen.findByRole('button', { name: /Firulais/ }));
  }

  it('lists the pets returned by /api/pets and searches with the typed text', async () => {
    render(<NewMedicalHistoryForm tenantId="tenant-1" />);

    await selectPet();

    expect(String(mockFetch.mock.calls[0][0])).toContain('search=Firu');
    expect(screen.getByText(/Ana López/)).toBeInTheDocument();
  });

  it('does not send an empty productId for a typed medication', async () => {
    render(<NewMedicalHistoryForm tenantId="tenant-1" />);
    await selectPet();

    fireEvent.change(screen.getByPlaceholderText(/Control rutinario/), { target: { value: 'Revisión anual' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar Medicamento/ }));
    fireEvent.change(screen.getByPlaceholderText('Nombre del medicamento'), { target: { value: 'Amoxicilina' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar Consulta/ }));

    // Opens the saved record, where "Agendar seguimiento" lives
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard/medical-history/history-1'));
    const post = mockFetch.mock.calls.find(([url]) => url === '/api/medical-history');
    const body = JSON.parse((post?.[1] as RequestInit).body as string);
    expect(body.prescriptions[0].productName).toBe('Amoxicilina');
    expect(body.prescriptions[0]).not.toHaveProperty('productId');
  });

  describe('visit date', () => {
    function postedBody() {
      const post = mockFetch.mock.calls.find(([url]) => url === '/api/medical-history');
      return JSON.parse((post?.[1] as RequestInit).body as string);
    }

    it('is optional and empty by default, so the server uses the current clinic time', async () => {
      render(<NewMedicalHistoryForm tenantId="tenant-1" />);
      await selectPet();

      const visitDate = screen.getByLabelText(/Fecha y hora de consulta/i) as HTMLInputElement;
      expect(visitDate).not.toBeRequired();
      expect(visitDate.value).toBe('');
      expect(screen.getByText(/Si la dejas vacía se usa la fecha y hora actual/)).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/Control rutinario/), { target: { value: 'Revisión anual' } });
      fireEvent.click(screen.getByRole('button', { name: /Guardar Consulta/ }));

      await waitFor(() => expect(push).toHaveBeenCalled());
      expect(postedBody()).not.toHaveProperty('visitDate');
    });

    it('sends the date and time the user picked', async () => {
      render(<NewMedicalHistoryForm tenantId="tenant-1" />);
      await selectPet();

      fireEvent.change(screen.getByLabelText(/Fecha y hora de consulta/i), { target: { value: '2026-11-10T10:30' } });
      fireEvent.change(screen.getByPlaceholderText(/Control rutinario/), { target: { value: 'Revisión anual' } });
      fireEvent.click(screen.getByRole('button', { name: /Guardar Consulta/ }));

      await waitFor(() => expect(push).toHaveBeenCalled());
      expect(postedBody().visitDate).toBe('2026-11-10T10:30');
    });
  });

  describe('inventory product selector', () => {
    function postedBody() {
      const post = mockFetch.mock.calls.find(([url]) => url === '/api/medical-history');
      return JSON.parse((post?.[1] as RequestInit).body as string);
    }

    async function addPrescriptionAndType(text: string) {
      render(<NewMedicalHistoryForm tenantId="tenant-1" />);
      await selectPet();
      fireEvent.change(screen.getByPlaceholderText(/Control rutinario/), { target: { value: 'Revisión anual' } });
      fireEvent.click(screen.getByRole('button', { name: /Agregar Medicamento/ }));
      fireEvent.change(screen.getByPlaceholderText('Nombre del medicamento'), { target: { value: text } });
    }

    it('suggests clinic inventory products and links the chosen one by id', async () => {
      await addPrescriptionAndType('Amox');

      const option = await screen.findByRole('button', { name: /Amoxicilina 500 mg/ });
      const inventoryCall = mockFetch.mock.calls.find(([url]) => String(url).startsWith('/api/inventory'));
      expect(String(inventoryCall?.[0])).toContain('search=Amox');
      expect(option).toHaveTextContent('Existencia: 12');

      fireEvent.click(option);
      expect((screen.getByPlaceholderText('Nombre del medicamento') as HTMLInputElement).value).toBe('Amoxicilina 500 mg');
      expect(screen.getByText('Del inventario')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Guardar Consulta/ }));
      await waitFor(() => expect(push).toHaveBeenCalled());
      expect(postedBody().prescriptions[0]).toMatchObject({ productId: 'product-1', productName: 'Amoxicilina 500 mg' });
    });

    it('unlinks the product when the name is edited afterwards (free text again)', async () => {
      await addPrescriptionAndType('Amox');
      fireEvent.click(await screen.findByRole('button', { name: /Amoxicilina 500 mg/ }));

      fireEvent.change(screen.getByPlaceholderText('Nombre del medicamento'), { target: { value: 'Amoxicilina genérica' } });
      expect(screen.queryByText('Del inventario')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Guardar Consulta/ }));
      await waitFor(() => expect(push).toHaveBeenCalled());
      expect(postedBody().prescriptions[0]).not.toHaveProperty('productId');
      expect(postedBody().prescriptions[0].productName).toBe('Amoxicilina genérica');
    });
  });
});
