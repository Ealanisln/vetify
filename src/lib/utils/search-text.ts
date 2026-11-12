/**
 * Search helpers that ignore case, accents and phone formatting.
 * Client-safe. The database may not have the `unaccent` extension, so
 * matching happens in JS on both the term and the stored values.
 */

/** Lowercases and strips diacritics: "María Pérez" -> "maria perez". */
export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/** A term made only of digits and phone punctuation, e.g. "55 1234-5678". */
function isPhoneLikeTerm(term: string): boolean {
  return /^[\d\s()+.-]+$/.test(term) && /\d/.test(term);
}

/**
 * True when `term` appears in any text field (accent- and case-insensitive)
 * or, for a phone-like term, in any phone once both are reduced to digits.
 */
export function matchesSearch(
  term: string,
  fields: { text?: Array<string | null | undefined>; phones?: Array<string | null | undefined> }
): boolean {
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedTerm) return true;

  if ((fields.text ?? []).some((field) => normalizeSearchText(field).includes(normalizedTerm))) {
    return true;
  }

  if (isPhoneLikeTerm(normalizedTerm)) {
    const termDigits = digitsOnly(normalizedTerm);
    return (fields.phones ?? []).some((phone) => digitsOnly(phone).includes(termDigits));
  }

  return false;
}
