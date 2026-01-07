'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Facebook, Twitter, MessageCircle, Link2, Check, X } from 'lucide-react';
import { Button } from '../ui/button';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  themeColor?: string;
  size?: 'sm' | 'default' | 'lg';
  fullWidthMobile?: boolean;
}

/**
 * Social sharing buttons component with copy link functionality
 */
export function ShareButtons({
  url,
  title,
  description,
  themeColor = '#75a99c',
  size = 'sm',
  fullWidthMobile = false,
}: ShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'noopener,noreferrer,width=600,height=400');
    setIsOpen(false);
  };

  // Use Web Share API if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className={`relative ${fullWidthMobile ? 'w-full sm:w-auto' : 'inline-block'}`}>
      {/* Share trigger button */}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="outline"
          size={size}
          onClick={handleNativeShare}
          className={`flex items-center justify-center gap-2 border-2 transition-all duration-200 ${fullWidthMobile ? 'w-full sm:w-auto' : ''}`}
          style={{
            borderColor: themeColor,
            color: themeColor,
            backgroundColor: 'transparent',
          }}
        >
          <Share2 className={size === 'lg' ? 'h-5 w-5' : 'w-4 h-4'} />
          Compartir
        </Button>
      </motion.div>

      {/* Share menu dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[180px]"
            >
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Share options */}
              <ShareOption
                icon={<Facebook className="w-4 h-4" />}
                label="Facebook"
                onClick={() => handleShare('facebook')}
                color="#1877F2"
              />
              <ShareOption
                icon={<Twitter className="w-4 h-4" />}
                label="X (Twitter)"
                onClick={() => handleShare('twitter')}
                color="#1DA1F2"
              />
              <ShareOption
                icon={<MessageCircle className="w-4 h-4" />}
                label="WhatsApp"
                onClick={() => handleShare('whatsapp')}
                color="#25D366"
              />

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

              {/* Copy link */}
              <ShareOption
                icon={copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                label={copied ? '¡Copiado!' : 'Copiar enlace'}
                onClick={handleCopyLink}
                color={copied ? '#16A34A' : '#6B7280'}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ShareOptionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

function ShareOption({ icon, label, onClick, color }: ShareOptionProps) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-sm text-gray-700 dark:text-gray-200">{label}</span>
    </button>
  );
}

/**
 * Compact share button for inline use
 */
export function ShareButtonInline({
  url,
  title,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    };
    window.open(links[platform], '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Compartir:</span>
      <div className="flex gap-1">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleShare('facebook')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: '#1877F2' }}
          aria-label="Compartir en Facebook"
        >
          <Facebook className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleShare('twitter')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: '#1DA1F2' }}
          aria-label="Compartir en Twitter"
        >
          <Twitter className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleShare('whatsapp')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: '#25D366' }}
          aria-label="Compartir en WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleCopy}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          aria-label="Copiar enlace"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
        </motion.button>
      </div>
    </div>
  );
}
