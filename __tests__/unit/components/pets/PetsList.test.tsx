/**
 * @jest-environment jsdom
 *
 * The pet row subtitle used to render "{breed} • {gender}", so a pet without
 * breed showed "• Macho" and the species was never shown in words.
 */
import { render, screen } from '@testing-library/react';
import { PetsList } from '@/components/pets/PetsList';
import type { PetWithOwner } from '@/types';

function makePet(overrides: Partial<PetWithOwner> = {}): PetWithOwner {
  return {
    id: 'pet-1',
    name: 'Firulais',
    species: 'dog',
    breed: 'Labrador',
    gender: 'male',
    customer: { id: 'c-1', name: 'Ana', email: 'ana@example.com' },
    appointments: [],
    medicalHistories: [],
    ...overrides,
  } as unknown as PetWithOwner;
}

function subtitleFor(pet: PetWithOwner): string {
  render(<PetsList pets={[pet]} maxPets={100} />);
  const name = screen.getByTestId('pet-name');
  return name.nextElementSibling?.textContent ?? '';
}

describe('PetsList row subtitle', () => {
  it('joins species, breed and gender in Spanish', () => {
    expect(subtitleFor(makePet())).toBe('Perro • Labrador • Macho');
  });

  it('skips the breed (and its separator) when the pet has none', () => {
    expect(subtitleFor(makePet({ breed: null, gender: 'female' }))).toBe('Perro • Hembra');
  });

  it('treats a blank breed as missing', () => {
    expect(subtitleFor(makePet({ species: 'cat', breed: '  ' }))).toBe('Gato • Macho');
  });
});
