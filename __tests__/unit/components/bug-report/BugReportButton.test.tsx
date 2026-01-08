/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BugReportButton } from '@/components/bug-report/BugReportButton';

// Mock the BugReportModal component
jest.mock('@/components/bug-report/BugReportModal', () => ({
  BugReportModal: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    open ? (
      <div data-testid="bug-report-modal">
        <button onClick={() => onOpenChange(false)}>Close Modal</button>
      </div>
    ) : null
  ),
}));

describe('BugReportButton', () => {
  it('should render the floating button', () => {
    render(<BugReportButton />);

    const button = screen.getByRole('button', { name: /reportar un error/i });
    expect(button).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(<BugReportButton />);

    const button = screen.getByRole('button', { name: /reportar un error/i });
    expect(button).toHaveAttribute('aria-label', 'Reportar un error');
    expect(button).toHaveAttribute('title', 'Reportar un error');
  });

  it('should have fixed positioning classes', () => {
    render(<BugReportButton />);

    const button = screen.getByRole('button', { name: /reportar un error/i });
    expect(button.className).toContain('fixed');
    expect(button.className).toContain('bottom-6');
    expect(button.className).toContain('right-6');
  });

  it('should open modal when clicked', () => {
    render(<BugReportButton />);

    const button = screen.getByRole('button', { name: /reportar un error/i });

    // Modal should not be visible initially
    expect(screen.queryByTestId('bug-report-modal')).not.toBeInTheDocument();

    // Click the button
    fireEvent.click(button);

    // Modal should now be visible
    expect(screen.getByTestId('bug-report-modal')).toBeInTheDocument();
  });

  it('should close modal when onOpenChange is called with false', () => {
    render(<BugReportButton />);

    const button = screen.getByRole('button', { name: /reportar un error/i });

    // Open the modal
    fireEvent.click(button);
    expect(screen.getByTestId('bug-report-modal')).toBeInTheDocument();

    // Close the modal
    const closeButton = screen.getByText('Close Modal');
    fireEvent.click(closeButton);

    // Modal should be closed
    expect(screen.queryByTestId('bug-report-modal')).not.toBeInTheDocument();
  });

  it('should contain a Bug icon', () => {
    render(<BugReportButton />);

    const button = screen.getByRole('button', { name: /reportar un error/i });
    const svg = button.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('h-5', 'w-5');
  });
});
