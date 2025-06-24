/**
 * Theme color utilities for consistent dark/light mode styling
 * Provides pre-defined class combinations for common UI elements
 */

export const themeColors = {
  // Background colors
  background: {
    primary: "bg-white dark:bg-gray-900",
    secondary: "bg-gray-50 dark:bg-gray-800",
    tertiary: "bg-gray-100 dark:bg-gray-700",
    card: "bg-white dark:bg-gray-800",
    muted: "bg-gray-50 dark:bg-gray-800/50",
  },

  // Text colors
  text: {
    primary: "text-gray-900 dark:text-gray-100",
    secondary: "text-gray-600 dark:text-gray-400",
    muted: "text-gray-500 dark:text-gray-500",
    inverse: "text-white dark:text-gray-900",
    accent: "text-[#5b9788] dark:text-[#75a99c]",
  },

  // Border colors
  border: {
    primary: "border-gray-200 dark:border-gray-700",
    secondary: "border-gray-300 dark:border-gray-600",
    muted: "border-gray-100 dark:border-gray-800",
    accent: "border-[#d5e3df] dark:border-gray-700",
  },

  // Input styles
  input: {
    base: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400",
    focus: "focus:ring-[#75a99c] focus:border-[#75a99c]",
    disabled: "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400",
  },

  // Button styles
  button: {
    primary: "bg-[#75a99c] hover:bg-[#5b9788] text-white focus:ring-[#75a99c]",
    secondary: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600",
    ghost: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
  },

  // Hover states
  hover: {
    muted: "hover:bg-gray-50 dark:hover:bg-gray-800",
    accent: "hover:bg-[#e5f1ee] dark:hover:bg-[#2a3630]/30",
    card: "hover:bg-gray-50 dark:hover:bg-gray-700",
  },

  // Status colors (with dark mode variants)
  status: {
    success: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  },

  // Table styles
  table: {
    header: "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
    row: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
    rowHover: "hover:bg-gray-50 dark:hover:bg-gray-800",
    cell: "text-gray-900 dark:text-gray-100",
    cellMuted: "text-gray-600 dark:text-gray-400",
  },

  // Navigation styles
  nav: {
    background: "bg-white dark:bg-gray-900",
    link: "text-gray-800 dark:text-gray-200 hover:text-[#5b9788] dark:hover:text-[#75a99c]",
    linkActive: "text-[#75a99c] dark:text-[#75a99c]",
    border: "border-[#d5e3df] dark:border-gray-800",
  },

  // Modal styles
  modal: {
    backdrop: "bg-black/50 dark:bg-black/70",
    content: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    header: "border-gray-200 dark:border-gray-700",
  },
} as const;

/**
 * Helper function to get multiple theme classes
 * @param keys - Array of keys to combine (e.g., ['background.card', 'text.primary'])
 */
export function getThemeClasses(...keys: string[]): string {
  return keys
    .map(key => {
      const parts = key.split('.');
      let current: unknown = themeColors;
      for (const part of parts) {
        if (typeof current === 'object' && current !== null && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          console.warn(`Theme color key '${key}' not found`);
          return '';
        }
      }
      return typeof current === 'string' ? current : '';
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Responsive breakpoint utilities
 */
export const responsive = {
  // Grid layouts
  grid: {
    auto: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    cards: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    stats: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    form: "grid-cols-1 sm:grid-cols-2",
  },

  // Spacing
  padding: {
    page: "p-4 sm:p-6 lg:p-8",
    card: "p-4 sm:p-6",
    section: "px-4 py-6 sm:px-6 lg:px-8",
  },

  // Typography
  text: {
    heading: "text-2xl sm:text-3xl lg:text-4xl",
    subheading: "text-lg sm:text-xl lg:text-2xl",
    body: "text-sm sm:text-base",
  },

  // Layout
  container: "max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl",
  modal: "max-w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl",
} as const;

/**
 * Mobile-first responsive table component classes
 */
export const responsiveTable = {
  container: "overflow-x-auto sm:overflow-x-visible",
  table: "min-w-full divide-y divide-gray-200 dark:divide-gray-700",
  header: "hidden sm:table-header-group",
  row: "block sm:table-row border-b sm:border-b-0 border-gray-200 dark:border-gray-700 mb-4 sm:mb-0",
  cell: "block sm:table-cell px-3 py-2 sm:px-6 sm:py-4",
  mobileLabel: "inline-block sm:hidden font-medium text-gray-500 dark:text-gray-400 min-w-24 mr-2",
} as const; 