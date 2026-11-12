import { render, screen } from '@testing-library/react';
import { ServicesPage } from '@/components/public/ServicesPage';
import type { PublicService } from '@/lib/tenant';
import { createMockPublicTenant } from '../../../utils/public-test-factories';

// Helper to filter framer-motion props
const filterMotionProps = (props: Record<string, unknown>) => {
  const motionProps = [
    'initial', 'animate', 'exit', 'transition', 'variants',
    'whileHover', 'whileTap', 'whileInView', 'whileFocus', 'whileDrag',
    'viewport', 'onAnimationStart', 'onAnimationComplete',
    'layout', 'layoutId', 'drag', 'dragConstraints',
  ];
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!motionProps.includes(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
};

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    section: ({
      children,
      className,
      style,
      ...props
    }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <section className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </section>
    ),
    header: ({
      children,
      className,
      style,
      ...props
    }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <header className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </header>
    ),
    div: ({
      children,
      className,
      style,
      ...props
    }: {
      children?: React.ReactNode;
      className?: string;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <div className={className} style={style} {...filterMotionProps(props)}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock useThemeAware hook
jest.mock('@/hooks/useThemeAware', () => ({
  useThemeAware: () => ({ isDark: false }),
}));

// Mock theme utilities
jest.mock('@/lib/themes', () => ({
  getTheme: () => ({
    id: 'modern',
    name: 'Modern',
    colors: {
      primary: '#75a99c',
      text: '#1a1a1a',
      textMuted: '#6b7280',
      cardBg: '#ffffff',
      border: '#e5e7eb',
      primaryLight: '#e8f0ee',
      background: '#ffffff',
      backgroundAlt: '#f3f4f6',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      headingWeight: 700,
    },
    layout: {
      borderRadius: '0.5rem',
    },
  }),
  getThemeClasses: () => ({
    button: 'rounded-lg',
    card: 'border',
    input: 'rounded-lg border',
  }),
}));

// Mock color-utils
jest.mock('@/lib/color-utils', () => ({
  generateDarkColors: () => ({
    text: '#f9fafb',
    textMuted: '#9ca3af',
    cardBg: '#1f2937',
    border: '#374151',
    primaryLight: '#1a2e28',
    background: '#111827',
    backgroundAlt: '#1f2937',
  }),
}));

const catalogService = (overrides: Partial<PublicService> = {}): PublicService =>
  ({
    id: 'service-1',
    name: 'Consulta General',
    description: null,
    category: 'CONSULTATION',
    price: 1500,
    duration: 30,
    publicIcon: null,
    publicPriceLabel: null,
    ...overrides,
  }) as PublicService;

describe('ServicesPage', () => {
  it('formats prices with the canonical MXN formatter by default', () => {
    render(<ServicesPage tenant={createMockPublicTenant()} services={[catalogService()]} />);

    expect(screen.getByText('$1,500.00')).toBeInTheDocument();
  });

  it("formats prices in the clinic's currency instead of hardcoded MXN", () => {
    render(
      <ServicesPage
        tenant={createMockPublicTenant({ currencyCode: 'CLP' })}
        services={[catalogService({ price: 350000 })]}
      />
    );

    expect(screen.getByText('$350.000')).toBeInTheDocument();
    expect(screen.queryByText(/MX\$/)).not.toBeInTheDocument();
  });

  it('prefers the custom price label', () => {
    render(
      <ServicesPage
        tenant={createMockPublicTenant()}
        services={[catalogService({ publicPriceLabel: 'Desde $300' })]}
      />
    );

    expect(screen.getByText('Desde $300')).toBeInTheDocument();
  });
});
