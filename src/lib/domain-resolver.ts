/**
 * Domain Resolver Utility
 *
 * Handles domain validation, DNS verification, and caching for custom domains.
 */

import { Redis } from '@upstash/redis';

// Cache TTL in seconds (5 minutes)
const DOMAIN_CACHE_TTL = 300;
const DOMAIN_CACHE_PREFIX = 'domain:';

// Initialize Redis client (reuse existing rate limiter config)
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

/**
 * Domain verification status
 */
export type DomainVerificationStatus =
  | 'pending'      // Domain added but not verified
  | 'verified'     // DNS configured correctly
  | 'failed'       // DNS check failed
  | 'error';       // Error during verification

export interface DomainInfo {
  tenantId: string;
  slug: string;
  verified: boolean;
}

export interface DomainVerificationResult {
  status: DomainVerificationStatus;
  message: string;
  cnameTarget?: string;
  txtRecord?: string;
}

/**
 * Validate domain format
 * Returns true if domain is a valid hostname format
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || typeof domain !== 'string') return false;

  // Remove any protocol prefix if accidentally included
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];

  // Domain regex: allows subdomains, no IP addresses, valid TLD
  const domainRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/;

  // Check length
  if (cleanDomain.length > 253) return false;

  return domainRegex.test(cleanDomain);
}

/**
 * Normalize domain for storage/lookup
 * Removes protocol, trailing slashes, converts to lowercase
 */
export function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .split('/')[0];
}

/**
 * Check if domain is a reserved/system domain
 */
export function isReservedDomain(domain: string): boolean {
  const normalizedDomain = normalizeDomain(domain);

  // Reserved patterns
  const reservedPatterns = [
    /^localhost(:\d+)?$/,
    /^127\.0\.0\.1(:\d+)?$/,
    /^vetify\./,
    /\.vetify\.app$/,
    /\.vercel\.app$/,
    /\.vercel\.dev$/,
    /\.localhost$/,
  ];

  return reservedPatterns.some(pattern => pattern.test(normalizedDomain));
}

/**
 * Get expected CNAME target for Vercel
 */
export function getVercelCnameTarget(): string {
  // Use project-specific CNAME if configured, otherwise use default
  return process.env.VERCEL_CNAME_TARGET || 'cname.vercel-dns.com';
}

/**
 * Verify domain DNS configuration
 * Checks if CNAME record points to Vercel
 */
export async function verifyDomainDns(domain: string): Promise<DomainVerificationResult> {
  const normalizedDomain = normalizeDomain(domain);
  const expectedCname = getVercelCnameTarget();

  try {
    // Use DNS over HTTPS (Cloudflare) for reliable lookups
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(normalizedDomain)}&type=CNAME`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    );

    if (!response.ok) {
      return {
        status: 'error',
        message: 'Error al verificar DNS. Intenta de nuevo.',
        cnameTarget: expectedCname,
      };
    }

    const data = await response.json();

    // Check if we got CNAME records
    if (data.Answer && Array.isArray(data.Answer)) {
      const cnameRecord = data.Answer.find(
        (record: { type: number; data: string }) => record.type === 5 // CNAME type
      );

      if (cnameRecord) {
        const cnameValue = cnameRecord.data.replace(/\.$/, '').toLowerCase();

        if (cnameValue === expectedCname || cnameValue.endsWith('.vercel-dns.com')) {
          return {
            status: 'verified',
            message: 'DNS configurado correctamente',
            cnameTarget: expectedCname,
          };
        }

        return {
          status: 'failed',
          message: `CNAME apunta a ${cnameValue}, debería apuntar a ${expectedCname}`,
          cnameTarget: expectedCname,
        };
      }
    }

    return {
      status: 'pending',
      message: 'No se encontró registro CNAME. Configura el DNS de tu dominio.',
      cnameTarget: expectedCname,
    };

  } catch (error) {
    console.error('DNS verification error:', error);
    return {
      status: 'error',
      message: 'Error al verificar DNS. Intenta de nuevo más tarde.',
      cnameTarget: expectedCname,
    };
  }
}

/**
 * Cache domain → tenant mapping
 */
export async function cacheDomainMapping(
  domain: string,
  info: DomainInfo
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const key = `${DOMAIN_CACHE_PREFIX}${normalizeDomain(domain)}`;
    await client.set(key, JSON.stringify(info), { ex: DOMAIN_CACHE_TTL });
  } catch (error) {
    console.error('Error caching domain mapping:', error);
  }
}

/**
 * Get cached domain → tenant mapping
 */
export async function getCachedDomainMapping(
  domain: string
): Promise<DomainInfo | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const key = `${DOMAIN_CACHE_PREFIX}${normalizeDomain(domain)}`;
    const cached = await client.get<string>(key);

    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
    return null;
  } catch (error) {
    console.error('Error getting cached domain mapping:', error);
    return null;
  }
}

/**
 * Invalidate cached domain mapping
 * Call this when domain is updated or removed
 */
export async function invalidateDomainCache(domain: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const key = `${DOMAIN_CACHE_PREFIX}${normalizeDomain(domain)}`;
    await client.del(key);
  } catch (error) {
    console.error('Error invalidating domain cache:', error);
  }
}

/**
 * Check if a hostname is a custom domain (not a system domain)
 */
export function isCustomDomain(hostname: string): boolean {
  const normalizedHost = normalizeDomain(hostname);

  // Not a custom domain if it matches system patterns
  const systemPatterns = [
    /^localhost(:\d+)?$/,
    /^127\.0\.0\.1(:\d+)?$/,
    /\.vetify\.app$/,
    /\.vercel\.app$/,
    /\.vercel\.dev$/,
    /^vetify\./,
  ];

  return !systemPatterns.some(pattern => pattern.test(normalizedHost));
}
