import {
  buildServiceFormSchema,
  parseNumberInput,
  servicePriceSchema,
} from '@/lib/validations/service';

const validForm = {
  name: 'Consulta General',
  category: 'CONSULTATION' as const,
  price: 350,
  isActive: true,
};

describe('service validation', () => {
  describe('parseNumberInput', () => {
    it('turns an empty field into the given empty value instead of NaN', () => {
      expect(parseNumberInput(undefined)('')).toBeUndefined();
      expect(parseNumberInput(null)('')).toBeNull();
      expect(parseNumberInput(null)('abc')).toBeNull();
    });

    it('parses numeric strings', () => {
      expect(parseNumberInput(undefined)('350.5')).toBe(350.5);
      expect(parseNumberInput(null)('45')).toBe(45);
    });
  });

  describe('price', () => {
    it('reports a missing price in Spanish', () => {
      const result = buildServiceFormSchema('MXN').safeParse({ ...validForm, price: undefined });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Ingresa el precio');
    });

    it('accepts a 350.000 CLP service', () => {
      expect(servicePriceSchema('CLP').safeParse(350_000).success).toBe(true);
    });

    it('caps at the storage limit with a Spanish, currency-formatted message', () => {
      const result = servicePriceSchema('MXN').safeParse(100_000_000);

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toMatch(/^El precio no puede ser mayor a \$99,999,999\.99$/);
    });
  });

  describe('duration', () => {
    it('is optional and accepts null to clear it', () => {
      const schema = buildServiceFormSchema('MXN');

      expect(schema.safeParse({ ...validForm, duration: undefined }).success).toBe(true);
      expect(schema.safeParse({ ...validForm, duration: null }).success).toBe(true);
    });

    it('rejects durations over 8 hours in Spanish', () => {
      const result = buildServiceFormSchema('MXN').safeParse({ ...validForm, duration: 600 });

      expect(result.error?.issues[0].message).toBe('La duración máxima es 8 horas');
    });
  });

  it('trims the name so "Consulta " cannot sneak past duplicate checks', () => {
    const result = buildServiceFormSchema('MXN').parse({ ...validForm, name: '  Consulta  ' });

    expect(result.name).toBe('Consulta');
  });
});
