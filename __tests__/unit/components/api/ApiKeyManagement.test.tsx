/**
 * Unit tests for ApiKeyManagement component
 *
 * Tests the main list component:
 * - Loading state shows spinner
 * - Error state shows retry button
 * - Empty state shows "No hay claves de API"
 * - Renders list of API keys
 * - Search filter works
 * - Status filter works
 * - Create button opens modal
 * - Edit, delete, toggle actions work
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiKeyManagement } from '@/components/api/ApiKeyManagement';

// Mock fetch
global.fetch = jest.fn();

// Mock window methods
const mockPrompt = jest.fn();
const mockConfirm = jest.fn();
const mockAlert = jest.fn();

beforeAll(() => {
  window.prompt = mockPrompt;
  window.confirm = mockConfirm;
  window.alert = mockAlert;
});

describe('ApiKeyManagement', () => {
  const mockApiKeys = [
    {
      id: 'key-1',
      name: 'Production Key',
      keyPrefix: 'vfy_abc12345',
      scopes: ['read:pets', 'write:pets'],
      lastUsed: '2024-01-15T10:00:00.000Z',
      isActive: true,
      expiresAt: null,
      rateLimit: 1000,
      createdAt: '2024-01-01T00:00:00.000Z',
      locationId: null,
      location: null,
    },
    {
      id: 'key-2',
      name: 'Test Key',
      keyPrefix: 'vfy_def67890',
      scopes: ['read:appointments'],
      lastUsed: null,
      isActive: false,
      expiresAt: null,
      rateLimit: 500,
      createdAt: '2024-01-02T00:00:00.000Z',
      locationId: 'loc-1',
      location: {
        id: 'loc-1',
        name: 'Main Clinic',
      },
    },
  ];

  const mockLocations = [
    { id: 'loc-1', name: 'Main Clinic' },
    { id: 'loc-2', name: 'Downtown Branch' },
  ];

  const defaultProps = {
    tenantId: 'tenant-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrompt.mockReturnValue(null);
    mockConfirm.mockReturnValue(false);

    // Default successful responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/settings/api-keys') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: mockApiKeys,
            }),
        });
      }
      if (url.includes('/api/locations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLocations),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching', async () => {
      // Slow response
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      success: true,
                      data: mockApiKeys,
                    }),
                }),
              1000
            )
          )
      );

      const { container } = render(<ApiKeyManagement {...defaultProps} />);

      // Look for the spinner by its CSS class
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      const { container } = render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should show error message on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Error al cargar las claves de API',
          }),
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Error al cargar las claves de API')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Error',
          }),
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });
    });

    it('should retry fetch when clicking retry button', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: () =>
            Promise.resolve({
              success: false,
              error: 'Error',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: mockApiKeys,
            }),
        });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Reintentar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reintentar'));

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no keys exist', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/settings/api-keys') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: [],
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No hay claves de API')).toBeInTheDocument();
      });
    });

    it('should show "Crear Primera Clave" button in empty state', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/settings/api-keys') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: [],
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Crear Primera Clave')).toBeInTheDocument();
      });
    });
  });

  describe('API Keys List', () => {
    it('should render list of API keys', async () => {
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
        expect(screen.getByText('Test Key')).toBeInTheDocument();
      });
    });

    it('should show "Nueva Clave" button', async () => {
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Nueva Clave')).toBeInTheDocument();
      });
    });

    it('should show filters when keys exist', async () => {
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Buscar por nombre/)).toBeInTheDocument();
      });
    });
  });

  describe('Search Filter', () => {
    it('should filter keys by name', async () => {
      const user = userEvent.setup();
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por nombre/);
      await user.type(searchInput, 'Production');

      expect(screen.getByText('Production Key')).toBeInTheDocument();
      expect(screen.queryByText('Test Key')).not.toBeInTheDocument();
    });

    it('should filter keys by prefix', async () => {
      const user = userEvent.setup();
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por nombre/);
      await user.type(searchInput, 'vfy_abc');

      expect(screen.getByText('Production Key')).toBeInTheDocument();
      expect(screen.queryByText('Test Key')).not.toBeInTheDocument();
    });

    it('should show no results message when filter returns empty', async () => {
      const user = userEvent.setup();
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por nombre/);
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    });
  });

  describe('Status Filter', () => {
    it('should filter active keys only', async () => {
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const statusSelect = screen.getByRole('combobox');
      fireEvent.change(statusSelect, { target: { value: 'active' } });

      expect(screen.getByText('Production Key')).toBeInTheDocument();
      expect(screen.queryByText('Test Key')).not.toBeInTheDocument();
    });

    it('should filter inactive keys only', async () => {
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const statusSelect = screen.getByRole('combobox');
      fireEvent.change(statusSelect, { target: { value: 'inactive' } });

      expect(screen.queryByText('Production Key')).not.toBeInTheDocument();
      expect(screen.getByText('Test Key')).toBeInTheDocument();
    });

    it('should show all keys with "all" filter', async () => {
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const statusSelect = screen.getByRole('combobox');
      fireEvent.change(statusSelect, { target: { value: 'all' } });

      expect(screen.getByText('Production Key')).toBeInTheDocument();
      expect(screen.getByText('Test Key')).toBeInTheDocument();
    });
  });

  describe('Create Key Flow', () => {
    it('should open create modal when clicking "Nueva Clave"', async () => {
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Nueva Clave')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Nueva Clave'));

      expect(screen.getByText('Nueva Clave de API')).toBeInTheDocument();
    });

    it('should show created key modal after successful creation', async () => {
      const user = userEvent.setup();

      // Mock successful creation
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/settings/api-keys' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: {
                  id: 'key-new',
                  name: 'New Key',
                  keyPrefix: 'vfy_new12345',
                  fullKey: 'vfy_new12345_abcdef1234567890abcdef1234567890',
                  scopes: ['read:pets'],
                },
              }),
          });
        }
        if (url === '/api/settings/api-keys') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: mockApiKeys,
              }),
          });
        }
        if (url.includes('/api/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLocations),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Nueva Clave')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Nueva Clave'));

      // Fill form
      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, 'New Key');

      // Submit
      await act(async () => {
        fireEvent.click(screen.getByText('Crear Clave'));
      });

      // Should show created modal
      await waitFor(() => {
        expect(screen.getByText('Clave de API Creada')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Key', () => {
    it('should call prompt when clicking edit', async () => {
      mockPrompt.mockReturnValue('Updated Name');
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/settings/api-keys/') && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { ...mockApiKeys[0], name: 'Updated Name' },
              }),
          });
        }
        if (url === '/api/settings/api-keys') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: mockApiKeys,
              }),
          });
        }
        if (url.includes('/api/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLocations),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Editar');
      fireEvent.click(editButtons[0]);

      expect(mockPrompt).toHaveBeenCalledWith(
        'Nuevo nombre para la clave:',
        'Production Key'
      );
    });

    it('should call API to update key name', async () => {
      mockPrompt.mockReturnValue('Updated Name');
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/settings/api-keys/') && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { ...mockApiKeys[0], name: 'Updated Name' },
              }),
          });
        }
        if (url === '/api/settings/api-keys') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: mockApiKeys,
              }),
          });
        }
        if (url.includes('/api/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLocations),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle('Editar');
      await act(async () => {
        fireEvent.click(editButtons[0]);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/settings/api-keys/key-1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ name: 'Updated Name' }),
          })
        );
      });
    });
  });

  describe('Delete Key', () => {
    it('should show confirmation when clicking delete', async () => {
      mockConfirm.mockReturnValue(false);

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Eliminar');
      fireEvent.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalled();
    });

    it('should call API to delete key when confirmed', async () => {
      mockConfirm.mockReturnValue(true);
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/settings/api-keys/') && options?.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
              }),
          });
        }
        if (url === '/api/settings/api-keys') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: mockApiKeys,
              }),
          });
        }
        if (url.includes('/api/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLocations),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Eliminar');
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/settings/api-keys/key-1',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });

    it('should not call API when delete is cancelled', async () => {
      mockConfirm.mockReturnValue(false);
      const fetchCalls = (global.fetch as jest.Mock).mock.calls.length;

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Eliminar');
      fireEvent.click(deleteButtons[0]);

      // Should not have made any additional DELETE calls
      const deleteCalls = (global.fetch as jest.Mock).mock.calls.filter(
        ([, opts]: [string, RequestInit]) => opts?.method === 'DELETE'
      );
      expect(deleteCalls.length).toBe(0);
    });
  });

  describe('Toggle Active', () => {
    it('should call API to toggle active status', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/settings/api-keys/') && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { ...mockApiKeys[0], isActive: false },
              }),
          });
        }
        if (url === '/api/settings/api-keys') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: mockApiKeys,
              }),
          });
        }
        if (url.includes('/api/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLocations),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      // Find the Desactivar button (Production Key is active)
      const toggleButtons = screen.getAllByText('Desactivar');
      await act(async () => {
        fireEvent.click(toggleButtons[0]);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/settings/api-keys/key-1',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ isActive: false }),
          })
        );
      });
    });

    it('should update UI after toggling', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/api/settings/api-keys/') && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { ...mockApiKeys[0], isActive: false },
              }),
          });
        }
        if (url === '/api/settings/api-keys') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: mockApiKeys,
              }),
          });
        }
        if (url.includes('/api/locations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockLocations),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });

      // Initially shows "Desactivar" for active key
      expect(screen.getAllByText('Desactivar').length).toBeGreaterThan(0);

      const toggleButtons = screen.getAllByText('Desactivar');
      await act(async () => {
        fireEvent.click(toggleButtons[0]);
      });

      // After toggle, should show "Activar" for that key
      await waitFor(() => {
        // The UI updates optimistically
        const activarButtons = screen.getAllByText('Activar');
        expect(activarButtons.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Documentation Link', () => {
    it('should show documentation tip when keys exist', async () => {
      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/documentación de API/)).toBeInTheDocument();
      });
    });

    it('should not show documentation tip when no keys', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/api/settings/api-keys') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: [],
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      });

      render(<ApiKeyManagement {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No hay claves de API')).toBeInTheDocument();
      });

      expect(screen.queryByText(/documentación de API/)).not.toBeInTheDocument();
    });
  });
});
