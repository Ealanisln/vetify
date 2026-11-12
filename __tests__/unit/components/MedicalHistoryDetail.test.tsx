/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { prismaMock } from '../../mocks/prisma';
import { MedicalHistoryDetail } from '@/components/medical/MedicalHistoryDetail';

global.fetch = jest.fn();

const history = {
  id: 'history-1',
  tenantId: 'tenant-1',
  // 02:30 UTC on the 13th is still the 12th in the Americas
  visitDate: new Date('2026-11-13T02:30:00Z'),
  reasonForVisit: 'Control rutinario',
  diagnosis: 'Sano',
  treatment: null,
  notes: 'Línea 1\nLínea 2',
  staff: { id: 'staff-1', name: 'Dra. Ruiz' },
  pet: {
    id: 'pet-1',
    name: 'Firulais',
    species: 'dog',
    breed: 'Mestizo',
    weight: 12.5,
    weightUnit: 'kg',
    customer: { id: 'customer-1', name: 'Ana López', phone: '5512345678', email: null },
  },
  medicalOrder: {
    id: 'order-1',
    status: 'PENDING',
    prescriptions: [
      {
        id: 'rx-1',
        quantity: 2,
        dosage: '1 tableta',
        frequency: 'Cada 12 horas',
        duration: '7 días',
        instructions: 'Con alimento',
        product: { id: 'product-1', name: 'Amoxicilina 500 mg' },
      },
    ],
  },
};

describe('MedicalHistoryDetail', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.tenant.findUnique.mockResolvedValue({ countryCode: 'MX', tenantSettings: null } as any);
  });

  afterEach(() => errorSpy.mockRestore());

  it('loads the history directly (tenant-scoped) instead of fetching its own API', async () => {
    prismaMock.medicalHistory.findUniqueOrThrow.mockResolvedValue(history as any);

    render(await MedicalHistoryDetail({ tenantId: 'tenant-1', historyId: 'history-1' }));

    expect(fetch).not.toHaveBeenCalled();
    expect(prismaMock.medicalHistory.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'history-1', tenantId: 'tenant-1' } })
    );
    expect(screen.getByText('Firulais')).toBeInTheDocument();
    expect(screen.queryByText('Historia clínica no encontrada')).not.toBeInTheDocument();
  });

  it('shows the visit date in the clinic timezone, the product name and the staff', async () => {
    // A clinic in Bogotá (UTC-5) so the result differs from UTC and from the dev machine zone
    prismaMock.tenant.findUnique.mockResolvedValue({ countryCode: 'CO', tenantSettings: null } as any);
    prismaMock.medicalHistory.findUniqueOrThrow.mockResolvedValue(history as any);

    render(await MedicalHistoryDetail({ tenantId: 'tenant-1', historyId: 'history-1' }));

    expect(screen.getByText('12/11/2026 21:30')).toBeInTheDocument();
    expect(screen.getByText('Amoxicilina 500 mg')).toBeInTheDocument();
    expect(screen.getByText('Dra. Ruiz')).toBeInTheDocument();
  });

  it('links "Agendar seguimiento" to the appointment form with the customer, pet and a suggested reason', async () => {
    prismaMock.medicalHistory.findUniqueOrThrow.mockResolvedValue(history as any);

    render(await MedicalHistoryDetail({ tenantId: 'tenant-1', historyId: 'history-1' }));

    const link = screen.getByRole('link', { name: /Agendar seguimiento/ });
    const url = new URL(link.getAttribute('href') as string, 'http://localhost');
    expect(url.pathname).toBe('/dashboard/appointments/new');
    expect(url.searchParams.get('customerId')).toBe('customer-1');
    expect(url.searchParams.get('petId')).toBe('pet-1');
    expect(url.searchParams.get('reason')).toBe('Seguimiento: Control rutinario');
  });

  it('shows "no encontrada" when the history is not in the tenant', async () => {
    prismaMock.medicalHistory.findUniqueOrThrow.mockRejectedValue(new Error('No MedicalHistory found'));

    render(await MedicalHistoryDetail({ tenantId: 'tenant-1', historyId: 'other' }));

    expect(screen.getByText('Historia clínica no encontrada')).toBeInTheDocument();
  });
});
