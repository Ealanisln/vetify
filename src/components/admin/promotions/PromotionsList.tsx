'use client';

import type { SystemPromotion } from '@prisma/client';
import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface PromotionsListProps {
  promotions: SystemPromotion[];
  isLoading: boolean;
  onEdit: (promotion: SystemPromotion) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PromotionsList({
  promotions,
  isLoading,
  onEdit,
  onToggleStatus,
  onDelete,
}: PromotionsListProps) {
  const getStatus = (promotion: SystemPromotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (endDate < now) {
      return { label: 'Expirada', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
    if (startDate > now) {
      return { label: 'Programada', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' };
    }
    if (promotion.isActive) {
      return { label: 'Activa', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
    }
    return { label: 'Inactiva', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (promotions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <ClockIcon className="h-12 w-12" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          No hay promociones
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Crea tu primera promoción para ofrecer descuentos a tus clientes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Promoción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Descuento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Vigencia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {promotions.map((promotion) => {
              const status = getStatus(promotion);
              const isExpired = new Date(promotion.endDate) < new Date();

              return (
                <tr
                  key={promotion.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    isLoading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {promotion.name}
                        </span>
                        {promotion.isActive && !isExpired && (
                          <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Código: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{promotion.code}</code>
                      </div>
                      {promotion.stripeCouponId && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Stripe: {promotion.stripeCouponId}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {promotion.discountPercent}% OFF
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        por {promotion.durationMonths} {promotion.durationMonths === 1 ? 'mes' : 'meses'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(promotion.startDate)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      hasta {formatDate(promotion.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {!isExpired && (
                        <button
                          onClick={() => onToggleStatus(promotion.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            promotion.isActive
                              ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900'
                              : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900'
                          }`}
                          title={promotion.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {promotion.isActive ? (
                            <XCircleIcon className="h-5 w-5" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(promotion)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {!promotion.isActive && (
                        <button
                          onClick={() => onDelete(promotion.id)}
                          className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
