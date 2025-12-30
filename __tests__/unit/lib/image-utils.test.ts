import {
  PLACEHOLDER_BLUR_SVG,
  PLACEHOLDER_BLUR_GRAY,
  PLACEHOLDER_BLUR,
  imageSizes,
} from '@/lib/image-utils';

describe('image-utils', () => {
  describe('PLACEHOLDER_BLUR_SVG', () => {
    it('should be a valid SVG data URL', () => {
      expect(PLACEHOLDER_BLUR_SVG).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('should contain valid base64 encoded content', () => {
      const base64Content = PLACEHOLDER_BLUR_SVG.replace(
        'data:image/svg+xml;base64,',
        ''
      );
      expect(() => Buffer.from(base64Content, 'base64')).not.toThrow();
    });

    it('should decode to valid SVG markup', () => {
      const base64Content = PLACEHOLDER_BLUR_SVG.replace(
        'data:image/svg+xml;base64,',
        ''
      );
      const decoded = Buffer.from(base64Content, 'base64').toString('utf-8');
      expect(decoded).toContain('<svg');
      expect(decoded).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(decoded).toContain('linearGradient');
      expect(decoded).toContain('shimmer');
    });
  });

  describe('PLACEHOLDER_BLUR_GRAY', () => {
    it('should be a valid JPEG data URL', () => {
      expect(PLACEHOLDER_BLUR_GRAY).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should contain valid base64 encoded content', () => {
      const base64Content = PLACEHOLDER_BLUR_GRAY.replace(
        'data:image/jpeg;base64,',
        ''
      );
      expect(() => Buffer.from(base64Content, 'base64')).not.toThrow();
    });

    it('should be smaller than the SVG placeholder', () => {
      expect(PLACEHOLDER_BLUR_GRAY.length).toBeLessThan(
        PLACEHOLDER_BLUR_SVG.length
      );
    });
  });

  describe('PLACEHOLDER_BLUR', () => {
    it('should default to PLACEHOLDER_BLUR_GRAY', () => {
      expect(PLACEHOLDER_BLUR).toBe(PLACEHOLDER_BLUR_GRAY);
    });

    it('should be a valid data URL', () => {
      expect(PLACEHOLDER_BLUR).toMatch(/^data:image\/(jpeg|svg\+xml);base64,/);
    });
  });

  describe('imageSizes', () => {
    describe('hero', () => {
      it('should be a string', () => {
        expect(typeof imageSizes.hero).toBe('string');
      });

      it('should contain media query for mobile breakpoint', () => {
        expect(imageSizes.hero).toContain('max-width: 768px');
      });

      it('should specify 100vw for mobile', () => {
        expect(imageSizes.hero).toContain('100vw');
      });

      it('should specify fixed width for desktop', () => {
        expect(imageSizes.hero).toContain('600px');
      });
    });

    describe('gallery', () => {
      it('should be a string', () => {
        expect(typeof imageSizes.gallery).toBe('string');
      });

      it('should contain multiple breakpoints', () => {
        expect(imageSizes.gallery).toContain('max-width: 640px');
        expect(imageSizes.gallery).toContain('max-width: 768px');
      });

      it('should have responsive column widths', () => {
        expect(imageSizes.gallery).toContain('50vw');
        expect(imageSizes.gallery).toContain('33vw');
        expect(imageSizes.gallery).toContain('25vw');
      });
    });

    describe('card', () => {
      it('should be a string', () => {
        expect(typeof imageSizes.card).toBe('string');
      });

      it('should contain responsive breakpoints', () => {
        expect(imageSizes.card).toContain('max-width: 640px');
        expect(imageSizes.card).toContain('max-width: 1024px');
      });

      it('should have responsive widths for different screen sizes', () => {
        expect(imageSizes.card).toContain('100vw');
        expect(imageSizes.card).toContain('50vw');
        expect(imageSizes.card).toContain('33vw');
      });
    });

    describe('thumbnail', () => {
      it('should be a string', () => {
        expect(typeof imageSizes.thumbnail).toBe('string');
      });

      it('should be a fixed 100px size', () => {
        expect(imageSizes.thumbnail).toBe('100px');
      });
    });

    it('should have all expected size keys', () => {
      const expectedKeys = ['hero', 'gallery', 'card', 'thumbnail'];
      expect(Object.keys(imageSizes)).toEqual(
        expect.arrayContaining(expectedKeys)
      );
      expect(Object.keys(imageSizes).length).toBe(expectedKeys.length);
    });

    it('should have all values as strings', () => {
      Object.values(imageSizes).forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });
  });
});
