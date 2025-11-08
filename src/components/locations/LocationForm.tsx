'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/lib/locations';

interface LocationFormProps {
  mode: 'create' | 'edit';
  tenantId: string;
  initialData?: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    timezone: string | null;
    isActive: boolean;
    isPrimary: boolean;
  };
}

const COMMON_TIMEZONES = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/Monterrey', label: 'Monterrey (GMT-6)' },
  { value: 'America/Cancun', label: 'Cancún (GMT-5)' },
  { value: 'America/Mazatlan', label: 'Mazatlán (GMT-7)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (GMT-7)' },
];

export default function LocationForm({
  mode,
  tenantId: _tenantId, // eslint-disable-line @typescript-eslint/no-unused-vars
  initialData,
}: LocationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    timezone: initialData?.timezone || 'America/Mexico_City',
    isActive: initialData?.isActive ?? true,
    isPrimary: initialData?.isPrimary ?? false,
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (mode === 'create' && formData.name && !formData.slug) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(prev.name),
      }));
    }
  }, [formData.name, formData.slug, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url =
        mode === 'create'
          ? '/api/locations'
          : `/api/locations/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar ubicación');
      }

      setShowSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/locations');
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Error saving location:', error);
      setError(
        error instanceof Error ? error.message : 'Error al guardar ubicación'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/locations');
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Información Básica
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="form-input mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-[#75a99c] focus:ring-[#75a99c]"
                placeholder="Clínica Veterinaria Centro"
              />
            </div>

            {/* Slug */}
            <div className="sm:col-span-2">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Slug (URL) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="form-input mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-[#75a99c] focus:ring-[#75a99c]"
                placeholder="clinica-centro"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Solo letras minúsculas, números y guiones
              </p>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Dirección
              </label>
              <textarea
                id="address"
                rows={2}
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="form-input mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-[#75a99c] focus:ring-[#75a99c]"
                placeholder="Calle Principal #123, Colonia Centro"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Información de Contacto
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="form-input mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-[#75a99c] focus:ring-[#75a99c]"
                placeholder="+52 55 1234 5678"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="form-input mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-[#75a99c] focus:ring-[#75a99c]"
                placeholder="ubicacion@veterinaria.com"
              />
            </div>

            {/* Timezone */}
            <div>
              <label
                htmlFor="timezone"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Zona Horaria
              </label>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="form-input mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-[#75a99c] focus:ring-[#75a99c]"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Configuración
          </h3>

          <div className="space-y-4">
            {/* Is Primary */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) =>
                  setFormData({ ...formData, isPrimary: e.target.checked })
                }
                className="h-4 w-4 text-[#75a99c] focus:ring-[#75a99c] border-gray-300 rounded"
              />
              <label
                htmlFor="isPrimary"
                className="ml-2 block text-sm text-gray-900 dark:text-white"
              >
                Establecer como ubicación principal
              </label>
            </div>

            {/* Is Active */}
            {mode === 'edit' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-[#75a99c] focus:ring-[#75a99c] border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-900 dark:text-white"
                >
                  Ubicación activa
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#75a99c] hover:bg-[#639688] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c] disabled:opacity-50"
          >
            {isLoading
              ? 'Guardando...'
              : mode === 'create'
              ? 'Crear Ubicación'
              : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {mode === 'create'
                  ? 'Ubicación creada'
                  : 'Cambios guardados'}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {mode === 'create'
                  ? 'La ubicación ha sido creada exitosamente'
                  : 'Los cambios han sido guardados exitosamente'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
