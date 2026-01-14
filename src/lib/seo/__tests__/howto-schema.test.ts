/**
 * Unit tests for HowTo structured data schema generator
 * Tests for step-by-step guide schema generation for SEO
 */

import {
  generateHowToSchema,
  extractTextFromRichText,
  transformHowToSteps,
  type HowToStepInput,
} from '../howto-schema';

// Mock the config module
jest.mock('../config', () => ({
  getBaseUrl: jest.fn(() => 'https://vetify.mx'),
}));

describe('HowTo Schema', () => {
  describe('generateHowToSchema', () => {
    const basicSteps: HowToStepInput[] = [
      { title: 'Paso 1', description: 'Primera descripción' },
      { title: 'Paso 2', description: 'Segunda descripción' },
      { title: 'Paso 3', description: 'Tercera descripción' },
    ];

    it('should generate basic HowTo schema with required fields', () => {
      const schema = generateHowToSchema(
        'Cómo bañar a tu perro',
        'Guía paso a paso para bañar a tu mascota',
        basicSteps
      );

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('HowTo');
      expect(schema.name).toBe('Cómo bañar a tu perro');
      expect(schema.description).toBe('Guía paso a paso para bañar a tu mascota');
      expect(schema.step).toHaveLength(3);
    });

    it('should generate steps with correct structure', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps);

      schema.step.forEach((step, index) => {
        expect(step['@type']).toBe('HowToStep');
        expect(step.position).toBe(index + 1);
        expect(step.name).toBe(basicSteps[index].title);
        expect(step.text).toBe(basicSteps[index].description);
      });
    });

    it('should include step images when provided', () => {
      const stepsWithImages: HowToStepInput[] = [
        { title: 'Paso 1', description: 'Desc 1', image: '/images/step1.jpg' },
        { title: 'Paso 2', description: 'Desc 2', image: 'https://cdn.example.com/step2.jpg' },
      ];

      const schema = generateHowToSchema('Test', 'Description', stepsWithImages);

      expect(schema.step[0].image).toBe('https://vetify.mx/images/step1.jpg');
      expect(schema.step[1].image).toBe('https://cdn.example.com/step2.jpg');
    });

    it('should not include image property when not provided', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps);

      schema.step.forEach((step) => {
        expect(step.image).toBeUndefined();
      });
    });

    it('should add main image when provided in options', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps, {
        image: '/images/main.jpg',
      });

      expect(schema.image).toBe('https://vetify.mx/images/main.jpg');
    });

    it('should handle external image URLs', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps, {
        image: 'https://external.com/image.jpg',
      });

      expect(schema.image).toBe('https://external.com/image.jpg');
    });

    it('should add totalTime in ISO 8601 format', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps, {
        totalTimeMinutes: 30,
      });

      expect(schema.totalTime).toBe('PT30M');
    });

    it('should not include totalTime when not provided', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps);

      expect(schema.totalTime).toBeUndefined();
    });

    it('should add supplies when provided', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps, {
        supplies: ['Champú para perros', 'Toallas', 'Cepillo'],
      });

      expect(schema.supply).toHaveLength(3);
      expect(schema.supply![0]).toEqual({
        '@type': 'HowToSupply',
        name: 'Champú para perros',
      });
      expect(schema.supply![1]).toEqual({
        '@type': 'HowToSupply',
        name: 'Toallas',
      });
    });

    it('should not include supplies when array is empty', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps, {
        supplies: [],
      });

      expect(schema.supply).toBeUndefined();
    });

    it('should add tools when provided', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps, {
        tools: ['Secadora', 'Tijeras'],
      });

      expect(schema.tool).toHaveLength(2);
      expect(schema.tool![0]).toEqual({
        '@type': 'HowToTool',
        name: 'Secadora',
      });
    });

    it('should not include tools when array is empty', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps, {
        tools: [],
      });

      expect(schema.tool).toBeUndefined();
    });

    it('should add estimated cost in MXN', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps, {
        estimatedCostMXN: 250,
      });

      expect(schema.estimatedCost).toEqual({
        '@type': 'MonetaryAmount',
        currency: 'MXN',
        value: '250',
      });
    });

    it('should handle zero estimated cost', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps, {
        estimatedCostMXN: 0,
      });

      expect(schema.estimatedCost).toEqual({
        '@type': 'MonetaryAmount',
        currency: 'MXN',
        value: '0',
      });
    });

    it('should add step URLs with anchors when articleUrl provided', () => {
      const schema = generateHowToSchema('Test', 'Description', basicSteps, {
        articleUrl: 'https://vetify.mx/blog/como-banar-perro',
      });

      expect(schema.step[0].url).toBe('https://vetify.mx/blog/como-banar-perro#paso-1');
      expect(schema.step[1].url).toBe('https://vetify.mx/blog/como-banar-perro#paso-2');
      expect(schema.step[2].url).toBe('https://vetify.mx/blog/como-banar-perro#paso-3');
    });

    it('should generate complete schema with all options', () => {
      const schema = generateHowToSchema(
        'Cómo preparar comida casera para perros',
        'Receta saludable para tu mascota',
        [
          { title: 'Reúne ingredientes', description: 'Consigue pollo, arroz y verduras', image: '/img/step1.jpg' },
          { title: 'Cocina el pollo', description: 'Hierve el pollo sin condimentos', image: '/img/step2.jpg' },
          { title: 'Mezcla todo', description: 'Combina los ingredientes cocidos' },
        ],
        {
          image: '/img/recipe.jpg',
          totalTimeMinutes: 45,
          supplies: ['Pollo', 'Arroz', 'Zanahorias'],
          tools: ['Olla', 'Cuchillo', 'Tabla de cortar'],
          estimatedCostMXN: 150,
          articleUrl: 'https://vetify.mx/blog/comida-casera-perros',
        }
      );

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('HowTo');
      expect(schema.name).toBe('Cómo preparar comida casera para perros');
      expect(schema.image).toBe('https://vetify.mx/img/recipe.jpg');
      expect(schema.totalTime).toBe('PT45M');
      expect(schema.supply).toHaveLength(3);
      expect(schema.tool).toHaveLength(3);
      expect(schema.estimatedCost!.value).toBe('150');
      expect(schema.step).toHaveLength(3);
      expect(schema.step[0].url).toContain('#paso-1');
    });
  });

  describe('extractTextFromRichText', () => {
    it('should return empty string for null/undefined', () => {
      expect(extractTextFromRichText(null)).toBe('');
      expect(extractTextFromRichText(undefined)).toBe('');
    });

    it('should return empty string for non-object values', () => {
      expect(extractTextFromRichText('string')).toBe('');
      expect(extractTextFromRichText(123)).toBe('');
      expect(extractTextFromRichText(true)).toBe('');
    });

    it('should extract text from simple text node', () => {
      const content = {
        type: 'text',
        text: 'Hello world',
      };

      expect(extractTextFromRichText(content)).toBe('Hello world');
    });

    it('should extract text from nested content', () => {
      const content = {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'First ' },
          { type: 'text', text: 'Second' },
        ],
      };

      expect(extractTextFromRichText(content)).toBe('First  Second');
    });

    it('should handle deeply nested content', () => {
      const content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Paragraph 1' },
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Paragraph 2' },
            ],
          },
        ],
      };

      const result = extractTextFromRichText(content);
      expect(result).toContain('Paragraph 1');
      expect(result).toContain('Paragraph 2');
    });

    it('should return empty string for empty content array', () => {
      const content = {
        type: 'paragraph',
        content: [],
      };

      expect(extractTextFromRichText(content)).toBe('');
    });
  });

  describe('transformHowToSteps', () => {
    it('should transform blocks to HowToStepInput format', () => {
      const blocks = [
        {
          title: 'Step One',
          description: { type: 'text', text: 'First step description' },
          image: { filename: 'https://cdn.storyblok.com/step1.jpg', alt: 'Step 1' },
        },
        {
          title: 'Step Two',
          description: { type: 'text', text: 'Second step description' },
        },
      ];

      const result = transformHowToSteps(blocks);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        title: 'Step One',
        description: 'First step description',
        image: 'https://cdn.storyblok.com/step1.jpg',
      });
      expect(result[1]).toEqual({
        title: 'Step Two',
        description: 'Second step description',
        image: undefined,
      });
    });

    it('should handle empty blocks array', () => {
      const result = transformHowToSteps([]);
      expect(result).toEqual([]);
    });

    it('should handle blocks without images', () => {
      const blocks = [
        {
          title: 'No Image Step',
          description: { type: 'text', text: 'Description without image' },
        },
      ];

      const result = transformHowToSteps(blocks);

      expect(result[0].image).toBeUndefined();
    });

    it('should handle complex rich text descriptions', () => {
      const blocks = [
        {
          title: 'Complex Step',
          description: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Part 1 ' },
                  { type: 'text', text: 'Part 2' },
                ],
              },
            ],
          },
        },
      ];

      const result = transformHowToSteps(blocks);

      expect(result[0].description).toContain('Part 1');
      expect(result[0].description).toContain('Part 2');
    });
  });
});
