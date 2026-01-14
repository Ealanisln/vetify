import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPosts, getCategory, getAllCategorySlugs } from '@/lib/storyblok/api';
import { BLOG_REVALIDATE_TIME } from '@/lib/storyblok/client';
import { generateMetadata as generateSeoMetadata, createPageSEO } from '@/lib/seo/metadata';
import { StructuredData } from '@/components/seo/StructuredData';
import { generateWebPageSchema } from '@/lib/seo/structured-data';
import { generateBreadcrumbSchema } from '@/lib/seo/breadcrumbs';
import Footer from '@/components/footer/Footer';
import type { BlogPost } from '@/lib/storyblok/types';

export const revalidate = BLOG_REVALIDATE_TIME;
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getCategory(categorySlug);

  if (!category) {
    return { title: 'Categoría no encontrada' };
  }

  const seoConfig = createPageSEO(
    `${category.name} - Blog Vetify`,
    category.description || `Artículos sobre ${category.name.toLowerCase()} en el blog de Vetify.`,
    {
      path: `/blog/categoria/${category.slug}`,
      keywords: [category.name.toLowerCase(), 'blog veterinario', 'mascotas'],
      lang: 'es',
    }
  );

  return generateSeoMetadata(seoConfig, 'es');
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      {post.featuredImage && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-5">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#75a99c] transition-colors line-clamp-2 mb-2">
          {post.title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span>{post.readingTimeMinutes} min</span>
        </div>
      </div>
    </Link>
  );
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const [category, postsResponse] = await Promise.all([
    getCategory(categorySlug),
    getBlogPosts({ perPage: 12, filters: { category: categorySlug } }),
  ]);

  if (!category) {
    notFound();
  }

  const { items: posts } = postsResponse;

  const webPageSchema = generateWebPageSchema(
    `${category.name} - Blog Vetify`,
    category.description || `Artículos sobre ${category.name}`,
    `/blog/categoria/${category.slug}`,
    'es'
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: category.name, path: `/blog/categoria/${category.slug}` },
  ]);

  return (
    <>
      <StructuredData data={[webPageSchema, breadcrumbSchema]} />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#75a99c]/10 to-[#75a99c]/5 dark:from-gray-800 dark:to-gray-900 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-[#75a99c]">
                    Inicio
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
                <li>
                  <Link href="/blog" className="text-gray-500 dark:text-gray-400 hover:text-[#75a99c]">
                    Blog
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
                <li className="text-gray-900 dark:text-gray-100 font-medium">
                  {category.name}
                </li>
              </ol>
            </nav>

            <div className="flex items-center gap-3 mb-4">
              {category.icon && (
                <span className="text-4xl">{category.icon}</span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
                {category.name}
              </h1>
            </div>

            {category.description && (
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                {category.description}
              </p>
            )}

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              {postsResponse.total} {postsResponse.total === 1 ? 'artículo' : 'artículos'}
            </p>
          </div>
        </section>

        {/* Posts */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.uuid} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400">
                No hay artículos en esta categoría todavía.
              </p>
              <Link
                href="/blog"
                className="mt-4 inline-block text-[#75a99c] hover:underline"
              >
                Ver todos los artículos
              </Link>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
