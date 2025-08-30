'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { CheckCircle, AlertCircle, User, ArrowRight, Users, Clock, Heart } from 'lucide-react';
import Link from 'next/link';
import type { PublicTenant } from '../../lib/tenant';

interface Pet {
  id: string;
  name: string;
  species: string;
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

export function QuickBooking({ tenant }: QuickBookingProps) {
  const themeColor = tenant.publicThemeColor || '#75a99c';
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    petName: '',
    service: '',
    preferredDate: '',
    preferredTime: '',
    notes: ''
  });

  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          ...formData
        })
      });

      const result = await response.json();
      setSubmissionResult(result);
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
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Solicitud Enviada!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Hemos recibido tu solicitud de cita. Nos contactaremos contigo pronto para confirmar.
            </p>

            {/* 🔍 INFORMACIÓN DE IDENTIFICACIÓN */}
            {data.customerStatus === 'existing' && data.confidence === 'high' && (
              <div className="mb-6 border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <User className="h-4 w-4 text-blue-600 mt-1" />
                  <div className="text-left">
                    <p className="font-semibold text-blue-800 mb-2">
                      ¡Te reconocemos! 👋
                    </p>
                    <p className="text-blue-700 mb-3">
                      Encontramos tu perfil en nuestro sistema. Esta solicitud se agregará a tu historial.
                    </p>
                    {data.existingPets?.length > 0 && (
                      <div className="bg-blue-100 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-800 mb-1 flex items-center">
                          <Heart className="h-4 w-4 mr-2" />
                          Tus mascotas registradas:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {data.existingPets.map((pet: Pet) => (
                            <span key={pet.id} className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs">
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
              <div className="mb-6 border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-4 w-4 text-green-600 mt-1" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
                    <div className="text-left">
                      <p className="font-semibold text-green-800">
                        {data.loginPrompt.message}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Accede a tu historial, mascotas y citas anteriores
                      </p>
                    </div>
                    <Link href={data.loginPrompt.loginUrl}>
                      <Button className="bg-green-600 hover:bg-green-700 whitespace-nowrap text-sm px-3 py-1">
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
              <div className="mb-6 border border-orange-200 bg-orange-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Users className="h-4 w-4 text-orange-600 mt-1" />
                  <div className="text-left">
                    <p className="font-semibold text-orange-800 mb-2">
                      Información recibida ✓
                    </p>
                    <p className="text-orange-700 text-sm">
                      Hemos encontrado información similar en nuestro sistema. 
                      Nuestro equipo revisará y consolidará tu información para brindarte un mejor servicio.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 📋 RESUMEN DE LA SOLICITUD */}
            <div className="bg-gray-50 rounded-lg p-6 text-left">
              <h3 className="font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" style={{ color: themeColor }} />
                Detalles de tu solicitud:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>Cliente:</strong> {formData.customerName}</p>
                  <p><strong>Teléfono:</strong> {formData.customerPhone}</p>
                  {formData.customerEmail && (
                    <p><strong>Email:</strong> {formData.customerEmail}</p>
                  )}
                </div>
                <div>
                  <p><strong>Mascota:</strong> {formData.petName}</p>
                  {formData.service && <p><strong>Servicio:</strong> {formData.service}</p>}
                  {formData.preferredDate && (
                    <p><strong>Fecha preferida:</strong> {new Date(formData.preferredDate).toLocaleDateString()}</p>
                  )}
                  {formData.preferredTime && (
                    <p><strong>Hora preferida:</strong> {formData.preferredTime}</p>
                  )}
                </div>
              </div>
              {formData.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm"><strong>Notas:</strong> {formData.notes}</p>
                </div>
              )}
            </div>

            {/* 📞 INFORMACIÓN DE CONTACTO */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                ¿Tienes alguna pregunta? No dudes en contactarnos:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/${tenant.slug}`}>
                  <Button variant="outline">
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
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Error al enviar solicitud
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {submissionResult.error}
            </p>
            <Button 
              onClick={() => setSubmissionResult(null)}
              style={{ backgroundColor: themeColor }}
              className="hover:opacity-90"
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
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Agenda tu Cita
          </h2>
          <p className="text-lg text-gray-600">
            Completa el formulario y nos contactaremos contigo para confirmar tu cita
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información del cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" style={{ color: themeColor }} />
                Información de Contacto
              </h3>
              
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  required
                  placeholder="Tu nombre completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  required
                  placeholder="Tu número de teléfono"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (opcional)
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nos ayuda a identificarte si ya eres cliente
                </p>
              </div>
            </div>

            {/* Información de la cita */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Heart className="h-5 w-5 mr-2" style={{ color: themeColor }} />
                Detalles de la Cita
              </h3>
              
              <div>
                <label htmlFor="petName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la mascota *
                </label>
                <input
                  id="petName"
                  type="text"
                  value={formData.petName}
                  onChange={(e) => setFormData({...formData, petName: e.target.value})}
                  required
                  placeholder="Nombre de tu mascota"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de servicio
                </label>
                <select 
                  id="service"
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona un servicio</option>
                  <option value="consulta">Consulta General</option>
                  <option value="vacunacion">Vacunación</option>
                  <option value="cirugia">Cirugía</option>
                  <option value="emergencia">Emergencia</option>
                  <option value="revision">Revisión</option>
                  <option value="grooming">Peluquería</option>
                  <option value="dental">Limpieza Dental</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha preferida
                  </label>
                  <input
                    id="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Hora preferida
                  </label>
                  <input
                    id="preferredTime"
                    type="time"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notas adicionales */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales (opcional)
            </label>
            <textarea
              id="notes"
              placeholder="Describe el motivo de la consulta o cualquier información adicional que consideres importante..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            style={{ backgroundColor: themeColor }}
            disabled={isLoading}
          >
            {isLoading ? 'Enviando solicitud...' : 'Solicitar Cita'}
          </Button>
        </form>
      </div>
    </section>
  );
} 