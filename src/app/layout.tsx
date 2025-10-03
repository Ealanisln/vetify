// app/layout.tsx
import { Inter } from 'next/font/google'
import Script from 'next/script'

// Force dynamic rendering for all pages to prevent static generation issues with Kinde Auth
export const dynamic = 'force-dynamic'
import './globals.css'
import { Providers } from './providers'
import type { Viewport } from 'next'
import { Metadata } from 'next'
import {AuthProvider} from '../AuthProvider';
import { ConditionalLayout } from '../components/ConditionalLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';


const inter = Inter({ subsets: ['latin'] })

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Vetify | Software de Gestión Veterinaria en la Nube',
  description: 'Sistema integral para clínicas veterinarias. Gestiona pacientes, citas, inventario y más.',
  icons: {
    icon: [
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png' },
    ],
    other: [
      {
        rel: 'manifest',
        url: '/favicon/site.webmanifest',
      },
    ],
  },
  keywords: [
    'software veterinario',
    'CRM veterinario',
    'gestión clínica veterinaria',
    'expediente clínico veterinario',
    'sistema veterinario',
    'citas veterinarias',
    'historia clínica veterinaria',
    'software para veterinarios',
    'gestión de inventario veterinario',
    'SaaS veterinario'
  ],
  authors: [{ name: 'Vetify Team' }],
  creator: 'Vetify',
  publisher: 'Vetify',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: '/',
    siteName: 'Vetify',
    title: 'Vetify | Software de Gestión Veterinaria en la Nube',
    description: 'Sistema integral para clínicas veterinarias.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Vetify - Software Veterinario',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vetify | Software Veterinario',
    description: 'Sistema integral para clínicas veterinarias.',
    images: ['/og-image.jpg'],
    creator: '@vetify',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Critical inline CSS for production - ensures styles load immediately */}
        <style dangerouslySetInnerHTML={{
            __html: `
              /* Critical Tailwind Reset */
              *, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
              ::before, ::after { --tw-content: ''; }
              html { line-height: 1.5; -webkit-text-size-adjust: 100%; font-family: ui-sans-serif, system-ui, sans-serif; }
              body { margin: 0; line-height: inherit; }

              /* Critical Base Styles */
              :root { color-scheme: light dark; }
              body {
                background-color: white;
                color: #111827;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                transition: background-color 0.15s, color 0.15s;
              }

              /* Dark mode support */
              @media (prefers-color-scheme: dark) {
                body { background-color: #111827; color: #f9fafb; }
              }
              .dark body { background-color: #111827; color: #f9fafb; }

              /* Vetify Brand Colors */
              .bg-vetify-primary { background-color: #8B6E5C; }
              .bg-vetify-accent { background-color: #7FA99B; }
              .text-vetify-primary { color: #8B6E5C; }
              .text-vetify-accent { color: #7FA99B; }
              .border-vetify-primary { border-color: #8B6E5C; }
              .border-vetify-accent { border-color: #7FA99B; }

              /* Legacy color support */
              [style*="background-color: rgb(117, 169, 156)"] { background-color: #75a99c !important; }
              [style*="color: rgb(117, 169, 156)"] { color: #75a99c !important; }

              /* Critical Layout Utilities */
              .flex { display: flex; }
              .grid { display: grid; }
              .hidden { display: none; }
              .block { display: block; }
              .inline-block { display: inline-block; }
              .relative { position: relative; }
              .absolute { position: absolute; }
              .fixed { position: fixed; }
              .sticky { position: sticky; }

              /* Critical Spacing */
              .p-4 { padding: 1rem; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .m-0 { margin: 0; }
              .mx-auto { margin-left: auto; margin-right: auto; }

              /* Critical Typography */
              .text-sm { font-size: 0.875rem; }
              .text-base { font-size: 1rem; }
              .text-lg { font-size: 1.125rem; }
              .text-xl { font-size: 1.25rem; }
              .text-2xl { font-size: 1.5rem; }
              .font-medium { font-weight: 500; }
              .font-bold { font-weight: 700; }

              /* Critical Components */
              .btn-primary {
                display: inline-flex; align-items: center; padding: 0.5rem 1rem;
                border: 1px solid transparent; font-size: 0.875rem; font-weight: 500;
                border-radius: 0.375rem; color: white; background-color: #75a99c;
                cursor: pointer; transition: all 0.15s;
              }
              .btn-primary:hover { background-color: #5b9788; }

              .btn-secondary {
                display: inline-flex; align-items: center; padding: 0.5rem 1rem;
                border: 1px solid #e5e7eb; font-size: 0.875rem; font-weight: 500;
                border-radius: 0.375rem; background-color: white; color: #374151;
                cursor: pointer; transition: all 0.15s;
              }
              .dark .btn-secondary { background-color: #374151; color: #f9fafb; border-color: #4b5563; }

              .card {
                background-color: white; border: 1px solid #e5e7eb;
                border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              .dark .card { background-color: #1f2937; border-color: #374151; }

              .form-input {
                display: block; width: 100%; padding: 0.5rem 0.75rem;
                border: 1px solid #d1d5db; border-radius: 0.375rem;
                background-color: white; color: #111827;
              }
              .dark .form-input { background-color: #374151; color: #f9fafb; border-color: #4b5563; }

              /* Critical Dark Mode Classes */
              .dark\\:bg-gray-900 { background-color: #111827; }
              .dark\\:text-gray-100 { color: #f3f4f6; }
              .dark\\:bg-gray-800 { background-color: #1f2937; }
              .dark\\:border-gray-700 { border-color: #374151; }

              /* Responsive utilities */
              @media (min-width: 640px) { .sm\\:block { display: block; } }
              @media (min-width: 768px) { .md\\:flex { display: flex; } }
              @media (min-width: 1024px) { .lg\\:grid { display: grid; } }
            `
        }} />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <Providers>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </Providers>
          </AuthProvider>
        </ErrorBoundary>

        {/* Umami Analytics */}
        <Script
          src="https://analytics.alanis.dev/script.js"
          data-website-id="a8982b40-5dc3-4a51-a17f-1cf53a2aecc4"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}