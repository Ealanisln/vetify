import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPost, getRelatedPosts, getAllPostSlugs } from '@/lib/storyblok/api';
import { BLOG_REVALIDATE_TIME } from '@/lib/storyblok/client';
import { generateMetadata as generateSeoMetadata, createArticleSEO } from '@/lib/seo/metadata';
import { StructuredData } from '@/components/seo/StructuredData';
import { generateArticleSchema } from '@/lib/seo/structured-data';
import { generateBreadcrumbSchema } from '@/lib/seo/breadcrumbs';
import Footer from '@/components/footer/Footer';
import { RichTextRenderer } from '@/components/blog/RichTextRenderer';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ArticleShare } from '@/components/blog/ArticleShare';
import { FAQSection } from '@/components/blog/FAQSection';
import { RelatedPosts } from '@/components/blog/RelatedPosts';

// ISR: Revalidate every hour
export const revalidate = BLOG_REVALIDATE_TIME;

// Force dynamic for fresh content
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all posts
export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for the article
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: 'Artículo no encontrado',
    };
  }

  const seoConfig = createArticleSEO(
    post.metaTitle || post.title,
    post.metaDescription || post.excerpt,
    {
      path: `/blog/${post.slug}`,
      keywords: post.keywords,
      ogImage: post.featuredImage?.url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      author: post.author,
      lang: 'es',
    }
  );

  return generateSeoMetadata(seoConfig, 'es');
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Fetch related posts
  const relatedPosts = await getRelatedPosts(post, 3);

  // Generate structured data
  const articleSchema = generateArticleSchema(
    post.title,
    post.excerpt,
    `/blog/${post.slug}`,
    post.publishedAt,
    {
      modifiedDate: post.updatedAt,
      image: post.featuredImage?.url,
      authorName: post.author || 'Vetify',
      lang: 'es',
    }
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  // Format date
  const publishDate = new Date(post.publishedAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <StructuredData data={[articleSchema, breadcrumbSchema]} />

      <main className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <article>
          <header className="bg-gradient-to-br from-[#75a99c]/10 to-[#75a99c]/5 dark:from-gray-800 dark:to-gray-900 py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Breadcrumbs */}
              <nav className="mb-6" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm">
                  <li>
                    <Link
                      href="/"
                      className="text-gray-500 dark:text-gray-400 hover:text-[#75a99c]"
                    >
                      Inicio
                    </Link>
                  </li>
                  <li className="text-gray-400">/</li>
                  <li>
                    <Link
                      href="/blog"
                      className="text-gray-500 dark:text-gray-400 hover:text-[#75a99c]"
                    >
                      Blog
                    </Link>
                  </li>
                  <li className="text-gray-400">/</li>
                  <li className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px]">
                    {post.title}
                  </li>
                </ol>
              </nav>

              {/* Category */}
              {post.category && (
                <Link
                  href={`/blog/categoria/${post.category}`}
                  className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-[#75a99c] text-white mb-4 hover:bg-[#5b9788] transition-colors"
                >
                  {post.category}
                </Link>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {post.author && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {post.author}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <time dateTime={post.publishedAt}>{publishDate}</time>
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {post.readingTimeMinutes} min de lectura
                </span>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative w-full max-w-5xl mx-auto -mt-8 px-4 sm:px-6 lg:px-8">
              <div className="relative aspect-[21/9] rounded-xl overflow-hidden shadow-xl">
                <Image
                  src={post.featuredImage.url}
                  alt={post.featuredImage.alt}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1280px) 100vw, 1280px"
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-8">
                {/* Article Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-a:text-[#75a99c] prose-a:no-underline hover:prose-a:underline">
                  <RichTextRenderer content={post.content} />
                </div>

                {/* FAQ Section */}
                {post.faqItems && post.faqItems.length > 0 && (
                  <div className="mt-12">
                    <FAQSection items={post.faqItems} />
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Etiquetas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/blog/etiqueta/${encodeURIComponent(tag)}`}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share */}
                <div className="mt-8">
                  <ArticleShare
                    title={post.title}
                    url={`/blog/${post.slug}`}
                  />
                </div>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-4">
                <div className="sticky top-24 space-y-8">
                  {/* Table of Contents */}
                  {post.showToc && (
                    <TableOfContents content={post.content} />
                  )}

                  {/* Back to Blog */}
                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Link
                      href="/blog"
                      className="flex items-center gap-2 text-[#75a99c] hover:text-[#5b9788] font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Volver al Blog
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <RelatedPosts posts={relatedPosts} />
          )}
        </article>
      </main>

      <Footer />
    </>
  );
}
