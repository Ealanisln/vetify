'use client';

import { useState } from 'react';
import { render } from 'storyblok-rich-text-react-renderer';
import type { FAQBlockContent } from '@/lib/storyblok/types';
import { StructuredData } from '@/components/seo/StructuredData';

interface FAQSectionProps {
  items: FAQBlockContent[];
}

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Single FAQ item with accordion behavior
 */
function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-gray-900 dark:text-gray-100 pr-4">
          {question}
        </span>
        <span
          className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-[#75a99c]/10 text-[#75a99c] transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}
      >
        <div className="text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none">
          {answer}
        </div>
      </div>
    </div>
  );
}

/**
 * FAQ Section component with structured data
 * Renders FAQ items in an accordion and includes FAQPage schema
 */
export function FAQSection({ items }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items || items.length === 0) {
    return null;
  }

  // Generate FAQ structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: extractTextFromRichText(item.answer),
      },
    })),
  };

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <StructuredData data={faqSchema} />

      <section className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Preguntas Frecuentes
        </h2>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item, index) => (
            <FAQItem
              key={item._uid || index}
              question={item.question}
              answer={render(item.answer)}
              isOpen={openIndex === index}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>
      </section>
    </>
  );
}

/**
 * Extract plain text from Storyblok rich text for structured data
 */
function extractTextFromRichText(content: unknown): string {
  if (!content || typeof content !== 'object') return '';

  const node = content as {
    type?: string;
    text?: string;
    content?: unknown[];
  };

  if (node.type === 'text' && node.text) {
    return node.text;
  }

  if (Array.isArray(node.content)) {
    return node.content.map(extractTextFromRichText).join(' ');
  }

  return '';
}
