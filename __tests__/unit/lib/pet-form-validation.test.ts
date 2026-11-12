/**
 * @jest-environment node
 */

// Regression: NewCustomerForm offered kg/g/lb while the server only accepted
// kg/lbs, so any pet saved in g or lb failed. Zero weight and future birth
// dates were rejected with English messages (or not at all on the client).
// Found by the flows audit (docs/AUDITORIA-FLUJOS-2026-11.md, section 2).

jest.mock('@/lib/prisma', () => ({ prisma: {} }));

import { createPetSchema } from '@/lib/pets';
import { PET_WEIGHT_UNITS, validatePetFormFields } from '@/lib/utils/pet-form-validation';

const baseInput = {
  name: 'Firulais',
  species: 'dog',
  dateOfBirth: new Date('2022-05-10'),
  gender: 'male',
  customerId: 'customer-1',
};

describe('pet weight units', () => {
  it('the server schema accepts every unit the forms offer', () => {
    for (const unit of PET_WEIGHT_UNITS) {
      expect(createPetSchema.parse({ ...baseInput, weightUnit: unit }).weightUnit).toBe(unit);
    }
  });

  it('only offers kg and lbs, the units the rest of the dashboard reads', () => {
    expect([...PET_WEIGHT_UNITS]).toEqual(['kg', 'lbs']);
  });

  it('rejects an unknown unit with a Spanish message', () => {
    const result = createPetSchema.safeParse({ ...baseInput, weightUnit: 'g' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('La unidad de peso debe ser kg o lbs');
  });
});

describe('pet weight value', () => {
  it('accepts small decimal weights such as 0.05 kg', () => {
    expect(createPetSchema.parse({ ...baseInput, weight: 0.05 }).weight).toBe(0.05);
  });

  it('rejects zero with a Spanish message', () => {
    const result = createPetSchema.safeParse({ ...baseInput, weight: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('El peso debe ser mayor a 0');
  });
});

describe('validatePetFormFields', () => {
  const today = '2026-11-12';

  it('returns no errors for a valid pet', () => {
    expect(validatePetFormFields({ weight: '0.05', dateOfBirth: '2026-11-12' }, today)).toEqual({});
  });

  it('allows an empty weight', () => {
    expect(validatePetFormFields({ weight: '', dateOfBirth: '2020-01-01' }, today)).toEqual({});
  });

  it('rejects zero or negative weight', () => {
    expect(validatePetFormFields({ weight: '0', dateOfBirth: '2020-01-01' }, today)).toEqual({
      weight: 'El peso debe ser mayor a 0',
    });
    expect(validatePetFormFields({ weight: '-2', dateOfBirth: '2020-01-01' }, today).weight).toBe(
      'El peso debe ser mayor a 0'
    );
  });

  it('rejects a birth date after today', () => {
    expect(validatePetFormFields({ weight: '', dateOfBirth: '2026-11-13' }, today)).toEqual({
      dateOfBirth: 'La fecha de nacimiento no puede ser una fecha futura',
    });
  });
});
