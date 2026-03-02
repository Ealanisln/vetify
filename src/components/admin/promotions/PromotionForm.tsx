'use client';

import { useState } from 'react';
import type { SystemPromotion } from '@prisma/client';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PromotionFormProps {
  promotion: SystemPromotion | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PLAN_OPTIONS = [
  { value: 'BASICO', label: 'Plan Básico' },
  { value: 'PROFESIONAL', label: 'Plan Profesional' },
];

export function PromotionForm({ promotion, onClose, onSuccess }: PromotionFormProps) {
  const isEditing = !!promotion;

  const [formData, setFormData] = useState({
    name: promotion?.name || '',
    code: promotion?.code || '',
    promotionType: promotion?.promotionType || 'DISCOUNT',
    discountPercent: promotion?.discountPercent || 25,
    durationMonths: promotion?.durationMonths || 6,
    trialDays: promotion?.trialDays || 180,
    maxRedemptions: promotion?.maxRedemptions ?? '',
    startDate: promotion?.startDate
      ? new Date(promotion.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    endDate: promotion?.endDate
      ? new Date(promotion.endDate).toISOString().split('T')[0]
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    stripeCouponId: promotion?.stripeCouponId || '',
    badgeText: promotion?.badgeText || '',
    description: promotion?.description || '',
    applicablePlans: promotion?.applicablePlans || [],
    isActive: promotion?.isActive || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handlePlanToggle = (plan: string) => {
    setFormData((prev) => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(plan)
        ? prev.applicablePlans.filter((p) => p !== plan)
        : [...prev.applicablePlans, plan],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/admin/promotions/${promotion.id}`
        : '/api/admin/promotions';

      const method = isEditing ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        maxRedemptions: formData.maxRedemptions === '' ? null : Number(formData.maxRedemptions),
        trialDays: formData.promotionType === 'FREE_TRIAL' ? Number(formData.trialDays) : null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar la promoción');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Promoción' : 'Nueva Promoción'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre interno *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Oferta de Lanzamiento 2026"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                    }))
                  }
                  required
                  placeholder="Ej: LAUNCH_2026"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Solo mayúsculas, números, guiones y guiones bajos
                </p>
              </div>
            </div>

            {/* Promotion Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Promoción *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, promotionType: 'DISCOUNT' }))}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    formData.promotionType === 'DISCOUNT'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700'
                      : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                  }`}
                >
                  Descuento (%)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, promotionType: 'FREE_TRIAL' }))}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    formData.promotionType === 'FREE_TRIAL'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700'
                      : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                  }`}
                >
                  Prueba Gratuita
                </button>
              </div>
            </div>

            {/* Discount/Trial Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.promotionType === 'DISCOUNT' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Porcentaje de descuento *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="discountPercent"
                      value={formData.discountPercent}
                      onChange={handleChange}
                      required
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Días de prueba gratuita *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="trialDays"
                      value={formData.trialDays}
                      onChange={handleChange}
                      required
                      min="1"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      días
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Stripe creará un trial extendido. Ej: 180 = 6 meses
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duración del descuento *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="durationMonths"
                    value={formData.durationMonths}
                    onChange={handleChange}
                    required
                    min="1"
                    max="24"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    meses
                  </span>
                </div>
              </div>
            </div>

            {/* Max Redemptions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Máximo de canjes
              </label>
              <input
                type="number"
                name="maxRedemptions"
                value={formData.maxRedemptions}
                onChange={handleChange}
                min="1"
                placeholder="Vacío = ilimitado"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Deja vacío para canjes ilimitados. Ej: 50 para las primeras 50 clínicas.
              </p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de inicio *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de fin *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Stripe Coupon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID del Cupón en Stripe
              </label>
              <input
                type="text"
                name="stripeCouponId"
                value={formData.stripeCouponId}
                onChange={handleChange}
                placeholder="Ej: u62SRvcw"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Crea el cupón en Stripe Dashboard y pega su ID aquí
              </p>
            </div>

            {/* Display Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Texto del Badge *
              </label>
              <input
                type="text"
                name="badgeText"
                value={formData.badgeText}
                onChange={handleChange}
                required
                placeholder="Ej: 🎉 Oferta de Lanzamiento"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={2}
                placeholder="Ej: 25% de descuento los primeros 6 meses"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Applicable Plans */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Planes aplicables
              </label>
              <div className="flex flex-wrap gap-2">
                {PLAN_OPTIONS.map((plan) => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => handlePlanToggle(plan.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.applicablePlans.includes(plan.value)
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {plan.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Deja vacío para aplicar a todos los planes
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Activar promoción inmediatamente
              </label>
            </div>

            {formData.isActive && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm">
                ⚠️ Activar esta promoción desactivará cualquier otra promoción activa.
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? 'Guardando...'
                  : isEditing
                  ? 'Guardar Cambios'
                  : 'Crear Promoción'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
