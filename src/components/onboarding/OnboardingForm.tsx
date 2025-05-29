"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserWithTenant } from '@/types';

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
    const baseClass = "flex-1 block w-full border rounded-none rounded-r-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500";
    
    if (slugValidation.isChecking) {
      return `${baseClass} border-yellow-300`;
    } else if (slugValidation.isAvailable === true) {
      return `${baseClass} border-green-300`;
    } else if (slugValidation.isAvailable === false) {
      return `${baseClass} border-red-300`;
    }
    
    return `${baseClass} border-gray-300`;
  };

  const getSlugStatusIcon = () => {
    if (slugValidation.isChecking) {
      return <span className="text-yellow-500">⏳</span>;
    } else if (slugValidation.isAvailable === true) {
      return <span className="text-green-500">✅</span>;
    } else if (slugValidation.isAvailable === false) {
      return <span className="text-red-500">❌</span>;
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
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="clinicName" className="block text-sm font-medium text-gray-700">
          Nombre de la Clínica *
        </label>
        <input
          type="text"
          id="clinicName"
          required
          value={formData.clinicName}
          onChange={handleClinicNameChange}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Ej: Clínica Veterinaria San Martín"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          URL de la Clínica *
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
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
            <div className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50">
              {getSlugStatusIcon()}
            </div>
          )}
        </div>
        {slugValidation.message && (
          <p className={`mt-1 text-xs ${
            slugValidation.isAvailable === true ? 'text-green-600' : 
            slugValidation.isAvailable === false ? 'text-red-600' : 
            'text-yellow-600'
          }`}>
            {slugValidation.message}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
        </p>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="+1 234 567 8900"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Dirección
        </label>
        <textarea
          id="address"
          rows={3}
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Calle Principal 123, Ciudad, País"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-blue-400">ℹ️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Plan Gratuito
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Comenzarás con nuestro plan gratuito que incluye:
            </p>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
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
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Configurando...' : 'Crear Mi Clínica'}
      </button>
    </form>
  );
} 