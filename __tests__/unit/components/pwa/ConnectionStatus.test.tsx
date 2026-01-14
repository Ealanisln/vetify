/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ConnectionStatus } from '@/components/pwa/ConnectionStatus';

// Mock the useOnlineStatus hook
const mockResetWasOffline = jest.fn();
const mockUseOnlineStatus = jest.fn();

jest.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
}));

describe('ConnectionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('When Online', () => {
    it('should not render anything when online and wasOffline is false', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: false,
        resetWasOffline: mockResetWasOffline,
      });

      const { container } = render(<ConnectionStatus />);

      expect(container.firstChild).toBeNull();
    });

    it('should show reconnected message when coming back online', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: true,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      expect(screen.getByText('Conexión restaurada')).toBeInTheDocument();
    });

    it('should have green background when showing reconnected', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: true,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveClass('bg-green-500');
    });

    it('should hide reconnected message after 3 seconds', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: true,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      expect(screen.getByText('Conexión restaurada')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockResetWasOffline).toHaveBeenCalled();
    });

    it('should call resetWasOffline after timeout', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: true,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockResetWasOffline).toHaveBeenCalledTimes(1);
    });
  });

  describe('When Offline', () => {
    it('should show offline banner', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      expect(screen.getByText(/Sin conexión/)).toBeInTheDocument();
    });

    it('should show full offline message', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      expect(
        screen.getByText('Sin conexión - Algunas funciones pueden no estar disponibles')
      ).toBeInTheDocument();
    });

    it('should have amber background when offline', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveClass('bg-amber-500');
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Styling', () => {
    it('should be fixed at top of page', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveClass('fixed', 'top-0', 'left-0', 'right-0');
    });

    it('should have high z-index', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: false,
        wasOffline: false,
        resetWasOffline: mockResetWasOffline,
      });

      render(<ConnectionStatus />);

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveClass('z-50');
    });
  });

  describe('Cleanup', () => {
    it('should clean up timer on unmount', () => {
      mockUseOnlineStatus.mockReturnValue({
        isOnline: true,
        wasOffline: true,
        resetWasOffline: mockResetWasOffline,
      });

      const { unmount } = render(<ConnectionStatus />);

      // Unmount before timer completes
      unmount();

      // Advance timers - should not cause any errors
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // resetWasOffline should not have been called after unmount
      expect(mockResetWasOffline).not.toHaveBeenCalled();
    });
  });
});
