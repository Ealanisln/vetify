import { render, screen, fireEvent } from '@testing-library/react';
import { VitalSignsForm } from '@/components/medical/VitalSignsForm';

global.fetch = jest.fn();

describe('VitalSignsForm', () => {
  it('lets the browser accept a weight like 2.35 kg', () => {
    render(<VitalSignsForm petId="pet-1" tenantId="tenant-1" />);

    const weight = screen.getByLabelText(/Peso \(kg\)/) as HTMLInputElement;
    fireEvent.change(weight, { target: { value: '2.35' } });

    expect(weight.validity.stepMismatch).toBe(false);
  });

  it('shows Spanish messages when required numbers are empty', async () => {
    render(<VitalSignsForm petId="pet-1" tenantId="tenant-1" />);

    fireEvent.submit(screen.getByRole('button', { name: /Registrar Signos Vitales/ }).closest('form') as HTMLFormElement);

    expect(await screen.findByText('Ingresa el peso')).toBeInTheDocument();
    expect(screen.queryByText(/Expected number/)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('has dark-mode variants on the summary and secondary fields', () => {
    const { container } = render(<VitalSignsForm petId="pet-1" tenantId="tenant-1" />);
    fireEvent.change(screen.getByLabelText(/Peso \(kg\)/), { target: { value: '12' } });

    const summary = screen.getByText('Resumen de Signos Vitales').parentElement as HTMLElement;
    expect(summary.className).toContain('dark:bg-gray-900');
    expect(screen.getByLabelText(/Presión Arterial/).className).toContain('dark:border-gray-600');

    // No light-only gray text or borders left
    const lightOnly = Array.from(container.querySelectorAll('[class]')).filter((el) => {
      const cls = el.getAttribute('class') ?? '';
      return /(^|\s)(text-gray-(500|700|900)|border-gray-(200|300)|bg-gray-50)(\s|$)/.test(cls) && !cls.includes('dark:');
    });
    expect(lightOnly).toHaveLength(0);
  });
});
