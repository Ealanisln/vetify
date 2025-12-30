import {
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  fadeIn,
  scaleIn,
  staggerContainer,
  staggerContainerFast,
  cardVariant,
  imageReveal,
  buttonHover,
  buttonTap,
  cardHover,
  sectionVariant,
  viewportSettings,
  getReducedMotionVariants,
} from '@/components/public/animations';

describe('animations', () => {
  describe('fadeInUp', () => {
    it('should have correct hidden state', () => {
      expect(fadeInUp.hidden).toEqual({
        opacity: 0,
        y: 30,
      });
    });

    it('should have correct visible state', () => {
      expect(fadeInUp.visible).toMatchObject({
        opacity: 1,
        y: 0,
      });
    });

    it('should have transition with easeOutQuad easing', () => {
      const visible = fadeInUp.visible as {
        transition: { duration: number; ease: number[] };
      };
      expect(visible.transition.duration).toBe(0.6);
      expect(visible.transition.ease).toEqual([0.25, 0.46, 0.45, 0.94]);
    });
  });

  describe('fadeInLeft', () => {
    it('should have correct hidden state with negative x', () => {
      expect(fadeInLeft.hidden).toEqual({
        opacity: 0,
        x: -30,
      });
    });

    it('should animate to x: 0', () => {
      expect(fadeInLeft.visible).toMatchObject({
        opacity: 1,
        x: 0,
      });
    });
  });

  describe('fadeInRight', () => {
    it('should have correct hidden state with positive x', () => {
      expect(fadeInRight.hidden).toEqual({
        opacity: 0,
        x: 30,
      });
    });

    it('should animate to x: 0', () => {
      expect(fadeInRight.visible).toMatchObject({
        opacity: 1,
        x: 0,
      });
    });
  });

  describe('fadeIn', () => {
    it('should have correct hidden state with only opacity', () => {
      expect(fadeIn.hidden).toEqual({
        opacity: 0,
      });
    });

    it('should animate to opacity: 1', () => {
      expect(fadeIn.visible).toMatchObject({
        opacity: 1,
      });
    });

    it('should have 0.5s duration', () => {
      const visible = fadeIn.visible as { transition: { duration: number } };
      expect(visible.transition.duration).toBe(0.5);
    });
  });

  describe('scaleIn', () => {
    it('should have correct hidden state with scale', () => {
      expect(scaleIn.hidden).toEqual({
        opacity: 0,
        scale: 0.9,
      });
    });

    it('should animate to scale: 1', () => {
      expect(scaleIn.visible).toMatchObject({
        opacity: 1,
        scale: 1,
      });
    });
  });

  describe('staggerContainer', () => {
    it('should have hidden state with opacity 0', () => {
      expect(staggerContainer.hidden).toEqual({ opacity: 0 });
    });

    it('should have 0.1s staggerChildren delay', () => {
      const visible = staggerContainer.visible as {
        transition: { staggerChildren: number; delayChildren: number };
      };
      expect(visible.transition.staggerChildren).toBe(0.1);
    });

    it('should have 0.2s delayChildren', () => {
      const visible = staggerContainer.visible as {
        transition: { staggerChildren: number; delayChildren: number };
      };
      expect(visible.transition.delayChildren).toBe(0.2);
    });
  });

  describe('staggerContainerFast', () => {
    it('should have 0.08s staggerChildren delay', () => {
      const visible = staggerContainerFast.visible as {
        transition: { staggerChildren: number; delayChildren: number };
      };
      expect(visible.transition.staggerChildren).toBe(0.08);
    });

    it('should have 0.1s delayChildren', () => {
      const visible = staggerContainerFast.visible as {
        transition: { staggerChildren: number; delayChildren: number };
      };
      expect(visible.transition.delayChildren).toBe(0.1);
    });

    it('should be faster than regular staggerContainer', () => {
      const fastVisible = staggerContainerFast.visible as {
        transition: { staggerChildren: number };
      };
      const regularVisible = staggerContainer.visible as {
        transition: { staggerChildren: number };
      };
      expect(fastVisible.transition.staggerChildren).toBeLessThan(
        regularVisible.transition.staggerChildren
      );
    });
  });

  describe('cardVariant', () => {
    it('should have correct hidden state with opacity, y, and scale', () => {
      expect(cardVariant.hidden).toEqual({
        opacity: 0,
        y: 20,
        scale: 0.95,
      });
    });

    it('should animate to full opacity, y: 0, scale: 1', () => {
      expect(cardVariant.visible).toMatchObject({
        opacity: 1,
        y: 0,
        scale: 1,
      });
    });

    it('should have 0.4s duration', () => {
      const visible = cardVariant.visible as {
        transition: { duration: number };
      };
      expect(visible.transition.duration).toBe(0.4);
    });
  });

  describe('imageReveal', () => {
    it('should have hidden state with scale > 1', () => {
      expect(imageReveal.hidden).toEqual({
        opacity: 0,
        scale: 1.1,
      });
    });

    it('should animate to scale: 1', () => {
      expect(imageReveal.visible).toMatchObject({
        opacity: 1,
        scale: 1,
      });
    });

    it('should have 0.7s duration', () => {
      const visible = imageReveal.visible as {
        transition: { duration: number };
      };
      expect(visible.transition.duration).toBe(0.7);
    });
  });

  describe('buttonHover', () => {
    it('should scale up slightly', () => {
      expect(buttonHover.scale).toBe(1.02);
    });

    it('should have quick transition', () => {
      expect(buttonHover.transition.duration).toBe(0.2);
    });

    it('should be a plain object (not Variants)', () => {
      expect(buttonHover).not.toHaveProperty('hidden');
      expect(buttonHover).not.toHaveProperty('visible');
    });
  });

  describe('buttonTap', () => {
    it('should scale down slightly', () => {
      expect(buttonTap.scale).toBe(0.98);
    });

    it('should be a plain object (not Variants)', () => {
      expect(buttonTap).not.toHaveProperty('hidden');
      expect(buttonTap).not.toHaveProperty('visible');
    });
  });

  describe('cardHover', () => {
    it('should move up (negative y)', () => {
      expect(cardHover.y).toBe(-4);
    });

    it('should have quick transition', () => {
      expect(cardHover.transition.duration).toBe(0.2);
    });
  });

  describe('sectionVariant', () => {
    it('should have correct hidden state', () => {
      expect(sectionVariant.hidden).toEqual({
        opacity: 0,
        y: 40,
      });
    });

    it('should animate to visible state', () => {
      expect(sectionVariant.visible).toMatchObject({
        opacity: 1,
        y: 0,
      });
    });

    it('should have 0.6s duration', () => {
      const visible = sectionVariant.visible as {
        transition: { duration: number };
      };
      expect(visible.transition.duration).toBe(0.6);
    });
  });

  describe('viewportSettings', () => {
    it('should have once: true for single animation', () => {
      expect(viewportSettings.once).toBe(true);
    });

    it('should have margin for early trigger', () => {
      expect(viewportSettings.margin).toBe('-100px');
    });

    it('should have amount for visibility threshold', () => {
      expect(viewportSettings.amount).toBe(0.2);
    });

    it('should have all expected keys', () => {
      expect(Object.keys(viewportSettings)).toEqual(
        expect.arrayContaining(['once', 'margin', 'amount'])
      );
    });
  });

  describe('getReducedMotionVariants', () => {
    it('should return simplified variant with minimal animation', () => {
      const result = getReducedMotionVariants(fadeInUp);
      expect(result.hidden).toEqual({ opacity: 0 });
    });

    it('should return quick transition for visible state', () => {
      const result = getReducedMotionVariants(fadeInUp);
      expect(result.visible).toEqual({
        opacity: 1,
        transition: { duration: 0.01 },
      });
    });

    it('should remove transform properties for accessibility', () => {
      const result = getReducedMotionVariants(fadeInUp);
      const visible = result.visible as Record<string, unknown>;
      expect(visible).not.toHaveProperty('y');
      expect(visible).not.toHaveProperty('x');
      expect(visible).not.toHaveProperty('scale');
    });

    it('should work with any variant type', () => {
      const result1 = getReducedMotionVariants(scaleIn);
      const result2 = getReducedMotionVariants(cardVariant);

      expect(result1.hidden).toEqual({ opacity: 0 });
      expect(result2.hidden).toEqual({ opacity: 0 });
    });
  });

  describe('animation durations', () => {
    it('should have durations between 0.01 and 0.8 seconds', () => {
      const variantsWithDuration = [
        fadeInUp,
        fadeInLeft,
        fadeInRight,
        fadeIn,
        scaleIn,
        cardVariant,
        imageReveal,
        sectionVariant,
      ];

      variantsWithDuration.forEach((variant) => {
        const visible = variant.visible as {
          transition?: { duration?: number };
        };
        if (visible.transition?.duration) {
          expect(visible.transition.duration).toBeGreaterThanOrEqual(0.01);
          expect(visible.transition.duration).toBeLessThanOrEqual(0.8);
        }
      });
    });
  });

  describe('easing consistency', () => {
    it('should use consistent easeOutQuad easing where applicable', () => {
      const easeOutQuad = [0.25, 0.46, 0.45, 0.94];

      const variantsWithEasing = [
        fadeInUp,
        fadeInLeft,
        fadeInRight,
        scaleIn,
        cardVariant,
        imageReveal,
        sectionVariant,
      ];

      variantsWithEasing.forEach((variant) => {
        const visible = variant.visible as {
          transition?: { ease?: number[] };
        };
        if (visible.transition?.ease) {
          expect(visible.transition.ease).toEqual(easeOutQuad);
        }
      });
    });
  });
});
