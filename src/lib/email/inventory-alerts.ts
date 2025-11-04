/**
 * Inventory Alert Email Service
 *
 * Handles sending low stock alert emails to clinic staff
 */

import { getLowStockItems } from '../inventory';
import { sendLowStockAlert } from './email-service';
import type { LowStockAlertData } from './types';
import { prisma } from '../prisma';

/**
 * Check inventory and send low stock alerts for a specific tenant
 */
export async function checkAndSendLowStockAlerts(tenantId: string): Promise<{
  success: boolean;
  itemsChecked: number;
  alertsSent: number;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Get low stock items
    const lowStockItems = await getLowStockItems(tenantId);

    if (lowStockItems.length === 0) {
      return {
        success: true,
        itemsChecked: 0,
        alertsSent: 0,
        errors: [],
      };
    }

    // Get tenant info and staff emails
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        staff: {
          where: {
            isActive: true,
            // Get staff with admin or manager roles who should receive alerts
            role: {
              permissions: {
                hasSome: ['MANAGE_INVENTORY', 'MANAGE_ALL'],
              },
            },
          },
          select: {
            name: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Get unique staff emails
    const staffEmails = tenant.staff
      .map((s) => s.user?.email)
      .filter((email): email is string => !!email && email.length > 0);

    if (staffEmails.length === 0) {
      console.warn(`[INVENTORY_ALERTS] No staff emails found for tenant ${tenantId}`);
      return {
        success: true,
        itemsChecked: lowStockItems.length,
        alertsSent: 0,
        errors: ['No staff emails configured'],
      };
    }

    // Prepare email data
    const emailData: LowStockAlertData = {
      template: 'low-stock-alert',
      to: {
        email: staffEmails[0], // Primary recipient
      },
      bcc: staffEmails.slice(1).map((email) => ({ email })), // BCC others
      subject: `⚠️ Alerta de Inventario Bajo - ${tenant.name}`,
      tenantId: tenant.id,
      data: {
        clinicName: tenant.name,
        items: lowStockItems.map((item) => ({
          productName: item.name,
          currentStock: Number(item.quantity),
          minimumStock: item.minStock || 0,
          unit: item.measure || 'unidades',
          category: item.category || undefined,
        })),
        alertDate: new Date(),
        totalLowStockItems: lowStockItems.length,
      },
    };

    // Send alert email
    const result = await sendLowStockAlert(emailData);

    if (!result.success) {
      errors.push(result.error || 'Unknown error');
    }

    return {
      success: result.success,
      itemsChecked: lowStockItems.length,
      alertsSent: result.success ? 1 : 0,
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[INVENTORY_ALERTS] Error:', errorMessage);
    errors.push(errorMessage);

    return {
      success: false,
      itemsChecked: 0,
      alertsSent: 0,
      errors,
    };
  }
}

/**
 * Check inventory for all active tenants and send alerts
 * This should be called by a cron job
 */
export async function checkAllTenantsInventory(): Promise<{
  success: boolean;
  tenantsChecked: number;
  totalAlertsSent: number;
  errors: Record<string, string[]>;
}> {
  const errors: Record<string, string[]> = {};
  let totalAlertsSent = 0;

  try {
    // Get all active tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        // Only check tenants with active subscriptions or in trial
        OR: [
          { isTrialPeriod: true },
          { subscriptionStatus: 'ACTIVE' },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`[INVENTORY_ALERTS] Checking ${tenants.length} tenants`);

    // Check each tenant
    for (const tenant of tenants) {
      const result = await checkAndSendLowStockAlerts(tenant.id);

      if (result.errors.length > 0) {
        errors[tenant.id] = result.errors;
      }

      totalAlertsSent += result.alertsSent;

      // Log result
      if (result.itemsChecked > 0) {
        console.log(
          `[INVENTORY_ALERTS] Tenant ${tenant.name}: ${result.itemsChecked} low stock items, ${result.alertsSent} alerts sent`
        );
      }
    }

    return {
      success: Object.keys(errors).length === 0,
      tenantsChecked: tenants.length,
      totalAlertsSent,
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('[INVENTORY_ALERTS] Fatal error:', errorMessage);
    errors['system'] = [errorMessage];

    return {
      success: false,
      tenantsChecked: 0,
      totalAlertsSent: 0,
      errors,
    };
  }
}

/**
 * Manual trigger to send low stock alert for a tenant
 * Can be called from an API route
 */
export async function sendLowStockAlertNow(tenantId: string): Promise<{
  success: boolean;
  message: string;
  itemsCount?: number;
}> {
  const result = await checkAndSendLowStockAlerts(tenantId);

  if (result.success && result.alertsSent > 0) {
    return {
      success: true,
      message: `Alert sent for ${result.itemsChecked} low stock items`,
      itemsCount: result.itemsChecked,
    };
  }

  if (result.itemsChecked === 0) {
    return {
      success: true,
      message: 'No low stock items found',
      itemsCount: 0,
    };
  }

  return {
    success: false,
    message: result.errors.join(', ') || 'Failed to send alert',
  };
}
