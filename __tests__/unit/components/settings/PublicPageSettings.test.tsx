import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicPageSettings } from '@/components/settings/PublicPageSettings';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/components/settings/ThemeSelector', () => ({ ThemeSelector: () => null }));
jest.mock('@/components/ui/ImageUploader', () => ({ ImageUploader: () => null }));
jest.mock('@/components/settings/GalleryManager', () => ({ GalleryManager: () => null }));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('PublicPageSettings services tab', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            slug: 'clinica',
            publicPageEnabled: true,
            publicBookingEnabled: true,
            publicHours: null,
            publicServices: null,
            publicImages: null,
            publicSocialMedia: null,
          },
        }),
    });
  });

  it('describes how featured services actually work', async () => {
    const user = userEvent.setup();
    render(<PublicPageSettings tenantId="tenant-1" />);

    await user.click(await screen.findByRole('button', { name: /^Servicios$/ }));

    expect(screen.queryByText(/Orden de visualización/)).not.toBeInTheDocument();
    expect(screen.queryByText(/hasta 10/)).not.toBeInTheDocument();
    expect(screen.getByText(/hasta 6 servicios destacados/)).toBeInTheDocument();
  });
});
