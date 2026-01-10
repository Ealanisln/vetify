/**
 * Unit tests for PermissionGate component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PermissionGate, AccessDenied, withPermission } from '@/components/guards/PermissionGate';

// Mock the useStaffPermissions hook
jest.mock('@/hooks/useStaffPermissions', () => ({
  useStaffPermissions: jest.fn(),
}));

import { useStaffPermissions } from '@/hooks/useStaffPermissions';

const mockUseStaffPermissions = useStaffPermissions as jest.MockedFunction<typeof useStaffPermissions>;

describe('PermissionGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseStaffPermissions.mockReturnValue({
        staff: null,
        position: null,
        isLoading: true,
        error: null,
        canAccess: jest.fn().mockReturnValue(false),
        accessibleFeatures: [],
        isAdmin: false,
        isVeterinarian: false,
        isReceptionist: false,
        isAssistant: false,
        isTechnician: false,
        refresh: jest.fn(),
      });
    });

    it('should render loading content when provided', () => {
      render(
        <PermissionGate
          feature="medical"
          action="read"
          loading={<div data-testid="loading">Loading...</div>}
        >
          <div data-testid="content">Protected Content</div>
        </PermissionGate>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('should render nothing when loading without loading prop', () => {
      const { container } = render(
        <PermissionGate feature="medical" action="read">
          <div data-testid="content">Protected Content</div>
        </PermissionGate>
      );

      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Access granted', () => {
    beforeEach(() => {
      mockUseStaffPermissions.mockReturnValue({
        staff: { id: 'staff-1', name: 'Test', position: 'VETERINARIAN', email: null, isActive: true },
        position: 'VETERINARIAN',
        isLoading: false,
        error: null,
        canAccess: jest.fn().mockImplementation((feature, action) => {
          if (feature === 'medical') return true;
          if (feature === 'settings') return false;
          return false;
        }),
        accessibleFeatures: ['medical', 'appointments'],
        isAdmin: false,
        isVeterinarian: true,
        isReceptionist: false,
        isAssistant: false,
        isTechnician: false,
        refresh: jest.fn(),
      });
    });

    it('should render children when user has permission', () => {
      render(
        <PermissionGate feature="medical" action="read">
          <div data-testid="content">Protected Content</div>
        </PermissionGate>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should default to read action', () => {
      const canAccessMock = jest.fn().mockReturnValue(true);
      mockUseStaffPermissions.mockReturnValue({
        ...mockUseStaffPermissions(),
        canAccess: canAccessMock,
      });

      render(
        <PermissionGate feature="medical">
          <div>Content</div>
        </PermissionGate>
      );

      expect(canAccessMock).toHaveBeenCalledWith('medical', 'read');
    });
  });

  describe('Access denied', () => {
    beforeEach(() => {
      mockUseStaffPermissions.mockReturnValue({
        staff: { id: 'staff-1', name: 'Test', position: 'RECEPTIONIST', email: null, isActive: true },
        position: 'RECEPTIONIST',
        isLoading: false,
        error: null,
        canAccess: jest.fn().mockReturnValue(false),
        accessibleFeatures: ['appointments', 'sales'],
        isAdmin: false,
        isVeterinarian: false,
        isReceptionist: true,
        isAssistant: false,
        isTechnician: false,
        refresh: jest.fn(),
      });
    });

    it('should not render children when user lacks permission', () => {
      render(
        <PermissionGate feature="medical" action="read">
          <div data-testid="content">Protected Content</div>
        </PermissionGate>
      );

      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('should render fallback when user lacks permission', () => {
      render(
        <PermissionGate
          feature="medical"
          action="read"
          fallback={<div data-testid="fallback">No Access</div>}
        >
          <div data-testid="content">Protected Content</div>
        </PermissionGate>
      );

      expect(screen.getByTestId('fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });

    it('should render null when no fallback provided', () => {
      const { container } = render(
        <PermissionGate feature="medical" action="read">
          <div data-testid="content">Protected Content</div>
        </PermissionGate>
      );

      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Different actions', () => {
    it('should check correct action type', () => {
      const canAccessMock = jest.fn().mockReturnValue(true);
      mockUseStaffPermissions.mockReturnValue({
        staff: null,
        position: 'MANAGER',
        isLoading: false,
        error: null,
        canAccess: canAccessMock,
        accessibleFeatures: [],
        isAdmin: true,
        isVeterinarian: false,
        isReceptionist: false,
        isAssistant: false,
        isTechnician: false,
        refresh: jest.fn(),
      });

      render(
        <PermissionGate feature="medical" action="write">
          <div>Content</div>
        </PermissionGate>
      );

      expect(canAccessMock).toHaveBeenCalledWith('medical', 'write');
    });
  });
});

describe('AccessDenied', () => {
  it('should render default message', () => {
    render(<AccessDenied />);

    expect(screen.getByText('Acceso Restringido')).toBeInTheDocument();
    expect(screen.getByText('No tienes permiso para ver esta sección')).toBeInTheDocument();
  });

  it('should render custom message', () => {
    render(<AccessDenied message="Custom access denied message" />);

    expect(screen.getByText('Custom access denied message')).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    const { container } = render(<AccessDenied />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });
});

describe('withPermission HOC', () => {
  const TestComponent: React.FC<{ testProp: string }> = ({ testProp }) => (
    <div data-testid="wrapped-content">{testProp}</div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    beforeEach(() => {
      mockUseStaffPermissions.mockReturnValue({
        staff: null,
        position: null,
        isLoading: true,
        error: null,
        canAccess: jest.fn().mockReturnValue(false),
        accessibleFeatures: [],
        isAdmin: false,
        isVeterinarian: false,
        isReceptionist: false,
        isAssistant: false,
        isTechnician: false,
        refresh: jest.fn(),
      });
    });

    it('should render null while loading', () => {
      const WrappedComponent = withPermission(TestComponent, 'medical', 'read');
      const { container } = render(<WrappedComponent testProp="test" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Access granted', () => {
    beforeEach(() => {
      mockUseStaffPermissions.mockReturnValue({
        staff: { id: 'staff-1', name: 'Test', position: 'VETERINARIAN', email: null, isActive: true },
        position: 'VETERINARIAN',
        isLoading: false,
        error: null,
        canAccess: jest.fn().mockReturnValue(true),
        accessibleFeatures: ['medical'],
        isAdmin: false,
        isVeterinarian: true,
        isReceptionist: false,
        isAssistant: false,
        isTechnician: false,
        refresh: jest.fn(),
      });
    });

    it('should render wrapped component when user has permission', () => {
      const WrappedComponent = withPermission(TestComponent, 'medical', 'read');
      render(<WrappedComponent testProp="test value" />);

      expect(screen.getByTestId('wrapped-content')).toBeInTheDocument();
      expect(screen.getByText('test value')).toBeInTheDocument();
    });

    it('should pass props to wrapped component', () => {
      const WrappedComponent = withPermission(TestComponent, 'medical', 'read');
      render(<WrappedComponent testProp="passed prop" />);

      expect(screen.getByText('passed prop')).toBeInTheDocument();
    });
  });

  describe('Access denied', () => {
    beforeEach(() => {
      mockUseStaffPermissions.mockReturnValue({
        staff: { id: 'staff-1', name: 'Test', position: 'RECEPTIONIST', email: null, isActive: true },
        position: 'RECEPTIONIST',
        isLoading: false,
        error: null,
        canAccess: jest.fn().mockReturnValue(false),
        accessibleFeatures: ['appointments'],
        isAdmin: false,
        isVeterinarian: false,
        isReceptionist: true,
        isAssistant: false,
        isTechnician: false,
        refresh: jest.fn(),
      });
    });

    it('should render default AccessDenied when user lacks permission', () => {
      const WrappedComponent = withPermission(TestComponent, 'medical', 'read');
      render(<WrappedComponent testProp="test" />);

      expect(screen.queryByTestId('wrapped-content')).not.toBeInTheDocument();
      expect(screen.getByText('Acceso Restringido')).toBeInTheDocument();
    });

    it('should render custom fallback component when provided', () => {
      const CustomFallback: React.FC = () => <div data-testid="custom-fallback">Custom Fallback</div>;
      const WrappedComponent = withPermission(TestComponent, 'medical', 'read', CustomFallback);
      render(<WrappedComponent testProp="test" />);

      expect(screen.queryByTestId('wrapped-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });
  });

  describe('Default action', () => {
    it('should default to read action when not specified', () => {
      const canAccessMock = jest.fn().mockReturnValue(true);
      mockUseStaffPermissions.mockReturnValue({
        staff: null,
        position: 'MANAGER',
        isLoading: false,
        error: null,
        canAccess: canAccessMock,
        accessibleFeatures: [],
        isAdmin: true,
        isVeterinarian: false,
        isReceptionist: false,
        isAssistant: false,
        isTechnician: false,
        refresh: jest.fn(),
      });

      const WrappedComponent = withPermission(TestComponent, 'settings');
      render(<WrappedComponent testProp="test" />);

      expect(canAccessMock).toHaveBeenCalledWith('settings', 'read');
    });
  });
});
