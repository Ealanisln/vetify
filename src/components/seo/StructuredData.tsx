import type {
  Organization,
  SoftwareApplication,
  WebPage,
  Article,
  Product,
} from '@/lib/seo/structured-data';
import type { BreadcrumbList } from '@/lib/seo/breadcrumbs';
import type { FAQPage } from '@/lib/seo/faq-schema';

type StructuredDataType =
  | Organization
  | SoftwareApplication
  | WebPage
  | Article
  | Product
  | BreadcrumbList
  | FAQPage
  | Organization[]
  | SoftwareApplication[]
  | WebPage[]
  | Article[]
  | Product[]
  | BreadcrumbList[]
  | FAQPage[];

/**
 * Render structured data script tag
 * Server component for adding JSON-LD structured data to pages
 */
export function StructuredData({
  data,
}: {
  data: StructuredDataType;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}
