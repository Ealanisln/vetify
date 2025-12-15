import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Child content</div>;
};

// Suppress console.error during tests since we're testing error handling
const originalConsoleError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should render multiple children correctly', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child1">First child</div>
          <div data-testid="child2">Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display custom fallback when error occurs and fallback is provided', () => {
      const fallback = <div data-testid="custom-fallback">Custom error message</div>;

      render(
        <ErrorBoundary fallback={fallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Child content')).not.toBeInTheDocument();
    });

    it('should display default error UI when error occurs and no fallback provided', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('¡Oops! Algo salió mal')).toBeInTheDocument();
      expect(screen.getByText('Ocurrió un error inesperado. Por favor recarga la página.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Recargar Página' })).toBeInTheDocument();
    });

    it('should log error to console via componentDidCatch', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
      // Check that the error message includes our test error
      const errorCalls = (console.error as jest.Mock).mock.calls;
      const boundaryLogCall = errorCalls.find(
        (call: unknown[]) => call[0] === 'Error Boundary caught an error:'
      );
      expect(boundaryLogCall).toBeDefined();
      expect(boundaryLogCall[1]).toBeInstanceOf(Error);
      expect(boundaryLogCall[1].message).toBe('Test error');
    });
  });

  describe('Reload Button', () => {
    it('should render reload button in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: 'Recargar Página' });
      expect(reloadButton).toBeInTheDocument();
      // Button should be clickable (not disabled)
      expect(reloadButton).not.toBeDisabled();
    });

    it('should have correct button styling', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: 'Recargar Página' });
      expect(reloadButton).toHaveClass('bg-blue-600');
      expect(reloadButton).toHaveClass('text-white');
    });

    it('should have onClick handler attached', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: 'Recargar Página' });
      // Verify button has an onclick handler (clicking won't throw)
      expect(() => fireEvent.click(reloadButton)).not.toThrow();
    });
  });

  describe('Error State Persistence', () => {
    it('should maintain error state after error is caught', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify error state is shown
      expect(screen.getByText('¡Oops! Algo salió mal')).toBeInTheDocument();

      // Rerender with same props - error state should persist
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Error state should still be shown (not recoverable without reload)
      expect(screen.getByText('¡Oops! Algo salió mal')).toBeInTheDocument();
    });
  });

  describe('Different Error Types', () => {
    it('should catch TypeError', () => {
      const ThrowTypeError = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = null;
        return obj.property;
      };

      render(
        <ErrorBoundary>
          <ThrowTypeError />
        </ErrorBoundary>
      );

      expect(screen.getByText('¡Oops! Algo salió mal')).toBeInTheDocument();
    });

    it('should catch ReferenceError', () => {
      const ThrowReferenceError = () => {
        // This will throw a ReferenceError
        throw new ReferenceError('undefined variable');
      };

      render(
        <ErrorBoundary>
          <ThrowReferenceError />
        </ErrorBoundary>
      );

      expect(screen.getByText('¡Oops! Algo salió mal')).toBeInTheDocument();
    });
  });
});
