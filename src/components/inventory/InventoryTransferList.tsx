'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Transfer {
  id: string;
  inventoryItem: {
    id: string;
    name: string;
    sku: string;
  };
  fromLocation: {
    id: string;
    name: string;
  };
  toLocation: {
    id: string;
    name: string;
  };
  requestedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  quantity: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface InventoryTransferListProps {
  initialTransfers?: Transfer[];
  statusFilter?: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
}

const statusConfig = {
  PENDING: {
    label: 'Pendiente',
    color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
    icon: ClockIcon,
  },
  IN_TRANSIT: {
    label: 'En tránsito',
    color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    icon: ArrowRightIcon,
  },
  COMPLETED: {
    label: 'Completada',
    color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
    icon: CheckCircleIcon,
  },
  CANCELLED: {
    label: 'Cancelada',
    color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
    icon: XCircleIcon,
  },
};

/**
 * InventoryTransferList - List and manage inventory transfers
 *
 * Features:
 * - Display transfers with status
 * - Complete pending transfers
 * - Cancel pending/in-transit transfers
 * - Real-time status updates
 * - Filtering by status
 *
 * @example
 * ```tsx
 * <InventoryTransferList statusFilter="PENDING" />
 * ```
 */
export function InventoryTransferList({
  initialTransfers = [],
  statusFilter,
}: InventoryTransferListProps) {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers);
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Fetch transfers
  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/inventory/transfers?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransfers(data.transfers || []);
      } else {
        throw new Error(data.error || 'Error al cargar transferencias');
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Error al cargar las transferencias');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTransfers.length === 0) {
      fetchTransfers();
    }
  }, [statusFilter]);

  // Complete transfer
  const handleComplete = async (transferId: string) => {
    if (processingIds.has(transferId)) return;

    setProcessingIds((prev) => new Set(prev).add(transferId));

    try {
      const response = await fetch(
        `/api/inventory/transfers/${transferId}/complete`,
        {
          method: 'PATCH',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al completar la transferencia');
      }

      toast.success('Transferencia completada exitosamente');
      router.refresh();
      fetchTransfers();
    } catch (error) {
      console.error('Error completing transfer:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al completar la transferencia'
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(transferId);
        return next;
      });
    }
  };

  // Cancel transfer
  const handleCancel = async (transferId: string) => {
    if (processingIds.has(transferId)) return;

    if (
      !confirm(
        '¿Estás seguro de que deseas cancelar esta transferencia? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    setProcessingIds((prev) => new Set(prev).add(transferId));

    try {
      const response = await fetch(
        `/api/inventory/transfers/${transferId}/cancel`,
        {
          method: 'PATCH',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar la transferencia');
      }

      toast.success('Transferencia cancelada exitosamente');
      router.refresh();
      fetchTransfers();
    } catch (error) {
      console.error('Error cancelling transfer:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al cancelar la transferencia'
      );
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(transferId);
        return next;
      });
    }
  };

  if (isLoading && transfers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Cargando transferencias...
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No hay transferencias{statusFilter ? ` ${statusConfig[statusFilter].label.toLowerCase()}s` : ''}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transfers.map((transfer) => {
        const StatusIcon = statusConfig[transfer.status].icon;
        const isProcessing = processingIds.has(transfer.id);
        const canComplete =
          transfer.status === 'PENDING' || transfer.status === 'IN_TRANSIT';
        const canCancel =
          transfer.status === 'PENDING' || transfer.status === 'IN_TRANSIT';

        return (
          <div
            key={transfer.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Transfer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {transfer.inventoryItem.name}
                  </h3>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      statusConfig[transfer.status].color
                    )}
                  >
                    <StatusIcon className="h-4 w-4" />
                    {statusConfig[transfer.status].label}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <span className="font-medium">SKU:</span>{' '}
                    {transfer.inventoryItem.sku}
                  </p>
                  <p>
                    <span className="font-medium">Cantidad:</span>{' '}
                    {transfer.quantity}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Desde:</span>{' '}
                    {transfer.fromLocation.name}
                    <ArrowRightIcon className="h-4 w-4" />
                    <span className="font-medium">Hacia:</span>{' '}
                    {transfer.toLocation.name}
                  </p>
                  <p>
                    <span className="font-medium">Solicitado por:</span>{' '}
                    {transfer.requestedBy.firstName}{' '}
                    {transfer.requestedBy.lastName}
                  </p>
                  <p>
                    <span className="font-medium">Fecha:</span>{' '}
                    {new Date(transfer.createdAt).toLocaleString('es-MX')}
                  </p>
                  {transfer.notes && (
                    <p>
                      <span className="font-medium">Notas:</span>{' '}
                      {transfer.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(canComplete || canCancel) && (
                <div className="flex flex-col gap-2">
                  {canComplete && (
                    <Button
                      size="sm"
                      onClick={() => handleComplete(transfer.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Procesando...' : 'Completar'}
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(transfer.id)}
                      disabled={isProcessing}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
