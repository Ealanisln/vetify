'use client';

import { ThemeProvider } from 'next-themes';

interface ForceLightThemeProps {
  children: React.ReactNode;
}

/**
 * Forces light theme for public clinic pages.
 * This overrides the global theme preference from the dashboard.
 * Can be removed when dark mode support is added for public pages.
 */
export function ForceLightTheme({ children }: ForceLightThemeProps) {
  return (
    <ThemeProvider forcedTheme="light" attribute="class">
      {children}
    </ThemeProvider>
  );
}
