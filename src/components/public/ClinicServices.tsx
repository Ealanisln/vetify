'use client';

import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import Link from 'next/link';
import {
  Stethoscope,
  Syringe,
  Scissors,
  Heart,
  Shield,
  Microscope,
  ArrowRight,
  Bone,
  PawPrint,
  Pill,
  Clock,
  LucideIcon
} from 'lucide-react';
import type { PublicTenant, FeaturedService } from '../../lib/tenant';
import { getTheme, getThemeClasses } from '../../lib/themes';
import { useThemeAware } from '@/hooks/useThemeAware';
import { generateDarkColors } from '@/lib/color-utils';
import {
  fadeInUp,
  staggerContainerFast,
  cardVariant,
  cardHover,
  buttonHover,
  buttonTap,
  sectionVariant,
  viewportSettings,
} from './animations';

interface ClinicServicesProps {
  tenant: PublicTenant;
  featuredServices?: FeaturedService[];
}

// Mapeo de iconos string a componentes Lucide
const iconMap: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  syringe: Syringe,
  scissors: Scissors,
  heart: Heart,
  bone: Bone,
  paw: PawPrint,
  pill: Pill,
  microscope: Microscope,
  shield: Shield,
};

function getIconComponent(iconName: string | null): LucideIcon {
  if (!iconName) return Stethoscope;
  return iconMap[iconName.toLowerCase()] || Stethoscope;
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function ClinicServices({ tenant, featuredServices }: ClinicServicesProps) {
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
    backgroundAlt: darkColors.backgroundAlt,
  } : {
    text: theme.colors.text,
    textMuted: theme.colors.textMuted,
    cardBg: theme.colors.cardBg,
    border: theme.colors.border,
    primaryLight: theme.colors.primaryLight,
    backgroundAlt: theme.colors.backgroundAlt,
  };

  // Transformar servicios destacados de la BD al formato de display
  const services = featuredServices?.map(service => ({
    icon: getIconComponent(service.publicIcon),
    title: service.name,
    description: service.description || '',
    price: service.publicPriceLabel || formatPrice(service.price)
  })) || [];

  // Si no hay servicios destacados, mostrar mensaje de "Próximamente"
  const hasServices = services.length > 0;

  return (
    <motion.section
      className="py-16 transition-colors duration-200"
      style={{ backgroundColor: colors.backgroundAlt }}
      initial="hidden"
      whileInView="visible"
      viewport={viewportSettings}
      variants={sectionVariant}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-12" variants={fadeInUp}>
          <h2
            className="text-3xl font-bold mb-4"
            style={{
              color: colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.headingWeight
            }}
          >
            Nuestros Servicios
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: colors.textMuted }}
          >
            Ofrecemos una amplia gama de servicios veterinarios profesionales
            para cuidar la salud y bienestar de tu mascota.
          </p>
        </motion.div>

        {hasServices ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
          >
            {services.slice(0, 6).map((service, index: number) => {
              const IconComponent = service.icon || Stethoscope;

              return (
                <motion.div
                  key={index}
                  variants={cardVariant}
                  whileHover={cardHover}
                  className={`p-6 transition-all duration-200 ${themeClasses.card}`}
                  style={{
                    backgroundColor: colors.cardBg,
                    borderRadius: theme.layout.borderRadius,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex items-center mb-4">
                    <div
                      className="w-12 h-12 flex items-center justify-center mr-4"
                      style={{
                        backgroundColor: colors.primaryLight,
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
                        style={{ color: colors.text }}
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
                    style={{ color: colors.textMuted }}
                  >
                    {service.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            className={`p-12 text-center mb-12 transition-colors ${themeClasses.card}`}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: theme.layout.borderRadius,
              borderColor: colors.border
            }}
          >
            <div
              className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: colors.primaryLight,
                borderRadius: '50%'
              }}
            >
              <Clock
                className="h-8 w-8"
                style={{ color: themeColor }}
              />
            </div>
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: colors.text }}
            >
              Próximamente
            </h3>
            <p
              className="text-sm max-w-md mx-auto"
              style={{ color: colors.textMuted }}
            >
              Estamos preparando la información de nuestros servicios.
              Contáctanos para conocer más sobre lo que ofrecemos.
            </p>
          </motion.div>
        )}

        {/* Call to action */}
        <motion.div
          className="text-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
        >
          <div
            className={`p-8 ${themeClasses.card} transition-colors`}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: theme.layout.borderRadius,
              borderColor: colors.border
            }}
          >
            <h3
              className="text-2xl font-bold mb-4"
              style={{
                color: colors.text,
                fontFamily: theme.typography.fontFamily
              }}
            >
              ¿Necesitas más información sobre nuestros servicios?
            </h3>
            <p className="mb-6" style={{ color: colors.textMuted }}>
              Nuestro equipo estará encantado de ayudarte y resolver todas tus dudas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${tenant.slug}/agendar`}>
                <motion.div whileHover={buttonHover} whileTap={buttonTap}>
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
                </motion.div>
              </Link>
              <Link href={`/${tenant.slug}/servicios`}>
                <motion.div whileHover={buttonHover} whileTap={buttonTap}>
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
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
} 