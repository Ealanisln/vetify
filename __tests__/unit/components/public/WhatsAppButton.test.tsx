import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { WhatsAppButton } from '@/components/public/WhatsAppButton';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      ...props
    }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    ),
    button: ({
      children,
      className,
      style,
      onClick,
      ...props
    }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      onClick?: () => void;
      [key: string]: unknown;
    }) => (
      <button className={className} style={style} onClick={onClick} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('WhatsAppButton', () => {
  const defaultProps = {
    phoneNumber: '+1-555-123-4567',
    clinicName: 'Test Veterinary Clinic',
  };

  let mockWindowOpen: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window.open
    mockWindowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    jest.useRealTimers();
    mockWindowOpen.mockRestore();
  });

  describe('Visibility and Timing', () => {
    it('should not be visible initially', () => {
      render(<WhatsAppButton {...defaultProps} />);

      expect(
        screen.queryByRole('button', { name: /contactar por whatsapp/i })
      ).not.toBeInTheDocument();
    });

    it('should become visible after 2 seconds', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      // Button should not be visible initially
      expect(
        screen.queryByRole('button', { name: /contactar por whatsapp/i })
      ).not.toBeInTheDocument();

      // Advance timer by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });
    });

    it('should show tooltip after 3 seconds of being visible', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      // Make button visible
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      // Tooltip should not be visible yet
      expect(
        screen.queryByText(/necesitas ayuda/i)
      ).not.toBeInTheDocument();

      // Advance timer by 3 more seconds
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/necesitas ayuda/i)
        ).toBeInTheDocument();
      });
    });

    it('should hide tooltip after 5 seconds of visibility (8 seconds total)', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      // Make button visible (2s) + show tooltip (3s) + hide tooltip (3s more = 8s total)
      act(() => {
        jest.advanceTimersByTime(8000);
      });

      // After 8 seconds total (2s button + 3s tooltip show + 3s more = 8s hide timer)
      // The tooltip should be hidden
      await waitFor(() => {
        expect(
          screen.queryByText(/necesitas ayuda/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Phone Number Cleaning', () => {
    it('should clean phone number with spaces', async () => {
      render(
        <WhatsAppButton
          phoneNumber="555 123 4567"
          clinicName="Test Clinic"
        />
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      expect(mockWindowOpen).toHaveBeenCalled();
      const calledUrl = mockWindowOpen.mock.calls[0][0] as string;
      expect(calledUrl).toContain('wa.me/5551234567');
    });

    it('should clean phone number with dashes', async () => {
      render(
        <WhatsAppButton
          phoneNumber="555-123-4567"
          clinicName="Test Clinic"
        />
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      const calledUrl = mockWindowOpen.mock.calls[0][0] as string;
      expect(calledUrl).toContain('wa.me/5551234567');
    });

    it('should clean phone number with plus sign', async () => {
      render(
        <WhatsAppButton
          phoneNumber="+15551234567"
          clinicName="Test Clinic"
        />
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      const calledUrl = mockWindowOpen.mock.calls[0][0] as string;
      expect(calledUrl).toContain('wa.me/15551234567');
    });

    it('should clean phone number with parentheses', async () => {
      render(
        <WhatsAppButton
          phoneNumber="(555) 123-4567"
          clinicName="Test Clinic"
        />
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      const calledUrl = mockWindowOpen.mock.calls[0][0] as string;
      expect(calledUrl).toContain('wa.me/5551234567');
    });
  });

  describe('WhatsApp URL Construction', () => {
    it('should construct correct WhatsApp URL with default message', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/'),
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should include clinic name in default message', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      const calledUrl = mockWindowOpen.mock.calls[0][0] as string;
      const decodedUrl = decodeURIComponent(calledUrl);
      expect(decodedUrl).toContain(defaultProps.clinicName);
      expect(decodedUrl).toContain('agendar una cita');
    });

    it('should use custom message when provided', async () => {
      const customMessage = 'Hola, tengo una emergencia con mi mascota';
      render(
        <WhatsAppButton {...defaultProps} message={customMessage} />
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      const calledUrl = mockWindowOpen.mock.calls[0][0] as string;
      expect(calledUrl).toContain(encodeURIComponent(customMessage));
    });

    it('should properly URL encode the message', async () => {
      const messageWithSpecialChars = 'Hola! ¿Cómo puedo agendar?';
      render(
        <WhatsAppButton {...defaultProps} message={messageWithSpecialChars} />
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      const calledUrl = mockWindowOpen.mock.calls[0][0] as string;
      expect(calledUrl).toContain('text=');
      expect(calledUrl).not.toContain('¿'); // Should be encoded
    });
  });

  describe('Click Behavior', () => {
    it('should open WhatsApp URL in new tab when clicked', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('wa.me'),
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should hide tooltip when button is clicked', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      // Make button visible (2s) then wait for tooltip (3s more)
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByText(/necesitas ayuda/i)).toBeInTheDocument();
      });

      // Click button
      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      await waitFor(() => {
        expect(
          screen.queryByText(/necesitas ayuda/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should prevent tooltip from showing again after clicking', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      // Make button visible
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });

      // Click before tooltip shows
      fireEvent.click(
        screen.getByRole('button', { name: /contactar por whatsapp/i })
      );

      // Advance time past when tooltip would show
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Tooltip should not appear
      expect(
        screen.queryByText(/necesitas ayuda/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Tooltip Dismiss', () => {
    it('should have close button on tooltip', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      // Show button (2s) then tooltip (3s more)
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByText(/necesitas ayuda/i)).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: /cerrar/i })
      ).toBeInTheDocument();
    });

    it('should dismiss tooltip when close button is clicked', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      // Show button (2s) then tooltip (3s more)
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByText(/necesitas ayuda/i)).toBeInTheDocument();
      });

      // Click close button
      fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));

      await waitFor(() => {
        expect(
          screen.queryByText(/necesitas ayuda/i)
        ).not.toBeInTheDocument();
      });
    });

    it('should prevent tooltip from showing again after dismissing', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      // Show button (2s) then tooltip (3s more)
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByText(/necesitas ayuda/i)).toBeInTheDocument();
      });

      // Dismiss tooltip
      fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));

      // Wait some time and verify tooltip doesn't reappear
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(
        screen.queryByText(/necesitas ayuda/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label on WhatsApp button', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /contactar por whatsapp/i })
        ).toBeInTheDocument();
      });
    });

    it('should have correct aria-label on tooltip close button', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      // Show button (2s) then tooltip (3s more)
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /cerrar/i })
        ).toBeInTheDocument();
      });
    });

    it('should be focusable', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /contactar por whatsapp/i,
        });
        expect(button).toBeInTheDocument();
        expect(button.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Styling', () => {
    it('should apply default WhatsApp green color', async () => {
      render(<WhatsAppButton {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const button = screen.getByRole('button', {
          name: /contactar por whatsapp/i,
        });
        expect(button).toHaveStyle({ backgroundColor: '#25D366' });
      });
    });

    it('should be positioned fixed in bottom-right corner', async () => {
      const { container } = render(<WhatsAppButton {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const fixedContainer = container.querySelector('.fixed.bottom-6.right-6');
        expect(fixedContainer).toBeInTheDocument();
      });
    });

    it('should have z-50 for high stacking order', async () => {
      const { container } = render(<WhatsAppButton {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const fixedContainer = container.querySelector('.z-50');
        expect(fixedContainer).toBeInTheDocument();
      });
    });
  });

  describe('Timer Cleanup', () => {
    it('should clean up timers on unmount', () => {
      const { unmount } = render(<WhatsAppButton {...defaultProps} />);

      // Advance part of the timer
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Unmount should not throw
      expect(() => unmount()).not.toThrow();

      // Advancing timers after unmount should not cause issues
      act(() => {
        jest.advanceTimersByTime(5000);
      });
    });
  });
});
