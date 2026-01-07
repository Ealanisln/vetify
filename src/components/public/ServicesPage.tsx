'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  Stethoscope,
  Scissors,
  Syringe,
  Sparkles,
  Home,
  Smile,
  Microscope,
  AlertCircle,
  Heart,
  Clock,
  ArrowLeft,
  Briefcase,
  Pill,
  Activity,
  Thermometer,
  Shield,
  Bone,
  LucideIcon,
} from 'lucide-react';
import type { PublicTenant, PublicService } from '../../lib/tenant';
import { getTheme, getThemeClasses } from '../../lib/themes';
import { useThemeAware } from '@/hooks/useThemeAware';
import { generateDarkColors } from '@/lib/color-utils';
import {
  fadeInUp,
  staggerContainerFast,
  cardVariant,
  cardHover,
  sectionVariant,
  viewportSettings,
} from './animations';

interface ServicesPageProps {
  tenant: PublicTenant;
  services: PublicService[];
}

// Category metadata with Spanish names and icons
const categoryConfig: Record<string, { name: string; icon: LucideIcon; color: string }> = {
  CONSULTATION: { name: 'Consultas', icon: Stethoscope, color: '#3b82f6' },
  SURGERY: { name: 'Cirugía', icon: Scissors, color: '#ef4444' },
  VACCINATION: { name: 'Vacunación', icon: Syringe, color: '#22c55e' },
  DEWORMING: { name: 'Desparasitación', icon: Pill, color: '#f59e0b' },
  PREVENTATIVE_CARE: { name: 'Medicina Preventiva', icon: Shield, color: '#8b5cf6' },
  GROOMING: { name: 'Estética', icon: Sparkles, color: '#ec4899' },
  BOARDING: { name: 'Hospedaje', icon: Home, color: '#14b8a6' },
  DENTAL_CARE: { name: 'Odontología', icon: Smile, color: '#06b6d4' },
  LABORATORY_TEST: { name: 'Laboratorio', icon: Microscope, color: '#6366f1' },
  IMAGING_RADIOLOGY: { name: 'Radiología', icon: Activity, color: '#84cc16' },
  HOSPITALIZATION: { name: 'Hospitalización', icon: Thermometer, color: '#f97316' },
  EMERGENCY_CARE: { name: 'Urgencias', icon: AlertCircle, color: '#dc2626' },
  EUTHANASIA: { name: 'Eutanasia', icon: Heart, color: '#71717a' },
  OTHER: { name: 'Otros Servicios', icon: Bone, color: '#a855f7' },
};

// Icon mapping for custom icons from database
const iconMap: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  syringe: Syringe,
  scissors: Scissors,
  heart: Heart,
  bone: Bone,
  sparkles: Sparkles,
  pill: Pill,
  microscope: Microscope,
  shield: Shield,
  home: Home,
  smile: Smile,
  thermometer: Thermometer,
  activity: Activity,
  alertcircle: AlertCircle,
};

function getIconComponent(iconName: string | null, category: string): LucideIcon {
  if (iconName && iconMap[iconName.toLowerCase()]) {
    return iconMap[iconName.toLowerCase()];
  }
  return categoryConfig[category]?.icon || Heart;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}min`;
}

export function ServicesPage({ tenant, services }: ServicesPageProps) {
  const theme = getTheme(tenant.publicTheme);
  const themeColor = tenant.publicThemeColor || theme.colors.primary;
  const themeClasses = getThemeClasses(theme);
  const { isDark } = useThemeAware();

  // Generate dark mode colors from theme primary
  const darkColors = generateDarkColors(themeColor);

  // Select colors based on current theme
  const colors = isDark
    ? {
        text: darkColors.text,
        textMuted: darkColors.textMuted,
        cardBg: darkColors.cardBg,
        border: darkColors.border,
        primaryLight: darkColors.primaryLight,
        background: darkColors.background,
        backgroundAlt: darkColors.backgroundAlt,
      }
    : {
        text: theme.colors.text,
        textMuted: theme.colors.textMuted,
        cardBg: theme.colors.cardBg,
        border: theme.colors.border,
        primaryLight: theme.colors.primaryLight,
        background: theme.colors.background,
        backgroundAlt: theme.colors.backgroundAlt,
      };

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, PublicService[]> = {};
    services.forEach((service) => {
      const category = service.category || 'OTHER';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(service);
    });
    return grouped;
  }, [services]);

  // Get ordered categories (only those with services)
  const orderedCategories = useMemo(() => {
    const order = Object.keys(categoryConfig);
    return order.filter((cat) => servicesByCategory[cat] && servicesByCategory[cat].length > 0);
  }, [servicesByCategory]);

  const totalServices = services.length;

  return (
    <div
      className="min-h-screen transition-colors"
      style={{ backgroundColor: colors.background }}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02] dark:opacity-[0.03]">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="paw-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path
                d="M30 15c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4zm-8 8c1.5 0 3 1.5 3 3s-1.5 3-3 3-3-1.5-3-3 1.5-3 3-3zm16 0c1.5 0 3 1.5 3 3s-1.5 3-3 3-3-1.5-3-3 1.5-3 3-3zm-12 8c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4zm8 0c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4z"
                fill={themeColor}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#paw-pattern)" />
        </svg>
      </div>

      {/* Header */}
      <motion.header
        className="relative bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
        initial="hidden"
        animate="visible"
        variants={sectionVariant}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Back link */}
            <Link
              href={`/${tenant.slug}`}
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
            >
              <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
              Volver a {tenant.name}
            </Link>

            {/* Title section */}
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
                style={{
                  backgroundColor: `${themeColor}15`,
                  border: `2px solid ${themeColor}30`,
                }}
              >
                <Briefcase className="h-7 w-7" style={{ color: themeColor }} />
              </div>
              <div className="text-right sm:text-left">
                <h1
                  className="text-2xl sm:text-3xl font-bold"
                  style={{
                    color: colors.text,
                    fontFamily: theme.typography.fontFamily,
                  }}
                >
                  Nuestros Servicios
                </h1>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  {totalServices} {totalServices === 1 ? 'servicio disponible' : 'servicios disponibles'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {totalServices > 0 ? (
          <div className="space-y-16">
            {orderedCategories.map((category) => {
              const categoryInfo = categoryConfig[category];
              const categoryServices = servicesByCategory[category];
              const CategoryIcon = categoryInfo.icon;

              return (
                <motion.section
                  key={category}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportSettings}
                  variants={sectionVariant}
                  className="relative"
                >
                  {/* Category header */}
                  <motion.div
                    className="flex items-center gap-4 mb-8"
                    variants={fadeInUp}
                  >
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-xl shadow-md"
                      style={{
                        backgroundColor: `${categoryInfo.color}15`,
                        border: `1px solid ${categoryInfo.color}30`,
                      }}
                    >
                      <CategoryIcon
                        className="h-6 w-6"
                        style={{ color: categoryInfo.color }}
                      />
                    </div>
                    <div>
                      <h2
                        className="text-xl sm:text-2xl font-semibold"
                        style={{
                          color: colors.text,
                          fontFamily: theme.typography.fontFamily,
                        }}
                      >
                        {categoryInfo.name}
                      </h2>
                      <p className="text-sm" style={{ color: colors.textMuted }}>
                        {categoryServices.length}{' '}
                        {categoryServices.length === 1 ? 'servicio' : 'servicios'}
                      </p>
                    </div>
                    {/* Decorative line */}
                    <div
                      className="flex-1 h-px ml-4 hidden sm:block"
                      style={{
                        background: `linear-gradient(90deg, ${categoryInfo.color}30 0%, transparent 100%)`,
                      }}
                    />
                  </motion.div>

                  {/* Services grid */}
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={staggerContainerFast}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportSettings}
                  >
                    {categoryServices.map((service) => {
                      const ServiceIcon = getIconComponent(service.publicIcon, category);

                      return (
                        <motion.div
                          key={service.id}
                          variants={cardVariant}
                          whileHover={cardHover}
                          className={`relative overflow-hidden p-6 transition-all duration-300 ${themeClasses.card} border border-gray-200 dark:border-gray-700`}
                          style={{
                            backgroundColor: colors.cardBg,
                            borderRadius: theme.layout.borderRadius,
                          }}
                        >
                          {/* Subtle gradient accent */}
                          <div
                            className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-bl-full"
                            style={{
                              background: `linear-gradient(135deg, ${categoryInfo.color} 0%, transparent 100%)`,
                            }}
                          />

                          {/* Service content */}
                          <div className="relative">
                            {/* Icon and title row */}
                            <div className="flex items-start gap-4 mb-4">
                              <div
                                className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl"
                                style={{
                                  backgroundColor: `${categoryInfo.color}12`,
                                }}
                              >
                                <ServiceIcon
                                  className="h-5 w-5"
                                  style={{ color: categoryInfo.color }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3
                                  className="text-lg font-semibold leading-tight mb-1"
                                  style={{ color: colors.text }}
                                >
                                  {service.name}
                                </h3>
                                {/* Price */}
                                <p
                                  className="text-base font-medium"
                                  style={{ color: themeColor }}
                                >
                                  {service.publicPriceLabel || formatPrice(service.price)}
                                </p>
                              </div>
                            </div>

                            {/* Description */}
                            {service.description && (
                              <p
                                className="text-sm leading-relaxed mb-4 line-clamp-2"
                                style={{ color: colors.textMuted }}
                              >
                                {service.description}
                              </p>
                            )}

                            {/* Duration badge */}
                            {service.duration && (
                              <div className="flex items-center gap-1.5">
                                <Clock
                                  className="h-4 w-4"
                                  style={{ color: colors.textMuted }}
                                />
                                <span
                                  className="text-xs font-medium px-2 py-1 rounded-full"
                                  style={{
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                    color: colors.textMuted,
                                  }}
                                >
                                  {formatDuration(service.duration)}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.section>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <motion.div
            className={`text-center py-20 px-8 ${themeClasses.card} border border-gray-200 dark:border-gray-700`}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: theme.layout.borderRadius,
            }}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{
                backgroundColor: `${themeColor}15`,
              }}
            >
              <Clock className="h-10 w-10" style={{ color: themeColor }} />
            </div>
            <h2
              className="text-2xl font-semibold mb-3"
              style={{ color: colors.text }}
            >
              Próximamente
            </h2>
            <p
              className="text-base max-w-md mx-auto mb-8"
              style={{ color: colors.textMuted }}
            >
              Próximamente tendremos más servicios disponibles. Contáctanos para
              conocer más sobre lo que ofrecemos.
            </p>
            <Link
              href={`/${tenant.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all hover:shadow-lg"
              style={{
                backgroundColor: themeColor,
                borderRadius: theme.layout.borderRadius,
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </motion.div>
        )}

        {/* Call to action */}
        {totalServices > 0 && (
          <motion.div
            className={`mt-16 text-center p-10 ${themeClasses.card} border border-gray-200 dark:border-gray-700`}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: theme.layout.borderRadius,
            }}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
            variants={fadeInUp}
          >
            <h3
              className="text-2xl font-bold mb-4"
              style={{
                color: colors.text,
                fontFamily: theme.typography.fontFamily,
              }}
            >
              ¿Listo para agendar tu cita?
            </h3>
            <p className="mb-8 max-w-xl mx-auto" style={{ color: colors.textMuted }}>
              Nuestro equipo está preparado para brindarle a tu mascota la mejor
              atención. Agenda tu cita ahora y asegura el bienestar de tu compañero.
            </p>
            <Link
              href={`/${tenant.slug}/agendar`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white transition-all hover:shadow-xl hover:scale-[1.02]"
              style={{
                backgroundColor: themeColor,
                borderRadius: theme.layout.borderRadius,
              }}
            >
              Agendar Cita
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
