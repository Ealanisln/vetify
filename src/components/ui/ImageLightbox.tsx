'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  src: string;
  alt: string;
  className?: string;
  children: React.ReactNode;
}

export function ImageLightbox({ src, alt, className, children }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openLightbox = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeLightbox]);

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={openLightbox}
        className={cn(
          'relative group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full',
          className
        )}
        aria-label={`Ver ${alt} en tamaño completo`}
      >
        {children}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-full flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </button>

      {/* Lightbox Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image container */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Caption */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 px-4 py-2 rounded-full">
            {alt}
          </p>
        </div>
      )}
    </>
  );
}
