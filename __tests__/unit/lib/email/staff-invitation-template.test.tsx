/**
 * @jest-environment node
 *
 * The invitation email must use the same position labels as the app UI
 * (src/lib/staff-positions.ts) and show the email the invitee must use.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { StaffInvitationEmail } from '@/lib/email/templates';
import { POSITION_LABELS_ES } from '@/lib/staff-positions';

function renderFor(position: string) {
  return renderToStaticMarkup(
    StaffInvitationEmail({
      staffName: 'Ana López',
      email: 'ana@example.com',
      clinicName: 'Clínica Norte',
      position,
      inviteUrl: 'https://www.vetify.pro/invite?token=tok-1',
    })
  );
}

describe('StaffInvitationEmail', () => {
  it.each(Object.entries(POSITION_LABELS_ES))('labels %s as "%s"', (position, label) => {
    expect(renderFor(position)).toContain(`<strong>${label}</strong>`);
  });

  it('uses Gerente for MANAGER and Peluquero for GROOMER', () => {
    expect(renderFor('MANAGER')).toContain('Gerente');
    expect(renderFor('MANAGER')).not.toContain('Administrador');
    expect(renderFor('GROOMER')).toContain('Peluquero');
  });

  it('tells the invitee which email to sign in with', () => {
    const html = renderFor('VETERINARIAN');
    expect(html).toMatch(/con el email:\s*(<!-- -->)?\s*<strong>ana@example\.com<\/strong>/);
  });
});
