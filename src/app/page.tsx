"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import HeroSection from "@/components/hero/HeroSection";
import { MarketingSection } from "@/components/marketing";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="relative min-h-screen">
      {/* Fondo */}
      <div
        className={`absolute inset-0 transition-colors duration-500 
        ${
          resolvedTheme === "dark"
            ? "bg-gradient-to-b from-beigeD to-grayD"
            : "bg-gradient-to-b from-beige to-white"
        }`}
      />

      {/* Contenido */}
      <div className="relative z-10">
        <HeroSection />
        <MarketingSection />
      </div>
    </main>
  );
}
