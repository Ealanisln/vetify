'use client';

import { useState, useEffect } from 'react';
import type { ISbRichtext } from 'storyblok-js-client';
import { extractHeadings } from '@/lib/storyblok/client';

interface TableOfContentsProps {
  content: ISbRichtext;
}

interface Heading {
  level: number;
  text: string;
  id: string;
}

/**
 * Table of Contents component
 * Extracts headings from rich text content and renders a navigable TOC
 */
export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [headings, setHeadings] = useState<Heading[]>([]);

  // Extract headings on mount
  useEffect(() => {
    const extractedHeadings = extractHeadings(content);
    // Only include h2 and h3 for cleaner TOC
    const filteredHeadings = extractedHeadings.filter(
      (h) => h.level === 2 || h.level === 3
    );
    setHeadings(filteredHeadings);
  }, [content]);

  // Track active section on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  // Handle click to scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Account for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav
      className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      aria-label="Tabla de contenidos"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide mb-4">
        Contenido
      </h3>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: heading.level === 3 ? '1rem' : '0' }}
          >
            <button
              onClick={() => scrollToSection(heading.id)}
              className={`text-left text-sm transition-colors ${
                activeId === heading.id
                  ? 'text-[#75a99c] font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-[#75a99c]'
              }`}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
