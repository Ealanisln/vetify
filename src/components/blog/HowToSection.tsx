'use client';

import Image from 'next/image';
import { render } from 'storyblok-rich-text-react-renderer';
import type { HowToStepContent } from '@/lib/storyblok/types';
import { StructuredData } from '@/components/seo/StructuredData';
import {
  generateHowToSchema,
  transformHowToSteps,
} from '@/lib/seo/howto-schema';
import { getStoryblokImageUrl } from '@/lib/storyblok/client';

interface HowToSectionProps {
  title?: string;
  description?: string;
  steps: HowToStepContent[];
  articleUrl?: string;
}

/**
 * HowTo Section component with structured data
 * Renders step-by-step guide with HowTo schema for rich results
 */
export function HowToSection({
  title = 'Guía Paso a Paso',
  description,
  steps,
  articleUrl,
}: HowToSectionProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  // Transform steps for schema
  const schemaSteps = transformHowToSteps(
    steps.map((step) => ({
      title: step.title,
      description: step.description,
      image: step.image,
    }))
  );

  // Generate HowTo structured data
  const howToSchema = generateHowToSchema(
    title,
    description || `Aprende cómo completar estos ${steps.length} pasos.`,
    schemaSteps,
    { articleUrl }
  );

  return (
    <>
      <StructuredData data={howToSchema} />

      <section className="my-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mb-8">{description}</p>
        )}

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div
              key={step._uid || index}
              id={`paso-${index + 1}`}
              className="relative pl-12 md:pl-16"
            >
              {/* Step number */}
              <div className="absolute left-0 top-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#75a99c] text-white flex items-center justify-center font-bold text-lg">
                {step.step_number || index + 1}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-4 md:left-5 top-10 md:top-12 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
              )}

              {/* Step content */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 md:p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {step.title}
                </h3>

                {/* Step image */}
                {step.image?.filename && (
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                    <Image
                      src={getStoryblokImageUrl(step.image.filename, {
                        width: 600,
                        height: 338,
                      })}
                      alt={step.image.alt || step.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 600px"
                    />
                  </div>
                )}

                {/* Step description */}
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
                  {render(step.description)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
