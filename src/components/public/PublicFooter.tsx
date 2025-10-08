'use client';

import Link from 'next/link';
import { Phone, MapPin, Mail, Clock, Heart } from 'lucide-react';
import type { PublicTenant } from '../../lib/tenant';

interface PublicFooterProps {
  tenant: PublicTenant;
}

export function PublicFooter({ tenant }: PublicFooterProps) {
  const themeColor = tenant.publicThemeColor || '#75a99c';
  const publicHours = tenant.publicHours;
  const socialMedia = tenant.publicSocialMedia;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Información de la clínica */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <div 
                className="w-6 h-6 rounded mr-2 flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: themeColor }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </div>
              {tenant.name}
            </h3>
            <p className="text-gray-300 mb-4">
              Cuidamos de tu mascota con amor y profesionalismo. 
              Agenda tu cita y brinda a tu compañero el mejor cuidado veterinario.
            </p>
            
            {/* Información de contacto */}
            <div className="space-y-2">
              {tenant.publicPhone && (
                <div className="flex items-center text-gray-300">
                  <Phone className="h-4 w-4 mr-2" style={{ color: themeColor }} />
                  <a 
                    href={`tel:${tenant.publicPhone}`}
                    className="hover:text-white transition-colors"
                  >
                    {tenant.publicPhone}
                  </a>
                </div>
              )}
              
              {tenant.publicEmail && (
                <div className="flex items-center text-gray-300">
                  <Mail className="h-4 w-4 mr-2" style={{ color: themeColor }} />
                  <a 
                    href={`mailto:${tenant.publicEmail}`}
                    className="hover:text-white transition-colors"
                  >
                    {tenant.publicEmail}
                  </a>
                </div>
              )}
              
              {tenant.publicAddress && (
                <div className="flex items-start text-gray-300">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
                  <span>{tenant.publicAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Horarios */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" style={{ color: themeColor }} />
              Horarios
            </h3>
            <div className="space-y-2 text-gray-300">
              {publicHours ? (
                <>
                  {publicHours.weekdays && (
                    <div>
                      <span className="font-medium">Lun - Vie:</span>
                      <span className="ml-2">{publicHours.weekdays}</span>
                    </div>
                  )}
                  {publicHours.saturday && (
                    <div>
                      <span className="font-medium">Sábado:</span>
                      <span className="ml-2">{publicHours.saturday}</span>
                    </div>
                  )}
                  {publicHours.sunday && (
                    <div>
                      <span className="font-medium">Domingo:</span>
                      <span className="ml-2">{publicHours.sunday}</span>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <div>
                    <span className="font-medium">Lun - Vie:</span>
                    <span className="ml-2">9:00 - 18:00</span>
                  </div>
                  <div>
                    <span className="font-medium">Sáb:</span>
                    <span className="ml-2">9:00 - 14:00</span>
                  </div>
                  <div>
                    <span className="font-medium">Dom:</span>
                    <span className="ml-2">Cerrado</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enlaces</h3>
            <div className="space-y-2">
              <Link 
                href={`/${tenant.slug}`}
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Inicio
              </Link>
              <Link 
                href={`/${tenant.slug}/servicios`}
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Servicios
              </Link>
              <Link 
                href={`/${tenant.slug}/agendar`}
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Agendar Cita
              </Link>
              {tenant.publicPhone && (
                <a 
                  href={`tel:${tenant.publicPhone}`}
                  className="block text-gray-300 hover:text-white transition-colors"
                >
                  Contacto
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center text-gray-400 text-sm">
              <span>© {new Date().getFullYear()} {tenant.name}. </span>
              <span className="ml-1">Hecho con</span>
              <Heart className="h-4 w-4 mx-1" fill="currentColor" style={{ color: themeColor }} />
              <span>por</span>
              <Link 
                href="https://vetify.app" 
                className="ml-1 hover:text-white transition-colors"
                style={{ color: themeColor }}
              >
                Vetify
              </Link>
            </div>
            
            {/* Redes sociales */}
            {socialMedia && (
              <div className="flex space-x-4 mt-4 md:mt-0">
                {socialMedia.facebook && (
                  <a 
                    href={socialMedia.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Facebook
                  </a>
                )}
                {socialMedia.instagram && (
                  <a 
                    href={socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Instagram
                  </a>
                )}
                {socialMedia.whatsapp && (
                  <a 
                    href={`https://wa.me/${socialMedia.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
} 