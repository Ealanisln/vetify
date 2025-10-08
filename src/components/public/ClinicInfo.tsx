'use client';

import { Button } from '../ui/button';
import { Phone, MapPin, Clock, Mail, Navigation, Star } from 'lucide-react';
import Link from 'next/link';
import type { PublicTenant } from '../../lib/tenant';

interface ClinicInfoProps {
  tenant: PublicTenant;
}

export function ClinicInfo({ tenant }: ClinicInfoProps) {
  const publicHours = tenant.publicHours;
  const themeColor = tenant.publicThemeColor || '#75a99c';

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Información de Contacto
          </h2>
          <p className="text-lg text-gray-600">
            Estamos aquí para cuidar a tu mascota. Contáctanos cuando lo necesites.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Información de contacto */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Datos de Contacto
              </h3>
              <div className="space-y-4">
                {tenant.publicPhone && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                      style={{ backgroundColor: `${themeColor}15` }}
                    >
                      <Phone className="h-6 w-6" style={{ color: themeColor }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                      <a 
                        href={`tel:${tenant.publicPhone}`}
                        className="text-lg font-semibold text-gray-900 hover:text-gray-700"
                      >
                        {tenant.publicPhone}
                      </a>
                    </div>
                    <a href={`tel:${tenant.publicPhone}`}>
                      <Button 
                        size="sm" 
                        className="text-white"
                        style={{ backgroundColor: themeColor }}
                      >
                        Llamar
                      </Button>
                    </a>
                  </div>
                )}

                {tenant.publicEmail && (
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                      style={{ backgroundColor: `${themeColor}15` }}
                    >
                      <Mail className="h-6 w-6" style={{ color: themeColor }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <a 
                        href={`mailto:${tenant.publicEmail}`}
                        className="text-lg font-semibold text-gray-900 hover:text-gray-700"
                      >
                        {tenant.publicEmail}
                      </a>
                    </div>
                    <a href={`mailto:${tenant.publicEmail}`}>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-2"
                        style={{ 
                          borderColor: themeColor,
                          color: themeColor
                        }}
                      >
                        Escribir
                      </Button>
                    </a>
                  </div>
                )}

                {tenant.publicAddress && (
                  <div className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4 mt-1"
                      style={{ backgroundColor: `${themeColor}15` }}
                    >
                      <MapPin className="h-6 w-6" style={{ color: themeColor }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">Dirección</p>
                      <p className="text-lg font-semibold text-gray-900 leading-relaxed">
                        {tenant.publicAddress}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-2 mt-1"
                      style={{ 
                        borderColor: themeColor,
                        color: themeColor
                      }}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Navegar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Horarios */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="h-6 w-6 mr-2" style={{ color: themeColor }} />
                Horarios de Atención
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                {publicHours ? (
                  <div className="space-y-3">
                    {publicHours.weekdays && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Lunes - Viernes</span>
                        <span className="text-gray-600">{publicHours.weekdays}</span>
                      </div>
                    )}
                    {publicHours.saturday && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Sábado</span>
                        <span className="text-gray-600">{publicHours.saturday}</span>
                      </div>
                    )}
                    {publicHours.sunday && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Domingo</span>
                        <span className="text-gray-600">{publicHours.sunday}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Lunes - Viernes</span>
                      <span className="text-gray-600">9:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Sábado</span>
                      <span className="text-gray-600">9:00 - 14:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Domingo</span>
                      <span className="text-gray-600">Cerrado</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Call to action y testimonios */}
          <div className="space-y-8">
            {/* CTA principal */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-current" />
                  ))}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¿Listo para agendar tu cita?
              </h3>
              <p className="text-gray-600 mb-6">
                Nuestro equipo profesional está esperando para brindar el mejor cuidado a tu mascota.
              </p>
              <Link href={`/${tenant.slug}/agendar`}>
                <Button 
                  size="lg"
                  className="text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{ backgroundColor: themeColor }}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Agendar Ahora
                </Button>
              </Link>
            </div>

            {/* Emergencias */}
            <div className="border-2 border-red-200 bg-red-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-red-900 mb-2 flex items-center">
                🚨 Emergencias
              </h4>
              <p className="text-red-700 text-sm mb-4">
                Si tu mascota está en peligro inmediato, no dudes en contactarnos inmediatamente.
              </p>
              {tenant.publicPhone && (
                <a href={`tel:${tenant.publicPhone}`}>
                  <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar Emergencia
                  </Button>
                </a>
              )}
            </div>

            {/* Testimonios simples */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Lo que dicen nuestros clientes
              </h4>
              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    &ldquo;Excelente atención y profesionalismo. Mi mascota siempre recibe el mejor cuidado.&rdquo;
                  </p>
                  <p className="text-xs text-gray-500">- Cliente satisfecho</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    &ldquo;Personal muy amable y instalaciones modernas. Totalmente recomendado.&rdquo;
                  </p>
                  <p className="text-xs text-gray-500">- Cliente satisfecho</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 