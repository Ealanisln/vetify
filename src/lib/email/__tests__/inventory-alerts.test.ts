/**
 * Unit tests for inventory alert system
 */

// Mock dependencies
jest.mock('@/lib/inventory', () => ({
  getLowStockItems: jest.fn(() =>
    Promise.resolve([
      {
        id: '1',
        name: 'Vacuna Rabia',
        quantity: 5,
        minStock: 10,
        measure: 'dosis',
        category: 'Vacunas',
      },
      {
        id: '2',
        name: 'Antibiótico X',
        quantity: 2,
        minStock: 15,
        measure: 'unidades',
        category: 'Medicamentos',
      },
    ])
  ),
}));

jest.mock('@/lib/email/email-service', () => ({
  sendLowStockAlert: jest.fn(() =>
    Promise.resolve({
      success: true,
      messageId: 'msg-123',
    })
  ),
}));

const mockPrisma = {
  tenant: {
    findUnique: jest.fn(() =>
      Promise.resolve({
        id: 'tenant-123',
        name: 'Clínica Veterinaria Central',
        staff: [
          {
            name: 'Dr. López',
            user: { email: 'admin@clinic.com' },
          },
          {
            name: 'Dra. García',
            user: { email: 'manager@clinic.com' },
          },
        ],
      })
    ),
    findMany: jest.fn(() =>
      Promise.resolve([
        { id: 'tenant-1', name: 'Clinic 1' },
        { id: 'tenant-2', name: 'Clinic 2' },
        { id: 'tenant-3', name: 'Clinic 3' },
      ])
    ),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('Inventory Alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAndSendLowStockAlerts', () => {
    it('should send alert when low stock items exist', async () => {
      const { checkAndSendLowStockAlerts } = await import(
        '../inventory-alerts'
      );

      const result = await checkAndSendLowStockAlerts('tenant-123');

      expect(result.success).toBe(true);
      expect(result.itemsChecked).toBe(2);
      expect(result.alertsSent).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should not send alert when no low stock items', async () => {
      const { getLowStockItems } = await import('@/lib/inventory');
      jest.mocked(getLowStockItems).mockResolvedValueOnce([]);

      const { checkAndSendLowStockAlerts } = await import(
        '../inventory-alerts'
      );

      const result = await checkAndSendLowStockAlerts('tenant-123');

      expect(result.success).toBe(true);
      expect(result.itemsChecked).toBe(0);
      expect(result.alertsSent).toBe(0);
    });

    it('should fetch tenant with inventory permissions', async () => {
      const { checkAndSendLowStockAlerts } = await import(
        '../inventory-alerts'
      );

      await checkAndSendLowStockAlerts('tenant-123');

      expect(mockPrisma.tenant.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tenant-123' },
          select: expect.objectContaining({
            staff: expect.objectContaining({
              where: expect.objectContaining({
                isActive: true,
                role: {
                  permissions: {
                    hasSome: ['MANAGE_INVENTORY', 'MANAGE_ALL'],
                  },
                },
              }),
            }),
          }),
        })
      );
    });

    it('should send to primary recipient with BCC for others', async () => {
      const { sendLowStockAlert } = await import('@/lib/email/email-service');
      const { checkAndSendLowStockAlerts } = await import(
        '../inventory-alerts'
      );

      await checkAndSendLowStockAlerts('tenant-123');

      expect(sendLowStockAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          to: { email: 'admin@clinic.com' },
          bcc: [{ email: 'manager@clinic.com' }],
        })
      );
    });

    it('should handle no staff emails gracefully', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: 'tenant-123',
        name: 'Test Clinic',
        staff: [],
      });

      const { checkAndSendLowStockAlerts } = await import(
        '../inventory-alerts'
      );

      const result = await checkAndSendLowStockAlerts('tenant-123');

      expect(result.success).toBe(true);
      expect(result.alertsSent).toBe(0);
      expect(result.errors).toContain('No staff emails configured');
    });

    it('should handle tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(null);

      const { checkAndSendLowStockAlerts } = await import(
        '../inventory-alerts'
      );

      const result = await checkAndSendLowStockAlerts('tenant-999');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('not found');
    });

    it('should include item details in alert', async () => {
      const { sendLowStockAlert } = await import('@/lib/email/email-service');
      const { checkAndSendLowStockAlerts } = await import(
        '../inventory-alerts'
      );

      await checkAndSendLowStockAlerts('tenant-123');

      expect(sendLowStockAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: [
              {
                productName: 'Vacuna Rabia',
                currentStock: 5,
                minimumStock: 10,
                unit: 'dosis',
                category: 'Vacunas',
              },
              {
                productName: 'Antibiótico X',
                currentStock: 2,
                minimumStock: 15,
                unit: 'unidades',
                category: 'Medicamentos',
              },
            ],
            totalLowStockItems: 2,
          }),
        })
      );
    });
  });

  describe('checkAllTenantsInventory', () => {
    it('should check all active tenants', async () => {
      const { checkAllTenantsInventory } = await import('../inventory-alerts');

      const result = await checkAllTenantsInventory();

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            OR: [
              { isTrialPeriod: true },
              { subscriptionStatus: 'ACTIVE' },
            ],
          }),
        })
      );

      expect(result.tenantsChecked).toBe(3);
    });

    it('should aggregate alert results', async () => {
      const { checkAllTenantsInventory } = await import('../inventory-alerts');

      const result = await checkAllTenantsInventory();

      expect(result.success).toBeDefined();
      expect(result.totalAlertsSent).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should handle tenant errors gracefully', async () => {
      const { getLowStockItems } = await import('@/lib/inventory');

      // First tenant succeeds, second fails, third succeeds
      jest.mocked(getLowStockItems)
        .mockResolvedValueOnce([{ id: '1', name: 'Item 1', quantity: 5, minStock: 10 }])
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce([]);

      const { checkAllTenantsInventory } = await import('../inventory-alerts');

      const result = await checkAllTenantsInventory();

      expect(result.tenantsChecked).toBe(3);
      expect(result.errors['tenant-2']).toBeDefined();
    });

    it('should only check tenants with active subscriptions or trials', async () => {
      const { checkAllTenantsInventory } = await import('../inventory-alerts');

      await checkAllTenantsInventory();

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            OR: expect.arrayContaining([
              expect.objectContaining({ isTrialPeriod: true }),
              expect.objectContaining({ subscriptionStatus: 'ACTIVE' }),
            ]),
          }),
        })
      );
    });
  });

  describe('sendLowStockAlertNow', () => {
    it('should return success message when items found', async () => {
      const { sendLowStockAlertNow } = await import('../inventory-alerts');

      const result = await sendLowStockAlertNow('tenant-123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Alert sent');
      expect(result.itemsCount).toBe(2);
    });

    it('should return message when no items found', async () => {
      const { getLowStockItems } = await import('@/lib/inventory');
      jest.mocked(getLowStockItems).mockResolvedValueOnce([]);

      const { sendLowStockAlertNow } = await import('../inventory-alerts');

      const result = await sendLowStockAlertNow('tenant-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('No low stock items found');
      expect(result.itemsCount).toBe(0);
    });

    it('should return error message on failure', async () => {
      const { sendLowStockAlert } = await import('@/lib/email/email-service');
      jest.mocked(sendLowStockAlert).mockResolvedValueOnce({
        success: false,
        error: 'SMTP error',
      });

      const { sendLowStockAlertNow } = await import('../inventory-alerts');

      const result = await sendLowStockAlertNow('tenant-123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('SMTP error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle staff without emails', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: 'tenant-123',
        name: 'Test Clinic',
        staff: [
          { name: 'Staff 1', user: { email: null } },
          { name: 'Staff 2', user: { email: '' } },
          { name: 'Staff 3', user: { email: 'valid@example.com' } },
        ],
      });

      const { sendLowStockAlert } = await import('@/lib/email/email-service');
      const { checkAndSendLowStockAlerts } = await import(
        '../inventory-alerts'
      );

      await checkAndSendLowStockAlerts('tenant-123');

      // Should only send to valid email
      expect(sendLowStockAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          to: { email: 'valid@example.com' },
        })
      );
    });

    it('should handle items without categories', async () => {
      const { getLowStockItems } = await import('@/lib/inventory');
      jest.mocked(getLowStockItems).mockResolvedValueOnce([
        {
          id: '1',
          name: 'Generic Item',
          quantity: 3,
          minStock: 10,
          measure: 'unidades',
          category: null,
        },
      ]);

      const { sendLowStockAlert } = await import('@/lib/email/email-service');
      const { checkAndSendLowStockAlerts } = await import(
        '../inventory-alerts'
      );

      await checkAndSendLowStockAlerts('tenant-123');

      expect(sendLowStockAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: [
              expect.objectContaining({
                productName: 'Generic Item',
                category: undefined,
              }),
            ],
          }),
        })
      );
    });

    it('should convert quantities to numbers', async () => {
      const { getLowStockItems } = await import('@/lib/inventory');
      jest.mocked(getLowStockItems).mockResolvedValueOnce([
        {
          id: '1',
          name: 'Test Item',
          quantity: 5, // Regular number
          minStock: 10,
          measure: 'unidades',
        },
      ]);

      const { sendLowStockAlert } = await import('@/lib/email/email-service');
      const { checkAndSendLowStockAlerts } = await import(
        '../inventory-alerts'
      );

      await checkAndSendLowStockAlerts('tenant-123');

      const callArgs = jest.mocked(sendLowStockAlert).mock.calls[0][0];
      expect(callArgs.data.items[0].currentStock).toBe(5);
      expect(typeof callArgs.data.items[0].currentStock).toBe('number');
    });
  });
});
