'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Star, Quote, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { PublicTenant } from '@/lib/tenant';
import { getTheme } from '@/lib/themes';
import { useThemeAware } from '@/hooks/useThemeAware';
import { generateDarkColors } from '@/lib/color-utils';
import {
  fadeInUp,
  sectionVariant,
  viewportSettings,
} from './animations';

interface Testimonial {
  id: string;
  reviewerName: string;
  rating: number;
  text: string;
  submittedAt: Date;
  isFeatured: boolean;
}

interface TestimonialStats {
  averageRating: number;
  totalCount: number;
}

interface TestimonialsSectionProps {
  tenant: PublicTenant;
  testimonials: Testimonial[];
  stats: TestimonialStats;
}

export function TestimonialsSection({ tenant, testimonials, stats }: TestimonialsSectionProps) {
  const theme = getTheme(tenant.publicTheme);
  const themeColor = tenant.publicThemeColor || theme.colors.primary;
  const { isDark } = useThemeAware();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const darkColors = generateDarkColors(themeColor);

  const colors = isDark
    ? {
        text: darkColors.text,
        textMuted: darkColors.textMuted,
        cardBg: darkColors.cardBg,
        border: darkColors.border,
        primaryLight: darkColors.primaryLight,
        backgroundAlt: darkColors.backgroundAlt,
      }
    : {
        text: theme.colors.text,
        textMuted: theme.colors.textMuted,
        cardBg: theme.colors.cardBg,
        border: theme.colors.border,
        primaryLight: theme.colors.primaryLight,
        backgroundAlt: theme.colors.backgroundAlt,
      };

  const nextSlide = useCallback(() => {
    if (testimonials.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevSlide = useCallback(() => {
    if (testimonials.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Auto-rotate
  useEffect(() => {
    if (isPaused || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide, testimonials.length]);

  if (testimonials.length === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <motion.section
      id="testimonios"
      className="py-16 sm:py-20"
      style={{ backgroundColor: colors.backgroundAlt }}
      variants={sectionVariant}
      initial="hidden"
      whileInView="visible"
      viewport={viewportSettings}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: colors.text }}>
            Lo que dicen nuestros clientes
          </h2>
          {stats.totalCount > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <span className="text-lg font-semibold" style={{ color: colors.text }}>
                {stats.averageRating.toFixed(1)}
              </span>
              <span style={{ color: colors.textMuted }}>
                de {stats.totalCount} reseña{stats.totalCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </motion.div>

        {/* Carousel */}
        <motion.div
          variants={fadeInUp}
          className="relative max-w-3xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="rounded-2xl p-8 sm:p-10 relative overflow-hidden"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              borderWidth: '1px',
              borderRadius: theme.layout.borderRadius,
            }}
          >
            {/* Quote Icon */}
            <Quote
              className="absolute top-6 left-6 h-10 w-10 opacity-20"
              style={{ color: themeColor }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                {/* Rating */}
                <div className="flex justify-center mb-6">
                  {renderStars(currentTestimonial.rating)}
                </div>

                {/* Text */}
                <blockquote className="text-center">
                  <p
                    className="text-lg sm:text-xl leading-relaxed italic"
                    style={{ color: colors.text }}
                  >
                    &ldquo;{currentTestimonial.text}&rdquo;
                  </p>
                </blockquote>

                {/* Author */}
                <div className="mt-6 text-center">
                  <p className="font-semibold" style={{ color: colors.text }}>
                    {currentTestimonial.reviewerName}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {testimonials.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Testimonio anterior"
                >
                  <ChevronLeft className="h-6 w-6" style={{ color: colors.textMuted }} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Siguiente testimonio"
                >
                  <ChevronRight className="h-6 w-6" style={{ color: colors.textMuted }} />
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: index === currentIndex ? themeColor : colors.border,
                    transform: index === currentIndex ? 'scale(1.3)' : 'scale(1)',
                  }}
                  aria-label={`Ir al testimonio ${index + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="text-center mt-10">
          <Link href={`/${tenant.slug}/testimonios/nuevo`}>
            <Button
              size="lg"
              variant="outline"
              className="group"
              style={{
                borderColor: themeColor,
                color: themeColor,
              }}
            >
              Deja tu testimonio
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
