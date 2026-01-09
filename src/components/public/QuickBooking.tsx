'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { CheckCircle, AlertCircle, User, ArrowRight, Users, Clock, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { PublicTenant, PublicService } from '../../lib/tenant';
import { getTheme, getThemeClasses } from '../../lib/themes';
import { formatDate } from '../../lib/utils/date-format';
import { useThemeAware } from '@/hooks/useThemeAware';
import { generateDarkColors } from '@/lib/color-utils';
import { getSessionId, trackFormStart, trackConversion } from '@/lib/analytics/landing-tracker';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  photoUrl?: string;
}

interface CustomerLookupResult {
  found: boolean;
  customer?: {
    id: string;
    name: string;
    hasPhone: boolean;
    hasEmail: boolean;
  };
  pets?: Pet[];
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface AppointmentRequest {
  id: string;
  petName: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
}

interface SimilarCustomer extends Customer {
  pets?: Pet[];
}

interface QuickBookingProps {
  tenant: PublicTenant;
}

interface TimeSlot {
  dateTime: string;
  time: string;
  displayTime: string;
  period: 'morning' | 'afternoon';
}

interface AvailabilityData {
  date: string;
  availableSlots: TimeSlot[];
  workingDay: boolean;
  message?: string;
  businessHours?: {
    open: string;
    close: string;
    lunchStart: string | null;
    lunchEnd: string | null;
  };
}

interface SubmissionResult {
  success: boolean;
  data?: {
    appointmentRequest: AppointmentRequest;
    customerStatus: 'existing' | 'new' | 'needs_review';
    existingPets: Pet[];
    hasAccount: boolean;
    confidence: 'high' | 'medium' | 'low';
    loginPrompt?: {
      message: string;
      loginUrl: string;
    };
    similarCustomers?: SimilarCustomer[];
  };
  error?: string;
}

// Default services fallback if tenant has no services configured
const DEFAULT_SERVICES: PublicService[] = [
  { title: 'Consulta General', description: 'Revisión general de salud' },
  { title: 'Vacunación', description: 'Aplicación de vacunas' },
  { title: 'Emergencia', description: 'Atención de emergencia' },
];

export function QuickBooking({ tenant }: QuickBookingProps) {
  const theme = getTheme(tenant.publicTheme);
  const themeColor = tenant.publicThemeColor || theme.colors.primary;
  const themeClasses = getThemeClasses(theme);
  const { isDark } = useThemeAware();

  // Generate dark mode colors from theme primary
  const darkColors = generateDarkColors(themeColor);

  // Select colors based on current theme
  const colors = isDark ? {
    text: darkColors.text,
    textMuted: darkColors.textMuted,
    cardBg: darkColors.cardBg,
    background: darkColors.background,
    backgroundAlt: darkColors.backgroundAlt,
    border: darkColors.border,
  } : {
    text: theme.colors.text,
    textMuted: theme.colors.textMuted,
    cardBg: theme.colors.cardBg,
    background: theme.colors.background,
    backgroundAlt: theme.colors.backgroundAlt,
    border: theme.colors.border,
  };

  // Get services from tenant config or use defaults
  const services: PublicService[] = tenant.publicServices && tenant.publicServices.length > 0
    ? tenant.publicServices
    : DEFAULT_SERVICES;

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    petName: '',
    petId: '', // ID of selected existing pet
    service: '',
    customService: '', // For when "other" is selected
    preferredDate: '',
    preferredTime: '',
    notes: ''
  });

  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityData | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Customer lookup state
  const [customerLookup, setCustomerLookup] = useState<CustomerLookupResult | null>(null);
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [lookupDebounceTimer, setLookupDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Lookup customer when phone or email changes (debounced)
  const lookupCustomer = useCallback(async (phone: string, email: string) => {
    // Need at least phone (10 digits) or valid email
    const normalizedPhone = phone.replace(/\D/g, '');
    const hasValidPhone = normalizedPhone.length >= 10;
    const hasValidEmail = email && email.includes('@') && email.includes('.');

    if (!hasValidPhone && !hasValidEmail) {
      setCustomerLookup(null);
      return;
    }

    setIsLookingUpCustomer(true);
    try {
      const response = await fetch('/api/public/customer-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          phone: hasValidPhone ? phone : undefined,
          email: hasValidEmail ? email : undefined
        })
      });

      const result = await response.json();
      if (result.success) {
        setCustomerLookup(result);
        // If we found a customer and they have a different name, suggest it
        if (result.found && result.customer && !formData.customerName) {
          setFormData(prev => ({ ...prev, customerName: result.customer.name }));
        }
      }
    } catch (error) {
      console.error('Error looking up customer:', error);
    } finally {
      setIsLookingUpCustomer(false);
    }
  }, [tenant.slug, formData.customerName]);

  // Debounced lookup effect
  useEffect(() => {
    if (lookupDebounceTimer) {
      clearTimeout(lookupDebounceTimer);
    }

    const timer = setTimeout(() => {
      lookupCustomer(formData.customerPhone, formData.customerEmail);
    }, 500); // Wait 500ms after user stops typing

    setLookupDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.customerPhone, formData.customerEmail]);

  // Handle pet selection
  const handlePetSelect = (pet: Pet | null) => {
    if (pet) {
      setFormData(prev => ({
        ...prev,
        petId: pet.id,
        petName: pet.name
      }));
    } else {
      // "Nueva mascota" selected
      setFormData(prev => ({
        ...prev,
        petId: '',
        petName: ''
      }));
    }
  };

  // Fetch available slots when date changes
  const fetchAvailability = useCallback(async (date: string) => {
    if (!date) {
      setAvailability(null);
      return;
    }

    setIsLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/public/availability?tenantSlug=${tenant.slug}&date=${date}`
      );
      const result = await response.json();

      if (result.success) {
        setAvailability(result.data);
        // Clear selected time if it's no longer available
        if (formData.preferredTime && result.data.availableSlots) {
          const isStillAvailable = result.data.availableSlots.some(
            (slot: TimeSlot) => slot.time === formData.preferredTime
          );
          if (!isStillAvailable) {
            setFormData(prev => ({ ...prev, preferredTime: '' }));
          }
        }
      } else {
        setAvailability(null);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability(null);
    } finally {
      setIsLoadingSlots(false);
    }
  }, [tenant.slug, formData.preferredTime]);

  // Fetch availability when date changes
  useEffect(() => {
    if (formData.preferredDate) {
      fetchAvailability(formData.preferredDate);
    }
  }, [formData.preferredDate, fetchAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Use customService if "otro" is selected, otherwise use the selected service
    const finalService = formData.service === 'otro' ? formData.customService : formData.service;

    try {
      const sessionId = getSessionId();

      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          sessionId, // Include session ID for analytics tracking
          ...formData,
          service: finalService,
          petId: formData.petId || undefined // Include pet ID if selected
        })
      });

      const result = await response.json();
      setSubmissionResult(result);

      // Track conversion on success
      if (result.success && result.data?.appointmentRequest?.id) {
        trackConversion(tenant.slug, result.data.appointmentRequest.id);
      }
    } catch (error) {
      console.error('Error submitting appointment:', error);
      setSubmissionResult({
        success: false,
        error: 'Error al enviar la solicitud. Por favor intenta de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🎉 MOSTRAR RESULTADO DE LA SOLICITUD
  if (submissionResult?.success) {
    const data = submissionResult.data!;

    return (
      <section className="py-16 transition-colors duration-200" style={{ backgroundColor: colors.cardBg }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4" style={{ color: colors.text }}>
              ¡Solicitud Enviada!
            </h2>
            <p className="text-lg mb-8" style={{ color: colors.textMuted }}>
              Hemos recibido tu solicitud de cita. Nos contactaremos contigo pronto para confirmar.
            </p>

            {/* 🔍 INFORMACIÓN DE IDENTIFICACIÓN */}
            {data.customerStatus === 'existing' && data.confidence === 'high' && (
              <div className="mb-6 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 rounded-lg p-4 transition-colors">
                <div className="flex items-start space-x-3">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1" />
                  <div className="text-left">
                    <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                      ¡Te reconocemos! 👋
                    </p>
                    <p className="text-blue-700 dark:text-blue-400 mb-3">
                      Encontramos tu perfil en nuestro sistema. Esta solicitud se agregará a tu historial.
                    </p>
                    {data.existingPets?.length > 0 && (
                      <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1 flex items-center">
                          <Heart className="h-4 w-4 mr-2" />
                          Tus mascotas registradas:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {data.existingPets.map((pet: Pet) => (
                            <span key={pet.id} className="bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                              {pet.name} ({pet.species})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 🔐 PROMPT PARA LOGIN */}
            {data.hasAccount && data.loginPrompt && (
              <div className="mb-6 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg p-4 transition-colors">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-1" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                    <div className="text-left">
                      <p className="font-semibold text-green-800 dark:text-green-300">
                        {data.loginPrompt.message}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Accede a tu historial, mascotas y citas anteriores
                      </p>
                    </div>
                    <Link href={data.loginPrompt.loginUrl}>
                      <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 whitespace-nowrap text-sm px-3 py-1">
                        Iniciar Sesión
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ⚠️ CLIENTE NECESITA REVISIÓN */}
            {data.customerStatus === 'needs_review' && (
              <div className="mb-6 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 rounded-lg p-4 transition-colors">
                <div className="flex items-start space-x-3">
                  <Users className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-1" />
                  <div className="text-left">
                    <p className="font-semibold text-orange-800 dark:text-orange-300 mb-2">
                      Información recibida ✓
                    </p>
                    <p className="text-orange-700 dark:text-orange-400 text-sm">
                      Hemos encontrado información similar en nuestro sistema.
                      Nuestro equipo revisará y consolidará tu información para brindarte un mejor servicio.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 📋 RESUMEN DE LA SOLICITUD */}
            <div className="rounded-lg p-6 text-left transition-colors" style={{ backgroundColor: colors.backgroundAlt }}>
              <h3 className="font-semibold mb-4 flex items-center" style={{ color: colors.text }}>
                <Clock className="h-5 w-5 mr-2" style={{ color: themeColor }} />
                Detalles de tu solicitud:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{ color: colors.textMuted }}>
                <div>
                  <p><strong style={{ color: colors.text }}>Cliente:</strong> {formData.customerName}</p>
                  <p><strong style={{ color: colors.text }}>Teléfono:</strong> {formData.customerPhone}</p>
                  {formData.customerEmail && (
                    <p><strong style={{ color: colors.text }}>Email:</strong> {formData.customerEmail}</p>
                  )}
                </div>
                <div>
                  <p><strong style={{ color: colors.text }}>Mascota:</strong> {formData.petName}</p>
                  {formData.service && <p><strong style={{ color: colors.text }}>Servicio:</strong> {formData.service}</p>}
                  {formData.preferredDate && (
                    <p><strong style={{ color: colors.text }}>Fecha preferida:</strong> {formatDate(formData.preferredDate)}</p>
                  )}
                  {formData.preferredTime && (
                    <p><strong style={{ color: colors.text }}>Hora preferida:</strong> {formData.preferredTime}</p>
                  )}
                </div>
              </div>
              {formData.notes && (
                <div className="mt-4 pt-4 border-t transition-colors" style={{ borderColor: colors.border }}>
                  <p className="text-sm" style={{ color: colors.textMuted }}><strong style={{ color: colors.text }}>Notas:</strong> {formData.notes}</p>
                </div>
              )}
            </div>

            {/* 📞 INFORMACIÓN DE CONTACTO */}
            <div className="mt-8 text-center">
              <p className="mb-4" style={{ color: colors.textMuted }}>
                ¿Tienes alguna pregunta? No dudes en contactarnos:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/${tenant.slug}`}>
                  <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ❌ MOSTRAR ERROR
  if (submissionResult?.error) {
    return (
      <section className="py-16 transition-colors duration-200" style={{ backgroundColor: colors.cardBg }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4" style={{ color: colors.text }}>
              Error al enviar solicitud
            </h2>
            <p className="text-lg mb-8" style={{ color: colors.textMuted }}>
              {submissionResult.error}
            </p>
            <Button
              onClick={() => setSubmissionResult(null)}
              style={{ backgroundColor: themeColor }}
              className="hover:opacity-90 text-white"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // 📝 FORMULARIO ORIGINAL
  return (
    <section
      className="py-16 transition-colors duration-200"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-bold mb-4"
            style={{
              color: colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.headingWeight
            }}
          >
            Agenda tu Cita
          </h2>
          <p className="text-lg" style={{ color: colors.textMuted }}>
            Completa el formulario y nos contactaremos contigo para confirmar tu cita
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información del cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center" style={{ color: colors.text }}>
                <User className="h-5 w-5 mr-2" style={{ color: themeColor }} />
                Información de Contacto
              </h3>

              <div>
                <label htmlFor="customerName" className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Nombre completo *
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  required
                  placeholder="Tu nombre completo"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Teléfono *
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  required
                  placeholder="Tu número de teléfono"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Email (opcional)
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                  Nos ayuda a identificarte si ya eres cliente
                </p>
              </div>
            </div>

            {/* Información de la cita */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center" style={{ color: colors.text }}>
                <Heart className="h-5 w-5 mr-2" style={{ color: themeColor }} />
                Detalles de la Cita
              </h3>

              {/* Pet selection - shows existing pets if customer is recognized */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Mascota *
                  {isLookingUpCustomer && (
                    <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin text-gray-400 dark:text-gray-500" />
                  )}
                </label>

                {/* Show existing pets if customer is recognized */}
                {customerLookup?.found && customerLookup.pets && customerLookup.pets.length > 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-700 dark:text-blue-300 mb-2 transition-colors">
                      <User className="inline-block h-4 w-4 mr-1" />
                      ¡Te reconocemos! Selecciona una de tus mascotas o agrega una nueva.
                    </div>

                    {/* Pet selection buttons */}
                    <div className="flex flex-wrap gap-2">
                      {customerLookup.pets.map((pet) => (
                        <button
                          key={pet.id}
                          type="button"
                          onClick={() => handlePetSelect(pet)}
                          className={`px-3 py-2 rounded-md border text-sm transition-colors flex items-center gap-2 ${
                            formData.petId === pet.id
                              ? 'text-white border-transparent'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                          }`}
                          style={formData.petId === pet.id ? { backgroundColor: themeColor } : { color: isDark ? colors.text : undefined }}
                        >
                          <Heart className="h-4 w-4" />
                          <span>{pet.name}</span>
                          {pet.species && (
                            <span className={`text-xs ${formData.petId === pet.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                              ({pet.species})
                            </span>
                          )}
                        </button>
                      ))}

                      {/* Option for new pet */}
                      <button
                        type="button"
                        onClick={() => handlePetSelect(null)}
                        className={`px-3 py-2 rounded-md border text-sm transition-colors ${
                          formData.petId === '' && formData.petName === ''
                            ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                        }`}
                        style={{ color: colors.text }}
                      >
                        + Nueva mascota
                      </button>
                    </div>

                    {/* Input for new pet name (only if "nueva mascota" is selected) */}
                    {formData.petId === '' && (
                      <input
                        id="petName"
                        type="text"
                        value={formData.petName}
                        onChange={(e) => setFormData({...formData, petName: e.target.value})}
                        required
                        placeholder="Nombre de la nueva mascota"
                        className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    )}
                  </div>
                ) : (
                  /* Regular input if customer not recognized */
                  <input
                    id="petName"
                    type="text"
                    value={formData.petName}
                    onChange={(e) => setFormData({...formData, petName: e.target.value, petId: ''})}
                    required
                    placeholder="Nombre de tu mascota"
                    className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                )}
              </div>
              
              <div>
                <label htmlFor="service" className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Tipo de servicio
                </label>
                <select
                  id="service"
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value, customService: ''})}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  style={{
                    '--tw-ring-color': themeColor
                  } as React.CSSProperties}
                >
                  <option value="">Selecciona un servicio</option>
                  {services.map((service, index) => (
                    <option key={index} value={service.title}>
                      {service.title}{service.price ? ` - ${service.price}` : ''}
                    </option>
                  ))}
                  <option value="otro">Otro (especificar)</option>
                </select>
              </div>

              {/* Custom service input when "otro" is selected */}
              {formData.service === 'otro' && (
                <div>
                  <label htmlFor="customService" className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                    Describe el servicio que necesitas
                  </label>
                  <input
                    id="customService"
                    type="text"
                    value={formData.customService}
                    onChange={(e) => setFormData({...formData, customService: e.target.value})}
                    placeholder="Ej: Revisión dental, desparasitación..."
                    className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              )}

              {/* Date selector */}
              <div>
                <label htmlFor="preferredDate" className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Fecha preferida
                </label>
                <input
                  id="preferredDate"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({...formData, preferredDate: e.target.value, preferredTime: ''})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Time slots - Smart selector based on availability */}
              {formData.preferredDate && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                    Hora preferida
                    {isLoadingSlots && (
                      <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />
                    )}
                  </label>

                  {!isLoadingSlots && availability && (
                    <>
                      {!availability.workingDay ? (
                        <div className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 p-3 rounded-md transition-colors">
                          {availability.message || 'Este día no hay servicio disponible'}
                        </div>
                      ) : availability.availableSlots.length === 0 ? (
                        <div className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 p-3 rounded-md transition-colors">
                          No hay horarios disponibles para este día. Por favor selecciona otra fecha.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Morning slots */}
                          {availability.availableSlots.filter(s => s.period === 'morning').length > 0 && (
                            <div>
                              <p className="text-xs mb-2" style={{ color: colors.textMuted }}>Mañana</p>
                              <div className="flex flex-wrap gap-2">
                                {availability.availableSlots
                                  .filter(slot => slot.period === 'morning')
                                  .map((slot) => (
                                    <button
                                      key={slot.time}
                                      type="button"
                                      onClick={() => setFormData({...formData, preferredTime: slot.time})}
                                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                        formData.preferredTime === slot.time
                                          ? 'text-white border-transparent'
                                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                                      }`}
                                      style={formData.preferredTime === slot.time ? { backgroundColor: themeColor } : { color: isDark ? colors.text : undefined }}
                                    >
                                      {slot.displayTime}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Afternoon slots */}
                          {availability.availableSlots.filter(s => s.period === 'afternoon').length > 0 && (
                            <div>
                              <p className="text-xs mb-2" style={{ color: colors.textMuted }}>Tarde</p>
                              <div className="flex flex-wrap gap-2">
                                {availability.availableSlots
                                  .filter(slot => slot.period === 'afternoon')
                                  .map((slot) => (
                                    <button
                                      key={slot.time}
                                      type="button"
                                      onClick={() => setFormData({...formData, preferredTime: slot.time})}
                                      className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                        formData.preferredTime === slot.time
                                          ? 'text-white border-transparent'
                                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                                      }`}
                                      style={formData.preferredTime === slot.time ? { backgroundColor: themeColor } : { color: isDark ? colors.text : undefined }}
                                    >
                                      {slot.displayTime}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}

                          {formData.preferredTime && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              <CheckCircle className="inline-block h-4 w-4 mr-1" />
                              Horario seleccionado: {availability.availableSlots.find(s => s.time === formData.preferredTime)?.displayTime}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {!isLoadingSlots && !availability && formData.preferredDate && (
                    <div className="text-sm" style={{ color: colors.textMuted }}>
                      Selecciona una fecha para ver horarios disponibles
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notas adicionales */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Notas adicionales (opcional)
            </label>
            <textarea
              id="notes"
              placeholder="Describe el motivo de la consulta o cualquier información adicional que consideres importante..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-colors bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className={`w-full text-white ${themeClasses.button}`}
            style={{
              backgroundColor: themeColor,
              borderRadius: theme.layout.borderRadius
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Enviando solicitud...' : 'Solicitar Cita'}
          </Button>
        </form>
      </div>
    </section>
  );
} 