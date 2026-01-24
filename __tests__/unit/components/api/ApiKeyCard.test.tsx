/**
 * Unit tests for ApiKeyCard component
 *
 * Tests the individual API key card:
 * - Renders key name and prefix correctly
 * - Copy prefix button works (clipboard mock)
 * - Shows correct status badges (active/inactive/expired)
 * - Shows location badge or "Global" label
 * - Shows "last used" time or "Nunca usada"
 * - Edit, delete, toggle buttons trigger callbacks
 * - Expanded scopes view works when clicking "+N más"
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ApiKeyCard, type ApiKeyData } from '@/components/api/ApiKeyCard';

// Mock date-fns with a simpler approach - mock formatDistanceToNow directly
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  formatDistanceToNow: jest.fn(() => 'hace un momento'),
}));

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(() => Promise.resolve()),
};
Object.assign(navigator, {
  clipboard: mockClipboard,
});

describe('ApiKeyCard', () => {
  const mockApiKey: ApiKeyData = {
    id: 'key-1',
    name: 'Test API Key',
    keyPrefix: 'vfy_abc12345',
    scopes: ['read:pets', 'write:pets', 'read:appointments'],
    lastUsed: null,
    isActive: true,
    expiresAt: null,
    rateLimit: 1000,
    createdAt: '2024-01-01T00:00:00.000Z',
    locationId: null,
    location: null,
    createdBy: {
      id: 'user-1',
      name: 'Test User',
    },
  };

  const defaultProps = {
    apiKey: mockApiKey,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onToggleActive: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should render key name correctly', () => {
      render(<ApiKeyCard {...defaultProps} />);

      expect(screen.getByText('Test API Key')).toBeInTheDocument();
    });

    it('should render key prefix with ellipsis', () => {
      render(<ApiKeyCard {...defaultProps} />);

      expect(screen.getByText('vfy_abc12345...')).toBeInTheDocument();
    });

    it('should render rate limit', () => {
      render(<ApiKeyCard {...defaultProps} />);

      expect(screen.getByText('1,000 req/hora')).toBeInTheDocument();
    });

    it('should render scopes badges (first 3)', () => {
      render(<ApiKeyCard {...defaultProps} />);

      expect(screen.getByText('read:pets')).toBeInTheDocument();
      expect(screen.getByText('write:pets')).toBeInTheDocument();
      expect(screen.getByText('read:appointments')).toBeInTheDocument();
    });
  });

  describe('Copy Prefix Button', () => {
    it('should copy prefix to clipboard when clicking copy button', async () => {
      render(<ApiKeyCard {...defaultProps} />);

      const copyButton = screen.getByTitle('Copiar prefijo');
      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(mockClipboard.writeText).toHaveBeenCalledWith('vfy_abc12345');
    });

    it('should show check icon after copying', async () => {
      render(<ApiKeyCard {...defaultProps} />);

      const copyButton = screen.getByTitle('Copiar prefijo');
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Check icon should be visible (green color)
      const checkIcon = copyButton.querySelector('svg');
      expect(checkIcon).toHaveClass('text-green-500');
    });

    it('should reset copy icon after 2 seconds', async () => {
      render(<ApiKeyCard {...defaultProps} />);

      const copyButton = screen.getByTitle('Copiar prefijo');
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Check icon visible
      expect(copyButton.querySelector('svg')).toHaveClass('text-green-500');

      // Fast forward 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should be back to clipboard icon
      expect(copyButton.querySelector('svg')).not.toHaveClass('text-green-500');
    });
  });

  describe('Status Badges', () => {
    it('should show "Activa" badge for active keys', () => {
      render(<ApiKeyCard {...defaultProps} />);

      expect(screen.getByText('Activa')).toBeInTheDocument();
    });

    it('should show "Inactiva" badge for inactive keys', () => {
      const inactiveKey = { ...mockApiKey, isActive: false };
      render(<ApiKeyCard {...defaultProps} apiKey={inactiveKey} />);

      expect(screen.getByText('Inactiva')).toBeInTheDocument();
    });

    it('should show "Expirada" badge for expired keys', () => {
      const expiredKey = {
        ...mockApiKey,
        expiresAt: '2020-01-01T00:00:00.000Z', // Past date
      };
      render(<ApiKeyCard {...defaultProps} apiKey={expiredKey} />);

      expect(screen.getByText('Expirada')).toBeInTheDocument();
    });

    it('should apply opacity to card for inactive keys', () => {
      const inactiveKey = { ...mockApiKey, isActive: false };
      const { container } = render(<ApiKeyCard {...defaultProps} apiKey={inactiveKey} />);

      const card = container.querySelector('.opacity-60');
      expect(card).toBeInTheDocument();
    });

    it('should apply opacity to card for expired keys', () => {
      const expiredKey = {
        ...mockApiKey,
        expiresAt: '2020-01-01T00:00:00.000Z',
      };
      const { container } = render(<ApiKeyCard {...defaultProps} apiKey={expiredKey} />);

      const card = container.querySelector('.opacity-60');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Location Display', () => {
    it('should show "Global" for keys without location', () => {
      render(<ApiKeyCard {...defaultProps} />);

      expect(screen.getByText('Global')).toBeInTheDocument();
    });

    it('should show location name for keys with location', () => {
      const keyWithLocation = {
        ...mockApiKey,
        locationId: 'loc-1',
        location: {
          id: 'loc-1',
          name: 'Main Clinic',
        },
      };
      render(<ApiKeyCard {...defaultProps} apiKey={keyWithLocation} />);

      expect(screen.getByText('Main Clinic')).toBeInTheDocument();
      expect(screen.queryByText('Global')).not.toBeInTheDocument();
    });
  });

  describe('Last Used Display', () => {
    it('should show "Nunca usada" for keys never used', () => {
      render(<ApiKeyCard {...defaultProps} />);

      expect(screen.getByText('Nunca usada')).toBeInTheDocument();
    });

    it('should show relative time for keys with lastUsed', () => {
      // Set lastUsed to a recent date
      const usedKey = {
        ...mockApiKey,
        lastUsed: new Date().toISOString(),
      };
      render(<ApiKeyCard {...defaultProps} apiKey={usedKey} />);

      // Should show "Usado hace..." or similar relative time
      expect(screen.getByText(/Usado/)).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should call onEdit when clicking edit button', () => {
      const onEdit = jest.fn();
      render(<ApiKeyCard {...defaultProps} onEdit={onEdit} />);

      const editButton = screen.getByTitle('Editar');
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledWith(mockApiKey);
    });

    it('should call onDelete when clicking delete button', () => {
      const onDelete = jest.fn();
      render(<ApiKeyCard {...defaultProps} onDelete={onDelete} />);

      const deleteButton = screen.getByTitle('Eliminar');
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith(mockApiKey);
    });

    it('should call onToggleActive when clicking toggle button', () => {
      const onToggleActive = jest.fn();
      render(<ApiKeyCard {...defaultProps} onToggleActive={onToggleActive} />);

      const toggleButton = screen.getByText('Desactivar');
      fireEvent.click(toggleButton);

      expect(onToggleActive).toHaveBeenCalledWith(mockApiKey);
    });

    it('should show "Activar" for inactive keys', () => {
      const inactiveKey = { ...mockApiKey, isActive: false };
      render(<ApiKeyCard {...defaultProps} apiKey={inactiveKey} />);

      expect(screen.getByText('Activar')).toBeInTheDocument();
    });

    it('should show "Desactivar" for active keys', () => {
      render(<ApiKeyCard {...defaultProps} />);

      expect(screen.getByText('Desactivar')).toBeInTheDocument();
    });

    it('should not show toggle button for expired keys', () => {
      const expiredKey = {
        ...mockApiKey,
        expiresAt: '2020-01-01T00:00:00.000Z',
      };
      render(<ApiKeyCard {...defaultProps} apiKey={expiredKey} />);

      expect(screen.queryByText('Desactivar')).not.toBeInTheDocument();
      expect(screen.queryByText('Activar')).not.toBeInTheDocument();
    });
  });

  describe('Expanded Scopes View', () => {
    it('should show "+N más" button when more than 3 scopes', () => {
      const manyScopes = {
        ...mockApiKey,
        scopes: [
          'read:pets',
          'write:pets',
          'read:appointments',
          'write:appointments',
          'read:customers',
        ],
      };
      render(<ApiKeyCard {...defaultProps} apiKey={manyScopes} />);

      expect(screen.getByText('+2 más')).toBeInTheDocument();
    });

    it('should not show "+N más" button when 3 or fewer scopes', () => {
      render(<ApiKeyCard {...defaultProps} />);

      expect(screen.queryByText(/\+\d+ más/)).not.toBeInTheDocument();
    });

    it('should expand to show all scopes when clicking "+N más"', () => {
      const manyScopes = {
        ...mockApiKey,
        scopes: [
          'read:pets',
          'write:pets',
          'read:appointments',
          'write:appointments',
          'read:customers',
        ],
      };
      render(<ApiKeyCard {...defaultProps} apiKey={manyScopes} />);

      const expandButton = screen.getByText('+2 más');
      fireEvent.click(expandButton);

      // All scopes should now be visible
      expect(screen.getByText('write:appointments')).toBeInTheDocument();
      expect(screen.getByText('read:customers')).toBeInTheDocument();
    });

    it('should collapse expanded scopes when clicking button again', () => {
      const manyScopes = {
        ...mockApiKey,
        scopes: [
          'read:pets',
          'write:pets',
          'read:appointments',
          'write:appointments',
          'read:customers',
        ],
      };
      render(<ApiKeyCard {...defaultProps} apiKey={manyScopes} />);

      const expandButton = screen.getByText('+2 más');
      fireEvent.click(expandButton);

      // Click again to collapse
      fireEvent.click(expandButton);

      // Additional scopes should be hidden again (only first 3 visible in main area)
      // The expanded section should be gone
      const expandedSection = screen.queryByText('write:appointments');
      // This might still be in the DOM in the first 3, need to check carefully
      // Actually write:appointments is the 4th scope, so it should be hidden
      expect(expandedSection).not.toBeInTheDocument();
    });
  });

  describe('Scope Badge Styling', () => {
    it('should style read scopes with blue color', () => {
      render(<ApiKeyCard {...defaultProps} />);

      const readScope = screen.getByText('read:pets');
      expect(readScope).toHaveClass('bg-blue-100');
    });

    it('should style write scopes with amber color', () => {
      render(<ApiKeyCard {...defaultProps} />);

      const writeScope = screen.getByText('write:pets');
      expect(writeScope).toHaveClass('bg-amber-100');
    });
  });
});
