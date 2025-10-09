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
import {
  createHomePageSEO,
  generateMetadata,
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
} from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';


const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

// Generate SEO metadata using the new SEO library
const seoConfig = createHomePageSEO('es');
export const metadata: Metadata = {
  ...generateMetadata(seoConfig, 'es'),
  // Favicon configuration
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
  // Additional metadata
  authors: [{ name: 'Vetify Team' }],
  creator: 'Vetify',
  publisher: 'Vetify',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
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
  // Generate structured data for organization and software application
  const organizationSchema = generateOrganizationSchema('es', {
    socialLinks: [
      // Add your actual social media links
      // 'https://www.facebook.com/vetify',
      // 'https://twitter.com/vetify',
      // 'https://www.linkedin.com/company/vetify',
    ],
  });

  const softwareSchema = generateSoftwareApplicationSchema('es', {
    price: '990', // Update with actual pricing
    priceCurrency: 'MXN',
  });

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Structured Data (JSON-LD) */}
        <StructuredData data={[organizationSchema, softwareSchema]} />
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