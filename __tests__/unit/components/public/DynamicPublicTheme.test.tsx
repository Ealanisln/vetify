/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  DynamicPublicTheme,
  publicThemeClasses,
  getPublicThemeStyle,
  cssVar,
} from '@/components/public/DynamicPublicTheme';
import { generateThemeCSSVariables } from '@/lib/color-utils';

// Mock next-themes
let mockResolvedTheme: string | undefined = 'light';

jest.mock('next-themes', () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
  }),
}));

// Mock color-utils
const mockLightVariables = {
  '--public-primary': '#75a99c',
  '--public-background': '#ffffff',
  '--public-text': '#1f2937',
};

const mockDarkVariables = {
  '--public-primary': '#75a99c',
  '--public-background': '#1f2937',
  '--public-text': '#f9fafb',
};

jest.mock('@/lib/color-utils', () => ({
  generateThemeCSSVariables: jest.fn(() => ({
    light: mockLightVariables,
    dark: mockDarkVariables,
  })),
  publicThemeVars: {
    primary: '--public-primary',
    primaryHover: '--public-primary-hover',
    primaryLight: '--public-primary-light',
    secondary: '--public-secondary',
    accent: '--public-accent',
    background: '--public-background',
    backgroundAlt: '--public-background-alt',
    text: '--public-text',
    textMuted: '--public-text-muted',
    border: '--public-border',
    cardBg: '--public-card-bg',
    heroGradientFrom: '--public-hero-gradient-from',
    heroGradientTo: '--public-hero-gradient-to',
  },
}));

// Get mocked function for assertions
const mockGenerateThemeCSSVariables = generateThemeCSSVariables as jest.MockedFunction<typeof generateThemeCSSVariables>;

describe('DynamicPublicTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolvedTheme = 'light';
    // Clear any CSS variables set on document
    Object.keys(mockLightVariables).forEach((key) => {
      document.documentElement.style.removeProperty(key);
    });
    Object.keys(mockDarkVariables).forEach((key) => {
      document.documentElement.style.removeProperty(key);
    });
  });

  describe('Children Rendering', () => {
    it('should render children correctly', () => {
      render(
        <DynamicPublicTheme primaryColor="#75a99c">
          <div data-testid="child">Child content</div>
        </DynamicPublicTheme>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('child')).toHaveTextContent('Child content');
    });

    it('should render multiple children', () => {
      render(
        <DynamicPublicTheme primaryColor="#75a99c">
          <div data-testid="child1">First</div>
          <div data-testid="child2">Second</div>
        </DynamicPublicTheme>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('CSS Variable Application', () => {
    it('should apply light theme CSS variables when theme is light', async () => {
      mockResolvedTheme = 'light';

      render(
        <DynamicPublicTheme primaryColor="#75a99c">
          <div>Content</div>
        </DynamicPublicTheme>
      );

      await waitFor(() => {
        const root = document.documentElement;
        expect(root.style.getPropertyValue('--public-background')).toBe('#ffffff');
        expect(root.style.getPropertyValue('--public-text')).toBe('#1f2937');
      });
    });

    it('should apply dark theme CSS variables when theme is dark', async () => {
      mockResolvedTheme = 'dark';

      render(
        <DynamicPublicTheme primaryColor="#75a99c">
          <div>Content</div>
        </DynamicPublicTheme>
      );

      await waitFor(() => {
        const root = document.documentElement;
        expect(root.style.getPropertyValue('--public-background')).toBe('#1f2937');
        expect(root.style.getPropertyValue('--public-text')).toBe('#f9fafb');
      });
    });

    it('should clean up CSS variables on unmount', async () => {
      mockResolvedTheme = 'light';

      const { unmount } = render(
        <DynamicPublicTheme primaryColor="#75a99c">
          <div>Content</div>
        </DynamicPublicTheme>
      );

      // Wait for variables to be applied
      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--public-background')).toBe('#ffffff');
      });

      // Unmount
      unmount();

      // Variables should be cleaned up
      expect(document.documentElement.style.getPropertyValue('--public-background')).toBe('');
    });
  });

  describe('Theme Changes', () => {
    it('should default to light theme when resolvedTheme is undefined', async () => {
      mockResolvedTheme = undefined;

      render(
        <DynamicPublicTheme primaryColor="#75a99c">
          <div>Content</div>
        </DynamicPublicTheme>
      );

      await waitFor(() => {
        const root = document.documentElement;
        // Should use light variables when theme is undefined
        expect(root.style.getPropertyValue('--public-background')).toBe('#ffffff');
      });
    });
  });

  describe('Props Handling', () => {
    it('should accept primaryColor prop', () => {
      render(
        <DynamicPublicTheme primaryColor="#ff5500">
          <div>Content</div>
        </DynamicPublicTheme>
      );

      expect(mockGenerateThemeCSSVariables).toHaveBeenCalledWith(
        '#ff5500',
        expect.objectContaining({
          primary: '#ff5500',
        })
      );
    });

    it('should accept optional themeColors prop', () => {
      const customColors = {
        primary: '#custom1',
        secondary: '#custom2',
        accent: '#custom3',
      };

      render(
        <DynamicPublicTheme primaryColor="#75a99c" themeColors={customColors}>
          <div>Content</div>
        </DynamicPublicTheme>
      );

      expect(mockGenerateThemeCSSVariables).toHaveBeenCalledWith(
        '#75a99c',
        expect.objectContaining({
          primary: '#custom1',
          secondary: '#custom2',
          accent: '#custom3',
        })
      );
    });
  });
});

describe('publicThemeClasses', () => {
  it('should have background classes', () => {
    expect(publicThemeClasses.bg.primary).toContain('bg-[var(');
    expect(publicThemeClasses.bg.alt).toContain('bg-[var(');
    expect(publicThemeClasses.bg.card).toContain('bg-[var(');
    expect(publicThemeClasses.bg.accent).toContain('bg-[var(');
  });

  it('should have text classes', () => {
    expect(publicThemeClasses.text.primary).toContain('text-[var(');
    expect(publicThemeClasses.text.muted).toContain('text-[var(');
    expect(publicThemeClasses.text.accent).toContain('text-[var(');
  });

  it('should have border classes', () => {
    expect(publicThemeClasses.border.primary).toContain('border-[var(');
    expect(publicThemeClasses.border.accent).toContain('border-[var(');
  });
});

describe('getPublicThemeStyle', () => {
  it('should return backgroundColor for background properties', () => {
    const style = getPublicThemeStyle('background');
    expect(style).toHaveProperty('backgroundColor');
    expect(style.backgroundColor).toContain('var(--public-background)');
  });

  it('should return backgroundColor for backgroundAlt', () => {
    const style = getPublicThemeStyle('backgroundAlt');
    expect(style).toHaveProperty('backgroundColor');
  });

  it('should return backgroundColor for cardBg', () => {
    const style = getPublicThemeStyle('cardBg');
    expect(style).toHaveProperty('backgroundColor');
  });

  it('should return color for text properties', () => {
    const style = getPublicThemeStyle('text');
    expect(style).toHaveProperty('color');
    expect(style.color).toContain('var(--public-text)');
  });

  it('should return color for textMuted', () => {
    const style = getPublicThemeStyle('textMuted');
    expect(style).toHaveProperty('color');
  });

  it('should return borderColor for border property', () => {
    const style = getPublicThemeStyle('border');
    expect(style).toHaveProperty('borderColor');
  });

  it('should return color for other properties', () => {
    const style = getPublicThemeStyle('primary');
    expect(style).toHaveProperty('color');
  });
});

describe('cssVar', () => {
  it('should return CSS variable syntax for primary', () => {
    const result = cssVar('primary');
    expect(result).toBe('var(--public-primary)');
  });

  it('should return CSS variable syntax for background', () => {
    const result = cssVar('background');
    expect(result).toBe('var(--public-background)');
  });

  it('should return CSS variable syntax for text', () => {
    const result = cssVar('text');
    expect(result).toBe('var(--public-text)');
  });

  it('should return CSS variable syntax for all theme vars', () => {
    const properties: Array<keyof typeof import('@/lib/color-utils').publicThemeVars> = [
      'primary',
      'primaryHover',
      'primaryLight',
      'secondary',
      'accent',
      'background',
      'backgroundAlt',
      'text',
      'textMuted',
      'border',
      'cardBg',
      'heroGradientFrom',
      'heroGradientTo',
    ];

    properties.forEach((prop) => {
      const result = cssVar(prop);
      expect(result).toMatch(/^var\(--public-/);
    });
  });
});
