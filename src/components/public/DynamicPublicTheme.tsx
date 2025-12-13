'use client';

import { ThemeProvider, useTheme } from 'next-themes';
import { useEffect, useMemo } from 'react';
import {
  generateThemeCSSVariables,
  publicThemeVars,
} from '@/lib/color-utils';
import type { ThemeColors } from '@/lib/themes';

interface DynamicPublicThemeProps {
  children: React.ReactNode;
  /**
   * Primary color for the tenant (hex format)
   * Used to generate light and dark mode color variants
   */
  primaryColor: string;
  /**
   * Optional light mode theme colors from the tenant's selected theme
   * Will be used as base for light mode if provided
   */
  themeColors?: Partial<ThemeColors>;
}

/**
 * Inner component that applies CSS variables based on current theme
 */
function ThemeVariablesInjector({
  children,
  primaryColor,
  themeColors,
}: DynamicPublicThemeProps) {
  const { resolvedTheme } = useTheme();

  // Generate CSS variables for both light and dark modes
  const cssVariables = useMemo(() => {
    return generateThemeCSSVariables(primaryColor, {
      primary: themeColors?.primary || primaryColor,
      primaryHover: themeColors?.primaryHover,
      primaryLight: themeColors?.primaryLight,
      secondary: themeColors?.secondary,
      accent: themeColors?.accent,
      background: themeColors?.background,
      backgroundAlt: themeColors?.backgroundAlt,
      text: themeColors?.text,
      textMuted: themeColors?.textMuted,
      border: themeColors?.border,
      cardBg: themeColors?.cardBg,
      heroGradientFrom: themeColors?.heroGradientFrom,
      heroGradientTo: themeColors?.heroGradientTo,
    });
  }, [primaryColor, themeColors]);

  // Apply CSS variables to document root based on current theme
  useEffect(() => {
    const root = document.documentElement;
    const isDark = resolvedTheme === 'dark';
    const variables = isDark ? cssVariables.dark : cssVariables.light;

    // Apply all CSS variables
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Cleanup on unmount or theme change
    return () => {
      Object.keys(variables).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [cssVariables, resolvedTheme]);

  return <>{children}</>;
}

/**
 * Dynamic theme provider for public clinic pages.
 * Supports automatic dark/light mode based on visitor's system preference.
 * Generates dark mode colors automatically from the tenant's primary color.
 */
export function DynamicPublicTheme({
  children,
  primaryColor,
  themeColors,
}: DynamicPublicThemeProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="vetify-public-theme"
    >
      <ThemeVariablesInjector
        primaryColor={primaryColor}
        themeColors={themeColors}
      >
        {children}
      </ThemeVariablesInjector>
    </ThemeProvider>
  );
}

/**
 * CSS class utilities for using public theme variables in components
 * Use these with Tailwind's arbitrary value syntax or inline styles
 */
export const publicThemeClasses = {
  // Backgrounds
  bg: {
    primary: `bg-[var(${publicThemeVars.background})]`,
    alt: `bg-[var(${publicThemeVars.backgroundAlt})]`,
    card: `bg-[var(${publicThemeVars.cardBg})]`,
    accent: `bg-[var(${publicThemeVars.primaryLight})]`,
  },

  // Text
  text: {
    primary: `text-[var(${publicThemeVars.text})]`,
    muted: `text-[var(${publicThemeVars.textMuted})]`,
    accent: `text-[var(${publicThemeVars.primary})]`,
  },

  // Borders
  border: {
    primary: `border-[var(${publicThemeVars.border})]`,
    accent: `border-[var(${publicThemeVars.primary})]`,
  },
} as const;

/**
 * Helper to get inline style object using theme variables
 */
export function getPublicThemeStyle(
  property: keyof typeof publicThemeVars
): React.CSSProperties {
  const cssProperty =
    property === 'background' || property === 'backgroundAlt' || property === 'cardBg'
      ? 'backgroundColor'
      : property === 'text' || property === 'textMuted'
        ? 'color'
        : property === 'border'
          ? 'borderColor'
          : 'color';

  return {
    [cssProperty]: `var(${publicThemeVars[property]})`,
  };
}

/**
 * Get CSS variable value for use in inline styles
 */
export function cssVar(property: keyof typeof publicThemeVars): string {
  return `var(${publicThemeVars[property]})`;
}
