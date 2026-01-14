import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPosts, getAuthor, getAllAuthorSlugs } from '@/lib/storyblok/api';
import { BLOG_REVALIDATE_TIME } from '@/lib/storyblok/client';
import { generateMetadata as generateSeoMetadata, createPageSEO } from '@/lib/seo/metadata';
import { StructuredData } from '@/components/seo/StructuredData';
import { generateWebPageSchema } from '@/lib/seo/structured-data';
import { generateBreadcrumbSchema } from '@/lib/seo/breadcrumbs';
import { RichTextRenderer } from '@/components/blog/RichTextRenderer';
import Footer from '@/components/footer/Footer';
import type { BlogPost } from '@/lib/storyblok/types';

export const revalidate = BLOG_REVALIDATE_TIME;
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ author: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllAuthorSlugs();
  return slugs.map((author) => ({ author }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { author: authorSlug } = await params;
  const author = await getAuthor(authorSlug);

  if (!author) {
    return { title: 'Autor no encontrado' };
  }

  const seoConfig = createPageSEO(
    `${author.name} - Autor en Vetify`,
    author.role
      ? `${author.name}, ${author.role}. Lee sus artículos en el blog de Vetify.`
      : `Artículos escritos por ${author.name} en el blog de Vetify.`,
    {
      path: `/blog/autor/${author.slug}`,
      ogImage: author.avatar?.url,
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
        {post.category && (
          <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#75a99c]/10 text-[#75a99c] mb-3">
            {post.category}
          </span>
        )}
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

const socialIcons: Record<string, React.ReactNode> = {
  twitter: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  instagram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  website: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
};

export default async function AuthorPage({ params }: PageProps) {
  const { author: authorSlug } = await params;
  const [author, postsResponse] = await Promise.all([
    getAuthor(authorSlug),
    getBlogPosts({ perPage: 12, filters: { author: authorSlug } }),
  ]);

  if (!author) {
    notFound();
  }

  const { items: posts } = postsResponse;

  const webPageSchema = generateWebPageSchema(
    `${author.name} - Autor`,
    author.role || `Artículos de ${author.name}`,
    `/blog/autor/${author.slug}`,
    'es'
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: author.name, path: `/blog/autor/${author.slug}` },
  ]);

  return (
    <>
      <StructuredData data={[webPageSchema, breadcrumbSchema]} />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#75a99c]/10 to-[#75a99c]/5 dark:from-gray-800 dark:to-gray-900 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="mb-8" aria-label="Breadcrumb">
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
                  {author.name}
                </li>
              </ol>
            </nav>

            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar */}
              {author.avatar && (
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl flex-shrink-0">
                  <Image
                    src={author.avatar.url}
                    alt={author.avatar.alt}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Info */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {author.name}
                </h1>
                {author.role && (
                  <p className="text-lg text-[#75a99c] font-medium mb-4">
                    {author.role}
                  </p>
                )}
                {author.bio && (
                  <div className="prose prose-gray dark:prose-invert max-w-2xl mb-4">
                    <RichTextRenderer content={author.bio} />
                  </div>
                )}

                {/* Social Links */}
                {author.socialLinks && author.socialLinks.length > 0 && (
                  <div className="flex gap-3 mt-4">
                    {author.socialLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-[#75a99c] hover:border-[#75a99c] transition-colors"
                        aria-label={link.platform}
                      >
                        {socialIcons[link.platform] || socialIcons.website}
                      </a>
                    ))}
                  </div>
                )}

                <p className="mt-4 text-sm text-gray-500">
                  {postsResponse.total} {postsResponse.total === 1 ? 'artículo publicado' : 'artículos publicados'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Posts */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Artículos de {author.name}
          </h2>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.uuid} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400">
                Este autor aún no ha publicado artículos.
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
