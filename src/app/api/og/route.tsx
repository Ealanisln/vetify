import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

export const runtime = 'edge';

/**
 * OG page configuration constants
 * Centralized configuration for all page-specific OG images
 */
const OG_PAGE_CONFIGS = {
  home: {
    title: 'Vetify – Software de Gestión Veterinaria',
    description:
      'Administra citas, historiales médicos, inventario y más. Prueba gratis por 30 días.',
    accentColor: '#74A49D',
  },
  pricing: {
    title: 'Planes y Precios',
    description: 'Encuentra el plan perfecto para tu clínica veterinaria',
    accentColor: '#10b981',
  },
  features: {
    title: 'Funcionalidades',
    description: 'Todo lo que necesitas para gestionar tu clínica',
    accentColor: '#3b82f6',
  },
  contact: {
    title: 'Contáctanos',
    description: 'Estamos aquí para ayudarte',
    accentColor: '#8b5cf6',
  },
} as const;

/**
 * Validation schema for OG image query parameters
 * Prevents XSS, memory issues, and malicious input
 */
const ogParamsSchema = z.object({
  page: z.enum(['home', 'pricing', 'features', 'contact']).optional(),
  clinic: z.string().max(100).optional(),
  title: z.string().max(120).optional(),
  description: z.string().max(240).optional(),
});

const dmSansMediumPromise = fetch(
  'https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTg.ttf',
  {
    cache: 'force-cache',
  }
)
  .then((res) => res.arrayBuffer())
  .catch(() => null);

const dmSansBoldPromise = fetch(
  'https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwARZthTg.ttf',
  {
    cache: 'force-cache',
  }
)
  .then((res) => res.arrayBuffer())
  .catch(() => null);

const vetifyLogoPromise = fetch(
  new URL('../../../../public/logo/vetify-logo.png', import.meta.url)
)
  .then((res) => res.arrayBuffer())
  .catch(() => null);

// These SVG silhouettes are reserved for future use in OG images
// const dogSilhouetteSvg = `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M54 112C46 76 68 54 98 48C118 44 146 44 170 60C186 70 194 92 190 112" stroke="%230B2D29" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 122C44 138 42 166 58 184C76 204 112 208 142 202C170 196 190 174 190 150C190 130 180 112 162 102" stroke="%230B2D29" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M108 114C120 108 138 108 150 114" stroke="%230B2D29" stroke-width="6" stroke-linecap="round"/><path d="M120 146C130 160 152 162 166 150" stroke="%230B2D29" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="108" cy="138" r="6" fill="%230B2D29"/><circle cx="150" cy="138" r="6" fill="%230B2D29"/></svg>`;
// const catSilhouetteSvg = `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M34 120L42 74L70 94L96 72L104 120" stroke="%230B2D29" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 120C32 132 28 154 40 170C54 188 86 192 110 184C134 176 152 156 148 134C146 120 138 110 126 104" stroke="%230B2D29" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 132C80 140 96 140 106 132" stroke="%230B2D29" stroke-width="6" stroke-linecap="round"/><circle cx="74" cy="118" r="5" fill="%230B2D29"/><circle cx="102" cy="118" r="5" fill="%230B2D29"/></svg>`;
// const dogSilhouetteDataUrl = `data:image/svg+xml,${encodeURIComponent(dogSilhouetteSvg)}`;
// const catSilhouetteDataUrl = `data:image/svg+xml,${encodeURIComponent(catSilhouetteSvg)}`;

const titleColor = '#0B2D29';

// Reserved for future use: Feature highlights to display in OG images
// const featureHighlights = [
//   'Citas inteligentes',
//   'Historias clínicas seguras',
//   'Inventario en tiempo real',
// ];

function blendWithWhite(hexColor: string, ratio = 0.75): string {
  const normalized = hexColor.replace('#', '');
  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  const red = parseInt(fullHex.slice(0, 2), 16);
  const green = parseInt(fullHex.slice(2, 4), 16);
  const blue = parseInt(fullHex.slice(4, 6), 16);

  const mixChannel = (channel: number) =>
    Math.round(channel + (255 - channel) * Math.min(Math.max(ratio, 0), 1));

  const r = mixChannel(red).toString(16).padStart(2, '0');
  const g = mixChannel(green).toString(16).padStart(2, '0');
  const b = mixChannel(blue).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function optionalParam(value: string | null): string | undefined {
  return value === null ? undefined : value;
}

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
 * - clinic: Clinic name for dynamic clinic pages (max 100 chars)
 * - title: Custom title override (max 100 chars)
 * - description: Custom description override (max 200 chars)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate and sanitize input parameters
    const validatedParams = ogParamsSchema.parse({
      page: optionalParam(searchParams.get('page')),
      clinic: optionalParam(searchParams.get('clinic')),
      title: optionalParam(searchParams.get('title')),
      description: optionalParam(searchParams.get('description')),
    });

    // Determine title, description, and accent color
    let title: string;
    let description: string;
    let accentColor: string;
    const hasClinic = Boolean(validatedParams.clinic);

    if (hasClinic) {
      // Clinic-specific OG image
      title = validatedParams.title || validatedParams.clinic;
      description = validatedParams.description || 'Clínica Veterinaria Profesional';
      accentColor = '#75a99c';
    } else {
      // Page-specific OG images using configuration
      const pageConfig = OG_PAGE_CONFIGS[validatedParams.page || 'home'];
      title = validatedParams.title || pageConfig.title;
      description = validatedParams.description || pageConfig.description;
      accentColor = pageConfig.accentColor;
    }

    // Generate the OG image
    const [fontMedium, fontBold, logoBuffer] = await Promise.all([
      dmSansMediumPromise,
      dmSansBoldPromise,
      vetifyLogoPromise,
    ]);

    const logoSrc =
      logoBuffer !== null
        ? `data:image/png;base64,${arrayBufferToBase64(logoBuffer)}`
        : null;

    const fonts: {
      name: string;
      data: ArrayBuffer;
      weight: number;
      style: 'normal';
    }[] = [];

    if (fontMedium) {
      fonts.push({
        name: 'DM Sans',
        data: fontMedium,
        weight: 500,
        style: 'normal',
      });
    }

    if (fontBold) {
      fonts.push({
        name: 'DM Sans',
        data: fontBold,
        weight: 700,
        style: 'normal',
      });
    }

    const gradientEnd = blendWithWhite(accentColor, 0.82);
    const accentOutline = blendWithWhite(accentColor, 0.35);

    // Reserved for future use: Feature badges to display in OG images
    // const featureBadges = featureHighlights.map((feature) => (
    //   <div
    //     key={feature}
    //     style={{
    //       padding: '14px 22px',
    //       borderRadius: '18px',
    //       border: `1px solid ${accentOutline}`,
    //       backgroundColor: 'rgba(255, 255, 255, 0.65)',
    //       color: 'rgba(19, 69, 63, 0.78)',
    //       fontSize: '26px',
    //       fontWeight: 600,
    //     }}
    //   >
    //     {feature}
    //   </div>
    // ));

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
            backgroundImage: `linear-gradient(135deg, ${accentColor} 0%, ${gradientEnd} 65%, #f6f8f6 100%)`,
            color: titleColor,
            padding: '56px 88px',
            position: 'relative',
            fontFamily: 'DM Sans',
            gap: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              position: 'relative',
            }}
          >
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt="Vetify"
                style={{
                  height: '108px',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: '90px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                Vetify
              </div>
            )}

            <div
              style={{
                fontSize: '30px',
                fontWeight: 500,
                color: 'rgba(19, 69, 63, 0.74)',
              }}
            >
              Gestión integral para clínicas veterinarias
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '900px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <div
              style={{
                fontSize: '64px',
                fontWeight: 700,
                lineHeight: 1.1,
                color: titleColor,
                letterSpacing: '-0.02em',
                textAlign: 'center',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: '32px',
                lineHeight: 1.4,
                color: 'rgba(19, 69, 63, 0.82)',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              {description}
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: 'rgba(19, 69, 63, 0.78)',
                padding: '16px 24px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                border: `1px solid ${accentOutline}`,
              }}
            >
              vetify.pro
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts,
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
