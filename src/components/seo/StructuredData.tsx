import type {
  Organization,
  SoftwareApplication,
  WebPage,
  Article,
  Product,
  LocalBusiness,
  Service,
} from '@/lib/seo/structured-data';
import type { BreadcrumbList } from '@/lib/seo/breadcrumbs';
import type { FAQPage } from '@/lib/seo/faq-schema';

type StructuredDataType =
  | Organization
  | SoftwareApplication
  | WebPage
  | Article
  | Product
  | LocalBusiness
  | Service
  | BreadcrumbList
  | FAQPage
  | Organization[]
  | SoftwareApplication[]
  | WebPage[]
  | Article[]
  | Product[]
  | LocalBusiness[]
  | Service[]
  | BreadcrumbList[]
  | FAQPage[];

/**
 * Filter out null/undefined items from structured data array
 * and ensure all items have @context defined
 */
function sanitizeStructuredData(data: StructuredDataType): StructuredDataType | null {
  // Handle null/undefined
  if (!data) {
    return null;
  }

  // Handle arrays - filter out invalid items
  if (Array.isArray(data)) {
    const filtered = data.filter(
      (item) => item && typeof item === 'object' && '@context' in item
    );
    return filtered.length > 0 ? filtered : null;
  }

  // Handle single object - verify @context exists
  if (typeof data === 'object' && '@context' in data) {
    return data;
  }

  return null;
}

/**
 * Render structured data script tag(s)
 * Server component for adding JSON-LD structured data to pages.
 *
 * When given an array of schemas, renders one <script type="application/ld+json">
 * per schema (Google Search Central recommends separate scripts; this also
 * prevents third-party JSON-LD scanners — e.g. Umami's analytics SDK — from
 * crashing when they parse a script and call `parsed["@context"].toLowerCase()`
 * on what they expect to be an object but is actually an array. See Sentry
 * VETIFY-NEXTJS-1K.
 */
export function StructuredData({
  data,
}: {
  data: StructuredDataType;
}) {
  const sanitizedData = sanitizeStructuredData(data);

  if (!sanitizedData) {
    return null;
  }

  // Note: dangerouslySetInnerHTML is safe here because the content is
  // JSON serialized from our own schema generation functions, not user input.
  if (Array.isArray(sanitizedData)) {
    return (
      <>
        {sanitizedData.map((schema, i) => {
          const type = (schema as { '@type'?: string })['@type'] ?? 'Schema';
          return (
            <script
              key={`ld-${type}-${i}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
          );
        })}
      </>
    );
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(sanitizedData) }}
    />
  );
}
