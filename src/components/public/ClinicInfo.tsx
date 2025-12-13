'use client';

import { Button } from '../ui/button';
import { Phone, MapPin, Clock, Mail, Navigation, Star } from 'lucide-react';
import Link from 'next/link';
import type { PublicTenant } from '../../lib/tenant';
import { getTheme, getThemeClasses } from '../../lib/themes';
import { useThemeAware } from '@/hooks/useThemeAware';
import { generateDarkColors } from '@/lib/color-utils';

interface ClinicInfoProps {
  tenant: PublicTenant;
}

export function ClinicInfo({ tenant }: ClinicInfoProps) {
  const publicHours = tenant.publicHours;
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
    border: darkColors.border,
    primaryLight: darkColors.primaryLight,
    background: darkColors.background,
    backgroundAlt: darkColors.backgroundAlt,
    heroGradientFrom: darkColors.heroGradientFrom,
    heroGradientTo: darkColors.heroGradientTo,
  } : {
    text: theme.colors.text,
    textMuted: theme.colors.textMuted,
    cardBg: theme.colors.cardBg,
    border: theme.colors.border,
    primaryLight: theme.colors.primaryLight,
    background: theme.colors.background,
    backgroundAlt: theme.colors.backgroundAlt,
    heroGradientFrom: theme.colors.heroGradientFrom,
    heroGradientTo: theme.colors.heroGradientTo,
  };

  return (
    <section
      className="py-16 transition-colors duration-200"
      style={{ backgroundColor: colors.background }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-bold mb-4"
            style={{
              color: colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.headingWeight
            }}
          >
            Información de Contacto
          </h2>
          <p className="text-lg" style={{ color: colors.textMuted }}>
            Estamos aquí para cuidar a tu mascota. Contáctanos cuando lo necesites.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Información de contacto */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-6" style={{ color: colors.text }}>
                Datos de Contacto
              </h3>
              <div className="space-y-4">
                {tenant.publicPhone && (
                  <div
                    className="flex items-center p-4 transition-colors"
                    style={{
                      backgroundColor: colors.backgroundAlt,
                      borderRadius: theme.layout.borderRadius
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                      style={{ backgroundColor: colors.primaryLight }}
                    >
                      <Phone className="h-6 w-6" style={{ color: themeColor }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm mb-1" style={{ color: colors.textMuted }}>Teléfono</p>
                      <a
                        href={`tel:${tenant.publicPhone}`}
                        className="text-lg font-semibold hover:opacity-80"
                        style={{ color: colors.text }}
                      >
                        {tenant.publicPhone}
                      </a>
                    </div>
                    <a href={`tel:${tenant.publicPhone}`}>
                      <Button
                        size="sm"
                        className={`text-white ${themeClasses.button}`}
                        style={{ backgroundColor: themeColor }}
                      >
                        Llamar
                      </Button>
                    </a>
                  </div>
                )}

                {tenant.publicEmail && (
                  <div
                    className="flex items-center p-4 transition-colors"
                    style={{
                      backgroundColor: colors.backgroundAlt,
                      borderRadius: theme.layout.borderRadius
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                      style={{ backgroundColor: colors.primaryLight }}
                    >
                      <Mail className="h-6 w-6" style={{ color: themeColor }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm mb-1" style={{ color: colors.textMuted }}>Email</p>
                      <a
                        href={`mailto:${tenant.publicEmail}`}
                        className="text-lg font-semibold hover:opacity-80"
                        style={{ color: colors.text }}
                      >
                        {tenant.publicEmail}
                      </a>
                    </div>
                    <a href={`mailto:${tenant.publicEmail}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`border-2 ${themeClasses.button}`}
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
                  <div
                    className="flex items-start p-4 transition-colors"
                    style={{
                      backgroundColor: colors.backgroundAlt,
                      borderRadius: theme.layout.borderRadius
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4 mt-1"
                      style={{ backgroundColor: colors.primaryLight }}
                    >
                      <MapPin className="h-6 w-6" style={{ color: themeColor }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm mb-1" style={{ color: colors.textMuted }}>Dirección</p>
                      <p
                        className="text-lg font-semibold leading-relaxed"
                        style={{ color: colors.text }}
                      >
                        {tenant.publicAddress}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`border-2 mt-1 ${themeClasses.button}`}
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
              <h3 className="text-xl font-semibold mb-6 flex items-center" style={{ color: colors.text }}>
                <Clock className="h-6 w-6 mr-2" style={{ color: themeColor }} />
                Horarios de Atención
              </h3>
              <div
                className="p-6"
                style={{
                  backgroundColor: colors.backgroundAlt,
                  borderRadius: theme.layout.borderRadius
                }}
              >
                {publicHours ? (
                  <div className="space-y-3">
                    {publicHours.weekdays && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium" style={{ color: colors.text }}>Lunes - Viernes</span>
                        <span style={{ color: colors.textMuted }}>{publicHours.weekdays}</span>
                      </div>
                    )}
                    {publicHours.saturday && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium" style={{ color: colors.text }}>Sábado</span>
                        <span style={{ color: colors.textMuted }}>{publicHours.saturday}</span>
                      </div>
                    )}
                    {publicHours.sunday && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium" style={{ color: colors.text }}>Domingo</span>
                        <span style={{ color: colors.textMuted }}>{publicHours.sunday}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium" style={{ color: colors.text }}>Lunes - Viernes</span>
                      <span style={{ color: colors.textMuted }}>9:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium" style={{ color: colors.text }}>Sábado</span>
                      <span style={{ color: colors.textMuted }}>9:00 - 14:00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium" style={{ color: colors.text }}>Domingo</span>
                      <span style={{ color: colors.textMuted }}>Cerrado</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Call to action y testimonios */}
          <div className="space-y-8">
            {/* CTA principal */}
            <div
              className="p-8 text-center transition-colors"
              style={{
                background: `linear-gradient(135deg, ${colors.heroGradientFrom} 0%, ${colors.heroGradientTo} 100%)`,
                borderRadius: theme.layout.borderRadius
              }}
            >
              <div className="flex justify-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-current" />
                  ))}
                </div>
              </div>
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: colors.text }}
              >
                ¿Listo para agendar tu cita?
              </h3>
              <p className="mb-6" style={{ color: colors.textMuted }}>
                Nuestro equipo profesional está esperando para brindar el mejor cuidado a tu mascota.
              </p>
              <Link href={`/${tenant.slug}/agendar`}>
                <Button
                  size="lg"
                  className={`text-white shadow-lg hover:shadow-xl transition-all duration-200 ${themeClasses.button}`}
                  style={{ backgroundColor: themeColor }}
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Agendar Ahora
                </Button>
              </Link>
            </div>

            {/* Emergencias */}
            <div
              className="border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-6 transition-colors"
              style={{ borderRadius: theme.layout.borderRadius }}
            >
              <h4 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center">
                🚨 Emergencias
              </h4>
              <p className="text-red-700 dark:text-red-400 text-sm mb-4">
                Si tu mascota está en peligro inmediato, no dudes en contactarnos inmediatamente.
              </p>
              {tenant.publicPhone && (
                <a href={`tel:${tenant.publicPhone}`}>
                  <Button
                    size="sm"
                    className={`bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white ${themeClasses.button}`}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar Emergencia
                  </Button>
                </a>
              )}
            </div>

            {/* Testimonios simples */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold" style={{ color: colors.text }}>
                Lo que dicen nuestros clientes
              </h4>
              <div className="space-y-3">
                <div
                  className={`p-4 ${themeClasses.card} transition-colors`}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderRadius: theme.layout.borderRadius,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                    &ldquo;Excelente atención y profesionalismo. Mi mascota siempre recibe el mejor cuidado.&rdquo;
                  </p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>- Cliente satisfecho</p>
                </div>
                <div
                  className={`p-4 ${themeClasses.card} transition-colors`}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderRadius: theme.layout.borderRadius,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                    &ldquo;Personal muy amable y instalaciones modernas. Totalmente recomendado.&rdquo;
                  </p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>- Cliente satisfecho</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 