"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserWithTenant } from '@/types';
import { themeColors } from '@/utils/theme-colors';

interface OnboardingFormProps {
  user: UserWithTenant;
}

interface FormData {
  clinicName: string;
  slug: string;
  phone: string;
  address: string;
}

interface SlugValidation {
  isChecking: boolean;
  isAvailable: boolean | null;
  message: string;
}

export function OnboardingForm({ user }: OnboardingFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    clinicName: '',
    slug: '',
    phone: user.phone || '',
    address: user.address || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugValidation, setSlugValidation] = useState<SlugValidation>({
    isChecking: false,
    isAvailable: null,
    message: ''
  });

  // Generate slug from clinic name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Debounced slug validation
  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugValidation({
        isChecking: false,
        isAvailable: null,
        message: ''
      });
      return;
    }

    setSlugValidation(prev => ({ ...prev, isChecking: true }));

    try {
      const response = await fetch(`/api/onboarding/check-slug?slug=${encodeURIComponent(slug)}`);
      const data = await response.json();

      setSlugValidation({
        isChecking: false,
        isAvailable: data.available,
        message: data.message
      });
    } catch {
      setSlugValidation({
        isChecking: false,
        isAvailable: null,
        message: 'Error al verificar disponibilidad'
      });
    }
  }, []);

  // Create debounced version using useRef to avoid dependency issues
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const debouncedCheckSlugAvailability = useCallback((slug: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      checkSlugAvailability(slug);
    }, 500);
  }, [checkSlugAvailability]);

  // Effect to check slug availability when it changes
  useEffect(() => {
    if (formData.slug) {
      debouncedCheckSlugAvailability(formData.slug);
    }
  }, [formData.slug, debouncedCheckSlugAvailability]);

  const handleClinicNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      clinicName: name,
      slug: generateSlug(name)
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.clinicName.trim() || !formData.slug.trim()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (slugValidation.isAvailable === false) {
      setError('Por favor elige una URL diferente');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la clínica');
      }

      // Redirect to dashboard after successful onboarding
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const getSlugInputClassName = () => {
    const baseClass = `flex-1 block w-full border rounded-none rounded-r-md px-3 py-2 ${themeColors.input.base} transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#75a99c] focus:border-[#75a99c]`;
    
    if (slugValidation.isChecking) {
      return `${baseClass} border-yellow-300 dark:border-yellow-600`;
    } else if (slugValidation.isAvailable === true) {
      return `${baseClass} border-green-300 dark:border-green-600`;
    } else if (slugValidation.isAvailable === false) {
      return `${baseClass} border-red-300 dark:border-red-600`;
    }
    
    return `${baseClass} ${themeColors.border.secondary}`;
  };

  const getSlugStatusIcon = () => {
    if (slugValidation.isChecking) {
      return <span className="text-yellow-500 dark:text-yellow-400">⏳</span>;
    } else if (slugValidation.isAvailable === true) {
      return <span className="text-green-500 dark:text-green-400">✅</span>;
    } else if (slugValidation.isAvailable === false) {
      return <span className="text-red-500 dark:text-red-400">❌</span>;
    }
    return null;
  };

  const isFormValid = formData.clinicName.trim() && 
                     formData.slug.trim() && 
                     slugValidation.isAvailable === true &&
                     !slugValidation.isChecking;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 transition-colors duration-200">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="clinicName" className={`block text-sm font-medium ${themeColors.text.primary} transition-colors duration-200`}>
          Nombre de la Clínica *
        </label>
        <input
          type="text"
          id="clinicName"
          required
          value={formData.clinicName}
          onChange={handleClinicNameChange}
          className={`mt-1 block w-full ${themeColors.input.base} ${themeColors.border.secondary} rounded-md px-3 py-2 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#75a99c] focus:border-[#75a99c]`}
          placeholder="Ej: Clínica Veterinaria San Martín"
        />
      </div>

      <div>
        <label htmlFor="slug" className={`block text-sm font-medium ${themeColors.text.primary} transition-colors duration-200`}>
          URL de la Clínica *
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className={`inline-flex items-center px-3 rounded-l-md border border-r-0 ${themeColors.border.secondary} ${themeColors.background.secondary} ${themeColors.text.secondary} text-sm transition-colors duration-200`}>
            vetify.app/
          </span>
          <input
            type="text"
            id="slug"
            required
            value={formData.slug}
            onChange={handleSlugChange}
            className={getSlugInputClassName()}
            placeholder="clinica-san-martin"
            minLength={3}
          />
          {formData.slug && (
            <div className={`inline-flex items-center px-3 border border-l-0 ${themeColors.border.secondary} ${themeColors.background.secondary} transition-colors duration-200`}>
              {getSlugStatusIcon()}
            </div>
          )}
        </div>
        {slugValidation.message && (
          <p className={`mt-1 text-xs transition-colors duration-200 ${
            slugValidation.isAvailable === true ? 'text-green-600 dark:text-green-400' : 
            slugValidation.isAvailable === false ? 'text-red-600 dark:text-red-400' : 
            'text-yellow-600 dark:text-yellow-400'
          }`}>
            {slugValidation.message}
          </p>
        )}
        <p className={`mt-1 text-xs ${themeColors.text.secondary} transition-colors duration-200`}>
          Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
        </p>
      </div>

      <div>
        <label htmlFor="phone" className={`block text-sm font-medium ${themeColors.text.primary} transition-colors duration-200`}>
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className={`mt-1 block w-full ${themeColors.input.base} ${themeColors.border.secondary} rounded-md px-3 py-2 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#75a99c] focus:border-[#75a99c]`}
          placeholder="+1 234 567 8900"
        />
      </div>

      <div>
        <label htmlFor="address" className={`block text-sm font-medium ${themeColors.text.primary} transition-colors duration-200`}>
          Dirección
        </label>
        <textarea
          id="address"
          rows={3}
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className={`mt-1 block w-full ${themeColors.input.base} ${themeColors.border.secondary} rounded-md px-3 py-2 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#75a99c] focus:border-[#75a99c]`}
          placeholder="Calle Principal 123, Ciudad, País"
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 transition-colors duration-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400 dark:text-blue-300">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 transition-colors duration-200">
              Plan Gratuito
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300 transition-colors duration-200">
              Comenzarás con nuestro plan gratuito que incluye:
            </p>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside transition-colors duration-200">
              <li>Hasta 50 mascotas</li>
              <li>1 usuario</li>
              <li>1GB de almacenamiento</li>
              <li>Funcionalidades básicas</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !isFormValid}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#75a99c] hover:bg-[#5b9788] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#75a99c] dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Configurando...
          </div>
        ) : (
          'Crear Mi Clínica'
        )}
      </button>
    </form>
  );
} 