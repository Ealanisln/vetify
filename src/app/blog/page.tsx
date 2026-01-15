import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPosts, getCategories } from '@/lib/storyblok/api';
import { generateMetadata as generateSeoMetadata, createPageSEO } from '@/lib/seo/metadata';
import { StructuredData } from '@/components/seo/StructuredData';
import { generateWebPageSchema } from '@/lib/seo/structured-data';
import { generateBreadcrumbSchema } from '@/lib/seo/breadcrumbs';
import Footer from '@/components/footer/Footer';
import type { BlogPost, BlogCategory } from '@/lib/storyblok/types';

// ISR: Revalidate every hour (3600 seconds)
export const revalidate = 3600;

// Force dynamic to ensure fresh data
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const seoConfig = createPageSEO(
    'Blog - Consejos para el cuidado de mascotas',
    'Artículos, guías y consejos sobre el cuidado de mascotas, salud veterinaria y las últimas actualizaciones de Vetify.',
    {
      path: '/blog',
      keywords: [
        'blog veterinario',
        'cuidado de mascotas',
        'salud animal',
        'consejos veterinarios',
        'perros',
        'gatos',
        'mascotas',
      ],
      lang: 'es',
    }
  );

  return generateSeoMetadata(seoConfig, 'es');
}

// Post Card Component
function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Featured Image */}
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

      {/* Content */}
      <div className="p-5">
        {/* Category Badge */}
        {post.category && (
          <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#75a99c]/10 text-[#75a99c] mb-3">
            {post.category}
          </span>
        )}

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#75a99c] transition-colors line-clamp-2 mb-2">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span>{post.readingTimeMinutes} min de lectura</span>
        </div>
      </div>
    </Link>
  );
}

// Category Filter Component
function CategoryFilter({
  categories,
  activeCategory,
}: {
  categories: BlogCategory[];
  activeCategory?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Link
        href="/blog"
        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
          !activeCategory
            ? 'bg-[#75a99c] text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        Todos
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/blog/categoria/${category.slug}`}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
            activeCategory === category.slug
              ? 'bg-[#75a99c] text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📝</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Próximamente
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        Estamos preparando contenido increíble para ti. Vuelve pronto para
        descubrir artículos sobre el cuidado de mascotas y consejos veterinarios.
      </p>
    </div>
  );
}

export default async function BlogPage() {
  // Fetch blog posts and categories
  const [postsResponse, categories] = await Promise.all([
    getBlogPosts({ page: 1, perPage: 12 }),
    getCategories(),
  ]);

  const { items: posts } = postsResponse;

  // Generate structured data
  const webPageSchema = generateWebPageSchema(
    'Blog - Consejos para el cuidado de mascotas',
    'Artículos, guías y consejos sobre el cuidado de mascotas y salud veterinaria.',
    '/blog',
    'es'
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', path: '/' },
    { name: 'Blog', path: '/blog' },
  ]);

  return (
    <>
      <StructuredData data={[webPageSchema, breadcrumbSchema]} />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#75a99c]/10 to-[#75a99c]/5 dark:from-gray-800 dark:to-gray-900 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <li className="text-gray-900 dark:text-gray-100 font-medium">
                  Blog
                </li>
              </ol>
            </nav>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Blog de Vetify
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
              Descubre artículos, guías y consejos sobre el cuidado de mascotas,
              salud veterinaria y las últimas novedades de nuestra plataforma.
            </p>
          </div>
        </section>

        {/* Posts Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Category Filter */}
          {categories.length > 0 && (
            <CategoryFilter categories={categories} />
          )}

          {/* Posts Grid */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.uuid} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}

          {/* Pagination placeholder - to be implemented */}
          {postsResponse.totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {posts.length} de {postsResponse.total} artículos
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
