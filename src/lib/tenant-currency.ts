import { prisma } from './prisma';
import { DEFAULT_CURRENCY } from './currency';

/**
 * The tenant's display/POS currency (TenantSettings.currencyCode), falling
 * back to the default for tenants without a settings row.
 */
export async function getTenantCurrencyCode(tenantId: string): Promise<string> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: { currencyCode: true },
  });
  return settings?.currencyCode ?? DEFAULT_CURRENCY;
}
