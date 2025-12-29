'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Phone, MapPin, Clock, Star } from 'lucide-react';
import type { PublicTenant } from '../../lib/tenant';
import { getTheme, getThemeClasses } from '../../lib/themes';
import { useThemeAware } from '@/hooks/useThemeAware';
import { generateDarkColors } from '@/lib/color-utils';
import {
  fadeInUp,
  fadeInRight,
  staggerContainer,
  cardVariant,
  imageReveal,
  buttonHover,
  buttonTap,
  cardHover,
} from './animations';

interface ClinicHeroProps {
  tenant: PublicTenant;
}

export function ClinicHero({ tenant }: ClinicHeroProps) {
  const publicImages = tenant.publicImages;
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
    heroGradientFrom: darkColors.heroGradientFrom,
    heroGradientTo: darkColors.heroGradientTo,
  } : {
    text: theme.colors.text,
    textMuted: theme.colors.textMuted,
    cardBg: theme.colors.cardBg,
    border: theme.colors.border,
    primaryLight: theme.colors.primaryLight,
    heroGradientFrom: theme.colors.heroGradientFrom,
    heroGradientTo: theme.colors.heroGradientTo,
  };

  return (
    <section
      className="relative py-20 transition-colors duration-200"
      style={{
        background: `linear-gradient(135deg, ${colors.heroGradientFrom} 0%, ${colors.heroGradientTo} 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Información de la clínica */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <span className="ml-2 text-sm" style={{ color: colors.textMuted }}>
                Clínica de confianza
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl lg:text-6xl font-bold mb-6"
              style={{
                color: colors.text,
                fontFamily: theme.typography.fontFamily,
                fontWeight: theme.typography.headingWeight
              }}
            >
              {tenant.name}
            </motion.h1>

            {tenant.publicDescription && (
              <motion.p
                variants={fadeInUp}
                className="text-xl mb-8 leading-relaxed"
                style={{ color: colors.textMuted }}
              >
                {tenant.publicDescription}
              </motion.p>
            )}

            {/* Información de contacto destacada */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {tenant.publicPhone && (
                <motion.div
                  whileHover={cardHover}
                  className={`flex items-center p-4 ${themeClasses.card} transition-colors`}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderRadius: theme.layout.borderRadius,
                    borderColor: colors.border
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    <Phone className="h-5 w-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.textMuted }}>Teléfono</p>
                    <p className="font-semibold" style={{ color: colors.text }}>{tenant.publicPhone}</p>
                  </div>
                </motion.div>
              )}

              {tenant.publicAddress && (
                <motion.div
                  whileHover={cardHover}
                  className={`flex items-center p-4 ${themeClasses.card} transition-colors`}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderRadius: theme.layout.borderRadius,
                    borderColor: colors.border
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    <MapPin className="h-5 w-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.textMuted }}>Ubicación</p>
                    <p className="font-semibold text-sm" style={{ color: colors.text }}>
                      {tenant.publicAddress}
                    </p>
                  </div>
                </motion.div>
              )}

              {publicHours && (
                <motion.div
                  whileHover={cardHover}
                  className={`flex items-center p-4 sm:col-span-2 ${themeClasses.card} transition-colors`}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderRadius: theme.layout.borderRadius,
                    borderColor: colors.border
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: colors.primaryLight }}
                  >
                    <Clock className="h-5 w-5" style={{ color: themeColor }} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.textMuted }}>Horarios</p>
                    <p className="font-semibold" style={{ color: colors.text }}>
                      {publicHours.weekdays || 'Lun-Vie: 9:00 - 18:00'}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Botones de acción */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <Link href={`/${tenant.slug}/agendar`}>
                <motion.div whileHover={buttonHover} whileTap={buttonTap}>
                  <Button
                    size="lg"
                    className={`w-full sm:w-auto text-white shadow-lg hover:shadow-xl transition-all duration-200 ${themeClasses.button}`}
                    style={{
                      backgroundColor: themeColor,
                      borderRadius: theme.layout.borderRadius
                    }}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Agendar Cita
                  </Button>
                </motion.div>
              </Link>

              {tenant.publicPhone && (
                <a href={`tel:${tenant.publicPhone}`}>
                  <motion.div whileHover={buttonHover} whileTap={buttonTap}>
                    <Button
                      variant="outline"
                      size="lg"
                      className={`w-full sm:w-auto border-2 transition-all duration-200 ${themeClasses.button}`}
                      style={{
                        borderColor: themeColor,
                        color: themeColor,
                        borderRadius: theme.layout.borderRadius,
                        backgroundColor: 'transparent'
                      }}
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Llamar Ahora
                    </Button>
                  </motion.div>
                </a>
              )}
            </motion.div>
          </motion.div>

          {/* Imagen de la clínica */}
          <motion.div
            className="relative"
            initial="hidden"
            animate="visible"
            variants={fadeInRight}
          >
            {publicImages?.hero ? (
              <motion.div className="relative" variants={imageReveal}>
                <Image
                  src={publicImages.hero}
                  alt={`${tenant.name} - Clínica Veterinaria`}
                  width={600}
                  height={400}
                  className="shadow-2xl object-cover"
                  style={{ borderRadius: theme.layout.borderRadius }}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
                  style={{ borderRadius: theme.layout.borderRadius }}
                />
              </motion.div>
            ) : (
              <div className="relative">
                <div
                  className="h-96 flex items-center justify-center shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor} 0%, ${theme.colors.primaryHover} 100%)`,
                    borderRadius: theme.layout.borderRadius
                  }}
                >
                  <div className="text-center text-white">
                    <div className="text-8xl mb-6 opacity-80">🐾</div>
                    <h3 className="text-3xl font-bold mb-2">Cuidamos a tu mascota</h3>
                    <p className="text-xl opacity-90">Con amor y profesionalismo</p>
                  </div>
                </div>

                {/* Elementos decorativos */}
                <div
                  className="absolute -top-4 -left-4 w-24 h-24 rounded-full opacity-20 animate-pulse"
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <div
                  className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-20 animate-pulse delay-1000"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: theme.colors.accent }}
        />
        <div
          className="absolute top-3/4 right-1/4 w-3 h-3 rounded-full animate-ping opacity-30 delay-700"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-1 h-1 rounded-full animate-ping opacity-30 delay-500"
          style={{ backgroundColor: theme.colors.secondary }}
        />
      </div>
    </section>
  );
} 