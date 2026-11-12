/**
 * Shared phone normalization for customer matching.
 *
 * Phones are stored as typed by staff or clients ("55 1234 5678",
 * "+52 (55) 1234-5678", ...). Two phones are the same number when the last
 * 10 digits match, which ignores the Mexican country code (52 / 521) and any
 * formatting. Anything shorter than 10 digits is a partial number and never
 * matches.
 */

export const MIN_PHONE_DIGITS = 10;

export function normalizePhone(phone: string | null | undefined): string {
  return (phone ?? '').replace(/\D/g, '');
}

/** Last 10 digits of the phone, or null when it is not a full phone number. */
export function phoneMatchKey(phone: string | null | undefined): string | null {
  const digits = normalizePhone(phone);
  if (digits.length < MIN_PHONE_DIGITS) return null;
  return digits.slice(-MIN_PHONE_DIGITS);
}

export function phonesMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const keyA = phoneMatchKey(a);
  return keyA !== null && keyA === phoneMatchKey(b);
}
