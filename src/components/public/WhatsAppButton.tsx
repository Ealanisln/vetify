'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber: string;
  clinicName: string;
  message?: string;
  themeColor?: string;
}

/**
 * Floating WhatsApp button that appears in the bottom-right corner
 * with entrance animation and optional tooltip
 */
export function WhatsAppButton({
  phoneNumber,
  clinicName,
  message,
  themeColor = '#25D366',
}: WhatsAppButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Clean phone number: remove +, spaces, dashes, parentheses
  const cleanPhone = phoneNumber.replace(/[\s\-\+\(\)]/g, '');

  // Default message if not provided
  const defaultMessage = `Hola, me gustaría agendar una cita en ${clinicName}`;
  const encodedMessage = encodeURIComponent(message || defaultMessage);

  // WhatsApp API URL
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

  // Show button after 2 second delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Show tooltip after button appears (if user hasn't interacted)
  useEffect(() => {
    if (isVisible && !hasInteracted) {
      const tooltipTimer = setTimeout(() => {
        setShowTooltip(true);
      }, 3000);

      // Hide tooltip after 5 seconds
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
      }, 8000);

      return () => {
        clearTimeout(tooltipTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isVisible, hasInteracted]);

  const handleClick = () => {
    setHasInteracted(true);
    setShowTooltip(false);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDismissTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(false);
    setHasInteracted(true);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-3 max-w-[200px] border border-gray-200 dark:border-gray-700"
              >
                <button
                  onClick={handleDismissTooltip}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                </button>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  ¿Necesitas ayuda? Escríbenos por WhatsApp
                </p>
                {/* Arrow pointing to button */}
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 transform rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* WhatsApp Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-shadow hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: '#25D366',
              focusRing: themeColor,
            }}
            aria-label="Contactar por WhatsApp"
          >
            <MessageCircle className="w-7 h-7" fill="currentColor" />
          </motion.button>

          {/* Pulse animation ring */}
          <motion.div
            className="absolute bottom-0 right-0 w-14 h-14 rounded-full pointer-events-none"
            style={{ backgroundColor: '#25D366' }}
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{
              opacity: [0.4, 0],
              scale: [1, 1.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
