import { render, screen } from '@testing-library/react';
import {
  HeroSkeleton,
  ServicesSkeleton,
  InfoSkeleton,
  GallerySkeleton,
  ClinicPageSkeleton,
  GalleryPageSkeleton,
} from '@/components/public/skeletons';

describe('Skeleton Components', () => {
  describe('HeroSkeleton', () => {
    it('should render without errors', () => {
      const { container } = render(<HeroSkeleton />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render 5 star placeholders', () => {
      const { container } = render(<HeroSkeleton />);
      const starContainer = container.querySelector('.flex.gap-1');
      const stars = starContainer?.querySelectorAll('.w-5.h-5');
      expect(stars).toHaveLength(5);
    });

    it('should render contact cards', () => {
      const { container } = render(<HeroSkeleton />);
      const contactCards = container.querySelectorAll(
        '.p-4.bg-white.dark\\:bg-gray-800'
      );
      expect(contactCards.length).toBeGreaterThanOrEqual(3);
    });

    it('should render action buttons', () => {
      const { container } = render(<HeroSkeleton />);
      const buttons = container.querySelectorAll('.h-12');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should render image placeholder', () => {
      const { container } = render(<HeroSkeleton />);
      const imagePlaceholder = container.querySelector('.h-96');
      expect(imagePlaceholder).toBeInTheDocument();
    });

    it('should have animate-pulse class for loading animation', () => {
      const { container } = render(<HeroSkeleton />);
      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('should have dark mode classes', () => {
      const { container } = render(<HeroSkeleton />);
      const darkModeElements = container.querySelectorAll('[class*="dark:"]');
      expect(darkModeElements.length).toBeGreaterThan(0);
    });
  });

  describe('GallerySkeleton', () => {
    it('should render without errors', () => {
      const { container } = render(<GallerySkeleton />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render 8 gallery item placeholders', () => {
      const { container } = render(<GallerySkeleton />);
      const galleryItems = container.querySelectorAll('.aspect-\\[4\\/3\\]');
      expect(galleryItems).toHaveLength(8);
    });

    it('should render category filter pills', () => {
      const { container } = render(<GallerySkeleton />);
      const filterPills = container.querySelectorAll('.rounded-full.h-10');
      expect(filterPills.length).toBeGreaterThanOrEqual(4);
    });

    it('should have responsive grid classes', () => {
      const { container } = render(<GallerySkeleton />);
      const grid = container.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should have animate-pulse class for loading animation', () => {
      const { container } = render(<GallerySkeleton />);
      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('should have dark mode classes', () => {
      const { container } = render(<GallerySkeleton />);
      expect(container.innerHTML).toContain('dark:bg-gray-');
    });
  });

  describe('ServicesSkeleton', () => {
    it('should render without errors', () => {
      const { container } = render(<ServicesSkeleton />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render 6 service card placeholders', () => {
      const { container } = render(<ServicesSkeleton />);
      // Service cards have icon (w-14 h-14 rounded-full)
      const serviceCards = container.querySelectorAll(
        '.w-14.h-14.rounded-full'
      );
      expect(serviceCards).toHaveLength(6);
    });

    it('should have responsive grid classes', () => {
      const { container } = render(<ServicesSkeleton />);
      const grid = container.querySelector('.grid-cols-1');
      expect(grid).toBeInTheDocument();
      expect(container.innerHTML).toContain('md:grid-cols-2');
      expect(container.innerHTML).toContain('lg:grid-cols-3');
    });

    it('should render CTA button skeleton', () => {
      const { container } = render(<ServicesSkeleton />);
      const ctaSection = container.querySelector('.text-center.mt-12');
      expect(ctaSection).toBeInTheDocument();
    });

    it('should have animate-pulse class for loading animation', () => {
      const { container } = render(<ServicesSkeleton />);
      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('should have gray background', () => {
      const { container } = render(<ServicesSkeleton />);
      const section = container.querySelector('section');
      expect(section?.className).toContain('bg-gray-50');
    });
  });

  describe('InfoSkeleton', () => {
    it('should render without errors', () => {
      const { container } = render(<InfoSkeleton />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('should render 3 contact card placeholders', () => {
      const { container } = render(<InfoSkeleton />);
      // Contact cards have icon (w-12 h-12 rounded-full)
      const contactCards = container.querySelectorAll(
        '.w-12.h-12.rounded-full'
      );
      expect(contactCards).toHaveLength(3);
    });

    it('should render 3 hours row placeholders', () => {
      const { container } = render(<InfoSkeleton />);
      // Hours rows have flex justify-between items-center
      const hoursRows = container.querySelectorAll(
        '.flex.justify-between.items-center'
      );
      expect(hoursRows).toHaveLength(3);
    });

    it('should render CTA card with 5 stars', () => {
      const { container } = render(<InfoSkeleton />);
      // CTA card has stars in the star container (flex gap-1)
      const starContainer = container.querySelector(
        '.flex.justify-center .flex.gap-1'
      );
      const ctaStars = starContainer?.querySelectorAll('.w-6.h-6');
      expect(ctaStars).toHaveLength(5);
    });

    it('should render 2 testimonial card placeholders', () => {
      const { container } = render(<InfoSkeleton />);
      // Testimonial cards have 5 small stars (w-4 h-4)
      const testimonialStarGroups = container.querySelectorAll('.w-4.h-4');
      // Each testimonial has 5 stars, so 10 total
      expect(testimonialStarGroups).toHaveLength(10);
    });

    it('should render emergency card', () => {
      const { container } = render(<InfoSkeleton />);
      const emergencyCard = container.querySelector('.border-2');
      expect(emergencyCard).toBeInTheDocument();
    });

    it('should have two-column layout on large screens', () => {
      const { container } = render(<InfoSkeleton />);
      const grid = container.querySelector('.lg\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should have animate-pulse class for loading animation', () => {
      const { container } = render(<InfoSkeleton />);
      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });

  describe('ClinicPageSkeleton', () => {
    it('should render without errors', () => {
      const { container } = render(<ClinicPageSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render all 4 section skeletons', () => {
      const { container } = render(<ClinicPageSkeleton />);
      const sections = container.querySelectorAll('section');
      expect(sections).toHaveLength(4);
    });

    it('should have min-h-screen container', () => {
      const { container } = render(<ClinicPageSkeleton />);
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render HeroSkeleton first', () => {
      const { container } = render(<ClinicPageSkeleton />);
      const firstSection = container.querySelector('section');
      // Hero has gradient background
      expect(firstSection?.className).toContain('bg-gradient-to-br');
    });

    it('should render sections in correct order', () => {
      const { container } = render(<ClinicPageSkeleton />);
      const sections = container.querySelectorAll('section');

      // Hero - has gradient
      expect(sections[0]?.className).toContain('bg-gradient-to-br');

      // Services - has gray background
      expect(sections[1]?.className).toContain('bg-gray-50');

      // Gallery - white background
      expect(sections[2]?.className).toContain('bg-white');

      // Info - white background
      expect(sections[3]?.className).toContain('bg-white');
    });
  });

  describe('GalleryPageSkeleton', () => {
    it('should render without errors', () => {
      const { container } = render(<GalleryPageSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render gallery skeleton', () => {
      const { container } = render(<GalleryPageSkeleton />);
      const sections = container.querySelectorAll('section');
      expect(sections).toHaveLength(1);
    });

    it('should have min-h-screen container', () => {
      const { container } = render(<GalleryPageSkeleton />);
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should have dark mode aware background', () => {
      const { container } = render(<GalleryPageSkeleton />);
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer?.className).toContain('bg-white');
      expect(mainContainer?.className).toContain('dark:bg-gray-900');
    });
  });

  describe('Accessibility', () => {
    it('should use semantic section elements', () => {
      const { container: heroContainer } = render(<HeroSkeleton />);
      const { container: galleryContainer } = render(<GallerySkeleton />);
      const { container: servicesContainer } = render(<ServicesSkeleton />);
      const { container: infoContainer } = render(<InfoSkeleton />);

      expect(heroContainer.querySelector('section')).toBeInTheDocument();
      expect(galleryContainer.querySelector('section')).toBeInTheDocument();
      expect(servicesContainer.querySelector('section')).toBeInTheDocument();
      expect(infoContainer.querySelector('section')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode background classes on HeroSkeleton', () => {
      const { container } = render(<HeroSkeleton />);
      expect(container.innerHTML).toContain('dark:from-gray-800');
      expect(container.innerHTML).toContain('dark:to-gray-900');
    });

    it('should have dark mode border classes on skeletons', () => {
      const { container } = render(<GallerySkeleton />);
      expect(container.innerHTML).toContain('dark:border-gray-700');
    });

    it('should have dark mode element backgrounds', () => {
      const { container } = render(<ServicesSkeleton />);
      expect(container.innerHTML).toContain('dark:bg-gray-800');
      expect(container.innerHTML).toContain('dark:bg-gray-700');
      expect(container.innerHTML).toContain('dark:bg-gray-600');
    });
  });
});
