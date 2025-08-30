"use client";

import { useThemeAware, getThemeClass } from '../hooks/useThemeAware';
import HeroSection from '../components/hero/HeroSection';
import { MarketingSection } from '../components/marketing';

export default function Home() {
  const { mounted, theme } = useThemeAware();

  // Use getThemeClass to ensure consistent server/client rendering
  const backgroundClass = getThemeClass(
    "bg-gradient-to-b from-beige to-white",
    "bg-gradient-to-b from-beigeD to-grayD",
    mounted,
    theme
  );

  return (
    <main className="relative min-h-screen">
      {/* Fondo */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${backgroundClass}`}
      />

      {/* Contenido */}
      <div className="relative z-10">
        <HeroSection />
        <MarketingSection />
      </div>
    </main>
  );
}
