import type {
  Organization,
  SoftwareApplication,
  WebPage,
  Article,
} from '@/lib/seo/structured-data';

/**
 * Render structured data script tag
 * Server component for adding JSON-LD structured data to pages
 */
export function StructuredData({
  data,
}: {
  data: Organization | SoftwareApplication | WebPage | Article | Array<any>;
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
