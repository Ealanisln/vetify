import { formatMoney } from './currency';
import type { LegacyPublicService } from './tenant';

/** One entry of the public booking form's "Tipo de servicio" select. */
export interface BookingServiceOption {
  title: string;
  price?: string;
}

/** The fields of a catalog (Service table) row the booking form needs. */
export interface BookingCatalogService {
  name: string;
  price: number;
  publicPriceLabel: string | null;
}

/** Shown only when the clinic has neither catalog services nor legacy config. */
export const DEFAULT_BOOKING_SERVICES: BookingServiceOption[] = [
  { title: 'Consulta General' },
  { title: 'Vacunación' },
  { title: 'Emergencia' },
];

/**
 * Services offered in the public booking form.
 *
 * The clinic's active services (Configuración > Servicios) win. The legacy
 * publicServices JSON is only a fallback for tenants that never built a
 * catalog, and the generic defaults keep the select usable for brand-new ones.
 */
export function buildBookingServiceOptions({
  catalog,
  legacy,
  currencyCode,
}: {
  catalog: BookingCatalogService[] | null | undefined;
  legacy: LegacyPublicService[] | null | undefined;
  currencyCode: string;
}): BookingServiceOption[] {
  if (catalog && catalog.length > 0) {
    return catalog.map((service) => ({
      title: service.name,
      price:
        service.publicPriceLabel ||
        (service.price > 0 ? formatMoney(service.price, currencyCode) : undefined),
    }));
  }

  if (legacy && legacy.length > 0) {
    return legacy.map(({ title, price }) => ({ title, price }));
  }

  return DEFAULT_BOOKING_SERVICES;
}
