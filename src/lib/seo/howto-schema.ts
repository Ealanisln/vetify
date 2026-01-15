/**
 * HowTo Structured Data Schema
 *
 * Generates HowTo schema for step-by-step guides and tutorials.
 * This helps articles appear as rich results in Google Search.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/how-to
 */

import { getBaseUrl } from './config';

export interface HowToStep {
  '@type': 'HowToStep';
  position: number;
  name: string;
  text: string;
  image?: string;
  url?: string;
}

export interface HowToSupply {
  '@type': 'HowToSupply';
  name: string;
}

export interface HowToTool {
  '@type': 'HowToTool';
  name: string;
}

export interface HowToSchema {
  '@context': 'https://schema.org';
  '@type': 'HowTo';
  name: string;
  description: string;
  image?: string;
  totalTime?: string;
  estimatedCost?: {
    '@type': 'MonetaryAmount';
    currency: string;
    value: string;
  };
  supply?: HowToSupply[];
  tool?: HowToTool[];
  step: HowToStep[];
}

export interface HowToStepInput {
  title: string;
  description: string;
  image?: string;
}

/**
 * Generate HowTo structured data for step-by-step guides
 *
 * @param title - The title of the how-to guide
 * @param description - A brief description of what the guide teaches
 * @param steps - Array of step objects with title, description, and optional image
 * @param options - Optional configuration for the schema
 * @returns HowTo JSON-LD schema
 *
 * @example
 * ```ts
 * const howToSchema = generateHowToSchema(
 *   'Cómo bañar a tu perro',
 *   'Guía paso a paso para bañar a tu perro en casa de forma segura.',
 *   [
 *     { title: 'Prepara el área', description: 'Coloca toallas y ten el champú listo.' },
 *     { title: 'Moja el pelaje', description: 'Usa agua tibia para mojar todo el cuerpo.' },
 *     { title: 'Aplica champú', description: 'Masajea suavemente el champú en el pelaje.' },
 *   ],
 *   { totalTimeMinutes: 30, image: '/images/dog-bath.jpg' }
 * );
 * ```
 */
export function generateHowToSchema(
  title: string,
  description: string,
  steps: HowToStepInput[],
  options: {
    image?: string;
    totalTimeMinutes?: number;
    supplies?: string[];
    tools?: string[];
    estimatedCostMXN?: number;
    articleUrl?: string;
  } = {}
): HowToSchema {
  const baseUrl = getBaseUrl();

  const schema: HowToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.description,
      ...(step.image && {
        image: step.image.startsWith('http') ? step.image : `${baseUrl}${step.image}`,
      }),
      ...(options.articleUrl && {
        url: `${options.articleUrl}#paso-${index + 1}`,
      }),
    })),
  };

  // Add optional image
  if (options.image) {
    schema.image = options.image.startsWith('http')
      ? options.image
      : `${baseUrl}${options.image}`;
  }

  // Add total time in ISO 8601 duration format
  if (options.totalTimeMinutes) {
    schema.totalTime = `PT${options.totalTimeMinutes}M`;
  }

  // Add supplies
  if (options.supplies && options.supplies.length > 0) {
    schema.supply = options.supplies.map((name) => ({
      '@type': 'HowToSupply',
      name,
    }));
  }

  // Add tools
  if (options.tools && options.tools.length > 0) {
    schema.tool = options.tools.map((name) => ({
      '@type': 'HowToTool',
      name,
    }));
  }

  // Add estimated cost
  if (options.estimatedCostMXN !== undefined) {
    schema.estimatedCost = {
      '@type': 'MonetaryAmount',
      currency: 'MXN',
      value: options.estimatedCostMXN.toString(),
    };
  }

  return schema;
}

/**
 * Extract plain text from Storyblok rich text for HowTo steps
 */
export function extractTextFromRichText(content: unknown): string {
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
    return node.content.map(extractTextFromRichText).join(' ').trim();
  }

  return '';
}

/**
 * Transform Storyblok HowTo blocks to schema-ready steps
 */
export function transformHowToSteps(
  blocks: Array<{
    title: string;
    description: unknown;
    image?: { filename?: string; alt?: string };
  }>
): HowToStepInput[] {
  return blocks.map((block) => ({
    title: block.title,
    description: extractTextFromRichText(block.description),
    image: block.image?.filename,
  }));
}
