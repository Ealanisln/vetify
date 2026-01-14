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
import { UpdatePrompt } from '@/components/pwa';
import {
  createHomePageSEO,
  generateMetadata,
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateWebSiteSchema,
} from '@/lib/seo';
import { StructuredData } from '@/components/seo/StructuredData';
import { UmamiAnalytics } from '@/components/analytics/UmamiAnalytics';


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
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vetify',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#75a99c' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Generate structured data for organization, software application, and website
  const organizationSchema = generateOrganizationSchema('es', {
    socialLinks: [
      // Add your actual social media links when available
    ],
  });

  const softwareSchema = generateSoftwareApplicationSchema('es', {
    price: '449', // Early adopter discounted price
    priceCurrency: 'MXN',
  });

  const websiteSchema = generateWebSiteSchema('es');

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Structured Data (JSON-LD) */}
        <StructuredData data={[organizationSchema, softwareSchema, websiteSchema]} />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <Providers>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
              {/* PWA Update Notification */}
              <UpdatePrompt />
            </Providers>
          </AuthProvider>
        </ErrorBoundary>

        {/* Umami Analytics - excluded on /invite to prevent JSON-LD processing conflicts */}
        <UmamiAnalytics />

        {/* Meta (Facebook) Pixel */}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <>
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                `,
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </body>
    </html>
  )
}