'use client';

import { useState, useEffect } from 'react';
import { generateSlugFromName, removeAccents } from '../../../lib/tenant';

interface ClinicInfoProps {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  onSubmit: (info: {
    clinicName: string;
    slug: string;
    phone?: string;
    address?: string;
  }) => void;
  isSubmitting: boolean;
  initialData?: {
    clinicName: string;
    slug: string;
    phone?: string;
    address?: string;
  };
}

export function ClinicInfo({ onSubmit, isSubmitting, initialData }: ClinicInfoProps) {
  const [clinicName, setClinicName] = useState(initialData?.clinicName || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugSuggestion, setSlugSuggestion] = useState<string | null>(null);

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
      setSlugSuggestion(null);
    }
  }, [slug]);

  const checkSlugAvailability = async (slugToCheck: string) => {
    try {
      const response = await fetch(`/api/onboarding/check-slug?slug=${slugToCheck}`);
      const data = await response.json();
      setSlugAvailable(data.available);
      setSlugSuggestion(data.available ? null : (data.suggestion ?? null));
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugAvailable(false);
      setSlugSuggestion(null);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName || !slug || isCheckingSlug || isSubmitting) return;
    // Si la URL elegida está ocupada, usamos la sugerencia libre.
    const finalSlug = slugAvailable === false && slugSuggestion ? slugSuggestion : slug;
    onSubmit({
      clinicName,
      slug: finalSlug,
      phone: phone || undefined,
      address: address || undefined,
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Crea tu clínica
        </h2>
        <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
          Solo necesitamos lo básico para empezar. Lo demás lo configuras dentro.
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
          {!isCheckingSlug && slugAvailable === true && (
            <p className="mt-1 text-sm text-green-600">✅ URL disponible</p>
          )}
          {!isCheckingSlug && slugAvailable === false && slugSuggestion && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-500">
              Esa URL ya está ocupada — usaremos <span className="font-medium">vetify.app/{slugSuggestion}</span>
            </p>
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
            placeholder="+52 (55) 1234-5678"
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

        <button
          type="submit"
          disabled={!clinicName || !slug || isCheckingSlug || isSubmitting}
          className="w-full py-3 px-4 bg-[#75a99c] hover:bg-[#5b9788] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando tu clínica...
            </div>
          ) : (
            'Empezar gratis'
          )}
        </button>

        <p className="text-center text-sm text-green-600 dark:text-green-400 font-medium">
          ✅ 30 días gratis · Sin tarjeta · Plan Profesional completo
        </p>
      </form>
    </div>
  );
}
