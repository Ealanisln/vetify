// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import type { Viewport } from 'next'
import { Metadata } from 'next'
import {AuthProvider} from '../AuthProvider';
import Nav from "../components/navbar/Nav";
import Footer from "../components/footer/Footer";

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
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            <Nav />
            {children}
            <Footer />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
}