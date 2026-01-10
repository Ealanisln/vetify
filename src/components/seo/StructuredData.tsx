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
 * Render structured data script tag
 * Server component for adding JSON-LD structured data to pages
 *
 * Note: This component sanitizes data to prevent errors with analytics
 * scripts (like Umami) that process JSON-LD by ensuring @context is always defined.
 */
export function StructuredData({
  data,
}: {
  data: StructuredDataType;
}) {
  const sanitizedData = sanitizeStructuredData(data);

  // Don't render anything if data is invalid
  if (!sanitizedData) {
    return null;
  }

  // Note: dangerouslySetInnerHTML is safe here because the content is
  // JSON serialized from our own schema generation functions, not user input.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(sanitizedData),
      }}
    />
  );
}
