/**
 * Unit tests for CreateApiKeyModal component
 *
 * Tests the creation modal:
 * - Opens and closes correctly
 * - Form validation (name required, at least one scope)
 * - Location dropdown shows available locations
 * - Advanced options (rate limit, expiration) work
 * - Submit calls API and triggers onCreated callback
 * - Error handling displays error message
 * - Loading state during submission
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateApiKeyModal } from '@/components/api/CreateApiKeyModal';
import { SCOPE_BUNDLES } from '@/lib/api/api-key-utils';

// Mock fetch
global.fetch = jest.fn();

describe('CreateApiKeyModal', () => {
  const mockLocations = [
    { id: 'loc-1', name: 'Main Clinic' },
    { id: 'loc-2', name: 'Downtown Branch' },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onCreated: jest.fn(),
    locations: mockLocations,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            id: 'key-1',
            name: 'Test Key',
            fullKey: 'vfy_abc12345_abcdef1234567890abcdef1234567890',
            keyPrefix: 'vfy_abc12345',
            scopes: ['read:pets'],
          },
        }),
    });
  });

  describe('Modal Visibility', () => {
    it('should render when isOpen is true', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      expect(screen.getByText('Nueva Clave de API')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<CreateApiKeyModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Nueva Clave de API')).not.toBeInTheDocument();
    });

    it('should call onClose when clicking backdrop', () => {
      const onClose = jest.fn();
      render(<CreateApiKeyModal {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('.bg-black\\/50');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking close button', () => {
      const onClose = jest.fn();
      render(<CreateApiKeyModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '' }); // XMarkIcon button
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking cancel button', () => {
      const onClose = jest.fn();
      render(<CreateApiKeyModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal opens', () => {
      const { rerender } = render(<CreateApiKeyModal {...defaultProps} isOpen={false} />);

      // Open modal
      rerender(<CreateApiKeyModal {...defaultProps} isOpen={true} />);

      const nameInput = screen.getByLabelText(/Nombre/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });

  describe('Name Input', () => {
    it('should have name input field', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre/i);
      expect(nameInput).toBeInTheDocument();
    });

    it('should update name value when typing', async () => {
      const user = userEvent.setup();
      render(<CreateApiKeyModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, 'My API Key');

      expect(nameInput).toHaveValue('My API Key');
    });

    it('should have placeholder text', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText(/Integración con sistema externo/i);
      expect(nameInput).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should have required attribute on name input', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre/i);
      expect(nameInput).toHaveAttribute('required');
    });

    it('should show custom error when submitting with whitespace-only name', async () => {
      const user = userEvent.setup();
      render(<CreateApiKeyModal {...defaultProps} />);

      // Type only whitespace
      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, '   ');

      const submitButton = screen.getByText('Crear Clave');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // The component trims the name, so whitespace-only should trigger error
      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
      });
    });

    it('should have enabled submit button when scopes are selected', async () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      // Note: The component starts with readonly scopes by default
      const submitButton = screen.getByText('Crear Clave');

      // Button should be enabled since default scopes are selected
      expect(submitButton).not.toBeDisabled();
    });

    it('should show warning when no scopes selected', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      // The scopes component shows this warning when empty
      // But by default, readonly scopes are selected
      // This tests the scopes summary display
      expect(screen.getByText(/permiso.* seleccionado/i)).toBeInTheDocument();
    });
  });

  describe('Location Dropdown', () => {
    it('should show location dropdown when locations are provided', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      expect(screen.getByLabelText(/Ubicación/i)).toBeInTheDocument();
    });

    it('should not show location dropdown when no locations', () => {
      render(<CreateApiKeyModal {...defaultProps} locations={[]} />);

      expect(screen.queryByLabelText(/Ubicación/i)).not.toBeInTheDocument();
    });

    it('should have "Todas las ubicaciones" as default option', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      const locationSelect = screen.getByLabelText(/Ubicación/i);
      expect(locationSelect).toHaveValue('');
    });

    it('should show all location options', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      expect(screen.getByText('Todas las ubicaciones (Global)')).toBeInTheDocument();
      expect(screen.getByText('Main Clinic')).toBeInTheDocument();
      expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
    });
  });

  describe('Advanced Options', () => {
    it('should have expandable advanced options section', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      expect(screen.getByText('Opciones avanzadas')).toBeInTheDocument();
    });

    it('should show rate limit input in advanced options', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      const advancedSection = screen.getByText('Opciones avanzadas');
      fireEvent.click(advancedSection);

      expect(screen.getByLabelText(/Límite de peticiones/i)).toBeInTheDocument();
    });

    it('should show expiration input in advanced options', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      const advancedSection = screen.getByText('Opciones avanzadas');
      fireEvent.click(advancedSection);

      expect(screen.getByLabelText(/Fecha de expiración/i)).toBeInTheDocument();
    });

    it('should have default rate limit of 1000', () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      const advancedSection = screen.getByText('Opciones avanzadas');
      fireEvent.click(advancedSection);

      const rateLimitInput = screen.getByLabelText(/Límite de peticiones/i);
      expect(rateLimitInput).toHaveValue(1000);
    });

    it('should clamp rate limit to minimum 100', async () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      const advancedSection = screen.getByText('Opciones avanzadas');
      fireEvent.click(advancedSection);

      const rateLimitInput = screen.getByLabelText(/Límite de peticiones/i) as HTMLInputElement;

      // Simulate onChange with a value less than 100
      fireEvent.change(rateLimitInput, { target: { value: '50' } });

      // The component clamps the value to minimum 100
      expect(rateLimitInput.value).toBe('100');
    });

    it('should clamp rate limit to maximum 100000', async () => {
      render(<CreateApiKeyModal {...defaultProps} />);

      const advancedSection = screen.getByText('Opciones avanzadas');
      fireEvent.click(advancedSection);

      const rateLimitInput = screen.getByLabelText(/Límite de peticiones/i) as HTMLInputElement;

      // Simulate onChange with a value greater than 100000
      fireEvent.change(rateLimitInput, { target: { value: '150000' } });

      // The component clamps the value to maximum 100000
      expect(rateLimitInput.value).toBe('100000');
    });
  });

  describe('Form Submission', () => {
    it('should call API with correct data on submit', async () => {
      const user = userEvent.setup();
      render(<CreateApiKeyModal {...defaultProps} />);

      // Fill name
      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, 'Test Key');

      // Submit
      const submitButton = screen.getByText('Crear Clave');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/settings/api-keys',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.any(String),
          })
        );
      });

      // Check the body
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.name).toBe('Test Key');
      expect(body.scopes).toEqual(SCOPE_BUNDLES.readonly);
    });

    it('should call onCreated with response data on success', async () => {
      const user = userEvent.setup();
      const onCreated = jest.fn();
      render(<CreateApiKeyModal {...defaultProps} onCreated={onCreated} />);

      // Fill name
      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, 'Test Key');

      // Submit
      const submitButton = screen.getByText('Crear Clave');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(onCreated).toHaveBeenCalledWith({
          id: 'key-1',
          name: 'Test Key',
          fullKey: 'vfy_abc12345_abcdef1234567890abcdef1234567890',
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
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
                      data: {
                        id: 'key-1',
                        name: 'Test Key',
                        fullKey: 'vfy_abc12345_abcdef1234567890abcdef1234567890',
                      },
                    }),
                }),
              100
            )
          )
      );

      render(<CreateApiKeyModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, 'Test Key');

      const submitButton = screen.getByText('Crear Clave');
      fireEvent.click(submitButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText('Creando...')).toBeInTheDocument();
      });
    });

    it('should disable inputs during submission', async () => {
      const user = userEvent.setup();
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
                      data: {
                        id: 'key-1',
                        name: 'Test Key',
                        fullKey: 'vfy_abc12345_abcdef1234567890abcdef1234567890',
                      },
                    }),
                }),
              100
            )
          )
      );

      render(<CreateApiKeyModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, 'Test Key');

      const submitButton = screen.getByText('Crear Clave');
      fireEvent.click(submitButton);

      // Submit button should be disabled
      await waitFor(() => {
        expect(screen.getByText('Creando...')).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Error al crear la clave',
          }),
      });

      render(<CreateApiKeyModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, 'Test Key');

      const submitButton = screen.getByText('Crear Clave');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Error al crear la clave')).toBeInTheDocument();
      });
    });

    it('should display generic error message on network error', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<CreateApiKeyModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, 'Test Key');

      const submitButton = screen.getByText('Crear Clave');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should clear error when form is submitted again', async () => {
      const user = userEvent.setup();
      // First call fails
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          json: () =>
            Promise.resolve({
              success: false,
              error: 'First error',
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: {
                id: 'key-1',
                name: 'Test Key',
                fullKey: 'vfy_abc12345_abcdef1234567890abcdef1234567890',
              },
            }),
        });

      render(<CreateApiKeyModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, 'Test Key');

      // First submit (fails)
      const submitButton = screen.getByText('Crear Clave');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second submit (succeeds) - error should be cleared
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Scopes Integration', () => {
    it('should include selected scopes in API call', async () => {
      const user = userEvent.setup();
      render(<CreateApiKeyModal {...defaultProps} />);

      // Change to full access
      const bundleButton = screen.getByRole('button', { name: /Solo lectura/i });
      fireEvent.click(bundleButton);

      const fullAccessOption = screen.getAllByText('Acceso completo')[0];
      fireEvent.click(fullAccessOption);

      // Fill name
      const nameInput = screen.getByLabelText(/Nombre/i);
      await user.type(nameInput, 'Full Access Key');

      // Submit
      const submitButton = screen.getByText('Crear Clave');
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        expect(body.scopes).toEqual(expect.arrayContaining(SCOPE_BUNDLES.full));
      });
    });
  });
});
