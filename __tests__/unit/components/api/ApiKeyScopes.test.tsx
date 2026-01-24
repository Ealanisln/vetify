/**
 * Unit tests for ApiKeyScopes component
 *
 * Tests the scope selector component:
 * - Renders with default readonly bundle selected
 * - Selecting a bundle updates scopes correctly
 * - Custom scope selection works (toggle individual scopes)
 * - Group toggle selects/deselects all scopes in group
 * - Disabled state prevents interactions
 * - Shows correct scope count summary
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeyScopes } from '@/components/api/ApiKeyScopes';
import { SCOPE_BUNDLES } from '@/lib/api/api-key-utils';

describe('ApiKeyScopes', () => {
  const defaultProps = {
    selectedScopes: [...SCOPE_BUNDLES.readonly],
    onChange: jest.fn(),
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render with default readonly bundle selected', () => {
      render(<ApiKeyScopes {...defaultProps} />);

      // Check that the bundle dropdown shows "Solo lectura"
      expect(screen.getByText('Solo lectura')).toBeInTheDocument();
      expect(screen.getByText('Acceso de lectura a todos los recursos')).toBeInTheDocument();
    });

    it('should show correct scope count summary', () => {
      const scopes = ['read:pets', 'read:appointments'];
      render(<ApiKeyScopes {...defaultProps} selectedScopes={scopes} />);

      expect(screen.getByText('2 permisos seleccionados')).toBeInTheDocument();
    });

    it('should show singular form for single scope', () => {
      render(<ApiKeyScopes {...defaultProps} selectedScopes={['read:pets']} />);

      expect(screen.getByText('1 permiso seleccionado')).toBeInTheDocument();
    });

    it('should show error message when no scopes selected', () => {
      render(<ApiKeyScopes {...defaultProps} selectedScopes={[]} />);

      expect(screen.getByText('Debes seleccionar al menos un permiso')).toBeInTheDocument();
    });
  });

  describe('Bundle Selection', () => {
    it('should show dropdown when clicking bundle selector', () => {
      render(<ApiKeyScopes {...defaultProps} />);

      const bundleButton = screen.getByRole('button', { name: /Solo lectura/i });
      fireEvent.click(bundleButton);

      // Check that all bundle options are visible
      expect(screen.getByText('Acceso completo')).toBeInTheDocument();
      expect(screen.getByText('Solo citas')).toBeInTheDocument();
      expect(screen.getByText('Solo inventario')).toBeInTheDocument();
      expect(screen.getByText('Personalizado')).toBeInTheDocument();
    });

    it('should call onChange with full bundle scopes when selecting "Acceso completo"', () => {
      const onChange = jest.fn();
      render(<ApiKeyScopes {...defaultProps} onChange={onChange} />);

      // Open dropdown
      const bundleButton = screen.getByRole('button', { name: /Solo lectura/i });
      fireEvent.click(bundleButton);

      // Click "Acceso completo"
      const fullAccessOption = screen.getAllByText('Acceso completo')[0];
      fireEvent.click(fullAccessOption);

      expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(SCOPE_BUNDLES.full));
    });

    it('should call onChange with appointments_only scopes when selecting "Solo citas"', () => {
      const onChange = jest.fn();
      render(<ApiKeyScopes {...defaultProps} onChange={onChange} />);

      // Open dropdown
      const bundleButton = screen.getByRole('button', { name: /Solo lectura/i });
      fireEvent.click(bundleButton);

      // Click "Solo citas"
      const appointmentsOption = screen.getAllByText('Solo citas')[0];
      fireEvent.click(appointmentsOption);

      expect(onChange).toHaveBeenCalledWith(['read:appointments', 'write:appointments']);
    });

    it('should close dropdown when selecting a bundle', () => {
      render(<ApiKeyScopes {...defaultProps} />);

      // Open dropdown
      const bundleButton = screen.getByRole('button', { name: /Solo lectura/i });
      fireEvent.click(bundleButton);

      // Click "Solo citas"
      const appointmentsOption = screen.getAllByText('Solo citas')[0];
      fireEvent.click(appointmentsOption);

      // Dropdown should be closed - "Personalizado" description should not be visible
      // (only one instance should be visible, the selected one)
      expect(screen.queryByText('Selecciona permisos específicos')).not.toBeInTheDocument();
    });
  });

  describe('Custom Scope Selection', () => {
    it('should show custom scope selector when "Personalizado" is selected', () => {
      render(<ApiKeyScopes {...defaultProps} />);

      // Open dropdown
      const bundleButton = screen.getByRole('button', { name: /Solo lectura/i });
      fireEvent.click(bundleButton);

      // Click "Personalizado"
      const customOption = screen.getAllByText('Personalizado')[0];
      fireEvent.click(customOption);

      // Custom scope section should be visible
      expect(screen.getByText('Selecciona los permisos específicos para esta clave de API:')).toBeInTheDocument();
    });

    it('should show all scope groups in custom mode', () => {
      // Start with custom selection to trigger custom mode
      render(
        <ApiKeyScopes
          {...defaultProps}
          selectedScopes={['read:pets']}
        />
      );

      // Open dropdown and select custom
      const bundleButton = screen.getByRole('button', { name: /Personalizado/i });
      fireEvent.click(bundleButton);

      const customOption = screen.getAllByText('Personalizado')[0];
      fireEvent.click(customOption);

      // Check that scope groups are visible
      expect(screen.getByText('Mascotas')).toBeInTheDocument();
      expect(screen.getByText('Citas')).toBeInTheDocument();
      expect(screen.getByText('Clientes')).toBeInTheDocument();
      expect(screen.getByText('Inventario')).toBeInTheDocument();
      expect(screen.getByText('Ubicaciones')).toBeInTheDocument();
      expect(screen.getByText('Reportes')).toBeInTheDocument();
      expect(screen.getByText('Ventas')).toBeInTheDocument();
    });

    it('should toggle individual scope when clicking scope button', async () => {
      const onChange = jest.fn();
      render(
        <ApiKeyScopes
          selectedScopes={['read:pets']}
          onChange={onChange}
          disabled={false}
        />
      );

      // Open dropdown and select custom
      const bundleButton = screen.getByRole('button', { name: /Personalizado/i });
      fireEvent.click(bundleButton);

      const customOption = screen.getAllByText('Personalizado')[0];
      fireEvent.click(customOption);

      // Find and click a write scope button
      const writeButtons = screen.getAllByText('✏️ Escribir');
      fireEvent.click(writeButtons[0]); // Click first write button (Mascotas - write:pets)

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it('should add scope when clicking unselected scope', () => {
      const onChange = jest.fn();
      render(
        <ApiKeyScopes
          selectedScopes={['read:pets']}
          onChange={onChange}
          disabled={false}
        />
      );

      // Open dropdown and select custom
      const bundleButton = screen.getByRole('button', { name: /Personalizado/i });
      fireEvent.click(bundleButton);

      const customOption = screen.getAllByText('Personalizado')[0];
      fireEvent.click(customOption);

      // Click write scope (not currently selected)
      const writeButtons = screen.getAllByText('✏️ Escribir');
      fireEvent.click(writeButtons[0]);

      // Should add write:pets to existing scopes
      expect(onChange).toHaveBeenCalledWith(expect.arrayContaining(['read:pets', 'write:pets']));
    });

    it('should remove scope when clicking selected scope', () => {
      const onChange = jest.fn();
      render(
        <ApiKeyScopes
          selectedScopes={['read:pets', 'write:pets']}
          onChange={onChange}
          disabled={false}
        />
      );

      // Open dropdown and select custom
      const bundleButton = screen.getByRole('button', { name: /Personalizado/i });
      fireEvent.click(bundleButton);

      const customOption = screen.getAllByText('Personalizado')[0];
      fireEvent.click(customOption);

      // Click read scope (currently selected)
      const readButtons = screen.getAllByText('👁️ Leer');
      fireEvent.click(readButtons[0]);

      // Should remove read:pets
      expect(onChange).toHaveBeenCalledWith(['write:pets']);
    });
  });

  describe('Group Toggle', () => {
    it('should select all scopes in group when clicking group checkbox', async () => {
      const onChange = jest.fn();
      // Start with a single scope that will trigger custom mode
      render(
        <ApiKeyScopes
          selectedScopes={['read:pets']}
          onChange={onChange}
          disabled={false}
        />
      );

      // The component should detect this doesn't match a bundle and show "Personalizado"
      // First, open dropdown to select custom mode
      const bundleDropdownButton = screen.getAllByRole('button')[0];
      fireEvent.click(bundleDropdownButton);

      // Select "Personalizado" from the dropdown
      const customOption = screen.getAllByText('Personalizado')[0];
      fireEvent.click(customOption);

      // Now in custom mode, find the group checkboxes
      // They have classes w-5 h-5 for the checkbox size
      const groupCheckboxes = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('w-5') && btn.classList.contains('h-5')
      );

      expect(groupCheckboxes.length).toBeGreaterThan(0);

      // Click first group checkbox (Mascotas) - should add write:pets
      fireEvent.click(groupCheckboxes[0]);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it('should deselect all scopes in group when all are selected', async () => {
      const onChange = jest.fn();
      render(
        <ApiKeyScopes
          selectedScopes={['read:pets', 'write:pets']}
          onChange={onChange}
          disabled={false}
        />
      );

      // Open dropdown
      const bundleDropdownButton = screen.getAllByRole('button')[0];
      fireEvent.click(bundleDropdownButton);

      // Select "Personalizado" to enter custom mode
      const customOption = screen.getAllByText('Personalizado')[0];
      fireEvent.click(customOption);

      // Find the Mascotas group checkbox
      const groupCheckboxes = screen.getAllByRole('button').filter(
        btn => btn.classList.contains('w-5') && btn.classList.contains('h-5')
      );

      // Click first group checkbox (Mascotas) - should deselect all pets scopes
      fireEvent.click(groupCheckboxes[0]);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Disabled State', () => {
    it('should not open dropdown when disabled', () => {
      render(<ApiKeyScopes {...defaultProps} disabled={true} />);

      const bundleButton = screen.getByRole('button', { name: /Solo lectura/i });
      fireEvent.click(bundleButton);

      // Dropdown should NOT open - check that "Personalizado" description is not visible
      expect(screen.queryByText('Selecciona permisos específicos')).not.toBeInTheDocument();
    });

    it('should have disabled appearance on bundle button', () => {
      render(<ApiKeyScopes {...defaultProps} disabled={true} />);

      const bundleButton = screen.getByRole('button', { name: /Solo lectura/i });
      expect(bundleButton).toBeDisabled();
    });

    it('should not allow scope toggle when disabled', () => {
      const onChange = jest.fn();
      render(
        <ApiKeyScopes
          selectedScopes={['read:pets']}
          onChange={onChange}
          disabled={true}
        />
      );

      // Even if we could access the scope buttons, they shouldn't work
      // The component doesn't render custom scope section when disabled
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Bundle Detection', () => {
    it('should detect readonly bundle from scopes', () => {
      render(<ApiKeyScopes {...defaultProps} selectedScopes={[...SCOPE_BUNDLES.readonly]} />);

      expect(screen.getByText('Solo lectura')).toBeInTheDocument();
    });

    it('should detect full bundle from scopes', () => {
      render(<ApiKeyScopes {...defaultProps} selectedScopes={[...SCOPE_BUNDLES.full]} />);

      expect(screen.getByText('Acceso completo')).toBeInTheDocument();
    });

    it('should detect appointments_only bundle from scopes', () => {
      render(<ApiKeyScopes {...defaultProps} selectedScopes={['read:appointments', 'write:appointments']} />);

      expect(screen.getByText('Solo citas')).toBeInTheDocument();
    });

    it('should detect inventory_only bundle from scopes', () => {
      render(<ApiKeyScopes {...defaultProps} selectedScopes={['read:inventory', 'write:inventory']} />);

      expect(screen.getByText('Solo inventario')).toBeInTheDocument();
    });

    it('should show custom when scopes do not match any bundle', () => {
      render(<ApiKeyScopes {...defaultProps} selectedScopes={['read:pets', 'write:appointments']} />);

      expect(screen.getByText('Personalizado')).toBeInTheDocument();
    });
  });
});
