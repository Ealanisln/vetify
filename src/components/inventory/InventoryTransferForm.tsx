'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { useLocation } from '@/components/providers/LocationProvider';

interface InventoryTransferFormProps {
  inventoryItems: Array<{
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    locationId: string;
  }>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * InventoryTransferForm - Form for creating inventory transfers between locations
 *
 * Features:
 * - Item selection from current location's inventory
 * - Destination location selection
 * - Quantity validation against available stock
 * - Optional notes
 * - Success/error handling
 *
 * @example
 * ```tsx
 * <InventoryTransferForm
 *   inventoryItems={items}
 *   onSuccess={() => router.push('/dashboard/inventory')}
 * />
 * ```
 */
export function InventoryTransferForm({
  inventoryItems,
  onSuccess,
  onCancel,
}: InventoryTransferFormProps) {
  const router = useRouter();
  const { currentLocation, availableLocations } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    inventoryItemId: '',
    toLocationId: '',
    quantity: '',
    notes: '',
  });

  // Get selected item details
  const selectedItem = inventoryItems.find(
    (item) => item.id === formData.inventoryItemId
  );

  // Filter out current location from destination options
  const destinationLocations = availableLocations.filter(
    (loc) => loc.id !== currentLocation?.id && loc.isActive
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentLocation) {
      toast.error('No se ha seleccionado una ubicación');
      return;
    }

    // Validation
    if (!formData.inventoryItemId) {
      toast.error('Selecciona un artículo');
      return;
    }

    if (!formData.toLocationId) {
      toast.error('Selecciona una ubicación de destino');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (selectedItem && quantity > selectedItem.currentStock) {
      toast.error(
        `Stock insuficiente. Disponible: ${selectedItem.currentStock}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryItemId: formData.inventoryItemId,
          fromLocationId: currentLocation.id,
          toLocationId: formData.toLocationId,
          quantity,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la transferencia');
      }

      toast.success('Transferencia creada exitosamente');

      // Reset form
      setFormData({
        inventoryItemId: '',
        toLocationId: '',
        quantity: '',
        notes: '',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al crear la transferencia'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentLocation) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Selecciona una ubicación para crear transferencias
      </div>
    );
  }

  if (destinationLocations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No hay otras ubicaciones disponibles para transferencias
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Item Selection */}
      <div>
        <label
          htmlFor="inventoryItemId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
        >
          Artículo *
        </label>
        <select
          id="inventoryItemId"
          value={formData.inventoryItemId}
          onChange={(e) =>
            setFormData({ ...formData, inventoryItemId: e.target.value })
          }
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          required
        >
          <option value="">Seleccionar artículo...</option>
          {inventoryItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.sku}) - Stock: {item.currentStock}
            </option>
          ))}
        </select>
      </div>

      {/* Destination Location */}
      <div>
        <label
          htmlFor="toLocationId"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
        >
          Ubicación de Destino *
        </label>
        <select
          id="toLocationId"
          value={formData.toLocationId}
          onChange={(e) =>
            setFormData({ ...formData, toLocationId: e.target.value })
          }
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          required
        >
          <option value="">Seleccionar ubicación...</option>
          {destinationLocations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Desde: {currentLocation.name}
        </p>
      </div>

      {/* Quantity */}
      <div>
        <label
          htmlFor="quantity"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
        >
          Cantidad *
        </label>
        <input
          type="number"
          id="quantity"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({ ...formData, quantity: e.target.value })
          }
          min="0"
          step="0.01"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          required
        />
        {selectedItem && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Disponible: {selectedItem.currentStock}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
        >
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
          placeholder="Razón de la transferencia, instrucciones especiales, etc."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear Transferencia'}
        </Button>
      </div>
    </form>
  );
}
