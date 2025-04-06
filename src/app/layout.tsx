// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import type { Viewport } from 'next'
import { Metadata } from 'next'
import Footer from '@/components/footer/Footer'
const inter = Inter({ subsets: ['latin'] })
import Nav from '@/components/navbar/Nav'

export const metadata: Metadata = {
  metadataBase: new URL('https://vetify.pro'), // Use production domain
  title: 'Vetify | Software de Gestión Veterinaria en la Nube',
  description: 'Sistema integral para clínicas veterinarias. Gestiona pacientes, citas, inventario y más.',
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
  icons: {
    icon: [ // General purpose favicons
      { url: '/favicon/favicon.ico', sizes: 'any', rel: 'icon' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml', rel: 'icon' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png', rel: 'icon' },
    ],
    apple: [ // Apple touch icons
      { url: '/favicon/apple-touch-icon.png', rel: 'apple-touch-icon' },
    ],
    other: [ // Additional icons like those for web app manifest
      { url: '/favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ]
  },
  manifest: '/favicon/site.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
          <Providers>
          <Nav />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}