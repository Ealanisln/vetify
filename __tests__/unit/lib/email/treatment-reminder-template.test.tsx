/**
 * @jest-environment node
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { TreatmentReminderEmail } from '@/lib/email/templates/treatment-reminder';

async function renderWithDays(daysUntilDue: number) {
  const html = renderToStaticMarkup(
    TreatmentReminderEmail({
      ownerName: 'Ana',
      petName: 'Firulais',
      treatmentName: 'Vacuna: Nobivac Rabia',
      treatmentType: 'VACCINATION',
      dueDate: 'domingo, 22 de noviembre de 2026',
      daysUntilDue,
      clinicName: 'Clínica Patitas',
    })
  );
  return html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

describe('TreatmentReminderEmail days left', () => {
  it('uses the plural for several days', async () => {
    expect(await renderWithDays(7)).toContain('Faltan 7 días');
  });

  it('uses the singular for one day', async () => {
    const text = await renderWithDays(1);
    expect(text).toContain('Falta 1 día');
    expect(text).not.toContain('Faltan 1 días');
  });

  it('says it is today for zero days', async () => {
    const text = await renderWithDays(0);
    expect(text).toContain('Es hoy');
    expect(text).not.toContain('Faltan 0');
  });
});
