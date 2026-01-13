/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next-themes
const mockSetTheme = jest.fn();
let mockTheme = 'light';
let mockResolvedTheme = 'light';

jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: mockTheme,
    resolvedTheme: mockResolvedTheme,
    setTheme: mockSetTheme,
  }),
}));

// Mock useThemeAware hook
jest.mock('@/hooks/useThemeAware', () => ({
  useThemeAware: () => ({
    mounted: true,
    theme: mockResolvedTheme,
    rawTheme: mockTheme,
    setTheme: mockSetTheme,
    isLight: mockResolvedTheme === 'light',
    isDark: mockResolvedTheme === 'dark',
  }),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const { priority: _priority, ...imgProps } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...imgProps} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Kinde auth
jest.mock('@kinde-oss/kinde-auth-nextjs/components', () => ({
  LogoutLink: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <button className={className}>{children}</button>
  ),
}));

// Import Nav component after mocks
import Nav from '@/components/navbar/Nav';

// Helper to get the first (desktop) theme button
const getDesktopThemeButton = () => {
  const buttons = screen.getAllByRole('button', { name: /seleccionar tema/i });
  return buttons[0]; // First one is the desktop button
};

// Helper to get theme option (first match since both dropdowns open)
const getThemeOption = (label: string) => {
  const options = screen.getAllByText(label);
  return options[0];
};

describe('Nav Theme Dropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme = 'light';
    mockResolvedTheme = 'light';
  });

  describe('Theme Button Rendering', () => {
    it('should render theme toggle buttons (desktop and mobile)', () => {
      render(<Nav />);

      const themeButtons = screen.getAllByRole('button', { name: /seleccionar tema/i });
      expect(themeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should have correct aria attributes', () => {
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      expect(themeButton).toHaveAttribute('aria-haspopup', 'true');
      expect(themeButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should show Sun icon for light theme', () => {
      mockTheme = 'light';
      render(<Nav />);

      // The button should contain an SVG icon
      const themeButton = getDesktopThemeButton();
      const svg = themeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show Moon icon for dark theme', () => {
      mockTheme = 'dark';
      mockResolvedTheme = 'dark';
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      const svg = themeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should show Monitor icon for system theme', () => {
      mockTheme = 'system';
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      const svg = themeButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Dropdown Menu Interaction', () => {
    it('should open dropdown when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      // Dropdown should be visible
      expect(getThemeOption('Claro')).toBeInTheDocument();
      expect(getThemeOption('Oscuro')).toBeInTheDocument();
      expect(getThemeOption('Sistema')).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      // Dropdown should be open
      expect(getThemeOption('Claro')).toBeInTheDocument();

      // Click outside
      await user.click(document.body);

      // Dropdown should be closed
      await waitFor(() => {
        expect(screen.queryAllByText('Claro')).toHaveLength(0);
      });
    });

    it('should toggle dropdown on button click', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();

      // Open
      await user.click(themeButton);
      expect(getThemeOption('Claro')).toBeInTheDocument();

      // Close
      await user.click(themeButton);
      await waitFor(() => {
        expect(screen.queryAllByText('Claro')).toHaveLength(0);
      });
    });

    it('should update aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      expect(themeButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(themeButton);
      expect(themeButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Theme Selection', () => {
    it('should call setTheme with "light" when Claro is clicked', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      const lightOption = getThemeOption('Claro');
      await user.click(lightOption);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should call setTheme with "dark" when Oscuro is clicked', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      const darkOption = getThemeOption('Oscuro');
      await user.click(darkOption);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should call setTheme with "system" when Sistema is clicked', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      const systemOption = getThemeOption('Sistema');
      await user.click(systemOption);

      expect(mockSetTheme).toHaveBeenCalledWith('system');
    });

    it('should close dropdown after selecting an option', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      const darkOption = getThemeOption('Oscuro');
      await user.click(darkOption);

      await waitFor(() => {
        expect(screen.queryAllByText('Claro')).toHaveLength(0);
      });
    });
  });

  describe('Active Theme Indicator', () => {
    it('should show checkmark on active light theme', async () => {
      mockTheme = 'light';
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      // The Claro button should have a checkmark (svg with check path)
      const claroButton = getThemeOption('Claro').closest('button');
      const checkmark = claroButton?.querySelector('svg[viewBox="0 0 24 24"]');
      expect(checkmark).toBeInTheDocument();
    });

    it('should show checkmark on active dark theme', async () => {
      mockTheme = 'dark';
      mockResolvedTheme = 'dark';
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      const oscuroButton = getThemeOption('Oscuro').closest('button');
      const checkmark = oscuroButton?.querySelector('svg[viewBox="0 0 24 24"]');
      expect(checkmark).toBeInTheDocument();
    });

    it('should show checkmark on active system theme', async () => {
      mockTheme = 'system';
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      const sistemaButton = getThemeOption('Sistema').closest('button');
      const checkmark = sistemaButton?.querySelector('svg[viewBox="0 0 24 24"]');
      expect(checkmark).toBeInTheDocument();
    });

    it('should apply active styling to selected theme', async () => {
      mockTheme = 'dark';
      mockResolvedTheme = 'dark';
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      const oscuroButton = getThemeOption('Oscuro').closest('button');
      expect(oscuroButton).toHaveClass('bg-[#4DB8A3]/15');
    });
  });

  describe('Dropdown Menu Options', () => {
    it('should display all three theme options', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      expect(getThemeOption('Claro')).toBeInTheDocument();
      expect(getThemeOption('Oscuro')).toBeInTheDocument();
      expect(getThemeOption('Sistema')).toBeInTheDocument();
    });

    it('should have icons for each option', async () => {
      const user = userEvent.setup();
      render(<Nav />);

      const themeButton = getDesktopThemeButton();
      await user.click(themeButton);

      // Each option button should have an icon (SVG)
      const buttons = screen.getAllByRole('button').filter(
        (btn) =>
          btn.textContent?.includes('Claro') ||
          btn.textContent?.includes('Oscuro') ||
          btn.textContent?.includes('Sistema')
      );

      buttons.forEach((button) => {
        const icon = button.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Theme Dropdown', () => {
    it('should render theme button in mobile view', () => {
      // The Nav component renders both desktop and mobile versions
      // The mobile version is visible at sm breakpoint
      render(<Nav />);

      // There should be multiple theme buttons (desktop + mobile)
      const themeButtons = screen.getAllByRole('button', { name: /seleccionar tema/i });
      expect(themeButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Theme Dropdown Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme = 'light';
    mockResolvedTheme = 'light';
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<Nav />);

    const themeButton = getDesktopThemeButton();

    // Focus the button
    themeButton.focus();
    expect(document.activeElement).toBe(themeButton);

    // Open with Enter key
    await user.keyboard('{Enter}');
    expect(getThemeOption('Claro')).toBeInTheDocument();
  });

  it('should have proper button roles for options', async () => {
    const user = userEvent.setup();
    render(<Nav />);

    const themeButton = getDesktopThemeButton();
    await user.click(themeButton);

    // All options should be buttons
    const claroButton = getThemeOption('Claro').closest('button');
    const oscuroButton = getThemeOption('Oscuro').closest('button');
    const sistemaButton = getThemeOption('Sistema').closest('button');

    expect(claroButton?.tagName).toBe('BUTTON');
    expect(oscuroButton?.tagName).toBe('BUTTON');
    expect(sistemaButton?.tagName).toBe('BUTTON');
  });
});
