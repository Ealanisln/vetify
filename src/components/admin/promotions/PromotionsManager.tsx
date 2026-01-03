'use client';

import { useState } from 'react';
import type { SystemPromotion } from '@prisma/client';
import { PromotionsList } from './PromotionsList';
import { PromotionForm } from './PromotionForm';
import { PlusIcon, TagIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface PromotionsManagerProps {
  initialPromotions: SystemPromotion[];
  stats: {
    total: number;
    active: number;
    expired: number;
    upcoming: number;
  };
}

export function PromotionsManager({ initialPromotions }: PromotionsManagerProps) {
  const [promotions, setPromotions] = useState<SystemPromotion[]>(initialPromotions);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<SystemPromotion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNew = () => {
    setEditingPromotion(null);
    setShowForm(true);
  };

  const handleEdit = (promotion: SystemPromotion) => {
    setEditingPromotion(promotion);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPromotion(null);
  };

  const handleFormSuccess = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/promotions');
      if (response.ok) {
        const data = await response.json();
        setPromotions(data.data);
      }
    } catch (error) {
      console.error('Error refreshing promotions:', error);
    } finally {
      setIsLoading(false);
      handleCloseForm();
    }
  };

  const handleToggleStatus = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });

      if (response.ok) {
        const data = await response.json();
        setPromotions((prev) =>
          prev.map((p) => {
            if (p.id === id) return data.data;
            // If the toggled promotion is now active, deactivate others
            if (data.data.isActive && p.isActive) {
              return { ...p, isActive: false };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error('Error toggling promotion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta promoción?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPromotions((prev) => prev.filter((p) => p.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Error al eliminar la promoción');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate current stats from promotions list
  const currentStats = {
    total: promotions.length,
    active: promotions.filter((p) => p.isActive && new Date(p.endDate) >= new Date()).length,
    expired: promotions.filter((p) => new Date(p.endDate) < new Date()).length,
    upcoming: promotions.filter((p) => new Date(p.startDate) > new Date()).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TagIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {currentStats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activa</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                {currentStats.active}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-6 w-6 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Próximas</p>
              <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {currentStats.upcoming}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TagIcon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expiradas</p>
              <p className="text-2xl font-semibold text-gray-500">
                {currentStats.expired}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Promociones
        </h2>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Nueva Promoción
        </button>
      </div>

      {/* Promotions List */}
      <PromotionsList
        promotions={promotions}
        isLoading={isLoading}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      {showForm && (
        <PromotionForm
          promotion={editingPromotion}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
