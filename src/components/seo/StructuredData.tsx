import type {
  Organization,
  SoftwareApplication,
  WebPage,
  Article,
} from '@/lib/seo/structured-data';

type StructuredDataType =
  | Organization
  | SoftwareApplication
  | WebPage
  | Article
  | Organization[]
  | SoftwareApplication[]
  | WebPage[]
  | Article[];

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
