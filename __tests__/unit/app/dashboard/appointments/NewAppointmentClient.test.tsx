import { render, screen } from '@testing-library/react';
import NewAppointmentClient from '@/app/dashboard/appointments/new/NewAppointmentClient';

let searchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => searchParams,
}));

jest.mock('@/hooks/useAppointments', () => ({
  useAppointments: () => ({ createAppointment: jest.fn() }),
}));

// The real form (with its slot validation) is reused; only its props matter here
const formProps = jest.fn();
jest.mock('@/components/appointments/AppointmentForm', () => ({
  AppointmentForm: (props: { initialData?: Record<string, unknown> }) => {
    formProps(props);
    return <div data-testid="appointment-form" />;
  },
}));

const customers = [{ id: 'customer-1', name: 'Ana López', email: null, phone: null }];
const pets = [{ id: 'pet-1', name: 'Firulais', species: 'DOG', breed: null, customerId: 'customer-1' }];

describe('NewAppointmentClient', () => {
  beforeEach(() => formProps.mockClear());

  it('prefills customer, pet and the suggested reason from the URL (follow-up from a medical record)', () => {
    searchParams = new URLSearchParams({
      customerId: 'customer-1',
      petId: 'pet-1',
      reason: 'Seguimiento: Control rutinario',
    });

    render(<NewAppointmentClient customers={customers} pets={pets} staff={[]} />);

    expect(formProps).toHaveBeenLastCalledWith(
      expect.objectContaining({
        initialData: { customerId: 'customer-1', petId: 'pet-1', reason: 'Seguimiento: Control rutinario' },
      })
    );
    // No time is prefilled: the user still has to pick a slot
    expect(formProps.mock.lastCall[0].initialData).not.toHaveProperty('dateTime');
    expect(screen.getByText(/Creando cita para Ana López/)).toBeInTheDocument();
  });

  it('keeps working without a reason', () => {
    searchParams = new URLSearchParams({ customerId: 'customer-1', petId: 'pet-1' });

    render(<NewAppointmentClient customers={customers} pets={pets} staff={[]} />);

    expect(formProps.mock.lastCall[0].initialData).toEqual({ customerId: 'customer-1', petId: 'pet-1' });
  });
});
