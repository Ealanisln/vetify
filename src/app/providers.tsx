'use client'
import { ThemeProvider } from 'next-themes'
import { ReactNode, useEffect } from 'react'
import { ToastProvider } from '../components/providers/ToastProvider'

interface ProvidersProps {
  children: ReactNode;
}

// Componente interno para manejar la detección de cambios del sistema
function SystemThemeListener({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;

    // Listener para detectar cambios en las preferencias del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      // Obtener el tema almacenado
      const storedTheme = localStorage.getItem('vetify-theme');

      // Solo actualizar si el usuario está usando el tema del sistema
      if (storedTheme === 'system' || !storedTheme) {
        // Forzar actualización del documento para reflejar el cambio
        const isDark = e.matches;
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    // Ejecutar al montar para configurar el estado inicial
    handleChange(mediaQuery);

    // Agregar listener para cambios
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return <>{children}</>;
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
      <SystemThemeListener>
        <ToastProvider />
        {children}
      </SystemThemeListener>
    </ThemeProvider>
  )
}