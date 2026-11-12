import { matchesSearch, normalizeSearchText } from '@/lib/utils/search-text';

describe('normalizeSearchText', () => {
  it('drops accents and case', () => {
    expect(normalizeSearchText('  María PÉREZ Ñúñez ')).toBe('maria perez nunez');
  });

  it('treats null and undefined as empty', () => {
    expect(normalizeSearchText(null)).toBe('');
    expect(normalizeSearchText(undefined)).toBe('');
  });
});

describe('matchesSearch', () => {
  const customer = { text: ['José Ramírez', 'jose@test.com'], phones: ['+52 (55) 1234-5678'] };

  it('matches without accents in either direction', () => {
    expect(matchesSearch('jose ramirez', customer)).toBe(true);
    expect(matchesSearch('RAMÍREZ', { text: ['Jose Ramirez'] })).toBe(true);
  });

  it('matches a phone typed with a different format', () => {
    expect(matchesSearch('55 1234 5678', customer)).toBe(true);
    expect(matchesSearch('5512345678', customer)).toBe(true);
    expect(matchesSearch('55-1234', customer)).toBe(true);
  });

  it('does not match digits inside a word term against phones', () => {
    expect(matchesSearch('Firulais 2', customer)).toBe(false);
  });

  it('returns false when nothing matches and true for an empty term', () => {
    expect(matchesSearch('lopez', customer)).toBe(false);
    expect(matchesSearch('   ', customer)).toBe(true);
  });
});
