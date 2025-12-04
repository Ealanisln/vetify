'use client';

import { Button } from '../ui/button';
import Link from 'next/link';
import {
  Stethoscope,
  Syringe,
  Scissors,
  Heart,
  Shield,
  Microscope,
  ArrowRight
} from 'lucide-react';
import type { PublicTenant, PublicService } from '../../lib/tenant';
import { getTheme, getThemeClasses } from '../../lib/themes';

interface ClinicServicesProps {
  tenant: PublicTenant;
}

export function ClinicServices({ tenant }: ClinicServicesProps) {
  const publicServices = tenant.publicServices;
  const theme = getTheme(tenant.publicTheme);
  const themeColor = tenant.publicThemeColor || theme.colors.primary;
  const themeClasses = getThemeClasses(theme);

  // Servicios por defecto si no hay configurados
  const defaultServices = [
    {
      icon: Stethoscope,
      title: 'Consulta General',
      description: 'Exámenes médicos completos y diagnósticos precisos para tu mascota.',
      price: 'Desde $50'
    },
    {
      icon: Syringe,
      title: 'Vacunación',
      description: 'Programas de vacunación completos para proteger la salud de tu mascota.',
      price: 'Desde $30'
    },
    {
      icon: Scissors,
      title: 'Peluquería',
      description: 'Servicios de grooming profesional para mantener a tu mascota hermosa.',
      price: 'Desde $25'
    },
    {
      icon: Shield,
      title: 'Cirugía',
      description: 'Procedimientos quirúrgicos con equipos modernos y personal especializado.',
      price: 'Consultar'
    },
    {
      icon: Microscope,
      title: 'Laboratorio',
      description: 'Análisis clínicos y estudios diagnósticos con resultados rápidos.',
      price: 'Desde $40'
    },
    {
      icon: Heart,
      title: 'Emergencias',
      description: 'Atención de urgencias 24/7 para cuando tu mascota más lo necesita.',
      price: 'Consultar'
    }
  ];

  const services = publicServices && publicServices.length > 0 ? publicServices : defaultServices;

  return (
    <section
      className="py-16"
      style={{ backgroundColor: theme.colors.backgroundAlt }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-bold mb-4"
            style={{
              color: theme.colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.headingWeight
            }}
          >
            Nuestros Servicios
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: theme.colors.textMuted }}
          >
            Ofrecemos una amplia gama de servicios veterinarios profesionales
            para cuidar la salud y bienestar de tu mascota.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.slice(0, 6).map((service: PublicService, index: number) => {
            const IconComponent = service.icon || Stethoscope;

            return (
              <div
                key={index}
                className={`p-6 transition-shadow duration-200 ${themeClasses.card}`}
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderRadius: theme.layout.borderRadius,
                  borderColor: theme.colors.border
                }}
              >
                <div className="flex items-center mb-4">
                  <div
                    className="w-12 h-12 flex items-center justify-center mr-4"
                    style={{
                      backgroundColor: theme.colors.primaryLight,
                      borderRadius: theme.layout.borderRadius
                    }}
                  >
                    <IconComponent
                      className="h-6 w-6"
                      style={{ color: themeColor }}
                    />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: theme.colors.text }}
                    >
                      {service.title}
                    </h3>
                    {service.price && (
                      <p className="text-sm font-medium" style={{ color: themeColor }}>
                        {service.price}
                      </p>
                    )}
                  </div>
                </div>

                <p
                  className="text-sm leading-relaxed"
                  style={{ color: theme.colors.textMuted }}
                >
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Call to action */}
        <div className="text-center">
          <div
            className={`p-8 ${themeClasses.card}`}
            style={{
              backgroundColor: theme.colors.cardBg,
              borderRadius: theme.layout.borderRadius,
              borderColor: theme.colors.border
            }}
          >
            <h3
              className="text-2xl font-bold mb-4"
              style={{
                color: theme.colors.text,
                fontFamily: theme.typography.fontFamily
              }}
            >
              ¿Necesitas más información sobre nuestros servicios?
            </h3>
            <p className="mb-6" style={{ color: theme.colors.textMuted }}>
              Nuestro equipo estará encantado de ayudarte y resolver todas tus dudas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${tenant.slug}/agendar`}>
                <Button
                  size="lg"
                  className={`text-white shadow-lg hover:shadow-xl transition-all duration-200 ${themeClasses.button}`}
                  style={{
                    backgroundColor: themeColor,
                    borderRadius: theme.layout.borderRadius
                  }}
                >
                  Agendar Consulta
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href={`/${tenant.slug}/servicios`}>
                <Button
                  variant="outline"
                  size="lg"
                  className={`border-2 transition-all duration-200 ${themeClasses.button}`}
                  style={{
                    borderColor: themeColor,
                    color: themeColor,
                    borderRadius: theme.layout.borderRadius
                  }}
                >
                  Ver Todos los Servicios
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 