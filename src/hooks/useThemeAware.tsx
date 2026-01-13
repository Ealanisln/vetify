"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * Custom hook to handle theme-aware rendering without hydration mismatches
 * Returns mounted state and resolved theme, ensuring server/client consistency
 */
export function useThemeAware() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a safe theme value that prevents hydration mismatches
  // During SSR and initial client render, we assume light theme
  // When mounted but resolvedTheme is undefined (can happen briefly during navigation),
  // fall back to the stored theme preference or 'light'
  const safeTheme = mounted
    ? (resolvedTheme || theme || 'light')
    : 'light';

  return {
    mounted,
    theme: safeTheme,
    rawTheme: theme, // The actual theme setting (light/dark/system)
    setTheme,
    isLight: safeTheme === 'light',
    isDark: safeTheme === 'dark',
  };
}

/**
 * Utility function to get theme-aware className
 * @param lightClass - Classes for light theme
 * @param darkClass - Classes for dark theme
 * @param mounted - Whether the component is mounted (from useThemeAware)
 * @param theme - Current theme (from useThemeAware)
 */
export function getThemeClass(
  lightClass: string,
  darkClass: string,
  mounted: boolean,
  theme: string | undefined
): string {
  // During SSR and initial render, always use light theme classes
  if (!mounted) {
    return lightClass;
  }
  
  return theme === 'dark' ? darkClass : lightClass;
}

/**
 * Component wrapper that prevents hydration mismatches for theme-dependent content
 */
interface ThemeAwareProps {
  children: (props: { mounted: boolean; theme: string | undefined; isLight: boolean; isDark: boolean }) => React.ReactNode;
  fallback?: React.ReactNode;
}

export function ThemeAware({ children, fallback = null }: ThemeAwareProps) {
  const { mounted, theme, isLight, isDark } = useThemeAware();

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children({ mounted, theme, isLight, isDark })}</>;
} 