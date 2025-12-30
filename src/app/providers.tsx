'use client'
import { ThemeProvider } from 'next-themes'
import { ReactNode, useEffect } from 'react'
import { ToastProvider } from '../components/providers/ToastProvider'
import { MetaPixelProvider } from '../components/providers/MetaPixelProvider'
import { initializeMonitoring } from '../lib/monitoring/sentry-integration'

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // STABILITY FIX: Initialize monitoring on app load to capture unhandled rejections
  useEffect(() => {
    initializeMonitoring();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="vetify-theme"
    >
      <ToastProvider />
      <MetaPixelProvider>
        {children}
      </MetaPixelProvider>
    </ThemeProvider>
  )
}