/**
 * @jest-environment node
 *
 * The internal admin notifications used to link to https://app.vetify.pro/<slug>,
 * a host with no DNS. They must link to the tenant in the super-admin panel,
 * a URL the caller builds and passes in.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import {
  NewUserRegistrationEmail,
  NewSubscriptionPaymentEmail,
  PaymentFailedAlertEmail,
} from '@/lib/email/templates';

const adminTenantUrl = 'https://www.vetify.pro/admin/tenants?search=clinica-norte';

describe('admin notification templates', () => {
  it('new user registration links to the tenant in the admin panel', () => {
    const html = renderToStaticMarkup(
      NewUserRegistrationEmail({
        userName: 'Ana',
        userEmail: 'ana@example.com',
        tenantName: 'Clínica Norte',
        tenantSlug: 'clinica-norte',
        adminTenantUrl,
        registrationDate: '1 de octubre de 2026',
        planType: 'TRIAL',
      })
    );

    expect(html).toContain(`href="${adminTenantUrl}"`);
    expect(html).not.toContain('app.vetify.pro');
  });

  it('new subscription payment links to the tenant in the admin panel', () => {
    const html = renderToStaticMarkup(
      NewSubscriptionPaymentEmail({
        userName: 'Ana',
        userEmail: 'ana@example.com',
        tenantName: 'Clínica Norte',
        tenantSlug: 'clinica-norte',
        adminTenantUrl,
        planName: 'Profesional',
        formattedAmount: '$599.00',
        billingInterval: 'month',
        paymentDate: '1 de octubre de 2026',
      })
    );

    expect(html).toContain(`href="${adminTenantUrl}"`);
    expect(html).not.toContain('app.vetify.pro');
  });

  it('payment failed alert links to the tenant in the admin panel', () => {
    const html = renderToStaticMarkup(
      PaymentFailedAlertEmail({
        tenantName: 'Clínica Norte',
        tenantSlug: 'clinica-norte',
        adminTenantUrl,
        failureReason: 'card_declined',
        failureDate: '1 de octubre de 2026',
      })
    );

    expect(html).toContain(`href="${adminTenantUrl}"`);
    expect(html).not.toContain('app.vetify.pro');
  });
});
