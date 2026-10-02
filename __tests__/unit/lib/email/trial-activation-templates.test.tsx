/**
 * @jest-environment node
 *
 * Render smoke tests for the trial activation templates. sendEmail() dry-runs
 * before rendering under NODE_ENV=test, so without this nothing exercises the
 * JSX of these templates. @react-email's render() needs ESM dynamic import,
 * which jest's CJS runtime cannot run, so we render with react-dom directly.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import {
  TrialWelcomeEmail,
  TrialActivationNudgeEmail,
  TrialCheckinEmail,
} from '@/lib/email/templates';

const createPetUrl = 'https://www.vetify.pro/dashboard/pets/new';
const dashboardUrl = 'https://www.vetify.pro/dashboard';

describe('trial activation templates', () => {
  it('welcome renders the clinic, trial end date and the create-pet CTA', () => {
    const html = renderToStaticMarkup(
      TrialWelcomeEmail({
        clinicName: 'Clínica Norte',
        ownerName: 'Ana',
        trialEndsDate: '6 de octubre de 2026',
        createPetUrl,
        dashboardUrl,
      })
    );

    expect(html).toContain('Clínica Norte');
    expect(html).toContain('6 de octubre de 2026');
    expect(html).toContain(`href="${createPetUrl}"`);
    expect(html).toContain(`href="${dashboardUrl}"`);
    expect(html).toContain('Registrar mi primera mascota');
  });

  it('nudge renders the create-pet CTA', () => {
    const html = renderToStaticMarkup(
      TrialActivationNudgeEmail({
        clinicName: 'Clínica Norte',
        ownerName: 'Ana',
        createPetUrl,
      })
    );

    expect(html).toContain('Ana');
    expect(html).toContain(`href="${createPetUrl}"`);
    expect(html).toContain('Registrar una mascota');
  });

  it('check-in asks what is missing and links to the dashboard', () => {
    const html = renderToStaticMarkup(
      TrialCheckinEmail({
        clinicName: 'Clínica Norte',
        ownerName: 'Ana',
        dashboardUrl,
      })
    );

    expect(html).toContain('faltando');
    expect(html).toContain(`href="${dashboardUrl}"`);
  });
});
