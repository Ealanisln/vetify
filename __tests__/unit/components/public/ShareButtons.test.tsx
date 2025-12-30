import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ShareButtons, ShareButtonInline } from '@/components/public/ShareButtons';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => <div {...props}>{children}</div>,
    button: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe('ShareButtons', () => {
  const defaultProps = {
    url: 'https://example.com/clinic/test',
    title: 'Test Clinic - Best Veterinary Care',
    description: 'Visit our clinic for the best pet care services',
  };

  let mockWindowOpen: jest.SpyInstance;
  let mockClipboard: { writeText: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window.open
    mockWindowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);

    // Mock clipboard
    mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });

    // Mock navigator.share as undefined (fallback mode)
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    mockWindowOpen.mockRestore();
  });

  describe('ShareButtons Component', () => {
    it('should render share button', () => {
      render(<ShareButtons {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with "Compartir" text', () => {
      render(<ShareButtons {...defaultProps} />);
      expect(screen.getByText('Compartir')).toBeInTheDocument();
    });

    it('should open dropdown when clicked (fallback mode)', async () => {
      render(<ShareButtons {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /compartir/i });
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText('Facebook')).toBeInTheDocument();
        expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
        expect(screen.getByText('WhatsApp')).toBeInTheDocument();
        expect(screen.getByText('Copiar enlace')).toBeInTheDocument();
      });
    });

    it('should close dropdown when close button is clicked', async () => {
      render(<ShareButtons {...defaultProps} />);

      // Open dropdown
      const shareButton = screen.getByRole('button', { name: /compartir/i });
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText('Facebook')).toBeInTheDocument();
      });

      // Close dropdown
      const closeButton = screen.getByRole('button', { name: /cerrar/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when backdrop is clicked', async () => {
      render(<ShareButtons {...defaultProps} />);

      // Open dropdown
      const shareButton = screen.getByRole('button', { name: /compartir/i });
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText('Facebook')).toBeInTheDocument();
      });

      // Click backdrop (fixed inset-0 div)
      const backdrop = document.querySelector('.fixed.inset-0');
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);

      await waitFor(() => {
        expect(screen.queryByText('Facebook')).not.toBeInTheDocument();
      });
    });

    it('should open Facebook share URL with correct parameters', async () => {
      render(<ShareButtons {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /compartir/i }));

      await waitFor(() => {
        expect(screen.getByText('Facebook')).toBeInTheDocument();
      });

      // Click Facebook
      fireEvent.click(screen.getByText('Facebook'));

      const encodedUrl = encodeURIComponent(defaultProps.url);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should open Twitter share URL with correct parameters', async () => {
      render(<ShareButtons {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /compartir/i }));

      await waitFor(() => {
        expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
      });

      // Click Twitter
      fireEvent.click(screen.getByText('X (Twitter)'));

      const encodedUrl = encodeURIComponent(defaultProps.url);
      const encodedTitle = encodeURIComponent(defaultProps.title);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should open WhatsApp share URL with correct parameters', async () => {
      render(<ShareButtons {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /compartir/i }));

      await waitFor(() => {
        expect(screen.getByText('WhatsApp')).toBeInTheDocument();
      });

      // Click WhatsApp
      fireEvent.click(screen.getByText('WhatsApp'));

      const encodedUrl = encodeURIComponent(defaultProps.url);
      const encodedTitle = encodeURIComponent(defaultProps.title);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should copy URL to clipboard when copy link is clicked', async () => {
      render(<ShareButtons {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /compartir/i }));

      await waitFor(() => {
        expect(screen.getByText('Copiar enlace')).toBeInTheDocument();
      });

      // Click copy link
      fireEvent.click(screen.getByText('Copiar enlace'));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(defaultProps.url);
      });
    });

    it('should show "¡Copiado!" after copying link', async () => {
      render(<ShareButtons {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /compartir/i }));

      await waitFor(() => {
        expect(screen.getByText('Copiar enlace')).toBeInTheDocument();
      });

      // Click copy link
      fireEvent.click(screen.getByText('Copiar enlace'));

      await waitFor(() => {
        expect(screen.getByText('¡Copiado!')).toBeInTheDocument();
      });
    });

    it('should revert to "Copiar enlace" after 2 seconds', async () => {
      render(<ShareButtons {...defaultProps} />);

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /compartir/i }));

      await waitFor(() => {
        expect(screen.getByText('Copiar enlace')).toBeInTheDocument();
      });

      // Click copy link
      fireEvent.click(screen.getByText('Copiar enlace'));

      await waitFor(() => {
        expect(screen.getByText('¡Copiado!')).toBeInTheDocument();
      });

      // Advance timers by 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(screen.getByText('Copiar enlace')).toBeInTheDocument();
      });
    });

    it('should apply custom theme color', () => {
      const customColor = '#FF5733';
      render(<ShareButtons {...defaultProps} themeColor={customColor} />);

      const button = screen.getByRole('button', { name: /compartir/i });
      expect(button).toHaveStyle({ borderColor: customColor });
      expect(button).toHaveStyle({ color: customColor });
    });

    it('should use default theme color when not provided', () => {
      render(<ShareButtons {...defaultProps} />);

      const button = screen.getByRole('button', { name: /compartir/i });
      expect(button).toHaveStyle({ borderColor: '#75a99c' });
    });

    it('should use Web Share API when available', async () => {
      const mockShare = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });

      render(<ShareButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /compartir/i }));

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          title: defaultProps.title,
          text: defaultProps.description,
          url: defaultProps.url,
        });
      });
    });
  });

  describe('ShareButtonInline Component', () => {
    it('should render all 4 share buttons', () => {
      render(<ShareButtonInline {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /compartir en facebook/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /compartir en twitter/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /compartir en whatsapp/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /copiar enlace/i })
      ).toBeInTheDocument();
    });

    it('should render "Compartir:" label', () => {
      render(<ShareButtonInline {...defaultProps} />);
      expect(screen.getByText('Compartir:')).toBeInTheDocument();
    });

    it('should open Facebook share URL when clicked', () => {
      render(<ShareButtonInline {...defaultProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /compartir en facebook/i })
      );

      const encodedUrl = encodeURIComponent(defaultProps.url);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should open Twitter share URL when clicked', () => {
      render(<ShareButtonInline {...defaultProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /compartir en twitter/i })
      );

      const encodedUrl = encodeURIComponent(defaultProps.url);
      const encodedTitle = encodeURIComponent(defaultProps.title);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should open WhatsApp share URL when clicked', () => {
      render(<ShareButtonInline {...defaultProps} />);

      fireEvent.click(
        screen.getByRole('button', { name: /compartir en whatsapp/i })
      );

      const encodedUrl = encodeURIComponent(defaultProps.url);
      const encodedTitle = encodeURIComponent(defaultProps.title);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should copy URL to clipboard when copy button is clicked', async () => {
      render(<ShareButtonInline {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /copiar enlace/i }));

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(defaultProps.url);
      });
    });

    it('should show check icon after copying', async () => {
      const { container } = render(<ShareButtonInline {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /copiar enlace/i }));

      await waitFor(() => {
        // Check icon should appear (green-500 color)
        const checkIcon = container.querySelector('.text-green-500');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it('should revert copy icon after 2 seconds', async () => {
      const { container } = render(<ShareButtonInline {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /copiar enlace/i }));

      await waitFor(() => {
        const checkIcon = container.querySelector('.text-green-500');
        expect(checkIcon).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        const checkIcon = container.querySelector('.text-green-500');
        expect(checkIcon).not.toBeInTheDocument();
      });
    });
  });

  describe('URL Encoding', () => {
    it('should properly encode URLs with special characters', () => {
      const propsWithSpecialChars = {
        url: 'https://example.com/clinic?name=test&id=123',
        title: 'Test & Clinic - "Best" Care!',
      };

      render(<ShareButtonInline {...propsWithSpecialChars} />);

      fireEvent.click(
        screen.getByRole('button', { name: /compartir en twitter/i })
      );

      // Verify URL was encoded
      expect(mockWindowOpen).toHaveBeenCalled();
      const calledUrl = mockWindowOpen.mock.calls[0][0] as string;
      expect(calledUrl).toContain(
        encodeURIComponent(propsWithSpecialChars.url)
      );
      expect(calledUrl).toContain(
        encodeURIComponent(propsWithSpecialChars.title)
      );
    });

    it('should handle empty URL gracefully', () => {
      render(<ShareButtonInline url="" title="Test" />);

      fireEvent.click(
        screen.getByRole('button', { name: /compartir en facebook/i })
      );

      expect(mockWindowOpen).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<ShareButtonInline {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /compartir en facebook/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /compartir en twitter/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /compartir en whatsapp/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /copiar enlace/i })
      ).toBeInTheDocument();
    });

    it('should have close button with aria-label', async () => {
      render(<ShareButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /compartir/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /cerrar/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle clipboard error gracefully', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

      render(<ShareButtonInline {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /copiar enlace/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to copy:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle Web Share API AbortError gracefully', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';

      const mockShare = jest.fn().mockRejectedValue(abortError);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<ShareButtons {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /compartir/i }));

      await waitFor(() => {
        // AbortError should not be logged
        expect(consoleSpy).not.toHaveBeenCalledWith(
          'Share failed:',
          expect.anything()
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
