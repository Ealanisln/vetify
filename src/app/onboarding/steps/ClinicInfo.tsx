'use client';

import { useState, useEffect } from 'react';
import { generateSlugFromName, removeAccents } from '../../../lib/tenant';

interface ClinicInfoProps {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  onNext: (info: {
    clinicName: string;
    slug: string;
    phone?: string;
    address?: string;
  }) => void;
  onBack: () => void;
  initialData?: {
    clinicName: string;
    slug: string;
    phone?: string;
    address?: string;
  };
}

export function ClinicInfo({ onNext, onBack, initialData }: ClinicInfoProps) {
  const [clinicName, setClinicName] = useState(initialData?.clinicName || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Auto-generate slug from clinic name
  useEffect(() => {
    if (clinicName && !initialData?.slug) {
      const generatedSlug = generateSlugFromName(clinicName);
      setSlug(generatedSlug);
    }
  }, [clinicName, initialData?.slug]);

  // Check slug availability
  useEffect(() => {
    if (slug && slug.length >= 3) {
      setIsCheckingSlug(true);
      checkSlugAvailability(slug);
    } else {
      setSlugAvailable(null);
    }
  }, [slug]);

  const checkSlugAvailability = async (slugToCheck: string) => {
    try {
      const response = await fetch(`/api/onboarding/check-slug?slug=${slugToCheck}`);
      const data = await response.json();
      setSlugAvailable(data.available);
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugAvailable(false);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clinicName && slug && slugAvailable) {
      onNext({
        clinicName,
        slug,
        phone: phone || undefined,
        address: address || undefined,
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Información de tu clínica
        </h2>
        <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
          Configura los datos básicos de tu clínica veterinaria
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre de la clínica *
          </label>
          <input
            type="text"
            id="clinicName"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#75a99c] focus:ring-[#75a99c] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Ej: Clínica Veterinaria San Martín"
            required
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            URL de tu clínica *
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400">
              vetify.app/
            </span>
            <input
              type="text"
              id="slug"
              value={slug}
              onChange={(e) => {
                // Remove accents first, then sanitize
                const sanitized = removeAccents(e.target.value)
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, '');
                setSlug(sanitized);
              }}
              className="flex-1 min-w-0 block w-full rounded-none rounded-r-md border-gray-300 focus:border-[#75a99c] focus:ring-[#75a99c] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="mi-clinica"
              required
            />
          </div>
          {isCheckingSlug && (
            <p className="mt-1 text-sm text-gray-500">Verificando disponibilidad...</p>
          )}
          {slugAvailable === true && (
            <p className="mt-1 text-sm text-green-600">✅ URL disponible</p>
          )}
          {slugAvailable === false && (
            <p className="mt-1 text-sm text-red-600">❌ URL no disponible</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#75a99c] focus:ring-[#75a99c] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Dirección
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#75a99c] focus:ring-[#75a99c] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Calle Principal 123, Ciudad, Estado"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
          >
            Atrás
          </button>
          <button
            type="submit"
            disabled={!clinicName || !slug || !slugAvailable}
            className="w-full sm:flex-1 py-3 px-4 bg-[#75a99c] hover:bg-[#5b9788] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
} 