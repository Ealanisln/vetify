import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo/config';
import { SUPPORTED_LANGUAGES } from '@/lib/seo/language';

/**
 * Generate sitemap.xml
 * This helps search engines discover and index your pages
 *
 * Next.js will automatically serve this at /sitemap.xml
 *
 * For large sites with dynamic content, consider using dynamic sitemap generation
 * by fetching data from your database
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const currentDate = new Date();
  const defaultLanguage = 'es'; // Current default language

  // Static pages configuration
  const staticPages = [
    {
      path: '',
      priority: 1.0,
      changeFrequency: 'daily' as const,
    },
    {
      path: '/pricing',
      priority: 0.9,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/features',
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/about',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/contact',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    {
      path: '/blog',
      priority: 0.8,
      changeFrequency: 'daily' as const,
    },
    // Add more static pages as needed
  ];

  // Generate sitemap entries for static pages
  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    // Alternate language URLs (currently only Spanish, ready for English)
    alternates: {
      languages: SUPPORTED_LANGUAGES.reduce(
        (acc, lang) => {
          if (lang === defaultLanguage) {
            acc[lang] = `${baseUrl}${page.path}`;
          }
          // Future: when English is added
          // else {
          //   acc[lang] = `${baseUrl}/${lang}${page.path}`;
          // }
          return acc;
        },
        {} as Record<string, string>
      ),
    },
  }));

  // TODO: Add dynamic routes here
  // Example: Fetch blog posts from database
  // const blogPosts = await fetchBlogPosts();
  // const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: 'monthly',
  //   priority: 0.7,
  //   alternates: {
  //     languages: {
  //       es: `${baseUrl}/blog/${post.slug}`,
  //       // en: `${baseUrl}/en/blog/${post.slug}`,
  //     },
  //   },
  // }));

  // Combine all entries
  return [
    ...staticEntries,
    // ...blogEntries, // Uncomment when you have dynamic content
  ];
}

/**
 * Helper function to fetch dynamic routes for sitemap
 * Use this pattern for blog posts, products, etc.
 */
// async function fetchBlogPosts() {
//   // Example using Prisma
//   // const posts = await prisma.post.findMany({
//   //   where: { published: true },
//   //   select: { slug: true, updatedAt: true },
//   // });
//   // return posts;
//   return [];
// }
