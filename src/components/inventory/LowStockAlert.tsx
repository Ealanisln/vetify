'use client';

import { useEffect, useState, useCallback } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { InventoryItemWithStock } from '@/types';

// Custom event name for inventory updates
export const INVENTORY_UPDATED_EVENT = 'inventory-updated';

interface LowStockAlertProps {
  tenantId: string;
}

export function LowStockAlert({ tenantId }: LowStockAlertProps) {
  const [lowStockItems, setLowStockItems] = useState<InventoryItemWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const fetchLowStockItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/inventory?tenantId=${tenantId}&action=low-stock`);
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(data);
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchLowStockItems();

    // Listen for inventory updates from InventoryMain
    const handleInventoryUpdate = () => {
      setDismissed(false); // Re-show alert if it was dismissed
      fetchLowStockItems();
    };

    window.addEventListener(INVENTORY_UPDATED_EVENT, handleInventoryUpdate);
    return () => {
      window.removeEventListener(INVENTORY_UPDATED_EVENT, handleInventoryUpdate);
    };
  }, [fetchLowStockItems]);

  if (loading || lowStockItems.length === 0 || dismissed) {
    return null;
  }

  const criticalItems = lowStockItems.filter(item => Number(item.quantity) === 0);
  const lowItems = lowStockItems.filter(item => Number(item.quantity) > 0);

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4" data-testid="low-stock-alert">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            ⚠️ Alerta de Inventario
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            {criticalItems.length > 0 && (
              <div className="mb-2">
                <strong>Sin stock ({criticalItems.length}):</strong>{' '}
                <span className="break-words">
                  {criticalItems.slice(0, 3).map((item, index) => (
                    <span key={item.id}>
                      {item.name}
                      {index < Math.min(criticalItems.length, 3) - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {criticalItems.length > 3 && ` y ${criticalItems.length - 3} más`}
                </span>
              </div>
            )}
            {lowItems.length > 0 && (
              <div>
                <strong>Stock bajo ({lowItems.length}):</strong>{' '}
                <span className="break-words">
                  {lowItems.slice(0, 3).map((item, index) => (
                    <span key={item.id}>
                      {item.name} ({Number(item.quantity)})
                      {index < Math.min(lowItems.length, 3) - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {lowItems.length > 3 && ` y ${lowItems.length - 3} más`}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded text-sm transition-colors"
              onClick={() => {
                // Scroll to inventory list or open filters
                const inventorySection = document.getElementById('inventory-main');
                if (inventorySection) {
                  inventorySection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              data-testid="view-inventory-button"
            >
              Ver Inventario
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="inline-flex rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
              data-testid="dismiss-alert-button"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 