import { MIN_PHONE_DIGITS, normalizePhone, phoneMatchKey, phonesMatch } from '@/lib/phone';

describe('phone normalization', () => {
  it('requires at least 10 digits for a full phone', () => {
    expect(MIN_PHONE_DIGITS).toBe(10);
  });

  it('keeps only digits', () => {
    expect(normalizePhone('+52 (55) 1234-5678')).toBe('525512345678');
    expect(normalizePhone('  ')).toBe('');
    expect(normalizePhone(null)).toBe('');
    expect(normalizePhone(undefined)).toBe('');
  });

  it('uses the last 10 digits as the match key so country prefixes do not matter', () => {
    expect(phoneMatchKey('+52 55 1234 5678')).toBe('5512345678');
    expect(phoneMatchKey('55 12 34 56 78')).toBe('5512345678');
    expect(phoneMatchKey('521 55 1234 5678')).toBe('5512345678');
  });

  it('has no match key for partial phones', () => {
    expect(phoneMatchKey('1')).toBeNull();
    expect(phoneMatchKey('551234567')).toBeNull();
    expect(phoneMatchKey(null)).toBeNull();
  });

  it('matches the same number written in different formats', () => {
    expect(phonesMatch('5512345678', '+52 55 12 34 56 78')).toBe(true);
    expect(phonesMatch('(55) 1234-5678', '55-1234-5678')).toBe(true);
  });

  it('does not match different or partial numbers', () => {
    expect(phonesMatch('5512345678', '5512345679')).toBe(false);
    expect(phonesMatch('1', '5512345678')).toBe(false);
    expect(phonesMatch('5678', '5512345678')).toBe(false);
    expect(phonesMatch(null, '5512345678')).toBe(false);
  });
});
