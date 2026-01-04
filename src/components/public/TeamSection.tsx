'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { User, Stethoscope } from 'lucide-react';
import type { PublicTenant, PublicStaffMember } from '../../lib/tenant';
import { getTheme } from '../../lib/themes';
import { useThemeAware } from '@/hooks/useThemeAware';
import { generateDarkColors } from '@/lib/color-utils';
import {
  fadeInUp,
  staggerContainerFast,
  cardVariant,
  sectionVariant,
  viewportSettings,
} from './animations';

interface TeamSectionProps {
  tenant: PublicTenant;
  team: PublicStaffMember[];
}

export function TeamSection({ tenant, team }: TeamSectionProps) {
  const theme = getTheme(tenant.publicTheme);
  const themeColor = tenant.publicThemeColor || theme.colors.primary;
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
    primary: themeColor,
  } : {
    text: theme.colors.text,
    textMuted: theme.colors.textMuted,
    cardBg: theme.colors.cardBg,
    background: theme.colors.background,
    backgroundAlt: theme.colors.backgroundAlt,
    primary: themeColor,
  };

  if (team.length === 0) {
    return null;
  }

  return (
    <motion.section
      className="py-16 transition-colors"
      style={{ backgroundColor: colors.backgroundAlt }}
      initial="hidden"
      whileInView="visible"
      viewport={viewportSettings}
      variants={sectionVariant}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div className="text-center mb-12" variants={fadeInUp}>
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ backgroundColor: `${themeColor}20` }}
          >
            <Stethoscope className="w-8 h-8" style={{ color: themeColor }} />
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: colors.text, fontFamily: theme.typography.headingFont }}
          >
            Nuestro Equipo
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: colors.textMuted }}
          >
            Profesionales dedicados al cuidado y bienestar de tus mascotas
          </p>
        </motion.div>

        {/* Team Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerContainerFast}
        >
          {team.map((member) => (
            <motion.div
              key={member.id}
              className="rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02] border border-gray-200 dark:border-gray-700"
              style={{
                backgroundColor: colors.cardBg,
                borderRadius: theme.layout.borderRadius,
              }}
              variants={cardVariant}
            >
              {/* Photo */}
              <div className="relative h-64 bg-gray-100 dark:bg-gray-800">
                {member.publicPhoto ? (
                  <Image
                    src={member.publicPhoto}
                    alt={`Foto de ${member.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-24 h-24 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3
                  className="text-xl font-semibold mb-1"
                  style={{ color: colors.text }}
                >
                  {member.name}
                </h3>
                <p
                  className="text-sm mb-3"
                  style={{ color: themeColor }}
                >
                  {member.position}
                </p>

                {/* Specialties */}
                {member.specialties && member.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {member.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${themeColor}15`,
                          color: themeColor,
                        }}
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio */}
                {member.publicBio && (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: colors.textMuted }}
                  >
                    {member.publicBio}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
