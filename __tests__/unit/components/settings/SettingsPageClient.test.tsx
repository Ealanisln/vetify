import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { TenantWithPlan } from '@/types';

let mockTab: string | null = null;

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => mockTab }),
}));

// Render the gate as a marker that exposes the gated feature
jest.mock('@/components/features/FeatureGate', () => ({
  FeatureGate: ({ feature, children }: { feature: string; children: React.ReactNode }) => (
    <div data-testid={`feature-gate-${feature}`}>{children}</div>
  ),
}));

jest.mock('@/components/api', () => ({
  ApiKeyManagement: () => <div data-testid="api-key-management" />,
  WebhookConfig: () => <div data-testid="webhook-config" />,
}));

// Sections not under test; keep them out of the render
jest.mock('@/components/settings/ServiceManagement', () => ({ ServiceManagement: () => null }));
jest.mock('@/components/settings/BusinessHoursSettings', () => ({ BusinessHoursSettings: () => null }));
jest.mock('@/components/settings/CurrencySettings', () => ({ CurrencySettings: () => null }));
jest.mock('@/components/settings/NotificationSettings', () => ({ NotificationSettings: () => null }));
jest.mock('@/components/settings/PublicPageSettings', () => ({ PublicPageSettings: () => null }));
jest.mock('@/components/settings/QrCodeGenerator', () => ({ QrCodeGenerator: () => null }));
jest.mock('@/components/analytics/LandingAnalyticsSection', () => ({ LandingAnalyticsSection: () => null }));
jest.mock('@/components/subscription', () => ({ SubscriptionManager: () => null }));

import { SettingsPageClient } from '@/app/dashboard/settings/SettingsPageClient';

const tenant = { id: 'tenant-1', publicPageEnabled: false } as unknown as TenantWithPlan;

describe('SettingsPageClient', () => {
  afterEach(() => {
    mockTab = null;
  });

  it('lists a Webhooks tab', () => {
    render(<SettingsPageClient tenant={tenant} isActiveSubscription />);

    expect(screen.getByTestId('settings-tab-webhooks')).toHaveTextContent('Webhooks');
  });

  it('renders WebhookConfig behind the apiAccess gate on the webhooks tab', () => {
    mockTab = 'webhooks';
    render(<SettingsPageClient tenant={tenant} isActiveSubscription />);

    const gate = screen.getByTestId('feature-gate-apiAccess');
    expect(gate).toContainElement(screen.getByTestId('webhook-config'));
    expect(screen.queryByTestId('api-key-management')).not.toBeInTheDocument();
  });

  it('keeps ApiKeyManagement alone on the api tab', () => {
    mockTab = 'api';
    render(<SettingsPageClient tenant={tenant} isActiveSubscription />);

    expect(screen.getByTestId('feature-gate-apiAccess')).toContainElement(
      screen.getByTestId('api-key-management')
    );
    expect(screen.queryByTestId('webhook-config')).not.toBeInTheDocument();
  });

  it('locks the webhooks tab without an active subscription', () => {
    render(<SettingsPageClient tenant={tenant} isActiveSubscription={false} />);

    expect(screen.getByTestId('settings-tab-webhooks')).toBeDisabled();
  });
});
