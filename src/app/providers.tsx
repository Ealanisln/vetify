'use client'
import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'
import { ToastProvider } from '../components/providers/ToastProvider'
import { MetaPixelProvider } from '../components/providers/MetaPixelProvider'

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
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