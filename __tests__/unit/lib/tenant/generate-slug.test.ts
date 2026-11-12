/**
 * @jest-environment node
 *
 * Six production clinics got slugs ending in "-" (e.g. "kvet-") because the
 * clinic name was typed with a trailing space.
 */
import { generateSlugFromName } from '@/lib/tenant';

describe('generateSlugFromName', () => {
  it('drops dashes left by leading or trailing spaces', () => {
    expect(generateSlugFromName('Kvet ')).toBe('kvet');
    expect(generateSlugFromName('  Clínica Veterinaria Animax  ')).toBe('clinica-veterinaria-animax');
  });

  it('drops dashes left by stripped punctuation at the edges', () => {
    expect(generateSlugFromName("Toby's Pet Care !")).toBe('tobys-pet-care');
    expect(generateSlugFromName('-Vet-')).toBe('vet');
  });

  it('keeps inner dashes collapsed', () => {
    expect(generateSlugFromName('Vet  -  Norte')).toBe('vet-norte');
  });
});
