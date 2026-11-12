import { render, screen, waitFor } from '@testing-library/react';
import { ConsultationForm } from '@/components/medical/ConsultationForm';

jest.mock('@/components/medical/InlineVeterinarianCreator', () => ({
  InlineVeterinarianCreator: () => null,
}));

global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] } as Response);

describe('ConsultationForm', () => {
  it('does not offer "Próxima cita", which was validated and then discarded', async () => {
    render(<ConsultationForm petId="pet-1" tenantId="tenant-1" />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByLabelText(/Próxima cita/)).not.toBeInTheDocument();
  });
});
