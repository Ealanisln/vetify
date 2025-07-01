'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Clock, Star } from 'lucide-react';
import type { PublicTenant } from '@/lib/tenant';

interface ClinicHeroProps {
  tenant: PublicTenant;
}

export function ClinicHero({ tenant }: ClinicHeroProps) {
  const publicImages = tenant.publicImages;
  const publicHours = tenant.publicHours;
  const themeColor = tenant.publicThemeColor || '#75a99c';

  return (
    <section className="relative bg-gradient-to-r from-blue-50 to-green-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Información de la clínica */}
          <div>
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <span className="ml-2 text-gray-600 text-sm">
                Clínica de confianza
              </span>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              {tenant.name}
            </h1>
            
            {tenant.publicDescription && (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {tenant.publicDescription}
              </p>
            )}

            {/* Información de contacto destacada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {tenant.publicPhone && (
                <div className="flex items-center p-4 bg-white rounded-lg shadow-sm border">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${themeColor}20` }}
                  >
                    <Phone className="h-5 w-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-semibold text-gray-900">{tenant.publicPhone}</p>
                  </div>
                </div>
              )}
              
              {tenant.publicAddress && (
                <div className="flex items-center p-4 bg-white rounded-lg shadow-sm border">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${themeColor}20` }}
                  >
                    <MapPin className="h-5 w-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ubicación</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {tenant.publicAddress}
                    </p>
                  </div>
                </div>
              )}
              
              {publicHours && (
                <div className="flex items-center p-4 bg-white rounded-lg shadow-sm border sm:col-span-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${themeColor}20` }}
                  >
                    <Clock className="h-5 w-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Horarios</p>
                    <p className="font-semibold text-gray-900">
                      {publicHours.weekdays || 'Lun-Vie: 9:00 - 18:00'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={`/${tenant.slug}/agendar`}>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{ backgroundColor: themeColor }}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Agendar Cita
                </Button>
              </Link>
              
              {tenant.publicPhone && (
                <a href={`tel:${tenant.publicPhone}`}>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full sm:w-auto border-2 hover:bg-gray-50 transition-all duration-200"
                    style={{ 
                      borderColor: themeColor,
                      color: themeColor
                    }}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Llamar Ahora
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Imagen de la clínica */}
          <div className="relative">
            {publicImages?.hero ? (
              <div className="relative">
                <Image
                  src={publicImages.hero}
                  alt={`${tenant.name} - Clínica Veterinaria`}
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-2xl object-cover"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="rounded-2xl h-96 flex items-center justify-center shadow-2xl"
                  style={{ 
                    background: `linear-gradient(135deg, ${themeColor} 0%, #5b9788 100%)`
                  }}
                >
                  <div className="text-center text-white">
                    <div className="text-8xl mb-6 opacity-80">🐾</div>
                    <h3 className="text-3xl font-bold mb-2">Cuidamos a tu mascota</h3>
                    <p className="text-xl opacity-90">Con amor y profesionalismo</p>
                  </div>
                </div>
                
                {/* Elementos decorativos */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-30"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-30 delay-700"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-30 delay-500"></div>
      </div>
    </section>
  );
} 