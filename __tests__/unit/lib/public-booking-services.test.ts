import {
  buildBookingServiceOptions,
  DEFAULT_BOOKING_SERVICES,
} from '@/lib/public-booking-services';

const catalogService = (name: string, price: number, publicPriceLabel: string | null = null) => ({
  name,
  price,
  publicPriceLabel,
});

describe('buildBookingServiceOptions', () => {
  it("uses the clinic's service catalog when it has active services", () => {
    const options = buildBookingServiceOptions({
      catalog: [catalogService('Consulta General', 350), catalogService('Pensión', 0)],
      legacy: [{ title: 'Viejo servicio', description: '' }],
      currencyCode: 'MXN',
    });

    expect(options).toEqual([
      { title: 'Consulta General', price: '$350.00' },
      { title: 'Pensión', price: undefined },
    ]);
  });

  it('formats catalog prices in the clinic currency and honors the custom label', () => {
    const options = buildBookingServiceOptions({
      catalog: [catalogService('Consulta', 25000), catalogService('Cirugía', 300000, 'Desde $300.000')],
      legacy: null,
      currencyCode: 'CLP',
    });

    expect(options).toEqual([
      { title: 'Consulta', price: '$25.000' },
      { title: 'Cirugía', price: 'Desde $300.000' },
    ]);
  });

  it('falls back to the legacy publicServices JSON when the catalog is empty', () => {
    const options = buildBookingServiceOptions({
      catalog: [],
      legacy: [{ title: 'Consulta', description: '', price: '$500' }],
      currencyCode: 'MXN',
    });

    expect(options).toEqual([{ title: 'Consulta', price: '$500' }]);
  });

  it('falls back to generic defaults when there is neither catalog nor legacy config', () => {
    expect(buildBookingServiceOptions({ catalog: undefined, legacy: null, currencyCode: 'MXN' })).toEqual(
      DEFAULT_BOOKING_SERVICES
    );
  });
});
