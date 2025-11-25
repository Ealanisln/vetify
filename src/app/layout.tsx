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
  generateWebSiteSchema,
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
            </Providers>
          </AuthProvider>
        </ErrorBoundary>

        {/* Umami Analytics */}
        <Script
          src="https://analytics.alanis.dev/script.js"
          data-website-id="a8982b40-5dc3-4a51-a17f-1cf53a2aecc4"
          strategy="afterInteractive"
        />

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