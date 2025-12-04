/**
 * Predefined themes for clinic public landing pages
 * Each theme defines colors, typography, and layout styles
 */

export type ThemeId = 'modern' | 'classic' | 'minimal' | 'vibrant';

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundAlt: string;
  text: string;
  textMuted: string;
  border: string;
  cardBg: string;
  heroGradientFrom: string;
  heroGradientTo: string;
}

export interface ThemeTypography {
  fontFamily: string;
  headingWeight: string;
  bodyWeight: string;
}

export interface ThemeLayout {
  borderRadius: string;
  shadowStyle: 'none' | 'soft' | 'medium' | 'strong';
  buttonStyle: 'rounded' | 'pill' | 'square';
  cardStyle: 'flat' | 'raised' | 'bordered';
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  preview: {
    heroImage: string;
    accentColor: string;
  };
}

export const themes: Record<ThemeId, Theme> = {
  modern: {
    id: 'modern',
    name: 'Moderno',
    description: 'Diseño limpio y profesional con colores frescos',
    colors: {
      primary: '#75a99c',
      primaryHover: '#5d9285',
      primaryLight: '#e8f4f1',
      secondary: '#2d3748',
      accent: '#4299e1',
      background: '#ffffff',
      backgroundAlt: '#f7fafc',
      text: '#1a202c',
      textMuted: '#718096',
      border: '#e2e8f0',
      cardBg: '#ffffff',
      heroGradientFrom: '#e8f4f1',
      heroGradientTo: '#ebf8ff',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingWeight: '700',
      bodyWeight: '400',
    },
    layout: {
      borderRadius: '0.75rem',
      shadowStyle: 'soft',
      buttonStyle: 'rounded',
      cardStyle: 'raised',
    },
    preview: {
      heroImage: '/themes/modern-preview.png',
      accentColor: '#75a99c',
    },
  },

  classic: {
    id: 'classic',
    name: 'Clásico',
    description: 'Elegante y tradicional con tonos cálidos',
    colors: {
      primary: '#8b5a2b',
      primaryHover: '#6d4522',
      primaryLight: '#faf5f0',
      secondary: '#4a5568',
      accent: '#c69963',
      background: '#fffaf5',
      backgroundAlt: '#faf5f0',
      text: '#2d3748',
      textMuted: '#718096',
      border: '#e8d5c4',
      cardBg: '#ffffff',
      heroGradientFrom: '#faf5f0',
      heroGradientTo: '#fff5eb',
    },
    typography: {
      fontFamily: 'Georgia, serif',
      headingWeight: '600',
      bodyWeight: '400',
    },
    layout: {
      borderRadius: '0.5rem',
      shadowStyle: 'medium',
      buttonStyle: 'rounded',
      cardStyle: 'bordered',
    },
    preview: {
      heroImage: '/themes/classic-preview.png',
      accentColor: '#8b5a2b',
    },
  },

  minimal: {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Sencillo y elegante con espacios amplios',
    colors: {
      primary: '#000000',
      primaryHover: '#333333',
      primaryLight: '#f5f5f5',
      secondary: '#666666',
      accent: '#000000',
      background: '#ffffff',
      backgroundAlt: '#fafafa',
      text: '#111111',
      textMuted: '#888888',
      border: '#eeeeee',
      cardBg: '#ffffff',
      heroGradientFrom: '#ffffff',
      heroGradientTo: '#fafafa',
    },
    typography: {
      fontFamily: 'Helvetica Neue, Arial, sans-serif',
      headingWeight: '500',
      bodyWeight: '300',
    },
    layout: {
      borderRadius: '0',
      shadowStyle: 'none',
      buttonStyle: 'square',
      cardStyle: 'flat',
    },
    preview: {
      heroImage: '/themes/minimal-preview.png',
      accentColor: '#000000',
    },
  },

  vibrant: {
    id: 'vibrant',
    name: 'Colorido',
    description: 'Vibrante y alegre con colores llamativos',
    colors: {
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      primaryLight: '#eef2ff',
      secondary: '#ec4899',
      accent: '#f59e0b',
      background: '#ffffff',
      backgroundAlt: '#faf5ff',
      text: '#1e1b4b',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      cardBg: '#ffffff',
      heroGradientFrom: '#faf5ff',
      heroGradientTo: '#fdf2f8',
    },
    typography: {
      fontFamily: 'Poppins, system-ui, sans-serif',
      headingWeight: '700',
      bodyWeight: '400',
    },
    layout: {
      borderRadius: '1rem',
      shadowStyle: 'strong',
      buttonStyle: 'pill',
      cardStyle: 'raised',
    },
    preview: {
      heroImage: '/themes/vibrant-preview.png',
      accentColor: '#6366f1',
    },
  },
};

/**
 * Get theme by ID, with fallback to 'modern'
 */
export function getTheme(themeId: string | null | undefined): Theme {
  if (themeId && themeId in themes) {
    return themes[themeId as ThemeId];
  }
  return themes.modern;
}

/**
 * Get all available themes as an array
 */
export function getAllThemes(): Theme[] {
  return Object.values(themes);
}

/**
 * Generate CSS variables from a theme
 */
export function getThemeCSSVariables(theme: Theme): Record<string, string> {
  return {
    '--theme-primary': theme.colors.primary,
    '--theme-primary-hover': theme.colors.primaryHover,
    '--theme-primary-light': theme.colors.primaryLight,
    '--theme-secondary': theme.colors.secondary,
    '--theme-accent': theme.colors.accent,
    '--theme-background': theme.colors.background,
    '--theme-background-alt': theme.colors.backgroundAlt,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.textMuted,
    '--theme-border': theme.colors.border,
    '--theme-card-bg': theme.colors.cardBg,
    '--theme-hero-gradient-from': theme.colors.heroGradientFrom,
    '--theme-hero-gradient-to': theme.colors.heroGradientTo,
    '--theme-font-family': theme.typography.fontFamily,
    '--theme-heading-weight': theme.typography.headingWeight,
    '--theme-body-weight': theme.typography.bodyWeight,
    '--theme-border-radius': theme.layout.borderRadius,
  };
}

/**
 * Get Tailwind-compatible classes based on theme
 */
export function getThemeClasses(theme: Theme): {
  button: string;
  card: string;
  input: string;
} {
  const buttonStyles = {
    rounded: 'rounded-lg',
    pill: 'rounded-full',
    square: 'rounded-none',
  };

  const cardStyles = {
    flat: 'border-0',
    raised: 'shadow-lg',
    bordered: 'border-2',
  };

  return {
    button: buttonStyles[theme.layout.buttonStyle],
    card: cardStyles[theme.layout.cardStyle],
    input: theme.layout.borderRadius === '0' ? 'rounded-none' : 'rounded-lg',
  };
}
