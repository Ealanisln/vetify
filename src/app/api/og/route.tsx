import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export const runtime = 'edge';

/**
 * Dynamic OG Image Generator
 *
 * Usage:
 * - Default: /api/og
 * - Pricing: /api/og?page=pricing
 * - Features: /api/og?page=features
 * - Contact: /api/og?page=contact
 * - Clinic: /api/og?clinic=Clínica+San+Miguel
 *
 * Query Parameters:
 * - page: 'home' | 'pricing' | 'features' | 'contact'
 * - clinic: Clinic name for dynamic clinic pages
 * - title: Custom title override
 * - description: Custom description override
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get parameters
    const page = searchParams.get('page') || 'home';
    const clinic = searchParams.get('clinic');
    const customTitle = searchParams.get('title');
    const customDescription = searchParams.get('description');

    // Determine title and description
    let title: string;
    let description: string;
    let accentColor: string;

    if (clinic) {
      // Clinic-specific OG image
      title = customTitle || clinic;
      description = customDescription || 'Clínica Veterinaria Profesional';
      accentColor = '#75a99c';
    } else {
      // Page-specific OG images
      switch (page) {
        case 'pricing':
          title = customTitle || 'Planes y Precios';
          description = customDescription || 'Encuentra el plan perfecto para tu clínica veterinaria';
          accentColor = '#10b981';
          break;
        case 'features':
          title = customTitle || 'Funcionalidades';
          description = customDescription || 'Todo lo que necesitas para gestionar tu clínica';
          accentColor = '#3b82f6';
          break;
        case 'contact':
          title = customTitle || 'Contáctanos';
          description = customDescription || 'Estamos aquí para ayudarte';
          accentColor = '#8b5cf6';
          break;
        default:
          title = customTitle || 'Vetify';
          description = customDescription || 'Software para clínicas veterinarias';
          accentColor = '#75a99c';
      }
    }

    // Generate the OG image
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            backgroundImage: `
              radial-gradient(circle at 25px 25px, ${accentColor}15 2%, transparent 0%),
              radial-gradient(circle at 75px 75px, ${accentColor}15 2%, transparent 0%)
            `,
            backgroundSize: '100px 100px',
          }}
        >
          {/* Logo/Brand Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
                backgroundClip: 'text',
                color: 'transparent',
                display: 'flex',
              }}
            >
              Vetify
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 120px',
              textAlign: 'center',
              maxWidth: '1000px',
            }}
          >
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '20px',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: '32px',
                color: '#6b7280',
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {description}
            </p>
          </div>

          {/* Footer Badge */}
          {clinic && (
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                display: 'flex',
                alignItems: 'center',
                padding: '16px 24px',
                backgroundColor: accentColor,
                borderRadius: '12px',
                color: 'white',
                fontSize: '24px',
                fontWeight: '600',
              }}
            >
              🐾 Reserva Online
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    // Add cache headers for better performance
    // Cache for 7 days - OG images rarely change
    imageResponse.headers.set(
      'Cache-Control',
      'public, max-age=604800, immutable'
    );

    return imageResponse;
  } catch (error) {
    // Track error in Sentry for production monitoring
    Sentry.captureException(error, {
      tags: { context: 'og-image-generation' },
      extra: {
        page: request.nextUrl.searchParams.get('page'),
        clinic: request.nextUrl.searchParams.get('clinic'),
      },
    });

    // Keep console.error for local development
    console.error('Error generating OG image:', error);

    // Return a simple fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#75a99c',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            Vetify
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
