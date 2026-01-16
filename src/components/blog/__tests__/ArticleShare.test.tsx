/**
 * Component tests for ArticleShare
 * Tests social sharing buttons and copy to clipboard functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArticleShare } from '../ArticleShare';

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(),
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

describe('ArticleShare', () => {
  const defaultProps = {
    title: 'Cómo cuidar a tu mascota',
    url: '/blog/cuidar-mascota',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the share section title', () => {
    render(<ArticleShare {...defaultProps} />);

    expect(screen.getByText('Compartir artículo')).toBeInTheDocument();
  });

  it('should render all social sharing buttons', () => {
    render(<ArticleShare {...defaultProps} />);

    expect(screen.getByLabelText('Compartir en Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('Compartir en Facebook')).toBeInTheDocument();
    expect(screen.getByLabelText('Compartir en LinkedIn')).toBeInTheDocument();
    expect(screen.getByLabelText('Compartir en WhatsApp')).toBeInTheDocument();
  });

  it('should render copy link button', () => {
    render(<ArticleShare {...defaultProps} />);

    expect(screen.getByLabelText('Copiar enlace')).toBeInTheDocument();
  });

  it('should have correct Twitter share URL', () => {
    render(<ArticleShare {...defaultProps} />);

    const twitterButton = screen.getByLabelText('Compartir en Twitter');
    const href = twitterButton.getAttribute('href');

    expect(href).toContain('https://twitter.com/intent/tweet');
    expect(href).toContain(encodeURIComponent(defaultProps.title));
    // URL should contain the path
    expect(href).toContain(encodeURIComponent('/blog/cuidar-mascota'));
  });

  it('should have correct Facebook share URL', () => {
    render(<ArticleShare {...defaultProps} />);

    const facebookButton = screen.getByLabelText('Compartir en Facebook');
    const href = facebookButton.getAttribute('href');

    expect(href).toContain('https://www.facebook.com/sharer/sharer.php');
    // URL should contain the path
    expect(href).toContain(encodeURIComponent('/blog/cuidar-mascota'));
  });

  it('should have correct LinkedIn share URL', () => {
    render(<ArticleShare {...defaultProps} />);

    const linkedInButton = screen.getByLabelText('Compartir en LinkedIn');
    const href = linkedInButton.getAttribute('href');

    expect(href).toContain('https://www.linkedin.com/shareArticle');
    expect(href).toContain('mini=true');
    expect(href).toContain(encodeURIComponent(defaultProps.title));
  });

  it('should have correct WhatsApp share URL', () => {
    render(<ArticleShare {...defaultProps} />);

    const whatsAppButton = screen.getByLabelText('Compartir en WhatsApp');
    const href = whatsAppButton.getAttribute('href');

    expect(href).toContain('https://wa.me/');
    expect(href).toContain(encodeURIComponent(defaultProps.title));
  });

  it('should open share links in new tab', () => {
    render(<ArticleShare {...defaultProps} />);

    const shareButtons = [
      screen.getByLabelText('Compartir en Twitter'),
      screen.getByLabelText('Compartir en Facebook'),
      screen.getByLabelText('Compartir en LinkedIn'),
      screen.getByLabelText('Compartir en WhatsApp'),
    ];

    shareButtons.forEach((button) => {
      expect(button).toHaveAttribute('target', '_blank');
      expect(button).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('should copy URL to clipboard when copy button is clicked', async () => {
    mockClipboard.writeText.mockResolvedValue(undefined);

    render(<ArticleShare {...defaultProps} />);

    const copyButton = screen.getByLabelText('Copiar enlace');
    fireEvent.click(copyButton);

    await waitFor(() => {
      // Should be called with a URL containing the path
      expect(mockClipboard.writeText).toHaveBeenCalled();
      const calledUrl = mockClipboard.writeText.mock.calls[0][0];
      expect(calledUrl).toContain('/blog/cuidar-mascota');
    });
  });

  it('should show success state after copying', async () => {
    mockClipboard.writeText.mockResolvedValue(undefined);

    render(<ArticleShare {...defaultProps} />);

    const copyButton = screen.getByLabelText('Copiar enlace');
    fireEvent.click(copyButton);

    await waitFor(() => {
      // Check for success styling (green background)
      expect(copyButton).toHaveClass('bg-green-500');
    });
  });

  it('should handle clipboard error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));

    render(<ArticleShare {...defaultProps} />);

    const copyButton = screen.getByLabelText('Copiar enlace');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should encode special characters in title and URL', () => {
    const propsWithSpecialChars = {
      title: '¿Cómo cuidar a tu mascota? & más',
      url: '/blog/cuidar-mascota-más',
    };

    render(<ArticleShare {...propsWithSpecialChars} />);

    const twitterButton = screen.getByLabelText('Compartir en Twitter');
    const href = twitterButton.getAttribute('href');

    // Special characters in the title should be URL-encoded
    // The & in the title should become %26, not remain as raw &
    // Note: Query string separators are & by design, but content should be encoded
    expect(href).toContain(encodeURIComponent(propsWithSpecialChars.title));
    // Verify the title's & is encoded as %26 (not raw &)
    expect(href).toContain('%26');
    // Verify Spanish characters are encoded
    expect(href).toContain('%C2%BF'); // ¿
    expect(href).toContain('%C3%A1'); // á in más
  });
});
