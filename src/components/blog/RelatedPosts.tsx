import Link from 'next/link';
import Image from 'next/image';
import type { BlogPost } from '@/lib/storyblok/types';

interface RelatedPostsProps {
  posts: BlogPost[];
  title?: string;
}

/**
 * Related Posts Section
 * Displays a grid of related blog posts at the end of an article
 */
export function RelatedPosts({
  posts,
  title = 'Artículos Relacionados',
}: RelatedPostsProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-800/50 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <RelatedPostCard key={post.uuid} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Image */}
      {post.featuredImage && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        {post.category && (
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-[#75a99c]/10 text-[#75a99c] mb-2">
            {post.category}
          </span>
        )}

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#75a99c] transition-colors line-clamp-2 mb-2">
          {post.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{post.readingTimeMinutes} min de lectura</span>
        </div>
      </div>
    </Link>
  );
}
