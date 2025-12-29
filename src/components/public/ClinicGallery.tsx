'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Building2, Users, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PublicTenant, GalleryImage, GalleryCategory } from '../../lib/tenant';
import { getTheme, getThemeClasses } from '../../lib/themes';
import { useThemeAware } from '@/hooks/useThemeAware';
import { generateDarkColors } from '@/lib/color-utils';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import {
  fadeInUp,
  staggerContainerFast,
  cardVariant,
  sectionVariant,
  viewportSettings,
} from './animations';

interface ClinicGalleryProps {
  tenant: PublicTenant;
  images: GalleryImage[];
}

const CATEGORY_LABELS: Record<GalleryCategory, { label: string; icon: React.ReactNode }> = {
  instalaciones: { label: 'Instalaciones', icon: <Building2 className="h-4 w-4" /> },
  equipo: { label: 'Equipo', icon: <Users className="h-4 w-4" /> },
  pacientes: { label: 'Pacientes', icon: <Heart className="h-4 w-4" /> },
};

export function ClinicGallery({ tenant, images }: ClinicGalleryProps) {
  const [activeFilter, setActiveFilter] = useState<GalleryCategory | 'all'>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
    background: darkColors.background,
    backgroundAlt: darkColors.backgroundAlt,
  } : {
    text: theme.colors.text,
    textMuted: theme.colors.textMuted,
    cardBg: theme.colors.cardBg,
    background: theme.colors.background,
    backgroundAlt: theme.colors.backgroundAlt,
  };

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.order - b.order),
    [images]
  );

  const filteredImages = useMemo(
    () =>
      activeFilter === 'all'
        ? sortedImages
        : sortedImages.filter((img) => img.category === activeFilter),
    [sortedImages, activeFilter]
  );

  const lightboxSlides = useMemo(
    () =>
      filteredImages.map((img) => ({
        src: img.url,
        title: img.caption || undefined,
        description: CATEGORY_LABELS[img.category].label,
      })),
    [filteredImages]
  );

  const categories = useMemo(() => {
    const counts: Record<GalleryCategory | 'all', number> = {
      all: sortedImages.length,
      instalaciones: 0,
      equipo: 0,
      pacientes: 0,
    };
    sortedImages.forEach((img) => counts[img.category]++);
    return counts;
  }, [sortedImages]);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <motion.section
      className="py-16 transition-colors duration-200"
      style={{ backgroundColor: colors.background }}
      initial="hidden"
      whileInView="visible"
      viewport={viewportSettings}
      variants={sectionVariant}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div className="text-center mb-12" variants={fadeInUp}>
          <h2
            className="text-3xl lg:text-4xl font-bold mb-4"
            style={{
              color: colors.text,
              fontFamily: theme.typography.fontFamily,
              fontWeight: theme.typography.headingWeight,
            }}
          >
            Nuestra Galería
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: colors.textMuted }}
          >
            Conoce nuestras instalaciones, equipo y algunos de nuestros pacientes
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div className="flex flex-wrap justify-center gap-2 mb-10" variants={fadeInUp}>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${themeClasses.button}`}
            style={{
              backgroundColor: activeFilter === 'all' ? themeColor : colors.backgroundAlt,
              color: activeFilter === 'all' ? '#fff' : colors.text,
              borderRadius: theme.layout.buttonStyle === 'pill' ? '9999px' : theme.layout.borderRadius,
            }}
          >
            Todas ({categories.all})
          </button>
          {(Object.entries(CATEGORY_LABELS) as [GalleryCategory, { label: string; icon: React.ReactNode }][]).map(
            ([key, { label, icon }]) =>
              categories[key] > 0 && (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${themeClasses.button}`}
                  style={{
                    backgroundColor: activeFilter === key ? themeColor : colors.backgroundAlt,
                    color: activeFilter === key ? '#fff' : colors.text,
                    borderRadius: theme.layout.buttonStyle === 'pill' ? '9999px' : theme.layout.borderRadius,
                  }}
                >
                  {icon}
                  {label} ({categories[key]})
                </button>
              )
          )}
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
        >
          {filteredImages.map((image, index) => (
            <motion.div
              variants={cardVariant}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              key={image.id}
              className={`relative group cursor-pointer overflow-hidden transition-colors ${themeClasses.card}`}
              style={{
                borderRadius: theme.layout.borderRadius,
                backgroundColor: colors.cardBg,
              }}
              onClick={() => handleImageClick(index)}
            >
              <div className="aspect-[4/3] relative">
                <Image
                  src={image.url}
                  alt={image.caption || `Galería ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />

                {/* Overlay on hover */}
                <div
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                    style={{ backgroundColor: themeColor }}
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                  {image.caption && (
                    <p className="text-white text-sm text-center px-4 line-clamp-2">
                      {image.caption}
                    </p>
                  )}
                </div>

                {/* Category badge */}
                <div
                  className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                  style={{ color: themeColor }}
                >
                  {CATEGORY_LABELS[image.category].icon}
                  <span className="hidden sm:inline">
                    {CATEGORY_LABELS[image.category].label}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty state for filtered results */}
        {filteredImages.length === 0 && activeFilter !== 'all' && (
          <div className="text-center py-12">
            <p style={{ color: colors.textMuted }}>
              No hay imágenes en esta categoría
            </p>
            <button
              onClick={() => setActiveFilter('all')}
              className="mt-4 underline"
              style={{ color: themeColor }}
            >
              Ver todas las imágenes
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
        plugins={[Captions]}
        captions={{ showToggle: true, descriptionTextAlign: 'center' }}
        styles={{
          container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
        }}
        render={{
          iconClose: () => <X className="w-6 h-6" />,
          iconPrev: () => <ChevronLeft className="w-8 h-8" />,
          iconNext: () => <ChevronRight className="w-8 h-8" />,
        }}
      />
    </motion.section>
  );
}
