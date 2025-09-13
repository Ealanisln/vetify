// app/layout.tsx
import { Inter } from 'next/font/google'
import Script from 'next/script'

// Force dynamic rendering for all pages to prevent static generation issues with Kinde Auth
export const dynamic = 'force-dynamic'
import '@/app/globals.css'
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
        {/* CRITICAL CSS INLINED - Nuclear option for Vercel deployment fix */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Tailwind CSS Reset and Core Styles */
            *, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
            ::before, ::after { --tw-content: ''; }
            html { line-height: 1.5; -webkit-text-size-adjust: 100%; -moz-tab-size: 4; tab-size: 4; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; font-feature-settings: normal; font-variation-settings: normal; }
            body { margin: 0; line-height: inherit; }
            
            /* Critical Vetify Styles */
            :root { color-scheme: light dark; }
            body { 
              background-color: white; 
              color: #111827; 
              font-family: ${inter.style.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
            }
            
            @media (prefers-color-scheme: dark) {
              body { 
                background-color: #111827; 
                color: #f9fafb; 
              }
            }
            
            /* Brand Colors */
            .bg-primary { background-color: #75a99c; }
            .text-primary { color: #75a99c; }
            .border-primary { border-color: #75a99c; }
            
            /* Basic Layout */
            .flex { display: flex; }
            .hidden { display: none; }
            .block { display: block; }
            .inline-block { display: inline-block; }
            .grid { display: grid; }
            
            /* Spacing */
            .p-4 { padding: 1rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .m-4 { margin: 1rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            
            /* Text */
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .text-center { text-align: center; }
            
            /* Colors */
            .text-white { color: white; }
            .text-gray-900 { color: #111827; }
            .text-gray-600 { color: #4b5563; }
            .bg-white { background-color: white; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-gray-800 { background-color: #1f2937; }
            .bg-gray-900 { background-color: #111827; }
            
            /* Borders and Radius */
            .border { border-width: 1px; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-gray-300 { border-color: #d1d5db; }
            .rounded { border-radius: 0.25rem; }
            .rounded-md { border-radius: 0.375rem; }
            .rounded-lg { border-radius: 0.5rem; }
            
            /* Shadow */
            .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
            .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
            
            /* Width and Height */
            .w-full { width: 100%; }
            .h-full { height: 100%; }
            .max-w-7xl { max-width: 80rem; }
            .min-h-screen { min-height: 100vh; }
            
            /* Positioning */
            .relative { position: relative; }
            .absolute { position: absolute; }
            .fixed { position: fixed; }
            
            /* Flexbox and Grid */
            .flex-col { flex-direction: column; }
            .items-center { align-items: center; }
            .justify-center { justify-content: center; }
            .justify-between { justify-content: space-between; }
            .gap-4 { gap: 1rem; }
            
            /* Hover and Focus */
            .hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
            .hover\\:text-primary:hover { color: #75a99c; }
            .focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
            
            /* Transitions */
            * {
              transition-property: background-color, border-color, color, fill, stroke;
              transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              transition-duration: 150ms;
            }
            
            /* Component Classes */
            .btn-primary {
              display: inline-flex;
              align-items: center;
              padding: 0.5rem 1rem;
              border: 1px solid transparent;
              font-size: 0.875rem;
              font-weight: 500;
              border-radius: 0.375rem;
              box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
              color: white;
              background-color: #75a99c;
              transition: background-color 0.15s;
            }
            
            .btn-primary:hover {
              background-color: #5b9788;
            }
            
            .card {
              background-color: white;
              border: 1px solid #e5e7eb;
              border-radius: 0.5rem;
              box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            }
            
            @media (prefers-color-scheme: dark) {
              .card {
                background-color: #1f2937;
                border-color: #374151;
              }
              .text-gray-900 { color: #f9fafb; }
              .text-gray-600 { color: #9ca3af; }
              .bg-white { background-color: #1f2937; }
              .bg-gray-50 { background-color: #111827; }
              .bg-gray-100 { background-color: #1f2937; }
              .border-gray-200 { border-color: #374151; }
              .border-gray-300 { border-color: #4b5563; }
            }
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