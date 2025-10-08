# Task: Modernize Vetify Landing Page with Design System

## Context
We have a Vetify CRM landing page that needs to be modernized using our centralized design system. The design system uses CSS variables for theming, standardized component classes, and follows modern Next.js/TypeScript patterns.

## Design System Reference
- All colors use CSS variables (e.g., `bg-card`, `text-foreground`, `border-border`)
- Primary brand color: `--primary` (Vetify teal #75a99c)
- Standardized button classes: `btn-primary`, `btn-secondary`, `btn-ghost`
- Component classes available: `card`, `form-input`, `form-label`, etc.
- Full design system documented in `src/app/globals.css` and design system doc

## Requirements

### 1. Color System Migration
- Replace ALL hardcoded colors with CSS variables:
  - `bg-white dark:bg-gray-800` → `bg-card`
  - `text-gray-900 dark:text-gray-100` → `text-foreground`
  - `text-gray-600 dark:text-gray-400` → `text-muted-foreground`
  - `border-gray-200 dark:border-gray-700` → `border-border`
  - Any `#75a99c` → `bg-primary` or `text-primary`
  - `bg-gray-50 dark:bg-gray-900` → `bg-background`

### 2. Component Standardization
- Update all buttons to use design system classes:
  - Primary CTAs → `btn-primary`
  - Secondary actions → `btn-secondary`
  - Text/ghost buttons → `btn-ghost`
- Update form inputs → `form-input` class
- Update cards → `card` class with `card-hover` where applicable

### 3. Sections to Update
Review and modernize these landing page sections:
- Hero section (main heading, CTA buttons)
- Features grid (3 main features with icons)
- Benefits section (statistics cards)
- Pricing cards (Starter, Standard, Professional)
- Testimonials section
- CTA section at bottom
- Navigation bar

### 4. Modern Patterns
- Use proper TypeScript types for all components
- Implement server components where possible (Next.js 14 App Router)
- Add proper semantic HTML (`<section>`, `<article>`, etc.)
- Ensure responsive design with Tailwind breakpoints
- Add smooth transitions: `transition-colors duration-200`

### 5. Accessibility
- Ensure all interactive elements have focus states (already in design system)
- Add proper aria-labels to icon-only buttons
- Verify color contrast ratios
- Use semantic HTML elements

### 6. Performance
- Lazy load images below the fold
- Use Next.js Image component for all images
- Optimize for Core Web Vitals

## File Structure Expected
```
src/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx          # Main landing page
│   └── globals.css           # Design system CSS variables
├── components/
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Pricing.tsx
│   │   └── Testimonials.tsx
│   └── ui/
│       ├── Button.tsx        # If exists, otherwise use class names
│       └── Card.tsx
```

## Testing Checklist
After modernization, verify:
- [ ] All hardcoded colors removed
- [ ] Light mode looks correct
- [ ] Dark mode looks correct (toggle in browser)
- [ ] Hover states work on all interactive elements
- [ ] Focus states visible when tabbing
- [ ] Responsive on mobile, tablet, desktop
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Page loads quickly (check Network tab)

## Example Before/After

### Before:
```tsx
<button className="bg-[#75a99c] hover:bg-[#669186] text-white px-6 py-3 rounded-lg">
  Crear mi clínica gratis
</button>
```

### After:
```tsx
<button className="btn-primary">
  Crear mi clínica gratis
</button>
```

### Before:
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
  <h3 className="text-gray-900 dark:text-gray-100 text-xl font-semibold">
    Feature Title
  </h3>
</div>
```

### After:
```tsx
<div className="card card-hover">
  <h3 className="text-foreground text-xl font-semibold">
    Feature Title
  </h3>
</div>
```

## Commands to Run
1. First, review the current landing page: `src/app/(marketing)/page.tsx`
2. Review the design system: `src/app/globals.css`
3. Create/update component files as needed
4. Test in browser with light/dark mode toggle
5. Run TypeScript check: `npm run type-check` (if available)

## Notes
- Preserve all existing functionality and content
- Keep the same layout structure (don't redesign, just modernize)
- Maintain Spanish language content
- Ensure all links and CTAs still work
- The Vetify teal color (#75a99c) is the brand color - it's already in the design system as `--primary`

## Questions to Consider
- Are there any third-party components that need updating?
- Should we extract repeated sections into reusable components?
- Are there any animations that should be added for polish?
- Should we implement any micro-interactions on hover/click?

Please analyze the current landing page implementation and provide a modernization plan, then implement the changes following the design system patterns.


This prompt will guide Claude Code to:
1. **Audit** the current landing page for design system violations
2. **Migrate** all colors to use CSS variables
3. **Standardize** components with the design system classes
4. **Improve** TypeScript typing and Next.js patterns
5. **Test** across light/dark modes and responsive breakpoints

Would you like me to adjust the prompt to focus on specific sections or add any additional requirements?