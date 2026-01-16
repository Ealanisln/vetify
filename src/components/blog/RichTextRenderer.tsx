'use client';

import { render } from 'storyblok-rich-text-react-renderer';
import Image from 'next/image';
import Link from 'next/link';
import type { ISbRichtext } from 'storyblok-js-client';
import { getStoryblokImageUrl } from '@/lib/storyblok/client';

interface RichTextRendererProps {
  content: ISbRichtext;
}

/**
 * Rich text renderer for Storyblok content
 * Renders rich text content with custom components for images, links, etc.
 */
export function RichTextRenderer({ content }: RichTextRendererProps) {
  if (!content) {
    return null;
  }

  return (
    <div className="rich-text-content">
      {render(content, {
        markResolvers: {
          link: (children, props) => {
            const { href, target, linktype } = props;

            // Internal links
            if (linktype === 'story' || (href && !href.startsWith('http'))) {
              return (
                <Link
                  href={href || '#'}
                  className="text-[#75a99c] hover:underline"
                >
                  {children}
                </Link>
              );
            }

            // External links
            return (
              <a
                href={href}
                target={target || '_blank'}
                rel="noopener noreferrer"
                className="text-[#75a99c] hover:underline"
              >
                {children}
              </a>
            );
          },
          bold: (children) => <strong className="font-semibold">{children}</strong>,
          italic: (children) => <em>{children}</em>,
          code: (children) => (
            <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
              {children}
            </code>
          ),
        },
        nodeResolvers: {
          heading: (children, props) => {
            const { level } = props;
            const id = generateHeadingId(children);

            const headingClasses: Record<number, string> = {
              1: 'text-3xl font-bold mt-8 mb-4',
              2: 'text-2xl font-bold mt-8 mb-4',
              3: 'text-xl font-semibold mt-6 mb-3',
              4: 'text-lg font-semibold mt-4 mb-2',
              5: 'text-base font-semibold mt-4 mb-2',
              6: 'text-sm font-semibold mt-4 mb-2',
            };

            const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

            return (
              <HeadingTag id={id} className={headingClasses[level] || ''}>
                {children}
              </HeadingTag>
            );
          },
          paragraph: (children) => (
            <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
              {children}
            </p>
          ),
          bullet_list: (children) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">
              {children}
            </ul>
          ),
          ordered_list: (children) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">
              {children}
            </ol>
          ),
          list_item: (children) => <li className="pl-2">{children}</li>,
          blockquote: (children) => (
            <blockquote className="border-l-4 border-[#75a99c] pl-4 py-2 my-6 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-r">
              {children}
            </blockquote>
          ),
          code_block: (children, _props) => (
            <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
              <code className="text-sm font-mono">{children}</code>
            </pre>
          ),
          horizontal_rule: () => (
            <hr className="my-8 border-t border-gray-200 dark:border-gray-700" />
          ),
          image: (children, props) => {
            const { src, alt, title } = props;

            if (!src) return null;

            const optimizedSrc = getStoryblokImageUrl(src, {
              width: 800,
              quality: 85,
            });

            return (
              <figure className="my-8">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={optimizedSrc || src}
                    alt={alt || ''}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>
                {(title || alt) && (
                  <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {title || alt}
                  </figcaption>
                )}
              </figure>
            );
          },
        },
        blokResolvers: {
          // Custom block resolvers for Storyblok components
          callout_box: (props) => {
            const { type, title, content: calloutContent } = props;

            const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
              info: {
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                border: 'border-blue-200 dark:border-blue-800',
                icon: 'ℹ️',
              },
              warning: {
                bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                border: 'border-yellow-200 dark:border-yellow-800',
                icon: '⚠️',
              },
              tip: {
                bg: 'bg-green-50 dark:bg-green-900/20',
                border: 'border-green-200 dark:border-green-800',
                icon: '💡',
              },
              important: {
                bg: 'bg-red-50 dark:bg-red-900/20',
                border: 'border-red-200 dark:border-red-800',
                icon: '❗',
              },
            };

            const style = typeStyles[type] || typeStyles.info;

            return (
              <div
                className={`my-6 p-4 rounded-lg border ${style.bg} ${style.border}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{style.icon}</span>
                  <div>
                    {title && (
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {title}
                      </h4>
                    )}
                    <div className="text-gray-700 dark:text-gray-300">
                      {calloutContent && render(calloutContent)}
                    </div>
                  </div>
                </div>
              </div>
            );
          },
        },
      })}
    </div>
  );
}

/**
 * Generate a URL-safe ID from heading content
 */
function generateHeadingId(children: React.ReactNode): string {
  const text = extractTextFromChildren(children);
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract text content from React children
 */
function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('');
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return extractTextFromChildren((children as { props: { children: React.ReactNode } }).props.children);
  }
  return '';
}
